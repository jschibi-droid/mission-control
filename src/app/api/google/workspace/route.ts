import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth'
import { execFileSync } from 'child_process'

// ---------------------------------------------------------------------------
// Cache layer — avoid hammering gws on every dashboard poll
// ---------------------------------------------------------------------------

interface CacheEntry<T> {
  ts: number
  value: T
}

const cache = new Map<string, CacheEntry<unknown>>()
const CACHE_TTL_MS = 30_000 // 30 seconds

function getCached<T>(key: string): T | null {
  const entry = cache.get(key)
  if (!entry) return null
  if (Date.now() - entry.ts > CACHE_TTL_MS) {
    cache.delete(key)
    return null
  }
  return entry.value as T
}

function setCache<T>(key: string, value: T): T {
  cache.set(key, { ts: Date.now(), value })
  return value
}

// ---------------------------------------------------------------------------
// gws CLI wrapper
// ---------------------------------------------------------------------------

function gwsExec(args: string[], params?: Record<string, unknown>): unknown {
  const cmdArgs = [...args]
  if (params && Object.keys(params).length > 0) {
    cmdArgs.push('--params', JSON.stringify(params))
  }
  cmdArgs.push('--format', 'json')

  const raw = execFileSync('gws', cmdArgs, {
    timeout: 15_000,
    stdio: 'pipe',
    env: { ...process.env },
  }).toString()

  // gws may print "Using keyring backend: keyring" before JSON
  const jsonStart = raw.indexOf('{')
  const arrayStart = raw.indexOf('[')
  let start = -1
  if (jsonStart >= 0 && arrayStart >= 0) start = Math.min(jsonStart, arrayStart)
  else if (jsonStart >= 0) start = jsonStart
  else if (arrayStart >= 0) start = arrayStart

  if (start < 0) return {}
  return JSON.parse(raw.slice(start))
}

// ---------------------------------------------------------------------------
// Service handlers
// ---------------------------------------------------------------------------

interface CalendarEvent {
  summary: string
  start: { dateTime?: string; date?: string }
  end: { dateTime?: string; date?: string }
  htmlLink?: string
  status?: string
}

function getCalendar(): { events: CalendarEvent[]; count: number } {
  const cacheKey = 'gws:calendar'
  const cached = getCached<{ events: CalendarEvent[]; count: number }>(cacheKey)
  if (cached) return cached

  try {
    const now = new Date().toISOString()
    const data = gwsExec(['calendar', 'events', 'list'], {
      calendarId: 'primary',
      maxResults: 10,
      timeMin: now,
      singleEvents: true,
      orderBy: 'startTime',
    }) as { items?: CalendarEvent[] }

    const events = (data.items || []).map(e => ({
      summary: e.summary || '(No title)',
      start: e.start,
      end: e.end,
      htmlLink: e.htmlLink,
      status: e.status,
    }))

    return setCache(cacheKey, { events, count: events.length })
  } catch {
    return { events: [], count: 0 }
  }
}

interface GmailSummary {
  unreadCount: number
  messages: Array<{
    id: string
    threadId: string
    snippet?: string
    subject?: string
    from?: string
    date?: string
  }>
}

function getGmail(): GmailSummary {
  const cacheKey = 'gws:gmail'
  const cached = getCached<GmailSummary>(cacheKey)
  if (cached) return cached

  try {
    const data = gwsExec(['gmail', 'users', 'messages', 'list'], {
      userId: 'me',
      maxResults: 5,
      q: 'is:unread',
    }) as { messages?: Array<{ id: string; threadId: string }>; resultSizeEstimate?: number }

    const unreadCount = data.resultSizeEstimate || 0
    const messageList = data.messages || []

    // Get snippets for up to 5 messages
    const messages = messageList.slice(0, 5).map(m => {
      try {
        const detail = gwsExec(['gmail', 'users', 'messages', 'get'], {
          userId: 'me',
          id: m.id,
          format: 'metadata',
          metadataHeaders: ['Subject', 'From', 'Date'],
        }) as {
          id: string
          threadId: string
          snippet?: string
          payload?: { headers?: Array<{ name: string; value: string }> }
        }

        const headers = detail.payload?.headers || []
        return {
          id: detail.id,
          threadId: detail.threadId,
          snippet: detail.snippet,
          subject: headers.find(h => h.name === 'Subject')?.value || '',
          from: headers.find(h => h.name === 'From')?.value || '',
          date: headers.find(h => h.name === 'Date')?.value || '',
        }
      } catch {
        return { id: m.id, threadId: m.threadId }
      }
    })

    return setCache(cacheKey, { messages, unreadCount })
  } catch {
    return { messages: [], unreadCount: 0 }
  }
}

interface DriveFile {
  id: string
  name: string
  mimeType: string
  modifiedTime?: string
  webViewLink?: string
}

function getDrive(): { files: DriveFile[]; count: number } {
  const cacheKey = 'gws:drive'
  const cached = getCached<{ files: DriveFile[]; count: number }>(cacheKey)
  if (cached) return cached

  try {
    const data = gwsExec(['drive', 'files', 'list'], {
      pageSize: 10,
      orderBy: 'modifiedTime desc',
      fields: 'files(id,name,mimeType,modifiedTime,webViewLink)',
    }) as { files?: DriveFile[] }

    const files = (data.files || []).map(f => ({
      id: f.id,
      name: f.name,
      mimeType: f.mimeType,
      modifiedTime: f.modifiedTime,
      webViewLink: f.webViewLink,
    }))

    return setCache(cacheKey, { files, count: files.length })
  } catch {
    return { files: [], count: 0 }
  }
}

interface TaskList {
  id: string
  title: string
  taskCount: number
}

function getTasks(): { taskLists: TaskList[]; pendingCount: number } {
  const cacheKey = 'gws:tasks'
  const cached = getCached<{ taskLists: TaskList[]; pendingCount: number }>(cacheKey)
  if (cached) return cached

  try {
    const data = gwsExec(['tasks', 'tasklists', 'list']) as {
      items?: Array<{ id: string; title: string }>
    }

    let pendingCount = 0
    const taskLists: TaskList[] = (data.items || []).map(tl => {
      let taskCount = 0
      try {
        const tasks = gwsExec(['tasks', 'tasks', 'list'], {
          tasklist: tl.id,
          showCompleted: false,
        }) as { items?: unknown[] }
        taskCount = tasks.items?.length || 0
        pendingCount += taskCount
      } catch { /* ignore */ }

      return { id: tl.id, title: tl.title, taskCount }
    })

    return setCache(cacheKey, { taskLists, pendingCount })
  } catch {
    return { taskLists: [], pendingCount: 0 }
  }
}

function getSummary(): Record<string, unknown> {
  const cacheKey = 'gws:summary'
  const cached = getCached<Record<string, unknown>>(cacheKey)
  if (cached) return cached

  const calendar = getCalendar()
  const gmail = getGmail()
  const tasks = getTasks()

  return setCache(cacheKey, {
    calendar: { upcomingEvents: calendar.count },
    gmail: { unreadCount: gmail.unreadCount },
    tasks: { pendingCount: tasks.pendingCount, listCount: tasks.taskLists.length },
    status: 'connected',
    lastSync: new Date().toISOString(),
  })
}

// ---------------------------------------------------------------------------
// GET /api/google/workspace?service=calendar|gmail|drive|tasks|summary
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  const auth = requireRole(request, 'admin')
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const service = request.nextUrl.searchParams.get('service') || 'summary'

  try {
    switch (service) {
      case 'calendar':
        return NextResponse.json(getCalendar())
      case 'gmail':
        return NextResponse.json(getGmail())
      case 'drive':
        return NextResponse.json(getDrive())
      case 'tasks':
        return NextResponse.json(getTasks())
      case 'summary':
        return NextResponse.json(getSummary())
      default:
        return NextResponse.json(
          { error: `Unknown service: ${service}. Use: calendar, gmail, drive, tasks, summary` },
          { status: 400 }
        )
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: `Workspace API error: ${msg}` }, { status: 500 })
  }
}
