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
}

export async function bulkImportProducts(items: ProductImportItem[]) {
  const supabase = await createClient();

  // 1. Fetch current lookup tables
  const [{ data: categories }, { data: brands }, { data: units }] = await Promise.all([
    supabase.from('categories').select('id, name'),
    supabase.from('brands').select('id, name'),
    supabase.from('units').select('id, name'),
  ]);

  const catMap = new Map(categories?.map((c) => [c.name.toLowerCase(), c.id]));
  const brandMap = new Map(brands?.map((b) => [b.name.toLowerCase(), b.id]));
  const unitMap = new Map(units?.map((u) => [u.name.toLowerCase(), u.id]));

  // 2. Identify missing brands, units, categories (though we usually expect categories to exist)
  const newBrands = new Set<string>();
  const newUnits = new Set<string>();

  for (const item of items) {
    if (item.merk && !brandMap.has(item.merk.toLowerCase())) newBrands.add(item.merk);
    if (item.satuan && !unitMap.has(item.satuan.toLowerCase())) newUnits.add(item.satuan);
  }

  // 3. Create missing ones
  if (newBrands.size > 0) {
    const { data } = await supabase
      .from('brands')
      .insert(Array.from(newBrands).map(name => ({ name })))
      .select();
    data?.forEach(b => brandMap.set(b.name.toLowerCase(), b.id));
  }

  if (newUnits.size > 0) {
    const { data } = await supabase
      .from('units')
      .insert(Array.from(newUnits).map(name => ({ name })))
      .select();
    data?.forEach(u => unitMap.set(u.name.toLowerCase(), u.id));
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
      item.sku = `YSM-${skuCounter.toString().padStart(4, '0')}`;
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
    category_id: item.kategori ? (catMap.get(item.kategori.toLowerCase()) || null) : null,
    brand_id: item.merk ? (brandMap.get(item.merk.toLowerCase()) || null) : null,
    unit_id: item.satuan ? (unitMap.get(item.satuan.toLowerCase()) || null) : null,
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
