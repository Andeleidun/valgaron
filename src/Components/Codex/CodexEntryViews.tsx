import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { NavLink } from 'react-router-dom';
import {
  createEmptyDraft,
  createTemplateDraft,
  draftFromEntry,
  entryFromDraft,
  formatUpdatedAt,
  formatDestructiveActionTitle,
  formatDraftValidationErrors,
  getDetailValue,
  getCodexEntriesRoute,
  getCodexRelationshipsRoute,
  getDestructiveActionCopy,
  getEntries,
  getEntryRelationships,
  getEntryStatusLabel,
  getRelationshipEntries,
  getTimelineDiagnostics,
  getTimelineHighlights,
  getTimelineInvolvedEntryIdsByEvent,
  getTimelineOrderUpdates,
  groupTimelineEventsByEra,
  sortTimelineEvents,
  validateEntryDraft,
  type EntryDraft,
  worldEntryStatusOptions,
  type RelationshipWithEntries,
  type WorldCodex,
  type WorldDetailFieldKey,
  type WorldEntry,
  type WorldRelationship,
  type WorldSectionConfig,
} from '@valgaron/core';
import {
  confirmDiscardUnsavedChanges,
  hasUnsavedChanges,
  useUnsavedChangesWarning,
} from '../../Utlilities/unsavedChanges';
import { useDialogFocus } from '../../Utlilities/dialogFocus';

export function EntryCard({
  entry,
  section,
  isSelected,
  onSelect,
}: {
  entry: WorldEntry;
  section: WorldSectionConfig;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const detailPreview = section.detailFields
    .map((field) => getDetailValue(entry, field.key))
    .filter(Boolean)
    .slice(0, 2)
    .join(' | ');

  return (
    <button
      className={`vwb-entry-card vwb-entry-button ${
        isSelected ? 'is-selected' : ''
      }`}
      type="button"
      onClick={onSelect}
      aria-pressed={isSelected}
    >
      <span className="vwb-entry-card-header">
        <span>
          <span className="vwb-entry-kind">{section.singularTitle}</span>
          <strong>{entry.name}</strong>
        </span>
        <small>{getEntryStatusLabel(entry.status)}</small>
      </span>
      <span>{entry.summary || 'No summary yet.'}</span>
      {detailPreview ? <small>{detailPreview}</small> : null}
      {entry.tags.length > 0 ? (
        <span className="vwb-tag-row" aria-label="Tags">
          {entry.tags.map((tag) => (
            <span className="vwb-tag" key={tag}>
              {tag}
            </span>
          ))}
        </span>
      ) : null}
    </button>
  );
}

export function EntryDetail({
  codex,
  entry,
  relationships,
  section,
  sections,
}: {
  codex: WorldCodex;
  entry: WorldEntry;
  relationships: readonly WorldRelationship[];
  section: WorldSectionConfig;
  sections: readonly WorldSectionConfig[];
}) {
  const visibleDetails = section.detailFields
    .map((field) => ({
      label: field.label,
      value: getDetailValue(entry, field.key),
    }))
    .filter((field) => field.value);

  return (
    <article className="vwb-detail-panel" aria-labelledby="entry-detail-title">
      <div className="vwb-section-heading">
        <div>
          <p className="vwb-kicker">{section.singularTitle} detail</p>
          <h2 id="entry-detail-title">{entry.name}</h2>
        </div>
        <span className="vwb-status-pill">
          {getEntryStatusLabel(entry.status)}
        </span>
      </div>
      <p>{entry.summary || 'No summary yet.'}</p>
      <dl className="vwb-detail-list">
        <div>
          <dt>Updated</dt>
          <dd>{formatUpdatedAt(entry.updatedAt)}</dd>
        </div>
        <div>
          <dt>Created</dt>
          <dd>{formatUpdatedAt(entry.createdAt)}</dd>
        </div>
        <div>
          <dt>Pinned</dt>
          <dd>{entry.pinned ? 'Yes' : 'No'}</dd>
        </div>
        {visibleDetails.map((field) => (
          <div key={field.label}>
            <dt>{field.label}</dt>
            <dd>{field.value}</dd>
          </div>
        ))}
      </dl>
      {entry.tags.length > 0 ? (
        <div className="vwb-tag-row" aria-label="Tags">
          {entry.tags.map((tag) => (
            <span className="vwb-tag" key={tag}>
              {tag}
            </span>
          ))}
        </div>
      ) : null}
      {entry.notes ? (
        <section className="vwb-notes-block" aria-label="Markdown notes">
          <h3>Notes</h3>
          <pre>{entry.notes}</pre>
        </section>
      ) : null}
      <EntryRelationships
        codex={codex}
        entry={entry}
        relationships={relationships}
        sections={sections}
      />
    </article>
  );
}

function getRelationshipEntryPath(
  codex: WorldCodex,
  sections: readonly WorldSectionConfig[],
  entryId: string
): string {
  const section = sections.find((item) =>
    getEntries(codex, item.id).some((entry) => entry.id === entryId)
  );
  return section
    ? getCodexEntriesRoute({
        sectionId: section.id,
        entryId,
        intent: 'edit',
      })
    : '/relationships';
}

function formatRelationshipDirection(
  relationship: RelationshipWithEntries,
  currentEntryId: string
): string {
  if (!relationship.directional) {
    return 'Linked with';
  }
  return relationship.sourceEntryId === currentEntryId ? 'To' : 'From';
}

function getRelatedEntry(
  relationship: RelationshipWithEntries,
  currentEntryId: string
): WorldEntry | null {
  return relationship.sourceEntryId === currentEntryId
    ? relationship.targetEntry
    : relationship.sourceEntry;
}

function EntryRelationships({
  codex,
  entry,
  relationships,
  sections,
}: {
  codex: WorldCodex;
  entry: WorldEntry;
  relationships: readonly WorldRelationship[];
  sections: readonly WorldSectionConfig[];
}) {
  const linkedRelationships = getEntryRelationships(
    relationships,
    codex,
    sections,
    entry.id
  );

  return (
    <section className="vwb-relationship-panel" aria-labelledby="entry-links">
      <div className="vwb-section-heading">
        <div>
          <p className="vwb-kicker">Relationships</p>
          <h3 id="entry-links">Linked records</h3>
        </div>
        <NavLink
          className="vwb-secondary-button"
          to={getCodexRelationshipsRoute({
            entryId: entry.id,
            entryQuery: entry.name,
            relationshipQuery: entry.name,
          })}
        >
          Manage Links
        </NavLink>
      </div>
      {linkedRelationships.length > 0 ? (
        <div className="vwb-relationship-list">
          {linkedRelationships.map((relationship) => {
            const relatedEntry = getRelatedEntry(relationship, entry.id);
            return (
              <article className="vwb-relationship-row" key={relationship.id}>
                <div>
                  <span className="vwb-entry-kind">
                    {formatRelationshipDirection(relationship, entry.id)} -{' '}
                    {relationship.type}
                  </span>
                  {relatedEntry ? (
                    <NavLink
                      to={getRelationshipEntryPath(
                        codex,
                        sections,
                        relatedEntry.id
                      )}
                    >
                      {relatedEntry.name}
                    </NavLink>
                  ) : (
                    <strong>Missing entry</strong>
                  )}
                </div>
                {relationship.note ? <p>{relationship.note}</p> : null}
              </article>
            );
          })}
        </div>
      ) : (
        <div className="vwb-empty-results" role="status">
          <strong>No relationships yet.</strong>
          <p>Use the Relationships page to connect this record to the world.</p>
        </div>
      )}
    </section>
  );
}

export function TimelineOverview({
  codex,
  events,
  relationships,
  sections,
  onSaveEvents,
}: {
  codex: WorldCodex;
  events: readonly WorldEntry[];
  relationships: readonly WorldRelationship[];
  sections: readonly WorldSectionConfig[];
  onSaveEvents: (events: readonly WorldEntry[]) => void;
}) {
  const groupedEvents = groupTimelineEventsByEra(events);
  const sortedEvents = sortTimelineEvents(events);
  const diagnostics = getTimelineDiagnostics(events, relationships);
  const highlights = getTimelineHighlights(events);
  const involvedEntryIdsByEvent =
    getTimelineInvolvedEntryIdsByEvent(relationships);
  const entryById = new Map(
    getRelationshipEntries(codex, sections).map((entry) => [entry.id, entry])
  );
  const moveEvent = (eventId: string, direction: 'earlier' | 'later') => {
    const updates = getTimelineOrderUpdates(events, eventId, direction);
    if (updates.length > 0) {
      onSaveEvents(updates);
    }
  };

  return (
    <section className="vwb-panel vwb-timeline-overview">
      <div className="vwb-section-heading">
        <div>
          <p className="vwb-kicker">{events.length} visible events</p>
          <h2>Timeline view</h2>
        </div>
      </div>
      <div className="vwb-diagnostics-grid">
        <article className="vwb-diagnostic-card">
          <span className="vwb-entry-kind">Unordered events</span>
          <strong>{diagnostics.unorderedEvents.length}</strong>
          <p>Events without a numeric sort order.</p>
        </article>
        <article className="vwb-diagnostic-card">
          <span className="vwb-entry-kind">Duplicate orders</span>
          <strong>{diagnostics.duplicateOrderGroups.length}</strong>
          <p>Order values shared by more than one event.</p>
        </article>
        <article className="vwb-diagnostic-card">
          <span className="vwb-entry-kind">Unlinked events</span>
          <strong>{diagnostics.unlinkedEvents.length}</strong>
          <p>Timeline events with no relationship links.</p>
        </article>
      </div>
      {highlights.length > 0 ? (
        <div
          className="vwb-timeline-highlight-list"
          aria-label="Timeline highlights"
        >
          {highlights.map((event) => (
            <article className="vwb-timeline-highlight" key={event.id}>
              <span className="vwb-entry-kind">
                Order {event.fields.order || 'Unsorted'}
              </span>
              <strong>{event.name}</strong>
              <p>
                {event.fields.dateLabel || event.summary || 'No date label.'}
              </p>
            </article>
          ))}
        </div>
      ) : null}
      {sortedEvents.length > 0 ? (
        <div className="vwb-timeline-table-wrap">
          <table className="vwb-timeline-table">
            <caption>Timeline table</caption>
            <thead>
              <tr>
                <th scope="col">Order</th>
                <th scope="col">Event</th>
                <th scope="col">Date</th>
                <th scope="col">Era</th>
                <th scope="col">Links</th>
                <th scope="col">Move</th>
              </tr>
            </thead>
            <tbody>
              {sortedEvents.map((event, index) => {
                const involvedEntryIds =
                  involvedEntryIdsByEvent.get(event.id) ?? [];
                return (
                  <tr key={event.id}>
                    <td>{event.fields.order || 'Unsorted'}</td>
                    <td>{event.name}</td>
                    <td>{event.fields.dateLabel || 'No date label'}</td>
                    <td>{event.fields.era || 'Unassigned Era'}</td>
                    <td>{involvedEntryIds.length}</td>
                    <td>
                      <div className="vwb-table-actions">
                        <button
                          className="vwb-secondary-button"
                          type="button"
                          disabled={index === 0}
                          onClick={() => moveEvent(event.id, 'earlier')}
                        >
                          Earlier
                        </button>
                        <button
                          className="vwb-secondary-button"
                          type="button"
                          disabled={index === sortedEvents.length - 1}
                          onClick={() => moveEvent(event.id, 'later')}
                        >
                          Later
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : null}
      {groupedEvents.length > 0 ? (
        <div className="vwb-timeline-era-list">
          {groupedEvents.map((group) => (
            <section className="vwb-timeline-era" key={group.era}>
              <h3>{group.era}</h3>
              <div className="vwb-timeline-event-list">
                {group.events.map((event) => {
                  const involvedEntryIds =
                    involvedEntryIdsByEvent.get(event.id) ?? [];
                  return (
                    <article className="vwb-timeline-event" key={event.id}>
                      <div>
                        <span className="vwb-entry-kind">
                          Order {event.fields.order || 'Unsorted'} -{' '}
                          {event.fields.dateLabel || 'No date label'}
                        </span>
                        <h4>{event.name}</h4>
                      </div>
                      <p>{event.summary || 'No summary yet.'}</p>
                      {event.fields.consequences ? (
                        <p className="vwb-timeline-consequence">
                          {event.fields.consequences}
                        </p>
                      ) : null}
                      {involvedEntryIds.length > 0 ? (
                        <div
                          className="vwb-tag-row"
                          aria-label={`${event.name} involved entries`}
                        >
                          {involvedEntryIds.map((entryId) => {
                            const involvedEntry = entryById.get(entryId);
                            return involvedEntry ? (
                              <NavLink
                                className="vwb-tag vwb-linked-tag"
                                key={entryId}
                                to={getRelationshipEntryPath(
                                  codex,
                                  sections,
                                  entryId
                                )}
                              >
                                {involvedEntry.name}
                              </NavLink>
                            ) : null;
                          })}
                        </div>
                      ) : null}
                    </article>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div className="vwb-empty-results" role="status">
          <strong>No timeline events found.</strong>
          <p>Clear filters or add a timeline event to build chronology.</p>
        </div>
      )}
    </section>
  );
}

export function ConfirmationDialog({
  entry,
  onCancel,
  onConfirm,
}: {
  entry: WorldEntry;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const dialogRef = useDialogFocus<HTMLElement>(true, onCancel);
  const copy = getDestructiveActionCopy('delete-entry');

  return (
    <div className="vwb-dialog-backdrop" role="presentation">
      <section
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
        className="vwb-dialog"
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        tabIndex={-1}
      >
        <p className="vwb-kicker">Permanent delete</p>
        <h2 id="delete-dialog-title">
          {formatDestructiveActionTitle('delete-entry', entry.name)}
        </h2>
        <p id="delete-dialog-description">{copy.message}</p>
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

export function ResetConfirmationDialog({
  onCancel,
  onConfirm,
}: {
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const dialogRef = useDialogFocus<HTMLElement>(true, onCancel);
  const copy = getDestructiveActionCopy('reset-document');

  return (
    <div className="vwb-dialog-backdrop" role="presentation">
      <section
        aria-labelledby="reset-dialog-title"
        aria-describedby="reset-dialog-description"
        className="vwb-dialog"
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        tabIndex={-1}
      >
        <p className="vwb-kicker">Reset starter data</p>
        <h2 id="reset-dialog-title">
          {formatDestructiveActionTitle('reset-document', 'workspace')}
        </h2>
        <p id="reset-dialog-description">{copy.message}</p>
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

export function EntryForm({
  section,
  selectedEntry,
  onArchive,
  onSave,
  onCancel,
  onDelete,
  onDuplicate,
  onDirtyChange,
  onRestore,
  onUseAsTemplate,
  initialDraft,
}: {
  section: WorldSectionConfig;
  selectedEntry?: WorldEntry;
  initialDraft?: EntryDraft;
  onArchive: (entry: WorldEntry) => void;
  onSave: (entry: WorldEntry) => void;
  onCancel: () => void;
  onDelete: (entry: WorldEntry) => void;
  onDuplicate: (entry: WorldEntry) => void;
  onDirtyChange?: (isDirty: boolean) => void;
  onRestore: (entry: WorldEntry) => void;
  onUseAsTemplate: (entry: WorldEntry) => void;
}) {
  const baselineDraft = useMemo(
    () =>
      selectedEntry
        ? draftFromEntry(selectedEntry, section)
        : initialDraft ?? createEmptyDraft(),
    [initialDraft, section, selectedEntry]
  );
  const [draft, setDraft] = useState<EntryDraft>(() => baselineDraft);
  const [error, setError] = useState('');
  const [copyStatus, setCopyStatus] = useState('');
  const isDirty = hasUnsavedChanges(baselineDraft, draft);

  useUnsavedChangesWarning(isDirty);

  useEffect(() => {
    setDraft(baselineDraft);
    setError('');
    setCopyStatus('');
  }, [baselineDraft]);

  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  const updateDetail = (key: WorldDetailFieldKey, value: string) => {
    setDraft((currentDraft) => ({
      ...currentDraft,
      details: { ...currentDraft.details, [key]: value },
    }));
  };

  const applyTemplate = () => {
    const template = createTemplateDraft(section);
    setDraft((currentDraft) => ({
      ...currentDraft,
      summary: currentDraft.summary || template.summary,
      notes: currentDraft.notes || template.notes,
      tags: currentDraft.tags || template.tags,
      details: { ...template.details, ...currentDraft.details },
    }));
  };

  const discardIfAllowed = (action: () => void) => {
    if (confirmDiscardUnsavedChanges(isDirty)) {
      action();
    }
  };

  const copyEntryName = () => {
    const name = selectedEntry?.name ?? draft.name;
    if (!name.trim()) {
      setCopyStatus('Add a name before copying it.');
      return;
    }
    if (typeof navigator === 'undefined' || !navigator.clipboard?.writeText) {
      setCopyStatus('Clipboard copy is unavailable in this runtime.');
      return;
    }
    navigator.clipboard
      .writeText(name)
      .then(() => setCopyStatus(`Copied ${name}.`))
      .catch(() => setCopyStatus('Clipboard copy failed.'));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validation = validateEntryDraft(section, draft);
    if (!validation.ok) {
      setError(formatDraftValidationErrors(validation));
      return;
    }
    onSave(entryFromDraft(section, draft, selectedEntry));
    setError('');
  };

  return (
    <form className="vwb-form" onSubmit={handleSubmit}>
      <div className="vwb-section-heading">
        <div>
          <p className="vwb-kicker">
            {selectedEntry ? 'Edit entry' : 'New entry'}
          </p>
          <h2>
            {selectedEntry
              ? selectedEntry.name
              : `Create ${section.singularTitle}`}
          </h2>
        </div>
        {isDirty ? <span className="vwb-status-pill">Unsaved</span> : null}
        {selectedEntry ? (
          <button
            className="vwb-secondary-button"
            type="button"
            onClick={() => discardIfAllowed(onCancel)}
          >
            New
          </button>
        ) : (
          <button
            className="vwb-secondary-button"
            type="button"
            onClick={applyTemplate}
          >
            Apply Template
          </button>
        )}
      </div>

      <label>
        Name
        <input
          value={draft.name}
          onChange={(event) => setDraft({ ...draft, name: event.target.value })}
          placeholder={`${section.singularTitle} name`}
        />
      </label>

      <label>
        Summary
        <textarea
          value={draft.summary}
          onChange={(event) =>
            setDraft({ ...draft, summary: event.target.value })
          }
          placeholder="A short working summary"
          rows={4}
        />
      </label>

      <label>
        Notes
        <textarea
          value={draft.notes}
          onChange={(event) =>
            setDraft({ ...draft, notes: event.target.value })
          }
          placeholder="Markdown-style drafting notes"
          rows={5}
        />
      </label>

      <section className="vwb-markdown-preview" aria-label="Notes preview">
        <div className="vwb-section-heading">
          <div>
            <p className="vwb-kicker">Markdown preview</p>
            <h3>Notes preview</h3>
          </div>
        </div>
        {draft.notes.trim() ? (
          <pre>{draft.notes}</pre>
        ) : (
          <p>No notes to preview yet.</p>
        )}
      </section>

      <label>
        Tags
        <input
          value={draft.tags}
          onChange={(event) => setDraft({ ...draft, tags: event.target.value })}
          placeholder="comma, separated, tags"
        />
      </label>

      <div className="vwb-form-grid">
        <label>
          Status
          <select
            value={draft.status}
            onChange={(event) =>
              setDraft({
                ...draft,
                status: event.target.value as EntryDraft['status'],
              })
            }
          >
            {worldEntryStatusOptions.map((option) => (
              <option value={option.value} key={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="vwb-checkbox-field">
          <input
            checked={draft.pinned}
            onChange={(event) =>
              setDraft({ ...draft, pinned: event.target.checked })
            }
            type="checkbox"
          />
          Pin on overview
        </label>
      </div>

      <div className="vwb-form-grid">
        {section.detailFields.map((field) => (
          <label
            className={field.multiline ? 'vwb-wide-field' : undefined}
            key={field.key}
          >
            {field.label}
            {field.multiline ? (
              <textarea
                value={draft.details[field.key] ?? ''}
                onChange={(event) =>
                  updateDetail(field.key, event.target.value)
                }
                rows={3}
              />
            ) : (
              <input
                value={draft.details[field.key] ?? ''}
                onChange={(event) =>
                  updateDetail(field.key, event.target.value)
                }
              />
            )}
          </label>
        ))}
      </div>

      {error ? <p className="vwb-form-error">{error}</p> : null}
      <div className="vwb-form-actions">
        <button className="vwb-primary-button" type="submit">
          {selectedEntry ? 'Save Changes' : `Create ${section.singularTitle}`}
        </button>
        {selectedEntry ? (
          <>
            <button
              className="vwb-secondary-button"
              type="button"
              onClick={() => discardIfAllowed(() => onDuplicate(selectedEntry))}
            >
              Duplicate
            </button>
            <button
              className="vwb-secondary-button"
              type="button"
              onClick={() =>
                discardIfAllowed(() => onUseAsTemplate(selectedEntry))
              }
            >
              Use As Template
            </button>
            <button
              className="vwb-secondary-button"
              type="button"
              onClick={copyEntryName}
            >
              Copy Name
            </button>
            {selectedEntry.status === 'archived' ? (
              <button
                className="vwb-secondary-button"
                type="button"
                onClick={() => discardIfAllowed(() => onRestore(selectedEntry))}
              >
                Restore
              </button>
            ) : (
              <button
                className="vwb-secondary-button"
                type="button"
                onClick={() => discardIfAllowed(() => onArchive(selectedEntry))}
              >
                Archive
              </button>
            )}
            <button
              className="vwb-secondary-button vwb-danger-button"
              type="button"
              onClick={() => discardIfAllowed(() => onDelete(selectedEntry))}
            >
              Delete Permanently
            </button>
          </>
        ) : null}
      </div>
      {copyStatus ? (
        <p className="vwb-inline-status" role="status">
          {copyStatus}
        </p>
      ) : null}
    </form>
  );
}
