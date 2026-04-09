# Reintegration Readiness Pipeline Takeaways

## What This Pipeline Answered

This pipeline addressed two distinct questions:

- **Explanatory:** Which resident progress domains (health, education, incident severity, plan completion, visitation outcomes) are most associated with reintegration readiness?
- **Predictive:** Can we classify each resident into a readiness tier (Not Ready / Approaching / Ready) to help social workers prioritize exit planning conversations?

It did so by constructing a resident-level feature matrix from aggregated longitudinal data across all case management tables.

## Key Dataset and Engineering Outcomes

- A **resident-level** feature matrix was built by joining and aggregating `education_records`, `health_wellbeing_records`, `incident_reports`, `intervention_plans`, and `home_visitations`.
- Target tiers defined using a rubric-based composite signal: `Not Ready`, `Approaching`, `Ready`.
- Incident severity counted as a negative readiness signal; health and education progress as positive signals.
- Asymmetric cost constraint embedded in threshold calibration: false-positive readiness (declaring a resident Ready prematurely) is treated as the higher-cost error type.
- Sample size: N=60 residents — results are directional and should be interpreted conservatively.

## Model Performance Snapshot

- **Explanatory Model:** Logistic Regression (binary or multinomial) for odds-ratio interpretation
- **Predictive Model:** Gradient Boosting Classifier
- **Output tiers:** Not Ready / Approaching / Ready
- **Sample output range:** Readiness scores from 0.01 (firmly Not Ready) to 0.96 (clear Ready signal)
- **Evaluation emphasis:** Recall for "Ready" class deliberately calibrated low (conservative) to minimize false discharges

Interpretation:

- Model is directionally useful as a structured signal to surface in case reviews.
- With N=60, classification confidence intervals are wide; treat as a discussion prompt for social workers, not an autonomous recommendation.

## Most Important Predictive Signals

Top predictive features in the Gradient Boosting model:

- Recent incident severity and count — the strongest negative signal for readiness
- Physical and mental health score trajectories — sustained improvement correlates with higher readiness
- Education attendance rate and academic progress — consistency in structured programming signals stability
- Intervention plan milestone completion — formal goal progress is a direct readiness proxy
- Home visitation safety assessment outcomes — direct safety-check data

## Explanatory Findings and Causal Limits

- Logistic regression confirms that incident severity and health progress carry the strongest log-odds signals.
- Plan completion and visitation outcomes add predictive value over baseline health alone.

Causal caveat:

- This is observational case data. Post-exit support availability, housing stability, and social network strength are real readiness determinants not captured in the model.
- A resident scoring "Ready" by program metrics may still face unsafe post-exit conditions — the model cannot assess external environment risk.
- Findings should drive case review prioritization, not replace social worker judgment.

## Business and Program Takeaways

- The pipeline is strong for **structured case planning support** — surfacing a readiness signal alongside the social worker's direct observations.
- The Approaching tier is especially actionable: residents there are close to readiness and benefit most from targeted plan acceleration (additional counseling, job readiness, housing search).
- Incident severity dominance in the model suggests that incident reduction programs have measurable downstream value for exit planning timelines.

## Recommended Next Improvements

1. Expand to longer case histories as the dataset grows beyond N=60 for more stable estimates.
2. Add external readiness signals: housing plan in place, employment/income status, support network assessment.
3. Implement temporal cross-validation (leave-last-month-out) to better simulate prospective use.
4. Calibrate readiness probability thresholds collaboratively with social work leadership based on organizational risk tolerance.
5. Track model-predicted readiness against actual discharge outcomes to measure predictive validity over time.

## Suggested Operational Use Right Now

- Run batch scoring monthly and upsert results to `resident_ml_scores` in Supabase (`reintegration_band`, `reintegration_score` columns).
- Surface the Reintegration chip (Ready / Approaching / Not Ready) in `/portal/caseload` for staff review.
- Flag Approaching residents for targeted case review at the next staffing meeting.
- Treat Ready predictions as a prompt for a human discharge review, not an autonomous exit authorization.
