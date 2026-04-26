'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { generateNextSKU } from './products';

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
  const supabase = await createClient();

  // 1. Fetch current lookup tables
  const [{ data: categories }, { data: brands }, { data: units }] = await Promise.all([
    supabase.from('categories').select('id, name'),
    supabase.from('brands').select('id, name'),
    supabase.from('units').select('id, name'),
  ]);

  const catMap = new Map(categories?.map((c) => [c.name.toUpperCase(), c.id]));
  const brandMap = new Map(brands?.map((b) => [b.name.toUpperCase(), b.id]));
  const unitMap = new Map(units?.map((u) => [u.name.toUpperCase(), u.id]));

  // 2. Identify missing brands, units, categories (though we usually expect categories to exist)
  const newBrands = new Set<string>();
  const newUnits = new Set<string>();

  for (const item of items) {
    // Normalisasi data ke Huruf Besar
    item.nama = item.nama.toUpperCase();
    if (item.merk) {
      item.merk = item.merk.toUpperCase();
      if (!brandMap.has(item.merk)) newBrands.add(item.merk);
    }
    if (item.kategori) {
      item.kategori = item.kategori.toUpperCase();
    }
    if (item.satuan) {
      item.satuan = item.satuan.toUpperCase();
      if (!unitMap.has(item.satuan)) newUnits.add(item.satuan);
    }
  }

  // 3. Create missing ones
  if (newBrands.size > 0) {
    const { data } = await supabase
      .from('brands')
      .insert(Array.from(newBrands).map(name => ({ name })))
      .select();
    data?.forEach(b => brandMap.set(b.name.toUpperCase(), b.id));
  }

  if (newUnits.size > 0) {
    const { data } = await supabase
      .from('units')
      .insert(Array.from(newUnits).map(name => ({ name })))
      .select();
    data?.forEach(u => unitMap.set(u.name.toUpperCase(), u.id));
  }

  // 4. Handle auto-SKU for items without SKU
  let nextSkuBase: string | null = null;
  let skuCounter = 0;

  for (const item of items) {
    if (!item.sku || item.sku.trim() === '') {
      if (!nextSkuBase) {
        nextSkuBase = await generateNextSKU();
        const parts = nextSkuBase.split('-');
        skuCounter = parseInt(parts[1]);
      } else {
        skuCounter++;
      }
      item.sku = `YAP-${skuCounter.toString().padStart(4, '0')}`;
    }
  }

  // 5. Prepare product data
  const productsToUpsert = items.map((item) => ({
    sku: item.sku,
    name: item.nama,
    description: item.deskripsi || null,
    price: item.harga || 0,
    stock: item.stok || 0,
    discount_regular: item.diskon_reguler || 0,
    category_id: item.kategori ? (catMap.get(item.kategori) || null) : null,
    brand_id: item.merk ? (brandMap.get(item.merk) || null) : null,
    unit_id: item.satuan ? (unitMap.get(item.satuan) || null) : null,
    min_stock: item.min_stock ?? 10,
    is_active: true,
  }));

  // 6. Upsert products by SKU
  const { error } = await supabase
    .from('products')
    .upsert(productsToUpsert, { onConflict: 'sku' });

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/admin/products');
  return { success: true, count: items.length };
}

export async function bulkImportOutlets(items: OutletImportItem[]) {
  const supabase = await createClient();

  // 1. Fetch current outlet types
  const { data: outletTypes } = await supabase.from('outlet_types').select('id, name');
  const typeMap = new Map(outletTypes?.map((t) => [t.name.toUpperCase(), t.id]));

  // 2. Identify missing types
  const newTypes = new Set<string>();

  for (const item of items) {
    // Basic normalization
    item.name = item.name.toUpperCase();
    if (item.type) {
      item.type = item.type.toUpperCase();
      if (!typeMap.has(item.type)) newTypes.add(item.type);
    }
  }

  // 3. Create missing types
  if (newTypes.size > 0) {
    const { data } = await supabase
      .from('outlet_types')
      .insert(Array.from(newTypes).map(name => ({ name })))
      .select();
    data?.forEach(t => typeMap.set(t.name.toUpperCase(), t.id));
  }

  // 4. Prepare outlet data
  const outletsToUpsert = items.map((item) => ({
    name: item.name,
    type: item.type ? (typeMap.get(item.type) ? item.type : null) : null, // Store as string if that's how it's in DB, but wait.
    // Check database.ts again: Outlet.type is string | null. So we just need the string.
    // But usually we map it to the name.
    address: item.address || null,
    phone: item.phone || null,
    city: item.city || null,
    owner_name: item.owner_name || null,
    visit_day: item.visit_day || null,
    visit_frequency: item.visit_frequency || 'Seminggu Sekali',
    assigned_sales: item.assigned_sales || null,
    is_active: true,
  }));

  // 5. Upsert outlets by Name (simplified conflict target, usually name + address is better but name is common)
  const { error } = await supabase
    .from('outlets')
    .upsert(outletsToUpsert, { onConflict: 'name' }); // Assuming name is unique or we just want to update by name

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/admin/outlets');
  return { success: true, count: items.length };
}
