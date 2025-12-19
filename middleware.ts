import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { routing } from './i18n/routing';

// Middleware next-intl
const intlMiddleware = createMiddleware(routing);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Ścieżki które omijają i18n (login, admin, api)
  const publicPaths = ['/login', '/admin', '/api'];
  const isPublicPath = publicPaths.some(path => pathname.startsWith(path));

  // 2. Ochrona /admin przed nieautoryzowanym dostępem
  if (pathname.startsWith('/admin')) {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // 3. Dla wszystkich innych ścieżek - użyj next-intl
  if (!isPublicPath) {
    return intlMiddleware(request);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next|.*\\..*).*)',
    '/',
    '/(pl|en|ua)/:path*'
  ]
};
