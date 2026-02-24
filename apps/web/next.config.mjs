import { withSentryConfig } from '@sentry/nextjs';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    '@ai-office/api',
    '@ai-office/db',
    '@ai-office/shared',
    '@ai-office/realtime',
  ],
};

export default withSentryConfig(withNextIntl(nextConfig), {
  // Suppress source map upload logs during build
  silent: true,
  // Upload source maps for better stack traces
  widenClientFileUpload: true,
  // Hide source maps from client bundles
  hideSourceMaps: true,
  // Disable Sentry telemetry
  disableLogger: true,
});
