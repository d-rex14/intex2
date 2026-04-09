# Social Media Optimization Pipeline Takeaways

## What This Pipeline Answered

This pipeline addressed two distinct questions:

- **Explanatory:** Which posting characteristics (platform, content format, CTA usage, timing, boost behavior) are associated with higher engagement and more donation referrals?
- **Predictive:** Can we score planned social media posts before publication to recommend higher-impact formatting and timing choices?

It models two separate targets: engagement (awareness) and donation referrals (conversion), which often require different optimization strategies.

## Key Dataset and Engineering Outcomes

- A **post-level** feature matrix was built from `social_media_posts.csv` and `public_impact_snapshots.csv`.
- Engineered features: platform (categorical), content format, CTA presence/type, day-of-week, hour-of-day, boost flag, boost budget.
- Dual-target modeling: separate models for engagement prediction and high-referral classification.
- No long-term model artifacts saved (operationally focused; scoring is done at notebook run time or via an API wrapper).

## Model Performance Snapshot

- **Explanatory Model:** OLS regression on both engagement and donation referral targets
- **Predictive Models:** GBM/Random Forest regressor (engagement) + classifier (high-referral)
- Model emphasis is on directional pre-publish guidance, not precise engagement forecasting
- Even low R² OLS models provide actionable platform/format preference rankings

Interpretation:

- The pipeline's primary value is the **ranked posting strategy guide** derived from feature importances and OLS coefficients, not absolute score accuracy.
- Pre-publish scoring provides a consistent, data-backed input to content decisions that currently rely entirely on intuition.

## Most Important Predictive Signals

Top signals identified across models:

- **Platform** — different channels show systematically different engagement levels per post; platform choice is the dominant lever
- **Content format** — video consistently outperforms text-only; carousel drives higher engagement on image-heavy platforms
- **CTA presence** — posts with explicit CTAs generate measurably more donation referral clicks
- **Boost budget** — paid promotion shows strong engagement correlation, but with diminishing returns at higher spend levels
- **Timing** — day-of-week and hour-of-day patterns exist but are secondary to platform and format choices

## Explanatory Findings and Causal Limits

- OLS coefficients confirm platform fixed effects are large — posting the same content on different platforms produces significantly different expected engagement.
- CTA presence is associated with higher donation referrals but is confounded by content type: posts asking for donations are more likely to include CTAs, and those posts are fundamentally different from awareness content.
- Boost budget shows a log-linear relationship with engagement — each additional dollar has smaller marginal impact at higher spend levels.

Causal caveat:

- Platform algorithm changes over time are a major unobservable confounder — what worked six months ago may reflect different algorithmic reach, not true content quality.
- Audience composition shifts (new followers vs. core donors) affect engagement rates in ways not captured in the post-level data.
- Viral outlier posts (extremely high engagement) can distort OLS coefficients and should be handled as outliers or modeled separately.

## Business and Program Takeaways

- The pipeline is immediately actionable for **content strategy planning** — the ranked guide of platform/format/timing combinations gives the social media representative a data-backed decision framework.
- The highest-ROI finding is typically format: switching from text-only to image or video posts on the same platform yields engagement gains that dwarf timing or boost optimizations.
- CTA effectiveness data directly informs campaign design: every fundraising post should include an explicit donation CTA, while awareness posts should optimize for shareability over conversion.

## Recommended Next Improvements

1. Implement real-time scoring API: accept post attributes as input, return predicted engagement score and referral probability before scheduling.
2. Track model-predicted vs. actual engagement post-by-post to measure calibration over time.
3. Add audience segment data if available (follower demographics, new vs. returning audience reach).
4. Retrain quarterly to account for platform algorithm shifts.
5. Run controlled experiments (A/B testing of CTA type, post timing) to gather causal data beyond observational analysis.

## Suggested Operational Use Right Now

- Run post-level scoring when planning monthly content calendars — use the predicted engagement score to compare planned post variants before scheduling.
- Use the ranked feature importance guide as a standing reference card for the social media representative.
- Surface top-performing and underperforming post patterns in quarterly outreach strategy reviews.
- Write post scores to `social_media_ml_scores` in Supabase for portal-level reporting and trend analysis.
