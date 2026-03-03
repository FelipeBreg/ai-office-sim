import { db, strategyKpis, eq } from '@ai-office/db';
import { getAgentExecutionQueue } from '@ai-office/queue';
import { randomUUID } from 'crypto';

/**
 * Check if a KPI has crossed its threshold and fire the linked agent/workflow.
 * Called both event-driven (when KPI is updated) and polling (orchestrator tick).
 */
export async function checkKpiThreshold(kpiId: string): Promise<{ fired: boolean; reason?: string }> {
  const [kpi] = await db
    .select()
    .from(strategyKpis)
    .where(eq(strategyKpis.id, kpiId))
    .limit(1);

  if (!kpi) return { fired: false, reason: 'kpi_not_found' };
  if (!kpi.isMonitored) return { fired: false, reason: 'not_monitored' };
  if (!kpi.triggerThreshold) return { fired: false, reason: 'no_threshold' };
  if (!kpi.triggerAgentId && !kpi.triggerWorkflowId) return { fired: false, reason: 'no_target' };

  const currentValue = Number(kpi.currentValue ?? 0);
  const threshold = Number(kpi.triggerThreshold);

  // Check direction
  let shouldFire = false;
  switch (kpi.triggerDirection) {
    case 'above':
      shouldFire = currentValue >= threshold;
      break;
    case 'below':
      shouldFire = currentValue <= threshold;
      break;
    case 'deviation': {
      const targetValue = Number(kpi.targetValue ?? 0);
      if (targetValue === 0) break;
      const deviation = Math.abs((currentValue - targetValue) / targetValue) * 100;
      shouldFire = deviation >= threshold;
      break;
    }
    default:
      return { fired: false, reason: 'invalid_direction' };
  }

  if (!shouldFire) return { fired: false, reason: 'threshold_not_crossed' };

  // Check cooldown
  if (kpi.lastTriggeredAt) {
    const cooldownMs = (kpi.triggerCooldownMin ?? 60) * 60 * 1000;
    const elapsed = Date.now() - kpi.lastTriggeredAt.getTime();
    if (elapsed < cooldownMs) {
      return { fired: false, reason: 'cooldown_active' };
    }
  }

  // Fire the trigger
  const triggerPayload = {
    kpiId: kpi.id,
    kpiName: kpi.name,
    currentValue,
    threshold,
    triggerDirection: kpi.triggerDirection,
    targetValue: kpi.targetValue ? Number(kpi.targetValue) : null,
    unit: kpi.unit,
  };

  if (kpi.triggerAgentId) {
    const queue = getAgentExecutionQueue();
    const sessionId = randomUUID();
    await queue.add(`kpi-trigger-${kpi.id}-${sessionId}`, {
      agentId: kpi.triggerAgentId,
      projectId: kpi.projectId,
      sessionId,
      triggerType: 'kpi' as const,
      triggerPayload,
    });
  }

  // Update lastTriggeredAt
  await db
    .update(strategyKpis)
    .set({ lastTriggeredAt: new Date() })
    .where(eq(strategyKpis.id, kpi.id));

  return { fired: true };
}
