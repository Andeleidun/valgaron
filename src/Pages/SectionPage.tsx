import { useEffect, useMemo, useRef, useState } from 'react';
import {
  NavLink,
  Navigate,
  useParams,
  useSearchParams,
} from 'react-router-dom';
import {
  buildRelationshipTextReviewBatchMigration,
  buildRelationshipTextReviewMigration,
  buildRelationshipTextReviewSuggestionMigration,
  commitEntryDraftTransaction,
  createSectionEntryDraft,
  draftFromEntry,
  duplicateEntry,
  formatExpansionControlLabel,
  formatEntryListShownCount,
  formatEntrySectionEntriesLabel,
  formatEntrySectionFiltersLabel,
  formatEntrySectionSearchLabel,
  formatHiddenCountText,
  entryListCopy,
  entryShowArchivedControl,
  entrySortControl,
  entryStatusFilterControl,
  entryUpdatedFilterControl,
  getCodexHelpRoute,
  getCodexScreenIntro,
  getEntryListEmptyStateModel,
  getEntryListModel,
  getEntrySortControlOptions,
  getEntryTagFilterOptions,
  getEntries,
  getLimitedResultModel,
  getRelationshipTextReviewExactMatchLabel,
  getRelationshipTextReviewCountLabel,
  getRelationshipTextReviewItems,
  getRelationshipTextReviewSummary,
  getRelationshipTextReviewSuggestionLabels,
  getRelationshipTextReviewUnresolvedLabel,
  getRelationshipEntries,
  getRelationshipFieldConfigsForEntryKind,
  getSectionById,
  getTimelineEraManagerModel,
  getTimelineEras,
  getTimelineInvolvedEntryIds,
  createTimelineInvolvedRecordStagedRelationship,
  timelineFeatureCopy,
  timelineUnassignedEraFilterValue,
  relationshipTextReviewCopy,
  relationshipTextReviewDisplayLimits,
  type RelationshipTextReviewItem,
  type EntryDraft,
  type EntrySortControlValue,
  type StagedRelationshipDraft,
  type WorldCodex,
  type WorldEntry,
  type WorldRelationship,
  type WorldSectionConfig,
  type WorldWorkspaceSchema,
} from '@valgaron/core';
import { confirmDiscardUnsavedChanges } from '../Utlilities/unsavedChanges';
import {
  ConfirmationDialog,
  EntryCard,
  EntryDetail,
  EntryForm,
  TimelineEventEditor,
  TimelineOverview,
} from '../Components/Codex/CodexEntryViews';

export function SectionPage({
  codex,
  fixedSectionId,
  relationships,
  sections,
  workspaceSchema,
  onArchiveEntry,
  onDeleteEntry,
  onDeleteRelationship,
  onSaveEntry,
  onSaveRelationship,
}: {
  codex: WorldCodex;
  fixedSectionId?: string;
  relationships: readonly WorldRelationship[];
  sections: readonly WorldSectionConfig[];
  workspaceSchema?: WorldWorkspaceSchema;
  onArchiveEntry: (entry: WorldEntry, archived: boolean) => void;
  onDeleteEntry: (entry: WorldEntry) => void;
  onDeleteRelationship: (relationshipId: string) => void;
  onSaveEntry: (entry: WorldEntry) => void;
  onSaveRelationship: (relationship: WorldRelationship) => void;
}) {
  const { sectionId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const effectiveSectionId = fixedSectionId ?? sectionId;
  const section = getSectionById(effectiveSectionId, sections);
  const requestedEntryId = searchParams.get('entryId');
  const requestedIntent = searchParams.get('intent');
  const requestedQuery = searchParams.get('query');
  const timelineDefaultSortKey: EntrySortControlValue =
    fixedSectionId === 'timeline' ? 'timeline-order' : 'updated-desc';
  const requestedTimelineEra =
    fixedSectionId === 'timeline' ? searchParams.get('era') ?? '' : '';
  const requestedTimelineInvolvedEntryId =
    fixedSectionId === 'timeline'
      ? searchParams.get('involvedEntryId') ?? ''
      : '';
  const requestedTimelineStatusParam = searchParams.get('status') ?? '';
  const requestedTimelineStatus =
    fixedSectionId === 'timeline' &&
    entryStatusFilterControl.options.some(
      (option) => option.value === requestedTimelineStatusParam
    )
      ? (requestedTimelineStatusParam as EntryDraft['status'] | '')
      : '';
  const requestedTimelineTag =
    fixedSectionId === 'timeline' ? searchParams.get('tag') ?? '' : '';
  const requestedTimelineSortParam = searchParams.get('sort') ?? '';
  const requestedTimelineSortKey =
    fixedSectionId === 'timeline' &&
    entrySortControl.options.some(
      (option) => option.value === requestedTimelineSortParam
    )
      ? (requestedTimelineSortParam as EntrySortControlValue)
      : timelineDefaultSortKey;
  const requestedTimelineUpdatedParam =
    searchParams.get('updatedWithinDays') ?? '';
  const requestedTimelineUpdatedWithinDays =
    fixedSectionId === 'timeline' &&
    entryUpdatedFilterControl.options.some(
      (option) =>
        option.value !== '' && option.value === requestedTimelineUpdatedParam
    )
      ? Number(requestedTimelineUpdatedParam)
      : null;
  const requestedTimelineShowArchived =
    fixedSectionId === 'timeline' &&
    searchParams.get('showArchived') === 'true';
  const routeSelectionKey = [
    effectiveSectionId ?? '',
    requestedEntryId ?? '',
    requestedIntent ?? '',
    requestedQuery ?? '',
    fixedSectionId === 'timeline' ? requestedTimelineEra : '',
    fixedSectionId === 'timeline' ? requestedTimelineInvolvedEntryId : '',
  ].join('|');
  const appliedRouteSelectionKeyRef = useRef('');
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(
    () => requestedEntryId
  );
  const [query, setQuery] = useState('');
  const [activeTag, setActiveTag] = useState('');
  const [statusFilter, setStatusFilter] = useState<EntryDraft['status'] | ''>(
    ''
  );
  const [updatedWithinDays, setUpdatedWithinDays] = useState<number | null>(
    null
  );
  const [sortKey, setSortKey] = useState<EntrySortControlValue>(
    timelineDefaultSortKey
  );
  const [eraFilter, setEraFilter] = useState('');
  const [involvedEntryFilter, setInvolvedEntryFilter] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [entryPendingDelete, setEntryPendingDelete] =
    useState<WorldEntry | null>(null);
  const [isEntryFormDirty, setIsEntryFormDirty] = useState(false);
  const [templateDraft, setTemplateDraft] = useState<EntryDraft | null>(() =>
    section && requestedIntent === 'new'
      ? createSectionEntryDraft(section, {
          timelineEra:
            section.id === 'timeline' &&
            requestedTimelineEra !== timelineUnassignedEraFilterValue
              ? requestedTimelineEra
              : '',
        })
      : null
  );
  const [templateStagedRelationships, setTemplateStagedRelationships] =
    useState<StagedRelationshipDraft[]>(() => {
      if (
        !section ||
        requestedIntent !== 'new' ||
        section.id !== 'timeline' ||
        !requestedTimelineInvolvedEntryId ||
        !getRelationshipEntries(codex, sections)
          .filter((entry) => entry.status !== 'archived')
          .some((entry) => entry.id === requestedTimelineInvolvedEntryId)
      ) {
        return [];
      }
      const relationship = createTimelineInvolvedRecordStagedRelationship(
        requestedTimelineInvolvedEntryId,
        `staged-timeline-involved-${requestedTimelineInvolvedEntryId}`
      );
      return relationship ? [relationship] : [];
    });
  const [
    showAllRelationshipTextReviewItems,
    setShowAllRelationshipTextReviewItems,
  ] = useState(false);
  const relationshipEntryIds = useMemo(
    () =>
      new Set(
        getRelationshipEntries(codex, sections)
          .filter((entry) => entry.status !== 'archived')
          .map((entry) => entry.id)
      ),
    [codex, sections]
  );

  const createContextEntryDraft = (
    nextSection: WorldSectionConfig,
    timelineEra = eraFilter
  ) =>
    createSectionEntryDraft(nextSection, {
      timelineEra:
        nextSection.id === 'timeline' &&
        timelineEra !== timelineUnassignedEraFilterValue
          ? timelineEra
          : '',
    });
  const createContextStagedRelationships = (
    nextSection: WorldSectionConfig,
    involvedEntryId = involvedEntryFilter
  ): StagedRelationshipDraft[] => {
    if (
      nextSection.id !== 'timeline' ||
      !involvedEntryId ||
      !relationshipEntryIds.has(involvedEntryId)
    ) {
      return [];
    }
    const relationship = createTimelineInvolvedRecordStagedRelationship(
      involvedEntryId,
      `staged-timeline-involved-${involvedEntryId}`
    );
    return relationship ? [relationship] : [];
  };

  useEffect(() => {
    setSelectedEntryId(requestedEntryId);
    setQuery('');
    setActiveTag('');
    setStatusFilter('');
    setUpdatedWithinDays(null);
    setSortKey(timelineDefaultSortKey);
    setEraFilter('');
    setInvolvedEntryFilter('');
    setShowArchived(false);
    setIsEntryFormDirty(false);
    if (section && requestedIntent === 'new') {
      setTemplateDraft(createContextEntryDraft(section, requestedTimelineEra));
      setTemplateStagedRelationships(
        createContextStagedRelationships(
          section,
          requestedTimelineInvolvedEntryId
        )
      );
    } else {
      setTemplateDraft(null);
      setTemplateStagedRelationships([]);
    }
    setShowAllRelationshipTextReviewItems(false);
  }, [effectiveSectionId, timelineDefaultSortKey]);

  useEffect(() => {
    if (fixedSectionId !== 'timeline') {
      return;
    }
    setActiveTag(requestedTimelineTag);
    setStatusFilter(requestedTimelineStatus);
    setUpdatedWithinDays(requestedTimelineUpdatedWithinDays);
    setSortKey(requestedTimelineSortKey);
    setEraFilter(requestedTimelineEra);
    setInvolvedEntryFilter(requestedTimelineInvolvedEntryId);
    setShowArchived(requestedTimelineShowArchived);
  }, [
    fixedSectionId,
    requestedTimelineEra,
    requestedTimelineInvolvedEntryId,
    requestedTimelineSortKey,
    requestedTimelineStatus,
    requestedTimelineTag,
    requestedTimelineUpdatedWithinDays,
    requestedTimelineShowArchived,
  ]);

  useEffect(() => {
    if (!section) {
      return;
    }
    if (appliedRouteSelectionKeyRef.current === routeSelectionKey) {
      return;
    }
    const applyRouteQuery = () => {
      if (fixedSectionId === 'timeline') {
        setQuery(requestedQuery ?? '');
        return;
      }
      if (requestedQuery !== null) {
        setQuery(requestedQuery);
      }
    };
    const cancelRouteSelection = () => {
      appliedRouteSelectionKeyRef.current = routeSelectionKey;
    };
    if (requestedIntent === 'new') {
      if (confirmDiscardUnsavedChanges(isEntryFormDirty)) {
        applyRouteQuery();
        setSelectedEntryId(null);
        setTemplateDraft(
          createContextEntryDraft(section, requestedTimelineEra)
        );
        setTemplateStagedRelationships(
          createContextStagedRelationships(
            section,
            requestedTimelineInvolvedEntryId
          )
        );
        appliedRouteSelectionKeyRef.current = routeSelectionKey;
      } else {
        cancelRouteSelection();
      }
      return;
    }
    if (!requestedEntryId) {
      applyRouteQuery();
      appliedRouteSelectionKeyRef.current = routeSelectionKey;
      return;
    }
    const nextEntry = getEntries(codex, section.id).find(
      (entry) => entry.id === requestedEntryId
    );
    if (!nextEntry) {
      applyRouteQuery();
      if (!isEntryFormDirty) {
        setSelectedEntryId(null);
        setTemplateDraft(null);
        setTemplateStagedRelationships([]);
      }
      appliedRouteSelectionKeyRef.current = routeSelectionKey;
      return;
    }
    if (
      nextEntry.id === selectedEntryId ||
      confirmDiscardUnsavedChanges(isEntryFormDirty)
    ) {
      applyRouteQuery();
      setSelectedEntryId(nextEntry.id);
      setTemplateDraft(null);
      setTemplateStagedRelationships([]);
      appliedRouteSelectionKeyRef.current = routeSelectionKey;
    } else {
      cancelRouteSelection();
    }
  }, [
    codex,
    fixedSectionId,
    isEntryFormDirty,
    requestedEntryId,
    requestedIntent,
    requestedQuery,
    requestedTimelineEra,
    requestedTimelineInvolvedEntryId,
    relationshipEntryIds,
    routeSelectionKey,
    section,
    selectedEntryId,
  ]);

  const entries = useMemo(
    () => (section ? getEntries(codex, section.id) : []),
    [codex, section]
  );
  const entryById = useMemo(
    () => new Map(entries.map((entry) => [entry.id, entry])),
    [entries]
  );
  const tagFilterOptions = useMemo(
    () => getEntryTagFilterOptions(entries, activeTag),
    [activeTag, entries]
  );
  const timelineEras = useMemo(
    () => (section?.id === 'timeline' ? getTimelineEras(entries) : []),
    [entries, section]
  );
  const timelineEraManager = useMemo(
    () =>
      section?.id === 'timeline' ? getTimelineEraManagerModel(entries) : null,
    [entries, section]
  );
  const timelineInvolvedEntries = useMemo(() => {
    if (section?.id !== 'timeline') {
      return [];
    }
    const involvedIds = new Set(
      entries.flatMap((entry) =>
        getTimelineInvolvedEntryIds(entry, relationships)
      )
    );
    return getRelationshipEntries(codex, sections)
      .filter((entry) => involvedIds.has(entry.id))
      .sort((first, second) => first.name.localeCompare(second.name));
  }, [codex, entries, relationships, section, sections]);
  const entrySortOptions = useMemo(
    () =>
      getEntrySortControlOptions({
        includeTimelineOrder: section?.id === 'timeline',
      }),
    [section]
  );
  const filteredEntryItems = useMemo(() => {
    if (!section) {
      return [];
    }
    return getEntryListModel(
      {
        codex,
        entryTypes: sections,
        relationships,
      },
      section,
      query,
      {
        activeTag,
        showArchived,
        sortKey,
        status: statusFilter,
        timelineEra: eraFilter,
        timelineInvolvedEntryId: involvedEntryFilter,
        updatedWithinDays,
      }
    );
  }, [
    activeTag,
    codex,
    eraFilter,
    involvedEntryFilter,
    query,
    relationships,
    section,
    sections,
    showArchived,
    sortKey,
    statusFilter,
    updatedWithinDays,
  ]);
  const filteredEntryRows = useMemo(
    () =>
      filteredEntryItems.flatMap((entryItem) => {
        const entry = entryById.get(entryItem.id);
        return entry ? [{ entry, entryItem }] : [];
      }),
    [entryById, filteredEntryItems]
  );
  const filteredEntries = useMemo(
    () => filteredEntryRows.map((row) => row.entry),
    [filteredEntryRows]
  );
  const selectedEntry = entries.find((entry) => entry.id === selectedEntryId);
  const archivedEntryCount = entries.filter(
    (entry) => entry.status === 'archived'
  ).length;
  const hasActiveFilters =
    query.trim().length > 0 ||
    activeTag.length > 0 ||
    statusFilter.length > 0 ||
    eraFilter.length > 0 ||
    involvedEntryFilter.length > 0 ||
    showArchived ||
    updatedWithinDays !== null;
  const relationshipTextReviewItems = useMemo(
    () =>
      section &&
      getRelationshipFieldConfigsForEntryKind(section.kind).length > 0
        ? getRelationshipTextReviewItems({ codex, sections }).filter(
            (item) => item.sectionId === section.id
          )
        : [],
    [codex, section, sections]
  );
  const relationshipTextReviewExactItems = relationshipTextReviewItems.filter(
    (item) => item.exactMatchCount > 0
  );
  const initialStagedRelationships = selectedEntry
    ? []
    : templateStagedRelationships;
  const relationshipTextReviewDisplayModel = getLimitedResultModel(
    relationshipTextReviewItems,
    showAllRelationshipTextReviewItems
      ? relationshipTextReviewItems.length
      : relationshipTextReviewDisplayLimits.sectionItems
  );
  const visibleRelationshipTextReviewItems =
    relationshipTextReviewDisplayModel.visibleItems;
  const hiddenRelationshipTextReviewItemCount =
    relationshipTextReviewDisplayModel.hiddenCount;

  useEffect(() => {
    if (
      entries.length > 0 &&
      selectedEntryId &&
      !isEntryFormDirty &&
      !filteredEntries.some((entry) => entry.id === selectedEntryId)
    ) {
      setSelectedEntryId(null);
    }
  }, [filteredEntries, isEntryFormDirty, selectedEntryId]);

  if (!section) {
    return <Navigate to="/" replace />;
  }

  const clearFilters = () => {
    setQuery('');
    setActiveTag('');
    setStatusFilter('');
    setEraFilter('');
    setInvolvedEntryFilter('');
    setShowArchived(false);
    setUpdatedWithinDays(null);
    setSortKey(timelineDefaultSortKey);
    updateTimelineBrowseRoute({
      era: '',
      involvedEntryId: '',
      query: '',
      showArchived: false,
      sort: timelineDefaultSortKey,
      status: '',
      tag: '',
      updatedWithinDays: null,
    });
  };
  const emptyState = section
    ? getEntryListEmptyStateModel({
        archivedCount: archivedEntryCount,
        hasActiveFilters,
        section,
        showArchived,
        totalCount: entries.length,
      })
    : null;
  const sectionHelpRoute = getCodexHelpRoute(
    section.id === 'timeline' ? 'timeline' : 'entries'
  );
  const fixedTimelineIntro =
    fixedSectionId === 'timeline' ? getCodexScreenIntro('timeline') : null;

  const updateTimelineBrowseRoute = ({
    era = eraFilter,
    involvedEntryId = involvedEntryFilter,
    query: nextQuery = query,
    showArchived: nextShowArchived = showArchived,
    sort: nextSort = sortKey,
    status: nextStatus = statusFilter,
    tag = activeTag,
    updatedWithinDays: nextUpdatedWithinDays = updatedWithinDays,
  }: {
    era?: string;
    involvedEntryId?: string;
    query?: string;
    showArchived?: boolean;
    sort?: EntrySortControlValue;
    status?: EntryDraft['status'] | '';
    tag?: string;
    updatedWithinDays?: number | null;
  }) => {
    if (fixedSectionId !== 'timeline') {
      return;
    }
    const nextParams = new URLSearchParams(searchParams);
    if (nextQuery.trim()) {
      nextParams.set('query', nextQuery);
    } else {
      nextParams.delete('query');
    }
    if (era) {
      nextParams.set('era', era);
    } else {
      nextParams.delete('era');
    }
    if (tag) {
      nextParams.set('tag', tag);
    } else {
      nextParams.delete('tag');
    }
    if (nextStatus) {
      nextParams.set('status', nextStatus);
    } else {
      nextParams.delete('status');
    }
    if (nextSort !== timelineDefaultSortKey) {
      nextParams.set('sort', nextSort);
    } else {
      nextParams.delete('sort');
    }
    if (nextUpdatedWithinDays !== null) {
      nextParams.set('updatedWithinDays', String(nextUpdatedWithinDays));
    } else {
      nextParams.delete('updatedWithinDays');
    }
    if (involvedEntryId) {
      nextParams.set('involvedEntryId', involvedEntryId);
    } else {
      nextParams.delete('involvedEntryId');
    }
    if (nextShowArchived) {
      nextParams.set('showArchived', 'true');
    } else {
      nextParams.delete('showArchived');
    }
    setSearchParams(nextParams);
  };

  const selectEntry = (entryId: string) => {
    if (
      entryId === selectedEntryId ||
      confirmDiscardUnsavedChanges(isEntryFormDirty)
    ) {
      setTemplateDraft(null);
      setTemplateStagedRelationships([]);
      setSelectedEntryId(entryId);
    }
  };

  const migrateReviewItemExactMatches = (item: RelationshipTextReviewItem) => {
    if (isEntryFormDirty) {
      return;
    }
    const entry = entries.find((candidate) => candidate.id === item.entryId);
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
      relationships,
    });
    migration.relationshipIdsToDelete.forEach(onDeleteRelationship);
    migration.relationshipsToSave.forEach(({ relationship }) =>
      onSaveRelationship(relationship)
    );
    onSaveEntry({
      ...entry,
      fields: migration.fields,
      updatedAt: new Date().toISOString(),
    });
  };

  const migrateReviewItemSuggestion = (
    item: RelationshipTextReviewItem,
    fragment: string,
    targetEntryId: string
  ) => {
    if (isEntryFormDirty) {
      return;
    }
    const entry = entries.find((candidate) => candidate.id === item.entryId);
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
      relationships,
      targetEntryId,
    });
    if (!migration) {
      return;
    }

    migration.relationshipIdsToDelete.forEach(onDeleteRelationship);
    migration.relationshipsToSave.forEach(({ relationship }) =>
      onSaveRelationship(relationship)
    );
    onSaveEntry({
      ...entry,
      fields: migration.fields,
      updatedAt: new Date().toISOString(),
    });
  };

  const migrateAllReviewExactMatches = () => {
    if (relationshipTextReviewExactItems.length === 0 || isEntryFormDirty) {
      return;
    }
    const migration = buildRelationshipTextReviewBatchMigration({
      codex,
      items: relationshipTextReviewExactItems,
      relationships,
      sections,
    });
    migration.relationshipIdsToDelete.forEach(onDeleteRelationship);
    migration.relationshipsToSave.forEach(({ relationship }) =>
      onSaveRelationship(relationship)
    );
    for (const update of migration.entryFieldUpdates) {
      const entry = entries.find(
        (candidate) => candidate.id === update.entryId
      );
      if (entry) {
        onSaveEntry({
          ...entry,
          fields: update.fields,
          updatedAt: new Date().toISOString(),
        });
      }
    }
  };

  return (
    <main
      className="vwb-main vwb-section-layout"
      id="main-content"
      tabIndex={-1}
    >
      <section
        className="vwb-panel vwb-section-intro"
        aria-labelledby={`${section.id}-title`}
      >
        <p className="vwb-kicker">
          {fixedTimelineIntro?.kicker ?? 'Codex section'}
        </p>
        <h1 id={`${section.id}-title`}>
          {fixedTimelineIntro?.title ?? section.title}
        </h1>
        <p>{fixedTimelineIntro?.detail ?? section.description}</p>
        <NavLink
          className="vwb-secondary-button"
          to={sectionHelpRoute}
          onClick={(event) => {
            if (!confirmDiscardUnsavedChanges(isEntryFormDirty)) {
              event.preventDefault();
            }
          }}
        >
          {section.id === 'timeline'
            ? entryListCopy.timelineHelpLabel
            : entryListCopy.entryHelpLabel}
        </NavLink>
      </section>

      {section.id === 'timeline' ? (
        <TimelineOverview
          codex={codex}
          events={filteredEntries}
          onSaveEvents={(timelineEvents) => {
            timelineEvents.forEach((event) => onSaveEntry(event));
          }}
          relationships={relationships}
          sections={sections}
        />
      ) : null}

      {relationshipTextReviewItems.length > 0 ? (
        <section
          className="vwb-panel vwb-linked-field-panel"
          aria-label={relationshipTextReviewCopy.title}
        >
          <div className="vwb-section-heading">
            <div>
              <p className="vwb-kicker">
                {getRelationshipTextReviewCountLabel(
                  relationshipTextReviewItems.length
                )}
              </p>
              <h2>{relationshipTextReviewCopy.title}</h2>
            </div>
          </div>
          <p>
            {getRelationshipTextReviewSummary(
              relationshipTextReviewItems.length
            )}
          </p>
          {isEntryFormDirty ? (
            <p className="vwb-inline-status">
              {relationshipTextReviewCopy.draftBlockedMessage}
            </p>
          ) : null}
          {relationshipTextReviewExactItems.length > 0 ? (
            <button
              className="vwb-secondary-button"
              disabled={isEntryFormDirty}
              type="button"
              onClick={migrateAllReviewExactMatches}
            >
              {relationshipTextReviewCopy.batchExactMatchLabel}
            </button>
          ) : null}
          <div className="vwb-relationship-list">
            {visibleRelationshipTextReviewItems.map((item) => (
              <article
                className="vwb-relationship-row"
                key={`${item.entryId}-${item.fieldKey}`}
              >
                <div>
                  <span className="vwb-entry-kind">{item.fieldLabel}</span>
                  <button
                    className="vwb-link-button"
                    type="button"
                    onClick={() => selectEntry(item.entryId)}
                  >
                    {item.entryName}
                  </button>
                </div>
                <p>
                  {relationshipTextReviewCopy.unresolvedLabel}:{' '}
                  {getRelationshipTextReviewUnresolvedLabel(item)}.{' '}
                  {getRelationshipTextReviewExactMatchLabel(item)}
                </p>
                {item.suggestedTargets.length > 0 ? (
                  <div>
                    <p>
                      {relationshipTextReviewCopy.suggestionsLabel}:{' '}
                      {getRelationshipTextReviewSuggestionLabels(item).join(
                        '; '
                      )}
                    </p>
                    {item.suggestedTargets.map((suggestion) =>
                      suggestion.targets.map((target) => (
                        <button
                          aria-label={target.accessibilityLabel}
                          className="vwb-secondary-button"
                          disabled={isEntryFormDirty}
                          key={`${suggestion.fragment}-${target.id}`}
                          type="button"
                          onClick={() =>
                            migrateReviewItemSuggestion(
                              item,
                              suggestion.fragment,
                              target.id
                            )
                          }
                        >
                          {target.label}
                        </button>
                      ))
                    )}
                  </div>
                ) : null}
                {item.exactMatchCount > 0 ? (
                  <button
                    className="vwb-secondary-button"
                    disabled={isEntryFormDirty}
                    type="button"
                    onClick={() => migrateReviewItemExactMatches(item)}
                  >
                    {relationshipTextReviewCopy.exactMatchMigrationLabel}
                  </button>
                ) : null}
              </article>
            ))}
          </div>
          {hiddenRelationshipTextReviewItemCount > 0 ? (
            <span className="vwb-tag">
              {formatHiddenCountText({
                hiddenCount: hiddenRelationshipTextReviewItemCount,
                singularItemLabel: 'legacy text item',
                pluralItemLabel: 'legacy text items',
              })}
            </span>
          ) : null}
          {relationshipTextReviewItems.length >
          relationshipTextReviewDisplayLimits.sectionItems ? (
            <div className="vwb-action-row">
              <button
                className="vwb-secondary-button"
                type="button"
                aria-expanded={showAllRelationshipTextReviewItems}
                onClick={() =>
                  setShowAllRelationshipTextReviewItems(
                    (currentValue) => !currentValue
                  )
                }
              >
                {formatExpansionControlLabel({
                  isExpanded: showAllRelationshipTextReviewItems,
                  hiddenCount: hiddenRelationshipTextReviewItemCount,
                  pluralItemLabel: 'Legacy Text Items',
                  singularItemLabel: 'Legacy Text Item',
                })}
              </button>
            </div>
          ) : null}
        </section>
      ) : null}

      <section
        className="vwb-entry-column"
        aria-label={formatEntrySectionEntriesLabel(section)}
      >
        <div className="vwb-section-heading">
          <div>
            <p className="vwb-kicker">
              {formatEntryListShownCount(
                filteredEntries.length,
                entries.length
              )}
            </p>
            <h2>{entryListCopy.entriesTitle}</h2>
          </div>
        </div>
        <div
          className="vwb-filter-panel vwb-entry-filter-panel"
          aria-label={formatEntrySectionFiltersLabel(section)}
        >
          <label className="vwb-search-field">
            {formatEntrySectionSearchLabel(section)}
            <input
              value={query}
              onChange={(event) => {
                const nextQuery = event.target.value;
                setQuery(nextQuery);
                updateTimelineBrowseRoute({ query: nextQuery });
              }}
              placeholder={entryListCopy.searchSectionLabel}
              type="search"
            />
          </label>
          {tagFilterOptions.length > 0 ? (
            <div
              className="vwb-tag-filter-group"
              aria-label={entryListCopy.filterByTagLabel}
            >
              {tagFilterOptions.map((option) => (
                <button
                  className={`vwb-tag-filter ${
                    option.isActive ? 'is-active' : ''
                  }`}
                  key={option.value}
                  type="button"
                  onClick={() => {
                    setActiveTag(option.nextValue);
                    updateTimelineBrowseRoute({ tag: option.nextValue });
                  }}
                  aria-pressed={option.isActive}
                >
                  {option.label}
                </button>
              ))}
            </div>
          ) : null}
          {hasActiveFilters ? (
            <button
              className="vwb-secondary-button vwb-clear-filters-button"
              type="button"
              onClick={clearFilters}
            >
              {entryListCopy.clearFiltersLabel}
            </button>
          ) : null}
          <div className="vwb-filter-row">
            <label>
              {entryStatusFilterControl.label}
              <select
                aria-label={entryStatusFilterControl.accessibilityLabel}
                value={statusFilter}
                onChange={(event) => {
                  const nextStatus = event.target.value as typeof statusFilter;
                  setStatusFilter(nextStatus);
                  if (nextStatus === 'archived') {
                    setShowArchived(true);
                  }
                  updateTimelineBrowseRoute({
                    showArchived:
                      nextStatus === 'archived' ? true : showArchived,
                    status: nextStatus,
                  });
                }}
              >
                {entryStatusFilterControl.options.map((option) => (
                  <option value={option.value} key={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              {entrySortControl.label}
              <select
                aria-label={entrySortControl.accessibilityLabel}
                value={sortKey}
                onChange={(event) => {
                  const nextSortKey = event.target
                    .value as EntrySortControlValue;
                  setSortKey(nextSortKey);
                  updateTimelineBrowseRoute({ sort: nextSortKey });
                }}
              >
                {entrySortOptions.map((option) => (
                  <option value={option.value} key={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              {entryUpdatedFilterControl.label}
              <select
                aria-label={entryUpdatedFilterControl.accessibilityLabel}
                value={updatedWithinDays ?? ''}
                onChange={(event) => {
                  const nextUpdatedWithinDays = event.target.value
                    ? Number(event.target.value)
                    : null;
                  setUpdatedWithinDays(nextUpdatedWithinDays);
                  updateTimelineBrowseRoute({
                    updatedWithinDays: nextUpdatedWithinDays,
                  });
                }}
              >
                {entryUpdatedFilterControl.options.map((option) => (
                  <option value={option.value} key={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          {section.id === 'timeline' ? (
            <div className="vwb-filter-row">
              <label>
                {timelineFeatureCopy.eraFilterLabel}
                <select
                  value={eraFilter}
                  onChange={(event) => {
                    const nextEra = event.target.value;
                    setEraFilter(nextEra);
                    updateTimelineBrowseRoute({ era: nextEra });
                  }}
                >
                  <option value="">{timelineFeatureCopy.anyEraLabel}</option>
                  {timelineEras.map((era) => (
                    <option value={era} key={era}>
                      {era}
                    </option>
                  ))}
                  {timelineEraManager?.unassignedCount ? (
                    <option value={timelineUnassignedEraFilterValue}>
                      {timelineFeatureCopy.unassignedEraLabel} (
                      {timelineEraManager.unassignedCount})
                    </option>
                  ) : null}
                </select>
              </label>
              <label>
                {timelineFeatureCopy.involvedFilterLabel}
                <select
                  value={involvedEntryFilter}
                  onChange={(event) => {
                    const nextInvolvedEntryId = event.target.value;
                    setInvolvedEntryFilter(nextInvolvedEntryId);
                    updateTimelineBrowseRoute({
                      involvedEntryId: nextInvolvedEntryId,
                    });
                  }}
                >
                  <option value="">
                    {timelineFeatureCopy.anyInvolvedLabel}
                  </option>
                  {timelineInvolvedEntries.map((entry) => (
                    <option value={entry.id} key={entry.id}>
                      {entry.name} ({entry.sectionTitle})
                    </option>
                  ))}
                </select>
              </label>
            </div>
          ) : null}
          <label className="vwb-inline-toggle">
            <input
              aria-label={entryShowArchivedControl.accessibilityLabel}
              checked={showArchived}
              onChange={(event) => {
                const nextShowArchived = event.target.checked;
                setShowArchived(nextShowArchived);
                updateTimelineBrowseRoute({ showArchived: nextShowArchived });
              }}
              type="checkbox"
            />
            {entryShowArchivedControl.label}
          </label>
        </div>
        <div className="vwb-entry-list">
          {filteredEntries.length > 0 ? (
            filteredEntryRows.map(({ entry, entryItem }) => (
              <EntryCard
                entry={entry}
                entryListItem={entryItem}
                isSelected={entry.id === selectedEntryId}
                key={entry.id}
                onSelect={() => selectEntry(entry.id)}
                section={section}
                workspaceSchema={workspaceSchema}
              />
            ))
          ) : (
            <div className="vwb-empty-results" role="status">
              <strong>{emptyState?.title}</strong>
              <p>{emptyState?.detail}</p>
              {emptyState?.showArchivedAction ? (
                <button
                  className="vwb-secondary-button"
                  type="button"
                  onClick={() => {
                    setShowArchived(true);
                    updateTimelineBrowseRoute({ showArchived: true });
                  }}
                >
                  {emptyState.showArchivedActionLabel}
                </button>
              ) : null}
              {hasActiveFilters ? (
                <button
                  className="vwb-secondary-button"
                  type="button"
                  onClick={clearFilters}
                >
                  {entryListCopy.clearFiltersLabel}
                </button>
              ) : null}
            </div>
          )}
        </div>
      </section>

      <section
        className="vwb-panel"
        aria-label={`${section.singularTitle} editor`}
      >
        {selectedEntry && section.id !== 'timeline' ? (
          <EntryDetail
            codex={codex}
            entry={selectedEntry}
            relationships={relationships}
            section={section}
            sections={sections}
            workspaceSchema={workspaceSchema}
          />
        ) : null}
        {section.id === 'timeline' ? (
          <TimelineEventEditor
            key={`${section.id}-${
              selectedEntry?.id ?? templateDraft?.name ?? 'new'
            }`}
            onCancel={() => {
              setSelectedEntryId(null);
              setTemplateDraft(createContextEntryDraft(section));
              setTemplateStagedRelationships(
                createContextStagedRelationships(section)
              );
            }}
            onArchive={(entry) => {
              onArchiveEntry(entry, true);
              setSelectedEntryId(null);
              setTemplateDraft(null);
              setTemplateStagedRelationships([]);
            }}
            onDelete={(entry) => setEntryPendingDelete(entry)}
            onDuplicate={(entry) => {
              const duplicatedEntry = duplicateEntry(section, entry);
              onSaveEntry(duplicatedEntry);
              setSelectedEntryId(duplicatedEntry.id);
              setTemplateDraft(null);
              setTemplateStagedRelationships([]);
            }}
            onRestore={(entry) => {
              onArchiveEntry(entry, false);
              setSelectedEntryId(entry.id);
              setTemplateDraft(null);
              setTemplateStagedRelationships([]);
              setShowArchived(true);
            }}
            onSaveDraft={(draft, existingEntry, stagedRelationships = []) => {
              const result = commitEntryDraftTransaction({
                codex,
                entryDraft: draft,
                existingEntry,
                relationships,
                section,
                stagedRelationships,
              });
              onSaveEntry(result.entry);
              result.savedRelationships.forEach(onSaveRelationship);
              setSelectedEntryId(result.entry.id);
              setTemplateDraft(null);
              setTemplateStagedRelationships([]);
              return result.entry;
            }}
            onDeleteRelationship={onDeleteRelationship}
            onSaveRelationship={onSaveRelationship}
            onUseAsTemplate={(entry) => {
              const nextTemplateDraft = draftFromEntry(entry, section);
              setTemplateDraft({
                ...nextTemplateDraft,
                name: `${entry.name} Template`,
                status: 'draft',
              });
              setSelectedEntryId(null);
              setTemplateStagedRelationships([]);
            }}
            section={section}
            selectedEntry={selectedEntry}
            initialDraft={templateDraft ?? undefined}
            initialStagedRelationships={initialStagedRelationships}
            onDirtyChange={setIsEntryFormDirty}
            codex={codex}
            relationships={relationships}
            sections={sections}
            workspaceSchema={workspaceSchema}
          />
        ) : (
          <EntryForm
            key={`${section.id}-${
              selectedEntry?.id ?? templateDraft?.name ?? 'new'
            }`}
            onCancel={() => {
              setSelectedEntryId(null);
              setTemplateDraft(createContextEntryDraft(section));
              setTemplateStagedRelationships(
                createContextStagedRelationships(section)
              );
            }}
            onArchive={(entry) => {
              onArchiveEntry(entry, true);
              setSelectedEntryId(null);
              setTemplateDraft(null);
              setTemplateStagedRelationships([]);
            }}
            onDelete={(entry) => setEntryPendingDelete(entry)}
            onDuplicate={(entry) => {
              const duplicatedEntry = duplicateEntry(section, entry);
              onSaveEntry(duplicatedEntry);
              setSelectedEntryId(duplicatedEntry.id);
              setTemplateDraft(null);
              setTemplateStagedRelationships([]);
            }}
            onRestore={(entry) => {
              onArchiveEntry(entry, false);
              setSelectedEntryId(entry.id);
              setTemplateDraft(null);
              setTemplateStagedRelationships([]);
              setShowArchived(true);
            }}
            onSave={(entry) => {
              onSaveEntry(entry);
              setSelectedEntryId(entry.id);
              setTemplateDraft(null);
              setTemplateStagedRelationships([]);
            }}
            onSaveDraft={(draft, existingEntry, stagedRelationships = []) => {
              const result = commitEntryDraftTransaction({
                codex,
                entryDraft: draft,
                existingEntry,
                relationships,
                section,
                stagedRelationships,
              });
              onSaveEntry(result.entry);
              result.savedRelationships.forEach(onSaveRelationship);
              setSelectedEntryId(result.entry.id);
              setTemplateDraft(null);
              setTemplateStagedRelationships([]);
              return result.entry;
            }}
            onDeleteRelationship={onDeleteRelationship}
            onSaveRelationship={onSaveRelationship}
            onUseAsTemplate={(entry) => {
              const nextTemplateDraft = draftFromEntry(entry, section);
              setTemplateDraft({
                ...nextTemplateDraft,
                name: `${entry.name} Template`,
                status: 'draft',
              });
              setSelectedEntryId(null);
              setTemplateStagedRelationships([]);
            }}
            section={section}
            sectionEntries={entries}
            selectedEntry={selectedEntry}
            initialDraft={templateDraft ?? undefined}
            initialStagedRelationships={initialStagedRelationships}
            onDirtyChange={setIsEntryFormDirty}
            codex={codex}
            relationships={relationships}
            sections={sections}
            workspaceSchema={workspaceSchema}
          />
        )}
      </section>
      {entryPendingDelete ? (
        <ConfirmationDialog
          entry={entryPendingDelete}
          onCancel={() => setEntryPendingDelete(null)}
          onConfirm={() => {
            onDeleteEntry(entryPendingDelete);
            setSelectedEntryId(null);
            setTemplateDraft(null);
            setTemplateStagedRelationships([]);
            setEntryPendingDelete(null);
          }}
        />
      ) : null}
    </main>
  );
}
