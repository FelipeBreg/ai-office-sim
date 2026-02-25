/**
 * Google Sheets API v4 client.
 * Uses OAuth2 access token for authentication.
 */

const SHEETS_API_BASE = 'https://sheets.googleapis.com/v4/spreadsheets';
const FETCH_TIMEOUT_MS = 15_000;

export interface SheetsClient {
  readRange(spreadsheetId: string, range: string): Promise<{ values: string[][]; error?: string }>;
  writeRange(spreadsheetId: string, range: string, values: string[][]): Promise<{ updatedCells: number; error?: string }>;
  appendRows(spreadsheetId: string, range: string, values: string[][]): Promise<{ updatedCells: number; error?: string }>;
}

class GoogleSheetsClient implements SheetsClient {
  private token: string;

  constructor(accessToken: string) {
    this.token = accessToken;
  }

  private async request<T>(method: string, url: string, body?: unknown): Promise<T> {
    const res = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${this.token}`,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Google Sheets API error (${res.status}): ${text}`);
    }

    return res.json() as Promise<T>;
  }

  async readRange(spreadsheetId: string, range: string): Promise<{ values: string[][]; error?: string }> {
    try {
      const encodedRange = encodeURIComponent(range);
      const data = await this.request<{ values?: string[][] }>(
        'GET',
        `${SHEETS_API_BASE}/${spreadsheetId}/values/${encodedRange}`,
      );

      return { values: data.values ?? [] };
    } catch (err) {
      return { values: [], error: err instanceof Error ? err.message : 'Read failed' };
    }
  }

  async writeRange(spreadsheetId: string, range: string, values: string[][]): Promise<{ updatedCells: number; error?: string }> {
    try {
      const encodedRange = encodeURIComponent(range);
      const data = await this.request<{ updatedCells?: number }>(
        'PUT',
        `${SHEETS_API_BASE}/${spreadsheetId}/values/${encodedRange}?valueInputOption=USER_ENTERED`,
        { values },
      );

      return { updatedCells: data.updatedCells ?? 0 };
    } catch (err) {
      return { updatedCells: 0, error: err instanceof Error ? err.message : 'Write failed' };
    }
  }

  async appendRows(spreadsheetId: string, range: string, values: string[][]): Promise<{ updatedCells: number; error?: string }> {
    try {
      const encodedRange = encodeURIComponent(range);
      const data = await this.request<{ updates?: { updatedCells?: number } }>(
        'POST',
        `${SHEETS_API_BASE}/${spreadsheetId}/values/${encodedRange}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
        { values },
      );

      return { updatedCells: data.updates?.updatedCells ?? 0 };
    } catch (err) {
      return { updatedCells: 0, error: err instanceof Error ? err.message : 'Append failed' };
    }
  }
}

export function createSheetsClient(accessToken: string): SheetsClient {
  return new GoogleSheetsClient(accessToken);
}
