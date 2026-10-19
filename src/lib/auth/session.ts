import { cookies } from 'next/headers';
import { verifySessionToken, type SessionPayload } from './jwt';
import { sql } from '@/lib/db';
import type { Profile } from '@/types';

export const SESSION_COOKIE_NAME = 'yosma_session';

/**
 * Set HTTP-only session cookie (7 days expiry)
 */
export async function setSessionCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

/**
 * Remove session cookie (logout)
 */
export async function deleteSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

/**
 * Read session cookie and verify token
 */
export async function getCurrentSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

/**
 * Get full user profile from database based on current session
 */
export async function getCurrentUser(): Promise<Profile | null> {
  const session = await getCurrentSession();
  if (!session?.id) return null;

  try {
    const rows = await sql`
      SELECT 
        id, email, full_name, role, avatar_url, phone, nik, npwp, is_active, created_at, updated_at
      FROM public.profiles
      WHERE id = ${session.id} AND is_active = true
      LIMIT 1;
    `;

    if (!rows || rows.length === 0) return null;
    return rows[0] as unknown as Profile;
  } catch (error) {
    console.error('[getCurrentUser] Database query error:', error);
    return null;
  }
}

/**
 * Ensure user is authenticated, otherwise throws or returns null
 */
export async function requireAuth(requiredRole?: 'ADMIN' | 'SALES'): Promise<Profile> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('Unauthorized');
  }

  if (requiredRole && user.role !== requiredRole && user.role !== 'ADMIN') {
    throw new Error('Forbidden: Insufficient permissions');
  }

  return user;
}
