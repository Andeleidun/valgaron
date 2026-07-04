import { useEffect, useMemo, useRef, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { Text, View, StyleSheet } from 'react-native';
import type {
  EntryDraft,
  PlaceRelationshipFieldConfig,
  PlaceRelationshipTextReviewItem,
  WorldEntry,
  WorldEntryStatus,
  WorldRelationship,
  WorldSectionConfig,
} from '@valgaron/core';
import {
  buildPlaceRelationshipTextReviewBatchMigration,
  buildPlaceRelationshipTextReviewMigration,
  draftFromEntry,
  entryDraftStatusControl,
  entryPinnedControl,
  entryShowArchivedControl,
  entrySortControl,
  entryStatusFilterControl,
  entryUpdatedFilterControl,
  formatUpdatedAt,
  getCodexEntriesRoute,
  getCodexHelpRoute,
  getCodexRelationshipsRoute,
  getCodexScreenIntro,
  getEntries,
  getEntryDetailFieldSuggestions,
  getDraftDetailFields,
  getEntryStatusLabel,
  getEntrySortControlOptions,
  getHiddenPlaceDetailValues,
  getSectionTags,
  hasUnsavedChanges,
  placeRelationshipFieldConfigs,
  buildRelationshipTextMigration,
  filterPlaceRelationshipTargetOptions,
  getPlaceRelationshipFieldLinks,
  getPlaceRelationshipFieldTargetId,
  getPlaceRelationshipTextReviewExactMatchLabel,
  getPlaceRelationshipTextReviewItems,
  getPlaceRelationshipTextReviewSuggestionLabels,
  getPlaceRelationshipTextReviewUnresolvedLabel,
  getPlaceRelationshipTargetOptions,
  limitPlaceRelationshipTargetOptions,
  makePlaceFieldRelationship,
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
  getMobileEntryRelationshipGroups,
  getMobileEntryList,
  getMobileTimelineBrowseView,
  getMobileTimelineSummary,
  type MobileEntrySortKey,
} from '../state/mobileCodexViewModels';
import { getMobileFeedbackTone } from '../state/mobileFeedback';
import {
  ActionButton,
  ButtonRow,
  CheckboxField,
  Field,
  MutedText,
  ScreenHeader,
  ScreenScroll,
  SectionBlock,
  SelectField,
  StatusText,
} from './screenPrimitives';
import { confirmMobileDestructiveAction } from './mobileConfirm';
import { confirmMobileDiscardUnsavedChanges } from './mobileUnsavedChanges';

const MOBILE_ENTRY_RESULT_LIMIT = 50;
const MOBILE_RELATIONSHIP_TARGET_LIMIT = 24;
const MOBILE_TIMELINE_GROUP_EVENT_LIMIT = 12;
const MOBILE_TIMELINE_DIAGNOSTIC_LIMIT = 12;
const MOBILE_DETAIL_SUGGESTION_LIMIT = 8;

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
  const [updatedWithinDays, setUpdatedWithinDays] = useState<number | null>(
    null
  );
  const [statusFilter, setStatusFilter] = useState<WorldEntryStatus | ''>('');
  const [activeTag, setActiveTag] = useState('');
  const [timelineEraFilter, setTimelineEraFilter] = useState('');
  const [timelineInvolvedEntryFilter, setTimelineInvolvedEntryFilter] =
    useState('');
  const [timelineInvolvedEntryQuery, setTimelineInvolvedEntryQuery] =
    useState('');
  const [linkedFieldQueries, setLinkedFieldQueries] = useState<
    Record<string, string>
  >({});
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);
  const [draft, setDraft] = useState<EntryDraft>(() =>
    createMobileEntryDraft(section)
  );
  const [copyStatus, setCopyStatus] = useState('');
  const entries = useMemo(
    () =>
      getMobileEntryList(controller.activeWorld, section, query, {
        activeTag,
        showArchived,
        sortKey,
        status: statusFilter,
        updatedWithinDays,
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
      updatedWithinDays,
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
      updatedWithinDays !== null ||
      timelineEraFilter ||
      timelineInvolvedEntryFilter ||
      timelineInvolvedEntryQuery
  );
  const hasTimelineFilters = Boolean(
    timelineEraFilter ||
      timelineInvolvedEntryFilter ||
      timelineInvolvedEntryQuery
  );
  const selectedEntryRelationshipGroups = useMemo(
    () =>
      selectedEntry
        ? getMobileEntryRelationshipGroups(
            controller.activeWorld,
            selectedEntry
          )
        : [],
    [controller.activeWorld, selectedEntry]
  );
  const placeRelationshipTextReviewItems = useMemo(
    () =>
      section.kind === 'place'
        ? getPlaceRelationshipTextReviewItems({
            codex: controller.activeWorld.codex,
            sections: controller.activeWorld.entryTypes,
          }).filter((item) => item.sectionId === section.id)
        : [],
    [controller.activeWorld.codex, controller.activeWorld.entryTypes, section]
  );
  const placeRelationshipTextReviewExactItems =
    placeRelationshipTextReviewItems.filter((item) => item.exactMatchCount > 0);
  const hiddenDetailValues = useMemo(
    () => getHiddenPlaceDetailValues(section, draft.details),
    [draft.details, section]
  );
  const entrySortOptions = useMemo(
    () =>
      getEntrySortControlOptions({
        includeTimelineOrder: section.id === 'timeline',
      }),
    [section.id]
  );
  const visibleDetailFields = useMemo(
    () =>
      getDraftDetailFields(section, {
        details: { category: draft.details.category ?? '' },
      }),
    [draft.details.category, section]
  );
  const visibleFieldKeys = new Set(
    visibleDetailFields.map((field) => field.key)
  );
  const activeRelationshipFieldConfigs =
    selectedEntry?.kind === 'place'
      ? placeRelationshipFieldConfigs.filter((config) =>
          visibleFieldKeys.has(config.fieldKey)
        )
      : [];
  const relationshipFieldKeys = new Set(
    activeRelationshipFieldConfigs.map((config) => config.fieldKey)
  );
  const editableDetailFields =
    selectedEntry?.kind === 'place'
      ? visibleDetailFields.filter(
          (field) => !relationshipFieldKeys.has(field.key)
        )
      : visibleDetailFields;
  const detailFieldSuggestions = useMemo(
    () => getEntryDetailFieldSuggestions(editableDetailFields, sectionEntries),
    [editableDetailFields, sectionEntries]
  );
  const legacyRelationshipTextValues = activeRelationshipFieldConfigs
    .map((config) => ({
      config,
      key: config.fieldKey,
      label: config.label,
      value: draft.details[config.fieldKey]?.trim() ?? '',
    }))
    .filter((field) => field.value);
  const baselineDraft = selectedEntry
    ? draftFromEntry(selectedEntry, section)
    : createMobileEntryDraft(section);
  const isDraftDirty = hasUnsavedChanges(baselineDraft, draft);

  useEffect(() => {
    setCopyStatus('');
  }, [section.id, selectedEntryId]);

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
        setLinkedFieldQueries({});
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
        setLinkedFieldQueries({});
      }

      if (requestedEntryId) {
        const requestedEntry =
          getEntries(controller.activeWorld.codex, nextSection.id).find(
            (entry) => entry.id === requestedEntryId
          ) ?? null;
        if (requestedEntry) {
          setSelectedEntryId(requestedEntry.id);
          setDraft(draftFromEntry(requestedEntry, nextSection));
          setLinkedFieldQueries({});
        } else {
          setSelectedEntryId(null);
          setDraft(createMobileEntryDraft(nextSection));
          setLinkedFieldQueries({});
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
      setLinkedFieldQueries({});
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
      setLinkedFieldQueries({});
    });
  }

  function resetDraft(force = false) {
    const reset = () => {
      setSelectedEntryId(null);
      setDraft(createMobileEntryDraft(section));
      setLinkedFieldQueries({});
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
      setLinkedFieldQueries({});
      setShowArchived(false);
    });
  }

  function useSelectedEntryAsTemplate(
    entry: NonNullable<typeof selectedEntry>
  ) {
    confirmMobileDiscardUnsavedChanges(isDraftDirty, () => {
      setSelectedEntryId(null);
      setDraft(createMobileEntryTemplateDraft(entry, section));
      setLinkedFieldQueries({});
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
        setLinkedFieldQueries({});
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

  function copyEntryName() {
    const name = (selectedEntry?.name ?? draft.name).trim();
    if (!name) {
      setCopyStatus('Add a name before copying it.');
      return;
    }
    const clipboard = (
      globalThis as {
        navigator?: {
          clipboard?: {
            writeText?: (text: string) => Promise<void>;
          };
        };
      }
    ).navigator?.clipboard;
    if (!clipboard?.writeText) {
      setCopyStatus('Clipboard copy is unavailable in this runtime.');
      return;
    }
    clipboard
      .writeText(name)
      .then(() => setCopyStatus(`Copied ${name}.`))
      .catch(() => setCopyStatus('Clipboard copy failed.'));
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

  function saveMobilePlaceRelationshipLink(
    config: PlaceRelationshipFieldConfig,
    targetEntryId: string,
    existingRelationship?: WorldRelationship
  ) {
    if (!selectedEntry) {
      return;
    }
    controller.saveRelationshipDraft(
      makePlaceFieldRelationship(
        selectedEntry,
        config,
        targetEntryId,
        existingRelationship
      ),
      existingRelationship
    );
  }

  function setMobileSingleRelationshipTarget(
    config: PlaceRelationshipFieldConfig,
    targetEntryId: string
  ) {
    if (!selectedEntry) {
      return;
    }
    const [primaryRelationship, ...extraRelationships] =
      getPlaceRelationshipFieldLinks(
        controller.activeWorld.relationships,
        selectedEntry,
        config
      );
    for (const relationship of extraRelationships) {
      controller.unlinkRelationship(relationship.id);
    }
    if (!targetEntryId) {
      if (primaryRelationship) {
        controller.unlinkRelationship(primaryRelationship.id);
      }
      return;
    }
    if (
      primaryRelationship &&
      getPlaceRelationshipFieldTargetId(primaryRelationship, config) ===
        targetEntryId
    ) {
      return;
    }
    saveMobilePlaceRelationshipLink(config, targetEntryId, primaryRelationship);
  }

  function toggleMobileManyRelationshipTarget(
    config: PlaceRelationshipFieldConfig,
    targetEntryId: string,
    selected: boolean
  ) {
    if (!selectedEntry) {
      return;
    }
    const fieldRelationships = getPlaceRelationshipFieldLinks(
      controller.activeWorld.relationships,
      selectedEntry,
      config
    );
    const existingRelationship = fieldRelationships.find(
      (relationship) =>
        getPlaceRelationshipFieldTargetId(relationship, config) ===
        targetEntryId
    );
    if (selected) {
      if (!existingRelationship) {
        saveMobilePlaceRelationshipLink(config, targetEntryId);
      }
      return;
    }
    if (existingRelationship) {
      controller.unlinkRelationship(existingRelationship.id);
    }
  }

  function getMobileLegacyRelationshipTextMigration(
    config: PlaceRelationshipFieldConfig,
    value: string
  ) {
    if (!selectedEntry) {
      return null;
    }
    const options = getPlaceRelationshipTargetOptions({
      codex: controller.activeWorld.codex,
      config,
      sections: controller.activeWorld.entryTypes,
      currentEntry: selectedEntry,
    });
    return buildRelationshipTextMigration(
      value,
      options.map((option) => ({
        id: option.entry.id,
        name: option.entry.name,
      })),
      config.cardinality
    );
  }

  function migrateMobileLegacyRelationshipText(
    config: PlaceRelationshipFieldConfig,
    value: string
  ) {
    if (!selectedEntry || isDraftDirty) {
      return;
    }
    const migration = getMobileLegacyRelationshipTextMigration(config, value);
    if (!migration || migration.targetIds.length === 0) {
      return;
    }
    const fieldRelationships = getPlaceRelationshipFieldLinks(
      controller.activeWorld.relationships,
      selectedEntry,
      config
    );

    if (config.cardinality === 'one') {
      const [primaryRelationship, ...extraRelationships] = fieldRelationships;
      for (const relationship of extraRelationships) {
        controller.unlinkRelationship(relationship.id);
      }
      const targetEntryId = migration.targetIds[0];
      if (
        !primaryRelationship ||
        getPlaceRelationshipFieldTargetId(primaryRelationship, config) !==
          targetEntryId
      ) {
        saveMobilePlaceRelationshipLink(
          config,
          targetEntryId,
          primaryRelationship
        );
      }
    } else {
      for (const targetEntryId of migration.targetIds) {
        const existingRelationship = fieldRelationships.find(
          (relationship) =>
            getPlaceRelationshipFieldTargetId(relationship, config) ===
            targetEntryId
        );
        if (!existingRelationship) {
          saveMobilePlaceRelationshipLink(config, targetEntryId);
        }
      }
    }
    const nextDraft = {
      ...draft,
      details: {
        ...draft.details,
        [config.fieldKey]: migration.remainingText,
      },
    };
    const savedEntry = controller.saveEntryDraft(
      section,
      nextDraft,
      selectedEntry
    );
    if (savedEntry) {
      setSelectedEntryId(savedEntry.id);
      setDraft(draftFromEntry(savedEntry, section));
    }
  }

  function migrateMobileReviewItemExactMatches(
    item: PlaceRelationshipTextReviewItem
  ) {
    if (isDraftDirty) {
      return;
    }
    applyMobileReviewItemExactMigration(item);
  }

  function applyMobileReviewItemExactMigration(
    item: PlaceRelationshipTextReviewItem
  ) {
    const entry = sectionEntries.find(
      (candidate) => candidate.id === item.entryId
    );
    const config = placeRelationshipFieldConfigs.find(
      (candidate) => candidate.fieldKey === item.fieldKey
    );
    if (!entry || !config || item.exactTargetIds.length === 0) {
      return;
    }

    const migration = buildPlaceRelationshipTextReviewMigration({
      config,
      entry,
      item,
      relationships: controller.activeWorld.relationships,
    });
    migration.relationshipIdsToDelete.forEach((relationshipId) => {
      controller.unlinkRelationship(relationshipId);
    });
    migration.relationshipsToSave.forEach(
      ({ relationship, existingRelationship }) => {
        controller.saveRelationshipDraft(relationship, existingRelationship);
      }
    );
    const savedEntry = controller.saveEntryDraft(
      section,
      draftFromEntry(
        {
          ...entry,
          fields: migration.fields,
          updatedAt: new Date().toISOString(),
        },
        section
      ),
      entry
    );
    if (savedEntry) {
      setSelectedEntryId(savedEntry.id);
      setDraft(draftFromEntry(savedEntry, section));
      setLinkedFieldQueries({});
    }
  }

  function migrateAllMobileReviewExactMatches() {
    if (isDraftDirty) {
      return;
    }
    applyAllMobileReviewExactMigrations();
  }

  function applyAllMobileReviewExactMigrations() {
    if (placeRelationshipTextReviewExactItems.length === 0) {
      return;
    }
    const migration = buildPlaceRelationshipTextReviewBatchMigration({
      codex: controller.activeWorld.codex,
      items: placeRelationshipTextReviewExactItems,
      relationships: controller.activeWorld.relationships,
      sections: controller.activeWorld.entryTypes,
    });
    migration.relationshipIdsToDelete.forEach((relationshipId) => {
      controller.unlinkRelationship(relationshipId);
    });
    migration.relationshipsToSave.forEach(
      ({ relationship, existingRelationship }) => {
        controller.saveRelationshipDraft(relationship, existingRelationship);
      }
    );
    let lastSavedEntry: WorldEntry | null = null;
    for (const update of migration.entryFieldUpdates) {
      const entry = sectionEntries.find(
        (candidate) => candidate.id === update.entryId
      );
      if (!entry) {
        continue;
      }
      const savedEntry = controller.saveEntryDraft(
        section,
        draftFromEntry(
          {
            ...entry,
            fields: update.fields,
            updatedAt: new Date().toISOString(),
          },
          section
        ),
        entry
      );
      if (savedEntry) {
        lastSavedEntry = savedEntry;
      }
    }
    if (lastSavedEntry) {
      setSelectedEntryId(lastSavedEntry.id);
      setDraft(draftFromEntry(lastSavedEntry, section));
      setLinkedFieldQueries({});
    }
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
        <SelectField
          accessibilityLabel={entryStatusFilterControl.accessibilityLabel}
          label={entryStatusFilterControl.label}
          options={entryStatusFilterControl.options}
          value={statusFilter}
          onValueChange={(value) => {
            setStatusFilter(value);
            if (value === 'archived') {
              setShowArchived(true);
            }
          }}
        />
        <SelectField
          accessibilityLabel={entrySortControl.accessibilityLabel}
          label={entrySortControl.label}
          options={entrySortOptions}
          value={sortKey}
          onValueChange={setSortKey}
        />
        <SelectField
          accessibilityLabel={entryUpdatedFilterControl.accessibilityLabel}
          label={entryUpdatedFilterControl.label}
          options={entryUpdatedFilterControl.options}
          value={updatedWithinDays === null ? '' : String(updatedWithinDays)}
          onValueChange={(value) =>
            setUpdatedWithinDays(value ? Number(value) : null)
          }
        />
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
          <CheckboxField
            accessibilityLabel={entryShowArchivedControl.accessibilityLabel}
            checked={showArchived}
            label={entryShowArchivedControl.label}
            onChange={setShowArchived}
          />
          {hasEntryFilters ? (
            <ActionButton
              label="Clear Filters"
              onPress={() => {
                setQuery('');
                setStatusFilter('');
                setActiveTag('');
                setUpdatedWithinDays(null);
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

      {placeRelationshipTextReviewItems.length > 0 ? (
        <SectionBlock title="Legacy Link Text">
          <MutedText>
            {placeRelationshipTextReviewItems.length} relationship-backed field
            {placeRelationshipTextReviewItems.length === 1 ? '' : 's'} still
            contain text that exact-match migration cannot fully resolve.
          </MutedText>
          {isDraftDirty ? (
            <MutedText>
              Save or discard the current entry draft before migrating exact
              matches.
            </MutedText>
          ) : null}
          {placeRelationshipTextReviewExactItems.length > 0 ? (
            <ButtonRow>
              <ActionButton
                disabled={isDraftDirty}
                label="Migrate All Exact Matches"
                onPress={migrateAllMobileReviewExactMatches}
              />
            </ButtonRow>
          ) : null}
          {placeRelationshipTextReviewItems.slice(0, 6).map((item) => (
            <View
              key={`${item.entryId}-${item.fieldKey}`}
              style={styles.entryRow}
            >
              <Text style={styles.entryTitle}>{item.entryName}</Text>
              <MutedText>{item.fieldLabel}</MutedText>
              <MutedText>
                Unresolved:{' '}
                {getPlaceRelationshipTextReviewUnresolvedLabel(item)}.{' '}
                {getPlaceRelationshipTextReviewExactMatchLabel(item)}
              </MutedText>
              {item.suggestedTargets.length > 0 ? (
                <MutedText>
                  Suggestions:{' '}
                  {formatLimitedList(
                    getPlaceRelationshipTextReviewSuggestionLabels(item),
                    '; '
                  )}
                </MutedText>
              ) : null}
              <ButtonRow>
                {item.exactMatchCount > 0 ? (
                  <ActionButton
                    disabled={isDraftDirty}
                    label="Migrate Exact Matches"
                    onPress={() => migrateMobileReviewItemExactMatches(item)}
                  />
                ) : null}
                <ActionButton
                  label="Review Entry"
                  onPress={() => chooseEntry(item.entryId)}
                />
              </ButtonRow>
            </View>
          ))}
          {placeRelationshipTextReviewItems.length > 6 ? (
            <MutedText>
              Showing 6 of {placeRelationshipTextReviewItems.length}. Review
              affected entries to continue cleanup.
            </MutedText>
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
          {selectedEntryRelationshipGroups.length > 0 ? (
            selectedEntryRelationshipGroups.map((group) => (
              <View key={group.id} style={styles.relationshipGroup}>
                <Text style={styles.relationshipGroupTitle}>{group.label}</Text>
                {group.relationships.map((relationship) => (
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
                ))}
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
          onChangeText={(value) => {
            setCopyStatus('');
            setDraft((current) => ({ ...current, name: value }));
          }}
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
        <View style={styles.notesPreview}>
          <Text style={styles.notesPreviewTitle}>Notes preview</Text>
          {draft.notes.trim() ? (
            <Text style={styles.notesPreviewText}>{draft.notes}</Text>
          ) : (
            <MutedText>No notes to preview yet.</MutedText>
          )}
        </View>
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
        <SelectField
          accessibilityLabel={entryDraftStatusControl.accessibilityLabel}
          label={entryDraftStatusControl.label}
          options={entryDraftStatusControl.options}
          value={draft.status}
          onValueChange={(value) =>
            setDraft((current) => ({ ...current, status: value }))
          }
        />
        <CheckboxField
          accessibilityLabel={entryPinnedControl.accessibilityLabel}
          checked={draft.pinned}
          label={entryPinnedControl.label}
          onChange={(checked) =>
            setDraft((current) => ({ ...current, pinned: checked }))
          }
        />
        {editableDetailFields.map((field) => {
          const currentValue = draft.details[field.key] ?? '';
          const suggestions = (detailFieldSuggestions[field.key] ?? [])
            .filter((suggestion) => suggestion !== currentValue)
            .slice(0, MOBILE_DETAIL_SUGGESTION_LIMIT);
          return (
            <View key={field.key} style={styles.fieldWithSuggestions}>
              <Field
                label={field.label}
                value={currentValue}
                multiline={field.multiline}
                onChangeText={(value) => setDetailValue(field.key, value)}
              />
              {suggestions.length > 0 ? (
                <ButtonRow>
                  {suggestions.map((suggestion) => (
                    <ActionButton
                      key={suggestion}
                      label={suggestion}
                      onPress={() => setDetailValue(field.key, suggestion)}
                    />
                  ))}
                </ButtonRow>
              ) : null}
            </View>
          );
        })}
        {selectedEntry?.kind === 'place' &&
        activeRelationshipFieldConfigs.length > 0 ? (
          <View style={styles.relationshipGroup}>
            <Text style={styles.relationshipGroupTitle}>
              Linked place fields
            </Text>
            <MutedText>
              These fields are saved as relationships once this entry has no
              unsaved changes.
            </MutedText>
            {isDraftDirty ? (
              <MutedText>
                Save entry changes before editing linked fields.
              </MutedText>
            ) : (
              activeRelationshipFieldConfigs.map((config) => {
                const fieldRelationships = getPlaceRelationshipFieldLinks(
                  controller.activeWorld.relationships,
                  selectedEntry,
                  config
                );
                const selectedTargetIds = new Set(
                  fieldRelationships.map((relationship) =>
                    getPlaceRelationshipFieldTargetId(relationship, config)
                  )
                );
                const options = getPlaceRelationshipTargetOptions({
                  codex: controller.activeWorld.codex,
                  config,
                  includedTargetIds: selectedTargetIds,
                  sections: controller.activeWorld.entryTypes,
                  currentEntry: selectedEntry,
                });
                const fieldQuery = linkedFieldQueries[config.fieldKey] ?? '';
                const filteredOptions = filterPlaceRelationshipTargetOptions(
                  options,
                  fieldQuery,
                  selectedTargetIds
                );
                const visibleOptions = limitPlaceRelationshipTargetOptions(
                  filteredOptions,
                  selectedTargetIds,
                  MOBILE_RELATIONSHIP_TARGET_LIMIT
                );
                const hiddenOptionCount =
                  filteredOptions.length - visibleOptions.length;
                return (
                  <View key={config.fieldKey} style={styles.linkedField}>
                    <Text style={styles.relationshipGroupTitle}>
                      {config.label}
                    </Text>
                    {options.length > 0 ? (
                      <>
                        <Field
                          autoCapitalize="none"
                          autoCorrect={false}
                          label={`Search ${config.label}`}
                          value={fieldQuery}
                          onChangeText={(value) =>
                            setLinkedFieldQueries((current) => ({
                              ...current,
                              [config.fieldKey]: value,
                            }))
                          }
                          placeholder="Filter linked record targets"
                        />
                        {filteredOptions.length === 0 ? (
                          <MutedText>
                            No matching records. Clear the search to see all
                            targets.
                          </MutedText>
                        ) : null}
                        {config.cardinality === 'one' ? (
                          <ButtonRow>
                            <ActionButton
                              label="No Link"
                              selected={fieldRelationships.length === 0}
                              tone={
                                fieldRelationships.length === 0
                                  ? 'accent'
                                  : 'neutral'
                              }
                              onPress={() =>
                                setMobileSingleRelationshipTarget(config, '')
                              }
                            />
                            {visibleOptions.map((option) => (
                              <ActionButton
                                key={option.entry.id}
                                label={option.entry.name}
                                selected={selectedTargetIds.has(
                                  option.entry.id
                                )}
                                tone={
                                  selectedTargetIds.has(option.entry.id)
                                    ? 'accent'
                                    : 'neutral'
                                }
                                onPress={() =>
                                  setMobileSingleRelationshipTarget(
                                    config,
                                    option.entry.id
                                  )
                                }
                              />
                            ))}
                          </ButtonRow>
                        ) : (
                          <ButtonRow>
                            {visibleOptions.map((option) => {
                              const selected = selectedTargetIds.has(
                                option.entry.id
                              );
                              return (
                                <ActionButton
                                  key={option.entry.id}
                                  label={option.entry.name}
                                  selected={selected}
                                  tone={selected ? 'accent' : 'neutral'}
                                  onPress={() =>
                                    toggleMobileManyRelationshipTarget(
                                      config,
                                      option.entry.id,
                                      !selected
                                    )
                                  }
                                />
                              );
                            })}
                          </ButtonRow>
                        )}
                        {hiddenOptionCount > 0 ? (
                          <MutedText>
                            Showing {visibleOptions.length} of{' '}
                            {filteredOptions.length} matches. Refine the search
                            to show {hiddenOptionCount} more record
                            {hiddenOptionCount === 1 ? '' : 's'}.
                          </MutedText>
                        ) : null}
                      </>
                    ) : (
                      <MutedText>
                        Create matching records before linking this field.
                      </MutedText>
                    )}
                  </View>
                );
              })
            )}
            {legacyRelationshipTextValues.length > 0 ? (
              <View style={styles.linkedField}>
                <Text style={styles.relationshipGroupTitle}>
                  Saved text link notes
                </Text>
                {legacyRelationshipTextValues.map((field) => {
                  const migration = !isDraftDirty
                    ? getMobileLegacyRelationshipTextMigration(
                        field.config,
                        field.value
                      )
                    : null;
                  return (
                    <View key={field.key} style={styles.cleanupRow}>
                      <MutedText>
                        {field.label}: {field.value}
                      </MutedText>
                      {migration ? (
                        <MutedText>
                          {migration.targetIds.length > 0
                            ? `${migration.targetIds.length} exact match${
                                migration.targetIds.length === 1 ? '' : 'es'
                              } found.`
                            : 'No exact matches found.'}
                          {migration.remainingText
                            ? ' Unmatched text will remain.'
                            : ''}
                        </MutedText>
                      ) : null}
                      {migration?.targetIds.length ? (
                        <ActionButton
                          label="Migrate Exact Matches"
                          onPress={() =>
                            migrateMobileLegacyRelationshipText(
                              field.config,
                              field.value
                            )
                          }
                        />
                      ) : null}
                      <ActionButton
                        label="Clear"
                        onPress={() => setDetailValue(field.key, '')}
                      />
                    </View>
                  );
                })}
              </View>
            ) : null}
          </View>
        ) : null}
        {hiddenDetailValues.length > 0 ? (
          <View style={styles.relationshipGroup}>
            <Text style={styles.relationshipGroupTitle}>
              Hidden place details
            </Text>
            {hiddenDetailValues.map((field) => (
              <View key={field.key} style={styles.cleanupRow}>
                <MutedText>
                  {field.label}: {field.value}
                </MutedText>
                <ActionButton
                  label="Clear"
                  onPress={() => setDetailValue(field.key, '')}
                />
              </View>
            ))}
          </View>
        ) : null}
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
                setLinkedFieldQueries({});
              }
            }}
          />
          <ActionButton label="New Draft" onPress={resetDraft} />
          <ActionButton label="Copy Name" onPress={copyEntryName} />
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
        {copyStatus ? (
          <StatusText tone={getMobileFeedbackTone(copyStatus)}>
            {copyStatus}
          </StatusText>
        ) : null}
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
  relationshipGroup: {
    gap: valgaronSpacing.sm,
  },
  relationshipGroupTitle: {
    color: valgaronColors.heading,
    fontSize: valgaronTypography.sizes.sm,
    fontWeight: '700',
  },
  notesPreview: {
    borderColor: valgaronColors.border,
    borderRadius: valgaronRadius.md,
    borderWidth: 1,
    gap: valgaronSpacing.sm,
    padding: valgaronSpacing.md,
  },
  notesPreviewTitle: {
    color: valgaronColors.heading,
    fontSize: valgaronTypography.sizes.sm,
    fontWeight: '700',
  },
  notesPreviewText: {
    color: valgaronColors.text,
    fontSize: valgaronTypography.sizes.sm,
    lineHeight: 20,
  },
  fieldWithSuggestions: {
    gap: valgaronSpacing.sm,
  },
  linkedField: {
    borderColor: valgaronColors.border,
    borderRadius: valgaronRadius.md,
    borderWidth: 1,
    gap: valgaronSpacing.sm,
    padding: valgaronSpacing.md,
  },
  cleanupRow: {
    gap: valgaronSpacing.xs,
  },
});
