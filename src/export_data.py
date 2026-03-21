import pandas as pd
import json
import os
import numpy as np

BASE      = os.path.dirname(os.path.abspath(__file__))
DATA_PROC = os.path.join(BASE, '..', 'data', 'processed')
OUT_DIR   = os.path.join(BASE, '..', 'dashboard-ui', 'public')
os.makedirs(OUT_DIR, exist_ok=True)

print("Loading data...")
df = pd.read_csv(
    os.path.join(DATA_PROC, 'covid_features.csv'),
    parse_dates=['date']
)
forecast = pd.read_csv(
    os.path.join(DATA_PROC, 'forecast_india.csv'),
    parse_dates=['ds']
)
rt = pd.read_csv(
    os.path.join(DATA_PROC, 'rt_estimates.csv'),
    parse_dates=['date']
)

# Clean infinity values
df = df.replace([np.inf, -np.inf], np.nan)

# Latest snapshot
latest = (
    df.sort_values('date')
      .groupby('Country/Region')
      .last()
      .reset_index()
)
rt_latest = (
    rt.sort_values('date')
       .groupby('Country/Region')
       .last()
       .reset_index()[['Country/Region','Rt']]
)
latest = latest.merge(rt_latest, on='Country/Region', how='left')

def risk_label(s):
    if s >= 20:   return 'High'
    elif s >= 10: return 'Medium'
    return 'Low'

latest['risk_level'] = latest['risk_score'].apply(risk_label)

# ── 1. Global stats ──
global_stats = {
    'total_cases':   int(latest['confirmed'].sum()),
    'total_deaths':  int(latest['deaths'].sum()),
    'high_risk':     int(len(latest[latest['risk_level']=='High'])),
    'medium_risk':   int(len(latest[latest['risk_level']=='Medium'])),
    'low_risk':      int(len(latest[latest['risk_level']=='Low'])),
    'avg_rt':        round(float(latest['Rt'].mean()), 2),
    'total_countries': int(latest['Country/Region'].nunique()),
    'date_range': {
        'start': str(df['date'].min().date()),
        'end':   str(df['date'].max().date())
    }
}

# ── 2. Country risk data (for map + table) ──
country_cols = [
    'Country/Region', 'risk_score', 'risk_level',
    'confirmed', 'deaths', 'new_cases', 'new_deaths',
    'death_rate', 'cases_per_million', 'Rt',
    'rolling_7', 'growth_rate'
]
available = [c for c in country_cols if c in latest.columns]
countries_data = (
    latest[available]
    .fillna(0)
    .round(2)
    .to_dict('records')
)

# ── 3. Global daily trend ──
global_trend = (
    df.groupby('date')[['new_cases','new_deaths']]
      .sum()
      .reset_index()
)
global_trend['rolling_7'] = (
    global_trend['new_cases'].rolling(7).mean()
)
global_trend = global_trend.fillna(0)
trend_data = [
    {
        'date':      str(row['date'].date()),
        'new_cases': int(row['new_cases']),
        'rolling_7': round(float(row['rolling_7']), 1),
        'new_deaths':int(row['new_deaths'])
    }
    for _, row in global_trend.iterrows()
]

# ── 4. India specific data ──
india = (
    df[df['Country/Region'] == 'India']
    .sort_values('date')
    .copy()
)
india_data = [
    {
        'date':        str(row['date'].date()),
        'new_cases':   int(row['new_cases']   or 0),
        'confirmed':   int(row['confirmed']   or 0),
        'deaths':      int(row['deaths']      or 0),
        'rolling_7':   round(float(row['rolling_7'] or 0), 1),
        'death_rate':  round(float(row['death_rate'] or 0), 3),
        'risk_score':  round(float(row['risk_score'] or 0), 2),
        'people_vaccinated': int(
            row['people_vaccinated'] or 0
            if 'people_vaccinated' in row else 0
        ),
    }
    for _, row in india.iterrows()
]

# ── 5. Forecast data ──
forecast_data = [
    {
        'date':      str(row['ds'].date()),
        'actual':    round(float(row['y']), 1)
                     if pd.notna(row['y']) and float(row['y']) > 0
                     else None,
        'predicted': round(float(row['yhat']), 1),
        'lower':     round(float(row['yhat_lower']), 1),
        'upper':     round(float(row['yhat_upper']), 1),
    }
    for _, row in forecast.iterrows()
]

# ── 6. Rt data for India ──
rt_india = (
    rt[rt['Country/Region'] == 'India']
    .sort_values('date')
)
rt_india_data = [
    {
        'date': str(row['date'].date()),
        'Rt':   round(float(row['Rt']), 3)
                if pd.notna(row['Rt']) else None
    }
    for _, row in rt_india.iterrows()
]

# ── 7. Top 10 high risk ──
top10 = (
    latest.nlargest(10, 'risk_score')
    [['Country/Region','risk_score','risk_level',
      'new_cases','Rt']]
    .fillna(0)
    .round(2)
    .to_dict('records')
)

# ── 8. Save all ──
exports = {
    'global_stats.json':   global_stats,
    'countries.json':      countries_data,
    'global_trend.json':   trend_data,
    'india_data.json':     india_data,
    'forecast.json':       forecast_data,
    'rt_india.json':       rt_india_data,
    'top10_risk.json':     top10,
}

for filename, data in exports.items():
    path = os.path.join(OUT_DIR, filename)
    with open(path, 'w') as f:
        json.dump(data, f, indent=2)
    print(f"Saved: {filename}")

print("\nDATA EXPORT COMPLETE ✓")
print(f"Files saved to: {OUT_DIR}")

# ── 9. Per-country data export ──
print("\nExporting per-country data...")

country_out_dir = os.path.join(OUT_DIR, 'countries')
os.makedirs(country_out_dir, exist_ok=True)


cols = ['date','new_cases','confirmed','deaths',
        'rolling_7','death_rate','risk_score',
        'people_vaccinated']
available_cols = [c for c in cols if c in df.columns]


grouped = df.groupby('Country/Region')
count = 0

for country, cdf in grouped:
    cdf = cdf.sort_values('date')[available_cols + ['date']
          if 'date' not in available_cols else available_cols]
    
    records = []
    for row in cdf.itertuples(index=False):
        rec = {}
        for col in available_cols:
            val = getattr(row, col.replace('/','_').replace(' ','_'), 0)
            if col == 'date':
                rec[col] = str(val.date()) if hasattr(val,'date') else str(val)
            elif col in ['new_cases','confirmed','deaths','people_vaccinated']:
                rec[col] = int(val or 0)
            else:
                rec[col] = round(float(val or 0), 3)
        records.append(rec)
    
    safe_name = (country.replace('/', '_')
                        .replace(' ', '_')
                        .replace('*', ''))
    filepath = os.path.join(country_out_dir, f"{safe_name}.json")
    with open(filepath, 'w') as f:
        json.dump(records, f)
    
    count += 1
    if count % 50 == 0:
        print(f"  Progress: {count}/201")

print(f"Per-country data exported: {count} countries")
print(f"Saved to: {country_out_dir}")