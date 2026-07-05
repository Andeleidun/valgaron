import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { NavLink, useSearchParams } from 'react-router-dom';
import {
  createEmptyRelationshipDraft,
  draftFromRelationship,
  formatDestructiveActionTitle,
  formatDraftValidationErrors,
  getCodexHelpRoute,
  getCodexScreenIntro,
  getDestructiveActionCopy,
  getRelationshipDiagnosticsModel,
  getRelationshipEditorOptionsModel,
  getRelationshipGraphViewModel,
  getRelationshipListModel,
  relationshipDirectionalControl,
  relationshipDraftStatusControl,
  relationshipFeatureCopy,
  relationshipGraphStatusFilterControl,
  relationshipGraphTypeFilterControl,
  relationshipListTypeFilterControl,
  relationshipNoteControl,
  relationshipSourceControl,
  relationshipTargetControl,
  relationshipTypeControl,
  relationshipFromDraft,
  validateRelationshipDraft,
  type RelationshipDraft,
  type RelationshipGraphFilters,
  type WorldCodex,
  type WorldRelationship,
  type WorldSectionConfig,
} from '@valgaron/core';
import {
  confirmDiscardUnsavedChanges,
  hasUnsavedChanges,
  useUnsavedChangesWarning,
} from '../Utlilities/unsavedChanges';
import { useDialogFocus } from '../Utlilities/dialogFocus';

type RelationshipPendingDelete = {
  id: string;
  label: string;
};

function RelationshipDeleteDialog({
  pendingDelete,
  onCancel,
  onConfirm,
}: {
  pendingDelete: RelationshipPendingDelete;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const dialogRef = useDialogFocus<HTMLElement>(true, onCancel);
  const copy = getDestructiveActionCopy('delete-relationship');

  return (
    <div className="vwb-dialog-backdrop" role="presentation">
      <section
        aria-labelledby="relationship-delete-title"
        aria-describedby="relationship-delete-description"
        className="vwb-dialog"
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        tabIndex={-1}
      >
        <p className="vwb-kicker">Permanent delete</p>
        <h2 id="relationship-delete-title">
          {formatDestructiveActionTitle(
            'delete-relationship',
            pendingDelete.label
          )}
        </h2>
        <p id="relationship-delete-description">{copy.message}</p>
        <div className="vwb-form-actions">
          <button
            className="vwb-secondary-button"
            type="button"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            className="vwb-primary-button vwb-danger-confirm-button"
            type="button"
            onClick={onConfirm}
          >
            {copy.confirmLabel}
          </button>
        </div>
      </section>
    </div>
  );
}

export function RelationshipsPage({
  codex,
  relationships,
  sections,
  onDeleteRelationship,
  onSaveRelationship,
}: {
  codex: WorldCodex;
  relationships: readonly WorldRelationship[];
  sections: readonly WorldSectionConfig[];
  onDeleteRelationship: (relationshipId: string) => void;
  onSaveRelationship: (relationship: WorldRelationship) => void;
}) {
  const [searchParams] = useSearchParams();
  const requestedEntryId = searchParams.get('entryId');
  const requestedEntryQuery = searchParams.get('entryQuery');
  const requestedRelationshipQuery = searchParams.get('relationshipQuery');
  const appliedRouteKeyRef = useRef('');
  const [draft, setDraft] = useState<RelationshipDraft>(() =>
    createEmptyRelationshipDraft()
  );
  const [editingRelationshipId, setEditingRelationshipId] = useState<
    string | null
  >(null);
  const [typeFilter, setTypeFilter] = useState('');
  const [entryFilter, setEntryFilter] = useState('');
  const [relationshipQuery, setRelationshipQuery] = useState('');
  const [graphFilters, setGraphFilters] = useState<RelationshipGraphFilters>({
    sectionId: '',
    status: '',
    tag: '',
    type: '',
  });
  const [selectedGraphNodeId, setSelectedGraphNodeId] = useState('');
  const [error, setError] = useState('');
  const [pendingDelete, setPendingDelete] =
    useState<RelationshipPendingDelete | null>(null);
  const intro = getCodexScreenIntro('relationships');
  const routeKey = [
    requestedEntryId ?? '',
    requestedEntryQuery ?? '',
    requestedRelationshipQuery ?? '',
  ].join('|');

  const editingRelationship = useMemo(
    () =>
      relationships.find(
        (relationship) => relationship.id === editingRelationshipId
      ) ?? null,
    [editingRelationshipId, relationships]
  );
  const baselineDraft = useMemo<RelationshipDraft>(
    () =>
      editingRelationship
        ? draftFromRelationship(editingRelationship)
        : createEmptyRelationshipDraft(),
    [editingRelationship]
  );
  const isDraftDirty = hasUnsavedChanges(baselineDraft, draft);
  const relationshipOptions = useMemo(
    () =>
      getRelationshipEditorOptionsModel(
        { codex, entryTypes: sections, relationships },
        draft,
        entryFilter
      ),
    [
      codex,
      draft.sourceEntryId,
      draft.targetEntryId,
      entryFilter,
      relationships,
      sections,
    ]
  );
  const entries = relationshipOptions.entries;
  const relationshipEntryOptions = relationshipOptions.entryOptions;
  const entryById = useMemo(
    () => new Map(entries.map((entry) => [entry.id, entry])),
    [entries]
  );
  const relationshipById = useMemo(
    () =>
      new Map(
        relationships.map((relationship) => [relationship.id, relationship])
      ),
    [relationships]
  );
  const relationshipTypeSuggestions =
    relationshipOptions.relationshipTypeSuggestions;
  const relationshipTypeFilterOptions =
    relationshipOptions.relationshipTypeFilterOptions;
  const availableTags = relationshipOptions.graphTagOptions;
  const workspaceModel = useMemo(
    () => ({ codex, entryTypes: sections, relationships }),
    [codex, relationships, sections]
  );
  const displayedRelationships = useMemo(
    () =>
      getRelationshipListModel(workspaceModel, {
        type: typeFilter,
        entryId: entryFilter,
        query: relationshipQuery,
      }),
    [entryFilter, relationshipQuery, typeFilter, workspaceModel]
  );
  const graph = useMemo(
    () => getRelationshipGraphViewModel(workspaceModel, graphFilters),
    [graphFilters, workspaceModel]
  );
  const relationshipDiagnostics = useMemo(
    () => getRelationshipDiagnosticsModel(workspaceModel),
    [workspaceModel]
  );
  const brokenRelationships = relationshipDiagnostics.brokenRelationships;
  const orphanedEntries = relationshipDiagnostics.orphanedEntries;
  const relationshipHealth = relationshipDiagnostics.healthSummary;
  const selectedGraphNode = useMemo(
    () => graph.nodes.find((node) => node.id === selectedGraphNodeId) ?? null,
    [graph.nodes, selectedGraphNodeId]
  );

  const updateGraphFilter = <TKey extends keyof RelationshipGraphFilters>(
    key: TKey,
    value: RelationshipGraphFilters[TKey]
  ) => {
    setGraphFilters((currentFilters) => ({
      ...currentFilters,
      [key]: value,
    }));
    setSelectedGraphNodeId('');
  };

  const clearGraphFilters = () => {
    setGraphFilters({
      sectionId: '',
      status: '',
      tag: '',
      type: '',
    });
    setSelectedGraphNodeId('');
  };

  useUnsavedChangesWarning(isDraftDirty);

  useEffect(() => {
    if (appliedRouteKeyRef.current === routeKey) {
      return;
    }
    if (
      !requestedEntryId &&
      requestedEntryQuery === null &&
      requestedRelationshipQuery === null
    ) {
      appliedRouteKeyRef.current = routeKey;
      return;
    }
    const nextRelationshipQuery =
      requestedRelationshipQuery ?? requestedEntryQuery;
    if (!requestedEntryId) {
      if (nextRelationshipQuery !== null) {
        setRelationshipQuery(nextRelationshipQuery);
      }
      appliedRouteKeyRef.current = routeKey;
      return;
    }
    if (!entryById.has(requestedEntryId)) {
      if (nextRelationshipQuery !== null) {
        setRelationshipQuery(nextRelationshipQuery);
      }
      appliedRouteKeyRef.current = routeKey;
      return;
    }
    if (!confirmDiscardUnsavedChanges(isDraftDirty)) {
      return;
    }
    setEntryFilter(requestedEntryId);
    if (nextRelationshipQuery !== null) {
      setRelationshipQuery(nextRelationshipQuery);
    }
    setDraft((currentDraft) => ({
      ...currentDraft,
      sourceEntryId: requestedEntryId,
    }));
    appliedRouteKeyRef.current = routeKey;
  }, [
    entryById,
    isDraftDirty,
    requestedEntryId,
    requestedEntryQuery,
    requestedRelationshipQuery,
    routeKey,
  ]);

  const resetForm = (force = false) => {
    if (!force && !confirmDiscardUnsavedChanges(isDraftDirty)) {
      return;
    }
    setDraft(createEmptyRelationshipDraft());
    setEditingRelationshipId(null);
    setError('');
  };

  const startEditing = (relationship: WorldRelationship) => {
    if (!confirmDiscardUnsavedChanges(isDraftDirty)) {
      return;
    }
    setDraft(draftFromRelationship(relationship));
    setEditingRelationshipId(relationship.id);
    setError('');
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validation = validateRelationshipDraft(
      draft,
      entries.map((entry) => entry.id)
    );
    if (!validation.ok) {
      setError(formatDraftValidationErrors(validation));
      return;
    }
    onSaveRelationship(
      relationshipFromDraft(draft, editingRelationship ?? undefined)
    );
    resetForm(true);
  };

  const updateDraft = <TKey extends keyof RelationshipDraft>(
    key: TKey,
    value: RelationshipDraft[TKey]
  ) => {
    setDraft((currentDraft) => ({ ...currentDraft, [key]: value }));
  };

  const getEntryLabel = (entryId: string): string =>
    entryById.get(entryId)?.name ?? 'Missing entry';

  const getRelationshipLabel = (relationship: WorldRelationship): string =>
    `${getEntryLabel(relationship.sourceEntryId)} ${
      relationship.type
    } ${getEntryLabel(relationship.targetEntryId)}`;

  const requestDeleteRelationship = (relationship: WorldRelationship) => {
    if (
      editingRelationshipId === relationship.id &&
      !confirmDiscardUnsavedChanges(isDraftDirty)
    ) {
      return;
    }
    setPendingDelete({
      id: relationship.id,
      label: getRelationshipLabel(relationship),
    });
  };

  const startEditingById = (relationshipId: string) => {
    const relationship = relationshipById.get(relationshipId);
    if (relationship) {
      startEditing(relationship);
    }
  };

  const requestDeleteRelationshipById = (relationshipId: string) => {
    const relationship = relationshipById.get(relationshipId);
    if (relationship) {
      requestDeleteRelationship(relationship);
    }
  };

  const confirmDeleteRelationship = () => {
    if (!pendingDelete) {
      return;
    }
    onDeleteRelationship(pendingDelete.id);
    if (editingRelationshipId === pendingDelete.id) {
      resetForm(true);
    }
    setPendingDelete(null);
  };

  return (
    <main
      className="vwb-main vwb-relationships-layout"
      id="main-content"
      tabIndex={-1}
    >
      <section className="vwb-panel vwb-section-intro">
        <p className="vwb-kicker">{intro.kicker}</p>
        <h1>{intro.title}</h1>
        <p>{intro.detail}</p>
        <NavLink
          className="vwb-secondary-button"
          to={getCodexHelpRoute('relationships')}
          onClick={(event) => {
            if (!confirmDiscardUnsavedChanges(isDraftDirty)) {
              event.preventDefault();
            }
          }}
        >
          {relationshipFeatureCopy.helpLabel}
        </NavLink>
      </section>

      <section
        className="vwb-panel"
        aria-labelledby="relationship-health-title"
      >
        <div className="vwb-section-heading">
          <div>
            <p className="vwb-kicker">
              {relationshipFeatureCopy.healthSectionTitle}
            </p>
            <h2 id="relationship-health-title">
              {relationshipFeatureCopy.diagnosticsTitle}
            </h2>
          </div>
        </div>
        <div className="vwb-diagnostics-grid">
          <article className="vwb-diagnostic-card">
            <span className="vwb-entry-kind">
              {relationshipFeatureCopy.brokenReferencesLabel}
            </span>
            <strong>{relationshipHealth.brokenRelationshipCount}</strong>
            <p>{relationshipFeatureCopy.brokenReferencesDetail}</p>
          </article>
          <article className="vwb-diagnostic-card">
            <span className="vwb-entry-kind">
              {relationshipFeatureCopy.orphanedRecordsLabel}
            </span>
            <strong>{relationshipHealth.orphanedEntryCount}</strong>
            <p>{relationshipFeatureCopy.orphanedRecordsDetail}</p>
          </article>
        </div>
        {brokenRelationships.length > 0 ? (
          <div className="vwb-relationship-list">
            {brokenRelationships.map((relationship) => (
              <article className="vwb-relationship-row" key={relationship.id}>
                <div>
                  <span className="vwb-entry-kind">
                    {relationship.missingSource ? 'Missing source' : ''}
                    {relationship.missingSource && relationship.missingTarget
                      ? ' and '
                      : ''}
                    {relationship.missingTarget ? 'Missing target' : ''}
                  </span>
                  <strong>
                    {relationship.sourceName} <span>{relationship.type}</span>{' '}
                    {relationship.targetName}
                  </strong>
                </div>
                <button
                  className="vwb-secondary-button"
                  type="button"
                  onClick={() => startEditingById(relationship.id)}
                >
                  {relationshipFeatureCopy.repairLabel}
                </button>
                <button
                  className="vwb-secondary-button vwb-danger-button"
                  type="button"
                  onClick={() => requestDeleteRelationshipById(relationship.id)}
                >
                  {relationshipFeatureCopy.deleteLabel}
                </button>
              </article>
            ))}
          </div>
        ) : (
          <div className="vwb-empty-results" role="status">
            <strong>
              {relationshipFeatureCopy.noBrokenRelationshipsTitle}
            </strong>
            <p>{relationshipFeatureCopy.noBrokenRelationshipsDetail}</p>
          </div>
        )}
        {orphanedEntries.length > 0 ? (
          <div
            className="vwb-orphan-list"
            aria-label={relationshipFeatureCopy.orphanedRecordsLabel}
          >
            {orphanedEntries.slice(0, 10).map((entry) => (
              <span className="vwb-tag" key={entry.id}>
                {entry.name} ({entry.sectionTitle})
              </span>
            ))}
            {orphanedEntries.length > 10 ? (
              <span className="vwb-tag">
                {orphanedEntries.length - 10} more
              </span>
            ) : null}
          </div>
        ) : null}
      </section>

      <section className="vwb-panel" aria-labelledby="relationship-form-title">
        <div className="vwb-section-heading">
          <div>
            <p className="vwb-kicker">
              {editingRelationship ? 'Edit link' : 'New link'}
            </p>
            <h2 id="relationship-form-title">
              {relationshipFeatureCopy.relationshipFormTitle}
            </h2>
          </div>
          {isDraftDirty ? (
            <span className="vwb-status-pill">Unsaved</span>
          ) : null}
        </div>
        {entries.length < 2 ? (
          <div className="vwb-empty-results" role="status">
            <strong>{relationshipFeatureCopy.minimumEntriesTitle}</strong>
            <p>{relationshipFeatureCopy.minimumEntriesDetail}</p>
          </div>
        ) : (
          <form className="vwb-form" onSubmit={handleSubmit}>
            <div className="vwb-form-grid">
              <label>
                {relationshipSourceControl.label}
                <select
                  aria-label={relationshipSourceControl.accessibilityLabel}
                  value={draft.sourceEntryId}
                  onChange={(event) =>
                    updateDraft('sourceEntryId', event.target.value)
                  }
                >
                  {relationshipEntryOptions.map((option) => (
                    <option value={option.value} key={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                {relationshipTargetControl.label}
                <select
                  aria-label={relationshipTargetControl.accessibilityLabel}
                  value={draft.targetEntryId}
                  onChange={(event) =>
                    updateDraft('targetEntryId', event.target.value)
                  }
                >
                  {relationshipEntryOptions.map((option) => (
                    <option value={option.value} key={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                {relationshipTypeControl.label}
                <input
                  aria-label={relationshipTypeControl.accessibilityLabel}
                  list="relationship-type-suggestions"
                  value={draft.type}
                  onChange={(event) => updateDraft('type', event.target.value)}
                  placeholder="member of, rivals, owes debt to"
                />
                <datalist id="relationship-type-suggestions">
                  {relationshipTypeSuggestions.map((type) => (
                    <option value={type} key={type} />
                  ))}
                </datalist>
              </label>
              <label>
                {relationshipDraftStatusControl.label}
                <select
                  aria-label={relationshipDraftStatusControl.accessibilityLabel}
                  value={draft.status}
                  onChange={(event) =>
                    updateDraft(
                      'status',
                      event.target.value as RelationshipDraft['status']
                    )
                  }
                >
                  {relationshipDraftStatusControl.options.map((option) => (
                    <option value={option.value} key={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="vwb-wide-field">
                {relationshipNoteControl.label}
                <textarea
                  aria-label={relationshipNoteControl.accessibilityLabel}
                  rows={4}
                  value={draft.note}
                  onChange={(event) => updateDraft('note', event.target.value)}
                  placeholder="Why this relationship matters"
                />
              </label>
            </div>
            <label className="vwb-inline-toggle">
              <input
                aria-label={relationshipDirectionalControl.accessibilityLabel}
                checked={draft.directional}
                onChange={(event) =>
                  updateDraft('directional', event.target.checked)
                }
                type="checkbox"
              />
              {relationshipDirectionalControl.label}
            </label>
            {error ? (
              <p className="vwb-form-error" role="alert">
                {error}
              </p>
            ) : null}
            <div className="vwb-form-actions">
              <button className="vwb-primary-button" type="submit">
                {relationshipFeatureCopy.saveRelationshipLabel}
              </button>
              {editingRelationship ? (
                <button
                  className="vwb-secondary-button"
                  type="button"
                  onClick={() => resetForm()}
                >
                  {relationshipFeatureCopy.clearDraftLabel}
                </button>
              ) : null}
            </div>
          </form>
        )}
      </section>

      <section className="vwb-panel" aria-labelledby="relationship-list-title">
        <div className="vwb-section-heading">
          <div>
            <p className="vwb-kicker">
              {displayedRelationships.length} of {relationships.length} links
            </p>
            <h2 id="relationship-list-title">
              {relationshipFeatureCopy.savedSectionTitle}
            </h2>
          </div>
        </div>
        {relationships.length > 0 ? (
          <>
            <div className="vwb-filter-panel" aria-label="Relationship filters">
              <div className="vwb-filter-row">
                <label>
                  {relationshipFeatureCopy.searchRelationshipsLabel}
                  <input
                    value={relationshipQuery}
                    onChange={(event) =>
                      setRelationshipQuery(event.target.value)
                    }
                    placeholder="Entry, type, note, or id"
                    type="search"
                  />
                </label>
                <label>
                  {relationshipListTypeFilterControl.label}
                  <select
                    aria-label={
                      relationshipListTypeFilterControl.accessibilityLabel
                    }
                    value={typeFilter}
                    onChange={(event) => setTypeFilter(event.target.value)}
                  >
                    {relationshipTypeFilterOptions.map((option) => (
                      <option value={option.value} key={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Entry
                  <select
                    value={entryFilter}
                    onChange={(event) => setEntryFilter(event.target.value)}
                  >
                    <option value="">Any entry</option>
                    {entries.map((entry) => (
                      <option value={entry.id} key={entry.id}>
                        {entry.name} ({entry.sectionTitle})
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              {typeFilter || entryFilter || relationshipQuery ? (
                <button
                  className="vwb-secondary-button vwb-clear-filters-button"
                  type="button"
                  onClick={() => {
                    setTypeFilter('');
                    setEntryFilter('');
                    setRelationshipQuery('');
                  }}
                >
                  {relationshipFeatureCopy.clearFiltersLabel}
                </button>
              ) : null}
            </div>
            {displayedRelationships.length > 0 ? (
              <div className="vwb-relationship-list">
                {displayedRelationships.map((relationship) => (
                  <article
                    className="vwb-relationship-row"
                    key={relationship.id}
                  >
                    <div>
                      <span className="vwb-entry-kind">
                        {relationship.directionLabel === '->'
                          ? 'Directional'
                          : 'Mutual'}{' '}
                        - {relationship.statusLabel}
                      </span>
                      <strong>
                        {relationship.sourceName}{' '}
                        <span>{relationship.type}</span>{' '}
                        {relationship.targetName}
                      </strong>
                    </div>
                    {relationship.note ? <p>{relationship.note}</p> : null}
                    <div className="vwb-form-actions">
                      <button
                        className="vwb-secondary-button"
                        type="button"
                        onClick={() => startEditingById(relationship.id)}
                      >
                        {relationshipFeatureCopy.editLabel}
                      </button>
                      <button
                        className="vwb-secondary-button vwb-danger-button"
                        type="button"
                        onClick={() =>
                          requestDeleteRelationshipById(relationship.id)
                        }
                      >
                        {relationshipFeatureCopy.deleteLabel}
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="vwb-empty-results" role="status">
                <strong>{relationshipFeatureCopy.noMatchesTitle}</strong>
                <p>{relationshipFeatureCopy.noMatchesDetail}</p>
              </div>
            )}
          </>
        ) : (
          <div className="vwb-empty-results" role="status">
            <strong>{relationshipFeatureCopy.emptyTitle}</strong>
            <p>{relationshipFeatureCopy.emptyDetail}</p>
          </div>
        )}
      </section>

      <section className="vwb-panel" aria-labelledby="relationship-graph-title">
        <div className="vwb-section-heading">
          <div>
            <p className="vwb-kicker">{graph.nodes.length} connected records</p>
            <h2 id="relationship-graph-title">
              {relationshipFeatureCopy.graphViewTitle}
            </h2>
          </div>
        </div>
        <div className="vwb-filter-panel" aria-label="Graph filters">
          <div className="vwb-filter-row">
            <label>
              Section
              <select
                value={graphFilters.sectionId}
                onChange={(event) =>
                  updateGraphFilter('sectionId', event.target.value)
                }
              >
                <option value="">
                  {relationshipFeatureCopy.anySectionLabel}
                </option>
                {sections.map((section) => (
                  <option value={section.id} key={section.id}>
                    {section.title}
                  </option>
                ))}
              </select>
            </label>
            <label>
              {relationshipGraphStatusFilterControl.label}
              <select
                aria-label={
                  relationshipGraphStatusFilterControl.accessibilityLabel
                }
                value={graphFilters.status}
                onChange={(event) =>
                  updateGraphFilter(
                    'status',
                    event.target.value as RelationshipGraphFilters['status']
                  )
                }
              >
                {relationshipGraphStatusFilterControl.options.map((option) => (
                  <option value={option.value} key={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Tag
              <select
                value={graphFilters.tag}
                onChange={(event) =>
                  updateGraphFilter('tag', event.target.value)
                }
              >
                <option value="">{relationshipFeatureCopy.allTagsLabel}</option>
                {availableTags.map((tag) => (
                  <option value={tag} key={tag}>
                    {tag}
                  </option>
                ))}
              </select>
            </label>
            <label>
              {relationshipGraphTypeFilterControl.label}
              <select
                aria-label={
                  relationshipGraphTypeFilterControl.accessibilityLabel
                }
                value={graphFilters.type}
                onChange={(event) =>
                  updateGraphFilter('type', event.target.value)
                }
              >
                {relationshipTypeFilterOptions.map((option) => (
                  <option value={option.value} key={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          {graphFilters.sectionId ||
          graphFilters.status ||
          graphFilters.tag ||
          graphFilters.type ? (
            <button
              className="vwb-secondary-button vwb-clear-filters-button"
              type="button"
              onClick={clearGraphFilters}
            >
              {relationshipFeatureCopy.clearGraphFiltersLabel}
            </button>
          ) : null}
        </div>
        {graph.edges.length > 0 ? (
          <div className="vwb-graph-view">
            <div className="vwb-graph-nodes" aria-label="Graph nodes">
              {graph.nodes.map((node) => (
                <button
                  className={`vwb-graph-node ${
                    selectedGraphNodeId === node.id ? 'is-selected' : ''
                  }`}
                  type="button"
                  key={node.id}
                  onClick={() => setSelectedGraphNodeId(node.id)}
                >
                  <strong>{node.name}</strong>
                  <small>
                    {node.sectionTitle} - {node.statusLabel}
                  </small>
                </button>
              ))}
            </div>
            <div className="vwb-graph-edges" aria-label="Graph edges">
              {graph.edges.map((edge) => (
                <div className="vwb-graph-edge" key={edge.id}>
                  <span>{edge.sourceName}</span>
                  <strong>
                    {edge.directionLabel} {edge.label}
                  </strong>
                  <span>{edge.targetName}</span>
                </div>
              ))}
            </div>
            {selectedGraphNode ? (
              <article className="vwb-graph-detail" aria-live="polite">
                <span className="vwb-entry-kind">
                  {selectedGraphNode.sectionTitle}
                </span>
                <h3>{selectedGraphNode.name}</h3>
                <p>{selectedGraphNode.summaryText}</p>
                {selectedGraphNode.tags.length > 0 ? (
                  <div className="vwb-tag-row" aria-label="Graph node tags">
                    {selectedGraphNode.tags.map((tag) => (
                      <span className="vwb-tag" key={tag}>
                        {tag}
                      </span>
                    ))}
                  </div>
                ) : null}
              </article>
            ) : null}
          </div>
        ) : (
          <div className="vwb-empty-results" role="status">
            <strong>{relationshipFeatureCopy.noGraphTitle}</strong>
            <p>{relationshipFeatureCopy.noGraphDetail}</p>
          </div>
        )}
      </section>
      {pendingDelete ? (
        <RelationshipDeleteDialog
          pendingDelete={pendingDelete}
          onCancel={() => setPendingDelete(null)}
          onConfirm={confirmDeleteRelationship}
        />
      ) : null}
    </main>
  );
}
