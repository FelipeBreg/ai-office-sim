import { db, agents, approvals, actionLogs, eq, and, desc } from '@ai-office/db';
import {
  executeAgent,
  resumeAgent,
  loadMemory,
  autoExtractAndSave,
  toolRegistry,
  DEFAULT_SAFETY_LIMITS,
} from '@ai-office/ai';
import type { AgentContext, AgentSession, SerializedSessionState } from '@ai-office/ai';
import { getNotificationQueue } from '@ai-office/queue';
import { fireEventTriggers } from '../scheduler/workflow-event-triggers.js';
import * as Sentry from '@sentry/node';
import { randomUUID } from 'crypto';
import { emitToProject } from '../socket/server.js';

interface AgentExecutionJobData {
  agentId: string;
  projectId: string;
  sessionId?: string;
  triggerPayload?: unknown;
  /** When resuming from an approved/rejected approval (serialized as Record) */
  resumeState?: Record<string, unknown>;
  resumeApproved?: boolean;
  /** When true, mutation tools are intercepted and return mock results */
  sandboxMode?: boolean;
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
      const memory = await loadMemory(agentId, projectId);

      const config = agent.config ?? { model: 'claude-sonnet-4-6', temperature: 0.7, maxTokens: 4096, budget: 1.0 };
      const agentTools = agent.tools
        ? toolRegistry.getByNames(agent.tools)
        : toolRegistry.getAll();

      // Load last 5 session summaries for multi-turn context
      let sessionHistory = '';
      try {
        const recentSessions = await db
          .select({
            sessionId: actionLogs.sessionId,
            actionType: actionLogs.actionType,
            toolName: actionLogs.toolName,
            status: actionLogs.status,
            createdAt: actionLogs.createdAt,
          })
          .from(actionLogs)
          .where(and(eq(actionLogs.agentId, agentId), eq(actionLogs.projectId, projectId)))
          .orderBy(desc(actionLogs.createdAt))
          .limit(50);

        // Group by sessionId, take last 5 unique sessions
        const sessionsMap = new Map<string, typeof recentSessions>();
        for (const log of recentSessions) {
          if (!log.sessionId || log.sessionId === sessionId) continue;
          const arr = sessionsMap.get(log.sessionId) ?? [];
          arr.push(log);
          sessionsMap.set(log.sessionId, arr);
        }

        const pastSessions = [...sessionsMap.entries()].slice(0, 5);
        if (pastSessions.length > 0) {
          const summaries = pastSessions.map(([sid, logs]) => {
            const tools = logs
              .filter((l) => l.toolName)
              .map((l) => `${l.toolName}(${l.status})`)
              .join(', ');
            const date = logs[0]?.createdAt
              ? new Date(logs[0].createdAt).toISOString().slice(0, 16)
              : 'unknown';
            return `- Session ${sid.slice(0, 8)} (${date}): ${logs.length} actions [${tools || 'no tools'}]`;
          });
          sessionHistory = `\n\n[Previous Sessions]\n${summaries.join('\n')}`;
        }
      } catch {
        // Non-blocking
      }

      const basePrompt = agent.systemPromptEn ?? agent.systemPromptPtBr ??
        `You are ${agent.name}, a ${agent.archetype} agent. Complete the assigned task using the available tools.`;

      // Append inter-agent message context if triggered by another agent
      let agentMessageContext = '';
      if (triggerPayload && typeof triggerPayload === 'object' && (triggerPayload as Record<string, unknown>).type === 'agent_message') {
        const payload = triggerPayload as { fromAgentId: string; message: string; priority?: string };
        // Look up source agent name
        const [sourceAgent] = await db
          .select({ name: agents.name })
          .from(agents)
          .where(eq(agents.id, payload.fromAgentId))
          .limit(1);
        const sourceName = sourceAgent?.name ?? payload.fromAgentId;
        agentMessageContext = `\n\n[Incoming Message from Agent "${sourceName}"]\n${payload.message}`;
        if (payload.priority === 'high') {
          agentMessageContext += '\n[Priority: HIGH — please handle this promptly]';
        }
      }

      const systemPrompt = basePrompt + sessionHistory + agentMessageContext;

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
        triggerPayload,
      };

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
        triggerType: 'manual',
      });

      result = await executeAgent(context, session, {
        ...DEFAULT_SAFETY_LIMITS,
        maxActionsPerSession: agent.maxActionsPerSession,
        maxTokensPerSession: config.budget ? config.budget * 100_000 : 100_000,
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
