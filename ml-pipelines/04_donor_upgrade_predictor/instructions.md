# Instructions for Cursor: Generate the Donor Upgrade Predictor

You are an expert Data Scientist and Academic Mentor. Write a complete, fully executable Jupyter Notebook (`.ipynb`) that fulfills the strict requirements of the IS 455 rubric.

**CRITICAL DIRECTIVE: You must strictly follow the procedural methodology outlined in the `../../Textbook_Chapters/` files. Do not use default or shortcut ML workflows. Read the relevant chapter files before generating the corresponding section of the notebook.**

Generate the JSON structure for a Jupyter Notebook. Save the output to `donor_upgrade_predictor.ipynb`. The notebook MUST contain the following 6 sections:

## 1. Problem Framing

- **Action:** Read `../../Textbook_Chapters/Chapter1.md` for framing guidelines.
- **Markdown:** Define the business problem clearly. This is a **Pure Predictive** pipeline. We are not making causal claims about _why_ a donor upgrades; we are building an algorithm to accurately flag _who_ will upgrade. Highlight that the end goal is an interactive tool where staff can input donor stats and get a probability score.

## 2. Data Acquisition, Preparation & Exploration

- **Action:** Read `../../Textbook_Chapters/Chapter7.md` for reproducible pipeline standards.
- **Code:** Load `donations.csv`, `supporters.csv`, and `in_kind_donation_items.csv`.
- **Code (Data Prep):** Create a donor-level dataframe.
  - Define the Target: `has_recurring` (1 if supporter has any recurring donation, 0 otherwise).
  - Aggregate features for each donor using ONLY their non-recurring donations to prevent data leakage.
- **Code (Exploration):** Plot the conversion rate by `acquisition_channel` and a density plot of `total_one_time_amount` split by the target variable.

## 3. Modeling & Feature Selection

- **Action:** Read `../../Textbook_Chapters/Chapter13.md` (Classification) and `Chapter16.md` (Feature Selection).
- **Code:** Use a `sklearn.pipeline.Pipeline` with a `ColumnTransformer` (scaling numerics, one-hot encoding categoricals) as mandated by the course procedures.
- **Code:** Fit a predictive model well-suited for tabular data and probability outputs (e.g., `RandomForestClassifier` or `GradientBoostingClassifier`). Ensure `predict_proba` is used.
- **Code:** Justify your feature selection explicitly based on the methodology in Chapter 16.

## 4. Evaluation & Interpretation

- **Action:** Read `../../Textbook_Chapters/Chapter15.md` for evaluation discipline.
- **Code:** Perform a Train/Test split. Plot an ROC Curve, calculate the AUC, and output a Classification Report.
- **Markdown:** Interpret the results for the marketing team in business terms. Explain how sorting the donor database by the model's `predict_proba` output allows them to focus limited outreach budgets on the top 10% of prospects.

## 5. Causal and Relationship Analysis

- **Markdown:** Acknowledge that while this is a predictive model, we can still extract insights.
- **Code:** Extract and plot Feature Importances.
- **Markdown:** Discuss which features dominate the tree splits. Explicitly state: "Because this is a predictive model using complex trees, we cannot claim these features _cause_ the upgrade, only that they are highly reliable _correlates_."

## 6. Deployment Notes (Microservice Architecture)

- **Action:** Read `../../Textbook_Chapters/Chapter17.md` for deployment standards.
- **Markdown:** You must explicitly describe the following production architecture:
  - **The Database:** Supabase handles data storage but cannot run Python `.joblib` files natively via Edge Functions.
  - **The Inference Engine:** We will deploy a lightweight Python microservice (using FastAPI or Flask) hosted on a container platform (e.g., Render or Cloud Run). This service loads `upgrade_predictor.joblib` into memory.
  - **The Interactive Flow:** The frontend UI sends user inputs (via JSON) to the FastAPI endpoint. The FastAPI server runs the prediction (`predict_proba`) and returns the probability percentage to the UI. The frontend then logs the interaction data back to Supabase.
