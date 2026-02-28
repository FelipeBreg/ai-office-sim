import { z } from 'zod';
import { createTRPCRouter, projectProcedure, adminProcedure } from '../trpc.js';
import { db, brandTouchpoints, eq, and, desc } from '@ai-office/db';
import { TRPCError } from '@trpc/server';

const TYPES = [
  'linkedin', 'instagram', 'twitter', 'facebook',
  'domain', 'physical', 'youtube', 'tiktok', 'email', 'other',
] as const;
const STATUSES = ['active', 'inactive', 'planned'] as const;

export const brandTouchpointsRouter = createTRPCRouter({
  list: projectProcedure.query(async ({ ctx }) => {
    const rows = await db
      .select()
      .from(brandTouchpoints)
      .where(eq(brandTouchpoints.projectId, ctx.project!.id))
      .orderBy(desc(brandTouchpoints.createdAt));

    // Group by type
    const grouped: Record<string, typeof rows> = {};
    for (const row of rows) {
      const key = row.type;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(row);
    }
    return { items: rows, grouped };
  }),

  create: adminProcedure
    .input(
      z.object({
        type: z.enum(TYPES).default('other'),
        label: z.string().min(1).max(200),
        url: z.string().max(500).nullish(),
        description: z.string().max(2000).nullish(),
        status: z.enum(STATUSES).default('active'),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [tp] = await db
        .insert(brandTouchpoints)
        .values({
          projectId: ctx.project!.id,
          type: input.type,
          label: input.label,
          url: input.url ?? null,
          description: input.description ?? null,
          status: input.status,
        })
        .returning();
      return tp!;
    }),

  update: adminProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        type: z.enum(TYPES).optional(),
        label: z.string().min(1).max(200).optional(),
        url: z.string().max(500).nullish(),
        description: z.string().max(2000).nullish(),
        status: z.enum(STATUSES).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const [updated] = await db
        .update(brandTouchpoints)
        .set(data)
        .where(and(eq(brandTouchpoints.id, id), eq(brandTouchpoints.projectId, ctx.project!.id)))
        .returning();

      if (!updated) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Touchpoint not found' });
      }
      return updated;
    }),

  delete: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const [deleted] = await db
        .delete(brandTouchpoints)
        .where(and(eq(brandTouchpoints.id, input.id), eq(brandTouchpoints.projectId, ctx.project!.id)))
        .returning({ id: brandTouchpoints.id });

      if (!deleted) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Touchpoint not found' });
      }
      return { deleted: true };
    }),
});
