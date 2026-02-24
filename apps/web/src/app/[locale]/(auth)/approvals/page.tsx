'use client';

import { useTranslations } from 'next-intl';

export default function ApprovalsPage() {
  const t = useTranslations('approvals');

  return (
    <div className="flex h-full items-center justify-center">
      <h1 className="text-sm font-medium uppercase tracking-wider text-text-secondary">
        {t('title')}
      </h1>
    </div>
  );
}
