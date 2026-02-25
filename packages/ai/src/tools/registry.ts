import { z } from 'zod';
import type { ToolDefinition, ToolExecutionContext } from '../engine/types.js';
import type Anthropic from '@anthropic-ai/sdk';
import { sendWhatsAppMessageTool } from './whatsapp/send.js';
import { readWhatsAppMessagesTool } from './whatsapp/read.js';
import { searchWebTool } from './web-search/index.js';
import { sendEmailTool } from './email/send.js';
import { readEmailTool } from './email/read.js';
import { ragSearch } from '../memory/rag-search.js';
import { searchContactsTool } from './crm/search-contacts.js';
import { createContactTool } from './crm/create-contact.js';
import { updateContactTool } from './crm/update-contact.js';
import { listDealsTool } from './crm/list-deals.js';
import { createDealTool } from './crm/create-deal.js';
import { readSpreadsheetTool } from './sheets/read.js';
import { writeSpreadsheetTool } from './sheets/write.js';
import { appendToSpreadsheetTool } from './sheets/append.js';
import { monitorPixTransactionsTool } from './finance/pix.js';
import { checkNfeStatusTool } from './finance/nfe.js';
import { createDeployRequestTool } from './devops/create-deploy-request.js';
import { createPrReviewRequestTool } from './devops/create-pr-review-request.js';
import { createHumanTaskTool } from './devops/create-human-task.js';

// Convert Zod schema to JSON Schema for Anthropic tool format
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
      type: 'object',
      properties,
      ...(required.length > 0 ? { required } : {}),
    };
  }
  return { type: 'object', properties: {} };
}

function zodTypeToJsonSchema(schema: z.ZodType): Record<string, unknown> {
  if (schema instanceof z.ZodString) return { type: 'string', description: schema.description };
  if (schema instanceof z.ZodNumber) return { type: 'number', description: schema.description };
  if (schema instanceof z.ZodBoolean) return { type: 'boolean', description: schema.description };
  if (schema instanceof z.ZodOptional) return zodTypeToJsonSchema(schema.unwrap());
  if (schema instanceof z.ZodArray) return { type: 'array', items: zodTypeToJsonSchema(schema.element) };
  if (schema instanceof z.ZodEnum) return { type: 'string', enum: schema.options, description: schema.description };
  return { type: 'string' };
}

/** Registry of all available tools */
class ToolRegistry {
  private tools = new Map<string, ToolDefinition>();

  register(tool: ToolDefinition): void {
    this.tools.set(tool.name, tool);
  }

  get(name: string): ToolDefinition | undefined {
    return this.tools.get(name);
  }

  getAll(): ToolDefinition[] {
    return Array.from(this.tools.values());
  }

  getByNames(names: string[]): ToolDefinition[] {
    return names
      .map((name) => this.tools.get(name))
      .filter((t): t is ToolDefinition => t !== undefined);
  }

  /** Convert registered tools to Anthropic API tool format */
  toAnthropicTools(names?: string[]): Anthropic.Tool[] {
    const tools = names ? this.getByNames(names) : this.getAll();
    return tools.map((tool) => ({
      name: tool.name,
      description: tool.description,
      input_schema: zodToJsonSchema(tool.inputSchema) as Anthropic.Tool['input_schema'],
    }));
  }
}

export const toolRegistry = new ToolRegistry();

// ── Stub Tools for Initial Testing ──

toolRegistry.register({
  name: 'get_current_time',
  description: 'Returns the current date and time in ISO 8601 format.',
  inputSchema: z.object({}),
  requiresApproval: false,
  execute: async () => ({
    timestamp: new Date().toISOString(),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  }),
});

toolRegistry.register({
  name: 'search_company_memory',
  description:
    'Search the company knowledge base using semantic similarity. ' +
    'Returns relevant document chunks ranked by relevance with source citations. ' +
    'Optionally filter by source type or date range.',
  inputSchema: z.object({
    query: z.string().describe('The search query (natural language)'),
    topK: z.number().int().min(1).max(20).optional().describe('Number of results to return (default: 5)'),
    sourceType: z.enum(['upload', 'web', 'api', 'agent']).optional().describe('Filter by document source type'),
  }),
  requiresApproval: false,
  execute: async (input: unknown, context: ToolExecutionContext) => {
    const { query, topK = 5, sourceType } = input as {
      query: string;
      topK?: number;
      sourceType?: string;
    };

    try {
      const results = await ragSearch({
        projectId: context.projectId,
        query,
        topK,
        filters: sourceType ? { sourceType } : undefined,
      });

      return {
        query,
        resultCount: results.length,
        results: results.map((r) => ({
          content: r.content,
          source: r.documentTitle,
          sourceType: r.sourceType,
          relevanceScore: Math.round(r.score * 100) / 100,
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

toolRegistry.register({
  name: 'log_message',
  description: 'Log a message for record-keeping and debugging purposes.',
  inputSchema: z.object({
    message: z.string().describe('The message to log'),
    level: z.enum(['info', 'warning', 'error']).optional().describe('Log level (default: info)'),
  }),
  requiresApproval: false,
  execute: async (input: unknown, context: ToolExecutionContext) => {
    const { message, level = 'info' } = input as { message: string; level?: string };
    // Structured log to prevent log injection
    console.log(JSON.stringify({
      source: 'agent',
      agentId: context.agentId,
      level,
      message: message.slice(0, 1000),
      timestamp: new Date().toISOString(),
    }));
    return { logged: true, level, timestamp: new Date().toISOString() };
  },
});

// ── WhatsApp Tools ──
toolRegistry.register(sendWhatsAppMessageTool);
toolRegistry.register(readWhatsAppMessagesTool);

// ── Web Search ──
toolRegistry.register(searchWebTool);

// ── Email ──
toolRegistry.register(sendEmailTool);
toolRegistry.register(readEmailTool);

// ── CRM (RD Station) ──
toolRegistry.register(searchContactsTool);
toolRegistry.register(createContactTool);
toolRegistry.register(updateContactTool);
toolRegistry.register(listDealsTool);
toolRegistry.register(createDealTool);

// ── Google Sheets ──
toolRegistry.register(readSpreadsheetTool);
toolRegistry.register(writeSpreadsheetTool);
toolRegistry.register(appendToSpreadsheetTool);

// ── Finance (Pix + NFe) ──
toolRegistry.register(monitorPixTransactionsTool);
toolRegistry.register(checkNfeStatusTool);

// ── DevOps ──
toolRegistry.register(createDeployRequestTool);
toolRegistry.register(createPrReviewRequestTool);
toolRegistry.register(createHumanTaskTool);
