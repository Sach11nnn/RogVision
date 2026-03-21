import { useEffect, useState } from 'react'
import {
  View, Text, ScrollView, StyleSheet,
  ActivityIndicator, RefreshControl
} from 'react-native'
import axios from 'axios'
import { API_BASE, COLORS } from '../../constants/api'

interface Alert {
  country:    string
  risk_score: number
  risk_level: string
  new_cases:  number
  Rt:         number
  alert_type: string
  message:    string
}

export default function AlertsScreen() {
  const [alerts,    setAlerts]    = useState<Alert[]>([])
  const [loading,   setLoading]   = useState(true)
  const [refreshing,setRefreshing]= useState(false)

  const fetchAlerts = async () => {
    try {
      const res = await axios.get(`${API_BASE}/alerts?limit=20`)
      setAlerts(res.data.alerts)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => { fetchAlerts() }, [])

  const alertColor = (type: string) => {
    if (type === 'OUTBREAK') return COLORS.danger
    if (type === 'WARNING')  return COLORS.warning
    return COLORS.accent
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large"
                           color={COLORS.accent}/>
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
            fetchAlerts()
          }}
          tintColor={COLORS.accent}
        />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>🚨 Active Alerts</Text>
        <Text style={styles.subtitle}>
          {alerts.length} countries need attention
        </Text>
      </View>

      {alerts.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.noAlerts}>
            ✅ No active alerts
          </Text>
        </View>
      ) : (
        alerts.map((alert, idx) => (
          <View key={idx} style={[styles.alertCard, {
            borderLeftColor: alertColor(alert.alert_type),
            borderLeftWidth: 4,
          }]}>
            <View style={styles.alertHeader}>
              <Text style={styles.country}>
                {alert.country}
              </Text>
              <View style={[styles.badge, {
                backgroundColor:
                  alertColor(alert.alert_type) + '25'
              }]}>
                <Text style={[styles.badgeText, {
                  color: alertColor(alert.alert_type)
                }]}>
                  {alert.alert_type}
                </Text>
              </View>
            </View>
            <Text style={styles.message}>
              {alert.message}
            </Text>
            <View style={styles.statsRow}>
              <StatChip
                label="Risk Score"
                value={alert.risk_score?.toFixed(1)}
                color={COLORS.danger}
              />
              <StatChip
                label="Rt"
                value={alert.Rt?.toFixed(2)}
                color={alert.Rt > 1
                  ? COLORS.warning : COLORS.success}
              />
              <StatChip
                label="New Cases"
                value={alert.new_cases?.toLocaleString()}
                color={COLORS.accent}
              />
            </View>
          </View>
        ))
      )}
      <View style={{ height: 32 }}/>
    </ScrollView>
  )
}

function StatChip({ label, value, color }: {
  label: string, value: any, color: string
}) {
  return (
    <View style={styles.chip}>
      <Text style={styles.chipLabel}>{label}</Text>
      <Text style={[styles.chipValue, { color }]}>
        {value}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container:  { flex: 1, backgroundColor: COLORS.bg },
  center:     { flex: 1, backgroundColor: COLORS.bg,
                alignItems: 'center',
                justifyContent: 'center', padding: 40 },
  header:     { padding: 20,
                backgroundColor: COLORS.card,
                borderBottomWidth: 1,
                borderBottomColor: COLORS.border,
                marginBottom: 16 },
  title:      { color: COLORS.danger, fontSize: 22,
                fontWeight: 'bold' },
  subtitle:   { color: COLORS.muted, fontSize: 13,
                marginTop: 4 },
  noAlerts:   { color: COLORS.success, fontSize: 18,
                textAlign: 'center' },
  alertCard:  { marginHorizontal: 16, marginBottom: 12,
                backgroundColor: COLORS.card,
                borderRadius: 12, padding: 16,
                borderWidth: 1,
                borderColor: COLORS.border },
  alertHeader:{ flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 8 },
  country:    { color: COLORS.text, fontSize: 17,
                fontWeight: 'bold' },
  badge:      { paddingHorizontal: 10, paddingVertical: 4,
                borderRadius: 6 },
  badgeText:  { fontSize: 11, fontWeight: 'bold' },
  message:    { color: COLORS.muted, fontSize: 13,
                marginBottom: 12, lineHeight: 18 },
  statsRow:   { flexDirection: 'row', gap: 8 },
  chip:       { flex: 1, backgroundColor: COLORS.bg,
                borderRadius: 8, padding: 8,
                borderWidth: 1,
                borderColor: COLORS.border,
                alignItems: 'center' },
  chipLabel:  { color: COLORS.muted, fontSize: 10,
                marginBottom: 2 },
  chipValue:  { fontSize: 14, fontWeight: 'bold' },
})