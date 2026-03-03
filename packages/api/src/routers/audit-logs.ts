import { z } from 'zod';
import { createTRPCRouter, adminProcedure, ownerProcedure } from '../trpc.js';
import { db, auditLogs, users, eq, and, desc, gte, lt } from '@ai-office/db';
import { TRPCError } from '@trpc/server';

export const auditLogsRouter = createTRPCRouter({
  /** List audit log entries (admin+ only) */
  list: adminProcedure
    .input(
      z.object({
        resource: z.string().optional(),
        action: z.string().optional(),
        userId: z.string().uuid().optional(),
        days: z.number().min(1).max(90).default(30),
        limit: z.number().int().min(1).max(100).default(50),
        offset: z.number().int().min(0).default(0),
      }),
    )
    .query(async ({ ctx, input }) => {
      const since = new Date(Date.now() - input.days * 24 * 60 * 60 * 1000);
      const conditions = [
        eq(auditLogs.orgId, ctx.org!.id),
        gte(auditLogs.createdAt, since),
      ];

      if (input.resource) {
        conditions.push(eq(auditLogs.resource, input.resource));
      }
      if (input.action) {
        conditions.push(eq(auditLogs.action, input.action));
      }
      if (input.userId) {
        conditions.push(eq(auditLogs.userId, input.userId));
      }

      const rows = await db
        .select({
          id: auditLogs.id,
          userId: auditLogs.userId,
          userName: users.name,
          userEmail: users.email,
          resource: auditLogs.resource,
          action: auditLogs.action,
          resourceId: auditLogs.resourceId,
          path: auditLogs.path,
          input: auditLogs.input,
          result: auditLogs.result,
          createdAt: auditLogs.createdAt,
        })
        .from(auditLogs)
        .innerJoin(users, eq(auditLogs.userId, users.id))
        .where(and(...conditions))
        .orderBy(desc(auditLogs.createdAt))
        .limit(input.limit)
        .offset(input.offset);

      return rows;
    }),

  /** Export audit logs as JSON (owner only) */
  export: ownerProcedure
    .input(
      z.object({
        days: z.number().min(1).max(90).default(30),
      }),
    )
    .query(async ({ ctx, input }) => {
      const since = new Date(Date.now() - input.days * 24 * 60 * 60 * 1000);

      const rows = await db
        .select({
          id: auditLogs.id,
          userId: auditLogs.userId,
          userName: users.name,
          userEmail: users.email,
          resource: auditLogs.resource,
          action: auditLogs.action,
          resourceId: auditLogs.resourceId,
          path: auditLogs.path,
          input: auditLogs.input,
          result: auditLogs.result,
          createdAt: auditLogs.createdAt,
        })
        .from(auditLogs)
        .innerJoin(users, eq(auditLogs.userId, users.id))
        .where(and(eq(auditLogs.orgId, ctx.org!.id), gte(auditLogs.createdAt, since)))
        .orderBy(desc(auditLogs.createdAt))
        .limit(5000);

      return rows;
    }),
});
