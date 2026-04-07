# Instructions for Cursor: Generate the Incident Early Warning Pipeline

You are an expert Data Scientist and Academic Mentor. Write a complete, fully executable Jupyter Notebook (`.ipynb`) that fulfills the strict requirements of the IS 455 rubric.

Do not write a standalone Python script. Generate the JSON structure for a Jupyter Notebook containing markdown cells for narrative and code cells for execution. Save the output to `incident_leading_indicators.ipynb`.

The notebook MUST contain the following 6 sections, with markdown narratives explaining the "why" behind the code.

## 1. Problem Framing
- **Markdown:** Define the business problem. We are dealing with a highly imbalanced classification problem. 
- Explain the distinct goals:
  - **Explanatory:** We need to quantify exactly how much a 1-point drop in sleep score or an increase in anxious sessions increases the *odds* of an incident. 
  - **Predictive:** We need a robust algorithm to act as an early warning system.
- State clearly that for this specific business context, **Recall is more important than Precision**. A False Negative (missing an incident) is dangerous; a False Positive (checking on a resident who is fine) is an acceptable operational cost.

## 2. Data Acquisition, Preparation & Exploration
- **Code:** Load the CSVs from `../../data/raw/`.
- **Code (The Temporal Spine):** - Create a "Resident-Month" spine using `health_wellbeing_records` as the base.
  - **Target Creation:** Left join `incident_reports`. Create a binary target `incident_next_30_days` that equals 1 if the resident had a `SelfHarm`, `RunawayAttempt`, or `High`/`Medium` severity `Behavioral` incident in the month *following* the current health record date.
  - **Feature Engineering:** Aggregate `process_recordings` for the current month. Create features for: `total_sessions_month`, `count_anxious_start` (where `emotional_state_observed` == 'Anxious'), and `count_sad_start`.
  - **Merge Baseline:** Join `initial_risk_level` from `residents.csv`.
- **Code (Exploration):** Plot the severe class imbalance. Show a boxplot of `sleep_quality_score` for Month T separated by whether an incident occurred in Month T+1.

## 3. Modeling & Feature Selection
- **Markdown:** Explain the need to handle class imbalance (e.g., using `class_weight='balanced'` or SMOTE).
- **Code (Explanatory Model):** Fit a Logistic Regression model (`statsmodels` preferred for p-values and interpretable coefficients). We need to see the log-odds or odds ratios for `sleep_quality_score` and `count_anxious_start`.
- **Code (Predictive Model):** Fit a classification model that handles non-linearities and imbalance well (e.g., Random Forest Classifier or XGBoost with adjusted scale_pos_weight).
- **Code:** Create a scikit-learn `Pipeline` and `ColumnTransformer` to handle scaling of numeric features and one-hot encoding of categoricals (like `initial_risk_level`).

## 4. Evaluation & Interpretation
- **Code:** Perform a train/test split (stratified by the target variable).
- **Code:** Output the Confusion Matrix, Classification Report, and plot the Precision-Recall Curve (do NOT rely solely on ROC-AUC due to the class imbalance).
- **Markdown:** Interpret the Confusion Matrix in human terms. Explain exactly how many False Positives the staff would have to investigate to successfully catch the True Positives. 

## 5. Causal and Relationship Analysis
- **Markdown (Critical Grading Section):** Analyze the Logistic Regression outputs. 
  - Did the data support the hypothesis? Is `sleep_score` a statistically significant leading indicator? 
  - Discuss Odds Ratios. (e.g., "Holding all else constant, a 1-point decrease in sleep score increases the odds of a severe incident by X%").
  - Discuss limitations: Are we measuring causality, or is a drop in sleep score just a symptom of an underlying trauma trigger that we aren't measuring?

## 6. Deployment Notes
- **Markdown:** Describe how this model integrates into the safehouse workflow. Propose a "Clinical Daily Briefing" dashboard where the predictive model runs every night, surfacing a prioritized list of residents who have crossed the high-risk probability threshold based on the last 30 days of their clinical and health data, mandating a preventative check-in from a senior social worker.