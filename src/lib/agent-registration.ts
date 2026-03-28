import { getDatabase, db_helpers, logAuditEvent } from '@/lib/db'
import { eventBus } from '@/lib/event-bus'

const NAME_RE = /^[a-zA-Z0-9][a-zA-Z0-9._-]{0,62}$/
const VALID_ROLES = ['coder', 'reviewer', 'tester', 'devops', 'researcher', 'assistant', 'agent'] as const

type ValidRole = typeof VALID_ROLES[number]

export interface AgentRegistrationInput {
  name: string
  role?: string | null
  capabilities?: string[] | null
  framework?: string | null
  session_key?: string | null
  identity?: Record<string, unknown> | null
  session?: Record<string, unknown> | null
  metadata?: Record<string, unknown> | null
}

export interface AgentRegistrationResult {
  agent: {
    id: number
    name: string
    role: string
    status: 'idle'
    created_at: number
    session_key?: string
  }
  registered: boolean
  message: string
}

export function validateRegistrationInput(input: AgentRegistrationInput): { ok: true; value: Required<Pick<AgentRegistrationInput, 'name'>> & {
  role: ValidRole
  capabilities: string[]
  framework: string | null
  session_key: string | null
  identity: Record<string, unknown> | null
  session: Record<string, unknown> | null
  metadata: Record<string, unknown> | null
} } | { ok: false; error: string } {
  const name = typeof input?.name === 'string' ? input.name.trim() : ''
  const role = typeof input?.role === 'string' ? input.role.trim() : 'agent'
  const capabilities = Array.isArray(input?.capabilities)
    ? input.capabilities.filter((c): c is string => typeof c === 'string').map(c => c.trim()).filter(Boolean)
    : []
  const framework = typeof input?.framework === 'string' && input.framework.trim() ? input.framework.trim() : null
  const session_key = typeof input?.session_key === 'string' && input.session_key.trim() ? input.session_key.trim() : null
  const identity = input?.identity && typeof input.identity === 'object' && !Array.isArray(input.identity) ? input.identity : null
  const session = input?.session && typeof input.session === 'object' && !Array.isArray(input.session) ? input.session : null
  const metadata = input?.metadata && typeof input.metadata === 'object' && !Array.isArray(input.metadata) ? input.metadata : null

  if (!name || !NAME_RE.test(name)) {
    return { ok: false, error: 'Invalid agent name. Use 1-63 alphanumeric characters, dots, hyphens, or underscores. Must start with alphanumeric.' }
  }

  if (!VALID_ROLES.includes(role as ValidRole)) {
    return { ok: false, error: `Invalid role. Use: ${VALID_ROLES.join(', ')}` }
  }

  return {
    ok: true,
    value: {
      name,
      role: role as ValidRole,
      capabilities,
      framework,
      session_key,
      identity,
      session,
      metadata,
    },
  }
}

export function mergeAgentConfig(existingConfigRaw: string | null | undefined, input: {
  capabilities: string[]
  framework: string | null
  identity: Record<string, unknown> | null
  session: Record<string, unknown> | null
  metadata: Record<string, unknown> | null
}): Record<string, unknown> {
  let config: Record<string, unknown> = {}
  if (existingConfigRaw) {
    try {
      const parsed = JSON.parse(existingConfigRaw)
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        config = parsed
      }
    } catch {
      // ignore malformed stored config
    }
  }

  if (input.capabilities.length > 0) config.capabilities = input.capabilities
  if (input.framework) config.framework = input.framework
  if (input.identity) config.identity = { ...(config.identity as Record<string, unknown> | undefined), ...input.identity }
  if (input.session) config.openclawSession = { ...(config.openclawSession as Record<string, unknown> | undefined), ...input.session }
  if (input.metadata) config.registration = { ...(config.registration as Record<string, unknown> | undefined), ...input.metadata }

  return config
}

export function registerAgent(params: {
  workspaceId: number
  actor: string
  actorId?: number | null
  ipAddress?: string | null
  input: AgentRegistrationInput
}): AgentRegistrationResult {
  const validated = validateRegistrationInput(params.input)
  if (!validated.ok) {
    throw new Error(validated.error)
  }

  const { name, role, capabilities, framework, session_key, identity, session, metadata } = validated.value
  const db = getDatabase()
  const now = Math.floor(Date.now() / 1000)

  const existing = db.prepare(
    'SELECT * FROM agents WHERE name = ? AND workspace_id = ?'
  ).get(name, params.workspaceId) as any | undefined

  const mergedConfig = mergeAgentConfig(existing?.config, { capabilities, framework, identity, session, metadata })
  const configJson = JSON.stringify(mergedConfig)
  const lastActivity = session_key
    ? `Gateway session registered (${session?.channel || 'unknown'})`
    : existing?.last_activity || null

  if (existing) {
    db.prepare(
      'UPDATE agents SET role = ?, status = ?, last_seen = ?, updated_at = ?, config = ?, session_key = COALESCE(?, session_key), last_activity = COALESCE(?, last_activity) WHERE id = ? AND workspace_id = ?'
    ).run(role, 'idle', now, now, configJson, session_key, lastActivity, existing.id, params.workspaceId)

    return {
      agent: {
        id: existing.id,
        name: existing.name,
        role,
        status: 'idle',
        created_at: existing.created_at,
        ...(session_key || existing.session_key ? { session_key: session_key || existing.session_key } : {}),
      },
      registered: false,
      message: 'Agent already registered, metadata updated',
    }
  }

  const result = db.prepare(`
    INSERT INTO agents (name, role, status, config, created_at, updated_at, last_seen, workspace_id, session_key, last_activity)
    VALUES (?, ?, 'idle', ?, ?, ?, ?, ?, ?, ?)
  `).run(name, role, configJson, now, now, now, params.workspaceId, session_key, lastActivity)

  const agentId = Number(result.lastInsertRowid)

  db_helpers.logActivity(
    'agent_created',
    'agent',
    agentId,
    name,
    `Agent self-registered: ${name} (${role})${framework ? ` via ${framework}` : ''}`,
    { name, role, framework, capabilities, self_registered: true, session_key, identity, session, metadata },
    params.workspaceId,
  )

  logAuditEvent({
    action: 'agent_self_register',
    actor: params.actor,
    ...(params.actorId != null ? { actor_id: params.actorId } : {}),
    target_type: 'agent',
    target_id: agentId,
    detail: { name, role, framework, self_registered: true, session_key, identity, session, metadata },
    ip_address: params.ipAddress || 'unknown',
  })

  eventBus.broadcast('agent.created', { id: agentId, name, role, status: 'idle', session_key })

  return {
    agent: {
      id: agentId,
      name,
      role,
      status: 'idle',
      created_at: now,
      ...(session_key ? { session_key } : {}),
    },
    registered: true,
    message: 'Agent registered successfully',
  }
}
