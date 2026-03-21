import type { Phase1AViewModel } from '@/lib/phase1a-data'
import {
  buildPhase1aHref,
  getArtifactRun,
  getSessionById,
  getThreadActivity,
} from '@/lib/phase1a-data'
import { CardHeader, DefinitionList, PhaseCard, SelectionLink, StatusBadge, formatTimestamp } from './primitives'

export function ThreadsView({ model }: { model: Phase1AViewModel }) {
  const selectedThread = model.selectedThread
  if (!selectedThread) return null

  const run = selectedThread.runId ? getArtifactRun(selectedThread.runId) : null
  const session = selectedThread.sessionId ? getSessionById(selectedThread.sessionId) : null
  const relatedActivity = getThreadActivity(selectedThread.id)

  return (
    <div className="grid gap-6 xl:grid-cols-[0.88fr_1.12fr]">
      <PhaseCard>
        <CardHeader eyebrow="Threads" title="Read-only operator threads" detail={`${model.threads.length} visible`} />
        <div className="grid gap-3 p-5">
          {model.threads.map((thread) => (
            <SelectionLink
              key={thread.id}
              href={buildPhase1aHref('threads', { key: 'thread', value: thread.id })}
              active={thread.id === selectedThread.id}
              title={thread.title}
              meta={`${thread.channel} • ${thread.participantLabels.join(', ')} • ${formatTimestamp(thread.lastMessageAt)}`}
              badge={<StatusBadge tone={thread.state === 'live' ? 'active' : thread.state === 'watch' ? 'info' : 'neutral'}>{thread.state}</StatusBadge>}
            />
          ))}
        </div>
      </PhaseCard>

      <div className="grid gap-6">
        <PhaseCard>
          <CardHeader eyebrow="Selected thread" title={selectedThread.title} detail={`${selectedThread.channel} • inspect only`} />
          <div className="grid gap-5 p-5">
            <div className="flex flex-wrap items-center gap-3">
              <StatusBadge tone={selectedThread.state === 'live' ? 'active' : selectedThread.state === 'watch' ? 'info' : 'neutral'}>
                {selectedThread.state}
              </StatusBadge>
              <div className="text-xs text-muted-foreground">Last message {formatTimestamp(selectedThread.lastMessageAt)}</div>
              <div className="text-xs text-muted-foreground">Replying is intentionally disabled</div>
            </div>
            <DefinitionList
              items={[
                { label: 'Summary', value: selectedThread.summary },
                { label: 'Participants', value: selectedThread.participantLabels.join(', ') },
                { label: 'Linked run', value: run ? run.name : 'No linked run' },
                { label: 'Linked session', value: session ? session.label : 'No linked session' },
              ]}
            />
            <div className="grid gap-3">
              {model.selectedThreadMessages.map((message) => (
                <div key={message.id} className="rounded-xl border border-border/70 bg-background/20 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-medium text-foreground">{message.author}</div>
                    <div className="text-xs text-muted-foreground">{formatTimestamp(message.at)}</div>
                  </div>
                  <div className="mt-1 text-2xs uppercase tracking-[0.16em] text-muted-foreground">{message.authorType}</div>
                  <p className="mt-2 text-sm leading-6 text-foreground/90">{message.body}</p>
                </div>
              ))}
            </div>
          </div>
        </PhaseCard>

        <div className="grid gap-6 lg:grid-cols-2">
          <PhaseCard>
            <CardHeader eyebrow="Linked jumps" title="Operational context" detail="Cross-surface navigation" />
            <div className="grid gap-3 p-5">
              {run ? (
                <SelectionLink
                  href={buildPhase1aHref('runs', { key: 'thread', value: selectedThread.id })}
                  title={run.name}
                  meta={`${run.stage} • ${run.owner}`}
                  badge={<StatusBadge tone={run.status === 'blocked' ? 'critical' : run.status === 'active' ? 'active' : run.status === 'completed' ? 'completed' : 'warning'}>{run.status}</StatusBadge>}
                />
              ) : null}
              {selectedThread.agentId ? (
                <SelectionLink
                  href={buildPhase1aHref('agents', { key: 'agent', value: selectedThread.agentId })}
                  title="Open linked agent"
                  meta={selectedThread.agentId}
                />
              ) : null}
              {session ? (
                <SelectionLink
                  href={buildPhase1aHref('runs', { key: 'session', value: session.id })}
                  title={session.label}
                  meta={`${session.command} • ${session.kind}`}
                  badge={<StatusBadge tone={session.state === 'streaming' ? 'active' : session.state === 'watching' ? 'info' : 'neutral'}>{session.state}</StatusBadge>}
                />
              ) : null}
            </div>
          </PhaseCard>

          <PhaseCard>
            <CardHeader eyebrow="Activity" title="Thread-linked motion" detail={`${relatedActivity.length} events`} />
            <div className="grid gap-3 p-5">
              {relatedActivity.map((event) => (
                <SelectionLink
                  key={event.id}
                  href={buildPhase1aHref('activity', { key: 'event', value: event.id })}
                  title={event.title}
                  meta={`${event.motion} • ${formatTimestamp(event.at)}`}
                  badge={<StatusBadge tone={event.severity === 'critical' ? 'critical' : event.severity === 'warning' ? 'warning' : 'neutral'}>{event.severity}</StatusBadge>}
                />
              ))}
            </div>
          </PhaseCard>
        </div>
      </div>
    </div>
  )
}
