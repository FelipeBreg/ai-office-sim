import { z } from 'zod';
import type { ToolDefinition, ToolExecutionContext } from '../../engine/types.js';
import { db, devopsRequests } from '@ai-office/db';

export const createPrReviewRequestTool: ToolDefinition = {
  name: 'create_pr_review_request',
  description:
    'Create a pull request review request for human review. Use this when a PR needs ' +
    'human eyes before merging — for code quality, security, or compliance checks.',
  inputSchema: z.object({
    title: z.string().describe('Short title describing the PR'),
    description: z.string().optional().describe('Summary of what the PR changes'),
    prUrl: z.string().optional().describe('URL of the pull request'),
    prNumber: z.number().optional().describe('PR number'),
    branch: z.string().optional().describe('Branch name'),
    priority: z
      .enum(['low', 'medium', 'high', 'critical'])
      .optional()
      .describe('Priority level (default: medium)'),
  }),
  requiresApproval: false,
  execute: async (input: unknown, context: ToolExecutionContext) => {
    const {
      title,
      description,
      prUrl,
      prNumber,
      branch,
      priority = 'medium',
    } = input as {
      title: string;
      description?: string;
      prUrl?: string;
      prNumber?: number;
      branch?: string;
      priority?: string;
    };

    // Validate URL if provided
    const safePrUrl = prUrl?.startsWith('https://') ? prUrl : undefined;

    const [created] = await db
      .insert(devopsRequests)
      .values({
        projectId: context.projectId,
        agentId: context.agentId,
        type: 'pr_review',
        priority: priority as 'low' | 'medium' | 'high' | 'critical',
        title: title.slice(0, 200),
        description: description?.slice(0, 2000),
        metadata: {
          prUrl: safePrUrl,
          prNumber,
          branch,
        },
      })
      .returning({ id: devopsRequests.id });

    return {
      success: true,
      requestId: created!.id,
      message: `PR review request "${title}" created and awaiting human review.`,
    };
  },
};
