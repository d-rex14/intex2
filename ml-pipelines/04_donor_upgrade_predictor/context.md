# Project Context: Lighthouse Sanctuary Data Pipeline (IS 455) - Pipeline 4

## Overview

We are building an end-to-end machine learning pipeline for a safehouse organization. This pipeline serves as a core deliverable for an academic Machine Learning course (IS 455) and specifically targets the "Interactive Deployment" requirement.

## The Business Problem: Donor Upgrade Prediction

We are addressing a Growth/Fundraising problem: "Which specific one-time donors exhibit the behavioral clustering (e.g., event attendance, multiple small gifts, in-kind donations) that yields a high probability of converting to a recurring monthly pledge?"

## Architecture & Paths

- **Raw Data:** `../../data/raw/` (Contains: `donations.csv`, `supporters.csv`, `in_kind_donation_items.csv`)
- **Textbook Reference:** `../../Textbook_Chapters/` (Contains `Chapter1.md`, `Chapter13.md`, `Chapter15.md`, `Chapter16.md`, `Chapter17.md`). **These chapters dictate the required methodology. You must align your code and markdown explanations with the procedures defined in these files.**
- **Target Output:** A Jupyter Notebook named `donor_upgrade_predictor.ipynb` inside the current directory.

## The Data Engineering Architecture (Critical Leakage Warning)

We must construct a "Donor-Level Spine" avoiding point-in-time data leakage.

1. **The Target (Y):** Did the supporter EVER make a donation where `is_recurring == True`? (Binary: 1 or 0).
2. **The Predictors (X):** We must aggregate the donor's behavior _strictly prior_ to their first recurring donation (or all their behavior if they never upgraded).
   - Features should include: `total_one_time_value`, `count_one_time_donations`, `days_between_first_and_last_donation`, `count_in_kind_items`, `acquisition_channel`.
