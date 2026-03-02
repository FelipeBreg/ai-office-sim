import { QUEUE_NAMES, analyticsJobSchema } from '@ai-office/queue';
import type { AnalyticsJob } from '@ai-office/queue';
import {
  db,
  strategies,
  strategyLearnings,
  actionLogs,
  agents,
  eq,
  and,
  desc,
  gte,
  lt,
  sql,
  count,
} from '@ai-office/db';
import { createTypedWorker } from './create-worker.js';

/* -------------------------------------------------------------------------- */
/*  Learning detection — analyzes recent agent actions for strategy insights  */
/* -------------------------------------------------------------------------- */

async function detectLearnings(projectId: string, date: string): Promise<number> {
  // Get active strategies for this project
  const activeStrategies = await db
    .select()
    .from(strategies)
    .where(
      and(
        eq(strategies.projectId, projectId),
        eq(strategies.status, 'active'),
      ),
    );

  if (activeStrategies.length === 0) return 0;

  // Get agent actions from the last 7 days
  const sevenDaysAgo = new Date(date);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const recentActions = await db
    .select({
      id: actionLogs.id,
      agentId: actionLogs.agentId,
      toolName: actionLogs.toolName,
      status: actionLogs.status,
      createdAt: actionLogs.createdAt,
    })
    .from(actionLogs)
    .where(
      and(
        eq(actionLogs.projectId, projectId),
        gte(actionLogs.createdAt, sevenDaysAgo),
      ),
    )
    .orderBy(desc(actionLogs.createdAt))
    .limit(500);

  if (recentActions.length === 0) return 0;

  // Get project agents for context
  const projectAgents = await db
    .select({ id: agents.id, name: agents.name, archetype: agents.archetype })
    .from(agents)
    .where(eq(agents.projectId, projectId));

  const agentMap = new Map(projectAgents.map((a) => [a.id, a]));

  // For each active strategy, analyze actions and generate learnings
  // TODO: Replace with real LLM call (callLLM from @ai-office/ai) when available
  // For now, generate structured learning stubs based on action patterns
  let learningsCreated = 0;

  for (const strategy of activeStrategies) {
    // Summarize actions by agent
    const actionsByAgent = new Map<string, number>();
    for (const action of recentActions) {
      const count = actionsByAgent.get(action.agentId) ?? 0;
      actionsByAgent.set(action.agentId, count + 1);
    }

    // Find most active agent for this analysis cycle
    let topAgentId: string | null = null;
    let topCount = 0;
    for (const [agentId, count] of actionsByAgent) {
      if (count > topCount) {
        topAgentId = agentId;
        topCount = count;
      }
    }

    if (!topAgentId) continue;

    const topAgent = agentMap.get(topAgentId);
    if (!topAgent) continue;

    // TODO: Send action summaries to Claude with a prompt:
    // "Given strategy: {strategy.userDraft}, and these agent actions: {actionSummary},
    //  what patterns or insights relate to the strategy goals?"
    // Parse response into structured learnings (insight + recommendation + confidence)

    // Check if we already created a learning for this strategy+agent in the past 7 days
    const existingLearnings = await db
      .select({ id: strategyLearnings.id })
      .from(strategyLearnings)
      .where(
        and(
          eq(strategyLearnings.strategyId, strategy.id),
          eq(strategyLearnings.agentId, topAgentId),
          gte(strategyLearnings.createdAt, sevenDaysAgo),
        ),
      )
      .limit(1);

    if (existingLearnings.length > 0) continue;

    // Stub: create a placeholder learning to demonstrate the pipeline
    const insight = `Agent "${topAgent.name}" completed ${topCount} actions in the past 7 days ` +
      `related to the ${strategy.type} strategy. Pattern analysis pending LLM integration.`;

    try {
      await db.insert(strategyLearnings).values({
        strategyId: strategy.id,
        projectId,
        agentId: topAgentId,
        insight,
        recommendation: 'Pending AI analysis — will be replaced by Claude-generated recommendations.',
        confidence: '0.5',
      });
      learningsCreated++;
    } catch (err) {
      console.error(`[analytics] Failed to insert learning for strategy ${strategy.id}:`, err);
    }
  }

  return learningsCreated;
}

/* -------------------------------------------------------------------------- */
/*  Analytics worker                                                          */
/* -------------------------------------------------------------------------- */

export function createAnalyticsWorker() {
  return createTypedWorker<AnalyticsJob>({
    queueName: QUEUE_NAMES.ANALYTICS,
    concurrency: 1,
    schema: analyticsJobSchema,
    processor: async (job) => {
      const { type, projectId, date } = job.data;
      console.log(`[analytics] Processing: type=${type} project=${projectId} date=${date}`);

      switch (type) {
        case 'learning_detection': {
          const count = await detectLearnings(projectId, date);
          console.log(`[analytics] Learning detection complete: ${count} learnings created`);
          await job.updateProgress(100);
          return { status: 'completed', type, date, learningsCreated: count };
        }

        case 'daily_aggregation': {
          const dayStart = new Date(date);
          dayStart.setHours(0, 0, 0, 0);
          const dayEnd = new Date(date);
          dayEnd.setHours(23, 59, 59, 999);

          // Aggregate action logs for the day
          const [stats] = await db
            .select({
              totalActions: count(),
              totalTokens: sql<number>`COALESCE(SUM(${actionLogs.tokensUsed}), 0)`,
              totalCost: sql<string>`COALESCE(SUM(${actionLogs.costUsd}), 0)::text`,
              avgDuration: sql<number>`COALESCE(AVG(${actionLogs.durationMs}), 0)`,
              completedCount: sql<number>`COUNT(*) FILTER (WHERE ${actionLogs.status} = 'completed')`,
              failedCount: sql<number>`COUNT(*) FILTER (WHERE ${actionLogs.status} = 'failed')`,
            })
            .from(actionLogs)
            .where(
              and(
                eq(actionLogs.projectId, projectId),
                gte(actionLogs.createdAt, dayStart),
                lt(actionLogs.createdAt, dayEnd),
              ),
            );

          // Count unique sessions (agent runs)
          const [sessionStats] = await db
            .select({
              uniqueSessions: sql<number>`COUNT(DISTINCT ${actionLogs.sessionId})`,
              uniqueAgents: sql<number>`COUNT(DISTINCT ${actionLogs.agentId})`,
            })
            .from(actionLogs)
            .where(
              and(
                eq(actionLogs.projectId, projectId),
                gte(actionLogs.createdAt, dayStart),
                lt(actionLogs.createdAt, dayEnd),
              ),
            );

          console.log(
            `[analytics] Daily aggregation for ${date}: actions=${stats?.totalActions} cost=$${stats?.totalCost} sessions=${sessionStats?.uniqueSessions}`,
          );
          await job.updateProgress(100);
          return {
            status: 'completed',
            type,
            date,
            totalActions: Number(stats?.totalActions ?? 0),
            totalTokens: Number(stats?.totalTokens ?? 0),
            totalCostUsd: stats?.totalCost ?? '0',
            avgDurationMs: Math.round(Number(stats?.avgDuration ?? 0)),
            completedActions: Number(stats?.completedCount ?? 0),
            failedActions: Number(stats?.failedCount ?? 0),
            uniqueSessions: Number(sessionStats?.uniqueSessions ?? 0),
            uniqueAgents: Number(sessionStats?.uniqueAgents ?? 0),
          };
        }

        case 'cost_report': {
          // Aggregate costs by agent for the reporting period (last 30 days from date)
          const reportEnd = new Date(date);
          reportEnd.setHours(23, 59, 59, 999);
          const reportStart = new Date(date);
          reportStart.setDate(reportStart.getDate() - 30);
          reportStart.setHours(0, 0, 0, 0);

          const costByAgent = await db
            .select({
              agentId: actionLogs.agentId,
              agentName: agents.name,
              totalCost: sql<string>`COALESCE(SUM(${actionLogs.costUsd}), 0)::text`,
              totalTokens: sql<number>`COALESCE(SUM(${actionLogs.tokensUsed}), 0)`,
              actionCount: count(),
            })
            .from(actionLogs)
            .innerJoin(agents, eq(actionLogs.agentId, agents.id))
            .where(
              and(
                eq(actionLogs.projectId, projectId),
                gte(actionLogs.createdAt, reportStart),
                lt(actionLogs.createdAt, reportEnd),
              ),
            )
            .groupBy(actionLogs.agentId, agents.name)
            .orderBy(sql`SUM(${actionLogs.costUsd}) DESC NULLS LAST`);

          const totalCost = costByAgent.reduce(
            (sum, row) => sum + Number(row.totalCost),
            0,
          );

          console.log(
            `[analytics] Cost report: ${costByAgent.length} agents, total=$${totalCost.toFixed(4)}`,
          );
          await job.updateProgress(100);
          return {
            status: 'completed',
            type,
            periodStart: reportStart.toISOString().slice(0, 10),
            periodEnd: date,
            totalCostUsd: totalCost.toFixed(6),
            agentBreakdown: costByAgent.map((r) => ({
              agentId: r.agentId,
              agentName: r.agentName,
              costUsd: r.totalCost,
              tokens: Number(r.totalTokens),
              actions: Number(r.actionCount),
            })),
          };
        }

        default:
          await job.updateProgress(100);
          return { status: 'completed', type, date };
      }
    },
  });
}
