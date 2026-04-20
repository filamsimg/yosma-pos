'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { type OutletFormValues } from '@/lib/validations/outlet';

export async function getPaginatedOutlets(
  page: number, 
  pageSize: number, 
  search: string = '',
  filters?: { type?: string[]; visit_day?: string[]; assigned_sales?: string[] },
  orderBy: string = 'name',
  orderDir: 'asc' | 'desc' = 'asc'
) {
  const supabase = await createClient();
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from('outlets')
    .select('*', { count: 'exact' })
    .eq('is_active', true)
    .order(orderBy, { ascending: orderDir === 'asc' });

  if (search.trim()) {
    query = query.or(`name.ilike.%${search}%,address.ilike.%${search}%`);
  }

  if (filters?.type && filters.type.length > 0) {
    query = query.in('type', filters.type);
  }

  if (filters?.visit_day && filters.visit_day.length > 0) {
    query = query.in('visit_day', filters.visit_day);
  }

  if (filters?.assigned_sales && filters.assigned_sales.length > 0) {
    // For assigned_sales, since it was previously ilike, 
    // if it's multiple we might need a different approach, 
    // but usually it's one sales name. Using .in() for consistency.
    query = query.in('assigned_sales', filters.assigned_sales);
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
    type: values.type || null,
    address: values.address || null,
    phone: values.phone || null,
    visit_day: values.visit_day || null,
    visit_frequency: values.visit_frequency || 'WEEKLY',
    assigned_sales: values.assigned_sales || null,
    updated_at: new Date().toISOString(),
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

export async function getOutletTypes() {
  const supabase = await createClient();
  const { data, error } = await supabase.from('outlet_types').select('*').order('name');
  if (error) return [];
  return data as any[];
}

export async function createOutletType(name: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.from('outlet_types').insert({ name }).select().single();
  if (error) return { error: error.message };
  return { data };
}

export async function deleteOutletType(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('outlet_types').delete().eq('id', id);
  if (error) return { error: error.message };
  return { success: true };
}
