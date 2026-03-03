import { z } from 'zod';
import type { ToolDefinition, ToolExecutionContext } from '../../engine/types.js';
import { db, actionLogs, agents, eq, and, gte, sql } from '@ai-office/db';

export const searchActionLogsTool: ToolDefinition = {
  name: 'search_action_logs',
  description:
    'Search agent action logs with filters. Returns recent actions taken by agents.',
  inputSchema: z.object({
    agentId: z.string().optional().describe('Filter by specific agent ID'),
    status: z.enum(['pending', 'completed', 'failed', 'cancelled']).optional().describe('Filter by action status'),
    actionType: z.string().optional().describe('Filter by action type (e.g., "tool_call", "llm_response")'),
    limit: z.number().int().min(1).max(100).optional().describe('Max results (default: 20)'),
  }),
  requiresApproval: false,
  execute: async (input: unknown, context: ToolExecutionContext) => {
    const { agentId, status, actionType, limit = 20 } = input as {
      agentId?: string;
      status?: string;
      actionType?: string;
      limit?: number;
    };

    const conditions = [eq(actionLogs.projectId, context.projectId)];
    if (agentId) conditions.push(eq(actionLogs.agentId, agentId));
    if (status) conditions.push(eq(actionLogs.status, status as any));
    if (actionType) conditions.push(eq(actionLogs.actionType, actionType));

    const logs = await db
      .select({
        id: actionLogs.id,
        agentId: actionLogs.agentId,
        sessionId: actionLogs.sessionId,
        actionType: actionLogs.actionType,
        toolName: actionLogs.toolName,
        status: actionLogs.status,
        costUsd: actionLogs.costUsd,
        createdAt: actionLogs.createdAt,
      })
      .from(actionLogs)
      .where(and(...conditions))
      .orderBy(sql`${actionLogs.createdAt} DESC`)
      .limit(limit);

    return {
      resultCount: logs.length,
      logs: logs.map((l) => ({
        id: l.id,
        agentId: l.agentId,
        sessionId: l.sessionId,
        actionType: l.actionType,
        toolName: l.toolName,
        status: l.status,
        costUsd: l.costUsd ? Number(l.costUsd) : null,
        createdAt: l.createdAt?.toISOString(),
      })),
    };
  },
};
