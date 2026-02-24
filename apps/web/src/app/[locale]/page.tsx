import { useTranslations } from 'next-intl';

export default function Home() {
  const t = useTranslations('common');

  return (
    <main className="flex min-h-screen items-center justify-center bg-bg-deepest">
      <div className="text-center">
        <h1 className="text-2xl font-semibold text-accent-cyan">AI Office Sim</h1>
        <p className="mt-2 text-sm text-text-secondary">{t('foundationReady')}</p>
      </div>
    </main>
  );
}
