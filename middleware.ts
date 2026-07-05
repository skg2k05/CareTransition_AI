import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Public routes that don't need auth
  const publicRoutes = ['/auth/login', '/auth/verify', '/api/auth/send-otp', '/api/auth/verify-otp'];
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));
  
  // API routes (handled separately)
  const isApiRoute = pathname.startsWith('/api');
  
  // Check for auth token in cookies or headers
  const authToken = request.cookies.get('caretransition_auth')?.value;
  
  // If no auth and trying to access protected route, redirect to login
  if (!isPublicRoute && !isApiRoute && !authToken) {
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }
  
  // If authenticated and trying to access login, redirect to dashboard
  if (authToken && (pathname === '/auth/login' || pathname === '/auth/verify' || pathname === '/')) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};