import { useEffect, useMemo, useRef, useState } from 'react';
import {
  NavLink,
  Navigate,
  useParams,
  useSearchParams,
} from 'react-router-dom';
import {
  draftFromEntry,
  duplicateEntry,
  filterSectionEntries,
  filterTimelineEvents,
  buildPlaceRelationshipTextReviewBatchMigration,
  buildPlaceRelationshipTextReviewMigration,
  getCodexHelpRoute,
  getEntries,
  getPlaceRelationshipTextReviewExactMatchLabel,
  getPlaceRelationshipTextReviewItems,
  getPlaceRelationshipTextReviewSuggestionLabels,
  getPlaceRelationshipTextReviewUnresolvedLabel,
  getRelationshipEntries,
  getSectionById,
  getSectionTags,
  getTimelineEras,
  getTimelineInvolvedEntryIds,
  sortEntries,
  sortTimelineEvents,
  placeRelationshipFieldConfigs,
  type PlaceRelationshipTextReviewItem,
  type EntryDraft,
  type EntrySortKey,
  type WorldCodex,
  type WorldEntry,
  type WorldRelationship,
  type WorldSectionConfig,
  worldEntryStatusOptions,
} from '@valgaron/core';
import { confirmDiscardUnsavedChanges } from '../Utlilities/unsavedChanges';
import {
  ConfirmationDialog,
  EntryCard,
  EntryDetail,
  EntryForm,
  TimelineOverview,
} from '../Components/Codex/CodexEntryViews';

type SectionSortKey = EntrySortKey | 'timeline-order';

export function SectionPage({
  codex,
  relationships,
  sections,
  onArchiveEntry,
  onDeleteEntry,
  onDeleteRelationship,
  onSaveEntry,
  onSaveRelationship,
}: {
  codex: WorldCodex;
  relationships: readonly WorldRelationship[];
  sections: readonly WorldSectionConfig[];
  onArchiveEntry: (entry: WorldEntry, archived: boolean) => void;
  onDeleteEntry: (entry: WorldEntry) => void;
  onDeleteRelationship: (relationshipId: string) => void;
  onSaveEntry: (entry: WorldEntry) => void;
  onSaveRelationship: (relationship: WorldRelationship) => void;
}) {
  const { sectionId } = useParams();
  const [searchParams] = useSearchParams();
  const section = getSectionById(sectionId, sections);
  const requestedEntryId = searchParams.get('entryId');
  const requestedIntent = searchParams.get('intent');
  const requestedQuery = searchParams.get('query');
  const routeSelectionKey = `${sectionId ?? ''}|${requestedEntryId ?? ''}|${
    requestedIntent ?? ''
  }|${requestedQuery ?? ''}`;
  const appliedRouteSelectionKeyRef = useRef('');
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [activeTag, setActiveTag] = useState('');
  const [statusFilter, setStatusFilter] = useState<EntryDraft['status'] | ''>(
    ''
  );
  const [updatedWithinDays, setUpdatedWithinDays] = useState<number | null>(
    null
  );
  const [sortKey, setSortKey] = useState<SectionSortKey>('updated-desc');
  const [eraFilter, setEraFilter] = useState('');
  const [involvedEntryFilter, setInvolvedEntryFilter] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [entryPendingDelete, setEntryPendingDelete] =
    useState<WorldEntry | null>(null);
  const [isEntryFormDirty, setIsEntryFormDirty] = useState(false);
  const [templateDraft, setTemplateDraft] = useState<EntryDraft | null>(null);

  useEffect(() => {
    setSelectedEntryId(null);
    setQuery('');
    setActiveTag('');
    setStatusFilter('');
    setUpdatedWithinDays(null);
    setSortKey('updated-desc');
    setEraFilter('');
    setInvolvedEntryFilter('');
    setShowArchived(false);
    setIsEntryFormDirty(false);
    setTemplateDraft(null);
  }, [sectionId]);

  useEffect(() => {
    if (!section) {
      return;
    }
    if (appliedRouteSelectionKeyRef.current === routeSelectionKey) {
      return;
    }
    const applyRouteQuery = () => {
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
        setTemplateDraft(null);
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
      appliedRouteSelectionKeyRef.current = routeSelectionKey;
    } else {
      cancelRouteSelection();
    }
  }, [
    codex,
    isEntryFormDirty,
    requestedEntryId,
    requestedIntent,
    requestedQuery,
    routeSelectionKey,
    section,
    selectedEntryId,
  ]);

  const entries = useMemo(
    () => (section ? getEntries(codex, section.id) : []),
    [codex, section]
  );
  const availableTags = useMemo(() => getSectionTags(entries), [entries]);
  const timelineEras = useMemo(
    () => (section?.id === 'timeline' ? getTimelineEras(entries) : []),
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
  const filteredEntries = useMemo(() => {
    if (!section) {
      return [];
    }
    const sectionFilteredEntries = filterSectionEntries(entries, section, {
      query,
      activeTag,
      status: statusFilter,
      showArchived,
      updatedWithinDays,
    });
    const timelineFilteredEntries =
      section.id === 'timeline'
        ? filterTimelineEvents(
            sectionFilteredEntries,
            {
              era: eraFilter,
              tag: '',
              status: '',
              involvedEntryId: involvedEntryFilter,
            },
            relationships
          )
        : sectionFilteredEntries;
    return sortKey === 'timeline-order'
      ? sortTimelineEvents(timelineFilteredEntries)
      : sortEntries(timelineFilteredEntries, sortKey);
  }, [
    activeTag,
    eraFilter,
    entries,
    involvedEntryFilter,
    query,
    relationships,
    section,
    showArchived,
    sortKey,
    statusFilter,
    updatedWithinDays,
  ]);
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
  const placeRelationshipTextReviewItems = useMemo(
    () =>
      section?.kind === 'place'
        ? getPlaceRelationshipTextReviewItems({ codex, sections }).filter(
            (item) => item.sectionId === section.id
          )
        : [],
    [codex, section, sections]
  );
  const placeRelationshipTextReviewExactItems =
    placeRelationshipTextReviewItems.filter((item) => item.exactMatchCount > 0);

  useEffect(() => {
    if (
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
  };
  const hasOnlyArchivedEntries =
    entries.length > 0 && archivedEntryCount === entries.length;
  const sectionHelpRoute = getCodexHelpRoute(
    section.id === 'timeline' ? 'timeline' : 'entries'
  );

  const selectEntry = (entryId: string) => {
    if (
      entryId === selectedEntryId ||
      confirmDiscardUnsavedChanges(isEntryFormDirty)
    ) {
      setTemplateDraft(null);
      setSelectedEntryId(entryId);
    }
  };

  const migrateReviewItemExactMatches = (
    item: PlaceRelationshipTextReviewItem
  ) => {
    if (isEntryFormDirty) {
      return;
    }
    const entry = entries.find((candidate) => candidate.id === item.entryId);
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

  const migrateAllReviewExactMatches = () => {
    if (
      placeRelationshipTextReviewExactItems.length === 0 ||
      isEntryFormDirty
    ) {
      return;
    }
    const migration = buildPlaceRelationshipTextReviewBatchMigration({
      codex,
      items: placeRelationshipTextReviewExactItems,
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
        <p className="vwb-kicker">Codex section</p>
        <h1 id={`${section.id}-title`}>{section.title}</h1>
        <p>{section.description}</p>
        <NavLink
          className="vwb-secondary-button"
          to={sectionHelpRoute}
          onClick={(event) => {
            if (!confirmDiscardUnsavedChanges(isEntryFormDirty)) {
              event.preventDefault();
            }
          }}
        >
          {section.id === 'timeline' ? 'Timeline Help' : 'Entry Help'}
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

      {placeRelationshipTextReviewItems.length > 0 ? (
        <section
          className="vwb-panel vwb-linked-field-panel"
          aria-label="Legacy place link text review"
        >
          <div className="vwb-section-heading">
            <div>
              <p className="vwb-kicker">
                {placeRelationshipTextReviewItems.length} field
                {placeRelationshipTextReviewItems.length === 1 ? '' : 's'} to
                review
              </p>
              <h2>Legacy Link Text</h2>
            </div>
          </div>
          <p>
            These relationship-backed fields still contain text that exact-match
            migration cannot fully resolve.
          </p>
          {isEntryFormDirty ? (
            <p className="vwb-inline-status">
              Save or discard the current entry draft before migrating exact
              matches.
            </p>
          ) : null}
          {placeRelationshipTextReviewExactItems.length > 0 ? (
            <button
              className="vwb-secondary-button"
              disabled={isEntryFormDirty}
              type="button"
              onClick={migrateAllReviewExactMatches}
            >
              Migrate All Exact Matches
            </button>
          ) : null}
          <div className="vwb-relationship-list">
            {placeRelationshipTextReviewItems.slice(0, 6).map((item) => (
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
                  Unresolved:{' '}
                  {getPlaceRelationshipTextReviewUnresolvedLabel(item)};{' '}
                  {getPlaceRelationshipTextReviewExactMatchLabel(item)}
                </p>
                {item.suggestedTargets.length > 0 ? (
                  <p>
                    Suggestions:{' '}
                    {getPlaceRelationshipTextReviewSuggestionLabels(item).join(
                      '; '
                    )}
                  </p>
                ) : null}
                {item.exactMatchCount > 0 ? (
                  <button
                    className="vwb-secondary-button"
                    disabled={isEntryFormDirty}
                    type="button"
                    onClick={() => migrateReviewItemExactMatches(item)}
                  >
                    Migrate Exact Matches
                  </button>
                ) : null}
              </article>
            ))}
          </div>
          {placeRelationshipTextReviewItems.length > 6 ? (
            <p className="vwb-inline-status">
              Showing 6 of {placeRelationshipTextReviewItems.length}. Use the
              affected entries to continue cleanup.
            </p>
          ) : null}
        </section>
      ) : null}

      <section
        className="vwb-entry-column"
        aria-label={`${section.title} entries`}
      >
        <div className="vwb-section-heading">
          <div>
            <p className="vwb-kicker">
              {filteredEntries.length} of {entries.length} shown
            </p>
            <h2>Entries</h2>
          </div>
        </div>
        <div
          className="vwb-filter-panel vwb-entry-filter-panel"
          aria-label={`${section.title} filters`}
        >
          <label className="vwb-search-field">
            Search {section.title}
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search this section"
              type="search"
            />
          </label>
          {availableTags.length > 0 ? (
            <div className="vwb-tag-filter-group" aria-label="Filter by tag">
              {availableTags.map((tag) => (
                <button
                  className={`vwb-tag-filter ${
                    activeTag === tag ? 'is-active' : ''
                  }`}
                  key={tag}
                  type="button"
                  onClick={() =>
                    setActiveTag((currentTag) =>
                      currentTag === tag ? '' : tag
                    )
                  }
                  aria-pressed={activeTag === tag}
                >
                  {tag}
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
              Clear Filters
            </button>
          ) : null}
          <div className="vwb-filter-row">
            <label>
              Status
              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value as typeof statusFilter)
                }
              >
                <option value="">Any status</option>
                {worldEntryStatusOptions.map((option) => (
                  <option value={option.value} key={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Sort
              <select
                value={sortKey}
                onChange={(event) =>
                  setSortKey(event.target.value as SectionSortKey)
                }
              >
                <option value="updated-desc">Recently updated</option>
                <option value="created-desc">Recently created</option>
                {section.id === 'timeline' ? (
                  <option value="timeline-order">Timeline order</option>
                ) : null}
                <option value="name">Name</option>
                <option value="status">Status</option>
              </select>
            </label>
            <label>
              Updated
              <select
                value={updatedWithinDays ?? ''}
                onChange={(event) =>
                  setUpdatedWithinDays(
                    event.target.value ? Number(event.target.value) : null
                  )
                }
              >
                <option value="">Any time</option>
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
                <option value="365">Last year</option>
              </select>
            </label>
          </div>
          {section.id === 'timeline' ? (
            <div className="vwb-filter-row">
              <label>
                Era
                <select
                  value={eraFilter}
                  onChange={(event) => setEraFilter(event.target.value)}
                >
                  <option value="">Any era</option>
                  {timelineEras.map((era) => (
                    <option value={era} key={era}>
                      {era}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Involved entry
                <select
                  value={involvedEntryFilter}
                  onChange={(event) =>
                    setInvolvedEntryFilter(event.target.value)
                  }
                >
                  <option value="">Any linked entry</option>
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
              checked={showArchived}
              onChange={(event) => setShowArchived(event.target.checked)}
              type="checkbox"
            />
            Show archived
          </label>
        </div>
        <div className="vwb-entry-list">
          {filteredEntries.length > 0 ? (
            filteredEntries.map((entry) => (
              <EntryCard
                entry={entry}
                isSelected={entry.id === selectedEntryId}
                key={entry.id}
                onSelect={() => selectEntry(entry.id)}
                section={section}
              />
            ))
          ) : (
            <div className="vwb-empty-results" role="status">
              <strong>
                {entries.length === 0
                  ? `No ${section.title.toLowerCase()} saved yet.`
                  : hasOnlyArchivedEntries && !showArchived
                  ? 'Only archived entries are in this section.'
                  : 'No entries found.'}
              </strong>
              <p>
                {entries.length === 0
                  ? `Create a ${section.singularTitle.toLowerCase()} when you are ready to draft this part of the world.`
                  : hasOnlyArchivedEntries && !showArchived
                  ? 'Show archived entries to review or restore them.'
                  : 'Try a different search term or clear the active filters.'}
              </p>
              {hasOnlyArchivedEntries && !showArchived ? (
                <button
                  className="vwb-secondary-button"
                  type="button"
                  onClick={() => setShowArchived(true)}
                >
                  Show Archived
                </button>
              ) : null}
              {hasActiveFilters ? (
                <button
                  className="vwb-secondary-button"
                  type="button"
                  onClick={clearFilters}
                >
                  Clear Filters
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
        {selectedEntry ? (
          <EntryDetail
            codex={codex}
            entry={selectedEntry}
            relationships={relationships}
            section={section}
            sections={sections}
          />
        ) : null}
        <EntryForm
          key={`${section.id}-${
            selectedEntry?.id ?? templateDraft?.name ?? 'new'
          }`}
          onCancel={() => {
            setSelectedEntryId(null);
            setTemplateDraft(null);
          }}
          onArchive={(entry) => {
            onArchiveEntry(entry, true);
            setSelectedEntryId(null);
            setTemplateDraft(null);
          }}
          onDelete={(entry) => setEntryPendingDelete(entry)}
          onDuplicate={(entry) => {
            const duplicatedEntry = duplicateEntry(section, entry);
            onSaveEntry(duplicatedEntry);
            setSelectedEntryId(duplicatedEntry.id);
            setTemplateDraft(null);
          }}
          onRestore={(entry) => {
            onArchiveEntry(entry, false);
            setSelectedEntryId(entry.id);
            setTemplateDraft(null);
            setShowArchived(true);
          }}
          onSave={(entry) => {
            onSaveEntry(entry);
            setSelectedEntryId(entry.id);
            setTemplateDraft(null);
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
          }}
          section={section}
          sectionEntries={entries}
          selectedEntry={selectedEntry}
          initialDraft={templateDraft ?? undefined}
          onDirtyChange={setIsEntryFormDirty}
          codex={codex}
          relationships={relationships}
          sections={sections}
        />
      </section>
      {entryPendingDelete ? (
        <ConfirmationDialog
          entry={entryPendingDelete}
          onCancel={() => setEntryPendingDelete(null)}
          onConfirm={() => {
            onDeleteEntry(entryPendingDelete);
            setSelectedEntryId(null);
            setTemplateDraft(null);
            setEntryPendingDelete(null);
          }}
        />
      ) : null}
    </main>
  );
}
