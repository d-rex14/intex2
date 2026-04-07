# Project Context: Lighthouse Sanctuary Data Pipeline (IS 455) - Pipeline 3

## Overview
We are building an end-to-end machine learning pipeline for a safehouse organization that rehabilitates vulnerable youth. This pipeline serves as a core deliverable for an academic Machine Learning course (IS 455).

## The Business Problem: Isolating the Safehouse "Value-Add" and Budget Efficiency
We are addressing an Executive/Operations problem: "Once we statistically control for baseline 'case mix' (e.g., initial risk levels, age, socioeconomic background), which specific safehouses systematically overperform or underperform in generating sustained resident improvements? Furthermore, does their allocated `Operations` budget actually correlate with their true value-add?"

## Architecture & Paths
- **Raw Data:** `../../data/raw/` (Contains: `residents.csv`, `health_wellbeing_records.csv`, `safehouses.csv`, `donation_allocations.csv`)
- **Textbook Reference:** `../../Textbook_Chapters/` (Reference Chapter 9-11 for Explanatory/Causal modeling, specifically controlling for confounders).
- **Target Output:** A Jupyter Notebook named `safehouse_value_add.ipynb` inside the current directory.

## The Data Engineering Architecture
This pipeline requires joining financial data with clinical outcomes.
1. **The Target (Clinical Delta):** We will use the same sustained improvement metric from Pipeline 1: The 6-month delta in `general_health_score`.
2. **The Case Mix (Controls):** Baseline variables from `residents.csv` (e.g., `initial_risk_level`, `case_category`, `is_pwd`, `family_is_4ps`, calculated `age_upon_admission`).
3. **The Safehouse Effect:** We will treat `safehouse_id` as a categorical fixed effect.
4. **The Financial Overlay:** We will aggregate `donation_allocations.csv` to calculate the total `Operations` budget allocated to each `safehouse_id`.