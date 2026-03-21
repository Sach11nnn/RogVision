import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { View } from 'react-native'
import { COLORS } from '../constants/api'

export default function RootLayout() {
  return (
    <View style={{ flex:1, backgroundColor: COLORS.bg }}>
      <StatusBar style="light" />
      <Stack screenOptions={{
        headerStyle:      { backgroundColor: COLORS.card },
        headerTintColor:  COLORS.text,
        headerTitleStyle: { color: COLORS.accent,
                            fontWeight: 'bold' },
        contentStyle:     { backgroundColor: COLORS.bg },
      }}>
        <Stack.Screen name="(tabs)"
          options={{ headerShown: false }}/>
        <Stack.Screen name="country/[name]"
          options={{ title: 'Country Details' }}/>
      </Stack>
    </View>
  )
}