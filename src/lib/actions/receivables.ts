'use server';

import { sql } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth/session';
import { uploadImageFile } from '@/lib/storage';
import { revalidatePath } from 'next/cache';
import type { PaymentStatus, PaymentMethod } from '@/types';

/**
 * Fetch all transactions that have outstanding balances (Piutang)
 */
export async function getReceivables() {
  try {
    const rows = await sql`
      SELECT 
        t.id, t.invoice_number, t.sales_id, t.outlet_id, t.subtotal, t.discount, 
        t.total_price, t.payment_method, t.status, t.payment_status, t.paid_amount, 
        t.due_date, t.lat, t.lng, t.created_at, t.updated_at,
        json_build_object('id', o.id, 'name', o.name, 'type', o.type, 'address', o.address) as outlet,
        json_build_object('id', p.id, 'full_name', p.full_name) as sales,
        COALESCE(
          (
            SELECT json_agg(
              json_build_object(
                'id', pay.id,
                'amount', pay.amount,
                'payment_method', pay.payment_method,
                'notes', pay.notes,
                'recorded_by', pay.recorded_by,
                'payment_date', pay.payment_date
              )
            ) 
            FROM public.transaction_payments pay 
            WHERE pay.transaction_id = t.id
          ),
          '[]'::json
        ) as payments
      FROM public.transactions t
      LEFT JOIN public.outlets o ON t.outlet_id = o.id
      LEFT JOIN public.profiles p ON t.sales_id = p.id
      WHERE t.payment_method = 'CREDIT'
      ORDER BY t.due_date ASC;
    `;

    return rows as any[];
  } catch (error) {
    console.error('Error fetching receivables:', error);
    return [];
  }
}

/**
 * Record a new payment/installment for a transaction
 */
export async function addPayment(formData: FormData) {
  const transactionId = formData.get('transactionId') as string;
  const amount = parseFloat(formData.get('amount') as string);
  const paymentMethod = formData.get('paymentMethod') as PaymentMethod;
  const notes = formData.get('notes') as string;
  const proofFile = formData.get('proofFile') as File | null;

  if (!transactionId || isNaN(amount)) throw new Error('Invalid payment data');

  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  let proofUrl: string | null = null;
  if (paymentMethod === 'TRANSFER' && proofFile && proofFile.size > 0) {
    try {
      proofUrl = await uploadImageFile(proofFile);
    } catch (err: any) {
      console.error('Failed to process payment proof:', err);
    }
  }

  // 1. Insert payment record
  await sql`
    INSERT INTO public.transaction_payments (
      transaction_id, amount, payment_method, notes, proof_url, recorded_by, payment_date
    ) VALUES (
      ${transactionId}, ${amount}, ${paymentMethod}::payment_method,
      ${notes || null}, ${proofUrl}, ${user.id}, NOW()
    );
  `;

  // 2. Update transaction paid_amount & status
  const tRows = await sql`
    SELECT paid_amount, total_price FROM public.transactions WHERE id = ${transactionId} LIMIT 1;
  `;

  if (!tRows || tRows.length === 0) throw new Error('Transaction not found');
  const transaction = tRows[0];

  const newPaidAmount = Number(transaction.paid_amount || 0) + amount;
  let newStatus: PaymentStatus = 'PARTIAL';

  if (newPaidAmount >= Number(transaction.total_price)) {
    newStatus = 'PAID';
  }

  await sql`
    UPDATE public.transactions
    SET paid_amount = ${newPaidAmount}, payment_status = ${newStatus}::payment_status
    WHERE id = ${transactionId};
  `;

  revalidatePath('/admin/receivables');
  return { success: true };
}

/**
 * Get paginated receivables for admin
 */
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
  try {
    const offset = (page - 1) * pageSize;
    const searchPattern = search.trim() ? `%${search.trim().toLowerCase()}%` : null;

    const countRows = await sql`
      SELECT COUNT(*)::int as total
      FROM public.transactions t
      LEFT JOIN public.outlets o ON t.outlet_id = o.id
      WHERE 
        t.payment_method = 'CREDIT'
        AND (${type === 'ACTIVE'}::boolean = true AND t.payment_status != 'PAID' OR ${type === 'COMPLETED'}::boolean = true AND t.payment_status = 'PAID')
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
        json_build_object('id', o.id, 'name', o.name, 'type', o.type, 'address', o.address) as outlet,
        json_build_object('id', p.id, 'full_name', p.full_name) as sales,
        COALESCE(
          (
            SELECT json_agg(
              json_build_object(
                'id', pay.id,
                'amount', pay.amount,
                'payment_method', pay.payment_method,
                'notes', pay.notes,
                'recorded_by', pay.recorded_by,
                'payment_date', pay.payment_date
              )
            ) 
            FROM public.transaction_payments pay 
            WHERE pay.transaction_id = t.id
          ),
          '[]'::json
        ) as payments
      FROM public.transactions t
      LEFT JOIN public.outlets o ON t.outlet_id = o.id
      LEFT JOIN public.profiles p ON t.sales_id = p.id
      WHERE 
        t.payment_method = 'CREDIT'
        AND (${type === 'ACTIVE'}::boolean = true AND t.payment_status != 'PAID' OR ${type === 'COMPLETED'}::boolean = true AND t.payment_status = 'PAID')
        AND (${searchPattern}::text IS NULL OR (
          LOWER(t.invoice_number) LIKE ${searchPattern}
          OR LOWER(COALESCE(o.name, '')) LIKE ${searchPattern}
        ))
      ORDER BY ${type === 'ACTIVE'}::boolean ? t.due_date : t.created_at DESC
      LIMIT ${pageSize} OFFSET ${offset};
    `;

    return {
      data: rows as any[],
      totalCount: total,
      totalPages: Math.ceil(total / pageSize)
    };
  } catch (error) {
    console.error('Error fetching paginated receivables:', error);
    return { data: [], totalCount: 0, totalPages: 0 };
  }
}
