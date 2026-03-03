import { z } from 'zod';
import { createTRPCRouter, projectProcedure, adminProcedure, ownerProcedure } from '../trpc.js';
import { db, users, eq, and } from '@ai-office/db';
import { TRPCError } from '@trpc/server';

export const membersRouter = createTRPCRouter({
  /** List all members in the current org */
  list: projectProcedure.query(async ({ ctx }) => {
    return db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        avatarUrl: users.avatarUrl,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.orgId, ctx.org!.id))
      .orderBy(users.name);
  }),

  /** Update a member's role (admin+ can set viewer/manager/admin, only owner can set owner) */
  updateRole: adminProcedure
    .input(
      z.object({
        userId: z.string().uuid(),
        role: z.enum(['viewer', 'manager', 'admin', 'owner']),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Can't change your own role
      if (input.userId === ctx.user!.id) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Cannot change your own role',
        });
      }

      // Only owner can promote to owner
      if (input.role === 'owner' && ctx.user!.role !== 'owner') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only the owner can promote another member to owner',
        });
      }

      // Admins can't demote other admins — only owner can
      const [target] = await db
        .select({ role: users.role })
        .from(users)
        .where(and(eq(users.id, input.userId), eq(users.orgId, ctx.org!.id)))
        .limit(1);

      if (!target) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found' });
      }

      if (target.role === 'admin' && ctx.user!.role !== 'owner') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only the owner can change an admin\'s role',
        });
      }

      if (target.role === 'owner') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Cannot change the owner\'s role',
        });
      }

      const [updated] = await db
        .update(users)
        .set({ role: input.role as any })
        .where(and(eq(users.id, input.userId), eq(users.orgId, ctx.org!.id)))
        .returning({
          id: users.id,
          name: users.name,
          role: users.role,
        });

      return updated!;
    }),

  /** Remove a member from the org (admin+ only, can't remove owner) */
  remove: adminProcedure
    .input(z.object({ userId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      if (input.userId === ctx.user!.id) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Cannot remove yourself',
        });
      }

      const [target] = await db
        .select({ role: users.role })
        .from(users)
        .where(and(eq(users.id, input.userId), eq(users.orgId, ctx.org!.id)))
        .limit(1);

      if (!target) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found' });
      }

      if (target.role === 'owner') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Cannot remove the owner',
        });
      }

      if (target.role === 'admin' && ctx.user!.role !== 'owner') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only the owner can remove an admin',
        });
      }

      await db.delete(users).where(and(eq(users.id, input.userId), eq(users.orgId, ctx.org!.id)));
      return { removed: true };
    }),
});
