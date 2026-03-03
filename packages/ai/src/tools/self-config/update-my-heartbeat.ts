import { z } from 'zod';
import type { ToolDefinition, ToolExecutionContext } from '../../engine/types.js';
import { db, agents, agentHeartbeatHistory, eq, sql } from '@ai-office/db';

const MAX_INSTRUCTIONS_LENGTH = 500;
const MAX_CALLS_PER_SESSION = 3;
const callCounts = new Map<string, number>();

export const updateMyHeartbeatTool: ToolDefinition = {
  name: 'update_my_heartbeat',
  description:
    'Update your own heartbeat instructions. These instructions are what you will see next time you wake up from a heartbeat. ' +
    'Use this to self-program future behavior — e.g., "Check sales dashboard for anomalies" or "Follow up on pending support tickets."',
  inputSchema: z.object({
    instructions: z
      .string()
      .max(MAX_INSTRUCTIONS_LENGTH)
      .describe('The new heartbeat instructions (max 500 chars). What should you do next time you wake up?'),
  }),
  requiresApproval: false,
  execute: async (input: unknown, context: ToolExecutionContext) => {
    const { instructions } = input as { instructions: string };

    // Rate limit: max 3 calls per session
    const key = `${context.agentId}:${context.sessionId}`;
    const calls = callCounts.get(key) ?? 0;
    if (calls >= MAX_CALLS_PER_SESSION) {
      return { error: `Rate limit: max ${MAX_CALLS_PER_SESSION} heartbeat updates per session` };
    }
    callCounts.set(key, calls + 1);

    // Get current instructions for history
    const [current] = await db
      .select({ heartbeatInstructions: agents.heartbeatInstructions })
      .from(agents)
      .where(eq(agents.id, context.agentId))
      .limit(1);

    // Update agent heartbeat instructions
    await db
      .update(agents)
      .set({ heartbeatInstructions: instructions })
      .where(eq(agents.id, context.agentId));

    // Insert history entry
    await db.insert(agentHeartbeatHistory).values({
      agentId: context.agentId,
      instructions,
      previousInstructions: current?.heartbeatInstructions ?? null,
      changedBySessionId: context.sessionId,
    });

    // Cap history at 20 entries per agent (delete oldest)
    await db.execute(sql`
      DELETE FROM agent_heartbeat_history
      WHERE id IN (
        SELECT id FROM agent_heartbeat_history
        WHERE agent_id = ${context.agentId}
        ORDER BY changed_at DESC
        OFFSET 20
      )
    `);

    return {
      updated: true,
      instructions,
      previousInstructions: current?.heartbeatInstructions ?? null,
    };
  },
};
