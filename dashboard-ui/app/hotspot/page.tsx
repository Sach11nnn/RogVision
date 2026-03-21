'use client'

import { useState, useEffect } from 'react'
import { Sidebar } from '@/components/sidebar'
import { MetricCard } from '@/components/metric-card'
import {
  BarChart, Bar, ScatterChart, Scatter,
  XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, Cell
} from 'recharts'
import { AlertTriangle } from 'lucide-react'

interface CountryInfo {
  "Country/Region": string
  risk_score: number
  risk_level: string
  confirmed: number
  new_cases: number
  death_rate: number
  Rt: number
  cases_per_million: number
}

const getRiskColor = (level: string) => {
  if (level === 'High') return '#f85149'
  if (level === 'Medium') return '#d29922'
  return '#3fb950'
}

const getRiskBadgeClass = (level: string) => {
  if (level === 'High')
    return 'bg-destructive/20 text-destructive border border-destructive/50'
  if (level === 'Medium')
    return 'bg-warning/20 text-warning border border-warning/50'
  return 'bg-success/20 text-success border border-success/50'
}

export default function HotspotAnalysis() {
  const [countries, setCountries] = useState<CountryInfo[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/countries.json')
      .then(r => r.json())
      .then((data: CountryInfo[]) => {
        setCountries(data)
        setLoading(false)
      })
  }, [])

  const sorted = [...countries].sort(
    (a, b) => b.risk_score - a.risk_score
  )
  const top20 = sorted.slice(0, 20)
  const highRisk = countries.filter(
    c => c.risk_level === 'High'
  ).length
  const mediumRisk = countries.filter(
    c => c.risk_level === 'Medium'
  ).length
  const lowRisk = countries.filter(
    c => c.risk_level === 'Low'
  ).length

  const barData = top20.map(c => ({
    country: c["Country/Region"],
    score: c.risk_score,
    level: c.risk_level,
  }))

  const scatterData = sorted
    .filter(c => c.Rt > 0 && c.Rt < 5)
    .slice(0, 50)
    .map(c => ({
      rtValue: +c.Rt.toFixed(2),
      riskScore: +c.risk_score.toFixed(1),
      newCases: c.new_cases,
      country: c["Country/Region"],
      level: c.risk_level,
    }))

  if (loading) {
    return (
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <div className="flex-1 flex items-center
                        justify-center">
          <p className="text-muted-foreground">
            Loading...
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
            <h1 className="text-4xl font-bold
                           text-foreground mb-2">
              🔍 Hotspot Analysis
            </h1>
            <p className="text-muted-foreground">
              Global risk assessment and country ranking
            </p>
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3
                          gap-4 mb-8">
            <MetricCard label="High Risk Countries"
              value={highRisk} color="danger"
              icon={<AlertTriangle size={20} />} />
            <MetricCard label="Medium Risk Countries"
              value={mediumRisk} color="warning" />
            <MetricCard label="Low Risk Countries"
              value={lowRisk} color="success" />
          </div>

          {/* Top 20 Bar */}
          <div className="bg-card border border-border
                          rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold
                           text-foreground mb-4">
              Top 20 Countries by Risk Score
            </h2>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={barData} layout="vertical"
                margin={{
                  top: 5, right: 30,
                  left: 150, bottom: 5
                }}>
                <CartesianGrid strokeDasharray="3 3"
                  stroke="#30363d" />
                <XAxis type="number" stroke="#8b949e" />
                <YAxis dataKey="country" type="category"
                  stroke="#8b949e" width={140} />
                <Tooltip contentStyle={{
                  backgroundColor: '#161b22',
                  border: '1px solid #21262d'
                }} labelStyle={{ color: '#c9d1d9' }}
                  formatter={(v: number) =>
                    [v?.toFixed(1), 'Risk Score']} />
                <Bar dataKey="score"
                  radius={[0, 8, 8, 0]}>
                  {barData.map((e, i) => (
                    <Cell key={i}
                      fill={getRiskColor(e.level)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Scatter */}
          <div className="bg-card border border-border
                          rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold
                           text-foreground mb-4">
              Reproduction Number (Rt) vs Risk Score
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              Real data from 201 countries
            </p>
            <ResponsiveContainer width="100%" height={350}>
              <ScatterChart
                margin={{
                  top: 20, right: 20,
                  bottom: 20, left: 20
                }}>
                <CartesianGrid strokeDasharray="3 3"
                  stroke="#30363d" />
                <XAxis dataKey="rtValue" stroke="#8b949e"
                  name="Rt" type="number" />
                <YAxis dataKey="riskScore" stroke="#8b949e"
                  name="Risk Score" type="number" />
                <Tooltip contentStyle={{
                  backgroundColor: '#161b22',
                  border: '1px solid #21262d'
                }} labelStyle={{ color: '#c9d1d9' }}
                  content={({ payload }) => {
                    if (!payload?.length) return null
                    const d = payload[0]?.payload
                    return (
                      <div style={{
                        background: '#161b22',
                        border: '1px solid #21262d',
                        padding: '8px',
                        borderRadius: '6px',
                        color: '#c9d1d9',
                        fontSize: '12px'
                      }}>
                        <p><b>{d?.country}</b></p>
                        <p>Rt: {d?.rtValue}</p>
                        <p>Risk: {d?.riskScore}</p>
                        <p>New Cases: {
                          d?.newCases?.toLocaleString()
                        }</p>
                      </div>
                    )
                  }} />
                <Scatter data={scatterData} fillOpacity={0.7}>
                  {scatterData.map((e, i) => (
                    <Cell key={i}
                      fill={getRiskColor(e.level)} />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>

          {/* Table */}
          <div className="bg-card border border-border
                          rounded-lg p-6">
            <h2 className="text-lg font-semibold
                           text-foreground mb-4">
              Detailed Country Analysis
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    {['Country', 'Risk Score', 'Risk Level',
                      'New Cases/Day', 'Death Rate',
                      'Rt Value'].map(h => (
                        <th key={h}
                          className="text-left py-3 px-4
                                     text-foreground
                                     font-semibold">
                          {h}
                        </th>
                      ))}
                  </tr>
                </thead>
                <tbody>
                  {top20.map((row, idx) => (
                    <tr key={idx}
                      className="border-b border-secondary
                                   hover:bg-secondary/50
                                   transition-colors">
                      <td className="py-3 px-4
                                     text-foreground
                                     font-medium">
                        {row["Country/Region"]}
                      </td>
                      <td className="py-3 px-4
                                     text-foreground">
                        {row.risk_score?.toFixed(1)}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-block
                          px-3 py-1 rounded text-xs
                          font-semibold
                          ${getRiskBadgeClass(
                          row.risk_level
                        )}`}>
                          {row.risk_level}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right
                                     text-muted-foreground">
                        {row.new_cases?.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right
                                     text-muted-foreground">
                        {row.death_rate?.toFixed(2)}%
                      </td>
                      <td className="py-3 px-4 text-right
                                     text-foreground">
                        {row.Rt?.toFixed(2) ?? '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}