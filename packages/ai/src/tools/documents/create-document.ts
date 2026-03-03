import { z } from 'zod';
import type { ToolDefinition, ToolExecutionContext } from '../../engine/types.js';
import { ingestDocument } from '../../memory/ingest.js';

export const createDocumentTool: ToolDefinition = {
  name: 'create_document',
  description:
    'Save text, markdown, or HTML content as a searchable document in the company knowledge base. ' +
    'The document is automatically chunked and embedded for RAG search. ' +
    'Use this to persist meeting notes, research findings, reports, SOPs, wiki articles, etc.',
  inputSchema: z.object({
    title: z.string().describe('Document title'),
    content: z.string().describe('Full text content of the document (plain text, markdown, or HTML)'),
    sourceType: z
      .enum(['upload', 'web', 'api', 'agent'])
      .optional()
      .describe('Source type (default: agent)'),
    metadata: z.record(z.unknown()).optional().describe('Optional metadata key-value pairs'),
  }),
  requiresApproval: false,
  isMutation: true,
  execute: async (input: unknown, context: ToolExecutionContext) => {
    const {
      title,
      content,
      sourceType = 'agent',
      metadata,
    } = input as {
      title: string;
      content: string;
      sourceType?: 'upload' | 'web' | 'api' | 'agent';
      metadata?: Record<string, unknown>;
    };

    const result = await ingestDocument({
      projectId: context.projectId,
      title: title.slice(0, 500),
      content: content.slice(0, 100_000),
      sourceType,
      metadata: {
        ...metadata,
        createdByAgent: context.agentId,
      },
    });

    if (result.error) {
      return {
        success: false,
        error: result.error,
      };
    }

    return {
      success: true,
      documentId: result.documentId,
      chunkCount: result.chunkCount,
      message: `Document "${title}" saved (${result.chunkCount} chunks, auto-embedded for search).`,
    };
  },
};
