import {
  db,
  agents,
  approvals,
  actionLogs,
  orchestratorConfig,
  agentSessionSummaries,
  sessionTranscripts,
  wikiArticles,
  wikiCategories,
  eq,
  and,
  desc,
  sql,
  gte,
} from '@ai-office/db';
import {
  executeAgent,
  resumeAgent,
  loadMemory,
  autoExtractAndSave,
  toolRegistry,
  loadStrategyContext,
  callLLM,
  ingestDocument,
  DEFAULT_SAFETY_LIMITS,
} from '@ai-office/ai';
import type { AgentContext, AgentSession, SerializedSessionState } from '@ai-office/ai';
import { getNotificationQueue } from '@ai-office/queue';
import { CONTEXT_TOKEN_BUDGETS } from '@ai-office/shared';
import { estimateTokens, truncateToTokenBudget } from '@ai-office/tokenizer';
import { fireEventTriggers } from '../scheduler/workflow-event-triggers.js';
import * as Sentry from '@sentry/node';
import { randomUUID } from 'crypto';
import { emitToProject } from '../socket/server.js';

import type { TriggerType } from '@ai-office/ai';
import type { CascadeContext } from '@ai-office/shared';

interface AgentExecutionJobData {
  agentId: string;
  projectId: string;
  sessionId?: string;
  triggerType?: TriggerType;
  triggerPayload?: unknown;
  /** When resuming from an approved/rejected approval (serialized as Record) */
  resumeState?: Record<string, unknown>;
  resumeApproved?: boolean;
  /** When true, mutation tools are intercepted and return mock results */
  sandboxMode?: boolean;
  /** Cascade metadata for chained executions */
  cascade?: CascadeContext;
}

/**
 * Process an agent execution job:
 * 1. Load agent config from DB
 * 2. Load agent memory
 * 3. Build AgentContext
 * 4. Execute the agentic loop
 * 5. Update agent status
 */
export async function processAgentExecution(
  data: AgentExecutionJobData,
): Promise<void> {
  const { agentId, projectId, triggerPayload } = data;
  const triggerType: TriggerType = data.triggerType ?? 'manual';
  const sessionId = data.sessionId ?? randomUUID();
  const isResume = !!data.resumeState;

  // 1. Load agent config
  const [agent] = await db
    .select()
    .from(agents)
    .where(eq(agents.id, agentId))
    .limit(1);

  if (!agent) {
    throw new Error(`Agent not found: ${agentId}`);
  }

  if (!agent.isActive) {
    console.log(`[agent-execution] Agent ${agentId} is inactive, skipping`);
    return;
  }

  // 1b. Check per-agent daily budget
  const agentBudget = (agent.config as { budget?: number } | null)?.budget;
  if (agentBudget && agentBudget > 0) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const [spent] = await db
      .select({ total: sql<number>`coalesce(sum(${actionLogs.costUsd}::numeric), 0)` })
      .from(actionLogs)
      .where(and(eq(actionLogs.agentId, agentId), gte(actionLogs.createdAt, today)));
    const dailySpent = Number(spent?.total ?? 0);
    if (dailySpent >= agentBudget) {
      console.log(
        `[agent-execution] Agent ${agentId} over daily budget ($${dailySpent.toFixed(2)} >= $${agentBudget}) — skipping`,
      );
      // Notify about budget exceeded
      await getNotificationQueue().add(`budget-exceeded-${agentId}`, {
        type: 'agent_error',
        projectId,
        agentId,
        message: `Agent "${agent.name}" paused: daily budget $${agentBudget} exceeded ($${dailySpent.toFixed(2)} spent)`,
      });
      return;
    }
  }

  // 1c. Check project daily spend limit
  const [config] = await db
    .select({ dailySpendLimitUsd: orchestratorConfig.dailySpendLimitUsd })
    .from(orchestratorConfig)
    .where(eq(orchestratorConfig.projectId, projectId))
    .limit(1);
  const projectDailyLimit = Number(config?.dailySpendLimitUsd ?? 0);
  if (projectDailyLimit > 0) {
    const today2 = new Date();
    today2.setHours(0, 0, 0, 0);
    const [projectSpent] = await db
      .select({ total: sql<number>`coalesce(sum(${actionLogs.costUsd}::numeric), 0)` })
      .from(actionLogs)
      .where(and(eq(actionLogs.projectId, projectId), gte(actionLogs.createdAt, today2)));
    const projectDailySpent = Number(projectSpent?.total ?? 0);
    if (projectDailySpent >= projectDailyLimit) {
      console.log(
        `[agent-execution] Project ${projectId} over daily limit ($${projectDailySpent.toFixed(2)} >= $${projectDailyLimit}) — skipping agent ${agentId}`,
      );
      return;
    }
    // Alert at 80% threshold
    if (projectDailySpent >= projectDailyLimit * 0.8) {
      await getNotificationQueue().add(`budget-alert-${projectId}`, {
        type: 'agent_error',
        projectId,
        agentId,
        message: `Project daily spend at ${Math.round((projectDailySpent / projectDailyLimit) * 100)}% ($${projectDailySpent.toFixed(2)} / $${projectDailyLimit})`,
      });
    }
  }

  // 1d. Cascade safety checks
  if (data.cascade) {
    const maxDepth = 5; // TODO: read from orchestrator_config
    if (data.cascade.cascadeDepth > maxDepth) {
      console.warn(
        `[agent-execution] Cascade depth exceeded (${data.cascade.cascadeDepth}/${maxDepth}) — rejecting agent ${agentId}`,
      );
      emitToProject(projectId, 'cascade:depth_exceeded' as any, {
        cascadeId: data.cascade.cascadeId,
        agentId,
        depth: data.cascade.cascadeDepth,
        maxDepth,
      });
      return;
    }
    if (data.cascade.cascadePath.includes(agentId)) {
      console.warn(
        `[agent-execution] Cascade loop detected for agent ${agentId} — path: ${data.cascade.cascadePath.join(' → ')}`,
      );
      emitToProject(projectId, 'cascade:loop_detected' as any, {
        cascadeId: data.cascade.cascadeId,
        agentId,
        path: data.cascade.cascadePath,
      });
      return;
    }
  }

  // 2. Claim agent — for new runs require idle; for resume allow awaiting_approval
  const allowedStatus = isResume ? 'awaiting_approval' : 'idle';
  const [claimed] = await db
    .update(agents)
    .set({ status: 'working' })
    .where(and(eq(agents.id, agentId), eq(agents.status, allowedStatus)))
    .returning();

  if (!claimed) {
    console.log(`[agent-execution] Agent ${agentId} is not in ${allowedStatus} status, skipping`);
    return;
  }

  try {
    // Emit session started / status working
    emitToProject(projectId, 'agent:status_changed', {
      agentId,
      status: 'working',
      timestamp: new Date().toISOString(),
    });

    let result;

    if (isResume && data.resumeState) {
      // ── RESUME from approval ──
      console.log(`[agent-execution] Resuming session ${sessionId} (approved=${data.resumeApproved})`);
      result = await resumeAgent(
        data.resumeState as unknown as SerializedSessionState,
        data.resumeApproved ?? false,
      );
    } else {
      // ── NEW execution ──
      const { context, config: agentConfig } = await buildAgentContext(agent, projectId, sessionId, triggerType, triggerPayload, data.cascade);

      const session: AgentSession = {
        sessionId,
        agentId,
        projectId,
        startedAt: new Date(),
        actionCount: 0,
        totalTokens: 0,
        totalCostUsd: 0,
        status: 'running',
        sandboxMode: data.sandboxMode,
      };

      emitToProject(projectId, 'agent:session_started', {
        agentId,
        sessionId,
        triggerType,
      });

      result = await executeAgent(context, session, {
        ...DEFAULT_SAFETY_LIMITS,
        maxActionsPerSession: agent.maxActionsPerSession,
        maxTokensPerSession: agentConfig.budget ? agentConfig.budget * 100_000 : 100_000,
      });
    }

    console.log(
      `[agent-execution] Session ${sessionId}:`,
      `status=${result.status}`,
      `actions=${result.actions.length}`,
      `tokens=${result.totalTokens}`,
      `cost=$${result.totalCostUsd.toFixed(4)}`,
      `duration=${result.durationMs}ms`,
    );

    // ── Handle paused_for_approval: save state, create approval record ──
    if (result.status === 'paused_for_approval' && result.pausedState) {
      const toolName = result.pausedState.pendingToolCall.toolName;

      // Create approval record with session state for resume
      const [approval] = await db.insert(approvals).values({
        projectId,
        agentId,
        actionType: `tool_call:${toolName}`,
        actionPayload: result.pausedState.pendingToolCall.toolInput as Record<string, unknown>,
        reason: `Agent "${agent.name}" wants to execute "${toolName}" which requires human approval.`,
        riskLevel: 'medium',
        status: 'pending',
        sessionState: result.pausedState as unknown as Record<string, unknown>,
      }).returning();

      // Set agent to awaiting_approval
      await db
        .update(agents)
        .set({ status: 'awaiting_approval' })
        .where(eq(agents.id, agentId));

      emitToProject(projectId, 'agent:status_changed', {
        agentId,
        status: 'awaiting_approval',
        timestamp: new Date().toISOString(),
      });

      // Emit approval:requested event
      if (approval) {
        emitToProject(projectId, 'approval:requested', {
          approvalId: approval.id,
          agentId,
          actionType: `tool_call:${toolName}`,
          riskLevel: 'medium',
        });

        // Enqueue notification job
        const notificationQueue = getNotificationQueue();
        await notificationQueue.add(`approval-${approval.id}`, {
          type: 'approval_requested',
          projectId,
          agentId,
          approvalId: approval.id,
          message: `Agent "${agent.name}" needs approval to execute "${toolName}"`,
        });
      }

      return; // Session paused — don't mark as idle
    }

    // ── Normal completion / error / abort ──
    emitToProject(projectId, 'agent:session_complete', {
      agentId,
      sessionId,
      actionCount: result.actions.length,
      tokensUsed: result.totalTokens,
    });

    const finalStatus = result.status === 'completed' ? 'idle' : 'error';

    emitToProject(projectId, 'agent:status_changed', {
      agentId,
      status: finalStatus,
      timestamp: new Date().toISOString(),
    });

    await db
      .update(agents)
      .set({ status: finalStatus })
      .where(eq(agents.id, agentId));

    // ── Auto-disable after 3 consecutive failures ──
    if (finalStatus === 'error') {
      try {
        const recentSessions = await db
          .select({ sessionId: actionLogs.sessionId, status: actionLogs.status })
          .from(actionLogs)
          .where(and(eq(actionLogs.agentId, agentId), eq(actionLogs.projectId, projectId)))
          .orderBy(desc(actionLogs.createdAt))
          .limit(30);

        // Group by session, check last 3 unique sessions
        const sessionStatuses = new Map<string, boolean>();
        for (const log of recentSessions) {
          if (!sessionStatuses.has(log.sessionId)) {
            sessionStatuses.set(log.sessionId, log.status === 'failed');
          } else if (log.status === 'failed') {
            sessionStatuses.set(log.sessionId, true);
          }
        }
        const lastThree = [...sessionStatuses.values()].slice(0, 3);
        if (lastThree.length >= 3 && lastThree.every(Boolean)) {
          console.warn(`[agent-execution] Agent ${agentId} failed 3 consecutive sessions — auto-disabling`);
          await db.update(agents).set({ isActive: false }).where(eq(agents.id, agentId));
          emitToProject(projectId, 'agent:auto_disabled', {
            agentId,
            reason: 'consecutive_failures',
            timestamp: new Date().toISOString(),
          });
        }
      } catch {
        // Non-blocking
      }
    }

    // ── Post-execution: auto-extract memories from session transcript ──
    if (result.status === 'completed' && result.actions.length > 0) {
      try {
        const transcript = result.actions
          .map((a) => {
            if (a.type === 'tool_call') {
              return `[Tool: ${a.toolName}] Input: ${JSON.stringify(a.input).slice(0, 500)} → Output: ${JSON.stringify(a.output).slice(0, 500)}`;
            }
            return `[LLM Response]`;
          })
          .join('\n');

        if (result.finalResponse) {
          const fullTranscript = `${transcript}\n[Final Response]: ${result.finalResponse.slice(0, 2000)}`;
          const { savedCount } = await autoExtractAndSave(agentId, projectId, fullTranscript);
          if (savedCount > 0) {
            console.log(`[agent-execution] Extracted ${savedCount} memories from session ${sessionId}`);
          }
        }
      } catch (memErr) {
        console.warn(`[agent-execution] Memory extraction failed for ${sessionId}:`, memErr);
        // Non-blocking — don't fail the session for memory extraction issues
      }
    }

    // ── Post-execution: generate session summary + wiki document + save transcript ──
    if (result.status === 'completed' && result.actions.length > 0) {
      try {
        // Build transcript text for summarization
        const transcriptText = result.actions
          .map((a) => {
            if (a.type === 'tool_call') {
              return `[Tool: ${a.toolName}] ${JSON.stringify(a.input).slice(0, 300)} → ${JSON.stringify(a.output).slice(0, 300)}`;
            }
            return `[LLM]`;
          })
          .join('\n');

        const fullText = result.finalResponse
          ? `${transcriptText}\n[Final]: ${result.finalResponse.slice(0, 1000)}`
          : transcriptText;

        // 1. Generate summary via Claude Haiku
        const summaryResult = await callLLM(
          {
            model: 'claude-haiku-4-5-20251001',
            system: 'Summarize this agent session in 100-200 words: what the agent did, key decisions, outcomes.',
            messages: [{ role: 'user', content: fullText.slice(0, 4000) }],
            max_tokens: 512,
            temperature: 0.3,
          },
          { projectId, agentId, sessionId, agentName: agent.name },
        );

        const summary = summaryResult.response.content
          .filter((b) => b.type === 'text')
          .map((b) => (b as unknown as { text: string }).text)
          .join('');

        // 2. Save to agent_session_summaries
        await db.insert(agentSessionSummaries).values({
          agentId,
          projectId,
          sessionId,
          summary,
          tokenCount: result.totalTokens,
        });

        // 3. Create wiki document
        const date = new Date().toISOString().slice(0, 10);
        const slug = `session-log-${agent.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${date}-${sessionId.slice(0, 8)}`;

        // Find or create "Session Logs" category
        let [sessionLogsCategory] = await db
          .select({ id: wikiCategories.id })
          .from(wikiCategories)
          .where(and(eq(wikiCategories.projectId, projectId), eq(wikiCategories.slug, 'session-logs')))
          .limit(1);

        if (!sessionLogsCategory) {
          [sessionLogsCategory] = await db.insert(wikiCategories).values({
            projectId,
            name: 'Session Logs',
            slug: 'session-logs',
            description: 'Auto-generated session logs from agent executions',
          }).returning({ id: wikiCategories.id });
        }

        const wikiContent = `# ${agent.name} Session Log — ${date}\n\n**Session ID:** ${sessionId}\n**Trigger:** ${triggerType}\n**Actions:** ${result.actions.length}\n**Tokens:** ${result.totalTokens}\n**Cost:** $${result.totalCostUsd.toFixed(4)}\n\n## Summary\n\n${summary}`;

        await db.insert(wikiArticles).values({
          projectId,
          categoryId: sessionLogsCategory?.id,
          title: `${agent.name} Session Log — ${date}`,
          slug,
          summary,
          content: wikiContent,
          tags: ['session-log', 'auto-generated'],
        });

        // 4. Ingest wiki document for RAG search
        try {
          await ingestDocument({
            projectId,
            title: `${agent.name} Session Log — ${date}`,
            content: wikiContent,
            sourceType: 'agent',
          });
        } catch {
          // Non-blocking
        }

        // 5. Save full transcript to session_transcripts
        await db.insert(sessionTranscripts).values({
          agentId,
          projectId,
          sessionId,
          messages: result.actions as unknown as Record<string, unknown>,
          triggerType,
          tokenCount: result.totalTokens,
          costUsd: String(result.totalCostUsd),
        });

        console.log(`[agent-execution] Session summary + wiki doc created for ${sessionId}`);
      } catch (summaryErr) {
        console.warn(`[agent-execution] Session summary generation failed for ${sessionId}:`, summaryErr);
        // Non-blocking
      }
    }

    // ── Fire event-triggered workflows on completion ──
    const eventName = result.status === 'completed' ? 'agent.completed' : 'agent.failed';
    fireEventTriggers(projectId, eventName, {
      _sourceAgentId: agentId,
      _sourceSessionId: sessionId,
      _agentName: agent.name,
    }).catch((err) => console.error('[agent-execution] Event trigger error:', err));

  } catch (err) {
    console.error(`[agent-execution] Session ${sessionId} failed:`, err);
    Sentry.captureException(err, {
      tags: { agentId, projectId, sessionId },
    });

    emitToProject(projectId, 'agent:error', {
      agentId,
      sessionId,
      error: err instanceof Error ? err.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    });

    emitToProject(projectId, 'agent:status_changed', {
      agentId,
      status: 'error',
      timestamp: new Date().toISOString(),
    });

    await db.update(agents).set({ status: 'error' }).where(eq(agents.id, agentId));

    throw err;
  }
}


// ────────────────────────────────────────────────────────────────────────
// Context Builder — assembles AgentContext with per-layer token budgets
// ────────────────────────────────────────────────────────────────────────

interface AgentRow {
  id: string;
  name: string;
  archetype: string;
  systemPromptEn: string | null;
  systemPromptPtBr: string | null;
  config: unknown;
  tools: string[] | null;
  heartbeatInstructions: string | null;
}

interface AgentConfig {
  model: string;
  temperature: number;
  maxTokens: number;
  budget: number;
}

async function buildAgentContext(
  agent: AgentRow,
  projectId: string,
  sessionId: string,
  triggerType: TriggerType,
  triggerPayload: unknown,
  cascade?: CascadeContext,
): Promise<{ context: AgentContext; config: AgentConfig }> {
  const budgets = CONTEXT_TOKEN_BUDGETS;
  const tokenReport: Record<string, { estimated: number; budget: number }> = {};

  // 1. Load agent config
  const config: AgentConfig = (agent.config as AgentConfig | null) ?? {
    model: 'claude-sonnet-4-6',
    temperature: 0.7,
    maxTokens: 4096,
    budget: 1.0,
  };

  // 2. Resolve tools
  const agentTools = agent.tools
    ? toolRegistry.getByNames(agent.tools)
    : toolRegistry.getAll();

  // 3. Build system prompt (base) — budget: systemPrompt
  const basePrompt = agent.systemPromptEn ?? agent.systemPromptPtBr ??
    `You are ${agent.name}, a ${agent.archetype} agent. Complete the assigned task using the available tools.`;
  const trimmedPrompt = truncateToTokenBudget(basePrompt, budgets.systemPrompt);
  tokenReport['systemPrompt'] = { estimated: estimateTokens(trimmedPrompt), budget: budgets.systemPrompt };

  // 3b. Load strategy context — budget: strategyContext
  let strategyContext = '';
  try {
    strategyContext = await loadStrategyContext(projectId);
    if (strategyContext) {
      strategyContext = '\n\n' + truncateToTokenBudget(strategyContext, budgets.strategyContext);
    }
  } catch {
    // Non-blocking
  }
  tokenReport['strategyContext'] = { estimated: estimateTokens(strategyContext), budget: budgets.strategyContext };

  // 4. Load memory — budget: dynamicMemory
  const rawMemory = await loadMemory(agent.id, projectId);
  let memory = rawMemory;
  const memoryText = rawMemory.map((m) => `${m.key}: ${JSON.stringify(m.value)}`).join('\n');
  if (estimateTokens(memoryText) > budgets.dynamicMemory) {
    // Keep most recent entries that fit within budget
    let tokenCount = 0;
    const fittingMemory: typeof rawMemory = [];
    for (const item of [...rawMemory].reverse()) {
      const itemTokens = estimateTokens(`${item.key}: ${JSON.stringify(item.value)}`);
      if (tokenCount + itemTokens > budgets.dynamicMemory) break;
      tokenCount += itemTokens;
      fittingMemory.unshift(item);
    }
    memory = fittingMemory;
  }
  const finalMemoryText = memory.map((m) => `${m.key}: ${JSON.stringify(m.value)}`).join('\n');
  tokenReport['dynamicMemory'] = { estimated: estimateTokens(finalMemoryText), budget: budgets.dynamicMemory };

  // 5. Load session history from session summaries — budget: sessionHistory
  let sessionHistory = '';
  try {
    const recentSummaries = await db
      .select({
        sessionId: agentSessionSummaries.sessionId,
        summary: agentSessionSummaries.summary,
        createdAt: agentSessionSummaries.createdAt,
      })
      .from(agentSessionSummaries)
      .where(eq(agentSessionSummaries.agentId, agent.id))
      .orderBy(desc(agentSessionSummaries.createdAt))
      .limit(5);

    if (recentSummaries.length > 0) {
      const lines = recentSummaries.map((s) => {
        const date = new Date(s.createdAt).toISOString().slice(0, 16);
        return `- Session ${s.sessionId.slice(0, 8)} (${date}): ${s.summary}`;
      });
      const rawHistory = `\n\n[Previous Sessions]\n${lines.join('\n')}`;
      sessionHistory = truncateToTokenBudget(rawHistory, budgets.sessionHistory);
    }
  } catch {
    // Non-blocking
  }
  tokenReport['sessionHistory'] = { estimated: estimateTokens(sessionHistory), budget: budgets.sessionHistory };

  // 6. Build trigger payload text — budget: triggerPayload
  let triggerText = '';
  if (triggerType === 'heartbeat') {
    // Heartbeat: inject self-programmed instructions
    const hbInstructions = agent.heartbeatInstructions;
    if (hbInstructions) {
      triggerText = `\n\n[Heartbeat Check]\nYour self-programmed instructions:\n${hbInstructions}\n\nReview your instructions and take any actions needed. Update your instructions for the next heartbeat if appropriate.`;
    } else {
      triggerText = '\n\n[Heartbeat Check]\nNo instructions set. Review your current situation and decide if any action is needed.';
    }
    triggerText = truncateToTokenBudget(triggerText, budgets.triggerPayload);
  } else if (triggerType === 'kpi') {
    // KPI trigger: inject KPI data
    const kpiData = triggerPayload as Record<string, unknown> | null;
    if (kpiData) {
      triggerText = `\n\n[KPI Alert]\nKPI "${kpiData.kpiName}" has crossed its threshold.\nCurrent value: ${kpiData.currentValue}${kpiData.unit ? ' ' + kpiData.unit : ''}\nThreshold: ${kpiData.threshold} (${kpiData.triggerDirection})\nTarget: ${kpiData.targetValue ?? 'N/A'}\n\nAnalyze this metric change and take appropriate action.`;
      triggerText = truncateToTokenBudget(triggerText, budgets.triggerPayload);
    }
  } else if (triggerPayload && typeof triggerPayload === 'object' && (triggerPayload as Record<string, unknown>).type === 'agent_message') {
    const payload = triggerPayload as { fromAgentId: string; message: string; priority?: string };
    const [sourceAgent] = await db
      .select({ name: agents.name })
      .from(agents)
      .where(eq(agents.id, payload.fromAgentId))
      .limit(1);
    const sourceName = sourceAgent?.name ?? payload.fromAgentId;
    triggerText = `\n\n[Incoming Message from Agent "${sourceName}"]\n${payload.message}`;
    if (payload.priority === 'high') {
      triggerText += '\n[Priority: HIGH — please handle this promptly]';
    }
    triggerText = truncateToTokenBudget(triggerText, budgets.triggerPayload);
  }
  tokenReport['triggerPayload'] = { estimated: estimateTokens(triggerText), budget: budgets.triggerPayload };

  // 7. Assemble final system prompt
  const systemPrompt = trimmedPrompt + strategyContext + sessionHistory + triggerText;

  // Log token budget report
  const totalEstimated = Object.values(tokenReport).reduce((sum, r) => sum + r.estimated, 0);
  console.log(
    `[context-builder] Token budget report for agent ${agent.id}:`,
    JSON.stringify({ ...tokenReport, total: { estimated: totalEstimated, budget: budgets.totalOverhead } }),
  );

  const context: AgentContext = {
    agent: {
      id: agent.id,
      name: agent.name,
      archetype: agent.archetype,
      model: config.model,
      temperature: config.temperature,
      maxTokens: config.maxTokens,
    },
    systemPrompt,
    tools: agentTools,
    memory,
    conversationHistory: [],
    triggerType,
    triggerPayload,
    cascade: cascade ? {
      cascadeId: cascade.cascadeId,
      cascadeDepth: cascade.cascadeDepth,
      cascadePath: cascade.cascadePath,
    } : undefined,
  };

  return { context, config };
}
