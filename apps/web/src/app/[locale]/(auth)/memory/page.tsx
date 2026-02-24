'use client';

import { useTranslations } from 'next-intl';

export default function MemoryPage() {
  const t = useTranslations('nav');

  return (
    <div className="flex h-full items-center justify-center">
      <h1 className="text-sm font-medium uppercase tracking-wider text-text-secondary">
        {t('memory')}
      </h1>
    </div>
  );
}
