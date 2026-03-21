import React from 'react'

interface MetricCardProps {
  label: string
  value: string | number
  unit?: string
  trend?: number
  color?: 'default' | 'danger' | 'success' | 'warning'
  icon?: React.ReactNode
}

export function MetricCard({ 
  label, 
  value, 
  unit,
  trend,
  color = 'default',
  icon
}: MetricCardProps) {
  const colorClasses = {
    default: 'border-border',
    danger: 'border-destructive/50',
    success: 'border-success/50',
    warning: 'border-warning/50',
  }

  const trendColor = trend && trend > 0 ? 'text-destructive' : 'text-success'

  return (
    <div className={`metric-card border ${colorClasses[color]}`}>
      <div className="flex items-start justify-between mb-2">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        {icon && <div className="text-primary">{icon}</div>}
      </div>
      <div className="flex items-baseline gap-2">
        <p className="text-2xl font-bold text-foreground">{value}</p>
        {unit && <p className="text-sm text-muted-foreground">{unit}</p>}
      </div>
      {trend !== undefined && (
        <p className={`text-xs mt-3 ${trendColor}`}>
          {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}% from last week
        </p>
      )}
    </div>
  )
}
