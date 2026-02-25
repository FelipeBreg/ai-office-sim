'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

export interface Strategy {
  id: string;
  type: string;
  userDraft: string | null;
  aiRefined: string | null;
  status: 'planned' | 'active' | 'at_risk' | 'completed';
  startDate: string | Date | null;
  endDate: string | Date | null;
  version: number;
}

interface TimelineProps {
  strategies: Strategy[];
  onSelectStrategy: (id: string) => void;
}

/* -------------------------------------------------------------------------- */
/*  Constants                                                                 */
/* -------------------------------------------------------------------------- */

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const STATUS_COLORS: Record<Strategy['status'], string> = {
  active: '#27AE60',
  at_risk: '#F39C12',
  planned: '#484F58',
  completed: '#00C8E0',
};

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */

function getMonthIndex(date: string | Date): number {
  const d = new Date(date);
  return d.getMonth();
}

function truncate(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen - 1) + '\u2026';
}

/* -------------------------------------------------------------------------- */
/*  Strategy bar                                                              */
/* -------------------------------------------------------------------------- */

function StrategyBar({
  strategy,
  onClick,
}: {
  strategy: Strategy;
  onClick: () => void;
}) {
  if (!strategy.startDate || !strategy.endDate) return null;
  const startMonth = getMonthIndex(strategy.startDate);
  const endMonth = getMonthIndex(strategy.endDate);
  // Guard: skip if end is before start (cross-year edge case)
  if (endMonth < startMonth) return null;
  const startCol = startMonth + 1; // CSS grid is 1-indexed
  const endCol = endMonth + 2; // +2 because grid-column-end is exclusive
  const color = STATUS_COLORS[strategy.status];
  const label = strategy.userDraft || strategy.type || '';

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-1.5 truncate px-2 py-1 text-left text-[10px] font-medium text-text-primary transition-opacity hover:opacity-80"
      style={{
        gridColumnStart: startCol,
        gridColumnEnd: endCol,
        backgroundColor: `${color}20`,
        borderLeft: `2px solid ${color}`,
        minWidth: 0,
      }}
      title={label}
    >
      {/* Status dot */}
      <span
        className="inline-block h-1.5 w-1.5 shrink-0"
        style={{ backgroundColor: color }}
      />
      <span className="truncate">{truncate(label, 24)}</span>
    </button>
  );
}

/* -------------------------------------------------------------------------- */
/*  Timeline component                                                        */
/* -------------------------------------------------------------------------- */

export function Timeline({ strategies, onSelectStrategy }: TimelineProps) {
  const t = useTranslations('strategy');
  const currentMonth = useMemo(() => new Date().getMonth(), []);

  // Filter strategies that have dates for the timeline
  const timelineStrategies = strategies.filter((s) => s.startDate && s.endDate);

  if (timelineStrategies.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center border border-border-default bg-bg-raised">
        <span className="text-xs text-text-muted">{t('noStrategies')}</span>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto border border-border-default bg-bg-raised">
      {/* Grid container */}
      <div
        className="relative min-w-[720px]"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(12, 1fr)',
        }}
      >
        {/* Month headers */}
        {MONTHS.map((month, idx) => (
          <div
            key={month}
            className={`border-b border-r border-border-default px-2 py-1.5 text-center text-[8px] uppercase tracking-[0.1em] ${
              idx === currentMonth ? 'bg-accent-cyan/5 text-accent-cyan' : 'text-text-muted'
            }`}
          >
            {month}
          </div>
        ))}

        {/* Strategy rows */}
        {timelineStrategies.map((strategy) => (
          <StrategyBar
            key={strategy.id}
            strategy={strategy}
            onClick={() => onSelectStrategy(strategy.id)}
          />
        ))}

        {/* TODAY vertical line */}
        <div
          className="pointer-events-none absolute top-0 h-full"
          style={{
            left: `${((currentMonth + 0.5) / 12) * 100}%`,
            width: 1,
            borderLeft: '1px dashed #00C8E0',
            opacity: 0.5,
          }}
        />
      </div>
    </div>
  );
}
