import { z } from 'zod';
import { createTRPCRouter, projectProcedure } from '../trpc.js';
import {
  db,
  actionLogs,
  agents,
  approvals,
  humanTasks,
  whatsappMessages,
  emailMessages,
  invoices,
  eq,
  and,
  gte,
  sql,
  count,
  desc,
} from '@ai-office/db';

const periodInput = z
  .object({ days: z.number().min(1).max(90).default(30) })
  .default({});

export const dashboardRouter = createTRPCRouter({
  finance: projectProcedure.input(periodInput).query(async ({ ctx, input }) => {
    const projectId = ctx.project!.id;
    const orgId = ctx.org!.id;
    const since = new Date(Date.now() - input.days * 24 * 60 * 60 * 1000);

    const [totals, daily, byModel, invoiceList] = await Promise.all([
      // Totals
      db
        .select({
          totalActions: count(),
          totalTokens: sql<number>`COALESCE(SUM(${actionLogs.tokensUsed}), 0)::int`,
          totalCost: sql<string>`COALESCE(SUM(${actionLogs.costUsd}), 0)::text`,
        })
        .from(actionLogs)
        .where(and(eq(actionLogs.projectId, projectId), gte(actionLogs.createdAt, since)))
        .then((r) => r[0]!),

      // Daily breakdown
      db
        .select({
          day: sql<string>`DATE(${actionLogs.createdAt})::text`,
          actions: count(),
          tokens: sql<number>`COALESCE(SUM(${actionLogs.tokensUsed}), 0)::int`,
          cost: sql<string>`COALESCE(SUM(${actionLogs.costUsd}), 0)::text`,
        })
        .from(actionLogs)
        .where(and(eq(actionLogs.projectId, projectId), gte(actionLogs.createdAt, since)))
        .groupBy(sql`DATE(${actionLogs.createdAt})`)
        .orderBy(sql`DATE(${actionLogs.createdAt})`),

      // By model
      db
        .select({
          model: sql<string>`${actionLogs.input}->>'model'`,
          count: count(),
          tokens: sql<number>`COALESCE(SUM(${actionLogs.tokensUsed}), 0)::int`,
          cost: sql<string>`COALESCE(SUM(${actionLogs.costUsd}), 0)::text`,
        })
        .from(actionLogs)
        .where(
          and(
            eq(actionLogs.projectId, projectId),
            gte(actionLogs.createdAt, since),
            eq(actionLogs.actionType, 'llm_response'),
            sql`${actionLogs.input}->>'model' IS NOT NULL`,
          ),
        )
        .groupBy(sql`${actionLogs.input}->>'model'`),

      // Invoice history
      db
        .select()
        .from(invoices)
        .where(eq(invoices.orgId, orgId))
        .orderBy(desc(invoices.createdAt))
        .limit(20),
    ]);

    return { totals, daily, byModel, invoices: invoiceList };
  }),

  operations: projectProcedure.input(periodInput).query(async ({ ctx, input }) => {
    const projectId = ctx.project!.id;
    const since = new Date(Date.now() - input.days * 24 * 60 * 60 * 1000);

    const [agentStatus, taskStatus, approvalStatus, actionStatus] = await Promise.all([
      // Agent status distribution
      db
        .select({
          status: agents.status,
          count: count(),
        })
        .from(agents)
        .where(eq(agents.projectId, projectId))
        .groupBy(agents.status),

      // Task completion
      db
        .select({
          status: humanTasks.status,
          count: count(),
        })
        .from(humanTasks)
        .where(and(eq(humanTasks.projectId, projectId), gte(humanTasks.createdAt, since)))
        .groupBy(humanTasks.status),

      // Approval rates
      db
        .select({
          status: approvals.status,
          count: count(),
        })
        .from(approvals)
        .where(and(eq(approvals.projectId, projectId), gte(approvals.createdAt, since)))
        .groupBy(approvals.status),

      // Action success
      db
        .select({
          status: actionLogs.status,
          count: count(),
        })
        .from(actionLogs)
        .where(and(eq(actionLogs.projectId, projectId), gte(actionLogs.createdAt, since)))
        .groupBy(actionLogs.status),
    ]);

    return { agentStatus, taskStatus, approvalStatus, actionStatus };
  }),

  marketing: projectProcedure.input(periodInput).query(async ({ ctx, input }) => {
    const projectId = ctx.project!.id;
    const since = new Date(Date.now() - input.days * 24 * 60 * 60 * 1000);

    const [waByDirection, waByStatus, waDaily, waUniqueContacts, emailByStatus, emailDaily, emailUniqueRecipients] =
      await Promise.all([
        // WhatsApp by direction
        db
          .select({
            direction: whatsappMessages.direction,
            count: count(),
          })
          .from(whatsappMessages)
          .where(and(eq(whatsappMessages.projectId, projectId), gte(whatsappMessages.sentAt, since)))
          .groupBy(whatsappMessages.direction),

        // WhatsApp by status
        db
          .select({
            status: whatsappMessages.status,
            count: count(),
          })
          .from(whatsappMessages)
          .where(and(eq(whatsappMessages.projectId, projectId), gte(whatsappMessages.sentAt, since)))
          .groupBy(whatsappMessages.status),

        // WhatsApp daily
        db
          .select({
            day: sql<string>`DATE(${whatsappMessages.sentAt})::text`,
            count: count(),
          })
          .from(whatsappMessages)
          .where(and(eq(whatsappMessages.projectId, projectId), gte(whatsappMessages.sentAt, since)))
          .groupBy(sql`DATE(${whatsappMessages.sentAt})`)
          .orderBy(sql`DATE(${whatsappMessages.sentAt})`),

        // WhatsApp unique contacts
        db
          .select({
            count: sql<number>`COUNT(DISTINCT ${whatsappMessages.contactPhone})::int`,
          })
          .from(whatsappMessages)
          .where(and(eq(whatsappMessages.projectId, projectId), gte(whatsappMessages.sentAt, since)))
          .then((r) => r[0]?.count ?? 0),

        // Email by status
        db
          .select({
            status: emailMessages.status,
            count: count(),
          })
          .from(emailMessages)
          .where(and(eq(emailMessages.projectId, projectId), gte(emailMessages.createdAt, since)))
          .groupBy(emailMessages.status),

        // Email daily
        db
          .select({
            day: sql<string>`DATE(${emailMessages.createdAt})::text`,
            count: count(),
          })
          .from(emailMessages)
          .where(and(eq(emailMessages.projectId, projectId), gte(emailMessages.createdAt, since)))
          .groupBy(sql`DATE(${emailMessages.createdAt})`)
          .orderBy(sql`DATE(${emailMessages.createdAt})`),

        // Email unique recipients
        db
          .select({
            count: sql<number>`COUNT(DISTINCT ${emailMessages.toRecipients}[1])::int`,
          })
          .from(emailMessages)
          .where(and(eq(emailMessages.projectId, projectId), gte(emailMessages.createdAt, since)))
          .then((r) => r[0]?.count ?? 0),
      ]);

    return {
      whatsapp: {
        byDirection: waByDirection,
        byStatus: waByStatus,
        daily: waDaily,
        uniqueContacts: waUniqueContacts,
      },
      email: {
        byStatus: emailByStatus,
        daily: emailDaily,
        uniqueRecipients: emailUniqueRecipients,
      },
    };
  }),
});
