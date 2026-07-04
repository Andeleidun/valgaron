import { useMemo, useState } from 'react';
import { router } from 'expo-router';
import { Text, View, StyleSheet } from 'react-native';
import {
  formatUpdatedAt,
  getCodexEntriesRoute,
  getDataRecoverySnapshotModel,
  getDeviceSaveStatusModel,
  getIncompleteEntries,
  getSearchableEntries,
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
  getMobileOverviewEntryHighlights,
  getMobileOverviewSummary,
  getMobileOverviewSearchResults,
} from '../state/mobileCodexViewModels';
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
  const summary = getMobileOverviewSummary(controller.document);
  const searchableEntries = getSearchableEntries(
    controller.activeWorld.codex,
    controller.activeWorld.entryTypes
  );
  const incompleteEntries = getIncompleteEntries(
    searchableEntries,
    controller.activeWorld.entryTypes
  ).slice(0, 5);
  const recoverySnapshotSummary = controller.lastRecoverySnapshot
    ? summarizeRecoverySnapshot(controller.lastRecoverySnapshot)
    : null;
  const recoverySnapshotText = recoverySnapshotSummary
    ? getDataRecoverySnapshotModel([recoverySnapshotSummary]).rows[0]
        ?.mobileSummaryText
    : '';
  const globalResults = useMemo(
    () =>
      getMobileOverviewSearchResults(controller.activeWorld, globalQuery).slice(
        0,
        6
      ),
    [controller.activeWorld, globalQuery]
  );
  const entryHighlights = useMemo(
    () => getMobileOverviewEntryHighlights(controller.activeWorld),
    [controller.activeWorld]
  );
  const saveStatus = getDeviceSaveStatusModel({
    savedAt: controller.document.savedAt,
    saveMessage: controller.saveMessage,
  });

  function openEntry(entry: { id: string; name: string; sectionId: string }) {
    router.push({
      ...getMobileRouteHref(
        getCodexEntriesRoute({
          entryId: entry.id,
          intent: 'edit',
          query: entry.name,
          sectionId: entry.sectionId,
        })
      ),
    });
  }

  return (
    <ScreenScroll>
      <ScreenHeader
        title={valgaronProduct.name}
        detail={`${controller.loadStatus.message} ${controller.saveMessage}`}
      />

      <View style={styles.statGrid}>
        <Stat label="Workspace" value={summary.workspaceName} />
        <Stat label="Entries" value={String(summary.entryCount)} />
        <Stat label="Relationships" value={String(summary.relationshipCount)} />
        <Stat
          label="Active workspaces"
          value={String(summary.activeWorkspaceCount)}
        />
      </View>

      <SectionBlock title={saveStatus.title}>
        <StatusText tone={saveStatus.tone}>{saveStatus.label}</StatusText>
        <MutedText>{saveStatus.detail}</MutedText>
        <ButtonRow>
          <ActionButton
            label="Open Data"
            onPress={() => router.push('/data')}
          />
        </ButtonRow>
      </SectionBlock>

      <SectionBlock title="Current Draft State">
        <MutedText>
          {summary.incompleteEntryCount} visible entries still have drafting
          prompts.
        </MutedText>
        {recoverySnapshotText ? (
          <MutedText>{recoverySnapshotText}</MutedText>
        ) : null}
      </SectionBlock>

      <SectionBlock title="Find Anything">
        <Field
          autoCapitalize="none"
          autoCorrect={false}
          label="Search entries"
          value={globalQuery}
          onChangeText={setGlobalQuery}
          placeholder="Search codex records"
        />
        {globalQuery.trim() ? (
          <ButtonRow>
            <ActionButton
              label="Clear Search"
              onPress={() => setGlobalQuery('')}
            />
          </ButtonRow>
        ) : null}
        {globalQuery.trim() ? (
          globalResults.length > 0 ? (
            globalResults.map((entry) => (
              <View key={entry.id} style={styles.queueItem}>
                <Text style={styles.itemTitle}>{entry.name}</Text>
                <MutedText>
                  {entry.sectionTitle} - Updated{' '}
                  {formatUpdatedAt(entry.updatedAt)}
                </MutedText>
                <MutedText>{entry.summary || 'No summary yet.'}</MutedText>
                <ButtonRow>
                  <ActionButton
                    accessibilityLabel={`Open ${entry.name}`}
                    label="Open"
                    onPress={() => openEntry(entry)}
                  />
                </ButtonRow>
              </View>
            ))
          ) : (
            <MutedText>No entries match that search.</MutedText>
          )
        ) : (
          <MutedText>Search names, tags, notes, and detail fields.</MutedText>
        )}
      </SectionBlock>

      <SectionBlock title="Start a Record">
        <ButtonRow>
          {controller.activeWorld.entryTypes.map((section) => (
            <ActionButton
              key={section.id}
              label={`New ${section.singularTitle}`}
              onPress={() =>
                router.push({
                  ...getMobileRouteHref(
                    getCodexEntriesRoute({
                      intent: 'new',
                      sectionId: section.id,
                    })
                  ),
                })
              }
            />
          ))}
        </ButtonRow>
      </SectionBlock>

      {entryHighlights.pinned.length > 0 ? (
        <SectionBlock title="Pinned Records">
          {entryHighlights.pinned.map((entry) => (
            <View key={entry.id} style={styles.queueItem}>
              <Text style={styles.itemTitle}>{entry.name}</Text>
              <MutedText>
                {entry.sectionTitle} - Updated{' '}
                {formatUpdatedAt(entry.updatedAt)}
              </MutedText>
              <MutedText>{entry.summary || 'No summary yet.'}</MutedText>
              <ButtonRow>
                <ActionButton
                  accessibilityLabel={`Open ${entry.name}`}
                  label="Open"
                  onPress={() => openEntry(entry)}
                />
              </ButtonRow>
            </View>
          ))}
        </SectionBlock>
      ) : null}

      <SectionBlock title="Recent Work">
        {entryHighlights.recent.length > 0 ? (
          entryHighlights.recent.map((entry) => (
            <View key={entry.id} style={styles.queueItem}>
              <Text style={styles.itemTitle}>{entry.name}</Text>
              <MutedText>
                {entry.sectionTitle} - Updated{' '}
                {formatUpdatedAt(entry.updatedAt)}
              </MutedText>
              <MutedText>{entry.summary || 'No summary yet.'}</MutedText>
              <ButtonRow>
                <ActionButton
                  accessibilityLabel={`Open ${entry.name}`}
                  label="Open"
                  onPress={() => openEntry(entry)}
                />
              </ButtonRow>
            </View>
          ))
        ) : (
          <MutedText>No recent records in this workspace yet.</MutedText>
        )}
      </SectionBlock>

      <SectionBlock title="Drafting Queue">
        {incompleteEntries.length > 0 ? (
          incompleteEntries.map((item) => (
            <View key={item.entry.id} style={styles.queueItem}>
              <Text style={styles.itemTitle}>{item.entry.name}</Text>
              <MutedText>
                {item.section.title} - {item.percent}% complete
              </MutedText>
              <MutedText>{item.prompts.slice(0, 2).join(' ')}</MutedText>
              <ButtonRow>
                <ActionButton
                  accessibilityLabel={`Open ${item.entry.name}`}
                  label="Open"
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
          <MutedText>No visible entries need drafting prompts.</MutedText>
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
