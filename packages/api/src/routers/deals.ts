import { z } from 'zod';
import { createTRPCRouter, projectProcedure, adminProcedure } from '../trpc.js';
import { db, deals, eq, and, asc, desc } from '@ai-office/db';
import { TRPCError } from '@trpc/server';

const DEAL_STAGES = [
  'prospect',
  'qualified',
  'proposal',
  'negotiation',
  'closed_won',
  'closed_lost',
] as const;

export const dealsRouter = createTRPCRouter({
  list: projectProcedure.query(async ({ ctx }) => {
    return db
      .select()
      .from(deals)
      .where(eq(deals.projectId, ctx.project!.id))
      .orderBy(asc(deals.sortOrder), desc(deals.createdAt));
  }),

  create: projectProcedure
    .input(
      z.object({
        title: z.string().min(1).max(200),
        companyName: z.string().max(200).optional(),
        contactName: z.string().max(200).optional(),
        contactEmail: z.string().email().max(200).optional(),
        value: z.string().regex(/^\d{1,10}(\.\d{1,2})?$/, 'Must be a valid decimal').optional(),
        stage: z.enum(DEAL_STAGES).optional(),
        notes: z.string().max(2000).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [deal] = await db
        .insert(deals)
        .values({
          projectId: ctx.project!.id,
          ...input,
        })
        .returning();
      return deal!;
    }),

  update: projectProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        title: z.string().min(1).max(200).optional(),
        companyName: z.string().max(200).nullish(),
        contactName: z.string().max(200).nullish(),
        contactEmail: z.string().email().max(200).nullish(),
        value: z.string().regex(/^\d{1,10}(\.\d{1,2})?$/, 'Must be a valid decimal').nullish(),
        stage: z.enum(DEAL_STAGES).optional(),
        notes: z.string().max(2000).nullish(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const [updated] = await db
        .update(deals)
        .set(data)
        .where(and(eq(deals.id, id), eq(deals.projectId, ctx.project!.id)))
        .returning();

      if (!updated) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Deal not found' });
      }
      return updated;
    }),

  updateStage: projectProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        stage: z.enum(DEAL_STAGES),
        sortOrder: z.number().int().min(0).default(0),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [updated] = await db
        .update(deals)
        .set({ stage: input.stage, sortOrder: input.sortOrder })
        .where(and(eq(deals.id, input.id), eq(deals.projectId, ctx.project!.id)))
        .returning();

      if (!updated) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Deal not found' });
      }
      return updated;
    }),

  delete: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const [deleted] = await db
        .delete(deals)
        .where(and(eq(deals.id, input.id), eq(deals.projectId, ctx.project!.id)))
        .returning({ id: deals.id });

      if (!deleted) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Deal not found' });
      }
      return { deleted: true };
    }),
});
