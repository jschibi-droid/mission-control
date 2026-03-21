import Link from 'next/link'
import { cn } from '@/lib/utils'

export function PhaseCard({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  return (
    <section className={cn('void-panel overflow-hidden', className)}>
      {children}
    </section>
  )
}

export function CardHeader({
  eyebrow,
  title,
  detail,
}: {
  eyebrow?: string
  title: string
  detail?: string
}) {
  return (
    <div className="border-b border-border/80 px-5 py-4">
      {eyebrow ? <div className="text-2xs uppercase tracking-[0.18em] text-primary/80">{eyebrow}</div> : null}
      <div className="mt-1 flex items-start justify-between gap-4">
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        {detail ? <div className="text-xs text-muted-foreground">{detail}</div> : null}
      </div>
    </div>
  )
}

export function StatusBadge({
  tone,
  children,
}: {
  tone: 'critical' | 'warning' | 'info' | 'active' | 'completed' | 'neutral'
  children: React.ReactNode
}) {
  const className = {
    critical: 'badge-error badge-glow-error',
    warning: 'badge-warning badge-glow-warning',
    info: 'badge-info',
    active: 'badge-info',
    completed: 'badge-success badge-glow-success',
    neutral: 'badge-neutral',
  }[tone]

  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium', className)}>
      {children}
    </span>
  )
}

export function MetricTile({
  label,
  value,
  detail,
}: {
  label: string
  value: string
  detail: string
}) {
  return (
    <div className="rounded-xl border border-border/70 bg-background/40 p-4">
      <div className="text-2xs uppercase tracking-[0.16em] text-muted-foreground">{label}</div>
      <div className="mt-2 font-mono-tight text-3xl font-semibold text-foreground">{value}</div>
      <div className="mt-1 text-xs text-muted-foreground">{detail}</div>
    </div>
  )
}

export function SelectionLink({
  href,
  active,
  title,
  meta,
  badge,
}: {
  href: string
  active?: boolean
  title: string
  meta: string
  badge?: React.ReactNode
}) {
  return (
    <Link
      href={href}
      className={cn(
        'block rounded-xl border px-4 py-3 transition-smooth',
        active
          ? 'border-primary/50 bg-primary/10 glow-cyan'
          : 'border-border/70 bg-background/25 hover:border-primary/30 hover:bg-secondary/60'
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate text-sm font-medium text-foreground">{title}</div>
          <div className="mt-1 text-xs text-muted-foreground">{meta}</div>
        </div>
        {badge}
      </div>
    </Link>
  )
}

export function ProgressBar({ value }: { value: number }) {
  return (
    <div className="h-2 rounded-full bg-secondary">
      <div
        className="h-2 rounded-full bg-primary transition-all"
        style={{ width: `${Math.max(6, Math.min(value, 100))}%` }}
      />
    </div>
  )
}

export function DefinitionList({
  items,
}: {
  items: Array<{ label: string; value: React.ReactNode }>
}) {
  return (
    <dl className="grid gap-3 sm:grid-cols-2">
      {items.map((item) => (
        <div key={item.label} className="rounded-xl border border-border/70 bg-background/20 p-3">
          <dt className="text-2xs uppercase tracking-[0.16em] text-muted-foreground">{item.label}</dt>
          <dd className="mt-1 text-sm text-foreground">{item.value}</dd>
        </div>
      ))}
    </dl>
  )
}

export function formatTimestamp(value: string): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value))
}

