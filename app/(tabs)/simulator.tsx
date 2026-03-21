import { useState } from 'react'
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity
} from 'react-native'
import axios from 'axios'
import { API_BASE, COLORS } from '../../constants/api'

export default function SimulatorScreen() {
  const [rValue,  setRValue]  = useState(1.2)
  const [vaxRate, setVaxRate] = useState(30)
  const [days,    setDays]    = useState(90)
  const [result,  setResult]  = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const simulate = async () => {
    setLoading(true)
    try {
      const res = await axios.post(
        `${API_BASE}/simulate/sir`,
        { r_value: rValue, vax_rate: vaxRate,
          days, population: 1400000000 }
      )
      setResult(res.data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const statusColor = () => {
    if (rValue < 1)   return COLORS.success
    if (rValue < 1.5) return COLORS.warning
    return COLORS.danger
  }

  const statusMsg = () => {
    if (rValue < 1)   return '✅ Epidemic dying out'
    if (rValue < 1.5) return '⚠️ Slow spread'
    return '🚨 Rapid spread!'
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>
          🧪 What-If Simulator
        </Text>
        <Text style={styles.subtitle}>
          SIR Model — Epidemic scenario analysis
        </Text>
      </View>

      {/* Controls */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Parameters</Text>

        <SliderRow
          label="R-value"
          value={rValue}
          min={0.5} max={3.0} step={0.1}
          onDecrease={() =>
            setRValue(v => Math.max(0.5,
              Math.round((v-0.1)*10)/10))}
          onIncrease={() =>
            setRValue(v => Math.min(3.0,
              Math.round((v+0.1)*10)/10))}
          color={statusColor()}
        />
        <SliderRow
          label="Vaccination %"
          value={vaxRate}
          min={0} max={100} step={5}
          onDecrease={() =>
            setVaxRate(v => Math.max(0, v-5))}
          onIncrease={() =>
            setVaxRate(v => Math.min(100, v+5))}
          color={COLORS.success}
          suffix="%"
        />
        <SliderRow
          label="Days"
          value={days}
          min={30} max={365} step={10}
          onDecrease={() =>
            setDays(v => Math.max(30, v-10))}
          onIncrease={() =>
            setDays(v => Math.min(365, v+10))}
          color={COLORS.accent}
        />

        {/* Status */}
        <View style={[styles.statusBanner,
          { borderColor: statusColor(),
            backgroundColor: statusColor()+'20' }]}>
          <Text style={[styles.statusText,
            { color: statusColor() }]}>
            {statusMsg()}
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.button,
            loading && styles.buttonDisabled]}
          onPress={simulate}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Simulating...' : 'Run Simulation'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Results */}
      {result && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Results</Text>
          <View style={styles.resultsGrid}>
            <ResultItem
              label="Peak Day"
              value={`Day ${result.peak_day}`}
              color={COLORS.warning}
            />
            <ResultItem
              label="Peak Infected"
              value={result.peak_infected
                ?.toLocaleString()}
              color={COLORS.danger}
            />
            <ResultItem
              label="Total Infected"
              value={`${result.total_infected_pct}%`}
              color={COLORS.accent}
            />
            <ResultItem
              label="Herd Immunity"
              value={`${result.herd_immunity_threshold}%`}
              color={COLORS.success}
            />
          </View>

          <View style={[styles.statusBanner,
            { borderColor: (
                result.status === 'controlled'
                  ? COLORS.success
                  : result.status === 'spreading'
                  ? COLORS.warning
                  : COLORS.danger
              ),
              backgroundColor: (
                result.status === 'controlled'
                  ? COLORS.success
                  : result.status === 'spreading'
                  ? COLORS.warning
                  : COLORS.danger
              ) + '20',
              marginTop: 12
            }]}>
            <Text style={[styles.statusText,
              { color: (
                  result.status === 'controlled'
                    ? COLORS.success
                    : result.status === 'spreading'
                    ? COLORS.warning
                    : COLORS.danger
                )}]}>
              Status: {result.status?.toUpperCase()}
            </Text>
          </View>
        </View>
      )}
      <View style={{ height: 32 }}/>
    </ScrollView>
  )
}

function SliderRow({ label, value, onDecrease,
  onIncrease, color, suffix = '' }: any) {
  return (
    <View style={slStyles.row}>
      <Text style={slStyles.label}>{label}</Text>
      <View style={slStyles.controls}>
        <TouchableOpacity
          style={slStyles.btn} onPress={onDecrease}>
          <Text style={slStyles.btnText}>−</Text>
        </TouchableOpacity>
        <Text style={[slStyles.value, { color }]}>
          {value}{suffix}
        </Text>
        <TouchableOpacity
          style={slStyles.btn} onPress={onIncrease}>
          <Text style={slStyles.btnText}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

function ResultItem({ label, value, color }: any) {
  return (
    <View style={resStyles.item}>
      <Text style={resStyles.label}>{label}</Text>
      <Text style={[resStyles.value, { color }]}>
        {value}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container:      { flex:1, backgroundColor: COLORS.bg },
  header:         { padding:20,
                    backgroundColor: COLORS.card,
                    borderBottomWidth:1,
                    borderBottomColor: COLORS.border,
                    marginBottom:16 },
  title:          { color: COLORS.accent, fontSize:22,
                    fontWeight:'bold' },
  subtitle:       { color: COLORS.muted, fontSize:13,
                    marginTop:4 },
  card:           { marginHorizontal:16, marginBottom:16,
                    backgroundColor: COLORS.card,
                    borderRadius:12, padding:16,
                    borderWidth:1,
                    borderColor: COLORS.border },
  cardTitle:      { color: COLORS.text, fontSize:16,
                    fontWeight:'bold', marginBottom:16 },
  statusBanner:   { borderRadius:8, padding:12,
                    borderWidth:1, marginBottom:12 },
  statusText:     { fontSize:14, fontWeight:'600',
                    textAlign:'center' },
  button:         { backgroundColor: COLORS.accent,
                    borderRadius:10, padding:14,
                    alignItems:'center' },
  buttonDisabled: { opacity:0.5 },
  buttonText:     { color:'#fff', fontSize:15,
                    fontWeight:'bold' },
  resultsGrid:    { flexDirection:'row', flexWrap:'wrap',
                    gap:12 },
})

const slStyles = StyleSheet.create({
  row:      { flexDirection:'row',
              justifyContent:'space-between',
              alignItems:'center', marginBottom:16 },
  label:    { color: COLORS.text, fontSize:14,
              flex:1 },
  controls: { flexDirection:'row', alignItems:'center',
              gap:16 },
  btn:      { backgroundColor: COLORS.border,
              width:32, height:32, borderRadius:8,
              alignItems:'center',
              justifyContent:'center' },
  btnText:  { color: COLORS.text, fontSize:20,
              fontWeight:'bold' },
  value:    { fontSize:18, fontWeight:'bold',
              minWidth:60, textAlign:'center' },
})

const resStyles = StyleSheet.create({
  item:  { width:'47%', backgroundColor: COLORS.bg,
           borderRadius:10, padding:12, borderWidth:1,
           borderColor: COLORS.border },
  label: { color: COLORS.muted, fontSize:11,
           marginBottom:4 },
  value: { fontSize:18, fontWeight:'bold' },
})