import { z } from 'zod';
import { createTRPCRouter, projectProcedure, adminProcedure } from '../trpc.js';
import { db, wikiCategories, wikiArticles, eq, and, desc, asc, ilike } from '@ai-office/db';
import { TRPCError } from '@trpc/server';

const BLUEPRINT_TEMPLATES = [
  { key: 'brand-guidelines', title: 'Brand Guidelines', slug: 'brand-guidelines', summary: 'Visual identity, logos, colors, and brand voice standards', content: '# Brand Guidelines\n\n## Logo Usage\n- Primary logo specifications\n- Minimum size requirements\n- Clear space rules\n\n## Color Palette\n- Primary colors\n- Secondary colors\n- Usage guidelines\n\n## Typography\n- Primary typeface\n- Secondary typeface\n- Hierarchy rules\n\n## Brand Voice\n- Tone characteristics\n- Do\'s and Don\'ts\n- Example copy', tags: ['branding', 'identity'] },
  { key: 'tone-of-voice', title: 'Tone of Voice', slug: 'tone-of-voice', summary: 'Communication style and messaging guidelines', content: '# Tone of Voice\n\n## Our Voice Characteristics\n- Professional yet approachable\n- Clear and concise\n- Empowering\n\n## Channel Guidelines\n### Social Media\n- Casual, engaging\n### Email\n- Professional, helpful\n### Website\n- Informative, trustworthy\n\n## Examples\n| Instead of | Use |\n|---|---|\n| | |', tags: ['communication', 'branding'] },
  { key: 'product-catalog', title: 'Product Catalog', slug: 'product-catalog', summary: 'Complete listing of products and services', content: '# Product Catalog\n\n## Product Line 1\n### Features\n- Feature A\n- Feature B\n### Pricing\n- Plan details\n\n## Product Line 2\n### Features\n- Feature A\n### Pricing\n- Plan details\n\n## Comparison Table\n| Feature | Basic | Pro | Enterprise |\n|---|---|---|---|', tags: ['products', 'sales'] },
  { key: 'target-personas', title: 'Target Personas', slug: 'target-personas', summary: 'Ideal customer profiles and buyer personas', content: '# Target Personas\n\n## Persona 1: [Name]\n- **Demographics**: Age, location, income\n- **Goals**: What they want to achieve\n- **Pain Points**: Current frustrations\n- **Channels**: Where they spend time\n- **Buying Triggers**: What motivates purchase\n\n## Persona 2: [Name]\n- **Demographics**: \n- **Goals**: \n- **Pain Points**: \n- **Channels**: \n- **Buying Triggers**: ', tags: ['marketing', 'strategy'] },
  { key: 'content-calendar', title: 'Content Calendar', slug: 'content-calendar', summary: 'Editorial planning and content schedule', content: '# Content Calendar\n\n## Monthly Themes\n| Month | Theme | Key Dates |\n|---|---|---|\n| January | | |\n| February | | |\n\n## Weekly Cadence\n- **Monday**: Blog post\n- **Wednesday**: Social media campaign\n- **Friday**: Newsletter\n\n## Content Pillars\n1. Educational\n2. Inspirational\n3. Promotional\n4. Community', tags: ['content', 'marketing'] },
  { key: 'sales-playbook', title: 'Sales Playbook', slug: 'sales-playbook', summary: 'Sales processes, scripts, and objection handling', content: '# Sales Playbook\n\n## Sales Process\n1. Prospecting\n2. Discovery Call\n3. Demo/Presentation\n4. Proposal\n5. Negotiation\n6. Close\n\n## Qualification Framework (BANT)\n- **Budget**: Can they afford it?\n- **Authority**: Are they the decision maker?\n- **Need**: Do they have a clear need?\n- **Timeline**: When do they need it?\n\n## Common Objections\n| Objection | Response |\n|---|---|\n| "Too expensive" | |\n| "Not the right time" | |', tags: ['sales', 'process'] },
  { key: 'customer-faq', title: 'Customer FAQ', slug: 'customer-faq', summary: 'Frequently asked questions and standard answers', content: '# Customer FAQ\n\n## General\n### What is [Product]?\n[Answer]\n\n### How does pricing work?\n[Answer]\n\n## Technical\n### What integrations are available?\n[Answer]\n\n### Is my data secure?\n[Answer]\n\n## Billing\n### How do I upgrade my plan?\n[Answer]\n\n### What is your refund policy?\n[Answer]', tags: ['support', 'faq'] },
  { key: 'compliance-legal', title: 'Compliance & Legal', slug: 'compliance-legal', summary: 'Legal requirements, privacy policies, and compliance notes', content: '# Compliance & Legal\n\n## Privacy Policy Summary\n- Data collection practices\n- Data retention periods\n- User rights\n\n## Terms of Service Key Points\n- Service level agreements\n- Liability limitations\n- Termination clauses\n\n## Regulatory Compliance\n- LGPD (Brazil)\n- GDPR (EU)\n- Industry-specific regulations\n\n## Data Processing\n- Sub-processors list\n- Data flow diagrams', tags: ['legal', 'compliance'] },
  { key: 'onboarding-guide', title: 'Onboarding Guide', slug: 'onboarding-guide', summary: 'New customer and employee onboarding steps', content: '# Onboarding Guide\n\n## Customer Onboarding\n### Week 1\n- [ ] Welcome email sent\n- [ ] Account setup complete\n- [ ] Kickoff call scheduled\n\n### Week 2\n- [ ] Training session 1\n- [ ] Integration setup\n\n### Week 3-4\n- [ ] Training session 2\n- [ ] First milestone achieved\n\n## Employee Onboarding\n### Day 1\n- [ ] System access\n- [ ] Team introductions\n### Week 1\n- [ ] Tool training\n- [ ] Process overview', tags: ['onboarding', 'process'] },
  { key: 'internal-sops', title: 'Internal SOPs', slug: 'internal-sops', summary: 'Standard operating procedures for internal teams', content: '# Internal SOPs\n\n## Customer Support\n### Ticket Handling\n1. Acknowledge within 1 hour\n2. Categorize priority\n3. Assign to team member\n4. Resolve and document\n\n## Development\n### Code Review Process\n1. Create PR with description\n2. Assign 2 reviewers\n3. Address feedback\n4. Merge after approval\n\n## Marketing\n### Campaign Launch\n1. Brief approval\n2. Asset creation\n3. QA review\n4. Launch and monitor', tags: ['operations', 'process'] },
] as const;

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

  seedBlueprints: adminProcedure.mutation(async ({ ctx }) => {
    const projectId = ctx.project!.id;

    // Check if blueprints category already exists
    const existing = await db
      .select({ id: wikiCategories.id })
      .from(wikiCategories)
      .where(and(eq(wikiCategories.projectId, projectId), eq(wikiCategories.isBlueprint, true)))
      .limit(1);

    if (existing.length > 0) {
      return { seeded: false, message: 'Blueprints already exist' };
    }

    // Create blueprint category
    const [category] = await db
      .insert(wikiCategories)
      .values({
        projectId,
        name: 'Company Blueprints',
        slug: 'company-blueprints',
        description: 'Pre-made document templates for your company knowledge base',
        icon: 'FileText',
        isBlueprint: true,
        sortOrder: 0,
      })
      .returning();

    // Create template articles
    await db.insert(wikiArticles).values(
      BLUEPRINT_TEMPLATES.map((tmpl) => ({
        projectId,
        categoryId: category!.id,
        title: tmpl.title,
        slug: tmpl.slug,
        summary: tmpl.summary,
        content: tmpl.content,
        tags: [...tmpl.tags],
        templateKey: tmpl.key,
        authorId: ctx.user!.id,
      })),
    );

    return { seeded: true, categoryId: category!.id };
  }),

  aiEnhance: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
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

      // Use Anthropic API to enhance content
      const { createDirectClient } = await import('@ai-office/ai');
      const client = createDirectClient();

      const response = await client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4096,
        messages: [
          {
            role: 'user',
            content: `You are a business document specialist. Enhance and organize the following document template for a company wiki. Keep the markdown format, expand sections with practical examples, add missing sections that would be valuable, and make it actionable. Keep the same topic and structure but make it more comprehensive and professional.\n\nTitle: ${article.title}\n\nCurrent content:\n${article.content}\n\nReturn ONLY the enhanced markdown content, no explanations.`,
          },
        ],
      });

      const enhancedContent =
        response.content[0]?.type === 'text' ? response.content[0].text : article.content;

      const [updated] = await db
        .update(wikiArticles)
        .set({ content: enhancedContent })
        .where(eq(wikiArticles.id, input.id))
        .returning();

      return updated!;
    }),
});
