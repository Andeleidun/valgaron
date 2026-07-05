import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { NavLink } from 'react-router-dom';
import {
  createEmptyDraft,
  createTemplateDraft,
  draftFromEntry,
  entryDraftStatusControl,
  entryEditorCopy,
  entryNameCopyFeedback,
  entryFromDraft,
  entryPinnedControl,
  formatDestructiveActionTitle,
  formatDraftValidationErrors,
  getDetailValue,
  getDestructiveActionCopy,
  getDraftDetailFields,
  getEntryDetailDisplayModel,
  getEntryEditorBaseFields,
  getEntryEditorDetailFieldModels,
  getEntryDetailFields,
  getEntryEditorCreateTitle,
  getEntryEditorNotesPreviewModel,
  getEntryEditorSelectedActionModel,
  getEntryEditorSubmitLabel,
  getEntryHiddenDetailCleanupModel,
  getEntryNameCopiedMessage,
  getEntryNameCopyText,
  getEntryRelationships,
  getPlaceRelationshipGroups,
  getRelationshipEntries,
  getRelationshipEntryRouteById,
  getRelationshipManagementRoute,
  getTimelineDiagnostics,
  getTimelineEventItem,
  getTimelineHighlights,
  getTimelineInvolvedEntryIdsByEvent,
  getTimelineOrderUpdates,
  relationshipFeatureCopy,
  groupTimelineEventsByEra,
  buildPlaceRelationshipFieldTextMigrationOperation,
  filterPlaceRelationshipTargetOptions,
  getPlaceRelationshipFieldLinks,
  getPlaceRelationshipFieldTextMigration,
  getPlaceRelationshipFieldTargetId,
  getPlaceRelationshipTextMigrationStatus,
  placeRelationshipFieldCopy,
  placeRelationshipFieldConfigs,
  placeRelationshipTextReviewCopy,
  getPlaceRelationshipTargetOptionDisplay,
  getPlaceRelationshipTargetOptions,
  makePlaceFieldRelationship,
  sortTimelineEvents,
  timelineFeatureCopy,
  validateEntryDraft,
  type EntryDraft,
  type EntryListItem,
  type PlaceRelationshipFieldConfig,
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

function getDetailFieldSuggestionId(
  sectionId: string,
  fieldKey: WorldDetailFieldKey
): string {
  return `vwb-${sectionId}-${fieldKey}-suggestions`.replace(
    /[^a-zA-Z0-9_-]/g,
    '-'
  );
}

export function EntryCard({
  entry,
  entryListItem,
  section,
  isSelected,
  onSelect,
}: {
  entry: WorldEntry;
  entryListItem: EntryListItem;
  section: WorldSectionConfig;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const detailPreview = getEntryDetailFields(section, entry)
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
        <small>{entryListItem.statusLabel}</small>
      </span>
      <span>{entryListItem.summaryText}</span>
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
  const detailModel = getEntryDetailDisplayModel(section, entry);

  return (
    <article className="vwb-detail-panel" aria-labelledby="entry-detail-title">
      <div className="vwb-section-heading">
        <div>
          <p className="vwb-kicker">{detailModel.kicker}</p>
          <h2 id="entry-detail-title">{detailModel.name}</h2>
        </div>
        <span className="vwb-status-pill">{detailModel.statusLabel}</span>
      </div>
      <p>{detailModel.summary}</p>
      <dl className="vwb-detail-list">
        <div>
          <dt>{detailModel.updated.label}</dt>
          <dd>{detailModel.updated.value}</dd>
        </div>
        <div>
          <dt>{detailModel.created.label}</dt>
          <dd>{detailModel.created.value}</dd>
        </div>
        <div>
          <dt>{detailModel.pinned.label}</dt>
          <dd>{detailModel.pinned.value}</dd>
        </div>
        {detailModel.visibleDetails.map((field) => (
          <div key={field.label}>
            <dt>{field.label}</dt>
            <dd>{field.value}</dd>
          </div>
        ))}
      </dl>
      {detailModel.tags.length > 0 ? (
        <div className="vwb-tag-row" aria-label={detailModel.tagsLabel}>
          {detailModel.tags.map((tag) => (
            <span className="vwb-tag" key={tag}>
              {tag}
            </span>
          ))}
        </div>
      ) : null}
      {detailModel.notes ? (
        <section
          className="vwb-notes-block"
          aria-label={entryEditorCopy.notesLabel}
        >
          <h3>{entryEditorCopy.notesLabel}</h3>
          <pre>{detailModel.notes}</pre>
        </section>
      ) : null}
      {detailModel.hiddenDetails.length > 0 ? (
        <section
          className="vwb-hidden-detail-panel"
          aria-label={placeRelationshipTextReviewCopy.hiddenPlaceDetailsTitle}
        >
          <h3>{placeRelationshipTextReviewCopy.hiddenPlaceDetailsTitle}</h3>
          <dl className="vwb-detail-list">
            {detailModel.hiddenDetails.map((field) => (
              <div key={field.key}>
                <dt>{field.label}</dt>
                <dd>{field.value}</dd>
              </div>
            ))}
          </dl>
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
  const placeRelationshipGroups = getPlaceRelationshipGroups(
    entry,
    relationships,
    codex,
    sections
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
          to={getRelationshipManagementRoute({
            entryId: entry.id,
            name: entry.name,
          })}
        >
          {relationshipFeatureCopy.manageLinksLabel}
        </NavLink>
      </div>
      {placeRelationshipGroups.length > 0 ? (
        <div className="vwb-relationship-list">
          {placeRelationshipGroups.map((group) => (
            <section
              className="vwb-relationship-group"
              aria-label={group.label}
              key={group.id}
            >
              <h4>{group.label}</h4>
              {group.relationships.map((relationship) => {
                const relatedEntry = getRelatedEntry(relationship, entry.id);
                return (
                  <article
                    className="vwb-relationship-row"
                    key={relationship.id}
                  >
                    <div>
                      <span className="vwb-entry-kind">
                        {formatRelationshipDirection(relationship, entry.id)} -{' '}
                        {relationship.type}
                      </span>
                      {relatedEntry ? (
                        <NavLink
                          to={getRelationshipEntryRouteById(
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
            </section>
          ))}
        </div>
      ) : linkedRelationships.length > 0 ? (
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
                      to={getRelationshipEntryRouteById(
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
          <strong>{relationshipFeatureCopy.selectedEntryEmptyTitle}</strong>
          <p>{relationshipFeatureCopy.selectedEntryEmptyDetail}</p>
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
  const timelineEventItemById = new Map(
    events.map((event) => [
      event.id,
      getTimelineEventItem(
        { codex, entryTypes: sections, relationships },
        event
      ),
    ])
  );
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
          <span className="vwb-entry-kind">
            {timelineFeatureCopy.unorderedEventsLabel}
          </span>
          <strong>{diagnostics.unorderedEvents.length}</strong>
          <p>Events without a numeric sort order.</p>
        </article>
        <article className="vwb-diagnostic-card">
          <span className="vwb-entry-kind">
            {timelineFeatureCopy.duplicateOrdersLabel}
          </span>
          <strong>{diagnostics.duplicateOrderGroups.length}</strong>
          <p>Order values shared by more than one event.</p>
        </article>
        <article className="vwb-diagnostic-card">
          <span className="vwb-entry-kind">
            {timelineFeatureCopy.unlinkedEventsLabel}
          </span>
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
                {timelineEventItemById.get(event.id)?.contextText}
              </span>
              <strong>{event.name}</strong>
              <p>
                {timelineEventItemById.get(event.id)?.summaryText ??
                  timelineFeatureCopy.noDateLabelSentence}
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
                const eventItem = timelineEventItemById.get(event.id);
                return (
                  <tr key={event.id}>
                    <td>{eventItem?.orderText}</td>
                    <td>{event.name}</td>
                    <td>{eventItem?.dateText}</td>
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
                  const eventItem = timelineEventItemById.get(event.id);
                  return (
                    <article className="vwb-timeline-event" key={event.id}>
                      <div>
                        <span className="vwb-entry-kind">
                          {eventItem?.contextText}
                        </span>
                        <h4>{event.name}</h4>
                      </div>
                      <p>{eventItem?.summaryText}</p>
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
                                to={getRelationshipEntryRouteById(
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
          <strong>{timelineFeatureCopy.noTimelineEventsFoundTitle}</strong>
          <p>{timelineFeatureCopy.noTimelineEventsFoundDetail}</p>
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

const RELATIONSHIP_TARGET_RESULT_LIMIT = 60;

function PlaceRelationshipFieldControl({
  codex,
  config,
  entry,
  onDeleteRelationship,
  onSaveRelationship,
  relationships,
  sections,
}: {
  codex: WorldCodex;
  config: PlaceRelationshipFieldConfig;
  entry: WorldEntry;
  onDeleteRelationship: (relationshipId: string) => void;
  onSaveRelationship: (relationship: WorldRelationship) => void;
  relationships: readonly WorldRelationship[];
  sections: readonly WorldSectionConfig[];
}) {
  const [query, setQuery] = useState('');
  const [expandedUnusualTargets, setExpandedUnusualTargets] = useState(false);
  const fieldRelationships = getPlaceRelationshipFieldLinks(
    relationships,
    entry,
    config
  );
  const selectedTargetIds = new Set(
    fieldRelationships.map((relationship) =>
      getPlaceRelationshipFieldTargetId(relationship, config)
    )
  );
  const options = getPlaceRelationshipTargetOptions({
    codex,
    config,
    includedTargetIds: selectedTargetIds,
    sections,
    currentEntry: entry,
  });
  const filteredOptions = filterPlaceRelationshipTargetOptions(
    options,
    query,
    selectedTargetIds
  );
  const optionDisplay = getPlaceRelationshipTargetOptionDisplay({
    expandedUnusualTargets,
    limit: RELATIONSHIP_TARGET_RESULT_LIMIT,
    options: filteredOptions,
    selectedTargetIds,
    targetCategoryBehavior: config.targetCategoryBehavior,
  });
  const visibleOptions = optionDisplay.visibleOptions;
  const hiddenPreferredCount = optionDisplay.hiddenPreferredCount;

  const saveLink = (
    targetEntryId: string,
    existingRelationship?: WorldRelationship
  ) => {
    onSaveRelationship(
      makePlaceFieldRelationship(
        entry,
        config,
        targetEntryId,
        existingRelationship
      )
    );
  };

  const setSingleTarget = (targetEntryId: string) => {
    const [primaryRelationship, ...extraRelationships] = fieldRelationships;
    for (const relationship of extraRelationships) {
      onDeleteRelationship(relationship.id);
    }
    if (!targetEntryId) {
      if (primaryRelationship) {
        onDeleteRelationship(primaryRelationship.id);
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
    saveLink(targetEntryId, primaryRelationship);
  };

  const toggleManyTarget = (targetEntryId: string, checked: boolean) => {
    const existingRelationship = fieldRelationships.find(
      (relationship) =>
        getPlaceRelationshipFieldTargetId(relationship, config) ===
        targetEntryId
    );
    if (checked) {
      if (!existingRelationship) {
        saveLink(targetEntryId);
      }
      return;
    }
    if (existingRelationship) {
      onDeleteRelationship(existingRelationship.id);
    }
  };

  return (
    <section className="vwb-linked-field" aria-label={config.label}>
      <div>
        <h4>{config.label}</h4>
        <p>
          Saved as {config.relationshipType} relationship
          {config.cardinality === 'many' ? 's' : ''}.
        </p>
      </div>
      {options.length > 0 ? (
        <>
          <label>
            Search {config.label}
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={placeRelationshipFieldCopy.searchPlaceholder}
              type="search"
            />
          </label>
          {filteredOptions.length > 0 ? (
            config.cardinality === 'one' ? (
              <div className="vwb-linked-field-options">
                <label className="vwb-inline-toggle">
                  <input
                    checked={fieldRelationships.length === 0}
                    onChange={() => setSingleTarget('')}
                    name={`place-link-${entry.id}-${config.fieldKey}`}
                    type="radio"
                  />
                  {placeRelationshipFieldCopy.noLinkedRecordLabel}
                </label>
                {visibleOptions.map((option) => (
                  <label className="vwb-inline-toggle" key={option.entry.id}>
                    <input
                      checked={selectedTargetIds.has(option.entry.id)}
                      onChange={() => setSingleTarget(option.entry.id)}
                      name={`place-link-${entry.id}-${config.fieldKey}`}
                      type="radio"
                    />
                    {option.entry.name} ({option.section.singularTitle})
                    {option.targetCategoryWarning ? (
                      <small>{option.targetCategoryWarning}</small>
                    ) : null}
                  </label>
                ))}
              </div>
            ) : (
              <div className="vwb-linked-field-options">
                {visibleOptions.map((option) => (
                  <label className="vwb-inline-toggle" key={option.entry.id}>
                    <input
                      checked={selectedTargetIds.has(option.entry.id)}
                      onChange={(event) =>
                        toggleManyTarget(option.entry.id, event.target.checked)
                      }
                      type="checkbox"
                    />
                    {option.entry.name} ({option.section.singularTitle})
                    {option.targetCategoryWarning ? (
                      <small>{option.targetCategoryWarning}</small>
                    ) : null}
                  </label>
                ))}
              </div>
            )
          ) : (
            <p className="vwb-inline-status">
              {placeRelationshipFieldCopy.noMatchingTargetsMessage}
            </p>
          )}
          {optionDisplay.canExpandUnusualTargets ? (
            <button
              className="vwb-secondary-button"
              type="button"
              onClick={() => setExpandedUnusualTargets(true)}
            >
              {optionDisplay.showUnusualTargetsLabel}
            </button>
          ) : null}
          {hiddenPreferredCount > 0 ? (
            <p className="vwb-inline-status">
              {optionDisplay.hiddenPreferredMessage}
            </p>
          ) : null}
        </>
      ) : (
        <p className="vwb-inline-status">
          {placeRelationshipFieldCopy.createMatchingRecordsMessage}
        </p>
      )}
    </section>
  );
}

export function EntryForm({
  section,
  selectedEntry,
  codex,
  relationships,
  sections,
  onArchive,
  onSave,
  onCancel,
  onDelete,
  onDeleteRelationship,
  onDuplicate,
  onDirtyChange,
  onRestore,
  onSaveRelationship,
  onUseAsTemplate,
  initialDraft,
  sectionEntries = [],
}: {
  section: WorldSectionConfig;
  sectionEntries?: readonly WorldEntry[];
  selectedEntry?: WorldEntry;
  initialDraft?: EntryDraft;
  codex?: WorldCodex;
  relationships?: readonly WorldRelationship[];
  sections?: readonly WorldSectionConfig[];
  onArchive: (entry: WorldEntry) => void;
  onSave: (entry: WorldEntry) => void;
  onCancel: () => void;
  onDelete: (entry: WorldEntry) => void;
  onDeleteRelationship?: (relationshipId: string) => void;
  onDuplicate: (entry: WorldEntry) => void;
  onDirtyChange?: (isDirty: boolean) => void;
  onRestore: (entry: WorldEntry) => void;
  onSaveRelationship?: (relationship: WorldRelationship) => void;
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
  const selectedPlaceCategory = draft.details.category ?? '';
  const visibleDetailFields = useMemo(
    () =>
      getDraftDetailFields(section, {
        details: { category: selectedPlaceCategory },
      }),
    [section, selectedPlaceCategory]
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
  const baseFields = getEntryEditorBaseFields(section, draft);
  const notesPreview = getEntryEditorNotesPreviewModel(draft.notes);
  const detailFieldModels = useMemo(
    () =>
      getEntryEditorDetailFieldModels({
        draft,
        fields: editableDetailFields,
        sectionEntries,
      }),
    [draft, editableDetailFields, sectionEntries]
  );
  const hiddenDetailCleanup = getEntryHiddenDetailCleanupModel(section, draft);
  const selectedActionModel = selectedEntry
    ? getEntryEditorSelectedActionModel(selectedEntry)
    : null;
  const legacyRelationshipTextValues = activeRelationshipFieldConfigs
    .map((config) => ({
      config,
      key: config.fieldKey,
      label: config.label,
      value: draft.details[config.fieldKey]?.trim() ?? '',
    }))
    .filter((field) => field.value);
  const canEditPlaceRelationships = Boolean(
    selectedEntry &&
      !isDirty &&
      codex &&
      relationships &&
      sections &&
      onDeleteRelationship &&
      onSaveRelationship
  );

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
    const name = getEntryNameCopyText(selectedEntry?.name ?? draft.name);
    if (!name) {
      setCopyStatus(entryNameCopyFeedback.missingName);
      return;
    }
    if (typeof navigator === 'undefined' || !navigator.clipboard?.writeText) {
      setCopyStatus(entryNameCopyFeedback.unavailable);
      return;
    }
    navigator.clipboard
      .writeText(name)
      .then(() => setCopyStatus(getEntryNameCopiedMessage(name)))
      .catch(() => setCopyStatus(entryNameCopyFeedback.failed));
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

  const getLegacyRelationshipTextMigration = (
    config: PlaceRelationshipFieldConfig,
    value: string
  ) => {
    if (!selectedEntry || !codex || !sections) {
      return null;
    }
    return getPlaceRelationshipFieldTextMigration({
      codex,
      config,
      currentEntry: selectedEntry,
      sections,
      value,
    });
  };

  const migrateLegacyRelationshipText = (
    config: PlaceRelationshipFieldConfig,
    value: string
  ) => {
    if (
      !selectedEntry ||
      !relationships ||
      !codex ||
      !sections ||
      isDirty ||
      !onDeleteRelationship ||
      !onSaveRelationship
    ) {
      return;
    }
    const migration = getLegacyRelationshipTextMigration(config, value);
    if (!migration || migration.targetIds.length === 0) {
      return;
    }
    const operation = buildPlaceRelationshipFieldTextMigrationOperation({
      config,
      entry: selectedEntry,
      migration,
      relationships,
    });
    operation.relationshipIdsToDelete.forEach(onDeleteRelationship);
    operation.relationshipsToSave.forEach(({ relationship }) =>
      onSaveRelationship(relationship)
    );
    const nextDraft = {
      ...draft,
      details: {
        ...draft.details,
        [config.fieldKey]: operation.fields[config.fieldKey] ?? '',
      },
    };
    setDraft(nextDraft);
    onSave(entryFromDraft(section, nextDraft, selectedEntry));
  };

  return (
    <form className="vwb-form" onSubmit={handleSubmit}>
      <div className="vwb-section-heading">
        <div>
          <p className="vwb-kicker">
            {selectedEntry
              ? entryEditorCopy.editKicker
              : entryEditorCopy.createKicker}
          </p>
          <h2>
            {selectedEntry
              ? selectedEntry.name
              : getEntryEditorCreateTitle(section)}
          </h2>
        </div>
        {isDirty ? (
          <span className="vwb-status-pill">
            {entryEditorCopy.unsavedLabel}
          </span>
        ) : null}
        {selectedEntry ? (
          <button
            className="vwb-secondary-button"
            type="button"
            onClick={() => discardIfAllowed(onCancel)}
          >
            {entryEditorCopy.newLabel}
          </button>
        ) : (
          <button
            className="vwb-secondary-button"
            type="button"
            onClick={applyTemplate}
          >
            {entryEditorCopy.applyTemplateLabel}
          </button>
        )}
      </div>

      {baseFields.slice(0, 3).map((field) => (
        <label key={field.id}>
          {field.label}
          {field.multiline ? (
            <textarea
              value={field.value}
              onChange={(event) =>
                setDraft((currentDraft) => ({
                  ...currentDraft,
                  [field.key]: event.target.value,
                }))
              }
              placeholder={field.placeholder}
              rows={field.rows}
            />
          ) : (
            <input
              value={field.value}
              onChange={(event) =>
                setDraft((currentDraft) => ({
                  ...currentDraft,
                  [field.key]: event.target.value,
                }))
              }
              placeholder={field.placeholder}
            />
          )}
        </label>
      ))}

      <section className="vwb-markdown-preview" aria-label={notesPreview.title}>
        <div className="vwb-section-heading">
          <div>
            <p className="vwb-kicker">{notesPreview.kicker}</p>
            <h3>{notesPreview.title}</h3>
          </div>
        </div>
        {notesPreview.hasContent ? (
          <pre>{notesPreview.body}</pre>
        ) : (
          <p>{notesPreview.emptyText}</p>
        )}
      </section>

      {baseFields.slice(3).map((field) => (
        <label key={field.id}>
          {field.label}
          <input
            value={field.value}
            onChange={(event) =>
              setDraft((currentDraft) => ({
                ...currentDraft,
                [field.key]: event.target.value,
              }))
            }
            placeholder={field.placeholder}
          />
        </label>
      ))}

      <div className="vwb-form-grid">
        <label>
          {entryDraftStatusControl.label}
          <select
            aria-label={entryDraftStatusControl.accessibilityLabel}
            value={draft.status}
            onChange={(event) =>
              setDraft((currentDraft) => ({
                ...currentDraft,
                status: event.target.value as EntryDraft['status'],
              }))
            }
          >
            {entryDraftStatusControl.options.map((option) => (
              <option value={option.value} key={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="vwb-checkbox-field">
          <input
            aria-label={entryPinnedControl.accessibilityLabel}
            checked={draft.pinned}
            onChange={(event) =>
              setDraft((currentDraft) => ({
                ...currentDraft,
                pinned: event.target.checked,
              }))
            }
            type="checkbox"
          />
          {entryPinnedControl.label}
        </label>
      </div>

      <div className="vwb-form-grid">
        {detailFieldModels.map((field) =>
          (() => {
            const suggestionId = getDetailFieldSuggestionId(
              section.id,
              field.key
            );
            return (
              <label
                className={field.multiline ? 'vwb-wide-field' : undefined}
                key={field.key}
              >
                {field.label}
                {field.multiline ? (
                  <textarea
                    value={field.value}
                    onChange={(event) =>
                      updateDetail(field.key, event.target.value)
                    }
                    rows={field.rows}
                  />
                ) : (
                  <>
                    <input
                      value={field.value}
                      onChange={(event) =>
                        updateDetail(field.key, event.target.value)
                      }
                      list={
                        field.suggestions.length > 0 ? suggestionId : undefined
                      }
                    />
                    {field.suggestions.length > 0 ? (
                      <datalist id={suggestionId}>
                        {field.suggestions.map((option) => (
                          <option value={option} key={option} />
                        ))}
                      </datalist>
                    ) : null}
                  </>
                )}
              </label>
            );
          })()
        )}
      </div>

      {selectedEntry?.kind === 'place' &&
      activeRelationshipFieldConfigs.length > 0 ? (
        <section
          className="vwb-linked-field-panel"
          aria-label="Relationship-backed place fields"
        >
          <div>
            <h3>{placeRelationshipTextReviewCopy.linkedFieldsTitle}</h3>
            <p>{placeRelationshipTextReviewCopy.linkedFieldsDescription}</p>
          </div>
          {canEditPlaceRelationships ? (
            activeRelationshipFieldConfigs.map((config) => (
              <PlaceRelationshipFieldControl
                codex={codex!}
                config={config}
                entry={selectedEntry}
                key={config.fieldKey}
                onDeleteRelationship={onDeleteRelationship!}
                onSaveRelationship={onSaveRelationship!}
                relationships={relationships!}
                sections={sections!}
              />
            ))
          ) : (
            <p className="vwb-inline-status">
              {placeRelationshipTextReviewCopy.linkedFieldsBlockedMessage}
            </p>
          )}
          {legacyRelationshipTextValues.length > 0 ? (
            <section
              className="vwb-hidden-detail-panel"
              aria-label={
                placeRelationshipTextReviewCopy.savedTextLinkNotesTitle
              }
            >
              <h4>{placeRelationshipTextReviewCopy.savedTextLinkNotesTitle}</h4>
              <dl className="vwb-detail-list">
                {legacyRelationshipTextValues.map((field) => {
                  const migration = canEditPlaceRelationships
                    ? getLegacyRelationshipTextMigration(
                        field.config,
                        field.value
                      )
                    : null;
                  return (
                    <div key={field.key}>
                      <dt>{field.label}</dt>
                      <dd>
                        <span>{field.value}</span>
                        {migration?.targetIds.length ? (
                          <button
                            className="vwb-secondary-button"
                            type="button"
                            onClick={() =>
                              migrateLegacyRelationshipText(
                                field.config,
                                field.value
                              )
                            }
                          >
                            {
                              placeRelationshipTextReviewCopy.exactMatchMigrationLabel
                            }
                          </button>
                        ) : null}
                        <button
                          className="vwb-secondary-button"
                          type="button"
                          onClick={() => updateDetail(field.key, '')}
                        >
                          {entryEditorCopy.clearLabel}
                        </button>
                        {migration ? (
                          <small>
                            {getPlaceRelationshipTextMigrationStatus(migration)}
                          </small>
                        ) : null}
                      </dd>
                    </div>
                  );
                })}
              </dl>
            </section>
          ) : null}
        </section>
      ) : null}

      {hiddenDetailCleanup.fields.length > 0 ? (
        <section
          className="vwb-hidden-detail-panel"
          aria-label={hiddenDetailCleanup.title}
        >
          <h3>{hiddenDetailCleanup.title}</h3>
          <dl className="vwb-detail-list">
            {hiddenDetailCleanup.fields.map((field) => (
              <div key={field.key}>
                <dt>{field.label}</dt>
                <dd>
                  <span>{field.value}</span>
                  <button
                    className="vwb-secondary-button"
                    type="button"
                    onClick={() => updateDetail(field.key, '')}
                  >
                    {field.clearLabel}
                  </button>
                </dd>
              </div>
            ))}
          </dl>
        </section>
      ) : null}

      {error ? <p className="vwb-form-error">{error}</p> : null}
      <div className="vwb-form-actions">
        <button className="vwb-primary-button" type="submit">
          {getEntryEditorSubmitLabel({ section, selectedEntry })}
        </button>
        {selectedEntry && selectedActionModel ? (
          <>
            <button
              aria-label={selectedActionModel.duplicateAccessibilityLabel}
              className="vwb-secondary-button"
              type="button"
              onClick={() => discardIfAllowed(() => onDuplicate(selectedEntry))}
            >
              {selectedActionModel.duplicateLabel}
            </button>
            <button
              aria-label={selectedActionModel.useAsTemplateAccessibilityLabel}
              className="vwb-secondary-button"
              type="button"
              onClick={() =>
                discardIfAllowed(() => onUseAsTemplate(selectedEntry))
              }
            >
              {selectedActionModel.useAsTemplateLabel}
            </button>
            <button
              className="vwb-secondary-button"
              type="button"
              onClick={copyEntryName}
            >
              {entryNameCopyFeedback.actionLabel}
            </button>
            <button
              aria-label={selectedActionModel.archiveAccessibilityLabel}
              className="vwb-secondary-button"
              type="button"
              onClick={() =>
                discardIfAllowed(() =>
                  selectedEntry.status === 'archived'
                    ? onRestore(selectedEntry)
                    : onArchive(selectedEntry)
                )
              }
            >
              {selectedActionModel.archiveLabel}
            </button>
            <button
              aria-label={selectedActionModel.deleteAccessibilityLabel}
              className="vwb-secondary-button vwb-danger-button"
              title={selectedActionModel.deleteAccessibilityHint}
              type="button"
              onClick={() => discardIfAllowed(() => onDelete(selectedEntry))}
            >
              {selectedActionModel.deleteLabel}
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
