import { z } from 'zod';
import { createTRPCRouter, projectProcedure, adminProcedure } from '../trpc.js';
import { db, agents, eq, and, desc } from '@ai-office/db';
import { TRPCError } from '@trpc/server';

export const agentsRouter = createTRPCRouter({
  list: projectProcedure.query(async ({ ctx }) => {
    return db
      .select()
      .from(agents)
      .where(eq(agents.projectId, ctx.project!.id))
      .orderBy(desc(agents.createdAt));
  }),

  getById: projectProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const [agent] = await db
        .select()
        .from(agents)
        .where(and(eq(agents.id, input.id), eq(agents.projectId, ctx.project!.id)))
        .limit(1);

      if (!agent) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Agent not found' });
      }
      return agent;
    }),

  create: adminProcedure
    .input(
      z.object({
        name: z.string().min(1).max(100),
        slug: z.string().min(1).max(50),
        archetype: z.enum([
          'support', 'sales', 'marketing', 'data_analyst', 'content_writer',
          'developer', 'project_manager', 'hr', 'finance', 'custom',
        ]),
        systemPromptEn: z.string().optional(),
        systemPromptPtBr: z.string().optional(),
        triggerType: z.enum(['always_on', 'scheduled', 'event', 'manual', 'agent']).optional(),
        tools: z.array(z.string().max(100)).max(50).optional(),
        team: z.enum(['development', 'research', 'marketing', 'sales', 'support', 'finance', 'operations']).optional(),
        config: z.object({
          model: z.string(),
          temperature: z.number().min(0).max(2),
          maxTokens: z.number().min(1).max(200_000),
          budget: z.number().min(0),
        }).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [agent] = await db
        .insert(agents)
        .values({
          projectId: ctx.project!.id,
          ...input,
        })
        .returning();
      return agent!;
    }),

  update: adminProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        name: z.string().min(1).max(100).optional(),
        systemPromptEn: z.string().optional(),
        systemPromptPtBr: z.string().optional(),
        triggerType: z.enum(['always_on', 'scheduled', 'event', 'manual', 'agent']).optional(),
        tools: z.array(z.string().max(100)).max(50).optional(),
        team: z.enum(['development', 'research', 'marketing', 'sales', 'support', 'finance', 'operations']).nullish(),
        isActive: z.boolean().optional(),
        config: z.object({
          model: z.string(),
          temperature: z.number().min(0).max(2),
          maxTokens: z.number().min(1).max(200_000),
          budget: z.number().min(0),
        }).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const [updated] = await db
        .update(agents)
        .set(data)
        .where(and(eq(agents.id, id), eq(agents.projectId, ctx.project!.id)))
        .returning();

      if (!updated) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Agent not found' });
      }
      return updated;
    }),

  delete: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const [deleted] = await db
        .delete(agents)
        .where(and(eq(agents.id, input.id), eq(agents.projectId, ctx.project!.id)))
        .returning({ id: agents.id });

      if (!deleted) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Agent not found' });
      }
      return { deleted: true };
    }),

  updateStatus: adminProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        status: z.enum(['idle', 'working', 'awaiting_approval', 'error', 'offline']),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [updated] = await db
        .update(agents)
        .set({ status: input.status })
        .where(and(eq(agents.id, input.id), eq(agents.projectId, ctx.project!.id)))
        .returning();

      if (!updated) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Agent not found' });
      }
      return updated;
    }),

  trigger: adminProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        payload: z.unknown().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [agent] = await db
        .select()
        .from(agents)
        .where(and(eq(agents.id, input.id), eq(agents.projectId, ctx.project!.id)))
        .limit(1);

      if (!agent) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Agent not found' });
      }
      if (!agent.isActive) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Agent is inactive' });
      }

      // TODO: Enqueue agent-execution job via BullMQ
      return { triggered: true, agentId: agent.id };
    }),
});
