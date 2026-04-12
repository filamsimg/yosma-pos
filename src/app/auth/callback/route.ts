import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Get user role to determine redirect
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        const redirectPath =
          profile?.role === 'ADMIN' ? '/admin' : '/sales';
        const forwardedHost = request.headers.get('x-forwarded-host');
        const isLocalEnv = process.env.NODE_ENV === 'development';

        if (isLocalEnv) {
          return NextResponse.redirect(`${origin}${next === '/' ? redirectPath : next}`);
        } else if (forwardedHost) {
          return NextResponse.redirect(
            `https://${forwardedHost}${next === '/' ? redirectPath : next}`
          );
        } else {
          return NextResponse.redirect(`${origin}${next === '/' ? redirectPath : next}`);
        }
      }
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
