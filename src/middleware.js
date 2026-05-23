// src/middleware.js
import { NextResponse } from 'next/server';

// Public routes accessible without auth
const PUBLIC_ROUTES = [
  '/auth/kirish',
  '/auth/royxat',
  '/auth/parol-tiklash',
];

export function middleware(request) {
  const { pathname } = request.nextUrl;

  // Allow all static files and Next.js internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  // Add security headers to all responses
  const response = NextResponse.next();
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('X-XSS-Protection', '1; mode=block');

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
