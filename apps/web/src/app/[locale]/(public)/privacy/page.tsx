import { useTranslations } from 'next-intl';

export default function PrivacyPolicyPage() {
  const t = useTranslations('privacy');

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="mb-8 text-sm font-semibold uppercase tracking-[0.15em] text-text-primary">
        {t('title')}
      </h1>
      <p className="mb-6 text-[10px] text-text-muted">{t('lastUpdated')}: 2026-03-03</p>

      <div className="space-y-6 text-[11px] leading-relaxed text-text-secondary">
        <section>
          <h2 className="mb-2 text-xs font-medium text-text-primary">{t('section1Title')}</h2>
          <p>{t('section1Body')}</p>
        </section>

        <section>
          <h2 className="mb-2 text-xs font-medium text-text-primary">{t('section2Title')}</h2>
          <p>{t('section2Body')}</p>
        </section>

        <section>
          <h2 className="mb-2 text-xs font-medium text-text-primary">{t('section3Title')}</h2>
          <p>{t('section3Body')}</p>
        </section>

        <section>
          <h2 className="mb-2 text-xs font-medium text-text-primary">{t('section4Title')}</h2>
          <p>{t('section4Body')}</p>
        </section>

        <section>
          <h2 className="mb-2 text-xs font-medium text-text-primary">{t('section5Title')}</h2>
          <p>{t('section5Body')}</p>
        </section>

        <section>
          <h2 className="mb-2 text-xs font-medium text-text-primary">{t('section6Title')}</h2>
          <p>{t('section6Body')}</p>
        </section>

        <section>
          <h2 className="mb-2 text-xs font-medium text-text-primary">{t('section7Title')}</h2>
          <p>{t('section7Body')}</p>
        </section>
      </div>
    </div>
  );
}
