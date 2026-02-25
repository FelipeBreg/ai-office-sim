import { z } from 'zod';
import { createTRPCRouter, projectProcedure, adminProcedure } from '../trpc.js';
import { db, wikiCategories, wikiArticles, eq, and, desc, asc, ilike } from '@ai-office/db';
import { TRPCError } from '@trpc/server';

export const wikiRouter = createTRPCRouter({
  // ---------------------------------------------------------------------------
  // Categories
  // ---------------------------------------------------------------------------

  listCategories: projectProcedure.query(async ({ ctx }) => {
    return db
      .select()
      .from(wikiCategories)
      .where(eq(wikiCategories.projectId, ctx.project!.id))
      .orderBy(asc(wikiCategories.sortOrder), asc(wikiCategories.name));
  }),

  createCategory: adminProcedure
    .input(
      z.object({
        name: z.string().min(1).max(200),
        slug: z.string().min(1).max(200),
        parentId: z.string().uuid().nullish(),
        description: z.string().max(1000).nullish(),
        icon: z.string().max(50).nullish(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Validate parent exists in same project if provided
      if (input.parentId) {
        const [parent] = await db
          .select({ id: wikiCategories.id, parentId: wikiCategories.parentId })
          .from(wikiCategories)
          .where(
            and(
              eq(wikiCategories.id, input.parentId),
              eq(wikiCategories.projectId, ctx.project!.id),
            ),
          )
          .limit(1);

        if (!parent) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Parent category not found' });
        }

        // Enforce max 3 levels: if parent already has a parent, check depth
        if (parent.parentId) {
          const [grandparent] = await db
            .select({ parentId: wikiCategories.parentId })
            .from(wikiCategories)
            .where(eq(wikiCategories.id, parent.parentId))
            .limit(1);

          if (grandparent?.parentId) {
            throw new TRPCError({
              code: 'BAD_REQUEST',
              message: 'Maximum category depth is 3 levels',
            });
          }
        }
      }

      const [created] = await db
        .insert(wikiCategories)
        .values({
          projectId: ctx.project!.id,
          parentId: input.parentId ?? null,
          name: input.name,
          slug: input.slug,
          description: input.description ?? null,
          icon: input.icon ?? null,
        })
        .returning();

      return created!;
    }),

  deleteCategory: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      // Reassign child categories to parent (or root) before deleting
      const [target] = await db
        .select({ id: wikiCategories.id, parentId: wikiCategories.parentId })
        .from(wikiCategories)
        .where(
          and(
            eq(wikiCategories.id, input.id),
            eq(wikiCategories.projectId, ctx.project!.id),
          ),
        )
        .limit(1);

      if (!target) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Category not found' });
      }

      // Move children up to the deleted category's parent
      await db
        .update(wikiCategories)
        .set({ parentId: target.parentId })
        .where(eq(wikiCategories.parentId, input.id));

      // Unset category on articles that belong to this category
      await db
        .update(wikiArticles)
        .set({ categoryId: null })
        .where(eq(wikiArticles.categoryId, input.id));

      await db
        .delete(wikiCategories)
        .where(eq(wikiCategories.id, input.id));

      return { deleted: true };
    }),

  // ---------------------------------------------------------------------------
  // Articles
  // ---------------------------------------------------------------------------

  listArticles: projectProcedure
    .input(
      z
        .object({
          categoryId: z.string().uuid().nullish(),
          search: z.string().max(500).nullish(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const conditions = [eq(wikiArticles.projectId, ctx.project!.id)];

      if (input?.categoryId) {
        conditions.push(eq(wikiArticles.categoryId, input.categoryId));
      }

      if (input?.search && input.search.trim()) {
        const escaped = input.search.trim().replace(/%/g, '\\%').replace(/_/g, '\\_');
        conditions.push(ilike(wikiArticles.title, `%${escaped}%`));
      }

      return db
        .select({
          id: wikiArticles.id,
          title: wikiArticles.title,
          slug: wikiArticles.slug,
          summary: wikiArticles.summary,
          categoryId: wikiArticles.categoryId,
          tags: wikiArticles.tags,
          authorId: wikiArticles.authorId,
          createdAt: wikiArticles.createdAt,
          updatedAt: wikiArticles.updatedAt,
        })
        .from(wikiArticles)
        .where(and(...conditions))
        .orderBy(desc(wikiArticles.updatedAt));
    }),

  getArticle: projectProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const [article] = await db
        .select()
        .from(wikiArticles)
        .where(
          and(
            eq(wikiArticles.id, input.id),
            eq(wikiArticles.projectId, ctx.project!.id),
          ),
        )
        .limit(1);

      if (!article) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Article not found' });
      }

      return article;
    }),

  createArticle: adminProcedure
    .input(
      z.object({
        title: z.string().min(1).max(500),
        slug: z.string().min(1).max(500),
        summary: z.string().max(2000).nullish(),
        content: z.string().min(1),
        categoryId: z.string().uuid().nullish(),
        tags: z.array(z.string().max(100)).max(20).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Validate category exists in same project if provided
      if (input.categoryId) {
        const [cat] = await db
          .select({ id: wikiCategories.id })
          .from(wikiCategories)
          .where(
            and(
              eq(wikiCategories.id, input.categoryId),
              eq(wikiCategories.projectId, ctx.project!.id),
            ),
          )
          .limit(1);

        if (!cat) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Category not found' });
        }
      }

      const [created] = await db
        .insert(wikiArticles)
        .values({
          projectId: ctx.project!.id,
          title: input.title,
          slug: input.slug,
          summary: input.summary ?? null,
          content: input.content,
          categoryId: input.categoryId ?? null,
          tags: input.tags ?? [],
          authorId: ctx.user!.id,
        })
        .returning();

      return created!;
    }),

  updateArticle: adminProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        title: z.string().min(1).max(500).optional(),
        content: z.string().min(1).optional(),
        summary: z.string().max(2000).nullish(),
        categoryId: z.string().uuid().nullish(),
        tags: z.array(z.string().max(100)).max(20).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...updates } = input;

      // Build the set object with only provided fields
      const setValues: Record<string, unknown> = {};
      if (updates.title !== undefined) setValues.title = updates.title;
      if (updates.content !== undefined) setValues.content = updates.content;
      if (updates.summary !== undefined) setValues.summary = updates.summary ?? null;
      if (updates.categoryId !== undefined) setValues.categoryId = updates.categoryId ?? null;
      if (updates.tags !== undefined) setValues.tags = updates.tags;

      if (Object.keys(setValues).length === 0) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'No fields to update' });
      }

      const [updated] = await db
        .update(wikiArticles)
        .set(setValues)
        .where(
          and(
            eq(wikiArticles.id, id),
            eq(wikiArticles.projectId, ctx.project!.id),
          ),
        )
        .returning();

      if (!updated) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Article not found' });
      }

      return updated;
    }),

  deleteArticle: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const [deleted] = await db
        .delete(wikiArticles)
        .where(
          and(
            eq(wikiArticles.id, input.id),
            eq(wikiArticles.projectId, ctx.project!.id),
          ),
        )
        .returning({ id: wikiArticles.id });

      if (!deleted) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Article not found' });
      }

      return { deleted: true };
    }),
});
