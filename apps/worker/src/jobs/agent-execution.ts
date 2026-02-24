import { db, agents, eq, and } from '@ai-office/db';
import {
  executeAgent,
  loadMemory,
  toolRegistry,
  DEFAULT_SAFETY_LIMITS,
} from '@ai-office/ai';
import type { AgentContext, AgentSession } from '@ai-office/ai';
import * as Sentry from '@sentry/node';
import { randomUUID } from 'crypto';

interface AgentExecutionJobData {
  agentId: string;
  projectId: string;
  sessionId?: string;
  triggerPayload?: unknown;
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

  // 2. Claim agent with CAS (compare-and-swap) to prevent concurrent execution
  const [claimed] = await db
    .update(agents)
    .set({ status: 'working' })
    .where(and(eq(agents.id, agentId), eq(agents.status, 'idle')))
    .returning();

  if (!claimed) {
    console.log(`[agent-execution] Agent ${agentId} is already working or not idle, skipping`);
    return;
  }

  try {
    // 3. Load agent memory
    const memory = await loadMemory(agentId, projectId);

    // 4. Build AgentContext
    const config = agent.config ?? { model: 'claude-sonnet-4-6', temperature: 0.7, maxTokens: 4096, budget: 1.0 };
    const agentTools = agent.tools
      ? toolRegistry.getByNames(agent.tools)
      : toolRegistry.getAll();

    const systemPrompt = agent.systemPromptEn ?? agent.systemPromptPtBr ??
      `You are ${agent.name}, a ${agent.archetype} agent. Complete the assigned task using the available tools.`;

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

    // 5. Create session
    const session: AgentSession = {
      sessionId,
      agentId,
      projectId,
      startedAt: new Date(),
      actionCount: 0,
      totalTokens: 0,
      totalCostUsd: 0,
      status: 'running',
    };

    // 6. Execute
    const result = await executeAgent(context, session, {
      ...DEFAULT_SAFETY_LIMITS,
      maxActionsPerSession: agent.maxActionsPerSession,
      maxTokensPerSession: config.budget ? config.budget * 100_000 : 100_000,
    });

    console.log(
      `[agent-execution] Session ${sessionId} completed:`,
      `status=${result.status}`,
      `actions=${result.actions.length}`,
      `tokens=${result.totalTokens}`,
      `cost=$${result.totalCostUsd.toFixed(4)}`,
      `duration=${result.durationMs}ms`,
    );

    // 7. Update agent status
    await db
      .update(agents)
      .set({ status: result.status === 'completed' ? 'idle' : 'error' })
      .where(eq(agents.id, agentId));

  } catch (err) {
    console.error(`[agent-execution] Session ${sessionId} failed:`, err);
    Sentry.captureException(err, {
      tags: { agentId, projectId, sessionId },
    });

    // Update agent status to error
    await db.update(agents).set({ status: 'error' }).where(eq(agents.id, agentId));

    throw err;
  }
}
