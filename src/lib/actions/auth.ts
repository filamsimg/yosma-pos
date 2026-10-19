'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { sql } from '@/lib/db';
import { hashPassword, verifyPassword } from '@/lib/auth/password';
import { signSessionToken } from '@/lib/auth/jwt';
import {
  setSessionCookie,
  deleteSessionCookie,
  getCurrentUser,
  getCurrentSession,
} from '@/lib/auth/session';
import type { Profile } from '@/types';

export async function login(formData: FormData) {
  const email = (formData.get('email') as string)?.trim().toLowerCase();
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { error: 'Email dan password harus diisi.' };
  }

  try {
    const rows = await sql`
      SELECT id, email, password_hash, full_name, role, is_active
      FROM public.profiles
      WHERE LOWER(email) = LOWER(${email})
      LIMIT 1;
    `;

    if (!rows || rows.length === 0) {
      return { error: 'Email atau password salah.' };
    }

    const user = rows[0] as {
      id: string;
      email: string;
      password_hash: string | null;
      full_name: string;
      role: 'ADMIN' | 'SALES';
      is_active: boolean;
    };

    if (!user.is_active) {
      return { error: 'Akun Anda dinonaktifkan. Silakan hubungi Administrator.' };
    }

    if (!user.password_hash) {
      return { error: 'Akun ini belum memiliki password. Silakan hubungi Administrator.' };
    }

    const isValid = await verifyPassword(password, user.password_hash);
    if (!isValid) {
      return { error: 'Email atau password salah.' };
    }

    // Buat JWT Token dan simpan di HTTP-only cookie
    const token = await signSessionToken({
      id: user.id,
      email: user.email,
      role: user.role,
      full_name: user.full_name,
    });

    await setSessionCookie(token);
    revalidatePath('/', 'layout');

    if (user.role === 'ADMIN') {
      redirect('/admin');
    } else {
      redirect('/sales');
    }
  } catch (err: any) {
    if (err?.message === 'NEXT_REDIRECT') throw err; // Biarkan redirect Next.js berjalan
    console.error('[login error]:', err);
    return { error: err.message || 'Terjadi kesalahan pada server saat login.' };
  }
}

export async function register(formData: FormData) {
  const email = (formData.get('email') as string)?.trim().toLowerCase();
  const password = formData.get('password') as string;
  const fullName = (formData.get('full_name') as string)?.trim();
  const role = ((formData.get('role') as string) || 'SALES') as 'ADMIN' | 'SALES';
  const inviteCode = (formData.get('invite_code') as string)?.trim();

  if (!email || !password || !fullName || !inviteCode) {
    return { error: 'Semua field harus diisi termasuk Kode Akses.' };
  }

  // Verifikasi Kode Akses
  const expectedAdminCode = process.env.ADMIN_INVITE_CODE;
  const expectedSalesCode = process.env.SALES_INVITE_CODE;

  if (role === 'ADMIN' && inviteCode !== expectedAdminCode) {
    return { error: 'Kode Akses Admin salah atau tidak valid.' };
  }
  if (role === 'SALES' && inviteCode !== expectedSalesCode) {
    return { error: 'Kode Akses Sales salah atau tidak valid.' };
  }

  if (password.length < 6) {
    return { error: 'Password minimal 6 karakter.' };
  }

  try {
    // Cek apakah email sudah terdaftar
    const existing = await sql`
      SELECT id FROM public.profiles WHERE LOWER(email) = LOWER(${email}) LIMIT 1;
    `;

    if (existing && existing.length > 0) {
      return { error: 'Email sudah terdaftar.' };
    }

    const hashedPassword = await hashPassword(password);

    const inserted = await sql`
      INSERT INTO public.profiles (email, password_hash, full_name, role)
      VALUES (${email}, ${hashedPassword}, ${fullName}, ${role})
      RETURNING id, email, full_name, role;
    `;

    const newUser = inserted[0] as {
      id: string;
      email: string;
      full_name: string;
      role: 'ADMIN' | 'SALES';
    };

    const token = await signSessionToken({
      id: newUser.id,
      email: newUser.email,
      role: newUser.role,
      full_name: newUser.full_name,
    });

    await setSessionCookie(token);
    revalidatePath('/', 'layout');

    if (role === 'ADMIN') {
      redirect('/admin');
    } else {
      redirect('/sales');
    }
  } catch (err: any) {
    if (err?.message === 'NEXT_REDIRECT') throw err;
    console.error('[register error]:', err);
    return { error: err.message || 'Registrasi gagal. Silakan coba beberapa saat lagi.' };
  }
}

export async function logout() {
  await deleteSessionCookie();
  revalidatePath('/', 'layout');
  redirect('/login');
}

export async function getSession(): Promise<Profile | null> {
  return getCurrentUser();
}

export async function updateMyPassword(currentPassword: string, newPassword: string) {
  const session = await getCurrentSession();
  if (!session?.id) {
    return { error: 'Sesi tidak valid atau telah berakhir.' };
  }

  if (!newPassword || newPassword.length < 6) {
    return { error: 'Password baru minimal 6 karakter.' };
  }

  try {
    const rows = await sql`
      SELECT id, password_hash FROM public.profiles WHERE id = ${session.id} LIMIT 1;
    `;

    if (!rows || rows.length === 0) {
      return { error: 'Pengguna tidak ditemukan.' };
    }

    const user = rows[0] as { id: string; password_hash: string | null };
    if (!user.password_hash) {
      return { error: 'Password pengguna belum diatur.' };
    }

    const isValid = await verifyPassword(currentPassword, user.password_hash);
    if (!isValid) {
      return { error: 'Password saat ini yang Anda masukkan salah.' };
    }

    const newHashedPassword = await hashPassword(newPassword);

    await sql`
      UPDATE public.profiles
      SET password_hash = ${newHashedPassword}, updated_at = NOW()
      WHERE id = ${session.id};
    `;

    return { success: true };
  } catch (err: any) {
    console.error('[updateMyPassword error]:', err);
    return { error: err.message || 'Gagal memperbarui password.' };
  }
}
