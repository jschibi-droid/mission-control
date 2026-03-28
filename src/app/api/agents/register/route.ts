import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth'
import { selfRegisterLimiter } from '@/lib/rate-limit'
import { logger } from '@/lib/logger'
import { registerAgent } from '@/lib/agent-registration'

/**
 * POST /api/agents/register — Agent self-registration.
 *
 * Allows agents to register themselves with minimal auth (viewer role).
 * If an agent with the same name already exists, returns the existing agent
 * (idempotent upsert on status/last_seen).
 *
 * Body: { name, role?, capabilities?, framework?, session_key?, identity?, session?, metadata? }
 *
 * Rate-limited to 5 registrations/min per IP to prevent spam.
 */
export async function POST(request: NextRequest) {
  const auth = requireRole(request, 'viewer')
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const limited = selfRegisterLimiter(request)
  if (limited) return limited

  let body: any
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Request body required' }, { status: 400 })
  }

  try {
    const result = registerAgent({
      workspaceId: auth.user.workspace_id ?? 1,
      actor: auth.user.username,
      actorId: auth.user.id,
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      input: body,
    })

    return NextResponse.json(result, { status: result.registered ? 201 : 200 })
  } catch (error: any) {
    if (error.message?.startsWith('Invalid ')) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    if (error.message?.includes('UNIQUE constraint')) {
      return NextResponse.json({ error: 'Agent name already exists' }, { status: 409 })
    }
    logger.error({ err: error }, 'POST /api/agents/register error')
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 })
  }
}

export const dynamic = 'force-dynamic'
