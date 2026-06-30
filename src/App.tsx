import { useEffect, useMemo, useState } from 'react';
import {
  BrowserRouter,
  Navigate,
  NavLink,
  Route,
  Routes,
  useParams,
} from 'react-router-dom';
import './App.css';
import {
  loadWorldDocument,
  resetWorldDocumentStorage,
  saveWorldDocument,
} from './Utlilities/codexStorage';
import {
  exportWorldToMarkdown,
  parseWorldImport,
  serializeActiveWorldBackup,
  type WorldImportResult,
} from './Utlilities/codexDataPortability';
import { downloadTextFile, slugFilename } from './Utlilities/fileDownloads';
import {
  applyEntry,
  createEmptyDraft,
  deleteEntry,
  draftFromEntry,
  duplicateEntry,
  entryFromDraft,
  formatUpdatedAt,
  getDetailValue,
  getEntryStatusLabel,
  getEntries,
  getSectionById,
  getSectionTags,
  setEntryArchived,
  type EntryDraft,
  worldEntryStatusOptions,
} from './Utlilities/codexEntries';
import {
  filterSectionEntries,
  getSearchableEntries,
  getSearchResultContext,
  searchEntries,
  sortEntries,
  type EntrySortKey,
} from './Utlilities/codexSearch';
import {
  createTemplateDraft,
  getIncompleteEntries,
} from './Utlilities/codexTemplates';
import {
  filterTimelineEvents,
  getTimelineEras,
  getTimelineInvolvedEntryIds,
  groupTimelineEventsByEra,
  sortTimelineEvents,
} from './Utlilities/codexTimeline';
import {
  createEmptyRelationshipDraft,
  deleteRelationship,
  deleteRelationshipsForEntry,
  filterRelationships,
  getEntryRelationships,
  getRelationshipEntries,
  getRelationshipGraph,
  relationshipFromDraft,
  relationshipTypeOptions,
  upsertRelationship,
  type RelationshipDraft,
  type RelationshipWithEntries,
} from './Utlilities/codexRelationships';
import { getActiveWorld, updateActiveWorld } from './Utlilities/worldDocument';
import type {
  WorldCodex,
  WorldDetailFieldKey,
  WorldDocument,
  WorldEntry,
  WorldRelationship,
  WorldSectionConfig,
} from './types';

type SectionSortKey = EntrySortKey | 'timeline-order';
type SaveStatus = {
  state: 'saved' | 'failed';
  savedAt: string;
};

function Overview({
  codex,
  sections,
  worldName,
}: {
  codex: WorldCodex;
  sections: readonly WorldSectionConfig[];
  worldName: string;
}) {
  const [globalQuery, setGlobalQuery] = useState('');
  const visibleEntries = useMemo(
    () =>
      getSearchableEntries(codex, sections).filter(
        (entry) => entry.status !== 'archived'
      ),
    [codex, sections]
  );
  const globalResults = useMemo(
    () => searchEntries(visibleEntries, sections, globalQuery).slice(0, 8),
    [globalQuery, sections, visibleEntries]
  );
  const pinnedEntries = useMemo(
    () => visibleEntries.filter((entry) => entry.pinned).slice(0, 6),
    [visibleEntries]
  );
  const recentEntries = useMemo(
    () =>
      [...visibleEntries]
        .sort(
          (first, second) =>
            new Date(second.updatedAt).getTime() -
            new Date(first.updatedAt).getTime()
        )
        .slice(0, 6),
    [visibleEntries]
  );
  const incompleteEntries = useMemo(
    () => getIncompleteEntries(visibleEntries, sections).slice(0, 6),
    [sections, visibleEntries]
  );

  return (
    <main className="vwb-main" id="main-content" tabIndex={-1}>
      <section className="vwb-hero" aria-labelledby="overview-title">
        <div>
          <p className="vwb-kicker">{worldName} World Codex</p>
          <h1 id="overview-title">
            Draft the world where the story can breathe.
          </h1>
        </div>
        <p>
          Capture the people, places, powers, lore, and turning points that make
          Valgaron coherent enough to write in.
        </p>
      </section>

      <section className="vwb-stat-grid" aria-label="Codex totals">
        {sections.map((section) => (
          <NavLink
            className="vwb-stat-card"
            to={`/${section.id}`}
            key={section.id}
          >
            <span>{section.title}</span>
            <strong>{getEntries(codex, section.id).length}</strong>
          </NavLink>
        ))}
      </section>

      <section className="vwb-panel" aria-labelledby="global-search-title">
        <div className="vwb-section-heading">
          <div>
            <p className="vwb-kicker">Global search</p>
            <h2 id="global-search-title">Find anything in this world</h2>
          </div>
        </div>
        <label className="vwb-search-field">
          Search entries
          <input
            value={globalQuery}
            onChange={(event) => setGlobalQuery(event.target.value)}
            placeholder="Search names, notes, tags, and details"
            type="search"
          />
        </label>
        {globalQuery.trim() ? (
          <div className="vwb-entry-list vwb-search-results" role="list">
            {globalResults.length > 0 ? (
              globalResults.map((entry) => (
                <article
                  className="vwb-entry-card"
                  key={entry.id}
                  role="listitem"
                >
                  <div className="vwb-entry-card-header">
                    <div>
                      <p className="vwb-entry-kind">
                        {getSearchResultContext(entry)}
                      </p>
                      <h3>{entry.name}</h3>
                    </div>
                    <NavLink to={entry.sectionPath}>Open</NavLink>
                  </div>
                  <p>{entry.summary || 'No summary yet.'}</p>
                </article>
              ))
            ) : (
              <div className="vwb-empty-results" role="status">
                <strong>No entries found.</strong>
                <p>Try another name, tag, note, or world detail.</p>
              </div>
            )}
          </div>
        ) : null}
      </section>

      <section className="vwb-panel" aria-labelledby="recent-title">
        <div className="vwb-section-heading">
          <div>
            <p className="vwb-kicker">Recently updated</p>
            <h2 id="recent-title">Latest codex work</h2>
          </div>
        </div>
        <div className="vwb-entry-list">
          {recentEntries.map((entry) => (
            <article className="vwb-entry-card" key={entry.id}>
              <div className="vwb-entry-card-header">
                <div>
                  <p className="vwb-entry-kind">{entry.sectionTitle}</p>
                  <h3>{entry.name}</h3>
                </div>
                <NavLink to={entry.sectionPath}>Edit</NavLink>
              </div>
              <p>{entry.summary || 'No summary yet.'}</p>
              <small>Updated {formatUpdatedAt(entry.updatedAt)}</small>
            </article>
          ))}
        </div>
      </section>

      {pinnedEntries.length > 0 ? (
        <section className="vwb-panel" aria-labelledby="pinned-title">
          <div className="vwb-section-heading">
            <div>
              <p className="vwb-kicker">Pinned</p>
              <h2 id="pinned-title">Important records</h2>
            </div>
          </div>
          <div className="vwb-entry-list">
            {pinnedEntries.map((entry) => (
              <article className="vwb-entry-card" key={entry.id}>
                <div className="vwb-entry-card-header">
                  <div>
                    <p className="vwb-entry-kind">{entry.sectionTitle}</p>
                    <h3>{entry.name}</h3>
                  </div>
                  <NavLink to={entry.sectionPath}>Edit</NavLink>
                </div>
                <p>{entry.summary || 'No summary yet.'}</p>
                <small>Updated {formatUpdatedAt(entry.updatedAt)}</small>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {incompleteEntries.length > 0 ? (
        <section className="vwb-panel" aria-labelledby="incomplete-title">
          <div className="vwb-section-heading">
            <div>
              <p className="vwb-kicker">Needs attention</p>
              <h2 id="incomplete-title">Incomplete records</h2>
            </div>
          </div>
          <div className="vwb-entry-list">
            {incompleteEntries.map((item) => (
              <article className="vwb-entry-card" key={item.entry.id}>
                <div className="vwb-entry-card-header">
                  <div>
                    <p className="vwb-entry-kind">
                      {item.section.title} - {item.percent}% complete
                    </p>
                    <h3>{item.entry.name}</h3>
                  </div>
                  <NavLink to={`/${item.section.id}`}>Edit</NavLink>
                </div>
                <p>{item.prompts[0]}</p>
              </article>
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}

function EntryCard({
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

function EntryDetail({
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
  return section ? `/${section.id}` : '/relationships';
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
        <NavLink className="vwb-secondary-button" to="/relationships">
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

function TimelineOverview({
  codex,
  events,
  relationships,
  sections,
}: {
  codex: WorldCodex;
  events: readonly WorldEntry[];
  relationships: readonly WorldRelationship[];
  sections: readonly WorldSectionConfig[];
}) {
  const groupedEvents = groupTimelineEventsByEra(events);
  const entryById = new Map(
    getRelationshipEntries(codex, sections).map((entry) => [entry.id, entry])
  );

  return (
    <section className="vwb-panel vwb-timeline-overview">
      <div className="vwb-section-heading">
        <div>
          <p className="vwb-kicker">{events.length} visible events</p>
          <h2>Timeline view</h2>
        </div>
      </div>
      {groupedEvents.length > 0 ? (
        <div className="vwb-timeline-era-list">
          {groupedEvents.map((group) => (
            <section className="vwb-timeline-era" key={group.era}>
              <h3>{group.era}</h3>
              <div className="vwb-timeline-event-list">
                {group.events.map((event) => {
                  const involvedEntryIds = getTimelineInvolvedEntryIds(
                    event,
                    relationships
                  );
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

function ConfirmationDialog({
  entry,
  onCancel,
  onConfirm,
}: {
  entry: WorldEntry;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onCancel();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onCancel]);

  return (
    <div className="vwb-dialog-backdrop" role="presentation">
      <section
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
        className="vwb-dialog"
        role="dialog"
        aria-modal="true"
      >
        <p className="vwb-kicker">Permanent delete</p>
        <h2 id="delete-dialog-title">Delete {entry.name}?</h2>
        <p id="delete-dialog-description">
          This removes the entry from this local world. Archive is safer when
          you may need the record later.
        </p>
        <div className="vwb-form-actions">
          <button
            className="vwb-secondary-button"
            type="button"
            onClick={onCancel}
            autoFocus
          >
            Cancel
          </button>
          <button
            className="vwb-primary-button vwb-danger-confirm-button"
            type="button"
            onClick={onConfirm}
          >
            Delete Permanently
          </button>
        </div>
      </section>
    </div>
  );
}

function ResetConfirmationDialog({
  onCancel,
  onConfirm,
}: {
  onCancel: () => void;
  onConfirm: () => void;
}) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onCancel();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onCancel]);

  return (
    <div className="vwb-dialog-backdrop" role="presentation">
      <section
        aria-labelledby="reset-dialog-title"
        aria-describedby="reset-dialog-description"
        className="vwb-dialog"
        role="dialog"
        aria-modal="true"
      >
        <p className="vwb-kicker">Reset seed data</p>
        <h2 id="reset-dialog-title">Reset this local workspace?</h2>
        <p id="reset-dialog-description">
          This replaces the current local world document with the starter
          Valgaron seed. Export a JSON backup first if you may need the current
          data later.
        </p>
        <div className="vwb-form-actions">
          <button
            className="vwb-secondary-button"
            type="button"
            onClick={onCancel}
            autoFocus
          >
            Cancel
          </button>
          <button
            className="vwb-primary-button vwb-danger-confirm-button"
            type="button"
            onClick={onConfirm}
          >
            Reset Seed
          </button>
        </div>
      </section>
    </div>
  );
}

function EntryForm({
  section,
  selectedEntry,
  onArchive,
  onSave,
  onCancel,
  onDelete,
  onDuplicate,
  onRestore,
}: {
  section: WorldSectionConfig;
  selectedEntry?: WorldEntry;
  onArchive: (entry: WorldEntry) => void;
  onSave: (entry: WorldEntry) => void;
  onCancel: () => void;
  onDelete: (entry: WorldEntry) => void;
  onDuplicate: (entry: WorldEntry) => void;
  onRestore: (entry: WorldEntry) => void;
}) {
  const [draft, setDraft] = useState<EntryDraft>(() =>
    selectedEntry ? draftFromEntry(selectedEntry, section) : createEmptyDraft()
  );
  const [error, setError] = useState('');

  useEffect(() => {
    setDraft(
      selectedEntry
        ? draftFromEntry(selectedEntry, section)
        : createEmptyDraft()
    );
    setError('');
  }, [section, selectedEntry]);

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

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!draft.name.trim()) {
      setError(`${section.singularTitle} name is required.`);
      return;
    }
    onSave(entryFromDraft(section, draft, selectedEntry));
    setDraft(createEmptyDraft());
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
        {selectedEntry ? (
          <button
            className="vwb-secondary-button"
            type="button"
            onClick={onCancel}
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
              onClick={() => onDuplicate(selectedEntry)}
            >
              Duplicate
            </button>
            {selectedEntry.status === 'archived' ? (
              <button
                className="vwb-secondary-button"
                type="button"
                onClick={() => onRestore(selectedEntry)}
              >
                Restore
              </button>
            ) : (
              <button
                className="vwb-secondary-button"
                type="button"
                onClick={() => onArchive(selectedEntry)}
              >
                Archive
              </button>
            )}
            <button
              className="vwb-secondary-button vwb-danger-button"
              type="button"
              onClick={() => onDelete(selectedEntry)}
            >
              Delete Permanently
            </button>
          </>
        ) : null}
      </div>
    </form>
  );
}

function SectionPage({
  codex,
  relationships,
  sections,
  onArchiveEntry,
  onDeleteEntry,
  onSaveEntry,
}: {
  codex: WorldCodex;
  relationships: readonly WorldRelationship[];
  sections: readonly WorldSectionConfig[];
  onArchiveEntry: (entry: WorldEntry, archived: boolean) => void;
  onDeleteEntry: (entry: WorldEntry) => void;
  onSaveEntry: (entry: WorldEntry) => void;
}) {
  const { sectionId } = useParams();
  const section = getSectionById(sectionId, sections);
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
  }, [sectionId]);

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
  const hasActiveFilters =
    query.trim().length > 0 ||
    activeTag.length > 0 ||
    statusFilter.length > 0 ||
    eraFilter.length > 0 ||
    involvedEntryFilter.length > 0 ||
    updatedWithinDays !== null;

  useEffect(() => {
    if (
      selectedEntryId &&
      !filteredEntries.some((entry) => entry.id === selectedEntryId)
    ) {
      setSelectedEntryId(null);
    }
  }, [filteredEntries, selectedEntryId]);

  if (!section) {
    return <Navigate to="/" replace />;
  }

  const clearFilters = () => {
    setQuery('');
    setActiveTag('');
    setStatusFilter('');
    setEraFilter('');
    setInvolvedEntryFilter('');
    setUpdatedWithinDays(null);
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
      </section>

      {section.id === 'timeline' ? (
        <TimelineOverview
          codex={codex}
          events={filteredEntries}
          relationships={relationships}
          sections={sections}
        />
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
          className="vwb-filter-panel"
          aria-label={`${section.title} filters`}
        >
          <label className="vwb-search-field">
            Search {section.title}
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search names, summaries, tags, and details"
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
                onSelect={() => setSelectedEntryId(entry.id)}
                section={section}
              />
            ))
          ) : (
            <div className="vwb-empty-results" role="status">
              <strong>No entries found.</strong>
              <p>Try a different search term or clear the active filters.</p>
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
          key={`${section.id}-${selectedEntry?.id ?? 'new'}`}
          onCancel={() => setSelectedEntryId(null)}
          onArchive={(entry) => {
            onArchiveEntry(entry, true);
            setSelectedEntryId(null);
          }}
          onDelete={(entry) => setEntryPendingDelete(entry)}
          onDuplicate={(entry) => {
            const duplicatedEntry = duplicateEntry(section, entry);
            onSaveEntry(duplicatedEntry);
            setSelectedEntryId(duplicatedEntry.id);
          }}
          onRestore={(entry) => {
            onArchiveEntry(entry, false);
            setSelectedEntryId(entry.id);
            setShowArchived(true);
          }}
          onSave={(entry) => {
            onSaveEntry(entry);
            setSelectedEntryId(entry.id);
          }}
          section={section}
          selectedEntry={selectedEntry}
        />
      </section>
      {entryPendingDelete ? (
        <ConfirmationDialog
          entry={entryPendingDelete}
          onCancel={() => setEntryPendingDelete(null)}
          onConfirm={() => {
            onDeleteEntry(entryPendingDelete);
            setSelectedEntryId(null);
            setEntryPendingDelete(null);
          }}
        />
      ) : null}
    </main>
  );
}

function RelationshipsPage({
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
  const [error, setError] = useState('');

  const editingRelationship =
    relationships.find(
      (relationship) => relationship.id === editingRelationshipId
    ) ?? null;
  const entryById = new Map(entries.map((entry) => [entry.id, entry]));
  const availableRelationshipTypes = Array.from(
    new Set(relationships.map((relationship) => relationship.type))
  ).sort((first, second) => first.localeCompare(second));
  const displayedRelationships = useMemo(
    () =>
      filterRelationships(relationships, {
        type: typeFilter,
        entryId: entryFilter,
      }),
    [entryFilter, relationships, typeFilter]
  );
  const graph = useMemo(
    () => getRelationshipGraph(displayedRelationships, codex, sections),
    [codex, displayedRelationships, sections]
  );

  const resetForm = () => {
    setDraft(createEmptyRelationshipDraft());
    setEditingRelationshipId(null);
    setError('');
  };

  const startEditing = (relationship: WorldRelationship) => {
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

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
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
    resetForm();
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

      <section className="vwb-panel" aria-labelledby="relationship-form-title">
        <div className="vwb-section-heading">
          <div>
            <p className="vwb-kicker">
              {editingRelationship ? 'Edit link' : 'New link'}
            </p>
            <h2 id="relationship-form-title">Relationship editor</h2>
          </div>
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
                <select
                  value={draft.type}
                  onChange={(event) => updateDraft('type', event.target.value)}
                >
                  {relationshipTypeOptions.map((type) => (
                    <option value={type} key={type}>
                      {type}
                    </option>
                  ))}
                </select>
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
                  onClick={resetForm}
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
                            resetForm();
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
        {graph.edges.length > 0 ? (
          <div className="vwb-graph-view">
            <div className="vwb-graph-nodes" aria-label="Graph nodes">
              {graph.nodes.map((node) => (
                <span className="vwb-graph-node" key={node.id}>
                  <strong>{node.name}</strong>
                  <small>{node.sectionTitle}</small>
                </span>
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

function DataPage({
  activeWorld,
  document,
  onImportDocument,
  onRequestReset,
  saveStatus,
}: {
  activeWorld: ReturnType<typeof getActiveWorld>;
  document: WorldDocument;
  onImportDocument: (document: WorldDocument) => void;
  onRequestReset: () => void;
  saveStatus: SaveStatus;
}) {
  const [importText, setImportText] = useState('');
  const [importResult, setImportResult] = useState<WorldImportResult | null>(
    null
  );
  const [downloadMessages, setDownloadMessages] = useState<
    Record<'json' | 'md', string>
  >({
    json: '',
    md: '',
  });
  const jsonExport = useMemo(
    () => serializeActiveWorldBackup(document),
    [document]
  );
  const markdownExport = useMemo(
    () => exportWorldToMarkdown(activeWorld),
    [activeWorld]
  );
  const filenameBase = slugFilename(activeWorld.name);

  const downloadExport = (extension: 'json' | 'md', text: string) => {
    const didDownload = downloadTextFile(`${filenameBase}.${extension}`, text);
    const message = didDownload
      ? `Downloaded ${filenameBase}.${extension}.`
      : 'Download is unavailable in this runtime; copy the export text instead.';
    setDownloadMessages((currentMessages) => ({
      ...currentMessages,
      [extension]: message,
    }));
  };

  const previewImport = () => {
    setImportResult(parseWorldImport(importText));
  };

  const applyImport = () => {
    if (importResult?.ok) {
      onImportDocument(importResult.document);
      setImportText('');
      setImportResult(null);
    }
  };

  return (
    <main className="vwb-main vwb-data-layout" id="main-content" tabIndex={-1}>
      <section className="vwb-panel vwb-section-intro">
        <p className="vwb-kicker">Local data</p>
        <h1>Data</h1>
        <p>
          Export a complete JSON backup of the active world, copy a Markdown
          reference, import a validated backup, or reset to seed data.
        </p>
      </section>

      <section className="vwb-panel" aria-labelledby="save-status-title">
        <div className="vwb-section-heading">
          <div>
            <p className="vwb-kicker">Storage status</p>
            <h2 id="save-status-title">Local browser save</h2>
          </div>
          <span
            className={`vwb-status-pill ${
              saveStatus.state === 'failed' ? 'is-danger' : ''
            }`}
          >
            {saveStatus.state === 'saved' ? 'Saved' : 'Save Failed'}
          </span>
        </div>
        <p>
          Last save attempt: {formatUpdatedAt(saveStatus.savedAt)}. Data stays
          in this browser profile unless you export it.
        </p>
      </section>

      <section className="vwb-panel" aria-labelledby="json-export-title">
        <div className="vwb-section-heading">
          <div>
            <p className="vwb-kicker">Single-file backup</p>
            <h2 id="json-export-title">JSON export</h2>
          </div>
          <button
            className="vwb-primary-button"
            type="button"
            onClick={() => downloadExport('json', jsonExport)}
          >
            Download JSON
          </button>
        </div>
        <textarea
          className="vwb-export-textarea"
          readOnly
          rows={12}
          value={jsonExport}
          aria-label="JSON world backup"
        />
        {downloadMessages.json ? (
          <p className="vwb-inline-status" role="status">
            {downloadMessages.json}
          </p>
        ) : null}
      </section>

      <section className="vwb-panel" aria-labelledby="markdown-export-title">
        <div className="vwb-section-heading">
          <div>
            <p className="vwb-kicker">Drafting reference</p>
            <h2 id="markdown-export-title">Markdown export</h2>
          </div>
          <button
            className="vwb-primary-button"
            type="button"
            onClick={() => downloadExport('md', markdownExport)}
          >
            Download Markdown
          </button>
        </div>
        <textarea
          className="vwb-export-textarea"
          readOnly
          rows={12}
          value={markdownExport}
          aria-label="Markdown world export"
        />
        {downloadMessages.md ? (
          <p className="vwb-inline-status" role="status">
            {downloadMessages.md}
          </p>
        ) : null}
      </section>

      <section className="vwb-panel" aria-labelledby="import-title">
        <div className="vwb-section-heading">
          <div>
            <p className="vwb-kicker">Validated import</p>
            <h2 id="import-title">Import JSON backup</h2>
          </div>
        </div>
        <div className="vwb-form">
          <label>
            Backup JSON
            <textarea
              rows={10}
              value={importText}
              onChange={(event) => {
                setImportText(event.target.value);
                setImportResult(null);
              }}
              placeholder="Paste a Valgaron JSON backup"
            />
          </label>
          <div className="vwb-form-actions">
            <button
              className="vwb-primary-button"
              type="button"
              onClick={previewImport}
            >
              Preview Import
            </button>
            {importResult?.ok ? (
              <button
                className="vwb-secondary-button"
                type="button"
                onClick={applyImport}
              >
                Import Backup
              </button>
            ) : null}
          </div>
          {importResult?.ok ? (
            <div className="vwb-import-preview" role="status">
              <strong>{importResult.preview.activeWorldName}</strong>
              <span>{importResult.preview.worldCount} world(s)</span>
              <span>{importResult.preview.entryCount} entries</span>
              <span>
                {importResult.preview.relationshipCount} relationships
              </span>
              <span>Saved {formatUpdatedAt(importResult.preview.savedAt)}</span>
            </div>
          ) : null}
          {importResult && !importResult.ok ? (
            <p className="vwb-form-error" role="alert">
              {importResult.error}
            </p>
          ) : null}
        </div>
      </section>

      <section className="vwb-panel" aria-labelledby="reset-title">
        <div className="vwb-section-heading">
          <div>
            <p className="vwb-kicker">Destructive action</p>
            <h2 id="reset-title">Reset seed data</h2>
          </div>
          <button
            className="vwb-secondary-button vwb-danger-button"
            type="button"
            onClick={onRequestReset}
          >
            Reset Seed
          </button>
        </div>
        <p>
          Reset replaces the current local world document with starter Valgaron
          data. Export JSON first if you need a backup.
        </p>
      </section>
    </main>
  );
}

function AppShell() {
  const [document, setDocument] = useState<WorldDocument>(() =>
    loadWorldDocument()
  );
  const [saveStatus, setSaveStatus] = useState<SaveStatus>(() => ({
    state: 'saved',
    savedAt: document.savedAt,
  }));
  const [isResetPending, setIsResetPending] = useState(false);
  const activeWorld = getActiveWorld(document);
  const sections = activeWorld.entryTypes;
  const codex = activeWorld.codex;
  const relationships = activeWorld.relationships;

  useEffect(() => {
    const didSave = saveWorldDocument(document);
    setSaveStatus({
      state: didSave ? 'saved' : 'failed',
      savedAt: new Date().toISOString(),
    });
  }, [document]);

  const saveEntry = (entry: WorldEntry) => {
    setDocument((currentDocument) =>
      updateActiveWorld(currentDocument, (world) => ({
        ...world,
        codex: applyEntry(world.codex, entry, world.entryTypes),
        updatedAt: new Date().toISOString(),
      }))
    );
  };

  const archiveEntry = (entry: WorldEntry, archived: boolean) => {
    setDocument((currentDocument) =>
      updateActiveWorld(currentDocument, (world) => ({
        ...world,
        codex: setEntryArchived(world.codex, entry, archived, world.entryTypes),
        updatedAt: new Date().toISOString(),
      }))
    );
  };

  const permanentlyDeleteEntry = (entry: WorldEntry) => {
    setDocument((currentDocument) =>
      updateActiveWorld(currentDocument, (world) => ({
        ...world,
        codex: deleteEntry(world.codex, entry, world.entryTypes),
        relationships: deleteRelationshipsForEntry(
          world.relationships,
          entry.id
        ),
        updatedAt: new Date().toISOString(),
      }))
    );
  };

  const saveRelationship = (relationship: WorldRelationship) => {
    setDocument((currentDocument) =>
      updateActiveWorld(currentDocument, (world) => ({
        ...world,
        relationships: upsertRelationship(world.relationships, relationship),
        updatedAt: new Date().toISOString(),
      }))
    );
  };

  const removeRelationship = (relationshipId: string) => {
    setDocument((currentDocument) =>
      updateActiveWorld(currentDocument, (world) => ({
        ...world,
        relationships: deleteRelationship(world.relationships, relationshipId),
        updatedAt: new Date().toISOString(),
      }))
    );
  };

  const resetToSeed = () => {
    setDocument(resetWorldDocumentStorage());
    setIsResetPending(false);
  };

  const importDocument = (nextDocument: WorldDocument) => {
    setDocument({
      ...nextDocument,
      savedAt: new Date().toISOString(),
    });
  };

  return (
    <BrowserRouter>
      <div className="vwb-app-shell">
        <a className="vwb-skip-link" href="#main-content">
          Skip to main content
        </a>
        <header className="vwb-app-header">
          <NavLink className="vwb-brand" to="/" aria-label="Valgaron overview">
            <span>Valgaron</span>
            <strong>World Codex</strong>
          </NavLink>
          <nav className="vwb-top-nav" aria-label="Codex sections">
            <NavLink
              className={({ isActive }) =>
                `vwb-nav-link ${isActive ? 'is-active' : ''}`
              }
              to="/"
              end
            >
              Overview
            </NavLink>
            {sections.map((section) => (
              <NavLink
                className={({ isActive }) =>
                  `vwb-nav-link ${isActive ? 'is-active' : ''}`
                }
                key={section.id}
                to={`/${section.id}`}
              >
                {section.title}
              </NavLink>
            ))}
            <NavLink
              className={({ isActive }) =>
                `vwb-nav-link ${isActive ? 'is-active' : ''}`
              }
              to="/relationships"
            >
              Relationships
            </NavLink>
            <NavLink
              className={({ isActive }) =>
                `vwb-nav-link ${isActive ? 'is-active' : ''}`
              }
              to="/data"
            >
              Data
            </NavLink>
          </nav>
          <span
            className={`vwb-save-status ${
              saveStatus.state === 'failed' ? 'is-danger' : ''
            }`}
            role="status"
          >
            {saveStatus.state === 'saved' ? 'Saved' : 'Save Failed'}
          </span>
          <button
            className="vwb-secondary-button"
            type="button"
            onClick={() => setIsResetPending(true)}
          >
            Reset Seed
          </button>
        </header>

        <Routes>
          <Route
            path="/"
            element={
              <Overview
                codex={codex}
                sections={sections}
                worldName={activeWorld.name}
              />
            }
          />
          <Route
            path="/relationships"
            element={
              <RelationshipsPage
                codex={codex}
                onDeleteRelationship={removeRelationship}
                onSaveRelationship={saveRelationship}
                relationships={relationships}
                sections={sections}
              />
            }
          />
          <Route
            path="/data"
            element={
              <DataPage
                activeWorld={activeWorld}
                document={document}
                onImportDocument={importDocument}
                onRequestReset={() => setIsResetPending(true)}
                saveStatus={saveStatus}
              />
            }
          />
          <Route
            path="/:sectionId"
            element={
              <SectionPage
                codex={codex}
                onArchiveEntry={archiveEntry}
                onDeleteEntry={permanentlyDeleteEntry}
                onSaveEntry={saveEntry}
                relationships={relationships}
                sections={sections}
              />
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        {isResetPending ? (
          <ResetConfirmationDialog
            onCancel={() => setIsResetPending(false)}
            onConfirm={resetToSeed}
          />
        ) : null}
      </div>
    </BrowserRouter>
  );
}

export default AppShell;
