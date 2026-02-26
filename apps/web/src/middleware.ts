import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import createIntlMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

const intlMiddleware = createIntlMiddleware(routing);

const isPublicRoute = createRouteMatcher([
  '/',
  '/:locale',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/:locale/sign-in(.*)',
  '/:locale/sign-up(.*)',
  '/api/webhooks(.*)',
]);

export default clerkMiddleware(async (auth, req) => {
  // Skip intl middleware for API routes — they don't need locale prefixing
  const { pathname } = req.nextUrl;
  if (pathname.startsWith('/api/')) {
    if (!isPublicRoute(req)) {
      await auth.protect();
    }
    return;
  }

  if (!isPublicRoute(req)) {
    await auth.protect();
  }

  // Return the intl middleware response — Clerk decorates it with auth headers
  return intlMiddleware(req);
});

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
