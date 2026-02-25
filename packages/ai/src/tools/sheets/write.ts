import { z } from 'zod';
import type { ToolDefinition, ToolExecutionContext } from '../../engine/types.js';
import { getValidAccessToken } from '../oauth2-helper.js';
import { createSheetsClient } from './client.js';

export const writeSpreadsheetTool: ToolDefinition = {
  name: 'write_spreadsheet',
  description:
    'Write data to a Google Sheets spreadsheet. Overwrites the specified range. ' +
    'Requires approval before executing. Use A1 notation for range.',
  inputSchema: z.object({
    spreadsheetId: z.string().min(1).describe('Google Sheets spreadsheet ID (from the URL)'),
    range: z.string().min(1).describe('Cell range in A1 notation (e.g. "Sheet1!A1:D10")'),
    values: z.array(z.array(z.string())).min(1).describe('2D array of cell values (rows × columns)'),
  }),
  requiresApproval: true,

  execute: async (input: unknown, context: ToolExecutionContext) => {
    const { spreadsheetId, range, values } = input as {
      spreadsheetId: string;
      range: string;
      values: string[][];
    };

    const token = await getValidAccessToken(context.projectId, 'google_sheets');
    if (!token) {
      return { success: false, error: 'Google Sheets not connected. Set it up in Settings > Tools.' };
    }

    const client = createSheetsClient(token);
    const result = await client.writeRange(spreadsheetId, range, values);

    if (result.error) {
      return { success: false, error: result.error };
    }

    return { success: true, updatedCells: result.updatedCells };
  },
};
