import type { Phase1AViewModel } from '@/lib/phase1a-data'
import { buildPhase1aHref, getArtifactActivity, getArtifactRun } from '@/lib/phase1a-data'
import { CardHeader, DefinitionList, PhaseCard, SelectionLink, StatusBadge, formatTimestamp } from './primitives'

export function ArtifactsView({ model }: { model: Phase1AViewModel }) {
  const selectedArtifact = model.selectedArtifact
  if (!selectedArtifact) return null

  const run = getArtifactRun(selectedArtifact.runId)
  const relatedActivity = getArtifactActivity(selectedArtifact.id)

  return (
    <div className="grid gap-6 xl:grid-cols-[0.88fr_1.12fr]">
      <PhaseCard>
        <CardHeader eyebrow="Artifacts" title="All artifacts" detail={`${model.artifacts.length} mocked outputs`} />
        <div className="grid gap-3 p-5">
          {model.artifacts.map((artifact) => (
            <SelectionLink
              key={artifact.id}
              href={buildPhase1aHref('artifacts', { key: 'artifact', value: artifact.id })}
              active={artifact.id === selectedArtifact.id}
              title={artifact.name}
              meta={`${artifact.type} • ${artifact.environment} • ${formatTimestamp(artifact.updatedAt)}`}
              badge={<StatusBadge tone={artifact.status === 'stale' ? 'warning' : artifact.status === 'review' ? 'info' : 'completed'}>{artifact.status}</StatusBadge>}
            />
          ))}
        </div>
      </PhaseCard>

      <div className="grid gap-6">
        <PhaseCard>
          <CardHeader eyebrow="Selected artifact" title={selectedArtifact.name} detail={`${selectedArtifact.type} • ${selectedArtifact.environment}`} />
          <div className="grid gap-5 p-5">
            <div className="flex flex-wrap items-center gap-3">
              <StatusBadge tone={selectedArtifact.status === 'stale' ? 'warning' : selectedArtifact.status === 'review' ? 'info' : 'completed'}>
                {selectedArtifact.status}
              </StatusBadge>
              <div className="text-xs text-muted-foreground">Updated {formatTimestamp(selectedArtifact.updatedAt)}</div>
            </div>
            <DefinitionList
              items={[
                { label: 'Source run', value: run ? run.name : 'Unknown run' },
                { label: 'Footprint', value: selectedArtifact.sizeLabel },
                { label: 'Environment', value: selectedArtifact.environment },
                { label: 'Review note', value: selectedArtifact.notes },
              ]}
            />
            <div className="rounded-xl border border-border/70 bg-background/20 p-4">
              <div className="text-2xs uppercase tracking-[0.16em] text-muted-foreground">Summary</div>
              <p className="mt-2 text-sm leading-6 text-foreground/90">{selectedArtifact.summary}</p>
            </div>
          </div>
        </PhaseCard>

        <div className="grid gap-6 lg:grid-cols-2">
          <PhaseCard>
            <CardHeader eyebrow="Run context" title={run ? run.name : 'Unavailable'} detail="Linked execution" />
            <div className="grid gap-3 p-5">
              {run ? (
                <SelectionLink
                  href={buildPhase1aHref('runs', { key: 'run', value: run.id })}
                  title={run.stage}
                  meta={`${run.owner} • ${run.duration}`}
                  badge={<StatusBadge tone={run.status === 'blocked' ? 'critical' : run.status === 'active' ? 'active' : run.status === 'completed' ? 'completed' : 'warning'}>{run.status}</StatusBadge>}
                />
              ) : null}
            </div>
          </PhaseCard>

          <PhaseCard>
            <CardHeader eyebrow="Activity" title="Artifact timeline" detail={`${relatedActivity.length} related events`} />
            <div className="grid gap-3 p-5">
              {relatedActivity.map((event) => (
                <div key={event.id} className="rounded-xl border border-border/70 bg-background/20 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="text-sm font-medium text-foreground">{event.title}</div>
                    <StatusBadge tone={event.severity === 'critical' ? 'critical' : event.severity === 'warning' ? 'warning' : 'neutral'}>{event.severity}</StatusBadge>
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">{event.actor} • {formatTimestamp(event.at)}</div>
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

