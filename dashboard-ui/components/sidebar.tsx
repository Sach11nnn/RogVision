'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Globe, Drill, TrendingUp, Zap, AlertCircle } from 'lucide-react'

const navItems = [
  { href: '/', label: 'Global Overview', icon: Globe },
  { href: '/country', label: 'Country Deep Dive', icon: Drill },
  { href: '/forecast', label: 'Forecast', icon: TrendingUp },
  { href: '/simulator', label: 'What-If Simulator', icon: Zap },
  { href: '/hotspot', label: 'Hotspot Analysis', icon: AlertCircle },
]

const stats = [
  { label: 'Countries', value: '201' },
  { label: 'Date Range', value: '2020-2023' },
  { label: 'High Risk', value: '23' },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-64 bg-card border-r border-border flex flex-col h-screen sticky top-0">
      {/* Header */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-3 mb-2">
          <div className="text-2xl">🦠</div>
          <div>
            <h1 className="text-xl font-bold text-primary">ESPS</h1>
            <p className="text-xs text-muted-foreground">Epidemic Prediction</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4">
        <div className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`nav-link ${isActive ? 'active' : ''}`}
              >
                <Icon size={20} />
                <span className="font-medium">{item.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>

      {/* Stats Panel */}
      <div className="p-4 border-t border-border bg-secondary/30">
        <h3 className="text-xs font-semibold text-muted-foreground mb-4 uppercase">Stats</h3>
        <div className="space-y-3">
          {stats.map((stat) => (
            <div key={stat.label}>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
              <p className="text-sm font-semibold text-foreground">{stat.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-border text-center">
        <p className="text-xs text-muted-foreground">SPIRIT 2026 | IIT-BHU</p>
      </div>
    </aside>
  )
}
