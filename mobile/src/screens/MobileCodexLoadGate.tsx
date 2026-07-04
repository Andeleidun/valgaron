import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { valgaronProduct } from '@valgaron/core';
import {
  valgaronColors,
  valgaronSpacing,
  valgaronTypography,
} from '@valgaron/ui-tokens';
import { useMobileCodex } from '../state/MobileCodexContext';

export function MobileCodexLoadGate({ children }: { children: ReactNode }) {
  const controller = useMobileCodex();

  if (!controller.isLoading) {
    return <>{children}</>;
  }

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.loadingContent}>
        <Text style={styles.title}>{valgaronProduct.name}</Text>
        <Text style={styles.detail}>{controller.saveMessage}</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: valgaronColors.page,
  },
  loadingContent: {
    flex: 1,
    alignItems: 'flex-start',
    justifyContent: 'center',
    gap: valgaronSpacing.sm,
    padding: valgaronSpacing.xl,
  },
  title: {
    color: valgaronColors.heading,
    fontSize: valgaronTypography.sizes.xl,
    fontWeight: '700',
  },
  detail: {
    color: valgaronColors.muted,
    fontSize: valgaronTypography.sizes.md,
    lineHeight: 22,
  },
});
