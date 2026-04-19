'use server';

import { createClient } from '@/lib/supabase/server';
import type { Profile } from '@/types';
import { revalidatePath } from 'next/cache';

export async function getSalesProfiles() {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'SALES')
    .eq('is_active', true)
    .order('full_name');

  if (error) {
    console.error('Error fetching sales profiles:', error);
    return [];
  }

  return data as Profile[];
}

export async function getPaginatedProfiles(page = 1, pageSize = 10, search = '') {
  const supabase = await createClient();
  
  let query = supabase.from('profiles').select('*', { count: 'exact' });

  if (search) {
    query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%,sales_code.ilike.%${search}%`);
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, count, error } = await query
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) {
    return { data: null, error: error.message, count: 0, totalPages: 0 };
  }

  return {
    data: data as Profile[],
    count: count || 0,
    totalPages: Math.ceil((count || 0) / pageSize),
  };
}

export async function updateProfile(id: string, values: Partial<Profile>) {
  const supabase = await createClient();
  
  const { error } = await supabase
    .from('profiles')
    .update({
      full_name: values.full_name,
      role: values.role,
      sales_code: values.sales_code,
      phone: values.phone,
      is_active: values.is_active !== undefined ? values.is_active : true,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/admin/profiles');
  revalidatePath('/admin/outlets');
  return { success: true };
}

export async function updateMyProfile(values: { full_name: string; phone?: string }) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'Tidak diizinkan karena sesi berakhir' };
  }

  const { error } = await supabase
    .from('profiles')
    .update({
      full_name: values.full_name,
      phone: values.phone || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/admin/profile');
  revalidatePath('/sales/profile');
  // Revalidate auth session layout if needed
  
  return { success: true };
}
