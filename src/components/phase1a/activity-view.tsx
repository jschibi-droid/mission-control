import type { Phase1AViewModel } from '@/lib/phase1a-data'
import { buildPhase1aHref, getAgentById, getArtifactRun, getSessionById, getThreadById } from '@/lib/phase1a-data'
import { CardHeader, DefinitionList, PhaseCard, SelectionLink, StatusBadge, formatTimestamp } from './primitives'

export function ActivityView({ model }: { model: Phase1AViewModel }) {
  const selectedEvent = model.selectedEvent
  if (!selectedEvent) return null

  const relatedRun = selectedEvent.runId ? getArtifactRun(selectedEvent.runId) : null
  const relatedAgent = selectedEvent.agentId ? getAgentById(selectedEvent.agentId) : null
  const relatedSession = selectedEvent.sessionId ? getSessionById(selectedEvent.sessionId) : null
  const relatedThread = selectedEvent.threadId ? getThreadById(selectedEvent.threadId) : null

  return (
    <div className="grid gap-6 xl:grid-cols-[0.88fr_1.12fr]">
      <PhaseCard>
        <CardHeader eyebrow="Activity" title="Recent events" detail={`${model.activity.length} visible`} />
        <div className="grid gap-3 p-5">
          {model.activity.map((event) => (
            <SelectionLink
              key={event.id}
              href={buildPhase1aHref('activity', { key: 'event', value: event.id })}
              active={event.id === selectedEvent.id}
              title={event.title}
              meta={`${event.kind} • ${event.actor} • ${formatTimestamp(event.at)}`}
              badge={<StatusBadge tone={event.severity === 'critical' ? 'critical' : event.severity === 'warning' ? 'warning' : 'neutral'}>{event.severity}</StatusBadge>}
            />
          ))}
        </div>
      </PhaseCard>

      <div className="grid gap-6">
        <PhaseCard>
          <CardHeader eyebrow="Selected event" title={selectedEvent.title} detail={`${selectedEvent.kind} • ${selectedEvent.actor}`} />
          <div className="grid gap-5 p-5">
            <div className="flex flex-wrap items-center gap-3">
              <StatusBadge tone={selectedEvent.severity === 'critical' ? 'critical' : selectedEvent.severity === 'warning' ? 'warning' : 'neutral'}>
                {selectedEvent.severity}
              </StatusBadge>
              <div className="text-xs text-muted-foreground">Captured {formatTimestamp(selectedEvent.at)}</div>
            </div>
            <DefinitionList
              items={[
                { label: 'Kind', value: selectedEvent.kind },
                { label: 'Actor', value: selectedEvent.actor },
                { label: 'Linked run', value: relatedRun ? relatedRun.name : 'None' },
                { label: 'Movement', value: selectedEvent.motion },
                { label: 'Linked alert', value: selectedEvent.alertId ?? 'None' },
              ]}
            />
            <div className="rounded-xl border border-border/70 bg-background/20 p-4">
              <div className="text-2xs uppercase tracking-[0.16em] text-muted-foreground">Description</div>
              <p className="mt-2 text-sm leading-6 text-foreground/90">{selectedEvent.description}</p>
            </div>
          </div>
        </PhaseCard>

        <div className="grid gap-6 lg:grid-cols-2">
          <PhaseCard>
            <CardHeader eyebrow="Run context" title={relatedRun ? relatedRun.name : 'No linked run'} detail="Execution context" />
            <div className="grid gap-3 p-5">
              {relatedRun ? (
                <SelectionLink
                  href={buildPhase1aHref('runs', { key: 'run', value: relatedRun.id })}
                  title={relatedRun.stage}
                  meta={`${relatedRun.owner} • ${relatedRun.duration}`}
                  badge={<StatusBadge tone={relatedRun.status === 'blocked' ? 'critical' : relatedRun.status === 'active' ? 'active' : relatedRun.status === 'completed' ? 'completed' : 'warning'}>{relatedRun.status}</StatusBadge>}
                />
              ) : (
                <div className="rounded-xl border border-border/70 bg-background/20 p-4 text-sm text-muted-foreground">
                  This event is not attached to a run.
                </div>
              )}
            </div>
          </PhaseCard>

          <PhaseCard>
            <CardHeader eyebrow="Linked jumps" title="Inspect related records" detail="Cross-surface navigation" />
            <div className="grid gap-3 p-5">
              {selectedEvent.artifactId ? (
                <SelectionLink
                  href={buildPhase1aHref('artifacts', { key: 'artifact', value: selectedEvent.artifactId })}
                  title="Open artifact"
                  meta={selectedEvent.artifactId}
                />
              ) : null}
              {selectedEvent.alertId ? (
                <SelectionLink
                  href={buildPhase1aHref('health', { key: 'alert', value: selectedEvent.alertId })}
                  title="Open alert"
                  meta={selectedEvent.alertId}
                />
              ) : null}
              {selectedEvent.runId ? (
                <SelectionLink
                  href={buildPhase1aHref('runs', { key: 'run', value: selectedEvent.runId })}
                  title="Open run"
                  meta={selectedEvent.runId}
                />
              ) : null}
              {relatedAgent ? (
                <SelectionLink
                  href={buildPhase1aHref('agents', { key: 'agent', value: relatedAgent.id })}
                  title="Open agent"
                  meta={`${relatedAgent.name} • ${relatedAgent.role}`}
                />
              ) : null}
              {relatedThread ? (
                <SelectionLink
                  href={buildPhase1aHref('threads', { key: 'thread', value: relatedThread.id })}
                  title="Open thread"
                  meta={`${relatedThread.channel} • ${relatedThread.state}`}
                />
              ) : null}
              {relatedSession ? (
                <SelectionLink
                  href={buildPhase1aHref('runs', { key: 'session', value: relatedSession.id })}
                  title="Open session-backed run detail"
                  meta={`${relatedSession.label} • ${relatedSession.kind}`}
                />
              ) : null}
            </div>
          </PhaseCard>
        </div>
      </div>
    </div>
  )
}
