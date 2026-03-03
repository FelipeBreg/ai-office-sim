import { z } from 'zod';
import type { ToolDefinition, ToolExecutionContext } from '../../engine/types.js';
import { db, strategyKpis, eq, and, gte } from '@ai-office/db';

export const getKpiTrendsTool: ToolDefinition = {
  name: 'get_kpi_trends',
  description:
    'Get current KPI values and targets. Returns all monitored KPIs with their current vs target values and progress percentage.',
  inputSchema: z.object({
    kpiId: z.string().optional().describe('Specific KPI ID (optional — omit for all KPIs)'),
  }),
  requiresApproval: false,
  execute: async (input: unknown, context: ToolExecutionContext) => {
    const { kpiId } = input as { kpiId?: string };

    const conditions = [eq(strategyKpis.projectId, context.projectId)];
    if (kpiId) conditions.push(eq(strategyKpis.id, kpiId));

    const kpis = await db
      .select({
        id: strategyKpis.id,
        name: strategyKpis.name,
        currentValue: strategyKpis.currentValue,
        targetValue: strategyKpis.targetValue,
        unit: strategyKpis.unit,
        direction: strategyKpis.direction,
        isMonitored: strategyKpis.isMonitored,
        updatedAt: strategyKpis.updatedAt,
      })
      .from(strategyKpis)
      .where(and(...conditions));

    const trends = kpis.map((kpi) => {
      const current = Number(kpi.currentValue ?? 0);
      const target = Number(kpi.targetValue ?? 0);
      const pct = target > 0 ? Math.round((current / target) * 100) : 0;
      return {
        id: kpi.id,
        name: kpi.name,
        current,
        target,
        unit: kpi.unit,
        progressPct: pct,
        direction: kpi.direction,
        monitored: kpi.isMonitored,
        lastUpdated: kpi.updatedAt?.toISOString(),
      };
    });

    return { kpiCount: trends.length, kpis: trends };
  },
};
