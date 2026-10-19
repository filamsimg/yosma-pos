'use server';

import { sql } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { generateNextSKU } from './products';
import { 
  normalizeTypeName, 
  normalizeUnitName,
  normalizeVisitDay, 
  normalizeVisitFrequency,
  normalizeSalesList
} from '@/lib/utils/string-utils';

export interface ProductImportItem {
  nama: string;
  sku: string;
  merk?: string;
  kategori?: string;
  satuan?: string;
  harga: number;
  stok?: number;
  deskripsi?: string;
  diskon_reguler?: number;
  min_stock?: number;
}

export interface OutletImportItem {
  name: string;
  type?: string;
  address?: string;
  phone?: string;
  owner_name?: string;
  visit_day?: string;
  visit_frequency?: string;
  city?: string;
  assigned_sales?: string;
}

export async function bulkImportProducts(items: ProductImportItem[]) {
  try {
    // 1. Fetch current lookup tables
    const [categories, brands, units] = await Promise.all([
      sql`SELECT id, name FROM public.categories;`,
      sql`SELECT id, name FROM public.brands;`,
      sql`SELECT id, name FROM public.units;`,
    ]);

    const catMap = new Map((categories || []).map((c: any) => [c.name.toUpperCase(), c.id]));
    const brandMap = new Map((brands || []).map((b: any) => [b.name.toUpperCase(), b.id]));
    const unitMap = new Map((units || []).map((u: any) => [u.name.toUpperCase(), u.id]));

    // 2. Identify missing brands & units
    const newBrands = new Set<string>();
    const newUnits = new Set<string>();

    for (const item of items) {
      item.nama = item.nama.toUpperCase();
      if (item.merk) {
        item.merk = item.merk.toUpperCase();
        if (!brandMap.has(item.merk)) newBrands.add(item.merk);
      }
      if (item.kategori) {
        item.kategori = item.kategori.toUpperCase();
      }
      if (item.satuan) {
        item.satuan = normalizeUnitName(item.satuan);
        if (!unitMap.has(item.satuan)) newUnits.add(item.satuan);
      }
    }

    // 3. Create missing brands & units
    for (const bName of newBrands) {
      const bRes = await sql`
        INSERT INTO public.brands (name) VALUES (${bName})
        ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
        RETURNING id, name;
      `;
      if (bRes[0]) brandMap.set(bRes[0].name.toUpperCase(), bRes[0].id);
    }

    for (const uName of newUnits) {
      const uRes = await sql`
        INSERT INTO public.units (name) VALUES (${uName})
        ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
        RETURNING id, name;
      `;
      if (uRes[0]) unitMap.set(uRes[0].name.toUpperCase(), uRes[0].id);
    }

    // 4. Handle auto-SKU for items without SKU
    let nextSkuBase: string | null = null;
    let skuCounter = 0;

    for (const item of items) {
      if (!item.sku || item.sku.trim() === '') {
        if (!nextSkuBase) {
          nextSkuBase = await generateNextSKU();
          const parts = nextSkuBase.split('-');
          skuCounter = parseInt(parts[1]) || 1;
        } else {
          skuCounter++;
        }
        item.sku = `YAP-${skuCounter.toString().padStart(4, '0')}`;
      }
    }

    // 5. Upsert products by SKU
    for (const item of items) {
      const categoryId = item.kategori ? (catMap.get(item.kategori) || null) : null;
      const brandId = item.merk ? (brandMap.get(item.merk) || null) : null;
      const unitId = item.satuan ? (unitMap.get(item.satuan) || null) : null;

      await sql`
        INSERT INTO public.products (
          sku, name, description, price, stock, discount_regular,
          category_id, brand_id, unit_id, min_stock, is_active
        ) VALUES (
          ${item.sku},
          ${item.nama},
          ${item.deskripsi || null},
          ${item.harga || 0},
          ${item.stok || 0},
          ${item.diskon_reguler || 0},
          ${categoryId},
          ${brandId},
          ${unitId},
          ${item.min_stock ?? 10},
          true
        )
        ON CONFLICT (sku) DO UPDATE SET
          name = EXCLUDED.name,
          description = EXCLUDED.description,
          price = EXCLUDED.price,
          stock = EXCLUDED.stock,
          discount_regular = EXCLUDED.discount_regular,
          category_id = EXCLUDED.category_id,
          brand_id = EXCLUDED.brand_id,
          unit_id = EXCLUDED.unit_id,
          min_stock = EXCLUDED.min_stock,
          updated_at = NOW();
      `;
    }

    revalidatePath('/admin/products');
    return { success: true, count: items.length };
  } catch (error: any) {
    console.error('Error in bulkImportProducts:', error);
    return { error: error.message };
  }
}

export async function bulkImportOutlets(items: OutletImportItem[]) {
  try {
    const outletTypes = await sql`SELECT id, name FROM public.outlet_types;`;
    const typeMap = new Map((outletTypes || []).map((t: any) => [t.name.toUpperCase(), t.id]));

    const newTypes = new Set<string>();
    for (const item of items) {
      item.name = item.name.trim().toUpperCase();
      if (item.address) item.address = item.address.trim().toUpperCase();
      if (item.type) {
        item.type = normalizeTypeName(item.type.toUpperCase());
        if (!typeMap.has(item.type)) newTypes.add(item.type);
      }
    }

    for (const tName of newTypes) {
      const tRes = await sql`
        INSERT INTO public.outlet_types (name) VALUES (${tName})
        ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
        RETURNING id, name;
      `;
      if (tRes[0]) typeMap.set(tRes[0].name.toUpperCase(), tRes[0].id);
    }

    for (const item of items) {
      const visitDay = item.visit_day ? normalizeVisitDay(item.visit_day) : null;
      const visitFreq = normalizeVisitFrequency(item.visit_frequency || '');
      const assignedSales = item.assigned_sales ? normalizeSalesList(item.assigned_sales) : null;

      await sql`
        INSERT INTO public.outlets (
          name, type, address, phone, city, owner_name,
          visit_day, visit_frequency, assigned_sales, status, is_active
        ) VALUES (
          ${item.name},
          ${item.type || null},
          ${item.address || null},
          ${item.phone || null},
          ${item.city || null},
          ${item.owner_name || null},
          ${visitDay},
          ${visitFreq},
          ${assignedSales},
          'ACTIVE',
          true
        );
      `;
    }

    revalidatePath('/admin/outlets');
    return { success: true, count: items.length };
  } catch (error: any) {
    console.error('Error in bulkImportOutlets:', error);
    return { error: error.message };
  }
}
