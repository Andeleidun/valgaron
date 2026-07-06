import { Component, type ReactNode } from 'react';
import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { getRuntimeRecoveryCopy } from '@valgaron/core';
import {
  valgaronColors,
  valgaronRadius,
  valgaronSpacing,
  valgaronTypography,
} from '@valgaron/ui-tokens';
import { getMobileRouteHref } from '../navigation/mobileRoutes';
import { ActionButton, ButtonRow } from './screenPrimitives';

type MobileRuntimeErrorBoundaryProps = {
  children: ReactNode;
};

type MobileRuntimeErrorBoundaryState = {
  hasError: boolean;
};

export class MobileRuntimeErrorBoundary extends Component<
  MobileRuntimeErrorBoundaryProps,
  MobileRuntimeErrorBoundaryState
> {
  state: MobileRuntimeErrorBoundaryState = {
    hasError: false,
  };

  static getDerivedStateFromError(): MobileRuntimeErrorBoundaryState {
    return { hasError: true };
  }

  retryView = () => {
    this.setState({ hasError: false });
  };

  openData = () => {
    this.setState({ hasError: false }, () => {
      router.replace(getMobileRouteHref('/data'));
    });
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    const copy = getRuntimeRecoveryCopy();
    return (
      <View style={styles.screen}>
        <View style={styles.panel} accessibilityRole="alert">
          <Text accessibilityRole="header" style={styles.title}>
            {copy.title}
          </Text>
          <Text style={styles.detail}>{copy.detail}</Text>
          <Text style={styles.detail}>{copy.backupHint}</Text>
          <ButtonRow>
            <ActionButton
              label={copy.retryLabel}
              tone="accent"
              onPress={this.retryView}
            />
            <ActionButton label={copy.dataLabel} onPress={this.openData} />
          </ButtonRow>
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: valgaronColors.page,
    padding: valgaronSpacing.lg,
  },
  panel: {
    borderColor: valgaronColors.border,
    borderRadius: valgaronRadius.md,
    borderWidth: 1,
    gap: valgaronSpacing.md,
    padding: valgaronSpacing.lg,
  },
  title: {
    color: valgaronColors.heading,
    fontSize: valgaronTypography.sizes.xl,
    fontWeight: '700',
  },
  detail: {
    color: valgaronColors.text,
    fontSize: valgaronTypography.sizes.md,
    lineHeight: 22,
  },
});
