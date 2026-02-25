import { z } from 'zod';
import type { ToolDefinition, ToolExecutionContext } from '../../engine/types.js';
import { getValidAccessToken } from '../oauth2-helper.js';
import { createCrmClient } from './client.js';

export const updateContactTool: ToolDefinition = {
  name: 'update_contact',
  description:
    'Update an existing contact/lead in the RD Station CRM. ' +
    'Requires approval before executing. Contact ID is required.',
  inputSchema: z.object({
    id: z.string().min(1).describe('Contact ID to update'),
    name: z.string().optional().describe('Updated name'),
    email: z.string().email().optional().describe('Updated email'),
    phone: z.string().optional().describe('Updated phone'),
    title: z.string().optional().describe('Updated job title'),
    company: z.string().optional().describe('Updated company'),
    tags: z.array(z.string()).optional().describe('Updated tags'),
  }),
  requiresApproval: true,

  execute: async (input: unknown, context: ToolExecutionContext) => {
    const { id, ...data } = input as {
      id: string;
      name?: string;
      email?: string;
      phone?: string;
      title?: string;
      company?: string;
      tags?: string[];
    };

    const token = await getValidAccessToken(context.projectId, 'rdstation_crm');
    if (!token) {
      return { success: false, error: 'RD Station CRM not connected. Set it up in Settings > Tools.' };
    }

    const client = createCrmClient(token);
    const result = await client.updateContact(id, data);

    if (result.error) {
      return { success: false, error: result.error };
    }

    return { success: true, contact: result.contact };
  },
};
