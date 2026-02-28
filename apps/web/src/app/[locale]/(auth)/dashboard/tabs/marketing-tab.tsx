'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { MessageCircle, Mail, Plus, X, Trash2 } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { trpc } from '@/lib/trpc/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { PeriodSelector } from '@/components/period-selector';

const PLATFORMS = [
  'meta_ads', 'youtube_ads', 'email', 'linkedin',
  'instagram', 'google_ads', 'tiktok', 'other',
] as const;
const FUNNEL_STAGES = ['top', 'middle', 'bottom'] as const;

export function MarketingTab() {
  const t = useTranslations('dashboard');
  const utils = trpc.useUtils();
  const [days, setDays] = useState(30);
  const [platformFilter, setPlatformFilter] = useState<string>('all');

  const { data, isLoading, error } = trpc.dashboard.marketing.useQuery({ days });
  const { data: campaigns } = trpc.marketingCampaigns.list.useQuery();

  const createCampaignMutation = trpc.marketingCampaigns.create.useMutation({
    onSuccess: () => {
      utils.marketingCampaigns.list.invalidate();
      utils.dashboard.marketing.invalidate();
    },
  });
  const deleteCampaignMutation = trpc.marketingCampaigns.delete.useMutation({
    onSuccess: () => {
      utils.marketingCampaigns.list.invalidate();
      utils.dashboard.marketing.invalidate();
    },
  });

  const [showForm, setShowForm] = useState(false);
  const [campName, setCampName] = useState('');
  const [campPlatform, setCampPlatform] = useState<(typeof PLATFORMS)[number]>('other');
  const [campSpend, setCampSpend] = useState('');
  const [campFunnel, setCampFunnel] = useState<(typeof FUNNEL_STAGES)[number]>('top');

  if (error) {
    return <p className="text-xs text-status-error">{t('loadError')}</p>;
  }

  if (isLoading || !data) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  // Funnel data
  const funnelTop = data.funnel?.find((f) => f.funnelStage === 'top');
  const funnelMid = data.funnel?.find((f) => f.funnelStage === 'middle');
  const funnelBot = data.funnel?.find((f) => f.funnelStage === 'bottom');

  const topImpressions = funnelTop?.totalImpressions ?? 0;
  const midClicks = funnelMid?.totalClicks ?? 0;
  const botConversions = funnelBot?.totalConversions ?? 0;

  const topToMid = topImpressions > 0 ? Math.round((midClicks / topImpressions) * 100) : 0;
  const midToBot = midClicks > 0 ? Math.round((botConversions / midClicks) * 100) : 0;

  const filteredCampaigns = campaigns?.filter(
    (c) => platformFilter === 'all' || c.platform === platformFilter,
  );

  const waTotal = data.whatsapp.byDirection.reduce((s, r) => s + r.count, 0);
  const waInbound = data.whatsapp.byDirection.find((r) => r.direction === 'inbound')?.count ?? 0;
  const waOutbound = data.whatsapp.byDirection.find((r) => r.direction === 'outbound')?.count ?? 0;
  const emailTotal = data.email.byStatus.reduce((s, r) => s + r.count, 0);

  function handleCreateCampaign() {
    if (!campName.trim()) return;
    createCampaignMutation.mutate(
      {
        name: campName.trim(),
        platform: campPlatform,
        spend: campSpend.replace(/[^\d.]/g, '').trim() || undefined,
        funnelStage: campFunnel,
      },
      {
        onSuccess: () => {
          setCampName('');
          setCampSpend('');
          setShowForm(false);
        },
      },
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PeriodSelector days={days} onChange={setDays} />

      {/* Marketing Funnel */}
      {(topImpressions > 0 || midClicks > 0 || botConversions > 0) && (
        <div className="border border-border-default bg-bg-base p-4">
          <h3 className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-text-muted">
            {t('marketingFunnel')}
          </h3>
          <div className="flex flex-col items-center gap-1">
            <FunnelBar label={t('funnelTop')} value={topImpressions} width="100%" color="bg-accent-cyan" />
            <span className="text-[9px] text-text-muted">{topToMid}% {t('conversion')}</span>
            <FunnelBar label={t('funnelMiddle')} value={midClicks} width="66%" color="bg-blue-400" />
            <span className="text-[9px] text-text-muted">{midToBot}% {t('conversion')}</span>
            <FunnelBar label={t('funnelBottom')} value={botConversions} width="33%" color="bg-status-success" />
          </div>
        </div>
      )}

      {/* Campaigns */}
      <div className="border border-border-default bg-bg-base p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
            {t('campaigns')}
          </h3>
          <div className="flex gap-2">
            <select
              value={platformFilter}
              onChange={(e) => setPlatformFilter(e.target.value)}
              className="h-7 border border-border-default bg-bg-overlay px-2 text-[10px] text-text-primary"
            >
              <option value="all">{t('allPlatforms')}</option>
              {PLATFORMS.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
            <Button size="sm" onClick={() => setShowForm(!showForm)}>
              {showForm ? <X size={12} className="mr-1" /> : <Plus size={12} className="mr-1" />}
              {t('addCampaign')}
            </Button>
          </div>
        </div>

        {showForm && (
          <div className="mb-3 flex flex-wrap items-end gap-2 border border-border-subtle bg-bg-overlay p-2">
            <div className="flex flex-col gap-1">
              <label className="text-[9px] uppercase text-text-muted">{t('campName')}</label>
              <Input value={campName} onChange={(e) => setCampName(e.target.value)} className="w-40" placeholder={t('campNamePlaceholder')} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[9px] uppercase text-text-muted">{t('campPlatform')}</label>
              <select value={campPlatform} onChange={(e) => setCampPlatform(e.target.value as typeof campPlatform)} className="h-8 border border-border-default bg-bg-overlay px-2 text-[11px] text-text-primary">
                {PLATFORMS.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[9px] uppercase text-text-muted">{t('campSpend')}</label>
              <Input value={campSpend} onChange={(e) => setCampSpend(e.target.value)} className="w-24" placeholder="0.00" inputMode="decimal" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[9px] uppercase text-text-muted">{t('campFunnel')}</label>
              <select value={campFunnel} onChange={(e) => setCampFunnel(e.target.value as typeof campFunnel)} className="h-8 border border-border-default bg-bg-overlay px-2 text-[11px] text-text-primary">
                {FUNNEL_STAGES.map((fs) => <option key={fs} value={fs}>{fs}</option>)}
              </select>
            </div>
            <Button size="sm" onClick={handleCreateCampaign} disabled={!campName.trim() || createCampaignMutation.isPending}>
              {createCampaignMutation.isPending ? t('creating') : t('create')}
            </Button>
          </div>
        )}

        {(!filteredCampaigns || filteredCampaigns.length === 0) ? (
          <p className="py-4 text-center text-[10px] text-text-muted">{t('noCampaigns')}</p>
        ) : (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {filteredCampaigns.map((camp) => {
              const roi = Number(camp.spend) > 0
                ? Math.round(((Number(camp.revenue) - Number(camp.spend)) / Number(camp.spend)) * 100)
                : 0;
              return (
                <div key={camp.id} className="group border border-border-subtle bg-bg-overlay p-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[11px] font-medium text-text-primary">{camp.name}</span>
                      <div className="mt-0.5 flex gap-2">
                        <span className="text-[9px] uppercase text-accent-cyan">{camp.platform}</span>
                        <span className={`text-[9px] uppercase ${camp.status === 'active' ? 'text-status-success' : camp.status === 'paused' ? 'text-status-warning' : 'text-text-muted'}`}>
                          {camp.status}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => deleteCampaignMutation.mutate({ id: camp.id })}
                      className="text-text-muted opacity-0 hover:text-status-error group-hover:opacity-100"
                    >
                      <Trash2 size={10} />
                    </button>
                  </div>
                  <div className="mt-2 grid grid-cols-4 gap-1">
                    <MiniStat label={t('campImpressions')} value={camp.impressions ?? 0} />
                    <MiniStat label={t('campClicks')} value={camp.clicks ?? 0} />
                    <MiniStat label={t('campConversions')} value={camp.conversions ?? 0} />
                    <MiniStat label="ROI" value={`${roi}%`} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* WhatsApp section */}
      <div className="border border-border-default bg-bg-base p-4">
        <div className="mb-4 flex items-center gap-1.5">
          <MessageCircle size={13} strokeWidth={1.5} className="text-green-400" />
          <span className="text-[10px] font-semibold uppercase tracking-wider text-green-400">
            {t('whatsapp')}
          </span>
        </div>

        <div className="mb-4 grid grid-cols-4 gap-2">
          <MiniStat label={t('totalMessages')} value={waTotal} />
          <MiniStat label={t('inbound')} value={waInbound} />
          <MiniStat label={t('outbound')} value={waOutbound} />
          <MiniStat label={t('uniqueContacts')} value={data.whatsapp.uniqueContacts} />
        </div>

        {data.whatsapp.daily.length > 0 && (
          <div className="mb-4">
            <p className="mb-2 text-[9px] uppercase tracking-wider text-text-muted">{t('dailyVolume')}</p>
            <ResponsiveContainer width="100%" height={140}>
              <BarChart data={data.whatsapp.daily}>
                <CartesianGrid stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
                <XAxis dataKey="day" tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.4)', fontFamily: 'IBM Plex Mono' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.4)', fontFamily: 'IBM Plex Mono' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#0A0E14', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 0, fontFamily: 'IBM Plex Mono', fontSize: 10 }} />
                <Bar dataKey="count" fill="#4ade80" radius={0} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {data.whatsapp.byStatus.length > 0 && (
          <div>
            <p className="mb-2 text-[9px] uppercase tracking-wider text-text-muted">{t('deliveryStatus')}</p>
            <StatusBar
              items={data.whatsapp.byStatus.map((r) => ({
                label: t(r.status as 'sent' | 'delivered' | 'read' | 'pending' | 'failed'),
                count: r.count,
                color: getWaStatusColor(r.status),
              }))}
            />
          </div>
        )}
      </div>

      {/* Email section */}
      <div className="border border-border-default bg-bg-base p-4">
        <div className="mb-4 flex items-center gap-1.5">
          <Mail size={13} strokeWidth={1.5} className="text-accent-cyan" />
          <span className="text-[10px] font-semibold uppercase tracking-wider text-accent-cyan">
            {t('email')}
          </span>
        </div>

        <div className="mb-4 grid grid-cols-3 gap-2">
          <MiniStat label={t('totalMessages')} value={emailTotal} />
          <MiniStat label={t('uniqueRecipients')} value={data.email.uniqueRecipients} />
          <MiniStat label={t('delivered')} value={data.email.byStatus.find((r) => r.status === 'delivered')?.count ?? 0} />
        </div>

        {data.email.daily.length > 0 && (
          <div className="mb-4">
            <p className="mb-2 text-[9px] uppercase tracking-wider text-text-muted">{t('dailyVolume')}</p>
            <ResponsiveContainer width="100%" height={140}>
              <BarChart data={data.email.daily}>
                <CartesianGrid stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
                <XAxis dataKey="day" tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.4)', fontFamily: 'IBM Plex Mono' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.4)', fontFamily: 'IBM Plex Mono' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#0A0E14', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 0, fontFamily: 'IBM Plex Mono', fontSize: 10 }} />
                <Bar dataKey="count" fill="#00C8E0" radius={0} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {data.email.byStatus.length > 0 && (
          <div>
            <p className="mb-2 text-[9px] uppercase tracking-wider text-text-muted">{t('deliveryStatus')}</p>
            <StatusBar
              items={data.email.byStatus.map((r) => ({
                label: t(r.status as 'sent' | 'delivered' | 'pending' | 'bounced' | 'failed'),
                count: r.count,
                color: getEmailStatusColor(r.status),
              }))}
            />
          </div>
        )}
      </div>

      {/* Empty state */}
      {waTotal === 0 && emailTotal === 0 && (!campaigns || campaigns.length === 0) && (
        <p className="py-8 text-center text-[11px] text-text-muted">{t('noData')}</p>
      )}
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="border border-border-subtle bg-bg-overlay p-2">
      <p className="text-[8px] uppercase tracking-wider text-text-muted">{label}</p>
      <p className="mt-0.5 text-sm font-semibold tabular-nums text-text-primary">{value}</p>
    </div>
  );
}

function FunnelBar({ label, value, width, color }: { label: string; value: number; width: string; color: string }) {
  return (
    <div className="flex w-full flex-col items-center" style={{ width }}>
      <div className={`flex w-full items-center justify-between ${color} px-3 py-2`}>
        <span className="text-[10px] font-medium text-bg-base">{label}</span>
        <span className="text-[10px] font-semibold tabular-nums text-bg-base">{value.toLocaleString()}</span>
      </div>
    </div>
  );
}

function StatusBar({ items }: { items: { label: string; count: number; color: string }[] }) {
  const total = items.reduce((s, i) => s + i.count, 0);
  if (total === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex h-2 overflow-hidden">
        {items
          .filter((i) => i.count > 0)
          .map((item) => (
            <div
              key={item.label}
              className={`${item.color} transition-all`}
              style={{ width: `${(item.count / total) * 100}%` }}
            />
          ))}
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-1">
        {items.map((item) => (
          <div key={item.label} className="flex items-center gap-1">
            <div className={`h-1.5 w-1.5 ${item.color}`} />
            <span className="text-[9px] text-text-muted">{item.label}</span>
            <span className="text-[9px] font-medium tabular-nums text-text-secondary">{item.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function getWaStatusColor(status: string): string {
  switch (status) {
    case 'delivered': return 'bg-status-success';
    case 'read': return 'bg-accent-cyan';
    case 'sent': return 'bg-blue-400';
    case 'pending': return 'bg-status-warning';
    case 'failed': return 'bg-status-error';
    default: return 'bg-text-muted';
  }
}

function getEmailStatusColor(status: string): string {
  switch (status) {
    case 'delivered': return 'bg-status-success';
    case 'sent': return 'bg-blue-400';
    case 'pending': return 'bg-status-warning';
    case 'bounced': return 'bg-status-error';
    case 'failed': return 'bg-status-error';
    default: return 'bg-text-muted';
  }
}
