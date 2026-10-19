'use server';

import { sql } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/lib/auth/session';
import { type OutletFormValues } from '@/lib/validations/outlet';
import type { Outlet, OutletType } from '@/types';

export async function getPaginatedOutlets(
  page: number, 
  pageSize: number, 
  search: string = '',
  filters?: { type?: string[]; visit_day?: string[]; assigned_sales?: string[]; status?: string[] },
  orderBy: string = 'name',
  orderDir: 'asc' | 'desc' = 'asc'
) {
  try {
    const offset = (page - 1) * pageSize;
    const searchPattern = search.trim() ? `%${search.trim().toLowerCase()}%` : null;
    const typeFilter = filters?.type && filters.type.length > 0 ? filters.type : null;
    const dayFilter = filters?.visit_day && filters.visit_day.length > 0 ? filters.visit_day : null;
    const salesFilter = filters?.assigned_sales && filters.assigned_sales.length > 0 ? filters.assigned_sales : null;
    const statusFilter = filters?.status && filters.status.length > 0 ? filters.status : null;

    const countRows = await sql`
      SELECT COUNT(*)::int as total
      FROM public.outlets
      WHERE 
        is_active = true
        AND (${searchPattern}::text IS NULL OR (
          LOWER(name) LIKE ${searchPattern} 
          OR LOWER(COALESCE(address, '')) LIKE ${searchPattern} 
          OR LOWER(COALESCE(city, '')) LIKE ${searchPattern}
        ))
        AND (${typeFilter}::text[] IS NULL OR type = ANY(${typeFilter}))
        AND (${dayFilter}::text[] IS NULL OR visit_day = ANY(${dayFilter}))
        AND (${salesFilter}::uuid[] IS NULL OR assigned_sales = ANY(${salesFilter}))
        AND (${statusFilter}::text[] IS NULL OR status = ANY(${statusFilter}));
    `;

    const total = countRows[0]?.total || 0;

    const rows = await sql`
      SELECT *
      FROM public.outlets
      WHERE 
        is_active = true
        AND (${searchPattern}::text IS NULL OR (
          LOWER(name) LIKE ${searchPattern} 
          OR LOWER(COALESCE(address, '')) LIKE ${searchPattern} 
          OR LOWER(COALESCE(city, '')) LIKE ${searchPattern}
        ))
        AND (${typeFilter}::text[] IS NULL OR type = ANY(${typeFilter}))
        AND (${dayFilter}::text[] IS NULL OR visit_day = ANY(${dayFilter}))
        AND (${salesFilter}::uuid[] IS NULL OR assigned_sales = ANY(${salesFilter}))
        AND (${statusFilter}::text[] IS NULL OR status = ANY(${statusFilter}))
      ORDER BY name ASC
      LIMIT ${pageSize} OFFSET ${offset};
    `;

    return { 
      data: rows as unknown as Outlet[], 
      count: total,
      totalPages: Math.ceil(total / pageSize)
    };
  } catch (error: any) {
    console.error('Error fetching outlets:', error);
    return { error: error.message, data: [], count: 0, totalPages: 0 };
  }
}

export async function upsertOutlet(values: OutletFormValues, id?: string) {
  try {
    if (id) {
      await sql`
        UPDATE public.outlets
        SET
          name = ${values.name},
          type = ${values.type || null},
          address = ${values.address || null},
          phone = ${values.phone || null},
          visit_day = ${values.visit_day || null},
          visit_frequency = ${values.visit_frequency || 'Seminggu Sekali'},
          city = ${values.city || null},
          assigned_sales = ${values.assigned_sales ? values.assigned_sales : null},
          updated_at = NOW()
        WHERE id = ${id};
      `;
    } else {
      await sql`
        INSERT INTO public.outlets (
          name, type, address, phone, visit_day, visit_frequency, city, assigned_sales
        ) VALUES (
          ${values.name},
          ${values.type || null},
          ${values.address || null},
          ${values.phone || null},
          ${values.visit_day || null},
          ${values.visit_frequency || 'Seminggu Sekali'},
          ${values.city || null},
          ${values.assigned_sales ? values.assigned_sales : null}
        );
      `;
    }
    
    revalidatePath('/admin/outlets');
    return { success: true };
  } catch (error: any) {
    console.error('Error upserting outlet:', error);
    return { error: error.message };
  }
}

export async function softDeleteOutlet(id: string) {
  try {
    await sql`
      UPDATE public.outlets
      SET is_active = false, updated_at = NOW()
      WHERE id = ${id};
    `;
    
    revalidatePath('/admin/outlets');
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function bulkDeleteOutlets(ids: string[]) {
  try {
    await sql`
      UPDATE public.outlets
      SET is_active = false, updated_at = NOW()
      WHERE id = ANY(${ids}::uuid[]);
    `;
    
    revalidatePath('/admin/outlets');
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function getOutletTypes(): Promise<OutletType[]> {
  try {
    const rows = await sql`
      SELECT id, name, created_at
      FROM public.outlet_types
      ORDER BY name ASC;
    `;
    return rows as unknown as OutletType[];
  } catch (error) {
    console.error('Error fetching outlet types:', error);
    return [];
  }
}

export async function createOutletType(name: string) {
  try {
    const rows = await sql`
      INSERT INTO public.outlet_types (name)
      VALUES (${name.trim().toUpperCase()})
      ON CONFLICT (name) DO NOTHING
      RETURNING id, name, created_at;
    `;
    return { data: rows[0] };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function deleteOutletType(id: string) {
  try {
    await sql`DELETE FROM public.outlet_types WHERE id = ${id};`;
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function getAllOutlets() {
  try {
    const rows = await sql`
      SELECT *
      FROM public.outlets
      WHERE is_active = true
      ORDER BY name ASC;
    `;
    return { data: rows as unknown as Outlet[] };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function createProspectOutlet(data: {
  name: string;
  type: string;
  address: string;
  phone?: string;
  owner_name?: string;
  lat: number;
  lng: number;
  photoUrl?: string;
  mode?: 'ORDER_NOW' | 'PROSPECT_ONLY';
}) {
  try {
    const { getCurrentUser } = await import('@/lib/auth/session');
    const user = await getCurrentUser();
    if (!user) return { error: 'Unauthorized' };

    const rows = await sql`
      INSERT INTO public.outlets (
        name, type, address, phone, owner_name, lat, lng, assigned_sales, status, is_active
      ) VALUES (
        ${data.name},
        ${data.type || null},
        ${data.address || null},
        ${data.phone || null},
        ${data.owner_name || null},
        ${data.lat},
        ${data.lng},
        ${user.id},
        'PROSPECT',
        true
      )
      RETURNING *;
    `;

    const newOutlet = rows[0] as unknown as Outlet;

    if (data.mode === 'PROSPECT_ONLY') {
      await sql`
        INSERT INTO public.visits (
          sales_id, outlet_id, lat, lng, photo_url, notes, status
        ) VALUES (
          ${user.id},
          ${newOutlet.id},
          ${data.lat},
          ${data.lng},
          ${data.photoUrl || null},
          'Kunjungan prospek baru (Canvassing)',
          'COMPLETED'
        );
      `;
    }

    revalidatePath('/sales');
    revalidatePath('/admin/outlets');
    return { success: true, data: newOutlet };
  } catch (error: any) {
    console.error('Error creating prospect outlet:', error);
    return { error: error.message };
  }
}

export async function recordOutletVisit(payload: {
  outlet_id: string;
  lat?: number | null;
  lng?: number | null;
  photo_url?: string | null;
  notes?: string | null;
}) {
  try {
    const user = await getCurrentUser();
    if (!user) return { error: 'Unauthorized' };

    await sql`
      INSERT INTO public.visits (
        sales_id, outlet_id, lat, lng, photo_url, notes, status
      ) VALUES (
        ${user.id},
        ${payload.outlet_id},
        ${payload.lat || null},
        ${payload.lng || null},
        ${payload.photo_url || null},
        ${payload.notes || 'Kunjungan rutin'},
        'COMPLETED'
      );
    `;

    return { success: true };
  } catch (error: any) {
    console.error('Error in recordOutletVisit:', error);
    return { error: error.message };
  }
}


