import { z } from 'zod';
import type { ToolDefinition, ToolExecutionContext } from '../../engine/types.js';
import { db, agents, eq } from '@ai-office/db';

export const updateMyScheduleTool: ToolDefinition = {
  name: 'update_my_schedule',
  description:
    'Update your own heartbeat schedule. You can set the interval in minutes (min 5, max 1440 = 24h), ' +
    'or disable heartbeat entirely. This controls how often you wake up to check on things.',
  inputSchema: z.object({
    intervalMin: z
      .number()
      .int()
      .min(5)
      .max(1440)
      .optional()
      .describe('Heartbeat interval in minutes (5-1440). Omit to keep current.'),
    disable: z
      .boolean()
      .optional()
      .describe('Set to true to disable heartbeat entirely'),
  }),
  requiresApproval: false,
  execute: async (input: unknown, context: ToolExecutionContext) => {
    const { intervalMin, disable } = input as { intervalMin?: number; disable?: boolean };

    if (disable) {
      await db
        .update(agents)
        .set({ heartbeatIntervalMin: null })
        .where(eq(agents.id, context.agentId));
      return { updated: true, heartbeatDisabled: true };
    }

    if (intervalMin !== undefined) {
      if (intervalMin < 5 || intervalMin > 1440) {
        return { error: 'intervalMin must be between 5 and 1440' };
      }
      await db
        .update(agents)
        .set({ heartbeatIntervalMin: intervalMin })
        .where(eq(agents.id, context.agentId));
      return { updated: true, intervalMin };
    }

    return { error: 'Provide intervalMin or set disable: true' };
  },
};
