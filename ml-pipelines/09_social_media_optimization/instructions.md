# Instructions: Generate the Social Media Optimization ML Pipeline Notebook

You are an expert Data Scientist and Academic Mentor. Your task is to write a complete, fully executable Jupyter Notebook (`.ipynb`) that fulfills the strict requirements of the IS 455 rubric.

Do not write a standalone Python script. Generate the JSON structure for a Jupyter Notebook containing markdown cells for narrative and code cells for execution. Save the output to `ml-pipelines/09_social_media_optimization/social-media-optimization.ipynb`.

The notebook MUST contain the following 6 sections, with markdown narratives explaining the "why" behind the code.

## 1. Problem Framing

- **Markdown:** Define the business problem clearly. Explain that this pipeline has BOTH an explanatory goal (understanding which posting characteristics drive engagement and donation referrals) and a predictive goal (scoring planned posts before publication to recommend higher-impact formatting choices).
- Distinguish between the two target variables: engagement (awareness-oriented) vs. donation referrals (conversion-oriented). A post can perform well on one and poorly on the other.
- Reference Chapter 1 concepts (translating content strategy goals into ML requirements).
- Note that the social media context requires caution around platform algorithm changes as a confounding factor.

## 2. Data Acquisition, Preparation & Exploration

- **Code:** Load `social_media_posts.csv` and `public_impact_snapshots.csv` from `../../data/raw/`.
- **Code (Feature Engineering):** Extract and encode posting attributes:
  - `platform` — categorical (one-hot encode)
  - `content_format` — categorical (image/video/text/carousel)
  - `cta_present` — binary flag
  - `cta_type` — categorical if present
  - `day_of_week`, `hour_of_day` — from post timestamp
  - `is_boosted` — binary flag; `boost_budget` — continuous
- **Code (Exploration):** Plot engagement distributions by platform and format. Visualize donation referral rates by CTA type. Examine boost budget vs. engagement relationship. Check for outlier viral posts that may skew models.
- **Code (Reproducibility):** Wrap preprocessing in a `sklearn.pipeline.Pipeline` with `ColumnTransformer` (Chapter 7 requirement).

## 3. Modeling & Feature Selection

- **Markdown:** Explicitly separate the two modeling approaches.
- **Code (Explanatory Model):** Fit OLS regression on both targets separately. The goal is interpretability — which posting characteristics carry statistically significant associations with engagement and donation referrals? Include platform fixed effects.
- **Code (Predictive Model):** Fit a Random Forest or Gradient Boosting regressor for engagement prediction and a separate classifier for high-referral prediction. Use cross-validated hyperparameter search.
- **Code:** Extract feature importances and produce a ranked "posting strategy guide" — a table showing which choices most reliably improve expected engagement or referrals.

## 4. Evaluation & Interpretation

- **Code:** Train/test split (time-based if timestamps allow, otherwise random 80/20).
- **Code:** Regression metrics: RMSE, MAE, R² for engagement prediction. Classification metrics: AUC, F1 for high-referral prediction.
- **Markdown:** Interpret model performance in content strategy terms. Even a low R² OLS model provides directional guidance on which platform/format combinations to prefer — the goal is pre-publish decision support, not precise engagement forecasting.

## 5. Causal and Relationship Analysis

- **Markdown (Critical Grading Section):** Write a rigorous analysis of the OLS model's findings.
  - Which platform shows highest engagement per post, controlling for format and timing?
  - Does CTA presence reliably increase donation referrals, or is it confounded by the type of content that includes CTAs?
  - Does boost budget have diminishing returns? At what approximate spend level does marginal ROI drop?
  - Discuss platform algorithm changes, posting frequency effects, and audience composition as confounders that are unobservable in this data.

## 6. Deployment Notes

- **Markdown:** Explain how this model integrates into the Watchtower portal and operations workflow. The predictive scoring model is available as a pre-publish recommendation tool: before scheduling a post, the social media representative can enter planned post attributes (platform, format, CTA, timing, boost budget) and receive a predicted engagement score and donation referral probability. Scores are written to `social_media_ml_scores` in Supabase. The portal's reporting section can surface top-performing post patterns and underperforming platform/format combinations for content strategy reviews.
- Include export logic at the notebook's end for writing post-level scores and model recommendation artifacts to Supabase or as a local JSON/CSV file for API consumption.
