import { db, strategies, strategyKpis, eq, and } from '@ai-office/db';
import { CONTEXT_TOKEN_BUDGETS } from '@ai-office/shared';
import { estimateTokens, truncateToTokenBudget } from '@ai-office/tokenizer';

/**
 * Load active strategy context for a project, formatted as compact text
 * for injection into an agent's system prompt.
 *
 * Budget: CONTEXT_TOKEN_BUDGETS.strategyContext (400 tokens)
 */
export async function loadStrategyContext(projectId: string): Promise<string> {
  const budget = CONTEXT_TOKEN_BUDGETS.strategyContext;

  // Load active strategies with their KPIs
  const activeStrategies = await db
    .select({
      id: strategies.id,
      type: strategies.type,
      aiRefined: strategies.aiRefined,
      userDraft: strategies.userDraft,
      status: strategies.status,
    })
    .from(strategies)
    .where(and(eq(strategies.projectId, projectId), eq(strategies.status, 'active')));

  if (activeStrategies.length === 0) return '';

  // Load KPIs for all active strategies
  const kpis = await db
    .select({
      strategyId: strategyKpis.strategyId,
      name: strategyKpis.name,
      currentValue: strategyKpis.currentValue,
      targetValue: strategyKpis.targetValue,
      unit: strategyKpis.unit,
      direction: strategyKpis.direction,
    })
    .from(strategyKpis)
    .where(eq(strategyKpis.projectId, projectId));

  // Group KPIs by strategy
  const kpisByStrategy = new Map<string, typeof kpis>();
  for (const kpi of kpis) {
    const arr = kpisByStrategy.get(kpi.strategyId) ?? [];
    arr.push(kpi);
    kpisByStrategy.set(kpi.strategyId, arr);
  }

  // Format each strategy
  const lines: string[] = [];
  for (const strategy of activeStrategies) {
    const name = strategy.aiRefined ?? strategy.userDraft ?? 'Unnamed strategy';
    // Truncate long strategy names
    const shortName = name.length > 80 ? name.slice(0, 77) + '...' : name;

    const strategyKpiList = kpisByStrategy.get(strategy.id) ?? [];
    if (strategyKpiList.length > 0) {
      const kpiTexts = strategyKpiList.map((k) => {
        const current = Number(k.currentValue ?? 0);
        const target = Number(k.targetValue ?? 0);
        const pct = target > 0 ? Math.round((current / target) * 100) : 0;
        return `${k.name}=${current}/${target}${k.unit ? k.unit : ''}(${pct}%)`;
      });
      lines.push(`[Strategy] ${shortName} | Status: ${strategy.status} | KPIs: ${kpiTexts.join(', ')}`);
    } else {
      lines.push(`[Strategy] ${shortName} | Status: ${strategy.status} | No KPIs defined`);
    }
  }

  const fullText = '[Company Strategy]\n' + lines.join('\n');

  // If over budget, keep top 3 strategies
  if (estimateTokens(fullText) > budget) {
    const trimmedLines = lines.slice(0, 3);
    const trimmedText = '[Company Strategy]\n' + trimmedLines.join('\n');
    return truncateToTokenBudget(trimmedText, budget);
  }

  return fullText;
}
