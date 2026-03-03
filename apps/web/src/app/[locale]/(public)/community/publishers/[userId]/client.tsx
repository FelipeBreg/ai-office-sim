'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { trpc } from '@/lib/trpc/client';
import { ListingCard } from '../../_components/listing-card';
import { ArrowLeft, User, Download, Star, Package } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface Profile {
  name: string;
  avatarUrl: string | null;
  listingCount: number;
  totalInstalls: number;
  avgRating: number;
}

interface PublisherProfileClientProps {
  userId: string;
  profile: Profile;
}

export function PublisherProfileClient({ userId, profile }: PublisherProfileClientProps) {
  const t = useTranslations('community');

  const { data, isLoading } = trpc.community.getPublisherListings.useQuery({
    userId,
  });

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

      {/* Profile header */}
      <div className="mb-6 flex items-center gap-4 border border-border-default bg-bg-overlay p-4">
        <div className="flex h-14 w-14 items-center justify-center border border-border-default bg-bg-base">
          {profile.avatarUrl ? (
            <img src={profile.avatarUrl} alt={profile.name} className="h-full w-full object-cover" />
          ) : (
            <User size={24} className="text-text-muted" />
          )}
        </div>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-text-primary">{profile.name}</h1>
          <div className="mt-1 flex items-center gap-4 text-[10px] text-text-muted">
            <span className="flex items-center gap-1">
              <Package size={10} />
              {profile.listingCount} {t('listingsPublished')}
            </span>
            <span className="flex items-center gap-1">
              <Download size={10} />
              {profile.totalInstalls} {t('totalInstalls')}
            </span>
            {profile.avgRating > 0 && (
              <span className="flex items-center gap-1">
                <Star size={10} className="text-[#D29922]" />
                {profile.avgRating.toFixed(1)} {t('avgRating')}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Publisher's listings */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-36" />
          ))}
        </div>
      ) : data && data.items.length > 0 ? (
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
              publisherName={profile.name}
              publishedById={userId}
            />
          ))}
        </div>
      ) : (
        <p className="py-8 text-center text-[10px] text-text-muted">{t('noResults')}</p>
      )}
    </div>
  );
}
