# Incident Leading Indicators: Key Takeaways

## 1) Main business insight
This pipeline reframes the question from "Is the model accurate?" to "How many true high-risk months can we catch early, and what staff workload does that require?"  
Because severe incidents are rare, recall and precision-recall tradeoffs matter more than headline accuracy.

## 2) Data and feature lessons
- Building a **resident-month spine** is essential for temporal validity.
- Predictors are anchored in Month T, while the target is in Month T+1, which prevents label leakage.
- The most actionable constructed features are:
  - `sleep_quality_score` (Month T)
  - `count_anxious_start` (Month T)
  - `count_sad_start` (Month T)
  - `total_sessions_month` (Month T)
  - `initial_risk_level` baseline context

## 3) Modeling takeaway (explanatory vs predictive)
- The **logistic model** provides interpretable directional relationships and odds-ratio framing for staff and leadership.
- The **Random Forest pipeline** provides operational risk scoring for triage.
- These two models answer different decisions:
  - "What appears associated with elevated risk?" (explanatory)
  - "Who should we check in on tomorrow?" (predictive)

## 4) Imbalance is the central challenge
- Positive class prevalence is low, so default thresholds (like 0.5) can miss nearly all incidents.
- Lowering the threshold increases recall but also increases false positives.
- The right operating point is policy-driven, not purely technical: choose the threshold based on acceptable misses and staff capacity.

## 5) Operational interpretation
The confusion matrix should be read as a staffing plan:
- **True Positives:** crises likely prevented through early intervention.
- **False Negatives:** the most costly errors (missed risk).
- **False Positives:** extra check-ins that consume staff time but are usually acceptable in a safety-first environment.

In practice, leadership can track "false positives per true positive caught" as a practical workload metric.

## 6) Causality caution
The pipeline identifies **associations**, not definitive causes.  
A drop in sleep or rise in anxious sessions may be a symptom of deeper triggers not directly measured in the data.  
Model outputs should support, not replace, clinical judgment.

## 7) Deployment recommendation
Use a nightly "Clinical Daily Briefing" workflow:
1. Recompute Month T features.
2. Score next-month severe incident risk.
3. Rank residents by probability.
4. Trigger mandatory senior social worker review above threshold.
5. Revisit threshold monthly based on miss rate, workload, and outcome trends.

## 8) Bottom line
The strongest learning from this pipeline is that a useful early-warning model is not one with the best overall accuracy; it is one that makes the **safety-vs-workload tradeoff explicit**, measurable, and governable by the safehouse team.
