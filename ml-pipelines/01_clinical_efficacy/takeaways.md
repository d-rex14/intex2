# Clinical Efficacy Pipeline Takeaways

## What This Pipeline Answered

This pipeline addressed two distinct questions:

- **Explanatory:** Which intervention patterns are associated with sustained 6-month health improvement?
- **Predictive:** Can we flag resident-month cases likely to stall so staff can intervene earlier?

It did so by constructing a monthly resident spine and defining a sustained outcome:

- `health_score_delta_6m = health_score(T+6) - health_score(T)`

## Key Dataset and Engineering Outcomes

- A longitudinal **resident-month** dataset was successfully built from temporally misaligned sources.
- Daily counseling sessions were aggregated into monthly intervention count features.
- Incident data was translated into a monthly confounder (`monthly_high_severity_incidents`).
- Baseline condition and risk controls were included to improve explanatory validity.

## Model Performance Snapshot

From the current run:

- **Regression MAE:** `0.1829`
- **Regression RMSE:** `0.2166`
- **Stall classification precision:** `0.3333`
- **Stall classification recall:** `0.1111`

Interpretation:

- Continuous outcome prediction is directionally useful but not yet high-confidence for individual-level decisions.
- Stall detection recall is currently low; this model likely misses many true at-risk residents.
- This is suitable as an exploratory/decision-support baseline, not a standalone intervention trigger.

## Most Important Predictive Signals

Top predictive features in the tree-based model included:

- `safehouse_id`
- baseline health/education markers (`general_health_score_t`, `progress_percent_t`, `attendance_rate_t`)
- intervention count features (especially legal-services exposure)

### Safehouse Signal: What It Means

`safehouse_id` emerging as a top feature suggests outcomes differ by facility context. This can represent meaningful operational differences (staffing, program execution quality, resident case mix, local risk environment), but it is **not** direct proof of causal facility effect.

Actionable implication: use this as a prompt for safehouse-level comparative analysis, adjusted for baseline case mix and risk.

## Explanatory Findings and Causal Limits

- In this run, no intervention count feature reached conventional statistical significance in OLS (`p < 0.05`).
- Some control variables showed stronger signal than specific intervention counts.

Causal caveat:

- This is observational data, so omitted variable bias and time-varying confounding remain plausible.
- Findings should be interpreted as **associations**, not definitive treatment effects.

## Business and Program Takeaways

- The current pipeline is strong for **monitoring and hypothesis generation**.
- It is not yet strong enough for automated high-stakes triage without human review.
- The largest immediate opportunity is a **safehouse performance audit** using adjusted comparisons.

## Recommended Next Improvements

1. Treat `safehouse_id` as categorical in all explanatory comparisons and run safehouse fixed-effects analyses.
2. Improve stall detection recall (class balancing, threshold tuning, alternative models, richer features).
3. Add lagged predictors (previous-month incidents, prior trend in health and attendance).
4. Add validation across multiple temporal folds for stability.
5. Define operational policy thresholds with leadership (acceptable false negatives vs false positives).

## Suggested Operational Use Right Now

- Run nightly scores as a **risk signal**, not a final decision.
- Route high-risk flags to social workers for case review.
- Review explanatory findings monthly to update clinical guidelines and data collection priorities.

