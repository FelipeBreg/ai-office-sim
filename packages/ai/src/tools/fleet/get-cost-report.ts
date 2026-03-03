import { z } from 'zod';
import type { ToolDefinition, ToolExecutionContext } from '../../engine/types.js';
import { db, actionLogs, agents, eq, and, gte, sql } from '@ai-office/db';

export const getCostReportTool: ToolDefinition = {
  name: 'get_cost_report',
  description:
    'Get a cost report showing daily and weekly spend across all agents, with per-agent breakdown.',
  inputSchema: z.object({
    days: z.number().int().min(1).max(30).optional().describe('Number of days to report (default: 7)'),
  }),
  requiresApproval: false,
  execute: async (input: unknown, context: ToolExecutionContext) => {
    const { days = 7 } = input as { days?: number };
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // Total spend
    const [total] = await db
      .select({
        totalCost: sql<number>`coalesce(sum(${actionLogs.costUsd}::numeric), 0)`,
        totalActions: sql<number>`count(*)`,
      })
      .from(actionLogs)
      .where(and(eq(actionLogs.projectId, context.projectId), gte(actionLogs.createdAt, since)));

    // Per-agent breakdown
    const perAgent = await db
      .select({
        agentId: actionLogs.agentId,
        agentName: agents.name,
        totalCost: sql<number>`coalesce(sum(${actionLogs.costUsd}::numeric), 0)`,
        actionCount: sql<number>`count(*)`,
      })
      .from(actionLogs)
      .innerJoin(agents, eq(actionLogs.agentId, agents.id))
      .where(and(eq(actionLogs.projectId, context.projectId), gte(actionLogs.createdAt, since)))
      .groupBy(actionLogs.agentId, agents.name)
      .orderBy(sql`sum(${actionLogs.costUsd}::numeric) DESC`);

    return {
      period: `Last ${days} days`,
      totalCostUsd: Number(total?.totalCost ?? 0),
      totalActions: Number(total?.totalActions ?? 0),
      perAgent: perAgent.map((a) => ({
        agentId: a.agentId,
        agentName: a.agentName,
        costUsd: Number(a.totalCost),
        actions: Number(a.actionCount),
      })),
    };
  },
};
