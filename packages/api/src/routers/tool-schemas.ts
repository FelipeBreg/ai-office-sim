import { z } from 'zod';
import { createTRPCRouter, projectProcedure, protectedProcedure, requireRole } from '../trpc.js';
import {
  db,
  toolPayloadSchemas,
  eq,
  and,
  desc,
} from '@ai-office/db';
import { TRPCError } from '@trpc/server';

export const toolSchemasRouter = createTRPCRouter({
  /** List all payload schemas for the project */
  list: projectProcedure.query(async ({ ctx }) => {
    const projectId = ctx.project!.id;

    return db
      .select()
      .from(toolPayloadSchemas)
      .where(eq(toolPayloadSchemas.projectId, projectId))
      .orderBy(desc(toolPayloadSchemas.updatedAt));
  }),

  /** Get schema for a specific tool (latest version) */
  getByTool: projectProcedure
    .input(z.object({ toolName: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const projectId = ctx.project!.id;

      const [schema] = await db
        .select()
        .from(toolPayloadSchemas)
        .where(
          and(
            eq(toolPayloadSchemas.projectId, projectId),
            eq(toolPayloadSchemas.toolName, input.toolName),
          ),
        )
        .orderBy(desc(toolPayloadSchemas.version))
        .limit(1);

      return schema ?? null;
    }),

  /** Create or update a payload schema (bumps version) */
  upsert: projectProcedure
    .input(
      z.object({
        toolName: z.string().min(1).max(100),
        inputSchema: z.record(z.unknown()).optional(),
        outputSchema: z.record(z.unknown()).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const projectId = ctx.project!.id;

      // Find current max version
      const [existing] = await db
        .select({ version: toolPayloadSchemas.version })
        .from(toolPayloadSchemas)
        .where(
          and(
            eq(toolPayloadSchemas.projectId, projectId),
            eq(toolPayloadSchemas.toolName, input.toolName),
          ),
        )
        .orderBy(desc(toolPayloadSchemas.version))
        .limit(1);

      const nextVersion = (existing?.version ?? 0) + 1;

      const [created] = await db
        .insert(toolPayloadSchemas)
        .values({
          projectId,
          toolName: input.toolName,
          inputSchema: input.inputSchema as Record<string, unknown>,
          outputSchema: input.outputSchema as Record<string, unknown>,
          version: nextVersion,
        })
        .returning();

      return created!;
    }),

  /** Delete all versions of a tool schema */
  delete: projectProcedure
    .input(z.object({ toolName: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const projectId = ctx.project!.id;

      const deleted = await db
        .delete(toolPayloadSchemas)
        .where(
          and(
            eq(toolPayloadSchemas.projectId, projectId),
            eq(toolPayloadSchemas.toolName, input.toolName),
          ),
        )
        .returning();

      if (deleted.length === 0) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Schema not found' });
      }

      return { deletedCount: deleted.length };
    }),
});
