import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // 1. Target the protected dashboard routes
  if (request.nextUrl.pathname.startsWith('/dashboard')) {
    
    // 2. Look for the HTTP-only cookie your Go backend issued during the Discord OAuth flow
    const sessionCookie = request.cookies.get('root_session');

    // 3. If the cookie is missing, immediately redirect them to the login screen
    if (!sessionCookie) {
      const loginUrl = new URL('/login', request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  // 4. If the cookie exists, allow the request to proceed to the dashboard
  return NextResponse.next();
}

// 5. Optimize performance: Only run this middleware on dashboard routes
export const config = {
  matcher: ['/dashboard/:path*'],
};