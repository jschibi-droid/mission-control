export type Phase1APanel = 'overview' | 'runs' | 'artifacts' | 'health' | 'activity' | 'agents' | 'threads'
export type RunStatus = 'active' | 'queued' | 'blocked' | 'completed'
export type AlertSeverity = 'critical' | 'warning' | 'info'
export type ArtifactStatus = 'fresh' | 'review' | 'stale'
export type ActivitySeverity = 'critical' | 'warning' | 'normal'
export type AgentStatus = 'engaged' | 'monitoring' | 'idle'
export type SessionState = 'streaming' | 'watching' | 'handoff'
export type ThreadState = 'live' | 'watch' | 'quiet'

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
  agentIds: string[]
  sessionId: string
  threadId?: string
  alertIds: string[]
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
  runId?: string
  sessionId?: string
  threadId?: string
}

export interface ActivityRecord {
  id: string
  title: string
  kind: string
  severity: ActivitySeverity
  actor: string
  at: string
  description: string
  motion: string
  runId?: string
  artifactId?: string
  alertId?: string
  agentId?: string
  sessionId?: string
  threadId?: string
}

export interface AgentRecord {
  id: string
  name: string
  role: string
  status: AgentStatus
  focus: string
  summary: string
  owner: string
  currentRunId?: string
  sessionId?: string
  threadId?: string
  lastSeenAt: string
  artifactIds: string[]
  alertIds: string[]
}

export interface SessionRecord {
  id: string
  label: string
  kind: 'codex-cli' | 'claude-code' | 'gateway'
  state: SessionState
  runId: string
  agentId: string
  threadId?: string
  command: string
  terminal: string
  startedAt: string
  updatedAt: string
  summary: string
  transcriptPreview: string[]
}

export interface ThreadRecord {
  id: string
  title: string
  channel: string
  state: ThreadState
  summary: string
  runId?: string
  agentId?: string
  sessionId?: string
  lastMessageAt: string
  participantLabels: string[]
  messageIds: string[]
}

export interface ThreadMessageRecord {
  id: string
  threadId: string
  author: string
  authorType: 'operator' | 'agent' | 'system'
  at: string
  body: string
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
  selectedAgent: AgentRecord | null
  selectedThread: ThreadRecord | null
  selectedSession: SessionRecord | null
  selectedThreadMessages: ThreadMessageRecord[]
  runs: RunRecord[]
  artifacts: ArtifactRecord[]
  alerts: AlertRecord[]
  activity: ActivityRecord[]
  agents: AgentRecord[]
  sessions: SessionRecord[]
  threads: ThreadRecord[]
  attentionItems: Phase1AAttentionItem[]
  stats: {
    activeRuns: number
    blockedRuns: number
    criticalAlerts: number
    reviewArtifacts: number
    staleArtifacts: number
    recentCriticalActivity: number
    engagedAgents: number
    liveThreads: number
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
    agentIds: ['agent-rhea', 'agent-sable'],
    sessionId: 'session-atlas-main',
    threadId: 'thread-atlas-cutover',
    alertIds: ['alert-gateway-saturation'],
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
    agentIds: ['agent-ivy'],
    sessionId: 'session-meridian-replay',
    threadId: 'thread-meridian-ops',
    alertIds: ['alert-backfill-drift'],
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
    agentIds: ['agent-kite'],
    sessionId: 'session-lighthouse-canary',
    threadId: 'thread-lighthouse-watch',
    alertIds: ['alert-suppression-expiry'],
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
    agentIds: ['agent-ember'],
    sessionId: 'session-echo-queue',
    threadId: 'thread-echo-queue',
    alertIds: [],
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
    agentIds: ['agent-rhea'],
    sessionId: 'session-orbit-release',
    threadId: 'thread-orbit-release',
    alertIds: [],
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
    runId: 'run-atlas',
    sessionId: 'session-atlas-main',
    threadId: 'thread-atlas-cutover',
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
    runId: 'run-meridian',
    sessionId: 'session-meridian-replay',
    threadId: 'thread-meridian-ops',
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
    runId: 'run-lighthouse',
    sessionId: 'session-lighthouse-canary',
    threadId: 'thread-lighthouse-watch',
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
    threadId: 'thread-atlas-cutover',
  },
]

const agents: AgentRecord[] = [
  {
    id: 'agent-rhea',
    name: 'Rhea',
    role: 'Release coordinator',
    status: 'engaged',
    focus: 'Atlas cutover sequencing and Orbit handoff validation.',
    summary: 'Owns release sequencing and keeps cutover notes synchronized with live gateway posture.',
    owner: 'Ops Control',
    currentRunId: 'run-atlas',
    sessionId: 'session-atlas-main',
    threadId: 'thread-atlas-cutover',
    lastSeenAt: '2026-03-21T13:43:00Z',
    artifactIds: ['artifact-cutover-brief', 'artifact-orbit-bundle'],
    alertIds: ['alert-gateway-saturation'],
  },
  {
    id: 'agent-sable',
    name: 'Sable',
    role: 'Gateway watcher',
    status: 'monitoring',
    focus: 'Tracking primary and standby gateway headroom during Atlas validation.',
    summary: 'Provides live saturation observations and confirms reroute readiness before cutover changes.',
    owner: 'Platform Ops',
    currentRunId: 'run-atlas',
    sessionId: 'session-atlas-main',
    threadId: 'thread-atlas-cutover',
    lastSeenAt: '2026-03-21T13:44:00Z',
    artifactIds: ['artifact-bundle-atlas'],
    alertIds: ['alert-gateway-saturation'],
  },
  {
    id: 'agent-ivy',
    name: 'Ivy',
    role: 'Replay analyst',
    status: 'engaged',
    focus: 'Diff inspection for Meridian replay batches six through eight.',
    summary: 'Watches replay integrity and narrows mismatch windows before the final backfill batch.',
    owner: 'Data Systems',
    currentRunId: 'run-meridian',
    sessionId: 'session-meridian-replay',
    threadId: 'thread-meridian-ops',
    lastSeenAt: '2026-03-21T13:33:00Z',
    artifactIds: ['artifact-meridian-diff'],
    alertIds: ['alert-backfill-drift'],
  },
  {
    id: 'agent-kite',
    name: 'Kite',
    role: 'Canary observer',
    status: 'monitoring',
    focus: 'Retry and latency posture ahead of the Lighthouse suppression expiry.',
    summary: 'Tracks runtime regressions on the canary ring and flags rollback thresholds.',
    owner: 'Runtime Engineering',
    currentRunId: 'run-lighthouse',
    sessionId: 'session-lighthouse-canary',
    threadId: 'thread-lighthouse-watch',
    lastSeenAt: '2026-03-21T13:39:00Z',
    artifactIds: ['artifact-lighthouse-notes'],
    alertIds: ['alert-suppression-expiry'],
  },
  {
    id: 'agent-ember',
    name: 'Ember',
    role: 'Queue steward',
    status: 'idle',
    focus: 'Holding Echo until an execution lane opens and plan assumptions are refreshed.',
    summary: 'Keeps the queued refresh visible, but does not have an active execution session yet.',
    owner: 'Knowledge Systems',
    currentRunId: 'run-echo',
    sessionId: 'session-echo-queue',
    threadId: 'thread-echo-queue',
    lastSeenAt: '2026-03-21T13:21:00Z',
    artifactIds: ['artifact-echo-plan'],
    alertIds: [],
  },
]

const sessions: SessionRecord[] = [
  {
    id: 'session-atlas-main',
    label: 'Atlas validation terminal',
    kind: 'codex-cli',
    state: 'streaming',
    runId: 'run-atlas',
    agentId: 'agent-rhea',
    threadId: 'thread-atlas-cutover',
    command: 'codex run atlas-validate --env staging --watch gateway',
    terminal: 'ops-control / atlas-rollout',
    startedAt: '2026-03-21T11:19:00Z',
    updatedAt: '2026-03-21T13:42:00Z',
    summary: 'Live validation session for cutover readiness with gateway observations flowing into the same operator thread.',
    transcriptPreview: [
      '13:42 UTC  Gateway saturation remains above target after the last validation burst.',
      '13:40 UTC  Standby gateway warmed successfully; reroute can proceed on operator approval.',
      '13:36 UTC  Cutover brief updated with rollback timing and paging notes.',
    ],
  },
  {
    id: 'session-meridian-replay',
    label: 'Meridian replay monitor',
    kind: 'claude-code',
    state: 'streaming',
    runId: 'run-meridian',
    agentId: 'agent-ivy',
    threadId: 'thread-meridian-ops',
    command: 'claude replay watch meridian --batch 6',
    terminal: 'data-systems / meridian-backfill',
    startedAt: '2026-03-21T10:05:00Z',
    updatedAt: '2026-03-21T13:44:00Z',
    summary: 'Replay monitor session is still active and recording diff checkpoints before the final batches start.',
    transcriptPreview: [
      '13:44 UTC  Throughput held at target while diff review continues.',
      '13:31 UTC  Diff artifact attached for operator review.',
      '13:12 UTC  Drift alert opened after mismatch count crossed the watch threshold.',
    ],
  },
  {
    id: 'session-lighthouse-canary',
    label: 'Canary observation terminal',
    kind: 'gateway',
    state: 'watching',
    runId: 'run-lighthouse',
    agentId: 'agent-kite',
    threadId: 'thread-lighthouse-watch',
    command: 'gateway tail lighthouse --window 30m --retries --latency',
    terminal: 'runtime-engineering / lighthouse-runtime',
    startedAt: '2026-03-21T12:12:00Z',
    updatedAt: '2026-03-21T13:39:00Z',
    summary: 'Observability session focused on retry and latency movement during the canary watch window.',
    transcriptPreview: [
      '13:39 UTC  Retry volume still below baseline on canary nodes.',
      '13:28 UTC  Suppression-expiry decision window is now under 25 minutes.',
      '13:18 UTC  Latency held flat across the last five samples.',
    ],
  },
  {
    id: 'session-echo-queue',
    label: 'Echo queue watcher',
    kind: 'codex-cli',
    state: 'handoff',
    runId: 'run-echo',
    agentId: 'agent-ember',
    threadId: 'thread-echo-queue',
    command: 'codex queue wait echo-index --lane indexing',
    terminal: 'knowledge-systems / echo-index',
    startedAt: '2026-03-21T13:05:00Z',
    updatedAt: '2026-03-21T13:21:00Z',
    summary: 'The session is parked on queue watch until the indexing lane opens and stale plan notes are refreshed.',
    transcriptPreview: [
      '13:21 UTC  Queue still blocked by Meridian replay resource hold.',
      '13:11 UTC  Plan freshness warning surfaced for operator review.',
      '13:05 UTC  Queue watch session opened.',
    ],
  },
  {
    id: 'session-orbit-release',
    label: 'Orbit release packaging',
    kind: 'codex-cli',
    state: 'handoff',
    runId: 'run-orbit',
    agentId: 'agent-rhea',
    threadId: 'thread-orbit-release',
    command: 'codex release pack orbit --sign --publish',
    terminal: 'release-engineering / orbit',
    startedAt: '2026-03-21T08:30:00Z',
    updatedAt: '2026-03-21T10:02:00Z',
    summary: 'Packaging session completed and was left in handoff state for downstream distribution.',
    transcriptPreview: [
      '10:02 UTC  Signed package published successfully.',
      '09:54 UTC  Validation checks passed for release bundle.',
      '09:31 UTC  Signing stage started.',
    ],
  },
]

const threads: ThreadRecord[] = [
  {
    id: 'thread-atlas-cutover',
    title: 'Atlas cutover watch',
    channel: '#ops-atlas',
    state: 'live',
    summary: 'Primary coordination thread for Atlas validation, gateway posture, and operator decisions.',
    runId: 'run-atlas',
    agentId: 'agent-rhea',
    sessionId: 'session-atlas-main',
    lastMessageAt: '2026-03-21T13:44:00Z',
    participantLabels: ['Ops Control', 'Rhea', 'Sable', 'Network Ops'],
    messageIds: ['msg-atlas-1', 'msg-atlas-2', 'msg-atlas-3'],
  },
  {
    id: 'thread-meridian-ops',
    title: 'Meridian replay ops',
    channel: '#data-meridian',
    state: 'live',
    summary: 'Read-only replay watch thread for diff review and backfill integrity checks.',
    runId: 'run-meridian',
    agentId: 'agent-ivy',
    sessionId: 'session-meridian-replay',
    lastMessageAt: '2026-03-21T13:33:00Z',
    participantLabels: ['Data Systems', 'Ivy', 'Replay Monitor'],
    messageIds: ['msg-meridian-1', 'msg-meridian-2', 'msg-meridian-3'],
  },
  {
    id: 'thread-lighthouse-watch',
    title: 'Lighthouse canary watch',
    channel: '#runtime-watch',
    state: 'watch',
    summary: 'Observation-only thread centered on canary retry movement and rollback thresholds.',
    runId: 'run-lighthouse',
    agentId: 'agent-kite',
    sessionId: 'session-lighthouse-canary',
    lastMessageAt: '2026-03-21T13:39:00Z',
    participantLabels: ['Runtime Engineering', 'Kite'],
    messageIds: ['msg-lighthouse-1', 'msg-lighthouse-2'],
  },
  {
    id: 'thread-echo-queue',
    title: 'Echo queue watch',
    channel: '#knowledge-queue',
    state: 'quiet',
    summary: 'Queue hold thread for Echo while execution waits on a lane and plan refresh.',
    runId: 'run-echo',
    agentId: 'agent-ember',
    sessionId: 'session-echo-queue',
    lastMessageAt: '2026-03-21T13:21:00Z',
    participantLabels: ['Knowledge Systems', 'Ember'],
    messageIds: ['msg-echo-1', 'msg-echo-2'],
  },
  {
    id: 'thread-orbit-release',
    title: 'Orbit release handoff',
    channel: '#release-orbit',
    state: 'quiet',
    summary: 'Completed packaging handoff thread retained for operator inspection.',
    runId: 'run-orbit',
    agentId: 'agent-rhea',
    sessionId: 'session-orbit-release',
    lastMessageAt: '2026-03-21T10:02:00Z',
    participantLabels: ['Release Engineering', 'Rhea'],
    messageIds: ['msg-orbit-1', 'msg-orbit-2'],
  },
]

const threadMessages: ThreadMessageRecord[] = [
  {
    id: 'msg-atlas-1',
    threadId: 'thread-atlas-cutover',
    author: 'Sable',
    authorType: 'agent',
    at: '2026-03-21T13:40:00Z',
    body: 'Standby gateway is warm. Validation traffic can shift as soon as operator approval lands.',
  },
  {
    id: 'msg-atlas-2',
    threadId: 'thread-atlas-cutover',
    author: 'Ops Control',
    authorType: 'operator',
    at: '2026-03-21T13:42:00Z',
    body: 'Hold customer cutover until saturation remains below threshold for a full watch window.',
  },
  {
    id: 'msg-atlas-3',
    threadId: 'thread-atlas-cutover',
    author: 'System',
    authorType: 'system',
    at: '2026-03-21T13:44:00Z',
    body: 'Gateway reroute prepared event attached to Atlas validation run.',
  },
  {
    id: 'msg-meridian-1',
    threadId: 'thread-meridian-ops',
    author: 'Replay Monitor',
    authorType: 'system',
    at: '2026-03-21T13:12:00Z',
    body: 'Replay drift alert opened after mismatch count exceeded the watch threshold.',
  },
  {
    id: 'msg-meridian-2',
    threadId: 'thread-meridian-ops',
    author: 'Ivy',
    authorType: 'agent',
    at: '2026-03-21T13:31:00Z',
    body: 'Diff report is attached. The mismatch band is narrow enough to keep batch eight bounded.',
  },
  {
    id: 'msg-meridian-3',
    threadId: 'thread-meridian-ops',
    author: 'Data Systems',
    authorType: 'operator',
    at: '2026-03-21T13:33:00Z',
    body: 'Proceed with review-only posture for now. No rerun until the final batch completes.',
  },
  {
    id: 'msg-lighthouse-1',
    threadId: 'thread-lighthouse-watch',
    author: 'Kite',
    authorType: 'agent',
    at: '2026-03-21T13:28:00Z',
    body: 'Suppression expiry is approaching. Retry volume is still below baseline.',
  },
  {
    id: 'msg-lighthouse-2',
    threadId: 'thread-lighthouse-watch',
    author: 'Runtime Engineering',
    authorType: 'operator',
    at: '2026-03-21T13:39:00Z',
    body: 'Continue watch mode only. Decision remains inspect-first until the last sample clears.',
  },
  {
    id: 'msg-echo-1',
    threadId: 'thread-echo-queue',
    author: 'System',
    authorType: 'system',
    at: '2026-03-21T13:11:00Z',
    body: 'Queued plan marked stale after 19 hours without refresh.',
  },
  {
    id: 'msg-echo-2',
    threadId: 'thread-echo-queue',
    author: 'Ember',
    authorType: 'agent',
    at: '2026-03-21T13:21:00Z',
    body: 'Still waiting for indexing lane capacity. No execution has started.',
  },
  {
    id: 'msg-orbit-1',
    threadId: 'thread-orbit-release',
    author: 'Rhea',
    authorType: 'agent',
    at: '2026-03-21T09:54:00Z',
    body: 'Validation checks passed. Signing stage completed cleanly.',
  },
  {
    id: 'msg-orbit-2',
    threadId: 'thread-orbit-release',
    author: 'Release Engineering',
    authorType: 'operator',
    at: '2026-03-21T10:02:00Z',
    body: 'Package published and handed off downstream. Thread remains read-only for audit context.',
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
    motion: 'Standby capacity moved from warm-up to ready state for Atlas validation.',
    runId: 'run-atlas',
    alertId: 'alert-gateway-saturation',
    agentId: 'agent-sable',
    sessionId: 'session-atlas-main',
    threadId: 'thread-atlas-cutover',
  },
  {
    id: 'event-meridian-diff',
    title: 'Diff report attached to replay',
    kind: 'Data',
    severity: 'warning',
    actor: 'Replay Monitor',
    at: '2026-03-21T13:31:00Z',
    description: 'A mismatch report was attached to Meridian batch six for operator review.',
    motion: 'Replay inspection deepened from throughput watch into bounded diff review.',
    runId: 'run-meridian',
    artifactId: 'artifact-meridian-diff',
    alertId: 'alert-backfill-drift',
    agentId: 'agent-ivy',
    sessionId: 'session-meridian-replay',
    threadId: 'thread-meridian-ops',
  },
  {
    id: 'event-lighthouse-canary',
    title: 'Retry rate improved on canary',
    kind: 'Runtime',
    severity: 'normal',
    actor: 'Runtime Engineering',
    at: '2026-03-21T13:27:00Z',
    description: 'Retry volume stayed below baseline for the last 25 minutes of canary observation.',
    motion: 'Canary moved toward hold-steady watch rather than rollback escalation.',
    runId: 'run-lighthouse',
    artifactId: 'artifact-lighthouse-notes',
    agentId: 'agent-kite',
    sessionId: 'session-lighthouse-canary',
    threadId: 'thread-lighthouse-watch',
  },
  {
    id: 'event-atlas-brief',
    title: 'Cutover brief updated',
    kind: 'Artifact',
    severity: 'warning',
    actor: 'Ops Control',
    at: '2026-03-21T13:36:00Z',
    description: 'Rollback timing and operator paging notes were revised in the cutover brief.',
    motion: 'Cutover execution notes were tightened before customer-facing action.',
    runId: 'run-atlas',
    artifactId: 'artifact-cutover-brief',
    agentId: 'agent-rhea',
    sessionId: 'session-atlas-main',
    threadId: 'thread-atlas-cutover',
  },
  {
    id: 'event-feed-delay',
    title: 'Activity feed delay detected',
    kind: 'Control Plane',
    severity: 'normal',
    actor: 'Ingest Watcher',
    at: '2026-03-21T13:18:00Z',
    description: 'Feed ingest is running 38 seconds behind during the current traffic peak.',
    motion: 'Timeline freshness dipped slightly, but operator visibility remains within tolerance.',
    alertId: 'alert-feed-latency',
    threadId: 'thread-atlas-cutover',
  },
  {
    id: 'event-echo-queued',
    title: 'Index refresh remains queued',
    kind: 'Queue',
    severity: 'warning',
    actor: 'Knowledge Systems',
    at: '2026-03-21T13:21:00Z',
    description: 'Echo index refresh is still waiting for a free execution lane.',
    motion: 'Execution stayed parked in queue watch instead of advancing into live work.',
    runId: 'run-echo',
    artifactId: 'artifact-echo-plan',
    agentId: 'agent-ember',
    sessionId: 'session-echo-queue',
    threadId: 'thread-echo-queue',
  },
  {
    id: 'event-orbit-packaged',
    title: 'Orbit package published',
    kind: 'Release',
    severity: 'normal',
    actor: 'Release Engineering',
    at: '2026-03-21T10:02:00Z',
    description: 'Signed release package was published and handed off to downstream consumers.',
    motion: 'The run exited active execution and shifted into release handoff.',
    runId: 'run-orbit',
    artifactId: 'artifact-orbit-bundle',
    agentId: 'agent-rhea',
    sessionId: 'session-orbit-release',
    threadId: 'thread-orbit-release',
  },
]

export function getPhase1APanel(segment?: string | null): Phase1APanel {
  if (
    segment === 'runs' ||
    segment === 'artifacts' ||
    segment === 'health' ||
    segment === 'activity' ||
    segment === 'agents' ||
    segment === 'threads'
  ) {
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
  selection?: { key: 'run' | 'artifact' | 'alert' | 'event' | 'agent' | 'thread' | 'session'; value: string }
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
    ? resolveSelectedRun(searchParams)
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
  const selectedAgent = panel === 'agents'
    ? agents.find((agent) => agent.id === getQueryParam(searchParams, 'agent')) ?? agents[0]
    : null
  const selectedThread = panel === 'threads'
    ? threads.find((thread) => thread.id === getQueryParam(searchParams, 'thread')) ?? threads[0]
    : null
  const selectedSession = selectedRun ? getRunSession(selectedRun.id) : selectedThread?.sessionId ? getSessionById(selectedThread.sessionId) : null
  const selectedThreadMessages = selectedThread ? getThreadMessages(selectedThread.id) : []

  const stats = {
    activeRuns: runs.filter((run) => run.status === 'active').length,
    blockedRuns: runs.filter((run) => run.status === 'blocked').length,
    criticalAlerts: alerts.filter((alert) => alert.severity === 'critical' && alert.state !== 'resolved').length,
    reviewArtifacts: artifacts.filter((artifact) => artifact.status === 'review').length,
    staleArtifacts: artifacts.filter((artifact) => artifact.status === 'stale').length,
    recentCriticalActivity: activity.filter((event) => event.severity === 'critical').length,
    engagedAgents: agents.filter((agent) => agent.status !== 'idle').length,
    liveThreads: threads.filter((thread) => thread.state === 'live').length,
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
    selectedAgent,
    selectedThread,
    selectedSession,
    selectedThreadMessages,
    runs,
    artifacts,
    alerts,
    activity,
    agents,
    sessions,
    threads,
    attentionItems,
    stats,
  }
}

function resolveSelectedRun(searchParams: SearchParamMap): RunRecord {
  const runId = getQueryParam(searchParams, 'run')
  const sessionId = getQueryParam(searchParams, 'session')
  const agentId = getQueryParam(searchParams, 'agent')
  const threadId = getQueryParam(searchParams, 'thread')

  return (
    runs.find((run) => run.id === runId) ??
    runs.find((run) => run.sessionId === sessionId) ??
    runs.find((run) => run.agentIds.includes(agentId ?? '')) ??
    runs.find((run) => run.threadId === threadId) ??
    runs[0]
  )
}

export function getRunArtifacts(runId: string): ArtifactRecord[] {
  return artifacts.filter((artifact) => artifact.runId === runId)
}

export function getRunActivity(runId: string): ActivityRecord[] {
  return activity.filter((event) => event.runId === runId)
}

export function getRunAlerts(runId: string): AlertRecord[] {
  return alerts.filter((alert) => alert.runId === runId)
}

export function getRunAgents(runId: string): AgentRecord[] {
  return agents.filter((agent) => agent.currentRunId === runId)
}

export function getRunSession(runId: string): SessionRecord | null {
  return sessions.find((session) => session.runId === runId) ?? null
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

export function getAgentById(agentId: string): AgentRecord | null {
  return agents.find((agent) => agent.id === agentId) ?? null
}

export function getAgentActivity(agentId: string): ActivityRecord[] {
  return activity.filter((event) => event.agentId === agentId)
}

export function getAgentRun(agentId: string): RunRecord | null {
  return runs.find((run) => run.agentIds.includes(agentId)) ?? null
}

export function getSessionById(sessionId: string): SessionRecord | null {
  return sessions.find((session) => session.id === sessionId) ?? null
}

export function getThreadById(threadId: string): ThreadRecord | null {
  return threads.find((thread) => thread.id === threadId) ?? null
}

export function getThreadMessages(threadId: string): ThreadMessageRecord[] {
  return threadMessages.filter((message) => message.threadId === threadId)
}

export function getThreadActivity(threadId: string): ActivityRecord[] {
  return activity.filter((event) => event.threadId === threadId)
}
