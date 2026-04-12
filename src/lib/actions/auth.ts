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

  if (!email || !password || !fullName) {
    return { error: 'Semua field harus diisi.' };
  }

  if (password.length < 6) {
    return { error: 'Password minimal 6 karakter.' };
  }

  const { error } = await supabase.auth.signUp({
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
