import Link from 'next/link'
import type { Phase1AViewModel } from '@/lib/phase1a-data'
import { buildPhase1aHref } from '@/lib/phase1a-data'
import { CardHeader, MetricTile, PhaseCard, SelectionLink, StatusBadge, formatTimestamp } from './primitives'

export function OverviewView({ model }: { model: Phase1AViewModel }) {
  return (
    <div className="grid gap-6">
      <PhaseCard className="void-bg">
        <div className="grid gap-6 px-6 py-6 lg:grid-cols-[1.35fr_0.65fr]">
          <div>
            <div className="text-2xs uppercase tracking-[0.2em] text-primary/80">Mission Control Phase 1A</div>
            <h1 className="mt-3 max-w-3xl text-3xl font-semibold tracking-tight text-foreground">
              A reviewable control surface for runs, artifacts, health, and activity.
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
              This surface is intentionally narrow. It highlights active work, operational risk, and the mocked data
              needed to review the UI before any real integrations exist.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <MetricTile label="Active runs" value={String(model.stats.activeRuns)} detail="Currently executing" />
              <MetricTile label="Blocked runs" value={String(model.stats.blockedRuns)} detail="Needs intervention" />
              <MetricTile label="Critical alerts" value={String(model.stats.criticalAlerts)} detail="Open now" />
              <MetricTile label="Artifacts to review" value={String(model.stats.reviewArtifacts)} detail="Pending decisions" />
            </div>
          </div>
          <div className="rounded-2xl border border-primary/20 bg-background/45 p-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-foreground">Attention queue</div>
                <div className="mt-1 text-xs text-muted-foreground">The highest-signal issues on the board.</div>
              </div>
              <StatusBadge tone="critical">{model.attentionItems.length} items</StatusBadge>
            </div>
            <div className="mt-4 space-y-3">
              {model.attentionItems.map((item) => (
                <Link
                  key={item.id}
                  href={item.href}
                  className="block rounded-xl border border-border/70 bg-card/70 px-4 py-3 hover:border-primary/30 hover:bg-secondary/50"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-medium text-foreground">{item.label}</div>
                    <StatusBadge tone={item.tone}>{item.tone}</StatusBadge>
                  </div>
                  <div className="mt-1 text-xs leading-5 text-muted-foreground">{item.detail}</div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </PhaseCard>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <PhaseCard>
          <CardHeader eyebrow="Runs" title="What is moving" detail="Live run posture" />
          <div className="grid gap-3 p-5">
            {model.runs.slice(0, 4).map((run) => (
              <SelectionLink
                key={run.id}
                href={buildPhase1aHref('runs', { key: 'run', value: run.id })}
                title={run.name}
                meta={`${run.stage} • ${run.owner} • Updated ${formatTimestamp(run.updatedAt)}`}
                badge={
                  <StatusBadge tone={run.status === 'blocked' ? 'critical' : run.status === 'active' ? 'active' : run.status === 'completed' ? 'completed' : 'warning'}>
                    {run.status}
                  </StatusBadge>
                }
              />
            ))}
          </div>
        </PhaseCard>

        <PhaseCard>
          <CardHeader eyebrow="Health" title="Where risk is concentrating" detail="Alert-driven triage" />
          <div className="grid gap-3 p-5">
            {model.alerts.slice(0, 4).map((alert) => (
              <SelectionLink
                key={alert.id}
                href={buildPhase1aHref('health', { key: 'alert', value: alert.id })}
                title={alert.component}
                meta={`${alert.metricLabel}: ${alert.metricValue} • ${formatTimestamp(alert.detectedAt)}`}
                badge={<StatusBadge tone={alert.severity === 'critical' ? 'critical' : alert.severity === 'warning' ? 'warning' : 'info'}>{alert.severity}</StatusBadge>}
              />
            ))}
          </div>
        </PhaseCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <PhaseCard>
          <CardHeader eyebrow="Artifacts" title="Outputs awaiting attention" detail="Review and freshness" />
          <div className="grid gap-3 p-5">
            {model.artifacts.slice(0, 4).map((artifact) => (
              <SelectionLink
                key={artifact.id}
                href={buildPhase1aHref('artifacts', { key: 'artifact', value: artifact.id })}
                title={artifact.name}
                meta={`${artifact.type} • ${artifact.environment} • ${formatTimestamp(artifact.updatedAt)}`}
                badge={<StatusBadge tone={artifact.status === 'stale' ? 'warning' : artifact.status === 'review' ? 'info' : 'completed'}>{artifact.status}</StatusBadge>}
              />
            ))}
          </div>
        </PhaseCard>

        <PhaseCard>
          <CardHeader eyebrow="Activity" title="Recent movement" detail="Cross-surface timeline" />
          <div className="grid gap-3 p-5">
            {model.activity.slice(0, 5).map((event) => (
              <SelectionLink
                key={event.id}
                href={buildPhase1aHref('activity', { key: 'event', value: event.id })}
                title={event.title}
                meta={`${event.kind} • ${event.actor} • ${formatTimestamp(event.at)}`}
                badge={<StatusBadge tone={event.severity === 'critical' ? 'critical' : event.severity === 'warning' ? 'warning' : 'neutral'}>{event.severity}</StatusBadge>}
              />
            ))}
          </div>
        </PhaseCard>
      </div>
    </div>
  )
}

