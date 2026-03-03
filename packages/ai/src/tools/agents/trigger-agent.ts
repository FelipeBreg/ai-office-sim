/**
 * Tool: trigger_agent
 * Allows one agent to trigger another agent's execution with a payload message.
 * This enables agent-to-agent communication and task delegation.
 */
import { z } from 'zod';
import type { ToolDefinition, ToolExecutionContext } from '../../engine/types.js';
import { db, agents, eq, and } from '@ai-office/db';
import { getAgentExecutionQueue } from '@ai-office/queue';
import { randomUUID } from 'crypto';

export const triggerAgentTool: ToolDefinition = {
  name: 'trigger_agent',
  description:
    'Trigger another agent to execute with a message payload. ' +
    'Use this when you need to delegate a task, share information, or request help from another agent. ' +
    'The target agent will receive your message in its trigger payload context.',
  inputSchema: z.object({
    agentSlug: z
      .string()
      .describe('The slug identifier of the agent to trigger (e.g., "legal-researcher", "sales-agent")'),
    message: z
      .string()
      .max(5000)
      .describe('Message to send to the target agent explaining what you need'),
    priority: z
      .enum(['normal', 'high'])
      .optional()
      .describe('Priority level for the triggered execution (default: normal)'),
  }),
  requiresApproval: false,
  isMutation: true,
  execute: async (input: unknown, context: ToolExecutionContext) => {
    const { agentSlug, message, priority = 'normal' } = input as {
      agentSlug: string;
      message: string;
      priority?: string;
    };

    try {
      // Look up target agent by slug within the same project
      const [targetAgent] = await db
        .select({ id: agents.id, name: agents.name, isActive: agents.isActive, status: agents.status })
        .from(agents)
        .where(
          and(
            eq(agents.slug, agentSlug),
            eq(agents.projectId, context.projectId),
          ),
        )
        .limit(1);

      if (!targetAgent) {
        return {
          success: false,
          error: `Agent with slug "${agentSlug}" not found in this project`,
        };
      }

      if (!targetAgent.isActive) {
        return {
          success: false,
          error: `Agent "${targetAgent.name}" is currently inactive`,
        };
      }

      // Enqueue the target agent's execution with the message as trigger payload
      const sessionId = randomUUID();
      const queue = getAgentExecutionQueue();
      await queue.add(
        `agent-comm-${targetAgent.id}-${sessionId}`,
        {
          agentId: targetAgent.id,
          projectId: context.projectId,
          sessionId,
          triggerPayload: {
            type: 'agent_message',
            fromAgentId: context.agentId,
            fromSessionId: context.sessionId,
            message,
            priority,
            timestamp: new Date().toISOString(),
          },
        },
        priority === 'high' ? { priority: 1 } : undefined,
      );

      return {
        success: true,
        targetAgentId: targetAgent.id,
        targetAgentName: targetAgent.name,
        sessionId,
        message: `Successfully triggered agent "${targetAgent.name}" with your message`,
      };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to trigger agent',
      };
    }
  },
};
