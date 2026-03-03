import { z } from 'zod';
import { createTRPCRouter, projectProcedure, adminProcedure } from '../trpc.js';
import {
  db,
  strategies,
  strategyKpis,
  strategyLearnings,
  strategyGoals,
  strategyGoalKpis,
  eq,
  and,
  desc,
  count,
  sql,
  inArray,
} from '@ai-office/db';
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

  // ── Goal CRUD ──────────────────────────────────────────────────────────────

  listGoals: projectProcedure
    .input(z.object({ strategyId: z.string().uuid().optional() }))
    .query(async ({ ctx, input }) => {
      const conditions = [eq(strategyGoals.projectId, ctx.project!.id)];
      if (input.strategyId) {
        conditions.push(eq(strategyGoals.strategyId, input.strategyId));
      }
      const goals = await db
        .select()
        .from(strategyGoals)
        .where(and(...conditions))
        .orderBy(desc(strategyGoals.createdAt));

      // Attach linked KPIs per goal
      if (goals.length === 0) return [];

      const goalIds = goals.map((g) => g.id);
      const links = await db
        .select()
        .from(strategyGoalKpis)
        .where(inArray(strategyGoalKpis.goalId, goalIds));
      const kpiIds = [...new Set(links.map((l) => l.kpiId))];
      const kpis =
        kpiIds.length > 0
          ? await db.select().from(strategyKpis).where(inArray(strategyKpis.id, kpiIds))
          : [];

      return goals.map((g) => ({
        ...g,
        kpis: links
          .filter((l) => l.goalId === g.id)
          .map((l) => kpis.find((k) => k.id === l.kpiId))
          .filter(Boolean),
      }));
    }),

  createGoal: adminProcedure
    .input(
      z.object({
        strategyId: z.string().uuid(),
        horizon: z.enum(['1_year', '6_month', '1_month']),
        title: z.string().min(1),
        description: z.string().optional(),
        deadline: z.string().datetime().optional(),
        kpiIds: z.array(z.string().uuid()).default([]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { kpiIds, deadline, ...rest } = input;
      const [goal] = await db
        .insert(strategyGoals)
        .values({
          projectId: ctx.project!.id,
          ...rest,
          ...(deadline ? { deadline: new Date(deadline) } : {}),
        })
        .returning();

      if (kpiIds.length > 0) {
        await db.insert(strategyGoalKpis).values(
          kpiIds.map((kpiId) => ({ goalId: goal!.id, kpiId })),
        );
      }

      return goal!;
    }),

  updateGoal: adminProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        title: z.string().min(1).optional(),
        description: z.string().optional(),
        status: z.enum(['planned', 'in_progress', 'on_track', 'at_risk', 'completed']).optional(),
        deadline: z.string().datetime().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, deadline, ...data } = input;
      const [updated] = await db
        .update(strategyGoals)
        .set({
          ...data,
          ...(deadline ? { deadline: new Date(deadline) } : {}),
        })
        .where(and(eq(strategyGoals.id, id), eq(strategyGoals.projectId, ctx.project!.id)))
        .returning();

      if (!updated) throw new TRPCError({ code: 'NOT_FOUND', message: 'Goal not found' });
      return updated;
    }),

  deleteGoal: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const [deleted] = await db
        .delete(strategyGoals)
        .where(and(eq(strategyGoals.id, input.id), eq(strategyGoals.projectId, ctx.project!.id)))
        .returning();

      if (!deleted) throw new TRPCError({ code: 'NOT_FOUND', message: 'Goal not found' });
      return deleted;
    }),

  linkGoalKpis: adminProcedure
    .input(
      z.object({
        goalId: z.string().uuid(),
        kpiIds: z.array(z.string().uuid()),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Verify goal belongs to project
      const [goal] = await db
        .select({ id: strategyGoals.id })
        .from(strategyGoals)
        .where(and(eq(strategyGoals.id, input.goalId), eq(strategyGoals.projectId, ctx.project!.id)))
        .limit(1);
      if (!goal) throw new TRPCError({ code: 'NOT_FOUND', message: 'Goal not found' });

      // Replace all links
      await db.delete(strategyGoalKpis).where(eq(strategyGoalKpis.goalId, input.goalId));
      if (input.kpiIds.length > 0) {
        await db.insert(strategyGoalKpis).values(
          input.kpiIds.map((kpiId) => ({ goalId: input.goalId, kpiId })),
        );
      }
      return { success: true };
    }),

  configureKpiTrigger: adminProcedure
    .input(
      z.object({
        kpiId: z.string().uuid(),
        triggerAgentId: z.string().uuid().nullable().optional(),
        triggerWorkflowId: z.string().uuid().nullable().optional(),
        triggerDirection: z.enum(['above', 'below', 'deviation']).nullable().optional(),
        triggerThreshold: z.number().nullable().optional(),
        triggerCooldownMin: z.number().min(15).max(1440).optional(),
        isMonitored: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { kpiId, triggerThreshold, ...rest } = input;
      const [updated] = await db
        .update(strategyKpis)
        .set({
          ...rest,
          ...(triggerThreshold != null ? { triggerThreshold: String(triggerThreshold) } : {}),
        })
        .where(and(eq(strategyKpis.id, kpiId), eq(strategyKpis.projectId, ctx.project!.id)))
        .returning();

      if (!updated) throw new TRPCError({ code: 'NOT_FOUND', message: 'KPI not found' });
      return updated;
    }),
});
