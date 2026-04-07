# Donor Upgrade Predictor: Key Takeaways

## What this pipeline answers

This notebook answers a fundraising prioritization question:

1. Which donors are most likely to upgrade from one-time giving to recurring giving?
2. How can outreach teams use model probabilities to focus limited budget on the highest-potential donors?

This is a predictive pipeline (not causal). The model is designed for ranking and probability scoring, not explaining why donor behavior happens.

## Data and modeling snapshot

- Data sources: `donations.csv`, `supporters.csv`, `in_kind_donation_items.csv`
- Target: `has_recurring` (1 if supporter ever made a recurring donation, else 0)
- Leakage control: donor features use only non-recurring behavior prior to first recurring donation
- Core features: `total_one_time_value`, `count_one_time_donations`, `days_between_first_and_last_donation`, `count_in_kind_items`, `acquisition_channel`
- Model type: `RandomForestClassifier` inside a full sklearn `Pipeline` with `ColumnTransformer`

## Core findings

### 1) The model produces strong ranking performance on the current split

On the current run, held-out ROC AUC is high (approximately 0.97), indicating the model can separate likely upgraders from non-upgraders well in this sample.

Interpretation: probability outputs are useful for prioritizing outreach queues.

### 2) Top-decile targeting is the operational lever

Sorting donors by `predict_proba` and targeting only the top 10% creates a practical campaign workflow when outreach capacity is constrained.

Interpretation: use model score rank order as the decision tool, not only a hard 0/1 threshold.

### 3) Feature signals are useful but not causal

Feature importance shows which variables drive tree split decisions, typically mixing giving intensity (value/count), engagement timing, in-kind behavior, and acquisition context.

Interpretation: these are reliable correlates for prediction quality, not causal effects.

## Business guidance

1. Operationalize top-decile (or top-quintile) calling lists each campaign cycle.
2. Track conversion by score bands to monitor score calibration over time.
3. Re-train periodically as donor behavior and campaign channels shift.
4. Keep leakage controls unchanged in all future model refreshes.

## Deployment note

The recommended architecture is:

- Supabase for application data storage
- Python inference microservice (FastAPI/Flask) to load `upgrade_predictor.joblib`
- Frontend sends donor input JSON, receives `predict_proba`, then logs interactions back to Supabase

This separation is required because Supabase Edge Functions do not natively execute Python `.joblib` model artifacts.

## Limits and cautions

- The current dataset for this pipeline run is small, so reported metrics may vary with different splits.
- Class distribution and channel mix can drift; monitoring and retraining are necessary.
- High model score does not prove causal donor intent; it only indicates higher predicted upgrade likelihood.
