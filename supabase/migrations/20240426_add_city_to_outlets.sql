-- Add city column to outlets table
ALTER TABLE public.outlets ADD COLUMN IF NOT EXISTS city TEXT;

-- Create index for faster filtering by city
CREATE INDEX IF NOT EXISTS idx_outlets_city ON public.outlets(city);
