import { z } from 'zod';
import type { ToolDefinition, ToolExecutionContext } from '../../engine/types.js';
import { getValidAccessToken } from '../oauth2-helper.js';
import { createCrmClient } from './client.js';

export const createDealTool: ToolDefinition = {
  name: 'create_deal',
  description:
    'Create a new deal/opportunity in the RD Station CRM pipeline. ' +
    'Requires approval before executing.',
  inputSchema: z.object({
    name: z.string().min(1).describe('Deal name/title'),
    amount: z.number().optional().describe('Deal value in BRL'),
    contactId: z.string().optional().describe('Associated contact ID'),
  }),
  requiresApproval: true,

  execute: async (input: unknown, context: ToolExecutionContext) => {
    const data = input as { name: string; amount?: number; contactId?: string };

    const token = await getValidAccessToken(context.projectId, 'rdstation_crm');
    if (!token) {
      return { success: false, error: 'RD Station CRM not connected. Set it up in Settings > Tools.' };
    }

    const client = createCrmClient(token);
    const result = await client.createDeal(data);

    if (result.error) {
      return { success: false, error: result.error };
    }

    return { success: true, deal: result.deal };
  },
};
