import { z } from 'zod';
import type { ToolDefinition, ToolExecutionContext } from '../../engine/types.js';
import { getValidAccessToken } from '../oauth2-helper.js';
import { createSheetsClient } from './client.js';

export const readSpreadsheetTool: ToolDefinition = {
  name: 'read_spreadsheet',
  description:
    'Read data from a Google Sheets spreadsheet. Returns a 2D array of cell values. ' +
    'Read-only, no approval required. Use A1 notation for range (e.g. "Sheet1!A1:D10").',
  inputSchema: z.object({
    spreadsheetId: z.string().min(1).describe('Google Sheets spreadsheet ID (from the URL)'),
    range: z.string().min(1).describe('Cell range in A1 notation (e.g. "Sheet1!A1:D10")'),
  }),
  requiresApproval: false,

  execute: async (input: unknown, context: ToolExecutionContext) => {
    const { spreadsheetId, range } = input as { spreadsheetId: string; range: string };

    const token = await getValidAccessToken(context.projectId, 'google_sheets');
    if (!token) {
      return { values: [], error: 'Google Sheets not connected. Set it up in Settings > Tools.' };
    }

    const client = createSheetsClient(token);
    const result = await client.readRange(spreadsheetId, range);

    if (result.error) {
      return { values: [], error: result.error };
    }

    return {
      rowCount: result.values.length,
      columnCount: result.values[0]?.length ?? 0,
      values: result.values,
    };
  },
};
