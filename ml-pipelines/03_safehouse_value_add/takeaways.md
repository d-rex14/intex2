# Safehouse Value-Add Pipeline: Key Takeaways

## What this pipeline answers

This notebook evaluates two leadership questions:

1. After controlling for baseline case mix, which safehouses appear to overperform or underperform on sustained health improvement?
2. Does Operations funding align with measured value-add?

The model is explanatory (not predictive): it estimates conditional relationships using OLS with case-mix controls and safehouse fixed effects.

## Data and modeling snapshot

- Outcome: `health_score_delta_6m` (health at T+6 minus health at T)
- Observations with usable outcome: 174 resident-month rows
- Model type: fixed-effects style OLS (`safehouse_id` dummies + case-mix controls)
- Controls: `initial_risk_level`, `case_category`, `is_pwd`, `family_is_4ps`, computed `age_upon_admission_years`
- Explanatory fit: R-squared = 0.355, Adjusted R-squared = 0.285

## Core findings

### 1) Case mix matters

The case-mix controls are not neutral noise. Some baseline factors show measurable association with 6-month health change, which confirms that raw average comparisons by safehouse are confounded by intake composition.

Notable coefficients from the fitted model:

- `family_is_4ps`: negative and statistically significant
- `age_upon_admission_years`: negative and statistically significant
- Risk-level dummy coefficients are generally negative relative to the omitted `Critical` baseline, but with mixed significance

Interpretation: adjusting for resident mix is mathematically necessary before attributing differences to safehouse performance.

### 2) Safehouse value-add differs after adjustment

Relative to the reference safehouse (safehouse 1), several safehouse effects are materially negative and statistically significant (e.g., safehouses 2, 4, 5, 7, and 9 in this run), while others are closer to zero or positive but not strongly significant.

Interpretation: performance dispersion persists even after controlling for observed case mix.

### 3) Budget alignment with value-add is moderate, not definitive

From the safehouse-level value-add vs Operations budget overlay:

- Pearson correlation: ~0.596 (p ~ 0.0905)
- Spearman correlation: ~0.617 (p ~ 0.0769)

Interpretation: there is a moderate positive relationship directionally, but evidence is not strong enough to claim robust alignment at conventional significance cutoffs in this sample.

## Diagnostic takeaways (Chapter 10 lens)

- Multicollinearity among case-mix predictors appears manageable overall, but age has a relatively elevated VIF and should be monitored.
- Residual diagnostics do not show catastrophic assumption failure, but this remains observational OLS and should be interpreted with caution.
- Diagnostics are signals, not pass/fail gates.

## What leadership should do with this

1. Use the value-add vs budget scatter as a governance tool, not as a one-time chart.
2. Prioritize review of low value-add / high funding safehouses for operational audit and support planning.
3. Investigate high value-add / low funding safehouses for replicable practices.
4. Re-run this pipeline quarterly as new health and allocation data arrive.

## Limits and cautions

- Correlation between budget and value-add does not prove funding caused outcomes.
- Omitted-variable bias likely remains (e.g., staff tenure, local support ecosystems, referral quality, unmeasured trauma severity).
- Coefficients are relative to omitted baseline categories and should be read as conditional differences, not absolute truths.

## Suggested next enhancements

- Add confidence intervals directly to the value-add vs budget plot.
- Run robustness checks (e.g., alternative control sets, robust standard errors).
- Add a simple dashboard view that highlights quadrant membership and trend over time.
