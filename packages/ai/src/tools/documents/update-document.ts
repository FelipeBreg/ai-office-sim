import { z } from 'zod';
import type { ToolDefinition, ToolExecutionContext } from '../../engine/types.js';
import { db, documents, documentChunks, eq, and } from '@ai-office/db';
import { ingestDocument } from '../../memory/ingest.js';

export const updateDocumentTool: ToolDefinition = {
  name: 'update_document',
  description:
    'Update an existing document in the company knowledge base. ' +
    'The document is re-chunked and re-embedded for RAG search. ' +
    'Requires approval.',
  inputSchema: z.object({
    documentId: z.string().describe('The document ID to update'),
    content: z.string().describe('The new full content for this document'),
    title: z.string().optional().describe('Optional new title'),
  }),
  requiresApproval: true,
  execute: async (input: unknown, context: ToolExecutionContext) => {
    const { documentId, content, title } = input as {
      documentId: string;
      content: string;
      title?: string;
    };

    // Verify document belongs to this project
    const [doc] = await db
      .select({ id: documents.id, title: documents.title, projectId: documents.projectId })
      .from(documents)
      .where(and(eq(documents.id, documentId), eq(documents.projectId, context.projectId)))
      .limit(1);

    if (!doc) {
      return { error: 'Document not found or not in this project' };
    }

    const newTitle = title ?? doc.title;

    // Update document content
    await db
      .update(documents)
      .set({ content, ...(title ? { title } : {}) })
      .where(eq(documents.id, documentId));

    // Delete old chunks
    await db
      .delete(documentChunks)
      .where(eq(documentChunks.documentId, documentId));

    // Re-ingest for RAG
    try {
      await ingestDocument({
        projectId: context.projectId,
        title: newTitle,
        content,
        sourceType: 'agent',
      });
    } catch {
      // Non-blocking
    }

    return { updated: true, documentId, title: newTitle };
  },
};
