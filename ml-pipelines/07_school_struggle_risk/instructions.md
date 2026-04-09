# Instructions: Generate the School Struggle Risk ML Pipeline Notebook

You are an expert Data Scientist and Academic Mentor. Your task is to write a complete, fully executable Jupyter Notebook (`.ipynb`) that fulfills the strict requirements of the IS 455 rubric.

Do not write a standalone Python script. Generate the JSON structure for a Jupyter Notebook containing markdown cells for narrative and code cells for execution. Save the output to `ml-pipelines/07_school_struggle_risk/school-struggle-risk.ipynb`.

The notebook MUST contain the following 6 sections, with markdown narratives explaining the "why" behind the code.

## 1. Problem Framing

- **Markdown:** Define the business problem clearly. Explain that this pipeline has BOTH an explanatory goal (understanding which trauma, health, and behavioral signals correlate with school struggle) and a predictive goal (flagging residents at risk of academic disengagement early enough for educational staff to intervene).
- Define the binary target: `school_struggle = 1` if `mean_attendance < 0.75` OR `mean_progress < 60`, else 0.
- Reference Chapter 1 concepts (translating educational support context into technical requirements).
- Note the small-N constraint (N=60) and its implications for model interpretability vs. predictive power.

## 2. Data Acquisition, Preparation & Exploration

- **Code:** Load all relevant CSVs from `../../data/raw/`.
- **Code (Leakage-Free Feature Engineering):** Define a clear temporal boundary. Outcome is computed from final-period education records. Predictors come exclusively from early-period data: trauma flags, incident counts before the outcome window, counseling session frequency, intake health scores, and baseline academic engagement signals.
- **Code (Exploration):** Plot attendance and progress distributions by struggle/no-struggle group. Visualize incident rates and health scores across the binary outcome. Examine class balance (note: positive rate ~56.7%).
- **Code (Reproducibility):** Wrap preprocessing in a `sklearn.pipeline.Pipeline` with `ColumnTransformer` (Chapter 7 requirement).

## 3. Modeling & Feature Selection

- **Markdown:** Explicitly separate the two modeling approaches.
- **Code (Explanatory Model):** Fit a Logistic Regression. The goal is interpretability — which features carry statistically significant odds-ratio signals for school struggle? Include 95% confidence intervals.
- **Code (Predictive Model):** Fit a Gradient Boosting Classifier. Best hyperparameters identified via cross-validation: `learning_rate=0.05`, `max_depth=3`, `n_estimators=100`, `subsample=0.9`. Use LOO-CV or stratified k-fold given small sample size.
- **Code:** Justify feature selection using domain reasoning and SHAP or permutation importance rankings.

## 4. Evaluation & Interpretation

- **Code:** Train/test split: 48 train / 12 test (80/20 stratified).
- **Code:** Output ROC-AUC, F1 score, precision/recall per class, confusion matrix.
- **Code (Small-N Safeguards):** Supplement hold-out evaluation with LOO-CV to get more stable performance estimates. Report both.
- **Markdown:** Interpret metrics in operational terms. With Test AUC=0.371 and Test F1=0.333, this model is near-random on the 12-person test set — emphasize LOO-CV results as more reliable. Scores are directional and should be reviewed alongside case worker knowledge, not used as autonomous classification.

## 5. Causal and Relationship Analysis

- **Markdown (Critical Grading Section):** Write a rigorous analysis of the logistic model's findings.
  - Which features (trauma history, incident severity, health scores, counseling frequency) showed significant associations?
  - Is the primary struggle signal driven by trauma/incident disruption or by baseline academic engagement?
  - Discuss confounders: school type and curriculum quality, undiagnosed learning disabilities, peer environment — none of these are modeled.
  - Contrast logistic coefficients with GBM feature importances. Small-N disagreement between models is a normal stability warning.

## 6. Deployment Notes

- **Markdown:** Explain how this model integrates into the Watchtower caseload portal. The predictive model runs batch scoring, writing risk scores and tier bands to `resident_ml_scores.school_struggle_band` in Supabase. The portal's `/portal/caseload` page displays a School Risk chip (High Risk / Lower Risk) per resident and in the resident detail modal. Educational coordinators use this signal to prioritize tutoring, attendance check-ins, and academic support plans. Given AUC performance, the chip should always be accompanied by a confidence caveat in the UI.
- Include the export cell at the notebook's end that upserts scored rows to Supabase using `on_conflict="resident_id"`, updating only the `school_struggle_band` and `school_struggle_score` columns.
