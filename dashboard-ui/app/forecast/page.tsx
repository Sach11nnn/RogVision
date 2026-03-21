'use client'

import { useState, useEffect } from 'react'
import { Sidebar } from '@/components/sidebar'
import {
  LineChart, Line, AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine
} from 'recharts'

interface ForecastDay {
  date: string
  actual: number | null
  predicted: number
  lower: number
  upper: number
}

export default function Forecast() {
  const [data, setData] = useState<ForecastDay[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/forecast.json')
      .then(r => r.json())
      .then((raw: any[]) => {
        const mapped = raw.map(d => ({
          date: d.date,
          actual: d.actual,
          predicted: d.predicted,
          lower: d.lower,
          upper: d.upper,
        }))
        setData(mapped)
        setLoading(false)
      })
  }, [])

  const tickFmt = (v: string) => {
    try {
      return new Date(v).toLocaleDateString('en-US',
        { month: 'short', year: '2-digit' })
    } catch { return v }
  }

  const next7 = data.filter(d => d.actual === null).slice(0, 7)

  if (loading) {
    return (
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">Loading...</p>
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
              📈 Epidemic Forecast — India
            </h1>
            <p className="text-muted-foreground">
              60-day predictive model with confidence intervals
            </p>
          </div>

          {/* Forecast Chart */}
          <div className="bg-card border border-border
                          rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold
                           text-foreground mb-4">
              Predicted Cases with Confidence Interval
            </h2>
            <ResponsiveContainer width="100%" height={400}>
              <AreaChart data={data}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="ciGrad"
                    x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"
                      stopColor="#f85149"
                      stopOpacity={0.15} />
                    <stop offset="95%"
                      stopColor="#f85149"
                      stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3"
                  stroke="#30363d" />
                <XAxis dataKey="date" stroke="#8b949e"
                  tickFormatter={tickFmt}
                  angle={-45} textAnchor="end"
                  height={80} interval={60} />
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
                    [v?.toLocaleString() ?? '—', '']} />
                <Legend />
                <Area type="monotone" dataKey="upper"
                  fill="url(#ciGrad)" stroke="none"
                  name="Confidence Interval"
                  legendType="none" />
                <ReferenceLine x="2020-09-01"
                  stroke="#8b949e" strokeDasharray="5 5"
                  label={{
                    value: "Wave 1",
                    fill: "#8b949e", fontSize: 11
                  }} />
                <ReferenceLine x="2021-04-01"
                  stroke="#8b949e" strokeDasharray="5 5"
                  label={{
                    value: "Wave 2",
                    fill: "#8b949e", fontSize: 11
                  }} />
                <ReferenceLine x="2022-01-01"
                  stroke="#8b949e" strokeDasharray="5 5"
                  label={{
                    value: "Omicron",
                    fill: "#8b949e", fontSize: 11
                  }} />
                <Line type="monotone" dataKey="actual"
                  stroke="#58a6ff" strokeWidth={2.5}
                  dot={false} name="Actual Cases"
                  connectNulls={false} />
                <Line type="monotone" dataKey="predicted"
                  stroke="#d29922" strokeWidth={2}
                  strokeDasharray="5 5" dot={false}
                  name="Model Fit" />
                <Line type="monotone" dataKey="lower"
                  stroke="#f85149" strokeWidth={1}
                  strokeDasharray="3 3" dot={false}
                  name="Lower Bound" opacity={0.5} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Next 7 Days Table */}
          <div className="bg-card border border-border
                          rounded-lg p-6">
            <h2 className="text-lg font-semibold
                           text-foreground mb-4">
              Next 7 Days Predicted Cases
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4
                                   text-foreground
                                   font-semibold">Date</th>
                    <th className="text-right py-3 px-4
                                   text-foreground
                                   font-semibold">
                      Predicted Cases
                    </th>
                    <th className="text-right py-3 px-4
                                   text-foreground
                                   font-semibold">
                      Lower Bound (85%)
                    </th>
                    <th className="text-right py-3 px-4
                                   text-foreground
                                   font-semibold">
                      Upper Bound (115%)
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {next7.map((row, idx) => (
                    <tr key={idx}
                      className="border-b border-secondary
                                   hover:bg-secondary/50
                                   transition-colors">
                      <td className="py-3 px-4
                                     text-foreground">
                        {row.date}
                      </td>
                      <td className="py-3 px-4 text-right
                                     text-foreground
                                     font-medium">
                        {Math.round(row.predicted)
                          .toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right
                                     text-muted-foreground">
                        {Math.round(row.lower)
                          .toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right
                                     text-muted-foreground">
                        {Math.round(row.upper)
                          .toLocaleString()}
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