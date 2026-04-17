'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { type OutletFormValues } from '@/lib/validations/outlet';

export async function getPaginatedOutlets(page: number, pageSize: number, search: string = '') {
  const supabase = await createClient();
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from('outlets')
    .select('*', { count: 'exact' })
    .eq('is_active', true)
    .order('name');

  if (search.trim()) {
    query = query.or(`name.ilike.%${search}%,address.ilike.%${search}%`);
  }

  const { data, count, error } = await query.range(from, to);

  if (error) return { error: error.message };
  
  return { 
    data: data as any[], 
    count: count || 0,
    totalPages: Math.ceil((count || 0) / pageSize)
  };
}

export async function upsertOutlet(values: OutletFormValues, id?: string) {
  const supabase = await createClient();
  const payload = {
    name: values.name,
    address: values.address || null,
    phone: values.phone || null,
  };

  let error;
  if (id) {
    const res = await supabase.from('outlets').update(payload).eq('id', id);
    error = res.error;
  } else {
    const res = await supabase.from('outlets').insert(payload);
    error = res.error;
  }

  if (error) return { error: error.message };
  
  revalidatePath('/admin/outlets');
  return { success: true };
}

export async function softDeleteOutlet(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('outlets')
    .update({ is_active: false })
    .eq('id', id);

  if (error) return { error: error.message };
  
  revalidatePath('/admin/outlets');
  return { success: true };
}

export async function bulkDeleteOutlets(ids: string[]) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('outlets')
    .update({ is_active: false })
    .in('id', ids);

  if (error) return { error: error.message };
  
  revalidatePath('/admin/outlets');
  return { success: true };
}
