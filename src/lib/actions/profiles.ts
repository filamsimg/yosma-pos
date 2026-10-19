'use server';

import { sql } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth/session';
import { hashPassword } from '@/lib/auth/password';
import type { Profile } from '@/types';
import { revalidatePath } from 'next/cache';

export async function getSalesProfiles(): Promise<Profile[]> {
  try {
    const rows = await sql`
      SELECT id, email, full_name, role, avatar_url, phone, nik, npwp, is_active, created_at, updated_at
      FROM public.profiles
      WHERE role IN ('SALES', 'ADMIN') AND is_active = true
      ORDER BY full_name ASC;
    `;
    return rows as unknown as Profile[];
  } catch (error) {
    console.error('Error fetching sales profiles:', error);
    return [];
  }
}

export async function getPaginatedProfiles(
  page = 1,
  pageSize = 10,
  search = '',
  filters?: { role?: string[]; is_active?: boolean },
  orderBy: string = 'created_at',
  orderDir: 'asc' | 'desc' = 'desc'
) {
  try {
    const offset = (page - 1) * pageSize;
    const searchPattern = search.trim() ? `%${search.trim().toLowerCase()}%` : null;
    const roleFilter = filters?.role && filters.role.length > 0 ? filters.role : null;
    const isActiveFilter = filters?.is_active !== undefined ? filters.is_active : null;

    const countRows = await sql`
      SELECT COUNT(*)::int as total
      FROM public.profiles
      WHERE 
        (${searchPattern}::text IS NULL OR (
          LOWER(full_name) LIKE ${searchPattern} 
          OR LOWER(COALESCE(email, '')) LIKE ${searchPattern} 
          OR LOWER(COALESCE(nik, '')) LIKE ${searchPattern}
        ))
        AND (${roleFilter}::text[] IS NULL OR role::text = ANY(${roleFilter}))
        AND (${isActiveFilter}::boolean IS NULL OR is_active = ${isActiveFilter});
    `;

    const total = countRows[0]?.total || 0;

    const data = await sql`
      SELECT id, email, full_name, role, avatar_url, phone, nik, npwp, is_active, created_at, updated_at
      FROM public.profiles
      WHERE 
        (${searchPattern}::text IS NULL OR (
          LOWER(full_name) LIKE ${searchPattern} 
          OR LOWER(COALESCE(email, '')) LIKE ${searchPattern} 
          OR LOWER(COALESCE(nik, '')) LIKE ${searchPattern}
        ))
        AND (${roleFilter}::text[] IS NULL OR role::text = ANY(${roleFilter}))
        AND (${isActiveFilter}::boolean IS NULL OR is_active = ${isActiveFilter})
      ORDER BY created_at DESC
      LIMIT ${pageSize} OFFSET ${offset};
    `;

    return {
      data: data as unknown as Profile[],
      count: total,
      totalPages: Math.ceil(total / pageSize),
    };
  } catch (error: any) {
    console.error('Error in getPaginatedProfiles:', error);
    return { data: null, error: error.message, count: 0, totalPages: 0 };
  }
}

export async function updateProfile(id: string, values: Partial<Profile>) {
  try {
    await sql`
      UPDATE public.profiles
      SET
        full_name = COALESCE(${values.full_name ?? null}, full_name),
        role = COALESCE(${values.role ?? null}::user_role, role),
        nik = ${values.nik ?? null},
        npwp = ${values.npwp ?? null},
        phone = ${values.phone ?? null},
        is_active = COALESCE(${values.is_active ?? null}, is_active),
        updated_at = NOW()
      WHERE id = ${id};
    `;

    revalidatePath('/admin/profiles');
    revalidatePath('/admin/outlets');
    return { success: true };
  } catch (error: any) {
    console.error('Error updating profile:', error);
    return { error: error.message };
  }
}

export async function updateMyProfile(values: { full_name: string; phone?: string }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { error: 'Tidak diizinkan karena sesi berakhir' };
    }

    await sql`
      UPDATE public.profiles
      SET
        full_name = ${values.full_name},
        phone = ${values.phone || null},
        updated_at = NOW()
      WHERE id = ${user.id};
    `;

    revalidatePath('/admin/profile');
    revalidatePath('/sales/profile');
    return { success: true };
  } catch (error: any) {
    console.error('Error updating my profile:', error);
    return { error: error.message };
  }
}

export async function adminResetPassword(profileId: string) {
  try {
    const defaultPassword = process.env.DEFAULT_RESET_PASSWORD || 'yosma123';
    const hash = await hashPassword(defaultPassword);

    await sql`
      UPDATE public.profiles
      SET password_hash = ${hash}, updated_at = NOW()
      WHERE id = ${profileId};
    `;

    return { success: true, defaultPassword };
  } catch (error: any) {
    console.error('Error resetting password:', error);
    return { error: error.message };
  }
}
