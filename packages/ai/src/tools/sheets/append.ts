import { z } from 'zod';
import type { ToolDefinition, ToolExecutionContext } from '../../engine/types.js';
import { getValidAccessToken } from '../oauth2-helper.js';
import { createSheetsClient } from './client.js';

export const appendToSpreadsheetTool: ToolDefinition = {
  name: 'append_to_spreadsheet',
  description:
    'Append rows to the end of a Google Sheets spreadsheet. Useful for logging and data collection. ' +
    'Requires approval before executing.',
  inputSchema: z.object({
    spreadsheetId: z.string().min(1).describe('Google Sheets spreadsheet ID (from the URL)'),
    range: z.string().min(1).describe('Target sheet/range in A1 notation (e.g. "Sheet1!A:D")'),
    values: z.array(z.array(z.string())).min(1).describe('Rows to append (2D array)'),
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
    const result = await client.appendRows(spreadsheetId, range, values);

    if (result.error) {
      return { success: false, error: result.error };
    }

    return { success: true, appendedRows: values.length, updatedCells: result.updatedCells };
  },
};
