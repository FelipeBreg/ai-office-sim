import { useTranslations } from 'next-intl';

export default function LocaleNotFound() {
  const t = useTranslations('common');

  return (
    <main className="flex min-h-screen items-center justify-center bg-bg-deepest">
      <div className="text-center">
        <h1 className="text-2xl font-semibold text-accent-cyan">404</h1>
        <p className="mt-2 text-sm text-text-secondary">{t('noResults')}</p>
      </div>
    </main>
  );
}
