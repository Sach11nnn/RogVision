'use client'

import { useState, useMemo } from 'react'
import { Sidebar } from '@/components/sidebar'
import { MetricCard } from '@/components/metric-card'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

// SIR Model simulation
function runSIRModel(R: number, vaccinationPercent: number, days: number) {
  const population = 1000000
  const vaccinatedCount = (population * vaccinationPercent) / 100
  const susceptible = population - vaccinatedCount
  const initialInfected = 100
  const recoveryRate = 1 / 10 // 10 days average
  const transmissionRate = R * recoveryRate

  const data = []
  let S = susceptible
  let I = initialInfected
  let R_recovered = vaccinatedCount

  for (let day = 0; day <= days; day++) {
    data.push({
      day,
      susceptible: Math.round(S),
      infected: Math.round(I),
      recovered: Math.round(R_recovered),
    })

    if (day < days) {
      const newInfections = (transmissionRate * S * I) / population
      const newRecovered = recoveryRate * I

      S = Math.max(0, S - newInfections)
      I = Math.max(0, I + newInfections - newRecovered)
      R_recovered = Math.min(population, R_recovered + newRecovered)
    }
  }

  // Find peak
  let peakInfected = 0
  let peakDay = 0
  data.forEach((d) => {
    if (d.infected > peakInfected) {
      peakInfected = d.infected
      peakDay = d.day
    }
  })

  const herdImmunityThreshold = (1 - 1 / R) * 100

  return {
    data,
    peakDay,
    peakInfected,
    totalInfectedPercent: (peakInfected / population) * 100,
    herdImmunityThreshold: Math.max(0, Math.min(100, herdImmunityThreshold)),
  }
}

export default function WhatIfSimulator() {
  const [rValue, setRValue] = useState(1.5)
  const [vaccinationPercent, setVaccinationPercent] = useState(40)
  const [days, setDays] = useState(180)

  const simulation = useMemo(() => {
    return runSIRModel(rValue, vaccinationPercent, days)
  }, [rValue, vaccinationPercent, days])

  const getAlertColor = (r: number) => {
    if (r < 1) return 'bg-success/20 border-success/50 text-success'
    if (r < 1.5) return 'bg-warning/20 border-warning/50 text-warning'
    return 'bg-destructive/20 border-destructive/50 text-destructive'
  }

  const getAlertMessage = (r: number) => {
    if (r < 1) return '✓ Epidemic will decline'
    if (r < 1.5) return '⚠ Epidemic will persist'
    return '✕ Epidemic will accelerate'
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex-1 overflow-y-auto">
        <div className="p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-foreground mb-2">🧪 What-If Epidemic Simulator</h1>
            <p className="text-muted-foreground">SIR Model-based scenario analysis</p>
          </div>

          {/* Control Panel */}
          <div className="bg-card border border-border rounded-lg p-6 mb-8">
            <h2 className="text-lg font-semibold text-foreground mb-6">Simulation Parameters</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* R-value Slider */}
              <div>
                <label className="text-foreground font-medium mb-2 block">
                  R-value (Transmission Rate): <span className="text-primary font-bold">{rValue.toFixed(2)}</span>
                </label>
                <input
                  type="range"
                  min="0.5"
                  max="3.0"
                  step="0.1"
                  value={rValue}
                  onChange={(e) => setRValue(parseFloat(e.target.value))}
                  className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer"
                />
                <p className="text-xs text-muted-foreground mt-2">0.5 (controlled) → 3.0 (rapid spread)</p>
              </div>

              {/* Vaccination Slider */}
              <div>
                <label className="text-foreground font-medium mb-2 block">
                  Vaccination Rate: <span className="text-primary font-bold">{vaccinationPercent}%</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={vaccinationPercent}
                  onChange={(e) => setVaccinationPercent(parseInt(e.target.value))}
                  className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer"
                />
                <p className="text-xs text-muted-foreground mt-2">0% (no vaccination) → 100% (full vaccination)</p>
              </div>

              {/* Days Slider */}
              <div>
                <label className="text-foreground font-medium mb-2 block">
                  Simulation Period: <span className="text-primary font-bold">{days} days</span>
                </label>
                <input
                  type="range"
                  min="30"
                  max="365"
                  step="10"
                  value={days}
                  onChange={(e) => setDays(parseInt(e.target.value))}
                  className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer"
                />
                <p className="text-xs text-muted-foreground mt-2">30 days → 365 days (1 year)</p>
              </div>
            </div>
          </div>

          {/* Alert Banner */}
          <div className={`border rounded-lg p-4 mb-8 ${getAlertColor(rValue)}`}>
            <p className="font-semibold text-lg">{getAlertMessage(rValue)}</p>
            <p className="text-sm mt-1 opacity-90">
              {rValue < 1
                ? 'Each infected person infects less than 1 person on average. Epidemic will naturally decline.'
                : rValue < 1.5
                ? 'Epidemic is spreading but at a controlled rate. Sustained intervention needed.'
                : 'Epidemic is rapidly spreading. Immediate action required to reduce transmission.'}
            </p>
          </div>

          {/* Metric Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <MetricCard 
              label="Peak Day" 
              value={simulation.peakDay}
              unit="days"
            />
            <MetricCard 
              label="Peak Infected" 
              value={simulation.peakInfected.toLocaleString()}
              unit="people"
            />
            <MetricCard 
              label="Total Infected %" 
              value={simulation.totalInfectedPercent.toFixed(2)}
              unit="%"
            />
            <MetricCard 
              label="Herd Immunity Threshold" 
              value={simulation.herdImmunityThreshold.toFixed(1)}
              unit="%"
              color="success"
            />
          </div>

          {/* SIR Curve Chart */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">SIR Model Projection</h2>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={simulation.data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#30363d" />
                <XAxis 
                  dataKey="day" 
                  stroke="#8b949e"
                  label={{ value: 'Days', position: 'insideBottomRight', offset: -10, fill: '#8b949e' }}
                />
                <YAxis 
                  stroke="#8b949e"
                  label={{ value: 'Population', angle: -90, position: 'insideLeft', fill: '#8b949e' }}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#161b22', border: '1px solid #21262d' }}
                  labelStyle={{ color: '#c9d1d9' }}
                  formatter={(value) => (value as number).toLocaleString()}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="susceptible" 
                  stroke="#58a6ff" 
                  strokeWidth={2.5}
                  dot={false}
                  name="Susceptible (S)"
                />
                <Line 
                  type="monotone" 
                  dataKey="infected" 
                  stroke="#f85149" 
                  strokeWidth={2.5}
                  dot={false}
                  name="Infected (I)"
                />
                <Line 
                  type="monotone" 
                  dataKey="recovered" 
                  stroke="#3fb950" 
                  strokeWidth={2.5}
                  dot={false}
                  name="Recovered (R)"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  )
}
