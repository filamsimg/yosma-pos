-- Create visits table for recording non-order visits
CREATE TABLE IF NOT EXISTS public.visits (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sales_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  outlet_id   UUID NOT NULL REFERENCES public.outlets(id) ON DELETE CASCADE,
  lat         DOUBLE PRECISION,
  lng         DOUBLE PRECISION,
  photo_url   TEXT,
  notes       TEXT,
  status      TEXT NOT NULL DEFAULT 'COMPLETED',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.visits ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "visits_select_all" ON public.visits
  FOR SELECT TO authenticated USING (TRUE);

CREATE POLICY "visits_insert_sales" ON public.visits
  FOR INSERT TO authenticated WITH CHECK (sales_id = auth.uid());

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_visits_sales ON public.visits (sales_id);
CREATE INDEX IF NOT EXISTS idx_visits_outlet ON public.visits (outlet_id);
