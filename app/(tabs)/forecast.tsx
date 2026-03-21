import { useEffect, useState } from 'react'
import {
  View, Text, ScrollView, StyleSheet,
  ActivityIndicator
} from 'react-native'
import axios from 'axios'
import { API_BASE, COLORS } from '../../constants/api'

interface ForecastDay {
  date:      string
  predicted: number
  lower:     number
  upper:     number
}

export default function ForecastScreen() {
  const [data,    setData]    = useState<ForecastDay[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    axios.get(`${API_BASE}/forecast?days=14`)
      .then(r => setData(r.data.forecast))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large"
                           color={COLORS.accent}/>
      </View>
    )
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>📈 Forecast — India</Text>
        <Text style={styles.subtitle}>
          Ridge Regression — 60 day prediction
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>
          Next 14 Days Predicted Cases
        </Text>
        <View style={styles.tableHeader}>
          <Text style={[styles.col, styles.headerText]}>
            Date
          </Text>
          <Text style={[styles.col, styles.headerText,
                        styles.right]}>
            Predicted
          </Text>
          <Text style={[styles.col, styles.headerText,
                        styles.right]}>
            Range
          </Text>
        </View>
        {data.map((row, idx) => (
          <View key={idx}
            style={[styles.tableRow,
              idx % 2 === 0
                ? { backgroundColor: COLORS.bg + '80' }
                : {}
            ]}>
            <Text style={[styles.col, styles.cellText]}>
              {row.date}
            </Text>
            <Text style={[styles.col, styles.cellValue,
                          styles.right]}>
              {Math.round(row.predicted).toLocaleString()}
            </Text>
            <Text style={[styles.col, styles.cellMuted,
                          styles.right]}>
              {Math.round(row.lower).toLocaleString()}
              {' - '}
              {Math.round(row.upper).toLocaleString()}
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>About This Model</Text>
        <Text style={styles.infoText}>
          Ridge Regression with time-series lag features.
          Trained on Johns Hopkins COVID-19 data (2020-2023).
          Confidence interval: ±15% of predicted value.
        </Text>
      </View>
      <View style={{ height: 32 }}/>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container:   { flex:1, backgroundColor: COLORS.bg },
  center:      { flex:1, backgroundColor: COLORS.bg,
                 alignItems:'center',
                 justifyContent:'center' },
  header:      { padding:20, backgroundColor: COLORS.card,
                 borderBottomWidth:1,
                 borderBottomColor: COLORS.border,
                 marginBottom:16 },
  title:       { color: COLORS.accent, fontSize:22,
                 fontWeight:'bold' },
  subtitle:    { color: COLORS.muted, fontSize:13,
                 marginTop:4 },
  card:        { marginHorizontal:16, marginBottom:16,
                 backgroundColor: COLORS.card,
                 borderRadius:12, padding:16,
                 borderWidth:1,
                 borderColor: COLORS.border },
  cardTitle:   { color: COLORS.text, fontSize:16,
                 fontWeight:'bold', marginBottom:12 },
  tableHeader: { flexDirection:'row', paddingBottom:8,
                 borderBottomWidth:1,
                 borderBottomColor: COLORS.border,
                 marginBottom:4 },
  headerText:  { color: COLORS.muted, fontSize:12,
                 fontWeight:'600' },
  tableRow:    { flexDirection:'row', paddingVertical:10,
                 borderBottomWidth:1,
                 borderBottomColor: COLORS.border + '50' },
  col:         { flex:1 },
  right:       { textAlign:'right' },
  cellText:    { color: COLORS.text, fontSize:13 },
  cellValue:   { color: COLORS.accent, fontSize:13,
                 fontWeight:'600' },
  cellMuted:   { color: COLORS.muted, fontSize:12 },
  infoCard:    { marginHorizontal:16,
                 backgroundColor: COLORS.card,
                 borderRadius:12, padding:16,
                 borderWidth:1,
                 borderColor: COLORS.border },
  infoTitle:   { color: COLORS.text, fontSize:15,
                 fontWeight:'bold', marginBottom:8 },
  infoText:    { color: COLORS.muted, fontSize:13,
                 lineHeight:20 },
})