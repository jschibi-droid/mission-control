import { type ChildProcess } from 'node:child_process'
import { runOpenClaw } from './command'

/* ── Worker process management ────────────────────────────────────── */

interface WorkerMessage {
  type?: string
  id?: string
  ok?: boolean
  result?: unknown
  error?: string
}

let worker: ChildProcess | null = null
let workerReady = false
let workerReadyPromise: Promise<void> | null = null
const pendingRequests = new Map<string, {
  resolve: (value: unknown) => void
  reject: (reason: Error) => void
  timer: ReturnType<typeof setTimeout>
}>()
let requestCounter = 0

const isBuildPhase = process.env.NEXT_PHASE === 'phase-production-build'

/**
 * Resolve the gateway worker script path at runtime.
 * Uses CWD + scripts/gateway-rpc-worker.mjs as primary location.
 * This is computed entirely at runtime to prevent Turbopack from
 * trying to resolve and bundle external module paths.
 */
function getWorkerPath(): string {
  // Allow explicit override
  if (process.env.GATEWAY_RPC_WORKER_PATH) {
    return process.env.GATEWAY_RPC_WORKER_PATH
  }
  // Standard location: CWD/scripts/gateway-rpc-worker.mjs
  // In Docker CWD is /app, in dev it's the project root.
  // path.join is avoided to prevent Turbopack from tracing the path.
  return process.cwd() + '/scripts/gateway-rpc-worker.mjs'
}

function spawnWorker(): Promise<void> {
  if (workerReady && worker && !worker.killed) return Promise.resolve()
  if (workerReadyPromise) return workerReadyPromise

  workerReadyPromise = new Promise<void>((resolve, reject) => {
    const workerPath = getWorkerPath()

    // Use dynamic require to prevent Turbopack from bundling child_process
    // eslint-disable-next-line no-eval, @typescript-eslint/no-require-imports
    const cp = eval("require('child_process')") as typeof import('node:child_process')

    worker = cp.fork(workerPath, [], {
      stdio: ['pipe', 'pipe', 'pipe', 'ipc'],
      // The openclaw module is ~68MB on disk and needs ~500MB heap to load.
      // Override NODE_OPTIONS to give the worker enough memory.
      execArgv: ['--max-old-space-size=768'],
      env: {
        ...process.env,
        NODE_NO_WARNINGS: '1',
        // Clear any inherited NODE_OPTIONS to prevent conflicts
        NODE_OPTIONS: '',
      },
    })

    const startTimer = setTimeout(() => {
      reject(new Error('Gateway worker failed to start within 10s'))
      worker?.kill()
      worker = null
      workerReadyPromise = null
    }, 10_000)

    worker.on('message', (msg: WorkerMessage) => {
      if (msg.type === 'ready') {
        workerReady = true
        clearTimeout(startTimer)
        resolve()
        return
      }

      if (msg.id && pendingRequests.has(msg.id)) {
        const req = pendingRequests.get(msg.id)!
        pendingRequests.delete(msg.id)
        clearTimeout(req.timer)
        if (msg.ok) {
          req.resolve(msg.result)
        } else {
          req.reject(new Error(msg.error || 'Gateway RPC failed'))
        }
      }
    })

    worker.on('exit', (code) => {
      workerReady = false
      workerReadyPromise = null
      worker = null
      for (const [id, req] of pendingRequests) {
        clearTimeout(req.timer)
        req.reject(new Error(`Gateway worker exited with code ${code}`))
        pendingRequests.delete(id)
      }
    })

    worker.on('error', (err) => {
      clearTimeout(startTimer)
      reject(err)
      workerReady = false
      workerReadyPromise = null
      worker = null
    })

    worker.stderr?.on('data', (data: Buffer) => {
      const msg = data.toString().trim()
      if (msg && !msg.includes('missing env var')) {
        console.warn('[gateway-rpc-worker]', msg)
      }
    })
  })

  return workerReadyPromise
}

async function callViaWorker<T>(method: string, params: unknown, timeoutMs: number): Promise<T> {
  await spawnWorker()

  const id = `rpc-${++requestCounter}-${Date.now()}`

  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      pendingRequests.delete(id)
      reject(new Error(`Gateway RPC timeout: ${method} (${timeoutMs}ms)`))
    }, timeoutMs + 2000)

    pendingRequests.set(id, {
      resolve: resolve as (value: unknown) => void,
      reject,
      timer,
    })

    worker!.send({ id, method, params, timeoutMs })
  })
}

/* ── JSON parsing (used by CLI fallback) ──────────────────────────── */

export function parseGatewayJsonOutput(raw: string): unknown | null {
  const trimmed = String(raw || '').trim()
  if (!trimmed) return null

  const objectStart = trimmed.indexOf('{')
  const arrayStart = trimmed.indexOf('[')
  const hasObject = objectStart >= 0
  const hasArray = arrayStart >= 0

  let start = -1
  let end = -1

  if (hasObject && hasArray) {
    if (objectStart < arrayStart) {
      start = objectStart
      end = trimmed.lastIndexOf('}')
    } else {
      start = arrayStart
      end = trimmed.lastIndexOf(']')
    }
  } else if (hasObject) {
    start = objectStart
    end = trimmed.lastIndexOf('}')
  } else if (hasArray) {
    start = arrayStart
    end = trimmed.lastIndexOf(']')
  }

  if (start < 0 || end < start) return null

  try {
    return JSON.parse(trimmed.slice(start, end + 1))
  } catch {
    return null
  }
}

/* ── CLI fallback ─────────────────────────────────────────────────── */

async function callViaCliFallback<T>(
  method: string,
  params: unknown,
  timeoutMs: number,
): Promise<T> {
  const result = await runOpenClaw(
    [
      'gateway',
      'call',
      method,
      '--timeout',
      String(Math.max(1000, Math.floor(timeoutMs))),
      '--params',
      JSON.stringify(params ?? {}),
      '--json',
    ],
    { timeoutMs: timeoutMs + 2000 },
  )

  const payload = parseGatewayJsonOutput(result.stdout)
  if (payload == null) {
    throw new Error(`Invalid JSON response from gateway method ${method}`)
  }

  return payload as T
}

/* ── Public API ───────────────────────────────────────────────────── */

/**
 * Call a gateway RPC method.
 *
 * Uses a forked worker process that directly imports the openclaw module
 * for authentication and RPC — no CLI binary needed, minimal memory
 * overhead. Falls back to spawning the CLI binary if the worker fails.
 */
export async function callOpenClawGateway<T = unknown>(
  method: string,
  params: unknown,
  timeoutMs = 10000,
): Promise<T> {
  if (isBuildPhase) {
    throw new Error('Gateway RPC not available during build')
  }

  try {
    return await callViaWorker<T>(method, params, timeoutMs)
  } catch (workerErr) {
    console.warn(
      `[openclaw-gateway] Worker RPC failed for ${method}, falling back to CLI:`,
      (workerErr as Error).message,
    )
  }

  return callViaCliFallback<T>(method, params, timeoutMs)
}
