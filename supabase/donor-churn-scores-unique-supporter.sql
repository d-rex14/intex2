-- ----------------------------------------------------------------------------
-- donor_churn_scores: unique supporter_id (required for upsert / ON CONFLICT)
--
-- Legacy root schema.sql defines PK on score_id only, so upsert with
-- on_conflict='supporter_id' fails with: 42P10 "no unique or exclusion constraint
-- matching the ON CONFLICT specification".
--
-- Run once in Supabase → SQL Editor.
-- ----------------------------------------------------------------------------

-- One row per supporter_id (keep arbitrary survivor per key; re-run notebook to refresh scores)
DELETE FROM public.donor_churn_scores t
WHERE t.ctid NOT IN (
  SELECT MIN(t2.ctid)
  FROM public.donor_churn_scores t2
  GROUP BY t2.supporter_id
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.donor_churn_scores'::regclass
      AND conname = 'donor_churn_scores_supporter_id_key'
  ) THEN
    ALTER TABLE public.donor_churn_scores
      ADD CONSTRAINT donor_churn_scores_supporter_id_key UNIQUE (supporter_id);
  END IF;
END $$;
