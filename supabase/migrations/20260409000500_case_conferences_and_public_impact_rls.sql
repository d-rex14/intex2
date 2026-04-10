-- =============================================================================
-- case_conferences: staff CRUD; public_impact_snapshots: anonymous read (published)
-- =============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. case_conferences
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.case_conferences (
  case_conference_id INTEGER PRIMARY KEY,
  resident_id        INTEGER NOT NULL REFERENCES public.residents(resident_id),
  conference_date    DATE NOT NULL,
  conference_type    TEXT,
  facilitator        TEXT,
  status             TEXT NOT NULL DEFAULT 'Scheduled',
  notes              TEXT,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT case_conferences_status_check CHECK (
    status IN ('Scheduled', 'Completed', 'Cancelled')
  )
);

CREATE INDEX IF NOT EXISTS case_conferences_resident_date_idx
  ON public.case_conferences (resident_id, conference_date DESC);

CREATE INDEX IF NOT EXISTS case_conferences_date_idx
  ON public.case_conferences (conference_date DESC);

CREATE SEQUENCE IF NOT EXISTS public.case_conferences_case_conference_id_seq;

SELECT setval(
  'public.case_conferences_case_conference_id_seq',
  COALESCE((SELECT MAX(case_conference_id) FROM public.case_conferences), 0)
);

ALTER TABLE public.case_conferences
  ALTER COLUMN case_conference_id SET DEFAULT nextval('public.case_conferences_case_conference_id_seq');

ALTER SEQUENCE public.case_conferences_case_conference_id_seq OWNED BY public.case_conferences.case_conference_id;

GRANT USAGE, SELECT ON SEQUENCE public.case_conferences_case_conference_id_seq TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.case_conferences TO authenticated;

ALTER TABLE public.case_conferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS case_conferences_staff_all ON public.case_conferences;
CREATE POLICY case_conferences_staff_all
  ON public.case_conferences
  FOR ALL
  TO authenticated
  USING (public.is_staff_portal_user())
  WITH CHECK (public.is_staff_portal_user());

-- Optional: updated_at trigger
CREATE OR REPLACE FUNCTION public.set_case_conferences_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS case_conferences_set_updated_at ON public.case_conferences;
CREATE TRIGGER case_conferences_set_updated_at
  BEFORE UPDATE ON public.case_conferences
  FOR EACH ROW
  EXECUTE FUNCTION public.set_case_conferences_updated_at();

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Public impact snapshots (read published rows for /impact page)
-- ─────────────────────────────────────────────────────────────────────────────

GRANT SELECT ON public.public_impact_snapshots TO anon, authenticated;

ALTER TABLE public.public_impact_snapshots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS public_impact_snapshots_public_select ON public.public_impact_snapshots;
CREATE POLICY public_impact_snapshots_public_select
  ON public.public_impact_snapshots
  FOR SELECT
  TO anon, authenticated
  USING (is_published = TRUE);
