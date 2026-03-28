import { beforeEach, describe, expect, it, vi } from 'vitest'

const {
  mockReadAgentWorkspaceFile,
  mockGetAgentWorkspaceCandidates,
  mockMkdirSync,
  mockWriteFileSync,
  mockResolveWithin,
} = vi.hoisted(() => ({
  mockReadAgentWorkspaceFile: vi.fn(),
  mockGetAgentWorkspaceCandidates: vi.fn(),
  mockMkdirSync: vi.fn(),
  mockWriteFileSync: vi.fn(),
  mockResolveWithin: vi.fn((base: string, name: string) => `${base}/${name}`),
}))

vi.mock('@/lib/agent-workspace', () => ({
  getAgentWorkspaceCandidates: mockGetAgentWorkspaceCandidates,
  readAgentWorkspaceFile: mockReadAgentWorkspaceFile,
}))

vi.mock('@/lib/paths', () => ({
  resolveWithin: mockResolveWithin,
}))

vi.mock('node:fs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:fs')>()
  return {
    ...actual,
    default: {
      ...actual,
      mkdirSync: mockMkdirSync,
      writeFileSync: mockWriteFileSync,
    },
    mkdirSync: mockMkdirSync,
    writeFileSync: mockWriteFileSync,
  }
})

import { ensureWorkingMemoryColumn, readPersistedWorkingMemory, writePersistedWorkingMemory } from '@/lib/agent-memory'

describe('agent-memory helpers', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('adds the working_memory column when missing', () => {
    const db = {
      prepare: vi.fn(() => ({ all: vi.fn(() => [{ name: 'id' }, { name: 'name' }]) })),
      exec: vi.fn(),
    }

    ensureWorkingMemoryColumn(db)

    expect(db.exec).toHaveBeenCalledWith("ALTER TABLE agents ADD COLUMN working_memory TEXT DEFAULT ''")
  })

  it('prefers workspace memory over the database snapshot', () => {
    mockGetAgentWorkspaceCandidates.mockReturnValue(['/tmp/agent'])
    mockReadAgentWorkspaceFile.mockReturnValue({ exists: true, content: 'workspace memory', path: '/tmp/agent/WORKING.md' })

    const result = readPersistedWorkingMemory({
      name: 'app-delivery',
      config: JSON.stringify({ workspace: '/tmp/agent' }),
      working_memory: 'db memory',
    })

    expect(result.workingMemory).toBe('workspace memory')
    expect(result.source).toBe('workspace')
    expect(result.workspaceCandidates).toEqual(['/tmp/agent'])
  })

  it('falls back to database memory when no workspace file exists', () => {
    mockGetAgentWorkspaceCandidates.mockReturnValue(['/tmp/agent'])
    mockReadAgentWorkspaceFile.mockReturnValue({ exists: false, content: '', path: null })

    const result = readPersistedWorkingMemory({
      name: 'app-delivery',
      config: JSON.stringify({ workspace: '/tmp/agent' }),
      working_memory: 'db memory',
    })

    expect(result.workingMemory).toBe('db memory')
    expect(result.source).toBe('database')
  })

  it('writes WORKING.md into the first workspace candidate', () => {
    const ok = writePersistedWorkingMemory(['/tmp/agent'], 'snapshot')

    expect(ok).toBe(true)
    expect(mockMkdirSync).toHaveBeenCalledWith('/tmp/agent', { recursive: true })
    expect(mockWriteFileSync).toHaveBeenCalledWith('/tmp/agent/WORKING.md', 'snapshot', 'utf-8')
  })
})
