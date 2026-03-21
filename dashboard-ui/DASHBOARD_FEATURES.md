# Epidemic Spread Prediction System (ESPS)

A professional dark-themed epidemic prediction dashboard built for the SPIRIT 2026 Hackathon at IIT-BHU.

## 🎨 Design & Theme
- **Dark Mode**: GitHub-inspired dark theme (#0d1117 background, #161b22 cards)
- **Primary Color**: Accent blue (#58a6ff) for interactive elements
- **Status Colors**: Red (#f85149) for danger, Green (#3fb950) for success, Orange (#d29922) for warnings
- **Typography**: Geist font family for modern, clean aesthetics

## 📑 Pages & Features

### 1. Global Overview (/)
- **Metrics**: Total Cases (650M), Deaths (6.8M), High Risk Countries (23), Avg Rt (1.34)
- **Top 10 Countries Bar Chart**: Red gradient bars showing highest-risk countries
- **Risk Distribution Donut**: High (23%), Medium (41%), Low (36%)
- **Daily Cases Trend**: Line chart showing 2020-2023 global epidemic progression

### 2. Country Deep Dive (/country)
- **Country Selector**: Dropdown to select any of 8 countries (default: India)
- **Metrics Grid**: Total Cases, Deaths, Peak Day, Risk Score with color-coded badge
- **4-Chart Analysis Grid**:
  1. Daily Cases + 7-day rolling average
  2. Case Fatality Rate over time
  3. Vaccination Progress area chart
  4. Risk Score Trend with threshold lines at 33 and 66
- **Rt Trend Chart**: Reproduction number with Rt=1 threshold line

### 3. Forecast (/forecast)
- **Forecast Visualization**: 
  - Actual cases (blue) vs Model fit (orange dashed) vs Forecast (red)
  - Confidence interval shaded in red (opacity 0.15)
  - Wave markers (Wave 1, Wave 2, Omicron)
- **7-Day Forecast Table**: Predicted cases with lower/upper bounds (95% confidence)

### 4. What-If Simulator (/simulator)
- **Interactive SIR Model**:
  - R-value slider (0.5-3.0)
  - Vaccination % slider (0-100)
  - Simulation period slider (30-365 days)
- **Real-time Alert Banner**: Green (R<1), Yellow (R<1.5), Red (R>1.5)
- **Metrics**: Peak Day, Peak Infected, Total Infected %, Herd Immunity Threshold
- **SIR Curves**: Susceptible (blue), Infected (red), Recovered (green)

### 5. Hotspot Analysis (/hotspot)
- **Risk Summary**: High/Medium/Low risk country counts
- **Top 20 Horizontal Bar Chart**: Countries ranked by risk score with color coding
- **Scatter Plot**: Rt vs Risk Score (bubble size = new cases)
- **Detailed Table**: 10 highest-risk countries with Risk Score, Level, New Cases, Death Rate, Rt

## 🛠️ Components

### Core Components
- **Sidebar** (`/components/sidebar.tsx`):
  - Navigation with 5 pages and active link highlighting
  - Logo and branding (virus emoji)
  - Stats panel (Countries: 201, Date Range, High Risk count)
  - Footer with hackathon info

- **MetricCard** (`/components/metric-card.tsx`):
  - Reusable card for displaying KPIs
  - Color variants: default, danger, success, warning
  - Optional trend indicators and icons

## 📊 Charts & Interactivity
- **Recharts Integration**: All charts include:
  - Interactive hover tooltips
  - Responsive containers
  - Dark-themed styling (grid lines, axis labels)
  - Legend and proper formatting

## 🎯 Data
- All data is mock/sample data for demonstration
- Realistic metrics and trends based on epidemic patterns
- Countries: India, Brazil, USA, Mexico, Indonesia, Nigeria, Pakistan, Bangladesh

## 🌐 Navigation
- Sidebar with icon-based navigation
- Active page highlighting in blue
- Smooth transitions and hover effects
- Responsive design for all screen sizes

## 🚀 Getting Started

```bash
# Install dependencies (if needed)
npm install

# Run dev server
npm run dev

# Build for production
npm build
npm start
```

Visit `http://localhost:3000` to view the dashboard.

---

Built with Next.js 16, Tailwind CSS, and Recharts for SPIRIT 2026 | IIT-BHU
