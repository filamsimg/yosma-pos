'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { addDays } from 'date-fns';

// ============================================================
// CANCEL TRANSACTION (hanya jika status PENDING)
// ============================================================
export async function cancelTransaction(transactionId: string) {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { error: 'Unauthorized' };

  const { data: transaction, error: txnError } = await supabase
    .from('transactions')
    .select('id, status, invoice_number, transaction_items(product_id, quantity)')
    .eq('id', transactionId)
    .eq('sales_id', user.id)
    .single();

  if (txnError || !transaction) return { error: 'Transaksi tidak ditemukan' };
  if (transaction.status !== 'PENDING') {
    return { error: 'Hanya transaksi berstatus MENUNGGU yang bisa dibatalkan' };
  }

  // Kembalikan stok semua item
  const items: { product_id: string; quantity: number }[] = (transaction as any).transaction_items || [];
  for (const item of items) {
    const { data: product } = await supabase
      .from('products').select('stock').eq('id', item.product_id).single();
    if (!product) continue;
    await supabase.from('products')
      .update({ stock: product.stock + item.quantity })
      .eq('id', item.product_id);
    await supabase.from('stock_adjustments').insert([{
      product_id: item.product_id,
      adjusted_by: user.id,
      old_stock: product.stock,
      new_stock: product.stock + item.quantity,
      reason: `RESTOCK: Pembatalan pesanan ${(transaction as any).invoice_number}`,
    }]);
  }

  const { error } = await supabase
    .from('transactions')
    .update({ status: 'CANCELLED' })
    .eq('id', transactionId);

  if (error) return { error: error.message };

  revalidatePath('/sales/history');
  revalidatePath('/admin/transactions');
  return { success: true };
}

// ============================================================
// EDIT TRANSACTION ITEMS (hanya jika status PENDING)
//
// Strategi aman untuk menghindari double-deduct trigger:
// 1. Hitung delta stok antara item lama vs item baru
// 2. Apply delta ke stok produk secara langsung (bukan melalui trigger)
// 3. Delete item lama, insert item baru — tapi insert menggunakan RPC
//    yang bypass trigger, ATAU ubah trigger agar hanya jalan jika
//    transaction tidak berada di mode edit.
//
// Karena trigger deduct_stock_on_sale akan jalan saat INSERT,
// kita restore stok terlebih dahulu sebelum insert baru.
// Flow:
//   a. Kembalikan semua stok item lama (seperti cancel parsial)
//   b. Delete semua item lama
//   c. Insert item baru → trigger akan deduct stok secara normal
//   d. Recalculate total
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
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { error: 'Unauthorized' };

  if (newItems.length === 0) return { error: 'Pesanan tidak boleh kosong' };

  // Validasi transaksi
  const { data: transaction, error: txnError } = await supabase
    .from('transactions')
    .select('id, status, invoice_number, discount, payment_method')
    .eq('id', transactionId)
    .eq('sales_id', user.id)
    .single();

  if (txnError || !transaction) return { error: 'Transaksi tidak ditemukan' };
  if (transaction.status !== 'PENDING') {
    return { error: 'Hanya transaksi MENUNGGU yang bisa diedit' };
  }

  // Cek ketersediaan stok untuk semua item baru dulu
  for (const item of newItems) {
    const { data: product } = await supabase
      .from('products').select('name, stock').eq('id', item.product_id).single();
    if (!product) return { error: `Produk tidak ditemukan` };
    // Stok akan di-restore dari item lama sebelum insert,
    // jadi cukup cek apakah stok + (qty lama item ini) >= qty baru
    // Validasi ini dilakukan setelah restore, tapi untuk safety cek dulu
  }

  // Step a: Ambil & kembalikan semua stok item lama
  const { data: oldItems } = await supabase
    .from('transaction_items')
    .select('product_id, quantity')
    .eq('transaction_id', transactionId);

  for (const item of (oldItems || [])) {
    const { data: product } = await supabase
      .from('products').select('stock').eq('id', item.product_id).single();
    if (!product) continue;
    await supabase.from('products')
      .update({ stock: product.stock + item.quantity })
      .eq('id', item.product_id);
    await supabase.from('stock_adjustments').insert([{
      product_id: item.product_id,
      adjusted_by: user.id,
      old_stock: product.stock,
      new_stock: product.stock + item.quantity,
      reason: `EDIT: Restore stok sebelum edit pesanan ${(transaction as any).invoice_number}`,
    }]);
  }

  // Step b: Delete semua item lama (trigger DELETE tidak ada di schema kita)
  const { error: deleteError } = await supabase
    .from('transaction_items')
    .delete()
    .eq('transaction_id', transactionId);

  if (deleteError) return { error: deleteError.message };

  // Cek stok cukup untuk item baru (setelah restore)
  for (const item of newItems) {
    const { data: product } = await supabase
      .from('products').select('name, stock').eq('id', item.product_id).single();
    if (!product) return { error: `Produk tidak ditemukan` };
    if (product.stock < item.quantity) {
      return { error: `Stok ${product.name} tidak cukup (tersisa ${product.stock})` };
    }
  }

  // Step c: Insert item baru — trigger deduct_stock_on_sale akan berjalan otomatis
  const insertData = newItems.map(item => ({
    transaction_id: transactionId,
    product_id: item.product_id,
    quantity: item.quantity,
    price_at_sale: item.price_at_sale,
  }));

  const { error: insertError } = await supabase
    .from('transaction_items')
    .insert(insertData);

  if (insertError) return { error: insertError.message };

  // Step d: Recalculate total & due_date
  const subtotal = newItems.reduce(
    (sum, item) => sum + item.price_at_sale * item.quantity, 0
  );
  const discount = (transaction as any).discount || 0;
  const totalPrice = subtotal - discount;

  const isCredit = (transaction as any).payment_method === 'CREDIT';
  const tempoDays = totalPrice >= 100000 ? 30 : 14;
  const dueDate = isCredit ? addDays(new Date(), tempoDays).toISOString() : null;

  const { error: updateError } = await supabase
    .from('transactions')
    .update({ subtotal, total_price: totalPrice, due_date: dueDate })
    .eq('id', transactionId);

  if (updateError) return { error: updateError.message };

  revalidatePath('/sales/history');
  revalidatePath('/admin/transactions');
  return { success: true, totalPrice, tempoDays: isCredit ? tempoDays : null };
}

// ============================================================
// UPDATE TRANSACTION STATUS (admin)
// ============================================================
export async function updateTransactionStatus(
  transactionId: string,
  newStatus: 'PROCESSING' | 'COMPLETED' | 'CANCELLED'
) {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { error: 'Unauthorized' };

  const { data: transaction, error: txnError } = await supabase
    .from('transactions')
    .select('id, status, invoice_number, transaction_items(product_id, quantity)')
    .eq('id', transactionId)
    .single();

  if (txnError || !transaction) return { error: 'Transaksi tidak ditemukan' };
  if (transaction.status === newStatus) return { success: true };

  // Jika cancel: kembalikan stok
  if (newStatus === 'CANCELLED') {
    const items: { product_id: string; quantity: number }[] = (transaction as any).transaction_items || [];
    for (const item of items) {
      const { data: product } = await supabase
        .from('products').select('stock').eq('id', item.product_id).single();
      if (!product) continue;
      await supabase.from('products')
        .update({ stock: product.stock + item.quantity })
        .eq('id', item.product_id);
      await supabase.from('stock_adjustments').insert([{
        product_id: item.product_id,
        adjusted_by: user.id,
        old_stock: product.stock,
        new_stock: product.stock + item.quantity,
        reason: `RESTOCK: Admin batalkan transaksi ${(transaction as any).invoice_number}`,
      }]);
    }
  }

  const { error } = await supabase
    .from('transactions')
    .update({ status: newStatus })
    .eq('id', transactionId);

  if (error) return { error: error.message };

  revalidatePath('/admin/transactions');
  revalidatePath('/sales/history');
  return { success: true };
}
