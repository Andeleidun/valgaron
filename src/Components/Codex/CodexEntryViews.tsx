import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { NavLink } from 'react-router-dom';
import {
  createEmptyDraft,
  createTemplateDraft,
  destructiveActionDialogCopy,
  draftFromEntry,
  entryDraftStatusControl,
  entryEditorDisplayLimits,
  entryEditorCopy,
  entryEditorFieldCopy,
  entryDisplayCopy,
  entryNameCopyFeedback,
  entryFromDraft,
  entryPinnedControl,
  formatCodexRouteSearch,
  formatDestructiveActionTitle,
  formatDraftValidationErrors,
  getDestructiveActionCopy,
  getDraftDetailFields,
  getEntryCardDetailPreviewModel,
  getEntryDetailDisplayModel,
  getEntryEditorBaseFieldLayout,
  getEntryEditorDetailFieldGroups,
  getEntryEditorCreateTitle,
  getEntryEditorNotesPreviewModel,
  getEntryEditorSelectedActionModel,
  getEntryEditorSubmitLabel,
  getEntryHiddenDetailCleanupModel,
  getEntryNameCopiedMessage,
  getEntryNameCopyText,
  getEntryRelationshipGroupsModel,
  getRelationshipManagementAccessibilityLabel,
  getRelationshipEntries,
  getRelationshipEntryRouteById,
  getRelationshipFieldConfigsForEntryKind,
  getRelationshipManagementRoute,
  getTimelineInvolvedEntryIdsByEvent,
  createTimelineInvolvedRecordStagedRelationship,
  getTimelineEraReassignmentUpdates,
  formatTimelineReviewIssueCount,
  formatTimelineVisibleEventCount,
  getTimelineOrderUpdates,
  getTimelineEventEditorModel,
  getTimelineSurfaceModel,
  getStagedRelationshipDraftRowModel,
  relationshipFeatureCopy,
  buildRelationshipFieldTextMigrationOperation,
  createEmptyRelationshipDraft,
  filterRelationshipTargetOptions,
  getRelationshipFieldLinks,
  getRelationshipFieldSearchLabel,
  getRelationshipFieldTextMigration,
  getRelationshipFieldTargetId,
  getRelationshipTextMigrationStatus,
  relationshipFieldCopy,
  relationshipTextReviewCopy,
  getRelationshipTargetOptionDisplay,
  getRelationshipTargetOptions,
  createStagedRelationshipDraft,
  deleteStagedRelationshipDraft,
  draftTransactionEntryId,
  hasDuplicateStagedRelationshipDraft,
  normalizeStagedRelationshipDrafts,
  makeFieldRelationship,
  stagedRelationshipDraftCopy,
  timelineFeatureCopy,
  upsertStagedRelationshipDraft,
  validateEntryDraft,
  validateEntryDraftTransaction,
  type EntryDraft,
  type EntryEditorDetailFieldModel,
  type EntryListItem,
  type RelationshipFieldConfig,
  type RelationshipDraft,
  type StagedRelationshipDraft,
  type TimelineEventEditorModel,
  type WorldCodex,
  type WorldDetailFieldKey,
  type WorldEntry,
  type WorldRelationship,
  type WorldSectionConfig,
  type WorldWorkspaceSchema,
} from '@valgaron/core';
import {
  confirmDiscardUnsavedChanges,
  hasUnsavedChanges,
  useUnsavedChangesWarning,
} from '../../Utlilities/unsavedChanges';
import { useDialogFocus } from '../../Utlilities/dialogFocus';
import { useDocumentDraftRegistration } from '../../Utlilities/documentDraftState';
import { discardBrowserStagedImageAssets } from '../../Utlilities/imageAssetGarbageCollection';
import { EntryImageGallery, EntryImagesEditor } from './EntryImages';

function getDetailFieldSuggestionId(
  sectionId: string,
  fieldKey: WorldDetailFieldKey
): string {
  return `vwb-${sectionId}-${fieldKey}-suggestions`.replace(
    /[^a-zA-Z0-9_-]/g,
    '-'
  );
}

function getTimelineEventEditorRoute(
  event: Pick<WorldEntry, 'id' | 'name'>
): string {
  return `/timeline${formatCodexRouteSearch({
    entryId: event.id,
    intent: 'edit',
    query: event.name,
  })}`;
}

function DetailFieldSuggestionButtons({
  field,
  onSelect,
}: {
  field: EntryEditorDetailFieldModel;
  onSelect: (value: string) => void;
}) {
  if (field.suggestionActions.length === 0) {
    return null;
  }

  return (
    <div
      className="vwb-field-suggestion-row"
      aria-label={`${field.label} suggestions`}
    >
      {field.suggestionActions.map((suggestion) => (
        <button
          aria-label={suggestion.accessibilityLabel}
          className="vwb-field-suggestion-button"
          key={suggestion.value}
          type="button"
          onClick={() => onSelect(suggestion.value)}
        >
          {suggestion.label}
        </button>
      ))}
      {field.hiddenSuggestionLabel ? (
        <small className="vwb-field-suggestion-more">
          {field.hiddenSuggestionLabel}
        </small>
      ) : null}
    </div>
  );
}

function serializeStagedRelationshipDraft(
  relationship: StagedRelationshipDraft
): string {
  return [
    relationship.stagedId,
    relationship.sourceEntryId,
    relationship.targetEntryId,
    relationship.type,
    relationship.note,
    relationship.directional ? 'directional' : 'mutual',
    relationship.status,
  ].join('\u0000');
}

function haveStagedRelationshipDraftsChanged(
  baseline: readonly StagedRelationshipDraft[],
  current: readonly StagedRelationshipDraft[]
): boolean {
  if (baseline.length !== current.length) {
    return true;
  }
  const baselineKeys = baseline.map(serializeStagedRelationshipDraft).sort();
  const currentKeys = current.map(serializeStagedRelationshipDraft).sort();
  return baselineKeys.some((key, index) => key !== currentKeys[index]);
}

export function EntryCard({
  entry,
  entryListItem,
  section,
  workspaceSchema,
  isSelected,
  onSelect,
}: {
  entry: WorldEntry;
  entryListItem: EntryListItem;
  section: WorldSectionConfig;
  workspaceSchema?: WorldWorkspaceSchema;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const detailPreview = getEntryCardDetailPreviewModel(
    section,
    entry,
    workspaceSchema
  );

  return (
    <button
      className={`vwb-entry-card vwb-entry-button ${
        isSelected ? 'is-selected' : ''
      }`}
      type="button"
      onClick={onSelect}
      aria-pressed={isSelected}
      aria-label={entryListItem.editAccessibilityLabel}
    >
      <span className="vwb-entry-card-header">
        <span>
          <span className="vwb-entry-kind">{section.singularTitle}</span>
          <strong>{entry.name}</strong>
        </span>
        <small>{entryListItem.statusLabel}</small>
      </span>
      <span>{entryListItem.summaryText}</span>
      {detailPreview.text ? <small>{detailPreview.text}</small> : null}
      {entry.tags.length > 0 ? (
        <span className="vwb-tag-row" aria-label={entryDisplayCopy.tagsLabel}>
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
  workspaceSchema,
}: {
  codex: WorldCodex;
  entry: WorldEntry;
  relationships: readonly WorldRelationship[];
  section: WorldSectionConfig;
  sections: readonly WorldSectionConfig[];
  workspaceSchema?: WorldWorkspaceSchema;
}) {
  const detailModel = getEntryDetailDisplayModel(
    section,
    entry,
    workspaceSchema
  );

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
      <EntryImageGallery images={entry.images} />
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
          aria-label={entryEditorCopy.hiddenDetailsTitle}
        >
          <h3>{entryEditorCopy.hiddenDetailsTitle}</h3>
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
  const groupedRelationships = getEntryRelationshipGroupsModel(
    {
      codex,
      entryTypes: sections,
      relationships,
    },
    entry
  );

  return (
    <section className="vwb-relationship-panel" aria-labelledby="entry-links">
      <div className="vwb-section-heading">
        <div>
          <p className="vwb-kicker">
            {relationshipFeatureCopy.selectedEntryKickerLabel}
          </p>
          <h3 id="entry-links">
            {relationshipFeatureCopy.selectedEntrySectionTitle}
          </h3>
        </div>
        <NavLink
          aria-label={getRelationshipManagementAccessibilityLabel(entry)}
          className="vwb-secondary-button"
          to={getRelationshipManagementRoute({
            entryId: entry.id,
            name: entry.name,
          })}
        >
          {relationshipFeatureCopy.manageLinksLabel}
        </NavLink>
      </div>
      {groupedRelationships.length > 0 ? (
        <div className="vwb-relationship-list">
          {groupedRelationships.map((group) => (
            <section
              className="vwb-relationship-group"
              aria-label={group.label}
              key={group.id}
            >
              <h4>{group.label}</h4>
              {group.relationships.map((relationship) => (
                <article className="vwb-relationship-row" key={relationship.id}>
                  <div>
                    <span className="vwb-entry-kind">
                      {relationship.directionLabel} - {relationship.type}
                    </span>
                    {relationship.relatedEntryId ? (
                      <NavLink
                        aria-label={relationship.openEntryAccessibilityLabel}
                        to={getRelationshipEntryRouteById(
                          codex,
                          sections,
                          relationship.relatedEntryId
                        )}
                      >
                        {relationship.relatedEntryName}
                      </NavLink>
                    ) : (
                      <strong>{relationship.relatedEntryName}</strong>
                    )}
                  </div>
                  {relationship.note ? <p>{relationship.note}</p> : null}
                </article>
              ))}
            </section>
          ))}
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
  const timelineSurface = getTimelineSurfaceModel(
    { codex, entryTypes: sections, relationships },
    events
  );
  const { eraManager, groups, highlights, review, sortedEvents } =
    timelineSurface;
  const [eraReassignmentSource, setEraReassignmentSource] = useState(
    () => eraManager.eras[0]?.era ?? ''
  );
  const [eraReassignmentTarget, setEraReassignmentTarget] = useState('');
  const involvedEntryIdsByEvent =
    getTimelineInvolvedEntryIdsByEvent(relationships);
  const eventById = new Map(events.map((event) => [event.id, event]));
  const entryById = new Map(
    getRelationshipEntries(codex, sections).map((entry) => [entry.id, entry])
  );
  const moveEvent = (eventId: string, direction: 'earlier' | 'later') => {
    const updates = getTimelineOrderUpdates(events, eventId, direction);
    if (updates.length > 0) {
      onSaveEvents(updates);
    }
  };
  const eraSourceOptions = useMemo(
    () => [
      ...eraManager.eras.map((era) => ({
        label: `${era.era} (${era.eventCount})`,
        value: era.era,
      })),
      ...(eraManager.unassignedCount > 0
        ? [
            {
              label: `${timelineFeatureCopy.unassignedEraLabel} (${eraManager.unassignedCount})`,
              value: '',
            },
          ]
        : []),
    ],
    [eraManager.eras, eraManager.unassignedCount]
  );
  const canApplyEraReassignment =
    eraReassignmentTarget.trim().length > 0 &&
    eraReassignmentTarget.trim() !== eraReassignmentSource.trim();
  const applyEraReassignment = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const updates = getTimelineEraReassignmentUpdates(events, {
      sourceEra: eraReassignmentSource,
      targetEra: eraReassignmentTarget,
    });
    if (updates.length > 0) {
      onSaveEvents(updates);
      setEraReassignmentTarget('');
    }
  };

  useEffect(() => {
    if (
      eraSourceOptions.some((option) => option.value === eraReassignmentSource)
    ) {
      return;
    }
    setEraReassignmentSource(eraSourceOptions[0]?.value ?? '');
  }, [eraReassignmentSource, eraSourceOptions]);

  return (
    <section className="vwb-panel vwb-timeline-overview">
      <div className="vwb-section-heading">
        <div>
          <p className="vwb-kicker">
            {formatTimelineVisibleEventCount(timelineSurface.eventCount)}
          </p>
          <h2>{timelineFeatureCopy.timelineOverviewTitle}</h2>
        </div>
      </div>
      <section
        className="vwb-timeline-review-tray"
        aria-labelledby="timeline-review-title"
      >
        <div className="vwb-section-heading">
          <div>
            <p className="vwb-kicker">
              {formatTimelineReviewIssueCount(review.totalIssueCount)}
            </p>
            <h3 id="timeline-review-title">{review.title}</h3>
          </div>
        </div>
        <div className="vwb-timeline-review-grid">
          {review.reviewSummary.items.map((summaryItem) => {
            const detailItem = review.items.find(
              (item) => item.id === summaryItem.id
            );
            return (
              <article
                className={`vwb-diagnostic-card vwb-review-${summaryItem.severity}`}
                key={summaryItem.id}
              >
                <span className="vwb-entry-kind">{summaryItem.title}</span>
                <strong>{summaryItem.countLabel}</strong>
                <p>{summaryItem.detail}</p>
                {detailItem && detailItem.targets.length > 0 ? (
                  <ul className="vwb-compact-list">
                    {detailItem.targets.map((target) => (
                      <li key={`${detailItem.id}-${target.label}`}>
                        <span>{target.label}</span>
                        <span className="vwb-inline-link-row">
                          {target.eventIds.map((eventId) => {
                            const targetEvent = eventById.get(eventId);
                            return targetEvent ? (
                              <NavLink
                                key={eventId}
                                to={getTimelineEventEditorRoute(targetEvent)}
                              >
                                Open {targetEvent.name}
                              </NavLink>
                            ) : null;
                          })}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </article>
            );
          })}
        </div>
        {!review.hasIssues ? (
          <p className="vwb-muted-note">
            {timelineFeatureCopy.noReviewIssuesLabel}
          </p>
        ) : null}
      </section>
      {eraManager.totalEraCount > 0 || eraManager.unassignedCount > 0 ? (
        <div className="vwb-timeline-era-manager">
          <div className="vwb-section-heading">
            <div>
              <p className="vwb-kicker">{eraManager.namedEraCountLabel}</p>
              <h3>{timelineFeatureCopy.eraManagerTitle}</h3>
            </div>
          </div>
          <div
            className="vwb-tag-row"
            aria-label={timelineFeatureCopy.timelineErasLabel}
          >
            {eraManager.eras.map((era) => (
              <span className="vwb-tag" key={era.era}>
                {era.era} ({era.eventCount})
              </span>
            ))}
            {eraManager.unassignedCount > 0 ? (
              <span className="vwb-tag">
                {timelineFeatureCopy.unassignedEraLabel} (
                {eraManager.unassignedCount})
              </span>
            ) : null}
          </div>
          <form className="vwb-filter-row" onSubmit={applyEraReassignment}>
            <label>
              {timelineFeatureCopy.eraReassignmentSourceLabel}
              <select
                value={eraReassignmentSource}
                onChange={(event) =>
                  setEraReassignmentSource(event.target.value)
                }
              >
                {eraSourceOptions.map((option) => (
                  <option key={option.label} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              {timelineFeatureCopy.eraReassignmentTargetLabel}
              <input
                value={eraReassignmentTarget}
                onChange={(event) =>
                  setEraReassignmentTarget(event.target.value)
                }
                placeholder={
                  timelineFeatureCopy.eraReassignmentTargetPlaceholder
                }
              />
            </label>
            <button
              className="vwb-secondary-button"
              disabled={!canApplyEraReassignment}
              type="submit"
            >
              {timelineFeatureCopy.eraReassignmentActionLabel}
            </button>
          </form>
        </div>
      ) : null}
      {highlights.length > 0 ? (
        <div
          className="vwb-timeline-highlight-list"
          aria-label={timelineFeatureCopy.timelineHighlightsLabel}
        >
          {highlights.map((event) => (
            <article className="vwb-timeline-highlight" key={event.id}>
              <span className="vwb-entry-kind">{event.contextText}</span>
              <strong>{event.name}</strong>
              <p>{event.summaryText}</p>
            </article>
          ))}
        </div>
      ) : null}
      {sortedEvents.length > 0 ? (
        <div className="vwb-timeline-table-wrap">
          <table className="vwb-timeline-table">
            <caption>{timelineFeatureCopy.timelineTableLabel}</caption>
            <thead>
              <tr>
                <th scope="col">
                  {timelineFeatureCopy.timelineTableColumnLabels.order}
                </th>
                <th scope="col">
                  {timelineFeatureCopy.timelineTableColumnLabels.event}
                </th>
                <th scope="col">
                  {timelineFeatureCopy.timelineTableColumnLabels.date}
                </th>
                <th scope="col">
                  {timelineFeatureCopy.timelineTableColumnLabels.era}
                </th>
                <th scope="col">
                  {timelineFeatureCopy.timelineTableColumnLabels.links}
                </th>
                <th scope="col">
                  {timelineFeatureCopy.timelineTableColumnLabels.actions}
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedEvents.map((eventItem, index) => {
                const event = eventById.get(eventItem.id);
                const involvedEntryIds =
                  involvedEntryIdsByEvent.get(eventItem.id) ?? [];
                return (
                  <tr key={eventItem.id}>
                    <td>{eventItem.orderText}</td>
                    <td>{eventItem.name}</td>
                    <td>{eventItem.dateText}</td>
                    <td>
                      {eventItem.era || timelineFeatureCopy.unassignedEraLabel}
                    </td>
                    <td>{involvedEntryIds.length}</td>
                    <td>
                      <div className="vwb-table-actions">
                        {event ? (
                          <NavLink
                            className="vwb-secondary-button"
                            to={getTimelineEventEditorRoute(event)}
                            aria-label={eventItem.openAccessibilityLabel}
                          >
                            {eventItem.openLabel}
                          </NavLink>
                        ) : null}
                        <button
                          className="vwb-secondary-button"
                          type="button"
                          disabled={index === 0}
                          onClick={() => moveEvent(eventItem.id, 'earlier')}
                          aria-label={eventItem.moveEarlierAccessibilityLabel}
                        >
                          {eventItem.moveEarlierLabel}
                        </button>
                        <button
                          className="vwb-secondary-button"
                          type="button"
                          disabled={index === sortedEvents.length - 1}
                          onClick={() => moveEvent(eventItem.id, 'later')}
                          aria-label={eventItem.moveLaterAccessibilityLabel}
                        >
                          {eventItem.moveLaterLabel}
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
      {groups.length > 0 ? (
        <div className="vwb-timeline-era-list">
          {groups.map((group) => (
            <section className="vwb-timeline-era" key={group.era}>
              <h3>{group.era}</h3>
              <div className="vwb-timeline-event-list">
                {group.events.map((eventItem) => {
                  const event = eventById.get(eventItem.id);
                  const involvedEntryIds =
                    involvedEntryIdsByEvent.get(eventItem.id) ?? [];
                  return (
                    <article className="vwb-timeline-event" key={eventItem.id}>
                      <div>
                        <span className="vwb-entry-kind">
                          {eventItem.contextText}
                        </span>
                        <h4>{eventItem.name}</h4>
                      </div>
                      {event ? (
                        <NavLink
                          className="vwb-secondary-button vwb-timeline-event-open"
                          to={getTimelineEventEditorRoute(event)}
                          aria-label={eventItem.openAccessibilityLabel}
                        >
                          {eventItem.openLabel}
                        </NavLink>
                      ) : null}
                      <p>{eventItem.summaryText}</p>
                      {event?.fields.consequences ? (
                        <p className="vwb-timeline-consequence">
                          {event.fields.consequences}
                        </p>
                      ) : null}
                      {involvedEntryIds.length > 0 ? (
                        <div
                          className="vwb-tag-row"
                          aria-label={
                            eventItem.involvedEntriesAccessibilityLabel
                          }
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
        <p className="vwb-kicker">
          {destructiveActionDialogCopy.permanentDeleteKickerLabel}
        </p>
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
            {destructiveActionDialogCopy.cancelLabel}
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

function getSectionNoun(section: WorldSectionConfig): string {
  return section.singularTitle.toLowerCase();
}

function getLinkedFieldPanelTitle(section: WorldSectionConfig): string {
  return `Linked ${getSectionNoun(section)} fields`;
}

function getLinkedFieldPanelLabel(section: WorldSectionConfig): string {
  return `Relationship-backed ${getSectionNoun(section)} fields`;
}

function getLinkedFieldBlockedMessage(section: WorldSectionConfig): string {
  return `Create or update this ${getSectionNoun(
    section
  )} before editing relationship links.`;
}

function getActiveRelationshipFieldConfigs(
  entry: WorldEntry | undefined,
  visibleFieldKeys: ReadonlySet<WorldDetailFieldKey>
): RelationshipFieldConfig[] {
  if (!entry) {
    return [];
  }
  return getRelationshipFieldConfigsForEntryKind(entry.kind).filter((config) =>
    visibleFieldKeys.has(config.fieldKey)
  );
}

function RelationshipFieldControl({
  codex,
  config,
  entry,
  onDeleteRelationship,
  onSaveRelationship,
  relationships,
  sections,
}: {
  codex: WorldCodex;
  config: RelationshipFieldConfig;
  entry: WorldEntry;
  onDeleteRelationship: (relationshipId: string) => void;
  onSaveRelationship: (relationship: WorldRelationship) => void;
  relationships: readonly WorldRelationship[];
  sections: readonly WorldSectionConfig[];
}) {
  const [query, setQuery] = useState('');
  const [expandedPreferredTargets, setExpandedPreferredTargets] =
    useState(false);
  const [expandedUnusualTargets, setExpandedUnusualTargets] = useState(false);
  const fieldRelationships = getRelationshipFieldLinks(
    relationships,
    entry,
    config
  );
  const selectedTargetIds = new Set(
    fieldRelationships.map((relationship) =>
      getRelationshipFieldTargetId(relationship, config)
    )
  );
  const options = getRelationshipTargetOptions({
    codex,
    config,
    includedTargetIds: selectedTargetIds,
    sections,
    currentEntry: entry,
  });
  const filteredOptions = filterRelationshipTargetOptions(
    options,
    query,
    selectedTargetIds
  );
  const optionDisplay = getRelationshipTargetOptionDisplay({
    expandedPreferredTargets,
    expandedUnusualTargets,
    limit: RELATIONSHIP_TARGET_RESULT_LIMIT,
    options: filteredOptions,
    selectedTargetIds,
    targetCategoryBehavior: config.targetCategoryBehavior,
  });
  const visibleOptions = optionDisplay.visibleOptions;
  const hiddenPreferredCount = optionDisplay.hiddenPreferredCount;

  useEffect(() => {
    setQuery('');
    setExpandedPreferredTargets(false);
    setExpandedUnusualTargets(false);
  }, [config.fieldKey, entry.id]);

  const saveLink = (
    targetEntryId: string,
    existingRelationship?: WorldRelationship
  ) => {
    onSaveRelationship(
      makeFieldRelationship(entry, config, targetEntryId, existingRelationship)
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
      getRelationshipFieldTargetId(primaryRelationship, config) ===
        targetEntryId
    ) {
      return;
    }
    saveLink(targetEntryId, primaryRelationship);
  };

  const toggleManyTarget = (targetEntryId: string, checked: boolean) => {
    const existingRelationship = fieldRelationships.find(
      (relationship) =>
        getRelationshipFieldTargetId(relationship, config) === targetEntryId
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
          Linked as {config.relationshipType} relationship
          {config.cardinality === 'many' ? 's' : ''}.
        </p>
      </div>
      {options.length > 0 ? (
        <>
          <label>
            {getRelationshipFieldSearchLabel(config)}
            <input
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setExpandedPreferredTargets(false);
                setExpandedUnusualTargets(false);
              }}
              placeholder={relationshipFieldCopy.searchPlaceholder}
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
                    name={`relationship-link-${entry.id}-${config.fieldKey}`}
                    type="radio"
                  />
                  {relationshipFieldCopy.noLinkedRecordLabel}
                </label>
                {visibleOptions.map((option) => (
                  <label className="vwb-inline-toggle" key={option.entry.id}>
                    <input
                      checked={selectedTargetIds.has(option.entry.id)}
                      onChange={() => setSingleTarget(option.entry.id)}
                      name={`relationship-link-${entry.id}-${config.fieldKey}`}
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
              {relationshipFieldCopy.noMatchingTargetsMessage}
            </p>
          )}
          {optionDisplay.canExpandPreferredTargets ? (
            <button
              className="vwb-secondary-button"
              type="button"
              aria-expanded={false}
              onClick={() => setExpandedPreferredTargets(true)}
            >
              {optionDisplay.showPreferredTargetsLabel}
            </button>
          ) : null}
          {optionDisplay.canExpandUnusualTargets ? (
            <button
              className="vwb-secondary-button"
              type="button"
              aria-expanded={false}
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
          {relationshipFieldCopy.createMatchingRecordsMessage}
        </p>
      )}
    </section>
  );
}

export function TimelineEventEditor({
  section,
  selectedEntry,
  codex,
  relationships,
  sections,
  onArchive,
  onSaveDraft,
  onCancel,
  onDelete,
  onDeleteRelationship,
  onDuplicate,
  onDirtyChange,
  onRestore,
  onSaveRelationship,
  onUseAsTemplate,
  initialDraft,
  initialStagedRelationships,
  workspaceSchema,
}: {
  section: WorldSectionConfig;
  selectedEntry?: WorldEntry;
  initialDraft?: EntryDraft;
  initialStagedRelationships?: readonly StagedRelationshipDraft[];
  workspaceSchema?: WorldWorkspaceSchema;
  codex: WorldCodex;
  relationships: readonly WorldRelationship[];
  sections: readonly WorldSectionConfig[];
  onArchive: (entry: WorldEntry) => void;
  onSaveDraft: (
    draft: EntryDraft,
    existingEntry?: WorldEntry,
    stagedRelationships?: readonly StagedRelationshipDraft[],
    relationshipChanges?: {
      relationships: readonly WorldRelationship[];
      relationshipIdsToDelete: readonly string[];
    }
  ) => WorldEntry | null;
  onCancel: () => void;
  onDelete: (entry: WorldEntry) => void;
  onDeleteRelationship: (relationshipId: string) => void;
  onDuplicate: (entry: WorldEntry) => void;
  onDirtyChange?: (isDirty: boolean) => void;
  onRestore: (entry: WorldEntry) => void;
  onSaveRelationship: (relationship: WorldRelationship) => void;
  onUseAsTemplate: (entry: WorldEntry) => void;
}) {
  const baselineDraft = useMemo(
    () =>
      selectedEntry
        ? draftFromEntry(selectedEntry, section)
        : initialDraft ?? createEmptyDraft(),
    [initialDraft, section, selectedEntry]
  );
  const initialStagedRelationshipDrafts = useMemo(
    () => initialStagedRelationships ?? [],
    [initialStagedRelationships]
  );
  const [draft, setDraft] = useState<EntryDraft>(() => baselineDraft);
  const [stagedRelationships, setStagedRelationships] = useState<
    StagedRelationshipDraft[]
  >(() => [...initialStagedRelationshipDrafts]);
  const [involvedRecordQuery, setInvolvedRecordQuery] = useState('');
  const [expandedInvolvedRecords, setExpandedInvolvedRecords] = useState(false);
  const [error, setError] = useState('');
  const [copyStatus, setCopyStatus] = useState('');
  const reportedBaselineDraftRef = useRef(baselineDraft);
  const isDirty = hasUnsavedChanges(baselineDraft, draft);
  const hasStagedRelationshipChanges = haveStagedRelationshipDraftsChanged(
    initialStagedRelationshipDrafts,
    stagedRelationships
  );
  const isBaselineResetPending =
    reportedBaselineDraftRef.current !== baselineDraft;
  const reportedIsDirty =
    !isBaselineResetPending && (isDirty || hasStagedRelationshipChanges);
  const baseFieldLayout = getEntryEditorBaseFieldLayout(section, draft);
  const notesPreview = getEntryEditorNotesPreviewModel(draft.notes);
  const hiddenDetailCleanup = getEntryHiddenDetailCleanupModel(
    section,
    draft,
    workspaceSchema
  );
  const selectedActionModel = selectedEntry
    ? getEntryEditorSelectedActionModel(selectedEntry)
    : null;
  const relationshipConfig = getRelationshipFieldConfigsForEntryKind(
    section.kind
  ).find((config) => config.fieldKey === 'involvedRecords');
  const canEditSavedInvolvedRecords = Boolean(
    selectedEntry && relationshipConfig && !isDirty
  );
  const model = getTimelineEventEditorModel({
    draft,
    expandedInvolvedRecords,
    involvedRecordQuery,
    section,
    selectedEntry,
    suggestionLimit: entryEditorDisplayLimits.detailSuggestions,
    stagedRelationships,
    world: {
      codex,
      entryTypes: sections,
      relationships,
      schema: workspaceSchema,
    },
  });

  useUnsavedChangesWarning(reportedIsDirty);
  useDocumentDraftRegistration({
    isDirty: reportedIsDirty,
    onDiscard: () => {
      void discardBrowserStagedImageAssets(draft.stagedAssets);
      setDraft(baselineDraft);
      setStagedRelationships([...initialStagedRelationshipDrafts]);
      setInvolvedRecordQuery('');
      setExpandedInvolvedRecords(false);
      setError('');
      setCopyStatus('');
    },
    stagedAssetIds: draft.stagedAssets?.map((asset) => asset.id),
  });

  useEffect(() => {
    reportedBaselineDraftRef.current = baselineDraft;
    setDraft(baselineDraft);
    setStagedRelationships([...initialStagedRelationshipDrafts]);
    setInvolvedRecordQuery('');
    setExpandedInvolvedRecords(false);
    setError('');
    setCopyStatus('');
  }, [baselineDraft, initialStagedRelationshipDrafts]);

  useEffect(() => {
    onDirtyChange?.(reportedIsDirty);
  }, [onDirtyChange, reportedIsDirty]);

  const updateDetail = (key: WorldDetailFieldKey, value: string) => {
    setDraft((currentDraft) => ({
      ...currentDraft,
      details: { ...currentDraft.details, [key]: value },
    }));
  };

  const discardIfAllowed = (action: () => void) => {
    if (confirmDiscardUnsavedChanges(isDirty || hasStagedRelationshipChanges)) {
      void discardBrowserStagedImageAssets(draft.stagedAssets);
      action();
    }
  };

  const saveDraft = (
    nextDraft: EntryDraft,
    existingEntry?: WorldEntry,
    relationshipChanges?: {
      relationships: readonly WorldRelationship[];
      relationshipIdsToDelete: readonly string[];
    }
  ): WorldEntry | null => {
    const savedEntry = onSaveDraft(
      nextDraft,
      existingEntry,
      stagedRelationships,
      relationshipChanges
    );
    if (!savedEntry) {
      return null;
    }
    setDraft((currentDraft) => {
      const nextDraft = { ...currentDraft };
      delete nextDraft.stagedAssets;
      return nextDraft;
    });
    setStagedRelationships([]);
    return savedEntry;
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

  const toggleStagedInvolvedRecord = (targetEntryId: string) => {
    const existingRelationship = stagedRelationships.find(
      (relationship) => relationship.targetEntryId === targetEntryId
    );
    if (existingRelationship) {
      setStagedRelationships((current) =>
        deleteStagedRelationshipDraft(current, existingRelationship.stagedId)
      );
      return;
    }
    const relationship =
      createTimelineInvolvedRecordStagedRelationship(targetEntryId);
    if (!relationship) {
      return;
    }
    setStagedRelationships((current) =>
      upsertStagedRelationshipDraft(current, relationship)
    );
  };

  const migrateLegacyInvolvedText = () => {
    if (
      !selectedEntry ||
      !relationshipConfig ||
      isDirty ||
      !model.involvedRecords.legacyText?.canMigrate
    ) {
      return;
    }
    const migration = getRelationshipFieldTextMigration({
      codex,
      config: relationshipConfig,
      currentEntry: selectedEntry,
      sections,
      value: model.involvedRecords.legacyText.value,
    });
    const operation = buildRelationshipFieldTextMigrationOperation({
      config: relationshipConfig,
      entry: selectedEntry,
      migration,
      relationships,
    });
    const nextDraft = {
      ...draft,
      details: {
        ...draft.details,
        involvedRecords: operation.fields.involvedRecords ?? '',
      },
    };
    setDraft(nextDraft);
    saveDraft(nextDraft, selectedEntry, {
      relationships: operation.relationshipsToSave.map(
        ({ relationship }) => relationship
      ),
      relationshipIdsToDelete: operation.relationshipIdsToDelete,
    });
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validation = validateEntryDraftTransaction({
      codex,
      entryDraft: draft,
      existingEntry: selectedEntry,
      section,
      stagedRelationships,
      workspaceSchema,
    });
    if (!validation.ok) {
      setError(formatDraftValidationErrors(validation));
      return;
    }
    if (!saveDraft(draft, selectedEntry)) {
      return;
    }
    setError('');
  };

  const renderTimelineField = (field: EntryEditorDetailFieldModel) => {
    const suggestionId = getDetailFieldSuggestionId(section.id, field.key);
    return (
      <label
        className={field.multiline ? 'vwb-wide-field' : undefined}
        key={field.key}
      >
        {field.label}
        {field.helpText ? (
          <small className="vwb-field-help">{field.helpText}</small>
        ) : null}
        {field.multiline ? (
          <textarea
            value={field.value}
            onChange={(event) => updateDetail(field.key, event.target.value)}
            rows={field.rows}
          />
        ) : (
          <>
            <input
              value={field.value}
              onChange={(event) => updateDetail(field.key, event.target.value)}
              list={field.suggestions.length > 0 ? suggestionId : undefined}
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
        {field.canonicalReplacement ? (
          <button
            aria-label={field.canonicalReplacement.accessibilityLabel}
            className="vwb-secondary-button"
            type="button"
            onClick={() => {
              const replacement = field.canonicalReplacement;
              if (replacement) {
                updateDetail(field.key, replacement.value);
              }
            }}
          >
            {field.canonicalReplacement.label}
          </button>
        ) : null}
        <DetailFieldSuggestionButtons
          field={field}
          onSelect={(value) => updateDetail(field.key, value)}
        />
      </label>
    );
  };

  const renderTimelineFieldGroup = (
    group: TimelineEventEditorModel['chronology']
  ) =>
    group.fields.length > 0 ? (
      <section className="vwb-field-group" aria-label={group.label}>
        <h3>{group.label}</h3>
        <div className="vwb-form-grid">
          {group.fields.map(renderTimelineField)}
        </div>
      </section>
    ) : null;

  return (
    <form className="vwb-form vwb-timeline-editor" onSubmit={handleSubmit}>
      <div className="vwb-section-heading">
        <div>
          <p className="vwb-kicker">
            {selectedEntry ? entryEditorCopy.editKicker : 'Timeline event'}
          </p>
          <h2>{model.title}</h2>
        </div>
        {reportedIsDirty ? (
          <span className="vwb-status-pill">
            {entryEditorCopy.unappliedLabel}
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
        ) : null}
      </div>

      {baseFieldLayout.leadingFields.map((field) => (
        <label
          className={field.multiline ? 'vwb-wide-field' : undefined}
          key={field.id}
        >
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

      {renderTimelineFieldGroup(model.chronology)}

      <section
        className="vwb-linked-field-panel"
        aria-label={model.involvedRecords.title}
      >
        <div>
          <h3>{model.involvedRecords.title}</h3>
          <p>{model.involvedRecords.description}</p>
        </div>
        {selectedEntry && relationshipConfig ? (
          canEditSavedInvolvedRecords ? (
            <RelationshipFieldControl
              codex={codex}
              config={relationshipConfig}
              entry={selectedEntry}
              onDeleteRelationship={onDeleteRelationship}
              onSaveRelationship={onSaveRelationship}
              relationships={relationships}
              sections={sections}
            />
          ) : (
            <p className="vwb-inline-status">
              {model.involvedRecords.applyBeforeEditMessage}
            </p>
          )
        ) : (
          <>
            <label className="vwb-search-field">
              {model.involvedRecords.searchLabel}
              <input
                value={involvedRecordQuery}
                onChange={(event) => {
                  setInvolvedRecordQuery(event.target.value);
                  setExpandedInvolvedRecords(false);
                }}
                placeholder={model.involvedRecords.searchPlaceholder}
                type="search"
              />
            </label>
            {model.involvedRecords.options.length > 0 ? (
              <div
                className="vwb-tag-filter-group"
                aria-label={model.involvedRecords.optionListLabel}
              >
                {model.involvedRecords.options.map((record) => (
                  <button
                    aria-pressed={record.selected}
                    className={`vwb-tag-filter ${
                      record.selected ? 'is-active' : ''
                    }`}
                    key={record.id}
                    type="button"
                    onClick={() => toggleStagedInvolvedRecord(record.id)}
                  >
                    {record.name} ({record.sectionTitle})
                  </button>
                ))}
              </div>
            ) : (
              <p className="vwb-inline-status">
                {model.involvedRecords.emptySearchLabel}
              </p>
            )}
            {model.involvedRecords.display.canExpandPreferredTargets ||
            model.involvedRecords.display.canExpandUnusualTargets ? (
              <button
                className="vwb-secondary-button"
                type="button"
                aria-expanded={expandedInvolvedRecords}
                onClick={() => setExpandedInvolvedRecords(true)}
              >
                {model.involvedRecords.display.showPreferredTargetsLabel ||
                  model.involvedRecords.display.showUnusualTargetsLabel}
              </button>
            ) : null}
          </>
        )}
        {model.involvedRecords.selectedRecords.length > 0 ? (
          <div
            className="vwb-tag-row"
            aria-label={model.involvedRecords.selectedRecordsLabel}
          >
            {model.involvedRecords.selectedRecords.map((record) => (
              <span className="vwb-tag" key={record.id}>
                {record.name}
              </span>
            ))}
          </div>
        ) : null}
        {model.involvedRecords.duplicateStagedTargetLabel ? (
          <p className="vwb-inline-status is-danger">
            {model.involvedRecords.duplicateStagedTargetLabel}
          </p>
        ) : null}
      </section>

      {model.involvedRecords.legacyText ? (
        <section
          className="vwb-hidden-detail-panel"
          aria-label={model.involvedRecords.legacyText.title}
        >
          <h3>{model.involvedRecords.legacyText.title}</h3>
          <dl className="vwb-detail-list">
            <div>
              <dt>{model.involvedRecords.legacyText.label}</dt>
              <dd>
                <span>{model.involvedRecords.legacyText.value}</span>
                {model.involvedRecords.legacyText.canMigrate ? (
                  <button
                    className="vwb-secondary-button"
                    disabled={isDirty}
                    type="button"
                    onClick={migrateLegacyInvolvedText}
                  >
                    {relationshipTextReviewCopy.exactMatchMigrationLabel}
                  </button>
                ) : null}
                <button
                  className="vwb-secondary-button"
                  type="button"
                  onClick={() => updateDetail('involvedRecords', '')}
                >
                  {entryEditorCopy.clearLabel}
                </button>
              </dd>
            </div>
          </dl>
        </section>
      ) : null}

      {renderTimelineFieldGroup(model.outcomes)}

      <label className="vwb-wide-field">
        {entryEditorCopy.notesLabel}
        <textarea
          value={draft.notes}
          onChange={(event) =>
            setDraft((currentDraft) => ({
              ...currentDraft,
              notes: event.target.value,
            }))
          }
          placeholder={entryEditorFieldCopy.notesPlaceholder}
          rows={4}
        />
      </label>

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

      {baseFieldLayout.trailingFields.map((field) => (
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

      <EntryImagesEditor
        images={draft.images ?? []}
        stagedAssets={draft.stagedAssets}
        onChange={(images, stagedAssets) =>
          setDraft((currentDraft) => ({
            ...currentDraft,
            images,
            stagedAssets,
          }))
        }
      />

      {model.extraDetails ? renderTimelineFieldGroup(model.extraDetails) : null}

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

      {copyStatus ? <p className="vwb-inline-status">{copyStatus}</p> : null}
      {error ? <p className="vwb-form-error">{error}</p> : null}
      <div className="vwb-form-actions">
        <button className="vwb-primary-button" type="submit">
          {model.submitLabel}
        </button>
        <button
          className="vwb-secondary-button"
          type="button"
          onClick={() => discardIfAllowed(onCancel)}
        >
          {entryEditorCopy.newDraftLabel}
        </button>
        <button
          className="vwb-secondary-button"
          type="button"
          onClick={copyEntryName}
        >
          {entryNameCopyFeedback.actionLabel}
        </button>
        {selectedEntry && selectedActionModel ? (
          <>
            <button
              aria-label={selectedActionModel.archiveAccessibilityLabel}
              className="vwb-secondary-button"
              type="button"
              onClick={() =>
                selectedEntry.status === 'archived'
                  ? onRestore(selectedEntry)
                  : onArchive(selectedEntry)
              }
            >
              {selectedActionModel.archiveLabel}
            </button>
            <button
              aria-label={selectedActionModel.duplicateAccessibilityLabel}
              className="vwb-secondary-button"
              type="button"
              onClick={() => onDuplicate(selectedEntry)}
            >
              {selectedActionModel.duplicateLabel}
            </button>
            <button
              aria-label={selectedActionModel.useAsTemplateAccessibilityLabel}
              className="vwb-secondary-button"
              type="button"
              onClick={() => onUseAsTemplate(selectedEntry)}
            >
              {selectedActionModel.useAsTemplateLabel}
            </button>
            <button
              aria-label={selectedActionModel.deleteAccessibilityLabel}
              className="vwb-secondary-button vwb-danger-button"
              type="button"
              onClick={() => onDelete(selectedEntry)}
            >
              {selectedActionModel.deleteLabel}
            </button>
          </>
        ) : null}
      </div>
    </form>
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
  onSaveDraft,
  onCancel,
  onDelete,
  onDeleteRelationship,
  onDuplicate,
  onDirtyChange,
  onRestore,
  onSaveRelationship,
  onUseAsTemplate,
  initialDraft,
  initialStagedRelationships,
  sectionEntries = [],
  workspaceSchema,
}: {
  section: WorldSectionConfig;
  sectionEntries?: readonly WorldEntry[];
  workspaceSchema?: WorldWorkspaceSchema;
  selectedEntry?: WorldEntry;
  initialDraft?: EntryDraft;
  initialStagedRelationships?: readonly StagedRelationshipDraft[];
  codex?: WorldCodex;
  relationships?: readonly WorldRelationship[];
  sections?: readonly WorldSectionConfig[];
  onArchive: (entry: WorldEntry) => void;
  onSave: (entry: WorldEntry) => void;
  onSaveDraft?: (
    draft: EntryDraft,
    existingEntry?: WorldEntry,
    stagedRelationships?: readonly StagedRelationshipDraft[],
    relationshipChanges?: {
      relationships: readonly WorldRelationship[];
      relationshipIdsToDelete: readonly string[];
    }
  ) => WorldEntry | null;
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
  const initialStagedRelationshipDrafts = useMemo(
    () => initialStagedRelationships ?? [],
    [initialStagedRelationships]
  );
  const [draft, setDraft] = useState<EntryDraft>(() => baselineDraft);
  const [stagedRelationships, setStagedRelationships] = useState<
    StagedRelationshipDraft[]
  >(() => [...initialStagedRelationshipDrafts]);
  const [stagedTargetEntryId, setStagedTargetEntryId] = useState('');
  const [stagedRelationshipType, setStagedRelationshipType] =
    useState('references');
  const [stagedRelationshipNote, setStagedRelationshipNote] = useState('');
  const [error, setError] = useState('');
  const [copyStatus, setCopyStatus] = useState('');
  const reportedBaselineDraftRef = useRef(baselineDraft);
  const isDirty = hasUnsavedChanges(baselineDraft, draft);
  const hasStagedRelationshipChanges = haveStagedRelationshipDraftsChanged(
    initialStagedRelationshipDrafts,
    stagedRelationships
  );
  const isBaselineResetPending =
    reportedBaselineDraftRef.current !== baselineDraft;
  const reportedIsDirty =
    !isBaselineResetPending && (isDirty || hasStagedRelationshipChanges);
  const visibleDetailFields = useMemo(
    () => getDraftDetailFields(section, draft, workspaceSchema),
    [section, draft, workspaceSchema]
  );
  const visibleFieldKeys = new Set(
    visibleDetailFields.map((field) => field.key)
  );
  const activeRelationshipFieldConfigs = getActiveRelationshipFieldConfigs(
    selectedEntry,
    visibleFieldKeys
  );
  const relationshipFieldKeys = new Set(
    activeRelationshipFieldConfigs.map((config) => config.fieldKey)
  );
  const editableDetailFields =
    activeRelationshipFieldConfigs.length > 0
      ? visibleDetailFields.filter(
          (field) => !relationshipFieldKeys.has(field.key)
        )
      : visibleDetailFields;
  const baseFieldLayout = getEntryEditorBaseFieldLayout(section, draft);
  const notesPreview = getEntryEditorNotesPreviewModel(draft.notes);
  const detailFieldGroups = useMemo(
    () =>
      getEntryEditorDetailFieldGroups({
        draft,
        fields: editableDetailFields,
        section,
        sectionEntries,
        suggestionLimit: entryEditorDisplayLimits.detailSuggestions,
        workspaceSchema,
      }),
    [draft, editableDetailFields, section, sectionEntries, workspaceSchema]
  );
  const hiddenDetailCleanup = getEntryHiddenDetailCleanupModel(
    section,
    draft,
    workspaceSchema
  );
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
  const canEditRelationshipFields = Boolean(
    selectedEntry &&
      !isDirty &&
      codex &&
      relationships &&
      sections &&
      onDeleteRelationship &&
      onSaveRelationship
  );
  const stagedRelationshipTargetOptions = useMemo(
    () =>
      codex && sections
        ? getRelationshipEntries(codex, sections).filter(
            (entry) =>
              entry.id !== selectedEntry?.id && entry.status !== 'archived'
          )
        : [],
    [codex, sections, selectedEntry]
  );
  const stagedRelationshipTargetById = useMemo(
    () =>
      new Map(
        stagedRelationshipTargetOptions.map((entry) => [entry.id, entry])
      ),
    [stagedRelationshipTargetOptions]
  );
  const canStageRelationshipLinks = Boolean(
    !selectedEntry &&
      onSaveDraft &&
      codex &&
      sections &&
      stagedRelationshipTargetOptions.length
  );
  const isDuplicateStagedRelationship = hasDuplicateStagedRelationshipDraft({
    stagedRelationships,
    targetEntryId: stagedTargetEntryId,
    type: stagedRelationshipType,
  });
  const canStageCurrentRelationship = Boolean(
    stagedTargetEntryId &&
      stagedRelationshipType.trim() &&
      !isDuplicateStagedRelationship
  );

  useUnsavedChangesWarning(reportedIsDirty);
  useDocumentDraftRegistration({
    isDirty: reportedIsDirty,
    onDiscard: () => {
      void discardBrowserStagedImageAssets(draft.stagedAssets);
      setDraft(baselineDraft);
      setStagedRelationships([...initialStagedRelationshipDrafts]);
      setStagedTargetEntryId('');
      setStagedRelationshipType('references');
      setStagedRelationshipNote('');
      setError('');
      setCopyStatus('');
    },
    stagedAssetIds: draft.stagedAssets?.map((asset) => asset.id),
  });

  useEffect(() => {
    reportedBaselineDraftRef.current = baselineDraft;
    setDraft(baselineDraft);
    setStagedRelationships([...initialStagedRelationshipDrafts]);
    setStagedTargetEntryId('');
    setStagedRelationshipType('references');
    setStagedRelationshipNote('');
    setError('');
    setCopyStatus('');
  }, [baselineDraft, initialStagedRelationshipDrafts]);

  useEffect(() => {
    onDirtyChange?.(reportedIsDirty);
  }, [onDirtyChange, reportedIsDirty]);

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
      void discardBrowserStagedImageAssets(draft.stagedAssets);
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

  const saveDraft = (
    nextDraft: EntryDraft,
    existingEntry?: WorldEntry,
    relationshipChanges?: {
      relationships: readonly WorldRelationship[];
      relationshipIdsToDelete: readonly string[];
    }
  ): WorldEntry | null => {
    const savedEntry = onSaveDraft
      ? onSaveDraft(
          nextDraft,
          existingEntry,
          stagedRelationships,
          relationshipChanges
        )
      : entryFromDraft(section, nextDraft, existingEntry);
    if (!savedEntry) {
      return null;
    }
    setDraft((currentDraft) => {
      const nextDraft = { ...currentDraft };
      delete nextDraft.stagedAssets;
      return nextDraft;
    });
    if (!onSaveDraft) {
      onSave(savedEntry);
    }
    setStagedRelationships([]);
    return savedEntry;
  };

  const stageRelationshipLink = () => {
    if (!stagedTargetEntryId || !stagedRelationshipType.trim()) {
      setError(stagedRelationshipDraftCopy.missingTargetOrTypeMessage);
      return;
    }
    if (isDuplicateStagedRelationship) {
      setError(stagedRelationshipDraftCopy.duplicateMessage);
      return;
    }
    const draftRelationship: RelationshipDraft = {
      ...createEmptyRelationshipDraft(),
      sourceEntryId: draftTransactionEntryId,
      targetEntryId: stagedTargetEntryId,
      type: stagedRelationshipType,
      note: stagedRelationshipNote,
    };
    setStagedRelationships((current) =>
      upsertStagedRelationshipDraft(
        current,
        createStagedRelationshipDraft(draftRelationship)
      )
    );
    setStagedTargetEntryId('');
    setStagedRelationshipNote('');
    setError('');
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validation =
      codex && onSaveDraft
        ? validateEntryDraftTransaction({
            codex,
            entryDraft: draft,
            existingEntry: selectedEntry,
            section,
            stagedRelationships,
            workspaceSchema,
          })
        : validateEntryDraft(section, draft, { workspaceSchema });
    if (!validation.ok) {
      setError(formatDraftValidationErrors(validation));
      return;
    }
    if (!saveDraft(draft, selectedEntry)) {
      return;
    }
    setError('');
  };

  const getLegacyRelationshipTextMigration = (
    config: RelationshipFieldConfig,
    value: string
  ) => {
    if (!selectedEntry || !codex || !sections) {
      return null;
    }
    return getRelationshipFieldTextMigration({
      codex,
      config,
      currentEntry: selectedEntry,
      sections,
      value,
    });
  };

  const migrateLegacyRelationshipText = (
    config: RelationshipFieldConfig,
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
    const operation = buildRelationshipFieldTextMigrationOperation({
      config,
      entry: selectedEntry,
      migration,
      relationships,
    });
    const nextDraft = {
      ...draft,
      details: {
        ...draft.details,
        [config.fieldKey]: operation.fields[config.fieldKey] ?? '',
      },
    };
    setDraft(nextDraft);
    saveDraft(nextDraft, selectedEntry, {
      relationships: operation.relationshipsToSave.map(
        ({ relationship }) => relationship
      ),
      relationshipIdsToDelete: operation.relationshipIdsToDelete,
    });
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
        {reportedIsDirty ? (
          <span className="vwb-status-pill">
            {entryEditorCopy.unappliedLabel}
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

      {baseFieldLayout.leadingFields.map((field) => (
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

      {baseFieldLayout.trailingFields.map((field) => (
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

      <EntryImagesEditor
        images={draft.images ?? []}
        stagedAssets={draft.stagedAssets}
        onChange={(images, stagedAssets) =>
          setDraft((currentDraft) => ({
            ...currentDraft,
            images,
            stagedAssets,
          }))
        }
      />

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

      {detailFieldGroups.map((group) => (
        <section
          className={
            detailFieldGroups.length > 1 ? 'vwb-field-group' : undefined
          }
          aria-label={group.label}
          key={group.id}
        >
          {detailFieldGroups.length > 1 ? <h3>{group.label}</h3> : null}
          <div className="vwb-form-grid">
            {group.fields.map((field) =>
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
                    {field.helpText ? (
                      <small className="vwb-field-help">{field.helpText}</small>
                    ) : null}
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
                            field.suggestions.length > 0
                              ? suggestionId
                              : undefined
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
                    {field.canonicalReplacement ? (
                      <button
                        aria-label={
                          field.canonicalReplacement.accessibilityLabel
                        }
                        className="vwb-secondary-button"
                        type="button"
                        onClick={() => {
                          const replacement = field.canonicalReplacement;
                          if (replacement) {
                            updateDetail(field.key, replacement.value);
                          }
                        }}
                      >
                        {field.canonicalReplacement.label}
                      </button>
                    ) : null}
                    <DetailFieldSuggestionButtons
                      field={field}
                      onSelect={(value) => updateDetail(field.key, value)}
                    />
                  </label>
                );
              })()
            )}
          </div>
        </section>
      ))}

      {canStageRelationshipLinks ? (
        <section
          className="vwb-linked-field-panel"
          aria-label={stagedRelationshipDraftCopy.accessibilityLabel}
        >
          <div>
            <h3>{stagedRelationshipDraftCopy.title}</h3>
            <p>{stagedRelationshipDraftCopy.detail}</p>
          </div>
          <div className="vwb-form-grid">
            <label>
              {stagedRelationshipDraftCopy.targetLabel}
              <select
                value={stagedTargetEntryId}
                onChange={(event) => setStagedTargetEntryId(event.target.value)}
              >
                <option value="">
                  {stagedRelationshipDraftCopy.targetEmptyLabel}
                </option>
                {stagedRelationshipTargetOptions.map((entry) => (
                  <option value={entry.id} key={entry.id}>
                    {entry.name} ({entry.sectionTitle})
                  </option>
                ))}
              </select>
            </label>
            <label>
              {stagedRelationshipDraftCopy.typeLabel}
              <input
                value={stagedRelationshipType}
                onChange={(event) =>
                  setStagedRelationshipType(event.target.value)
                }
                placeholder={stagedRelationshipDraftCopy.typePlaceholder}
              />
            </label>
            <label className="vwb-wide-field">
              {stagedRelationshipDraftCopy.noteLabel}
              <textarea
                rows={3}
                value={stagedRelationshipNote}
                onChange={(event) =>
                  setStagedRelationshipNote(event.target.value)
                }
                placeholder={stagedRelationshipDraftCopy.notePlaceholder}
              />
            </label>
          </div>
          <button
            className="vwb-secondary-button"
            disabled={!canStageCurrentRelationship}
            type="button"
            onClick={stageRelationshipLink}
          >
            {stagedRelationshipDraftCopy.stageLabel}
          </button>
          {isDuplicateStagedRelationship ? (
            <p className="vwb-inline-status is-danger">
              {stagedRelationshipDraftCopy.duplicateMessage}
            </p>
          ) : null}
          {stagedRelationships.length > 0 ? (
            <div className="vwb-relationship-list">
              {stagedRelationships.map((relationship) => {
                const target = stagedRelationshipTargetById.get(
                  relationship.targetEntryId
                );
                const rowModel = getStagedRelationshipDraftRowModel({
                  relationship,
                  targetLabel: target?.name,
                });
                return (
                  <article
                    className="vwb-relationship-row"
                    key={relationship.stagedId}
                  >
                    <div>
                      <span className="vwb-entry-kind">{rowModel.kicker}</span>
                      <strong>{rowModel.detail}</strong>
                    </div>
                    {rowModel.note ? <p>{rowModel.note}</p> : null}
                    <button
                      aria-label={rowModel.removeAccessibilityLabel}
                      className="vwb-secondary-button vwb-danger-button"
                      type="button"
                      onClick={() =>
                        setStagedRelationships((current) =>
                          deleteStagedRelationshipDraft(
                            current,
                            relationship.stagedId
                          )
                        )
                      }
                    >
                      {rowModel.removeLabel}
                    </button>
                  </article>
                );
              })}
            </div>
          ) : null}
        </section>
      ) : null}

      {selectedEntry && activeRelationshipFieldConfigs.length > 0 ? (
        <section
          className="vwb-linked-field-panel"
          aria-label={getLinkedFieldPanelLabel(section)}
        >
          <div>
            <h3>{getLinkedFieldPanelTitle(section)}</h3>
            <p>{relationshipTextReviewCopy.linkedFieldsDescription}</p>
          </div>
          {canEditRelationshipFields ? (
            activeRelationshipFieldConfigs.map((config) => (
              <RelationshipFieldControl
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
              {getLinkedFieldBlockedMessage(section)}
            </p>
          )}
          {legacyRelationshipTextValues.length > 0 ? (
            <section
              className="vwb-hidden-detail-panel"
              aria-label={relationshipTextReviewCopy.currentTextLinkNotesTitle}
            >
              <h4>{relationshipTextReviewCopy.currentTextLinkNotesTitle}</h4>
              <dl className="vwb-detail-list">
                {legacyRelationshipTextValues.map((field) => {
                  const migration = canEditRelationshipFields
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
                              relationshipTextReviewCopy.exactMatchMigrationLabel
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
                            {getRelationshipTextMigrationStatus(migration)}
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
          {getEntryEditorSubmitLabel({
            section,
            selectedEntry,
            stagedRelationshipCount:
              normalizeStagedRelationshipDrafts(stagedRelationships).length,
          })}
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
