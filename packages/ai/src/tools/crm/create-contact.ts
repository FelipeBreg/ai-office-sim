import { z } from 'zod';
import type { ToolDefinition, ToolExecutionContext } from '../../engine/types.js';
import { getValidAccessToken } from '../oauth2-helper.js';
import { createCrmClient } from './client.js';

export const createContactTool: ToolDefinition = {
  name: 'create_contact',
  description:
    'Create a new contact/lead in the RD Station CRM. ' +
    'Requires approval before executing. At minimum, a name is required.',
  inputSchema: z.object({
    name: z.string().min(1).describe('Contact full name'),
    email: z.string().email().optional().describe('Contact email address'),
    phone: z.string().optional().describe('Contact phone number'),
    title: z.string().optional().describe('Contact job title'),
    company: z.string().optional().describe('Contact company/organization'),
    tags: z.array(z.string()).optional().describe('Tags to assign to the contact'),
  }),
  requiresApproval: true,

  execute: async (input: unknown, context: ToolExecutionContext) => {
    const data = input as {
      name: string;
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
    const result = await client.createContact(data);

    if (result.error) {
      return { success: false, error: result.error };
    }

    return { success: true, contact: result.contact };
  },
};
