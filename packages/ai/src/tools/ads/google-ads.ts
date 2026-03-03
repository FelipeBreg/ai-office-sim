/**
 * Google Ads API tool — read campaign performance metrics and manage campaign status.
 * Uses Google Ads API v18 with OAuth2 access token + developer token.
 */
import { z } from 'zod';
import type { ToolDefinition, ToolExecutionContext } from '../../engine/types.js';
import { getValidAccessToken } from '../oauth2-helper.js';

const GOOGLE_ADS_API_BASE = 'https://googleads.googleapis.com/v18';
const FETCH_TIMEOUT_MS = 15_000;

interface GoogleAdsRow {
  campaign?: {
    id?: string;
    name?: string;
    status?: string;
  };
  metrics?: {
    impressions?: string;
    clicks?: string;
    costMicros?: string;
    conversions?: number;
    ctr?: number;
    averageCpc?: string;
    averageCpm?: string;
  };
  segments?: {
    date?: string;
  };
}

async function googleAdsQuery(
  token: string,
  customerId: string,
  query: string,
): Promise<GoogleAdsRow[]> {
  const developerToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN;
  if (!developerToken) {
    throw new Error('GOOGLE_ADS_DEVELOPER_TOKEN not configured');
  }

  const res = await fetch(
    `${GOOGLE_ADS_API_BASE}/customers/${customerId}/googleAds:searchStream`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'developer-token': developerToken,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query }),
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    },
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Google Ads API error (${res.status}): ${text}`);
  }

  const data = (await res.json()) as Array<{ results?: GoogleAdsRow[] }>;
  return data.flatMap((batch) => batch.results ?? []);
}

export const googleAdsTool: ToolDefinition = {
  name: 'google_ads',
  description:
    'Read Google Ads campaign performance metrics — list campaigns with spend/clicks/impressions, ' +
    'get detailed metrics for a specific campaign, or pause/enable campaigns. ' +
    'Requires Google Ads OAuth2 connection in Settings > Tools.',
  inputSchema: z.object({
    action: z
      .enum(['list_campaigns', 'campaign_metrics', 'update_campaign_status'])
      .describe('Action to perform'),
    customerId: z
      .string()
      .describe('Google Ads customer ID (format: "1234567890", no dashes)'),
    campaignId: z
      .string()
      .optional()
      .describe('Campaign ID (required for campaign_metrics and update_campaign_status)'),
    dateRange: z
      .enum(['TODAY', 'YESTERDAY', 'LAST_7_DAYS', 'LAST_30_DAYS', 'THIS_MONTH', 'LAST_MONTH'])
      .optional()
      .describe('Date range for metrics (default: LAST_7_DAYS)'),
    newStatus: z
      .enum(['ENABLED', 'PAUSED'])
      .optional()
      .describe('New campaign status (for update_campaign_status)'),
  }),
  requiresApproval: false,
  isMutation: true,
  execute: async (input: unknown, context: ToolExecutionContext) => {
    const {
      action,
      customerId,
      campaignId,
      dateRange = 'LAST_7_DAYS',
      newStatus,
    } = input as {
      action: 'list_campaigns' | 'campaign_metrics' | 'update_campaign_status';
      customerId: string;
      campaignId?: string;
      dateRange?: string;
      newStatus?: string;
    };

    const token = await getValidAccessToken(context.projectId, 'google_ads');
    if (!token) {
      return { error: 'Google Ads not connected. Set it up in Settings > Tools.' };
    }

    try {
      if (action === 'list_campaigns') {
        const query = `
          SELECT
            campaign.id, campaign.name, campaign.status,
            metrics.impressions, metrics.clicks, metrics.cost_micros,
            metrics.conversions, metrics.ctr, metrics.average_cpc
          FROM campaign
          WHERE segments.date DURING ${dateRange}
          ORDER BY metrics.cost_micros DESC
          LIMIT 50
        `;
        const rows = await googleAdsQuery(token, customerId, query);
        return {
          campaignCount: rows.length,
          dateRange,
          campaigns: rows.map((r) => ({
            id: r.campaign?.id,
            name: r.campaign?.name,
            status: r.campaign?.status,
            impressions: Number(r.metrics?.impressions ?? 0),
            clicks: Number(r.metrics?.clicks ?? 0),
            costUsd: Number(r.metrics?.costMicros ?? 0) / 1_000_000,
            conversions: r.metrics?.conversions ?? 0,
            ctr: r.metrics?.ctr ?? 0,
            avgCpc: Number(r.metrics?.averageCpc ?? 0) / 1_000_000,
          })),
        };
      }

      if (action === 'campaign_metrics') {
        if (!campaignId) return { error: 'campaign_metrics requires campaignId' };

        const query = `
          SELECT
            campaign.id, campaign.name,
            segments.date,
            metrics.impressions, metrics.clicks, metrics.cost_micros,
            metrics.conversions, metrics.ctr, metrics.average_cpc, metrics.average_cpm
          FROM campaign
          WHERE campaign.id = ${campaignId}
            AND segments.date DURING ${dateRange}
          ORDER BY segments.date DESC
        `;
        const rows = await googleAdsQuery(token, customerId, query);
        return {
          campaignId,
          campaignName: rows[0]?.campaign?.name,
          dateRange,
          dailyMetrics: rows.map((r) => ({
            date: r.segments?.date,
            impressions: Number(r.metrics?.impressions ?? 0),
            clicks: Number(r.metrics?.clicks ?? 0),
            costUsd: Number(r.metrics?.costMicros ?? 0) / 1_000_000,
            conversions: r.metrics?.conversions ?? 0,
            ctr: r.metrics?.ctr ?? 0,
            avgCpc: Number(r.metrics?.averageCpc ?? 0) / 1_000_000,
            avgCpm: Number(r.metrics?.averageCpm ?? 0) / 1_000_000,
          })),
        };
      }

      if (action === 'update_campaign_status') {
        if (!campaignId || !newStatus) {
          return { error: 'update_campaign_status requires campaignId and newStatus' };
        }

        const developerToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN;
        if (!developerToken) {
          return { error: 'GOOGLE_ADS_DEVELOPER_TOKEN not configured' };
        }

        const res = await fetch(
          `${GOOGLE_ADS_API_BASE}/customers/${customerId}/campaigns:mutate`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
              'developer-token': developerToken,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              operations: [
                {
                  update: {
                    resourceName: `customers/${customerId}/campaigns/${campaignId}`,
                    status: newStatus,
                  },
                  updateMask: 'status',
                },
              ],
            }),
            signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
          },
        );

        if (!res.ok) {
          const text = await res.text();
          throw new Error(`Failed to update campaign (${res.status}): ${text}`);
        }

        return { success: true, campaignId, newStatus, message: `Campaign ${campaignId} set to ${newStatus}.` };
      }

      return { error: `Unknown action: ${action}` };
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Google Ads operation failed' };
    }
  },
};
