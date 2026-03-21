"""
COVID-19 Epidemic Prediction — Feature Engineering & Preprocessing

Loads the merged COVID-19 dataset, engineers time-series and
epidemiological features, computes a composite risk score, handles
missing values, and saves the enriched dataset.

Dependencies: pandas, numpy
"""

import pandas as pd
import numpy as np
import os


# Step 0 — Load the merged dataset
# Resolve path relative to this script's location so the script
# works regardless of where it is invoked from.
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
INPUT_PATH = os.path.join(SCRIPT_DIR, '..', 'data', 'processed', 'covid_merged.csv')
OUTPUT_PATH = os.path.join(SCRIPT_DIR, '..', 'data', 'processed', 'covid_features.csv')

print("Loading data from:", os.path.abspath(INPUT_PATH))
df = pd.read_csv(INPUT_PATH, parse_dates=['date'])


# Step 1 — Sort by Country/Region and date
# Sorting ensures that rolling windows, lags, and percentage changes
# are computed in the correct chronological order per country.
df = df.sort_values(by=['Country/Region', 'date']).reset_index(drop=True)
print("✓ Step 1 — Sorted by Country/Region and date")


# Step 2 — Per-country feature engineering
# Group by country so every rolling/lag operation respects country
# boundaries (no data leakage across countries).

# 2a. rolling_7  — 7-day rolling mean of new_cases
df['rolling_7'] = (
    df.groupby('Country/Region')['new_cases']
      .transform(lambda x: x.rolling(window=7, min_periods=1).mean())
)

# 2b. rolling_14 — 14-day rolling mean of new_cases
df['rolling_14'] = (
    df.groupby('Country/Region')['new_cases']
      .transform(lambda x: x.rolling(window=14, min_periods=1).mean())
)

# 2c. growth_rate — percentage change of new_cases vs previous day
# pct_change() returns NaN for the first row of each group, which is
# expected (no previous day to compare against).
df['growth_rate'] = (
    df.groupby('Country/Region')['new_cases']
      .transform(lambda x: x.pct_change() * 100)
)

# 2d. lag_7  — new_cases value from 7 days ago
df['lag_7'] = (
    df.groupby('Country/Region')['new_cases']
      .transform(lambda x: x.shift(7))
)

# 2e. lag_14 — new_cases value from 14 days ago
df['lag_14'] = (
    df.groupby('Country/Region')['new_cases']
      .transform(lambda x: x.shift(14))
)

# 2f. cases_per_million — confirmed per million population
df['cases_per_million'] = df['confirmed'] / df['population'] * 1_000_000

# 2g. death_rate — deaths as a percentage of confirmed cases
# np.where handles division-by-zero: if confirmed == 0, death_rate = 0.
df['death_rate'] = np.where(
    df['confirmed'] == 0,
    0.0,
    df['deaths'] / df['confirmed'] * 100
)

print("✓ Step 2 — Engineered features: rolling_7, rolling_14, "
      "growth_rate, lag_7, lag_14, cases_per_million, death_rate")


# Step 3 — Composite risk_score (0–100)
# Normalize each component to [0, 1] using min-max scaling.
# Replace inf/-inf with NaN first so they don't distort the range,
# then clip to [0, 1] as a safety net.

def min_max_normalize(series: pd.Series) -> pd.Series:
    """Min-max normalize a series to [0, 1], handling inf and NaN."""
    s = series.replace([np.inf, -np.inf], np.nan)
    s_min = s.min()
    s_max = s.max()
    # Avoid division by zero when all values are identical
    if s_max == s_min:
        return pd.Series(0.0, index=series.index)
    return ((s - s_min) / (s_max - s_min)).clip(0, 1)

# Normalize the three risk components
norm_growth = min_max_normalize(df['growth_rate'])
norm_cpm    = min_max_normalize(df['cases_per_million'])
norm_dr     = min_max_normalize(df['death_rate'])

# Weighted composite score (40% growth + 40% cases_per_million + 20% death_rate)
df['risk_score'] = (0.4 * norm_growth + 0.4 * norm_cpm + 0.2 * norm_dr) * 100

# Dynamic thresholds based on actual data distribution
q67 = df['risk_score'].quantile(0.67)
q90 = df['risk_score'].quantile(0.90)
print(f"Risk thresholds — Medium: {q67:.2f}, High: {q90:.2f}")

# Re-scale so High/Medium/Low are properly distributed
df['risk_level'] = pd.cut(
    df['risk_score'],
    bins=[-1, q67, q90, 101],
    labels=['Low', 'Medium', 'High']
).astype(str)

print("✓ Step 3 — Computed risk_score (0–100)")

# Step 4 — Handle missing values
# For numeric columns: forward-fill within each country first
# (carries the last known value forward), then fill any remaining
# NaNs (e.g. leading NaNs before the first valid value) with 0.
numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()

df[numeric_cols] = (
    df.groupby('Country/Region')[numeric_cols]
      .transform(lambda x: x.ffill().fillna(0))
)

print("✓ Step 4 — Missing values filled (forward-fill → 0)")


# Step 5 — Save the enriched dataset
df.to_csv(OUTPUT_PATH, index=False)
print(f"✓ Step 5 — Saved to: {os.path.abspath(OUTPUT_PATH)}")


# Step 6 — Summary output
print("\n" + "=" * 60)
print("DATASET SUMMARY")
print("=" * 60)
print(f"Shape : {df.shape}")
print(f"Columns: {list(df.columns)}")
print("\n— India (last 5 rows) —")
india = df[df['Country/Region'] == 'India'].tail(5)
print(india.to_string(index=False))
