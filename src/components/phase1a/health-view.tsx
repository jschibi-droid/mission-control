import type { Phase1AViewModel } from '@/lib/phase1a-data'
import { buildPhase1aHref, getAlertActivity } from '@/lib/phase1a-data'
import { CardHeader, DefinitionList, PhaseCard, SelectionLink, StatusBadge, formatTimestamp } from './primitives'

export function HealthView({ model }: { model: Phase1AViewModel }) {
  const selectedAlert = model.selectedAlert
  if (!selectedAlert) return null

  const relatedActivity = getAlertActivity(selectedAlert.id)

  return (
    <div className="grid gap-6 xl:grid-cols-[0.88fr_1.12fr]">
      <PhaseCard>
        <CardHeader eyebrow="Health" title="Open signals" detail={`${model.alerts.length} mocked alerts`} />
        <div className="grid gap-3 p-5">
          {model.alerts.map((alert) => (
            <SelectionLink
              key={alert.id}
              href={buildPhase1aHref('health', { key: 'alert', value: alert.id })}
              active={alert.id === selectedAlert.id}
              title={alert.component}
              meta={`${alert.metricLabel}: ${alert.metricValue} • ${formatTimestamp(alert.detectedAt)}`}
              badge={<StatusBadge tone={alert.severity === 'critical' ? 'critical' : alert.severity === 'warning' ? 'warning' : 'info'}>{alert.severity}</StatusBadge>}
            />
          ))}
        </div>
      </PhaseCard>

      <div className="grid gap-6">
        <PhaseCard>
          <CardHeader eyebrow="Selected alert" title={selectedAlert.component} detail={`${selectedAlert.metricLabel} • ${selectedAlert.state}`} />
          <div className="grid gap-5 p-5">
            <div className="flex flex-wrap items-center gap-3">
              <StatusBadge tone={selectedAlert.severity === 'critical' ? 'critical' : selectedAlert.severity === 'warning' ? 'warning' : 'info'}>
                {selectedAlert.severity}
              </StatusBadge>
              <div className="text-xs text-muted-foreground">Owner: {selectedAlert.owner}</div>
              <div className="text-xs text-muted-foreground">Detected {formatTimestamp(selectedAlert.detectedAt)}</div>
            </div>
            <DefinitionList
              items={[
                { label: 'Metric', value: selectedAlert.metricLabel },
                { label: 'Current value', value: selectedAlert.metricValue },
                { label: 'Impact', value: selectedAlert.impact },
                { label: 'Next action', value: selectedAlert.nextAction },
              ]}
            />
            <div className="rounded-xl border border-border/70 bg-background/20 p-4">
              <div className="text-2xs uppercase tracking-[0.16em] text-muted-foreground">Summary</div>
              <p className="mt-2 text-sm leading-6 text-foreground/90">{selectedAlert.summary}</p>
            </div>
          </div>
        </PhaseCard>

        <PhaseCard>
          <CardHeader eyebrow="Related activity" title="Operational timeline" detail={`${relatedActivity.length} events`} />
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
  )
}

