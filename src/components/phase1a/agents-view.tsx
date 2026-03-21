import type { Phase1AViewModel } from '@/lib/phase1a-data'
import {
  buildPhase1aHref,
  getAgentActivity,
  getAgentRun,
  getRunArtifacts,
  getSessionById,
  getThreadById,
} from '@/lib/phase1a-data'
import { CardHeader, DefinitionList, PhaseCard, SelectionLink, StatusBadge, formatTimestamp } from './primitives'

export function AgentsView({ model }: { model: Phase1AViewModel }) {
  const selectedAgent = model.selectedAgent
  if (!selectedAgent) return null

  const run = getAgentRun(selectedAgent.id)
  const session = selectedAgent.sessionId ? getSessionById(selectedAgent.sessionId) : null
  const thread = selectedAgent.threadId ? getThreadById(selectedAgent.threadId) : null
  const relatedActivity = getAgentActivity(selectedAgent.id)
  const relatedArtifacts = run ? getRunArtifacts(run.id).filter((artifact) => selectedAgent.artifactIds.includes(artifact.id)) : []

  return (
    <div className="grid gap-6 xl:grid-cols-[0.88fr_1.12fr]">
      <PhaseCard>
        <CardHeader eyebrow="Agents" title="Operator-visible agents" detail={`${model.agents.length} visible`} />
        <div className="grid gap-3 p-5">
          {model.agents.map((agent) => (
            <SelectionLink
              key={agent.id}
              href={buildPhase1aHref('agents', { key: 'agent', value: agent.id })}
              active={agent.id === selectedAgent.id}
              title={agent.name}
              meta={`${agent.role} • ${agent.owner} • Seen ${formatTimestamp(agent.lastSeenAt)}`}
              badge={
                <StatusBadge tone={agent.status === 'engaged' ? 'active' : agent.status === 'monitoring' ? 'info' : 'neutral'}>
                  {agent.status}
                </StatusBadge>
              }
            />
          ))}
        </div>
      </PhaseCard>

      <div className="grid gap-6">
        <PhaseCard>
          <CardHeader eyebrow="Selected agent" title={selectedAgent.name} detail={`${selectedAgent.role} • ${selectedAgent.owner}`} />
          <div className="grid gap-5 p-5">
            <div className="flex flex-wrap items-center gap-3">
              <StatusBadge tone={selectedAgent.status === 'engaged' ? 'active' : selectedAgent.status === 'monitoring' ? 'info' : 'neutral'}>
                {selectedAgent.status}
              </StatusBadge>
              <div className="text-xs text-muted-foreground">Last seen {formatTimestamp(selectedAgent.lastSeenAt)}</div>
            </div>
            <DefinitionList
              items={[
                { label: 'Current focus', value: selectedAgent.focus },
                { label: 'Linked run', value: run ? run.name : 'No active run' },
                { label: 'Live session', value: session ? session.label : 'None' },
                { label: 'Thread visibility', value: thread ? `${thread.channel} (${thread.state})` : 'None' },
              ]}
            />
            <div className="rounded-xl border border-border/70 bg-background/20 p-4">
              <div className="text-2xs uppercase tracking-[0.16em] text-muted-foreground">Summary</div>
              <p className="mt-2 text-sm leading-6 text-foreground/90">{selectedAgent.summary}</p>
            </div>
          </div>
        </PhaseCard>

        <div className="grid gap-6 lg:grid-cols-2">
          <PhaseCard>
            <CardHeader eyebrow="Linked context" title="Run, session, and thread" detail="Cross-linked inspection" />
            <div className="grid gap-3 p-5">
              {run ? (
                <SelectionLink
                  href={buildPhase1aHref('runs', { key: 'agent', value: selectedAgent.id })}
                  title={run.name}
                  meta={`${run.stage} • ${run.duration}`}
                  badge={<StatusBadge tone={run.status === 'blocked' ? 'critical' : run.status === 'active' ? 'active' : run.status === 'completed' ? 'completed' : 'warning'}>{run.status}</StatusBadge>}
                />
              ) : null}
              {thread ? (
                <SelectionLink
                  href={buildPhase1aHref('threads', { key: 'thread', value: thread.id })}
                  title={thread.title}
                  meta={`${thread.channel} • Updated ${formatTimestamp(thread.lastMessageAt)}`}
                  badge={<StatusBadge tone={thread.state === 'live' ? 'active' : thread.state === 'watch' ? 'info' : 'neutral'}>{thread.state}</StatusBadge>}
                />
              ) : null}
              {session ? (
                <SelectionLink
                  href={buildPhase1aHref('runs', { key: 'session', value: session.id })}
                  title={session.label}
                  meta={`${session.kind} • ${session.terminal}`}
                  badge={<StatusBadge tone={session.state === 'streaming' ? 'active' : session.state === 'watching' ? 'info' : 'neutral'}>{session.state}</StatusBadge>}
                />
              ) : null}
            </div>
          </PhaseCard>

          <PhaseCard>
            <CardHeader eyebrow="Outputs and motion" title="What this agent is touching" detail="Read-only visibility" />
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
              {relatedActivity.slice(0, 2).map((event) => (
                <SelectionLink
                  key={event.id}
                  href={buildPhase1aHref('activity', { key: 'event', value: event.id })}
                  title={event.title}
                  meta={`${event.motion} • ${formatTimestamp(event.at)}`}
                  badge={<StatusBadge tone={event.severity === 'critical' ? 'critical' : event.severity === 'warning' ? 'warning' : 'neutral'}>{event.severity}</StatusBadge>}
                />
              ))}
            </div>
          </PhaseCard>
        </div>
      </div>
    </div>
  )
}
