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
  eq,
  and,
  desc,
  sql,
  count,
  gte,
} from '@ai-office/db';
import { ragSearch } from '@ai-office/ai';
import { getAgentExecutionQueue } from '@ai-office/queue';
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
      .select({ id: agents.id, name: agents.name, status: agents.status })
      .from(agents)
      .where(and(eq(agents.id, agentId), eq(agents.projectId, projectId)))
      .limit(1);

    if (!agent) return { error: 'Agent not found' };

    const sessionId = randomUUID();
    const queue = getAgentExecutionQueue();
    await queue.add('agent-execution', {
      agentId,
      projectId,
      sessionId,
    });

    return { triggered: true, agent: agent.name, sessionId };
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
]);

export const ATLAS_APPROVAL_TOOLS = new Set([
  'create_agent',
  'update_agent',
  'trigger_agent',
  'create_workflow',
  'update_strategy',
  'create_human_task',
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
