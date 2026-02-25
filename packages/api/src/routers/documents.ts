import { z } from 'zod';
import { createTRPCRouter, projectProcedure, adminProcedure } from '../trpc.js';
import { db, documents, documentChunks, eq, and, desc, count } from '@ai-office/db';
import { TRPCError } from '@trpc/server';

export const documentsRouter = createTRPCRouter({
  list: projectProcedure.query(async ({ ctx }) => {
    const docs = await db
      .select({
        id: documents.id,
        title: documents.title,
        sourceType: documents.sourceType,
        sourceUrl: documents.sourceUrl,
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
        })
        .returning();

      return { id: doc!.id, status: 'queued' };
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
