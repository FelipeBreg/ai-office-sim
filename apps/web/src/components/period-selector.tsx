'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';

const PERIODS = [
  { days: 7, key: 'period7d' },
  { days: 30, key: 'period30d' },
  { days: 90, key: 'period90d' },
] as const;

interface PeriodSelectorProps {
  days: number;
  onChange: (days: number) => void;
}

export function PeriodSelector({ days, onChange }: PeriodSelectorProps) {
  const t = useTranslations('dashboard');

  return (
    <div className="flex gap-1">
      {PERIODS.map((p) => (
        <Button
          key={p.days}
          size="sm"
          variant={days === p.days ? 'primary' : 'ghost'}
          onClick={() => onChange(p.days)}
        >
          {t(p.key)}
        </Button>
      ))}
    </div>
  );
}
