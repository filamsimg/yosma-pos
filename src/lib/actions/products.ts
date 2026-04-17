'use server';

import { createClient } from '@/lib/supabase/server';
import { productSchema, stockAdjustmentSchema, type ProductFormValues, type StockAdjustmentValues } from '@/lib/validations/product';
import { revalidatePath } from 'next/cache';

/**
 * PRODUCTS ACTIONS
 */

export async function generateNextSKU() {
  const supabase = await createClient();
  const { data } = await supabase
    .from('products')
    .select('sku')
    .ilike('sku', 'YSM-%')
    .order('sku', { ascending: false })
    .limit(1);

  if (!data || data.length === 0) {
    return 'YSM-0001';
  }

  const lastSku = data[0].sku;
  const lastNumber = parseInt(lastSku.split('-')[1]) || 0;
  const nextNumber = lastNumber + 1;
  return `YSM-${nextNumber.toString().padStart(4, '0')}`;
}

export async function createProduct(values: ProductFormValues) {
  const validated = productSchema.safeParse(values);
  if (!validated.success) {
    return { error: validated.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  
  // Auto-generate SKU if empty
  if (!validated.data.sku || validated.data.sku.trim() === '') {
    validated.data.sku = await generateNextSKU();
  }
  
  const { data, error } = await supabase
    .from('products')
    .insert([validated.data])
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/admin/products');
  return { data };
}

export async function updateProduct(id: string, values: ProductFormValues) {
  const validated = productSchema.safeParse(values);
  if (!validated.success) {
    return { error: validated.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('products')
    .update(validated.data)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/admin/products');
  return { data };
}

export async function softDeleteProduct(id: string) {
  const supabase = await createClient();
  
  const { error } = await supabase
    .from('products')
    .update({ is_active: false })
    .eq('id', id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/admin/products');
  return { success: true };
}

/**
 * STOCK ACTIONS
 */

export async function adjustStock(values: StockAdjustmentValues) {
  const validated = stockAdjustmentSchema.safeParse(values);
  if (!validated.success) {
    return { error: validated.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized' };

  // Get current stock
  const { data: product, error: pError } = await supabase
    .from('products')
    .select('stock')
    .eq('id', validated.data.product_id)
    .single();

  if (pError || !product) return { error: 'Product not found' };

  const adjustment = validated.data.reason === 'RESTOCK' ? validated.data.quantity : -validated.data.quantity;
  const newStock = product.stock + adjustment;

  if (newStock < 0) return { error: 'Stock cannot be negative' };

  // Perform multiple operations in a pseudo-transaction
  // 1. Create adjustment log
  const { error: logError } = await supabase
    .from('stock_adjustments')
    .insert([{
      product_id: validated.data.product_id,
      adjusted_by: user.id,
      old_stock: product.stock,
      new_stock: newStock,
      reason: validated.data.reason + (validated.data.notes ? `: ${validated.data.notes}` : ''),
    }]);

  if (logError) return { error: logError.message };

  // 2. Update product stock
  const { error: updateError } = await supabase
    .from('products')
    .update({ stock: newStock })
    .eq('id', validated.data.product_id);

  if (updateError) return { error: updateError.message };

  revalidatePath('/admin/products');
  return { success: true, newStock };
}

/**
 * LOOKUP ACTIONS (Brands, Units)
 */

export async function createBrand(name: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('brands')
    .insert([{ name }])
    .select()
    .single();

  if (error) return { error: error.message };
  return { data };
}

export async function createUnit(name: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('units')
    .insert([{ name }])
    .select()
    .single();

  if (error) return { error: error.message };
  return { data };
}

export async function createCategory(name: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('categories')
    .insert([{ name }])
    .select()
    .single();

  if (error) return { error: error.message };
  return { data };
}

export async function deleteBrand(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('brands').delete().eq('id', id);
  if (error) return { error: error.message };
  revalidatePath('/admin/products');
  return { success: true };
}

export async function deleteUnit(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('units').delete().eq('id', id);
  if (error) return { error: error.message };
  revalidatePath('/admin/products');
  return { success: true };
}

export async function deleteCategory(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('categories').delete().eq('id', id);
  if (error) return { error: error.message };
  revalidatePath('/admin/products');
  return { success: true };
}
