# Instructions: Generate the Resident Wellbeing Prediction ML Pipeline Notebook

You are an expert Data Scientist and Academic Mentor. Your task is to write a complete, fully executable Jupyter Notebook (`.ipynb`) that fulfills the strict requirements of the IS 455 rubric.

Do not write a standalone Python script. Generate the JSON structure for a Jupyter Notebook containing markdown cells for narrative and code cells for execution. Save the output to `ml-pipelines/08_resident_wellbeing_prediction/resident-wellbeing-prediction.ipynb`.

The notebook MUST contain the following 6 sections, with markdown narratives explaining the "why" behind the code.

## 1. Problem Framing

- **Markdown:** Define the business problem clearly. Explain that this pipeline is a longitudinal wellbeing model with TWO parallel tracks: (1) regression — predicting the continuous Composite Wellbeing Index (CWI) from early-period features, and (2) classification — identifying residents likely to reach high-wellbeing status (CWI ≥ 6.5).
- Define the CWI formula: `CWI = 0.40 × Physical + 0.35 × Mental + 0.25 × Social`.
- Define the four wellbeing tiers: At Risk (<4.5), Developing (4.5–6.0), Progressing (6.0–7.5), Thriving (≥7.5).
- Reference Chapter 1 concepts (translating holistic care goals into dual-output ML requirements).

## 2. Data Acquisition, Preparation & Exploration

- **Code:** Load all relevant CSVs from `../../data/raw/`.
- **Code (Temporal Split):** Define early-period and late-period data windows. Compute the CWI target from late-period `health_wellbeing_records` (physical, mental, social sub-scores). Engineer the 27 predictors from early-period signals: baseline health scores, education engagement, counseling session counts, incident history, intervention plan status.
- **Code (CWI Construction):** Compute `CWI = 0.40 × physical_score + 0.35 × mental_score + 0.25 × social_score` for the target period. Create the `high_wellbeing_flag` binary (CWI ≥ 6.5). Assign wellbeing tier labels.
- **Code (Exploration):** Plot CWI distribution, tier frequency, per-dimension score distributions. Visualize correlation between early-period features and late-period CWI.
- **Code (Reproducibility):** Wrap preprocessing in a `sklearn.pipeline.Pipeline` with `ColumnTransformer` for both tracks (Chapter 7 requirement).

## 3. Modeling & Feature Selection

- **Markdown:** Explicitly separate the three modeling tracks (explanatory, regression-predictive, classification-predictive).
- **Code (Explanatory):** Fit OLS regression on the CWI target to identify which early-period features have statistically significant associations with eventual wellbeing.
- **Code (Regression Track):** Fit a GradientBoostingRegressor. Best params via cross-validation: `learning_rate=0.03`, `max_depth=2`, `n_estimators=300`. This predicts the continuous CWI.
- **Code (Classification Track):** Fit a GradientBoostingClassifier. Best params: `learning_rate=0.05`, `max_depth=2`, `n_estimators=100`. This predicts the `high_wellbeing_flag` binary.
- **Code:** Save trained artifacts to the current directory: `wellbeing_regressor_model.sav` and `wellbeing_classifier_model.sav` using `joblib.dump`.

## 4. Evaluation & Interpretation

- **Code:** Temporal train/test split (by resident intake cohort where possible, otherwise 80/20 stratified).
- **Code (Regression metrics):** CV RMSE, hold-out RMSE, MAE, R². Target: CV RMSE ≈ 0.210.
- **Code (Classification metrics):** ROC-AUC, F1, precision/recall per class, confusion matrix.
- **Code:** Save model metrics to `wellbeing_model_metrics.json` including best params, CV RMSE, feature count (27), and training N (60).
- **Markdown:** Interpret CWI prediction error in operational terms: an RMSE of 0.21 on a 0–10 scale means predictions are within ±0.21 CWI points on average — sufficient for tier assignment in most cases, but borderline-tier residents should be reviewed manually.

## 5. Causal and Relationship Analysis

- **Markdown (Critical Grading Section):** Write a rigorous analysis of the OLS model's findings.
  - Which sub-dimensions (physical, mental, social) drive overall CWI most at program exit? Does the pipeline validate the 0.40/0.35/0.25 weighting, or do data-driven importances suggest different relative contributions?
  - Are early health scores predictive of late-period mental wellbeing, or do they only predict physical outcomes?
  - Discuss confounders not in the model: post-program housing, family reunification progress, trauma type, length of stay.
  - Contrast OLS findings with GBM feature importances — do both models agree that the same early-period signals are most prognostic?

## 6. Deployment Notes

- **Markdown:** Explain how this model integrates into the Watchtower caseload portal. Both trained artifacts (`wellbeing_regressor_model.sav`, `wellbeing_classifier_model.sav`) are loaded at scoring time. The scoring batch writes `predicted_cwi`, `high_wellbeing_prob`, `high_wellbeing_flag`, and `wellbeing_tier` to `resident_ml_scores.wellbeing_band` in Supabase. The portal's `/portal/caseload` page surfaces a Wellbeing chip (At Risk / Developing / Progressing / Thriving) per resident and in the resident detail modal under "Model Insights". Program directors use wellbeing tier trends across residents to evaluate program-level outcomes.
- Include the export cell at the notebook's end that upserts to Supabase using `on_conflict="resident_id"`, updating only the `wellbeing_band` and `wellbeing_score` columns.
