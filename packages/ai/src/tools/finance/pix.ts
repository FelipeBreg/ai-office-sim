import { z } from 'zod';
import type { ToolDefinition, ToolExecutionContext } from '../../engine/types.js';

const EFI_API_BASE = 'https://pix.api.efipay.com.br';
const FETCH_TIMEOUT_MS = 15_000;

interface PixTransaction {
  txid: string;
  status: string;
  amount: string;
  payerName?: string;
  payerCpfCnpj?: string;
  timestamp: string;
  description?: string;
}

export const monitorPixTransactionsTool: ToolDefinition = {
  name: 'monitor_pix_transactions',
  description:
    'Monitor recent Pix transactions from the connected bank account. ' +
    'Returns recent incoming and outgoing Pix payments. Read-only, no approval required. ' +
    'Requires EFI Bank (Gerencianet) API credentials configured in Settings.',
  inputSchema: z.object({
    startDate: z.string().optional().describe('Start date (ISO format, default: 7 days ago)'),
    endDate: z.string().optional().describe('End date (ISO format, default: today)'),
    status: z.enum(['all', 'completed', 'pending', 'refunded']).optional().describe('Filter by status (default: all)'),
  }),
  requiresApproval: false,

  execute: async (input: unknown, context: ToolExecutionContext) => {
    const { startDate, endDate, status = 'all' } = input as {
      startDate?: string;
      endDate?: string;
      status?: string;
    };

    // Pix monitoring uses a dedicated API key stored in tool_credentials
    // For now, use env-based credentials until full OAuth2 integration
    const pixApiKey = process.env.EFI_PIX_API_KEY;
    const pixClientId = process.env.EFI_PIX_CLIENT_ID;

    if (!pixApiKey && !pixClientId) {
      return {
        transactions: [],
        error: 'Pix monitoring not configured. Set EFI_PIX_API_KEY or connect via Settings > Tools.',
      };
    }

    const start = startDate ?? new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const end = endDate ?? new Date().toISOString();

    try {
      // EFI Bank Pix API — list received transactions
      const url = `${EFI_API_BASE}/v2/pix?inicio=${encodeURIComponent(start)}&fim=${encodeURIComponent(end)}`;

      const res = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${pixApiKey}`,
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      });

      if (!res.ok) {
        const text = await res.text();
        return { transactions: [], error: `Pix API error (${res.status}): ${text}` };
      }

      const data = (await res.json()) as {
        pix?: Array<{
          txid?: string;
          status?: string;
          valor?: string;
          horario?: string;
          pagador?: { nome?: string; cpf?: string; cnpj?: string };
          infoPagador?: string;
        }>;
      };

      const transactions: PixTransaction[] = (data.pix ?? [])
        .filter((tx) => status === 'all' || tx.status === status)
        .map((tx) => ({
          txid: tx.txid ?? '',
          status: tx.status ?? 'unknown',
          amount: tx.valor ?? '0',
          payerName: tx.pagador?.nome,
          payerCpfCnpj: tx.pagador?.cpf ?? tx.pagador?.cnpj,
          timestamp: tx.horario ?? '',
          description: tx.infoPagador,
        }));

      const totalAmount = transactions.reduce(
        (sum, tx) => sum + parseFloat(tx.amount || '0'),
        0,
      );

      return {
        transactionCount: transactions.length,
        totalAmount: `R$ ${totalAmount.toFixed(2).replace('.', ',')}`,
        dateRange: { start, end },
        transactions,
      };
    } catch (err) {
      return {
        transactions: [],
        error: err instanceof Error ? err.message : 'Pix monitoring failed',
      };
    }
  },
};
