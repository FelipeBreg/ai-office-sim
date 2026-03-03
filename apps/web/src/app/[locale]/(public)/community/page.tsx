'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { trpc } from '@/lib/trpc/client';
import { ListingCard } from './_components/listing-card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';

type ListingType = 'agent' | 'workflow';
type SortMode = 'newest' | 'popular' | 'rating';

export default function CommunityPage() {
  const t = useTranslations('community');
  const [activeTab, setActiveTab] = useState<ListingType>('agent');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortMode>('newest');
  const [category, setCategory] = useState<string>('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = trpc.community.list.useQuery({
    type: activeTab,
    search: search || undefined,
    sort,
    category: category || undefined,
    page,
    limit: 20,
  });

  const tabs: { id: ListingType; label: string }[] = [
    { id: 'agent', label: t('agents') },
    { id: 'workflow', label: t('workflows') },
  ];

  const sortOptions: { id: SortMode; label: string }[] = [
    { id: 'newest', label: t('sortNewest') },
    { id: 'popular', label: t('sortPopular') },
    { id: 'rating', label: t('sortRating') },
  ];

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-lg font-bold text-text-primary">{t('title')}</h1>
        <p className="text-xs text-text-secondary">{t('subtitle')}</p>
      </div>

      {/* Tabs */}
      <div className="mb-4 flex items-center gap-0 border-b border-border-default">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); setPage(1); }}
            className={`px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors ${
              activeTab === tab.id
                ? 'border-b-2 border-accent-cyan text-accent-cyan'
                : 'text-text-muted hover:text-text-secondary'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filters row */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative flex-1">
          <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-text-muted" />
          <Input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder={t('search')}
            className="pl-7 text-xs"
          />
        </div>
        <select
          value={sort}
          onChange={(e) => { setSort(e.target.value as SortMode); setPage(1); }}
          className="border border-border-default bg-bg-base px-2 py-1.5 text-[10px] text-text-primary outline-none"
        >
          {sortOptions.map((opt) => (
            <option key={opt.id} value={opt.id}>{opt.label}</option>
          ))}
        </select>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-36" />
          ))}
        </div>
      ) : data && data.items.length > 0 ? (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {data.items.map((item) => (
              <ListingCard
                key={item.id}
                slug={item.slug}
                type={item.type}
                nameEn={item.nameEn}
                namePtBr={item.namePtBr}
                descriptionEn={item.descriptionEn}
                descriptionPtBr={item.descriptionPtBr}
                category={item.category}
                icon={item.icon}
                installCount={item.installCount}
                ratingSum={item.ratingSum}
                ratingCount={item.ratingCount}
                isVerified={item.isVerified}
                publisherName={item.publisherName}
                publishedById={item.publishedById}
              />
            ))}
          </div>

          {/* Pagination */}
          {data.totalPages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-3">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
              >
                <ChevronLeft size={12} />
              </Button>
              <span className="text-[10px] text-text-muted">
                {page} / {data.totalPages}
              </span>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                disabled={page >= data.totalPages}
              >
                <ChevronRight size={12} />
              </Button>
            </div>
          )}
        </>
      ) : (
        <div className="py-12 text-center">
          <p className="text-sm text-text-muted">{t('noResults')}</p>
          <p className="text-[10px] text-text-disabled">{t('noResultsDesc')}</p>
        </div>
      )}
    </div>
  );
}
