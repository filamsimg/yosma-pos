'use server';

import { sql } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth/session';
import { productSchema, stockAdjustmentSchema, type ProductFormValues, type StockAdjustmentValues } from '@/lib/validations/product';
import { revalidatePath } from 'next/cache';
import type { Product, Category } from '@/types';

/**
 * PRODUCTS ACTIONS
 */

export async function generateNextSKU(): Promise<string> {
  try {
    const rows = await sql`
      SELECT sku FROM public.products
      WHERE sku LIKE 'YAP-%'
      ORDER BY sku DESC
      LIMIT 1;
    `;

    if (!rows || rows.length === 0) {
      return 'YAP-0001';
    }

    const lastSku = rows[0].sku;
    const lastNumber = parseInt(lastSku.split('-')[1]) || 0;
    const nextNumber = lastNumber + 1;
    return `YAP-${nextNumber.toString().padStart(4, '0')}`;
  } catch (error) {
    console.error('Error generating SKU:', error);
    return `YAP-${Date.now().toString().slice(-4)}`;
  }
}

export async function createProduct(values: ProductFormValues) {
  const validated = productSchema.safeParse(values);
  if (!validated.success) {
    return { error: validated.error.flatten().fieldErrors };
  }

  try {
    let sku = validated.data.sku;
    if (!sku || sku.trim() === '') {
      sku = await generateNextSKU();
    }

    const rows = await sql`
      INSERT INTO public.products (
        name, sku, description, price, stock, min_stock,
        category_id, brand_id, unit_id, discount_regular, image_url
      ) VALUES (
        ${validated.data.name},
        ${sku},
        ${validated.data.description || null},
        ${validated.data.price},
        ${validated.data.stock || 0},
        ${validated.data.min_stock || 0},
        ${validated.data.category_id || null},
        ${validated.data.brand_id || null},
        ${validated.data.unit_id || null},
        ${validated.data.discount_regular || 0},
        ${validated.data.image_url || null}
      )
      RETURNING *;
    `;

    revalidatePath('/admin/products');
    return { data: rows[0] as unknown as Product };
  } catch (error: any) {
    console.error('Error creating product:', error);
    return { error: error.message };
  }
}

export async function updateProduct(id: string, values: ProductFormValues) {
  const validated = productSchema.safeParse(values);
  if (!validated.success) {
    return { error: validated.error.flatten().fieldErrors };
  }

  try {
    const rows = await sql`
      UPDATE public.products
      SET
        name = ${validated.data.name},
        sku = ${validated.data.sku},
        description = ${validated.data.description || null},
        price = ${validated.data.price},
        stock = ${validated.data.stock || 0},
        min_stock = ${validated.data.min_stock || 0},
        category_id = ${validated.data.category_id || null},
        brand_id = ${validated.data.brand_id || null},
        unit_id = ${validated.data.unit_id || null},
        discount_regular = ${validated.data.discount_regular || 0},
        image_url = ${validated.data.image_url || null},
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING *;
    `;

    revalidatePath('/admin/products');
    return { data: rows[0] as unknown as Product };
  } catch (error: any) {
    console.error('Error updating product:', error);
    return { error: error.message };
  }
}

export async function softDeleteProduct(id: string) {
  try {
    await sql`
      UPDATE public.products
      SET is_active = false, updated_at = NOW()
      WHERE id = ${id};
    `;

    revalidatePath('/admin/products');
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

/**
 * STOCK ACTIONS
 */

export async function adjustStock(values: StockAdjustmentValues) {
  const validated = stockAdjustmentSchema.safeParse(values);
  if (!validated.success) {
    return { error: validated.error.flatten().fieldErrors };
  }

  try {
    const user = await getCurrentUser();
    if (!user) return { error: 'Unauthorized' };

    const pRows = await sql`
      SELECT stock FROM public.products WHERE id = ${validated.data.product_id} LIMIT 1;
    `;

    if (!pRows || pRows.length === 0) return { error: 'Product not found' };

    const currentStock = Number(pRows[0].stock);
    const adjustment = validated.data.reason === 'RESTOCK' ? validated.data.quantity : -validated.data.quantity;
    const newStock = currentStock + adjustment;

    if (newStock < 0) return { error: 'Stock cannot be negative' };

    const reasonText = validated.data.reason + (validated.data.notes ? `: ${validated.data.notes}` : '');

    // 1. Log adjustment
    await sql`
      INSERT INTO public.stock_adjustments (product_id, adjusted_by, old_stock, new_stock, reason)
      VALUES (
        ${validated.data.product_id},
        ${user.id},
        ${currentStock},
        ${newStock},
        ${reasonText}
      );
    `;

    // 2. Update product
    await sql`
      UPDATE public.products
      SET stock = ${newStock}, updated_at = NOW()
      WHERE id = ${validated.data.product_id};
    `;

    revalidatePath('/admin/products');
    return { success: true, newStock };
  } catch (error: any) {
    console.error('Error adjusting stock:', error);
    return { error: error.message };
  }
}

/**
 * LOOKUP ACTIONS (Brands, Units, Categories)
 */

export async function createBrand(name: string) {
  try {
    const rows = await sql`
      INSERT INTO public.brands (name)
      VALUES (${name.trim()})
      ON CONFLICT (name) DO NOTHING
      RETURNING *;
    `;
    revalidatePath('/admin/products');
    return { data: rows[0] };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function createUnit(name: string) {
  try {
    const rows = await sql`
      INSERT INTO public.units (name)
      VALUES (${name.trim().toUpperCase()})
      ON CONFLICT (name) DO NOTHING
      RETURNING *;
    `;
    revalidatePath('/admin/products');
    return { data: rows[0] };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function createCategory(name: string) {
  try {
    const rows = await sql`
      INSERT INTO public.categories (name)
      VALUES (${name.trim()})
      ON CONFLICT (name) DO NOTHING
      RETURNING *;
    `;
    revalidatePath('/admin/products');
    return { data: rows[0] };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function deleteCategory(id: string) {
  try {
    await sql`DELETE FROM public.categories WHERE id = ${id};`;
    revalidatePath('/admin/products');
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function deleteBrand(id: string) {
  try {
    await sql`DELETE FROM public.brands WHERE id = ${id};`;
    revalidatePath('/admin/products');
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function getUnits() {
  try {
    const rows = await sql`SELECT * FROM public.units ORDER BY name ASC;`;
    return rows as any[];
  } catch (err) {
    console.error('Error fetching units:', err);
    return [];
  }
}

export async function getBrands() {
  try {
    const rows = await sql`SELECT * FROM public.brands ORDER BY name ASC;`;
    return rows as any[];
  } catch (err) {
    console.error('Error fetching brands:', err);
    return [];
  }
}

export async function getCategories() {
  try {
    const rows = await sql`SELECT * FROM public.categories ORDER BY name ASC;`;
    return rows as any[];
  } catch (err) {
    console.error('Error fetching categories:', err);
    return [];
  }
}

export async function deleteUnit(id: string) {
  try {
    await sql`DELETE FROM public.units WHERE id = ${id};`;
    revalidatePath('/admin/products');
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function searchProducts(query: string) {
  try {
    if (!query.trim()) return [];
    const pattern = `%${query.trim().toLowerCase()}%`;
    const rows = await sql`
      SELECT id, name, sku, price, stock
      FROM public.products
      WHERE is_active = true AND stock > 0 AND LOWER(name) LIKE ${pattern}
      LIMIT 8;
    `;
    return rows as any[];
  } catch (err) {
    console.error('Error searching products:', err);
    return [];
  }
}

export async function getPaginatedProducts(
  page: number, 
  pageSize: number, 
  search: string = '',
  filters?: { category_id?: string[]; brand_id?: string[]; stock_status?: string[] },
  orderBy: string = 'name',
  orderDir: 'asc' | 'desc' = 'asc'
) {
  try {
    const offset = (page - 1) * pageSize;
    const searchPattern = search.trim() ? `%${search.trim().toLowerCase()}%` : null;
    const catFilter = filters?.category_id && filters.category_id.length > 0 ? filters.category_id : null;
    const brandFilter = filters?.brand_id && filters.brand_id.length > 0 ? filters.brand_id : null;

    const countRows = await sql`
      SELECT COUNT(*)::int as total
      FROM public.products p
      WHERE 
        p.is_active = true
        AND (${searchPattern}::text IS NULL OR (
          LOWER(p.name) LIKE ${searchPattern} 
          OR LOWER(p.sku) LIKE ${searchPattern}
        ))
        AND (${catFilter}::uuid[] IS NULL OR p.category_id = ANY(${catFilter}))
        AND (${brandFilter}::uuid[] IS NULL OR p.brand_id = ANY(${brandFilter}));
    `;

    const total = countRows[0]?.total || 0;

    const rows = await sql`
      SELECT 
        p.*,
        CASE WHEN c.id IS NOT NULL THEN json_build_object('id', c.id, 'name', c.name) ELSE NULL END as category,
        CASE WHEN b.id IS NOT NULL THEN json_build_object('id', b.id, 'name', b.name) ELSE NULL END as brand,
        CASE WHEN u.id IS NOT NULL THEN json_build_object('id', u.id, 'name', u.name) ELSE NULL END as unit
      FROM public.products p
      LEFT JOIN public.categories c ON p.category_id = c.id
      LEFT JOIN public.brands b ON p.brand_id = b.id
      LEFT JOIN public.units u ON p.unit_id = u.id
      WHERE 
        p.is_active = true
        AND (${searchPattern}::text IS NULL OR (
          LOWER(p.name) LIKE ${searchPattern} 
          OR LOWER(p.sku) LIKE ${searchPattern}
        ))
        AND (${catFilter}::uuid[] IS NULL OR p.category_id = ANY(${catFilter}))
        AND (${brandFilter}::uuid[] IS NULL OR p.brand_id = ANY(${brandFilter}))
      ORDER BY p.name ASC
      LIMIT ${pageSize} OFFSET ${offset};
    `;

    return { 
      data: rows as any[], 
      count: total,
      totalPages: Math.ceil(total / pageSize)
    };
  } catch (error: any) {
    console.error('Error fetching paginated products:', error);
    return { error: error.message, data: [], count: 0, totalPages: 0 };
  }
}

export async function bulkDeleteProducts(ids: string[]) {
  try {
    await sql`
      UPDATE public.products
      SET is_active = false, updated_at = NOW()
      WHERE id = ANY(${ids}::uuid[]);
    `;
    revalidatePath('/admin/products');
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function getAllProducts() {
  try {
    const rows = await sql`
      SELECT 
        p.*,
        json_build_object('name', c.name) as category,
        json_build_object('name', b.name) as brand,
        json_build_object('name', u.name) as unit
      FROM public.products p
      LEFT JOIN public.categories c ON p.category_id = c.id
      LEFT JOIN public.brands b ON p.brand_id = b.id
      LEFT JOIN public.units u ON p.unit_id = u.id
      WHERE p.is_active = true
      ORDER BY p.name ASC;
    `;
    return { data: rows as any[] };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function getPOSCatalogData() {
  try {
    const [products, categories] = await Promise.all([
      sql`
        SELECT 
          p.*,
          CASE WHEN c.id IS NOT NULL THEN json_build_object('id', c.id, 'name', c.name) ELSE NULL END as category
        FROM public.products p
        LEFT JOIN public.categories c ON p.category_id = c.id
        WHERE p.is_active = true
        ORDER BY p.name ASC;
      `,
      sql`SELECT * FROM public.categories ORDER BY name ASC;`,
    ]);

    return {
      products: products as unknown as Product[],
      categories: categories as unknown as Category[],
    };
  } catch (error) {
    console.error('Error in getPOSCatalogData:', error);
    return { products: [], categories: [] };
  }
}

