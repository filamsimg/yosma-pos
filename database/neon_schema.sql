-- ============================================================
-- YOSMA POS - Neon Serverless PostgreSQL Database Schema
-- ============================================================
-- Versi bersih khusus Neon (tanpa ketergantungan auth.users & RLS Supabase)
-- Jalankan file ini secara berurutan di Neon Console > SQL Editor
-- ============================================================

-- 0. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- 1. CUSTOM TYPES (ENUMS)
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
  CREATE TYPE transaction_status AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'CANCELLED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE payment_status AS ENUM ('UNPAID', 'PARTIAL', 'PAID');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================
-- 2. CORE TABLES
-- ============================================================

-- ----- 2a. PROFILES / USERS -----
-- Pada Neon, tabel ini mandiri (tidak merujuk auth.users Supabase).
-- Kolom email & password_hash disediakan jika menggunakan Auth internal/custom.
CREATE TABLE IF NOT EXISTS public.profiles (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT UNIQUE,
  password_hash TEXT,
  full_name     TEXT NOT NULL,
  role          user_role NOT NULL DEFAULT 'SALES',
  avatar_url    TEXT,
  phone         TEXT,
  nik           TEXT,
  npwp          TEXT,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.profiles IS 'Data profil dan pengguna sistem YOSMA POS.';

-- ----- 2b. CATEGORIES -----
CREATE TABLE IF NOT EXISTS public.categories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.categories IS 'Kategori produk untuk pengelompokan stok & penjualan.';

-- ----- 2c. BRANDS (MERK) -----
CREATE TABLE IF NOT EXISTS public.brands (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL UNIQUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.brands IS 'Merk/Brand produk.';

-- ----- 2d. UNITS (SATUAN) -----
CREATE TABLE IF NOT EXISTS public.units (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL UNIQUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.units IS 'Satuan kemasan produk (PCS, BTL, BOX, dll).';

-- ----- 2e. PRODUCTS -----
CREATE TABLE IF NOT EXISTS public.products (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name             TEXT NOT NULL,
  sku              TEXT NOT NULL UNIQUE,
  description      TEXT,
  price            NUMERIC(12,2) NOT NULL CHECK (price >= 0),
  stock            INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  min_stock        INTEGER NOT NULL DEFAULT 0 CHECK (min_stock >= 0),
  category_id      UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  brand_id         UUID REFERENCES public.brands(id) ON DELETE SET NULL,
  unit_id          UUID REFERENCES public.units(id) ON DELETE SET NULL,
  discount_regular NUMERIC(5,2) DEFAULT 0 CHECK (discount_regular >= 0),
  image_url        TEXT,
  is_active        BOOLEAN NOT NULL DEFAULT TRUE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.products IS 'Katalog master produk, harga, dan pelacakan stok.';

CREATE INDEX IF NOT EXISTS idx_products_name ON public.products (name);
CREATE INDEX IF NOT EXISTS idx_products_sku ON public.products (sku);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products (category_id);
CREATE INDEX IF NOT EXISTS idx_products_brand ON public.products (brand_id);
CREATE INDEX IF NOT EXISTS idx_products_unit ON public.products (unit_id);

-- ----- 2f. OUTLET TYPES -----
CREATE TABLE IF NOT EXISTS public.outlet_types (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL UNIQUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----- 2g. OUTLETS -----
CREATE TABLE IF NOT EXISTS public.outlets (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  type            TEXT,
  address         TEXT,
  city            TEXT,
  lat             DOUBLE PRECISION,
  lng             DOUBLE PRECISION,
  phone           TEXT,
  owner_name      TEXT,
  visit_day       TEXT,
  visit_frequency TEXT,
  assigned_sales  UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  status          TEXT DEFAULT 'ACTIVE',
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.outlets IS 'Master data outlet/toko pelanggan.';

CREATE INDEX IF NOT EXISTS idx_outlets_location ON public.outlets (lat, lng);
CREATE INDEX IF NOT EXISTS idx_outlets_city ON public.outlets (city);
CREATE INDEX IF NOT EXISTS idx_outlets_sales ON public.outlets (assigned_sales);

-- ----- 2h. TRANSACTIONS -----
CREATE TABLE IF NOT EXISTS public.transactions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number  TEXT NOT NULL UNIQUE,
  sales_id        UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  outlet_id       UUID NOT NULL REFERENCES public.outlets(id) ON DELETE RESTRICT,
  subtotal        NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (subtotal >= 0),
  discount        NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (discount >= 0),
  total_price     NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (total_price >= 0),
  payment_method  payment_method NOT NULL DEFAULT 'CASH',
  status          transaction_status NOT NULL DEFAULT 'PENDING',
  payment_status  payment_status NOT NULL DEFAULT 'UNPAID',
  paid_amount     NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (paid_amount >= 0),
  due_date        TIMESTAMPTZ,
  lat             DOUBLE PRECISION,
  lng             DOUBLE PRECISION,
  photo_url       TEXT,
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.transactions IS 'Data transaksi penjualan kasir sales & admin.';

CREATE INDEX IF NOT EXISTS idx_transactions_sales ON public.transactions (sales_id);
CREATE INDEX IF NOT EXISTS idx_transactions_outlet ON public.transactions (outlet_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created ON public.transactions (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_invoice ON public.transactions (invoice_number);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON public.transactions (status);
CREATE INDEX IF NOT EXISTS idx_transactions_payment_status ON public.transactions (payment_status);

-- ----- 2i. TRANSACTION ITEMS -----
CREATE TABLE IF NOT EXISTS public.transaction_items (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id  UUID NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
  product_id      UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  quantity        INTEGER NOT NULL CHECK (quantity > 0),
  price_at_sale   NUMERIC(12,2) NOT NULL CHECK (price_at_sale >= 0),
  subtotal        NUMERIC(14,2) GENERATED ALWAYS AS (quantity * price_at_sale) STORED,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.transaction_items IS 'Rincian produk per transaksi penjualan.';

CREATE INDEX IF NOT EXISTS idx_transaction_items_txn ON public.transaction_items (transaction_id);
CREATE INDEX IF NOT EXISTS idx_transaction_items_product ON public.transaction_items (product_id);

-- ----- 2j. TRANSACTION PAYMENTS (CICILAN / PELUNASAN PIUTANG) -----
CREATE TABLE IF NOT EXISTS public.transaction_payments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id  UUID NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
  amount          NUMERIC(14,2) NOT NULL CHECK (amount > 0),
  payment_method  payment_method NOT NULL DEFAULT 'CASH',
  payment_date    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notes           TEXT,
  recorded_by     UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  proof_url       TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.transaction_payments IS 'Riwayat pembayaran bertahap/cicilan atas transaksi kredit.';

CREATE INDEX IF NOT EXISTS idx_payments_txn ON public.transaction_payments (transaction_id);
CREATE INDEX IF NOT EXISTS idx_payments_date ON public.transaction_payments (payment_date DESC);

-- ----- 2k. STOCK ADJUSTMENTS (LOG PERUBAHAN STOK) -----
CREATE TABLE IF NOT EXISTS public.stock_adjustments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id  UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  adjusted_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  old_stock   INTEGER NOT NULL,
  new_stock   INTEGER NOT NULL,
  reason      TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.stock_adjustments IS 'Audit trail mutasi stok (penjualan otomatis & opname manual).';

CREATE INDEX IF NOT EXISTS idx_stock_adj_product ON public.stock_adjustments (product_id);
CREATE INDEX IF NOT EXISTS idx_stock_adj_created ON public.stock_adjustments (created_at DESC);

-- ----- 2l. VISITS (KUNJUNGAN NON-ORDER) -----
CREATE TABLE IF NOT EXISTS public.visits (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sales_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  outlet_id   UUID NOT NULL REFERENCES public.outlets(id) ON DELETE CASCADE,
  lat         DOUBLE PRECISION,
  lng         DOUBLE PRECISION,
  photo_url   TEXT,
  notes       TEXT,
  status      TEXT NOT NULL DEFAULT 'COMPLETED',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.visits IS 'Log riwayat check-in kunjungan sales tanpa order barang.';

CREATE INDEX IF NOT EXISTS idx_visits_sales ON public.visits (sales_id);
CREATE INDEX IF NOT EXISTS idx_visits_outlet ON public.visits (outlet_id);
CREATE INDEX IF NOT EXISTS idx_visits_created ON public.visits (created_at DESC);

-- ----- 2m. DASHBOARD STATS AGGREGATIONS -----
CREATE TABLE IF NOT EXISTS public.dashboard_global_stats (
  id INTEGER PRIMARY KEY DEFAULT 1,
  total_revenue NUMERIC(15,2) DEFAULT 0,
  total_transactions INTEGER DEFAULT 0,
  total_products INTEGER DEFAULT 0,
  total_sales INTEGER DEFAULT 0,
  pending_orders INTEGER DEFAULT 0,
  processing_orders INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT one_row_only CHECK (id = 1)
);

CREATE TABLE IF NOT EXISTS public.dashboard_daily_stats (
  date DATE PRIMARY KEY,
  revenue NUMERIC(15,2) DEFAULT 0,
  transactions INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 3. FUNCTIONS & BUSINESS TRIGGERS
-- ============================================================

-- ----- 3a. Auto-update updated_at timestamp -----
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

-- ----- 3b. Auto-generate invoice number -----
CREATE OR REPLACE FUNCTION public.generate_invoice_number()
RETURNS TRIGGER AS $$
DECLARE
  seq_num INTEGER;
  date_prefix TEXT;
BEGIN
  date_prefix := TO_CHAR(NOW(), 'YYYYMMDD');

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

-- ----- 3c. Auto-deduct stock on transaction item insert -----
CREATE OR REPLACE FUNCTION public.deduct_stock_on_sale()
RETURNS TRIGGER AS $$
BEGIN
  -- Catat riwayat audit stok
  INSERT INTO public.stock_adjustments (product_id, adjusted_by, old_stock, new_stock, reason)
  SELECT
    NEW.product_id,
    t.sales_id,
    p.stock,
    p.stock - NEW.quantity,
    'AUTO: Penjualan invoice ' || t.invoice_number
  FROM public.products p
  CROSS JOIN public.transactions t
  WHERE p.id = NEW.product_id
    AND t.id = NEW.transaction_id;

  -- Potong stok aktual produk
  UPDATE public.products
  SET stock = stock - NEW.quantity
  WHERE id = NEW.product_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_transaction_item_insert ON public.transaction_items;
CREATE TRIGGER on_transaction_item_insert
  AFTER INSERT ON public.transaction_items
  FOR EACH ROW
  EXECUTE FUNCTION public.deduct_stock_on_sale();

-- ----- 3d. Triggers for Dashboard Aggregates -----
CREATE OR REPLACE FUNCTION public.handle_transaction_stats_update()
RETURNS TRIGGER AS $$
DECLARE
  today DATE := CURRENT_DATE;
BEGIN
  IF (TG_OP = 'INSERT') THEN
    IF (NEW.status != 'CANCELLED') THEN
      INSERT INTO public.dashboard_daily_stats (date, revenue, transactions)
      VALUES (today, NEW.total_price, 1)
      ON CONFLICT (date) DO UPDATE SET
        revenue = dashboard_daily_stats.revenue + EXCLUDED.revenue,
        transactions = dashboard_daily_stats.transactions + 1,
        updated_at = NOW();

      UPDATE public.dashboard_global_stats SET
        total_revenue = total_revenue + NEW.total_price,
        total_transactions = total_transactions + 1,
        pending_orders = CASE WHEN NEW.status = 'PENDING' THEN pending_orders + 1 ELSE pending_orders END,
        processing_orders = CASE WHEN NEW.status = 'PROCESSING' THEN processing_orders + 1 ELSE processing_orders END,
        updated_at = NOW()
      WHERE id = 1;
    END IF;
  ELSIF (TG_OP = 'UPDATE') THEN
    IF (OLD.status != NEW.status) THEN
      IF (NEW.status = 'CANCELLED' AND OLD.status != 'CANCELLED') THEN
        UPDATE public.dashboard_global_stats SET
          total_revenue = total_revenue - OLD.total_price,
          total_transactions = total_transactions - 1,
          pending_orders = CASE WHEN OLD.status = 'PENDING' THEN pending_orders - 1 ELSE pending_orders END,
          processing_orders = CASE WHEN OLD.status = 'PROCESSING' THEN processing_orders - 1 ELSE processing_orders END,
          updated_at = NOW()
        WHERE id = 1;

        UPDATE public.dashboard_daily_stats SET
          revenue = revenue - OLD.total_price,
          transactions = transactions - 1,
          updated_at = NOW()
        WHERE date = CAST(OLD.created_at AS DATE);
      ELSE
        UPDATE public.dashboard_global_stats SET
          pending_orders = pending_orders + 
            CASE WHEN NEW.status = 'PENDING' THEN 1 WHEN OLD.status = 'PENDING' THEN -1 ELSE 0 END,
          processing_orders = processing_orders + 
            CASE WHEN NEW.status = 'PROCESSING' THEN 1 WHEN OLD.status = 'PROCESSING' THEN -1 ELSE 0 END,
          updated_at = NOW()
        WHERE id = 1;
      END IF;
    END IF;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_txn_stats ON public.transactions;
CREATE TRIGGER tr_txn_stats
  AFTER INSERT OR UPDATE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.handle_transaction_stats_update();

CREATE OR REPLACE FUNCTION public.handle_resource_count_update()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_TABLE_NAME = 'products') THEN
    UPDATE public.dashboard_global_stats SET
      total_products = (SELECT COUNT(*) FROM public.products WHERE is_active = true),
      updated_at = NOW()
    WHERE id = 1;
  ELSIF (TG_TABLE_NAME = 'profiles') THEN
    UPDATE public.dashboard_global_stats SET
      total_sales = (SELECT COUNT(*) FROM public.profiles WHERE role = 'SALES' AND is_active = true),
      updated_at = NOW()
    WHERE id = 1;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_product_count ON public.products;
CREATE TRIGGER tr_product_count
  AFTER INSERT OR UPDATE OR DELETE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.handle_resource_count_update();

DROP TRIGGER IF EXISTS tr_profile_count ON public.profiles;
CREATE TRIGGER tr_profile_count
  AFTER INSERT OR UPDATE OR DELETE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_resource_count_update();

-- ============================================================
-- 3f. HIGH-PERFORMANCE INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_transactions_sales_created ON public.transactions(sales_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_status_created ON public.transactions(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_outlet ON public.transactions(outlet_id);
CREATE INDEX IF NOT EXISTS idx_transactions_invoice ON public.transactions(invoice_number);
CREATE INDEX IF NOT EXISTS idx_transaction_items_txid ON public.transaction_items(transaction_id);
CREATE INDEX IF NOT EXISTS idx_transaction_items_prod ON public.transaction_items(product_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_products_brand ON public.products(brand_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_outlets_assigned ON public.outlets(assigned_sales) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_visits_sales_created ON public.visits(sales_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payments_txid ON public.transaction_payments(transaction_id);

-- ============================================================
-- 4. INITIAL SEED DATA
-- ============================================================

-- Row awal dashboard global stats
INSERT INTO public.dashboard_global_stats (id, total_revenue, total_transactions, total_products, total_sales, pending_orders, processing_orders)
VALUES (1, 0, 0, 0, 0, 0, 0)
ON CONFLICT (id) DO NOTHING;

-- Seed Satuan (Units)
INSERT INTO public.units (name) VALUES 
('PCS'), ('BTL'), ('GLN'), ('BOX'), ('SET'), ('PACK'), ('TUB')
ON CONFLICT (name) DO NOTHING;

-- Seed Kategori (Categories)
INSERT INTO public.categories (name, description) VALUES
('Makanan', 'Produk makanan ringan dan berat'),
('Minuman', 'Produk minuman kemasan dan segar'),
('Rokok', 'Produk rokok dan tembakau'),
('Perawatan', 'Produk perawatan tubuh dan kebersihan'),
('Lainnya', 'Produk lain yang tidak terkategorikan')
ON CONFLICT (name) DO NOTHING;

-- Seed Tipe Outlet (Outlet Types)
INSERT INTO public.outlet_types (name) VALUES
('TOKO'), ('WARUNG'), ('GROSIR'), ('MINIMARKET'), ('AGEN'), ('RESTO / CAFE'), ('LAINNYA')
ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- SELESAI: Skema database Neon PostgreSQL siap digunakan.
-- ============================================================
