'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  Plus, X, Trash2, Bot,
  Linkedin, Instagram, Twitter, Facebook, Globe, MapPin, Youtube, Mail,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { trpc } from '@/lib/trpc/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { AgentDrawer } from '@/components/agent-drawer';

const TYPE_ICONS: Record<string, LucideIcon> = {
  linkedin: Linkedin,
  instagram: Instagram,
  twitter: Twitter,
  facebook: Facebook,
  domain: Globe,
  physical: MapPin,
  youtube: Youtube,
  tiktok: Globe, // no native tiktok icon in lucide
  email: Mail,
  other: Globe,
};

const TYPES = [
  'linkedin', 'instagram', 'twitter', 'facebook',
  'domain', 'physical', 'youtube', 'tiktok', 'email', 'other',
] as const;

const STATUSES = ['active', 'inactive', 'planned'] as const;

export function BrandingTab() {
  const t = useTranslations('dashboard');
  const utils = trpc.useUtils();

  const { data, isLoading, error } = trpc.brandTouchpoints.list.useQuery();
  const createMutation = trpc.brandTouchpoints.create.useMutation({
    onSuccess: () => utils.brandTouchpoints.list.invalidate(),
  });
  const deleteMutation = trpc.brandTouchpoints.delete.useMutation({
    onSuccess: () => utils.brandTouchpoints.list.invalidate(),
  });

  const [showForm, setShowForm] = useState(false);
  const [formLabel, setFormLabel] = useState('');
  const [formType, setFormType] = useState<(typeof TYPES)[number]>('other');
  const [formUrl, setFormUrl] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formStatus, setFormStatus] = useState<(typeof STATUSES)[number]>('active');
  const [drawerOpen, setDrawerOpen] = useState(false);

  if (error) {
    return <p className="text-xs text-status-error">{t('loadError')}</p>;
  }

  if (isLoading || !data) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-7 w-40" />
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-20" />
        ))}
      </div>
    );
  }

  function handleCreate() {
    if (!formLabel.trim()) return;
    createMutation.mutate(
      {
        label: formLabel.trim(),
        type: formType,
        url: formUrl.trim() || undefined,
        description: formDesc.trim() || undefined,
        status: formStatus,
      },
      {
        onSuccess: () => {
          setFormLabel('');
          setFormUrl('');
          setFormDesc('');
          setShowForm(false);
        },
      },
    );
  }

  const grouped = data.grouped;
  const typesWithData = Object.keys(grouped).sort();

  return (
    <div className="flex flex-col gap-6">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <p className="text-[11px] text-text-muted">
          {data.items.length > 0
            ? t('touchpointCount', { count: data.items.length })
            : t('noTouchpoints')}
        </p>
        <div className="flex gap-2">
          <Button size="sm" variant="ghost" onClick={() => setDrawerOpen(true)}>
            <Bot size={12} className="mr-1" />
            {t('viewAgents')}
          </Button>
          <Button size="sm" onClick={() => setShowForm(!showForm)}>
            {showForm ? <X size={12} className="mr-1" /> : <Plus size={12} className="mr-1" />}
            {t('addTouchpoint')}
          </Button>
        </div>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="flex flex-wrap items-end gap-2 border border-border-default bg-bg-base p-3">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] uppercase tracking-wider text-text-muted">{t('tpLabel')}</label>
            <Input value={formLabel} onChange={(e) => setFormLabel(e.target.value)} placeholder={t('tpLabelPlaceholder')} className="w-40" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] uppercase tracking-wider text-text-muted">{t('tpType')}</label>
            <select
              value={formType}
              onChange={(e) => setFormType(e.target.value as (typeof TYPES)[number])}
              className="h-8 border border-border-default bg-bg-overlay px-2 text-[11px] text-text-primary"
            >
              {TYPES.map((tp) => (
                <option key={tp} value={tp}>{tp}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] uppercase tracking-wider text-text-muted">{t('tpUrl')}</label>
            <Input value={formUrl} onChange={(e) => setFormUrl(e.target.value)} placeholder="https://..." className="w-48" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] uppercase tracking-wider text-text-muted">{t('tpStatus')}</label>
            <select
              value={formStatus}
              onChange={(e) => setFormStatus(e.target.value as (typeof STATUSES)[number])}
              className="h-8 border border-border-default bg-bg-overlay px-2 text-[11px] text-text-primary"
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <Button size="sm" onClick={handleCreate} disabled={!formLabel.trim() || createMutation.isPending}>
            {createMutation.isPending ? t('creating') : t('create')}
          </Button>
        </div>
      )}

      {/* Grouped touchpoints */}
      {typesWithData.length === 0 && !showForm && (
        <p className="py-8 text-center text-[11px] text-text-muted">{t('noTouchpoints')}</p>
      )}

      {typesWithData.map((type) => {
        const Icon = TYPE_ICONS[type] ?? Globe;
        const items = grouped[type]!;
        return (
          <div key={type} className="border border-border-default bg-bg-base">
            <div className="flex items-center gap-2 border-b border-border-subtle px-4 py-2">
              <Icon size={13} strokeWidth={1.5} className="text-accent-cyan" />
              <span className="text-[10px] font-semibold uppercase tracking-wider text-text-primary">
                {type}
              </span>
              <span className="text-[10px] text-text-muted">({items.length})</span>
            </div>
            <div className="divide-y divide-border-subtle">
              {items.map((tp) => (
                <div key={tp.id} className="group flex items-center justify-between px-4 py-2.5">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[11px] font-medium text-text-primary">{tp.label}</span>
                    {tp.url && (
                      <a
                        href={tp.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[9px] text-accent-cyan hover:underline"
                      >
                        {tp.url}
                      </a>
                    )}
                    {tp.description && (
                      <span className="text-[9px] text-text-muted">{tp.description}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[9px] uppercase ${tp.status === 'active' ? 'text-status-success' : tp.status === 'planned' ? 'text-status-warning' : 'text-text-muted'}`}>
                      {tp.status}
                    </span>
                    <button
                      type="button"
                      onClick={() => deleteMutation.mutate({ id: tp.id })}
                      className="text-text-muted opacity-0 transition-opacity hover:text-status-error group-hover:opacity-100"
                    >
                      <Trash2 size={10} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      <AgentDrawer team="marketing" open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </div>
  );
}
