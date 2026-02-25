import { z } from 'zod';
import type { ToolDefinition, ToolExecutionContext } from '../../engine/types.js';
import { db, devopsRequests } from '@ai-office/db';

export const createDeployRequestTool: ToolDefinition = {
  name: 'create_deploy_request',
  description:
    'Create a deploy request for human review. Use this when you need to deploy code changes, ' +
    'request a rollback, or make infrastructure changes that require human approval.',
  inputSchema: z.object({
    title: z.string().describe('Short title describing what needs to be deployed'),
    description: z.string().optional().describe('Detailed description of the changes'),
    type: z
      .enum(['deploy', 'rollback', 'infra_change'])
      .optional()
      .describe('Type of request (default: deploy)'),
    priority: z
      .enum(['low', 'medium', 'high', 'critical'])
      .optional()
      .describe('Priority level (default: medium)'),
    branch: z.string().optional().describe('Git branch name'),
    commitSha: z.string().optional().describe('Git commit SHA'),
    environment: z.string().optional().describe('Target environment (e.g. staging, production)'),
  }),
  requiresApproval: true,
  execute: async (input: unknown, context: ToolExecutionContext) => {
    const {
      title,
      description,
      type = 'deploy',
      priority = 'medium',
      branch,
      commitSha,
      environment,
    } = input as {
      title: string;
      description?: string;
      type?: string;
      priority?: string;
      branch?: string;
      commitSha?: string;
      environment?: string;
    };

    const [created] = await db
      .insert(devopsRequests)
      .values({
        projectId: context.projectId,
        agentId: context.agentId,
        type: type as 'deploy' | 'rollback' | 'infra_change',
        priority: priority as 'low' | 'medium' | 'high' | 'critical',
        title: title.slice(0, 200),
        description: description?.slice(0, 2000),
        metadata: {
          branch,
          commitSha,
          environment,
        },
      })
      .returning({ id: devopsRequests.id });

    return {
      success: true,
      requestId: created!.id,
      message: `Deploy request "${title}" created and awaiting human review.`,
    };
  },
};
