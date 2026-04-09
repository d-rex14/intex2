# Project Context: Lighthouse Sanctuary Data Pipeline (IS 455) — Pipeline 8

## Overview

We are building an end-to-end machine learning pipeline for a safehouse organization that rehabilitates victims of abuse. This pipeline serves as a core deliverable for an academic Machine Learning course (IS 455). The grading rubric heavily penalizes "algorithm-only thinking" and rewards complete pipeline thinking, reproducible data preparation, and a strict separation between explanatory (causal) and predictive goals.

## The Business Problem

We are addressing the Holistic Resident Wellbeing problem: "Can we construct a composite measure of resident wellbeing — integrating physical health, mental health, and social development — and predict which residents will achieve high wellbeing by program exit based on early-stage signals?"

This is a dual-output pipeline: a regression track predicts the continuous Composite Wellbeing Index (CWI), while a classification track identifies residents likely to reach high-wellbeing status.

## Architecture & Paths

- **Raw Data:** `../../data/raw/` (Contains: `residents.csv`, `health_wellbeing_records.csv`, `education_records.csv`, `process_recordings.csv`, `incident_reports.csv`)
- **Textbook Reference:** `../../Textbook_Chapters/` (Contains `Chapter0.md`, `Chapter1.md`, etc. Use these to align terminology with the course.)
- **Target Output:** A Jupyter Notebook inside the `ml-pipelines/08_resident_wellbeing_prediction` directory.

## The Composite Wellbeing Index (CWI) Architecture (Critical)

The pipeline must construct the CWI as a weighted composite of three sub-dimensions:

```
CWI = 0.40 × Physical_Score + 0.35 × Mental_Score + 0.25 × Social_Score
```

Wellbeing tiers based on CWI:
- **At Risk:** CWI < 4.5
- **Developing:** 4.5 ≤ CWI < 6.0
- **Progressing:** 6.0 ≤ CWI < 7.5
- **Thriving:** CWI ≥ 7.5

A high-wellbeing binary flag is defined at CWI ≥ 6.5 (the `high_wellbeing_threshold`).

The temporal split is critical: compute CWI from **late-period** health records to form the target, and use **early-period** features (27 total, from baseline health, education, and counseling records) as predictors. This ensures the model is genuinely predictive rather than contemporaneous.
