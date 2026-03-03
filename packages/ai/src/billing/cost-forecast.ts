/**
 * Cost Forecasting Engine
 *
 * Analyzes recent AI spend data and projects future costs.
 * Uses trailing 7-day moving average with per-agent breakdown.
 */
import { db, actionLogs, agents, eq, and, gte, sql, count } from '@ai-office/db';

export interface CostForecastResult {
  /** Daily average cost (USD) over the trailing window */
  dailyAvgUsd: number;
  /** Projected monthly cost based on daily average */
  projectedMonthlyUsd: number;
  /** Number of days of data used for projection */
  daysAnalyzed: number;
  /** Total actions in the analysis window */
  totalActions: number;
  /** Per-agent cost breakdown with projection */
  perAgent: AgentCostProjection[];
  /** Budget alert: true if projected monthly exceeds 80% of monthly limit */
  budgetWarning: boolean;
  /** Percent of monthly budget projected to be used */
  budgetUtilizationPct: number | null;
}

export interface AgentCostProjection {
  agentId: string;
  agentName: string;
  archetype: string | null;
  dailyAvgUsd: number;
  projectedMonthlyUsd: number;
  totalCostUsd: number;
  totalActions: number;
}

/**
 * Generate a cost forecast for a project based on recent spending data.
 *
 * @param projectId - Project to forecast
 * @param windowDays - Number of trailing days to analyze (default: 7)
 * @param monthlyLimitUsd - Optional monthly budget limit for warning calculation
 */
export async function generateCostForecast(
  projectId: string,
  windowDays = 7,
  monthlyLimitUsd?: number,
): Promise<CostForecastResult> {
  const since = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000);

  // Query: per-agent cost breakdown over the trailing window
  const agentBreakdown = await db
    .select({
      agentId: actionLogs.agentId,
      agentName: agents.name,
      archetype: agents.archetype,
      totalCost: sql<string>`COALESCE(SUM(${actionLogs.costUsd}), 0)::text`,
      totalActions: count(),
    })
    .from(actionLogs)
    .leftJoin(agents, eq(actionLogs.agentId, agents.id))
    .where(and(eq(actionLogs.projectId, projectId), gte(actionLogs.createdAt, since)))
    .groupBy(actionLogs.agentId, agents.name, agents.archetype);

  let totalCost = 0;
  let totalActions = 0;

  const perAgent: AgentCostProjection[] = agentBreakdown.map((row) => {
    const cost = Number(row.totalCost);
    const actions = Number(row.totalActions);
    totalCost += cost;
    totalActions += actions;

    const dailyAvg = cost / windowDays;
    return {
      agentId: row.agentId ?? 'unknown',
      agentName: row.agentName ?? 'Unknown Agent',
      archetype: row.archetype ?? null,
      dailyAvgUsd: Math.round(dailyAvg * 1_000_000) / 1_000_000,
      projectedMonthlyUsd: Math.round(dailyAvg * 30 * 100) / 100,
      totalCostUsd: Math.round(cost * 1_000_000) / 1_000_000,
      totalActions: actions,
    };
  });

  // Sort by projected cost descending
  perAgent.sort((a, b) => b.projectedMonthlyUsd - a.projectedMonthlyUsd);

  const dailyAvg = totalCost / windowDays;
  const projectedMonthly = dailyAvg * 30;

  // Budget warning at 80% threshold
  let budgetWarning = false;
  let budgetUtilizationPct: number | null = null;

  if (monthlyLimitUsd && monthlyLimitUsd > 0) {
    budgetUtilizationPct = Math.round((projectedMonthly / monthlyLimitUsd) * 100);
    budgetWarning = budgetUtilizationPct >= 80;
  }

  return {
    dailyAvgUsd: Math.round(dailyAvg * 1_000_000) / 1_000_000,
    projectedMonthlyUsd: Math.round(projectedMonthly * 100) / 100,
    daysAnalyzed: windowDays,
    totalActions,
    perAgent,
    budgetWarning,
    budgetUtilizationPct,
  };
}
