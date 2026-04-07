# Project Context: Lighthouse Sanctuary Data Pipeline (IS 455)

## Overview
We are building an end-to-end machine learning pipeline for a safehouse organization that rehabilitates victims of abuse. This pipeline serves as a core deliverable for an academic Machine Learning course (IS 455). The grading rubric heavily penalizes "algorithm-only thinking" and rewards complete pipeline thinking, reproducible data preparation, and a strict separation between explanatory (causal) and predictive goals.

## The Business Problem
We are addressing the Clinical Efficacy problem: "Which specific interventions applied during counseling correlate most strongly with a sustained increase in a resident's health and educational progress, and can we predict which residents are at risk of stalling?"

## Architecture & Paths
- **Raw Data:** `../../data/raw/` (Contains: `residents.csv`, `process_recordings.csv`, `health_wellbeing_records.csv`, `education_records.csv`, `incident_reports.csv`)
- **Textbook Reference:** `../../Textbook_Chapters/` (Contains `Chapter0.md`, `Chapter1.md`, etc. Use these to align terminology with the course).
- **Target Output:** A Jupyter Notebook inside the `ml-pipelines/01_clinical_efficacy` directory.

## The Temporal Data Challenge (Critical)
The raw data is temporally misaligned. `process_recordings` (the predictors) happen on arbitrary days, while `health_wellbeing_records` (the targets) are logged monthly. The pipeline MUST construct a longitudinal "Resident-Month Spine" before any modeling occurs. We are calculating a 6-month delta (Month T to Month T+6) to measure sustained impact.