/**
 * Meta Marketing API tool — manage Facebook/Instagram ad campaigns and read insights.
 * Uses Graph API v21.0 with OAuth2 access token.
 */
import { z } from 'zod';
import type { ToolDefinition, ToolExecutionContext } from '../../engine/types.js';
import { getValidAccessToken } from '../oauth2-helper.js';

const GRAPH_API_BASE = 'https://graph.facebook.com/v21.0';
const FETCH_TIMEOUT_MS = 15_000;

async function graphRequest<T>(token: string, path: string, params?: Record<string, string>): Promise<T> {
  const url = new URL(`${GRAPH_API_BASE}${path}`);
  url.searchParams.set('access_token', token);
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      url.searchParams.set(k, v);
    }
  }

  const res = await fetch(url.toString(), {
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Meta Graph API error (${res.status}): ${text}`);
  }

  return res.json() as Promise<T>;
}

interface AdAccount {
  id: string;
  name?: string;
  account_status?: number;
  currency?: string;
  amount_spent?: string;
}

interface Campaign {
  id: string;
  name?: string;
  status?: string;
  objective?: string;
  daily_budget?: string;
  lifetime_budget?: string;
}

interface InsightData {
  impressions?: string;
  clicks?: string;
  spend?: string;
  cpc?: string;
  cpm?: string;
  ctr?: string;
  reach?: string;
  conversions?: string;
  date_start?: string;
  date_stop?: string;
  campaign_name?: string;
  campaign_id?: string;
}

export const metaMarketingTool: ToolDefinition = {
  name: 'meta_marketing',
  description:
    'Manage Meta (Facebook/Instagram) ad campaigns — list ad accounts, view campaigns, ' +
    'read performance insights, and pause/resume campaigns. ' +
    'Requires Meta OAuth2 connection in Settings > Tools.',
  inputSchema: z.object({
    action: z
      .enum(['list_accounts', 'list_campaigns', 'campaign_insights', 'update_campaign_status'])
      .describe('Action to perform'),
    adAccountId: z
      .string()
      .optional()
      .describe('Ad account ID (format: "act_123456"). Required for campaigns and insights.'),
    campaignId: z
      .string()
      .optional()
      .describe('Campaign ID (required for campaign_insights and update_campaign_status)'),
    datePreset: z
      .enum(['today', 'yesterday', 'last_7d', 'last_14d', 'last_30d', 'this_month', 'last_month'])
      .optional()
      .describe('Date preset for insights (default: last_7d)'),
    newStatus: z
      .enum(['ACTIVE', 'PAUSED'])
      .optional()
      .describe('New campaign status (for update_campaign_status action)'),
    limit: z.number().optional().describe('Max results to return (default: 25)'),
  }),
  requiresApproval: false,
  execute: async (input: unknown, context: ToolExecutionContext) => {
    const {
      action,
      adAccountId,
      campaignId,
      datePreset = 'last_7d',
      newStatus,
      limit = 25,
    } = input as {
      action: 'list_accounts' | 'list_campaigns' | 'campaign_insights' | 'update_campaign_status';
      adAccountId?: string;
      campaignId?: string;
      datePreset?: string;
      newStatus?: string;
      limit?: number;
    };

    const token = await getValidAccessToken(context.projectId, 'meta_marketing');
    if (!token) {
      return { error: 'Meta Marketing not connected. Set it up in Settings > Tools.' };
    }

    try {
      if (action === 'list_accounts') {
        const data = await graphRequest<{ data?: AdAccount[] }>(token, '/me/adaccounts', {
          fields: 'id,name,account_status,currency,amount_spent',
          limit: String(limit),
        });
        return {
          accountCount: data.data?.length ?? 0,
          accounts: (data.data ?? []).map((a) => ({
            id: a.id,
            name: a.name,
            status: a.account_status === 1 ? 'active' : 'inactive',
            currency: a.currency,
            totalSpent: a.amount_spent,
          })),
        };
      }

      if (action === 'list_campaigns') {
        if (!adAccountId) return { error: 'list_campaigns requires adAccountId' };

        const data = await graphRequest<{ data?: Campaign[] }>(
          token,
          `/${adAccountId}/campaigns`,
          {
            fields: 'id,name,status,objective,daily_budget,lifetime_budget',
            limit: String(limit),
          },
        );
        return {
          campaignCount: data.data?.length ?? 0,
          campaigns: (data.data ?? []).map((c) => ({
            id: c.id,
            name: c.name,
            status: c.status,
            objective: c.objective,
            dailyBudget: c.daily_budget,
            lifetimeBudget: c.lifetime_budget,
          })),
        };
      }

      if (action === 'campaign_insights') {
        const targetId = campaignId ?? adAccountId;
        if (!targetId) return { error: 'campaign_insights requires campaignId or adAccountId' };

        const data = await graphRequest<{ data?: InsightData[] }>(
          token,
          `/${targetId}/insights`,
          {
            fields: 'impressions,clicks,spend,cpc,cpm,ctr,reach,campaign_name,campaign_id',
            date_preset: datePreset,
            limit: String(limit),
          },
        );
        return {
          period: datePreset,
          insights: (data.data ?? []).map((i) => ({
            campaignId: i.campaign_id,
            campaignName: i.campaign_name,
            impressions: Number(i.impressions ?? 0),
            clicks: Number(i.clicks ?? 0),
            spend: i.spend,
            cpc: i.cpc,
            cpm: i.cpm,
            ctr: i.ctr,
            reach: Number(i.reach ?? 0),
            dateStart: i.date_start,
            dateStop: i.date_stop,
          })),
        };
      }

      if (action === 'update_campaign_status') {
        if (!campaignId || !newStatus) {
          return { error: 'update_campaign_status requires campaignId and newStatus' };
        }

        const res = await fetch(`${GRAPH_API_BASE}/${campaignId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            access_token: token,
            status: newStatus,
          }),
          signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
        });

        if (!res.ok) {
          const text = await res.text();
          throw new Error(`Failed to update campaign (${res.status}): ${text}`);
        }

        return { success: true, campaignId, newStatus, message: `Campaign ${campaignId} set to ${newStatus}.` };
      }

      return { error: `Unknown action: ${action}` };
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Meta Marketing operation failed' };
    }
  },
};
