import { useEffect, useState } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, RefreshControl
} from 'react-native'
import { useRouter } from 'expo-router'
import axios from 'axios'
import { API_BASE, COLORS, RISK_COLORS } from '../../constants/api'

interface Stats {
  total_cases:    number
  total_deaths:   number
  high_risk:      number
  medium_risk:    number
  low_risk:       number
  avg_rt:         number
  total_countries:number
}

interface Country {
  "Country/Region": string
  risk_score:       number
  risk_level:       string
  new_cases:        number
  Rt:               number
}

export default function HomeScreen() {
  const router = useRouter()
  const [stats,     setStats]     = useState<Stats | null>(null)
  const [top10,     setTop10]     = useState<Country[]>([])
  const [loading,   setLoading]   = useState(true)
  const [refreshing,setRefreshing]= useState(false)

  const fetchData = async () => {
    try {
      const [statsRes, top10Res] = await Promise.all([
        axios.get(`${API_BASE}/stats`),
        axios.get(`${API_BASE}/top10`),
      ])
      setStats(statsRes.data)
      setTop10(top10Res.data.countries)
    } catch (e) {
      console.error('API Error:', e)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.accent}/>
        <Text style={styles.loadingText}>
          Loading epidemic data...
        </Text>
      </View>
    )
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true)
            fetchData()
          }}
          tintColor={COLORS.accent}
        />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          🦠 Epidemic Prediction System
        </Text>
        <Text style={styles.headerSub}>
          SPIRIT 2026 | IIT-BHU | CodeCure
        </Text>
      </View>

      {/* Metric Cards */}
      <View style={styles.metricsRow}>
        <MetricCard
          label="Total Cases"
          value={stats
            ? `${(stats.total_cases/1e6).toFixed(1)}M`
            : '—'}
          color={COLORS.accent}
        />
        <MetricCard
          label="Total Deaths"
          value={stats
            ? `${(stats.total_deaths/1e6).toFixed(2)}M`
            : '—'}
          color={COLORS.danger}
        />
      </View>
      <View style={styles.metricsRow}>
        <MetricCard
          label="High Risk"
          value={String(stats?.high_risk ?? '—')}
          color={COLORS.danger}
        />
        <MetricCard
          label="Avg Rt"
          value={String(stats?.avg_rt ?? '—')}
          color={stats?.avg_rt && stats.avg_rt > 1
            ? COLORS.warning : COLORS.success}
        />
      </View>

      {/* Risk Alert Banner */}
      {stats && stats.high_risk > 0 && (
        <View style={[styles.alertBanner,
          { borderColor: COLORS.danger }]}>
          <Text style={styles.alertText}>
            🚨 {stats.high_risk} countries at HIGH RISK
          </Text>
          <Text style={styles.alertSub}>
            Tap Alerts tab for details
          </Text>
        </View>
      )}

      {/* Top 10 Countries */}
      <Text style={styles.sectionTitle}>
        Top Risk Countries
      </Text>
      {top10.map((country, idx) => (
        <TouchableOpacity
          key={idx}
          style={styles.countryCard}
          onPress={() => router.push(
            `/country/${encodeURIComponent(
              country["Country/Region"]
            )}`
          )}
        >
          <View style={styles.countryLeft}>
            <Text style={styles.countryRank}>
              #{idx + 1}
            </Text>
            <View>
              <Text style={styles.countryName}>
                {country["Country/Region"]}
              </Text>
              <Text style={styles.countrySub}>
                New cases: {
                  country.new_cases?.toLocaleString()
                }
              </Text>
            </View>
          </View>
          <View style={styles.countryRight}>
            <Text style={[styles.riskScore, {
              color: RISK_COLORS[
                country.risk_level as keyof typeof RISK_COLORS
              ] ?? COLORS.text
            }]}>
              {country.risk_score?.toFixed(1)}
            </Text>
            <View style={[styles.riskBadge, {
              backgroundColor: (RISK_COLORS[
                country.risk_level as keyof typeof RISK_COLORS
              ] ?? COLORS.muted) + '30'
            }]}>
              <Text style={[styles.riskBadgeText, {
                color: RISK_COLORS[
                  country.risk_level as keyof typeof RISK_COLORS
                ] ?? COLORS.muted
              }]}>
                {country.risk_level}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      ))}

      <View style={{ height: 32 }}/>
    </ScrollView>
  )
}

function MetricCard({ label, value, color }: {
  label: string, value: string, color: string
}) {
  return (
    <View style={styles.metricCard}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={[styles.metricValue, { color }]}>
        {value}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: COLORS.bg },
  center:       { flex: 1, backgroundColor: COLORS.bg,
                  alignItems: 'center',
                  justifyContent: 'center' },
  loadingText:  { color: COLORS.muted, marginTop: 12,
                  fontSize: 14 },
  header:       { padding: 20, paddingTop: 16,
                  backgroundColor: COLORS.card,
                  borderBottomWidth: 1,
                  borderBottomColor: COLORS.border,
                  marginBottom: 16 },
  headerTitle:  { color: COLORS.accent, fontSize: 20,
                  fontWeight: 'bold' },
  headerSub:    { color: COLORS.muted, fontSize: 12,
                  marginTop: 4 },
  metricsRow:   { flexDirection: 'row', paddingHorizontal: 16,
                  gap: 12, marginBottom: 12 },
  metricCard:   { flex: 1, backgroundColor: COLORS.card,
                  borderRadius: 12, padding: 16,
                  borderWidth: 1,
                  borderColor: COLORS.border },
  metricLabel:  { color: COLORS.muted, fontSize: 12,
                  marginBottom: 6 },
  metricValue:  { fontSize: 22, fontWeight: 'bold' },
  alertBanner:  { marginHorizontal: 16, marginBottom: 16,
                  backgroundColor: COLORS.danger + '15',
                  borderRadius: 10, padding: 14,
                  borderWidth: 1 },
  alertText:    { color: COLORS.danger, fontSize: 15,
                  fontWeight: 'bold' },
  alertSub:     { color: COLORS.muted, fontSize: 12,
                  marginTop: 4 },
  sectionTitle: { color: COLORS.text, fontSize: 18,
                  fontWeight: 'bold', paddingHorizontal: 16,
                  marginBottom: 12 },
  countryCard:  { marginHorizontal: 16, marginBottom: 10,
                  backgroundColor: COLORS.card,
                  borderRadius: 12, padding: 14,
                  borderWidth: 1, borderColor: COLORS.border,
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center' },
  countryLeft:  { flexDirection: 'row',
                  alignItems: 'center', gap: 12 },
  countryRank:  { color: COLORS.muted, fontSize: 16,
                  fontWeight: 'bold', width: 28 },
  countryName:  { color: COLORS.text, fontSize: 15,
                  fontWeight: '600' },
  countrySub:   { color: COLORS.muted, fontSize: 12,
                  marginTop: 2 },
  countryRight: { alignItems: 'flex-end' },
  riskScore:    { fontSize: 20, fontWeight: 'bold' },
  riskBadge:    { paddingHorizontal: 8, paddingVertical: 3,
                  borderRadius: 6, marginTop: 4 },
  riskBadgeText:{ fontSize: 11, fontWeight: '600' },
})