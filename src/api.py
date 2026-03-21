import os
import json
import uvicorn
import joblib
import warnings
import numpy as np
import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
warnings.filterwarnings('ignore')

# ════════════════════════════════════════════
# SETUP
# ════════════════════════════════════════════
BASE      = os.path.dirname(os.path.abspath(__file__))
DATA_PROC = os.path.join(BASE, '..', 'data', 'processed')
DATA_RAW  = os.path.join(BASE, '..', 'data', 'raw')
PUBLIC    = os.path.join(BASE, '..', 'dashboard-ui', 'public')

app = FastAPI(
    title="Epidemic Spread Prediction API",
    description="AI-powered epidemic prediction system — CodeCure SPIRIT 2026",
    version="1.0.0"
)

# CORS — mobile app ke liye zaroori
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

from fastapi import Request

@app.middleware("http")
async def add_ngrok_header(request: Request, call_next):
    response = await call_next(request)
    return response

# ════════════════════════════════════════════
# LOAD MODELS + DATA ON STARTUP
# ════════════════════════════════════════════
print("Loading models and data...")

# ML Models
rf_model = None
try:
    rf_model = joblib.load(
        os.path.join(DATA_PROC, 'hotspot_model.pkl')
    )
    print("RF Hotspot model loaded ✓")
except Exception as e:
    print(f"RF model load failed: {e}")

# Preloaded JSON data
def load_json(filename):
    try:
        with open(os.path.join(PUBLIC, filename)) as f:
            return json.load(f)
    except:
        return {}

global_stats   = load_json('global_stats.json')
countries_data = load_json('countries.json')
forecast_data  = load_json('forecast.json')
rt_data        = load_json('rt_india.json')
top10_data     = load_json('top10_risk.json')
trend_data     = load_json('global_trend.json')

print("Data loaded ✓")
print(f"Countries: {len(countries_data)}")

# ════════════════════════════════════════════
# REQUEST MODELS
# ════════════════════════════════════════════
class PredictRequest(BaseModel):
    rolling_7:          float
    rolling_14:         float
    growth_rate:        float
    lag_7:              float
    lag_14:             float
    cases_per_million:  float
    death_rate:         float
    population_density: Optional[float] = 0.0
    gdp_per_capita:     Optional[float] = 0.0
    median_age:         Optional[float] = 0.0

class SIRRequest(BaseModel):
    r_value:     float = 1.2
    vax_rate:    float = 30.0
    days:        int   = 90
    population:  int   = 1400000000

# ════════════════════════════════════════════
# ROUTES
# ════════════════════════════════════════════

@app.get("/")
def root():
    return {
        "message": "Epidemic Spread Prediction API",
        "version": "1.0.0",
        "endpoints": [
            "/health",
            "/stats",
            "/countries",
            "/country/{name}",
            "/forecast",
            "/top10",
            "/predict/hotspot",
            "/predict/risk-score",
            "/simulate/sir",
            "/alerts",
        ]
    }

@app.get("/health")
def health():
    return {
        "status":       "ok",
        "model_loaded": rf_model is not None,
        "countries":    len(countries_data),
    }

# ── Global Stats ──
@app.get("/stats")
def get_stats():
    return global_stats

# ── All Countries ──
@app.get("/countries")
def get_countries(
    risk_level: Optional[str] = None,
    limit:      int = 50
):
    data = countries_data
    if risk_level:
        data = [
            c for c in data
            if c.get('risk_level','').lower()
               == risk_level.lower()
        ]
    data = sorted(
        data,
        key=lambda x: x.get('risk_score', 0),
        reverse=True
    )
    return {
        "count":     len(data),
        "countries": data[:limit]
    }

# ── Single Country ──
@app.get("/country/{country_name}")
def get_country(country_name: str):
    # Find country
    country = next(
        (c for c in countries_data
         if c.get('Country/Region','').lower()
            == country_name.lower()),
        None
    )
    if not country:
        raise HTTPException(
            status_code=404,
            detail=f"Country '{country_name}' not found"
        )

    # Load time series
    safe_name = (country_name
                 .replace('/', '_')
                 .replace(' ', '_'))
    ts_path = os.path.join(
        PUBLIC, 'countries', f"{safe_name}.json"
    )
    time_series = []
    if os.path.exists(ts_path):
        with open(ts_path) as f:
            time_series = json.load(f)

    return {
        "info":        country,
        "time_series": time_series[-90:],  # last 90 days
    }

# ── Forecast ──
@app.get("/forecast")
def get_forecast(days: int = 60):
    future = [
        d for d in forecast_data
        if d.get('actual') is None
    ]
    return {
        "country":  "India",
        "model":    "Ridge Regression",
        "forecast": future[:days]
    }

# ── Top 10 Risk ──
@app.get("/top10")
def get_top10():
    return {
        "countries": top10_data
    }

# ── Rt Data ──
@app.get("/rt/{country_name}")
def get_rt(country_name: str):
    if country_name.lower() == "india":
        return {
            "country": "India",
            "rt_data": rt_data[-90:]
        }
    raise HTTPException(
        status_code=404,
        detail="Rt data only available for India currently"
    )

# ── Hotspot Prediction ──
@app.post("/predict/hotspot")
def predict_hotspot(req: PredictRequest):
    if rf_model is None:
        raise HTTPException(
            status_code=503,
            detail="Model not loaded"
        )
    features = np.array([[
        req.rolling_7,
        req.rolling_14,
        req.lag_7,
        req.lag_14,
        req.cases_per_million,
        req.death_rate,
        req.population_density,
        req.gdp_per_capita,
        req.median_age,
    ]])

    try:
        prediction = rf_model.predict(features)[0]
        proba      = rf_model.predict_proba(features)[0]

        return {
            "is_hotspot":       bool(prediction),
            "hotspot_probability": round(float(proba[1]), 3),
            "risk_level": (
                "High"   if proba[1] > 0.7
                else "Medium" if proba[1] > 0.4
                else "Low"
            ),
            "recommendation": (
                "Immediate intervention required"
                if proba[1] > 0.7
                else "Monitor closely"
                if proba[1] > 0.4
                else "Situation under control"
            )
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ── Risk Score Calculation ──
@app.post("/predict/risk-score")
def predict_risk_score(req: PredictRequest):
    try:
        # Normalize each factor 0-1
        norm_growth = min(abs(req.growth_rate) / 2, 1.0)
        norm_cpm    = min(req.cases_per_million / 100000, 1.0)
        norm_dr     = min(req.death_rate / 10, 1.0)

        risk_score = (
            0.4 * norm_growth +
            0.4 * norm_cpm   +
            0.2 * norm_dr
        ) * 100

        risk_score = min(risk_score, 100)

        return {
            "risk_score": round(risk_score, 2),
            "risk_level": (
                "High"   if risk_score >= 20
                else "Medium" if risk_score >= 10
                else "Low"
            ),
            "factors": {
                "growth_rate_contribution":    round(0.4 * norm_growth * 100, 1),
                "cases_per_million_contribution": round(0.4 * norm_cpm * 100, 1),
                "death_rate_contribution":     round(0.2 * norm_dr * 100, 1),
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ── SIR Simulation ──
@app.post("/simulate/sir")
def simulate_sir(req: SIRRequest):
    try:
        infected = max(1000, int(req.population * 0.0001))
        S = req.population * (1 - req.vax_rate / 100) - infected
        I = float(infected)
        R = req.population * (req.vax_rate / 100)
        beta  = req.r_value / 14
        gamma = 1 / 14

        results = []
        peak_day      = 0
        peak_infected = 0

        for day in range(req.days):
            ni = beta * S * I / req.population
            nr = gamma * I
            S  = max(0, S - ni)
            I  = max(0, I + ni - nr)
            R  = R + nr

            if I > peak_infected:
                peak_infected = I
                peak_day      = day

            results.append({
                "day":         day + 1,
                "susceptible": round(S),
                "infected":    round(I),
                "recovered":   round(R),
            })

        herd_immunity = max(
            0, (1 - 1 / req.r_value) * 100
        ) if req.r_value > 1 else 0

        return {
            "simulation":          results,
            "peak_day":            peak_day + 1,
            "peak_infected":       round(peak_infected),
            "total_infected_pct":  round(
                results[-1]["recovered"] /
                req.population * 100, 2
            ),
            "herd_immunity_threshold": round(herd_immunity, 1),
            "status": (
                "controlled"  if req.r_value < 1
                else "spreading" if req.r_value < 1.5
                else "critical"
            )
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ── Alerts ──
@app.get("/alerts")
def get_alerts(limit: int = 10):
    high_risk = [
        c for c in countries_data
        if c.get('risk_level') == 'High'
    ]
    high_risk = sorted(
        high_risk,
        key=lambda x: x.get('risk_score', 0),
        reverse=True
    )[:limit]

    alerts = []
    for c in high_risk:
        rt_val = c.get('Rt', 0)
        alerts.append({
            "country":    c.get('Country/Region'),
            "risk_score": c.get('risk_score'),
            "risk_level": c.get('risk_level'),
            "new_cases":  c.get('new_cases'),
            "Rt":         rt_val,
            "alert_type": (
                "OUTBREAK"  if rt_val > 2
                else "WARNING" if rt_val > 1
                else "WATCH"
            ),
            "message": (
                f"Active outbreak detected in "
                f"{c.get('Country/Region')} — "
                f"Rt={rt_val:.2f}, "
                f"Risk={c.get('risk_score'):.1f}/100"
            )
        })

    return {
        "total_alerts": len(alerts),
        "alerts":       alerts
    }

# ════════════════════════════════════════════
# RUN
# ════════════════════════════════════════════
if __name__ == "__main__":
    uvicorn.run("api:app", host="0.0.0.0", port=8080, reload=True)