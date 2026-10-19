'use server';

import { sql } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth/session';
import { revalidatePath } from 'next/cache';
import { addDays } from 'date-fns';

// ============================================================
// CANCEL TRANSACTION (hanya jika status PENDING)
// ============================================================
export async function cancelTransaction(transactionId: string) {
  try {
    const user = await getCurrentUser();
    if (!user) return { error: 'Unauthorized' };

    const rows = await sql`
      SELECT id, status, invoice_number, sales_id
      FROM public.transactions
      WHERE id = ${transactionId}
      LIMIT 1;
    `;

    if (!rows || rows.length === 0) return { error: 'Transaksi tidak ditemukan' };
    const transaction = rows[0];

    // Sales hanya bisa cancel transaksi miliknya, Admin bisa cancel transaksi siapapun
    if (user.role !== 'ADMIN' && transaction.sales_id !== user.id) {
      return { error: 'Tidak memiliki izin untuk membatalkan pesanan ini' };
    }

    if (transaction.status !== 'PENDING') {
      return { error: 'Hanya transaksi berstatus MENUNGGU yang bisa dibatalkan' };
    }

    // Ambil item transaksi untuk restock
    const items = await sql`
      SELECT product_id, quantity
      FROM public.transaction_items
      WHERE transaction_id = ${transactionId};
    `;

    for (const item of items) {
      const pRows = await sql`SELECT stock FROM public.products WHERE id = ${item.product_id} LIMIT 1;`;
      if (pRows && pRows.length > 0) {
        const oldStock = Number(pRows[0].stock);
        const newStock = oldStock + Number(item.quantity);

        await sql`
          UPDATE public.products
          SET stock = ${newStock}, updated_at = NOW()
          WHERE id = ${item.product_id};
        `;

        await sql`
          INSERT INTO public.stock_adjustments (product_id, adjusted_by, old_stock, new_stock, reason)
          VALUES (
            ${item.product_id},
            ${user.id},
            ${oldStock},
            ${newStock},
            ${'RESTOCK: Pembatalan pesanan ' + transaction.invoice_number}
          );
        `;
      }
    }

    await sql`
      UPDATE public.transactions
      SET status = 'CANCELLED'
      WHERE id = ${transactionId};
    `;

    revalidatePath('/sales/history');
    revalidatePath('/admin/transactions');
    return { success: true };
  } catch (error: any) {
    console.error('Error in cancelTransaction:', error);
    return { error: error.message };
  }
}

// ============================================================
// EDIT TRANSACTION ITEMS (hanya jika status PENDING)
// ============================================================
interface EditItem {
  product_id: string;
  quantity: number;
  price_at_sale: number;
}

export async function editTransactionItems(
  transactionId: string,
  newItems: EditItem[]
) {
  try {
    const user = await getCurrentUser();
    if (!user) return { error: 'Unauthorized' };
    if (newItems.length === 0) return { error: 'Pesanan tidak boleh kosong' };

    const tRows = await sql`
      SELECT id, status, invoice_number, discount, payment_method, sales_id
      FROM public.transactions
      WHERE id = ${transactionId}
      LIMIT 1;
    `;

    if (!tRows || tRows.length === 0) return { error: 'Transaksi tidak ditemukan' };
    const transaction = tRows[0];

    if (user.role !== 'ADMIN' && transaction.sales_id !== user.id) {
      return { error: 'Tidak memiliki izin untuk mengedit pesanan ini' };
    }

    if (transaction.status !== 'PENDING') {
      return { error: 'Hanya transaksi MENUNGGU yang bisa diedit' };
    }

    // Step a: Ambil & kembalikan semua stok item lama
    const oldItems = await sql`
      SELECT product_id, quantity
      FROM public.transaction_items
      WHERE transaction_id = ${transactionId};
    `;

    for (const item of oldItems) {
      const pRows = await sql`SELECT stock FROM public.products WHERE id = ${item.product_id} LIMIT 1;`;
      if (pRows && pRows.length > 0) {
        const oldStock = Number(pRows[0].stock);
        const newStock = oldStock + Number(item.quantity);

        await sql`
          UPDATE public.products
          SET stock = ${newStock}, updated_at = NOW()
          WHERE id = ${item.product_id};
        `;

        await sql`
          INSERT INTO public.stock_adjustments (product_id, adjusted_by, old_stock, new_stock, reason)
          VALUES (
            ${item.product_id},
            ${user.id},
            ${oldStock},
            ${newStock},
            ${'EDIT: Restore stok sebelum edit pesanan ' + transaction.invoice_number}
          );
        `;
      }
    }

    // Step b: Delete item lama
    await sql`DELETE FROM public.transaction_items WHERE transaction_id = ${transactionId};`;

    // Step c: Cek ketersediaan stok untuk item baru
    for (const item of newItems) {
      const pRows = await sql`SELECT name, stock FROM public.products WHERE id = ${item.product_id} LIMIT 1;`;
      if (!pRows || pRows.length === 0) return { error: 'Produk tidak ditemukan' };
      if (Number(pRows[0].stock) < item.quantity) {
        return { error: `Stok ${pRows[0].name} tidak cukup (tersisa ${pRows[0].stock})` };
      }
    }

    // Step d: Batch insert item baru (trigger deduct_stock_on_sale akan memotong stok secara otomatis)
    if (newItems.length > 0) {
      await sql`
        INSERT INTO public.transaction_items (transaction_id, product_id, quantity, price_at_sale)
        SELECT 
          ${transactionId},
          (item->>'product_id')::uuid,
          (item->>'quantity')::int,
          (item->>'price_at_sale')::int
        FROM json_array_elements(${JSON.stringify(newItems)}::json) AS item;
      `;
    }

    // Step e: Hitung ulang subtotal & due_date
    const subtotal = newItems.reduce((sum, it) => sum + it.price_at_sale * it.quantity, 0);
    const discount = Number(transaction.discount || 0);
    const totalPrice = Math.max(0, subtotal - discount);

    const isCredit = transaction.payment_method === 'CREDIT';
    const tempoDays = totalPrice >= 100000 ? 30 : 14;
    const dueDate = isCredit ? addDays(new Date(), tempoDays).toISOString() : null;

    await sql`
      UPDATE public.transactions
      SET subtotal = ${subtotal}, total_price = ${totalPrice}, due_date = ${dueDate}
      WHERE id = ${transactionId};
    `;

    revalidatePath('/sales/history');
    revalidatePath('/admin/transactions');
    return { success: true, totalPrice, tempoDays: isCredit ? tempoDays : null };
  } catch (error: any) {
    console.error('Error in editTransactionItems:', error);
    return { error: error.message };
  }
}

// ============================================================
// UPDATE TRANSACTION STATUS (admin)
// ============================================================
export async function updateTransactionStatus(
  transactionId: string,
  newStatus: 'PROCESSING' | 'COMPLETED' | 'CANCELLED'
) {
  try {
    const user = await getCurrentUser();
    if (!user) return { error: 'Unauthorized' };

    const tRows = await sql`
      SELECT id, status, invoice_number
      FROM public.transactions
      WHERE id = ${transactionId}
      LIMIT 1;
    `;

    if (!tRows || tRows.length === 0) return { error: 'Transaksi tidak ditemukan' };
    const transaction = tRows[0];

    if (transaction.status === newStatus) return { success: true };

    // Jika status diubah menjadi CANCELLED: kembalikan stok
    if (newStatus === 'CANCELLED') {
      const items = await sql`
        SELECT product_id, quantity
        FROM public.transaction_items
        WHERE transaction_id = ${transactionId};
      `;

      for (const item of items) {
        const pRows = await sql`SELECT stock FROM public.products WHERE id = ${item.product_id} LIMIT 1;`;
        if (pRows && pRows.length > 0) {
          const oldStock = Number(pRows[0].stock);
          const newStock = oldStock + Number(item.quantity);

          await sql`
            UPDATE public.products
            SET stock = ${newStock}, updated_at = NOW()
            WHERE id = ${item.product_id};
          `;

          await sql`
            INSERT INTO public.stock_adjustments (product_id, adjusted_by, old_stock, new_stock, reason)
            VALUES (
              ${item.product_id},
              ${user.id},
              ${oldStock},
              ${newStock},
              ${'RESTOCK: Admin batalkan transaksi ' + transaction.invoice_number}
            );
          `;
        }
      }
    }

    await sql`
      UPDATE public.transactions
      SET status = ${newStatus}::transaction_status
      WHERE id = ${transactionId};
    `;

    revalidatePath('/admin/transactions');
    revalidatePath('/sales/history');
    return { success: true };
  } catch (error: any) {
    console.error('Error in updateTransactionStatus:', error);
    return { error: error.message };
  }
}

// ============================================================
// GET PAGINATED TRANSACTIONS (admin)
// ============================================================
export async function getPaginatedTransactions({
  page = 1,
  pageSize = 10,
  search = '',
  status = 'ALL'
}: {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
}) {
  try {
    const offset = (page - 1) * pageSize;
    const searchPattern = search.trim() ? `%${search.trim().toLowerCase()}%` : null;
    const statusFilter = status !== 'ALL' ? status : null;

    const countRows = await sql`
      SELECT COUNT(*)::int as total
      FROM public.transactions t
      LEFT JOIN public.outlets o ON t.outlet_id = o.id
      WHERE 
        (${statusFilter}::text IS NULL OR t.status::text = ${statusFilter})
        AND (${searchPattern}::text IS NULL OR (
          LOWER(t.invoice_number) LIKE ${searchPattern}
          OR LOWER(COALESCE(o.name, '')) LIKE ${searchPattern}
        ));
    `;

    const total = countRows[0]?.total || 0;

    const rows = await sql`
      SELECT 
        t.id, t.invoice_number, t.sales_id, t.outlet_id, t.subtotal, t.discount, 
        t.total_price, t.payment_method, t.status, t.payment_status, t.paid_amount, 
        t.due_date, t.lat, t.lng, t.created_at, t.updated_at,
        json_build_object('name', o.name, 'address', o.address, 'type', o.type) as outlet,
        json_build_object('full_name', p.full_name) as sales
      FROM public.transactions t
      LEFT JOIN public.outlets o ON t.outlet_id = o.id
      LEFT JOIN public.profiles p ON t.sales_id = p.id
      WHERE 
        (${statusFilter}::text IS NULL OR t.status::text = ${statusFilter})
        AND (${searchPattern}::text IS NULL OR (
          LOWER(t.invoice_number) LIKE ${searchPattern}
          OR LOWER(COALESCE(o.name, '')) LIKE ${searchPattern}
        ))
      ORDER BY t.created_at DESC
      LIMIT ${pageSize} OFFSET ${offset};
    `;

    return {
      data: rows as any[],
      totalCount: total,
      totalPages: Math.ceil(total / pageSize)
    };
  } catch (error: any) {
    console.error('Error fetching transactions:', error);
    return { data: [], totalCount: 0, totalPages: 0 };
  }
}

// ============================================================
// GET ALL TRANSACTIONS (for export)
// ============================================================
export async function getAllTransactions() {
  try {
    const rows = await sql`
      SELECT 
        t.id, t.invoice_number, t.sales_id, t.outlet_id, t.subtotal, t.discount, 
        t.total_price, t.payment_method, t.status, t.payment_status, t.paid_amount, 
        t.due_date, t.lat, t.lng, t.created_at, t.updated_at,
        json_build_object('name', o.name, 'address', o.address, 'type', o.type) as outlet,
        json_build_object('full_name', p.full_name) as sales
      FROM public.transactions t
      LEFT JOIN public.outlets o ON t.outlet_id = o.id
      LEFT JOIN public.profiles p ON t.sales_id = p.id
      ORDER BY t.created_at DESC;
    `;
    return { data: rows as any[] };
  } catch (error: any) {
    return { error: error.message };
  }
}

// ============================================================
// CREATE SALES TRANSACTION (with items & auto promo to ACTIVE)
// ============================================================
export async function createSalesTransaction(payload: {
  transactionData: {
    sales_id?: string;
    outlet_id: string;
    subtotal: number;
    discount: number;
    total_price: number;
    payment_method: string;
    status: string;
    payment_status?: string;
    paid_amount?: number;
    due_date?: string | null;
    lat: number;
    lng: number;
    photo_url?: string;
  };
  itemsData: {
    product_id: string;
    quantity: number;
    price_at_sale: number;
  }[];
}) {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    const t = payload.transactionData;
    const salesId = user.id;

    // 1. Insert transaction (generate_invoice_number trigger runs automatically)
    const rows = await sql`
      INSERT INTO public.transactions (
        sales_id, outlet_id, subtotal, discount, total_price,
        payment_method, status, payment_status, paid_amount, due_date,
        lat, lng, photo_url
      ) VALUES (
        ${salesId},
        ${t.outlet_id},
        ${t.subtotal},
        ${t.discount},
        ${t.total_price},
        ${t.payment_method}::payment_method,
        ${t.status || 'PENDING'}::transaction_status,
        ${t.payment_status || 'UNPAID'}::payment_status,
        ${t.paid_amount || 0},
        ${t.due_date ? t.due_date : null},
        ${t.lat},
        ${t.lng},
        ${t.photo_url || null}
      )
      RETURNING id, invoice_number;
    `;

    const newTxn = rows[0];

    // 2. Batch insert transaction items (1 single query)
    if (payload.itemsData && payload.itemsData.length > 0) {
      await sql`
        INSERT INTO public.transaction_items (transaction_id, product_id, quantity, price_at_sale)
        SELECT 
          ${newTxn.id},
          (item->>'product_id')::uuid,
          (item->>'quantity')::int,
          (item->>'price_at_sale')::int
        FROM json_array_elements(${JSON.stringify(payload.itemsData)}::json) AS item;
      `;
    }

    // 3. Promote outlet to ACTIVE if was PROSPECT
    await sql`
      UPDATE public.outlets
      SET status = 'ACTIVE', updated_at = NOW()
      WHERE id = ${t.outlet_id} AND status = 'PROSPECT';
    `;

    revalidatePath('/sales/history');
    revalidatePath('/admin/transactions');
    return newTxn;
  } catch (error: any) {
    console.error('Error in createSalesTransaction:', error);
    throw error;
  }
}

// ============================================================
// GET POS CATALOG SYNC DATA (Offline Sync helper)
// ============================================================
export async function getPOSCatalogSyncData() {
  try {
    const [products, categories, outlets] = await Promise.all([
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
      sql`SELECT * FROM public.outlets WHERE is_active = true ORDER BY name ASC;`,
    ]);

    return {
      products: products as any[],
      categories: categories as any[],
      outlets: outlets as any[],
    };
  } catch (error) {
    console.error('Error in getPOSCatalogSyncData:', error);
    return { products: [], categories: [], outlets: [] };
  }
}

// ============================================================
// GET SALES TRANSACTION HISTORY
// ============================================================
export async function getSalesTransactionHistory({
  page = 0,
  pageSize = 20,
  searchQuery = '',
  statusFilter = 'ALL',
}: {
  page?: number;
  pageSize?: number;
  searchQuery?: string;
  statusFilter?: string;
} = {}) {
  try {
    const user = await getCurrentUser();
    if (!user) return { data: [], count: 0, hasMore: false };

    const offset = page * pageSize;
    const searchPattern = searchQuery.trim() ? `%${searchQuery.trim().toLowerCase()}%` : null;
    const status = statusFilter !== 'ALL' ? statusFilter : null;

    const countRows = await sql`
      SELECT COUNT(*)::int as total
      FROM public.transactions t
      LEFT JOIN public.outlets o ON t.outlet_id = o.id
      WHERE t.sales_id = ${user.id}
        AND (${status}::text IS NULL OR t.status::text = ${status})
        AND (${searchPattern}::text IS NULL OR (
          LOWER(t.invoice_number) LIKE ${searchPattern}
          OR LOWER(COALESCE(o.name, '')) LIKE ${searchPattern}
        ));
    `;
    const total = countRows[0]?.total || 0;

    const rows = await sql`
      SELECT 
        t.id, t.invoice_number, t.sales_id, t.outlet_id, t.subtotal, t.discount, 
        t.total_price, t.payment_method, t.status, t.payment_status, t.paid_amount, 
        t.due_date, t.lat, t.lng, t.created_at, t.updated_at,
        json_build_object('id', o.id, 'name', o.name, 'address', o.address, 'type', o.type) as outlet,
        json_build_object('id', p.id, 'full_name', p.full_name) as sales
      FROM public.transactions t
      LEFT JOIN public.outlets o ON t.outlet_id = o.id
      LEFT JOIN public.profiles p ON t.sales_id = p.id
      WHERE t.sales_id = ${user.id}
        AND (${status}::text IS NULL OR t.status::text = ${status})
        AND (${searchPattern}::text IS NULL OR (
          LOWER(t.invoice_number) LIKE ${searchPattern}
          OR LOWER(COALESCE(o.name, '')) LIKE ${searchPattern}
        ))
      ORDER BY t.created_at DESC
      LIMIT ${pageSize} OFFSET ${offset};
    `;

    return {
      data: rows as any[],
      count: total,
      hasMore: offset + rows.length < total
    };
  } catch (error: any) {
    console.error('Error in getSalesTransactionHistory:', error);
    return { data: [], count: 0, hasMore: false };
  }
}

// ============================================================
// GET TRANSACTION DETAIL (FULL INCLUDING PHOTO)
// ============================================================
export async function getTransactionDetail(transactionId: string) {
  try {
    const rows = await sql`
      SELECT 
        t.*,
        json_build_object('id', o.id, 'name', o.name, 'address', o.address, 'type', o.type) as outlet,
        json_build_object('id', p.id, 'full_name', p.full_name) as sales
      FROM public.transactions t
      LEFT JOIN public.outlets o ON t.outlet_id = o.id
      LEFT JOIN public.profiles p ON t.sales_id = p.id
      WHERE t.id = ${transactionId}
      LIMIT 1;
    `;
    return { data: rows[0] || null };
  } catch (error: any) {
    console.error('Error in getTransactionDetail:', error);
    return { error: error.message, data: null };
  }
}

// ============================================================
// GET TRANSACTION ITEMS
// ============================================================
export async function getTransactionItems(transactionId: string) {
  try {
    const rows = await sql`
      SELECT 
        ti.*,
        json_build_object('id', p.id, 'name', p.name, 'sku', p.sku) as product
      FROM public.transaction_items ti
      LEFT JOIN public.products p ON ti.product_id = p.id
      WHERE ti.transaction_id = ${transactionId}
      ORDER BY ti.created_at ASC;
    `;
    return { data: rows as any[] };
  } catch (error: any) {
    console.error('Error in getTransactionItems:', error);
    return { error: error.message, data: [] };
  }
}

// ============================================================
// GET TODAY TRANSACTION LOCATIONS (FOR ADMIN MAP)
// ============================================================
export async function getTodayTransactionLocations() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const rows = await sql`
      SELECT 
        t.*,
        json_build_object('name', o.name, 'address', o.address) as outlet,
        json_build_object('full_name', p.full_name) as sales
      FROM public.transactions t
      LEFT JOIN public.outlets o ON t.outlet_id = o.id
      LEFT JOIN public.profiles p ON t.sales_id = p.id
      WHERE t.lat IS NOT NULL 
        AND t.lng IS NOT NULL 
        AND t.created_at >= ${today.toISOString()}::timestamptz
      ORDER BY t.created_at DESC;
    `;
    return { data: rows as any[] };
  } catch (error: any) {
    console.error('Error in getTodayTransactionLocations:', error);
    return { data: [] };
  }
}


