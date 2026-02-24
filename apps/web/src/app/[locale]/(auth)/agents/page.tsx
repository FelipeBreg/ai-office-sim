'use client';

import { useTranslations } from 'next-intl';

export default function AgentsPage() {
  const t = useTranslations('agents');

  return (
    <div className="flex h-full items-center justify-center">
      <h1 className="text-sm font-medium uppercase tracking-wider text-text-secondary">
        {t('title')}
      </h1>
    </div>
  );
}
