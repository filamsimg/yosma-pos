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
    .in('payment_status', ['UNPAID', 'PARTIAL'])
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
export async function addPayment(data: {
  transactionId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  notes?: string;
}) {
  const supabase = await createClient();
  
  // 1. Get current user (Admin)
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // 2. Insert payment record
  const { error: paymentError } = await supabase
    .from('transaction_payments')
    .insert({
      transaction_id: data.transactionId,
      amount: data.amount,
      payment_method: data.paymentMethod,
      notes: data.notes,
      recorded_by: user.id,
      payment_date: new Date().toISOString(),
    });

  if (paymentError) throw paymentError;

  // 3. Update transaction paid_amount & status
  // Get current transaction
  const { data: transaction } = await supabase
    .from('transactions')
    .select('paid_amount, total_price')
    .eq('id', data.transactionId)
    .single();

  if (!transaction) throw new Error('Transaction not found');

  const newPaidAmount = (transaction.paid_amount || 0) + data.amount;
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
    .eq('id', data.transactionId);

  if (updateError) throw updateError;

  revalidatePath('/admin/receivables');
  return { success: true };
}
