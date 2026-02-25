import { z } from 'zod';
import { createTRPCRouter, projectProcedure, adminProcedure } from '../trpc.js';
import { db, strategies, strategyKpis, strategyLearnings, eq, and, desc, count, sql } from '@ai-office/db';
import { TRPCError } from '@trpc/server';

export const strategiesRouter = createTRPCRouter({
  list: projectProcedure.query(async ({ ctx }) => {
    return db
      .select()
      .from(strategies)
      .where(eq(strategies.projectId, ctx.project!.id))
      .orderBy(desc(strategies.createdAt));
  }),

  getById: projectProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const [strategy] = await db
        .select()
        .from(strategies)
        .where(and(eq(strategies.id, input.id), eq(strategies.projectId, ctx.project!.id)))
        .limit(1);

      if (!strategy) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Strategy not found' });
      }

      const kpis = await db
        .select()
        .from(strategyKpis)
        .where(eq(strategyKpis.strategyId, strategy.id));

      const learnings = await db
        .select()
        .from(strategyLearnings)
        .where(eq(strategyLearnings.strategyId, strategy.id))
        .orderBy(desc(strategyLearnings.createdAt));

      return { ...strategy, kpis, learnings };
    }),

  listPendingLearnings: projectProcedure.query(async ({ ctx }) => {
    return db
      .select()
      .from(strategyLearnings)
      .where(
        and(
          eq(strategyLearnings.projectId, ctx.project!.id),
          eq(strategyLearnings.isApplied, false),
        ),
      )
      .orderBy(desc(strategyLearnings.createdAt));
  }),

  applyLearning: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const [learning] = await db
        .select()
        .from(strategyLearnings)
        .where(
          and(
            eq(strategyLearnings.id, input.id),
            eq(strategyLearnings.projectId, ctx.project!.id),
          ),
        )
        .limit(1);

      if (!learning) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Learning not found' });
      }

      // Apply learning + increment version in a transaction
      const result = await db.transaction(async (tx) => {
        const [updated] = await tx
          .update(strategyLearnings)
          .set({ isApplied: true, appliedAt: new Date() })
          .where(eq(strategyLearnings.id, input.id))
          .returning();

        await tx
          .update(strategies)
          .set({ version: sql`${strategies.version} + 1` })
          .where(eq(strategies.id, learning.strategyId));

        // TODO: P3-2.6 — merge learning into strategy aiRefined text via Claude call

        return updated!;
      });

      return result;
    }),

  dismissLearning: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const [learning] = await db
        .select()
        .from(strategyLearnings)
        .where(
          and(
            eq(strategyLearnings.id, input.id),
            eq(strategyLearnings.projectId, ctx.project!.id),
          ),
        )
        .limit(1);

      if (!learning) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Learning not found' });
      }

      // Mark as applied (dismissed) so it no longer appears as pending
      const [updated] = await db
        .update(strategyLearnings)
        .set({ isApplied: true, appliedAt: new Date() })
        .where(eq(strategyLearnings.id, input.id))
        .returning();

      return updated!;
    }),

  create: adminProcedure
    .input(
      z.object({
        type: z.enum(['growth', 'retention', 'brand', 'product']),
        userDraft: z.string().optional(),
        startDate: z.string().datetime().optional(),
        endDate: z.string().datetime().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { startDate, endDate, ...data } = input;
      const [strategy] = await db
        .insert(strategies)
        .values({
          projectId: ctx.project!.id,
          createdBy: ctx.user!.id,
          ...data,
          ...(startDate ? { startDate: new Date(startDate) } : {}),
          ...(endDate ? { endDate: new Date(endDate) } : {}),
        })
        .returning();
      return strategy!;
    }),

  update: adminProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        userDraft: z.string().optional(),
        aiRefined: z.string().optional(),
        status: z.enum(['planned', 'active', 'at_risk', 'completed']).optional(),
        startDate: z.string().datetime().optional(),
        endDate: z.string().datetime().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, startDate, endDate, ...data } = input;
      const [updated] = await db
        .update(strategies)
        .set({
          ...data,
          ...(startDate ? { startDate: new Date(startDate) } : {}),
          ...(endDate ? { endDate: new Date(endDate) } : {}),
        })
        .where(and(eq(strategies.id, id), eq(strategies.projectId, ctx.project!.id)))
        .returning();

      if (!updated) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Strategy not found' });
      }
      return updated;
    }),

  refineWithAI: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const [strategy] = await db
        .select()
        .from(strategies)
        .where(and(eq(strategies.id, input.id), eq(strategies.projectId, ctx.project!.id)))
        .limit(1);

      if (!strategy) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Strategy not found' });
      }
      if (!strategy.userDraft) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'User draft is required for AI refinement' });
      }

      // TODO: Enqueue AI refinement job via BullMQ
      return { enqueued: true, strategyId: strategy.id };
    }),

  addLearning: adminProcedure
    .input(
      z.object({
        strategyId: z.string().uuid(),
        agentId: z.string().uuid(),
        insight: z.string().min(1),
        recommendation: z.string().optional(),
        confidence: z.number().min(0).max(1).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { confidence, ...rest } = input;
      const [learning] = await db
        .insert(strategyLearnings)
        .values({
          projectId: ctx.project!.id,
          ...rest,
          confidence: confidence != null ? String(confidence) : undefined,
        })
        .returning();
      return learning!;
    }),
});
