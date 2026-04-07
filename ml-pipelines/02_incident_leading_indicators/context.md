# Project Context: Lighthouse Sanctuary Data Pipeline (IS 455) - Pipeline 2

## Overview
We are building an end-to-end machine learning pipeline for a safehouse organization that rehabilitates victims of abuse. This pipeline serves as a core deliverable for an academic Machine Learning course (IS 455).

## The Business Problem: Early Warning for Severe Incidents
We are addressing the Frontline/Clinical crisis problem: "What are the precise leading indicators of a `RunawayAttempt` or `SelfHarm` incident? Specifically, can a drop in `sleep_score` or an 'Anxious' `emotional_state_observed` predict a severe incident in the following 30 days, warranting mandatory staff intervention?"

## Architecture & Paths
- **Raw Data:** `../../data/raw/` (Contains: `incident_reports.csv`, `process_recordings.csv`, `health_wellbeing_records.csv`, `residents.csv`)
- **Textbook Reference:** `../../Textbook_Chapters/` (Reference Chapter 1 for framing, Chapters 9-11 for explanation, Chapter 13 for classification, Chapter 15 for evaluation).
- **Target Output:** A Jupyter Notebook named `incident_leading_indicators.ipynb` inside the current directory.

## The Temporal Data Challenge (Critical)
We are predicting a rare, discrete event (an incident) using a mix of monthly data (health records) and daily data (clinical sessions). 
We will build a "Resident-Month" spine. 
- **The Target (Y):** Did a Target Incident (`RunawayAttempt`, `SelfHarm`, or `Behavioral` with `High` or `Medium` severity) occur in Month T+1? (Binary: 1 or 0).
- **The Predictors (X):** Health scores from Month T, and aggregated clinical emotions from Month T.