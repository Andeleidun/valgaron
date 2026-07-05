import { useEffect, useMemo, useRef, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { Text, View, StyleSheet } from 'react-native';
import type {
  EntryDraft,
  EntrySortControlValue,
  RelationshipTextReviewItem,
  RelationshipFieldConfig,
  WorldEntry,
  WorldEntryStatus,
  WorldRelationship,
  WorldSectionConfig,
} from '@valgaron/core';
import {
  buildRelationshipTextReviewBatchMigration,
  buildRelationshipTextReviewMigration,
  buildRelationshipTextReviewSuggestionMigration,
  applyEntrySectionTemplate,
  createEntryTemplateDraft,
  createSectionEntryDraft,
  draftFromEntry,
  entryDraftStatusControl,
  entryEditorCopy,
  entryListCopy,
  entryNameCopyFeedback,
  entryPinnedControl,
  entryShowArchivedControl,
  entrySortControl,
  entryStatusFilterControl,
  entryUpdatedFilterControl,
  filterRelationshipEntryPickerItems,
  formatHiddenResultCountMessage,
  getFeedbackTone,
  getCodexHelpRoute,
  getCodexScreenIntro,
  getEntryListModel,
  getEntrySectionNavigationOptions,
  getEntryTagFilterOptions,
  getEntries,
  getEntryEditorBaseFields,
  getEntryEditorNotesPreviewModel,
  getEntryEditorSelectedActionModel,
  getLimitedResultModel,
  getEntryListEmptyStateModel,
  getEntryEditorNewTitle,
  getEntryEditorSubmitLabel,
  getEntrySortControlOptions,
  getEntryRelationshipGroupsModel,
  getEntryNameCopiedMessage,
  getEntryNameCopyText,
  getRelationshipEntryRoute,
  getRelationshipFieldConfigsForEntryKind,
  getRelationshipManagementRoute,
  hasUnsavedChanges,
  relationshipFieldCopy,
  getRelationshipFieldLinks,
  getRelationshipFieldTextMigration,
  getRelationshipFieldTargetId,
  getRelationshipTextReviewSummary,
  getRelationshipTextMigrationStatus,
  getRelationshipTextReviewExactMatchLabel,
  getRelationshipTextReviewItems,
  getRelationshipTextReviewSuggestionLabels,
  getRelationshipTextReviewUnresolvedLabel,
  relationshipTextReviewCopy,
  formatLimitedTextList,
  getTimelineSummaryModel,
  getTimelineBrowseModel,
  buildRelationshipFieldTextMigrationOperation,
  makeFieldRelationship,
  mobileFeatureDisplayLimits,
  relationshipFeatureCopy,
  timelineFeatureCopy,
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
import { getMobileEntryEditorModel } from '../state/mobileEntryEditorModel';
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
import { confirmDiscardUnsavedChangesOnMobile } from './unsavedChangesConfirm';

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
  const [sortKey, setSortKey] = useState<EntrySortControlValue>(() =>
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
  const [expandedLinkedFieldTargets, setExpandedLinkedFieldTargets] = useState<
    Record<string, boolean>
  >({});
  const initialRequestedEntry = getRequestedSectionEntry(
    controller.activeWorld.codex,
    section,
    requestedEntryId
  );
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(
    () => initialRequestedEntry?.id ?? null
  );
  const [draft, setDraft] = useState<EntryDraft>(() =>
    initialRequestedEntry
      ? draftFromEntry(initialRequestedEntry, section)
      : createSectionEntryDraft(section)
  );
  const [copyStatus, setCopyStatus] = useState('');
  const sectionNavigationOptions = useMemo(
    () => getEntrySectionNavigationOptions(controller.sections, section.id),
    [controller.sections, section.id]
  );
  const entries = useMemo(
    () =>
      getEntryListModel(controller.activeWorld, section, query, {
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
  const tagFilterOptions = useMemo(
    () =>
      getEntryTagFilterOptions(
        getEntries(controller.activeWorld.codex, section.id),
        activeTag,
        { includeAllOption: true }
      ),
    [activeTag, controller.activeWorld.codex, section.id]
  );
  const timelineSummary = useMemo(
    () =>
      section.id === 'timeline'
        ? getTimelineSummaryModel(controller.activeWorld)
        : null,
    [controller.activeWorld, section.id]
  );
  const timelineBrowse = useMemo(
    () =>
      section.id === 'timeline'
        ? getTimelineBrowseModel(controller.activeWorld, {
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
    const involvedEntries = timelineBrowse?.involvedEntries ?? [];
    return filterRelationshipEntryPickerItems(
      involvedEntries,
      timelineInvolvedEntryQuery
    );
  }, [timelineBrowse, timelineInvolvedEntryQuery]);
  const timelineInvolvedEntryModel = getLimitedResultModel(
    timelineInvolvedEntryMatches,
    mobileFeatureDisplayLimits.pickerResults
  );
  const timelineInvolvedEntryOptions = timelineInvolvedEntryModel.visibleItems;
  const hiddenTimelineInvolvedEntryCount =
    timelineInvolvedEntryModel.hiddenCount;
  const displayedTimelineGroups = useMemo(
    () =>
      (timelineBrowse?.groups ?? []).map((group) => {
        const eventModel = getLimitedResultModel(
          group.events,
          mobileFeatureDisplayLimits.timelineGroupEvents
        );
        return {
          ...group,
          events: eventModel.visibleItems,
          hiddenEventCount: eventModel.hiddenCount,
        };
      }),
    [timelineBrowse]
  );
  const sectionEntries = getEntries(controller.activeWorld.codex, section.id);
  const entryResultModel = getLimitedResultModel(
    entries,
    mobileFeatureDisplayLimits.entryResults
  );
  const displayedEntries = entryResultModel.visibleItems.map(
    (entry, index) => ({
      entry,
      index,
    })
  );
  const hiddenEntryCount = entryResultModel.hiddenCount;
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
  const entryListEmptyState = getEntryListEmptyStateModel({
    archivedCount: sectionArchivedEntryCount,
    hasActiveFilters: hasEntryFilters,
    section,
    showArchived,
    totalCount: sectionEntryCount,
  });
  const hasTimelineFilters = Boolean(
    timelineEraFilter ||
      timelineInvolvedEntryFilter ||
      timelineInvolvedEntryQuery
  );
  const selectedEntryRelationshipGroups = useMemo(
    () =>
      selectedEntry
        ? getEntryRelationshipGroupsModel(controller.activeWorld, selectedEntry)
        : [],
    [controller.activeWorld, selectedEntry]
  );
  const relationshipTextReviewItems = useMemo(
    () =>
      getRelationshipFieldConfigsForEntryKind(section.kind).length > 0
        ? getRelationshipTextReviewItems({
            codex: controller.activeWorld.codex,
            sections: controller.activeWorld.entryTypes,
          }).filter((item) => item.sectionId === section.id)
        : [],
    [controller.activeWorld.codex, controller.activeWorld.entryTypes, section]
  );
  const relationshipTextReviewExactItems = relationshipTextReviewItems.filter(
    (item) => item.exactMatchCount > 0
  );
  const entrySortOptions = useMemo(
    () =>
      getEntrySortControlOptions({
        includeTimelineOrder: section.id === 'timeline',
      }),
    [section.id]
  );
  const baseFields = getEntryEditorBaseFields(section, draft);
  const notesPreview = getEntryEditorNotesPreviewModel(draft.notes);
  const editorModel = useMemo(
    () =>
      getMobileEntryEditorModel({
        codex: controller.activeWorld.codex,
        draft,
        expandedLinkedFieldTargets,
        linkedFieldQueries,
        relationships: controller.activeWorld.relationships,
        section,
        sectionEntries,
        sections: controller.activeWorld.entryTypes,
        selectedEntry,
      }),
    [
      controller.activeWorld.codex,
      controller.activeWorld.entryTypes,
      controller.activeWorld.relationships,
      draft,
      expandedLinkedFieldTargets,
      linkedFieldQueries,
      section,
      sectionEntries,
      selectedEntry,
    ]
  );
  const {
    activeRelationshipFieldConfigs,
    detailFieldGroups,
    hiddenDetailCleanup,
    legacyRelationshipTextValues,
    linkedFieldDisplayModels,
  } = editorModel;
  const selectedActionModel = selectedEntry
    ? getEntryEditorSelectedActionModel(selectedEntry)
    : null;
  const baselineDraft = selectedEntry
    ? draftFromEntry(selectedEntry, section)
    : createSectionEntryDraft(section);
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
    setDraft(createSectionEntryDraft(fallbackSection));
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
        setExpandedLinkedFieldTargets({});
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
        setDraft(createSectionEntryDraft(nextSection));
        setLinkedFieldQueries({});
        setExpandedLinkedFieldTargets({});
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
          setExpandedLinkedFieldTargets({});
        } else {
          setSelectedEntryId(null);
          setDraft(createSectionEntryDraft(nextSection));
          setLinkedFieldQueries({});
          setExpandedLinkedFieldTargets({});
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
      confirmDiscardUnsavedChangesOnMobile(true, applyRouteState, () => {
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
    confirmDiscardUnsavedChangesOnMobile(isDraftDirty, () => {
      setSectionId(nextSection.id);
      setQuery('');
      setSelectedEntryId(null);
      setActiveTag('');
      setTimelineEraFilter('');
      setTimelineInvolvedEntryFilter('');
      setTimelineInvolvedEntryQuery('');
      setLinkedFieldQueries({});
      setExpandedLinkedFieldTargets({});
      setStatusFilter('');
      setShowArchived(false);
      setSortKey(
        nextSection.id === 'timeline' ? 'timeline-order' : 'updated-desc'
      );
      setDraft(createSectionEntryDraft(nextSection));
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
    confirmDiscardUnsavedChangesOnMobile(isDraftDirty, () => {
      setSelectedEntryId(entry.id);
      setDraft(draftFromEntry(entry, section));
      setLinkedFieldQueries({});
      setExpandedLinkedFieldTargets({});
    });
  }

  function resetDraft(force = false) {
    const reset = () => {
      setSelectedEntryId(null);
      setDraft(createSectionEntryDraft(section));
      setLinkedFieldQueries({});
      setExpandedLinkedFieldTargets({});
    };
    if (force) {
      reset();
      return;
    }
    confirmDiscardUnsavedChangesOnMobile(isDraftDirty, reset);
  }

  function clearSavedDraft() {
    setSelectedEntryId(null);
    setDraft(createSectionEntryDraft(section));
  }

  function duplicateSelectedEntry(entry: NonNullable<typeof selectedEntry>) {
    confirmDiscardUnsavedChangesOnMobile(isDraftDirty, () => {
      const duplicate = controller.duplicateEntry(section, entry);
      setSelectedEntryId(duplicate.id);
      setDraft(draftFromEntry(duplicate, section));
      setLinkedFieldQueries({});
      setExpandedLinkedFieldTargets({});
      setShowArchived(false);
    });
  }

  function useSelectedEntryAsTemplate(
    entry: NonNullable<typeof selectedEntry>
  ) {
    confirmDiscardUnsavedChangesOnMobile(isDraftDirty, () => {
      setSelectedEntryId(null);
      setDraft(createEntryTemplateDraft(entry, section));
      setLinkedFieldQueries({});
      setExpandedLinkedFieldTargets({});
    });
  }

  function archiveSelectedEntry(entry: NonNullable<typeof selectedEntry>) {
    confirmDiscardUnsavedChangesOnMobile(isDraftDirty, () => {
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
        setExpandedLinkedFieldTargets({});
        setShowArchived(true);
      }
    });
  }

  function deleteSelectedEntry(entry: NonNullable<typeof selectedEntry>) {
    confirmDiscardUnsavedChangesOnMobile(isDraftDirty, () => {
      confirmMobileDestructiveAction('delete-entry', () => {
        controller.permanentlyDeleteEntry(entry);
        clearSavedDraft();
      });
    });
  }

  function copyEntryName() {
    const name = getEntryNameCopyText(selectedEntry?.name ?? draft.name);
    if (!name) {
      setCopyStatus(entryNameCopyFeedback.missingName);
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
      setCopyStatus(entryNameCopyFeedback.unavailable);
      return;
    }
    clipboard
      .writeText(name)
      .then(() => setCopyStatus(getEntryNameCopiedMessage(name)))
      .catch(() => setCopyStatus(entryNameCopyFeedback.failed));
  }

  function applySectionTemplate() {
    setDraft((current) => applyEntrySectionTemplate(current, section));
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

  function saveMobileRelationshipLink(
    config: RelationshipFieldConfig,
    targetEntryId: string,
    existingRelationship?: WorldRelationship
  ) {
    if (!selectedEntry) {
      return;
    }
    controller.saveRelationshipDraft(
      makeFieldRelationship(
        selectedEntry,
        config,
        targetEntryId,
        existingRelationship
      ),
      existingRelationship
    );
  }

  function setMobileSingleRelationshipTarget(
    config: RelationshipFieldConfig,
    targetEntryId: string
  ) {
    if (!selectedEntry) {
      return;
    }
    const [primaryRelationship, ...extraRelationships] =
      getRelationshipFieldLinks(
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
      getRelationshipFieldTargetId(primaryRelationship, config) ===
        targetEntryId
    ) {
      return;
    }
    saveMobileRelationshipLink(config, targetEntryId, primaryRelationship);
  }

  function toggleMobileManyRelationshipTarget(
    config: RelationshipFieldConfig,
    targetEntryId: string,
    selected: boolean
  ) {
    if (!selectedEntry) {
      return;
    }
    const fieldRelationships = getRelationshipFieldLinks(
      controller.activeWorld.relationships,
      selectedEntry,
      config
    );
    const existingRelationship = fieldRelationships.find(
      (relationship) =>
        getRelationshipFieldTargetId(relationship, config) === targetEntryId
    );
    if (selected) {
      if (!existingRelationship) {
        saveMobileRelationshipLink(config, targetEntryId);
      }
      return;
    }
    if (existingRelationship) {
      controller.unlinkRelationship(existingRelationship.id);
    }
  }

  function clearMobileManyRelationshipTargets(config: RelationshipFieldConfig) {
    if (!selectedEntry) {
      return;
    }
    getRelationshipFieldLinks(
      controller.activeWorld.relationships,
      selectedEntry,
      config
    ).forEach((relationship) => controller.unlinkRelationship(relationship.id));
  }

  function getMobileLegacyRelationshipTextMigration(
    config: RelationshipFieldConfig,
    value: string
  ) {
    if (!selectedEntry) {
      return null;
    }
    return getRelationshipFieldTextMigration({
      codex: controller.activeWorld.codex,
      config,
      currentEntry: selectedEntry,
      sections: controller.activeWorld.entryTypes,
      value,
    });
  }

  function migrateMobileLegacyRelationshipText(
    config: RelationshipFieldConfig,
    value: string
  ) {
    if (!selectedEntry || isDraftDirty) {
      return;
    }
    const migration = getMobileLegacyRelationshipTextMigration(config, value);
    if (!migration || migration.targetIds.length === 0) {
      return;
    }
    const operation = buildRelationshipFieldTextMigrationOperation({
      config,
      entry: selectedEntry,
      migration,
      relationships: controller.activeWorld.relationships,
    });
    operation.relationshipIdsToDelete.forEach(controller.unlinkRelationship);
    operation.relationshipsToSave.forEach(
      ({ existingRelationship, relationship }) => {
        controller.saveRelationshipDraft(relationship, existingRelationship);
      }
    );
    const nextDraft = {
      ...draft,
      details: {
        ...draft.details,
        [config.fieldKey]: operation.fields[config.fieldKey] ?? '',
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
    item: RelationshipTextReviewItem
  ) {
    if (isDraftDirty) {
      return;
    }
    applyMobileReviewItemExactMigration(item);
  }

  function migrateMobileReviewItemSuggestion(
    item: RelationshipTextReviewItem,
    fragment: string,
    targetEntryId: string
  ) {
    if (isDraftDirty) {
      return;
    }
    const entry = sectionEntries.find(
      (candidate) => candidate.id === item.entryId
    );
    if (!entry) {
      return;
    }
    const config = getRelationshipFieldConfigsForEntryKind(entry.kind).find(
      (candidate) => candidate.fieldKey === item.fieldKey
    );
    if (!config) {
      return;
    }
    const migration = buildRelationshipTextReviewSuggestionMigration({
      config,
      entry,
      fragment,
      item,
      relationships: controller.activeWorld.relationships,
      targetEntryId,
    });
    if (!migration) {
      return;
    }
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
      setExpandedLinkedFieldTargets({});
    }
  }

  function applyMobileReviewItemExactMigration(
    item: RelationshipTextReviewItem
  ) {
    const entry = sectionEntries.find(
      (candidate) => candidate.id === item.entryId
    );
    if (!entry || item.exactTargetIds.length === 0) {
      return;
    }
    const config = getRelationshipFieldConfigsForEntryKind(entry.kind).find(
      (candidate) => candidate.fieldKey === item.fieldKey
    );
    if (!config) {
      return;
    }

    const migration = buildRelationshipTextReviewMigration({
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
      setExpandedLinkedFieldTargets({});
    }
  }

  function migrateAllMobileReviewExactMatches() {
    if (isDraftDirty) {
      return;
    }
    applyAllMobileReviewExactMigrations();
  }

  function applyAllMobileReviewExactMigrations() {
    if (relationshipTextReviewExactItems.length === 0) {
      return;
    }
    const migration = buildRelationshipTextReviewBatchMigration({
      codex: controller.activeWorld.codex,
      items: relationshipTextReviewExactItems,
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
      setExpandedLinkedFieldTargets({});
    }
  }

  function openRelatedEntryRoute(route: ReturnType<typeof getMobileRouteHref>) {
    confirmDiscardUnsavedChangesOnMobile(isDraftDirty, () => {
      allowNextRouteReplaceRef.current = true;
      router.push({ ...route });
    });
  }

  function openExternalRoute(route: ReturnType<typeof getMobileRouteHref>) {
    confirmDiscardUnsavedChangesOnMobile(isDraftDirty, () => {
      router.push({ ...route });
    });
  }

  return (
    <ScreenScroll>
      <ScreenHeader title={intro.title} detail={intro.detail} />

      <SectionBlock title="Sections">
        <ButtonRow>
          {sectionNavigationOptions.map((option) => (
            <ActionButton
              key={option.id}
              label={option.label}
              selected={option.isActive}
              testID={`entries.section.${option.id}`}
              tone={option.isActive ? 'accent' : 'neutral'}
              onPress={() => chooseSection(option.section)}
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
        {tagFilterOptions.length > 0 ? (
          <ButtonRow>
            {tagFilterOptions.map((option) => (
              <ActionButton
                key={option.value || 'all-tags'}
                label={option.label}
                selected={option.isActive}
                tone={option.isActive ? 'accent' : 'neutral'}
                onPress={() => setActiveTag(option.nextValue)}
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
              label={entryListCopy.clearFiltersLabel}
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
        <SectionBlock title={timelineFeatureCopy.timelineBrowserTitle}>
          <ButtonRow>
            <ActionButton
              label={entryListCopy.timelineHelpLabel}
              onPress={() =>
                openExternalRoute(
                  getMobileRouteHref(getCodexHelpRoute('timeline'))
                )
              }
            />
          </ButtonRow>
          <MutedText>
            {timelineFeatureCopy.highlightsLabel}:{' '}
            {timelineSummary.highlightNames.length > 0
              ? timelineSummary.highlightNames.join(', ')
              : timelineFeatureCopy.noVisibleTimelineEvents}
          </MutedText>
          <MutedText>
            {timelineFeatureCopy.unorderedLabel}:{' '}
            {timelineSummary.unorderedCount}.{' '}
            {timelineFeatureCopy.duplicateOrderGroupsLabel}:{' '}
            {timelineSummary.duplicateOrderCount}.{' '}
            {timelineFeatureCopy.unlinkedEventsLabel}:{' '}
            {timelineSummary.unlinkedCount}.
          </MutedText>
          {timelineBrowse ? (
            <>
              {timelineBrowse.eras.length > 0 ? (
                <ButtonRow>
                  <ActionButton
                    label={timelineFeatureCopy.anyEraLabel}
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
                    label={timelineFeatureCopy.searchInvolvedFiltersLabel}
                    value={timelineInvolvedEntryQuery}
                    onChangeText={setTimelineInvolvedEntryQuery}
                    placeholder="Record name, section, tag, status, or id"
                  />
                  <ButtonRow>
                    <ActionButton
                      label={timelineFeatureCopy.anyInvolvedLabel}
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
                      {formatHiddenResultCountMessage({
                        hiddenCount: hiddenTimelineInvolvedEntryCount,
                        itemLabel: 'record',
                        refinementLabel: 'involved search',
                      })}
                    </MutedText>
                  ) : null}
                  {timelineInvolvedEntryOptions.length === 0 ? (
                    <MutedText>
                      {timelineFeatureCopy.noInvolvedSearchMatches}
                    </MutedText>
                  ) : null}
                </>
              ) : null}
              {hasTimelineFilters ? (
                <ButtonRow>
                  <ActionButton
                    label={timelineFeatureCopy.clearTimelineFiltersLabel}
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
                        {event.contextText} - {event.name}
                        {event.involvedEntryNames.length > 0
                          ? ` (${event.involvedEntryNames.join(', ')})`
                          : ''}
                      </MutedText>
                    ))}
                    {group.hiddenEventCount > 0 ? (
                      <MutedText>
                        {formatHiddenResultCountMessage({
                          hiddenCount: group.hiddenEventCount,
                          itemLabel: 'event',
                          refinementLabel: 'timeline filters',
                          suffix: 'in this era',
                        })}
                      </MutedText>
                    ) : null}
                  </View>
                ))
              ) : (
                <MutedText>
                  {timelineFeatureCopy.noTimelineEventsMatchFilters}
                </MutedText>
              )}
              {timelineBrowse.unorderedNames.length > 0 ? (
                <MutedText>
                  {timelineFeatureCopy.needsOrderLabel}:{' '}
                  {formatLimitedTextList({
                    values: timelineBrowse.unorderedNames,
                    limit: mobileFeatureDisplayLimits.timelineDiagnostics,
                  })}
                  .
                </MutedText>
              ) : null}
              {timelineBrowse.duplicateOrderLabels.length > 0 ? (
                <MutedText>
                  {timelineFeatureCopy.duplicateOrdersLabel}:{' '}
                  {formatLimitedTextList({
                    values: timelineBrowse.duplicateOrderLabels,
                    separator: '; ',
                    limit: mobileFeatureDisplayLimits.timelineDiagnostics,
                  })}
                  .
                </MutedText>
              ) : null}
              {timelineBrowse.unlinkedNames.length > 0 ? (
                <MutedText>
                  {timelineFeatureCopy.noInvolvedRecordsLabel}:{' '}
                  {formatLimitedTextList({
                    values: timelineBrowse.unlinkedNames,
                    limit: mobileFeatureDisplayLimits.timelineDiagnostics,
                  })}
                  .
                </MutedText>
              ) : null}
            </>
          ) : null}
        </SectionBlock>
      ) : null}

      {relationshipTextReviewItems.length > 0 ? (
        <SectionBlock title={relationshipTextReviewCopy.title}>
          <MutedText>
            {getRelationshipTextReviewSummary(
              relationshipTextReviewItems.length
            )}
          </MutedText>
          {isDraftDirty ? (
            <MutedText>
              {relationshipTextReviewCopy.draftBlockedMessage}
            </MutedText>
          ) : null}
          {relationshipTextReviewExactItems.length > 0 ? (
            <ButtonRow>
              <ActionButton
                disabled={isDraftDirty}
                label={relationshipTextReviewCopy.batchExactMatchLabel}
                onPress={migrateAllMobileReviewExactMatches}
              />
            </ButtonRow>
          ) : null}
          {relationshipTextReviewItems
            .slice(0, mobileFeatureDisplayLimits.relationshipTextReviewItems)
            .map((item) => (
              <View
                key={`${item.entryId}-${item.fieldKey}`}
                style={styles.entryRow}
              >
                <Text style={styles.entryTitle}>{item.entryName}</Text>
                <MutedText>{item.fieldLabel}</MutedText>
                <MutedText>
                  Unresolved: {getRelationshipTextReviewUnresolvedLabel(item)}.{' '}
                  {getRelationshipTextReviewExactMatchLabel(item)}
                </MutedText>
                {item.suggestedTargets.length > 0 ? (
                  <>
                    <MutedText>
                      Suggestions:{' '}
                      {formatLimitedTextList({
                        values: getRelationshipTextReviewSuggestionLabels(item),
                        separator: '; ',
                        limit: mobileFeatureDisplayLimits.timelineDiagnostics,
                      })}
                    </MutedText>
                    {item.suggestedTargets.map((suggestion) => (
                      <ButtonRow key={suggestion.fragment}>
                        {suggestion.targets.map((target) => (
                          <ActionButton
                            accessibilityLabel={`Link ${suggestion.fragment} to ${target.name}`}
                            disabled={isDraftDirty}
                            key={target.id}
                            label={`Link ${target.name}`}
                            onPress={() =>
                              migrateMobileReviewItemSuggestion(
                                item,
                                suggestion.fragment,
                                target.id
                              )
                            }
                          />
                        ))}
                      </ButtonRow>
                    ))}
                  </>
                ) : null}
                <ButtonRow>
                  {item.exactMatchCount > 0 ? (
                    <ActionButton
                      disabled={isDraftDirty}
                      label={
                        relationshipTextReviewCopy.exactMatchMigrationLabel
                      }
                      onPress={() => migrateMobileReviewItemExactMatches(item)}
                    />
                  ) : null}
                  <ActionButton
                    label={relationshipTextReviewCopy.reviewEntryLabel}
                    onPress={() => chooseEntry(item.entryId)}
                  />
                </ButtonRow>
              </View>
            ))}
          {relationshipTextReviewItems.length >
          mobileFeatureDisplayLimits.relationshipTextReviewItems ? (
            <MutedText>
              Showing {mobileFeatureDisplayLimits.relationshipTextReviewItems}{' '}
              of {relationshipTextReviewItems.length}. Review affected entries
              to continue cleanup.
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
                    {entry.statusLabel} - {entry.tagsText}
                  </MutedText>
                  <MutedText>{entry.summaryText}</MutedText>
                  <MutedText>{entry.updatedText}</MutedText>
                </View>
                <ActionButton
                  accessibilityLabel={`Edit ${entry.name}`}
                  label="Edit"
                  testID={`entries.entry.${entry.id}`}
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
                {formatHiddenResultCountMessage({
                  hiddenCount: hiddenEntryCount,
                  itemLabel: 'record',
                  refinementLabel: 'section search or filters',
                })}
              </MutedText>
            ) : null}
          </>
        ) : (
          <>
            <MutedText>{entryListEmptyState.title}</MutedText>
            <MutedText>{entryListEmptyState.detail}</MutedText>
          </>
        )}
      </SectionBlock>

      {selectedEntry ? (
        <SectionBlock title={relationshipFeatureCopy.selectedEntrySectionTitle}>
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
                                getRelationshipEntryRoute({
                                  entryId: relationship.relatedEntryId,
                                  name: relationship.relatedEntryName,
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
            <>
              <MutedText>
                {relationshipFeatureCopy.selectedEntryEmptyTitle}
              </MutedText>
              <MutedText>
                {relationshipFeatureCopy.selectedEntryEmptyDetail}
              </MutedText>
            </>
          )}
          <ButtonRow>
            <ActionButton
              accessibilityLabel={`Manage links for ${selectedEntry.name}`}
              label={relationshipFeatureCopy.manageLinksLabel}
              onPress={() =>
                openExternalRoute(
                  getMobileRouteHref(
                    getRelationshipManagementRoute({
                      entryId: selectedEntry.id,
                      name: selectedEntry.name,
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
            : getEntryEditorNewTitle(section)
        }
        titleTestID="entries.editor.title"
      >
        {controller.formMessage ? (
          <StatusText tone={getFeedbackTone(controller.formMessage)}>
            {controller.formMessage}
          </StatusText>
        ) : null}
        {isDraftDirty ? (
          <StatusText tone="warning">
            {entryEditorCopy.unsavedDraftMessage}
          </StatusText>
        ) : null}
        {baseFields.slice(0, 3).map((field) => (
          <Field
            key={field.id}
            label={field.label}
            value={field.value}
            testID={field.id}
            onChangeText={(value) => {
              if (field.key === 'name') {
                setCopyStatus('');
              }
              setDraft((current) => ({ ...current, [field.key]: value }));
            }}
            multiline={field.multiline}
            placeholder={field.placeholder}
          />
        ))}
        <View style={styles.notesPreview}>
          <Text style={styles.notesPreviewTitle}>{notesPreview.title}</Text>
          {notesPreview.hasContent ? (
            <Text style={styles.notesPreviewText}>{notesPreview.body}</Text>
          ) : (
            <MutedText>{notesPreview.emptyText}</MutedText>
          )}
        </View>
        {baseFields.slice(3).map((field) => (
          <Field
            autoCapitalize="none"
            autoCorrect={false}
            key={field.id}
            label={field.label}
            testID={field.id}
            value={field.value}
            onChangeText={(value) =>
              setDraft((current) => ({ ...current, [field.key]: value }))
            }
            placeholder={field.placeholder}
          />
        ))}
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
        {detailFieldGroups.map((group) => (
          <View
            key={group.id}
            style={detailFieldGroups.length > 1 ? styles.fieldGroup : null}
          >
            {detailFieldGroups.length > 1 ? (
              <Text style={styles.fieldGroupTitle}>{group.label}</Text>
            ) : null}
            {group.fields.map((field) => (
              <View key={field.key} style={styles.fieldWithSuggestions}>
                <Field
                  label={field.label}
                  value={field.value}
                  multiline={field.multiline}
                  testID={`entries.field.${field.key}`}
                  onChangeText={(value) => setDetailValue(field.key, value)}
                />
                {field.suggestions.length > 0 ? (
                  <ButtonRow>
                    {field.suggestions.map((suggestion) => (
                      <ActionButton
                        key={suggestion}
                        label={suggestion}
                        onPress={() => setDetailValue(field.key, suggestion)}
                      />
                    ))}
                  </ButtonRow>
                ) : null}
              </View>
            ))}
          </View>
        ))}
        {selectedEntry && activeRelationshipFieldConfigs.length > 0 ? (
          <View
            style={styles.relationshipGroup}
            testID="entries.linkedFields.section"
          >
            <Text style={styles.relationshipGroupTitle}>
              Linked {section.singularTitle.toLowerCase()} fields
            </Text>
            <MutedText>
              {relationshipTextReviewCopy.linkedFieldsDescription}
            </MutedText>
            {isDraftDirty ? (
              <MutedText>
                Save this {section.singularTitle.toLowerCase()} before editing
                relationship links.
              </MutedText>
            ) : (
              linkedFieldDisplayModels.map((fieldModel) => {
                const {
                  config,
                  fieldQuery,
                  fieldRelationships,
                  filteredOptions,
                  hiddenPreferredCount,
                  optionDisplay,
                  options,
                  selectedTargetIds,
                  visibleOptions,
                } = fieldModel;
                return (
                  <View
                    key={config.fieldKey}
                    style={styles.linkedField}
                    testID={`entries.linkedField.${config.fieldKey}`}
                  >
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
                          placeholder={relationshipFieldCopy.searchPlaceholder}
                        />
                        {filteredOptions.length === 0 ? (
                          <MutedText>
                            {relationshipFieldCopy.noMatchingTargetsMessage}
                          </MutedText>
                        ) : null}
                        {config.cardinality === 'one' ? (
                          <ButtonRow>
                            <ActionButton
                              label={relationshipFieldCopy.noLinkedRecordLabel}
                              selected={fieldRelationships.length === 0}
                              testID={`entries.linkedField.${config.fieldKey}.clear`}
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
                              <View
                                key={option.entry.id}
                                testID={
                                  selectedTargetIds.has(option.entry.id)
                                    ? `entries.linkedField.${config.fieldKey}.selectedTarget.${option.entry.id}`
                                    : undefined
                                }
                              >
                                <ActionButton
                                  label={
                                    option.targetCategoryWarning
                                      ? `${option.entry.name} (unusual)`
                                      : option.entry.name
                                  }
                                  selected={selectedTargetIds.has(
                                    option.entry.id
                                  )}
                                  testID={`entries.linkedField.${config.fieldKey}.target.${option.entry.id}`}
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
                              </View>
                            ))}
                          </ButtonRow>
                        ) : (
                          <ButtonRow>
                            {fieldRelationships.length > 0 ? (
                              <ActionButton
                                label={
                                  relationshipFieldCopy.clearLinkedRecordsLabel
                                }
                                testID={`entries.linkedField.${config.fieldKey}.clear`}
                                onPress={() =>
                                  clearMobileManyRelationshipTargets(config)
                                }
                              />
                            ) : null}
                            {visibleOptions.map((option) => {
                              const selected = selectedTargetIds.has(
                                option.entry.id
                              );
                              return (
                                <View
                                  key={option.entry.id}
                                  testID={
                                    selected
                                      ? `entries.linkedField.${config.fieldKey}.selectedTarget.${option.entry.id}`
                                      : undefined
                                  }
                                >
                                  <ActionButton
                                    label={
                                      option.targetCategoryWarning
                                        ? `${option.entry.name} (unusual)`
                                        : option.entry.name
                                    }
                                    selected={selected}
                                    testID={`entries.linkedField.${config.fieldKey}.target.${option.entry.id}`}
                                    tone={selected ? 'accent' : 'neutral'}
                                    onPress={() =>
                                      toggleMobileManyRelationshipTarget(
                                        config,
                                        option.entry.id,
                                        !selected
                                      )
                                    }
                                  />
                                </View>
                              );
                            })}
                          </ButtonRow>
                        )}
                        {optionDisplay.canExpandUnusualTargets ? (
                          <ActionButton
                            label={optionDisplay.showUnusualTargetsLabel}
                            onPress={() =>
                              setExpandedLinkedFieldTargets((current) => ({
                                ...current,
                                [config.fieldKey]: true,
                              }))
                            }
                          />
                        ) : null}
                        {hiddenPreferredCount > 0 ? (
                          <MutedText>
                            {optionDisplay.hiddenPreferredMessage}
                          </MutedText>
                        ) : null}
                      </>
                    ) : (
                      <MutedText>
                        {relationshipFieldCopy.createMatchingRecordsMessage}
                      </MutedText>
                    )}
                  </View>
                );
              })
            )}
            {legacyRelationshipTextValues.length > 0 ? (
              <View style={styles.linkedField}>
                <Text style={styles.relationshipGroupTitle}>
                  {relationshipTextReviewCopy.savedTextLinkNotesTitle}
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
                          {getRelationshipTextMigrationStatus(migration)}
                        </MutedText>
                      ) : null}
                      {migration?.targetIds.length ? (
                        <ActionButton
                          label={
                            relationshipTextReviewCopy.exactMatchMigrationLabel
                          }
                          onPress={() =>
                            migrateMobileLegacyRelationshipText(
                              field.config,
                              field.value
                            )
                          }
                        />
                      ) : null}
                      <ActionButton
                        label={entryEditorCopy.clearLabel}
                        onPress={() => setDetailValue(field.key, '')}
                      />
                    </View>
                  );
                })}
              </View>
            ) : null}
          </View>
        ) : null}
        {hiddenDetailCleanup.fields.length > 0 ? (
          <View style={styles.relationshipGroup}>
            <Text style={styles.relationshipGroupTitle}>
              {hiddenDetailCleanup.title}
            </Text>
            {hiddenDetailCleanup.fields.map((field) => (
              <View key={field.key} style={styles.cleanupRow}>
                <MutedText>
                  {field.label}: {field.value}
                </MutedText>
                <ActionButton
                  label={field.clearLabel}
                  onPress={() => setDetailValue(field.key, '')}
                />
              </View>
            ))}
          </View>
        ) : null}
        <ButtonRow>
          <ActionButton
            label={getEntryEditorSubmitLabel({ section, selectedEntry })}
            testID="entries.editor.save"
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
                setExpandedLinkedFieldTargets({});
              }
            }}
          />
          <ActionButton
            label={entryEditorCopy.newDraftLabel}
            onPress={resetDraft}
          />
          <ActionButton
            label={entryNameCopyFeedback.actionLabel}
            onPress={copyEntryName}
          />
          {selectedEntry && selectedActionModel ? (
            <>
              <ActionButton
                accessibilityLabel={
                  selectedActionModel.archiveAccessibilityLabel
                }
                label={selectedActionModel.archiveLabel}
                onPress={() => archiveSelectedEntry(selectedEntry)}
              />
              <ActionButton
                accessibilityLabel={
                  selectedActionModel.duplicateAccessibilityLabel
                }
                label={selectedActionModel.duplicateLabel}
                onPress={() => duplicateSelectedEntry(selectedEntry)}
              />
              <ActionButton
                accessibilityLabel={
                  selectedActionModel.useAsTemplateAccessibilityLabel
                }
                label={selectedActionModel.useAsTemplateLabel}
                onPress={() => useSelectedEntryAsTemplate(selectedEntry)}
              />
              <ActionButton
                accessibilityHint={selectedActionModel.deleteAccessibilityHint}
                accessibilityLabel={
                  selectedActionModel.deleteAccessibilityLabel
                }
                label={selectedActionModel.deleteLabel}
                tone="danger"
                onPress={() => deleteSelectedEntry(selectedEntry)}
              />
            </>
          ) : (
            <ActionButton
              label={entryEditorCopy.applyTemplateLabel}
              onPress={applySectionTemplate}
            />
          )}
        </ButtonRow>
        {copyStatus ? (
          <StatusText tone={getFeedbackTone(copyStatus)}>
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
  fieldGroup: {
    borderTopColor: valgaronColors.border,
    borderTopWidth: 1,
    gap: valgaronSpacing.sm,
    paddingTop: valgaronSpacing.md,
  },
  fieldGroupTitle: {
    color: valgaronColors.heading,
    fontSize: valgaronTypography.sizes.sm,
    fontWeight: '700',
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

function getRequestedSectionEntry(
  codex: Parameters<typeof getEntries>[0],
  section: WorldSectionConfig,
  requestedEntryId: string | undefined
): WorldEntry | null {
  if (!requestedEntryId) {
    return null;
  }
  return (
    getEntries(codex, section.id).find(
      (entry) => entry.id === requestedEntryId
    ) ?? null
  );
}
