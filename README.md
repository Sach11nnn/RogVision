# 🦠 RogVision — Epidemic Spread Prediction System

<div align="center">

![Python](https://img.shields.io/badge/Python-3.13-blue?style=for-the-badge&logo=python)
![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)
![FastAPI](https://img.shields.io/badge/FastAPI-0.100-green?style=for-the-badge&logo=fastapi)
![React Native](https://img.shields.io/badge/React_Native-Expo-purple?style=for-the-badge&logo=react)
![TensorFlow](https://img.shields.io/badge/TensorFlow-2.x-orange?style=for-the-badge&logo=tensorflow)

**CodeCure AI Hackathon | SPIRIT 2026 | IIT-BHU Varanasi**

*Track C — Epidemic Spread Prediction (Epidemiology + AI)*

</div>

---

## 🔍 Problem Statement

Infectious disease outbreaks are unpredictable, and delayed responses cost lives. Current public health systems lack:
- Real-time AI-powered outbreak prediction
- Geographic hotspot detection at scale
- Accessible tools for the general public
- Actionable epidemic spread forecasting

## 💡 Our Solution

**RogVision** is an end-to-end AI-powered epidemic prediction ecosystem that combines machine learning, epidemiological modeling, and modern software to predict, visualize, and communicate disease spread risk.

> *"From data to decisions — before the next outbreak."*

---

## 🏗️ Solution Architecture
```
┌─────────────────────────────────────────────────────────┐
│                    DATA SOURCES                         │
│  Johns Hopkins COVID-19  +  Our World in Data (OWID)   │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│                  ML PIPELINE (Python)                   │
│                                                         │
│  preprocess.py  →  model.py  →  risk_map.py            │
│                                                         │
│  • Feature Engineering (21 features)                   │
│  • LSTM Time-Series Forecasting                        │
│  • Random Forest Hotspot Classification                │
│  • Ridge Regression 60-day Forecast                    │
│  • SIR Epidemic Simulation                             │
│  • Geographic Risk Mapping (Folium)                    │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│              FastAPI Backend (src/api.py)               │
│                                                         │
│  /stats  /countries  /forecast  /alerts                │
│  /predict/hotspot  /simulate/sir  /top10               │
└───────────────┬─────────────────┬───────────────────────┘
                │                 │
                ▼                 ▼
┌──────────────────────┐  ┌──────────────────────────────┐
│   Web Dashboard      │  │      Mobile App              │
│   (Next.js + V0)     │  │   (React Native + Expo)      │
│                      │  │                              │
│  • Global Overview   │  │  • Overview Screen           │
│  • Country Deep Dive │  │  • Alerts Screen             │
│  • Forecast Page     │  │  • Forecast Screen           │
│  • What-If Simulator │  │  • What-If Simulator         │
│  • Hotspot Analysis  │  │                              │
└──────────────────────┘  └──────────────────────────────┘
```

---

## ✨ Key Features

### 🤖 AI/ML Models
| Model | Purpose | Performance |
|-------|---------|-------------|
| **LSTM** | Time-series epidemic forecasting | RMSE: ~2000 |
| **Random Forest** | Real-time hotspot classification | Accuracy: 88% |
| **Ridge Regression** | 60-day case prediction | MAPE: ~15-25% |
| **SIR Model** | Epidemic scenario simulation | Mathematical |

### 🌍 Web Dashboard (5 Pages)
- **Global Overview** — World risk map + trend analysis + risk distribution
- **Country Deep Dive** — Per-country analysis for 201 countries with Rt tracking
- **Forecast** — 60-day prediction with confidence intervals and wave markers
- **What-If Simulator** — Interactive SIR model with real-time parameter control
- **Hotspot Analysis** — Active outbreak detection with Rt vs Risk scatter plot

### 📱 Mobile App (4 Screens)
- Real-time epidemic data from live API
- Country-wise risk scores and alerts
- 14-day case forecast table
- Interactive SIR epidemic simulator
- Pull-to-refresh for latest data

### ⚡ FastAPI Backend (10 Endpoints)
```
GET  /health              — API health check
GET  /stats               — Global epidemic statistics
GET  /countries           — All 201 countries data
GET  /country/{name}      — Per-country time series
GET  /forecast            — 60-day prediction data
GET  /top10               — Top 10 high risk countries
GET  /alerts              — Active outbreak alerts
GET  /rt/{country}        — Reproduction number data
POST /predict/hotspot     — ML hotspot prediction
POST /predict/risk-score  — Risk score calculation
POST /simulate/sir        — SIR model simulation
```

---

## 📊 Key Epidemiological Insights

1. **Median age** is the strongest predictor of epidemic risk (correlation: 0.44)
2. **Cases per million** is the second most important factor (correlation: 0.37)
3. **GDP per capita** correlates with risk score (correlation: 0.30)
4. India had **7 distinct COVID waves** detected automatically via peak detection
5. Vaccination reduced cases by **25%** in Algeria and **18%** in Armenia
6. Countries with Rt > 2.0 showed exponential growth within 14 days

---

## 🗂️ Project Structure
```
RogVision/
├── data/
│   ├── raw/                    ← EDA plots + model outputs
│   └── processed/              ← Risk maps (HTML)
│
├── notebooks/
│   └── 01_eda.ipynb            ← Exploratory data analysis
│
├── src/
│   ├── preprocess.py           ← Feature engineering (21 features)
│   ├── model.py                ← ML model training pipeline
│   ├── risk_map.py             ← Folium geographic visualization
│   ├── export_data.py          ← JSON data export for dashboard
│   └── api.py                  ← FastAPI backend (10 endpoints)
│
├── dashboard-ui/               ← Next.js web dashboard (V0)
│   ├── app/
│   │   ├── page.tsx            ← Global Overview
│   │   ├── country/page.tsx    ← Country Deep Dive
│   │   ├── forecast/page.tsx   ← 60-day Forecast
│   │   ├── simulator/page.tsx  ← What-If Simulator
│   │   └── hotspot/page.tsx    ← Hotspot Analysis
│   └── components/
│
├── mobile-app2/                ← React Native mobile app
│   ├── App.tsx                 ← Main app (4 screens)
│   ├── index.ts                ← Entry point
│   └── constants/api.ts        ← API configuration
│
├── requirements.txt
└── README.md
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| ML & Data | Python, TensorFlow/Keras, Scikit-learn, Pandas, NumPy, SciPy |
| Forecasting | Ridge Regression, LSTM, Facebook Prophet (evaluated) |
| Classification | Random Forest Classifier |
| Visualization | Folium, Plotly, Matplotlib, Seaborn |
| Web Frontend | Next.js 15, Tailwind CSS, Recharts, V0.dev |
| Backend API | FastAPI, Uvicorn, Pydantic |
| Mobile App | React Native, Expo SDK 55 |
| HTTP Client | Axios |

---

## 📦 Datasets

| Dataset | Source | Description |
|---------|--------|-------------|
| Johns Hopkins COVID-19 | GitHub/CSSEGISandData | 289 countries, daily cases/deaths/recoveries |
| Our World in Data | GitHub/owid | 429K rows, vaccination, mortality, demographics |

---

## 🚀 Installation & Setup

### Prerequisites
- Python 3.10+
- Node.js 18+
- npm

### 1. Clone Repository
```bash
git clone https://github.com/Sach11nnn/RogVision.git
cd RogVision
```

### 2. Python Environment
```bash
python -m venv venv

# Windows
venv\Scripts\activate

# Mac/Linux
source venv/bin/activate

pip install -r requirements.txt
```

### 3. Download Datasets
Download and place in `data/raw/`:

| File | URL |
|------|-----|
| confirmed_global.csv | [Johns Hopkins](https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_confirmed_global.csv) |
| deaths_global.csv | [Johns Hopkins](https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_deaths_global.csv) |
| recovered_global.csv | [Johns Hopkins](https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_recovered_global.csv) |
| owid_covid.csv | [Our World in Data](https://raw.githubusercontent.com/owid/covid-19-data/master/public/data/owid-covid-data.csv) |

### 4. Run ML Pipeline
```bash
python src/preprocess.py     # Feature engineering
python src/model.py          # Train all models (~25 mins)
python src/risk_map.py       # Generate risk maps
python src/export_data.py    # Export JSON for dashboard
```

### 5. Start FastAPI Backend
```bash
cd src
python api.py
# API running at http://localhost:8080
# Interactive docs at http://localhost:8080/docs
```

### 6. Start Web Dashboard
```bash
cd dashboard-ui
npm install
npm run dev
# Dashboard at http://localhost:3000
```

### 7. Start Mobile App
```bash
cd mobile-app2
npm install
# Update API URL in App.tsx with your IP
npx expo start
# Scan QR code with Expo Go app
```

---

## 🔬 Model Details

### LSTM Architecture
```
Input (14 days) → LSTM(64) → Dropout(0.2)
               → LSTM(32) → Dropout(0.2)
               → Dense(16, relu)
               → Dense(1)
Optimizer: Adam | Loss: MSE | Epochs: 30
```

### Feature Engineering (21 Features)
- Rolling averages: 7-day, 14-day
- Lag features: 7-day, 14-day
- Growth rate (daily % change)
- Cases per million population
- Death rate
- Risk score (composite: growth + cases/million + death rate)
- Demographic: median age, population density, GDP per capita
- Healthcare: hospital beds per thousand
- Vaccination: people vaccinated

### SIR Model
```
S → I → R (Susceptible → Infected → Recovered)
β = R_value / 14    (transmission rate)
γ = 1 / 14          (recovery rate)
Herd Immunity = (1 - 1/R) × 100%
```

---

## 🗺️ Future Roadmap

- [ ] Multi-disease support (Dengue, Influenza, Mpox)
- [ ] Real-time WHO data feed integration
- [ ] Push notifications for outbreak alerts
- [ ] Offline ML prediction in mobile app
- [ ] 90-day forecast capability
- [ ] Environmental data integration (climate, mobility)
- [ ] Hospital capacity modeling

---

## 👥 Team

Built with ❤️ for **CodeCure AI Hackathon, SPIRIT 2026, IIT-BHU Varanasi**

| Role | Responsibility |
|------|---------------|
| ML Engineer | Model training, feature engineering |
| Data Engineer | Data pipeline, preprocessing |
| Frontend Dev | Web dashboard (Next.js) |
| Mobile Dev | React Native app + FastAPI |

---

## 📄 License

MIT License — Free to use for educational purposes.

---

<div align="center">

**🦠 RogVision — Coding Healthcare's Future**

*SPIRIT 2026 | IIT-BHU | CodeCure AI Hackathon*

</div>