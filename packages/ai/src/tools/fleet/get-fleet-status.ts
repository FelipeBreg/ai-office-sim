import { z } from 'zod';
import type { ToolDefinition, ToolExecutionContext } from '../../engine/types.js';
import { db, agents, eq, sql } from '@ai-office/db';

export const getFleetStatusTool: ToolDefinition = {
  name: 'get_fleet_status',
  description:
    'Get a summary of all agents in the project grouped by status: how many idle, working, error, offline, etc.',
  inputSchema: z.object({}),
  requiresApproval: false,
  execute: async (_input: unknown, context: ToolExecutionContext) => {
    const agentList = await db
      .select({
        id: agents.id,
        name: agents.name,
        status: agents.status,
        team: agents.team,
        archetype: agents.archetype,
        isActive: agents.isActive,
        isSystemAgent: agents.isSystemAgent,
        heartbeatIntervalMin: agents.heartbeatIntervalMin,
      })
      .from(agents)
      .where(eq(agents.projectId, context.projectId));

    const byStatus: Record<string, number> = {};
    const byTeam: Record<string, number> = {};
    for (const a of agentList) {
      byStatus[a.status] = (byStatus[a.status] ?? 0) + 1;
      if (a.team) byTeam[a.team] = (byTeam[a.team] ?? 0) + 1;
    }

    return {
      totalAgents: agentList.length,
      activeAgents: agentList.filter((a) => a.isActive).length,
      byStatus,
      byTeam,
      agents: agentList.map((a) => ({
        id: a.id,
        name: a.name,
        status: a.status,
        team: a.team,
        archetype: a.archetype,
        active: a.isActive,
        system: a.isSystemAgent,
        heartbeat: a.heartbeatIntervalMin ? `${a.heartbeatIntervalMin}min` : 'off',
      })),
    };
  },
};
