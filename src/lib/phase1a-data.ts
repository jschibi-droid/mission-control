export type Phase1APanel = 'overview' | 'runs' | 'artifacts' | 'health' | 'activity'
export type RunStatus = 'active' | 'queued' | 'blocked' | 'completed'
export type AlertSeverity = 'critical' | 'warning' | 'info'
export type ArtifactStatus = 'fresh' | 'review' | 'stale'
export type ActivitySeverity = 'critical' | 'warning' | 'normal'

export interface RunRecord {
  id: string
  name: string
  owner: string
  branch: string
  commit: string
  stage: string
  status: RunStatus
  completion: number
  startedAt: string
  updatedAt: string
  duration: string
  summary: string
  attention: string
  artifactIds: string[]
}

export interface ArtifactRecord {
  id: string
  name: string
  type: string
  status: ArtifactStatus
  runId: string
  environment: string
  sizeLabel: string
  updatedAt: string
  summary: string
  notes: string
}

export interface AlertRecord {
  id: string
  component: string
  severity: AlertSeverity
  state: 'open' | 'monitoring' | 'resolved'
  metricLabel: string
  metricValue: string
  detectedAt: string
  owner: string
  summary: string
  impact: string
  nextAction: string
}

export interface ActivityRecord {
  id: string
  title: string
  kind: string
  severity: ActivitySeverity
  actor: string
  at: string
  description: string
  runId?: string
  artifactId?: string
  alertId?: string
}

interface SearchParamMap {
  [key: string]: string | string[] | undefined
}

export interface Phase1AAttentionItem {
  id: string
  label: string
  detail: string
  href: string
  tone: 'critical' | 'warning'
}

export interface Phase1AViewModel {
  panel: Phase1APanel
  selectedRun: RunRecord | null
  selectedArtifact: ArtifactRecord | null
  selectedAlert: AlertRecord | null
  selectedEvent: ActivityRecord | null
  runs: RunRecord[]
  artifacts: ArtifactRecord[]
  alerts: AlertRecord[]
  activity: ActivityRecord[]
  attentionItems: Phase1AAttentionItem[]
  stats: {
    activeRuns: number
    blockedRuns: number
    criticalAlerts: number
    reviewArtifacts: number
    staleArtifacts: number
    recentCriticalActivity: number
  }
}

const runs: RunRecord[] = [
  {
    id: 'run-atlas',
    name: 'Atlas coordination rollout',
    owner: 'Ops Control',
    branch: 'release/atlas-rollout',
    commit: '9f3a7b1',
    stage: 'Final validation',
    status: 'blocked',
    completion: 82,
    startedAt: '2026-03-21T11:18:00Z',
    updatedAt: '2026-03-21T13:42:00Z',
    duration: '2h 24m',
    summary: 'Deployment is staged, but customer cutover is gated on gateway saturation staying below threshold.',
    attention: 'Primary gateway is holding above the warning band during validation traffic.',
    artifactIds: ['artifact-cutover-brief', 'artifact-bundle-atlas'],
  },
  {
    id: 'run-meridian',
    name: 'Meridian data backfill',
    owner: 'Data Systems',
    branch: 'ops/meridian-backfill',
    commit: '4c88d52',
    stage: 'Replay batch 6 of 8',
    status: 'active',
    completion: 68,
    startedAt: '2026-03-21T10:04:00Z',
    updatedAt: '2026-03-21T13:44:00Z',
    duration: '3h 40m',
    summary: 'Historical replay is progressing normally with stable throughput across the last two batches.',
    attention: 'Watch downstream lag while the final two high-volume batches are replayed.',
    artifactIds: ['artifact-meridian-diff'],
  },
  {
    id: 'run-lighthouse',
    name: 'Lighthouse runtime patch',
    owner: 'Platform Ops',
    branch: 'hotfix/lighthouse-runtime',
    commit: 'ab72e91',
    stage: 'Canary observe',
    status: 'active',
    completion: 54,
    startedAt: '2026-03-21T12:12:00Z',
    updatedAt: '2026-03-21T13:39:00Z',
    duration: '1h 27m',
    summary: 'Patch is live on canary nodes and holding steady with lower retry volume than baseline.',
    attention: 'Canary is healthy, but alert suppression expires in 21 minutes.',
    artifactIds: ['artifact-lighthouse-notes'],
  },
  {
    id: 'run-echo',
    name: 'Echo artifact index refresh',
    owner: 'Knowledge Systems',
    branch: 'chore/echo-index',
    commit: '5d120af',
    stage: 'Queued for execution',
    status: 'queued',
    completion: 12,
    startedAt: '2026-03-21T13:05:00Z',
    updatedAt: '2026-03-21T13:21:00Z',
    duration: '16m',
    summary: 'Refresh is waiting on the indexing lane to free up after the meridian backfill completes.',
    attention: 'No issue yet, but this run will age into the attention queue if it does not start soon.',
    artifactIds: ['artifact-echo-plan'],
  },
  {
    id: 'run-orbit',
    name: 'Orbit release packaging',
    owner: 'Release Engineering',
    branch: 'release/orbit',
    commit: '1ef0d33',
    stage: 'Published',
    status: 'completed',
    completion: 100,
    startedAt: '2026-03-21T08:30:00Z',
    updatedAt: '2026-03-21T10:02:00Z',
    duration: '1h 32m',
    summary: 'Packaging and validation finished successfully. Artifacts are ready for downstream consumers.',
    attention: 'No active follow-up required.',
    artifactIds: ['artifact-orbit-bundle'],
  },
]

const artifacts: ArtifactRecord[] = [
  {
    id: 'artifact-cutover-brief',
    name: 'Cutover readiness brief',
    type: 'Brief',
    status: 'review',
    runId: 'run-atlas',
    environment: 'production',
    sizeLabel: '12 sections',
    updatedAt: '2026-03-21T13:36:00Z',
    summary: 'Operator-facing brief covering traffic ramps, rollback timing, and escalation paths.',
    notes: 'Needs sign-off from network operations before customer cutover can proceed.',
  },
  {
    id: 'artifact-bundle-atlas',
    name: 'Atlas release bundle',
    type: 'Bundle',
    status: 'fresh',
    runId: 'run-atlas',
    environment: 'staging',
    sizeLabel: '1.4 GB',
    updatedAt: '2026-03-21T12:58:00Z',
    summary: 'Validated deployment bundle staged for cutover.',
    notes: 'Checksum and smoke results are attached to the package manifest.',
  },
  {
    id: 'artifact-meridian-diff',
    name: 'Backfill diff report',
    type: 'Report',
    status: 'review',
    runId: 'run-meridian',
    environment: 'data-plane',
    sizeLabel: '438 rows',
    updatedAt: '2026-03-21T13:31:00Z',
    summary: 'Mismatch report showing a narrow band of replay discrepancies for batch six.',
    notes: 'Review before batch eight begins so the replay window stays bounded.',
  },
  {
    id: 'artifact-lighthouse-notes',
    name: 'Canary observation notes',
    type: 'Notebook',
    status: 'fresh',
    runId: 'run-lighthouse',
    environment: 'canary',
    sizeLabel: '9 entries',
    updatedAt: '2026-03-21T13:40:00Z',
    summary: 'Live notes for retry rates, latency, and operator decisions during canary.',
    notes: 'Append the final rollback decision once the suppression window expires.',
  },
  {
    id: 'artifact-echo-plan',
    name: 'Index refresh plan',
    type: 'Plan',
    status: 'stale',
    runId: 'run-echo',
    environment: 'knowledge',
    sizeLabel: 'Last updated 19h ago',
    updatedAt: '2026-03-20T18:11:00Z',
    summary: 'Execution plan for the queued artifact refresh.',
    notes: 'Stale plan assumptions should be refreshed before execution starts.',
  },
  {
    id: 'artifact-orbit-bundle',
    name: 'Orbit release package',
    type: 'Bundle',
    status: 'fresh',
    runId: 'run-orbit',
    environment: 'release',
    sizeLabel: '932 MB',
    updatedAt: '2026-03-21T10:02:00Z',
    summary: 'Final signed package for downstream distribution.',
    notes: 'Distribution handoff is complete.',
  },
]

const alerts: AlertRecord[] = [
  {
    id: 'alert-gateway-saturation',
    component: 'Primary gateway',
    severity: 'critical',
    state: 'open',
    metricLabel: 'CPU saturation',
    metricValue: '92% for 14m',
    detectedAt: '2026-03-21T13:28:00Z',
    owner: 'Platform Ops',
    summary: 'Validation traffic is pinning the primary gateway above the safe headroom threshold.',
    impact: 'Atlas cutover remains blocked until sustained utilization drops.',
    nextAction: 'Shift 20% of validation traffic to the standby gateway and re-check after 10 minutes.',
  },
  {
    id: 'alert-backfill-drift',
    component: 'Meridian replay',
    severity: 'warning',
    state: 'monitoring',
    metricLabel: 'Replay drift',
    metricValue: '438 mismatches',
    detectedAt: '2026-03-21T13:12:00Z',
    owner: 'Data Systems',
    summary: 'Batch six introduced a small but persistent diff set during historical replay.',
    impact: 'Backfill can continue, but final reconciliation may require a targeted rerun.',
    nextAction: 'Review the diff report before batch eight begins.',
  },
  {
    id: 'alert-suppression-expiry',
    component: 'Lighthouse canary',
    severity: 'warning',
    state: 'open',
    metricLabel: 'Suppression window',
    metricValue: '21m remaining',
    detectedAt: '2026-03-21T13:23:00Z',
    owner: 'Runtime Engineering',
    summary: 'Temporary alert suppression on canary nodes is nearing expiry.',
    impact: 'If retries regress after expiry, the canary may need rollback.',
    nextAction: 'Decide whether to keep canary live before the window closes.',
  },
  {
    id: 'alert-feed-latency',
    component: 'Activity ingest',
    severity: 'info',
    state: 'monitoring',
    metricLabel: 'Ingest delay',
    metricValue: '38s behind',
    detectedAt: '2026-03-21T13:18:00Z',
    owner: 'Control Plane',
    summary: 'Activity aggregation is slightly delayed but within the tolerated envelope.',
    impact: 'Recent activity may appear marginally out of order.',
    nextAction: 'Keep monitoring unless delay exceeds 60 seconds.',
  },
]

const activity: ActivityRecord[] = [
  {
    id: 'event-gateway-reroute',
    title: 'Gateway reroute prepared',
    kind: 'Routing',
    severity: 'critical',
    actor: 'Platform Ops',
    at: '2026-03-21T13:44:00Z',
    description: 'Standby gateway is warmed and ready for a validation traffic shift to relieve the primary node.',
    runId: 'run-atlas',
    alertId: 'alert-gateway-saturation',
  },
  {
    id: 'event-meridian-diff',
    title: 'Diff report attached to replay',
    kind: 'Data',
    severity: 'warning',
    actor: 'Replay Monitor',
    at: '2026-03-21T13:31:00Z',
    description: 'A mismatch report was attached to Meridian batch six for operator review.',
    runId: 'run-meridian',
    artifactId: 'artifact-meridian-diff',
    alertId: 'alert-backfill-drift',
  },
  {
    id: 'event-lighthouse-canary',
    title: 'Retry rate improved on canary',
    kind: 'Runtime',
    severity: 'normal',
    actor: 'Runtime Engineering',
    at: '2026-03-21T13:27:00Z',
    description: 'Retry volume stayed below baseline for the last 25 minutes of canary observation.',
    runId: 'run-lighthouse',
    artifactId: 'artifact-lighthouse-notes',
  },
  {
    id: 'event-atlas-brief',
    title: 'Cutover brief updated',
    kind: 'Artifact',
    severity: 'warning',
    actor: 'Ops Control',
    at: '2026-03-21T13:36:00Z',
    description: 'Rollback timing and operator paging notes were revised in the cutover brief.',
    runId: 'run-atlas',
    artifactId: 'artifact-cutover-brief',
  },
  {
    id: 'event-feed-delay',
    title: 'Activity feed delay detected',
    kind: 'Control Plane',
    severity: 'normal',
    actor: 'Ingest Watcher',
    at: '2026-03-21T13:18:00Z',
    description: 'Feed ingest is running 38 seconds behind during the current traffic peak.',
    alertId: 'alert-feed-latency',
  },
  {
    id: 'event-echo-queued',
    title: 'Index refresh remains queued',
    kind: 'Queue',
    severity: 'warning',
    actor: 'Knowledge Systems',
    at: '2026-03-21T13:21:00Z',
    description: 'Echo index refresh is still waiting for a free execution lane.',
    runId: 'run-echo',
    artifactId: 'artifact-echo-plan',
  },
  {
    id: 'event-orbit-packaged',
    title: 'Orbit package published',
    kind: 'Release',
    severity: 'normal',
    actor: 'Release Engineering',
    at: '2026-03-21T10:02:00Z',
    description: 'Signed release package was published and handed off to downstream consumers.',
    runId: 'run-orbit',
    artifactId: 'artifact-orbit-bundle',
  },
]

export function getPhase1APanel(segment?: string | null): Phase1APanel {
  if (segment === 'runs' || segment === 'artifacts' || segment === 'health' || segment === 'activity') {
    return segment
  }
  return 'overview'
}

export function getQueryParam(searchParams: SearchParamMap, key: string): string | null {
  const value = searchParams[key]
  if (Array.isArray(value)) return value[0] ?? null
  return value ?? null
}

export function buildPhase1aHref(
  panel: Phase1APanel,
  selection?: { key: 'run' | 'artifact' | 'alert' | 'event'; value: string }
): string {
  const path = panel === 'overview' ? '/' : `/${panel}`
  if (!selection) return path
  return `${path}?${selection.key}=${encodeURIComponent(selection.value)}`
}

export function getPhase1AViewModel(input: {
  panelSegment?: string | null
  searchParams?: SearchParamMap
}): Phase1AViewModel {
  const panel = getPhase1APanel(input.panelSegment)
  const searchParams = input.searchParams ?? {}
  const selectedRun = panel === 'runs'
    ? runs.find((run) => run.id === getQueryParam(searchParams, 'run')) ?? runs[0]
    : null
  const selectedArtifact = panel === 'artifacts'
    ? artifacts.find((artifact) => artifact.id === getQueryParam(searchParams, 'artifact')) ?? artifacts[0]
    : null
  const selectedAlert = panel === 'health'
    ? alerts.find((alert) => alert.id === getQueryParam(searchParams, 'alert')) ?? alerts[0]
    : null
  const selectedEvent = panel === 'activity'
    ? activity.find((event) => event.id === getQueryParam(searchParams, 'event')) ?? activity[0]
    : null

  const stats = {
    activeRuns: runs.filter((run) => run.status === 'active').length,
    blockedRuns: runs.filter((run) => run.status === 'blocked').length,
    criticalAlerts: alerts.filter((alert) => alert.severity === 'critical' && alert.state !== 'resolved').length,
    reviewArtifacts: artifacts.filter((artifact) => artifact.status === 'review').length,
    staleArtifacts: artifacts.filter((artifact) => artifact.status === 'stale').length,
    recentCriticalActivity: activity.filter((event) => event.severity === 'critical').length,
  }

  const attentionItems: Phase1AAttentionItem[] = [
    ...alerts
      .filter((alert) => alert.severity === 'critical' || alert.severity === 'warning')
      .slice(0, 3)
      .map<Phase1AAttentionItem>((alert) => ({
        id: alert.id,
        label: alert.component,
        detail: `${alert.metricLabel}: ${alert.metricValue}`,
        href: buildPhase1aHref('health', { key: 'alert', value: alert.id }),
        tone: alert.severity === 'critical' ? 'critical' : 'warning',
      })),
    ...runs
      .filter((run) => run.status === 'blocked' || run.status === 'queued')
      .slice(0, 2)
      .map<Phase1AAttentionItem>((run) => ({
        id: run.id,
        label: run.name,
        detail: run.attention,
        href: buildPhase1aHref('runs', { key: 'run', value: run.id }),
        tone: run.status === 'blocked' ? 'critical' : 'warning',
      })),
  ].slice(0, 5)

  return {
    panel,
    selectedRun,
    selectedArtifact,
    selectedAlert,
    selectedEvent,
    runs,
    artifacts,
    alerts,
    activity,
    attentionItems,
    stats,
  }
}

export function getRunArtifacts(runId: string): ArtifactRecord[] {
  return artifacts.filter((artifact) => artifact.runId === runId)
}

export function getRunActivity(runId: string): ActivityRecord[] {
  return activity.filter((event) => event.runId === runId)
}

export function getArtifactRun(runId: string): RunRecord | null {
  return runs.find((run) => run.id === runId) ?? null
}

export function getAlertActivity(alertId: string): ActivityRecord[] {
  return activity.filter((event) => event.alertId === alertId)
}

export function getArtifactActivity(artifactId: string): ActivityRecord[] {
  return activity.filter((event) => event.artifactId === artifactId)
}
