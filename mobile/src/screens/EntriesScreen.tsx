import { useEffect, useMemo, useRef, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { Text, View, StyleSheet } from 'react-native';
import type {
  EntryDraft,
  WorldEntryStatus,
  WorldSectionConfig,
} from '@valgaron/core';
import {
  draftFromEntry,
  formatUpdatedAt,
  getCodexEntriesRoute,
  getCodexHelpRoute,
  getCodexRelationshipsRoute,
  getCodexScreenIntro,
  getEntries,
  getEntryStatusLabel,
  getSectionTags,
  hasUnsavedChanges,
  worldEntryStatusOptions,
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
  getMobileRouteParam,
  getNextMobileEntryQuery,
} from '../navigation/mobileRouteParams';
import {
  applyMobileEntrySectionTemplate,
  createMobileEntryDraft,
  createMobileEntryTemplateDraft,
  getMobileEntryRelationshipSummary,
  getMobileEntryList,
  getMobileTimelineBrowseView,
  getMobileTimelineSummary,
  mobileEntrySortOptions,
  type MobileEntrySortKey,
} from '../state/mobileCodexViewModels';
import { getMobileFeedbackTone } from '../state/mobileFeedback';
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
import { confirmMobileDestructiveAction } from './mobileConfirm';
import { confirmMobileDiscardUnsavedChanges } from './mobileUnsavedChanges';

const MOBILE_ENTRY_RESULT_LIMIT = 50;
const MOBILE_TIMELINE_GROUP_EVENT_LIMIT = 12;
const MOBILE_TIMELINE_DIAGNOSTIC_LIMIT = 12;

function formatLimitedList(
  values: readonly string[],
  separator = ', ',
  limit = MOBILE_TIMELINE_DIAGNOSTIC_LIMIT
): string {
  const visibleValues = values.slice(0, limit);
  const hiddenCount = Math.max(0, values.length - visibleValues.length);
  return `${visibleValues.join(separator)}${
    hiddenCount > 0 ? `${separator}and ${hiddenCount} more` : ''
  }`;
}

export function EntriesScreen() {
  const controller = useMobileCodex();
  const routeParams = useLocalSearchParams<{
    entryId?: string;
    intent?: string;
    query?: string;
    sectionId?: string;
  }>();
  const requestedSectionId = getMobileRouteParam(routeParams.sectionId);
  const requestedEntryId = getMobileRouteParam(routeParams.entryId);
  const requestedIntent = getMobileRouteParam(routeParams.intent);
  const requestedQuery = getMobileRouteParam(routeParams.query);
  const appliedRouteKeyRef = useRef('');
  const allowNextRouteReplaceRef = useRef(false);
  const intro = getCodexScreenIntro('entries');
  const [sectionId, setSectionId] = useState(() => {
    const requestedSection = controller.sections.find(
      (item) => item.id === requestedSectionId
    );
    return requestedSection?.id ?? controller.sections[0]?.id ?? 'characters';
  });
  const section =
    controller.sections.find((item) => item.id === sectionId) ??
    controller.sections[0]!;
  const [query, setQuery] = useState(requestedQuery ?? '');
  const [showArchived, setShowArchived] = useState(false);
  const [sortKey, setSortKey] = useState<MobileEntrySortKey>(() =>
    section.id === 'timeline' ? 'timeline-order' : 'updated-desc'
  );
  const [statusFilter, setStatusFilter] = useState<WorldEntryStatus | ''>('');
  const [activeTag, setActiveTag] = useState('');
  const [timelineEraFilter, setTimelineEraFilter] = useState('');
  const [timelineInvolvedEntryFilter, setTimelineInvolvedEntryFilter] =
    useState('');
  const [timelineInvolvedEntryQuery, setTimelineInvolvedEntryQuery] =
    useState('');
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);
  const [draft, setDraft] = useState<EntryDraft>(() =>
    createMobileEntryDraft(section)
  );
  const entries = useMemo(
    () =>
      getMobileEntryList(controller.activeWorld, section, query, {
        activeTag,
        showArchived,
        sortKey,
        status: statusFilter,
        timelineEra: timelineEraFilter,
        timelineInvolvedEntryId: timelineInvolvedEntryFilter,
      }),
    [
      activeTag,
      controller.activeWorld,
      query,
      section,
      showArchived,
      sortKey,
      statusFilter,
      timelineEraFilter,
      timelineInvolvedEntryFilter,
    ]
  );
  const availableTags = useMemo(
    () => getSectionTags(getEntries(controller.activeWorld.codex, section.id)),
    [controller.activeWorld.codex, section.id]
  );
  const timelineSummary = useMemo(
    () =>
      section.id === 'timeline'
        ? getMobileTimelineSummary(controller.activeWorld)
        : null,
    [controller.activeWorld, section.id]
  );
  const timelineBrowse = useMemo(
    () =>
      section.id === 'timeline'
        ? getMobileTimelineBrowseView(controller.activeWorld, {
            era: timelineEraFilter,
            involvedEntryId: timelineInvolvedEntryFilter,
            query,
            showArchived,
            status: statusFilter,
            tag: activeTag,
          })
        : null,
    [
      activeTag,
      controller.activeWorld,
      query,
      section.id,
      showArchived,
      statusFilter,
      timelineEraFilter,
      timelineInvolvedEntryFilter,
    ]
  );
  const timelineInvolvedEntryMatches = useMemo(() => {
    const normalizedQuery = timelineInvolvedEntryQuery.trim().toLowerCase();
    const involvedEntries = timelineBrowse?.involvedEntries ?? [];
    if (!normalizedQuery) {
      return involvedEntries;
    }
    return involvedEntries.filter((entry) =>
      [
        entry.id,
        entry.name,
        entry.sectionId,
        entry.sectionTitle,
        entry.status,
        ...entry.tags,
      ].some((value) => value.toLowerCase().includes(normalizedQuery))
    );
  }, [timelineBrowse, timelineInvolvedEntryQuery]);
  const timelineInvolvedEntryOptions = timelineInvolvedEntryMatches.slice(
    0,
    24
  );
  const hiddenTimelineInvolvedEntryCount = Math.max(
    0,
    timelineInvolvedEntryMatches.length - timelineInvolvedEntryOptions.length
  );
  const displayedTimelineGroups = useMemo(
    () =>
      (timelineBrowse?.groups ?? []).map((group) => {
        const events = group.events.slice(0, MOBILE_TIMELINE_GROUP_EVENT_LIMIT);
        return {
          ...group,
          events,
          hiddenEventCount: Math.max(0, group.events.length - events.length),
        };
      }),
    [timelineBrowse]
  );
  const sectionEntries = getEntries(controller.activeWorld.codex, section.id);
  const displayedEntries = entries
    .slice(0, MOBILE_ENTRY_RESULT_LIMIT)
    .map((entry, index) => ({ entry, index }));
  const hiddenEntryCount = Math.max(
    0,
    entries.length - displayedEntries.length
  );
  const selectedEntry = selectedEntryId
    ? sectionEntries.find((entry) => entry.id === selectedEntryId) ?? null
    : null;
  const sectionEntryCount = sectionEntries.length;
  const sectionArchivedEntryCount = sectionEntries.filter(
    (entry) => entry.status === 'archived'
  ).length;
  const hasEntryFilters = Boolean(
    query ||
      statusFilter ||
      activeTag ||
      showArchived ||
      timelineEraFilter ||
      timelineInvolvedEntryFilter ||
      timelineInvolvedEntryQuery
  );
  const hasTimelineFilters = Boolean(
    timelineEraFilter ||
      timelineInvolvedEntryFilter ||
      timelineInvolvedEntryQuery
  );
  const selectedEntryRelationships = useMemo(
    () =>
      selectedEntry
        ? getMobileEntryRelationshipSummary(
            controller.activeWorld,
            selectedEntry.id
          )
        : [],
    [controller.activeWorld, selectedEntry]
  );
  const baselineDraft = selectedEntry
    ? draftFromEntry(selectedEntry, section)
    : createMobileEntryDraft(section);
  const isDraftDirty = hasUnsavedChanges(baselineDraft, draft);

  useEffect(() => {
    if (controller.sections.some((item) => item.id === sectionId)) {
      return;
    }
    const fallbackSection = controller.sections[0];
    if (!fallbackSection) {
      return;
    }
    setSectionId(fallbackSection.id);
    setSelectedEntryId(null);
    setSortKey(
      fallbackSection.id === 'timeline' ? 'timeline-order' : 'updated-desc'
    );
    setDraft(createMobileEntryDraft(fallbackSection));
  }, [controller.sections, sectionId]);

  useEffect(() => {
    const routeKey = [
      controller.activeWorld.id,
      requestedSectionId ?? '',
      requestedEntryId ?? '',
      requestedIntent ?? '',
      requestedQuery ?? '',
    ].join('|');
    if (appliedRouteKeyRef.current === routeKey) {
      return;
    }
    if (
      !requestedSectionId &&
      !requestedEntryId &&
      !requestedIntent &&
      requestedQuery === undefined
    ) {
      appliedRouteKeyRef.current = routeKey;
      return;
    }

    const nextSection =
      controller.sections.find((item) => item.id === requestedSectionId) ??
      section;
    const sectionChanged = requestedSectionId
      ? nextSection.id !== section.id
      : false;
    const routeWillReplaceDraft =
      sectionChanged ||
      requestedIntent === 'new' ||
      Boolean(requestedSectionId && !requestedEntryId) ||
      Boolean(requestedEntryId);

    const applyRouteState = () => {
      if (sectionChanged) {
        setSectionId(nextSection.id);
        setActiveTag('');
        setTimelineEraFilter('');
        setTimelineInvolvedEntryFilter('');
        setTimelineInvolvedEntryQuery('');
        setStatusFilter('');
        setShowArchived(false);
        setSortKey(
          nextSection.id === 'timeline' ? 'timeline-order' : 'updated-desc'
        );
      }
      setQuery((currentQuery) =>
        getNextMobileEntryQuery({
          currentQuery,
          requestedQuery,
          sectionChanged,
        })
      );
      if (
        requestedIntent === 'new' ||
        (requestedSectionId && !requestedEntryId)
      ) {
        setSelectedEntryId(null);
        setDraft(createMobileEntryDraft(nextSection));
      }

      if (requestedEntryId) {
        const requestedEntry =
          getEntries(controller.activeWorld.codex, nextSection.id).find(
            (entry) => entry.id === requestedEntryId
          ) ?? null;
        if (requestedEntry) {
          setSelectedEntryId(requestedEntry.id);
          setDraft(draftFromEntry(requestedEntry, nextSection));
        } else {
          setSelectedEntryId(null);
          setDraft(createMobileEntryDraft(nextSection));
        }
      }
      appliedRouteKeyRef.current = routeKey;
    };

    if (allowNextRouteReplaceRef.current) {
      allowNextRouteReplaceRef.current = false;
      applyRouteState();
      return;
    }

    if (routeWillReplaceDraft && isDraftDirty) {
      confirmMobileDiscardUnsavedChanges(true, applyRouteState, () => {
        appliedRouteKeyRef.current = routeKey;
      });
      return;
    }
    applyRouteState();
  }, [
    controller.activeWorld.codex,
    controller.activeWorld.id,
    controller.sections,
    isDraftDirty,
    requestedEntryId,
    requestedIntent,
    requestedQuery,
    requestedSectionId,
    section,
  ]);

  function chooseSection(nextSection: WorldSectionConfig) {
    confirmMobileDiscardUnsavedChanges(isDraftDirty, () => {
      setSectionId(nextSection.id);
      setQuery('');
      setSelectedEntryId(null);
      setActiveTag('');
      setTimelineEraFilter('');
      setTimelineInvolvedEntryFilter('');
      setTimelineInvolvedEntryQuery('');
      setStatusFilter('');
      setShowArchived(false);
      setSortKey(
        nextSection.id === 'timeline' ? 'timeline-order' : 'updated-desc'
      );
      setDraft(createMobileEntryDraft(nextSection));
    });
  }

  function chooseEntry(entryId: string) {
    const entry = getEntries(controller.activeWorld.codex, section.id).find(
      (item) => item.id === entryId
    );
    if (!entry) {
      return;
    }
    if (entry.id === selectedEntryId) {
      return;
    }
    confirmMobileDiscardUnsavedChanges(isDraftDirty, () => {
      setSelectedEntryId(entry.id);
      setDraft(draftFromEntry(entry, section));
    });
  }

  function resetDraft(force = false) {
    const reset = () => {
      setSelectedEntryId(null);
      setDraft(createMobileEntryDraft(section));
    };
    if (force) {
      reset();
      return;
    }
    confirmMobileDiscardUnsavedChanges(isDraftDirty, reset);
  }

  function clearSavedDraft() {
    setSelectedEntryId(null);
    setDraft(createMobileEntryDraft(section));
  }

  function duplicateSelectedEntry(entry: NonNullable<typeof selectedEntry>) {
    confirmMobileDiscardUnsavedChanges(isDraftDirty, () => {
      const duplicate = controller.duplicateEntry(section, entry);
      setSelectedEntryId(duplicate.id);
      setDraft(draftFromEntry(duplicate, section));
      setShowArchived(false);
    });
  }

  function useSelectedEntryAsTemplate(
    entry: NonNullable<typeof selectedEntry>
  ) {
    confirmMobileDiscardUnsavedChanges(isDraftDirty, () => {
      setSelectedEntryId(null);
      setDraft(createMobileEntryTemplateDraft(entry, section));
    });
  }

  function archiveSelectedEntry(entry: NonNullable<typeof selectedEntry>) {
    confirmMobileDiscardUnsavedChanges(isDraftDirty, () => {
      const shouldArchive = entry.status !== 'archived';
      controller.archiveEntry(entry, shouldArchive);
      if (shouldArchive) {
        clearSavedDraft();
      } else {
        const restoredEntry = {
          ...entry,
          status: 'draft' as const,
          updatedAt: new Date().toISOString(),
        };
        setDraft(draftFromEntry(restoredEntry, section));
        setShowArchived(true);
      }
    });
  }

  function deleteSelectedEntry(entry: NonNullable<typeof selectedEntry>) {
    confirmMobileDiscardUnsavedChanges(isDraftDirty, () => {
      confirmMobileDestructiveAction('delete-entry', () => {
        controller.permanentlyDeleteEntry(entry);
        clearSavedDraft();
      });
    });
  }

  function applySectionTemplate() {
    setDraft((current) => applyMobileEntrySectionTemplate(current, section));
  }

  function setDetailValue(key: string, value: string) {
    setDraft((current) => ({
      ...current,
      details: {
        ...current.details,
        [key]: value,
      },
    }));
  }

  function openRelatedEntryRoute(route: ReturnType<typeof getMobileRouteHref>) {
    confirmMobileDiscardUnsavedChanges(isDraftDirty, () => {
      allowNextRouteReplaceRef.current = true;
      router.push({ ...route });
    });
  }

  function openExternalRoute(route: ReturnType<typeof getMobileRouteHref>) {
    confirmMobileDiscardUnsavedChanges(isDraftDirty, () => {
      router.push({ ...route });
    });
  }

  return (
    <ScreenScroll>
      <ScreenHeader title={intro.title} detail={intro.detail} />

      <SectionBlock title="Sections">
        <ButtonRow>
          {controller.sections.map((item) => (
            <ActionButton
              key={item.id}
              label={item.title}
              selected={item.id === section.id}
              tone={item.id === section.id ? 'accent' : 'neutral'}
              onPress={() => chooseSection(item)}
            />
          ))}
        </ButtonRow>
        <Field
          autoCapitalize="none"
          autoCorrect={false}
          label="Search this section"
          value={query}
          onChangeText={setQuery}
        />
        <ButtonRow>
          <ActionButton
            label="Any Status"
            selected={statusFilter === ''}
            tone={statusFilter === '' ? 'accent' : 'neutral'}
            onPress={() => setStatusFilter('')}
          />
          {worldEntryStatusOptions.map((option) => (
            <ActionButton
              key={option.value}
              label={option.label}
              selected={statusFilter === option.value}
              tone={statusFilter === option.value ? 'accent' : 'neutral'}
              onPress={() => {
                setStatusFilter(option.value);
                if (option.value === 'archived') {
                  setShowArchived(true);
                }
              }}
            />
          ))}
        </ButtonRow>
        <ButtonRow>
          {mobileEntrySortOptions
            .filter(
              (option) => !option.timelineOnly || section.id === 'timeline'
            )
            .map((option) => (
              <ActionButton
                key={option.key}
                accessibilityLabel={`Sort entries by ${option.label.toLowerCase()}`}
                label={option.label}
                selected={sortKey === option.key}
                tone={sortKey === option.key ? 'accent' : 'neutral'}
                onPress={() => setSortKey(option.key)}
              />
            ))}
        </ButtonRow>
        {availableTags.length > 0 ? (
          <ButtonRow>
            <ActionButton
              label="All Tags"
              selected={activeTag === ''}
              tone={activeTag === '' ? 'accent' : 'neutral'}
              onPress={() => setActiveTag('')}
            />
            {availableTags.map((tag) => (
              <ActionButton
                key={tag}
                label={tag}
                selected={activeTag === tag}
                tone={activeTag === tag ? 'accent' : 'neutral'}
                onPress={() =>
                  setActiveTag((current) => (current === tag ? '' : tag))
                }
              />
            ))}
          </ButtonRow>
        ) : null}
        <ButtonRow>
          <ActionButton
            label={showArchived ? 'Showing Archived' : 'Show Archived'}
            selected={showArchived}
            tone={showArchived ? 'accent' : 'neutral'}
            onPress={() => setShowArchived((current) => !current)}
          />
          {hasEntryFilters ? (
            <ActionButton
              label="Clear Filters"
              onPress={() => {
                setQuery('');
                setStatusFilter('');
                setActiveTag('');
                setTimelineEraFilter('');
                setTimelineInvolvedEntryFilter('');
                setTimelineInvolvedEntryQuery('');
                setShowArchived(false);
              }}
            />
          ) : null}
        </ButtonRow>
      </SectionBlock>

      {timelineSummary ? (
        <SectionBlock title="Timeline Browser">
          <ButtonRow>
            <ActionButton
              label="Timeline Help"
              onPress={() =>
                openExternalRoute(
                  getMobileRouteHref(getCodexHelpRoute('timeline'))
                )
              }
            />
          </ButtonRow>
          <MutedText>
            Highlights:{' '}
            {timelineSummary.highlightNames.length > 0
              ? timelineSummary.highlightNames.join(', ')
              : 'No visible timeline events.'}
          </MutedText>
          <MutedText>
            Unordered: {timelineSummary.unorderedCount}. Duplicate order groups:{' '}
            {timelineSummary.duplicateOrderCount}. Unlinked events:{' '}
            {timelineSummary.unlinkedCount}.
          </MutedText>
          {timelineBrowse ? (
            <>
              {timelineBrowse.eras.length > 0 ? (
                <ButtonRow>
                  <ActionButton
                    label="Any Era"
                    selected={timelineEraFilter === ''}
                    tone={timelineEraFilter === '' ? 'accent' : 'neutral'}
                    onPress={() => setTimelineEraFilter('')}
                  />
                  {timelineBrowse.eras.map((era) => (
                    <ActionButton
                      key={era}
                      label={era}
                      selected={timelineEraFilter === era}
                      tone={timelineEraFilter === era ? 'accent' : 'neutral'}
                      onPress={() =>
                        setTimelineEraFilter((current) =>
                          current === era ? '' : era
                        )
                      }
                    />
                  ))}
                </ButtonRow>
              ) : null}
              {timelineBrowse.involvedEntries.length > 0 ? (
                <>
                  <Field
                    autoCapitalize="none"
                    autoCorrect={false}
                    label="Search involved filters"
                    value={timelineInvolvedEntryQuery}
                    onChangeText={setTimelineInvolvedEntryQuery}
                    placeholder="Record name, section, tag, status, or id"
                  />
                  <ButtonRow>
                    <ActionButton
                      label="Any Involved"
                      selected={timelineInvolvedEntryFilter === ''}
                      tone={
                        timelineInvolvedEntryFilter === ''
                          ? 'accent'
                          : 'neutral'
                      }
                      onPress={() => setTimelineInvolvedEntryFilter('')}
                    />
                    {timelineInvolvedEntryOptions.map((entry) => (
                      <ActionButton
                        key={entry.id}
                        label={entry.name}
                        selected={timelineInvolvedEntryFilter === entry.id}
                        tone={
                          timelineInvolvedEntryFilter === entry.id
                            ? 'accent'
                            : 'neutral'
                        }
                        onPress={() =>
                          setTimelineInvolvedEntryFilter((current) =>
                            current === entry.id ? '' : entry.id
                          )
                        }
                      />
                    ))}
                  </ButtonRow>
                  {hiddenTimelineInvolvedEntryCount > 0 ? (
                    <MutedText>
                      Refine involved search to show{' '}
                      {hiddenTimelineInvolvedEntryCount} more record
                      {hiddenTimelineInvolvedEntryCount === 1 ? '' : 's'}.
                    </MutedText>
                  ) : null}
                  {timelineInvolvedEntryOptions.length === 0 ? (
                    <MutedText>
                      No involved records match this filter search.
                    </MutedText>
                  ) : null}
                </>
              ) : null}
              {hasTimelineFilters ? (
                <ButtonRow>
                  <ActionButton
                    label="Clear Timeline Filters"
                    onPress={() => {
                      setTimelineEraFilter('');
                      setTimelineInvolvedEntryFilter('');
                      setTimelineInvolvedEntryQuery('');
                    }}
                  />
                </ButtonRow>
              ) : null}
              {displayedTimelineGroups.length > 0 ? (
                displayedTimelineGroups.map((group) => (
                  <View key={group.era} style={styles.entryRow}>
                    <Text style={styles.entryTitle}>{group.era}</Text>
                    {group.events.map((event) => (
                      <MutedText key={event.id}>
                        {event.order || 'No order'} -{' '}
                        {event.dateLabel || 'No date'} - {event.name}
                        {event.involvedEntryNames.length > 0
                          ? ` (${event.involvedEntryNames.join(', ')})`
                          : ''}
                      </MutedText>
                    ))}
                    {group.hiddenEventCount > 0 ? (
                      <MutedText>
                        Refine timeline filters to show {group.hiddenEventCount}{' '}
                        more event
                        {group.hiddenEventCount === 1 ? '' : 's'} in this era.
                      </MutedText>
                    ) : null}
                  </View>
                ))
              ) : (
                <MutedText>No timeline events match these filters.</MutedText>
              )}
              {timelineBrowse.unorderedNames.length > 0 ? (
                <MutedText>
                  Needs order:{' '}
                  {formatLimitedList(timelineBrowse.unorderedNames)}.
                </MutedText>
              ) : null}
              {timelineBrowse.duplicateOrderLabels.length > 0 ? (
                <MutedText>
                  Duplicate orders:{' '}
                  {formatLimitedList(timelineBrowse.duplicateOrderLabels, '; ')}
                  .
                </MutedText>
              ) : null}
              {timelineBrowse.unlinkedNames.length > 0 ? (
                <MutedText>
                  No involved records:{' '}
                  {formatLimitedList(timelineBrowse.unlinkedNames)}.
                </MutedText>
              ) : null}
            </>
          ) : null}
        </SectionBlock>
      ) : null}

      <SectionBlock title={section.title}>
        {entries.length > 0 ? (
          <>
            {displayedEntries.map(({ entry, index }) => (
              <View key={entry.id} style={styles.entryRow}>
                <View style={styles.entryText}>
                  <Text style={styles.entryTitle}>{entry.name}</Text>
                  <MutedText>
                    {getEntryStatusLabel(entry.status)} -{' '}
                    {entry.tags.join(', ') || 'No tags'}
                  </MutedText>
                  <MutedText>{entry.summary || 'No summary yet.'}</MutedText>
                  <MutedText>
                    Updated {formatUpdatedAt(entry.updatedAt)}
                  </MutedText>
                </View>
                <ActionButton
                  accessibilityLabel={`Edit ${entry.name}`}
                  label="Edit"
                  onPress={() => chooseEntry(entry.id)}
                />
                {section.id === 'timeline' && entries.length > 1 ? (
                  <ButtonRow>
                    <ActionButton
                      accessibilityLabel={`Move ${entry.name} earlier`}
                      label="Earlier"
                      disabled={index === 0}
                      onPress={() =>
                        controller.moveTimelineEvent(entry.id, 'earlier')
                      }
                    />
                    <ActionButton
                      accessibilityLabel={`Move ${entry.name} later`}
                      label="Later"
                      disabled={index === entries.length - 1}
                      onPress={() =>
                        controller.moveTimelineEvent(entry.id, 'later')
                      }
                    />
                  </ButtonRow>
                ) : null}
              </View>
            ))}
            {hiddenEntryCount > 0 ? (
              <MutedText>
                Refine section search or filters to show {hiddenEntryCount} more
                record{hiddenEntryCount === 1 ? '' : 's'}.
              </MutedText>
            ) : null}
          </>
        ) : (
          <MutedText>
            {sectionEntryCount === 0
              ? `No ${section.title.toLowerCase()} saved in this workspace yet.`
              : sectionArchivedEntryCount === sectionEntryCount
              ? 'Only archived entries are in this section. Turn on Show Archived to review or restore them.'
              : hasEntryFilters
              ? 'No entries match these filters.'
              : 'No visible entries match this section.'}
          </MutedText>
        )}
      </SectionBlock>

      {selectedEntry ? (
        <SectionBlock title="Linked Records">
          {selectedEntryRelationships.length > 0 ? (
            selectedEntryRelationships.map((relationship) => (
              <View key={relationship.id} style={styles.entryRow}>
                <View style={styles.entryText}>
                  <Text style={styles.entryTitle}>
                    {relationship.relatedEntryName}
                  </Text>
                  <MutedText>
                    {relationship.directionLabel} - {relationship.type}
                  </MutedText>
                  {relationship.note ? (
                    <MutedText>{relationship.note}</MutedText>
                  ) : null}
                </View>
                {relationship.relatedEntryId &&
                relationship.relatedSectionId ? (
                  <ButtonRow>
                    <ActionButton
                      accessibilityLabel={`Open ${relationship.relatedEntryName}`}
                      label="Open"
                      onPress={() =>
                        openRelatedEntryRoute(
                          getMobileRouteHref(
                            getCodexEntriesRoute({
                              entryId: relationship.relatedEntryId,
                              intent: 'edit',
                              query: relationship.relatedEntryName,
                              sectionId: relationship.relatedSectionId,
                            })
                          )
                        )
                      }
                    />
                  </ButtonRow>
                ) : null}
              </View>
            ))
          ) : (
            <MutedText>No linked records yet.</MutedText>
          )}
          <ButtonRow>
            <ActionButton
              accessibilityLabel={`Manage links for ${selectedEntry.name}`}
              label="Manage Links"
              onPress={() =>
                openExternalRoute(
                  getMobileRouteHref(
                    getCodexRelationshipsRoute({
                      entryId: selectedEntry.id,
                      entryQuery: selectedEntry.name,
                      relationshipQuery: selectedEntry.name,
                    })
                  )
                )
              }
            />
          </ButtonRow>
        </SectionBlock>
      ) : null}

      <SectionBlock
        title={
          selectedEntry
            ? `Edit ${selectedEntry.name}`
            : `New ${section.singularTitle}`
        }
      >
        {controller.formMessage ? (
          <StatusText tone={getMobileFeedbackTone(controller.formMessage)}>
            {controller.formMessage}
          </StatusText>
        ) : null}
        {isDraftDirty ? (
          <StatusText tone="warning">Unsaved entry draft.</StatusText>
        ) : null}
        <Field
          label="Name"
          value={draft.name}
          onChangeText={(value) =>
            setDraft((current) => ({ ...current, name: value }))
          }
        />
        <Field
          label="Summary"
          value={draft.summary}
          onChangeText={(value) =>
            setDraft((current) => ({ ...current, summary: value }))
          }
          multiline
        />
        <Field
          label="Notes"
          value={draft.notes}
          onChangeText={(value) =>
            setDraft((current) => ({ ...current, notes: value }))
          }
          multiline
        />
        <Field
          autoCapitalize="none"
          autoCorrect={false}
          label="Tags"
          value={draft.tags}
          onChangeText={(value) =>
            setDraft((current) => ({ ...current, tags: value }))
          }
          placeholder="maps, routes"
        />
        <ButtonRow>
          {worldEntryStatusOptions.map((option) => (
            <ActionButton
              key={option.value}
              label={option.label}
              selected={draft.status === option.value}
              tone={draft.status === option.value ? 'accent' : 'neutral'}
              onPress={() =>
                setDraft((current) => ({ ...current, status: option.value }))
              }
            />
          ))}
          <ActionButton
            label={draft.pinned ? 'Pinned' : 'Pin'}
            selected={draft.pinned}
            tone={draft.pinned ? 'accent' : 'neutral'}
            onPress={() =>
              setDraft((current) => ({ ...current, pinned: !current.pinned }))
            }
          />
        </ButtonRow>
        {section.detailFields.map((field) => (
          <Field
            key={field.key}
            label={field.label}
            value={draft.details[field.key] ?? ''}
            multiline={field.multiline}
            onChangeText={(value) => setDetailValue(field.key, value)}
          />
        ))}
        <ButtonRow>
          <ActionButton
            label="Save Entry"
            tone="accent"
            onPress={() => {
              const savedEntry = controller.saveEntryDraft(
                section,
                draft,
                selectedEntry ?? undefined
              );
              if (savedEntry) {
                setSelectedEntryId(savedEntry.id);
                setDraft(draftFromEntry(savedEntry, section));
              }
            }}
          />
          <ActionButton label="New Draft" onPress={resetDraft} />
          {selectedEntry ? (
            <>
              <ActionButton
                accessibilityLabel={
                  selectedEntry.status === 'archived'
                    ? `Restore ${selectedEntry.name}`
                    : `Archive ${selectedEntry.name}`
                }
                label={
                  selectedEntry.status === 'archived' ? 'Restore' : 'Archive'
                }
                onPress={() => archiveSelectedEntry(selectedEntry)}
              />
              <ActionButton
                accessibilityLabel={`Duplicate ${selectedEntry.name}`}
                label="Duplicate"
                onPress={() => duplicateSelectedEntry(selectedEntry)}
              />
              <ActionButton
                accessibilityLabel={`Use ${selectedEntry.name} as a template`}
                label="Use As Template"
                onPress={() => useSelectedEntryAsTemplate(selectedEntry)}
              />
              <ActionButton
                accessibilityHint="Deletes the entry and its relationships after confirmation."
                accessibilityLabel={`Delete ${selectedEntry.name}`}
                label="Delete"
                tone="danger"
                onPress={() => deleteSelectedEntry(selectedEntry)}
              />
            </>
          ) : (
            <ActionButton
              label="Apply Template"
              onPress={applySectionTemplate}
            />
          )}
        </ButtonRow>
      </SectionBlock>
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  entryRow: {
    borderColor: valgaronColors.border,
    borderRadius: valgaronRadius.md,
    borderWidth: 1,
    gap: valgaronSpacing.sm,
    padding: valgaronSpacing.md,
  },
  entryText: {
    gap: valgaronSpacing.xs,
  },
  entryTitle: {
    color: valgaronColors.heading,
    fontSize: valgaronTypography.sizes.md,
    fontWeight: '700',
  },
});
