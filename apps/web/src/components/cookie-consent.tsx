'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';

const COOKIE_CONSENT_KEY = 'ai-office-cookie-consent';

export function CookieConsent() {
  const t = useTranslations('cookieConsent');
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!consent) setVisible(true);
  }, []);

  if (!visible) return null;

  function accept() {
    localStorage.setItem(COOKIE_CONSENT_KEY, 'accepted');
    setVisible(false);
  }

  function decline() {
    localStorage.setItem(COOKIE_CONSENT_KEY, 'declined');
    setVisible(false);
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-border-default bg-bg-deepest px-4 py-3">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
        <p className="text-[10px] leading-relaxed text-text-secondary">
          {t('message')}{' '}
          <Link href="/privacy" className="text-accent-cyan underline">
            {t('privacyLink')}
          </Link>
        </p>
        <div className="flex shrink-0 items-center gap-2">
          <Button size="sm" variant="ghost" onClick={decline}>
            {t('decline')}
          </Button>
          <Button size="sm" variant="primary" onClick={accept}>
            {t('accept')}
          </Button>
        </div>
      </div>
    </div>
  );
}
