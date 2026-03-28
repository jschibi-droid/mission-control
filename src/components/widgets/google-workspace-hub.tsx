'use client'

import { useState, useEffect, useCallback } from 'react'

interface CalendarEvent {
  summary: string
  start: { dateTime?: string; date?: string }
  end: { dateTime?: string; date?: string }
  htmlLink?: string
}

interface GmailMessage {
  id: string
  snippet?: string
  subject?: string
  from?: string
  date?: string
}

interface DriveFile {
  id: string
  name: string
  mimeType: string
  modifiedTime?: string
  webViewLink?: string
}

interface TaskList {
  id: string
  title: string
  taskCount: number
}

interface WorkspaceSummary {
  calendar: { upcomingEvents: number }
  gmail: { unreadCount: number }
  tasks: { pendingCount: number; listCount: number }
  lastSync: string
}

type TabId = 'summary' | 'calendar' | 'gmail' | 'drive' | 'tasks'

export function GoogleWorkspaceHub() {
  const [summary, setSummary] = useState<WorkspaceSummary | null>(null)
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([])
  const [gmailMessages, setGmailMessages] = useState<GmailMessage[]>([])
  const [driveFiles, setDriveFiles] = useState<DriveFile[]>([])
  const [taskLists, setTaskLists] = useState<TaskList[]>([])
  const [activeTab, setActiveTab] = useState<TabId>('summary')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchService = useCallback(async (service: string) => {
    try {
      const res = await fetch(`/api/google/workspace?service=${service}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return await res.json()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err))
      return null
    }
  }, [])

  const loadSummary = useCallback(async () => {
    setLoading(true); setError(null)
    const data = await fetchService('summary')
    if (data) setSummary(data)
    setLoading(false)
  }, [fetchService])

  const loadTab = useCallback(async (tab: string) => {
    setLoading(true); setError(null)
    const data = await fetchService(tab)
    if (!data) { setLoading(false); return }
    if (tab === 'calendar') setCalendarEvents(data.events || [])
    else if (tab === 'gmail') setGmailMessages(data.messages || [])
    else if (tab === 'drive') setDriveFiles(data.files || [])
    else if (tab === 'tasks') setTaskLists(data.taskLists || [])
    setLoading(false)
  }, [fetchService])

  useEffect(() => { loadSummary() }, [loadSummary])
  useEffect(() => { if (activeTab !== 'summary') loadTab(activeTab) }, [activeTab, loadTab])

  const fmtTime = (d?: string) => { if (!d) return ''; try { return new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) } catch { return d } }
  const fmtDate = (d?: string) => { if (!d) return ''; try { return new Date(d).toLocaleDateString([], { month: 'short', day: 'numeric' }) } catch { return d } }
  const mimeIcon = (m: string) => m.includes('sheet') ? '📊' : m.includes('doc') ? '📄' : m.includes('slide') ? '📽️' : m.includes('folder') ? '📁' : m.includes('pdf') ? '📕' : '📎'
  const truncFrom = (f?: string) => { if (!f) return 'Unknown'; const m = f.match(/^"?([^"<]+)"?\s*</); return m ? m[1].trim() : f.split('@')[0] }

  const tabs: { id: TabId; label: string }[] = [
    { id: 'summary', label: '📊 Overview' },
    { id: 'calendar', label: '📅 Calendar' },
    { id: 'gmail', label: '✉️ Gmail' },
    { id: 'drive', label: '📁 Drive' },
    { id: 'tasks', label: '✅ Tasks' },
  ]

  return (
    <div className="mt-4 border border-border/60 rounded-lg bg-card/50 backdrop-blur overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/40 bg-gradient-to-r from-blue-500/5 via-red-500/5 to-green-500/5">
        <div className="flex items-center gap-2">
          <span className="text-lg">🔗</span>
          <h3 className="text-sm font-semibold text-foreground">Google Workspace Hub</h3>
          {summary && <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-500/15 text-green-400 font-medium">Live</span>}
        </div>
        <button onClick={loadSummary} className="text-xs text-muted-foreground hover:text-foreground transition-colors" title="Refresh">↻ Refresh</button>
      </div>

      <div className="flex border-b border-border/30 px-2 overflow-x-auto">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-2 text-xs font-medium whitespace-nowrap transition-colors border-b-2 ${activeTab === tab.id ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground/80'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      <div className="p-4 min-h-[120px]">
        {error && <div className="text-xs text-red-400 bg-red-500/10 rounded p-2 mb-3">⚠️ {error}</div>}

        {loading ? (
          <div className="flex items-center justify-center py-6">
            <div className="animate-spin w-5 h-5 border-2 border-primary border-t-transparent rounded-full" />
            <span className="ml-2 text-xs text-muted-foreground">Loading...</span>
          </div>
        ) : (
          <>
            {activeTab === 'summary' && summary && (
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-secondary/60 rounded-lg p-3 cursor-pointer hover:bg-secondary/80 transition-colors" onClick={() => setActiveTab('calendar')}>
                  <div className="text-2xl font-bold text-blue-400">{summary.calendar.upcomingEvents}</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">📅 Upcoming Events</div>
                </div>
                <div className="bg-secondary/60 rounded-lg p-3 cursor-pointer hover:bg-secondary/80 transition-colors" onClick={() => setActiveTab('gmail')}>
                  <div className="text-2xl font-bold text-red-400">{summary.gmail.unreadCount}</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">✉️ Unread Emails</div>
                </div>
                <div className="bg-secondary/60 rounded-lg p-3 cursor-pointer hover:bg-secondary/80 transition-colors" onClick={() => setActiveTab('tasks')}>
                  <div className="text-2xl font-bold text-yellow-400">{summary.tasks.pendingCount}</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">✅ Pending Tasks</div>
                </div>
              </div>
            )}

            {activeTab === 'calendar' && (
              <div className="space-y-2">
                {calendarEvents.length === 0 ? <div className="text-xs text-muted-foreground text-center py-4">No upcoming events</div> : calendarEvents.map((ev, i) => (
                  <div key={i} className="flex items-start gap-3 bg-secondary/40 rounded-lg p-2.5 hover:bg-secondary/60 transition-colors">
                    <div className="text-center min-w-[40px]">
                      <div className="text-[10px] text-muted-foreground">{fmtDate(ev.start.dateTime || ev.start.date)}</div>
                      <div className="text-xs font-bold text-blue-400">{fmtTime(ev.start.dateTime)}</div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-foreground truncate font-medium">{ev.summary}</div>
                      {ev.start.dateTime && ev.end?.dateTime && <div className="text-[10px] text-muted-foreground">{fmtTime(ev.start.dateTime)} - {fmtTime(ev.end.dateTime)}</div>}
                    </div>
                    {ev.htmlLink && <a href={ev.htmlLink} target="_blank" rel="noopener noreferrer" className="text-[10px] text-blue-400 hover:text-blue-300">Open</a>}
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'gmail' && (
              <div className="space-y-2">
                {gmailMessages.length === 0 ? <div className="text-xs text-muted-foreground text-center py-4">No unread messages</div> : gmailMessages.map((msg, i) => (
                  <div key={msg.id || i} className="bg-secondary/40 rounded-lg p-2.5 hover:bg-secondary/60 transition-colors">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-foreground truncate flex-1">{msg.subject || '(No subject)'}</span>
                      <span className="text-[10px] text-muted-foreground whitespace-nowrap">{msg.date ? fmtDate(msg.date) : ''}</span>
                    </div>
                    <div className="text-[11px] text-blue-400 mt-0.5">{truncFrom(msg.from)}</div>
                    {msg.snippet && <div className="text-[10px] text-muted-foreground mt-1 line-clamp-2">{msg.snippet}</div>}
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'drive' && (
              <div className="space-y-1.5">
                {driveFiles.length === 0 ? <div className="text-xs text-muted-foreground text-center py-4">No recent files</div> : driveFiles.map((f, i) => (
                  <div key={f.id || i} className="flex items-center gap-2.5 bg-secondary/40 rounded-lg p-2 hover:bg-secondary/60 transition-colors">
                    <span className="text-base">{mimeIcon(f.mimeType)}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-foreground truncate font-medium">{f.name}</div>
                      <div className="text-[10px] text-muted-foreground">{f.modifiedTime ? fmtDate(f.modifiedTime) : ''}</div>
                    </div>
                    {f.webViewLink && <a href={f.webViewLink} target="_blank" rel="noopener noreferrer" className="text-[10px] text-blue-400 hover:text-blue-300 whitespace-nowrap">Open</a>}
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'tasks' && (
              <div className="space-y-2">
                {taskLists.length === 0 ? <div className="text-xs text-muted-foreground text-center py-4">No task lists</div> : taskLists.map((tl, i) => (
                  <div key={tl.id || i} className="flex items-center justify-between bg-secondary/40 rounded-lg p-2.5 hover:bg-secondary/60 transition-colors">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">📋</span>
                      <span className="text-xs font-medium text-foreground">{tl.title}</span>
                    </div>
                    <span className={`text-xs font-bold ${tl.taskCount > 0 ? 'text-yellow-400' : 'text-green-400'}`}>{tl.taskCount} pending</span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {summary?.lastSync && <div className="px-4 py-1.5 border-t border-border/20 text-[10px] text-muted-foreground">Last sync: {new Date(summary.lastSync).toLocaleTimeString()}</div>}
    </div>
  )
}
