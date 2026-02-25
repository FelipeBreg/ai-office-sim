import { z } from 'zod';
import type { ToolDefinition, ToolExecutionContext } from '../../engine/types.js';
import { db, humanTasks } from '@ai-office/db';

export const createHumanTaskTool: ToolDefinition = {
  name: 'create_human_task',
  description:
    'Create a task that requires human action. Use this when you need a human to do something ' +
    'you cannot do yourself — like making a phone call, signing a document, attending a meeting, ' +
    'or any physical/social action outside your capabilities.',
  inputSchema: z.object({
    title: z.string().describe('Short, actionable title for the task'),
    description: z.string().optional().describe('Detailed description of what needs to be done'),
    context: z.string().optional().describe('Why this task is needed — provide context for the human'),
    priority: z
      .enum(['low', 'medium', 'high', 'urgent'])
      .optional()
      .describe('Priority level (default: medium)'),
  }),
  requiresApproval: false,
  execute: async (input: unknown, context: ToolExecutionContext) => {
    const {
      title,
      description,
      context: taskContext,
      priority = 'medium',
    } = input as {
      title: string;
      description?: string;
      context?: string;
      priority?: string;
    };

    const [created] = await db
      .insert(humanTasks)
      .values({
        projectId: context.projectId,
        agentId: context.agentId,
        title: title.slice(0, 200),
        description: description?.slice(0, 2000),
        context: taskContext?.slice(0, 2000),
        priority: priority as 'low' | 'medium' | 'high' | 'urgent',
      })
      .returning({ id: humanTasks.id });

    return {
      success: true,
      taskId: created!.id,
      message: `Human task "${title}" created. A team member will handle it.`,
    };
  },
};
