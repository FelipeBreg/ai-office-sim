import { z } from 'zod';
import { createTRPCRouter, protectedProcedure, adminProcedure, enforceResourceLimit } from '../trpc.js';
import { db, agents } from '@ai-office/db';
// Note: companyTemplates DB table exists for future admin-customizable templates
import { TRPCError } from '@trpc/server';
import {
  COMPANY_TEMPLATES,
  getTemplatesForLocale,
  getTemplateBySlug,
} from '@ai-office/shared';

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export const companyTemplatesRouter = createTRPCRouter({
  /** List all templates (uses shared constants — no DB needed) */
  list: protectedProcedure.query(() => {
    return COMPANY_TEMPLATES;
  }),

  /** List templates filtered by locale */
  listForLocale: protectedProcedure
    .input(z.object({ locale: z.enum(['pt-BR', 'en-US']) }))
    .query(({ input }) => {
      return getTemplatesForLocale(input.locale);
    }),

  /** Get a single template by slug */
  getBySlug: protectedProcedure
    .input(z.object({ slug: z.string().min(1).max(100) }))
    .query(({ input }) => {
      const template = getTemplateBySlug(input.slug);
      if (!template) return null;
      return template;
    }),

  /** Provision a template's agents into a project */
  provision: adminProcedure
    .input(
      z.object({
        templateSlug: z.string().min(1).max(100),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const template = getTemplateBySlug(input.templateSlug);
      if (!template) {
        throw new TRPCError({ code: 'NOT_FOUND', message: `Template "${input.templateSlug}" not found` });
      }

      if (template.defaultAgents.length === 0) {
        return { provisioned: 0, agents: [] };
      }

      // Enforce plan limits before inserting agents
      await enforceResourceLimit(ctx.org!.id, ctx.org!.plan, 'maxAgents');

      const agentValues = template.defaultAgents.map((spec) => ({
        projectId: ctx.project!.id,
        name: spec.nameEn,
        namePtBr: spec.namePtBr,
        slug: slugify(spec.nameEn),
        archetype: spec.archetype as typeof agents.$inferInsert['archetype'],
        tools: spec.tools,
        status: 'idle' as const,
        isActive: true,
      }));

      // onConflictDoNothing prevents unique constraint violations if agents
      // with matching slugs already exist in this project.
      const created = await db
        .insert(agents)
        .values(agentValues)
        .onConflictDoNothing()
        .returning();

      return { provisioned: created.length, agents: created };
    }),
});
