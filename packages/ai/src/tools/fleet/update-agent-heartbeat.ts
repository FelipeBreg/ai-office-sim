import { z } from 'zod';
import type { ToolDefinition, ToolExecutionContext } from '../../engine/types.js';
import { db, agents, agentHeartbeatHistory, eq, and, sql } from '@ai-office/db';

export const updateAgentHeartbeatTool: ToolDefinition = {
  name: 'update_agent_heartbeat',
  description:
    'Rewrite another agent\'s heartbeat instructions. Requires approval (high impact). CEO-only tool.',
  inputSchema: z.object({
    agentId: z.string().describe('The agent ID to update'),
    instructions: z.string().max(500).describe('New heartbeat instructions (max 500 chars)'),
  }),
  requiresApproval: true,
  execute: async (input: unknown, context: ToolExecutionContext) => {
    const { agentId, instructions } = input as { agentId: string; instructions: string };

    const [agent] = await db
      .select({ id: agents.id, name: agents.name, heartbeatInstructions: agents.heartbeatInstructions })
      .from(agents)
      .where(and(eq(agents.id, agentId), eq(agents.projectId, context.projectId)))
      .limit(1);

    if (!agent) return { error: 'Agent not found in this project' };

    await db.update(agents).set({ heartbeatInstructions: instructions }).where(eq(agents.id, agentId));

    // Log change to history
    await db.insert(agentHeartbeatHistory).values({
      agentId,
      instructions,
      previousInstructions: agent.heartbeatInstructions,
      changedBySessionId: context.sessionId,
    });

    // Cap history
    await db.execute(sql`
      DELETE FROM agent_heartbeat_history
      WHERE id IN (
        SELECT id FROM agent_heartbeat_history
        WHERE agent_id = ${agentId}
        ORDER BY changed_at DESC
        OFFSET 20
      )
    `);

    return {
      updated: true,
      agentId,
      agentName: agent.name,
      instructions,
      previousInstructions: agent.heartbeatInstructions,
    };
  },
};
