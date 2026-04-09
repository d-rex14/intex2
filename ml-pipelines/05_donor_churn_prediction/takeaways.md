# Donor Churn Prediction Pipeline Takeaways

## What This Pipeline Answered

This pipeline addressed two distinct questions:

- **Explanatory:** Which donor behavioral patterns (recency, frequency, monetary value, tenure, acquisition channel) are associated with lapse risk?
- **Predictive:** Can we rank donors by churn probability so outreach staff can prioritize retention contacts before relationships go cold?

It did so by constructing a donor-level RFM spine and defining churn as a binary lapse indicator based on donation recency.

## Key Dataset and Engineering Outcomes

- A **donor-level** behavioral dataset was built from `donations.csv` and `supporters.csv`.
- Core RFM features engineered: `recency_days`, `frequency`, `total_value`, `avg_value`, `tenure_days`.
- `acquisition_channel` included as a categorical signal for segment-level risk differences.
- `basic_wrangling()` was intentionally excluded — it incorrectly dropped continuous RFM features by flagging them as ID-like due to high cardinality at N=60.
- Preprocessing wrapped in a `sklearn.pipeline.Pipeline` with `ColumnTransformer` for reproducibility.

## Model Performance Snapshot

- **Explanatory Model:** Logistic Regression with odds-ratio interpretation of RFM coefficients
- **Predictive Model:** Random Forest classifier, hyperparameter-tuned via GridSearchCV
- **Output tiers:** Low / High churn risk (threshold ~0.2–0.3 probability)
- **Sample output range:** High-risk scores reaching 0.92, Low-risk scores as low as 0.025

Interpretation:

- The RFM model provides directionally useful risk ranking for top-decile outreach targeting.
- With only N=60 donors, model stability is limited; treat as a decision-support signal, not a definitive classification.

## Most Important Predictive Signals

Top predictive features in the Random Forest model:

- `recency_days` — the strongest single predictor of lapse risk
- `total_value` and `avg_value` — higher-value donors show different lapse patterns than micro-donors
- `tenure_days` — long-tenure donors with recent gaps signal a behavioral shift worth flagging
- `acquisition_channel` — some acquisition sources correlate with lower retention rates

## Explanatory Findings and Causal Limits

- Logistic regression coefficients confirm recency as the dominant signal, consistent with RFM theory.
- Acquisition channel effects exist but are confounded by campaign targeting (channels with higher-risk donors may have been selected that way, not caused to churn).

Causal caveat:

- This is observational data with no controlled donor segments, so omitted variable bias is real (donor income changes, organizational satisfaction, competing charities, life events).
- Findings should be interpreted as **behavioral associations**, not causal drivers.

## Business and Program Takeaways

- The current pipeline is strong for **outreach prioritization and donor health monitoring**.
- The High-risk tier list gives development staff a targeted call list each cycle rather than mass blasting the full donor base.
- The logistic coefficients can inform messaging: donors lapsing on recency vs. those with declining average gift may need different re-engagement narratives.

## Recommended Next Improvements

1. Expand to a three-tier (Low / Medium / High) model once N grows beyond 60.
2. Add engagement signals beyond donations: event attendance, volunteer hours, email open rates.
3. Implement drift monitoring — retrain quarterly as new donation history accumulates.
4. Calibrate probability thresholds based on outreach team capacity (how many High-risk calls can staff actually handle per cycle?).
5. A/B test re-engagement messaging for the High-risk segment to measure actual retention impact.

## Suggested Operational Use Right Now

- Run batch scoring monthly and upsert results to `donor_churn_scores` in Supabase.
- Surface `churn_risk_tier` badge on the `/portal/donors` Top Donors table for staff.
- Route High-risk donors to the development director for personal outreach within 30 days.
- Review logistic coefficients quarterly to track whether the key risk signals shift over time.
