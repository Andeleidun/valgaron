import type { ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';
import {
  valgaronColors,
  valgaronRadius,
  valgaronSpacing,
  valgaronTypography,
} from '@valgaron/ui-tokens';

export function ScreenHeader({
  title,
  detail,
}: {
  title: string;
  detail?: string;
}) {
  return (
    <View style={styles.header}>
      <Text accessibilityRole="header" style={styles.title}>
        {title}
      </Text>
      {detail ? <Text style={styles.detail}>{detail}</Text> : null}
    </View>
  );
}

export function SectionBlock({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <View style={styles.section}>
      <Text accessibilityRole="header" style={styles.sectionTitle}>
        {title}
      </Text>
      {children}
    </View>
  );
}

export function Field({
  autoCapitalize,
  autoCorrect,
  label,
  value,
  onChangeText,
  multiline,
  placeholder,
}: {
  autoCapitalize?: TextInputProps['autoCapitalize'];
  autoCorrect?: boolean;
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  multiline?: boolean;
  placeholder?: string;
}) {
  const inputProps: TextInputProps = multiline
    ? { multiline: true, textAlignVertical: 'top' }
    : {};
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        {...inputProps}
        accessibilityLabel={label}
        autoCapitalize={autoCapitalize}
        autoCorrect={autoCorrect}
        placeholder={placeholder}
        placeholderTextColor={valgaronColors.muted}
        style={[styles.input, multiline ? styles.multilineInput : null]}
        value={value}
        onChangeText={onChangeText}
      />
    </View>
  );
}

export function ActionButton({
  accessibilityHint,
  accessibilityLabel,
  label,
  onPress,
  selected = false,
  tone = 'neutral',
  disabled = false,
}: {
  accessibilityHint?: string;
  accessibilityLabel?: string;
  label: string;
  onPress: () => void;
  selected?: boolean;
  tone?: 'neutral' | 'accent' | 'danger';
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityHint={accessibilityHint}
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityRole="button"
      accessibilityState={{ disabled, selected }}
      disabled={disabled}
      hitSlop={4}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        tone === 'accent' ? styles.accentButton : null,
        tone === 'danger' ? styles.dangerButton : null,
        disabled ? styles.disabledButton : null,
        pressed && !disabled ? styles.pressed : null,
      ]}
    >
      <Text
        style={[
          styles.buttonText,
          tone === 'accent' ? styles.accentButtonText : null,
          tone === 'danger' ? styles.dangerButtonText : null,
          disabled ? styles.disabledButtonText : null,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function ButtonRow({ children }: { children: ReactNode }) {
  return <View style={styles.buttonRow}>{children}</View>;
}

export function MutedText({ children }: { children: ReactNode }) {
  return <Text style={styles.muted}>{children}</Text>;
}

export type StatusTextTone = 'info' | 'success' | 'warning' | 'danger';

export function StatusText({
  children,
  tone = 'info',
}: {
  children: ReactNode;
  tone?: StatusTextTone;
}) {
  const isAssertive = tone === 'danger' || tone === 'warning';
  return (
    <Text
      accessibilityLiveRegion={isAssertive ? 'assertive' : 'polite'}
      accessibilityRole={isAssertive ? 'alert' : 'text'}
      style={[
        styles.status,
        tone === 'success' ? styles.statusSuccess : null,
        tone === 'warning' ? styles.statusWarning : null,
        tone === 'danger' ? styles.statusDanger : null,
      ]}
    >
      {children}
    </Text>
  );
}

export function BodyText({ children }: { children: ReactNode }) {
  return <Text style={styles.body}>{children}</Text>;
}

export function ScreenScroll({ children }: { children: ReactNode }) {
  return (
    <KeyboardAvoidingView
      style={screenStyles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={screenStyles.screen}
        contentContainerStyle={screenStyles.content}
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

export const screenStyles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: valgaronColors.page,
  },
  content: {
    padding: valgaronSpacing.lg,
    gap: valgaronSpacing.lg,
  },
});

const styles = StyleSheet.create({
  header: {
    gap: valgaronSpacing.sm,
  },
  title: {
    color: valgaronColors.heading,
    fontFamily: valgaronTypography.fontFamily,
    fontSize: 24,
    fontWeight: '700',
  },
  detail: {
    color: valgaronColors.muted,
    fontSize: valgaronTypography.sizes.sm,
    lineHeight: 20,
  },
  section: {
    borderColor: valgaronColors.border,
    borderTopWidth: 1,
    paddingTop: valgaronSpacing.md,
    gap: valgaronSpacing.md,
  },
  sectionTitle: {
    color: valgaronColors.heading,
    fontSize: valgaronTypography.sizes.lg,
    fontWeight: '700',
  },
  fieldGroup: {
    gap: valgaronSpacing.xs,
  },
  label: {
    color: valgaronColors.muted,
    fontSize: valgaronTypography.sizes.sm,
    fontWeight: '700',
  },
  input: {
    minHeight: 44,
    borderColor: valgaronColors.border,
    borderRadius: valgaronRadius.md,
    borderWidth: 1,
    backgroundColor: valgaronColors.field,
    color: valgaronColors.text,
    fontSize: valgaronTypography.sizes.md,
    paddingHorizontal: valgaronSpacing.md,
    paddingVertical: valgaronSpacing.sm,
  },
  multilineInput: {
    minHeight: 96,
  },
  buttonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: valgaronSpacing.sm,
  },
  button: {
    minHeight: 44,
    borderColor: valgaronColors.border,
    borderRadius: valgaronRadius.md,
    borderWidth: 1,
    justifyContent: 'center',
    paddingHorizontal: valgaronSpacing.md,
    paddingVertical: valgaronSpacing.sm,
  },
  accentButton: {
    backgroundColor: valgaronColors.accent,
    borderColor: valgaronColors.accent,
  },
  dangerButton: {
    borderColor: valgaronColors.danger,
  },
  disabledButton: {
    opacity: 0.46,
  },
  pressed: {
    opacity: 0.72,
  },
  buttonText: {
    color: valgaronColors.text,
    fontSize: valgaronTypography.sizes.sm,
    fontWeight: '700',
    textAlign: 'center',
  },
  accentButtonText: {
    color: valgaronColors.primaryContrast,
  },
  dangerButtonText: {
    color: valgaronColors.danger,
  },
  disabledButtonText: {
    color: valgaronColors.muted,
  },
  muted: {
    color: valgaronColors.muted,
    fontSize: valgaronTypography.sizes.sm,
    lineHeight: 20,
  },
  status: {
    color: valgaronColors.text,
    fontSize: valgaronTypography.sizes.sm,
    fontWeight: '700',
    lineHeight: 20,
  },
  statusSuccess: {
    color: valgaronColors.focus,
  },
  statusWarning: {
    color: valgaronColors.accent,
  },
  statusDanger: {
    color: valgaronColors.danger,
  },
  body: {
    color: valgaronColors.text,
    fontSize: valgaronTypography.sizes.md,
    lineHeight: 22,
  },
});
