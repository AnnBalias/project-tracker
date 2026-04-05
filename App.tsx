import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { AppDataProvider } from './src/store/AppDataContext';
import { ThemeProvider, useAppTheme } from './src/store/ThemeContext';
import { FocusProvider } from './src/store/FocusContext';
import { RootNavigator } from './src/navigation/RootNavigator';
import { RewardOverlay } from './src/components/RewardOverlay';
import { ThemedAlertHost } from './src/components/themedAlert';
import {
  requestReminderPermissions,
  scheduleEveningCheckInReminder,
} from './src/services/reminders';

function ThemedRoot() {
  const t = useAppTheme();
  useEffect(() => {
    void (async () => {
      const ok = await requestReminderPermissions();
      if (ok) await scheduleEveningCheckInReminder();
    })();
  }, []);
  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: t.colors.background }}
      edges={['top']}
    >
      <RootNavigator />
      <RewardOverlay />
      <ThemedAlertHost />
      <StatusBar style={t.dark ? 'light' : 'dark'} />
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <ThemeProvider>
          <AppDataProvider>
            <FocusProvider>
              <ThemedRoot />
            </FocusProvider>
          </AppDataProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
