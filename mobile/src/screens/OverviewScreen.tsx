import { useMemo, useState } from 'react';
import { router } from 'expo-router';
import { Text, View, StyleSheet } from 'react-native';
import {
  getDataRecoverySnapshotModel,
  getDeviceSaveStatusModel,
  getWorkspaceOverviewDraftingPromptCountLabel,
  getWorkspaceOverviewEditEntryAccessibilityLabel,
  getWorkspaceOverviewEntryRoute,
  getWorkspaceOverviewModel,
  getWorkspaceOverviewOpenEntryAccessibilityLabel,
  mobileFeatureDisplayLimits,
  overviewFeatureCopy,
  summarizeRecoverySnapshot,
  valgaronProduct,
} from '@valgaron/core';
import {
  valgaronColors,
  valgaronRadius,
  valgaronSpacing,
  valgaronTypography,
} from '@valgaron/ui-tokens';
import { useMobileCodex } from '../state/MobileCodexContext';
import { getMobileRouteHref } from '../navigation/mobileRoutes';
import {
  ActionButton,
  ButtonRow,
  Field,
  MutedText,
  ScreenHeader,
  ScreenScroll,
  SectionBlock,
  StatusText,
} from './screenPrimitives';

export function OverviewScreen() {
  const controller = useMobileCodex();
  const [globalQuery, setGlobalQuery] = useState('');
  const overview = useMemo(
    () =>
      getWorkspaceOverviewModel({
        document: controller.document,
        workspace: controller.activeWorld,
        query: globalQuery,
        searchLimit: mobileFeatureDisplayLimits.overviewSearchResults,
        incompleteLimit: mobileFeatureDisplayLimits.overviewIncompleteEntries,
      }),
    [controller.activeWorld, controller.document, globalQuery]
  );
  const {
    entryHighlights,
    incompleteEntries,
    quickCreateActions,
    searchResults,
    summary,
  } = overview;
  const recoverySnapshotSummary = controller.lastRecoverySnapshot
    ? summarizeRecoverySnapshot(controller.lastRecoverySnapshot)
    : null;
  const recoverySnapshotText = recoverySnapshotSummary
    ? getDataRecoverySnapshotModel([recoverySnapshotSummary]).rows[0]
        ?.mobileSummaryText
    : '';
  const saveStatus = getDeviceSaveStatusModel({
    savedAt: controller.document.savedAt,
    saveMessage: controller.saveMessage,
  });

  function openEntry(entry: { id: string; name: string; sectionId: string }) {
    router.push({
      ...getMobileRouteHref(getWorkspaceOverviewEntryRoute(entry)),
    });
  }

  return (
    <ScreenScroll>
      <ScreenHeader
        title={valgaronProduct.name}
        detail={`${controller.loadStatus.message} ${controller.saveMessage}`}
      />

      <View style={styles.statGrid}>
        <Stat
          label={overviewFeatureCopy.workspaceStatLabel}
          value={summary.workspaceName}
        />
        <Stat
          label={overviewFeatureCopy.entriesStatLabel}
          value={String(summary.entryCount)}
        />
        <Stat
          label={overviewFeatureCopy.relationshipsStatLabel}
          value={String(summary.relationshipCount)}
        />
        <Stat
          label={overviewFeatureCopy.activeWorkspacesStatLabel}
          value={String(summary.activeWorkspaceCount)}
        />
      </View>

      <SectionBlock title={saveStatus.title}>
        <StatusText tone={saveStatus.tone}>{saveStatus.label}</StatusText>
        <MutedText>{saveStatus.detail}</MutedText>
        <ButtonRow>
          <ActionButton
            label={overviewFeatureCopy.openDataLabel}
            onPress={() => router.push('/data')}
          />
        </ButtonRow>
      </SectionBlock>

      <SectionBlock title={overviewFeatureCopy.currentDraftStateTitle}>
        <MutedText>
          {getWorkspaceOverviewDraftingPromptCountLabel(
            summary.incompleteEntryCount
          )}
        </MutedText>
        {recoverySnapshotText ? (
          <MutedText>{recoverySnapshotText}</MutedText>
        ) : null}
      </SectionBlock>

      <SectionBlock title={overviewFeatureCopy.globalSearchTitle}>
        <Field
          autoCapitalize="none"
          autoCorrect={false}
          label={overviewFeatureCopy.searchEntriesLabel}
          value={globalQuery}
          onChangeText={setGlobalQuery}
          placeholder={overviewFeatureCopy.searchPlaceholder}
        />
        {globalQuery.trim() ? (
          <ButtonRow>
            <ActionButton
              label={overviewFeatureCopy.clearSearchLabel}
              onPress={() => setGlobalQuery('')}
            />
          </ButtonRow>
        ) : null}
        {globalQuery.trim() ? (
          searchResults.length > 0 ? (
            searchResults.map((entry) => (
              <View key={entry.id} style={styles.queueItem}>
                <Text style={styles.itemTitle}>{entry.name}</Text>
                <MutedText>{entry.contextText}</MutedText>
                <MutedText>{entry.summaryText}</MutedText>
                <ButtonRow>
                  <ActionButton
                    accessibilityLabel={getWorkspaceOverviewOpenEntryAccessibilityLabel(
                      entry
                    )}
                    label={overviewFeatureCopy.openLabel}
                    onPress={() => openEntry(entry)}
                  />
                </ButtonRow>
              </View>
            ))
          ) : (
            <MutedText>{overviewFeatureCopy.noSearchResultsTitle}</MutedText>
          )
        ) : (
          <MutedText>{overviewFeatureCopy.searchHelpText}</MutedText>
        )}
      </SectionBlock>

      <SectionBlock title={overviewFeatureCopy.quickCreateTitle}>
        <ButtonRow>
          {quickCreateActions.map((action) => (
            <ActionButton
              key={action.id}
              label={action.label}
              onPress={() =>
                router.push({
                  ...getMobileRouteHref(action.route),
                })
              }
            />
          ))}
        </ButtonRow>
      </SectionBlock>

      {entryHighlights.pinned.length > 0 ? (
        <SectionBlock title={overviewFeatureCopy.pinnedTitle}>
          {entryHighlights.pinned.map((entry) => (
            <View key={entry.id} style={styles.queueItem}>
              <Text style={styles.itemTitle}>{entry.name}</Text>
              <MutedText>{entry.contextText}</MutedText>
              <MutedText>{entry.summaryText}</MutedText>
              <ButtonRow>
                <ActionButton
                  accessibilityLabel={getWorkspaceOverviewEditEntryAccessibilityLabel(
                    entry
                  )}
                  label={overviewFeatureCopy.editLabel}
                  onPress={() => openEntry(entry)}
                />
              </ButtonRow>
            </View>
          ))}
        </SectionBlock>
      ) : null}

      <SectionBlock title={overviewFeatureCopy.recentTitle}>
        {entryHighlights.recent.length > 0 ? (
          entryHighlights.recent.map((entry) => (
            <View key={entry.id} style={styles.queueItem}>
              <Text style={styles.itemTitle}>{entry.name}</Text>
              <MutedText>{entry.contextText}</MutedText>
              <MutedText>{entry.summaryText}</MutedText>
              <ButtonRow>
                <ActionButton
                  accessibilityLabel={getWorkspaceOverviewEditEntryAccessibilityLabel(
                    entry
                  )}
                  label={overviewFeatureCopy.editLabel}
                  onPress={() => openEntry(entry)}
                />
              </ButtonRow>
            </View>
          ))
        ) : (
          <MutedText>{overviewFeatureCopy.noRecentRecordsTitle}</MutedText>
        )}
      </SectionBlock>

      <SectionBlock title={overviewFeatureCopy.incompleteTitle}>
        {incompleteEntries.length > 0 ? (
          incompleteEntries.map((item) => (
            <View key={item.entry.id} style={styles.queueItem}>
              <Text style={styles.itemTitle}>{item.entry.name}</Text>
              <MutedText>{item.contextText}</MutedText>
              <MutedText>{item.promptText}</MutedText>
              <ButtonRow>
                <ActionButton
                  accessibilityLabel={getWorkspaceOverviewEditEntryAccessibilityLabel(
                    item.entry
                  )}
                  label={overviewFeatureCopy.editLabel}
                  onPress={() =>
                    openEntry({
                      id: item.entry.id,
                      name: item.entry.name,
                      sectionId: item.section.id,
                    })
                  }
                />
              </ButtonRow>
            </View>
          ))
        ) : (
          <MutedText>{overviewFeatureCopy.noVisibleDraftingPrompts}</MutedText>
        )}
      </SectionBlock>
    </ScreenScroll>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  statGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: valgaronSpacing.sm,
  },
  stat: {
    minWidth: 136,
    flexGrow: 1,
    borderColor: valgaronColors.border,
    borderRadius: valgaronRadius.lg,
    borderWidth: 1,
    padding: valgaronSpacing.md,
    gap: valgaronSpacing.xs,
  },
  statValue: {
    color: valgaronColors.heading,
    fontSize: valgaronTypography.sizes.lg,
    fontWeight: '700',
  },
  statLabel: {
    color: valgaronColors.muted,
    fontSize: valgaronTypography.sizes.sm,
  },
  queueItem: {
    borderColor: valgaronColors.border,
    borderRadius: valgaronRadius.md,
    borderWidth: 1,
    gap: valgaronSpacing.xs,
    padding: valgaronSpacing.md,
  },
  itemTitle: {
    color: valgaronColors.heading,
    fontSize: valgaronTypography.sizes.md,
    fontWeight: '700',
  },
});
