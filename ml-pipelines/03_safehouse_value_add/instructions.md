# Instructions for Cursor: Generate the Safehouse Value-Add Pipeline

You are an expert Data Scientist and Academic Mentor. Write a complete, fully executable Jupyter Notebook (`.ipynb`) that fulfills the strict requirements of the IS 455 rubric.

Do not write a standalone Python script. Generate the JSON structure for a Jupyter Notebook containing markdown cells for narrative and code cells for execution. Save the output to `safehouse_value_add.ipynb`.

The notebook MUST contain the following 6 sections, with markdown narratives explaining the "why" behind the code.

## 1. Problem Framing
- **Markdown:** Define the business problem clearly. This is an **Explanatory-only** pipeline. We are NOT trying to predict future resident scores. We are conducting a Causal Inference exercise (Value-Added Modeling) to isolate the true "Safehouse Effect" from the "Case Mix" (the baseline difficulty of the residents they accept).
- Explain that evaluating safehouses purely on raw average outcomes penalizes facilities that take high-risk cases.

## 2. Data Acquisition, Preparation & Exploration
- **Code:** Load `residents.csv`, `health_wellbeing_records.csv`, `safehouses.csv`, and `donation_allocations.csv`.
- **Code (The Target):** Create the Resident-Month spine for the health records and calculate `health_score_delta_6m` as the target variable (Month T+6 - Month T).
- **Code (The Case Mix):** Join the baseline features from `residents.csv`. Dynamically calculate `age_upon_admission` from `date_of_birth` and `date_of_admission`. Select relevant controls: `initial_risk_level`, `case_category`, `is_pwd`, and `family_is_4ps`.
- **Code (The Financials):** Filter `donation_allocations` for `program_area == 'Operations'`. Aggregate the total `amount_allocated` per `safehouse_id`.
- **Code (Exploration):** Plot a naive comparison: A bar chart of raw average `health_score_delta_6m` by Safehouse. (This represents the flawed way leadership currently views performance).

## 3. Modeling & Feature Selection
- **Markdown:** Explain the use of a Fixed Effects OLS Regression. By including dummy variables for each safehouse while controlling for the case mix, the coefficients on the safehouse dummies represent their "Value-Add" relative to a baseline safehouse.
- **Code:** Use `statsmodels.api` to fit an OLS regression. 
  - `Y` = `health_score_delta_6m`
  - `X` = Case Mix variables + `pd.get_dummies(safehouse_id, drop_first=True)`.
- **Code:** Extract the safehouse coefficients and their p-values into a clean DataFrame.

## 4. Evaluation & Interpretation
- **Code:** Create a scatter plot plotting the **Safehouse Value-Add Coefficient** (X-axis) against the **Total Operations Budget** (Y-axis) for each safehouse. 
- **Code:** Calculate the Pearson/Spearman correlation between the Value-Add coefficient and the budget.
- **Markdown:** Interpret the scatter plot. Are the safehouses that generate the highest case-adjusted improvements actually receiving the most funding? Identify specific quadrants (e.g., High Value-Add / Low Funding vs. Low Value-Add / High Funding).

## 5. Causal and Relationship Analysis
- **Markdown (Critical Grading Section):** - Discuss the coefficients of the Case Mix variables. Does `initial_risk_level == Critical` have a strong negative coefficient, proving that adjusting for case mix was mathematically necessary?
  - Discuss the limitations of Omitted Variable Bias (OVB). What unmeasured variables could still be confounding the "Safehouse Effect"? (e.g., local community resources, specific staff tenure).
  - Explicitly state that correlation between budget and value-add does not mean the budget *caused* the value-add; it measures allocative efficiency.

## 6. Deployment Notes
- **Markdown:** Describe a "Resource Allocation Dashboard" for the Executive and Finance teams. Instead of funding safehouses based on historical precedent or raw outcomes, the web app will display this exact 2x2 matrix (Value-Add vs Budget), forcing the board to justify continued `Operations` funding to underperforming facilities, or triggering an audit to see *why* a specific safehouse is highly efficient with low funds.