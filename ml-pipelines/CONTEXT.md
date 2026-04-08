# ML Pipelines — Agent Context

Last updated: 2026-04-08

## What this project is

**Watchtower** — a secure operations portal for Lighthouse Sanctuary (nonprofit). Built as a BYU INTEX capstone.  
Frontend: React 18 + TypeScript + Vite + Tailwind CSS 4. Backend: Supabase (auth + database).  
All portal routes are under `/portal/*`. Auth is role-based (`admin=4, staff=3, social_media_rep=1`).

---

## What we were in the middle of

We are **populating Supabase ML tables** by running Jupyter notebooks and exporting scores. These scores power colored chip/badge UI components in the portal.

### Overall progress

| Notebook | Supabase table | Status |
|---|---|---|
| `04_donor_upgrade_predictor/donor_upgrade_predictor.ipynb` | `donor_upgrade_scores` | ✅ DONE — data in Supabase |
| `donor-churn-prediction.ipynb` | `donor_churn_scores` | ⏳ IN PROGRESS — notebook has bugs being fixed, not yet exported |
| `reintegration-readiness.ipynb` | `resident_ml_scores.reintegration_band` | ⏳ NOT YET RUN |
| `school-struggle-risk.ipynb` | `resident_ml_scores.school_struggle_band` | ⏳ NOT YET RUN |
| `resident-wellbeing-prediction.ipynb` | `resident_ml_scores.wellbeing_band` | ⏳ NOT YET RUN |
| `02_incident_leading_indicators/incident_leading_indicators.ipynb` | `resident_ml_scores.incident_risk_band` | ⏳ NOT YET RUN |

---

## Supabase tables (already created)

All 5 ML tables exist in Supabase. Verified with:
```sql
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'donor_upgrade_scores', 'donor_churn_scores', 'resident_ml_scores',
    'safehouse_ml_scores', 'social_media_ml_scores'
  );
```
All 5 rows returned. Schema is in `supabase/ml-scored-tables.sql`.

### `resident_ml_scores` schema (important — 4 notebooks write to it)
```sql
resident_id             integer  -- PK / upsert key
reintegration_band      text     -- 'Ready' | 'Approaching' | 'Not Ready'
reintegration_score     numeric
school_struggle_band    text     -- 'High' | 'Medium' | 'Low'
school_struggle_score   numeric
wellbeing_band          text     -- 'High' | 'Medium' | 'Low'
wellbeing_score         numeric
incident_risk_band      text     -- 'High' | 'Medium' | 'Low'
incident_risk_score     numeric
model_version           text
scored_at               timestamptz
```
Each of the 4 case notebooks upserts only its own columns. They do NOT overwrite each other.

---

## Data path fix (ALREADY APPLIED)

All notebooks originally had `DATA_DIR = Path('../data/lighthouse_csv_v7')` but the data lives in `data/raw/`. This has been fixed in:
- `reintegration-readiness.ipynb` ✅
- `school-struggle-risk.ipynb` ✅
- `resident-wellbeing-prediction.ipynb` ✅
- `donor-churn-prediction.ipynb` ✅

The incident notebook (`02_incident_leading_indicators/`) auto-detects the path and does not need fixing.

---

## Fixes applied to `donor-churn-prediction.ipynb`

Two bugs were fixed (both still need to be verified by running the notebook clean):

### Fix 1 — Cell 6: `basic_wrangling` dropped key features
`basic_wrangling(model_df)` was silently dropping `recency_days`, `total_value`, `avg_value`, `tenure_days` (flagging them as ID-like due to high cardinality at N=60). These are core RFM churn predictors. The call was replaced with a simple print statement:
```python
# basic_wrangling() removed — it incorrectly flags continuous features as IDs
print(f'model_df shape: {model_df.shape}')
print(f'Columns: {list(model_df.columns)}')
```

### Fix 2 — Cell 21: `permutation_importance_report` double-preprocessing
`permutation_importance_report(best_rf, X_test_prep, ...)` was passing already-preprocessed data into a full Pipeline (which includes its own preprocessor). Fixed to use just the model step:
```python
pfi_df = permutation_importance_report(
    best_rf.named_steps['model'], X_test_prep, y_test, feature_names,
    n_repeats=10, scoring='roc_auc', top_n=15
)
```

---

## Export cells (already added to each notebook)

Each notebook has a ready-to-run export cell at the **very end**. Before running, fill in credentials:
```python
SUPABASE_URL = "https://xxxx.supabase.co"       # same as VITE_SUPABASE_URL in .env.local
SUPABASE_SERVICE_KEY = "eyJhbGci..."             # Supabase Dashboard → Settings → API → service_role key
```

The export cells upsert to Supabase using `on_conflict="supporter_id"` (donor notebooks) or `on_conflict="resident_id"` (case notebooks).

---

## Where the ML data shows up in the portal

### `/portal/donors` (DonorsContributionsPage.tsx)
- **Upgrade Opportunity Queue** — staff-only card showing top donors by upgrade score (from `donor_upgrade_scores`)
- **Top Donors table → Lapse Risk column** — churn risk band badge (from `donor_churn_scores`)
- **Donor detail modal → Upgrade Insight section** — upgrade score + churn risk + recommended action

### `/portal/caseload` (CaseloadPage.tsx)
Four staff-only columns added to every resident row:
- **Reintegration** — Ready / Approaching / Not Ready (from `resident_ml_scores.reintegration_band`)
- **School risk** — High / Medium / Low (from `resident_ml_scores.school_struggle_band`)
- **Wellbeing** — High / Medium / Low (from `resident_ml_scores.wellbeing_band`)
- **Incident risk** — High / Medium / Low (from `resident_ml_scores.incident_risk_band`)

Also visible in the resident detail modal under "Model Insights".

---

## How to run a notebook correctly

1. Open notebook in VS Code / Jupyter
2. **Kernel → Restart & Run All** (important — don't run cells individually from a stale state)
3. When the export cell at the bottom runs, confirm it prints `Upserted N rows to ...`
4. Verify in Supabase Table Editor

If the kernel hangs on load, close and reopen the file, or restart VS Code.

---

## Files changed in this work session

| File | What changed |
|---|---|
| `src/pages/portal/CaseloadPage.tsx` | Added ML risk chips (4 columns + modal section), staff-gated. Teammate had rewritten this file and our previous ML integration was lost — we re-added it on top of their CRUD work. |
| `ml-pipelines/reintegration-readiness.ipynb` | Fixed DATA_DIR path; added Supabase export cell |
| `ml-pipelines/school-struggle-risk.ipynb` | Fixed DATA_DIR path; added Supabase export cell |
| `ml-pipelines/resident-wellbeing-prediction.ipynb` | Fixed DATA_DIR path; added Supabase export cell |
| `ml-pipelines/02_incident_leading_indicators/incident_leading_indicators.ipynb` | Added Supabase export cell |
| `ml-pipelines/donor-churn-prediction.ipynb` | Fixed DATA_DIR path; fixed basic_wrangling bug (cell 6); fixed permutation_importance double-preprocessing bug (cell 21); export cell already existed |

All CaseloadPage changes were committed and pushed to `main` (Vercel auto-deploys).

---

## Immediate next steps

1. **Run `donor-churn-prediction.ipynb`** — Restart & Run All, then run the export cell. Confirm `donor_churn_scores` is populated.
2. **Run `reintegration-readiness.ipynb`** — Restart & Run All, then export cell.
3. **Run `school-struggle-risk.ipynb`** — Restart & Run All, then export cell.
4. **Run `resident-wellbeing-prediction.ipynb`** — Restart & Run All, then export cell.
5. **Run `02_incident_leading_indicators/incident_leading_indicators.ipynb`** — Restart & Run All, then export cell.
6. After all 5 are done, check `/portal/caseload` and `/portal/donors` on the deployed site — chips should show real data instead of dashes.
7. Optionally: commit and push any remaining notebook changes.
