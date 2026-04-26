'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { PaymentStatus, PaymentMethod } from '@/types';

/**
 * Fetch all transactions that have outstanding balances (Piutang)
 */
export async function getReceivables() {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('transactions')
    .select(`
      *,
      outlet:outlets(id, name, type, address),
      sales:profiles!sales_id(id, full_name),
      payments:transaction_payments(*)
    `)
    .eq('payment_method', 'CREDIT')
    .order('due_date', { ascending: true });

  if (error) {
    console.error('Error fetching receivables:', error);
    return [];
  }

  return data;
}

/**
 * Record a new payment/installment for a transaction
 */
export async function addPayment(formData: FormData) {
  const supabase = await createClient();
  
  const transactionId = formData.get('transactionId') as string;
  const amount = parseFloat(formData.get('amount') as string);
  const paymentMethod = formData.get('paymentMethod') as PaymentMethod;
  const notes = formData.get('notes') as string;
  const proofFile = formData.get('proofFile') as File | null;

  if (!transactionId || isNaN(amount)) throw new Error('Invalid payment data');
  
  // 1. Get current user (Admin)
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // 1.5. Handle Proof of Payment Upload if exists
  let proofUrl = null;
  if (paymentMethod === 'TRANSFER' && proofFile && proofFile.size > 0) {
    const fileExt = proofFile.name.split('.').pop();
    const fileName = `${user.id}/${Date.now()}_proof.${fileExt}`;
    
    const { error: uploadError } = await supabase.storage
      .from('transaction-photos')
      .upload(fileName, proofFile, {
        contentType: proofFile.type,
        upsert: false
      });

    if (uploadError) throw new Error(`Proof upload failed: ${uploadError.message}`);

    const { data: { publicUrl } } = supabase.storage
      .from('transaction-photos')
      .getPublicUrl(fileName);
    
    proofUrl = publicUrl;
  }

  // 2. Insert payment record
  const { error: paymentError } = await supabase
    .from('transaction_payments')
    .insert({
      transaction_id: transactionId,
      amount: amount,
      payment_method: paymentMethod,
      notes: notes,
      proof_url: proofUrl,
      recorded_by: user.id,
      payment_date: new Date().toISOString(),
    });

  if (paymentError) throw paymentError;

  // 3. Update transaction paid_amount & status
  // Get current transaction
  const { data: transaction } = await supabase
    .from('transactions')
    .select('paid_amount, total_price')
    .eq('id', transactionId)
    .single();

  if (!transaction) throw new Error('Transaction not found');

  const newPaidAmount = (transaction.paid_amount || 0) + amount;
  let newStatus: PaymentStatus = 'PARTIAL';
  
  if (newPaidAmount >= transaction.total_price) {
    newStatus = 'PAID';
  }

  const { error: updateError } = await supabase
    .from('transactions')
    .update({
      paid_amount: newPaidAmount,
      payment_status: newStatus,
    })
    .eq('id', transactionId);

  if (updateError) throw updateError;


  revalidatePath('/admin/receivables');
  return { success: true };
}

// ============================================================
// GET PAGINATED RECEIVABLES (admin)
// ============================================================
export async function getPaginatedReceivables({
  page = 1,
  pageSize = 10,
  search = '',
  type = 'ACTIVE'
}: {
  page?: number;
  pageSize?: number;
  search?: string;
  type?: 'ACTIVE' | 'COMPLETED';
}) {
  const supabase = await createClient();
  
  let query = supabase
    .from('transactions')
    .select(`
      *,
      outlet:outlets(id, name, type, address),
      sales:profiles!sales_id(id, full_name),
      payments:transaction_payments(*)
    `, { count: 'exact' })
    .eq('payment_method', 'CREDIT');

  // Filter status
  if (type === 'ACTIVE') {
    query = query.neq('payment_status', 'PAID');
  } else {
    query = query.eq('payment_status', 'PAID');
  }

  // Search filter
  if (search) {
    query = query.or(`invoice_number.ilike.%${search}%,outlet_id.in.(select id from outlets where name.ilike.%${search}%)`);
  }

  // Pagination & Order
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, count, error } = await query
    .order(type === 'ACTIVE' ? 'due_date' : 'created_at', { ascending: type === 'ACTIVE' })
    .range(from, to);

  if (error) {
    console.error('Error fetching receivables:', error);
    return { data: [], totalCount: 0, totalPages: 0 };
  }

  return {
    data: data as any[],
    totalCount: count ?? 0,
    totalPages: Math.ceil((count ?? 0) / pageSize)
  };
}
