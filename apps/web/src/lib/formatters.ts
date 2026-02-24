import type { Locale } from '@/i18n/routing';

/**
 * Format a date according to locale conventions.
 * PT-BR: dd/MM/yyyy  |  EN-US: MM/dd/yyyy
 */
export function formatDate(date: Date | string, locale: Locale): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(d);
}

/**
 * Format a date with time.
 * PT-BR: dd/MM/yyyy HH:mm  |  EN-US: MM/dd/yyyy h:mm a
 */
export function formatDateTime(date: Date | string, locale: Locale): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

/**
 * Format currency according to locale.
 * PT-BR: R$ 1.234,56  |  EN-US: $1,234.56
 */
export function formatCurrency(
  amount: number,
  currency: 'BRL' | 'USD',
  locale: Locale,
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format a number according to locale conventions.
 * PT-BR: 1.234,56  |  EN-US: 1,234.56
 */
export function formatNumber(
  n: number,
  locale: Locale,
  options?: Intl.NumberFormatOptions,
): string {
  return new Intl.NumberFormat(locale, options).format(n);
}

const RELATIVE_TIME_UNITS: Array<{
  unit: Intl.RelativeTimeFormatUnit;
  seconds: number;
}> = [
  { unit: 'year', seconds: 31_536_000 },
  { unit: 'month', seconds: 2_592_000 },
  { unit: 'week', seconds: 604_800 },
  { unit: 'day', seconds: 86_400 },
  { unit: 'hour', seconds: 3_600 },
  { unit: 'minute', seconds: 60 },
  { unit: 'second', seconds: 1 },
];

/**
 * Format a relative time string (e.g., "2 hours ago", "há 2 horas").
 */
export function formatRelativeTime(date: Date | string, locale: Locale): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const diffSeconds = Math.round((d.getTime() - Date.now()) / 1000);

  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });

  for (const { unit, seconds } of RELATIVE_TIME_UNITS) {
    if (Math.abs(diffSeconds) >= seconds) {
      const value = Math.round(diffSeconds / seconds);
      return rtf.format(value, unit);
    }
  }

  return rtf.format(0, 'second');
}
