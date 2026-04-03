import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppDataProvider } from './src/store/AppDataContext';
import { RootNavigator } from './src/navigation/RootNavigator';
import { theme } from './src/theme/theme';

export default function App() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <AppDataProvider>
          <RootNavigator />
          <StatusBar style="dark" />
        </AppDataProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.background },
});
