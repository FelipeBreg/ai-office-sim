import { z } from 'zod';
import type { ToolDefinition, ToolExecutionContext } from '../../engine/types.js';
import { getValidAccessToken } from '../oauth2-helper.js';
import { createCrmClient } from './client.js';

export const searchContactsTool: ToolDefinition = {
  name: 'search_contacts',
  description:
    'Search for contacts/leads in the RD Station CRM by name, email, or phone number. ' +
    'Returns matching contacts with their details. Read-only, no approval required.',
  inputSchema: z.object({
    query: z.string().min(1).describe('Search query (name, email, or phone)'),
    limit: z.number().int().min(1).max(50).optional().describe('Max results (default: 20)'),
  }),
  requiresApproval: false,

  execute: async (input: unknown, context: ToolExecutionContext) => {
    const { query, limit = 20 } = input as { query: string; limit?: number };

    const token = await getValidAccessToken(context.projectId, 'rdstation_crm');
    if (!token) {
      return { contacts: [], error: 'RD Station CRM not connected. Set it up in Settings > Tools.' };
    }

    const client = createCrmClient(token);
    return client.searchContacts(query, limit);
  },
};
