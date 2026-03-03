'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Bot, Download, Star, CheckCircle, ArrowLeft, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { InstallButton } from '../../_components/install-button';
import { ReviewSection } from '../../_components/review-section';

interface AgentSnapshot {
  archetype: string;
  tools: string[] | null;
  systemPromptEn: string | null;
  systemPromptPtBr: string | null;
  config: Record<string, unknown> | null;
  triggerType: string;
  triggerConfig: Record<string, unknown> | null;
  team: string | null;
  memoryScope: string;
  maxActionsPerSession: number;
}

interface Listing {
  id: string;
  type: string;
  slug: string;
  nameEn: string;
  namePtBr: string | null;
  descriptionEn: string;
  descriptionPtBr: string | null;
  category: string;
  icon: string | null;
  snapshot: unknown;
  installCount: number;
  ratingSum: number;
  ratingCount: number;
  isVerified: boolean;
  createdAt: Date | string;
  publishedById: string;
  publisherName: string | null;
  publisherAvatar: string | null;
}

export function AgentDetailClient({ listing }: { listing: Listing }) {
  const t = useTranslations('community');
  const snap = listing.snapshot as AgentSnapshot;
  const avgRating = listing.ratingCount > 0 ? listing.ratingSum / listing.ratingCount : 0;
  const createdDate = new Date(listing.createdAt).toLocaleDateString();

  return (
    <div>
      {/* Back link */}
      <Link
        href="/community"
        className="mb-4 inline-flex items-center gap-1 text-[10px] text-text-muted transition-colors hover:text-text-primary"
      >
        <ArrowLeft size={10} />
        {t('title')}
      </Link>

      {/* Header */}
      <div className="mb-6 flex items-start gap-4">
        <div className="flex h-12 w-12 items-center justify-center border border-border-default bg-bg-overlay">
          <Bot size={24} strokeWidth={1.5} className="text-accent-cyan" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-text-primary">{listing.nameEn}</h1>
            {listing.isVerified && (
              <CheckCircle size={14} strokeWidth={2} className="text-status-success" />
            )}
          </div>
          <p className="mt-1 text-xs text-text-secondary">{listing.descriptionEn}</p>
          <div className="mt-2 flex items-center gap-3 text-[10px] text-text-muted">
            <Badge variant="default" className="text-[8px]">{snap.archetype}</Badge>
            <span className="flex items-center gap-1">
              <Download size={10} />
              {listing.installCount} {t('installs', { count: listing.installCount })}
            </span>
            {listing.ratingCount > 0 && (
              <span className="flex items-center gap-1">
                <Star size={10} className="text-[#D29922]" />
                {avgRating.toFixed(1)} ({listing.ratingCount})
              </span>
            )}
          </div>
        </div>
        <InstallButton listingId={listing.id} type="agent" />
      </div>

      {/* Publisher */}
      <div className="mb-6 flex items-center gap-2 border border-border-default bg-bg-overlay p-3">
        <User size={14} className="text-text-muted" />
        <div className="flex-1">
          <Link
            href={`/community/publishers/${listing.publishedById}`}
            className="text-xs font-bold text-text-primary hover:text-accent-cyan"
          >
            {listing.publisherName ?? 'Unknown'}
          </Link>
          <span className="ml-2 text-[9px] text-text-muted">{t('publishedOn')} {createdDate}</span>
        </div>
      </div>

      {/* Details grid */}
      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {/* Tools */}
        {snap.tools && snap.tools.length > 0 && (
          <div className="border border-border-default bg-bg-overlay p-3">
            <h3 className="mb-2 text-[10px] font-bold uppercase tracking-wider text-text-muted">{t('tools')}</h3>
            <div className="flex flex-wrap gap-1">
              {snap.tools.map((tool) => (
                <Badge key={tool} variant="default" className="text-[8px]">{tool}</Badge>
              ))}
            </div>
          </div>
        )}

        {/* Config */}
        {snap.config && (
          <div className="border border-border-default bg-bg-overlay p-3">
            <h3 className="mb-2 text-[10px] font-bold uppercase tracking-wider text-text-muted">{t('configuration')}</h3>
            <div className="space-y-1 text-[10px] text-text-secondary">
              {Object.entries(snap.config).map(([key, value]) => (
                <div key={key}>
                  <span className="text-text-muted">{key}:</span> {String(value)}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Trigger */}
        <div className="border border-border-default bg-bg-overlay p-3">
          <h3 className="mb-2 text-[10px] font-bold uppercase tracking-wider text-text-muted">{t('triggerType')}</h3>
          <span className="text-xs text-text-secondary">{snap.triggerType}</span>
        </div>
      </div>

      {/* System Prompt Preview */}
      {snap.systemPromptEn && (
        <div className="mb-6 border border-border-default bg-bg-overlay p-3">
          <h3 className="mb-2 text-[10px] font-bold uppercase tracking-wider text-text-muted">{t('systemPrompt')}</h3>
          <p className="whitespace-pre-wrap text-[10px] leading-relaxed text-text-secondary">
            {snap.systemPromptEn.slice(0, 500)}
            {snap.systemPromptEn.length > 500 && '...'}
          </p>
        </div>
      )}

      {/* Reviews */}
      <ReviewSection listingId={listing.id} />
    </div>
  );
}
