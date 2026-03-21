import type { Phase1AViewModel } from '@/lib/phase1a-data'
import { buildPhase1aHref, getRunActivity, getRunArtifacts } from '@/lib/phase1a-data'
import { CardHeader, DefinitionList, PhaseCard, ProgressBar, SelectionLink, StatusBadge, formatTimestamp } from './primitives'

export function RunsView({ model }: { model: Phase1AViewModel }) {
  const selectedRun = model.selectedRun
  if (!selectedRun) return null

  const relatedArtifacts = getRunArtifacts(selectedRun.id)
  const relatedActivity = getRunActivity(selectedRun.id)

  return (
    <div className="grid gap-6 xl:grid-cols-[0.88fr_1.12fr]">
      <PhaseCard>
        <CardHeader eyebrow="Runs" title="All runs" detail={`${model.runs.length} mocked runs`} />
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
            <CardHeader eyebrow="Activity" title="Recent run events" detail={`${relatedActivity.length} linked`} />
            <div className="grid gap-3 p-5">
              {relatedActivity.map((event) => (
                <div key={event.id} className="rounded-xl border border-border/70 bg-background/20 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="text-sm font-medium text-foreground">{event.title}</div>
                    <StatusBadge tone={event.severity === 'critical' ? 'critical' : event.severity === 'warning' ? 'warning' : 'neutral'}>{event.severity}</StatusBadge>
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">{event.kind} • {event.actor} • {formatTimestamp(event.at)}</div>
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

