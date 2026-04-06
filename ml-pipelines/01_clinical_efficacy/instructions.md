# Instructions for Cursor: Generate the Clinical Efficacy ML Pipeline Notebook

You are an expert Data Scientist and Academic Mentor. Your task is to write a complete, fully executable Jupyter Notebook (`.ipynb`) that fulfills the strict requirements of the IS 455 rubric. 

Do not write a standalone Python script. Generate the JSON structure for a Jupyter Notebook containing markdown cells for narrative and code cells for execution. Save the output to `ml-pipelines/01_clinical_efficacy/clinical_efficacy_pipeline.ipynb`.

The notebook MUST contain the following 6 sections, with markdown narratives explaining the "why" behind the code.

## 1. Problem Framing
- **Markdown:** Define the business problem clearly. Explain that for this pipeline, we are tackling BOTH an explanatory goal (identifying which interventions *cause* sustained improvement) and a predictive goal (forecasting which residents will fail to improve, to trigger early warnings). 
- Reference Chapter 1 concepts (translating context into technical requirements).

## 2. Data Acquisition, Preparation & Exploration
- **Code:** Load the CSVs from `../../data/raw/`. 
- **Code (The Temporal Spine):** This is the most complex data engineering step. You must align the daily `process_recordings` with the monthly `health_wellbeing_records`. 
  - Create a row for every `resident_id` per month.
  - Engineer the target: `health_score_delta_6m` (Health at T+6 minus Health at T).
  - Parse the comma-separated `interventions_applied` into one-hot encoded count features per month.
  - Aggregate `incident_reports` to create a `monthly_high_severity_incidents` confounder variable.
- **Code (Exploration):** Plot distributions of the health deltas and correlations between specific interventions and the target.
- **Code (Reproducibility):** Wrap the final scaling and encoding steps in a `sklearn.pipeline.Pipeline` and `ColumnTransformer` (Chapter 7 requirement).

## 3. Modeling & Feature Selection
- **Markdown:** Explicitly separate the two modeling approaches. 
- **Code (Explanatory Model):** Fit a well-specified OLS Regression (`statsmodels` or `sklearn`). The goal here is interpretability. We want to see the coefficients of specific interventions while controlling for baseline risk and incident chaos.
- **Code (Predictive Model):** Fit a robust predictive model (e.g., Random Forest or Gradient Boosting via `xgboost`). The goal here is pure out-of-sample accuracy to flag at-risk residents.
- **Code:** Justify feature selection using domain reasoning (from the markdown) and feature importance attributes.

## 4. Evaluation & Interpretation
- **Code:** Perform a proper train/test split (evaluate temporally if possible, otherwise standard split). 
- **Code:** Output appropriate metrics (RMSE/MAE for regression, or convert the target to a binary "Improved vs Stalled" classification and use Precision/Recall).
- **Markdown:** Interpret the metrics in business terms. What is the operational cost of a false positive (flagging a resident who is fine) vs a false negative (missing a resident who is regressing)?

## 5. Causal and Relationship Analysis
- **Markdown (Critical Grading Section):** Write a rigorous analysis of the explanatory model's findings. 
  - Which intervention coefficients were statistically significant?
  - Does the data support a causal claim, or is there omitted variable bias? (Be honest about the limitations of observational data). 
  - Contrast this with the predictive model's feature importance—did the black-box model rely on different variables than the linear model?

## 6. Deployment Notes
- **Markdown:** Explain exactly how this model integrates into the broader web application. Describe an architecture where the predictive model runs nightly as a batch job, updating a "Risk Dashboard" for the Program Director, while the explanatory findings are used to rewrite the safehouse clinical guidelines.