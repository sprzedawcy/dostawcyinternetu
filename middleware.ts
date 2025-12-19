import createMiddleware from 'next-intl/middleware';
import {routing} from './i18n/routing';

export default createMiddleware(routing);

export const config = {
  // To sprawia, że middleware działa na wszystkich stronach poza plikami systemowymi
  matcher: ['/', '/(pl|en|ua)/:path*', '/((?!_next|_vercel|.*\\..*).*)']
};