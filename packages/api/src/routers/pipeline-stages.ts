import { z } from 'zod';
import { createTRPCRouter, projectProcedure, adminProcedure } from '../trpc.js';
import { db, pipelineStages, eq, and, asc } from '@ai-office/db';
import { TRPCError } from '@trpc/server';

const DEFAULT_STAGES = [
  { name: 'Prospecção', slug: 'prospeccao', color: '#8b8b8b', sortOrder: 0 },
  { name: 'Qualificado', slug: 'qualificado', color: '#00C8E0', sortOrder: 1 },
  { name: 'Diagnóstico', slug: 'diagnostico', color: '#a78bfa', sortOrder: 2 },
  { name: 'Proposta', slug: 'proposta', color: '#f59e0b', sortOrder: 3 },
  { name: 'Negociação', slug: 'negociacao', color: '#3b82f6', sortOrder: 4 },
  { name: 'Ganho', slug: 'ganho', color: '#10b981', sortOrder: 5, isWon: true },
  { name: 'Perdido', slug: 'perdido', color: '#ef4444', sortOrder: 6, isLost: true },
] as const;

export const pipelineStagesRouter = createTRPCRouter({
  list: projectProcedure.query(async ({ ctx }) => {
    return db
      .select()
      .from(pipelineStages)
      .where(eq(pipelineStages.projectId, ctx.project!.id))
      .orderBy(asc(pipelineStages.sortOrder));
  }),

  create: adminProcedure
    .input(
      z.object({
        name: z.string().min(1).max(100),
        slug: z.string().min(1).max(100),
        color: z.string().max(20).default('#00C8E0'),
        sortOrder: z.number().int().min(0).default(0),
        isWon: z.boolean().default(false),
        isLost: z.boolean().default(false),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [stage] = await db
        .insert(pipelineStages)
        .values({ projectId: ctx.project!.id, ...input })
        .returning();
      return stage!;
    }),

  update: adminProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        name: z.string().min(1).max(100).optional(),
        slug: z.string().min(1).max(100).optional(),
        color: z.string().max(20).optional(),
        sortOrder: z.number().int().min(0).optional(),
        isWon: z.boolean().optional(),
        isLost: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const [updated] = await db
        .update(pipelineStages)
        .set(data)
        .where(and(eq(pipelineStages.id, id), eq(pipelineStages.projectId, ctx.project!.id)))
        .returning();

      if (!updated) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Stage not found' });
      }
      return updated;
    }),

  delete: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const [deleted] = await db
        .delete(pipelineStages)
        .where(and(eq(pipelineStages.id, input.id), eq(pipelineStages.projectId, ctx.project!.id)))
        .returning({ id: pipelineStages.id });

      if (!deleted) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Stage not found' });
      }
      return { deleted: true };
    }),

  reorder: adminProcedure
    .input(
      z.object({
        stages: z.array(z.object({ id: z.string().uuid(), sortOrder: z.number().int().min(0) })),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await Promise.all(
        input.stages.map((s) =>
          db
            .update(pipelineStages)
            .set({ sortOrder: s.sortOrder })
            .where(and(eq(pipelineStages.id, s.id), eq(pipelineStages.projectId, ctx.project!.id))),
        ),
      );
      return { reordered: true };
    }),

  seedDefaults: adminProcedure.mutation(async ({ ctx }) => {
    const existing = await db
      .select({ id: pipelineStages.id })
      .from(pipelineStages)
      .where(eq(pipelineStages.projectId, ctx.project!.id))
      .limit(1);

    if (existing.length > 0) {
      return { seeded: false, message: 'Stages already exist' };
    }

    await db.insert(pipelineStages).values(
      DEFAULT_STAGES.map((s) => ({
        projectId: ctx.project!.id,
        name: s.name,
        slug: s.slug,
        color: s.color,
        sortOrder: s.sortOrder,
        isWon: 'isWon' in s ? s.isWon : false,
        isLost: 'isLost' in s ? s.isLost : false,
      })),
    );

    return { seeded: true };
  }),
});
