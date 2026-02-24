'use client';

import { useState, useRef, useEffect } from 'react';
import { useLocale } from 'next-intl';
import { useRouter, usePathname } from '@/i18n/navigation';
import { routing, type Locale } from '@/i18n/routing';

const LOCALE_LABELS: Record<Locale, { label: string; flag: string }> = {
  'pt-BR': { label: 'PT-BR', flag: '🇧🇷' },
  'en-US': { label: 'EN-US', flag: '🇺🇸' },
};

export function LocaleSwitcher() {
  const raw = useLocale();
  const locale: Locale = routing.locales.includes(raw as Locale)
    ? (raw as Locale)
    : routing.defaultLocale;
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  function switchLocale(next: Locale) {
    setOpen(false);
    router.replace(pathname, { locale: next });
  }

  const current = LOCALE_LABELS[locale];

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label="Select language"
        className="flex items-center gap-1.5 border border-border-default bg-bg-raised px-2.5 py-1 text-xs text-text-primary hover:border-border-hover transition-colors"
      >
        <span>{current.flag}</span>
        <span>{current.label}</span>
        <svg
          className={`h-3 w-3 text-text-muted transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="square" strokeLinejoin="miter" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div role="listbox" aria-label="Available languages" className="absolute right-0 top-full mt-1 border border-border-default bg-bg-overlay z-50">
          {routing.locales.map((l) => (
            <button
              key={l}
              type="button"
              role="option"
              aria-selected={l === locale}
              onClick={() => switchLocale(l)}
              className={`flex w-full items-center gap-1.5 px-2.5 py-1.5 text-xs transition-colors ${
                l === locale
                  ? 'bg-accent-cyan-dim text-accent-cyan'
                  : 'text-text-primary hover:bg-bg-raised'
              }`}
            >
              <span>{LOCALE_LABELS[l].flag}</span>
              <span>{LOCALE_LABELS[l].label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
