import { z } from 'zod';
import { createTRPCRouter, projectProcedure, adminProcedure } from '../trpc.js';
import { db, teams, agentTeamMemberships, agents, eq, and, desc } from '@ai-office/db';
import { TRPCError } from '@trpc/server';

export const teamsRouter = createTRPCRouter({
  list: projectProcedure.query(async ({ ctx }) => {
    return db
      .select()
      .from(teams)
      .where(eq(teams.projectId, ctx.project!.id))
      .orderBy(desc(teams.createdAt));
  }),

  getById: projectProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const [team] = await db
        .select()
        .from(teams)
        .where(and(eq(teams.id, input.id), eq(teams.projectId, ctx.project!.id)))
        .limit(1);

      if (!team) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Team not found' });
      }
      return team;
    }),

  create: adminProcedure
    .input(
      z.object({
        name: z.string().min(1).max(100),
        slug: z.string().min(1).max(50),
        description: z.string().max(500).optional(),
        parentTeamId: z.string().uuid().optional(),
        leadAgentId: z.string().uuid().optional(),
        priority: z.enum(['critical', 'high', 'normal', 'low']).optional(),
        maxConcurrency: z.number().int().min(1).max(50).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [team] = await db
        .insert(teams)
        .values({
          projectId: ctx.project!.id,
          ...input,
        })
        .returning();
      return team!;
    }),

  update: adminProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        name: z.string().min(1).max(100).optional(),
        description: z.string().max(500).optional(),
        parentTeamId: z.string().uuid().nullish(),
        leadAgentId: z.string().uuid().nullish(),
        priority: z.enum(['critical', 'high', 'normal', 'low']).optional(),
        maxConcurrency: z.number().int().min(1).max(50).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const [updated] = await db
        .update(teams)
        .set(data)
        .where(and(eq(teams.id, id), eq(teams.projectId, ctx.project!.id)))
        .returning();

      if (!updated) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Team not found' });
      }
      return updated;
    }),

  delete: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const [deleted] = await db
        .delete(teams)
        .where(and(eq(teams.id, input.id), eq(teams.projectId, ctx.project!.id)))
        .returning();

      if (!deleted) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Team not found' });
      }
      return { deleted: true };
    }),

  /* ── Membership management ───────────────────────────────── */

  listMembers: projectProcedure
    .input(z.object({ teamId: z.string().uuid() }))
    .query(async ({ input }) => {
      return db
        .select({
          membership: agentTeamMemberships,
          agent: agents,
        })
        .from(agentTeamMemberships)
        .innerJoin(agents, eq(agentTeamMemberships.agentId, agents.id))
        .where(eq(agentTeamMemberships.teamId, input.teamId));
    }),

  addMember: adminProcedure
    .input(
      z.object({
        teamId: z.string().uuid(),
        agentId: z.string().uuid(),
        role: z.enum(['lead', 'member', 'observer']).optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const [membership] = await db
        .insert(agentTeamMemberships)
        .values(input)
        .onConflictDoUpdate({
          target: [agentTeamMemberships.agentId, agentTeamMemberships.teamId],
          set: { role: input.role ?? 'member' },
        })
        .returning();
      return membership!;
    }),

  removeMember: adminProcedure
    .input(
      z.object({
        teamId: z.string().uuid(),
        agentId: z.string().uuid(),
      }),
    )
    .mutation(async ({ input }) => {
      await db
        .delete(agentTeamMemberships)
        .where(
          and(
            eq(agentTeamMemberships.agentId, input.agentId),
            eq(agentTeamMemberships.teamId, input.teamId),
          ),
        );
      return { removed: true };
    }),

  /** Get all teams with their member counts */
  listWithCounts: projectProcedure.query(async ({ ctx }) => {
    const allTeams = await db
      .select()
      .from(teams)
      .where(eq(teams.projectId, ctx.project!.id))
      .orderBy(teams.name);

    const memberships = await db
      .select({
        teamId: agentTeamMemberships.teamId,
        agentId: agentTeamMemberships.agentId,
        role: agentTeamMemberships.role,
      })
      .from(agentTeamMemberships)
      .innerJoin(agents, eq(agentTeamMemberships.agentId, agents.id))
      .where(eq(agents.projectId, ctx.project!.id));

    return allTeams.map((team) => {
      const members = memberships.filter((m) => m.teamId === team.id);
      return {
        ...team,
        memberCount: members.length,
        leadCount: members.filter((m) => m.role === 'lead').length,
      };
    });
  }),
});
