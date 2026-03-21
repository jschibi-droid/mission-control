import type { Phase1AViewModel } from '@/lib/phase1a-data'
import { buildPhase1aHref, getRunActivity, getRunAgents, getRunAlerts, getRunArtifacts, getRunSession, getThreadById } from '@/lib/phase1a-data'
import { CardHeader, DefinitionList, PhaseCard, ProgressBar, SelectionLink, StatusBadge, formatTimestamp } from './primitives'

export function RunsView({ model }: { model: Phase1AViewModel }) {
  const selectedRun = model.selectedRun
  if (!selectedRun) return null

  const relatedArtifacts = getRunArtifacts(selectedRun.id)
  const relatedActivity = getRunActivity(selectedRun.id)
  const relatedAlerts = getRunAlerts(selectedRun.id)
  const relatedAgents = getRunAgents(selectedRun.id)
  const session = getRunSession(selectedRun.id)
  const thread = selectedRun.threadId ? getThreadById(selectedRun.threadId) : null

  return (
    <div className="grid gap-6 xl:grid-cols-[0.88fr_1.12fr]">
      <PhaseCard>
        <CardHeader eyebrow="Runs" title="All runs" detail={`${model.runs.length} visible`} />
        <div className="grid gap-3 p-5">
          {model.runs.map((run) => (
            <SelectionLink
              key={run.id}
              href={buildPhase1aHref('runs', { key: 'run', value: run.id })}
              active={run.id === selectedRun.id}
              title={run.name}
              meta={`${run.stage} • ${run.duration} • ${formatTimestamp(run.updatedAt)}`}
              badge={
                <StatusBadge tone={run.status === 'blocked' ? 'critical' : run.status === 'active' ? 'active' : run.status === 'completed' ? 'completed' : 'warning'}>
                  {run.status}
                </StatusBadge>
              }
            />
          ))}
        </div>
      </PhaseCard>

      <div className="grid gap-6">
        <PhaseCard>
          <CardHeader eyebrow="Selected run" title={selectedRun.name} detail={`${selectedRun.owner} • ${selectedRun.branch}`} />
          <div className="grid gap-5 p-5">
            <div className="flex flex-wrap items-center gap-3">
              <StatusBadge tone={selectedRun.status === 'blocked' ? 'critical' : selectedRun.status === 'active' ? 'active' : selectedRun.status === 'completed' ? 'completed' : 'warning'}>
                {selectedRun.status}
              </StatusBadge>
              <div className="text-xs text-muted-foreground">Commit `{selectedRun.commit}`</div>
              <div className="text-xs text-muted-foreground">Started {formatTimestamp(selectedRun.startedAt)}</div>
            </div>
            <div>
              <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
                <span>Completion</span>
                <span className="font-mono-tight text-foreground">{selectedRun.completion}%</span>
              </div>
              <ProgressBar value={selectedRun.completion} />
            </div>
            <DefinitionList
              items={[
                { label: 'Current stage', value: selectedRun.stage },
                { label: 'Elapsed', value: selectedRun.duration },
                { label: 'Last update', value: formatTimestamp(selectedRun.updatedAt) },
                { label: 'Attention', value: selectedRun.attention },
              ]}
            />
            <div className="rounded-xl border border-border/70 bg-background/20 p-4">
              <div className="text-2xs uppercase tracking-[0.16em] text-muted-foreground">Summary</div>
              <p className="mt-2 text-sm leading-6 text-foreground/90">{selectedRun.summary}</p>
            </div>
          </div>
        </PhaseCard>

        <div className="grid gap-6 lg:grid-cols-2">
          <PhaseCard>
            <CardHeader eyebrow="Live session" title={session ? session.label : 'Unavailable'} detail="Session inspectability" />
            <div className="grid gap-4 p-5">
              {session ? (
                <>
                  <DefinitionList
                    items={[
                      { label: 'State', value: session.state },
                      { label: 'Kind', value: session.kind },
                      { label: 'Terminal', value: session.terminal },
                      { label: 'Command', value: session.command },
                    ]}
                  />
                  <div className="rounded-xl border border-border/70 bg-background/20 p-4">
                    <div className="text-2xs uppercase tracking-[0.16em] text-muted-foreground">Transcript preview</div>
                    <div className="mt-3 grid gap-2">
                      {session.transcriptPreview.map((line) => (
                        <div key={line} className="rounded-lg border border-border/60 bg-background/40 px-3 py-2 text-xs text-foreground/85">
                          {line}
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <div className="rounded-xl border border-border/70 bg-background/20 p-4 text-sm text-muted-foreground">
                  This run does not currently expose a linked session record.
                </div>
              )}
            </div>
          </PhaseCard>

          <PhaseCard>
            <CardHeader eyebrow="Linked operators" title="Agents on this run" detail={`${relatedAgents.length} visible`} />
            <div className="grid gap-3 p-5">
              {relatedAgents.map((agent) => (
                <SelectionLink
                  key={agent.id}
                  href={buildPhase1aHref('agents', { key: 'agent', value: agent.id })}
                  title={agent.name}
                  meta={`${agent.role} • ${agent.focus}`}
                  badge={<StatusBadge tone={agent.status === 'engaged' ? 'active' : agent.status === 'monitoring' ? 'info' : 'neutral'}>{agent.status}</StatusBadge>}
                />
              ))}
              {thread ? (
                <SelectionLink
                  href={buildPhase1aHref('threads', { key: 'thread', value: thread.id })}
                  title={thread.title}
                  meta={`${thread.channel} • ${thread.participantLabels.join(', ')}`}
                  badge={<StatusBadge tone={thread.state === 'live' ? 'active' : thread.state === 'watch' ? 'info' : 'neutral'}>{thread.state}</StatusBadge>}
                />
              ) : null}
            </div>
          </PhaseCard>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <PhaseCard>
            <CardHeader eyebrow="Artifacts" title="Run outputs" detail={`${relatedArtifacts.length} linked`} />
            <div className="grid gap-3 p-5">
              {relatedArtifacts.map((artifact) => (
                <SelectionLink
                  key={artifact.id}
                  href={buildPhase1aHref('artifacts', { key: 'artifact', value: artifact.id })}
                  title={artifact.name}
                  meta={`${artifact.type} • ${artifact.environment}`}
                  badge={<StatusBadge tone={artifact.status === 'stale' ? 'warning' : artifact.status === 'review' ? 'info' : 'completed'}>{artifact.status}</StatusBadge>}
                />
              ))}
            </div>
          </PhaseCard>

          <PhaseCard>
            <CardHeader eyebrow="Alerts and motion" title="Recent run events" detail={`${relatedActivity.length} events • ${relatedAlerts.length} alerts`} />
            <div className="grid gap-3 p-5">
              {relatedAlerts.map((alert) => (
                <SelectionLink
                  key={alert.id}
                  href={buildPhase1aHref('health', { key: 'alert', value: alert.id })}
                  title={alert.component}
                  meta={`${alert.metricLabel}: ${alert.metricValue} • ${alert.nextAction}`}
                  badge={<StatusBadge tone={alert.severity === 'critical' ? 'critical' : alert.severity === 'warning' ? 'warning' : 'info'}>{alert.severity}</StatusBadge>}
                />
              ))}
              {relatedActivity.map((event) => (
                <div key={event.id} className="rounded-xl border border-border/70 bg-background/20 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="text-sm font-medium text-foreground">{event.title}</div>
                    <StatusBadge tone={event.severity === 'critical' ? 'critical' : event.severity === 'warning' ? 'warning' : 'neutral'}>{event.severity}</StatusBadge>
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">{event.kind} • {event.actor} • {formatTimestamp(event.at)}</div>
                  <div className="mt-2 text-xs text-primary/80">{event.motion}</div>
                  <p className="mt-2 text-sm leading-6 text-foreground/85">{event.description}</p>
                </div>
              ))}
            </div>
          </PhaseCard>
        </div>
      </div>
    </div>
  )
}
