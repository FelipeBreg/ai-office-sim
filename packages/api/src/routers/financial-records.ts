import { z } from 'zod';
import { createTRPCRouter, projectProcedure, adminProcedure } from '../trpc.js';
import { db, financialRecords, eq, and, gte, sql, desc } from '@ai-office/db';
import { TRPCError } from '@trpc/server';

const TYPES = ['revenue', 'expense', 'tax', 'investment'] as const;
const CATEGORIES = [
  'mrr', 'arr', 'cogs', 'salary', 'tax_obligation',
  'marketing_spend', 'infrastructure', 'software', 'consulting', 'other',
] as const;

const periodInput = z
  .object({ days: z.number().min(1).max(90).default(30) })
  .default({});

export const financialRecordsRouter = createTRPCRouter({
  list: projectProcedure.query(async ({ ctx }) => {
    return db
      .select()
      .from(financialRecords)
      .where(eq(financialRecords.projectId, ctx.project!.id))
      .orderBy(desc(financialRecords.createdAt));
  }),

  create: adminProcedure
    .input(
      z.object({
        type: z.enum(TYPES),
        category: z.enum(CATEGORIES).default('other'),
        label: z.string().min(1).max(200),
        amount: z.string().regex(/^-?\d{1,12}(\.\d{1,2})?$/, 'Must be a valid decimal'),
        currency: z.string().max(10).default('BRL'),
        periodStart: z.string().datetime().optional(),
        periodEnd: z.string().datetime().optional(),
        notes: z.string().max(2000).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [record] = await db
        .insert(financialRecords)
        .values({
          projectId: ctx.project!.id,
          type: input.type,
          category: input.category,
          label: input.label,
          amount: input.amount,
          currency: input.currency,
          periodStart: input.periodStart ? new Date(input.periodStart) : null,
          periodEnd: input.periodEnd ? new Date(input.periodEnd) : null,
          notes: input.notes ?? null,
        })
        .returning();
      return record!;
    }),

  update: adminProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        type: z.enum(TYPES).optional(),
        category: z.enum(CATEGORIES).optional(),
        label: z.string().min(1).max(200).optional(),
        amount: z.string().regex(/^-?\d{1,12}(\.\d{1,2})?$/, 'Must be a valid decimal').optional(),
        currency: z.string().max(10).optional(),
        notes: z.string().max(2000).nullish(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const [updated] = await db
        .update(financialRecords)
        .set(data)
        .where(and(eq(financialRecords.id, id), eq(financialRecords.projectId, ctx.project!.id)))
        .returning();

      if (!updated) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Record not found' });
      }
      return updated;
    }),

  delete: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const [deleted] = await db
        .delete(financialRecords)
        .where(and(eq(financialRecords.id, input.id), eq(financialRecords.projectId, ctx.project!.id)))
        .returning({ id: financialRecords.id });

      if (!deleted) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Record not found' });
      }
      return { deleted: true };
    }),

  summary: projectProcedure.input(periodInput).query(async ({ ctx, input }) => {
    const projectId = ctx.project!.id;
    const since = new Date(Date.now() - input.days * 24 * 60 * 60 * 1000);
    const prevSince = new Date(Date.now() - input.days * 2 * 24 * 60 * 60 * 1000);

    const [current, previous] = await Promise.all([
      db
        .select({
          type: financialRecords.type,
          total: sql<string>`COALESCE(SUM(${financialRecords.amount}), 0)::text`,
        })
        .from(financialRecords)
        .where(and(eq(financialRecords.projectId, projectId), gte(financialRecords.createdAt, since)))
        .groupBy(financialRecords.type),
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
    ]);

    const getVal = (rows: typeof current, type: string) =>
      Number(rows.find((r) => r.type === type)?.total ?? 0);

    const revenue = getVal(current, 'revenue');
    const expenses = getVal(current, 'expense');
    const tax = getVal(current, 'tax');
    const profit = revenue - expenses - tax;

    const prevRevenue = getVal(previous, 'revenue');
    const prevExpenses = getVal(previous, 'expense');
    const prevTax = getVal(previous, 'tax');
    const prevProfit = prevRevenue - prevExpenses - prevTax;

    const growthPct = (curr: number, prev: number) =>
      prev === 0 ? (curr > 0 ? 100 : 0) : Math.round(((curr - prev) / Math.abs(prev)) * 100);

    // MRR from category
    const [mrrResult] = await db
      .select({
        total: sql<string>`COALESCE(SUM(${financialRecords.amount}), 0)::text`,
      })
      .from(financialRecords)
      .where(
        and(
          eq(financialRecords.projectId, projectId),
          eq(financialRecords.category, 'mrr'),
          gte(financialRecords.createdAt, since),
        ),
      );

    return {
      revenue,
      expenses,
      profit,
      tax,
      mrr: Number(mrrResult?.total ?? 0),
      ebitda: profit + tax, // simplified EBITDA
      growth: {
        revenue: growthPct(revenue, prevRevenue),
        expenses: growthPct(expenses, prevExpenses),
        profit: growthPct(profit, prevProfit),
      },
    };
  }),
});
