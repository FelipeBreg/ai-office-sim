'use client';

import { useTranslations } from 'next-intl';

export default function OfficePage() {
  const t = useTranslations('office');

  return (
    <div className="flex h-full items-center justify-center">
      <h1 className="text-sm font-medium uppercase tracking-wider text-text-secondary">
        {t('title')}
      </h1>
    </div>
  );
}
