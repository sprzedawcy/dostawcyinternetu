import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { routing } from './i18n/routing';

const intlMiddleware = createMiddleware(routing);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Ścieżki które omijają i18n
  const bypassPaths = ['/login', '/admin', '/api', '/_next', '/favicon'];
  const shouldBypass = bypassPaths.some(path => pathname.startsWith(path));

  // Ochrona /admin
  if (pathname.startsWith('/admin')) {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    return NextResponse.next();
  }

  // Bypass dla innych ścieżek systemowych
  if (shouldBypass) {
    return NextResponse.next();
  }

  // Dla reszty - i18n middleware
  return intlMiddleware(request);
}

export const config = {
  matcher: [
    '/((?!_next|.*\\..*).*)',
  ]
};