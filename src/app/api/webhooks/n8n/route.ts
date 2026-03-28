import { NextRequest, NextResponse } from 'next/server'
import { getDatabase } from '@/lib/db'
import { requireRole } from '@/lib/auth'
import { randomBytes } from 'crypto'
import { mutationLimiter } from '@/lib/rate-limit'

const DEFAULT_EVENTS = [
  'activity.task_dispatched',
  'activity.task_dispatch_failed',
  'activity.task_completed',
  'activity.task_review_requested',
  'task.status_changed',
]

function isValidHttpsUrl(urlStr: string): boolean {
  try {
    const url = new URL(urlStr)
    return url.protocol === 'https:' || url.protocol === 'http:'
  } catch {
    return false
  }
}

/**
 * POST /api/webhooks/n8n
 * Create a webhook subscription tuned for n8n task-dispatch automation.
 */
export async function POST(request: NextRequest) {
  const auth = requireRole(request, 'admin')
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const rateCheck = mutationLimiter(request)
  if (rateCheck) return rateCheck

  const body = await request.json().catch(() => ({}))
  const workspaceId = auth.user.workspace_id ?? 1
  const url = String(body?.url || '').trim()
  const name = String(body?.name || 'n8n Task Dispatch Bridge').trim() || 'n8n Task Dispatch Bridge'
  const events = Array.isArray(body?.events) && body.events.length > 0
    ? body.events.map((event: unknown) => String(event)).filter(Boolean)
    : DEFAULT_EVENTS
  const generateSecret = body?.generate_secret !== false

  if (!url || !isValidHttpsUrl(url)) {
    return NextResponse.json({ error: 'Valid n8n webhook URL is required' }, { status: 400 })
  }

  const db = getDatabase()
  const secret = generateSecret ? randomBytes(32).toString('hex') : null
  const result = db.prepare(`
    INSERT INTO webhooks (name, url, secret, events, created_by, workspace_id)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(name, url, secret, JSON.stringify(events), auth.user.username, workspaceId)

  return NextResponse.json({
    id: result.lastInsertRowid,
    name,
    url,
    secret,
    events,
    source_stream: '/api/stream',
    source_protocol: 'SSE',
    message: 'n8n webhook bridge created for task dispatch events',
  })
}
