# Resident Wellbeing Prediction Pipeline Takeaways

## What This Pipeline Answered

This pipeline addressed two distinct questions:

- **Explanatory:** Which early-period resident signals (baseline health, education engagement, counseling frequency, incident history) are associated with higher composite wellbeing at program exit?
- **Predictive (Regression):** Can we predict the continuous Composite Wellbeing Index (CWI) from early-period features?
- **Predictive (Classification):** Can we identify which residents are likely to reach high-wellbeing status (CWI ≥ 6.5) early enough to support targeted programming?

CWI formula: `CWI = 0.40 × Physical + 0.35 × Mental + 0.25 × Social`

## Key Dataset and Engineering Outcomes

- A **resident-level** feature matrix (27 features, N=60) was built from early-period signals across `health_wellbeing_records`, `education_records`, `process_recordings`, and `incident_reports`.
- Strict temporal split: CWI target computed from late-period health records; predictors from early-period only.
- Four wellbeing tiers defined: At Risk (<4.5), Developing (4.5–6.0), Progressing (6.0–7.5), Thriving (≥7.5).
- High-wellbeing binary threshold: CWI ≥ 6.5.
- Both trained model artifacts saved: `wellbeing_regressor_model.sav`, `wellbeing_classifier_model.sav`.

## Model Performance Snapshot

From the current run (see `wellbeing_model_metrics.json`):

**Regression Track — GradientBoostingRegressor:**
- **CV RMSE:** `0.210`
- **Best params:** `learning_rate=0.03`, `max_depth=2`, `n_estimators=300`

**Classification Track — GradientBoostingClassifier:**
- **Best params:** `learning_rate=0.05`, `max_depth=2`, `n_estimators=100`
- **High-wellbeing threshold:** `6.5`
- **Feature count:** 27 | **Training residents:** 60

**Observed output range (wellbeing_scores.csv):**
- Predicted CWI: 6.3–7.2 (Progressing tier range)
- Wellbeing tiers in sample output: At Risk, Developing, Progressing, Thriving

Interpretation:

- Regression RMSE of 0.21 on a 0–10 scale means predictions are within ±0.21 CWI points on average — sufficient for tier assignment in most cases.
- Borderline-tier residents (near 4.5, 6.0, or 7.5 thresholds) should be reviewed manually rather than relying on the model tier assignment alone.

## Most Important Predictive Signals

Top features across both tracks:

- **Baseline physical health score** — strongest early predictor of late-period wellbeing across all dimensions
- **Mental health score at intake** — initial mental health status predicts the mental component trajectory
- **Counseling session frequency** — sustained therapeutic engagement correlates with higher final CWI
- **Incident count in early period** — higher disruption lowers predicted CWI, especially the mental component
- **Education attendance rate** — social dimension of CWI reflects structured engagement patterns

## Explanatory Findings and Causal Limits

- OLS findings suggest baseline health and counseling engagement are the strongest associations with final wellbeing, broadly consistent with program theory.
- The physical sub-dimension (weight 0.40) appears well-calibrated; early physical health is the most stable predictor.
- Mental wellbeing trajectory shows more variance and is harder to predict from early signals alone.

Causal caveat:

- Observational data with N=60. Confounders not modeled: post-program housing security, family reunification, trauma type and severity, length-of-stay variation.
- CWI is a program-internal composite, not a clinically validated instrument — interpret in context of program goals, not as a medical outcome.
- Causal claims about counseling frequency → wellbeing are not warranted; high-engagement residents likely differ in other unmeasured ways.

## Business and Program Takeaways

- The pipeline is strong for **program-level outcome monitoring** — tracking the distribution of wellbeing tiers across all residents over time is more valuable than any individual prediction.
- At Risk residents identified early can be routed to intensive intervention tracks before conditions deteriorate further.
- The CWI framework itself is a useful program design tool even beyond ML: it makes the multidimensional nature of wellbeing explicit and measurable.

## Recommended Next Improvements

1. Grow the dataset beyond N=60 to improve regression and classification stability.
2. Validate the 0.40/0.35/0.25 CWI weights against clinical literature or conduct a sensitivity analysis with alternative weightings.
3. Add length-of-stay as a confounder variable to control for time-in-program effects.
4. Implement a per-dimension prediction model (predict physical, mental, social separately) to enable more targeted interventions.
5. Track predicted CWI vs. actual CWI at program exit longitudinally to assess model drift.

## Suggested Operational Use Right Now

- Run batch scoring and upsert to `resident_ml_scores` (`wellbeing_band`, `wellbeing_score` columns).
- Surface Wellbeing chip (At Risk / Developing / Progressing / Thriving) in `/portal/caseload` for staff.
- Route At Risk residents to program leadership for immediate case review.
- Use aggregated tier distributions in monthly program reports to track population-level wellbeing trends.
- Flag borderline-tier residents for manual clinical review before any programmatic decisions are made.
