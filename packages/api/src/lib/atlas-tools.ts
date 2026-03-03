import { z } from 'zod';
import {
  db,
  agents,
  workflows,
  strategies,
  strategyKpis,
  strategyLearnings,
  humanTasks,
  actionLogs,
  orchestratorConfig,
  approvals,
  workflowRuns,
  wikiArticles,
  calendarEvents,
  eq,
  and,
  desc,
  sql,
  count,
  gte,
} from '@ai-office/db';
import { ragSearch } from '@ai-office/ai';
import { getAgentExecutionQueue, getWorkflowExecutionQueue, toBullMQPriority } from '@ai-office/queue';
import { randomUUID } from 'crypto';

/** Minimal Anthropic Tool shape — avoids importing the full SDK */
interface AnthropicTool {
  name: string;
  description: string;
  input_schema: { type: 'object'; properties: Record<string, unknown>; required?: string[] };
}

// ── Zod → JSON Schema conversion (reused from packages/ai/src/tools/registry.ts) ──

function zodToJsonSchema(schema: z.ZodType): Record<string, unknown> {
  if (schema instanceof z.ZodObject) {
    const shape = schema.shape as Record<string, z.ZodType>;
    const properties: Record<string, unknown> = {};
    const required: string[] = [];

    for (const [key, value] of Object.entries(shape)) {
      properties[key] = zodTypeToJsonSchema(value);
      if (!(value instanceof z.ZodOptional)) {
        required.push(key);
      }
    }

    return {
      type: 'object' as const,
      properties,
      ...(required.length > 0 ? { required } : {}),
    };
  }
  return { type: 'object' as const, properties: {} };
}

function zodTypeToJsonSchema(schema: z.ZodType): Record<string, unknown> {
  if (schema instanceof z.ZodString) return { type: 'string', description: schema.description };
  if (schema instanceof z.ZodNumber) return { type: 'number', description: schema.description };
  if (schema instanceof z.ZodBoolean) return { type: 'boolean', description: schema.description };
  if (schema instanceof z.ZodOptional) return zodTypeToJsonSchema(schema.unwrap());
  if (schema instanceof z.ZodArray)
    return { type: 'array', items: zodTypeToJsonSchema(schema.element) };
  if (schema instanceof z.ZodEnum)
    return { type: 'string', enum: schema.options, description: schema.description };
  return { type: 'string' };
}

// ── Types ──

export interface AtlasToolDefinition {
  name: string;
  description: string;
  inputSchema: z.ZodType;
  requiresApproval: boolean;
  execute: (input: unknown, projectId: string) => Promise<unknown>;
}

// ── Tool Registry ──

const atlasTools = new Map<string, AtlasToolDefinition>();

function registerTool(tool: AtlasToolDefinition): void {
  atlasTools.set(tool.name, tool);
}

// ── Read-Only Tools (auto-execute) ──

registerTool({
  name: 'list_agents',
  description:
    'List all agents in the project with their status, team, and archetype. Use this to answer questions about how many agents exist, their roles, or their current state.',
  inputSchema: z.object({}),
  requiresApproval: false,
  execute: async (_input, projectId) => {
    const rows = await db
      .select({
        id: agents.id,
        name: agents.name,
        slug: agents.slug,
        archetype: agents.archetype,
        status: agents.status,
        team: agents.team,
        isActive: agents.isActive,
      })
      .from(agents)
      .where(eq(agents.projectId, projectId))
      .orderBy(agents.name)
      .limit(50);
    return { agents: rows, count: rows.length };
  },
});

registerTool({
  name: 'get_agent',
  description:
    'Get detailed information about a specific agent by ID, including its prompt, tools, config, and trigger settings.',
  inputSchema: z.object({
    agentId: z.string().describe('The UUID of the agent to look up'),
  }),
  requiresApproval: false,
  execute: async (input, projectId) => {
    const { agentId } = input as { agentId: string };
    const [agent] = await db
      .select()
      .from(agents)
      .where(and(eq(agents.id, agentId), eq(agents.projectId, projectId)))
      .limit(1);
    if (!agent) return { error: 'Agent not found' };
    return agent;
  },
});

registerTool({
  name: 'list_workflows',
  description: 'List all workflows in the project with their active status.',
  inputSchema: z.object({}),
  requiresApproval: false,
  execute: async (_input, projectId) => {
    const rows = await db
      .select({
        id: workflows.id,
        name: workflows.name,
        description: workflows.description,
        isActive: workflows.isActive,
        createdAt: workflows.createdAt,
      })
      .from(workflows)
      .where(eq(workflows.projectId, projectId))
      .orderBy(workflows.name)
      .limit(50);
    return { workflows: rows, count: rows.length };
  },
});

registerTool({
  name: 'get_workflow',
  description: 'Get detailed information about a specific workflow by ID, including its definition.',
  inputSchema: z.object({
    workflowId: z.string().describe('The UUID of the workflow'),
  }),
  requiresApproval: false,
  execute: async (input, projectId) => {
    const { workflowId } = input as { workflowId: string };
    const [workflow] = await db
      .select()
      .from(workflows)
      .where(and(eq(workflows.id, workflowId), eq(workflows.projectId, projectId)))
      .limit(1);
    if (!workflow) return { error: 'Workflow not found' };
    return workflow;
  },
});

registerTool({
  name: 'list_strategies',
  description:
    'List all strategies with their type (growth/retention/brand/product) and status (planned/active/at_risk/completed).',
  inputSchema: z.object({}),
  requiresApproval: false,
  execute: async (_input, projectId) => {
    const rows = await db
      .select({
        id: strategies.id,
        type: strategies.type,
        status: strategies.status,
        startDate: strategies.startDate,
        endDate: strategies.endDate,
        version: strategies.version,
        createdAt: strategies.createdAt,
      })
      .from(strategies)
      .where(eq(strategies.projectId, projectId))
      .orderBy(desc(strategies.createdAt))
      .limit(20);
    return { strategies: rows, count: rows.length };
  },
});

registerTool({
  name: 'get_strategy',
  description:
    'Get a specific strategy by ID including its KPIs and learnings from agents.',
  inputSchema: z.object({
    strategyId: z.string().describe('The UUID of the strategy'),
  }),
  requiresApproval: false,
  execute: async (input, projectId) => {
    const { strategyId } = input as { strategyId: string };
    const [strategy] = await db
      .select()
      .from(strategies)
      .where(and(eq(strategies.id, strategyId), eq(strategies.projectId, projectId)))
      .limit(1);
    if (!strategy) return { error: 'Strategy not found' };

    const [kpis, learnings] = await Promise.all([
      db
        .select()
        .from(strategyKpis)
        .where(
          and(eq(strategyKpis.strategyId, strategyId), eq(strategyKpis.projectId, projectId)),
        ),
      db
        .select()
        .from(strategyLearnings)
        .where(
          and(
            eq(strategyLearnings.strategyId, strategyId),
            eq(strategyLearnings.projectId, projectId),
          ),
        )
        .orderBy(desc(strategyLearnings.createdAt))
        .limit(20),
    ]);

    return { ...strategy, kpis, learnings };
  },
});

registerTool({
  name: 'get_analytics',
  description:
    'Get action log analytics for the project: total actions, total tokens, total cost, and action counts by type for the last N days.',
  inputSchema: z.object({
    days: z.number().optional().describe('Number of days to look back (default: 7)'),
  }),
  requiresApproval: false,
  execute: async (input, projectId) => {
    const { days = 7 } = input as { days?: number };
    const since = new Date(Date.now() - days * 86_400_000);

    const [totals] = await db
      .select({
        totalActions: count(),
        totalTokens: sql<number>`coalesce(sum(${actionLogs.tokensUsed}), 0)`,
        totalCost: sql<number>`coalesce(sum(${actionLogs.costUsd}::numeric), 0)`,
      })
      .from(actionLogs)
      .where(and(eq(actionLogs.projectId, projectId), gte(actionLogs.createdAt, since)));

    const byType = await db
      .select({
        actionType: actionLogs.actionType,
        count: count(),
      })
      .from(actionLogs)
      .where(and(eq(actionLogs.projectId, projectId), gte(actionLogs.createdAt, since)))
      .groupBy(actionLogs.actionType);

    return {
      days,
      since: since.toISOString(),
      totalActions: totals?.totalActions ?? 0,
      totalTokens: totals?.totalTokens ?? 0,
      totalCostUsd: totals?.totalCost ?? 0,
      byType,
    };
  },
});

registerTool({
  name: 'list_pending_approvals',
  description: 'List all pending approval requests across all agents in the project.',
  inputSchema: z.object({}),
  requiresApproval: false,
  execute: async (_input, projectId) => {
    const rows = await db
      .select({
        id: actionLogs.id,
        agentId: actionLogs.agentId,
        actionType: actionLogs.actionType,
        toolName: actionLogs.toolName,
        input: actionLogs.input,
        createdAt: actionLogs.createdAt,
      })
      .from(actionLogs)
      .where(
        and(
          eq(actionLogs.projectId, projectId),
          eq(actionLogs.status, 'pending'),
          eq(actionLogs.actionType, 'approval_request'),
        ),
      )
      .orderBy(desc(actionLogs.createdAt))
      .limit(20);
    return { approvals: rows, count: rows.length };
  },
});

registerTool({
  name: 'list_human_tasks',
  description:
    'List human tasks, optionally filtered by status (todo/in_progress/done). Shows title, priority, assignee.',
  inputSchema: z.object({
    status: z
      .enum(['todo', 'in_progress', 'done'])
      .optional()
      .describe('Filter by task status'),
  }),
  requiresApproval: false,
  execute: async (input, projectId) => {
    const { status } = input as { status?: string };
    const conditions = [eq(humanTasks.projectId, projectId)];
    if (status) {
      conditions.push(eq(humanTasks.status, status as 'todo' | 'in_progress' | 'done'));
    }

    const rows = await db
      .select({
        id: humanTasks.id,
        title: humanTasks.title,
        description: humanTasks.description,
        status: humanTasks.status,
        priority: humanTasks.priority,
        assignedTo: humanTasks.assignedTo,
        dueAt: humanTasks.dueAt,
        createdAt: humanTasks.createdAt,
      })
      .from(humanTasks)
      .where(and(...conditions))
      .orderBy(desc(humanTasks.createdAt))
      .limit(30);
    return { tasks: rows, count: rows.length };
  },
});

registerTool({
  name: 'search_memory',
  description:
    'Search the company knowledge base using semantic similarity (RAG). Returns relevant document chunks ranked by relevance. Use this for questions about company knowledge, docs, or past research.',
  inputSchema: z.object({
    query: z.string().describe('Natural language search query'),
    topK: z.number().optional().describe('Number of results (default: 5, max: 20)'),
  }),
  requiresApproval: false,
  execute: async (input, projectId) => {
    const { query, topK = 5 } = input as { query: string; topK?: number };
    try {
      const results = await ragSearch({
        projectId,
        query,
        topK: Math.min(topK, 20),
      });
      return {
        query,
        resultCount: results.length,
        results: results.map((r) => ({
          content: r.content,
          source: r.documentTitle,
          sourceType: r.sourceType,
          score: Math.round(r.score * 100) / 100,
        })),
      };
    } catch (err) {
      return {
        query,
        resultCount: 0,
        results: [],
        error: err instanceof Error ? err.message : 'Search failed',
      };
    }
  },
});

// ── Mutation Tools (require approval) ──

registerTool({
  name: 'create_agent',
  description:
    'Create a new AI agent in the project. Requires user approval. Provide a name, slug, archetype, system prompt, and optionally a team assignment.',
  inputSchema: z.object({
    name: z.string().describe('Agent display name'),
    slug: z.string().describe('URL-friendly slug (lowercase, hyphens)'),
    archetype: z
      .enum([
        'support',
        'sales',
        'marketing',
        'data_analyst',
        'content_writer',
        'developer',
        'project_manager',
        'hr',
        'finance',
        'research',
        'custom',
      ])
      .describe('Agent archetype/role'),
    systemPromptEn: z.string().describe('System prompt in English'),
    team: z
      .enum(['development', 'research', 'marketing', 'sales', 'support', 'finance', 'operations'])
      .optional()
      .describe('Team assignment'),
  }),
  requiresApproval: true,
  execute: async (input, projectId) => {
    const { name, slug, archetype, systemPromptEn, team } = input as {
      name: string;
      slug: string;
      archetype: string;
      systemPromptEn: string;
      team?: string;
    };

    const [created] = await db
      .insert(agents)
      .values({
        projectId,
        name,
        slug,
        archetype: archetype as any,
        systemPromptEn,
        team: team as any,
        status: 'idle',
        isActive: true,
      })
      .returning({ id: agents.id, name: agents.name, slug: agents.slug });

    return { created: true, agent: created };
  },
});

registerTool({
  name: 'update_agent',
  description:
    'Update an existing agent\'s configuration. Requires user approval. Can modify name, prompt, tools, status, team, or active state.',
  inputSchema: z.object({
    agentId: z.string().describe('UUID of the agent to update'),
    name: z.string().optional().describe('New display name'),
    systemPromptEn: z.string().optional().describe('New system prompt in English'),
    tools: z.array(z.string()).optional().describe('Updated list of tool names'),
    status: z
      .enum(['idle', 'working', 'awaiting_approval', 'error', 'offline'])
      .optional()
      .describe('New status'),
    team: z
      .enum(['development', 'research', 'marketing', 'sales', 'support', 'finance', 'operations'])
      .optional()
      .describe('New team'),
    isActive: z.boolean().optional().describe('Enable or disable the agent'),
  }),
  requiresApproval: true,
  execute: async (input, projectId) => {
    const { agentId, ...updates } = input as {
      agentId: string;
      name?: string;
      systemPromptEn?: string;
      tools?: string[];
      status?: string;
      team?: string;
      isActive?: boolean;
    };

    // Build update payload, only including provided fields
    const payload: Record<string, unknown> = {};
    if (updates.name !== undefined) payload.name = updates.name;
    if (updates.systemPromptEn !== undefined) payload.systemPromptEn = updates.systemPromptEn;
    if (updates.tools !== undefined) payload.tools = updates.tools;
    if (updates.status !== undefined) payload.status = updates.status;
    if (updates.team !== undefined) payload.team = updates.team;
    if (updates.isActive !== undefined) payload.isActive = updates.isActive;

    if (Object.keys(payload).length === 0) {
      return { error: 'No fields to update' };
    }

    const [updated] = await db
      .update(agents)
      .set(payload as any)
      .where(and(eq(agents.id, agentId), eq(agents.projectId, projectId)))
      .returning({ id: agents.id, name: agents.name });

    if (!updated) return { error: 'Agent not found' };
    return { updated: true, agent: updated };
  },
});

registerTool({
  name: 'trigger_agent',
  description:
    'Trigger an agent to run now by enqueuing a BullMQ execution job. Requires user approval. The agent will execute its configured prompt and tools.',
  inputSchema: z.object({
    agentId: z.string().describe('UUID of the agent to trigger'),
  }),
  requiresApproval: true,
  execute: async (input, projectId) => {
    const { agentId } = input as { agentId: string };

    // Verify agent exists
    const [agent] = await db
      .select({ id: agents.id, name: agents.name, status: agents.status, config: agents.config })
      .from(agents)
      .where(and(eq(agents.id, agentId), eq(agents.projectId, projectId)))
      .limit(1);

    if (!agent) return { error: 'Agent not found' };

    const priority = (agent.config as { priority?: string } | null)?.priority;
    const sessionId = randomUUID();
    const queue = getAgentExecutionQueue();
    await queue.add(
      'agent-execution',
      { agentId, projectId, sessionId, triggerType: 'manual' as const },
      { priority: toBullMQPriority(priority) },
    );

    return { triggered: true, agent: agent.name, sessionId, priority: priority ?? 'normal' };
  },
});

registerTool({
  name: 'create_workflow',
  description:
    'Create a new workflow in the project. Requires user approval. Workflows define automated sequences of agent tasks.',
  inputSchema: z.object({
    name: z.string().describe('Workflow name'),
    description: z.string().optional().describe('Workflow description'),
  }),
  requiresApproval: true,
  execute: async (input, projectId) => {
    const { name, description } = input as { name: string; description?: string };

    const [created] = await db
      .insert(workflows)
      .values({
        projectId,
        name,
        description: description ?? null,
        isActive: true,
      })
      .returning({ id: workflows.id, name: workflows.name });

    return { created: true, workflow: created };
  },
});

registerTool({
  name: 'update_strategy',
  description:
    'Update a strategy\'s status, draft content, or dates. Requires user approval.',
  inputSchema: z.object({
    strategyId: z.string().describe('UUID of the strategy'),
    status: z
      .enum(['planned', 'active', 'at_risk', 'completed'])
      .optional()
      .describe('New status'),
    userDraft: z.string().optional().describe('Updated draft text'),
    startDate: z.string().optional().describe('Start date (ISO 8601)'),
    endDate: z.string().optional().describe('End date (ISO 8601)'),
  }),
  requiresApproval: true,
  execute: async (input, projectId) => {
    const { strategyId, ...updates } = input as {
      strategyId: string;
      status?: string;
      userDraft?: string;
      startDate?: string;
      endDate?: string;
    };

    const payload: Record<string, unknown> = {};
    if (updates.status !== undefined) payload.status = updates.status;
    if (updates.userDraft !== undefined) payload.userDraft = updates.userDraft;
    if (updates.startDate !== undefined) payload.startDate = new Date(updates.startDate);
    if (updates.endDate !== undefined) payload.endDate = new Date(updates.endDate);

    if (Object.keys(payload).length === 0) {
      return { error: 'No fields to update' };
    }

    const [updated] = await db
      .update(strategies)
      .set(payload as any)
      .where(and(eq(strategies.id, strategyId), eq(strategies.projectId, projectId)))
      .returning({ id: strategies.id, type: strategies.type, status: strategies.status });

    if (!updated) return { error: 'Strategy not found' };
    return { updated: true, strategy: updated };
  },
});

registerTool({
  name: 'create_human_task',
  description:
    'Create a new task for a human team member. Requires user approval. Specify title, description, and priority.',
  inputSchema: z.object({
    title: z.string().describe('Task title'),
    description: z.string().optional().describe('Task description with details'),
    priority: z
      .enum(['low', 'medium', 'high', 'urgent'])
      .optional()
      .describe('Task priority (default: medium)'),
  }),
  requiresApproval: true,
  execute: async (input, projectId) => {
    const { title, description, priority = 'medium' } = input as {
      title: string;
      description?: string;
      priority?: string;
    };

    const [created] = await db
      .insert(humanTasks)
      .values({
        projectId,
        title,
        description: description ?? null,
        priority: priority as any,
        status: 'todo',
      })
      .returning({ id: humanTasks.id, title: humanTasks.title });

    return { created: true, task: created };
  },
});

// ── Orchestrator Tools ──

registerTool({
  name: 'get_fleet_status',
  description:
    'Get the current fleet status: agent counts by status (idle/working/error/offline), running workflows, pending approvals, and cost summary for today and this month.',
  inputSchema: z.object({}),
  requiresApproval: false,
  execute: async (_input, projectId) => {
    // Agent counts by status
    const agentCounts = await db
      .select({ status: agents.status, count: count() })
      .from(agents)
      .where(and(eq(agents.projectId, projectId), eq(agents.isActive, true)))
      .groupBy(agents.status);

    const agentsByStatus: Record<string, number> = {};
    for (const row of agentCounts) {
      agentsByStatus[row.status] = Number(row.count);
    }

    const [runningWorkflows] = await db
      .select({ count: count() })
      .from(workflowRuns)
      .where(and(eq(workflowRuns.projectId, projectId), eq(workflowRuns.status, 'running')));

    const [pendingApprovalCount] = await db
      .select({ count: count() })
      .from(approvals)
      .where(and(eq(approvals.projectId, projectId), eq(approvals.status, 'pending')));

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const [todayCost] = await db
      .select({
        cost: sql<number>`coalesce(sum(${actionLogs.costUsd}::numeric), 0)`,
        tokens: sql<number>`coalesce(sum(${actionLogs.tokensUsed}), 0)`,
      })
      .from(actionLogs)
      .where(and(eq(actionLogs.projectId, projectId), gte(actionLogs.createdAt, today)));

    return {
      agents: {
        idle: agentsByStatus['idle'] ?? 0,
        working: agentsByStatus['working'] ?? 0,
        awaiting_approval: agentsByStatus['awaiting_approval'] ?? 0,
        error: agentsByStatus['error'] ?? 0,
        offline: agentsByStatus['offline'] ?? 0,
      },
      workflowsRunning: Number(runningWorkflows?.count ?? 0),
      pendingApprovals: Number(pendingApprovalCount?.count ?? 0),
      todayCostUsd: Number(todayCost?.cost ?? 0),
      todayTokens: Number(todayCost?.tokens ?? 0),
    };
  },
});

registerTool({
  name: 'get_cost_report',
  description:
    'Get a cost breakdown by agent for the last N days, including total cost, tokens used, and action count per agent.',
  inputSchema: z.object({
    days: z.number().optional().describe('Number of days to look back (default: 7)'),
  }),
  requiresApproval: false,
  execute: async (input, projectId) => {
    const { days = 7 } = input as { days?: number };
    const since = new Date(Date.now() - days * 86_400_000);

    const perAgent = await db
      .select({
        agentId: actionLogs.agentId,
        agentName: agents.name,
        totalCost: sql<number>`coalesce(sum(${actionLogs.costUsd}::numeric), 0)`,
        totalTokens: sql<number>`coalesce(sum(${actionLogs.tokensUsed}), 0)`,
        actionCount: count(),
      })
      .from(actionLogs)
      .innerJoin(agents, eq(actionLogs.agentId, agents.id))
      .where(and(eq(actionLogs.projectId, projectId), gte(actionLogs.createdAt, since)))
      .groupBy(actionLogs.agentId, agents.name)
      .orderBy(sql`sum(${actionLogs.costUsd}::numeric) DESC NULLS LAST`);

    const total = perAgent.reduce((sum, r) => sum + Number(r.totalCost), 0);

    return {
      days,
      totalCostUsd: Math.round(total * 100) / 100,
      perAgent: perAgent.map((r) => ({
        agentId: r.agentId,
        name: r.agentName,
        costUsd: Number(r.totalCost),
        tokens: Number(r.totalTokens),
        actions: Number(r.actionCount),
      })),
    };
  },
});

registerTool({
  name: 'get_orchestrator_config',
  description:
    'Get the orchestrator configuration: max concurrency, budget limits, and priority rules.',
  inputSchema: z.object({}),
  requiresApproval: false,
  execute: async (_input, projectId) => {
    const [config] = await db
      .select()
      .from(orchestratorConfig)
      .where(eq(orchestratorConfig.projectId, projectId))
      .limit(1);

    if (!config) {
      return {
        configured: false,
        maxConcurrency: 5,
        dailySpendLimitUsd: 0,
        monthlySpendLimitUsd: 0,
        priorityRules: [],
      };
    }

    return {
      configured: true,
      maxConcurrency: config.maxConcurrency,
      dailyTokenBudget: config.dailyTokenBudget,
      monthlyTokenBudget: config.monthlyTokenBudget,
      dailySpendLimitUsd: Number(config.dailySpendLimitUsd),
      monthlySpendLimitUsd: Number(config.monthlySpendLimitUsd),
      priorityRules: config.priorityRules ?? [],
    };
  },
});

registerTool({
  name: 'update_orchestrator_config',
  description:
    'Update the orchestrator configuration: max concurrency, budget limits. Requires user approval.',
  inputSchema: z.object({
    maxConcurrency: z.number().optional().describe('Max agents running concurrently (1-50)'),
    dailySpendLimitUsd: z.number().optional().describe('Daily USD spend limit (0 = unlimited)'),
    monthlySpendLimitUsd: z.number().optional().describe('Monthly USD spend limit (0 = unlimited)'),
  }),
  requiresApproval: true,
  execute: async (input, projectId) => {
    const { maxConcurrency, dailySpendLimitUsd, monthlySpendLimitUsd } = input as {
      maxConcurrency?: number;
      dailySpendLimitUsd?: number;
      monthlySpendLimitUsd?: number;
    };

    const payload: Record<string, unknown> = {};
    if (maxConcurrency !== undefined) payload.maxConcurrency = maxConcurrency;
    if (dailySpendLimitUsd !== undefined) payload.dailySpendLimitUsd = String(dailySpendLimitUsd);
    if (monthlySpendLimitUsd !== undefined) payload.monthlySpendLimitUsd = String(monthlySpendLimitUsd);

    if (Object.keys(payload).length === 0) {
      return { error: 'No fields to update' };
    }

    // Upsert
    const [existing] = await db
      .select({ id: orchestratorConfig.id })
      .from(orchestratorConfig)
      .where(eq(orchestratorConfig.projectId, projectId))
      .limit(1);

    if (!existing) {
      await db.insert(orchestratorConfig).values({ projectId, ...payload } as any);
    } else {
      await db.update(orchestratorConfig).set(payload as any).where(eq(orchestratorConfig.projectId, projectId));
    }

    return { updated: true, ...payload };
  },
});

registerTool({
  name: 'pause_agents_by_team',
  description:
    'Pause all active agents on a specific team by setting them to offline. Requires user approval.',
  inputSchema: z.object({
    team: z
      .enum(['development', 'research', 'marketing', 'sales', 'support', 'finance', 'operations'])
      .describe('Team to pause'),
  }),
  requiresApproval: true,
  execute: async (input, projectId) => {
    const { team } = input as { team: string };
    const result = await db
      .update(agents)
      .set({ status: 'offline' })
      .where(
        and(
          eq(agents.projectId, projectId),
          eq(agents.team, team as any),
          eq(agents.isActive, true),
        ),
      )
      .returning({ id: agents.id, name: agents.name });

    return { paused: result.length, agents: result };
  },
});

registerTool({
  name: 'resume_agents_by_team',
  description:
    'Resume all offline agents on a specific team by setting them back to idle. Requires user approval.',
  inputSchema: z.object({
    team: z
      .enum(['development', 'research', 'marketing', 'sales', 'support', 'finance', 'operations'])
      .describe('Team to resume'),
  }),
  requiresApproval: true,
  execute: async (input, projectId) => {
    const { team } = input as { team: string };
    const result = await db
      .update(agents)
      .set({ status: 'idle' })
      .where(
        and(
          eq(agents.projectId, projectId),
          eq(agents.team, team as any),
          eq(agents.status, 'offline'),
          eq(agents.isActive, true),
        ),
      )
      .returning({ id: agents.id, name: agents.name });

    return { resumed: result.length, agents: result };
  },
});

registerTool({
  name: 'set_agent_priority',
  description:
    'Set an agent\'s execution priority. Higher priority agents are scheduled first by the orchestrator. Requires user approval.',
  inputSchema: z.object({
    agentId: z.string().describe('UUID of the agent'),
    priority: z.enum(['critical', 'high', 'normal', 'low']).describe('New priority level'),
  }),
  requiresApproval: true,
  execute: async (input, projectId) => {
    const { agentId, priority } = input as { agentId: string; priority: string };

    // Store priority in agent config JSONB
    const [agent] = await db
      .select({ id: agents.id, name: agents.name, config: agents.config })
      .from(agents)
      .where(and(eq(agents.id, agentId), eq(agents.projectId, projectId)))
      .limit(1);

    if (!agent) return { error: 'Agent not found' };

    const currentConfig = (agent.config ?? { model: 'claude-sonnet-4-5-20250514', temperature: 0.7, maxTokens: 4096, budget: 10 }) as Record<string, unknown>;
    const updatedConfig = { ...currentConfig, priority };

    await db
      .update(agents)
      .set({ config: updatedConfig as any })
      .where(eq(agents.id, agentId));

    return { updated: true, agentName: agent.name, priority };
  },
});

// ── New Phase 7 Tools ──

registerTool({
  name: 'search_action_logs',
  description:
    'Search action logs with filters: agent, status, action type, or tool name. Returns recent log entries.',
  inputSchema: z.object({
    agentId: z.string().optional().describe('Filter by agent UUID'),
    status: z.enum(['pending', 'completed', 'failed', 'cancelled']).optional().describe('Filter by status'),
    actionType: z.enum(['tool_call', 'llm_response', 'approval_request']).optional().describe('Filter by action type'),
    limit: z.number().optional().describe('Number of results (default: 20, max: 100)'),
  }),
  requiresApproval: false,
  execute: async (input, projectId) => {
    const { agentId, status, actionType, limit = 20 } = input as {
      agentId?: string;
      status?: string;
      actionType?: string;
      limit?: number;
    };
    const conditions = [eq(actionLogs.projectId, projectId)];
    if (agentId) conditions.push(eq(actionLogs.agentId, agentId));
    if (status) conditions.push(eq(actionLogs.status, status as any));
    if (actionType) conditions.push(eq(actionLogs.actionType, actionType));

    const rows = await db
      .select({
        id: actionLogs.id,
        agentId: actionLogs.agentId,
        sessionId: actionLogs.sessionId,
        actionType: actionLogs.actionType,
        toolName: actionLogs.toolName,
        status: actionLogs.status,
        costUsd: actionLogs.costUsd,
        tokensUsed: actionLogs.tokensUsed,
        createdAt: actionLogs.createdAt,
      })
      .from(actionLogs)
      .where(and(...conditions))
      .orderBy(desc(actionLogs.createdAt))
      .limit(Math.min(limit, 100));

    return { logs: rows, count: rows.length };
  },
});

registerTool({
  name: 'trigger_workflow',
  description:
    'Trigger a workflow to execute now by creating a run and enqueuing it. Requires user approval.',
  inputSchema: z.object({
    workflowId: z.string().describe('UUID of the workflow to trigger'),
    variables: z.record(z.string()).optional().describe('Optional variables to pass to the workflow'),
  }),
  requiresApproval: true,
  execute: async (input, projectId) => {
    const { workflowId, variables = {} } = input as { workflowId: string; variables?: Record<string, string> };

    const [workflow] = await db
      .select({ id: workflows.id, name: workflows.name, isActive: workflows.isActive })
      .from(workflows)
      .where(and(eq(workflows.id, workflowId), eq(workflows.projectId, projectId)))
      .limit(1);

    if (!workflow) return { error: 'Workflow not found' };
    if (!workflow.isActive) return { error: 'Workflow is inactive' };

    const [run] = await db
      .insert(workflowRuns)
      .values({ workflowId, projectId, variables })
      .returning({ id: workflowRuns.id });

    if (!run) return { error: 'Failed to create workflow run' };

    await getWorkflowExecutionQueue().add(`atlas-workflow-${workflowId}-${run.id}`, {
      workflowId,
      workflowRunId: run.id,
      projectId,
      variables,
    });

    return { triggered: true, workflowName: workflow.name, runId: run.id };
  },
});

registerTool({
  name: 'update_wiki_article',
  description:
    'Update the content of a wiki article. Requires user approval.',
  inputSchema: z.object({
    articleId: z.string().describe('UUID of the wiki article'),
    title: z.string().optional().describe('New title'),
    content: z.string().optional().describe('New content (markdown)'),
  }),
  requiresApproval: true,
  execute: async (input, projectId) => {
    const { articleId, title, content } = input as { articleId: string; title?: string; content?: string };

    const payload: Record<string, unknown> = {};
    if (title !== undefined) payload.title = title;
    if (content !== undefined) payload.content = content;

    if (Object.keys(payload).length === 0) return { error: 'No fields to update' };

    const [updated] = await db
      .update(wikiArticles)
      .set(payload as any)
      .where(and(eq(wikiArticles.id, articleId), eq(wikiArticles.projectId, projectId)))
      .returning({ id: wikiArticles.id, title: wikiArticles.title });

    if (!updated) return { error: 'Article not found' };
    return { updated: true, article: updated };
  },
});

registerTool({
  name: 'manage_calendar',
  description:
    'Create, update, or list calendar events for the project. Listing is auto-executed; create/update requires approval.',
  inputSchema: z.object({
    action: z.enum(['list', 'create', 'update']).describe('Action to perform'),
    eventId: z.string().optional().describe('Event UUID (for update)'),
    title: z.string().optional().describe('Event title (for create/update)'),
    description: z.string().optional().describe('Event description'),
    startAt: z.string().optional().describe('Start time (ISO 8601)'),
    endAt: z.string().optional().describe('End time (ISO 8601)'),
    isAllDay: z.boolean().optional().describe('All-day event'),
  }),
  requiresApproval: true,
  execute: async (input, projectId) => {
    const { action, eventId, title, description, startAt, endAt, isAllDay } = input as {
      action: 'list' | 'create' | 'update';
      eventId?: string;
      title?: string;
      description?: string;
      startAt?: string;
      endAt?: string;
      isAllDay?: boolean;
    };

    if (action === 'list') {
      const events = await db
        .select({
          id: calendarEvents.id,
          title: calendarEvents.title,
          startAt: calendarEvents.startAt,
          endAt: calendarEvents.endAt,
          allDay: calendarEvents.allDay,
        })
        .from(calendarEvents)
        .where(eq(calendarEvents.projectId, projectId))
        .orderBy(calendarEvents.startAt)
        .limit(30);
      return { events, count: events.length };
    }

    if (action === 'create') {
      if (!title || !startAt) return { error: 'title and startAt required' };
      const [created] = await db
        .insert(calendarEvents)
        .values({
          projectId,
          title,
          description: description ?? null,
          eventType: 'custom',
          startAt: new Date(startAt),
          endAt: endAt ? new Date(endAt) : null,
          allDay: isAllDay ?? false,
        })
        .returning({ id: calendarEvents.id, title: calendarEvents.title });
      return { created: true, event: created };
    }

    if (action === 'update' && eventId) {
      const payload: Record<string, unknown> = {};
      if (title !== undefined) payload.title = title;
      if (description !== undefined) payload.description = description;
      if (startAt !== undefined) payload.startAt = new Date(startAt);
      if (endAt !== undefined) payload.endAt = new Date(endAt);
      if (isAllDay !== undefined) payload.allDay = isAllDay;

      const [updated] = await db
        .update(calendarEvents)
        .set(payload as any)
        .where(and(eq(calendarEvents.id, eventId), eq(calendarEvents.projectId, projectId)))
        .returning({ id: calendarEvents.id, title: calendarEvents.title });
      if (!updated) return { error: 'Event not found' };
      return { updated: true, event: updated };
    }

    return { error: 'Invalid action or missing eventId for update' };
  },
});

registerTool({
  name: 'create_strategy_kpi',
  description:
    'Create a new KPI for a strategy. Requires user approval.',
  inputSchema: z.object({
    strategyId: z.string().describe('UUID of the strategy'),
    name: z.string().describe('KPI name (e.g., "MRR", "Churn Rate")'),
    targetValue: z.string().describe('Target value as string'),
    currentValue: z.string().optional().describe('Current value (default: "0")'),
    unit: z.string().optional().describe('Unit (e.g., "USD", "%", "users")'),
  }),
  requiresApproval: true,
  execute: async (input, projectId) => {
    const { strategyId, name, targetValue, currentValue = '0', unit } = input as {
      strategyId: string;
      name: string;
      targetValue: string;
      currentValue?: string;
      unit?: string;
    };

    const [strategy] = await db
      .select({ id: strategies.id })
      .from(strategies)
      .where(and(eq(strategies.id, strategyId), eq(strategies.projectId, projectId)))
      .limit(1);
    if (!strategy) return { error: 'Strategy not found' };

    const [created] = await db
      .insert(strategyKpis)
      .values({
        strategyId,
        projectId,
        name,
        targetValue,
        currentValue,
        unit: unit ?? null,
      })
      .returning({ id: strategyKpis.id, name: strategyKpis.name });

    return { created: true, kpi: created };
  },
});

registerTool({
  name: 'update_strategy_kpi',
  description:
    'Update a KPI value or target. Requires user approval.',
  inputSchema: z.object({
    kpiId: z.string().describe('UUID of the KPI'),
    currentValue: z.string().optional().describe('New current value'),
    targetValue: z.string().optional().describe('New target value'),
  }),
  requiresApproval: true,
  execute: async (input, projectId) => {
    const { kpiId, currentValue, targetValue } = input as {
      kpiId: string;
      currentValue?: string;
      targetValue?: string;
    };

    const payload: Record<string, unknown> = {};
    if (currentValue !== undefined) payload.currentValue = currentValue;
    if (targetValue !== undefined) payload.targetValue = targetValue;
    if (Object.keys(payload).length === 0) return { error: 'No fields to update' };

    const [updated] = await db
      .update(strategyKpis)
      .set(payload as any)
      .where(and(eq(strategyKpis.id, kpiId), eq(strategyKpis.projectId, projectId)))
      .returning({ id: strategyKpis.id, name: strategyKpis.name });

    if (!updated) return { error: 'KPI not found' };
    return { updated: true, kpi: updated };
  },
});

registerTool({
  name: 'get_kpi_trends',
  description:
    'Get all KPIs for a strategy with current vs target values and progress percentage.',
  inputSchema: z.object({
    strategyId: z.string().describe('UUID of the strategy'),
  }),
  requiresApproval: false,
  execute: async (input, projectId) => {
    const { strategyId } = input as { strategyId: string };
    const kpis = await db
      .select({
        id: strategyKpis.id,
        name: strategyKpis.name,
        currentValue: strategyKpis.currentValue,
        targetValue: strategyKpis.targetValue,
        unit: strategyKpis.unit,
        isMonitored: strategyKpis.isMonitored,
      })
      .from(strategyKpis)
      .where(and(eq(strategyKpis.strategyId, strategyId), eq(strategyKpis.projectId, projectId)));

    return {
      kpis: kpis.map((k) => {
        const current = Number(k.currentValue) || 0;
        const target = Number(k.targetValue) || 0;
        const progressPct = target > 0 ? Math.round((current / target) * 100) : 0;
        return { ...k, progressPct };
      }),
    };
  },
});

// ── Exports ──

export const ATLAS_AUTO_EXECUTE_TOOLS = new Set([
  'list_agents',
  'get_agent',
  'list_workflows',
  'get_workflow',
  'list_strategies',
  'get_strategy',
  'get_analytics',
  'list_pending_approvals',
  'list_human_tasks',
  'search_memory',
  'get_fleet_status',
  'get_cost_report',
  'get_orchestrator_config',
  'search_action_logs',
  'get_kpi_trends',
]);

export const ATLAS_APPROVAL_TOOLS = new Set([
  'create_agent',
  'update_agent',
  'trigger_agent',
  'create_workflow',
  'update_strategy',
  'create_human_task',
  'update_orchestrator_config',
  'pause_agents_by_team',
  'resume_agents_by_team',
  'set_agent_priority',
  'trigger_workflow',
  'update_wiki_article',
  'manage_calendar',
  'create_strategy_kpi',
  'update_strategy_kpi',
]);

export function getAtlasToolByName(name: string): AtlasToolDefinition | undefined {
  return atlasTools.get(name);
}

export function getAtlasAnthropicTools(): AnthropicTool[] {
  return Array.from(atlasTools.values()).map((tool) => ({
    name: tool.name,
    description: tool.description,
    input_schema: zodToJsonSchema(tool.inputSchema) as AnthropicTool['input_schema'],
  }));
}
