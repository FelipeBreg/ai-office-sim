import { z } from 'zod';
import type { ToolDefinition, ToolExecutionContext } from '../../engine/types.js';
import { getValidAccessToken } from '../oauth2-helper.js';
import { createCrmClient } from './client.js';

export const listDealsTool: ToolDefinition = {
  name: 'list_deals',
  description:
    'List deals/opportunities from the RD Station CRM pipeline. ' +
    'Returns deals with name, amount, stage, and contact info. Read-only, no approval required.',
  inputSchema: z.object({
    limit: z.number().int().min(1).max(50).optional().describe('Max deals to return (default: 20)'),
  }),
  requiresApproval: false,

  execute: async (input: unknown, context: ToolExecutionContext) => {
    const { limit = 20 } = input as { limit?: number };

    const token = await getValidAccessToken(context.projectId, 'rdstation_crm');
    if (!token) {
      return { deals: [], error: 'RD Station CRM not connected. Set it up in Settings > Tools.' };
    }

    const client = createCrmClient(token);
    return client.listDeals(limit);
  },
};
