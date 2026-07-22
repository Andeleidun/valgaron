import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  emptyEntryTypeDraft,
  destructiveActionDialogCopy,
  emptyVocabularyValueDraft,
  entryTypeDraftFields,
  fieldOverrideDraftFrom,
  filterKnowledgeFieldConfigurationSections,
  filterKnowledgeHiddenDetailRows,
  filterKnowledgeVocabularyValueRows,
  formatDestructiveActionTitle,
  formatDraftValidationErrors,
  formatKnowledgeVocabularyHiddenValueCount,
  getCodexScreenIntro,
  getDestructiveActionCopy,
  getEntryTypeDraftFieldLayout,
  getEntryTypeDraftFieldPreview,
  getKnowledgeRouteFocusTargetId,
  getKnowledgeSchemaModel,
  getLimitedResultModel,
  knowledgeDisplayLimits,
  knowledgeRouteFocusTargetIds,
  validateEntryTypeDraft,
  vocabularyValueDraftFrom,
  workspaceFeatureActions,
  workspaceFeatureCopy,
  type CustomEntryTypeFieldMoveDirection,
  type DestructiveActionId,
  type EntryTypeDraft,
  type FieldOverrideDraft,
  type KnowledgeFieldRow,
  type KnowledgeVocabularyValueRow,
  type VocabularyValueDraft,
  type VocabularyValueMoveDirection,
  type WorldWorkspace,
} from '@valgaron/core';
import { DashboardPage } from '../Components/Dashboard/DashboardPage';
import {
  confirmDiscardUnsavedChanges,
  hasUnsavedChanges,
  useUnsavedChangesWarning,
} from '../Utlilities/unsavedChanges';
import { useDialogFocus } from '../Utlilities/dialogFocus';
import { useDocumentDraftRegistration } from '../Utlilities/documentDraftState';

type PendingKnowledgeDestructiveAction = {
  actionId: Extract<
    DestructiveActionId,
    | 'clear-hidden-entry-details'
    | 'clear-hidden-entry-detail'
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

const entryTypeDraftFieldLayout = getEntryTypeDraftFieldLayout();

function KnowledgeDestructiveActionDialog({
  actionDialogKickerLabel,
  pendingAction,
  onCancel,
  onConfirm,
}: {
  actionDialogKickerLabel: string;
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
        <p className="vwb-kicker">{actionDialogKickerLabel}</p>
        <h2 id={titleId}>{pendingAction.title}</h2>
        <p id={descriptionId}>{copy.message}</p>
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

export function KnowledgePage({
  activeWorld,
  onAddEntryTypeFields,
  onClearHiddenEntryDetail,
  onClearHiddenEntryDetails,
  onCreateEntryType,
  onDeleteEntryType,
  onMoveEntryTypeField,
  onMoveVocabularyValue,
  onRenameEntryTypeField,
  onRemoveEntryTypeField,
  onAddVocabularyValue,
  onArchiveVocabularyValue,
  onUpdateFieldOverride,
  onUpdateVocabularyValue,
}: {
  activeWorld: WorldWorkspace;
  onAddEntryTypeFields: (sectionId: string, fieldsText: string) => void;
  onClearHiddenEntryDetail: (
    sectionId: string,
    entryId: string,
    fieldKey: string
  ) => void;
  onClearHiddenEntryDetails: () => void;
  onCreateEntryType: (draft: EntryTypeDraft) => void;
  onDeleteEntryType: (sectionId: string) => void;
  onMoveEntryTypeField: (
    sectionId: string,
    fieldKey: string,
    direction: CustomEntryTypeFieldMoveDirection
  ) => void;
  onMoveVocabularyValue: (
    vocabularyId: string,
    valueId: string,
    direction: VocabularyValueMoveDirection
  ) => void;
  onRenameEntryTypeField: (
    sectionId: string,
    fieldKey: string,
    label: string
  ) => void;
  onRemoveEntryTypeField: (sectionId: string, fieldKey: string) => void;
  onAddVocabularyValue: (
    vocabularyId: string,
    draft: VocabularyValueDraft
  ) => void;
  onArchiveVocabularyValue: (
    vocabularyId: string,
    valueId: string,
    archived: boolean
  ) => void;
  onUpdateFieldOverride: (
    sectionId: string,
    fieldKey: string,
    draft: FieldOverrideDraft
  ) => void;
  onUpdateVocabularyValue: (
    vocabularyId: string,
    valueId: string,
    draft: VocabularyValueDraft
  ) => void;
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
  const [fieldOverrideDrafts, setFieldOverrideDrafts] = useState<
    Record<string, FieldOverrideDraft>
  >({});
  const [fieldOverrideErrors, setFieldOverrideErrors] = useState<
    Record<string, string>
  >({});
  const [fieldConfigurationQuery, setFieldConfigurationQuery] = useState('');
  const [hiddenDetailQuery, setHiddenDetailQuery] = useState('');
  const [pendingDestructiveAction, setPendingDestructiveAction] =
    useState<PendingKnowledgeDestructiveAction | null>(null);
  const [expandedVocabularyValueRows, setExpandedVocabularyValueRows] =
    useState<Record<string, boolean>>({});
  const [vocabularyValueDrafts, setVocabularyValueDrafts] = useState<
    Record<string, VocabularyValueDraft>
  >({});
  const [vocabularyValueEditDrafts, setVocabularyValueEditDrafts] = useState<
    Record<string, VocabularyValueDraft>
  >({});
  const [vocabularyValueErrors, setVocabularyValueErrors] = useState<
    Record<string, string>
  >({});
  const [vocabularyValueQueries, setVocabularyValueQueries] = useState<
    Record<string, string>
  >({});
  const customTypes = schemaModel.sections.filter((section) => section.custom);
  const fieldConfigurationSections = filterKnowledgeFieldConfigurationSections(
    schemaModel.sections,
    fieldConfigurationQuery
  );
  const hiddenDetailRows = filterKnowledgeHiddenDetailRows(
    schemaModel.hiddenDetails.rows,
    hiddenDetailQuery
  );
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
  const getFieldOverrideDraftKey = (sectionId: string, fieldKey: string) =>
    `${sectionId}:${fieldKey}`;
  const hasPendingLabelDrafts = customTypes.some((section) =>
    section.fields.some((field) => {
      const draftKey = getFieldLabelDraftKey(section.id, field.key);
      const draftLabel = fieldLabelDrafts[draftKey];
      return draftLabel !== undefined && draftLabel.trim() !== field.label;
    })
  );
  const hasPendingFieldOverrideDrafts = schemaModel.sections.some((section) =>
    section.fields.some((field) => {
      const draftKey = getFieldOverrideDraftKey(section.id, field.key);
      const draft = fieldOverrideDrafts[draftKey];
      if (!draft) {
        return false;
      }
      const savedDraft = fieldOverrideDraftFrom({
        field: { label: field.baseLabel },
        override: activeWorld.schema.fieldOverrides[section.id]?.[field.key],
      });
      return hasUnsavedChanges(savedDraft, draft);
    })
  );
  const hasPendingVocabularyDrafts = Object.values(vocabularyValueDrafts).some(
    (draft) =>
      [draft.label, draft.description, draft.aliases].some(
        (value) => value.trim().length > 0
      )
  );
  const hasPendingVocabularyEditDrafts = Object.entries(
    vocabularyValueEditDrafts
  ).some(([draftKey, draft]) => {
    const [vocabularyId, valueId] = draftKey.split(':');
    const value = schemaModel.vocabulary.rows
      .find((row) => row.id === vocabularyId)
      ?.values.find((candidate) => candidate.id === valueId);
    if (!value) {
      return false;
    }
    const savedDraft = vocabularyValueDraftFrom(value);
    return (
      draft.label !== savedDraft.label ||
      draft.description !== savedDraft.description ||
      draft.aliases !== savedDraft.aliases
    );
  });
  const hasDirtyDraft =
    isEntryTypeDraftDirty ||
    hasPendingFieldDrafts ||
    hasPendingLabelDrafts ||
    hasPendingFieldOverrideDrafts ||
    hasPendingVocabularyDrafts ||
    hasPendingVocabularyEditDrafts;

  useUnsavedChangesWarning(hasDirtyDraft);
  useDocumentDraftRegistration({
    isDirty: hasDirtyDraft,
    onDiscard: () => {
      setEntryTypeDraft(emptyEntryTypeDraft());
      setEntryTypeError('');
      setEntryTypeFieldDrafts({});
      setEntryTypeFieldErrors({});
      setFieldLabelDrafts({});
      setFieldLabelErrors({});
      setFieldOverrideDrafts({});
      setFieldOverrideErrors({});
      setVocabularyValueDrafts({});
      setVocabularyValueEditDrafts({});
      setVocabularyValueErrors({});
      setPendingDestructiveAction(null);
    },
  });

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

  const getSavedFieldOverrideDraft = (
    sectionId: string,
    field: KnowledgeFieldRow
  ) =>
    fieldOverrideDraftFrom({
      field: { label: field.baseLabel },
      override: activeWorld.schema.fieldOverrides[sectionId]?.[field.key],
    });

  const getDefaultFieldOverrideDraft = (field: KnowledgeFieldRow) =>
    fieldOverrideDraftFrom({
      field: { label: field.baseLabel },
      override: undefined,
    });

  const getFieldOverrideDraft = (
    sectionId: string,
    field: KnowledgeFieldRow
  ) => {
    const draftKey = getFieldOverrideDraftKey(sectionId, field.key);
    return (
      fieldOverrideDrafts[draftKey] ??
      getSavedFieldOverrideDraft(sectionId, field)
    );
  };

  const updateFieldOverrideDraft = (
    sectionId: string,
    field: KnowledgeFieldRow,
    patch: Partial<FieldOverrideDraft>
  ) => {
    const draftKey = getFieldOverrideDraftKey(sectionId, field.key);
    setFieldOverrideDrafts((currentDrafts) => ({
      ...currentDrafts,
      [draftKey]: {
        ...getFieldOverrideDraft(sectionId, field),
        ...patch,
      },
    }));
    setFieldOverrideErrors((currentErrors) => ({
      ...currentErrors,
      [draftKey]: '',
    }));
  };

  const getFieldOverrideError = (draft: FieldOverrideDraft) => {
    if (!draft.label.trim()) {
      return schemaModel.fieldConfiguration.fieldLabelRequiredError;
    }
    const order = draft.order.trim();
    if (order && !/^[1-9]\d*$/.test(order)) {
      return schemaModel.fieldConfiguration.displayOrderInvalidError;
    }
    return '';
  };

  const submitFieldOverride = (sectionId: string, field: KnowledgeFieldRow) => {
    const draftKey = getFieldOverrideDraftKey(sectionId, field.key);
    const draft = getFieldOverrideDraft(sectionId, field);
    const error = getFieldOverrideError(draft);
    if (error) {
      setFieldOverrideErrors((currentErrors) => ({
        ...currentErrors,
        [draftKey]: error,
      }));
      return;
    }
    onUpdateFieldOverride(sectionId, field.key, draft);
    setFieldOverrideDrafts((currentDrafts) => ({
      ...currentDrafts,
      [draftKey]: {
        ...draft,
        label: draft.label.trim(),
        helpText: draft.helpText.trim(),
        order: draft.order.trim(),
        vocabularyId: draft.vocabularyId.trim(),
      },
    }));
  };

  const resetFieldOverride = (sectionId: string, field: KnowledgeFieldRow) => {
    const draftKey = getFieldOverrideDraftKey(sectionId, field.key);
    const defaultDraft = getDefaultFieldOverrideDraft(field);
    const hasSavedOverride =
      activeWorld.schema.fieldOverrides[sectionId]?.[field.key] !== undefined;
    if (hasSavedOverride) {
      onUpdateFieldOverride(sectionId, field.key, defaultDraft);
    }
    setFieldOverrideDrafts((currentDrafts) => ({
      ...currentDrafts,
      [draftKey]: defaultDraft,
    }));
    setFieldOverrideErrors((currentErrors) => ({
      ...currentErrors,
      [draftKey]: '',
    }));
  };

  const getVocabularyValueDraftKey = (vocabularyId: string, valueId: string) =>
    `${vocabularyId}:${valueId}`;

  const updateVocabularyValueDraft = (
    vocabularyId: string,
    key: keyof VocabularyValueDraft,
    value: string
  ) => {
    setVocabularyValueDrafts((currentDrafts) => ({
      ...currentDrafts,
      [vocabularyId]: {
        ...(currentDrafts[vocabularyId] ?? emptyVocabularyValueDraft()),
        [key]: value,
      },
    }));
    setVocabularyValueErrors((currentErrors) => ({
      ...currentErrors,
      [vocabularyId]: '',
    }));
  };

  const updateVocabularyValueEditDraft = (
    vocabularyId: string,
    valueId: string,
    key: keyof VocabularyValueDraft,
    value: string
  ) => {
    const draftKey = getVocabularyValueDraftKey(vocabularyId, valueId);
    const savedValue = schemaModel.vocabulary.rows
      .find((row) => row.id === vocabularyId)
      ?.values.find((candidate) => candidate.id === valueId);
    setVocabularyValueEditDrafts((currentDrafts) => ({
      ...currentDrafts,
      [draftKey]: {
        ...(currentDrafts[draftKey] ??
          vocabularyValueDraftFrom(savedValue as KnowledgeVocabularyValueRow)),
        [key]: value,
      },
    }));
    setVocabularyValueErrors((currentErrors) => ({
      ...currentErrors,
      [draftKey]: '',
    }));
  };

  const updateVocabularyValueQuery = (vocabularyId: string, value: string) => {
    setVocabularyValueQueries((currentQueries) => ({
      ...currentQueries,
      [vocabularyId]: value,
    }));
  };

  const getVocabularyDraftError = (
    vocabularyId: string,
    draft: VocabularyValueDraft,
    ignoredValueId?: string
  ) => {
    const label = draft.label.trim();
    if (!label) {
      return 'Value label is required.';
    }
    const vocabulary = schemaModel.vocabulary.rows.find(
      (row) => row.id === vocabularyId
    );
    const duplicateValue = vocabulary?.values.find(
      (value) =>
        value.id !== ignoredValueId &&
        value.label.trim().toLocaleLowerCase() === label.toLocaleLowerCase()
    );
    return duplicateValue
      ? 'An active value with this label already exists.'
      : '';
  };

  const submitVocabularyValue = (
    event: FormEvent<HTMLFormElement>,
    vocabularyId: string
  ) => {
    event.preventDefault();
    const draft =
      vocabularyValueDrafts[vocabularyId] ?? emptyVocabularyValueDraft();
    const error = getVocabularyDraftError(vocabularyId, draft);
    if (error) {
      setVocabularyValueErrors((currentErrors) => ({
        ...currentErrors,
        [vocabularyId]: error,
      }));
      return;
    }
    onAddVocabularyValue(vocabularyId, draft);
    setVocabularyValueDrafts((currentDrafts) => ({
      ...currentDrafts,
      [vocabularyId]: emptyVocabularyValueDraft(),
    }));
  };

  const submitVocabularyValueEdit = (
    vocabularyId: string,
    value: KnowledgeVocabularyValueRow
  ) => {
    const draftKey = getVocabularyValueDraftKey(vocabularyId, value.id);
    const draft =
      vocabularyValueEditDrafts[draftKey] ?? vocabularyValueDraftFrom(value);
    const error = getVocabularyDraftError(vocabularyId, draft, value.id);
    if (error) {
      setVocabularyValueErrors((currentErrors) => ({
        ...currentErrors,
        [draftKey]: error,
      }));
      return;
    }
    onUpdateVocabularyValue(vocabularyId, value.id, draft);
    setVocabularyValueEditDrafts((currentDrafts) => ({
      ...currentDrafts,
      [draftKey]: {
        label: draft.label.trim(),
        description: draft.description.trim(),
        aliases: draft.aliases.trim(),
      },
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
        [draftKey]: schemaModel.fieldConfiguration.fieldLabelRequiredError,
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
        [sectionId]: schemaModel.typeSetup.addFieldsRequiredError,
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
        isEntryTypeDraftDirty ||
          hasPendingFieldDrafts ||
          hasPendingLabelDrafts ||
          hasPendingFieldOverrideDrafts
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
        isEntryTypeDraftDirty ||
          hasPendingFieldDrafts ||
          hasPendingLabelDrafts ||
          hasPendingFieldOverrideDrafts
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
  const requestClearHiddenEntryDetail = (
    row: (typeof hiddenDetailRows)[number]
  ) => {
    setPendingDestructiveAction({
      actionId: 'clear-hidden-entry-detail',
      title: formatDestructiveActionTitle(
        'clear-hidden-entry-detail',
        `${row.fieldLabel} from ${row.entryName}`
      ),
      onConfirm: () =>
        onClearHiddenEntryDetail(row.sectionId, row.entryId, row.fieldKey),
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

      <DashboardPage
        ariaLabel="Knowledge dashboard cards"
        pageId="knowledge"
        summary="Arrange schema navigation, configuration, vocabulary, and audit tools."
      >
        <section
          className="vwb-panel"
          aria-labelledby="knowledge-summary-title"
          data-dashboard-card-id="knowledge.schema-health"
        >
          <div className="vwb-section-heading">
            <div>
              <p className="vwb-kicker">{schemaModel.title}</p>
              <h2 id="knowledge-summary-title">
                {schemaModel.entryTypesTitle}
              </h2>
            </div>
          </div>
          <div className="vwb-diagnostics-grid">
            <article className="vwb-diagnostic-card">
              <span className="vwb-entry-kind">
                {schemaModel.overview.entryTypesLabel}
              </span>
              <strong>{schemaModel.totals.entryTypeCount}</strong>
              <p>{schemaModel.overview.entryTypesDetail}</p>
            </article>
            <article className="vwb-diagnostic-card">
              <span className="vwb-entry-kind">
                {schemaModel.overview.fieldsLabel}
              </span>
              <strong>{schemaModel.totals.fieldCount}</strong>
              <p>{schemaModel.overview.fieldsDetail}</p>
            </article>
            <article className="vwb-diagnostic-card">
              <span className="vwb-entry-kind">
                {schemaModel.overview.relationshipFieldsLabel}
              </span>
              <strong>{schemaModel.totals.relationshipFieldCount}</strong>
              <p>{schemaModel.overview.relationshipFieldsDetail}</p>
            </article>
            <article className="vwb-diagnostic-card">
              <span className="vwb-entry-kind">
                {schemaModel.overview.hiddenDetailsLabel}
              </span>
              <strong>{schemaModel.totals.hiddenDetailCount}</strong>
              <p>{schemaModel.overview.hiddenDetailsDetail}</p>
              {schemaModel.totals.hiddenDetailCount > 0 ? (
                <NavLink
                  aria-label={
                    schemaModel.hiddenDetails.reviewActionAccessibilityLabel
                  }
                  className="vwb-secondary-button"
                  to={schemaModel.hiddenDetails.reviewActionRoute}
                >
                  {schemaModel.hiddenDetails.reviewActionLabel}
                </NavLink>
              ) : null}
            </article>
          </div>
        </section>

        <section
          className="vwb-panel"
          aria-labelledby="knowledge-setup-title"
          data-dashboard-card-id="knowledge.navigator"
        >
          <div className="vwb-section-heading">
            <div>
              <p className="vwb-kicker">{schemaModel.typeSetup.kickerLabel}</p>
              <h2 id="knowledge-setup-title">{schemaModel.typeSetup.title}</h2>
            </div>
          </div>
          <p>{schemaModel.typeSetup.detail}</p>
          <NavLink
            aria-label={schemaModel.typeSetup.actionAccessibilityLabel}
            className="vwb-secondary-button"
            to={schemaModel.typeSetup.route}
          >
            {schemaModel.typeSetup.actionLabel}
          </NavLink>
        </section>

        <section
          className="vwb-panel"
          data-dashboard-card-id="knowledge.field-order"
          aria-labelledby="knowledge-field-configuration-title"
        >
          <div className="vwb-section-heading">
            <div>
              <p className="vwb-kicker">
                {schemaModel.fieldConfiguration.kickerLabel}
              </p>
              <h2 id="knowledge-field-configuration-title">
                {schemaModel.fieldConfiguration.title}
              </h2>
            </div>
          </div>
          <p>{schemaModel.fieldConfiguration.detail}</p>
          <label>
            {schemaModel.fieldConfiguration.searchLabel}
            <input
              value={fieldConfigurationQuery}
              onChange={(event) =>
                setFieldConfigurationQuery(event.target.value)
              }
              placeholder={schemaModel.fieldConfiguration.searchPlaceholder}
            />
          </label>
          <div className="vwb-relationship-list">
            {fieldConfigurationSections.map((section) => (
              <article className="vwb-relationship-row" key={section.id}>
                <div>
                  <span className="vwb-entry-kind">
                    {section.kindLabel} - {section.entryCountLabel}
                  </span>
                  <strong>{section.title}</strong>
                  <p>{section.description}</p>
                </div>
                <div className="vwb-field-order-list">
                  <strong>{section.singularTitle} fields</strong>
                  {section.fields.map((field) => {
                    const draft = getFieldOverrideDraft(section.id, field);
                    const draftKey = getFieldOverrideDraftKey(
                      section.id,
                      field.key
                    );
                    const savedDraft = getSavedFieldOverrideDraft(
                      section.id,
                      field
                    );
                    const canUseVocabulary =
                      field.mode !== 'single-link' &&
                      field.mode !== 'multi-link';
                    const isDraftChanged = hasUnsavedChanges(savedDraft, draft);
                    const hasSavedOverride =
                      activeWorld.schema.fieldOverrides[section.id]?.[
                        field.key
                      ] !== undefined;
                    const canResetOverride = hasSavedOverride || isDraftChanged;

                    return (
                      <div
                        className="vwb-field-configuration-row"
                        key={field.key}
                      >
                        <div>
                          <span className="vwb-entry-kind">
                            {field.key} - {field.modeLabel} -{' '}
                            {hasSavedOverride
                              ? schemaModel.fieldConfiguration
                                  .customSettingsStatusLabel
                              : schemaModel.fieldConfiguration
                                  .defaultSettingsStatusLabel}
                          </span>
                          <strong>
                            {field.label}
                            {field.hidden ? ' (hidden)' : ''}
                          </strong>
                          <p>{field.detail}</p>
                        </div>
                        <label>
                          {schemaModel.fieldConfiguration.fieldLabelFieldLabel}
                          <input
                            aria-label={field.settingsLabelFieldLabel}
                            value={draft.label}
                            onChange={(event) =>
                              updateFieldOverrideDraft(section.id, field, {
                                label: event.target.value,
                              })
                            }
                          />
                        </label>
                        <label>
                          {
                            schemaModel.fieldConfiguration
                              .fieldHelpTextFieldLabel
                          }
                          <input
                            aria-label={field.settingsHelpFieldLabel}
                            value={draft.helpText}
                            onChange={(event) =>
                              updateFieldOverrideDraft(section.id, field, {
                                helpText: event.target.value,
                              })
                            }
                          />
                        </label>
                        <div className="vwb-form-grid">
                          <label>
                            {
                              schemaModel.fieldConfiguration
                                .fieldOrderFieldLabel
                            }
                            <input
                              aria-label={field.settingsOrderFieldLabel}
                              inputMode="numeric"
                              value={draft.order}
                              onChange={(event) =>
                                updateFieldOverrideDraft(section.id, field, {
                                  order: event.target.value,
                                })
                              }
                              placeholder={
                                schemaModel.fieldConfiguration
                                  .defaultOrderPlaceholder
                              }
                            />
                          </label>
                          <label className="vwb-inline-toggle">
                            <input
                              aria-label={field.settingsHiddenFieldLabel}
                              checked={draft.hidden}
                              type="checkbox"
                              onChange={(event) =>
                                updateFieldOverrideDraft(section.id, field, {
                                  hidden: event.target.checked,
                                })
                              }
                            />
                            {
                              schemaModel.fieldConfiguration
                                .fieldHiddenToggleLabel
                            }
                          </label>
                        </div>
                        {canUseVocabulary ? (
                          <div className="vwb-form-grid">
                            <label>
                              {schemaModel.fieldConfiguration.vocabularyLabel}
                              <select
                                aria-label={field.settingsVocabularyFieldLabel}
                                value={draft.vocabularyId}
                                onChange={(event) =>
                                  updateFieldOverrideDraft(section.id, field, {
                                    vocabularyId: event.target.value,
                                  })
                                }
                              >
                                <option value="">
                                  {
                                    schemaModel.fieldConfiguration
                                      .noVocabularyOptionLabel
                                  }
                                </option>
                                {activeWorld.schema.vocabularies.map(
                                  (vocabulary) => (
                                    <option
                                      key={vocabulary.id}
                                      value={vocabulary.id}
                                    >
                                      {vocabulary.name}
                                    </option>
                                  )
                                )}
                              </select>
                            </label>
                            <label>
                              {
                                schemaModel.fieldConfiguration
                                  .vocabularyModeLabel
                              }
                              <select
                                aria-label={
                                  field.settingsVocabularyModeFieldLabel
                                }
                                disabled={!draft.vocabularyId}
                                value={draft.vocabularyMode}
                                onChange={(event) =>
                                  updateFieldOverrideDraft(section.id, field, {
                                    vocabularyMode: event.target
                                      .value as FieldOverrideDraft['vocabularyMode'],
                                  })
                                }
                              >
                                {schemaModel.fieldConfiguration.vocabularyModeOptions.map(
                                  (option) => (
                                    <option
                                      key={option.value}
                                      value={option.value}
                                    >
                                      {option.label}
                                    </option>
                                  )
                                )}
                              </select>
                            </label>
                          </div>
                        ) : (
                          <small className="vwb-field-help">
                            {
                              schemaModel.fieldConfiguration
                                .relationshipBackedVocabularyHelpText
                            }
                          </small>
                        )}
                        {field.vocabularyName ? (
                          <small className="vwb-field-help">
                            {
                              schemaModel.fieldConfiguration
                                .currentVocabularyLabel
                            }
                            : {field.vocabularyName} (
                            {field.vocabularyModeLabel}
                            ).
                          </small>
                        ) : null}
                        {fieldOverrideErrors[draftKey] ? (
                          <p className="vwb-form-error">
                            {fieldOverrideErrors[draftKey]}
                          </p>
                        ) : null}
                        <div className="vwb-form-actions">
                          <button
                            aria-label={field.updateSettingsAccessibilityLabel}
                            className="vwb-secondary-button"
                            disabled={!isDraftChanged}
                            type="button"
                            onClick={() =>
                              submitFieldOverride(section.id, field)
                            }
                          >
                            {field.updateSettingsLabel}
                          </button>
                          <button
                            aria-label={field.resetSettingsAccessibilityLabel}
                            className="vwb-secondary-button"
                            disabled={!canResetOverride}
                            type="button"
                            onClick={() =>
                              resetFieldOverride(section.id, field)
                            }
                          >
                            {field.resetSettingsLabel}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </article>
            ))}
            {fieldConfigurationSections.length === 0 ? (
              <p className="vwb-muted-note">
                {schemaModel.fieldConfiguration.noSearchResultsText}
              </p>
            ) : null}
          </div>
        </section>

        <section
          className="vwb-panel"
          data-dashboard-card-id="knowledge.editor"
          id={knowledgeRouteFocusTargetIds.customEntryTypes}
          aria-labelledby="knowledge-custom-title"
          tabIndex={-1}
        >
          <div className="vwb-section-heading">
            <div>
              <p className="vwb-kicker">
                {schemaModel.typeSetup.customTypeCountLabel}
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
                        aria-label={section.fieldOrderAccessibilityLabel}
                      >
                        <strong>{section.fieldOrderTitle}</strong>
                        {section.fields.map((field, fieldIndex) => (
                          <div className="vwb-field-order-row" key={field.key}>
                            <label>
                              Rename {field.label}
                              <input
                                aria-label={field.renameFieldLabel}
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
                                {field.retainedValueSummary}
                              </small>
                            </label>
                            <div className="vwb-form-actions">
                              <button
                                aria-label={
                                  field.updateFieldLabelAccessibilityLabel
                                }
                                className="vwb-secondary-button"
                                type="button"
                                disabled={
                                  !(
                                    fieldLabelDrafts[
                                      getFieldLabelDraftKey(
                                        section.id,
                                        field.key
                                      )
                                    ] ?? field.label
                                  ).trim() ||
                                  (
                                    fieldLabelDrafts[
                                      getFieldLabelDraftKey(
                                        section.id,
                                        field.key
                                      )
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
                                {workspaceFeatureActions.updateFieldLabel}
                              </button>
                              <button
                                className="vwb-secondary-button"
                                type="button"
                                aria-label={field.moveFieldUpAccessibilityLabel}
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
                                aria-label={
                                  field.moveFieldDownAccessibilityLabel
                                }
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
                                aria-label={field.removeFieldAccessibilityLabel}
                                onClick={() =>
                                  requestRemoveEntryTypeField(
                                    section.id,
                                    field.key,
                                    field.removeFieldConfirmationSubject
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
                        {schemaModel.typeSetup.addFieldsLabel}
                        <input
                          aria-label={section.addFieldsFieldLabel}
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
                          aria-label={section.addFieldsPreviewLabel}
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
                          aria-label={section.addFieldsAccessibilityLabel}
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
                        aria-label={section.openAccessibilityLabel}
                        className="vwb-secondary-button"
                        to={section.route}
                      >
                        {section.openLabel}
                      </NavLink>
                      <button
                        className="vwb-secondary-button vwb-danger-button"
                        type="button"
                        aria-label={section.deleteTypeAccessibilityLabel}
                        onClick={() =>
                          requestDeleteEntryType(
                            section.id,
                            section.deleteTypeConfirmationSubject
                          )
                        }
                      >
                        {workspaceFeatureActions.deleteType}
                      </button>
                    </div>
                  </article>
                ))
              ) : (
                <div className="vwb-empty-results" role="status">
                  <strong>{schemaModel.typeSetup.emptyCustomTypesText}</strong>
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
                    {workspaceFeatureCopy.status.unapplied}
                  </span>
                ) : null}
              </div>
              <div className="vwb-form-grid">
                {entryTypeDraftFieldLayout.leadingFields.map((field) => (
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
                      <small className="vwb-field-help">
                        {field.helperText}
                      </small>
                    ) : null}
                  </label>
                ))}
              </div>
              {entryTypeDraftFieldLayout.trailingFields.map((field) => (
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
                  aria-label={
                    schemaModel.typeSetup.customFieldPreviewAccessibilityLabel
                  }
                >
                  <strong>
                    {schemaModel.typeSetup.customFieldPreviewTitle}
                  </strong>
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
          data-dashboard-card-id="knowledge.vocabulary"
          aria-labelledby="knowledge-vocabulary-title"
        >
          <div className="vwb-section-heading">
            <div>
              <p className="vwb-kicker">{schemaModel.vocabulary.kickerLabel}</p>
              <h2 id="knowledge-vocabulary-title">
                {schemaModel.vocabulary.title}
              </h2>
            </div>
          </div>
          <p>{schemaModel.vocabulary.detail}</p>
          <div className="vwb-relationship-list">
            {schemaModel.vocabulary.rows.map((row) => {
              const isExpanded = Boolean(expandedVocabularyValueRows[row.id]);
              const valueQuery = vocabularyValueQueries[row.id] ?? '';
              const matchingValues = filterKnowledgeVocabularyValueRows(
                row.values,
                valueQuery
              );
              const valueDisplayModel = getLimitedResultModel(
                matchingValues,
                isExpanded
                  ? matchingValues.length
                  : knowledgeDisplayLimits.vocabularyValues
              );
              const visibleValues = valueDisplayModel.visibleItems;
              const hiddenValueCount = valueDisplayModel.hiddenCount;
              const valueDraft =
                vocabularyValueDrafts[row.id] ?? emptyVocabularyValueDraft();

              return (
                <article className="vwb-relationship-row" key={row.id}>
                  <div>
                    <span className="vwb-entry-kind">{row.statusSummary}</span>
                    <strong>{row.name}</strong>
                    {row.description ? <p>{row.description}</p> : null}
                    <p>{row.summary}</p>
                  </div>
                  {row.fieldUsages.length > 0 ? (
                    <div
                      className="vwb-tag-row"
                      aria-label={row.fieldUsageLabel}
                    >
                      {row.fieldUsages.map((usage) => (
                        <span className="vwb-tag" key={usage.id}>
                          {usage.summaryText}
                        </span>
                      ))}
                    </div>
                  ) : null}
                  <div className="vwb-field-order-list">
                    <strong>{schemaModel.vocabulary.activeValuesTitle}</strong>
                    <label>
                      {schemaModel.vocabulary.searchValuesLabel}
                      <input
                        aria-label={row.searchValuesFieldLabel}
                        value={valueQuery}
                        onChange={(event) =>
                          updateVocabularyValueQuery(row.id, event.target.value)
                        }
                        placeholder={row.searchValuesPlaceholder}
                      />
                    </label>
                    {visibleValues.map((value) => {
                      const draftKey = getVocabularyValueDraftKey(
                        row.id,
                        value.id
                      );
                      const activeValueIndex = row.values.findIndex(
                        (candidate) => candidate.id === value.id
                      );
                      const draft =
                        vocabularyValueEditDrafts[draftKey] ??
                        vocabularyValueDraftFrom(value);
                      const isDraftChanged =
                        draft.label !== value.label ||
                        draft.description !== value.description ||
                        draft.aliases !== value.aliases.join(', ');

                      return (
                        <div className="vwb-field-order-row" key={value.id}>
                          <label>
                            {schemaModel.vocabulary.valueLabelFieldLabel}
                            <input
                              aria-label={value.labelFieldLabel}
                              value={draft.label}
                              onChange={(event) =>
                                updateVocabularyValueEditDraft(
                                  row.id,
                                  value.id,
                                  'label',
                                  event.target.value
                                )
                              }
                            />
                          </label>
                          <label>
                            {schemaModel.vocabulary.valueDescriptionFieldLabel}
                            <input
                              aria-label={value.descriptionFieldLabel}
                              value={draft.description}
                              onChange={(event) =>
                                updateVocabularyValueEditDraft(
                                  row.id,
                                  value.id,
                                  'description',
                                  event.target.value
                                )
                              }
                            />
                          </label>
                          <label>
                            {schemaModel.vocabulary.valueAliasesFieldLabel}
                            <input
                              aria-label={value.aliasesFieldLabel}
                              value={draft.aliases}
                              onChange={(event) =>
                                updateVocabularyValueEditDraft(
                                  row.id,
                                  value.id,
                                  'aliases',
                                  event.target.value
                                )
                              }
                            />
                            <small className="vwb-field-help">
                              {schemaModel.vocabulary.aliasesHelpText}
                            </small>
                          </label>
                          {vocabularyValueErrors[draftKey] ? (
                            <p className="vwb-form-error">
                              {vocabularyValueErrors[draftKey]}
                            </p>
                          ) : null}
                          <div className="vwb-form-actions">
                            <button
                              aria-label={value.updateAccessibilityLabel}
                              className="vwb-secondary-button"
                              type="button"
                              disabled={!isDraftChanged}
                              onClick={() =>
                                submitVocabularyValueEdit(row.id, value)
                              }
                            >
                              {value.updateLabel}
                            </button>
                            <button
                              className="vwb-secondary-button"
                              type="button"
                              aria-label={value.moveUpAccessibilityLabel}
                              disabled={activeValueIndex === 0}
                              onClick={() =>
                                onMoveVocabularyValue(row.id, value.id, 'up')
                              }
                            >
                              {value.moveUpLabel}
                            </button>
                            <button
                              className="vwb-secondary-button"
                              type="button"
                              aria-label={value.moveDownAccessibilityLabel}
                              disabled={
                                activeValueIndex === row.values.length - 1
                              }
                              onClick={() =>
                                onMoveVocabularyValue(row.id, value.id, 'down')
                              }
                            >
                              {value.moveDownLabel}
                            </button>
                            <button
                              aria-label={value.archiveAccessibilityLabel}
                              className="vwb-secondary-button vwb-danger-button"
                              type="button"
                              onClick={() =>
                                onArchiveVocabularyValue(row.id, value.id, true)
                              }
                            >
                              {value.archiveLabel}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                    {row.values.length === 0 ? (
                      <p className="vwb-muted-note">{row.noActiveValuesText}</p>
                    ) : null}
                    {row.values.length > 0 && visibleValues.length === 0 ? (
                      <p className="vwb-muted-note">
                        {row.noMatchingValuesText}
                      </p>
                    ) : null}
                    {hiddenValueCount > 0 ? (
                      <span className="vwb-tag">
                        {formatKnowledgeVocabularyHiddenValueCount(
                          row.name,
                          hiddenValueCount
                        )}
                      </span>
                    ) : null}
                  </div>
                  <div className="vwb-action-row">
                    {row.fieldUsages[0] ? (
                      <NavLink
                        aria-label={row.fieldUsages[0].openAccessibilityLabel}
                        className="vwb-secondary-button"
                        to={row.fieldUsages[0].route}
                      >
                        {row.fieldUsages[0].openLabel}
                      </NavLink>
                    ) : null}
                    {matchingValues.length >
                    knowledgeDisplayLimits.vocabularyValues ? (
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
                          ? row.showFewerValuesLabel
                          : row.showAllValuesLabel}
                      </button>
                    ) : null}
                  </div>
                  {row.archivedValues.length > 0 ? (
                    <div
                      className="vwb-tag-row"
                      aria-label={row.archivedValuesLabel}
                    >
                      {row.archivedValues.map((value) => (
                        <button
                          aria-label={value.restoreAccessibilityLabel}
                          className="vwb-secondary-button"
                          key={value.id}
                          type="button"
                          onClick={() =>
                            onArchiveVocabularyValue(row.id, value.id, false)
                          }
                        >
                          {value.restoreLabel}
                        </button>
                      ))}
                    </div>
                  ) : null}
                  <form
                    className="vwb-form vwb-field-group"
                    onSubmit={(event) => submitVocabularyValue(event, row.id)}
                  >
                    <label>
                      {schemaModel.vocabulary.newValueLabelFieldLabel}
                      <input
                        aria-label={row.newValueLabelFieldLabel}
                        value={valueDraft.label}
                        onChange={(event) =>
                          updateVocabularyValueDraft(
                            row.id,
                            'label',
                            event.target.value
                          )
                        }
                      />
                    </label>
                    <label>
                      {schemaModel.vocabulary.newValueDescriptionFieldLabel}
                      <input
                        aria-label={row.newValueDescriptionFieldLabel}
                        value={valueDraft.description}
                        onChange={(event) =>
                          updateVocabularyValueDraft(
                            row.id,
                            'description',
                            event.target.value
                          )
                        }
                      />
                    </label>
                    <label>
                      {schemaModel.vocabulary.newValueAliasesFieldLabel}
                      <input
                        aria-label={row.newValueAliasesFieldLabel}
                        value={valueDraft.aliases}
                        onChange={(event) =>
                          updateVocabularyValueDraft(
                            row.id,
                            'aliases',
                            event.target.value
                          )
                        }
                      />
                      <small className="vwb-field-help">
                        {schemaModel.vocabulary.archivedRestoreHelpText}
                      </small>
                    </label>
                    {vocabularyValueErrors[row.id] ? (
                      <p className="vwb-form-error">
                        {vocabularyValueErrors[row.id]}
                      </p>
                    ) : null}
                    <div className="vwb-form-actions">
                      <button
                        aria-label={row.addValueAccessibilityLabel}
                        className="vwb-secondary-button"
                        type="submit"
                      >
                        {row.addValueLabel}
                      </button>
                    </div>
                  </form>
                </article>
              );
            })}
          </div>
        </section>

        <section
          className="vwb-panel"
          data-dashboard-card-id="knowledge.hidden-detail-review"
          id={knowledgeRouteFocusTargetIds.hiddenDetails}
          aria-labelledby="knowledge-hidden-title"
          tabIndex={-1}
        >
          <div className="vwb-section-heading">
            <div>
              <p className="vwb-kicker">
                {schemaModel.hiddenDetails.kickerLabel}
              </p>
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
                {schemaModel.hiddenDetails.clearAllActionLabel}
              </button>
            ) : null}
          </div>
          <p>{schemaModel.hiddenDetails.detail}</p>
          {schemaModel.hiddenDetails.rows.length > 0 ? (
            <label className="vwb-search-field">
              {schemaModel.hiddenDetails.searchLabel}
              <input
                value={hiddenDetailQuery}
                onChange={(event) => setHiddenDetailQuery(event.target.value)}
                placeholder={schemaModel.hiddenDetails.searchPlaceholder}
                type="search"
              />
            </label>
          ) : null}
          {schemaModel.hiddenDetails.rows.length > 0 ? (
            <div className="vwb-relationship-list">
              {hiddenDetailRows.map((row) => (
                <article className="vwb-relationship-row" key={row.id}>
                  <div>
                    <span className="vwb-entry-kind">
                      {row.sectionTitle} - {row.fieldLabel}
                    </span>
                    <strong>{row.entryName}</strong>
                    <p>{row.value}</p>
                  </div>
                  <div className="vwb-form-actions">
                    <NavLink
                      aria-label={row.reviewAccessibilityLabel}
                      className="vwb-secondary-button"
                      to={row.route}
                    >
                      {row.reviewLabel}
                    </NavLink>
                    <button
                      aria-label={row.clearAccessibilityLabel}
                      className="vwb-secondary-button vwb-danger-button"
                      type="button"
                      onClick={() => requestClearHiddenEntryDetail(row)}
                    >
                      {row.clearLabel}
                    </button>
                  </div>
                </article>
              ))}
              {hiddenDetailRows.length === 0 ? (
                <p className="vwb-muted-note">
                  {schemaModel.hiddenDetails.noSearchResultsText}
                </p>
              ) : null}
            </div>
          ) : (
            <p className="vwb-muted-note">
              {schemaModel.hiddenDetails.emptyText}
            </p>
          )}
        </section>

        <section
          className="vwb-panel"
          aria-labelledby="knowledge-types-title"
          data-dashboard-card-id="knowledge.types"
        >
          <div className="vwb-section-heading">
            <div>
              <p className="vwb-kicker">{schemaModel.entryTypesKickerLabel}</p>
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
                  <small>{section.relationshipFieldCountLabel}.</small>
                ) : (
                  <small>{schemaModel.relationshipFieldsTitle}: none.</small>
                )}
                <NavLink
                  aria-label={section.openAccessibilityLabel}
                  className="vwb-secondary-button"
                  to={section.route}
                >
                  {section.openLabel}
                </NavLink>
              </article>
            ))}
          </div>
        </section>

        <section
          className="vwb-panel"
          aria-labelledby="knowledge-reusable-title"
          data-dashboard-card-id="knowledge.reusable-definitions"
        >
          <div className="vwb-section-heading">
            <div>
              <p className="vwb-kicker">
                {schemaModel.reusableKnowledge.kickerLabel}
              </p>
              <h2 id="knowledge-reusable-title">
                {schemaModel.reusableKnowledge.title}
              </h2>
            </div>
          </div>
          <p>{schemaModel.reusableKnowledge.detail}</p>
          <div className="vwb-form-actions">
            {schemaModel.reusableKnowledge.destinations.map((destination) => (
              <NavLink
                aria-label={destination.openAccessibilityLabel}
                className="vwb-secondary-button"
                key={destination.id}
                to={destination.route}
              >
                {destination.openLabel}
              </NavLink>
            ))}
          </div>
          {schemaModel.reusableKnowledge.loreDefinitions.length > 0 ? (
            <div className="vwb-relationship-list">
              <div>
                <h3>{schemaModel.reusableKnowledge.loreDefinitionsTitle}</h3>
                <p>{schemaModel.reusableKnowledge.loreDefinitionsDetail}</p>
              </div>
              {schemaModel.reusableKnowledge.loreDefinitions.map(
                (definition) => (
                  <article className="vwb-relationship-row" key={definition.id}>
                    <div>
                      <span className="vwb-entry-kind">
                        {definition.countLabel}
                      </span>
                      <strong>{definition.label}</strong>
                    </div>
                    <NavLink
                      aria-label={definition.openAccessibilityLabel}
                      className="vwb-secondary-button"
                      to={definition.route}
                    >
                      {definition.openLabel}
                    </NavLink>
                  </article>
                )
              )}
            </div>
          ) : null}
        </section>
      </DashboardPage>

      {pendingDestructiveAction ? (
        <KnowledgeDestructiveActionDialog
          actionDialogKickerLabel={schemaModel.actionDialogKickerLabel}
          pendingAction={pendingDestructiveAction}
          onCancel={cancelPendingDestructiveAction}
          onConfirm={confirmPendingDestructiveAction}
        />
      ) : null}
    </main>
  );
}
