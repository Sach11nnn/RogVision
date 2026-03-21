'use client'

import { useState, useEffect } from 'react'
import { Sidebar } from '@/components/sidebar'
import { MetricCard } from '@/components/metric-card'
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts'
import { TrendingDown, TrendingUp, Activity } from 'lucide-react'

interface CountryInfo {
  "Country/Region": string
  risk_score: number
  risk_level: string
  confirmed: number
  deaths: number
  new_cases: number
  death_rate: number
  Rt: number
}

interface DayData {
  date: string
  new_cases: number
  confirmed: number
  deaths: number
  rolling_7: number
  death_rate: number
  risk_score: number
  people_vaccinated: number
}

const getRiskColor = (score: number) => {
  if (score >= 60) return 'bg-destructive/20 text-destructive border-destructive/50'
  if (score >= 40) return 'bg-warning/20 text-warning border-warning/50'
  return 'bg-success/20 text-success border-success/50'
}

const getRiskLabel = (score: number) => {
  if (score >= 60) return 'High Risk'
  if (score >= 40) return 'Medium Risk'
  return 'Low Risk'
}

export default function CountryDeepDive() {
  const [selectedCountry, setSelectedCountry] = useState('India')
  const [allCountries, setAllCountries] = useState<CountryInfo[]>([])
  const [chartData, setChartData] = useState<DayData[]>([])
  const [rtData, setRtData] = useState<{ date: string, Rt: number }[]>([])
  const [loading, setLoading] = useState(true)

  // Load countries list once
  useEffect(() => {
    fetch('/countries.json')
      .then(r => r.json())
      .then((data: CountryInfo[]) => {
        setAllCountries(data)
        setLoading(false)
      })
  }, [])

  // Load Rt data once
  useEffect(() => {
    fetch('/rt_india.json')
      .then(r => r.json())
      .then(setRtData)
  }, [])

  // Load per-country chart data when selection changes
  useEffect(() => {
    if (!selectedCountry) return
    const safeName = selectedCountry
      .replace(/\//g, '_')
      .replace(/ /g, '_')
      .replace(/\*/g, '')
    fetch(`/countries/${safeName}.json`)
      .then(r => r.json())
      .then(setChartData)
      .catch(() => console.warn('Data not found for', selectedCountry))
  }, [selectedCountry])

  const countryInfo = allCountries.find(
    c => c["Country/Region"] === selectedCountry
  )

  const peakDay = chartData.length > 0
    ? chartData.reduce((max, d) =>
      d.new_cases > max.new_cases ? d : max
    ).date
    : 'N/A'

  const peakFormatted = peakDay !== 'N/A'
    ? new Date(peakDay).toLocaleDateString('en-US',
      { month: 'short', year: 'numeric' })
    : 'N/A'

  // Format chart data for recharts
  const dailyNewCasesData = chartData.slice(-500).map(d => ({
    date: d.date,
    cases: d.new_cases,
    average: d.rolling_7,
  }))

  const fatalityRateData = chartData.slice(-500).map(d => ({
    date: d.date,
    rate: d.death_rate,
  }))

  const vaccinationData = chartData
    .filter(d => d.people_vaccinated > 0)
    .map(d => ({
      date: d.date,
      vaccinated: +(d.people_vaccinated / 1e6).toFixed(2),
    }))

  const riskScoreTrendData = chartData.slice(-500).map(d => ({
    date: d.date,
    score: d.risk_score,
  }))

  const tickFormatter = (v: string) => {
    try {
      return new Date(v).toLocaleDateString('en-US',
        { month: 'short', year: '2-digit' })
    } catch { return v }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground text-lg">
            Loading data...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex-1 overflow-y-auto">
        <div className="p-8">

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-foreground mb-4">
              Country Deep Dive Analysis
            </h1>
            <div className="flex items-center gap-4">
              <label className="text-foreground font-medium">
                Select Country:
              </label>
              <select
                value={selectedCountry}
                onChange={e => setSelectedCountry(e.target.value)}
                className="bg-card border border-border rounded-md
                           px-4 py-2 text-foreground
                           focus:outline-none focus:border-primary"
              >
                {allCountries
                  .sort((a, b) =>
                    a["Country/Region"].localeCompare(b["Country/Region"])
                  )
                  .map(c => (
                    <option
                      key={c["Country/Region"]}
                      value={c["Country/Region"]}
                      className="bg-card text-foreground"
                    >
                      {c["Country/Region"]}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          {/* Metric Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2
                          lg:grid-cols-4 gap-4 mb-8">
            <MetricCard
              label="Total Cases"
              value={countryInfo
                ? (countryInfo.confirmed / 1e6).toFixed(1) + 'M'
                : '—'}
              icon={<TrendingUp size={20} />}
            />
            <MetricCard
              label="Total Deaths"
              value={countryInfo
                ? (countryInfo.deaths / 1e3).toFixed(0) + 'K'
                : '—'}
              color="danger"
            />
            <MetricCard
              label="Peak Day"
              value={peakFormatted}
              icon={<Activity size={20} />}
            />
            <div className={`metric-card border
              ${getRiskColor(countryInfo?.risk_score ?? 0)}`}>
              <p className="text-sm font-medium
                            text-muted-foreground mb-2">
                Risk Score
              </p>
              <p className="text-2xl font-bold mb-2">
                {countryInfo?.risk_score?.toFixed(0) ?? '—'}
              </p>
              <p className="text-xs font-semibold">
                {getRiskLabel(countryInfo?.risk_score ?? 0)}
              </p>
            </div>
          </div>

          {/* Charts 2x2 */}
          <div className="grid grid-cols-1 lg:grid-cols-2
                          gap-6 mb-6">

            {/* Daily Cases */}
            <div className="chart-container">
              <h2 className="text-lg font-semibold
                             text-foreground mb-4">
                Daily New Cases + 7-Day Average
              </h2>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={dailyNewCasesData}>
                  <CartesianGrid strokeDasharray="3 3"
                    stroke="#30363d" />
                  <XAxis dataKey="date" stroke="#8b949e"
                    tickFormatter={tickFormatter}
                    interval={60} />
                  <YAxis stroke="#8b949e"
                    tickFormatter={v =>
                      v >= 1000
                        ? (v / 1000).toFixed(0) + 'K'
                        : v} />
                  <Tooltip contentStyle={{
                    backgroundColor: '#161b22',
                    border: '1px solid #21262d'
                  }} labelStyle={{ color: '#c9d1d9' }}
                    formatter={(v: number) =>
                      [v?.toLocaleString(), '']} />
                  <Legend />
                  <Line type="monotone" dataKey="cases"
                    stroke="#58a6ff" strokeWidth={1.5}
                    dot={false} name="Daily Cases" />
                  <Line type="monotone" dataKey="average"
                    stroke="#3fb950" strokeWidth={2.5}
                    dot={false} name="7-Day Avg" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Fatality Rate */}
            <div className="chart-container">
              <h2 className="text-lg font-semibold
                             text-foreground mb-4">
                Case Fatality Rate Over Time
              </h2>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={fatalityRateData}>
                  <CartesianGrid strokeDasharray="3 3"
                    stroke="#30363d" />
                  <XAxis dataKey="date" stroke="#8b949e"
                    tickFormatter={tickFormatter}
                    interval={60} />
                  <YAxis stroke="#8b949e"
                    tickFormatter={v =>
                      v.toFixed(1) + '%'} />
                  <Tooltip contentStyle={{
                    backgroundColor: '#161b22',
                    border: '1px solid #21262d'
                  }} labelStyle={{ color: '#c9d1d9' }}
                    formatter={(v: number) =>
                      [v?.toFixed(3) + '%', 'Death Rate']} />
                  <Line type="monotone" dataKey="rate"
                    stroke="#d29922" strokeWidth={2.5}
                    dot={{ fill: '#d29922' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Vaccination */}
            <div className="chart-container">
              <h2 className="text-lg font-semibold
                             text-foreground mb-4">
                Vaccination Progress
              </h2>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={vaccinationData}>
                  <CartesianGrid strokeDasharray="3 3"
                    stroke="#30363d" />
                  <XAxis dataKey="date" stroke="#8b949e"
                    tickFormatter={tickFormatter}
                    interval={40} />
                  <YAxis stroke="#8b949e"
                    tickFormatter={v => v + 'M'} />
                  <Tooltip contentStyle={{
                    backgroundColor: '#161b22',
                    border: '1px solid #21262d'
                  }} labelStyle={{ color: '#c9d1d9' }}
                    formatter={(v: number) =>
                      [v + 'M', 'Vaccinated']} />
                  <Area type="monotone"
                    dataKey="vaccinated"
                    fill="#3fb950" stroke="#3fb950"
                    strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Risk Score */}
            <div className="chart-container">
              <h2 className="text-lg font-semibold
                             text-foreground mb-4">
                Risk Score Trend with Thresholds
              </h2>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={riskScoreTrendData}>
                  <CartesianGrid strokeDasharray="3 3"
                    stroke="#30363d" />
                  <XAxis dataKey="date" stroke="#8b949e"
                    tickFormatter={tickFormatter}
                    interval={60} />
                  <YAxis stroke="#8b949e" domain={[0, 100]} />
                  <Tooltip contentStyle={{
                    backgroundColor: '#161b22',
                    border: '1px solid #21262d'
                  }} labelStyle={{ color: '#c9d1d9' }}
                    formatter={(v: number) =>
                      [v?.toFixed(1), 'Risk Score']} />
                  <ReferenceLine y={33} stroke="#d29922"
                    strokeDasharray="3 3"
                    label={{
                      value: "Medium",
                      fill: "#d29922",
                      fontSize: 11
                    }} />
                  <ReferenceLine y={66} stroke="#f85149"
                    strokeDasharray="3 3"
                    label={{
                      value: "High",
                      fill: "#f85149",
                      fontSize: 11
                    }} />
                  <Line type="monotone" dataKey="score"
                    stroke="#58a6ff" strokeWidth={2.5}
                    dot={{ fill: '#58a6ff' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Rt Chart */}
          <div className="chart-container">
            <h2 className="text-lg font-semibold
                           text-foreground mb-4">
              Reproduction Number (Rt) Trend
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={rtData}>
                <CartesianGrid strokeDasharray="3 3"
                  stroke="#30363d" />
                <XAxis dataKey="date" stroke="#8b949e"
                  tickFormatter={tickFormatter}
                  interval={60} />
                <YAxis stroke="#8b949e" />
                <Tooltip contentStyle={{
                  backgroundColor: '#161b22',
                  border: '1px solid #21262d'
                }} labelStyle={{ color: '#c9d1d9' }}
                  formatter={(v: number) =>
                    [v?.toFixed(2), 'Rt']} />
                <ReferenceLine y={1} stroke="#3fb950"
                  strokeDasharray="5 5"
                  label={{
                    value: "Rt = 1",
                    fill: "#3fb950",
                    fontSize: 12
                  }} />
                <Line type="monotone" dataKey="Rt"
                  stroke="#58a6ff" strokeWidth={2.5}
                  dot={{ fill: '#58a6ff', r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

        </div>
      </div>
    </div>
  )
}