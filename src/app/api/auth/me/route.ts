import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await getCurrentUser();
    return NextResponse.json({ user });
  } catch (error) {
    console.error('[/api/auth/me error]:', error);
    return NextResponse.json({ user: null });
  }
}
