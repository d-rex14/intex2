# Project Context: Lighthouse Sanctuary Data Pipeline (IS 455) — Pipeline 5

## Overview

We are building an end-to-end machine learning pipeline for a safehouse organization that rehabilitates victims of abuse. This pipeline serves as a core deliverable for an academic Machine Learning course (IS 455). The grading rubric heavily penalizes "algorithm-only thinking" and rewards complete pipeline thinking, reproducible data preparation, and a strict separation between explanatory (causal) and predictive goals.

## The Business Problem

We are addressing the Donor Retention problem: "Which donors exhibit behavioral patterns that signal lapse risk, and can we predict which supporters are most likely to stop giving so that outreach can be prioritized before relationships go cold?"

## Architecture & Paths

- **Raw Data:** `../../data/raw/` (Contains: `donations.csv`, `supporters.csv`, `in_kind_donation_items.csv`)
- **Textbook Reference:** `../../Textbook_Chapters/` (Contains `Chapter0.md`, `Chapter1.md`, etc. Use these to align terminology with the course.)
- **Target Output:** A Jupyter Notebook inside the `ml-pipelines/05_donor_churn_prediction` directory.

## The RFM Feature Engineering Architecture (Critical)

Donor churn risk is best captured through RFM-style behavioral features aggregated at the supporter level. The pipeline must construct a "Donor-Level Spine" that avoids point-in-time leakage:

- **Recency:** Days since last donation
- **Frequency:** Total number of donations
- **Monetary:** Total value and average donation amount
- **Tenure:** Days between first and last donation
- **Acquisition channel:** How the donor was originally acquired

The target variable is a binary lapse indicator (no donation in a defined lookback window), or a continuous lapse probability for scoring. Output is a three-tier risk classification (Low / Medium / High).
