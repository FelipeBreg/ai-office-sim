import { z } from 'zod';
import type { ToolDefinition, ToolExecutionContext } from '../../engine/types.js';
import { db, wikiArticles, eq, and } from '@ai-office/db';

export const updateWikiArticleTool: ToolDefinition = {
  name: 'update_wiki_article',
  description:
    'Update an existing wiki article content and/or summary. ' +
    'Requires approval.',
  inputSchema: z.object({
    articleId: z.string().describe('The wiki article ID to update'),
    content: z.string().describe('The new full content for this article'),
    summary: z.string().optional().describe('Optional new summary'),
  }),
  requiresApproval: true,
  execute: async (input: unknown, context: ToolExecutionContext) => {
    const { articleId, content, summary } = input as {
      articleId: string;
      content: string;
      summary?: string;
    };

    // Verify article belongs to this project
    const [article] = await db
      .select({ id: wikiArticles.id, title: wikiArticles.title })
      .from(wikiArticles)
      .where(and(eq(wikiArticles.id, articleId), eq(wikiArticles.projectId, context.projectId)))
      .limit(1);

    if (!article) {
      return { error: 'Wiki article not found or not in this project' };
    }

    await db
      .update(wikiArticles)
      .set({
        content,
        ...(summary ? { summary } : {}),
      })
      .where(eq(wikiArticles.id, articleId));

    return { updated: true, articleId, title: article.title };
  },
};
