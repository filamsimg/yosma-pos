-- ============================================================
-- Migration: Edit Pesanan & Status Workflow
-- Jalankan di Supabase SQL Editor
-- ============================================================

-- 1. Ubah default status transaksi dari COMPLETED ke PENDING
--    (Transaksi baru dari sales akan berstatus PENDING dulu)
ALTER TABLE public.transactions 
  ALTER COLUMN status SET DEFAULT 'PENDING';

-- 2. Policy: Sales bisa update transaksi PENDING miliknya sendiri
--    (untuk update status, total, due_date saat edit items)
DO $$ BEGIN
  DROP POLICY IF EXISTS "transactions_update_sales_pending" ON public.transactions;
  CREATE POLICY "transactions_update_sales_pending"
    ON public.transactions FOR UPDATE
    TO authenticated
    USING (sales_id = auth.uid() AND status = 'PENDING')
    WITH CHECK (sales_id = auth.uid());
END $$;

-- 3. Policy: Sales bisa hapus item dari transaksi PENDING miliknya
DO $$ BEGIN
  DROP POLICY IF EXISTS "transaction_items_delete_sales_pending" ON public.transaction_items;
  CREATE POLICY "transaction_items_delete_sales_pending"
    ON public.transaction_items FOR DELETE
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM public.transactions t
        WHERE t.id = transaction_id
          AND t.sales_id = auth.uid()
          AND t.status = 'PENDING'
      )
    );
END $$;

-- 4. Policy: Admin bisa hapus item dari transaksi manapun
DO $$ BEGIN
  DROP POLICY IF EXISTS "transaction_items_delete_admin" ON public.transaction_items;
  CREATE POLICY "transaction_items_delete_admin"
    ON public.transaction_items FOR DELETE
    TO authenticated
    USING (public.get_my_role() = 'ADMIN');
END $$;

-- ============================================================
-- SELESAI. Lanjutkan dengan deploy kode aplikasi.
-- ============================================================
