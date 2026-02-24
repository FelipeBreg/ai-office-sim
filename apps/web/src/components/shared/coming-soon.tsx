'use client';

import { useTranslations } from 'next-intl';
import { Construction } from 'lucide-react';

interface ComingSoonProps {
  titleKey: string;
  namespace?: string;
}

export function ComingSoon({ titleKey, namespace = 'nav' }: ComingSoonProps) {
  const t = useTranslations(namespace);
  const tNav = useTranslations('nav');

  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 text-text-muted">
      <Construction size={32} strokeWidth={1} className="text-text-disabled" />
      <h1 className="text-sm font-medium uppercase tracking-wider text-text-secondary">
        {t(titleKey)}
      </h1>
      <p className="text-xs">{tNav('comingSoon')}</p>
    </div>
  );
}
