'use client';

import { Link } from '@/i18n/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { Bot, GitBranch, Download, Star, CheckCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ListingCardProps {
  slug: string;
  type: string;
  nameEn: string;
  namePtBr: string | null;
  descriptionEn: string;
  descriptionPtBr: string | null;
  category: string;
  icon: string | null;
  installCount: number;
  ratingSum: number;
  ratingCount: number;
  isVerified: boolean;
  publisherName: string | null;
  publishedById: string;
}

export function ListingCard({
  slug,
  type,
  nameEn,
  namePtBr,
  descriptionEn,
  descriptionPtBr,
  category,
  installCount,
  ratingSum,
  ratingCount,
  isVerified,
  publisherName,
  publishedById,
}: ListingCardProps) {
  const t = useTranslations('community');
  const locale = useLocale();
  const avgRating = ratingCount > 0 ? ratingSum / ratingCount : 0;
  const name = locale === 'pt-BR' && namePtBr ? namePtBr : nameEn;
  const description = locale === 'pt-BR' && descriptionPtBr ? descriptionPtBr : descriptionEn;
  const href = type === 'agent' ? `/community/agents/${slug}` : `/community/workflows/${slug}`;

  return (
    <Link
      href={href}
      className="group flex flex-col border border-border-default bg-bg-raised p-4 transition-colors hover:border-accent-cyan/40 hover:bg-bg-overlay"
    >
      {/* Header */}
      <div className="mb-2 flex items-center gap-2">
        {type === 'agent' ? (
          <Bot size={16} strokeWidth={1.5} className="shrink-0 text-accent-cyan" />
        ) : (
          <GitBranch size={16} strokeWidth={1.5} className="shrink-0 text-accent-cyan" />
        )}
        <span className="flex-1 truncate text-sm font-bold text-text-primary group-hover:text-accent-cyan">
          {name}
        </span>
        {isVerified && (
          <CheckCircle size={12} strokeWidth={2} className="shrink-0 text-status-success" />
        )}
      </div>

      {/* Description */}
      <p className="mb-3 line-clamp-2 flex-1 text-[10px] leading-relaxed text-text-secondary">
        {description}
      </p>

      {/* Category badge */}
      <div className="mb-3">
        <Badge variant="default" className="text-[8px]">
          {category}
        </Badge>
      </div>

      {/* Footer: stats */}
      <div className="flex items-center gap-3 text-[9px] text-text-muted">
        <span className="flex items-center gap-1">
          <Download size={10} strokeWidth={1.5} />
          {installCount}
        </span>
        {ratingCount > 0 && (
          <span className="flex items-center gap-1">
            <Star size={10} strokeWidth={1.5} className="text-[#D29922]" />
            {avgRating.toFixed(1)}
            <span className="text-text-disabled">({ratingCount})</span>
          </span>
        )}
        {publisherName && (
          <span className="ml-auto truncate text-text-disabled">
            {publisherName}
          </span>
        )}
      </div>
    </Link>
  );
}
