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
import { callLLM } from '@ai-office/ai';
import { randomUUID } from 'crypto';
import { createTypedWorker } from './create-worker.js';

/* -------------------------------------------------------------------------- */
/*  Learning detection — analyzes recent agent actions for strategy insights  */
/* -------------------------------------------------------------------------- */

interface LearningAnalysis {
  insight: string;
  recommendation: string;
  confidence: number;
}

function parseLearningResponse(text: string): LearningAnalysis {
  try {
    // Try to extract JSON from the response (Claude may wrap it in markdown)
    const jsonMatch = text.match(/\{[\s\S]*?\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        insight: String(parsed.insight || '').slice(0, 2000),
        recommendation: String(parsed.recommendation || '').slice(0, 2000),
        confidence: Math.max(0, Math.min(1, Number(parsed.confidence) || 0.5)),
      };
    }
  } catch {
    // Fall through to plain text extraction
  }

  // Fallback: use the full text as insight
  return {
    insight: text.slice(0, 2000),
    recommendation: '',
    confidence: 0.5,
  };
}

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

  let learningsCreated = 0;
  // Use a synthetic agent ID for the analytics system's own LLM calls
  const systemAgentId = '00000000-0000-0000-0000-000000000000';

  for (const strategy of activeStrategies) {
    // Summarize actions by agent with tool breakdown
    const actionsByAgent = new Map<string, { total: number; succeeded: number; failed: number; tools: Map<string, number> }>();
    for (const action of recentActions) {
      const existing = actionsByAgent.get(action.agentId) ?? { total: 0, succeeded: 0, failed: 0, tools: new Map() };
      existing.total++;
      if (action.status === 'completed') existing.succeeded++;
      if (action.status === 'failed') existing.failed++;
      if (action.toolName) {
        existing.tools.set(action.toolName, (existing.tools.get(action.toolName) ?? 0) + 1);
      }
      actionsByAgent.set(action.agentId, existing);
    }

    // Find most active agent for this analysis cycle
    let topAgentId: string | null = null;
    let topCount = 0;
    for (const [agentId, stats] of actionsByAgent) {
      if (stats.total > topCount) {
        topAgentId = agentId;
        topCount = stats.total;
      }
    }

    if (!topAgentId) continue;

    const topAgent = agentMap.get(topAgentId);
    if (!topAgent) continue;

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

    // Build action summary for Claude
    const agentSummaries: string[] = [];
    for (const [agentId, stats] of actionsByAgent) {
      const agent = agentMap.get(agentId);
      const toolList = [...stats.tools.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([tool, cnt]) => `${tool}(${cnt})`)
        .join(', ');
      agentSummaries.push(
        `- ${agent?.name ?? agentId} (${agent?.archetype ?? 'unknown'}): ${stats.total} actions (${stats.succeeded} ok, ${stats.failed} failed). Top tools: ${toolList}`,
      );
    }

    try {
      const { response } = await callLLM(
        {
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 500,
          messages: [
            {
              role: 'user',
              content: `You are a business strategy analyst. Analyze agent activity patterns and generate ONE actionable learning for the given strategy.

STRATEGY:
- Type: ${strategy.type}
- Status: ${strategy.status}
- Objective: ${strategy.userDraft || 'Not specified'}
- AI Refined Plan: ${strategy.aiRefined || 'None yet'}

AGENT ACTIVITY (last 7 days):
${agentSummaries.join('\n')}

Most active agent: "${topAgent.name}" (${topAgent.archetype}) with ${topCount} actions.

Respond with ONLY a JSON object (no markdown, no explanation):
{"insight": "one sentence describing the pattern you observed", "recommendation": "one sentence with a specific actionable suggestion", "confidence": 0.7}

The confidence should be 0.3-0.5 if data is sparse, 0.6-0.8 if patterns are clear, 0.9+ only if very strong evidence.`,
            },
          ],
        },
        {
          projectId,
          agentId: systemAgentId,
          sessionId: `analytics-${randomUUID()}`,
          agentName: 'Analytics System',
        },
      );

      const textBlock = response.content.find((b) => b.type === 'text');
      if (!textBlock || textBlock.type !== 'text') continue;

      const learning = parseLearningResponse(textBlock.text);

      if (!learning.insight) continue;

      await db.insert(strategyLearnings).values({
        strategyId: strategy.id,
        projectId,
        agentId: topAgentId,
        insight: learning.insight,
        recommendation: learning.recommendation || null,
        confidence: String(learning.confidence),
      });
      learningsCreated++;
    } catch (err) {
      console.error(`[analytics] Failed to generate learning for strategy ${strategy.id}:`, err);
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
