import { z } from 'zod';
import { randomBytes, randomUUID } from 'crypto';
import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
  adminProcedure,
  projectProcedure,
  enforceResourceLimit,
} from '../trpc.js';
import {
  db,
  agents,
  workflows,
  users,
  agentArchetypes,
  communityListings,
  communityInstalls,
  communityReviews,
  eq,
  and,
  or,
  desc,
  asc,
  sql,
  ilike,
  count,
  inArray,
} from '@ai-office/db';
import { TRPCError } from '@trpc/server';

function generateSlug(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40);
  const suffix = randomBytes(3).toString('hex');
  return `${base}-${suffix}`;
}

interface TemplateNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: {
    nodeType?: string;
    archetype?: string;
    agentId?: string;
    agentName?: string;
    [key: string]: unknown;
  };
}

interface TemplateDefinition {
  nodes: TemplateNode[];
  edges: unknown[];
  variables?: unknown[];
}

export const communityRouter = createTRPCRouter({
  /* ------------------------------------------------------------------ */
  /*  Publish Agent                                                      */
  /* ------------------------------------------------------------------ */
  publishAgent: adminProcedure
    .input(z.object({ agentId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const [agent] = await db
        .select()
        .from(agents)
        .where(and(eq(agents.id, input.agentId), eq(agents.projectId, ctx.project!.id)))
        .limit(1);

      if (!agent) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Agent not found' });
      }

      const snapshot = {
        archetype: agent.archetype,
        tools: agent.tools,
        systemPromptEn: agent.systemPromptEn,
        systemPromptPtBr: agent.systemPromptPtBr,
        config: agent.config,
        triggerType: agent.triggerType,
        triggerConfig: agent.triggerConfig,
        team: agent.team,
        memoryScope: agent.memoryScope,
        maxActionsPerSession: agent.maxActionsPerSession,
      };

      const slug = generateSlug(agent.name);

      const [listing] = await db
        .insert(communityListings)
        .values({
          type: 'agent',
          slug,
          nameEn: agent.name,
          namePtBr: agent.namePtBr,
          descriptionEn: agent.systemPromptEn?.slice(0, 300) ?? `${agent.archetype} agent`,
          descriptionPtBr: agent.systemPromptPtBr?.slice(0, 300),
          category: agent.archetype,
          icon: 'bot',
          snapshot,
          publishedById: ctx.user!.id,
          orgId: ctx.org!.id,
        })
        .returning();

      return listing!;
    }),

  /* ------------------------------------------------------------------ */
  /*  Publish Workflow                                                   */
  /* ------------------------------------------------------------------ */
  publishWorkflow: adminProcedure
    .input(z.object({ workflowId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const [workflow] = await db
        .select()
        .from(workflows)
        .where(and(eq(workflows.id, input.workflowId), eq(workflows.projectId, ctx.project!.id)))
        .limit(1);

      if (!workflow) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Workflow not found' });
      }

      const definition = workflow.definition as TemplateDefinition | null;
      const agentNodes = definition?.nodes?.filter(
        (n) => n.data?.nodeType === 'agent' && n.data?.agentId,
      ) ?? [];

      // Resolve agent IDs to archetypes
      const agentIds = agentNodes.map((n) => n.data.agentId!).filter(Boolean);
      let agentMap = new Map<string, string>();
      if (agentIds.length > 0) {
        const agentRows = await db
          .select({ id: agents.id, archetype: agents.archetype })
          .from(agents)
          .where(inArray(agents.id, agentIds));
        agentMap = new Map(agentRows.map((a) => [a.id, a.archetype]));
      }

      // Build sanitized definition — replace agentIds with archetypes
      const sanitizedNodes = definition?.nodes?.map((node) => {
        if (node.data?.nodeType === 'agent' && node.data?.agentId) {
          const archetype = agentMap.get(node.data.agentId) ?? 'custom';
          const { agentId: _agentId, agentName: _agentName, ...restData } = node.data;
          return { ...node, data: { ...restData, archetype } };
        }
        return node;
      }) ?? [];

      const requiredArchetypes = [...new Set(
        sanitizedNodes
          .filter((n) => n.data?.nodeType === 'agent' && n.data?.archetype)
          .map((n) => n.data.archetype as string),
      )];

      const snapshot = {
        name: workflow.name,
        description: workflow.description,
        definition: definition ? { ...definition, nodes: sanitizedNodes } : null,
        requiredArchetypes,
        nodeCount: definition?.nodes?.length ?? 0,
        category: 'general',
      };

      const slug = generateSlug(workflow.name);

      const [listing] = await db
        .insert(communityListings)
        .values({
          type: 'workflow',
          slug,
          nameEn: workflow.name,
          descriptionEn: workflow.description ?? 'Workflow template',
          category: 'general',
          icon: 'git-branch',
          snapshot,
          publishedById: ctx.user!.id,
          orgId: ctx.org!.id,
        })
        .returning();

      return listing!;
    }),

  /* ------------------------------------------------------------------ */
  /*  Unpublish                                                          */
  /* ------------------------------------------------------------------ */
  unpublish: adminProcedure
    .input(z.object({ listingId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const [listing] = await db
        .select()
        .from(communityListings)
        .where(
          and(
            eq(communityListings.id, input.listingId),
            eq(communityListings.publishedById, ctx.user!.id),
          ),
        )
        .limit(1);

      if (!listing) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Listing not found or not owned by you' });
      }

      await db.delete(communityListings).where(eq(communityListings.id, input.listingId));
      return { success: true };
    }),

  /* ------------------------------------------------------------------ */
  /*  Browse / List                                                      */
  /* ------------------------------------------------------------------ */
  list: publicProcedure
    .input(
      z.object({
        type: z.enum(['agent', 'workflow']).optional(),
        category: z.string().optional(),
        search: z.string().max(200).optional(),
        sort: z.enum(['newest', 'popular', 'rating']).optional(),
        page: z.number().int().min(1).optional(),
        limit: z.number().int().min(1).max(50).optional(),
      }).optional(),
    )
    .query(async ({ input }) => {
      const page = input?.page ?? 1;
      const limit = input?.limit ?? 20;
      const offset = (page - 1) * limit;

      const conditions: ReturnType<typeof eq>[] = [];

      if (input?.type) {
        conditions.push(eq(communityListings.type, input.type));
      }
      if (input?.category) {
        conditions.push(eq(communityListings.category, input.category));
      }

      let whereClause = conditions.length > 0
        ? and(...conditions)
        : undefined;

      if (input?.search) {
        const escaped = input.search.replace(/[%_\\]/g, '\\$&');
        const searchCondition = or(
          ilike(communityListings.nameEn, `%${escaped}%`),
          ilike(communityListings.namePtBr, `%${escaped}%`),
          ilike(communityListings.descriptionEn, `%${escaped}%`),
        );
        whereClause = whereClause ? and(whereClause, searchCondition) : searchCondition;
      }

      let orderBy;
      switch (input?.sort) {
        case 'popular':
          orderBy = desc(communityListings.installCount);
          break;
        case 'rating':
          orderBy = sql`CASE WHEN ${communityListings.ratingCount} > 0 THEN ${communityListings.ratingSum}::float / ${communityListings.ratingCount} ELSE 0 END DESC`;
          break;
        default:
          orderBy = desc(communityListings.createdAt);
      }

      const [items, [totalRow]] = await Promise.all([
        db
          .select({
            id: communityListings.id,
            type: communityListings.type,
            slug: communityListings.slug,
            nameEn: communityListings.nameEn,
            namePtBr: communityListings.namePtBr,
            descriptionEn: communityListings.descriptionEn,
            descriptionPtBr: communityListings.descriptionPtBr,
            category: communityListings.category,
            icon: communityListings.icon,
            installCount: communityListings.installCount,
            ratingSum: communityListings.ratingSum,
            ratingCount: communityListings.ratingCount,
            isVerified: communityListings.isVerified,
            createdAt: communityListings.createdAt,
            publisherName: users.name,
            publisherAvatar: users.avatarUrl,
            publishedById: communityListings.publishedById,
          })
          .from(communityListings)
          .leftJoin(users, eq(communityListings.publishedById, users.id))
          .where(whereClause)
          .orderBy(orderBy)
          .limit(limit)
          .offset(offset),
        db
          .select({ count: count() })
          .from(communityListings)
          .where(whereClause),
      ]);

      return {
        items,
        total: totalRow?.count ?? 0,
        page,
        totalPages: Math.ceil((totalRow?.count ?? 0) / limit),
      };
    }),

  /* ------------------------------------------------------------------ */
  /*  Get by Slug                                                        */
  /* ------------------------------------------------------------------ */
  getBySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ input }) => {
      const [listing] = await db
        .select({
          id: communityListings.id,
          type: communityListings.type,
          slug: communityListings.slug,
          nameEn: communityListings.nameEn,
          namePtBr: communityListings.namePtBr,
          descriptionEn: communityListings.descriptionEn,
          descriptionPtBr: communityListings.descriptionPtBr,
          category: communityListings.category,
          icon: communityListings.icon,
          snapshot: communityListings.snapshot,
          installCount: communityListings.installCount,
          ratingSum: communityListings.ratingSum,
          ratingCount: communityListings.ratingCount,
          isVerified: communityListings.isVerified,
          createdAt: communityListings.createdAt,
          publishedById: communityListings.publishedById,
          publisherName: users.name,
          publisherAvatar: users.avatarUrl,
        })
        .from(communityListings)
        .leftJoin(users, eq(communityListings.publishedById, users.id))
        .where(eq(communityListings.slug, input.slug))
        .limit(1);

      if (!listing) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Listing not found' });
      }

      return listing;
    }),

  /* ------------------------------------------------------------------ */
  /*  Install Agent                                                      */
  /* ------------------------------------------------------------------ */
  installAgent: adminProcedure
    .input(z.object({ listingId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const [listing] = await db
        .select()
        .from(communityListings)
        .where(and(eq(communityListings.id, input.listingId), eq(communityListings.type, 'agent')))
        .limit(1);

      if (!listing) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Agent listing not found' });
      }

      await enforceResourceLimit(ctx.org!.id, ctx.org!.plan, 'maxAgents');

      const snap = listing.snapshot as {
        archetype: string;
        tools: string[] | null;
        systemPromptEn: string | null;
        systemPromptPtBr: string | null;
        config: Record<string, unknown> | null;
        triggerType: string;
        triggerConfig: Record<string, unknown> | null;
        team: string | null;
        memoryScope: string;
        maxActionsPerSession: number;
      };

      const slug = `${snap.archetype}-${randomUUID().slice(0, 8)}`;

      const [newAgent] = await db
        .insert(agents)
        .values({
          projectId: ctx.project!.id,
          name: listing.nameEn,
          namePtBr: listing.namePtBr,
          slug,
          archetype: snap.archetype as any,
          systemPromptEn: snap.systemPromptEn,
          systemPromptPtBr: snap.systemPromptPtBr,
          tools: snap.tools ?? [],
          config: snap.config as any,
          triggerType: (snap.triggerType ?? 'manual') as any,
          triggerConfig: snap.triggerConfig as any,
          team: snap.team as any,
          memoryScope: (snap.memoryScope ?? 'read_write') as any,
          maxActionsPerSession: snap.maxActionsPerSession ?? 20,
        })
        .returning();

      // Record install — only increment counter if a new row was inserted
      const inserted = await db
        .insert(communityInstalls)
        .values({
          listingId: input.listingId,
          userId: ctx.user!.id,
          projectId: ctx.project!.id,
        })
        .onConflictDoNothing()
        .returning();

      if (inserted.length > 0) {
        await db
          .update(communityListings)
          .set({ installCount: sql`${communityListings.installCount} + 1` })
          .where(eq(communityListings.id, input.listingId));
      }

      return newAgent!;
    }),

  /* ------------------------------------------------------------------ */
  /*  Install Workflow                                                   */
  /* ------------------------------------------------------------------ */
  installWorkflow: adminProcedure
    .input(z.object({ listingId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const [listing] = await db
        .select()
        .from(communityListings)
        .where(and(eq(communityListings.id, input.listingId), eq(communityListings.type, 'workflow')))
        .limit(1);

      if (!listing) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Workflow listing not found' });
      }

      await enforceResourceLimit(ctx.org!.id, ctx.org!.plan, 'maxWorkflows');

      const snap = listing.snapshot as {
        name: string;
        description: string | null;
        definition: TemplateDefinition | null;
        requiredArchetypes: string[];
        nodeCount: number;
        category: string;
      };

      const definition = snap.definition;
      const updatedDefinition = definition
        ? { ...definition, nodes: [...definition.nodes] }
        : null;

      let agentsCreated = 0;

      if (updatedDefinition?.nodes) {
        // Get existing agents in project
        const existingAgentsList = await db
          .select({ id: agents.id, name: agents.name, archetype: agents.archetype })
          .from(agents)
          .where(eq(agents.projectId, ctx.project!.id));

        const existingByArchetype = new Map<string, { id: string; name: string }>(
          existingAgentsList.map((a) => [a.archetype, { id: a.id, name: a.name }]),
        );

        // Get archetype data for creating missing agents
        const archetypeData = await db.select().from(agentArchetypes);
        const archetypeMap = new Map<string, typeof archetypeData[number]>(
          archetypeData.map((a) => [a.archetype, a]),
        );

        for (let i = 0; i < updatedDefinition.nodes.length; i++) {
          const node = updatedDefinition.nodes[i]!;
          if (node.data?.nodeType !== 'agent' || !node.data?.archetype) continue;

          const archetype = node.data.archetype;
          const existing = existingByArchetype.get(archetype);

          if (existing) {
            updatedDefinition.nodes[i] = {
              ...node,
              data: { ...node.data, agentId: existing.id, agentName: existing.name },
            };
          } else {
            const arch = archetypeMap.get(archetype);
            const slug = `${archetype}-${randomUUID().slice(0, 8)}`;
            const name = arch?.nameEn ?? archetype;

            const [newAgent] = await db
              .insert(agents)
              .values({
                projectId: ctx.project!.id,
                name,
                slug,
                archetype: archetype as any,
                systemPromptEn: arch?.defaultSystemPromptEn,
                systemPromptPtBr: arch?.defaultSystemPromptPtBr,
                tools: arch?.defaultTools ?? [],
                triggerType: (arch?.defaultTriggerType as any) ?? 'manual',
              })
              .returning();

            if (newAgent) {
              updatedDefinition.nodes[i] = {
                ...node,
                data: { ...node.data, agentId: newAgent.id, agentName: newAgent.name },
              };
              existingByArchetype.set(archetype, { id: newAgent.id, name: newAgent.name });
              agentsCreated++;
            }
          }
        }
      }

      const [workflow] = await db
        .insert(workflows)
        .values({
          projectId: ctx.project!.id,
          createdBy: ctx.user!.id,
          name: snap.name,
          description: snap.description,
          definition: updatedDefinition ?? snap.definition,
        })
        .returning();

      // Record install — only increment counter if a new row was inserted
      const inserted = await db
        .insert(communityInstalls)
        .values({
          listingId: input.listingId,
          userId: ctx.user!.id,
          projectId: ctx.project!.id,
        })
        .onConflictDoNothing()
        .returning();

      if (inserted.length > 0) {
        await db
          .update(communityListings)
          .set({ installCount: sql`${communityListings.installCount} + 1` })
          .where(eq(communityListings.id, input.listingId));
      }

      return { ...workflow!, agentsCreated };
    }),

  /* ------------------------------------------------------------------ */
  /*  My Published                                                       */
  /* ------------------------------------------------------------------ */
  myPublished: protectedProcedure
    .input(
      z.object({
        type: z.enum(['agent', 'workflow']).optional(),
        page: z.number().int().min(1).optional(),
        limit: z.number().int().min(1).max(50).optional(),
      }).optional(),
    )
    .query(async ({ ctx, input }) => {
      const page = input?.page ?? 1;
      const limit = input?.limit ?? 20;
      const offset = (page - 1) * limit;

      const conditions = [eq(communityListings.publishedById, ctx.user!.id)];
      if (input?.type) {
        conditions.push(eq(communityListings.type, input.type));
      }

      const whereClause = and(...conditions);

      const [items, [totalRow]] = await Promise.all([
        db
          .select()
          .from(communityListings)
          .where(whereClause)
          .orderBy(desc(communityListings.createdAt))
          .limit(limit)
          .offset(offset),
        db
          .select({ count: count() })
          .from(communityListings)
          .where(whereClause),
      ]);

      return {
        items,
        total: totalRow?.count ?? 0,
        page,
        totalPages: Math.ceil((totalRow?.count ?? 0) / limit),
      };
    }),

  /* ------------------------------------------------------------------ */
  /*  Is Installed                                                       */
  /* ------------------------------------------------------------------ */
  isInstalled: projectProcedure
    .input(z.object({ listingId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const [install] = await db
        .select()
        .from(communityInstalls)
        .where(
          and(
            eq(communityInstalls.listingId, input.listingId),
            eq(communityInstalls.projectId, ctx.project!.id),
          ),
        )
        .limit(1);

      return { installed: !!install };
    }),

  /* ------------------------------------------------------------------ */
  /*  Submit Review                                                      */
  /* ------------------------------------------------------------------ */
  submitReview: protectedProcedure
    .input(
      z.object({
        listingId: z.string().uuid(),
        rating: z.number().int().min(1).max(5),
        comment: z.string().max(1000).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [listing] = await db
        .select()
        .from(communityListings)
        .where(eq(communityListings.id, input.listingId))
        .limit(1);

      if (!listing) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Listing not found' });
      }

      // Check for existing review
      const [existing] = await db
        .select()
        .from(communityReviews)
        .where(
          and(
            eq(communityReviews.listingId, input.listingId),
            eq(communityReviews.userId, ctx.user!.id),
          ),
        )
        .limit(1);

      if (existing) {
        // Update existing review
        const ratingDiff = input.rating - existing.rating;

        await db
          .update(communityReviews)
          .set({
            rating: input.rating,
            comment: input.comment ?? null,
          })
          .where(eq(communityReviews.id, existing.id));

        await db
          .update(communityListings)
          .set({
            ratingSum: sql`${communityListings.ratingSum} + ${ratingDiff}`,
          })
          .where(eq(communityListings.id, input.listingId));

        return { updated: true };
      }

      // Insert new review
      await db
        .insert(communityReviews)
        .values({
          listingId: input.listingId,
          userId: ctx.user!.id,
          rating: input.rating,
          comment: input.comment ?? null,
        });

      await db
        .update(communityListings)
        .set({
          ratingSum: sql`${communityListings.ratingSum} + ${input.rating}`,
          ratingCount: sql`${communityListings.ratingCount} + 1`,
        })
        .where(eq(communityListings.id, input.listingId));

      return { updated: false };
    }),

  /* ------------------------------------------------------------------ */
  /*  List Reviews                                                       */
  /* ------------------------------------------------------------------ */
  listReviews: publicProcedure
    .input(
      z.object({
        listingId: z.string().uuid(),
        page: z.number().int().min(1).optional(),
        limit: z.number().int().min(1).max(50).optional(),
      }),
    )
    .query(async ({ input }) => {
      const page = input.page ?? 1;
      const limit = input.limit ?? 20;
      const offset = (page - 1) * limit;

      const whereClause = eq(communityReviews.listingId, input.listingId);

      const [items, [totalRow]] = await Promise.all([
        db
          .select({
            id: communityReviews.id,
            rating: communityReviews.rating,
            comment: communityReviews.comment,
            createdAt: communityReviews.createdAt,
            userId: communityReviews.userId,
            userName: users.name,
            userAvatar: users.avatarUrl,
          })
          .from(communityReviews)
          .leftJoin(users, eq(communityReviews.userId, users.id))
          .where(whereClause)
          .orderBy(desc(communityReviews.createdAt))
          .limit(limit)
          .offset(offset),
        db
          .select({ count: count() })
          .from(communityReviews)
          .where(whereClause),
      ]);

      return {
        items,
        total: totalRow?.count ?? 0,
        page,
        totalPages: Math.ceil((totalRow?.count ?? 0) / limit),
      };
    }),

  /* ------------------------------------------------------------------ */
  /*  Delete Review                                                      */
  /* ------------------------------------------------------------------ */
  deleteReview: protectedProcedure
    .input(z.object({ reviewId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const [review] = await db
        .select()
        .from(communityReviews)
        .where(
          and(
            eq(communityReviews.id, input.reviewId),
            eq(communityReviews.userId, ctx.user!.id),
          ),
        )
        .limit(1);

      if (!review) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Review not found' });
      }

      await db.delete(communityReviews).where(eq(communityReviews.id, input.reviewId));

      await db
        .update(communityListings)
        .set({
          ratingSum: sql`GREATEST(${communityListings.ratingSum} - ${review.rating}, 0)`,
          ratingCount: sql`GREATEST(${communityListings.ratingCount} - 1, 0)`,
        })
        .where(eq(communityListings.id, review.listingId));

      return { success: true };
    }),

  /* ------------------------------------------------------------------ */
  /*  Publisher Profile                                                   */
  /* ------------------------------------------------------------------ */
  getPublisherProfile: publicProcedure
    .input(z.object({ userId: z.string().uuid() }))
    .query(async ({ input }) => {
      const [user] = await db
        .select({ name: users.name, avatarUrl: users.avatarUrl })
        .from(users)
        .where(eq(users.id, input.userId))
        .limit(1);

      if (!user) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found' });
      }

      const [stats] = await db
        .select({
          listingCount: count(),
          totalInstalls: sql<number>`COALESCE(SUM(${communityListings.installCount}), 0)`,
          totalRatingSum: sql<number>`COALESCE(SUM(${communityListings.ratingSum}), 0)`,
          totalRatingCount: sql<number>`COALESCE(SUM(${communityListings.ratingCount}), 0)`,
        })
        .from(communityListings)
        .where(eq(communityListings.publishedById, input.userId));

      return {
        name: user.name,
        avatarUrl: user.avatarUrl,
        listingCount: stats?.listingCount ?? 0,
        totalInstalls: stats?.totalInstalls ?? 0,
        avgRating:
          stats && stats.totalRatingCount > 0
            ? stats.totalRatingSum / stats.totalRatingCount
            : 0,
      };
    }),

  /* ------------------------------------------------------------------ */
  /*  Publisher Listings                                                  */
  /* ------------------------------------------------------------------ */
  getPublisherListings: publicProcedure
    .input(
      z.object({
        userId: z.string().uuid(),
        type: z.enum(['agent', 'workflow']).optional(),
        page: z.number().int().min(1).optional(),
      }),
    )
    .query(async ({ input }) => {
      const page = input.page ?? 1;
      const limit = 20;
      const offset = (page - 1) * limit;

      const conditions = [eq(communityListings.publishedById, input.userId)];
      if (input.type) {
        conditions.push(eq(communityListings.type, input.type));
      }

      const whereClause = and(...conditions);

      const items = await db
        .select({
          id: communityListings.id,
          type: communityListings.type,
          slug: communityListings.slug,
          nameEn: communityListings.nameEn,
          namePtBr: communityListings.namePtBr,
          descriptionEn: communityListings.descriptionEn,
          descriptionPtBr: communityListings.descriptionPtBr,
          category: communityListings.category,
          icon: communityListings.icon,
          installCount: communityListings.installCount,
          ratingSum: communityListings.ratingSum,
          ratingCount: communityListings.ratingCount,
          isVerified: communityListings.isVerified,
          createdAt: communityListings.createdAt,
        })
        .from(communityListings)
        .where(whereClause)
        .orderBy(desc(communityListings.createdAt))
        .limit(limit)
        .offset(offset);

      return { items, page };
    }),
});
