import { z } from 'zod';
import type { ToolDefinition, ToolExecutionContext } from '../../engine/types.js';
import { db, strategyKpis, eq, and } from '@ai-office/db';
import { checkKpiThreshold } from '../../triggers/kpi-monitor.js';

export const updateStrategyKpiTool: ToolDefinition = {
  name: 'update_strategy_kpi',
  description:
    'Update a strategy KPI current value. This can trigger linked agents/workflows if the KPI crosses its configured threshold.',
  inputSchema: z.object({
    kpiId: z.string().describe('The KPI ID to update'),
    value: z.number().describe('The new current value for this KPI'),
    note: z.string().optional().describe('Optional note explaining the update'),
  }),
  requiresApproval: false,
  execute: async (input: unknown, context: ToolExecutionContext) => {
    const { kpiId, value, note } = input as { kpiId: string; value: number; note?: string };

    // Verify KPI belongs to this project
    const [kpi] = await db
      .select({ id: strategyKpis.id, name: strategyKpis.name, currentValue: strategyKpis.currentValue })
      .from(strategyKpis)
      .where(and(eq(strategyKpis.id, kpiId), eq(strategyKpis.projectId, context.projectId)))
      .limit(1);

    if (!kpi) {
      return { error: 'KPI not found or not in this project' };
    }

    const previousValue = kpi.currentValue ? Number(kpi.currentValue) : null;

    // Update KPI value
    await db
      .update(strategyKpis)
      .set({ currentValue: String(value) })
      .where(eq(strategyKpis.id, kpiId));

    // Check threshold for event-driven trigger
    const triggerResult = await checkKpiThreshold(kpiId);

    return {
      updated: true,
      kpiId,
      kpiName: kpi.name,
      previousValue,
      newValue: value,
      note: note ?? null,
      triggerFired: triggerResult.fired,
    };
  },
};
