import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: DO NOT REMOVE THIS
  // Refreshes the auth token and keeps the session alive
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Define public routes that don't require authentication
  const publicRoutes = ['/login', '/register', '/auth/callback'];
  const isPublicRoute = publicRoutes.some((route) =>
    request.nextUrl.pathname.startsWith(route)
  );

  // If user is not logged in and trying to access protected route
  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // If user is logged in and trying to access auth pages, redirect to dashboard
  if (user && isPublicRoute && request.nextUrl.pathname !== '/auth/callback') {
    const role = user.user_metadata?.role || 'SALES';
    const url = request.nextUrl.clone();
    if (role === 'ADMIN') {
      url.pathname = '/admin';
    } else {
      url.pathname = '/sales';
    }
    return NextResponse.redirect(url);
  }

  // RBAC: Protect admin routes
  if (user && request.nextUrl.pathname.startsWith('/admin')) {
    const role = user.user_metadata?.role;
    if (role !== 'ADMIN') {
      const url = request.nextUrl.clone();
      url.pathname = '/sales';
      return NextResponse.redirect(url);
    }
  }

  // RBAC: Protect sales routes
  if (user && request.nextUrl.pathname.startsWith('/sales')) {
    const role = user.user_metadata?.role;
    if (role !== 'SALES' && role !== 'ADMIN') {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
