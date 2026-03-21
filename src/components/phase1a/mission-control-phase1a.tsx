import type { Phase1AViewModel } from '@/lib/phase1a-data'
import { OverviewView } from './overview-view'
import { RunsView } from './runs-view'
import { ArtifactsView } from './artifacts-view'
import { HealthView } from './health-view'
import { ActivityView } from './activity-view'
import { Phase1ANavigation } from './navigation'

export function MissionControlPhase1A({ model }: { model: Phase1AViewModel }) {
  return (
    <main className="min-h-screen overflow-y-auto void-bg">
      <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-6 px-4 py-6 md:px-6 xl:px-8">
        <header className="rounded-2xl border border-border/80 bg-card/80 px-6 py-5 backdrop-blur-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="text-2xs uppercase tracking-[0.22em] text-primary/80">Approved scope</div>
              <div className="mt-2 text-2xl font-semibold tracking-tight text-foreground">Mission Control</div>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                Phase 1A keeps the primary surface focused on overview, runs, artifacts, health, and activity.
              </p>
            </div>
            <div className="grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
              <div>No task system or milestone management in this surface.</div>
              <div>No repo control or platform features in the primary navigation.</div>
            </div>
          </div>
        </header>

        <Phase1ANavigation activePanel={model.panel} />

        {model.panel === 'overview' ? <OverviewView model={model} /> : null}
        {model.panel === 'runs' ? <RunsView model={model} /> : null}
        {model.panel === 'artifacts' ? <ArtifactsView model={model} /> : null}
        {model.panel === 'health' ? <HealthView model={model} /> : null}
        {model.panel === 'activity' ? <ActivityView model={model} /> : null}
      </div>
    </main>
  )
}

