import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { valgaronColors } from '@valgaron/ui-tokens';
import { MobileCodexLoadGate } from '../src/screens/MobileCodexLoadGate';
import { MobileRuntimeErrorBoundary } from '../src/screens/MobileRuntimeErrorBoundary';
import { MobileCodexProvider } from '../src/state/MobileCodexContext';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <MobileCodexProvider>
        <MobileCodexLoadGate>
          <SafeAreaView style={styles.safeArea}>
            <StatusBar style="light" />
            <MobileRuntimeErrorBoundary>
              <Stack screenOptions={{ headerShown: false }} />
            </MobileRuntimeErrorBoundary>
          </SafeAreaView>
        </MobileCodexLoadGate>
      </MobileCodexProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: valgaronColors.page,
  },
});
