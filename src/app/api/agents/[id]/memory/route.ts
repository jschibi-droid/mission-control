import { NextRequest, NextResponse } from 'next/server';
import { getDatabase, db_helpers } from '@/lib/db';
import { requireRole } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { ensureWorkingMemoryColumn, readPersistedWorkingMemory, writePersistedWorkingMemory } from '@/lib/agent-memory';

/**
 * GET /api/agents/[id]/memory - Get agent's working memory
 * 
 * Working memory is stored in the agents.working_memory DB column.
 * This endpoint is per-agent scratchpad memory (not the global Memory Browser filesystem view).
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = requireRole(request, 'viewer');
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const db = getDatabase();
    const resolvedParams = await params;
    const agentId = resolvedParams.id;
    const workspaceId = auth.user.workspace_id ?? 1;
    
    // Get agent by ID or name
    let agent: any;
    if (isNaN(Number(agentId))) {
      agent = db.prepare('SELECT * FROM agents WHERE name = ? AND workspace_id = ?').get(agentId, workspaceId);
    } else {
      agent = db.prepare('SELECT * FROM agents WHERE id = ? AND workspace_id = ?').get(Number(agentId), workspaceId);
    }
    
    if (!agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }
    
    ensureWorkingMemoryColumn(db);

    const memoryStmt = db.prepare(`SELECT working_memory FROM agents WHERE ${isNaN(Number(agentId)) ? 'name' : 'id'} = ? AND workspace_id = ?`);
    const result = memoryStmt.get(agentId, workspaceId) as any;
    const persisted = readPersistedWorkingMemory({
      name: agent.name,
      config: agent.config,
      working_memory: result?.working_memory || '',
    });
    const workingMemory = persisted.workingMemory;
    const source = persisted.source;
    
    return NextResponse.json({
      agent: {
        id: agent.id,
        name: agent.name,
        role: agent.role
      },
      working_memory: workingMemory,
      source,
      updated_at: agent.updated_at,
      size: workingMemory.length
    });
  } catch (error) {
    logger.error({ err: error }, 'GET /api/agents/[id]/memory error');
    return NextResponse.json({ error: 'Failed to fetch working memory' }, { status: 500 });
  }
}

/**
 * PUT /api/agents/[id]/memory - Update agent's working memory
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = requireRole(request, 'operator');
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const db = getDatabase();
    const resolvedParams = await params;
    const agentId = resolvedParams.id;
    const workspaceId = auth.user.workspace_id ?? 1;
    const body = await request.json();
    const { working_memory, append } = body;
    
    // Get agent by ID or name
    let agent: any;
    if (isNaN(Number(agentId))) {
      agent = db.prepare('SELECT * FROM agents WHERE name = ? AND workspace_id = ?').get(agentId, workspaceId);
    } else {
      agent = db.prepare('SELECT * FROM agents WHERE id = ? AND workspace_id = ?').get(Number(agentId), workspaceId);
    }
    
    if (!agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }
    
    ensureWorkingMemoryColumn(db);

    let newContent = working_memory || '';
    
    // Handle append mode
    if (append) {
      const currentStmt = db.prepare(`SELECT working_memory FROM agents WHERE ${isNaN(Number(agentId)) ? 'name' : 'id'} = ? AND workspace_id = ?`);
      const current = currentStmt.get(agentId, workspaceId) as any;
      const persisted = readPersistedWorkingMemory({
        name: agent.name,
        config: agent.config,
        working_memory: current?.working_memory || '',
      });
      const currentContent = persisted.workingMemory;
      
      // Add timestamp and append
      const timestamp = new Date().toISOString();
      newContent = currentContent + (currentContent ? '\n\n' : '') + 
                   `## ${timestamp}\n${working_memory}`;
    }
    
    const now = Math.floor(Date.now() / 1000);

    // Best effort: sync workspace WORKING.md if agent workspace is configured
    let savedToWorkspace = false;
    try {
      const persisted = readPersistedWorkingMemory({
        name: agent.name,
        config: agent.config,
        working_memory: '',
      });
      savedToWorkspace = writePersistedWorkingMemory(persisted.workspaceCandidates, newContent);
    } catch (err) {
      logger.warn({ err, agent: agent.name }, 'Failed to write WORKING.md to workspace');
    }
    
    // Update working memory
    const updateStmt = db.prepare(`
      UPDATE agents 
      SET working_memory = ?, updated_at = ?
      WHERE ${isNaN(Number(agentId)) ? 'name' : 'id'} = ? AND workspace_id = ?
    `);
    
    updateStmt.run(newContent, now, agentId, workspaceId);
    
    // Log activity
    db_helpers.logActivity(
      'agent_memory_updated',
      'agent',
      agent.id,
      agent.name,
      `Working memory ${append ? 'appended' : 'updated'} for agent ${agent.name}`,
      {
        content_length: newContent.length,
        append_mode: append || false,
        timestamp: now,
        saved_to_workspace: savedToWorkspace
      },
      workspaceId
    );
    
    return NextResponse.json({
      success: true,
      message: `Working memory ${append ? 'appended' : 'updated'} for ${agent.name}`,
      working_memory: newContent,
      saved_to_workspace: savedToWorkspace,
      updated_at: now,
      size: newContent.length
    });
  } catch (error) {
    logger.error({ err: error }, 'PUT /api/agents/[id]/memory error');
    return NextResponse.json({ error: 'Failed to update working memory' }, { status: 500 });
  }
}

/**
 * DELETE /api/agents/[id]/memory - Clear agent's working memory
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = requireRole(request, 'operator');
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const db = getDatabase();
    const resolvedParams = await params;
    const agentId = resolvedParams.id;
    const workspaceId = auth.user.workspace_id ?? 1;

    // Get agent by ID or name
    let agent: any;
    if (isNaN(Number(agentId))) {
      agent = db.prepare('SELECT * FROM agents WHERE name = ? AND workspace_id = ?').get(agentId, workspaceId);
    } else {
      agent = db.prepare('SELECT * FROM agents WHERE id = ? AND workspace_id = ?').get(Number(agentId), workspaceId);
    }
    
    if (!agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }
    
    const now = Math.floor(Date.now() / 1000);

    // Best effort: clear workspace WORKING.md if agent workspace is configured
    try {
      const persisted = readPersistedWorkingMemory({
        name: agent.name,
        config: agent.config,
        working_memory: '',
      });
      writePersistedWorkingMemory(persisted.workspaceCandidates, '');
    } catch (err) {
      logger.warn({ err, agent: agent.name }, 'Failed to clear WORKING.md in workspace');
    }
    
    // Clear working memory
    const updateStmt = db.prepare(`
      UPDATE agents 
      SET working_memory = '', updated_at = ?
      WHERE ${isNaN(Number(agentId)) ? 'name' : 'id'} = ? AND workspace_id = ?
    `);
    
    updateStmt.run(now, agentId, workspaceId);
    
    // Log activity
    db_helpers.logActivity(
      'agent_memory_cleared',
      'agent',
      agent.id,
      agent.name,
      `Working memory cleared for agent ${agent.name}`,
      { timestamp: now },
      workspaceId
    );
    
    return NextResponse.json({
      success: true,
      message: `Working memory cleared for ${agent.name}`,
      working_memory: '',
      updated_at: now
    });
  } catch (error) {
    logger.error({ err: error }, 'DELETE /api/agents/[id]/memory error');
    return NextResponse.json({ error: 'Failed to clear working memory' }, { status: 500 });
  }
}
