import React, { useState, useEffect } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator,
  RefreshControl, StatusBar as RNStatusBar
} from 'react-native'
import axios from 'axios'

axios.defaults.headers.common['ngrok-skip-browser-warning'] = 'true'

const API = 'https://cytoclastic-araceli-astutely.ngrok-free.dev'

const C = {
  bg: '#0d1117',
  card: '#161b22',
  border: '#30363d',
  accent: '#58a6ff',
  danger: '#f85149',
  success: '#3fb950',
  warning: '#d29922',
  text: '#c9d1d9',
  muted: '#8b949e',
}

const RISK_COLORS: Record<string, string> = {
  High: '#f85149', Medium: '#d29922', Low: '#3fb950'
}

type Screen = 'home' | 'alerts' | 'forecast' | 'simulator'

export default function App() {
  const [screen, setScreen] = useState<Screen>('home')
  const topPad = RNStatusBar.currentHeight ?? 44

  return (
    <View style={{
      flex: 1, backgroundColor: C.bg,
      paddingTop: topPad
    }}>
      <RNStatusBar barStyle="light-content"
        backgroundColor={C.bg}
        translucent={false} />
      <View style={{ flex: 1 }}>
        {screen === 'home' && <HomeScreen />}
        {screen === 'alerts' && <AlertsScreen />}
        {screen === 'forecast' && <ForecastScreen />}
        {screen === 'simulator' && <SimulatorScreen />}
      </View>

      <View style={styles.tabBar}>
        {([
          { key: 'home', icon: '🌍', label: 'Overview' },
          { key: 'alerts', icon: '🚨', label: 'Alerts' },
          { key: 'forecast', icon: '📈', label: 'Forecast' },
          { key: 'simulator', icon: '🧪', label: 'Simulator' },
        ] as { key: Screen, icon: string, label: string }[])
          .map(t => (
            <TouchableOpacity key={t.key}
              style={styles.tabItem}
              onPress={() => setScreen(t.key)}>
              <Text style={styles.tabIcon}>{t.icon}</Text>
              <Text style={[styles.tabLabel, {
                color: screen === t.key
                  ? C.accent : C.muted
              }]}>{t.label}</Text>
            </TouchableOpacity>
          ))}
      </View>
    </View>
  )
}

function HomeScreen() {
  const [stats, setStats] = useState<any>(null)
  const [top10, setTop10] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const load = async () => {
    try {
      const [s, t] = await Promise.all([
        axios.get(`${API}/stats`),
        axios.get(`${API}/top10`),
      ])
      setStats(s.data)
      setTop10(t.data.countries)
    } catch (e) { console.error(e) }
    finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => { load() }, [])
  if (loading) return <Loader />

  return (
    <ScrollView style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true); load()
          }}
          tintColor={C.accent} />
      }>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          🦠 Epidemic Prediction System
        </Text>
        <Text style={styles.headerSub}>
          SPIRIT 2026 | IIT-BHU | CodeCure
        </Text>
      </View>

      <View style={styles.metricsGrid}>
        <MetCard label="Total Cases"
          value={stats
            ? `${(stats.total_cases / 1e6).toFixed(1)}M`
            : '—'}
          color={C.accent} />
        <MetCard label="Total Deaths"
          value={stats
            ? `${(stats.total_deaths / 1e6).toFixed(2)}M`
            : '—'}
          color={C.danger} />
        <MetCard label="High Risk"
          value={String(stats?.high_risk ?? '—')}
          color={C.danger} />
        <MetCard label="Avg Rt"
          value={stats?.avg_rt?.toFixed(2) ?? '—'}
          color={stats?.avg_rt > 1
            ? C.warning : C.success} />
      </View>

      {stats?.high_risk > 0 && (
        <View style={[styles.alertBanner,
        { borderColor: C.danger }]}>
          <Text style={[styles.alertBannerText,
          { color: C.danger }]}>
            🚨 {stats.high_risk} countries HIGH RISK
          </Text>
          <Text style={{
            color: C.muted,
            fontSize: 12, marginTop: 4
          }}>
            Check Alerts tab for details
          </Text>
        </View>
      )}

      <Text style={styles.sectionTitle}>
        Top Risk Countries
      </Text>

      {top10.map((c, i) => (
        <View key={i} style={styles.countryCard}>
          <View style={styles.countryLeft}>
            <Text style={styles.rank}>#{i + 1}</Text>
            <View>
              <Text style={styles.countryName}>
                {c['Country/Region']}
              </Text>
              <Text style={styles.countrySub}>
                {c.new_cases?.toLocaleString()} new cases
              </Text>
            </View>
          </View>
          <View style={styles.countryRight}>
            <Text style={[styles.riskScore, {
              color: RISK_COLORS[c.risk_level] ?? C.text
            }]}>
              {c.risk_score?.toFixed(1)}
            </Text>
            <View style={[styles.riskBadge, {
              backgroundColor:
                (RISK_COLORS[c.risk_level] ?? C.muted) + '25'
            }]}>
              <Text style={[styles.riskBadgeText, {
                color: RISK_COLORS[c.risk_level] ?? C.muted
              }]}>
                {c.risk_level}
              </Text>
            </View>
          </View>
        </View>
      ))}
      <View style={{ height: 24 }} />
    </ScrollView>
  )
}

function AlertsScreen() {
  const [alerts, setAlerts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    axios.get(`${API}/alerts?limit=20`)
      .then(r => setAlerts(r.data.alerts))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Loader />

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle,
        { color: C.danger }]}>
          🚨 Active Outbreak Alerts
        </Text>
        <Text style={styles.headerSub}>
          {alerts.length} countries need attention
        </Text>
      </View>

      {alerts.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={{
            color: C.success,
            fontSize: 18, textAlign: 'center'
          }}>
            ✅ No active alerts
          </Text>
        </View>
      ) : alerts.map((a, i) => (
        <View key={i} style={[styles.alertCard, {
          borderLeftColor: a.alert_type === 'OUTBREAK'
            ? C.danger : C.warning,
          borderLeftWidth: 4,
        }]}>
          <View style={styles.alertCardHeader}>
            <Text style={styles.alertCountry}>
              {a.country}
            </Text>
            <View style={[styles.alertTypeBadge, {
              backgroundColor:
                (a.alert_type === 'OUTBREAK'
                  ? C.danger : C.warning) + '25'
            }]}>
              <Text style={[styles.alertTypeText, {
                color: a.alert_type === 'OUTBREAK'
                  ? C.danger : C.warning
              }]}>
                {a.alert_type}
              </Text>
            </View>
          </View>
          <Text style={styles.alertMessage}>
            {a.message}
          </Text>
          <View style={styles.chipsRow}>
            <Chip label="Risk Score"
              value={a.risk_score?.toFixed(1)}
              color={C.danger} />
            <Chip label="Rt Value"
              value={a.Rt?.toFixed(2)}
              color={a.Rt > 1 ? C.warning : C.success} />
            <Chip label="New Cases"
              value={a.new_cases?.toLocaleString()}
              color={C.accent} />
          </View>
        </View>
      ))}
      <View style={{ height: 24 }} />
    </ScrollView>
  )
}

function ForecastScreen() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    axios.get(`${API}/forecast?days=14`)
      .then(r => setData(r.data.forecast))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Loader />

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          📈 Forecast — India
        </Text>
        <Text style={styles.headerSub}>
          Ridge Regression — 60 day prediction
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>
          Next 14 Days Predicted Cases
        </Text>
        <View style={styles.tableHeader}>
          <Text style={[styles.tableCol,
          styles.tableHeaderText]}>Date</Text>
          <Text style={[styles.tableCol,
          styles.tableHeaderText,
          { textAlign: 'right' }]}>Predicted</Text>
          <Text style={[styles.tableCol,
          styles.tableHeaderText,
          { textAlign: 'right' }]}>Range</Text>
        </View>
        {data.map((r, i) => (
          <View key={i} style={[styles.tableRow,
          i % 2 === 0
            ? { backgroundColor: C.bg + '60' }
            : {}]}>
            <Text style={[styles.tableCol,
            { color: C.muted, fontSize: 12 }]}>
              {r.date}
            </Text>
            <Text style={[styles.tableCol,
            {
              color: C.accent, fontSize: 14,
              fontWeight: 'bold',
              textAlign: 'right'
            }]}>
              {Math.round(r.predicted)
                .toLocaleString()}
            </Text>
            <Text style={[styles.tableCol,
            {
              color: C.muted, fontSize: 11,
              textAlign: 'right'
            }]}>
              {Math.round(r.lower)
                .toLocaleString()}
              {'-'}
              {Math.round(r.upper)
                .toLocaleString()}
            </Text>
          </View>
        ))}
      </View>

      <View style={[styles.card,
      { borderColor: C.accent + '40' }]}>
        <Text style={styles.cardTitle}>
          About This Model
        </Text>
        <Text style={{
          color: C.muted,
          fontSize: 13, lineHeight: 22
        }}>
          Ridge Regression with time-series lag
          features. Trained on Johns Hopkins
          COVID-19 data (2020-2023).{'\n\n'}
          Confidence interval: ±15% of predicted.
        </Text>
      </View>
      <View style={{ height: 24 }} />
    </ScrollView>
  )
}

function SimulatorScreen() {
  const [r, setR] = useState(1.2)
  const [vax, setVax] = useState(30)
  const [days, setDays] = useState(90)
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const run = async () => {
    setLoading(true)
    try {
      const res = await axios.post(
        `${API}/simulate/sir`,
        {
          r_value: r, vax_rate: vax,
          days, population: 1400000000
        }
      )
      setResult(res.data)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  const sColor = r < 1 ? C.success
    : r < 1.5 ? C.warning : C.danger
  const sMsg = r < 1
    ? '✅ Epidemic will decline'
    : r < 1.5 ? '⚠️ Epidemic will persist'
      : '🚨 Epidemic will accelerate!'

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          🧪 What-If Simulator
        </Text>
        <Text style={styles.headerSub}>
          SIR Model — epidemic scenario analysis
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>
          Simulation Parameters
        </Text>

        <CtrlRow label="R-value (Reproduction)"
          value={r.toFixed(1)} color={sColor}
          onMinus={() => setR(v =>
            Math.max(0.5,
              Math.round((v - 0.1) * 10) / 10))}
          onPlus={() => setR(v =>
            Math.min(3.0,
              Math.round((v + 0.1) * 10) / 10))} />

        <CtrlRow label="Vaccination Rate"
          value={`${vax}%`} color={C.success}
          onMinus={() =>
            setVax(v => Math.max(0, v - 5))}
          onPlus={() =>
            setVax(v => Math.min(100, v + 5))} />

        <CtrlRow label="Days to Simulate"
          value={String(days)} color={C.accent}
          onMinus={() =>
            setDays(v => Math.max(30, v - 10))}
          onPlus={() =>
            setDays(v => Math.min(365, v + 10))} />

        <View style={[styles.statusBanner, {
          borderColor: sColor,
          backgroundColor: sColor + '20'
        }]}>
          <Text style={[styles.statusText,
          { color: sColor }]}>
            {sMsg}
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.runBtn,
          loading && { opacity: 0.5 }]}
          onPress={run}
          disabled={loading}>
          <Text style={styles.runBtnText}>
            {loading
              ? 'Simulating...'
              : '▶  Run Simulation'}
          </Text>
        </TouchableOpacity>
      </View>

      {result && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            Simulation Results
          </Text>
          <View style={styles.resultsGrid}>
            <ResCard label="Peak Day"
              value={`Day ${result.peak_day}`}
              color={C.warning} />
            <ResCard label="Peak Infected"
              value={result.peak_infected
                ?.toLocaleString()}
              color={C.danger} />
            <ResCard label="Total Infected"
              value={`${result
                .total_infected_pct}%`}
              color={C.accent} />
            <ResCard label="Herd Immunity"
              value={`${result
                .herd_immunity_threshold}%`}
              color={C.success} />
          </View>

          <View style={[styles.statusBanner, {
            marginTop: 12,
            borderColor: result.status === 'controlled'
              ? C.success : result.status === 'spreading'
                ? C.warning : C.danger,
            backgroundColor:
              (result.status === 'controlled'
                ? C.success : result.status === 'spreading'
                  ? C.warning : C.danger) + '20'
          }]}>
            <Text style={[styles.statusText, {
              color: result.status === 'controlled'
                ? C.success : result.status === 'spreading'
                  ? C.warning : C.danger
            }]}>
              Status: {result.status?.toUpperCase()}
            </Text>
          </View>
        </View>
      )}
      <View style={{ height: 24 }} />
    </ScrollView>
  )
}

function Loader() {
  return (
    <View style={styles.loaderContainer}>
      <ActivityIndicator size="large"
        color={C.accent} />
      <Text style={{
        color: C.muted,
        marginTop: 12, fontSize: 14
      }}>
        Loading...
      </Text>
    </View>
  )
}

function MetCard({ label, value, color }: any) {
  return (
    <View style={styles.metCard}>
      <Text style={styles.metLabel}>{label}</Text>
      <Text style={[styles.metValue, { color }]}>
        {value}
      </Text>
    </View>
  )
}

function Chip({ label, value, color }: any) {
  return (
    <View style={styles.chip}>
      <Text style={styles.chipLabel}>{label}</Text>
      <Text style={[styles.chipValue, { color }]}>
        {value}
      </Text>
    </View>
  )
}

function CtrlRow({ label, value, color,
  onMinus, onPlus }: any) {
  return (
    <View style={styles.ctrlRow}>
      <Text style={styles.ctrlLabel}>{label}</Text>
      <View style={styles.ctrlBtns}>
        <TouchableOpacity
          style={styles.ctrlBtn}
          onPress={onMinus}>
          <Text style={styles.ctrlBtnText}>−</Text>
        </TouchableOpacity>
        <Text style={[styles.ctrlValue, { color }]}>
          {value}
        </Text>
        <TouchableOpacity
          style={styles.ctrlBtn}
          onPress={onPlus}>
          <Text style={styles.ctrlBtnText}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

function ResCard({ label, value, color }: any) {
  return (
    <View style={styles.resCard}>
      <Text style={styles.resLabel}>{label}</Text>
      <Text style={[styles.resValue, { color }]}>
        {value}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bg
  },
  loaderContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.bg
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40, marginTop: 60
  },
  header: {
    padding: 16,
    paddingBottom: 14,
    backgroundColor: C.card,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    marginBottom: 12
  },
  headerTitle: {
    color: C.accent,
    fontSize: 17,
    fontWeight: 'bold'
  },
  headerSub: {
    color: C.muted,
    fontSize: 12, marginTop: 4
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    gap: 10, marginBottom: 12
  },
  metCard: {
    width: '47%',
    backgroundColor: C.card,
    borderRadius: 10, padding: 14,
    borderWidth: 1,
    borderColor: C.border
  },
  metLabel: {
    color: C.muted,
    fontSize: 11, marginBottom: 6
  },
  metValue: {
    fontSize: 22,
    fontWeight: 'bold'
  },
  alertBanner: {
    marginHorizontal: 12,
    marginBottom: 12,
    backgroundColor: C.danger + '15',
    borderRadius: 10, padding: 14,
    borderWidth: 1
  },
  alertBannerText: {
    fontSize: 15,
    fontWeight: 'bold'
  },
  sectionTitle: {
    color: C.text, fontSize: 16,
    fontWeight: 'bold',
    paddingHorizontal: 12,
    marginBottom: 10
  },
  countryCard: {
    marginHorizontal: 12,
    marginBottom: 8,
    backgroundColor: C.card,
    borderRadius: 10, padding: 14,
    borderWidth: 1,
    borderColor: C.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  countryLeft: {
    flexDirection: 'row',
    alignItems: 'center', gap: 12,
    flex: 1
  },
  rank: {
    color: C.muted, fontSize: 15,
    fontWeight: 'bold', width: 28
  },
  countryName: {
    color: C.text, fontSize: 14,
    fontWeight: '600'
  },
  countrySub: {
    color: C.muted, fontSize: 11,
    marginTop: 3
  },
  countryRight: { alignItems: 'flex-end' },
  riskScore: {
    fontSize: 20,
    fontWeight: 'bold'
  },
  riskBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6, marginTop: 4
  },
  riskBadgeText: {
    fontSize: 11,
    fontWeight: 'bold'
  },
  alertCard: {
    marginHorizontal: 12,
    marginBottom: 10,
    backgroundColor: C.card,
    borderRadius: 10, padding: 14,
    borderWidth: 1,
    borderColor: C.border
  },
  alertCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  alertCountry: {
    color: C.text, fontSize: 16,
    fontWeight: 'bold'
  },
  alertTypeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6
  },
  alertTypeText: {
    fontSize: 12,
    fontWeight: 'bold'
  },
  alertMessage: {
    color: C.muted, fontSize: 13,
    lineHeight: 18,
    marginBottom: 12
  },
  chipsRow: { flexDirection: 'row', gap: 8 },
  chip: {
    flex: 1,
    backgroundColor: C.bg,
    borderRadius: 8, padding: 10,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: 'center'
  },
  chipLabel: {
    color: C.muted, fontSize: 10,
    marginBottom: 3
  },
  chipValue: {
    fontSize: 13,
    fontWeight: 'bold'
  },
  card: {
    marginHorizontal: 12,
    marginBottom: 12,
    backgroundColor: C.card,
    borderRadius: 12, padding: 16,
    borderWidth: 1,
    borderColor: C.border
  },
  cardTitle: {
    color: C.text, fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 14
  },
  tableHeader: {
    flexDirection: 'row',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    marginBottom: 4
  },
  tableHeaderText: {
    color: C.muted,
    fontSize: 12,
    fontWeight: '600'
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor:
      C.border + '40'
  },
  tableCol: { flex: 1 },
  ctrlRow: { marginBottom: 16 },
  ctrlLabel: {
    color: C.text, fontSize: 13,
    marginBottom: 10
  },
  ctrlBtns: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  ctrlBtn: {
    backgroundColor: C.border,
    width: 44, height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center'
  },
  ctrlBtnText: {
    color: C.text, fontSize: 24,
    fontWeight: 'bold'
  },
  ctrlValue: {
    fontSize: 22,
    fontWeight: 'bold',
    minWidth: 80,
    textAlign: 'center'
  },
  statusBanner: {
    borderRadius: 10,
    padding: 14, borderWidth: 1,
    marginBottom: 14,
    alignItems: 'center'
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center'
  },
  runBtn: {
    backgroundColor: C.accent,
    borderRadius: 12, padding: 16,
    alignItems: 'center'
  },
  runBtnText: {
    color: '#fff', fontSize: 16,
    fontWeight: 'bold'
  },
  resultsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap', gap: 10
  },
  resCard: {
    width: '47%',
    backgroundColor: C.bg,
    borderRadius: 10, padding: 12,
    borderWidth: 1,
    borderColor: C.border
  },
  resLabel: {
    color: C.muted, fontSize: 11,
    marginBottom: 6
  },
  resValue: {
    fontSize: 18,
    fontWeight: 'bold'
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: C.card,
    borderTopWidth: 1,
    borderTopColor: C.border,
    height: 58,
    paddingBottom: 4
  },
  tabItem: {
    flex: 1, alignItems: 'center',
    justifyContent: 'center'
  },
  tabIcon: { fontSize: 20 },
  tabLabel: { fontSize: 10, marginTop: 2 },
})