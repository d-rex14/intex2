# Project Context: Lighthouse Sanctuary Data Pipeline (IS 455) — Pipeline 6

## Overview

We are building an end-to-end machine learning pipeline for a safehouse organization that rehabilitates victims of abuse. This pipeline serves as a core deliverable for an academic Machine Learning course (IS 455). The grading rubric heavily penalizes "algorithm-only thinking" and rewards complete pipeline thinking, reproducible data preparation, and a strict separation between explanatory (causal) and predictive goals.

## The Business Problem

We are addressing the Resident Reintegration problem: "Which residents are genuinely ready to transition out of the safehouse into independent living, and which need continued support before a safe exit can be facilitated?"

This question carries high stakes: a false-positive readiness assessment (declaring someone ready when they are not) can expose a vulnerable resident to serious harm. The model must be calibrated conservatively to minimize this error type.

## Architecture & Paths

- **Raw Data:** `../../data/raw/` (Contains: `residents.csv`, `education_records.csv`, `health_wellbeing_records.csv`, `process_recordings.csv`, `incident_reports.csv`, `intervention_plans.csv`, `home_visitations.csv`)
- **Textbook Reference:** `../../Textbook_Chapters/` (Contains `Chapter0.md`, `Chapter1.md`, etc. Use these to align terminology with the course.)
- **Target Output:** A Jupyter Notebook inside the `ml-pipelines/06_reintegration_readiness` directory.

## The Feature Engineering Architecture (Critical)

The pipeline must aggregate longitudinal resident data across all relevant domains into a resident-level feature vector:

- **Education signals:** Attendance rates, academic progress scores, program completion flags
- **Health signals:** Physical and mental health scores, counseling session frequency
- **Incident signals:** Count and severity of recent incidents (high severity is a negative readiness signal)
- **Plan completion:** Intervention plan milestone progress
- **Visitation signals:** Home visitation outcomes and safety assessments
- **Baseline risk:** Initial intake risk level and case category

The target variable is a three-tier readiness band: `Not Ready`, `Approaching`, `Ready`. False-positive readiness errors are treated as the higher-cost mistake and should be reflected in threshold calibration.
