import { useMemo, useState, type FormEvent } from 'react';
import {
  getEntryStatusLabel,
  worldEntryStatusOptions,
} from '../Utlilities/codexEntries';
import {
  createEmptyRelationshipDraft,
  filterRelationships,
  getBrokenRelationships,
  getRelationshipEntries,
  getRelationshipGraph,
  getOrphanedEntries,
  relationshipFromDraft,
  relationshipTypeOptions,
  type RelationshipDraft,
  type RelationshipGraphFilters,
} from '../Utlilities/codexRelationships';
import { getSectionTags } from '../Utlilities/codexEntries';
import type {
  WorldCodex,
  WorldRelationship,
  WorldSectionConfig,
} from '../types';
import {
  confirmDiscardUnsavedChanges,
  hasUnsavedChanges,
  useUnsavedChangesWarning,
} from '../Utlilities/unsavedChanges';

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
  const entries = useMemo(
    () => getRelationshipEntries(codex, sections),
    [codex, sections]
  );
  const [draft, setDraft] = useState<RelationshipDraft>(() =>
    createEmptyRelationshipDraft()
  );
  const [editingRelationshipId, setEditingRelationshipId] = useState<
    string | null
  >(null);
  const [typeFilter, setTypeFilter] = useState('');
  const [entryFilter, setEntryFilter] = useState('');
  const [graphFilters, setGraphFilters] = useState<RelationshipGraphFilters>({
    sectionId: '',
    status: '',
    tag: '',
    type: '',
  });
  const [selectedGraphNodeId, setSelectedGraphNodeId] = useState('');
  const [error, setError] = useState('');

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
        ? {
            sourceEntryId: editingRelationship.sourceEntryId,
            targetEntryId: editingRelationship.targetEntryId,
            type: editingRelationship.type,
            directional: editingRelationship.directional,
            note: editingRelationship.note,
            status: editingRelationship.status,
          }
        : createEmptyRelationshipDraft(),
    [editingRelationship]
  );
  const isDraftDirty = hasUnsavedChanges(baselineDraft, draft);
  const entryById = useMemo(
    () => new Map(entries.map((entry) => [entry.id, entry])),
    [entries]
  );
  const fullEntryById = useMemo(
    () =>
      new Map(
        sections.flatMap((section) =>
          (codex[section.id] ?? []).map((entry) => [entry.id, entry] as const)
        )
      ),
    [codex, sections]
  );
  const availableRelationshipTypes = Array.from(
    new Set(relationships.map((relationship) => relationship.type))
  ).sort((first, second) => first.localeCompare(second));
  const relationshipTypeSuggestions = Array.from(
    new Set([...relationshipTypeOptions, ...availableRelationshipTypes])
  ).sort((first, second) => first.localeCompare(second));
  const availableTags = useMemo(
    () =>
      getSectionTags(sections.flatMap((section) => codex[section.id] ?? [])),
    [codex, sections]
  );
  const displayedRelationships = useMemo(
    () =>
      filterRelationships(relationships, {
        type: typeFilter,
        entryId: entryFilter,
      }),
    [entryFilter, relationships, typeFilter]
  );
  const graph = useMemo(
    () =>
      getRelationshipGraph(
        displayedRelationships,
        codex,
        sections,
        graphFilters
      ),
    [codex, displayedRelationships, graphFilters, sections]
  );
  const brokenRelationships = useMemo(
    () => getBrokenRelationships(relationships, codex, sections),
    [codex, relationships, sections]
  );
  const orphanedEntries = useMemo(
    () => getOrphanedEntries(relationships, codex, sections),
    [codex, relationships, sections]
  );
  const selectedGraphNode = useMemo(
    () => graph.nodes.find((node) => node.id === selectedGraphNodeId) ?? null,
    [graph.nodes, selectedGraphNodeId]
  );
  const selectedGraphEntry = selectedGraphNode
    ? fullEntryById.get(selectedGraphNode.id) ?? null
    : null;

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
    setDraft({
      sourceEntryId: relationship.sourceEntryId,
      targetEntryId: relationship.targetEntryId,
      type: relationship.type,
      directional: relationship.directional,
      note: relationship.note,
      status: relationship.status,
    });
    setEditingRelationshipId(relationship.id);
    setError('');
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!draft.sourceEntryId || !draft.targetEntryId) {
      setError('Choose both source and target entries.');
      return;
    }
    if (draft.sourceEntryId === draft.targetEntryId) {
      setError('Choose two different entries.');
      return;
    }
    if (!draft.type.trim()) {
      setError('Relationship type is required.');
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

  return (
    <main
      className="vwb-main vwb-relationships-layout"
      id="main-content"
      tabIndex={-1}
    >
      <section className="vwb-panel vwb-section-intro">
        <p className="vwb-kicker">World logic</p>
        <h1>Relationships</h1>
        <p>
          Connect entries into alliances, memberships, causes, references, and
          other links that make the world easier to reason about.
        </p>
      </section>

      <section
        className="vwb-panel"
        aria-labelledby="relationship-health-title"
      >
        <div className="vwb-section-heading">
          <div>
            <p className="vwb-kicker">Relationship health</p>
            <h2 id="relationship-health-title">Diagnostics</h2>
          </div>
        </div>
        <div className="vwb-diagnostics-grid">
          <article className="vwb-diagnostic-card">
            <span className="vwb-entry-kind">Broken references</span>
            <strong>{brokenRelationships.length}</strong>
            <p>
              Relationships with a missing source or target after imports or
              deletes.
            </p>
          </article>
          <article className="vwb-diagnostic-card">
            <span className="vwb-entry-kind">Orphaned records</span>
            <strong>{orphanedEntries.length}</strong>
            <p>Entries with no saved relationship links yet.</p>
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
                    {relationship.sourceEntry?.name ??
                      relationship.sourceEntryId}{' '}
                    <span>{relationship.type}</span>{' '}
                    {relationship.targetEntry?.name ??
                      relationship.targetEntryId}
                  </strong>
                </div>
                <button
                  className="vwb-secondary-button"
                  type="button"
                  onClick={() => startEditing(relationship)}
                >
                  Edit Link
                </button>
                <button
                  className="vwb-secondary-button vwb-danger-button"
                  type="button"
                  onClick={() => onDeleteRelationship(relationship.id)}
                >
                  Delete Broken Link
                </button>
              </article>
            ))}
          </div>
        ) : (
          <div className="vwb-empty-results" role="status">
            <strong>No broken relationships.</strong>
            <p>
              Every saved relationship currently resolves to existing records.
            </p>
          </div>
        )}
        {orphanedEntries.length > 0 ? (
          <div className="vwb-orphan-list" aria-label="Orphaned records">
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
            <h2 id="relationship-form-title">Relationship editor</h2>
          </div>
          {isDraftDirty ? (
            <span className="vwb-status-pill">Unsaved</span>
          ) : null}
        </div>
        {entries.length < 2 ? (
          <div className="vwb-empty-results" role="status">
            <strong>Create at least two entries first.</strong>
            <p>Relationships need a source and a target record.</p>
          </div>
        ) : (
          <form className="vwb-form" onSubmit={handleSubmit}>
            <div className="vwb-form-grid">
              <label>
                Source
                <select
                  value={draft.sourceEntryId}
                  onChange={(event) =>
                    updateDraft('sourceEntryId', event.target.value)
                  }
                >
                  <option value="">Choose source</option>
                  {entries.map((entry) => (
                    <option value={entry.id} key={entry.id}>
                      {entry.name} ({entry.sectionTitle})
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Target
                <select
                  value={draft.targetEntryId}
                  onChange={(event) =>
                    updateDraft('targetEntryId', event.target.value)
                  }
                >
                  <option value="">Choose target</option>
                  {entries.map((entry) => (
                    <option value={entry.id} key={entry.id}>
                      {entry.name} ({entry.sectionTitle})
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Type
                <input
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
                Status
                <select
                  value={draft.status}
                  onChange={(event) =>
                    updateDraft(
                      'status',
                      event.target.value as RelationshipDraft['status']
                    )
                  }
                >
                  {worldEntryStatusOptions.map((option) => (
                    <option value={option.value} key={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="vwb-wide-field">
                Note
                <textarea
                  rows={4}
                  value={draft.note}
                  onChange={(event) => updateDraft('note', event.target.value)}
                  placeholder="Why this relationship matters"
                />
              </label>
            </div>
            <label className="vwb-inline-toggle">
              <input
                checked={draft.directional}
                onChange={(event) =>
                  updateDraft('directional', event.target.checked)
                }
                type="checkbox"
              />
              Directional relationship
            </label>
            {error ? (
              <p className="vwb-form-error" role="alert">
                {error}
              </p>
            ) : null}
            <div className="vwb-form-actions">
              <button className="vwb-primary-button" type="submit">
                {editingRelationship
                  ? 'Update Relationship'
                  : 'Add Relationship'}
              </button>
              {editingRelationship ? (
                <button
                  className="vwb-secondary-button"
                  type="button"
                  onClick={() => resetForm()}
                >
                  Cancel Edit
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
            <h2 id="relationship-list-title">Relationship list</h2>
          </div>
        </div>
        {relationships.length > 0 ? (
          <>
            <div className="vwb-filter-panel" aria-label="Relationship filters">
              <div className="vwb-filter-row">
                <label>
                  Type
                  <select
                    value={typeFilter}
                    onChange={(event) => setTypeFilter(event.target.value)}
                  >
                    <option value="">Any type</option>
                    {availableRelationshipTypes.map((type) => (
                      <option value={type} key={type}>
                        {type}
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
              {typeFilter || entryFilter ? (
                <button
                  className="vwb-secondary-button vwb-clear-filters-button"
                  type="button"
                  onClick={() => {
                    setTypeFilter('');
                    setEntryFilter('');
                  }}
                >
                  Clear Filters
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
                        {relationship.directional ? 'Directional' : 'Mutual'} -{' '}
                        {getEntryStatusLabel(relationship.status)}
                      </span>
                      <strong>
                        {getEntryLabel(relationship.sourceEntryId)}{' '}
                        <span>{relationship.type}</span>{' '}
                        {getEntryLabel(relationship.targetEntryId)}
                      </strong>
                    </div>
                    {relationship.note ? <p>{relationship.note}</p> : null}
                    <div className="vwb-form-actions">
                      <button
                        className="vwb-secondary-button"
                        type="button"
                        onClick={() => startEditing(relationship)}
                      >
                        Edit
                      </button>
                      <button
                        className="vwb-secondary-button vwb-danger-button"
                        type="button"
                        onClick={() => {
                          onDeleteRelationship(relationship.id);
                          if (editingRelationshipId === relationship.id) {
                            resetForm(true);
                          }
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="vwb-empty-results" role="status">
                <strong>No relationships match the filters.</strong>
                <p>Clear filters or choose a different type or entry.</p>
              </div>
            )}
          </>
        ) : (
          <div className="vwb-empty-results" role="status">
            <strong>No relationships yet.</strong>
            <p>Add a link to start building the world graph.</p>
          </div>
        )}
      </section>

      <section className="vwb-panel" aria-labelledby="relationship-graph-title">
        <div className="vwb-section-heading">
          <div>
            <p className="vwb-kicker">{graph.nodes.length} connected records</p>
            <h2 id="relationship-graph-title">Graph view</h2>
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
                <option value="">Any section</option>
                {sections.map((section) => (
                  <option value={section.id} key={section.id}>
                    {section.title}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Status
              <select
                value={graphFilters.status}
                onChange={(event) =>
                  updateGraphFilter(
                    'status',
                    event.target.value as RelationshipGraphFilters['status']
                  )
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
              Tag
              <select
                value={graphFilters.tag}
                onChange={(event) =>
                  updateGraphFilter('tag', event.target.value)
                }
              >
                <option value="">Any tag</option>
                {availableTags.map((tag) => (
                  <option value={tag} key={tag}>
                    {tag}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Link type
              <select
                value={graphFilters.type}
                onChange={(event) =>
                  updateGraphFilter('type', event.target.value)
                }
              >
                <option value="">Any type</option>
                {availableRelationshipTypes.map((type) => (
                  <option value={type} key={type}>
                    {type}
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
              Clear Graph Filters
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
                    {node.sectionTitle} - {getEntryStatusLabel(node.status)}
                  </small>
                </button>
              ))}
            </div>
            <div className="vwb-graph-edges" aria-label="Graph edges">
              {graph.edges.map((edge) => (
                <div className="vwb-graph-edge" key={edge.id}>
                  <span>{getEntryLabel(edge.sourceId)}</span>
                  <strong>
                    {edge.directional ? '->' : '<->'} {edge.label}
                  </strong>
                  <span>{getEntryLabel(edge.targetId)}</span>
                </div>
              ))}
            </div>
            {selectedGraphNode && selectedGraphEntry ? (
              <article className="vwb-graph-detail" aria-live="polite">
                <span className="vwb-entry-kind">
                  {selectedGraphNode.sectionTitle}
                </span>
                <h3>{selectedGraphNode.name}</h3>
                <p>{selectedGraphEntry.summary || 'No summary yet.'}</p>
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
            <strong>No graph yet.</strong>
            <p>
              Graph rows appear once saved relationships have valid endpoints.
            </p>
          </div>
        )}
      </section>
    </main>
  );
}
