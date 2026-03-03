import { z } from 'zod';
import type { ToolDefinition, ToolExecutionContext } from '../../engine/types.js';
import { db, agents, eq, and } from '@ai-office/db';

export const pauseAgentsByTeamTool: ToolDefinition = {
  name: 'pause_agents_by_team',
  description:
    'Pause (deactivate) all agents in a specific team. Requires approval. CEO-only tool.',
  inputSchema: z.object({
    team: z
      .enum(['development', 'research', 'marketing', 'sales', 'support', 'finance', 'operations'])
      .describe('The team to pause'),
    reason: z.string().optional().describe('Reason for pausing'),
  }),
  requiresApproval: true,
  execute: async (input: unknown, context: ToolExecutionContext) => {
    const { team, reason } = input as { team: string; reason?: string };

    const result = await db
      .update(agents)
      .set({ isActive: false })
      .where(
        and(
          eq(agents.projectId, context.projectId),
          eq(agents.team, team as any),
          eq(agents.isActive, true),
          eq(agents.isSystemAgent, false),
        ),
      )
      .returning({ id: agents.id, name: agents.name });

    return {
      paused: true,
      team,
      agentsPaused: result.length,
      agents: result.map((a) => ({ id: a.id, name: a.name })),
      reason: reason ?? null,
    };
  },
};

export const resumeAgentsByTeamTool: ToolDefinition = {
  name: 'resume_agents_by_team',
  description:
    'Resume (reactivate) all agents in a specific team. CEO-only tool.',
  inputSchema: z.object({
    team: z
      .enum(['development', 'research', 'marketing', 'sales', 'support', 'finance', 'operations'])
      .describe('The team to resume'),
  }),
  requiresApproval: false,
  execute: async (input: unknown, context: ToolExecutionContext) => {
    const { team } = input as { team: string };

    const result = await db
      .update(agents)
      .set({ isActive: true, status: 'idle' })
      .where(
        and(
          eq(agents.projectId, context.projectId),
          eq(agents.team, team as any),
          eq(agents.isActive, false),
        ),
      )
      .returning({ id: agents.id, name: agents.name });

    return {
      resumed: true,
      team,
      agentsResumed: result.length,
      agents: result.map((a) => ({ id: a.id, name: a.name })),
    };
  },
};
