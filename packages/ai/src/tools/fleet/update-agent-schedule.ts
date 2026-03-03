import { z } from 'zod';
import type { ToolDefinition, ToolExecutionContext } from '../../engine/types.js';
import { db, agents, eq, and } from '@ai-office/db';

export const updateAgentScheduleTool: ToolDefinition = {
  name: 'update_agent_schedule',
  description:
    'Update another agent\'s heartbeat schedule. CEO-only tool for fleet management.',
  inputSchema: z.object({
    agentId: z.string().describe('The agent ID to update'),
    heartbeatIntervalMin: z
      .number()
      .int()
      .min(5)
      .max(1440)
      .optional()
      .describe('New heartbeat interval in minutes (5-1440)'),
    disable: z.boolean().optional().describe('Set to true to disable heartbeat'),
  }),
  requiresApproval: false,
  execute: async (input: unknown, context: ToolExecutionContext) => {
    const { agentId, heartbeatIntervalMin, disable } = input as {
      agentId: string;
      heartbeatIntervalMin?: number;
      disable?: boolean;
    };

    const [agent] = await db
      .select({ id: agents.id, name: agents.name })
      .from(agents)
      .where(and(eq(agents.id, agentId), eq(agents.projectId, context.projectId)))
      .limit(1);

    if (!agent) return { error: 'Agent not found in this project' };

    if (disable) {
      await db.update(agents).set({ heartbeatIntervalMin: null }).where(eq(agents.id, agentId));
      return { updated: true, agentId, agentName: agent.name, heartbeatDisabled: true };
    }

    if (heartbeatIntervalMin !== undefined) {
      await db.update(agents).set({ heartbeatIntervalMin }).where(eq(agents.id, agentId));
      return { updated: true, agentId, agentName: agent.name, heartbeatIntervalMin };
    }

    return { error: 'Provide heartbeatIntervalMin or set disable: true' };
  },
};
