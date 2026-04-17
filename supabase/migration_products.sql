-- ============================================================
-- MIGRATION: PRODUCTS ENHANCEMENT (BRANDS & UNITS)
-- ============================================================

-- 1. Create Brands Table
CREATE TABLE IF NOT EXISTS public.brands (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL UNIQUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Create Units Table
CREATE TABLE IF NOT EXISTS public.units (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL UNIQUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Update Products Table
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS brand_id UUID REFERENCES public.brands(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS unit_id UUID REFERENCES public.units(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS discount_regular NUMERIC(5,2) DEFAULT 0 CHECK (discount_regular >= 0);

-- 4. Enable RLS
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for Brands
CREATE POLICY "brands_select_all" ON public.brands FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "brands_manage_admin" ON public.brands FOR ALL TO authenticated 
USING (public.get_my_role() = 'ADMIN') WITH CHECK (public.get_my_role() = 'ADMIN');

-- 6. RLS Policies for Units
CREATE POLICY "units_select_all" ON public.units FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "units_manage_admin" ON public.units FOR ALL TO authenticated 
USING (public.get_my_role() = 'ADMIN') WITH CHECK (public.get_my_role() = 'ADMIN');

-- 7. Initial Seed for Units (from Excel example)
INSERT INTO public.units (name) VALUES 
('PCS'), ('BTL'), ('GLN'), ('BOX'), ('SET'), ('PACK'), ('TUB')
ON CONFLICT (name) DO NOTHING;
