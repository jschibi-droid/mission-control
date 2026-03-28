import { getDatabase, logAuditEvent } from './db'
import { syncAgentsFromConfig } from './agent-sync'
import { config, ensureDirExists } from './config'
import { join, dirname } from 'path'
import { readdirSync, statSync, unlinkSync } from 'fs'
import { logger } from './logger'
import { processWebhookRetries } from './webhooks'
import { syncClaudeSessions } from './claude-sessions'
import { pruneGatewaySessionsOlderThan, getAgentLiveStatuses, getAllGatewaySessions } from './sessions'
import { eventBus } from './event-bus'
import { syncSkillsFromDisk } from './skill-sync'
import { syncLocalAgents } from './local-agent-sync'
import { dispatchAssignedTasks, runAegisReviews } from './task-dispatch'
import { spawnRecurringTasks } from './recurring-tasks'
import { getAgentWorkspaceCandidates, readAgentWorkspaceFile } from './agent-workspace'

const BACKUP_DIR = join(dirname(config.dbPath), 'backups')

interface ScheduledTask {
  name: string
  intervalMs: number
  lastRun: number | null
  nextRun: number
  enabled: boolean
  running: boolean
  lastResult?: { ok: boolean; message: string; timestamp: number }
}

const tasks: Map<string, ScheduledTask> = new Map()
let tickInterval: ReturnType<typeof setInterval> | null = null

/** Check if a setting is enabled (reads from settings table, falls back to default) */
function isSettingEnabled(key: string, defaultValue: boolean): boolean {
  try {
    const db = getDatabase()
    const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key) as { value: string } | undefined
    if (row) return row.value === 'true'
    return defaultValue
  } catch {
    return defaultValue
  }
}

function getSettingNumber(key: string, defaultValue: number): number {
  try {
    const db = getDatabase()
    const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key) as { value: string } | undefined
    if (row) return parseInt(row.value) || defaultValue
    return defaultValue
  } catch {
    return defaultValue
  }
}

/** Run a database backup */
async function runBackup(): Promise<{ ok: boolean; message: string }> {
  ensureDirExists(BACKUP_DIR)

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').replace('T', '_').slice(0, 19)
  const backupPath = join(BACKUP_DIR, `mc-backup-${timestamp}.db`)

  try {
    const db = getDatabase()
    await db.backup(backupPath)

    const stat = statSync(backupPath)
    logAuditEvent({
      action: 'auto_backup',
      actor: 'scheduler',
      detail: { path: backupPath, size: stat.size },
    })

    // Prune old backups
    const maxBackups = getSettingNumber('general.backup_retention_count', 10)
    try {
      const files = readdirSync(BACKUP_DIR)
        .filter(f => f.startsWith('mc-backup-') && f.endsWith('.db'))
        .map(f => ({ name: f, mtime: statSync(join(BACKUP_DIR, f)).mtimeMs }))
        .sort((a, b) => b.mtime - a.mtime)

      for (const file of files.slice(maxBackups)) {
        unlinkSync(join(BACKUP_DIR, file.name))
      }
    } catch {
      // Best-effort pruning
    }

    const sizeKB = Math.round(stat.size / 1024)
    return { ok: true, message: `Backup created (${sizeKB}KB)` }
  } catch (err: any) {
    return { ok: false, message: `Backup failed: ${err.message}` }
  }
}

/** Run data cleanup based on retention settings */
async function runCleanup(): Promise<{ ok: boolean; message: string }> {
  try {
    const db = getDatabase()
    const now = Math.floor(Date.now() / 1000)
    const ret = config.retention
    let totalDeleted = 0

    const targets = [
      { table: 'activities', column: 'created_at', days: ret.activities },
      { table: 'audit_log', column: 'created_at', days: ret.auditLog },
      { table: 'notifications', column: 'created_at', days: ret.notifications },
      { table: 'pipeline_runs', column: 'created_at', days: ret.pipelineRuns },
    ]

    for (const { table, column, days } of targets) {
      if (days <= 0) continue
      const cutoff = now - days * 86400
      try {
        const res = db.prepare(`DELETE FROM ${table} WHERE ${column} < ?`).run(cutoff)
        totalDeleted += res.changes
      } catch {
        // Table might not exist
      }
    }

    // Clean token usage file
    if (ret.tokenUsage > 0) {
      try {
        const { readFile, writeFile } = require('fs/promises')
        const raw = await readFile(config.tokensPath, 'utf-8')
        const data = JSON.parse(raw)
        const cutoffMs = Date.now() - ret.tokenUsage * 86400000
        const kept = data.filter((r: any) => r.timestamp >= cutoffMs)
        const removed = data.length - kept.length

        if (removed > 0) {
          await writeFile(config.tokensPath, JSON.stringify(kept, null, 2))
          totalDeleted += removed
        }
      } catch {
        // No token file
      }
    }

    if (ret.gatewaySessions > 0) {
      const sessionCleanup = pruneGatewaySessionsOlderThan(ret.gatewaySessions)
      totalDeleted += sessionCleanup.deleted
    }

    if (totalDeleted > 0) {
      logAuditEvent({
        action: 'auto_cleanup',
        actor: 'scheduler',
        detail: { total_deleted: totalDeleted },
      })
    }

    return { ok: true, message: `Cleaned ${totalDeleted} stale record${totalDeleted === 1 ? '' : 's'}` }
  } catch (err: any) {
    return { ok: false, message: `Cleanup failed: ${err.message}` }
  }
}

/** Check agent liveness - mark agents offline if not seen recently */
async function runHeartbeatCheck(): Promise<{ ok: boolean; message: string }> {
  try {
    const db = getDatabase()
    const now = Math.floor(Date.now() / 1000)
    const timeoutMinutes = getSettingNumber('general.agent_timeout_minutes', 10)
    const threshold = now - timeoutMinutes * 60

    // Find agents that are not offline but haven't been seen recently
    const staleAgents = db.prepare(`
      SELECT id, name, status, last_seen FROM agents
      WHERE status != 'offline' AND (last_seen IS NULL OR last_seen < ?)
    `).all(threshold) as Array<{ id: number; name: string; status: string; last_seen: number | null }>

    if (staleAgents.length === 0) {
      return { ok: true, message: 'All agents healthy' }
    }

    // Mark stale agents as offline
    const markOffline = db.prepare('UPDATE agents SET status = ?, updated_at = ? WHERE id = ?')
    const logActivity = db.prepare(`
      INSERT INTO activities (type, entity_type, entity_id, actor, description)
      VALUES ('agent_status_change', 'agent', ?, 'heartbeat', ?)
    `)

    const names: string[] = []
    db.transaction(() => {
      for (const agent of staleAgents) {
        markOffline.run('offline', now, agent.id)
        logActivity.run(agent.id, `Agent "${agent.name}" marked offline (no heartbeat for ${timeoutMinutes}m)`)
        names.push(agent.name)

        // Create notification for each stale agent
        try {
          db.prepare(`
            INSERT INTO notifications (recipient, type, title, message, source_type, source_id)
            VALUES ('system', 'heartbeat', ?, ?, 'agent', ?)
          `).run(
            `Agent offline: ${agent.name}`,
            `Agent "${agent.name}" was marked offline after ${timeoutMinutes} minutes without heartbeat`,
            agent.id
          )
        } catch { /* notification creation failed */ }
      }
    })()

    logAuditEvent({
      action: 'heartbeat_check',
      actor: 'scheduler',
      detail: { marked_offline: names },
    })

    return { ok: true, message: `Marked ${staleAgents.length} agent(s) offline: ${names.join(', ')}` }
  } catch (err: any) {
    return { ok: false, message: `Heartbeat check failed: ${err.message}` }
  }
}

/** Register newly connected OpenClaw agents by replaying the self-register API contract. */
async function registerConnectedGatewayAgents(): Promise<{ registered: number; updated: number; scanned: number }> {
  const sessions = getAllGatewaySessions(60 * 60 * 1000, true)
  if (sessions.length === 0) return { registered: 0, updated: 0, scanned: 0 }

  const baseUrl = resolveMissionControlBaseUrl()
  const apiKey = resolveSchedulerApiKey()
  if (!apiKey) throw new Error('Missing API key for gateway registration POSTs')

  const db = getDatabase()
  const knownAgents = db.prepare('SELECT name, config FROM agents').all() as Array<{ name: string; config: string | null }>

  let registered = 0
  let updated = 0

  for (const session of sessions) {
    const known = knownAgents.find((agent) => agent.name === session.agent)
    let identity: Record<string, unknown> | null = null
    let capabilities: string[] = []

    if (known?.config) {
      try {
        const parsed = JSON.parse(known.config)
        if (parsed?.identity && typeof parsed.identity === 'object' && !Array.isArray(parsed.identity)) {
          identity = parsed.identity
        }
        if (Array.isArray(parsed?.tools?.allow)) {
          capabilities = parsed.tools.allow.filter((tool: unknown): tool is string => typeof tool === 'string')
        } else if (Array.isArray(parsed?.capabilities)) {
          capabilities = parsed.capabilities.filter((tool: unknown): tool is string => typeof tool === 'string')
        }
      } catch {
        // ignore malformed stored config
      }
    }

    const response = await fetch(`${baseUrl}/api/agents/register`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
      },
      body: JSON.stringify({
        name: session.agent,
        role: 'agent',
        framework: 'openclaw',
        capabilities,
        session_key: session.key,
        identity,
        session: {
          key: session.key,
          sessionId: session.sessionId,
          channel: session.channel,
          chatType: session.chatType,
          model: session.model,
          updatedAt: session.updatedAt,
          active: session.active,
          totalTokens: session.totalTokens,
          inputTokens: session.inputTokens,
          outputTokens: session.outputTokens,
          contextTokens: session.contextTokens,
        },
        metadata: {
          source: 'openclaw-gateway-sync',
          registeredAt: Math.floor(Date.now() / 1000),
        },
      }),
    })

    if (!response.ok) {
      const text = await response.text().catch(() => '')
      throw new Error(`Gateway registration failed for ${session.agent}: ${response.status} ${text}`.trim())
    }

    const body = await response.json().catch(() => ({}))
    if (body?.registered) registered += 1
    else updated += 1
  }

  return { registered, updated, scanned: sessions.length }
}

/** Sync live agent statuses from gateway session files into the DB */
async function syncAgentLiveStatuses(): Promise<number> {
  const liveStatuses = getAgentLiveStatuses()
  if (liveStatuses.size === 0) return 0

  const db = getDatabase()
  const agents = db.prepare('SELECT id, name, config FROM agents').all() as Array<{
    id: number; name: string; config: string | null
  }>

  const update = db.prepare('UPDATE agents SET status = ?, last_seen = ?, last_activity = ?, updated_at = ? WHERE id = ?')
  let refreshed = 0

  const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9._-]+/g, '-')

  db.transaction(() => {
    for (const agent of agents) {
      // Match by agent name or openclawId from config
      let openclawId: string | null = null
      if (agent.config) {
        try {
          const cfg = JSON.parse(agent.config)
          if (typeof cfg.openclawId === 'string' && cfg.openclawId.trim()) {
            openclawId = cfg.openclawId.trim()
          }
        } catch { /* ignore */ }
      }

      const candidates = [openclawId, agent.name].filter(Boolean).map(s => normalize(s!))
      let matched: { status: 'active' | 'idle' | 'offline'; lastActivity: number; channel: string } | undefined

      for (const [sessionAgent, info] of liveStatuses) {
        if (candidates.includes(normalize(sessionAgent))) {
          matched = info
          break
        }
      }

      if (!matched || matched.status === 'offline') continue

      const now = Math.floor(Date.now() / 1000)
      const activity = `Gateway session (${matched.channel || 'unknown'})`
      update.run(matched.status, now, activity, now, agent.id)
      refreshed++

      eventBus.broadcast('agent.status_changed', {
        id: agent.id,
        name: agent.name,
        status: matched.status,
        last_seen: now,
        last_activity: activity,
      })
    }
  })()

  return refreshed
}

const DAILY_MS = 24 * 60 * 60 * 1000
const FIVE_MINUTES_MS = 5 * 60 * 1000
const TICK_MS = 60 * 1000 // Check every minute

function resolveMissionControlBaseUrl(): string {
  const candidates = [
    process.env.MC_PUBLIC_BASE_URL,
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.APP_URL,
    process.env.MISSION_CONTROL_PUBLIC_URL,
  ]
    .map((value) => String(value || '').trim())
    .filter(Boolean)

  for (const candidate of candidates) {
    try {
      return new URL(candidate).toString().replace(/\/$/, '')
    } catch {
      // Ignore invalid candidate and continue fallback chain.
    }
  }

  const port = process.env.PORT || '3000'
  return `http://127.0.0.1:${port}`
}

function resolveSchedulerApiKey(): string {
  try {
    const db = getDatabase()
    const row = db.prepare("SELECT value FROM settings WHERE key = 'security.api_key'").get() as { value?: string } | undefined
    if (row?.value) return String(row.value).trim()
  } catch {
    // DB may not be ready during startup races; fall back to env.
  }

  return String(process.env.API_KEY || '').trim()
}

async function runAgentHeartbeatLoop(): Promise<{ ok: boolean; message: string }> {
  try {
    const db = getDatabase()
    const agents = db.prepare(`
      SELECT id, name, workspace_id FROM agents
      WHERE hidden = 0
      ORDER BY id ASC
    `).all() as Array<{ id: number; name: string; workspace_id: number | null }>

    if (agents.length === 0) {
      return { ok: true, message: 'No registered agents to heartbeat' }
    }

    const baseUrl = resolveMissionControlBaseUrl()
    const apiKey = resolveSchedulerApiKey()
    if (!apiKey) {
      return { ok: false, message: 'Heartbeat loop failed: missing API key for internal POSTs' }
    }

    let okCount = 0
    let failedCount = 0
    const failures: string[] = []

    for (const agent of agents) {
      try {
        const response = await fetch(`${baseUrl}/api/agents/${encodeURIComponent(String(agent.id))}/heartbeat`, {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            'x-api-key': apiKey,
          },
          body: JSON.stringify({ scheduler: true }),
        })

        if (!response.ok) {
          failedCount++
          failures.push(`${agent.name} (${response.status})`)
          continue
        }

        okCount++
      } catch (err: any) {
        failedCount++
        failures.push(`${agent.name} (${err?.message || 'request failed'})`)
      }
    }

    const message = failedCount === 0
      ? `Posted heartbeat to ${okCount} agent(s)`
      : `Posted heartbeat to ${okCount}/${agents.length} agent(s); failed: ${failures.slice(0, 5).join(', ')}`

    return { ok: failedCount === 0, message }
  } catch (err: any) {
    return { ok: false, message: `Heartbeat loop failed: ${err.message}` }
  }
}

async function runSoulSync(): Promise<{ ok: boolean; message: string }> {
  try {
    const db = getDatabase()
    const agents = db.prepare(`
      SELECT id, name, soul_content, config, workspace_path
      FROM agents
      WHERE hidden = 0
      ORDER BY id ASC
    `).all() as Array<{
      id: number
      name: string
      soul_content: string | null
      config: string | null
      workspace_path: string | null
    }>

    if (agents.length === 0) {
      return { ok: true, message: 'No registered agents to sync SOULs for' }
    }

    const baseUrl = resolveMissionControlBaseUrl()
    const apiKey = resolveSchedulerApiKey()
    if (!apiKey) {
      return { ok: false, message: 'SOUL sync failed: missing API key for internal PUTs' }
    }

    let synced = 0
    let unchanged = 0
    let failed = 0
    const failures: string[] = []

    for (const agent of agents) {
      try {
        let agentConfig: any = {}
        if (agent.config) {
          try {
            agentConfig = JSON.parse(agent.config)
          } catch {
            agentConfig = {}
          }
        }

        const candidates = getAgentWorkspaceCandidates(agentConfig, agent.name)
        if (agent.workspace_path && !candidates.includes(agent.workspace_path)) {
          candidates.unshift(agent.workspace_path)
        }

        const soulMatch = readAgentWorkspaceFile(candidates, ['SOUL.md', 'soul.md'])
        if (!soulMatch.exists) {
          unchanged++
          continue
        }

        const diskSoul = soulMatch.content
        const dbSoul = agent.soul_content || ''
        if (diskSoul === dbSoul) {
          unchanged++
          continue
        }

        const response = await fetch(`${baseUrl}/api/agents/${encodeURIComponent(String(agent.id))}/soul`, {
          method: 'PUT',
          headers: {
            'content-type': 'application/json',
            'x-api-key': apiKey,
          },
          body: JSON.stringify({ soul_content: diskSoul, scheduler: true }),
        })

        if (!response.ok) {
          failed++
          failures.push(`${agent.name} (${response.status})`)
          continue
        }

        synced++
      } catch (err: any) {
        failed++
        failures.push(`${agent.name} (${err?.message || 'request failed'})`)
      }
    }

    const summary = failed === 0
      ? `SOUL sync complete: ${synced} updated, ${unchanged} unchanged`
      : `SOUL sync complete: ${synced} updated, ${unchanged} unchanged, ${failed} failed (${failures.slice(0, 5).join(', ')})`

    return { ok: failed === 0, message: summary }
  } catch (err: any) {
    return { ok: false, message: `SOUL sync failed: ${err.message}` }
  }
}

/** Initialize the scheduler */
export function initScheduler() {
  if (tickInterval) return // Already running

  // Auto-sync agents from openclaw.json on startup
  syncAgentsFromConfig('startup').catch(err => {
    logger.warn({ err }, 'Agent auto-sync failed')
  })

  // Register tasks
  const now = Date.now()
  // Stagger the initial runs: backup at ~3 AM, cleanup at ~4 AM (relative to process start)
  const msUntilNextBackup = getNextDailyMs(3)
  const msUntilNextCleanup = getNextDailyMs(4)

  tasks.set('auto_backup', {
    name: 'Auto Backup',
    intervalMs: DAILY_MS,
    lastRun: null,
    nextRun: now + msUntilNextBackup,
    enabled: true,
    running: false,
  })

  tasks.set('auto_cleanup', {
    name: 'Auto Cleanup',
    intervalMs: DAILY_MS,
    lastRun: null,
    nextRun: now + msUntilNextCleanup,
    enabled: true,
    running: false,
  })

  tasks.set('agent_heartbeat', {
    name: 'Agent Heartbeat Loop',
    intervalMs: TICK_MS,
    lastRun: null,
    nextRun: now + TICK_MS,
    enabled: true,
    running: false,
  })

  tasks.set('agent_offline_sweep', {
    name: 'Agent Offline Sweep',
    intervalMs: FIVE_MINUTES_MS,
    lastRun: null,
    nextRun: now + FIVE_MINUTES_MS,
    enabled: true,
    running: false,
  })

  tasks.set('webhook_retry', {
    name: 'Webhook Retry',
    intervalMs: TICK_MS, // Every 60s, matching scheduler tick resolution
    lastRun: null,
    nextRun: now + TICK_MS,
    enabled: true,
    running: false,
  })

  tasks.set('claude_session_scan', {
    name: 'Claude Session Scan',
    intervalMs: TICK_MS, // Every 60s — lightweight file stat checks
    lastRun: null,
    nextRun: now + 5_000, // First scan 5s after startup
    enabled: true,
    running: false,
  })

  tasks.set('skill_sync', {
    name: 'Skill Sync',
    intervalMs: TICK_MS, // Every 60s — lightweight file stat checks
    lastRun: null,
    nextRun: now + 10_000, // First scan 10s after startup
    enabled: true,
    running: false,
  })

  tasks.set('soul_sync', {
    name: 'SOUL Sync',
    intervalMs: TICK_MS, // Every 60s — detect workspace SOUL.md changes and push to MC
    lastRun: null,
    nextRun: now + 12_000,
    enabled: true,
    running: false,
  })

  tasks.set('local_agent_sync', {
    name: 'Local Agent Sync',
    intervalMs: TICK_MS, // Every 60s — lightweight dir scan
    lastRun: null,
    nextRun: now + 15_000, // First scan 15s after startup
    enabled: true,
    running: false,
  })

  tasks.set('gateway_agent_sync', {
    name: 'Gateway Agent Sync',
    intervalMs: TICK_MS, // Every 60s — re-read openclaw.json
    lastRun: null,
    nextRun: now + 20_000, // First scan 20s after startup (after local sync)
    enabled: true,
    running: false,
  })

  tasks.set('task_dispatch', {
    name: 'Task Dispatch',
    intervalMs: TICK_MS, // Every 60s — check for assigned tasks to dispatch
    lastRun: null,
    nextRun: now + 10_000, // First check 10s after startup
    enabled: true,
    running: false,
  })

  tasks.set('aegis_review', {
    name: 'Aegis Quality Review',
    intervalMs: TICK_MS, // Every 60s — check for tasks awaiting review
    lastRun: null,
    nextRun: now + 30_000, // First check 30s after startup (after dispatch)
    enabled: true,
    running: false,
  })

  tasks.set('recurring_task_spawn', {
    name: 'Recurring Task Spawn',
    intervalMs: TICK_MS, // Every 60s — check for recurring tasks due
    lastRun: null,
    nextRun: now + 20_000, // First check 20s after startup
    enabled: true,
    running: false,
  })

  // Start the tick loop
  tickInterval = setInterval(tick, TICK_MS)
  logger.info('Scheduler initialized - backup at ~3AM, cleanup at ~4AM, heartbeat loop/SOUL sync every 60s, offline sweep every 5m, webhook/claude/skill/local-agent/gateway-agent sync every 60s')
}

/** Calculate ms until next occurrence of a given hour (UTC) */
function getNextDailyMs(hour: number): number {
  const now = new Date()
  const next = new Date(now)
  next.setUTCHours(hour, 0, 0, 0)
  if (next.getTime() <= now.getTime()) {
    next.setUTCDate(next.getUTCDate() + 1)
  }
  return next.getTime() - now.getTime()
}

/** Check and run due tasks */
async function tick() {
  const now = Date.now()

  for (const [id, task] of tasks) {
    if (task.running || now < task.nextRun) continue

    // Check if this task is enabled in settings (heartbeat tasks are always enabled by default)
    const settingKey = id === 'auto_backup' ? 'general.auto_backup'
      : id === 'auto_cleanup' ? 'general.auto_cleanup'
      : id === 'webhook_retry' ? 'webhooks.retry_enabled'
      : id === 'claude_session_scan' ? 'general.claude_session_scan'
      : id === 'skill_sync' ? 'general.skill_sync'
      : id === 'soul_sync' ? 'general.soul_sync'
      : id === 'local_agent_sync' ? 'general.local_agent_sync'
      : id === 'gateway_agent_sync' ? 'general.gateway_agent_sync'
      : id === 'task_dispatch' ? 'general.task_dispatch'
      : id === 'aegis_review' ? 'general.aegis_review'
      : id === 'recurring_task_spawn' ? 'general.recurring_task_spawn'
      : 'general.agent_heartbeat'
    const defaultEnabled = id === 'agent_heartbeat' || id === 'agent_offline_sweep' || id === 'webhook_retry' || id === 'claude_session_scan' || id === 'skill_sync' || id === 'soul_sync' || id === 'local_agent_sync' || id === 'gateway_agent_sync' || id === 'task_dispatch' || id === 'aegis_review' || id === 'recurring_task_spawn'
    if (!isSettingEnabled(settingKey, defaultEnabled)) continue

    task.running = true
    try {
      const result = id === 'auto_backup' ? await runBackup()
        : id === 'agent_heartbeat' ? await runAgentHeartbeatLoop()
        : id === 'agent_offline_sweep' ? await runHeartbeatCheck()
        : id === 'webhook_retry' ? await processWebhookRetries()
        : id === 'claude_session_scan' ? await syncClaudeSessions()
        : id === 'skill_sync' ? await syncSkillsFromDisk()
        : id === 'soul_sync' ? await runSoulSync()
        : id === 'local_agent_sync' ? await syncLocalAgents()
        : id === 'gateway_agent_sync' ? await syncAgentsFromConfig('scheduled').then(async r => {
            const registration = await registerConnectedGatewayAgents()
            const refreshed = await syncAgentLiveStatuses()
            return { ok: true, message: `Gateway sync: ${r.created} created, ${r.updated} updated, ${r.synced} total | Registration: ${registration.registered} created, ${registration.updated} updated, ${registration.scanned} scanned | Live status: ${refreshed} refreshed` }
          })
        : id === 'task_dispatch' ? await dispatchAssignedTasks()
        : id === 'aegis_review' ? await runAegisReviews()
        : id === 'recurring_task_spawn' ? await spawnRecurringTasks()
        : await runCleanup()
      task.lastResult = { ...result, timestamp: now }
    } catch (err: any) {
      task.lastResult = { ok: false, message: err.message, timestamp: now }
    } finally {
      task.running = false
      task.lastRun = now
      task.nextRun = now + task.intervalMs
    }
  }
}

/** Get scheduler status (for API) */
export function getSchedulerStatus() {
  const result: Array<{
    id: string
    name: string
    enabled: boolean
    lastRun: number | null
    nextRun: number
    running: boolean
    lastResult?: { ok: boolean; message: string; timestamp: number }
  }> = []

  for (const [id, task] of tasks) {
    const settingKey = id === 'auto_backup' ? 'general.auto_backup'
      : id === 'auto_cleanup' ? 'general.auto_cleanup'
      : id === 'webhook_retry' ? 'webhooks.retry_enabled'
      : id === 'claude_session_scan' ? 'general.claude_session_scan'
      : id === 'skill_sync' ? 'general.skill_sync'
      : id === 'soul_sync' ? 'general.soul_sync'
      : id === 'local_agent_sync' ? 'general.local_agent_sync'
      : id === 'gateway_agent_sync' ? 'general.gateway_agent_sync'
      : id === 'task_dispatch' ? 'general.task_dispatch'
      : id === 'aegis_review' ? 'general.aegis_review'
      : id === 'recurring_task_spawn' ? 'general.recurring_task_spawn'
      : 'general.agent_heartbeat'
    const defaultEnabled = id === 'agent_heartbeat' || id === 'agent_offline_sweep' || id === 'webhook_retry' || id === 'claude_session_scan' || id === 'skill_sync' || id === 'soul_sync' || id === 'local_agent_sync' || id === 'gateway_agent_sync' || id === 'task_dispatch' || id === 'aegis_review' || id === 'recurring_task_spawn'
    result.push({
      id,
      name: task.name,
      enabled: isSettingEnabled(settingKey, defaultEnabled),
      lastRun: task.lastRun,
      nextRun: task.nextRun,
      running: task.running,
      lastResult: task.lastResult,
    })
  }

  return result
}

/** Manually trigger a scheduled task */
export async function triggerTask(taskId: string): Promise<{ ok: boolean; message: string }> {
  if (taskId === 'auto_backup') return runBackup()
  if (taskId === 'auto_cleanup') return runCleanup()
  if (taskId === 'agent_heartbeat') return runAgentHeartbeatLoop()
  if (taskId === 'agent_offline_sweep') return runHeartbeatCheck()
  if (taskId === 'webhook_retry') return processWebhookRetries()
  if (taskId === 'claude_session_scan') return syncClaudeSessions()
  if (taskId === 'skill_sync') return syncSkillsFromDisk()
  if (taskId === 'soul_sync') return runSoulSync()
  if (taskId === 'local_agent_sync') return syncLocalAgents()
  if (taskId === 'gateway_agent_sync') return syncAgentsFromConfig('manual').then(async r => {
    const registration = await registerConnectedGatewayAgents()
    const refreshed = await syncAgentLiveStatuses()
    return { ok: true, message: `Gateway sync: ${r.created} created, ${r.updated} updated, ${r.synced} total | Registration: ${registration.registered} created, ${registration.updated} updated, ${registration.scanned} scanned | Live status: ${refreshed} refreshed` }
  })
  if (taskId === 'task_dispatch') return dispatchAssignedTasks()
  if (taskId === 'aegis_review') return runAegisReviews()
  if (taskId === 'recurring_task_spawn') return spawnRecurringTasks()
  return { ok: false, message: `Unknown task: ${taskId}` }
}

/** Stop the scheduler */
export function stopScheduler() {
  if (tickInterval) {
    clearInterval(tickInterval)
    tickInterval = null
  }
}
