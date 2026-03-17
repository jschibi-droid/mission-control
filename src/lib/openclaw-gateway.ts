import { runOpenClaw } from './command'

const isBuildPhase = process.env.NEXT_PHASE === 'phase-production-build'

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
 * Uses a lightweight direct WebSocket connection (~2MB) instead of
 * forking a worker process (~500MB). Falls back to the CLI binary
 * if the WebSocket client fails to connect.
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
    // Dynamic import to prevent Turbopack from bundling the WS module
    // eslint-disable-next-line no-eval
    const { callGatewayWsRpc } = eval("require('./gateway-ws-rpc')") as typeof import('./gateway-ws-rpc')
    return await callGatewayWsRpc<T>(method, params, timeoutMs)
  } catch (wsErr) {
    console.warn(
      `[openclaw-gateway] WebSocket RPC failed for ${method}, falling back to CLI:`,
      (wsErr as Error).message,
    )
  }

  return callViaCliFallback<T>(method, params, timeoutMs)
}
