'use client';

import { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { trpc } from '@/lib/trpc/client';
import { Button } from '@/components/ui/button';
import {
  MessageSquarePlus,
  X,
  Bug,
  Lightbulb,
  HelpCircle,
  Heart,
  CheckCircle,
} from 'lucide-react';

type FeedbackCategory = 'bug' | 'feature' | 'confusion' | 'praise';

const CATEGORIES: { key: FeedbackCategory; icon: typeof Bug }[] = [
  { key: 'bug', icon: Bug },
  { key: 'feature', icon: Lightbulb },
  { key: 'confusion', icon: HelpCircle },
  { key: 'praise', icon: Heart },
];

export function FeedbackWidget() {
  const t = useTranslations('feedback');
  const [isOpen, setIsOpen] = useState(false);
  const [rating, setRating] = useState<number>(0);
  const [category, setCategory] = useState<FeedbackCategory | null>(null);
  const [description, setDescription] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  const submitMutation = trpc.feedback.submit.useMutation({
    onSuccess: () => {
      setShowSuccess(true);
      setTimeout(() => {
        resetForm();
        setIsOpen(false);
        setShowSuccess(false);
      }, 2000);
    },
  });

  const resetForm = useCallback(() => {
    setRating(0);
    setCategory(null);
    setDescription('');
  }, []);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    resetForm();
    setShowSuccess(false);
  }, [resetForm]);

  const handleSubmit = useCallback(() => {
    if (!rating || !category || !description.trim()) return;
    submitMutation.mutate({
      rating,
      category,
      description: description.trim(),
    });
  }, [rating, category, description, submitMutation]);

  const canSubmit = rating > 0 && category !== null && description.trim().length > 0;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Feedback Panel */}
      <div
        className={`absolute bottom-10 right-0 w-[300px] border border-border-default bg-bg-raised transition-all duration-200 origin-bottom-right ${
          isOpen
            ? 'scale-100 opacity-100 pointer-events-auto'
            : 'scale-95 opacity-0 pointer-events-none'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border-default px-3 py-2">
          <span className="text-xs font-medium tracking-wide text-text-primary">
            {t('title')}
          </span>
          <button
            onClick={handleClose}
            className="text-text-muted hover:text-text-primary transition-colors"
          >
            <X size={14} />
          </button>
        </div>

        {showSuccess ? (
          /* Success State */
          <div className="flex flex-col items-center justify-center gap-2 px-3 py-8">
            <CheckCircle size={24} className="text-accent-cyan" />
            <span className="text-xs text-text-primary">{t('successMessage')}</span>
          </div>
        ) : (
          /* Form */
          <div className="flex flex-col gap-3 px-3 py-3">
            {/* Rating */}
            <div>
              <label className="mb-1.5 block text-[11px] text-text-secondary">
                {t('ratingLabel')}
              </label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    onClick={() => setRating(n)}
                    className={`h-7 w-7 border transition-colors text-[11px] font-medium ${
                      rating >= n
                        ? 'border-accent-cyan bg-accent-cyan text-bg-deepest'
                        : 'border-border-default bg-bg-base text-text-muted hover:border-border-hover'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            {/* Category */}
            <div>
              <label className="mb-1.5 block text-[11px] text-text-secondary">
                {t('categoryLabel')}
              </label>
              <div className="grid grid-cols-2 gap-1">
                {CATEGORIES.map(({ key, icon: Icon }) => (
                  <button
                    key={key}
                    onClick={() => setCategory(key)}
                    className={`flex items-center gap-1.5 border px-2 py-1.5 text-[11px] transition-colors ${
                      category === key
                        ? 'border-accent-cyan bg-accent-cyan/10 text-accent-cyan'
                        : 'border-border-default bg-bg-base text-text-muted hover:border-border-hover hover:text-text-secondary'
                    }`}
                  >
                    <Icon size={12} />
                    {t(`category_${key}`)}
                  </button>
                ))}
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="mb-1.5 block text-[11px] text-text-secondary">
                {t('descriptionLabel')}
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t('descriptionPlaceholder')}
                rows={3}
                className="w-full resize-none border border-border-default bg-bg-base px-2 py-1.5 text-[11px] text-text-primary placeholder:text-text-muted focus:border-accent-cyan focus:outline-none"
              />
            </div>

            {/* Submit */}
            <Button
              variant="primary"
              size="sm"
              onClick={handleSubmit}
              disabled={!canSubmit || submitMutation.isPending}
              className="w-full"
            >
              {submitMutation.isPending ? t('submitting') : t('submit')}
            </Button>

            {submitMutation.isError && (
              <p className="text-[10px] text-status-error">{t('errorMessage')}</p>
            )}
          </div>
        )}
      </div>

      {/* Floating Button */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className={`flex h-8 w-8 items-center justify-center border transition-colors ${
          isOpen
            ? 'border-accent-cyan bg-accent-cyan text-bg-deepest'
            : 'border-border-default bg-bg-raised text-text-secondary hover:border-border-hover hover:text-accent-cyan'
        }`}
        title={t('title')}
      >
        <MessageSquarePlus size={16} />
      </button>
    </div>
  );
}
