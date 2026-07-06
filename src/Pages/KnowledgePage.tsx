import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  emptyEntryTypeDraft,
  entryTypeDraftFields,
  formatDestructiveActionTitle,
  formatDraftValidationErrors,
  formatWorkspaceFeatureAccessibilityLabel,
  getCodexScreenIntro,
  getDestructiveActionCopy,
  getEntryTypeDraftFieldPreview,
  getKnowledgeRouteFocusTargetId,
  getKnowledgeSchemaModel,
  knowledgeRouteFocusTargetIds,
  validateEntryTypeDraft,
  workspaceFeatureActions,
  workspaceFeatureCopy,
  type CustomEntryTypeFieldMoveDirection,
  type DestructiveActionId,
  type EntryTypeDraft,
  type WorldWorkspace,
} from '@valgaron/core';
import {
  confirmDiscardUnsavedChanges,
  hasUnsavedChanges,
  useUnsavedChangesWarning,
} from '../Utlilities/unsavedChanges';
import { useDialogFocus } from '../Utlilities/dialogFocus';

type PendingKnowledgeDestructiveAction = {
  actionId: Extract<
    DestructiveActionId,
    | 'clear-hidden-entry-details'
    | 'delete-entry-type'
    | 'remove-entry-type-field'
  >;
  title: string;
  onConfirm: () => void;
};

function getKnowledgeRouteFocusTargetIdFromHash(hash: string): string {
  return getKnowledgeRouteFocusTargetId({
    focusId: decodeURIComponent(hash.replace(/^#/, '')),
  });
}

function KnowledgeDestructiveActionDialog({
  pendingAction,
  onCancel,
  onConfirm,
}: {
  pendingAction: PendingKnowledgeDestructiveAction;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const dialogRef = useDialogFocus<HTMLElement>(true, onCancel);
  const copy = getDestructiveActionCopy(pendingAction.actionId);
  const titleId = `${pendingAction.actionId}-knowledge-confirm-title`;
  const descriptionId = `${pendingAction.actionId}-knowledge-confirm-description`;

  return (
    <div className="vwb-dialog-backdrop" role="presentation">
      <section
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className="vwb-dialog"
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        tabIndex={-1}
      >
        <p className="vwb-kicker">Knowledge schema action</p>
        <h2 id={titleId}>{pendingAction.title}</h2>
        <p id={descriptionId}>{copy.message}</p>
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

export function KnowledgePage({
  activeWorld,
  onAddEntryTypeFields,
  onClearHiddenEntryDetails,
  onCreateEntryType,
  onDeleteEntryType,
  onMoveEntryTypeField,
  onRenameEntryTypeField,
  onRemoveEntryTypeField,
}: {
  activeWorld: WorldWorkspace;
  onAddEntryTypeFields: (sectionId: string, fieldsText: string) => void;
  onClearHiddenEntryDetails: () => void;
  onCreateEntryType: (draft: EntryTypeDraft) => void;
  onDeleteEntryType: (sectionId: string) => void;
  onMoveEntryTypeField: (
    sectionId: string,
    fieldKey: string,
    direction: CustomEntryTypeFieldMoveDirection
  ) => void;
  onRenameEntryTypeField: (
    sectionId: string,
    fieldKey: string,
    label: string
  ) => void;
  onRemoveEntryTypeField: (sectionId: string, fieldKey: string) => void;
}) {
  const location = useLocation();
  const intro = getCodexScreenIntro('knowledge');
  const schemaModel = getKnowledgeSchemaModel(activeWorld);
  const [entryTypeDraft, setEntryTypeDraft] = useState<EntryTypeDraft>(() =>
    emptyEntryTypeDraft()
  );
  const [entryTypeError, setEntryTypeError] = useState('');
  const [entryTypeFieldDrafts, setEntryTypeFieldDrafts] = useState<
    Record<string, string>
  >({});
  const [entryTypeFieldErrors, setEntryTypeFieldErrors] = useState<
    Record<string, string>
  >({});
  const [fieldLabelDrafts, setFieldLabelDrafts] = useState<
    Record<string, string>
  >({});
  const [fieldLabelErrors, setFieldLabelErrors] = useState<
    Record<string, string>
  >({});
  const [pendingDestructiveAction, setPendingDestructiveAction] =
    useState<PendingKnowledgeDestructiveAction | null>(null);
  const [expandedVocabularyValueRows, setExpandedVocabularyValueRows] =
    useState<Record<string, boolean>>({});
  const customTypes = schemaModel.sections.filter((section) => section.custom);
  const entryTypeFieldPreview = getEntryTypeDraftFieldPreview(
    entryTypeDraft.fields
  );
  const entryTypeFieldDraftPreviews = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(entryTypeFieldDrafts).map(([sectionId, fieldsText]) => [
          sectionId,
          getEntryTypeDraftFieldPreview(fieldsText),
        ])
      ),
    [entryTypeFieldDrafts]
  );
  const isEntryTypeDraftDirty = hasUnsavedChanges(
    emptyEntryTypeDraft(),
    entryTypeDraft
  );
  const hasPendingFieldDrafts = Object.values(entryTypeFieldDrafts).some(
    (draft) => draft.trim().length > 0
  );
  const customFieldDraftDescriptor = entryTypeDraftFields.find(
    (field) => field.key === 'fields'
  );
  const getFieldLabelDraftKey = (sectionId: string, fieldKey: string) =>
    `${sectionId}:${fieldKey}`;
  const hasPendingLabelDrafts = customTypes.some((section) =>
    section.fields.some((field) => {
      const draftKey = getFieldLabelDraftKey(section.id, field.key);
      const draftLabel = fieldLabelDrafts[draftKey];
      return draftLabel !== undefined && draftLabel.trim() !== field.label;
    })
  );

  useUnsavedChangesWarning(
    isEntryTypeDraftDirty || hasPendingFieldDrafts || hasPendingLabelDrafts
  );

  useEffect(() => {
    const focusTargetId = getKnowledgeRouteFocusTargetIdFromHash(location.hash);
    if (!focusTargetId) {
      return;
    }
    const focusedSection = window.document.getElementById(focusTargetId);
    focusedSection?.scrollIntoView({ block: 'start' });
    focusedSection?.focus({ preventScroll: true });
  }, [location.hash]);

  const updateEntryTypeDraft = (
    key: (typeof entryTypeDraftFields)[number]['key'],
    value: string
  ) => {
    setEntryTypeDraft((currentDraft) => ({
      ...currentDraft,
      [key]: value,
    }));
  };

  const submitEntryType = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validation = validateEntryTypeDraft(entryTypeDraft);
    if (!validation.ok) {
      setEntryTypeError(formatDraftValidationErrors(validation));
      return;
    }
    onCreateEntryType(entryTypeDraft);
    setEntryTypeDraft(emptyEntryTypeDraft());
    setEntryTypeError('');
  };

  const updateEntryTypeFieldDraft = (sectionId: string, value: string) => {
    setEntryTypeFieldDrafts((currentDrafts) => ({
      ...currentDrafts,
      [sectionId]: value,
    }));
    setEntryTypeFieldErrors((currentErrors) => ({
      ...currentErrors,
      [sectionId]: '',
    }));
  };

  const updateFieldLabelDraft = (
    sectionId: string,
    fieldKey: string,
    value: string
  ) => {
    const draftKey = getFieldLabelDraftKey(sectionId, fieldKey);
    setFieldLabelDrafts((currentDrafts) => ({
      ...currentDrafts,
      [draftKey]: value,
    }));
    setFieldLabelErrors((currentErrors) => ({
      ...currentErrors,
      [draftKey]: '',
    }));
  };

  const submitFieldLabel = (
    sectionId: string,
    fieldKey: string,
    currentLabel: string
  ) => {
    const draftKey = getFieldLabelDraftKey(sectionId, fieldKey);
    const draftLabel = fieldLabelDrafts[draftKey] ?? currentLabel;
    const nextLabel = draftLabel.trim();
    if (!nextLabel) {
      setFieldLabelErrors((currentErrors) => ({
        ...currentErrors,
        [draftKey]: 'Field label is required.',
      }));
      return;
    }
    if (nextLabel === currentLabel) {
      setFieldLabelDrafts((currentDrafts) => ({
        ...currentDrafts,
        [draftKey]: currentLabel,
      }));
      return;
    }
    onRenameEntryTypeField(sectionId, fieldKey, nextLabel);
    setFieldLabelDrafts((currentDrafts) => ({
      ...currentDrafts,
      [draftKey]: nextLabel,
    }));
    setFieldLabelErrors((currentErrors) => ({
      ...currentErrors,
      [draftKey]: '',
    }));
  };

  const submitEntryTypeFields = (
    event: FormEvent<HTMLFormElement>,
    sectionId: string
  ) => {
    event.preventDefault();
    const fieldsText = entryTypeFieldDrafts[sectionId] ?? '';
    if (getEntryTypeDraftFieldPreview(fieldsText).length === 0) {
      setEntryTypeFieldErrors((currentErrors) => ({
        ...currentErrors,
        [sectionId]: 'Add at least one field.',
      }));
      return;
    }
    onAddEntryTypeFields(sectionId, fieldsText);
    setEntryTypeFieldDrafts((currentDrafts) => ({
      ...currentDrafts,
      [sectionId]: '',
    }));
    setEntryTypeFieldErrors((currentErrors) => ({
      ...currentErrors,
      [sectionId]: '',
    }));
  };

  const requestDeleteEntryType = (sectionId: string, title: string) => {
    if (
      !confirmDiscardUnsavedChanges(
        isEntryTypeDraftDirty || hasPendingFieldDrafts || hasPendingLabelDrafts
      )
    ) {
      return;
    }
    setPendingDestructiveAction({
      actionId: 'delete-entry-type',
      title: formatDestructiveActionTitle('delete-entry-type', title),
      onConfirm: () => onDeleteEntryType(sectionId),
    });
  };

  const requestRemoveEntryTypeField = (
    sectionId: string,
    fieldKey: string,
    fieldLabel: string
  ) => {
    if (
      !confirmDiscardUnsavedChanges(
        isEntryTypeDraftDirty || hasPendingFieldDrafts || hasPendingLabelDrafts
      )
    ) {
      return;
    }
    setPendingDestructiveAction({
      actionId: 'remove-entry-type-field',
      title: formatDestructiveActionTitle(
        'remove-entry-type-field',
        fieldLabel
      ),
      onConfirm: () => onRemoveEntryTypeField(sectionId, fieldKey),
    });
  };
  const requestClearHiddenEntryDetails = () => {
    setPendingDestructiveAction({
      actionId: 'clear-hidden-entry-details',
      title: formatDestructiveActionTitle('clear-hidden-entry-details'),
      onConfirm: onClearHiddenEntryDetails,
    });
  };
  const cancelPendingDestructiveAction = () => {
    setPendingDestructiveAction(null);
  };
  const confirmPendingDestructiveAction = () => {
    pendingDestructiveAction?.onConfirm();
    setPendingDestructiveAction(null);
  };

  return (
    <main className="vwb-main" id="main-content" tabIndex={-1}>
      <section className="vwb-panel vwb-section-intro">
        <p className="vwb-kicker">{intro.kicker}</p>
        <h1>{intro.title}</h1>
        <p>{intro.detail}</p>
      </section>

      <section className="vwb-panel" aria-labelledby="knowledge-summary-title">
        <div className="vwb-section-heading">
          <div>
            <p className="vwb-kicker">{schemaModel.title}</p>
            <h2 id="knowledge-summary-title">{schemaModel.entryTypesTitle}</h2>
          </div>
        </div>
        <div className="vwb-diagnostics-grid">
          <article className="vwb-diagnostic-card">
            <span className="vwb-entry-kind">Entry types</span>
            <strong>{schemaModel.totals.entryTypeCount}</strong>
            <p>{schemaModel.totals.customTypeCount} custom types.</p>
          </article>
          <article className="vwb-diagnostic-card">
            <span className="vwb-entry-kind">Fields</span>
            <strong>{schemaModel.totals.fieldCount}</strong>
            <p>Text, category, and relationship-backed fields.</p>
          </article>
          <article className="vwb-diagnostic-card">
            <span className="vwb-entry-kind">Linked fields</span>
            <strong>{schemaModel.totals.relationshipFieldCount}</strong>
            <p>Fields backed by saved relationships.</p>
          </article>
          <article className="vwb-diagnostic-card">
            <span className="vwb-entry-kind">Hidden details</span>
            <strong>{schemaModel.totals.hiddenDetailCount}</strong>
            <p>Retained values from removed or hidden fields.</p>
            {schemaModel.totals.hiddenDetailCount > 0 ? (
              <NavLink
                className="vwb-secondary-button"
                to={`/knowledge#${knowledgeRouteFocusTargetIds.hiddenDetails}`}
              >
                Review Cleanup
              </NavLink>
            ) : null}
          </article>
        </div>
      </section>

      <section className="vwb-panel" aria-labelledby="knowledge-setup-title">
        <div className="vwb-section-heading">
          <div>
            <p className="vwb-kicker">Schema setup</p>
            <h2 id="knowledge-setup-title">{schemaModel.typeSetup.title}</h2>
          </div>
        </div>
        <p>{schemaModel.typeSetup.detail}</p>
        <NavLink
          className="vwb-secondary-button"
          to={schemaModel.typeSetup.route}
        >
          {schemaModel.typeSetup.actionLabel}
        </NavLink>
      </section>

      <section
        className="vwb-panel"
        id={knowledgeRouteFocusTargetIds.customEntryTypes}
        aria-labelledby="knowledge-custom-title"
        tabIndex={-1}
      >
        <div className="vwb-section-heading">
          <div>
            <p className="vwb-kicker">
              {schemaModel.typeSetup.customTypeCount} custom types
            </p>
            <h2 id="knowledge-custom-title">
              {workspaceFeatureCopy.sections.customEntryTypes}
            </h2>
          </div>
        </div>
        <div className="vwb-management-grid">
          <div className="vwb-entry-list">
            {customTypes.length > 0 ? (
              customTypes.map((section) => (
                <article className="vwb-entry-card" key={section.id}>
                  <div className="vwb-entry-card-header">
                    <div>
                      <p className="vwb-entry-kind">{section.kindLabel}</p>
                      <h3>{section.title}</h3>
                    </div>
                    <span className="vwb-status-pill">
                      {section.entryCountLabel}
                    </span>
                  </div>
                  <p>{section.description}</p>
                  <small>
                    {section.fieldCount} custom{' '}
                    {section.fieldCount === 1 ? 'field' : 'fields'}.
                  </small>
                  {section.fields.length > 0 ? (
                    <div
                      className="vwb-field-order-list"
                      aria-label={`${section.title} field order`}
                    >
                      <strong>Field order</strong>
                      {section.fields.map((field, fieldIndex) => (
                        <div className="vwb-field-order-row" key={field.key}>
                          <label>
                            Rename {field.label}
                            <input
                              value={
                                fieldLabelDrafts[
                                  getFieldLabelDraftKey(section.id, field.key)
                                ] ?? field.label
                              }
                              onChange={(event) =>
                                updateFieldLabelDraft(
                                  section.id,
                                  field.key,
                                  event.target.value
                                )
                              }
                            />
                            <small className="vwb-field-help">
                              {field.modeLabel}; values stay saved under{' '}
                              {field.key}.
                            </small>
                          </label>
                          <div className="vwb-form-actions">
                            <button
                              className="vwb-secondary-button"
                              type="button"
                              disabled={
                                !(
                                  fieldLabelDrafts[
                                    getFieldLabelDraftKey(section.id, field.key)
                                  ] ?? field.label
                                ).trim() ||
                                (
                                  fieldLabelDrafts[
                                    getFieldLabelDraftKey(section.id, field.key)
                                  ] ?? field.label
                                ).trim() === field.label
                              }
                              onClick={() =>
                                submitFieldLabel(
                                  section.id,
                                  field.key,
                                  field.label
                                )
                              }
                            >
                              {workspaceFeatureActions.saveFieldLabel}
                            </button>
                            <button
                              className="vwb-secondary-button"
                              type="button"
                              aria-label={`Move ${field.label} up`}
                              disabled={fieldIndex === 0}
                              onClick={() =>
                                onMoveEntryTypeField(
                                  section.id,
                                  field.key,
                                  'up'
                                )
                              }
                            >
                              {workspaceFeatureActions.moveFieldUp}
                            </button>
                            <button
                              className="vwb-secondary-button"
                              type="button"
                              aria-label={`Move ${field.label} down`}
                              disabled={
                                fieldIndex === section.fields.length - 1
                              }
                              onClick={() =>
                                onMoveEntryTypeField(
                                  section.id,
                                  field.key,
                                  'down'
                                )
                              }
                            >
                              {workspaceFeatureActions.moveFieldDown}
                            </button>
                            <button
                              className="vwb-secondary-button vwb-danger-button"
                              type="button"
                              aria-label={`Remove ${field.label}`}
                              onClick={() =>
                                requestRemoveEntryTypeField(
                                  section.id,
                                  field.key,
                                  field.label
                                )
                              }
                            >
                              {workspaceFeatureActions.removeField}
                            </button>
                          </div>
                          {fieldLabelErrors[
                            getFieldLabelDraftKey(section.id, field.key)
                          ] ? (
                            <p className="vwb-form-error">
                              {
                                fieldLabelErrors[
                                  getFieldLabelDraftKey(section.id, field.key)
                                ]
                              }
                            </p>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  ) : null}
                  <form
                    className="vwb-form vwb-field-group"
                    onSubmit={(event) =>
                      submitEntryTypeFields(event, section.id)
                    }
                  >
                    <label>
                      Add fields
                      <input
                        value={entryTypeFieldDrafts[section.id] ?? ''}
                        onChange={(event) =>
                          updateEntryTypeFieldDraft(
                            section.id,
                            event.target.value
                          )
                        }
                        placeholder={customFieldDraftDescriptor?.placeholder}
                      />
                      {customFieldDraftDescriptor?.helperText ? (
                        <small className="vwb-field-help">
                          {customFieldDraftDescriptor.helperText}
                        </small>
                      ) : null}
                    </label>
                    {(entryTypeFieldDraftPreviews[section.id] ?? []).length >
                    0 ? (
                      <div
                        className="vwb-tag-row"
                        aria-label={`${section.title} new field preview`}
                      >
                        {(entryTypeFieldDraftPreviews[section.id] ?? []).map(
                          (field) => (
                            <span className="vwb-tag" key={field.key}>
                              {field.label}: {field.modeLabel}
                            </span>
                          )
                        )}
                      </div>
                    ) : null}
                    {entryTypeFieldErrors[section.id] ? (
                      <p className="vwb-form-error">
                        {entryTypeFieldErrors[section.id]}
                      </p>
                    ) : null}
                    <div className="vwb-form-actions">
                      <button
                        className="vwb-secondary-button"
                        type="submit"
                        disabled={
                          (entryTypeFieldDraftPreviews[section.id] ?? [])
                            .length === 0
                        }
                      >
                        {workspaceFeatureActions.addFields}
                      </button>
                    </div>
                  </form>
                  <div className="vwb-form-actions">
                    <NavLink
                      className="vwb-secondary-button"
                      to={section.route}
                    >
                      Open {section.title}
                    </NavLink>
                    <button
                      className="vwb-secondary-button vwb-danger-button"
                      type="button"
                      aria-label={formatWorkspaceFeatureAccessibilityLabel(
                        'delete-custom-entry-type',
                        section.title
                      )}
                      onClick={() =>
                        requestDeleteEntryType(section.id, section.title)
                      }
                    >
                      {workspaceFeatureActions.deleteType}
                    </button>
                  </div>
                </article>
              ))
            ) : (
              <div className="vwb-empty-results" role="status">
                <strong>
                  No custom entry types yet. Create one when built-in sections
                  are not enough.
                </strong>
              </div>
            )}
          </div>
          <form className="vwb-form" onSubmit={submitEntryType}>
            <div className="vwb-section-heading">
              <div>
                <p className="vwb-kicker">
                  {workspaceFeatureCopy.forms.newCustomSection}
                </p>
                <h3>{workspaceFeatureCopy.forms.createEntryType}</h3>
              </div>
              {isEntryTypeDraftDirty ? (
                <span className="vwb-status-pill">
                  {workspaceFeatureCopy.status.unsaved}
                </span>
              ) : null}
            </div>
            <div className="vwb-form-grid">
              {entryTypeDraftFields.slice(0, 2).map((field) => (
                <label key={field.key}>
                  {field.label}
                  <input
                    value={entryTypeDraft[field.key]}
                    onChange={(event) =>
                      updateEntryTypeDraft(field.key, event.target.value)
                    }
                    placeholder={field.placeholder}
                  />
                  {field.helperText ? (
                    <small className="vwb-field-help">{field.helperText}</small>
                  ) : null}
                </label>
              ))}
            </div>
            {entryTypeDraftFields.slice(2).map((field) => (
              <label key={field.key}>
                {field.label}
                {field.multiline ? (
                  <textarea
                    rows={3}
                    value={entryTypeDraft[field.key]}
                    onChange={(event) =>
                      updateEntryTypeDraft(field.key, event.target.value)
                    }
                    placeholder={field.placeholder}
                  />
                ) : (
                  <input
                    value={entryTypeDraft[field.key]}
                    onChange={(event) =>
                      updateEntryTypeDraft(field.key, event.target.value)
                    }
                    placeholder={field.placeholder}
                  />
                )}
                {field.helperText ? (
                  <small className="vwb-field-help">{field.helperText}</small>
                ) : null}
              </label>
            ))}
            {entryTypeFieldPreview.length > 0 ? (
              <div
                className="vwb-empty-results"
                aria-label="Custom field preview"
              >
                <strong>Field preview</strong>
                <div className="vwb-tag-row">
                  {entryTypeFieldPreview.map((field) => (
                    <span className="vwb-tag" key={field.key}>
                      {field.label}: {field.modeLabel}
                    </span>
                  ))}
                </div>
                {entryTypeFieldPreview.map((field) => (
                  <small key={`${field.key}-detail`}>
                    {field.label}: {field.detail}
                  </small>
                ))}
              </div>
            ) : null}
            {entryTypeError ? (
              <p className="vwb-form-error">{entryTypeError}</p>
            ) : null}
            <div className="vwb-form-actions">
              <button className="vwb-primary-button" type="submit">
                {workspaceFeatureActions.createEntryType}
              </button>
            </div>
          </form>
        </div>
      </section>

      <section
        className="vwb-panel"
        aria-labelledby="knowledge-vocabulary-title"
      >
        <div className="vwb-section-heading">
          <div>
            <p className="vwb-kicker">Value taxonomy</p>
            <h2 id="knowledge-vocabulary-title">
              {schemaModel.vocabulary.title}
            </h2>
          </div>
        </div>
        <p>{schemaModel.vocabulary.detail}</p>
        <div className="vwb-relationship-list">
          {schemaModel.vocabulary.rows.map((row) => {
            const isExpanded = Boolean(expandedVocabularyValueRows[row.id]);
            const visibleValues = isExpanded
              ? row.values
              : row.values.slice(0, 12);
            const hiddenValueCount = row.values.length - visibleValues.length;

            return (
              <article className="vwb-relationship-row" key={row.id}>
                <div>
                  <span className="vwb-entry-kind">
                    {row.sectionTitle} - {row.modeLabel}
                  </span>
                  <strong>{row.fieldLabel}</strong>
                  <p>{row.sourceLabel}</p>
                  <p>{row.summary}</p>
                </div>
                <div
                  className="vwb-tag-row"
                  aria-label={`${row.fieldLabel} values`}
                >
                  {visibleValues.map((value) => (
                    <span className="vwb-tag" key={value}>
                      {value}
                    </span>
                  ))}
                  {hiddenValueCount > 0 ? (
                    <span className="vwb-tag">
                      {hiddenValueCount} more value
                      {hiddenValueCount === 1 ? '' : 's'}.
                    </span>
                  ) : null}
                </div>
                <div className="vwb-action-row">
                  <NavLink className="vwb-secondary-button" to={row.route}>
                    Open {row.sectionTitle}
                  </NavLink>
                  {row.values.length > 12 ? (
                    <button
                      className="vwb-secondary-button"
                      type="button"
                      aria-expanded={isExpanded}
                      onClick={() =>
                        setExpandedVocabularyValueRows((currentRows) => ({
                          ...currentRows,
                          [row.id]: !currentRows[row.id],
                        }))
                      }
                    >
                      {isExpanded
                        ? `Show Fewer ${row.fieldLabel} Values`
                        : `Show All ${row.fieldLabel} Values`}
                    </button>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section
        className="vwb-panel"
        id={knowledgeRouteFocusTargetIds.hiddenDetails}
        aria-labelledby="knowledge-hidden-title"
        tabIndex={-1}
      >
        <div className="vwb-section-heading">
          <div>
            <p className="vwb-kicker">Schema cleanup</p>
            <h2 id="knowledge-hidden-title">
              {schemaModel.hiddenDetails.title}
            </h2>
          </div>
          {schemaModel.hiddenDetails.rows.length > 0 ? (
            <button
              className="vwb-secondary-button"
              type="button"
              onClick={requestClearHiddenEntryDetails}
            >
              Clear Hidden Details
            </button>
          ) : null}
        </div>
        <p>{schemaModel.hiddenDetails.detail}</p>
        {schemaModel.hiddenDetails.rows.length > 0 ? (
          <div className="vwb-relationship-list">
            {schemaModel.hiddenDetails.rows.map((row) => (
              <article className="vwb-relationship-row" key={row.id}>
                <div>
                  <span className="vwb-entry-kind">
                    {row.sectionTitle} - {row.fieldLabel}
                  </span>
                  <strong>{row.entryName}</strong>
                  <p>{row.value}</p>
                </div>
                <NavLink className="vwb-secondary-button" to={row.route}>
                  Review Entry
                </NavLink>
              </article>
            ))}
          </div>
        ) : (
          <p className="vwb-muted-note">No hidden detail cleanup targets.</p>
        )}
      </section>

      <section className="vwb-panel" aria-labelledby="knowledge-types-title">
        <div className="vwb-section-heading">
          <div>
            <p className="vwb-kicker">Current structure</p>
            <h2 id="knowledge-types-title">{schemaModel.entryTypesTitle}</h2>
          </div>
        </div>
        <div className="vwb-relationship-list">
          {schemaModel.sections.map((section) => (
            <article className="vwb-relationship-row" key={section.id}>
              <div>
                <span className="vwb-entry-kind">
                  {section.kindLabel} - {section.entryCountLabel}
                </span>
                <strong>{section.title}</strong>
                <p>{section.description}</p>
              </div>
              <div
                className="vwb-tag-row"
                aria-label={`${section.title} fields`}
              >
                {section.fields.map((field) => (
                  <span className="vwb-tag" key={field.key}>
                    {field.label}: {field.backingLabel}
                  </span>
                ))}
              </div>
              {section.fields.some(
                (field) => field.targetSectionTitles.length > 0
              ) ? (
                <dl className="vwb-detail-list">
                  {section.fields
                    .filter((field) => field.targetSectionTitles.length > 0)
                    .map((field) => (
                      <div key={`${field.key}-targets`}>
                        <dt>{field.label}</dt>
                        <dd>
                          {field.relationshipType} to{' '}
                          {field.targetSectionTitles.join(', ')}
                        </dd>
                      </div>
                    ))}
                </dl>
              ) : null}
              {section.relationshipFieldCount > 0 ? (
                <small>
                  {section.relationshipFieldCount} relationship-backed{' '}
                  {section.relationshipFieldCount === 1 ? 'field' : 'fields'}.
                </small>
              ) : (
                <small>{schemaModel.relationshipFieldsTitle}: none.</small>
              )}
              <NavLink className="vwb-secondary-button" to={section.route}>
                Open {section.title}
              </NavLink>
            </article>
          ))}
        </div>
      </section>

      <section className="vwb-panel" aria-labelledby="knowledge-reusable-title">
        <div className="vwb-section-heading">
          <div>
            <p className="vwb-kicker">Reusable taxonomy</p>
            <h2 id="knowledge-reusable-title">
              {schemaModel.reusableKnowledge.title}
            </h2>
          </div>
        </div>
        <p>{schemaModel.reusableKnowledge.detail}</p>
        <div className="vwb-form-actions">
          {schemaModel.reusableKnowledge.destinations.map((destination) => (
            <NavLink
              className="vwb-secondary-button"
              key={destination.id}
              to={destination.route}
            >
              Open {destination.title}
            </NavLink>
          ))}
        </div>
        {schemaModel.reusableKnowledge.loreDefinitions.length > 0 ? (
          <div className="vwb-relationship-list">
            <div>
              <h3>{schemaModel.reusableKnowledge.loreDefinitionsTitle}</h3>
              <p>{schemaModel.reusableKnowledge.loreDefinitionsDetail}</p>
            </div>
            {schemaModel.reusableKnowledge.loreDefinitions.map((definition) => (
              <article className="vwb-relationship-row" key={definition.id}>
                <div>
                  <span className="vwb-entry-kind">
                    {definition.countLabel}
                  </span>
                  <strong>{definition.label}</strong>
                </div>
                <NavLink className="vwb-secondary-button" to={definition.route}>
                  Open Lore
                </NavLink>
              </article>
            ))}
          </div>
        ) : null}
      </section>

      {pendingDestructiveAction ? (
        <KnowledgeDestructiveActionDialog
          pendingAction={pendingDestructiveAction}
          onCancel={cancelPendingDestructiveAction}
          onConfirm={confirmPendingDestructiveAction}
        />
      ) : null}
    </main>
  );
}
