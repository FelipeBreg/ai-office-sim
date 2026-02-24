import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing';
import { hasLocale } from 'next-intl';

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;

  let messages;
  try {
    messages = (await import(`../../messages/${locale}.json`)).default;
  } catch {
    console.warn(`[next-intl] Missing messages for locale "${locale}", falling back to ${routing.defaultLocale}`);
    messages = (await import(`../../messages/${routing.defaultLocale}.json`)).default;
  }

  return { locale, messages };
});
