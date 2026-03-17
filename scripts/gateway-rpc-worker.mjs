#!/usr/bin/env node
/**
 * Gateway RPC Worker — runs outside the Next.js bundle.
 *
 * Dynamically imports the openclaw module's callGateway() function
 * and processes RPC requests received via Node.js IPC (process.send).
 *
 * Protocol:
 *   Parent → Worker:  { id, method, params, timeoutMs }
 *   Worker → Parent:  { id, ok: true, result }  or  { id, ok: false, error }
 *
 * The worker stays alive and handles multiple requests sequentially.
 * It auto-exits after 5 minutes of inactivity.
 */

import fs from 'node:fs'
import path from 'node:path'

const IDLE_TIMEOUT_MS = 5 * 60 * 1000 // 5 minutes
let idleTimer = null

function resetIdleTimer() {
  if (idleTimer) clearTimeout(idleTimer)
  idleTimer = setTimeout(() => {
    process.exit(0)
  }, IDLE_TIMEOUT_MS)
}

// ── Locate the openclaw module ──────────────────────────────────────

function findModuleDistDir() {
  // Explicit override via env var
  if (process.env.OPENCLAW_MODULE_DIR) {
    const d = path.join(process.env.OPENCLAW_MODULE_DIR, 'dist')
    if (fs.existsSync(d)) return d
  }

  // Common install locations
  const candidates = [
    '/usr/local/lib/node_modules/openclaw/dist',
    '/opt/homebrew/lib/node_modules/openclaw/dist',
  ]

  // Also try resolving from OPENCLAW_BIN
  const bin = process.env.OPENCLAW_BIN || 'openclaw'
  try {
    const resolved = fs.realpathSync(bin)
    if (resolved.includes('node_modules/openclaw')) {
      const root = resolved.slice(0, resolved.indexOf('node_modules/openclaw') + 'node_modules/openclaw'.length)
      candidates.unshift(path.join(root, 'dist'))
    }
  } catch { /* not found */ }

  for (const c of candidates) {
    try { if (fs.existsSync(c)) return c } catch { /* skip */ }
  }
  return null
}

async function loadCallGateway() {
  const distDir = findModuleDistDir()
  if (!distDir) throw new Error('Cannot locate openclaw module dist directory')

  const files = fs.readdirSync(distDir)
  const authFile = files.find(f => f.startsWith('auth-profiles-') && f.endsWith('.js'))
  if (!authFile) throw new Error('auth-profiles module not found in ' + distDir)

  const mod = await import(path.join(distDir, authFile))

  // Find exports by runtime shape (minified names vary between versions)
  let callGateway = null
  let clientNames = null
  let clientModes = null

  for (const [, value] of Object.entries(mod)) {
    if (typeof value === 'object' && value !== null) {
      const obj = /** @type {Record<string,string>} */ (value)
      if (obj.CLI === 'cli' && obj.CONTROL_UI === 'openclaw-control-ui') clientNames = obj
      if (obj.CLI === 'cli' && obj.UI === 'ui' && obj.BACKEND === 'backend') clientModes = obj
    }
    if (typeof value === 'function' && !callGateway) {
      const src = value.toString()
      if (src.includes('callGatewayWithScopes') && src.includes('callGatewayCli')) {
        callGateway = value
      }
    }
  }

  if (!callGateway || !clientNames || !clientModes) {
    throw new Error('Failed to locate callGateway in auth-profiles module')
  }

  return { callGateway, clientNames, clientModes }
}

// ── Main ───────────────────────────────────────────────────────────

let gateway = null

async function handleRequest(msg) {
  const { id, method, params, timeoutMs } = msg
  try {
    if (!gateway) {
      gateway = await loadCallGateway()
    }

    const result = await gateway.callGateway({
      url: process.env.OPENCLAW_GATEWAY_URL || undefined,
      token: process.env.OPENCLAW_GATEWAY_TOKEN || undefined,
      method,
      params: params ?? {},
      clientName: gateway.clientNames.CLI,
      mode: gateway.clientModes.CLI,
      timeoutMs: Math.max(1000, Math.floor(timeoutMs || 10000)),
    })

    process.send({ id, ok: true, result })
  } catch (err) {
    process.send({ id, ok: false, error: err.message || String(err) })
  }
}

process.on('message', (msg) => {
  resetIdleTimer()
  if (msg && msg.method) {
    handleRequest(msg).catch(err => {
      process.send({ id: msg.id, ok: false, error: 'Worker error: ' + err.message })
    })
  }
})

// Signal to parent that the worker is ready
process.send({ type: 'ready' })
resetIdleTimer()
