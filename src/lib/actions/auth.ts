'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export async function login(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { error: 'Email dan password harus diisi.' };
  }

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: 'Email atau password salah.' };
  }

  // Get user role for redirect
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Gagal mengambil data user.' };
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  revalidatePath('/', 'layout');

  if (profile?.role === 'ADMIN') {
    redirect('/admin');
  } else {
    redirect('/sales');
  }
}

export async function register(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const fullName = formData.get('full_name') as string;
  const role = (formData.get('role') as string) || 'SALES';
  const inviteCode = formData.get('invite_code') as string;

  if (!email || !password || !fullName || !inviteCode) {
    return { error: 'Semua field harus diisi termasuk Kode Akses.' };
  }

  // Verify Invite Code
  const expectedAdminCode = process.env.ADMIN_INVITE_CODE || 'YOSMA-ADMIN-2026';
  const expectedSalesCode = process.env.SALES_INVITE_CODE || 'YOSMA-SALES-2026';

  if (role === 'ADMIN' && inviteCode !== expectedAdminCode) {
    return { error: 'Kode Akses Admin salah atau tidak valid.' };
  }
  if (role === 'SALES' && inviteCode !== expectedSalesCode) {
    return { error: 'Kode Akses Sales salah atau tidak valid.' };
  }

  if (password.length < 6) {
    return { error: 'Password minimal 6 karakter.' };
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        role: role,
      },
    },
  });

  if (error) {
    if (error.message.includes('already registered')) {
      return { error: 'Email sudah terdaftar.' };
    }
    return { error: `Registrasi gagal: ${error.message}` };
  }

  // Check if email confirmation is required
  // When confirmation is required, session will be null
  if (!data.session) {
    // User exists but identity is fake (duplicate signup attempt on unconfirmed email)
    if (data.user?.identities?.length === 0) {
      return { error: 'Email sudah terdaftar. Silakan cek email untuk konfirmasi.' };
    }
    // Email confirmation required - show success message
    return { success: true, message: 'Registrasi berhasil! Silakan cek email Anda untuk konfirmasi.' };
  }

  // If auto-confirmed (no email confirmation required), wait briefly for the
  // database trigger to create the profile row
  await new Promise((resolve) => setTimeout(resolve, 500));

  revalidatePath('/', 'layout');

  if (role === 'ADMIN') {
    redirect('/admin');
  } else {
    redirect('/sales');
  }
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath('/', 'layout');
  redirect('/login');
}

export async function getSession() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  return profile;
}
