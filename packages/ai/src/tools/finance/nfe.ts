import { z } from 'zod';
import type { ToolDefinition, ToolExecutionContext } from '../../engine/types.js';

const SEFAZ_CONSULTA_URL = 'https://www.nfe.fazenda.gov.br/portal/consultaRecaptcha.aspx';
const FETCH_TIMEOUT_MS = 15_000;

interface NFeStatus {
  accessKey: string;
  status: string;
  statusCode: string;
  issuedAt?: string;
  issuerName?: string;
  issuerCnpj?: string;
  totalValue?: string;
  protocol?: string;
  error?: string;
}

export const checkNfeStatusTool: ToolDefinition = {
  name: 'check_nfe_status',
  description:
    'Check the status of a Brazilian NF-e (Nota Fiscal Eletrônica) by its access key. ' +
    'Uses the SEFAZ API to verify if a NF-e is authorized, cancelled, or has issues. ' +
    'Read-only, no approval required.',
  inputSchema: z.object({
    accessKey: z
      .string()
      .length(44)
      .describe('The 44-digit NF-e access key (chave de acesso)'),
    environment: z
      .enum(['production', 'homologation'])
      .optional()
      .describe('SEFAZ environment (default: production)'),
  }),
  requiresApproval: false,

  execute: async (input: unknown, context: ToolExecutionContext) => {
    const { accessKey, environment = 'production' } = input as {
      accessKey: string;
      environment?: string;
    };

    // Validate access key format (44 digits)
    if (!/^\d{44}$/.test(accessKey)) {
      return {
        status: null,
        error: 'Invalid access key format. Must be exactly 44 digits.',
      };
    }

    const apiKey = process.env.SEFAZ_API_KEY;
    const apiUrl = process.env.SEFAZ_API_URL;

    if (!apiKey || !apiUrl) {
      // Fallback: parse data directly from the access key
      return parseAccessKey(accessKey);
    }

    try {
      const env = environment === 'homologation' ? '2' : '1';
      const url = `${apiUrl}/nfe/consulta?chNFe=${accessKey}&tpAmb=${env}`;

      const res = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      });

      if (!res.ok) {
        const text = await res.text();
        return {
          status: null,
          error: `SEFAZ API error (${res.status}): ${text}`,
        };
      }

      const data = (await res.json()) as {
        cStat?: string;
        xMotivo?: string;
        protNFe?: {
          infProt?: {
            nProt?: string;
            dhRecbto?: string;
            cStat?: string;
            xMotivo?: string;
          };
        };
        NFe?: {
          infNFe?: {
            emit?: { xNome?: string; CNPJ?: string };
            total?: { ICMSTot?: { vNF?: string } };
            ide?: { dhEmi?: string };
          };
        };
      };

      const prot = data.protNFe?.infProt;
      const nfe = data.NFe?.infNFe;

      const result: NFeStatus = {
        accessKey,
        status: prot?.xMotivo ?? data.xMotivo ?? 'Unknown',
        statusCode: prot?.cStat ?? data.cStat ?? '',
        protocol: prot?.nProt,
        issuedAt: nfe?.ide?.dhEmi,
        issuerName: nfe?.emit?.xNome,
        issuerCnpj: nfe?.emit?.CNPJ,
        totalValue: nfe?.total?.ICMSTot?.vNF
          ? `R$ ${parseFloat(nfe.total.ICMSTot.vNF).toFixed(2).replace('.', ',')}`
          : undefined,
      };

      return result;
    } catch (err) {
      return {
        status: null,
        error: err instanceof Error ? err.message : 'NF-e query failed',
      };
    }
  },
};

/** Extract basic info from the 44-digit access key without API call */
function parseAccessKey(key: string): {
  accessKey: string;
  parsed: {
    stateCode: string;
    yearMonth: string;
    issuerCnpj: string;
    model: string;
    series: string;
    number: string;
  };
  note: string;
} {
  return {
    accessKey: key,
    parsed: {
      stateCode: key.substring(0, 2),
      yearMonth: `20${key.substring(2, 4)}-${key.substring(4, 6)}`,
      issuerCnpj: key.substring(6, 20),
      model: key.substring(20, 22),
      series: key.substring(22, 25),
      number: key.substring(25, 34),
    },
    note: 'SEFAZ API credentials not configured. Only parsed key data available. Configure SEFAZ_API_KEY and SEFAZ_API_URL in environment.',
  };
}
