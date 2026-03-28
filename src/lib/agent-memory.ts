import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'
import { resolveWithin } from '@/lib/paths'
import { getAgentWorkspaceCandidates, readAgentWorkspaceFile } from '@/lib/agent-workspace'

export function ensureWorkingMemoryColumn(db: any) {
  const columns = db.prepare('PRAGMA table_info(agents)').all() as Array<{ name?: string }>
  const hasWorkingMemory = columns.some((col) => col.name === 'working_memory')
  if (!hasWorkingMemory) {
    db.exec("ALTER TABLE agents ADD COLUMN working_memory TEXT DEFAULT ''")
  }
}

export function readPersistedWorkingMemory(agent: { config?: string | null; name: string; working_memory?: string | null }) {
  let workspaceCandidates: string[] = []
  try {
    const agentConfig = agent.config ? JSON.parse(agent.config) : {}
    workspaceCandidates = getAgentWorkspaceCandidates(agentConfig, agent.name)
    const match = readAgentWorkspaceFile(workspaceCandidates, ['WORKING.md', 'working.md', 'MEMORY.md', 'memory.md'])
    if (match.exists) {
      return {
        workingMemory: match.content,
        source: 'workspace' as const,
        workspaceCandidates,
        workspacePath: match.path,
      }
    }
  } catch {
    // fall back to db value
  }

  const workingMemory = agent.working_memory || ''
  return {
    workingMemory,
    source: workingMemory ? ('database' as const) : ('none' as const),
    workspaceCandidates,
    workspacePath: null,
  }
}

export function writePersistedWorkingMemory(workspaceCandidates: string[], workingMemory: string): boolean {
  const safeWorkspace = workspaceCandidates[0]
  if (!safeWorkspace) return false
  const safeWorkingPath = resolveWithin(safeWorkspace, 'WORKING.md')
  mkdirSync(dirname(safeWorkingPath), { recursive: true })
  writeFileSync(safeWorkingPath, workingMemory, 'utf-8')
  return true
}
