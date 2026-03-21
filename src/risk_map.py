import os
import warnings
import numpy as np
import pandas as pd
import folium
from folium.plugins import HeatMap, MarkerCluster
import json
warnings.filterwarnings('ignore')

BASE      = os.path.dirname(os.path.abspath(__file__))
DATA_PROC = os.path.join(BASE, '..', 'data', 'processed')
DATA_RAW  = os.path.join(BASE, '..', 'data', 'raw')
OUTPUT    = os.path.join(BASE, '..', 'data', 'processed')

print("Loading data...")
df = pd.read_csv(
    os.path.join(DATA_PROC, 'covid_features.csv'),
    parse_dates=['date']
)
rt = pd.read_csv(
    os.path.join(DATA_PROC, 'rt_estimates.csv'),
    parse_dates=['date']
)
print(f"Loaded: {df.shape}")

# ════════════════════════════════════════════
# STEP 1 — Latest snapshot per country
# ════════════════════════════════════════════
print("\nStep 1 — Building latest snapshot...")

latest = (
    df.sort_values('date')
      .groupby('Country/Region')
      .last()
      .reset_index()
)

# Rt merge
rt_latest = (
    rt.sort_values('date')
       .groupby('Country/Region')
       .last()
       .reset_index()[['Country/Region', 'Rt']]
)
latest = latest.merge(rt_latest, on='Country/Region', how='left')

# Risk level label
def risk_label(score):
    if score >= 66:   return 'High'
    elif score >= 33: return 'Medium'
    else:             return 'Low'

def risk_color(score):
    if score >= 66:   return 'red'
    elif score >= 33: return 'orange'
    else:             return 'green'

latest['risk_level'] = latest['risk_score'].apply(risk_label)
latest['risk_color'] = latest['risk_score'].apply(risk_color)

print(f"Countries in snapshot: {len(latest)}")
print(latest[['Country/Region','risk_score',
              'risk_level','Rt']].head(10))

# ════════════════════════════════════════════
# STEP 2 — Country coordinates mapping
# ════════════════════════════════════════════
# Common country coordinates (lat, lon)
COORDS = {
    'Afghanistan': (33.93, 67.71), 'Albania': (41.15, 20.17),
    'Algeria': (28.03, 1.66), 'Argentina': (-38.42, -63.62),
    'Australia': (-25.27, 133.78), 'Austria': (47.52, 14.55),
    'Bangladesh': (23.68, 90.35), 'Belarus': (53.71, 27.95),
    'Belgium': (50.50, 4.47), 'Bolivia': (-16.29, -63.59),
    'Brazil': (-14.24, -51.93), 'Bulgaria': (42.73, 25.49),
    'Canada': (56.13, -106.35), 'Chile': (-35.68, -71.54),
    'China': (35.86, 104.20), 'Colombia': (4.57, -74.30),
    'Croatia': (45.10, 15.20), 'Cuba': (21.52, -77.78),
    'Czech Republic': (49.82, 15.47), 'Denmark': (56.26, 9.50),
    'Ecuador': (-1.83, -78.18), 'Egypt': (26.82, 30.80),
    'Ethiopia': (9.15, 40.49), 'Finland': (61.92, 25.75),
    'France': (46.23, 2.21), 'Germany': (51.17, 10.45),
    'Ghana': (7.95, -1.02), 'Greece': (39.07, 21.82),
    'Hungary': (47.16, 19.50), 'India': (20.59, 78.96),
    'Indonesia': (-0.79, 113.92), 'Iran': (32.43, 53.69),
    'Iraq': (33.22, 43.68), 'Ireland': (53.41, -8.24),
    'Israel': (31.05, 34.85), 'Italy': (41.87, 12.57),
    'Japan': (36.20, 138.25), 'Jordan': (30.59, 36.24),
    'Kazakhstan': (48.02, 66.92), 'Kenya': (-0.02, 37.91),
    'Kuwait': (29.31, 47.48), 'Lebanon': (33.85, 35.86),
    'Libya': (26.34, 17.23), 'Malaysia': (4.21, 101.98),
    'Mexico': (23.63, -102.55), 'Morocco': (31.79, -7.09),
    'Nepal': (28.39, 84.12), 'Netherlands': (52.13, 5.29),
    'New Zealand': (-40.90, 174.89), 'Nigeria': (9.08, 8.68),
    'Norway': (60.47, 8.47), 'Pakistan': (30.38, 69.35),
    'Peru': (-9.19, -75.02), 'Philippines': (12.88, 121.77),
    'Poland': (51.92, 19.15), 'Portugal': (39.40, -8.22),
    'Qatar': (25.35, 51.18), 'Romania': (45.94, 24.97),
    'Russia': (61.52, 105.32), 'Saudi Arabia': (23.89, 45.08),
    'Serbia': (44.02, 21.01), 'Singapore': (1.35, 103.82),
    'Slovakia': (48.67, 19.70), 'South Africa': (-30.56, 22.94),
    'South Korea': (35.91, 127.77), 'Spain': (40.46, -3.75),
    'Sri Lanka': (7.87, 80.77), 'Sweden': (60.13, 18.64),
    'Switzerland': (46.82, 8.23), 'Thailand': (15.87, 100.99),
    'Tunisia': (33.89, 9.54), 'Turkey': (38.96, 35.24),
    'US': (37.09, -95.71), 'Ukraine': (48.38, 31.17),
    'United Arab Emirates': (23.42, 53.85),
    'United Kingdom': (55.38, -3.44),
    'Uruguay': (-32.52, -55.77), 'Venezuela': (6.42, -66.59),
    'Vietnam': (14.06, 108.28), 'Zimbabwe': (-19.02, 29.15),
}

latest['lat'] = latest['Country/Region'].map(
    lambda x: COORDS.get(x, (np.nan, np.nan))[0]
)
latest['lon'] = latest['Country/Region'].map(
    lambda x: COORDS.get(x, (np.nan, np.nan))[1]
)
latest_geo = latest.dropna(subset=['lat', 'lon'])
print(f"Countries with coordinates: {len(latest_geo)}")

# ════════════════════════════════════════════
# STEP 3 — Map 1: Risk Score Choropleth
# ════════════════════════════════════════════
print("\nStep 3 — Building Risk Score Map...")

m1 = folium.Map(
    location=[20, 0],
    zoom_start=2,
    tiles='CartoDB positron'
)

# Add circle markers per country
for _, row in latest_geo.iterrows():
    score = row['risk_score']
    color = row['risk_color']
    rt_val = row.get('Rt', 0)
    if pd.isna(rt_val): rt_val = 0

    popup_html = f"""
    <div style='font-family:Arial;width:200px'>
      <h4 style='margin:0;color:#333'>{row['Country/Region']}</h4>
      <hr style='margin:4px 0'>
      <b>Risk Score:</b> {score:.1f}/100<br>
      <b>Risk Level:</b>
        <span style='color:{color};font-weight:bold'>
          {row['risk_level']}
        </span><br>
      <b>Total Cases:</b> {row['confirmed']:,.0f}<br>
      <b>New Cases:</b> {row['new_cases']:,.0f}<br>
      <b>Death Rate:</b> {row['death_rate']:.2f}%<br>
      <b>Rt Value:</b> {rt_val:.2f}<br>
      <b>Cases/Million:</b> {row['cases_per_million']:,.0f}
    </div>
    """

    folium.CircleMarker(
        location=[row['lat'], row['lon']],
        radius=max(5, min(score / 5, 20)),
        color=color,
        fill=True,
        fill_color=color,
        fill_opacity=0.7,
        popup=folium.Popup(popup_html, max_width=250),
        tooltip=f"{row['Country/Region']}: {score:.1f}"
    ).add_to(m1)

# Legend
legend_html = """
<div style='
    position: fixed; bottom: 30px; left: 30px;
    z-index: 1000; background: white;
    padding: 12px; border-radius: 8px;
    border: 2px solid #ccc; font-family: Arial;
    font-size: 13px;'>
  <b>Risk Level</b><br>
  <span style='color:red'>&#9679;</span> High (66-100)<br>
  <span style='color:orange'>&#9679;</span> Medium (33-66)<br>
  <span style='color:green'>&#9679;</span> Low (0-33)<br>
  <i style='font-size:11px'>Circle size = risk score</i>
</div>
"""
m1.get_root().html.add_child(folium.Element(legend_html))

map1_path = os.path.join(OUTPUT, 'risk_map.html')
m1.save(map1_path)
print(f"Risk map saved: {map1_path}")

# ════════════════════════════════════════════
# STEP 4 — Map 2: Heatmap of Cases
# ════════════════════════════════════════════
print("\nStep 4 — Building Heatmap...")

m2 = folium.Map(
    location=[20, 0],
    zoom_start=2,
    tiles='CartoDB dark_matter'
)

heat_data = []
for _, row in latest_geo.iterrows():
    if row['new_cases'] > 0:
        heat_data.append([
            row['lat'],
            row['lon'],
            float(row['new_cases'])
        ])

HeatMap(
    heat_data,
    min_opacity=0.3,
    max_zoom=6,
    radius=25,
    blur=15,
    gradient={
        0.2: 'blue',
        0.4: 'lime',
        0.6: 'yellow',
        0.8: 'orange',
        1.0: 'red'
    }
).add_to(m2)

map2_path = os.path.join(OUTPUT, 'heatmap.html')
m2.save(map2_path)
print(f"Heatmap saved: {map2_path}")

# ════════════════════════════════════════════
# STEP 5 — Map 3: Hotspot Alert Map
# ════════════════════════════════════════════
print("\nStep 5 — Building Hotspot Alert Map...")

m3 = folium.Map(
    location=[20, 0],
    zoom_start=2,
    tiles='CartoDB positron'
)

hotspots = latest_geo[latest_geo['risk_score'] >= 66]
normal   = latest_geo[latest_geo['risk_score'] <  66]

# Normal countries — small gray dots
for _, row in normal.iterrows():
    folium.CircleMarker(
        location=[row['lat'], row['lon']],
        radius=3,
        color='gray',
        fill=True,
        fill_opacity=0.3,
        tooltip=row['Country/Region']
    ).add_to(m3)

# Hotspot countries — red markers with alerts
mc = MarkerCluster().add_to(m3)
for _, row in hotspots.iterrows():
    rt_val = row.get('Rt', 0)
    if pd.isna(rt_val): rt_val = 0

    alert_html = f"""
    <div style='font-family:Arial;width:220px'>
      <h4 style='color:red;margin:0'>
        &#9888; OUTBREAK ALERT
      </h4>
      <hr>
      <b>{row['Country/Region']}</b><br>
      Risk Score: {row['risk_score']:.1f}/100<br>
      New Cases: {row['new_cases']:,.0f}/day<br>
      Rt Value: {rt_val:.2f}
        {'&#128308; Spreading' if rt_val > 1
         else '&#128994; Controlled'}<br>
      Death Rate: {row['death_rate']:.2f}%
    </div>
    """
    folium.Marker(
        location=[row['lat'], row['lon']],
        popup=folium.Popup(alert_html, max_width=250),
        tooltip=f"ALERT: {row['Country/Region']}",
        icon=folium.Icon(
            color='red', icon='exclamation-sign',
            prefix='glyphicon'
        )
    ).add_to(mc)

map3_path = os.path.join(OUTPUT, 'hotspot_map.html')
m3.save(map3_path)
print(f"Hotspot map saved: {map3_path}")

# ════════════════════════════════════════════
# STEP 6 — Summary Stats
# ════════════════════════════════════════════
print("\n" + "="*50)
print("RISK MAP SUMMARY")
print("="*50)
high   = len(latest[latest['risk_level'] == 'High'])
medium = len(latest[latest['risk_level'] == 'Medium'])
low    = len(latest[latest['risk_level'] == 'Low'])
total  = len(latest)

print(f"Total countries analysed : {total}")
print(f"High risk    (66-100)    : {high}  "
      f"({high/total*100:.1f}%)")
print(f"Medium risk  (33-66)     : {medium} "
      f"({medium/total*100:.1f}%)")
print(f"Low risk     (0-33)      : {low}  "
      f"({low/total*100:.1f}%)")

top5 = latest.nlargest(5, 'risk_score')[
    ['Country/Region', 'risk_score', 'new_cases', 'Rt']
]
print("\nTop 5 Highest Risk Countries:")
print(top5.to_string(index=False))

# Save summary
latest.to_csv(
    os.path.join(OUTPUT, 'country_risk_summary.csv'), index=False
)
print("\nCountry risk summary saved!")
print("\nRISK MAP PIPELINE COMPLETE ✓")