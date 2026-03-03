import { z } from 'zod';
import { createTRPCRouter, protectedProcedure, requireRole } from '../trpc.js';
import {
  db,
  organizations,
  projects,
  agents,
  workflows,
  actionLogs,
  strategies,
  strategyKpis,
  strategyLearnings,
  documents,
  conversations,
  conversationMessages,
  eq,
  and,
  sql,
} from '@ai-office/db';
import { TRPCError } from '@trpc/server';
import { maskPII } from '@ai-office/shared';

export const complianceRouter = createTRPCRouter({
  /** Export all user/project data as JSON (LGPD Art. 18) */
  exportData: protectedProcedure
    .use(requireRole('admin'))
    .input(z.object({ projectId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const orgId = ctx.org!.id;
      const projectId = input.projectId;

      // Verify project belongs to org
      const [project] = await db
        .select()
        .from(projects)
        .where(and(eq(projects.id, projectId), eq(projects.orgId, orgId)))
        .limit(1);
      if (!project) throw new TRPCError({ code: 'NOT_FOUND', message: 'Project not found' });

      // Collect all data
      const [org] = await db.select().from(organizations).where(eq(organizations.id, orgId)).limit(1);
      const agentList = await db.select().from(agents).where(eq(agents.projectId, projectId));
      const workflowList = await db.select().from(workflows).where(eq(workflows.projectId, projectId));
      const strategyList = await db.select().from(strategies).where(eq(strategies.projectId, projectId));
      const kpiList = await db.select().from(strategyKpis).where(eq(strategyKpis.projectId, projectId));
      const learningList = await db.select().from(strategyLearnings).where(eq(strategyLearnings.projectId, projectId));
      const documentList = await db
        .select({ id: documents.id, title: documents.title, sourceType: documents.sourceType, createdAt: documents.createdAt })
        .from(documents)
        .where(eq(documents.projectId, projectId));
      const conversationList = await db
        .select()
        .from(conversations)
        .where(eq(conversations.projectId, projectId))
        .limit(500);
      const actionLogCount = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(actionLogs)
        .where(eq(actionLogs.projectId, projectId));

      return {
        exportedAt: new Date().toISOString(),
        organization: org ? { id: org.id, name: org.name, plan: org.plan } : null,
        project: { id: project.id, name: project.name },
        agents: agentList.map((a) => ({ id: a.id, name: a.name, archetype: a.archetype, status: a.status })),
        workflows: workflowList.map((w) => ({ id: w.id, name: w.name, isActive: w.isActive })),
        strategies: strategyList.map((s) => ({ id: s.id, type: s.type, status: s.status })),
        kpis: kpiList.map((k) => ({ id: k.id, name: k.name, currentValue: k.currentValue, targetValue: k.targetValue })),
        learnings: learningList.map((l) => ({ id: l.id, insight: l.insight, isApplied: l.isApplied })),
        documents: documentList,
        conversations: conversationList.map((c) => ({
          id: c.id,
          channel: c.channel,
          contactName: c.contactName,
          status: c.status,
          lastMessageAt: c.lastMessageAt,
        })),
        actionLogCount: actionLogCount[0]?.count ?? 0,
      };
    }),

  /** Delete all project data (LGPD Art. 18, §IV — right to deletion) */
  deleteProjectData: protectedProcedure
    .use(requireRole('admin'))
    .input(
      z.object({
        projectId: z.string().uuid(),
        confirmPhrase: z.literal('DELETE ALL DATA'),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const orgId = ctx.org!.id;
      const projectId = input.projectId;

      // Verify project belongs to org
      const [project] = await db
        .select({ id: projects.id })
        .from(projects)
        .where(and(eq(projects.id, projectId), eq(projects.orgId, orgId)))
        .limit(1);
      if (!project) throw new TRPCError({ code: 'NOT_FOUND', message: 'Project not found' });

      // Cascade delete: project deletion cascades to all child tables via FK constraints
      await db.delete(projects).where(eq(projects.id, projectId));

      return { deleted: true, projectId };
    }),

  /** Get PII masking preview — shows what data would be masked */
  previewPiiMasking: protectedProcedure
    .input(z.object({ text: z.string().max(5000) }))
    .query(({ input }) => {
      return { original: input.text, masked: maskPII(input.text) };
    }),
});
