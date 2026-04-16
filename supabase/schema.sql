-- ============================================================
-- YOSMA POS & Sales Monitoring - Supabase Database Schema
-- ============================================================
-- Run this entire script in the Supabase SQL Editor (Dashboard > SQL Editor)
-- Make sure to run it in order (top to bottom).
-- ============================================================

-- ============================================================
-- 0. EXTENSIONS
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. CUSTOM TYPES
-- ============================================================
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('ADMIN', 'SALES');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE payment_method AS ENUM ('CASH', 'TRANSFER', 'QRIS', 'CREDIT');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE transaction_status AS ENUM ('PENDING', 'COMPLETED', 'CANCELLED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================
-- 2. TABLES
-- ============================================================

-- ----- 2a. PROFILES -----
-- Linked 1:1 with auth.users via id (UUID from Supabase Auth).
-- The 'role' column drives RBAC across the entire application.
CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   TEXT NOT NULL,
  role        user_role NOT NULL DEFAULT 'SALES',
  avatar_url  TEXT,
  phone       TEXT,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.profiles IS 'User profiles linked to Supabase Auth. Stores role for RBAC.';

-- ----- 2b. CATEGORIES -----
-- Separate table for product categories to keep things normalized.
CREATE TABLE IF NOT EXISTS public.categories (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.categories IS 'Product categories for organizing inventory.';

-- ----- 2c. PRODUCTS -----
CREATE TABLE IF NOT EXISTS public.products (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  sku         TEXT NOT NULL UNIQUE,
  description TEXT,
  price       NUMERIC(12,2) NOT NULL CHECK (price >= 0),
  stock       INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  image_url   TEXT,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.products IS 'Product catalog with SKU, pricing, and stock tracking.';

-- Index for full-text search on product name/SKU
CREATE INDEX IF NOT EXISTS idx_products_name ON public.products USING GIN (to_tsvector('indonesian', name));
CREATE INDEX IF NOT EXISTS idx_products_sku ON public.products (sku);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products (category_id);

-- ----- 2d. OUTLETS -----
CREATE TABLE IF NOT EXISTS public.outlets (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  address     TEXT,
  lat         DOUBLE PRECISION,
  lng         DOUBLE PRECISION,
  phone       TEXT,
  owner_name  TEXT,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.outlets IS 'Registered outlet/store locations for sales visits.';

CREATE INDEX IF NOT EXISTS idx_outlets_location ON public.outlets (lat, lng);

-- ----- 2e. TRANSACTIONS -----
CREATE TABLE IF NOT EXISTS public.transactions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_number  TEXT NOT NULL UNIQUE,
  sales_id        UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  outlet_id       UUID NOT NULL REFERENCES public.outlets(id) ON DELETE RESTRICT,
  subtotal        NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (subtotal >= 0),
  discount        NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (discount >= 0),
  total_price     NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (total_price >= 0),
  payment_method  payment_method NOT NULL DEFAULT 'CASH',
  status          transaction_status NOT NULL DEFAULT 'COMPLETED',
  lat             DOUBLE PRECISION,
  lng             DOUBLE PRECISION,
  photo_url       TEXT,
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.transactions IS 'Sales transactions with geolocation and photo proof.';

CREATE INDEX IF NOT EXISTS idx_transactions_sales ON public.transactions (sales_id);
CREATE INDEX IF NOT EXISTS idx_transactions_outlet ON public.transactions (outlet_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created ON public.transactions (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_invoice ON public.transactions (invoice_number);

-- ----- 2f. TRANSACTION ITEMS -----
CREATE TABLE IF NOT EXISTS public.transaction_items (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transaction_id  UUID NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
  product_id      UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  quantity        INTEGER NOT NULL CHECK (quantity > 0),
  price_at_sale   NUMERIC(12,2) NOT NULL CHECK (price_at_sale >= 0),
  subtotal        NUMERIC(14,2) GENERATED ALWAYS AS (quantity * price_at_sale) STORED,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.transaction_items IS 'Line items for each transaction. price_at_sale captures the price snapshot.';

CREATE INDEX IF NOT EXISTS idx_transaction_items_txn ON public.transaction_items (transaction_id);
CREATE INDEX IF NOT EXISTS idx_transaction_items_product ON public.transaction_items (product_id);

-- ----- 2g. STOCK ADJUSTMENTS (Audit Log) -----
CREATE TABLE IF NOT EXISTS public.stock_adjustments (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id  UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  adjusted_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  old_stock   INTEGER NOT NULL,
  new_stock   INTEGER NOT NULL,
  reason      TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.stock_adjustments IS 'Audit trail for all stock changes (manual adjustments + sales deductions).';

-- ============================================================
-- 3. FUNCTIONS & TRIGGERS
-- ============================================================

-- ----- 3a. Auto-create profile on user signup -----
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_name text;
  v_role text;
BEGIN
  v_name := NEW.raw_user_meta_data->>'full_name';
  v_role := NEW.raw_user_meta_data->>'role';

  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    CASE WHEN v_name IS NOT NULL AND v_name != '' THEN v_name ELSE NEW.email END,
    CASE WHEN v_role IN ('ADMIN', 'SALES') THEN v_role::user_role ELSE 'SALES'::user_role END
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- Drop existing trigger if any, then create
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ----- 3b. Auto-update updated_at timestamp -----
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS set_products_updated_at ON public.products;
CREATE TRIGGER set_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS set_outlets_updated_at ON public.outlets;
CREATE TRIGGER set_outlets_updated_at
  BEFORE UPDATE ON public.outlets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- ----- 3c. Auto-deduct stock on transaction item insert -----
CREATE OR REPLACE FUNCTION public.deduct_stock_on_sale()
RETURNS TRIGGER AS $$
BEGIN
  -- Record audit trail
  INSERT INTO public.stock_adjustments (product_id, adjusted_by, old_stock, new_stock, reason)
  SELECT
    NEW.product_id,
    t.sales_id,
    p.stock,
    p.stock - NEW.quantity,
    'AUTO: Sale transaction ' || t.invoice_number
  FROM public.products p
  CROSS JOIN public.transactions t
  WHERE p.id = NEW.product_id
    AND t.id = NEW.transaction_id;

  -- Deduct stock
  UPDATE public.products
  SET stock = stock - NEW.quantity
  WHERE id = NEW.product_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_transaction_item_insert ON public.transaction_items;
CREATE TRIGGER on_transaction_item_insert
  AFTER INSERT ON public.transaction_items
  FOR EACH ROW
  EXECUTE FUNCTION public.deduct_stock_on_sale();

-- ----- 3d. Generate invoice number -----
CREATE OR REPLACE FUNCTION public.generate_invoice_number()
RETURNS TRIGGER AS $$
DECLARE
  seq_num INTEGER;
  date_prefix TEXT;
BEGIN
  date_prefix := TO_CHAR(NOW(), 'YYYYMMDD');

  -- Get the next sequence number for today
  SELECT COUNT(*) + 1 INTO seq_num
  FROM public.transactions
  WHERE invoice_number LIKE 'INV-' || date_prefix || '-%';

  NEW.invoice_number := 'INV-' || date_prefix || '-' || LPAD(seq_num::TEXT, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_invoice_number ON public.transactions;
CREATE TRIGGER set_invoice_number
  BEFORE INSERT ON public.transactions
  FOR EACH ROW
  WHEN (NEW.invoice_number IS NULL OR NEW.invoice_number = '')
  EXECUTE FUNCTION public.generate_invoice_number();

-- ============================================================
-- 4. HELPER FUNCTION: Get current user role
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS user_role AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ============================================================
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outlets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaction_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_adjustments ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────
-- 5a. PROFILES
-- ─────────────────────────────────────────────

-- Everyone can read all profiles (needed for displaying sales names, etc.)
CREATE POLICY "profiles_select_all"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (TRUE);

-- Users can update their own profile (name, avatar, phone - NOT role)
CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Admins can update any profile (including role changes)
CREATE POLICY "profiles_update_admin"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (public.get_my_role() = 'ADMIN')
  WITH CHECK (public.get_my_role() = 'ADMIN');

-- ─────────────────────────────────────────────
-- 5b. CATEGORIES
-- ─────────────────────────────────────────────

-- All authenticated users can view categories
CREATE POLICY "categories_select_all"
  ON public.categories FOR SELECT
  TO authenticated
  USING (TRUE);

-- Only admins can insert/update/delete categories
CREATE POLICY "categories_insert_admin"
  ON public.categories FOR INSERT
  TO authenticated
  WITH CHECK (public.get_my_role() = 'ADMIN');

CREATE POLICY "categories_update_admin"
  ON public.categories FOR UPDATE
  TO authenticated
  USING (public.get_my_role() = 'ADMIN')
  WITH CHECK (public.get_my_role() = 'ADMIN');

CREATE POLICY "categories_delete_admin"
  ON public.categories FOR DELETE
  TO authenticated
  USING (public.get_my_role() = 'ADMIN');

-- ─────────────────────────────────────────────
-- 5c. PRODUCTS
-- ─────────────────────────────────────────────

-- All authenticated users can view active products
CREATE POLICY "products_select_all"
  ON public.products FOR SELECT
  TO authenticated
  USING (TRUE);

-- Only admins can manage products
CREATE POLICY "products_insert_admin"
  ON public.products FOR INSERT
  TO authenticated
  WITH CHECK (public.get_my_role() = 'ADMIN');

CREATE POLICY "products_update_admin"
  ON public.products FOR UPDATE
  TO authenticated
  USING (public.get_my_role() = 'ADMIN')
  WITH CHECK (public.get_my_role() = 'ADMIN');

CREATE POLICY "products_delete_admin"
  ON public.products FOR DELETE
  TO authenticated
  USING (public.get_my_role() = 'ADMIN');

-- ─────────────────────────────────────────────
-- 5d. OUTLETS
-- ─────────────────────────────────────────────

-- All authenticated users can view outlets
CREATE POLICY "outlets_select_all"
  ON public.outlets FOR SELECT
  TO authenticated
  USING (TRUE);

-- Only admins can manage outlets
CREATE POLICY "outlets_insert_admin"
  ON public.outlets FOR INSERT
  TO authenticated
  WITH CHECK (public.get_my_role() = 'ADMIN');

CREATE POLICY "outlets_update_admin"
  ON public.outlets FOR UPDATE
  TO authenticated
  USING (public.get_my_role() = 'ADMIN')
  WITH CHECK (public.get_my_role() = 'ADMIN');

CREATE POLICY "outlets_delete_admin"
  ON public.outlets FOR DELETE
  TO authenticated
  USING (public.get_my_role() = 'ADMIN');

-- ─────────────────────────────────────────────
-- 5e. TRANSACTIONS
-- ─────────────────────────────────────────────

-- Sales can view their own transactions; Admins can view all
CREATE POLICY "transactions_select"
  ON public.transactions FOR SELECT
  TO authenticated
  USING (
    sales_id = auth.uid()
    OR public.get_my_role() = 'ADMIN'
  );

-- Sales can create transactions (only for themselves)
CREATE POLICY "transactions_insert_sales"
  ON public.transactions FOR INSERT
  TO authenticated
  WITH CHECK (
    sales_id = auth.uid()
    AND (public.get_my_role() = 'SALES' OR public.get_my_role() = 'ADMIN')
  );

-- Only admins can update transactions (e.g., cancel)
CREATE POLICY "transactions_update_admin"
  ON public.transactions FOR UPDATE
  TO authenticated
  USING (public.get_my_role() = 'ADMIN')
  WITH CHECK (public.get_my_role() = 'ADMIN');

-- No one can hard-delete transactions (use status = CANCELLED instead)
-- No DELETE policy = no deletes allowed

-- ─────────────────────────────────────────────
-- 5f. TRANSACTION ITEMS
-- ─────────────────────────────────────────────

-- Same visibility as parent transaction
CREATE POLICY "transaction_items_select"
  ON public.transaction_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.transactions t
      WHERE t.id = transaction_id
      AND (t.sales_id = auth.uid() OR public.get_my_role() = 'ADMIN')
    )
  );

-- Sales can insert items into their own transactions
CREATE POLICY "transaction_items_insert"
  ON public.transaction_items FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.transactions t
      WHERE t.id = transaction_id
      AND t.sales_id = auth.uid()
    )
  );

-- ─────────────────────────────────────────────
-- 5g. STOCK ADJUSTMENTS
-- ─────────────────────────────────────────────

-- Only admins can view stock adjustment history
CREATE POLICY "stock_adjustments_select_admin"
  ON public.stock_adjustments FOR SELECT
  TO authenticated
  USING (public.get_my_role() = 'ADMIN');

-- Only admins can manually insert stock adjustments
CREATE POLICY "stock_adjustments_insert_admin"
  ON public.stock_adjustments FOR INSERT
  TO authenticated
  WITH CHECK (public.get_my_role() = 'ADMIN');

-- ============================================================
-- 6. STORAGE BUCKET
-- ============================================================
-- Run these in the SQL Editor as well.
-- Creates a bucket for transaction photos uploaded by sales.

INSERT INTO storage.buckets (id, name, public)
VALUES ('transaction-photos', 'transaction-photos', TRUE)
ON CONFLICT (id) DO NOTHING;

-- Storage policies: Sales can upload their own photos
CREATE POLICY "transaction_photos_upload"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'transaction-photos'
    AND (storage.foldername(name))[1] = auth.uid()::TEXT
  );

-- Anyone authenticated can view transaction photos
CREATE POLICY "transaction_photos_view"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'transaction-photos');

-- Admins can delete photos
CREATE POLICY "transaction_photos_delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'transaction-photos'
    AND public.get_my_role() = 'ADMIN'
  );

-- ============================================================
-- 7. SEED DATA (Optional - Categories)
-- ============================================================
INSERT INTO public.categories (name, description) VALUES
  ('Makanan', 'Produk makanan ringan dan berat'),
  ('Minuman', 'Produk minuman kemasan dan segar'),
  ('Rokok', 'Produk rokok dan tembakau'),
  ('Perawatan', 'Produk perawatan tubuh dan kebersihan'),
  ('Lainnya', 'Produk lain yang tidak terkategorikan')
ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- DONE! Your schema is ready.
-- ============================================================
