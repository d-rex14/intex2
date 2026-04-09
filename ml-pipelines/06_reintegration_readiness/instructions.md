# Instructions: Generate the Reintegration Readiness ML Pipeline Notebook

You are an expert Data Scientist and Academic Mentor. Your task is to write a complete, fully executable Jupyter Notebook (`.ipynb`) that fulfills the strict requirements of the IS 455 rubric.

Do not write a standalone Python script. Generate the JSON structure for a Jupyter Notebook containing markdown cells for narrative and code cells for execution. Save the output to `ml-pipelines/06_reintegration_readiness/reintegration-readiness.ipynb`.

The notebook MUST contain the following 6 sections, with markdown narratives explaining the "why" behind the code.

## 1. Problem Framing

- **Markdown:** Define the business problem clearly. Explain that for this pipeline, we are tackling BOTH an explanatory goal (identifying which domains of resident progress — health, education, safety — most strongly predict readiness) and a predictive goal (classifying each resident into a readiness tier to support case planning decisions).
- Reference Chapter 1 concepts (translating social-work context into technical requirements).
- **Explicitly state the asymmetric cost structure:** a false-positive (classifying "Ready" when not ready) is more dangerous than a false-negative (classifying "Not Ready" when actually ready). This must drive threshold and model selection decisions.

## 2. Data Acquisition, Preparation & Exploration

- **Code:** Load all relevant CSVs from `../../data/raw/`.
- **Code (Resident-Level Aggregation):** Build a resident-level feature matrix by joining and aggregating across education, health, incident, plan, and visitation tables. Each row = one resident's cumulative program history.
- **Code (Target Engineering):** Define the three-tier readiness label using a rubric-based scoring approach: combine attendance, health scores, incident recency, and plan completion into a composite readiness signal, then bucket into `Not Ready` / `Approaching` / `Ready`.
- **Code (Exploration):** Plot feature distributions by tier, visualize correlation heatmaps, examine class balance across the three tiers.
- **Code (Reproducibility):** Wrap preprocessing in a `sklearn.pipeline.Pipeline` with `ColumnTransformer` (Chapter 7 requirement).

## 3. Modeling & Feature Selection

- **Markdown:** Explicitly separate the two modeling approaches.
- **Code (Explanatory Model):** Fit a Logistic Regression (multinomial for three tiers, or binary for Ready vs. Not Ready). The goal is interpretability — which domain features carry the strongest odds-ratio signal? Examine coefficients with standard errors.
- **Code (Predictive Model):** Fit a Gradient Boosting classifier (GradientBoostingClassifier). The goal is out-of-sample accuracy and well-calibrated probabilities for tier assignment.
- **Code:** Justify feature selection using domain reasoning and feature importance rankings.

## 4. Evaluation & Interpretation

- **Code:** Perform a proper train/test split (stratified by tier label).
- **Code:** Output classification report (precision, recall, F1 per tier), confusion matrix, and ROC-AUC where applicable.
- **Markdown:** Interpret recall for the "Ready" class specifically. A low recall means we are being conservative (under-predicting readiness), which is the safer direction. A high false-positive rate for "Ready" would be the operationally dangerous outcome.
- **Note small sample caveat:** With N=60 residents, results are directional only. Include LOO-CV or stratified k-fold to improve stability estimates.

## 5. Causal and Relationship Analysis

- **Markdown (Critical Grading Section):** Write a rigorous analysis of the logistic model's findings.
  - Which domain coefficients (health vs. education vs. incident severity) were statistically significant?
  - Do incident counts dominate readiness predictions, or do positive progress signals (education, health) matter more?
  - Discuss omitted variable bias: social network support, housing availability, and post-exit safety plans are not modeled here but are real readiness determinants.
  - Contrast logistic coefficients with Gradient Boosting feature importances — agreement increases confidence; disagreement signals potential overfitting.

## 6. Deployment Notes

- **Markdown:** Explain how this model integrates into the Watchtower caseload portal. The predictive model runs on a scheduled batch job, writing readiness scores and tier bands to `resident_ml_scores.reintegration_band` in Supabase. The portal's `/portal/caseload` page surfaces a Reintegration chip (Ready / Approaching / Not Ready) in each resident's row and in the resident detail modal under "Model Insights". Social workers review the model output alongside their direct case knowledge — the model provides a structured signal, not an autonomous discharge decision.
- Include the export cell at the notebook's end that upserts scored rows to Supabase using `on_conflict="resident_id"`, updating only the `reintegration_band` and `reintegration_score` columns.
