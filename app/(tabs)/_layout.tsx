import { Tabs } from 'expo-router'
import { Text } from 'react-native'
import { COLORS } from '../../constants/api'

export default function TabLayout() {
  return (
    <Tabs screenOptions={{
      tabBarStyle: {
        backgroundColor: COLORS.card,
        borderTopColor:  COLORS.border,
        height:          60,
        paddingBottom:   8,
      },
      tabBarActiveTintColor:   COLORS.accent,
      tabBarInactiveTintColor: COLORS.muted,
      headerStyle:     { backgroundColor: COLORS.card },
      headerTintColor: COLORS.accent,
    }}>
      <Tabs.Screen name="index"
        options={{
          title:       'Overview',
          tabBarIcon:  () => <Text style={{fontSize:20}}>🌍</Text>
        }}/>
      <Tabs.Screen name="alerts"
        options={{
          title:       'Alerts',
          tabBarIcon:  () => <Text style={{fontSize:20}}>🚨</Text>
        }}/>
      <Tabs.Screen name="forecast"
        options={{
          title:       'Forecast',
          tabBarIcon:  () => <Text style={{fontSize:20}}>📈</Text>
        }}/>
      <Tabs.Screen name="simulator"
        options={{
          title:       'Simulator',
          tabBarIcon:  () => <Text style={{fontSize:20}}>🧪</Text>
        }}/>
    </Tabs>
  )
}