-- ------------------------------------------------------------------
-- cabinet_medications + supporting changes
-- ------------------------------------------------------------------
-- 1.  Cabinet - Medication join table
CREATE TABLE IF NOT EXISTS public.cabinet_medications (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cabinet_id    UUID NOT NULL REFERENCES public.medicine_cabinets(id) ON DELETE CASCADE,
  medication_id UUID NOT NULL REFERENCES public.medications(id)        ON DELETE CASCADE,
  quantity      INT  NOT NULL DEFAULT 0,
  expiry_date   DATE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (cabinet_id, medication_id)
);

-- 2.  Trigger to keep updated_at fresh
CREATE OR REPLACE FUNCTION public.set_cabinet_medications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_set_cabinet_medications_updated_at
ON public.cabinet_medications;

CREATE TRIGGER trg_set_cabinet_medications_updated_at
BEFORE UPDATE ON public.cabinet_medications
FOR EACH ROW
EXECUTE FUNCTION public.set_cabinet_medications_updated_at();

-- 3.  Helpful indexes
CREATE INDEX IF NOT EXISTS idx_cabinet_meds_cabinet  ON public.cabinet_medications (cabinet_id);
CREATE INDEX IF NOT EXISTS idx_cabinet_meds_med      ON public.cabinet_medications (medication_id);

-- 4.  Extra columns on related tables (if you haven’t run them yet)
ALTER TABLE public.medication_schedules
  ADD COLUMN IF NOT EXISTS cabinet_id   UUID REFERENCES public.medicine_cabinets(id),
  ADD COLUMN IF NOT EXISTS dispensed_at TIMESTAMPTZ;

ALTER TABLE public.medications
  ADD COLUMN IF NOT EXISTS stock_quantity INT DEFAULT 100;

-- 5.  Seed a few random rows so the UI isn't empty
INSERT INTO public.cabinet_medications (cabinet_id, medication_id, quantity)
SELECT
  mc.id,
  m.id,
  FLOOR(random()*50)+10
FROM public.medicine_cabinets mc
CROSS JOIN LATERAL (
  SELECT id FROM public.medications ORDER BY random() LIMIT 1
) m
ON CONFLICT DO NOTHING;
