# Project Context: Lighthouse Sanctuary Data Pipeline (IS 455) — Pipeline 7

## Overview

We are building an end-to-end machine learning pipeline for a safehouse organization that rehabilitates victims of abuse. This pipeline serves as a core deliverable for an academic Machine Learning course (IS 455). The grading rubric heavily penalizes "algorithm-only thinking" and rewards complete pipeline thinking, reproducible data preparation, and a strict separation between explanatory (causal) and predictive goals.

## The Business Problem

We are addressing the Educational Risk Detection problem: "Which residents are showing early warning signs of school struggle, and can we identify them before their academic trajectory deteriorates significantly?"

School struggle is defined as: `mean_attendance < 0.75` OR `mean_progress < 60`. These thresholds reflect the minimum engagement levels required for meaningful educational progress within the safehouse program.

## Architecture & Paths

- **Raw Data:** `../../data/raw/` (Contains: `residents.csv`, `education_records.csv`, `incident_reports.csv`, `health_wellbeing_records.csv`, `process_recordings.csv`)
- **Textbook Reference:** `../../Textbook_Chapters/` (Contains `Chapter0.md`, `Chapter1.md`, etc. Use these to align terminology with the course.)
- **Target Output:** A Jupyter Notebook inside the `ml-pipelines/07_school_struggle_risk` directory.

## The Leakage Prevention Architecture (Critical)

To build a prospective early-warning model, we must predict future school struggle from current and prior signals — not use education data that overlaps with the outcome period. The pipeline must:

1. Define the outcome from the **most recent** education records (final attendance and progress averages).
2. Use **early-period** features only: trauma history, incident counts prior to the outcome window, counseling session frequency, health scores at intake, baseline academic engagement.
3. Validate the temporal boundary explicitly in the notebook before any modeling occurs.

This strict leakage control is what differentiates a genuine early-warning system from a retrospective description of students who already struggled.
