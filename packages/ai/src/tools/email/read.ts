import { z } from 'zod';
import { db, emailConnections, eq } from '@ai-office/db';
import { decryptCredentials } from '@ai-office/shared';
import type { ToolDefinition, ToolExecutionContext } from '../../engine/types.js';
import { createEmailClient, type EmailProvider, type EmailCredentials } from './client.js';

export const readEmailTool: ToolDefinition = {
  name: 'read_email',
  description:
    'Read recent emails from the connected inbox. ' +
    'Returns an array of emails with from, subject, body (text), date, and read status. ' +
    'Read-only — does not modify any messages.',
  inputSchema: z.object({
    query: z
      .string()
      .optional()
      .describe('Search query to filter emails (matches subject, from, or body)'),
    limit: z
      .number()
      .int()
      .min(1)
      .max(50)
      .optional()
      .describe('Max emails to return (default: 20)'),
    unreadOnly: z
      .boolean()
      .optional()
      .describe('If true, only return unread emails'),
  }),
  requiresApproval: false,

  execute: async (input: unknown, context: ToolExecutionContext) => {
    const { query, limit = 20, unreadOnly = false } = input as {
      query?: string;
      limit?: number;
      unreadOnly?: boolean;
    };

    // Look up email connection for this project
    const [connection] = await db
      .select()
      .from(emailConnections)
      .where(eq(emailConnections.projectId, context.projectId))
      .limit(1);

    if (!connection) {
      return {
        emails: [],
        error: 'No email connection configured for this project. Set it up in Settings > Tools.',
      };
    }

    if (connection.status !== 'connected') {
      return {
        emails: [],
        error: `Email connection is ${connection.status}. Please reconnect in Settings > Tools.`,
      };
    }

    try {
      const rawCreds = connection.apiCredentials as { encrypted?: string } | EmailCredentials | null;
      const credentials: EmailCredentials =
        rawCreds && 'encrypted' in rawCreds && rawCreds.encrypted
          ? JSON.parse(decryptCredentials(rawCreds.encrypted))
          : ((rawCreds ?? {}) as EmailCredentials);

      const client = createEmailClient(
        connection.provider as EmailProvider,
        credentials,
      );

      const result = await client.readEmails({ query, limit, unreadOnly });

      if (result.error) {
        return {
          emails: [],
          error: result.error,
        };
      }

      return {
        emailCount: result.emails.length,
        emails: result.emails,
      };
    } catch (err) {
      return {
        emails: [],
        error: `Provider error: ${err instanceof Error ? err.message : 'Unknown error'}`,
      };
    }
  },
};
