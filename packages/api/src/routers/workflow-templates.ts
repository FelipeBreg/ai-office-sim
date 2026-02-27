import { z } from 'zod';
import {
  createTRPCRouter,
  protectedProcedure,
  adminProcedure,
  enforceResourceLimit,
} from '../trpc.js';
import { db, workflowTemplates, workflows, eq, asc } from '@ai-office/db';
import { TRPCError } from '@trpc/server';

export const workflowTemplatesRouter = createTRPCRouter({
  /** List all workflow templates, optionally filtered by category */
  list: protectedProcedure
    .input(z.object({ category: z.string().optional() }).optional())
    .query(async ({ input }) => {
      const rows = await db
        .select()
        .from(workflowTemplates)
        .orderBy(asc(workflowTemplates.sortOrder));

      if (input?.category) {
        return rows.filter((r) => r.category === input.category);
      }
      return rows;
    }),

  /** Get a single workflow template by ID */
  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input }) => {
      const [template] = await db
        .select()
        .from(workflowTemplates)
        .where(eq(workflowTemplates.id, input.id))
        .limit(1);

      if (!template) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Workflow template not found' });
      }
      return template;
    }),

  /** Copy a template into the user's project as a new workflow */
  use: adminProcedure
    .input(z.object({ templateId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      // Look up the template
      const [template] = await db
        .select()
        .from(workflowTemplates)
        .where(eq(workflowTemplates.id, input.templateId))
        .limit(1);

      if (!template) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Workflow template not found' });
      }

      // Enforce plan limits
      await enforceResourceLimit(ctx.org!.id, ctx.org!.plan, 'maxWorkflows');

      // Create workflow from template
      const [workflow] = await db
        .insert(workflows)
        .values({
          projectId: ctx.project!.id,
          createdBy: ctx.user!.id,
          name: template.nameEn,
          description: template.descriptionEn,
          definition: template.definition,
        })
        .returning();

      return workflow!;
    }),
});
