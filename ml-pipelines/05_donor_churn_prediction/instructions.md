# Instructions: Generate the Donor Churn Prediction ML Pipeline Notebook

You are an expert Data Scientist and Academic Mentor. Your task is to write a complete, fully executable Jupyter Notebook (`.ipynb`) that fulfills the strict requirements of the IS 455 rubric.

Do not write a standalone Python script. Generate the JSON structure for a Jupyter Notebook containing markdown cells for narrative and code cells for execution. Save the output to `ml-pipelines/05_donor_churn_prediction/donor-churn-prediction.ipynb`.

The notebook MUST contain the following 6 sections, with markdown narratives explaining the "why" behind the code.

## 1. Problem Framing

- **Markdown:** Define the business problem clearly. Explain that this pipeline has BOTH an explanatory goal (understanding which behavioral patterns are associated with lapse) and a predictive goal (ranking donors by churn probability so outreach teams can intervene).
- Reference Chapter 1 concepts (translating fundraising context into technical requirements).
- Define what "churn" means operationally: a donor who has not given in over 12 months, or whose recency-to-tenure ratio crosses a defined threshold.

## 2. Data Acquisition, Preparation & Exploration

- **Code:** Load `donations.csv` and `supporters.csv` from `../../data/raw/`.
- **Code (Donor-Level Spine):** Aggregate all donation history to the supporter level. Engineer RFM features: `recency_days`, `frequency`, `total_value`, `avg_value`, `tenure_days`, `acquisition_channel`.
- **Critical:** Do NOT call `basic_wrangling()` on the model dataframe — it incorrectly flags continuous RFM features as ID-like columns due to high cardinality. Use a simple print statement to inspect shape and columns instead.
- **Code (Exploration):** Plot distributions of RFM features, visualize churn vs. non-churn segments, examine acquisition channel breakdowns.
- **Code (Reproducibility):** Wrap preprocessing in a `sklearn.pipeline.Pipeline` with `ColumnTransformer` for consistent train/test application (Chapter 7 requirement).

## 3. Modeling & Feature Selection

- **Markdown:** Explicitly separate the two modeling approaches.
- **Code (Explanatory Model):** Fit a Logistic Regression. The goal is interpretability — which RFM factors carry the strongest odds-ratio signal for lapse risk? Examine coefficients with confidence intervals.
- **Code (Predictive Model):** Fit a Random Forest classifier with hyperparameter tuning (GridSearchCV or RandomizedSearchCV). The goal is maximizing AUC-ROC for donor ranking.
- **Code:** Justify feature selection using domain reasoning (RFM framework) and model feature importances.

## 4. Evaluation & Interpretation

- **Code:** Perform a proper train/test split (stratified by churn label to preserve class balance).
- **Code:** Output ROC-AUC, Precision-Recall curve, and confusion matrix.
- **Markdown:** Interpret metrics in business terms. What is the cost of a false negative (missing a high-risk donor) vs. a false positive (reaching out to someone who was not going to lapse)? For donor outreach, false negatives are typically more costly.
- **Code:** For the permutation importance step, pass only the fitted model step (not the full pipeline) to avoid double-preprocessing: `permutation_importance_report(best_rf.named_steps['model'], X_test_prep, ...)`.

## 5. Causal and Relationship Analysis

- **Markdown (Critical Grading Section):** Write a rigorous analysis of the logistic model's findings.
  - Which RFM coefficients were statistically significant?
  - Does recency dominate frequency and monetary signals, or is the relationship more nuanced?
  - Discuss omitted variable bias: we cannot observe donor life events, income changes, or organizational sentiment — these are real confounders.
  - Contrast logistic coefficients with Random Forest feature importances — do the two models agree on which features matter most?

## 6. Deployment Notes

- **Markdown:** Explain how this model integrates into the Watchtower donor portal. The predictive model runs on a scheduled batch job, writing churn risk scores and tiers to the `donor_churn_scores` Supabase table. The portal's `/portal/donors` page surfaces the `churn_risk_tier` badge in the Top Donors table and the donor detail modal. Outreach coordinators use the High-risk tier list to prioritize personal follow-up calls and re-engagement campaigns.
- Include the export cell at the notebook's end that upserts scored rows to Supabase using `on_conflict="supporter_id"`.
