import Link from 'next/link'
import type { Phase1APanel } from '@/lib/phase1a-data'
import { buildPhase1aHref } from '@/lib/phase1a-data'
import { cn } from '@/lib/utils'

const items: Array<{ id: Phase1APanel; label: string; detail: string }> = [
  { id: 'overview', label: 'Overview', detail: 'What needs attention now' },
  { id: 'runs', label: 'Runs', detail: 'Execution status and details' },
  { id: 'agents', label: 'Agents', detail: 'Operator-visible agent posture' },
  { id: 'artifacts', label: 'Artifacts', detail: 'Outputs and review state' },
  { id: 'health', label: 'Health', detail: 'Operational alerts and signals' },
  { id: 'activity', label: 'Activity', detail: 'Recent system movement' },
  { id: 'threads', label: 'Threads', detail: 'Read-only chat visibility' },
]

export function Phase1ANavigation({ activePanel }: { activePanel: Phase1APanel }) {
  return (
    <nav className="rounded-2xl border border-border/80 bg-card/80 p-2 backdrop-blur-sm">
      <div className="grid gap-2 md:grid-cols-3 xl:grid-cols-7">
        {items.map((item) => (
          <Link
            key={item.id}
            href={buildPhase1aHref(item.id)}
            className={cn(
              'rounded-xl border px-4 py-3 transition-smooth',
              activePanel === item.id
                ? 'border-primary/50 bg-primary/10 glow-cyan'
                : 'border-transparent bg-background/20 hover:border-border/70 hover:bg-secondary/50'
            )}
          >
            <div className="text-sm font-medium text-foreground">{item.label}</div>
            <div className="mt-1 text-xs text-muted-foreground">{item.detail}</div>
          </Link>
        ))}
      </div>
    </nav>
  )
}
