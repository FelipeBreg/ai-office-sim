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
  deals,
  pipelineStages,
  financialRecords,
  marketingCampaigns,
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
  // ---------------------------------------------------------------------------
  // General — top KPIs from all sections
  // ---------------------------------------------------------------------------
  general: projectProcedure.input(periodInput).query(async ({ ctx, input }) => {
    const projectId = ctx.project!.id;
    const since = new Date(Date.now() - input.days * 24 * 60 * 60 * 1000);
    const prevSince = new Date(Date.now() - input.days * 2 * 24 * 60 * 60 * 1000);

    const [
      aiCost,
      prevAiCost,
      dealKpis,
      prevDealKpis,
      agentCount,
      taskStats,
      finSummary,
      prevFinSummary,
      campaignStats,
    ] = await Promise.all([
      // AI cost current period
      db
        .select({
          totalCost: sql<string>`COALESCE(SUM(${actionLogs.costUsd}), 0)::text`,
        })
        .from(actionLogs)
        .where(and(eq(actionLogs.projectId, projectId), gte(actionLogs.createdAt, since)))
        .then((r) => Number(r[0]?.totalCost ?? 0)),

      // AI cost previous period
      db
        .select({
          totalCost: sql<string>`COALESCE(SUM(${actionLogs.costUsd}), 0)::text`,
        })
        .from(actionLogs)
        .where(
          and(
            eq(actionLogs.projectId, projectId),
            gte(actionLogs.createdAt, prevSince),
            sql`${actionLogs.createdAt} < ${since}`,
          ),
        )
        .then((r) => Number(r[0]?.totalCost ?? 0)),

      // Deal KPIs current
      db
        .select({
          pipelineValue: sql<string>`COALESCE(SUM(CASE WHEN ${pipelineStages.isWon} = false AND ${pipelineStages.isLost} = false THEN ${deals.value} ELSE 0 END), 0)::text`,
          wonCount: sql<number>`COUNT(*) FILTER (WHERE ${pipelineStages.isWon} = true)::int`,
          totalDeals: count(),
        })
        .from(deals)
        .leftJoin(pipelineStages, eq(deals.stageId, pipelineStages.id))
        .where(and(eq(deals.projectId, projectId), gte(deals.createdAt, since)))
        .then((r) => r[0]!),

      // Deal KPIs previous
      db
        .select({
          wonCount: sql<number>`COUNT(*) FILTER (WHERE ${pipelineStages.isWon} = true)::int`,
          totalDeals: count(),
        })
        .from(deals)
        .leftJoin(pipelineStages, eq(deals.stageId, pipelineStages.id))
        .where(
          and(
            eq(deals.projectId, projectId),
            gte(deals.createdAt, prevSince),
            sql`${deals.createdAt} < ${since}`,
          ),
        )
        .then((r) => r[0]!),

      // Active agents
      db
        .select({ count: count() })
        .from(agents)
        .where(and(eq(agents.projectId, projectId), eq(agents.isActive, true)))
        .then((r) => r[0]?.count ?? 0),

      // Task stats
      db
        .select({
          total: count(),
          done: sql<number>`COUNT(*) FILTER (WHERE ${humanTasks.status} = 'done')::int`,
        })
        .from(humanTasks)
        .where(and(eq(humanTasks.projectId, projectId), gte(humanTasks.createdAt, since)))
        .then((r) => r[0]!),

      // Financial summary current
      db
        .select({
          type: financialRecords.type,
          total: sql<string>`COALESCE(SUM(${financialRecords.amount}), 0)::text`,
        })
        .from(financialRecords)
        .where(and(eq(financialRecords.projectId, projectId), gte(financialRecords.createdAt, since)))
        .groupBy(financialRecords.type),

      // Financial summary previous
      db
        .select({
          type: financialRecords.type,
          total: sql<string>`COALESCE(SUM(${financialRecords.amount}), 0)::text`,
        })
        .from(financialRecords)
        .where(
          and(
            eq(financialRecords.projectId, projectId),
            gte(financialRecords.createdAt, prevSince),
            sql`${financialRecords.createdAt} < ${since}`,
          ),
        )
        .groupBy(financialRecords.type),

      // Campaign ROI
      db
        .select({
          totalSpend: sql<string>`COALESCE(SUM(${marketingCampaigns.spend}), 0)::text`,
          totalRevenue: sql<string>`COALESCE(SUM(${marketingCampaigns.revenue}), 0)::text`,
        })
        .from(marketingCampaigns)
        .where(and(eq(marketingCampaigns.projectId, projectId), gte(marketingCampaigns.createdAt, since)))
        .then((r) => r[0]!),
    ]);

    const getFinVal = (rows: { type: string; total: string }[], type: string) =>
      Number(rows.find((r) => r.type === type)?.total ?? 0);

    const revenue = getFinVal(finSummary, 'revenue');
    const expenses = getFinVal(finSummary, 'expense');
    const tax = getFinVal(finSummary, 'tax');
    const profit = revenue - expenses - tax;

    const prevRevenue = getFinVal(prevFinSummary, 'revenue');
    const prevExpenses = getFinVal(prevFinSummary, 'expense');
    const prevTax = getFinVal(prevFinSummary, 'tax');
    const prevProfit = prevRevenue - prevExpenses - prevTax;

    const growthPct = (curr: number, prev: number) =>
      prev === 0 ? (curr > 0 ? 100 : 0) : Math.round(((curr - prev) / Math.abs(prev)) * 100);

    const conversionRate = dealKpis.totalDeals > 0
      ? Math.round((dealKpis.wonCount / dealKpis.totalDeals) * 100)
      : 0;
    const prevConversion = prevDealKpis.totalDeals > 0
      ? Math.round((prevDealKpis.wonCount / prevDealKpis.totalDeals) * 100)
      : 0;

    const campaignSpend = Number(campaignStats.totalSpend);
    const campaignRevenue = Number(campaignStats.totalRevenue);
    const campaignRoi = campaignSpend > 0
      ? Math.round(((campaignRevenue - campaignSpend) / campaignSpend) * 100)
      : 0;

    const taskCompletionPct = taskStats.total > 0
      ? Math.round((taskStats.done / taskStats.total) * 100)
      : 0;

    return {
      revenue: { value: revenue, growth: growthPct(revenue, prevRevenue) },
      profit: { value: profit, growth: growthPct(profit, prevProfit) },
      aiCost: { value: aiCost, growth: growthPct(aiCost, prevAiCost) },
      pipelineValue: { value: Number(dealKpis.pipelineValue), growth: 0 },
      dealsWon: { value: dealKpis.wonCount, growth: dealKpis.wonCount - prevDealKpis.wonCount },
      conversionRate: { value: conversionRate, growth: conversionRate - prevConversion },
      activeAgents: { value: agentCount, growth: 0 },
      taskCompletion: { value: taskCompletionPct, growth: 0 },
      campaignRoi: { value: campaignRoi, growth: 0 },
    };
  }),

  // ---------------------------------------------------------------------------
  // Finance
  // ---------------------------------------------------------------------------
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

  // ---------------------------------------------------------------------------
  // Operations
  // ---------------------------------------------------------------------------
  operations: projectProcedure.input(periodInput).query(async ({ ctx, input }) => {
    const projectId = ctx.project!.id;
    const since = new Date(Date.now() - input.days * 24 * 60 * 60 * 1000);

    const [agentStatus, taskStatus, approvalStatus, actionStatus, agentActivity, actionDaily] =
      await Promise.all([
        // Agent status distribution
        db
          .select({ status: agents.status, count: count() })
          .from(agents)
          .where(eq(agents.projectId, projectId))
          .groupBy(agents.status),

        // Task completion
        db
          .select({ status: humanTasks.status, count: count() })
          .from(humanTasks)
          .where(and(eq(humanTasks.projectId, projectId), gte(humanTasks.createdAt, since)))
          .groupBy(humanTasks.status),

        // Approval rates
        db
          .select({ status: approvals.status, count: count() })
          .from(approvals)
          .where(and(eq(approvals.projectId, projectId), gte(approvals.createdAt, since)))
          .groupBy(approvals.status),

        // Action success
        db
          .select({ status: actionLogs.status, count: count() })
          .from(actionLogs)
          .where(and(eq(actionLogs.projectId, projectId), gte(actionLogs.createdAt, since)))
          .groupBy(actionLogs.status),

        // Agent activity by hour
        db
          .select({
            hour: sql<number>`EXTRACT(HOUR FROM ${actionLogs.createdAt})::int`,
            count: count(),
          })
          .from(actionLogs)
          .where(and(eq(actionLogs.projectId, projectId), gte(actionLogs.createdAt, since)))
          .groupBy(sql`EXTRACT(HOUR FROM ${actionLogs.createdAt})`)
          .orderBy(sql`EXTRACT(HOUR FROM ${actionLogs.createdAt})`),

        // Actions by day (stacked by status)
        db
          .select({
            day: sql<string>`DATE(${actionLogs.createdAt})::text`,
            status: actionLogs.status,
            count: count(),
          })
          .from(actionLogs)
          .where(and(eq(actionLogs.projectId, projectId), gte(actionLogs.createdAt, since)))
          .groupBy(sql`DATE(${actionLogs.createdAt})`, actionLogs.status)
          .orderBy(sql`DATE(${actionLogs.createdAt})`),
      ]);

    return { agentStatus, taskStatus, approvalStatus, actionStatus, agentActivity, actionDaily };
  }),

  // ---------------------------------------------------------------------------
  // Marketing
  // ---------------------------------------------------------------------------
  marketing: projectProcedure.input(periodInput).query(async ({ ctx, input }) => {
    const projectId = ctx.project!.id;
    const since = new Date(Date.now() - input.days * 24 * 60 * 60 * 1000);

    const [
      waByDirection, waByStatus, waDaily, waUniqueContacts,
      emailByStatus, emailDaily, emailUniqueRecipients,
      funnelMetrics,
    ] = await Promise.all([
      // WhatsApp by direction
      db
        .select({ direction: whatsappMessages.direction, count: count() })
        .from(whatsappMessages)
        .where(and(eq(whatsappMessages.projectId, projectId), gte(whatsappMessages.sentAt, since)))
        .groupBy(whatsappMessages.direction),

      // WhatsApp by status
      db
        .select({ status: whatsappMessages.status, count: count() })
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
        .select({ status: emailMessages.status, count: count() })
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

      // Funnel metrics from campaigns
      db
        .select({
          funnelStage: marketingCampaigns.funnelStage,
          campaigns: count(),
          totalSpend: sql<string>`COALESCE(SUM(${marketingCampaigns.spend}), 0)::text`,
          totalImpressions: sql<number>`COALESCE(SUM(${marketingCampaigns.impressions}), 0)::int`,
          totalClicks: sql<number>`COALESCE(SUM(${marketingCampaigns.clicks}), 0)::int`,
          totalConversions: sql<number>`COALESCE(SUM(${marketingCampaigns.conversions}), 0)::int`,
          totalRevenue: sql<string>`COALESCE(SUM(${marketingCampaigns.revenue}), 0)::text`,
        })
        .from(marketingCampaigns)
        .where(and(eq(marketingCampaigns.projectId, projectId), gte(marketingCampaigns.createdAt, since)))
        .groupBy(marketingCampaigns.funnelStage),
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
      funnel: funnelMetrics,
    };
  }),
});
