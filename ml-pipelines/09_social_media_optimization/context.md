# Project Context: Lighthouse Sanctuary Data Pipeline (IS 455) — Pipeline 9

## Overview

We are building an end-to-end machine learning pipeline for a safehouse organization that rehabilitates victims of abuse. This pipeline serves as a core deliverable for an academic Machine Learning course (IS 455). The grading rubric heavily penalizes "algorithm-only thinking" and rewards complete pipeline thinking, reproducible data preparation, and a strict separation between explanatory (causal) and predictive goals.

## The Business Problem

We are addressing the Outreach Optimization problem: "Which social media posting strategies — across platform, content format, CTA usage, timing, and boost behavior — drive the highest engagement and donation referrals, and can we score planned posts before publication to maximize outreach impact?"

This pipeline is outreach-facing rather than case management-focused, supporting the organization's ability to attract donors, raise awareness, and communicate mission impact to the public.

## Architecture & Paths

- **Raw Data:** `../../data/raw/` (Contains: `social_media_posts.csv`, `public_impact_snapshots.csv`)
- **Textbook Reference:** `../../Textbook_Chapters/` (Contains `Chapter0.md`, `Chapter1.md`, etc. Use these to align terminology with the course.)
- **Target Output:** A Jupyter Notebook inside the `ml-pipelines/09_social_media_optimization` directory.

## The Dual-Target Architecture

This pipeline models two outcomes simultaneously:

1. **Engagement Score:** Total post engagement (likes, shares, comments, reach) — maximized for awareness campaigns.
2. **Donation Referrals:** Posts that directly generate donation link clicks or conversions — maximized for fundraising campaigns.

Key predictor categories:
- **Platform:** Which social media channel (Facebook, Instagram, LinkedIn, etc.)
- **Content Format:** Image, video, carousel, text-only
- **CTA Usage:** Whether and what type of call-to-action was included
- **Timing:** Day of week, time of day, posting frequency
- **Boost Behavior:** Whether the post received paid promotion and at what budget level
