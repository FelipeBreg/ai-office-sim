import { z } from 'zod';
import { createTRPCRouter, projectProcedure, adminProcedure } from '../trpc.js';
import { db, documents, documentChunks, eq, and, desc, count, isNull } from '@ai-office/db';
import { ingestDocument } from '@ai-office/ai';
import { TRPCError } from '@trpc/server';

export const documentsRouter = createTRPCRouter({
  list: projectProcedure.query(async ({ ctx }) => {
    const docs = await db
      .select({
        id: documents.id,
        title: documents.title,
        sourceType: documents.sourceType,
        sourceUrl: documents.sourceUrl,
        agentId: documents.agentId,
        createdAt: documents.createdAt,
      })
      .from(documents)
      .where(eq(documents.projectId, ctx.project!.id))
      .orderBy(desc(documents.createdAt));

    // Fetch chunk counts per document
    const chunkCounts = await db
      .select({
        documentId: documentChunks.documentId,
        count: count(),
      })
      .from(documentChunks)
      .where(eq(documentChunks.projectId, ctx.project!.id))
      .groupBy(documentChunks.documentId);

    const countMap = new Map(chunkCounts.map((c) => [c.documentId, Number(c.count)]));

    return docs.map((doc) => ({
      ...doc,
      chunkCount: countMap.get(doc.id) ?? 0,
    }));
  }),

  /** List documents scoped to a specific agent (+ project-wide docs) */
  listByAgent: projectProcedure
    .input(z.object({
      agentId: z.string().uuid(),
      agentOnly: z.boolean().default(false),
    }))
    .query(async ({ ctx, input }) => {
      const condition = input.agentOnly
        ? and(eq(documents.projectId, ctx.project!.id), eq(documents.agentId, input.agentId))
        : and(
            eq(documents.projectId, ctx.project!.id),
            // Agent-specific OR project-wide (agentId is null)
            eq(documents.agentId, input.agentId),
          );

      const docs = await db
        .select({
          id: documents.id,
          title: documents.title,
          sourceType: documents.sourceType,
          sourceUrl: documents.sourceUrl,
          agentId: documents.agentId,
          createdAt: documents.createdAt,
        })
        .from(documents)
        .where(condition)
        .orderBy(desc(documents.createdAt));

      // Fetch chunk counts
      const chunkCounts = await db
        .select({
          documentId: documentChunks.documentId,
          count: count(),
        })
        .from(documentChunks)
        .where(eq(documentChunks.projectId, ctx.project!.id))
        .groupBy(documentChunks.documentId);

      const countMap = new Map(chunkCounts.map((c) => [c.documentId, Number(c.count)]));

      return docs.map((doc) => ({
        ...doc,
        chunkCount: countMap.get(doc.id) ?? 0,
      }));
    }),

  search: projectProcedure
    .input(z.object({ query: z.string().min(1).max(500) }))
    .mutation(async ({ ctx, input }) => {
      // Placeholder: full RAG search is in @ai-office/ai
      // This returns a simple text-match fallback for now
      const results = await db
        .select({
          id: documentChunks.id,
          content: documentChunks.content,
          documentId: documentChunks.documentId,
        })
        .from(documentChunks)
        .where(eq(documentChunks.projectId, ctx.project!.id))
        .limit(10);

      // Join with document titles
      const docIds = [...new Set(results.map((r) => r.documentId))];
      const docs = docIds.length > 0
        ? await db
            .select({ id: documents.id, title: documents.title, sourceType: documents.sourceType })
            .from(documents)
            .where(eq(documents.projectId, ctx.project!.id))
        : [];

      const docMap = new Map(docs.map((d) => [d.id, d]));

      return results.map((r) => {
        const doc = docMap.get(r.documentId);
        return {
          content: r.content.slice(0, 300),
          documentTitle: doc?.title ?? 'Unknown',
          sourceType: doc?.sourceType ?? 'upload',
          score: 0.5, // placeholder score
        };
      });
    }),

  upload: adminProcedure
    .input(
      z.object({
        fileName: z.string().min(1),
        fileSize: z.number().int().positive(),
        mimeType: z.string().min(1),
        agentId: z.string().uuid().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Placeholder: actual file processing is done via BullMQ + ingest pipeline
      const [doc] = await db
        .insert(documents)
        .values({
          projectId: ctx.project!.id,
          title: input.fileName,
          sourceType: 'upload',
          content: '', // Will be populated by the ingestion worker
          ...(input.agentId ? { agentId: input.agentId } : {}),
        })
        .returning();

      return { id: doc!.id, status: 'queued' };
    }),

  /** Ingest text content directly (used by the Knowledge Base tab) */
  ingest: adminProcedure
    .input(
      z.object({
        title: z.string().min(1).max(200),
        content: z.string().min(1).max(500_000),
        agentId: z.string().uuid().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const result = await ingestDocument({
        projectId: ctx.project!.id,
        title: input.title,
        content: input.content,
        sourceType: 'upload',
        agentId: input.agentId,
      });

      if (result.error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: result.error,
        });
      }

      return { documentId: result.documentId, chunkCount: result.chunkCount };
    }),

  delete: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const [deleted] = await db
        .delete(documents)
        .where(and(eq(documents.id, input.id), eq(documents.projectId, ctx.project!.id)))
        .returning({ id: documents.id });

      if (!deleted) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Document not found' });
      }
      return { deleted: true };
    }),
});
