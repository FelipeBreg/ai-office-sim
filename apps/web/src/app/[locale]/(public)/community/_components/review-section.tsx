'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useUser } from '@clerk/nextjs';
import { trpc } from '@/lib/trpc/client';
import { Button } from '@/components/ui/button';
import { Star, Trash2, User } from 'lucide-react';

interface ReviewSectionProps {
  listingId: string;
}

export function ReviewSection({ listingId }: ReviewSectionProps) {
  const t = useTranslations('community');
  const { isSignedIn } = useUser();
  const utils = trpc.useUtils();

  // Get internal DB user ID (maps Clerk → DB) — only when signed in
  const { data: currentUser } = trpc.users.getCurrent.useQuery(undefined, {
    enabled: !!isSignedIn,
  });

  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');

  const { data: reviewsData } = trpc.community.listReviews.useQuery({
    listingId,
    limit: 20,
  });

  const submitMutation = trpc.community.submitReview.useMutation({
    onSuccess: () => {
      setRating(0);
      setComment('');
      void utils.community.listReviews.invalidate({ listingId });
      void utils.community.getBySlug.invalidate();
    },
  });

  const deleteMutation = trpc.community.deleteReview.useMutation({
    onSuccess: () => {
      void utils.community.listReviews.invalidate({ listingId });
      void utils.community.getBySlug.invalidate();
    },
  });

  return (
    <div className="border-t border-border-default pt-6">
      <h3 className="mb-4 text-sm font-bold text-text-primary">{t('reviews')}</h3>

      {/* Review form */}
      {isSignedIn && (
        <div className="mb-6 border border-border-default bg-bg-overlay p-3">
          <h4 className="mb-2 text-[10px] font-bold uppercase tracking-wider text-text-muted">
            {t('writeReview')}
          </h4>

          {/* Star picker */}
          <div className="mb-3 flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                onClick={() => setRating(star)}
                className="transition-colors"
              >
                <Star
                  size={16}
                  strokeWidth={1.5}
                  className={
                    star <= (hoverRating || rating)
                      ? 'fill-[#D29922] text-[#D29922]'
                      : 'text-text-disabled'
                  }
                />
              </button>
            ))}
            {rating > 0 && (
              <span className="ml-2 text-[10px] text-text-muted">{rating}/5</span>
            )}
          </div>

          {/* Comment */}
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value.slice(0, 1000))}
            placeholder={t('comment')}
            rows={3}
            className="mb-3 w-full border border-border-default bg-bg-base px-2 py-1.5 text-[10px] text-text-primary outline-none placeholder:text-text-disabled"
          />

          {submitMutation.isSuccess && (
            <div className="mb-2 text-[10px] text-status-success">{t('reviewSubmitted')}</div>
          )}

          <Button
            variant="primary"
            size="sm"
            onClick={() => submitMutation.mutate({ listingId, rating, comment: comment || undefined })}
            disabled={rating === 0 || submitMutation.isPending}
          >
            {submitMutation.isPending ? t('submittingReview') : t('submitReview')}
          </Button>
        </div>
      )}

      {/* Review list */}
      {reviewsData && reviewsData.items.length > 0 ? (
        <div className="space-y-3">
          {reviewsData.items.map((review) => (
            <div key={review.id} className="border border-border-default bg-bg-overlay p-3">
              <div className="mb-1 flex items-center gap-2">
                <User size={12} className="text-text-muted" />
                <span className="text-[10px] font-bold text-text-primary">
                  {review.userName ?? 'Anonymous'}
                </span>
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      size={10}
                      strokeWidth={1.5}
                      className={
                        star <= review.rating
                          ? 'fill-[#D29922] text-[#D29922]'
                          : 'text-text-disabled'
                      }
                    />
                  ))}
                </div>
                <span className="text-[8px] text-text-disabled">
                  {new Date(review.createdAt).toLocaleDateString()}
                </span>
                {currentUser && review.userId === currentUser.id && (
                  <button
                    onClick={() => deleteMutation.mutate({ reviewId: review.id })}
                    className="ml-auto text-text-muted transition-colors hover:text-status-error"
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 size={10} />
                  </button>
                )}
              </div>
              {review.comment && (
                <p className="text-[10px] leading-relaxed text-text-secondary">{review.comment}</p>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-[10px] text-text-muted">{t('noReviews')}</p>
      )}
    </div>
  );
}
