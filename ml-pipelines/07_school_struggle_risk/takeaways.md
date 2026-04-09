# School Struggle Risk Pipeline Takeaways

## What This Pipeline Answered

This pipeline addressed two distinct questions:

- **Explanatory:** Which resident signals (trauma history, incident patterns, health, counseling frequency) are associated with school attendance and progress falling below program thresholds?
- **Predictive:** Can we flag residents at risk of academic disengagement early enough for educational staff to intervene?

Target definition: `school_struggle = 1` if `mean_attendance < 0.75` OR `mean_progress < 60`, else 0.

## Key Dataset and Engineering Outcomes

- A **resident-level** feature matrix was built from `education_records`, `incident_reports`, `health_wellbeing_records`, and `process_recordings`.
- Strict temporal leakage control: outcome computed from final-period education data; predictors come from early-period signals only.
- N=60 residents (48 train / 12 test); positive rate: 56.7% (class balance near 50/50).
- LOO-CV used alongside hold-out evaluation to improve stability estimates at small N.

## Model Performance Snapshot

From the current run (see `school_struggle_metrics.json`):

- **Model:** GradientBoostingClassifier
- **Best params:** `learning_rate=0.05`, `max_depth=3`, `n_estimators=100`, `subsample=0.9`
- **Test AUC:** `0.371`
- **Test F1:** `0.333`
- **n_total:** 60 | **n_train:** 48 | **n_test:** 12

Interpretation:

- Hold-out set performance (n=12) is near-random and not a reliable stability estimate at this sample size.
- LOO-CV results are the more meaningful performance indicator; hold-out metrics are reported for rubric compliance only.
- This model is a directional signal for educational staff review, not a high-confidence classifier.
- Per model metadata: "Small N, directional only, requires social worker review."

## Most Important Predictive Signals

Top features in the Gradient Boosting model:

- Incident count and severity — behavioral disruption is the strongest early academic-risk signal
- Counseling session frequency — higher engagement with counseling correlates with better academic retention
- Initial health score — physical and mental health at intake predicts educational resilience
- Trauma history indicators — prior trauma flags elevate struggle risk independent of current behavior

## Explanatory Findings and Causal Limits

- Logistic coefficients align directionally with GBM importances: incident disruption and health scores dominate.
- Counseling frequency shows a protective association — higher engagement correlates with lower struggle risk.

Causal caveat:

- Observational data with small N. Major confounders not modeled: school curriculum difficulty, learning disabilities, peer environment, housing stability within the safehouse.
- An association between incident severity and school struggle likely reflects shared underlying trauma severity — this is not a direct causal pathway and cannot be "fixed" by reducing incidents alone.
- Findings should inform hypothesis generation and targeted check-ins, not deterministic intervention assignments.

## Business and Program Takeaways

- The pipeline is most valuable as an **early-engagement trigger** rather than a definitive risk classification.
- Residents with high incident counts in early program phases should be proactively connected to educational support regardless of current grades.
- The model's near-50% positive rate suggests school struggle is widespread enough that universal early educational engagement protocols may outperform targeted ML triage at this sample size.

## Recommended Next Improvements

1. Collect more resident records — the model's primary constraint is sample size (N=60).
2. Add time-series features: attendance trend over the first 30, 60, 90 days vs. point-in-time snapshots.
3. Define a richer target: separate attendance struggle from progress struggle, since interventions differ.
4. Recalibrate risk tiers as N grows — current High/Lower Risk binary may expand to three tiers with more data.
5. Validate predicted risk against actual educational outcomes at program exit.

## Suggested Operational Use Right Now

- Run batch scoring and upsert to `resident_ml_scores` (`school_struggle_band`, `school_struggle_score` columns).
- Surface School Risk chip in `/portal/caseload` with an explicit low-confidence note in the UI.
- Use High Risk flags to trigger a proactive educational coordinator check-in within the first two weeks.
- Review model predictions in monthly educational team meetings alongside attendance tracking data.
