'use client'

import { useState, useEffect } from 'react'
import { Sidebar } from '@/components/sidebar'
import { MetricCard } from '@/components/metric-card'
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Users, TrendingUp, AlertTriangle, Activity } from 'lucide-react'

interface GlobalStats {
  total_cases: number
  total_deaths: number
  high_risk: number
  medium_risk: number
  low_risk: number
  avg_rt: number
  total_countries: number
}

interface CountryInfo {
  "Country/Region": string
  risk_score: number
  risk_level: string
  confirmed: number
  new_cases: number
}

interface TrendDay {
  date: string
  new_cases: number
  rolling_7: number
}

export default function GlobalOverview() {
  const [stats, setStats] = useState<GlobalStats | null>(null)
  const [top10, setTop10] = useState<CountryInfo[]>([])
  const [trend, setTrend] = useState<TrendDay[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/global_stats.json').then(r => r.json()),
      fetch('/top10_risk.json').then(r => r.json()),
      fetch('/global_trend.json').then(r => r.json()),
    ]).then(([s, t10, tr]) => {
      setStats(s)
      setTop10(t10)
      setTrend(tr)
      setLoading(false)
    })
  }, [])

  const riskDistribution = stats ? [
    { name: 'High Risk', value: stats.high_risk, fill: '#f85149' },
    { name: 'Medium Risk', value: stats.medium_risk, fill: '#d29922' },
    { name: 'Low Risk', value: stats.low_risk, fill: '#3fb950' },
  ] : []

  const topCountriesData = top10.map(c => ({
    country: c["Country/Region"],
    score: c.risk_score,
    fill: c.risk_level === 'High'
      ? '#f85149'
      : c.risk_level === 'Medium'
        ? '#d29922' : '#3fb950'
  }))

  const tickFmt = (v: string) => {
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
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-foreground mb-2">
              🌍 Global Epidemic Overview
            </h1>
            <p className="text-muted-foreground">
              Real-time global epidemic surveillance and analytics
            </p>
          </div>

          {/* Metric Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2
                          lg:grid-cols-4 gap-4 mb-8">
            <MetricCard
              label="Total Cases"
              value={stats
                ? (stats.total_cases / 1e6).toFixed(1) + 'M'
                : '—'}
              icon={<Users size={20} />}
            />
            <MetricCard
              label="Total Deaths"
              value={stats
                ? (stats.total_deaths / 1e6).toFixed(2) + 'M'
                : '—'}
              color="danger"
              icon={<AlertTriangle size={20} />}
            />
            <MetricCard
              label="High Risk Countries"
              value={stats?.high_risk ?? '—'}
              color="warning"
              icon={<TrendingUp size={20} />}
            />
            <MetricCard
              label="Avg Rt Value"
              value={stats?.avg_rt?.toFixed(2) ?? '—'}
              icon={<Activity size={20} />}
            />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2
                          gap-6 mb-6">
            {/* Top 10 */}
            <div className="chart-container">
              <h2 className="text-lg font-semibold
                             text-foreground mb-4">
                Top 10 High Risk Countries
              </h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={topCountriesData}>
                  <CartesianGrid strokeDasharray="3 3"
                    stroke="#30363d" />
                  <XAxis dataKey="country" stroke="#8b949e"
                    angle={-45} textAnchor="end"
                    height={80} />
                  <YAxis stroke="#8b949e" />
                  <Tooltip contentStyle={{
                    backgroundColor: '#161b22',
                    border: '1px solid #21262d'
                  }} labelStyle={{ color: '#c9d1d9' }}
                    formatter={(v: number) =>
                      [v?.toFixed(1), 'Risk Score']} />
                  <Bar dataKey="score" radius={[8, 8, 0, 0]}>
                    {topCountriesData.map((e, i) => (
                      <Cell key={i} fill={e.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Risk Distribution */}
            <div className="chart-container">
              <h2 className="text-lg font-semibold
                             text-foreground mb-4">
                Risk Distribution
              </h2>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={riskDistribution}
                    cx="50%" cy="50%"
                    labelLine={false}
                    label={({ name, value }) =>
                      `${name}: ${value}`}
                    outerRadius={100}
                    dataKey="value"
                  >
                    {riskDistribution.map((e, i) => (
                      <Cell key={i} fill={e.fill} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{
                    backgroundColor: '#161b22',
                    border: '1px solid #21262d'
                  }} labelStyle={{ color: '#c9d1d9' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Global Trend */}
          <div className="chart-container">
            <h2 className="text-lg font-semibold
                           text-foreground mb-4">
              Global Daily New Cases Trend (2020-2023)
            </h2>
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={trend}>
                <CartesianGrid strokeDasharray="3 3"
                  stroke="#30363d" />
                <XAxis dataKey="date" stroke="#8b949e"
                  tickFormatter={tickFmt}
                  interval={90} />
                <YAxis stroke="#8b949e"
                  tickFormatter={v =>
                    v >= 1e6
                      ? (v / 1e6).toFixed(1) + 'M'
                      : v >= 1000
                        ? (v / 1000).toFixed(0) + 'K'
                        : v} />
                <Tooltip contentStyle={{
                  backgroundColor: '#161b22',
                  border: '1px solid #21262d'
                }} labelStyle={{ color: '#c9d1d9' }}
                  formatter={(v: number) =>
                    [v?.toLocaleString(), '']} />
                <Legend />
                <Line type="monotone" dataKey="rolling_7"
                  stroke="#58a6ff" strokeWidth={2}
                  dot={false} name="7-Day Avg" />
                <Line type="monotone" dataKey="new_cases"
                  stroke="#3fb950" strokeWidth={1}
                  dot={false} name="Daily Cases"
                  opacity={0.4} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  )
}