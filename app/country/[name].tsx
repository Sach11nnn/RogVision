import { useEffect, useState } from 'react'
import {
  View, Text, ScrollView, StyleSheet,
  ActivityIndicator
} from 'react-native'
import { useLocalSearchParams } from 'expo-router'
import axios from 'axios'
import { API_BASE, COLORS, RISK_COLORS } from '../../constants/api'

export default function CountryDetail() {
  const { name }    = useLocalSearchParams<{name:string}>()
  const [data,      setData]    = useState<any>(null)
  const [loading,   setLoading] = useState(true)

  useEffect(() => {
    if (!name) return
    axios.get(`${API_BASE}/country/${name}`)
      .then(r => setData(r.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [name])

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large"
                           color={COLORS.accent}/>
      </View>
    )
  }

  const info      = data?.info
  const riskColor = RISK_COLORS[info?.risk_level]
                    ?? COLORS.muted
  const ts        = data?.time_series ?? []
  const peak      = ts.reduce((max: any, d: any) =>
    d.new_cases > (max?.new_cases ?? 0) ? d : max, null)

  return (
    <ScrollView style={styles.container}>
      {/* Country Header */}
      <View style={[styles.header,
        { borderBottomColor: riskColor }]}>
        <Text style={styles.countryName}>{name}</Text>
        <View style={[styles.riskBadge,
          { backgroundColor: riskColor + '25',
            borderColor: riskColor }]}>
          <Text style={[styles.riskText,
            { color: riskColor }]}>
            {info?.risk_level} Risk
          </Text>
        </View>
      </View>

      {/* Key Stats */}
      <View style={styles.statsGrid}>
        <StatCard label="Total Cases"
          value={info?.confirmed
            ? (info.confirmed/1e6).toFixed(1)+'M'
            : '—'}
          color={COLORS.accent}/>
        <StatCard label="Total Deaths"
          value={info?.deaths
            ? (info.deaths/1e3).toFixed(0)+'K'
            : '—'}
          color={COLORS.danger}/>
        <StatCard label="Risk Score"
          value={info?.risk_score?.toFixed(1) ?? '—'}
          color={riskColor}/>
        <StatCard label="Rt Value"
          value={info?.Rt?.toFixed(2) ?? '—'}
          color={info?.Rt > 1
            ? COLORS.danger : COLORS.success}/>
        <StatCard label="New Cases/Day"
          value={info?.new_cases?.toLocaleString() ?? '—'}
          color={COLORS.warning}/>
        <StatCard label="Death Rate"
          value={info?.death_rate?.toFixed(2)+'%' ?? '—'}
          color={COLORS.muted}/>
      </View>

      {/* Peak Info */}
      {peak && (
        <View style={styles.peakCard}>
          <Text style={styles.peakTitle}>Peak Day</Text>
          <Text style={styles.peakDate}>{peak.date}</Text>
          <Text style={styles.peakCases}>
            {peak.new_cases?.toLocaleString()} cases
          </Text>
        </View>
      )}

      {/* Recent Trend */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>
          Recent 30 Days
        </Text>
        {ts.slice(-30).reverse().map((d: any, i: number) => (
          <View key={i} style={styles.trendRow}>
            <Text style={styles.trendDate}>{d.date}</Text>
            <View style={styles.trendBar}>
              <View style={[styles.trendFill, {
                width: `${Math.min(
                  (d.new_cases /
                   (peak?.new_cases || 1)) * 100, 100
                )}%`,
                backgroundColor: riskColor + '80'
              }]}/>
            </View>
            <Text style={styles.trendValue}>
              {d.new_cases?.toLocaleString()}
            </Text>
          </View>
        ))}
      </View>
      <View style={{ height: 32 }}/>
    </ScrollView>
  )
}

function StatCard({ label, value, color }: any) {
  return (
    <View style={scStyles.card}>
      <Text style={scStyles.label}>{label}</Text>
      <Text style={[scStyles.value, { color }]}>
        {value}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container:   { flex:1, backgroundColor: COLORS.bg },
  center:      { flex:1, backgroundColor: COLORS.bg,
                 alignItems:'center',
                 justifyContent:'center' },
  header:      { padding:20, backgroundColor: COLORS.card,
                 borderBottomWidth:2, marginBottom:16 },
  countryName: { color: COLORS.text, fontSize:26,
                 fontWeight:'bold', marginBottom:8 },
  riskBadge:   { alignSelf:'flex-start',
                 paddingHorizontal:12, paddingVertical:6,
                 borderRadius:8, borderWidth:1 },
  riskText:    { fontSize:14, fontWeight:'bold' },
  statsGrid:   { flexDirection:'row', flexWrap:'wrap',
                 paddingHorizontal:16, gap:10,
                 marginBottom:16 },
  peakCard:    { marginHorizontal:16, marginBottom:16,
                 backgroundColor: COLORS.warning+'15',
                 borderRadius:12, padding:16,
                 borderWidth:1,
                 borderColor: COLORS.warning },
  peakTitle:   { color: COLORS.muted, fontSize:12,
                 marginBottom:4 },
  peakDate:    { color: COLORS.warning, fontSize:18,
                 fontWeight:'bold' },
  peakCases:   { color: COLORS.text, fontSize:14,
                 marginTop:2 },
  card:        { marginHorizontal:16, marginBottom:16,
                 backgroundColor: COLORS.card,
                 borderRadius:12, padding:16,
                 borderWidth:1,
                 borderColor: COLORS.border },
  cardTitle:   { color: COLORS.text, fontSize:16,
                 fontWeight:'bold', marginBottom:12 },
  trendRow:    { flexDirection:'row', alignItems:'center',
                 marginBottom:6, gap:8 },
  trendDate:   { color: COLORS.muted, fontSize:11,
                 width:80 },
  trendBar:    { flex:1, height:8, backgroundColor:
                 COLORS.border, borderRadius:4,
                 overflow:'hidden' },
  trendFill:   { height:'100%', borderRadius:4 },
  trendValue:  { color: COLORS.text, fontSize:11,
                 width:70, textAlign:'right' },
})

const scStyles = StyleSheet.create({
  card:  { width:'47%', backgroundColor: COLORS.card,
           borderRadius:10, padding:12, borderWidth:1,
           borderColor: COLORS.border },
  label: { color: COLORS.muted, fontSize:11,
           marginBottom:4 },
  value: { fontSize:18, fontWeight:'bold' },
})