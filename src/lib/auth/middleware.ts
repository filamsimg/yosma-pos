import { NextResponse, type NextRequest } from 'next/server';
import { verifySessionToken } from './jwt';
import { SESSION_COOKIE_NAME } from './session';

export async function updateSession(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = token ? await verifySessionToken(token) : null;

  const { pathname } = request.nextUrl;

  // Define public routes that don't require authentication
  const publicRoutes = ['/login', '/register', '/api/auth'];
  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route));

  // If user is not logged in and trying to access protected route
  if (!session && !isPublicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // If user is logged in and trying to access auth pages (/login or /register), redirect to their dashboard
  if (session && isPublicRoute && !pathname.startsWith('/api')) {
    const url = request.nextUrl.clone();
    if (session.role === 'ADMIN') {
      url.pathname = '/admin';
    } else {
      url.pathname = '/sales';
    }
    return NextResponse.redirect(url);
  }

  // RBAC: Protect admin routes
  if (session && pathname.startsWith('/admin')) {
    if (session.role !== 'ADMIN') {
      const url = request.nextUrl.clone();
      url.pathname = '/sales';
      return NextResponse.redirect(url);
    }
  }

  // RBAC: Protect sales routes
  if (session && pathname.startsWith('/sales')) {
    if (session.role !== 'SALES' && session.role !== 'ADMIN') {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}
