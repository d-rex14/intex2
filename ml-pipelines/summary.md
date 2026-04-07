# ML Pipelines Summary

## `01_clinical_efficacy/clinical_efficacy_pipeline.ipynb`
This pipeline is a dual explanatory and predictive resident-outcomes model focused on counseling effectiveness and early stall detection. It builds a required resident-month temporal spine, engineers a 6-month health delta target, aggregates interventions and incident severity as controls, and runs both OLS (for interpretable intervention associations) and a tree model (for risk prediction). The notebook is implemented end-to-end with metrics and deployment notes, but stall-recall performance is still low for autonomous high-stakes use.
Status: Baseline complete; needs predictive tuning/threshold work.

## `02_incident_leading_indicators/incident_leading_indicators.ipynb`
This is an early-warning severe-incident classifier (self-harm, runaway, and severe behavioral events) using month-T predictors to forecast month-T+1 risk with explicit leakage prevention. It includes both logistic interpretation (odds framing for sleep/anxiety indicators) and predictive triage scoring, and evaluates with precision-recall emphasis due to class imbalance. It is built as a safety-first decision-support workflow with clear deployment direction.
Status: Functionally complete; needs operational threshold calibration.

## `03_safehouse_value_add/safehouse_value_add.ipynb`
This explanatory-only pipeline estimates case-mix-adjusted safehouse value-add using fixed-effects style OLS and then overlays operations funding to assess allocative efficiency. It computes 6-month clinical deltas, controls for intake differences, extracts safehouse coefficients with significance, and compares value-add against budget alignment. It appears complete for leadership/explanatory analytics, with follow-up work mostly in robustness checks and dashboard packaging.
Status: Complete for current requirement scope.

## `04_donor_upgrade_predictor/donor_upgrade_predictor.ipynb`
This is a pure predictive fundraising pipeline that identifies one-time donors most likely to upgrade to recurring giving, with strict leakage control by using only pre-upgrade behavior features. It uses a sklearn pipeline/column transformer, outputs probability scores, evaluates via ROC/AUC, and includes feature-importance and microservice deployment notes. Current results indicate strong ranking utility for top-decile targeting.
Status: Complete baseline and deployment-ready conceptually.

## `donor-churn-prediction.ipynb`
This standalone pipeline predicts donor churn/lapse risk using supporter and donation RFM-style behavior features and outputs risk tiers for outreach prioritization. It includes preprocessing, model comparison/tuning, feature-importance analysis, ROC/PR/confusion evaluation, and export of model plus scored donor lists. It appears end-to-end complete for decision support and integration.
Status: Complete baseline; monitor drift and retrain periodically.

## `reintegration-readiness.ipynb`
This standalone pipeline scores resident reintegration readiness using both explanatory logistic analysis and predictive gradient boosting over aggregated education, health, counseling, incidents, plans, and visitation signals. It outputs readiness tiers (`Not Ready`, `Approaching`, `Ready`) and explicitly treats false-positive readiness errors as high risk. Implementation appears end-to-end, though confidence is constrained by small sample size.
Status: Complete baseline; needs larger-sample validation.

## `social-media-optimization.ipynb`
This pipeline optimizes outreach posting strategy by modeling engagement and donation referrals from platform, format, CTA usage, timing, and boost behavior features. It combines explanatory OLS insights with predictive scoring for pre-publish decision support and exports model/recommendation artifacts for API/UI use. It is practical and actionable for content strategy requirements.
Status: Complete baseline and operationally usable.

## `school-struggle-risk.ipynb`
This notebook builds a school-struggle risk model centered on trauma, incident, education, and counseling signals, with explicit leakage controls and both explanatory logit and predictive GBM tracks. It defines operational risk tiers, outputs resident-level scores, and uses small-N safeguards (including LOO-CV emphasis and conservative interpretation). It is methodologically strong and implementation-complete as decision support.
Status: Complete baseline; requires ongoing validation/calibration.

## `resident-wellbeing-prediction.ipynb`
This broader longitudinal pipeline constructs a late-period composite wellbeing index (physical, mental, social), predicts it from early-period features, and also classifies high-wellbeing status. It includes temporal splitting, dual regression/classification tracks, per-dimension analysis, tiered scoring output, and saved deployment artifacts. The structure is production-oriented, with the main limitation being dataset size for stability.
Status: Complete baseline; improve robustness with additional data.