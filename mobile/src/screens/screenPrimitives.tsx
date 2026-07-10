import {
  Children,
  cloneElement,
  isValidElement,
  useState,
  type ReactElement,
  type ReactNode,
  type Ref,
} from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type ViewProps,
  type TextInputProps,
} from 'react-native';
import { selectFieldCopy, type ControlOption } from '@valgaron/core';
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
  collapsedSummary,
  collapsed,
  collapsible = false,
  onCollapsedChange,
  onLayout,
  testID,
  titleTestID,
}: {
  title: string;
  children: ReactNode;
  collapsedSummary?: string;
  collapsed?: boolean;
  collapsible?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  onLayout?: ViewProps['onLayout'];
  testID?: string;
  sectionId?: string;
  titleTestID?: string;
}) {
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const isCollapsed = collapsed ?? internalCollapsed;
  const setIsCollapsed = (next: boolean) => {
    if (onCollapsedChange) onCollapsedChange(next);
    else setInternalCollapsed(next);
  };

  return (
    <View style={styles.section} onLayout={onLayout} testID={testID}>
      <View style={styles.sectionHeader}>
        <Text
          accessibilityRole="header"
          style={styles.sectionTitle}
          testID={titleTestID}
        >
          {title}
        </Text>
        {collapsible ? (
          <Pressable
            accessibilityLabel={`${isCollapsed ? 'Show' : 'Hide'} ${title}`}
            accessibilityRole="button"
            accessibilityState={{ expanded: !isCollapsed }}
            hitSlop={8}
            onPress={() => setIsCollapsed(!isCollapsed)}
            style={({ pressed }) => [
              styles.collapseButton,
              pressed ? styles.pressed : null,
            ]}
          >
            <Text style={styles.collapseButtonText}>
              {isCollapsed ? 'Show' : 'Hide'}
            </Text>
          </Pressable>
        ) : null}
      </View>
      {isCollapsed && collapsedSummary ? (
        <Text style={styles.collapsedSummary}>{collapsedSummary}</Text>
      ) : null}
      {!isCollapsed ? children : null}
    </View>
  );
}

type MobileSectionChildProps = {
  sectionId: string;
  title: string;
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
};

export function MobileSectionDashboard({
  children,
  collapsed,
  isLoaded = true,
  onMove,
  onReset,
  onResetAll,
  onSetCollapsed,
  order,
}: {
  children: ReactNode;
  collapsed: ReadonlySet<string>;
  isLoaded?: boolean;
  onMove: (sectionId: string, offset: number) => void;
  onReset: () => void;
  onResetAll?: () => void;
  onSetCollapsed: (sectionId: string, value: boolean) => void;
  order: readonly string[];
}) {
  const [isCustomizing, setIsCustomizing] = useState(false);
  const sections = new Map<string, ReactElement<MobileSectionChildProps>>();
  Children.forEach(children, (child) => {
    if (isValidElement<MobileSectionChildProps>(child)) {
      sections.set(child.props.sectionId, child);
    }
  });
  const visibleSectionIds = order.filter((sectionId) =>
    sections.has(sectionId)
  );
  return (
    <View style={styles.mobileDashboard}>
      <ButtonRow>
        <ActionButton
          disabled={!isLoaded}
          label={
            !isLoaded
              ? 'Loading Section Layout'
              : isCustomizing
              ? 'Done Customizing'
              : 'Customize Sections'
          }
          onPress={() => setIsCustomizing((current) => !current)}
        />
        {isCustomizing ? (
          <>
            <ActionButton label="Reset Section Layout" onPress={onReset} />
            {onResetAll ? (
              <ActionButton
                label="Reset All Section Layouts"
                onPress={onResetAll}
              />
            ) : null}
          </>
        ) : null}
      </ButtonRow>
      {isCustomizing ? (
        <View
          accessibilityLabel="Section layout controls"
          style={styles.customizeList}
        >
          {visibleSectionIds.map((sectionId, index) => {
            const section = sections.get(sectionId);
            if (!section) return null;
            return (
              <View key={sectionId} style={styles.customizeRow}>
                <Text style={styles.customizeTitle}>{section.props.title}</Text>
                <ButtonRow>
                  <ActionButton
                    disabled={index === 0}
                    label="Earlier"
                    onPress={() => {
                      const targetId = visibleSectionIds[index - 1];
                      if (!targetId) return;
                      onMove(
                        sectionId,
                        order.indexOf(targetId) - order.indexOf(sectionId)
                      );
                    }}
                  />
                  <ActionButton
                    disabled={index === visibleSectionIds.length - 1}
                    label="Later"
                    onPress={() => {
                      const targetId = visibleSectionIds[index + 1];
                      if (!targetId) return;
                      onMove(
                        sectionId,
                        order.indexOf(targetId) - order.indexOf(sectionId)
                      );
                    }}
                  />
                  <ActionButton
                    label={collapsed.has(sectionId) ? 'Expand' : 'Collapse'}
                    onPress={() =>
                      onSetCollapsed(sectionId, !collapsed.has(sectionId))
                    }
                  />
                </ButtonRow>
              </View>
            );
          })}
        </View>
      ) : null}
      {visibleSectionIds.map((sectionId) => {
        const section = sections.get(sectionId);
        return section
          ? cloneElement(section, {
              collapsed: collapsed.has(sectionId),
              onCollapsedChange: (value) => onSetCollapsed(sectionId, value),
              key: sectionId,
            })
          : null;
      })}
    </View>
  );
}

export function Field({
  accessibilityLabel,
  autoCapitalize,
  autoCorrect,
  editable = true,
  label,
  value,
  onChangeText,
  multiline,
  placeholder,
  testID,
}: {
  accessibilityLabel?: string;
  autoCapitalize?: TextInputProps['autoCapitalize'];
  autoCorrect?: boolean;
  editable?: boolean;
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  multiline?: boolean;
  placeholder?: string;
  testID?: string;
}) {
  const inputProps: TextInputProps = multiline
    ? { multiline: true, textAlignVertical: 'top' }
    : {};
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        {...inputProps}
        accessibilityLabel={accessibilityLabel ?? label}
        autoCapitalize={autoCapitalize}
        autoCorrect={autoCorrect}
        editable={editable}
        placeholder={placeholder}
        placeholderTextColor={valgaronColors.muted}
        style={[
          styles.input,
          multiline ? styles.multilineInput : null,
          !editable ? styles.disabledInput : null,
        ]}
        testID={testID}
        value={value}
        onChangeText={onChangeText}
      />
    </View>
  );
}

export function SelectField<TValue extends string>({
  accessibilityLabel,
  label,
  options,
  searchable = false,
  searchPlaceholder = selectFieldCopy.defaultSearchPlaceholder,
  testID,
  value,
  onValueChange,
}: {
  accessibilityLabel?: string;
  label: string;
  options: readonly ControlOption<TValue>[];
  searchable?: boolean;
  searchPlaceholder?: string;
  testID?: string;
  value: TValue;
  onValueChange: (value: TValue) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const selectedOption = options.find((option) => option.value === value);
  const normalizedSearchQuery = searchQuery.trim().toLowerCase();
  const visibleOptions = normalizedSearchQuery
    ? options.filter((option) =>
        `${option.label} ${option.value}`
          .toLowerCase()
          .includes(normalizedSearchQuery)
      )
    : options;

  function close() {
    setIsOpen(false);
    setSearchQuery('');
  }

  function selectValue(nextValue: TValue) {
    onValueChange(nextValue);
    close();
  }

  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.label}>{label}</Text>
      <Pressable
        accessibilityHint={selectFieldCopy.openChoicesHint}
        accessibilityLabel={accessibilityLabel ?? label}
        accessibilityRole="button"
        accessibilityState={{ expanded: isOpen }}
        accessibilityValue={{
          text:
            selectedOption?.label ?? selectFieldCopy.defaultSelectedValueText,
        }}
        onPress={() => setIsOpen(true)}
        style={({ pressed }) => [
          styles.input,
          styles.selectInput,
          pressed ? styles.pressed : null,
        ]}
        testID={testID}
      >
        <Text style={styles.selectValue}>
          {selectedOption?.label ?? selectFieldCopy.defaultSelectedValueText}
        </Text>
      </Pressable>
      <Modal
        animationType="fade"
        onRequestClose={close}
        transparent
        visible={isOpen}
      >
        <View style={styles.modalOverlay}>
          <View
            accessibilityLabel={label}
            accessibilityRole="menu"
            style={styles.modalCard}
          >
            <Text accessibilityRole="header" style={styles.modalTitle}>
              {label}
            </Text>
            {searchable ? (
              <TextInput
                accessibilityLabel={`Search ${label}`}
                autoCapitalize="none"
                autoCorrect={false}
                placeholder={searchPlaceholder}
                placeholderTextColor={valgaronColors.muted}
                style={styles.modalSearchInput}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            ) : null}
            <ScrollView>
              {visibleOptions.map((option) => {
                const checked = option.value === value;
                return (
                  <Pressable
                    accessibilityRole="radio"
                    accessibilityState={{ checked }}
                    key={option.value}
                    onPress={() => selectValue(option.value)}
                    style={({ pressed }) => [
                      styles.modalOption,
                      checked ? styles.modalOptionSelected : null,
                      pressed ? styles.pressed : null,
                    ]}
                  >
                    <Text
                      style={[
                        styles.modalOptionText,
                        checked ? styles.modalOptionTextSelected : null,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
              {visibleOptions.length === 0 ? (
                <Text style={styles.modalEmptyText}>
                  {selectFieldCopy.noSearchMatchesText}
                </Text>
              ) : null}
            </ScrollView>
            <ActionButton label={selectFieldCopy.cancelLabel} onPress={close} />
          </View>
        </View>
      </Modal>
    </View>
  );
}

export function CheckboxField({
  accessibilityLabel,
  checked,
  label,
  onChange,
  testID,
}: {
  accessibilityLabel?: string;
  checked: boolean;
  label: string;
  onChange: (checked: boolean) => void;
  testID?: string;
}) {
  return (
    <Pressable
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      onPress={() => onChange(!checked)}
      style={({ pressed }) => [
        styles.checkboxRow,
        pressed ? styles.pressed : null,
      ]}
      testID={testID}
    >
      <View
        style={[styles.checkboxBox, checked ? styles.checkboxChecked : null]}
      >
        {checked ? <View style={styles.checkboxMark} /> : null}
      </View>
      <Text style={styles.checkboxLabel}>{label}</Text>
    </Pressable>
  );
}

export function ActionButton({
  accessibilityHint,
  accessibilityLabel,
  expanded,
  label,
  onPress,
  selected,
  testID,
  tone = 'neutral',
  disabled = false,
}: {
  accessibilityHint?: string;
  accessibilityLabel?: string;
  expanded?: boolean;
  label: string;
  onPress: () => void;
  selected?: boolean;
  testID?: string;
  tone?: 'neutral' | 'accent' | 'danger';
  disabled?: boolean;
}) {
  const accessibilityState = {
    ...(disabled ? { disabled: true } : {}),
    ...(expanded === undefined ? {} : { expanded }),
    ...(selected === undefined ? {} : { selected }),
  };
  const hasAccessibilityState = Object.keys(accessibilityState).length > 0;

  return (
    <Pressable
      accessibilityHint={accessibilityHint}
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityRole="button"
      accessibilityState={
        hasAccessibilityState ? accessibilityState : undefined
      }
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
      testID={testID}
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

export function ScreenScroll({
  children,
  scrollRef,
}: {
  children: ReactNode;
  scrollRef?: Ref<ScrollView>;
}) {
  return (
    <KeyboardAvoidingView
      style={screenStyles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        ref={scrollRef}
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
    borderRadius: valgaronRadius.lg,
    borderWidth: 1,
    backgroundColor: valgaronColors.surface,
    padding: valgaronSpacing.md,
    gap: valgaronSpacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: valgaronSpacing.md,
  },
  sectionTitle: {
    flex: 1,
    color: valgaronColors.heading,
    fontSize: valgaronTypography.sizes.lg,
    fontWeight: '700',
  },
  collapseButton: {
    minHeight: 44,
    minWidth: 64,
    borderColor: valgaronColors.border,
    borderRadius: valgaronRadius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: valgaronSpacing.sm,
  },
  collapseButtonText: {
    color: valgaronColors.text,
    fontSize: valgaronTypography.sizes.sm,
    fontWeight: '700',
  },
  collapsedSummary: {
    color: valgaronColors.muted,
    fontSize: valgaronTypography.sizes.sm,
    lineHeight: 20,
  },
  mobileDashboard: {
    gap: valgaronSpacing.lg,
  },
  customizeList: {
    borderColor: valgaronColors.accent,
    borderRadius: valgaronRadius.lg,
    borderWidth: 1,
    gap: valgaronSpacing.sm,
    padding: valgaronSpacing.md,
  },
  customizeRow: {
    borderBottomColor: valgaronColors.border,
    borderBottomWidth: 1,
    gap: valgaronSpacing.sm,
    paddingBottom: valgaronSpacing.sm,
  },
  customizeTitle: {
    color: valgaronColors.heading,
    fontSize: valgaronTypography.sizes.sm,
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
  selectInput: {
    justifyContent: 'center',
  },
  selectValue: {
    color: valgaronColors.text,
    fontSize: valgaronTypography.sizes.md,
  },
  checkboxRow: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    flexDirection: 'row',
    gap: valgaronSpacing.sm,
    minHeight: 44,
    paddingVertical: valgaronSpacing.xs,
  },
  checkboxBox: {
    alignItems: 'center',
    borderColor: valgaronColors.border,
    borderRadius: valgaronRadius.sm,
    borderWidth: 1,
    height: 22,
    justifyContent: 'center',
    width: 22,
  },
  checkboxChecked: {
    backgroundColor: valgaronColors.accent,
    borderColor: valgaronColors.accent,
  },
  checkboxMark: {
    backgroundColor: valgaronColors.primaryContrast,
    borderRadius: 3,
    height: 10,
    width: 10,
  },
  checkboxLabel: {
    color: valgaronColors.text,
    flexShrink: 1,
    fontSize: valgaronTypography.sizes.md,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    padding: valgaronSpacing.lg,
    backgroundColor: 'rgba(15, 23, 42, 0.58)',
  },
  modalCard: {
    maxHeight: '80%',
    borderColor: valgaronColors.border,
    borderRadius: valgaronRadius.md,
    borderWidth: 1,
    backgroundColor: valgaronColors.page,
    gap: valgaronSpacing.md,
    padding: valgaronSpacing.lg,
  },
  modalTitle: {
    color: valgaronColors.heading,
    fontSize: valgaronTypography.sizes.lg,
    fontWeight: '700',
  },
  modalSearchInput: {
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
  modalEmptyText: {
    color: valgaronColors.muted,
    fontSize: valgaronTypography.sizes.sm,
    lineHeight: 20,
    paddingVertical: valgaronSpacing.md,
  },
  modalOption: {
    borderColor: valgaronColors.border,
    borderRadius: valgaronRadius.md,
    borderWidth: 1,
    marginBottom: valgaronSpacing.sm,
    paddingHorizontal: valgaronSpacing.md,
    paddingVertical: valgaronSpacing.sm,
  },
  modalOptionSelected: {
    backgroundColor: valgaronColors.accent,
    borderColor: valgaronColors.accent,
  },
  modalOptionText: {
    color: valgaronColors.text,
    fontSize: valgaronTypography.sizes.md,
    fontWeight: '700',
  },
  modalOptionTextSelected: {
    color: valgaronColors.primaryContrast,
  },
  buttonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: valgaronSpacing.sm,
  },
  button: {
    minHeight: 44,
    maxWidth: '100%',
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
  disabledInput: {
    opacity: 0.6,
  },
  pressed: {
    opacity: 0.72,
  },
  buttonText: {
    color: valgaronColors.text,
    flexShrink: 1,
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
