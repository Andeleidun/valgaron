import { Fragment, useEffect, useRef, useState } from 'react';
import { ScrollView } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import {
  emptyEntryTypeDraft,
  emptyVocabularyValueDraft,
  entryTypeDraftFields,
  fieldOverrideDraftFrom,
  filterKnowledgeFieldConfigurationSections,
  filterKnowledgeHiddenDetailRows,
  filterKnowledgeVocabularyValueRows,
  formatExpansionControlLabel,
  formatHiddenCountText,
  formatUtilityOverviewActionAccessibilityLabel,
  formatWorkflowDestinationAccessibilityLabel,
  formatKnowledgeVocabularyHiddenValueCount,
  getCodexScreenIntro,
  getEntryTypeDraftFieldLayout,
  getEntryTypeDraftFieldPreview,
  getFeedbackTone,
  getKnowledgeRouteFocusTargetId,
  getKnowledgeSchemaModel,
  getLimitedResultModel,
  getUtilitiesOverviewModel,
  getUtilitiesRouteFocusTargetId,
  knowledgeDisplayLimits,
  knowledgeRouteFocusTargetIds,
  utilityRouteFocusTargetIds,
  workspaceFeatureActions,
  workspaceFeatureCopy,
  vocabularyValueDraftFrom,
  type EntryTypeDraft,
  type FieldOverrideDraft,
  type KnowledgeFieldRow,
  type KnowledgeVocabularyValueRow,
  type VocabularyValueDraft,
} from '@valgaron/core';
import { useMobileCodex } from '../state/MobileCodexContext';
import { useMobileSectionPreferences } from '../state/useMobileSectionPreferences';
import {
  getMobileRouteHref,
  mobileRouteFocusParam,
} from '../navigation/mobileRoutes';
import { getMobileRouteParam } from '../navigation/mobileRouteParams';
import {
  ActionButton,
  BodyText,
  ButtonRow,
  CheckboxField,
  Field,
  MutedText,
  MobileSectionDashboard,
  ScreenHeader,
  ScreenScroll,
  SectionBlock,
  SelectField,
  StatusText,
} from './screenPrimitives';
import { confirmMobileDestructiveAction } from './mobileConfirm';

const entryTypeDraftFieldLayout = getEntryTypeDraftFieldLayout();

export function MoreScreen() {
  const controller = useMobileCodex();
  const intro = getCodexScreenIntro('utilities');
  const routeParams = useLocalSearchParams<{
    [mobileRouteFocusParam]?: string;
  }>();
  const routeFocusTargetId =
    getKnowledgeRouteFocusTargetId({
      focusId: getMobileRouteParam(routeParams[mobileRouteFocusParam]),
    }) ||
    getUtilitiesRouteFocusTargetId({
      focusId: getMobileRouteParam(routeParams[mobileRouteFocusParam]),
    });
  const overview = getUtilitiesOverviewModel(controller.activeWorld);
  const moreDashboardSectionIds = [
    'more.tools',
    'more.schema',
    'more.fields',
    'more.entry-types',
    'more.vocabulary',
    'more.hidden-details',
    'more.reusable',
    'more.lore',
    ...overview.destinations.map((destination) => `more.${destination.id}`),
  ];
  const dashboard = useMobileSectionPreferences({
    screenId: 'more',
    sectionIds: moreDashboardSectionIds,
  });
  const schemaModel = getKnowledgeSchemaModel(controller.activeWorld);
  const scrollRef = useRef<ScrollView | null>(null);
  const focusedSectionOffsets = useRef<Partial<Record<string, number>>>({});
  const [focusedSectionLayoutVersion, setFocusedSectionLayoutVersion] =
    useState(0);
  const [entryTypeDraft, setEntryTypeDraft] = useState<EntryTypeDraft>(() =>
    emptyEntryTypeDraft()
  );
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
  const [
    showAllFieldConfigurationSections,
    setShowAllFieldConfigurationSections,
  ] = useState(false);
  const [fieldConfigurationQuery, setFieldConfigurationQuery] = useState('');
  const [showAllVocabularyRows, setShowAllVocabularyRows] = useState(false);
  const [showAllHiddenDetailRows, setShowAllHiddenDetailRows] = useState(false);
  const [hiddenDetailQuery, setHiddenDetailQuery] = useState('');
  const [showAllSchemaSections, setShowAllSchemaSections] = useState(false);
  const [
    showAllRelationshipFieldSummaries,
    setShowAllRelationshipFieldSummaries,
  ] = useState(false);
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
  const entryTypeFieldPreview = getEntryTypeDraftFieldPreview(
    entryTypeDraft.fields
  );
  const customTypes = schemaModel.sections.filter((section) => section.custom);
  const vocabularyRowDisplayModel = getLimitedResultModel(
    schemaModel.vocabulary.rows,
    showAllVocabularyRows
      ? schemaModel.vocabulary.rows.length
      : knowledgeDisplayLimits.vocabularyRows
  );
  const visibleVocabularyRows = vocabularyRowDisplayModel.visibleItems;
  const hiddenVocabularyRowCount = vocabularyRowDisplayModel.hiddenCount;
  const hiddenDetailRows = filterKnowledgeHiddenDetailRows(
    schemaModel.hiddenDetails.rows,
    hiddenDetailQuery
  );
  const hiddenDetailDisplayModel = getLimitedResultModel(
    hiddenDetailRows,
    showAllHiddenDetailRows
      ? hiddenDetailRows.length
      : knowledgeDisplayLimits.hiddenDetailRows
  );
  const visibleHiddenDetailRows = hiddenDetailDisplayModel.visibleItems;
  const hiddenDetailOverflowCount = hiddenDetailDisplayModel.hiddenCount;
  const schemaSectionDisplayModel = getLimitedResultModel(
    schemaModel.sections,
    showAllSchemaSections
      ? schemaModel.sections.length
      : knowledgeDisplayLimits.schemaSections
  );
  const visibleSchemaSections = schemaSectionDisplayModel.visibleItems;
  const hiddenSchemaSectionCount = schemaSectionDisplayModel.hiddenCount;
  const relationshipFieldSummaries = schemaModel.sections.flatMap((section) =>
    section.fields
      .filter((field) => field.targetSectionTitles.length > 0)
      .map((field) => ({
        field,
        section,
      }))
  );
  const relationshipFieldSummaryDisplayModel = getLimitedResultModel(
    relationshipFieldSummaries,
    showAllRelationshipFieldSummaries
      ? relationshipFieldSummaries.length
      : knowledgeDisplayLimits.relationshipFieldSummaries
  );
  const visibleRelationshipFieldSummaries =
    relationshipFieldSummaryDisplayModel.visibleItems;
  const hiddenRelationshipFieldSummaryCount =
    relationshipFieldSummaryDisplayModel.hiddenCount;
  const customFieldDraftDescriptor = entryTypeDraftFields.find(
    (field) => field.key === 'fields'
  );
  const getFieldOverrideDraftKey = (sectionId: string, fieldKey: string) =>
    `${sectionId}:${fieldKey}`;
  const getFieldLabelDraftKey = (sectionId: string, fieldKey: string) =>
    `${sectionId}:${fieldKey}`;
  const getVocabularyValueDraftKey = (vocabularyId: string, valueId: string) =>
    `${vocabularyId}:${valueId}`;
  const fieldConfigurationSections = filterKnowledgeFieldConfigurationSections(
    schemaModel.sections,
    fieldConfigurationQuery
  );
  const fieldConfigurationDisplayModel = getLimitedResultModel(
    fieldConfigurationSections,
    showAllFieldConfigurationSections
      ? fieldConfigurationSections.length
      : knowledgeDisplayLimits.fieldConfigurationSections
  );
  const visibleFieldConfigurationSections =
    fieldConfigurationDisplayModel.visibleItems;
  const hiddenFieldConfigurationSectionCount =
    fieldConfigurationDisplayModel.hiddenCount;
  const vocabularyOptions = [
    {
      label: schemaModel.fieldConfiguration.noVocabularyOptionLabel,
      value: '',
    },
    ...controller.activeWorld.schema.vocabularies.map((vocabulary) => ({
      label: vocabulary.name,
      value: vocabulary.id,
    })),
  ];
  const vocabularyModeOptions =
    schemaModel.fieldConfiguration.vocabularyModeOptions;

  useEffect(() => {
    if (!routeFocusTargetId) {
      return undefined;
    }
    const focusedOffset = focusedSectionOffsets.current[routeFocusTargetId];
    if (focusedOffset === undefined) {
      return undefined;
    }
    const timeout = setTimeout(() => {
      scrollRef.current?.scrollTo({
        animated: true,
        y: Math.max(focusedOffset - 12, 0),
      });
    }, 0);
    return () => clearTimeout(timeout);
  }, [focusedSectionLayoutVersion, routeFocusTargetId]);

  function setFocusedSectionOffset(focusId: string, offset: number) {
    if (focusedSectionOffsets.current[focusId] === offset) {
      return;
    }
    focusedSectionOffsets.current[focusId] = offset;
    setFocusedSectionLayoutVersion((version) => version + 1);
  }

  const updateEntryTypeDraft = (
    key: (typeof entryTypeDraftFields)[number]['key'],
    value: string
  ) => {
    setEntryTypeDraft((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const updateEntryTypeFieldDraft = (sectionId: string, value: string) => {
    setEntryTypeFieldDrafts((current) => ({
      ...current,
      [sectionId]: value,
    }));
    setEntryTypeFieldErrors((current) => ({
      ...current,
      [sectionId]: '',
    }));
  };

  const addEntryTypeFields = (sectionId: string) => {
    const fieldsText = entryTypeFieldDrafts[sectionId] ?? '';
    if (getEntryTypeDraftFieldPreview(fieldsText).length === 0) {
      setEntryTypeFieldErrors((current) => ({
        ...current,
        [sectionId]: schemaModel.typeSetup.addFieldsRequiredError,
      }));
      return;
    }
    if (controller.addEntryTypeFields(sectionId, fieldsText)) {
      setEntryTypeFieldDrafts((current) => ({
        ...current,
        [sectionId]: '',
      }));
      setEntryTypeFieldErrors((current) => ({
        ...current,
        [sectionId]: '',
      }));
    }
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

  const saveEntryTypeFieldLabel = (
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
    if (controller.renameEntryTypeField(sectionId, fieldKey, nextLabel)) {
      setFieldLabelDrafts((currentDrafts) => ({
        ...currentDrafts,
        [draftKey]: nextLabel,
      }));
      setFieldLabelErrors((currentErrors) => ({
        ...currentErrors,
        [draftKey]: '',
      }));
    }
  };

  const getSavedFieldOverrideDraft = (
    sectionId: string,
    field: KnowledgeFieldRow
  ) =>
    fieldOverrideDraftFrom({
      field: { label: field.baseLabel },
      override:
        controller.activeWorld.schema.fieldOverrides[sectionId]?.[field.key],
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
    setFieldOverrideDrafts((current) => ({
      ...current,
      [draftKey]: {
        ...getFieldOverrideDraft(sectionId, field),
        ...patch,
      },
    }));
    setFieldOverrideErrors((current) => ({
      ...current,
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

  const isFieldOverrideDraftChanged = (
    sectionId: string,
    field: KnowledgeFieldRow,
    draft: FieldOverrideDraft
  ) => {
    const savedDraft = getSavedFieldOverrideDraft(sectionId, field);
    return (
      savedDraft.label !== draft.label ||
      savedDraft.helpText !== draft.helpText ||
      savedDraft.hidden !== draft.hidden ||
      savedDraft.order !== draft.order ||
      savedDraft.vocabularyId !== draft.vocabularyId ||
      savedDraft.vocabularyMode !== draft.vocabularyMode
    );
  };

  const saveFieldOverride = (sectionId: string, field: KnowledgeFieldRow) => {
    const draftKey = getFieldOverrideDraftKey(sectionId, field.key);
    const draft = getFieldOverrideDraft(sectionId, field);
    const error = getFieldOverrideError(draft);
    if (error) {
      setFieldOverrideErrors((current) => ({
        ...current,
        [draftKey]: error,
      }));
      return;
    }
    if (controller.updateFieldOverride(sectionId, field.key, draft)) {
      setFieldOverrideDrafts((current) => ({
        ...current,
        [draftKey]: {
          ...draft,
          label: draft.label.trim(),
          helpText: draft.helpText.trim(),
          order: draft.order.trim(),
          vocabularyId: draft.vocabularyId.trim(),
        },
      }));
    }
  };

  const resetFieldOverride = (sectionId: string, field: KnowledgeFieldRow) => {
    const draftKey = getFieldOverrideDraftKey(sectionId, field.key);
    const defaultDraft = getDefaultFieldOverrideDraft(field);
    const hasSavedOverride =
      controller.activeWorld.schema.fieldOverrides[sectionId]?.[field.key] !==
      undefined;
    if (
      !hasSavedOverride ||
      controller.updateFieldOverride(sectionId, field.key, defaultDraft)
    ) {
      setFieldOverrideDrafts((current) => ({
        ...current,
        [draftKey]: defaultDraft,
      }));
      setFieldOverrideErrors((current) => ({
        ...current,
        [draftKey]: '',
      }));
    }
  };

  const updateVocabularyValueDraft = (
    vocabularyId: string,
    key: keyof VocabularyValueDraft,
    value: string
  ) => {
    setVocabularyValueDrafts((current) => ({
      ...current,
      [vocabularyId]: {
        ...(current[vocabularyId] ?? emptyVocabularyValueDraft()),
        [key]: value,
      },
    }));
    setVocabularyValueErrors((current) => ({ ...current, [vocabularyId]: '' }));
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
    setVocabularyValueEditDrafts((current) => ({
      ...current,
      [draftKey]: {
        ...(current[draftKey] ??
          vocabularyValueDraftFrom(savedValue as KnowledgeVocabularyValueRow)),
        [key]: value,
      },
    }));
    setVocabularyValueErrors((current) => ({ ...current, [draftKey]: '' }));
  };

  const updateVocabularyValueQuery = (vocabularyId: string, value: string) => {
    setVocabularyValueQueries((current) => ({
      ...current,
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

  const addVocabularyValue = (vocabularyId: string) => {
    const draft =
      vocabularyValueDrafts[vocabularyId] ?? emptyVocabularyValueDraft();
    const error = getVocabularyDraftError(vocabularyId, draft);
    if (error) {
      setVocabularyValueErrors((current) => ({
        ...current,
        [vocabularyId]: error,
      }));
      return;
    }
    if (controller.addVocabularyValue(vocabularyId, draft)) {
      setVocabularyValueDrafts((current) => ({
        ...current,
        [vocabularyId]: emptyVocabularyValueDraft(),
      }));
    }
  };

  const updateVocabularyValue = (
    vocabularyId: string,
    value: KnowledgeVocabularyValueRow
  ) => {
    const draftKey = getVocabularyValueDraftKey(vocabularyId, value.id);
    const draft =
      vocabularyValueEditDrafts[draftKey] ?? vocabularyValueDraftFrom(value);
    const error = getVocabularyDraftError(vocabularyId, draft, value.id);
    if (error) {
      setVocabularyValueErrors((current) => ({
        ...current,
        [draftKey]: error,
      }));
      return;
    }
    if (controller.updateVocabularyValue(vocabularyId, value.id, draft)) {
      setVocabularyValueEditDrafts((current) => ({
        ...current,
        [draftKey]: {
          label: draft.label.trim(),
          description: draft.description.trim(),
          aliases: draft.aliases.trim(),
        },
      }));
    }
  };

  return (
    <ScreenScroll scrollRef={scrollRef}>
      <ScreenHeader title={intro.title} detail={intro.detail} />

      <MobileSectionDashboard
        collapsed={dashboard.collapsed}
        isLoaded={dashboard.isLoaded}
        onMove={dashboard.move}
        onReset={dashboard.reset}
        onResetAll={dashboard.resetAll}
        onSetCollapsed={dashboard.setCollapsed}
        order={dashboard.order}
      >
        <SectionBlock
          sectionId="more.tools"
          title={overview.title}
          testID="more.project-tools"
          onLayout={(event) => {
            setFocusedSectionOffset(
              utilityRouteFocusTargetIds.projectTools,
              event.nativeEvent.layout.y
            );
          }}
        >
          <BodyText>{overview.detail}</BodyText>
          <MutedText>{overview.knowledgeSummary.title}</MutedText>
          {overview.knowledgeSummary.compactMetricLines.map((line) => (
            <MutedText key={line}>{line}</MutedText>
          ))}
          <ButtonRow>
            {overview.knowledgeSummary.actions.map((action) => (
              <ActionButton
                accessibilityLabel={formatUtilityOverviewActionAccessibilityLabel(
                  action
                )}
                key={action.id}
                label={action.actionLabel}
                onPress={() => router.push(getMobileRouteHref(action.path))}
              />
            ))}
          </ButtonRow>
          <MutedText>{overview.shortcutSummary.title}</MutedText>
          <MutedText>{overview.shortcutSummary.detail}</MutedText>
          <ButtonRow>
            {overview.shortcutSummary.actions.map((action) => (
              <ActionButton
                accessibilityLabel={formatUtilityOverviewActionAccessibilityLabel(
                  action
                )}
                key={action.id}
                label={action.actionLabel}
                onPress={() => router.push(getMobileRouteHref(action.path))}
              />
            ))}
          </ButtonRow>
          <MutedText>{overview.reviewSummary.title}</MutedText>
          <MutedText>{overview.reviewSummary.detail}</MutedText>
          {overview.reviewSummary.metrics.map((metric) => (
            <MutedText key={metric}>{metric}</MutedText>
          ))}
          {overview.reviewSummary.actions.length > 0 ? (
            <ButtonRow>
              {overview.reviewSummary.actions.map((action) => (
                <ActionButton
                  accessibilityLabel={formatUtilityOverviewActionAccessibilityLabel(
                    action
                  )}
                  key={action.id}
                  label={action.actionLabel}
                  onPress={() => router.push(getMobileRouteHref(action.path))}
                />
              ))}
            </ButtonRow>
          ) : (
            <MutedText>{overview.reviewSummary.emptyActionText}</MutedText>
          )}
        </SectionBlock>

        <SectionBlock sectionId="more.schema" title={schemaModel.title}>
          <MutedText>{schemaModel.overview.mobileStructureSummary}</MutedText>
          <MutedText>
            {schemaModel.overview.mobileHiddenDetailSummary}
          </MutedText>
          {visibleSchemaSections.map((section) => (
            <MutedText key={section.id}>{section.schemaSummary}</MutedText>
          ))}
          {hiddenSchemaSectionCount > 0 ? (
            <MutedText>
              {formatHiddenCountText({
                hiddenCount: hiddenSchemaSectionCount,
                singularItemLabel: 'entry type',
                pluralItemLabel: 'entry types',
              })}
            </MutedText>
          ) : null}
          <ButtonRow>
            {visibleSchemaSections.map((section) => (
              <ActionButton
                accessibilityLabel={section.openAccessibilityLabel}
                key={section.id}
                label={section.openLabel}
                onPress={() => router.push(getMobileRouteHref(section.route))}
              />
            ))}
          </ButtonRow>
          {schemaModel.sections.length >
          knowledgeDisplayLimits.schemaSections ? (
            <ButtonRow>
              <ActionButton
                expanded={showAllSchemaSections}
                label={formatExpansionControlLabel({
                  isExpanded: showAllSchemaSections,
                  hiddenCount: hiddenSchemaSectionCount,
                  pluralItemLabel: 'Entry Types',
                  singularItemLabel: 'Entry Type',
                })}
                onPress={() =>
                  setShowAllSchemaSections((currentValue) => !currentValue)
                }
              />
            </ButtonRow>
          ) : null}
          {visibleRelationshipFieldSummaries.map(({ field, section }) => (
            <MutedText key={`${section.id}-${field.key}`}>
              {section.title} {field.label}: {field.relationshipType} to{' '}
              {field.targetSectionTitles.join(', ')}
            </MutedText>
          ))}
          {hiddenRelationshipFieldSummaryCount > 0 ? (
            <MutedText>
              {formatHiddenCountText({
                hiddenCount: hiddenRelationshipFieldSummaryCount,
                singularItemLabel: 'relationship-backed field',
                pluralItemLabel: 'relationship-backed fields',
              })}
            </MutedText>
          ) : null}
          {relationshipFieldSummaries.length >
          knowledgeDisplayLimits.relationshipFieldSummaries ? (
            <ButtonRow>
              <ActionButton
                expanded={showAllRelationshipFieldSummaries}
                label={formatExpansionControlLabel({
                  isExpanded: showAllRelationshipFieldSummaries,
                  hiddenCount: hiddenRelationshipFieldSummaryCount,
                  pluralItemLabel: 'Linked Fields',
                  singularItemLabel: 'Linked Field',
                })}
                onPress={() =>
                  setShowAllRelationshipFieldSummaries(
                    (currentValue) => !currentValue
                  )
                }
              />
            </ButtonRow>
          ) : null}
          <ButtonRow>
            <ActionButton
              accessibilityLabel={
                schemaModel.typeSetup.actionAccessibilityLabel
              }
              label={schemaModel.typeSetup.actionLabel}
              onPress={() =>
                router.push(getMobileRouteHref(schemaModel.typeSetup.route))
              }
            />
            {schemaModel.totals.hiddenDetailCount > 0 ? (
              <ActionButton
                accessibilityLabel={
                  schemaModel.hiddenDetails.reviewActionAccessibilityLabel
                }
                label={schemaModel.hiddenDetails.reviewActionLabel}
                onPress={() =>
                  router.push(
                    getMobileRouteHref(
                      schemaModel.hiddenDetails.reviewActionRoute
                    )
                  )
                }
              />
            ) : null}
          </ButtonRow>
        </SectionBlock>

        <SectionBlock
          sectionId="more.fields"
          title={schemaModel.fieldConfiguration.title}
          testID="more.field-config"
        >
          <MutedText>{schemaModel.fieldConfiguration.detail}</MutedText>
          <Field
            autoCorrect={false}
            label={schemaModel.fieldConfiguration.searchLabel}
            placeholder={schemaModel.fieldConfiguration.searchPlaceholder}
            value={fieldConfigurationQuery}
            onChangeText={setFieldConfigurationQuery}
          />
          {visibleFieldConfigurationSections.map((section) => (
            <Fragment key={`${section.id}-field-config`}>
              <MutedText>{section.fieldConfigurationSummary}</MutedText>
              {section.fields.map((field) => {
                const draft = getFieldOverrideDraft(section.id, field);
                const draftKey = getFieldOverrideDraftKey(
                  section.id,
                  field.key
                );
                const canUseVocabulary =
                  field.mode !== 'single-link' && field.mode !== 'multi-link';
                const isDraftChanged = isFieldOverrideDraftChanged(
                  section.id,
                  field,
                  draft
                );
                const hasSavedOverride =
                  controller.activeWorld.schema.fieldOverrides[section.id]?.[
                    field.key
                  ] !== undefined;
                const canResetOverride = hasSavedOverride || isDraftChanged;
                return (
                  <Fragment key={`${section.id}-${field.key}-field-config`}>
                    <MutedText>
                      {field.key}: {field.modeLabel} -{' '}
                      {hasSavedOverride
                        ? schemaModel.fieldConfiguration
                            .customSettingsStatusLabel
                        : schemaModel.fieldConfiguration
                            .defaultSettingsStatusLabel}
                      {field.hidden ? ' (hidden)' : ''}
                    </MutedText>
                    <Field
                      accessibilityLabel={field.settingsLabelFieldLabel}
                      autoCapitalize="words"
                      label={
                        schemaModel.fieldConfiguration.fieldLabelFieldLabel
                      }
                      value={draft.label}
                      onChangeText={(value) =>
                        updateFieldOverrideDraft(section.id, field, {
                          label: value,
                        })
                      }
                    />
                    <Field
                      accessibilityLabel={field.settingsHelpFieldLabel}
                      label={
                        schemaModel.fieldConfiguration.fieldHelpTextFieldLabel
                      }
                      value={draft.helpText}
                      onChangeText={(value) =>
                        updateFieldOverrideDraft(section.id, field, {
                          helpText: value,
                        })
                      }
                    />
                    <Field
                      accessibilityLabel={field.settingsOrderFieldLabel}
                      autoCorrect={false}
                      label={
                        schemaModel.fieldConfiguration.fieldOrderFieldLabel
                      }
                      placeholder={
                        schemaModel.fieldConfiguration.defaultOrderPlaceholder
                      }
                      value={draft.order}
                      onChangeText={(value) =>
                        updateFieldOverrideDraft(section.id, field, {
                          order: value,
                        })
                      }
                    />
                    <CheckboxField
                      accessibilityLabel={field.settingsHiddenFieldLabel}
                      checked={draft.hidden}
                      label={
                        schemaModel.fieldConfiguration.fieldHiddenToggleLabel
                      }
                      onChange={(checked) =>
                        updateFieldOverrideDraft(section.id, field, {
                          hidden: checked,
                        })
                      }
                    />
                    {canUseVocabulary ? (
                      <>
                        <SelectField
                          accessibilityLabel={
                            field.settingsVocabularyFieldLabel
                          }
                          label={schemaModel.fieldConfiguration.vocabularyLabel}
                          options={vocabularyOptions}
                          searchable
                          value={draft.vocabularyId}
                          onValueChange={(value) =>
                            updateFieldOverrideDraft(section.id, field, {
                              vocabularyId: value,
                            })
                          }
                        />
                        {draft.vocabularyId ? (
                          <SelectField
                            accessibilityLabel={
                              field.settingsVocabularyModeFieldLabel
                            }
                            label={
                              schemaModel.fieldConfiguration.vocabularyModeLabel
                            }
                            options={vocabularyModeOptions}
                            value={draft.vocabularyMode}
                            onValueChange={(value) =>
                              updateFieldOverrideDraft(section.id, field, {
                                vocabularyMode: value,
                              })
                            }
                          />
                        ) : (
                          <MutedText>
                            {
                              schemaModel.fieldConfiguration
                                .chooseVocabularyBeforeModeText
                            }
                          </MutedText>
                        )}
                      </>
                    ) : (
                      <MutedText>
                        {
                          schemaModel.fieldConfiguration
                            .relationshipBackedVocabularyHelpText
                        }
                      </MutedText>
                    )}
                    {field.vocabularyName ? (
                      <MutedText>
                        {schemaModel.fieldConfiguration.currentVocabularyLabel}:{' '}
                        {field.vocabularyName} ({field.vocabularyModeLabel}).
                      </MutedText>
                    ) : null}
                    {fieldOverrideErrors[draftKey] ? (
                      <StatusText tone="danger">
                        {fieldOverrideErrors[draftKey]}
                      </StatusText>
                    ) : null}
                    <ButtonRow>
                      <ActionButton
                        accessibilityLabel={
                          field.updateSettingsAccessibilityLabel
                        }
                        disabled={!isDraftChanged}
                        label={field.updateSettingsLabel}
                        onPress={() => saveFieldOverride(section.id, field)}
                      />
                      <ActionButton
                        accessibilityLabel={
                          field.resetSettingsAccessibilityLabel
                        }
                        disabled={!canResetOverride}
                        label={field.resetSettingsLabel}
                        onPress={() => resetFieldOverride(section.id, field)}
                      />
                    </ButtonRow>
                  </Fragment>
                );
              })}
              <ButtonRow>
                <ActionButton
                  accessibilityLabel={section.openAccessibilityLabel}
                  label={section.openLabel}
                  onPress={() => router.push(getMobileRouteHref(section.route))}
                />
              </ButtonRow>
            </Fragment>
          ))}
          {fieldConfigurationSections.length === 0 ? (
            <MutedText>
              {schemaModel.fieldConfiguration.noSearchResultsText}
            </MutedText>
          ) : null}
          {hiddenFieldConfigurationSectionCount > 0 ? (
            <ButtonRow>
              <ActionButton
                expanded={showAllFieldConfigurationSections}
                label={formatExpansionControlLabel({
                  isExpanded: showAllFieldConfigurationSections,
                  hiddenCount: hiddenFieldConfigurationSectionCount,
                  pluralItemLabel: 'Field Sections',
                  singularItemLabel: 'Field Section',
                })}
                onPress={() =>
                  setShowAllFieldConfigurationSections((current) => !current)
                }
              />
            </ButtonRow>
          ) : null}
        </SectionBlock>

        <SectionBlock
          sectionId="more.entry-types"
          title={workspaceFeatureCopy.sections.customEntryTypes}
          testID="more.custom-entry-types"
          onLayout={(event) => {
            setFocusedSectionOffset(
              knowledgeRouteFocusTargetIds.customEntryTypes,
              event.nativeEvent.layout.y
            );
          }}
        >
          {controller.formMessage ? (
            <StatusText tone={getFeedbackTone(controller.formMessage)}>
              {controller.formMessage}
            </StatusText>
          ) : null}
          <MutedText>{schemaModel.typeSetup.customTypeCountLabel}</MutedText>
          {customTypes.length === 0 ? (
            <MutedText>{schemaModel.typeSetup.emptyCustomTypesText}</MutedText>
          ) : null}
          {customTypes.map((section) => {
            const fieldDraft = entryTypeFieldDrafts[section.id] ?? '';
            const fieldPreview = getEntryTypeDraftFieldPreview(fieldDraft);
            return (
              <Fragment key={`${section.id}-fields`}>
                <MutedText>{section.fieldConfigurationSummary}</MutedText>
                {section.fields.map((field, fieldIndex) => (
                  <Fragment key={`${section.id}-${field.key}-order`}>
                    <MutedText>{field.retainedValueSummary}</MutedText>
                    <Field
                      label={field.renameFieldLabel}
                      value={
                        fieldLabelDrafts[
                          getFieldLabelDraftKey(section.id, field.key)
                        ] ?? field.label
                      }
                      onChangeText={(value) =>
                        updateFieldLabelDraft(section.id, field.key, value)
                      }
                    />
                    {fieldLabelErrors[
                      getFieldLabelDraftKey(section.id, field.key)
                    ] ? (
                      <StatusText tone="danger">
                        {
                          fieldLabelErrors[
                            getFieldLabelDraftKey(section.id, field.key)
                          ]
                        }
                      </StatusText>
                    ) : null}
                    <ButtonRow>
                      <ActionButton
                        accessibilityLabel={
                          field.updateFieldLabelAccessibilityLabel
                        }
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
                        label={workspaceFeatureActions.updateFieldLabel}
                        onPress={() =>
                          saveEntryTypeFieldLabel(
                            section.id,
                            field.key,
                            field.label
                          )
                        }
                      />
                      <ActionButton
                        accessibilityLabel={field.moveFieldUpAccessibilityLabel}
                        disabled={fieldIndex === 0}
                        label={workspaceFeatureActions.moveFieldUp}
                        onPress={() =>
                          controller.moveEntryTypeField(
                            section.id,
                            field.key,
                            'up'
                          )
                        }
                      />
                      <ActionButton
                        accessibilityLabel={
                          field.moveFieldDownAccessibilityLabel
                        }
                        disabled={fieldIndex === section.fields.length - 1}
                        label={workspaceFeatureActions.moveFieldDown}
                        onPress={() =>
                          controller.moveEntryTypeField(
                            section.id,
                            field.key,
                            'down'
                          )
                        }
                      />
                      <ActionButton
                        accessibilityHint={field.removeFieldAccessibilityHint}
                        accessibilityLabel={field.removeFieldAccessibilityLabel}
                        label={workspaceFeatureActions.removeField}
                        tone="danger"
                        onPress={() =>
                          confirmMobileDestructiveAction(
                            'remove-entry-type-field',
                            () =>
                              controller.removeEntryTypeField(
                                section.id,
                                field.key
                              ),
                            field.removeFieldConfirmationSubject
                          )
                        }
                      />
                    </ButtonRow>
                  </Fragment>
                ))}
                <Field
                  autoCapitalize="words"
                  autoCorrect={false}
                  accessibilityLabel={section.addFieldsFieldLabel}
                  label={schemaModel.typeSetup.addFieldsLabel}
                  placeholder={customFieldDraftDescriptor?.placeholder}
                  value={fieldDraft}
                  onChangeText={(value) =>
                    updateEntryTypeFieldDraft(section.id, value)
                  }
                />
                {customFieldDraftDescriptor?.helperText ? (
                  <MutedText>{customFieldDraftDescriptor.helperText}</MutedText>
                ) : null}
                {fieldPreview.length > 0 ? (
                  <MutedText>
                    {section.addFieldsPreviewLabel}:{' '}
                    {fieldPreview
                      .map((field) => `${field.label} (${field.modeLabel})`)
                      .join('; ')}
                  </MutedText>
                ) : null}
                {entryTypeFieldErrors[section.id] ? (
                  <StatusText tone="danger">
                    {entryTypeFieldErrors[section.id]}
                  </StatusText>
                ) : null}
                <ButtonRow>
                  <ActionButton
                    accessibilityLabel={section.openAccessibilityLabel}
                    label={section.openLabel}
                    onPress={() =>
                      router.push(getMobileRouteHref(section.route))
                    }
                  />
                  <ActionButton
                    accessibilityLabel={section.addFieldsAccessibilityLabel}
                    disabled={fieldPreview.length === 0}
                    label={workspaceFeatureActions.addFields}
                    onPress={() => addEntryTypeFields(section.id)}
                  />
                  <ActionButton
                    accessibilityHint={section.deleteTypeAccessibilityHint}
                    accessibilityLabel={section.deleteTypeAccessibilityLabel}
                    label={workspaceFeatureActions.deleteType}
                    tone="danger"
                    onPress={() =>
                      confirmMobileDestructiveAction(
                        'delete-entry-type',
                        () => controller.permanentlyDeleteEntryType(section.id),
                        section.deleteTypeConfirmationSubject
                      )
                    }
                  />
                </ButtonRow>
              </Fragment>
            );
          })}
          {entryTypeDraftFieldLayout.fields.map((field) => (
            <Fragment key={field.key}>
              <Field
                autoCapitalize={field.key === 'fields' ? 'words' : undefined}
                autoCorrect={field.key === 'fields' ? false : undefined}
                label={field.label}
                multiline={field.multiline}
                placeholder={field.placeholder}
                value={entryTypeDraft[field.key]}
                onChangeText={(value) => updateEntryTypeDraft(field.key, value)}
              />
              {field.helperText ? (
                <MutedText>{field.helperText}</MutedText>
              ) : null}
            </Fragment>
          ))}
          {entryTypeFieldPreview.length > 0 ? (
            <MutedText>
              {schemaModel.typeSetup.customFieldPreviewTitle}:{' '}
              {entryTypeFieldPreview
                .map((field) => `${field.label} (${field.modeLabel})`)
                .join('; ')}
            </MutedText>
          ) : null}
          <ButtonRow>
            <ActionButton
              label={workspaceFeatureActions.createEntryType}
              tone="accent"
              onPress={() => {
                if (controller.createEntryType(entryTypeDraft)) {
                  setEntryTypeDraft(emptyEntryTypeDraft());
                }
              }}
            />
          </ButtonRow>
        </SectionBlock>

        <SectionBlock
          sectionId="more.vocabulary"
          title={schemaModel.vocabulary.title}
        >
          <MutedText>{schemaModel.vocabulary.detail}</MutedText>
          {visibleVocabularyRows.map((row) => (
            <Fragment key={row.id}>
              {(() => {
                const valueQuery = vocabularyValueQueries[row.id] ?? '';
                const matchingValues = filterKnowledgeVocabularyValueRows(
                  row.values,
                  valueQuery
                );
                const valueDisplayModel = getLimitedResultModel(
                  matchingValues,
                  expandedVocabularyValueRows[row.id]
                    ? matchingValues.length
                    : knowledgeDisplayLimits.vocabularyValues
                );
                const visibleValues = valueDisplayModel.visibleItems;
                const hiddenValueCount = valueDisplayModel.hiddenCount;
                return (
                  <>
                    <MutedText>
                      {row.name}: {row.summary}
                    </MutedText>
                    {row.fieldUsages.length > 0 ? (
                      <MutedText>
                        {row.fieldUsageSummaryIntro}{' '}
                        {row.fieldUsages
                          .map((usage) => usage.summaryText)
                          .join('; ')}
                      </MutedText>
                    ) : null}
                    <Field
                      autoCorrect={false}
                      label={row.searchValuesFieldLabel}
                      placeholder={row.searchValuesPlaceholder}
                      value={valueQuery}
                      onChangeText={(nextValue) =>
                        updateVocabularyValueQuery(row.id, nextValue)
                      }
                    />
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
                        <Fragment key={value.id}>
                          <MutedText>{value.label}</MutedText>
                          <Field
                            accessibilityLabel={value.labelFieldLabel}
                            label={schemaModel.vocabulary.valueLabelFieldLabel}
                            value={draft.label}
                            onChangeText={(nextValue) =>
                              updateVocabularyValueEditDraft(
                                row.id,
                                value.id,
                                'label',
                                nextValue
                              )
                            }
                          />
                          <Field
                            accessibilityLabel={value.descriptionFieldLabel}
                            label={
                              schemaModel.vocabulary.valueDescriptionFieldLabel
                            }
                            value={draft.description}
                            onChangeText={(nextValue) =>
                              updateVocabularyValueEditDraft(
                                row.id,
                                value.id,
                                'description',
                                nextValue
                              )
                            }
                          />
                          <Field
                            autoCapitalize="words"
                            autoCorrect={false}
                            accessibilityLabel={value.aliasesFieldLabel}
                            label={
                              schemaModel.vocabulary.valueAliasesFieldLabel
                            }
                            value={draft.aliases}
                            onChangeText={(nextValue) =>
                              updateVocabularyValueEditDraft(
                                row.id,
                                value.id,
                                'aliases',
                                nextValue
                              )
                            }
                          />
                          <MutedText>
                            {schemaModel.vocabulary.aliasesHelpText}
                          </MutedText>
                          {vocabularyValueErrors[draftKey] ? (
                            <StatusText tone="danger">
                              {vocabularyValueErrors[draftKey]}
                            </StatusText>
                          ) : null}
                          <ButtonRow>
                            <ActionButton
                              accessibilityLabel={
                                value.updateAccessibilityLabel
                              }
                              disabled={!isDraftChanged}
                              label={value.updateLabel}
                              onPress={() =>
                                updateVocabularyValue(row.id, value)
                              }
                            />
                            <ActionButton
                              accessibilityLabel={
                                value.moveUpAccessibilityLabel
                              }
                              disabled={activeValueIndex === 0}
                              label={value.moveUpLabel}
                              onPress={() =>
                                controller.moveVocabularyValue(
                                  row.id,
                                  value.id,
                                  'up'
                                )
                              }
                            />
                            <ActionButton
                              accessibilityLabel={
                                value.moveDownAccessibilityLabel
                              }
                              disabled={
                                activeValueIndex === row.values.length - 1
                              }
                              label={value.moveDownLabel}
                              onPress={() =>
                                controller.moveVocabularyValue(
                                  row.id,
                                  value.id,
                                  'down'
                                )
                              }
                            />
                            <ActionButton
                              accessibilityLabel={
                                value.archiveAccessibilityLabel
                              }
                              label={value.archiveLabel}
                              tone="danger"
                              onPress={() =>
                                controller.archiveVocabularyValue(
                                  row.id,
                                  value.id,
                                  true
                                )
                              }
                            />
                          </ButtonRow>
                        </Fragment>
                      );
                    })}
                    {row.values.length === 0 ? (
                      <MutedText>{row.noActiveValuesText}</MutedText>
                    ) : null}
                    {row.values.length > 0 && visibleValues.length === 0 ? (
                      <MutedText>{row.noMatchingValuesText}</MutedText>
                    ) : null}
                    {hiddenValueCount > 0 ? (
                      <MutedText>
                        {formatKnowledgeVocabularyHiddenValueCount(
                          row.name,
                          hiddenValueCount
                        )}
                      </MutedText>
                    ) : null}
                    <ButtonRow>
                      {row.fieldUsages[0] ? (
                        <ActionButton
                          accessibilityLabel={
                            row.fieldUsages[0].openAccessibilityLabel
                          }
                          label={row.fieldUsages[0].openLabel}
                          onPress={() =>
                            router.push(
                              getMobileRouteHref(row.fieldUsages[0].route)
                            )
                          }
                        />
                      ) : null}
                      {matchingValues.length >
                      knowledgeDisplayLimits.vocabularyValues ? (
                        <ActionButton
                          expanded={Boolean(
                            expandedVocabularyValueRows[row.id]
                          )}
                          label={
                            expandedVocabularyValueRows[row.id]
                              ? row.showFewerValuesLabel
                              : row.showAllValuesLabel
                          }
                          onPress={() =>
                            setExpandedVocabularyValueRows((currentRows) => ({
                              ...currentRows,
                              [row.id]: !currentRows[row.id],
                            }))
                          }
                        />
                      ) : null}
                    </ButtonRow>
                  </>
                );
              })()}
              {row.archivedValues.length > 0 ? (
                <>
                  <MutedText>{row.archivedValuesLabel}</MutedText>
                  <ButtonRow>
                    {row.archivedValues.map((value) => (
                      <ActionButton
                        accessibilityLabel={value.restoreAccessibilityLabel}
                        key={value.id}
                        label={value.restoreLabel}
                        onPress={() =>
                          controller.archiveVocabularyValue(
                            row.id,
                            value.id,
                            false
                          )
                        }
                      />
                    ))}
                  </ButtonRow>
                </>
              ) : null}
              <Field
                accessibilityLabel={row.newValueLabelFieldLabel}
                label={schemaModel.vocabulary.newValueLabelFieldLabel}
                value={
                  (vocabularyValueDrafts[row.id] ?? emptyVocabularyValueDraft())
                    .label
                }
                onChangeText={(nextValue) =>
                  updateVocabularyValueDraft(row.id, 'label', nextValue)
                }
              />
              <Field
                accessibilityLabel={row.newValueDescriptionFieldLabel}
                label={schemaModel.vocabulary.newValueDescriptionFieldLabel}
                value={
                  (vocabularyValueDrafts[row.id] ?? emptyVocabularyValueDraft())
                    .description
                }
                onChangeText={(nextValue) =>
                  updateVocabularyValueDraft(row.id, 'description', nextValue)
                }
              />
              <Field
                autoCapitalize="words"
                autoCorrect={false}
                accessibilityLabel={row.newValueAliasesFieldLabel}
                label={schemaModel.vocabulary.newValueAliasesFieldLabel}
                value={
                  (vocabularyValueDrafts[row.id] ?? emptyVocabularyValueDraft())
                    .aliases
                }
                onChangeText={(nextValue) =>
                  updateVocabularyValueDraft(row.id, 'aliases', nextValue)
                }
              />
              <MutedText>
                {schemaModel.vocabulary.archivedRestoreHelpText}
              </MutedText>
              {vocabularyValueErrors[row.id] ? (
                <StatusText tone="danger">
                  {vocabularyValueErrors[row.id]}
                </StatusText>
              ) : null}
              <ButtonRow>
                <ActionButton
                  accessibilityLabel={row.addValueAccessibilityLabel}
                  label={row.addValueLabel}
                  onPress={() => addVocabularyValue(row.id)}
                />
              </ButtonRow>
            </Fragment>
          ))}
          {schemaModel.vocabulary.rows.length >
          knowledgeDisplayLimits.vocabularyRows ? (
            <ButtonRow>
              <ActionButton
                expanded={showAllVocabularyRows}
                label={formatExpansionControlLabel({
                  isExpanded: showAllVocabularyRows,
                  hiddenCount: hiddenVocabularyRowCount,
                  pluralItemLabel: 'Value Rows',
                  singularItemLabel: 'Value Row',
                })}
                onPress={() =>
                  setShowAllVocabularyRows((currentValue) => !currentValue)
                }
              />
            </ButtonRow>
          ) : null}
        </SectionBlock>

        <SectionBlock
          sectionId="more.hidden-details"
          title={schemaModel.hiddenDetails.title}
          testID="more.hidden-detail-cleanup"
          onLayout={(event) => {
            setFocusedSectionOffset(
              knowledgeRouteFocusTargetIds.hiddenDetails,
              event.nativeEvent.layout.y
            );
          }}
        >
          <MutedText>{schemaModel.hiddenDetails.detail}</MutedText>
          {schemaModel.hiddenDetails.rows.length > 0 ? (
            <>
              <Field
                autoCapitalize="none"
                autoCorrect={false}
                label={schemaModel.hiddenDetails.searchLabel}
                placeholder={schemaModel.hiddenDetails.searchPlaceholder}
                value={hiddenDetailQuery}
                onChangeText={setHiddenDetailQuery}
              />
              <ButtonRow>
                <ActionButton
                  label={schemaModel.hiddenDetails.clearAllActionLabel}
                  tone="danger"
                  onPress={() =>
                    confirmMobileDestructiveAction(
                      'clear-hidden-entry-details',
                      controller.clearHiddenEntryDetails
                    )
                  }
                />
              </ButtonRow>
              {visibleHiddenDetailRows.map((row) => (
                <Fragment key={row.id}>
                  <MutedText>
                    {row.sectionTitle} {row.fieldLabel}: {row.entryName} -{' '}
                    {row.value}
                  </MutedText>
                  <ButtonRow>
                    <ActionButton
                      accessibilityLabel={row.reviewAccessibilityLabel}
                      label={row.reviewLabel}
                      onPress={() => router.push(getMobileRouteHref(row.route))}
                    />
                    <ActionButton
                      accessibilityLabel={row.clearAccessibilityLabel}
                      label={row.clearLabel}
                      tone="danger"
                      onPress={() =>
                        confirmMobileDestructiveAction(
                          'clear-hidden-entry-detail',
                          () =>
                            controller.clearHiddenEntryDetail(
                              row.sectionId,
                              row.entryId,
                              row.fieldKey
                            ),
                          `${row.fieldLabel} from ${row.entryName}`
                        )
                      }
                    />
                  </ButtonRow>
                </Fragment>
              ))}
              {hiddenDetailRows.length === 0 ? (
                <MutedText>
                  {schemaModel.hiddenDetails.noSearchResultsText}
                </MutedText>
              ) : null}
              {hiddenDetailRows.length >
              knowledgeDisplayLimits.hiddenDetailRows ? (
                <ButtonRow>
                  <ActionButton
                    expanded={showAllHiddenDetailRows}
                    label={formatExpansionControlLabel({
                      isExpanded: showAllHiddenDetailRows,
                      hiddenCount: hiddenDetailOverflowCount,
                      pluralItemLabel: 'Cleanup Rows',
                      singularItemLabel: 'Cleanup Row',
                    })}
                    onPress={() =>
                      setShowAllHiddenDetailRows(
                        (currentValue) => !currentValue
                      )
                    }
                  />
                </ButtonRow>
              ) : null}
            </>
          ) : (
            <MutedText>{schemaModel.hiddenDetails.emptyText}</MutedText>
          )}
        </SectionBlock>

        <SectionBlock
          sectionId="more.reusable"
          title={schemaModel.reusableKnowledge.title}
        >
          <MutedText>{schemaModel.reusableKnowledge.detail}</MutedText>
          <ButtonRow>
            {schemaModel.reusableKnowledge.destinations.map((destination) => (
              <ActionButton
                accessibilityLabel={destination.openAccessibilityLabel}
                key={destination.id}
                label={destination.openLabel}
                onPress={() =>
                  router.push(getMobileRouteHref(destination.route))
                }
              />
            ))}
          </ButtonRow>
        </SectionBlock>

        <SectionBlock
          sectionId="more.lore"
          title={schemaModel.reusableKnowledge.loreDefinitionsTitle}
        >
          <MutedText>
            {schemaModel.reusableKnowledge.loreDefinitionsDetail}
          </MutedText>
          {schemaModel.reusableKnowledge.loreDefinitions.map((definition) => (
            <Fragment key={definition.id}>
              <MutedText>
                {definition.label}: {definition.countLabel}
              </MutedText>
              <ButtonRow>
                <ActionButton
                  accessibilityLabel={definition.openAccessibilityLabel}
                  label={definition.openLabel}
                  onPress={() =>
                    router.push(getMobileRouteHref(definition.route))
                  }
                />
              </ButtonRow>
            </Fragment>
          ))}
        </SectionBlock>

        {overview.destinations.map((destination) => (
          <SectionBlock
            key={destination.id}
            sectionId={`more.${destination.id}`}
            title={destination.title}
            testID={`more.${destination.id}`}
            onLayout={(event) => {
              setFocusedSectionOffset(
                destination.id,
                event.nativeEvent.layout.y
              );
            }}
          >
            <MutedText>{destination.detail}</MutedText>
            <ButtonRow>
              <ActionButton
                accessibilityLabel={formatWorkflowDestinationAccessibilityLabel(
                  destination
                )}
                label={destination.actionLabel}
                onPress={() =>
                  router.push(getMobileRouteHref(destination.path))
                }
              />
            </ButtonRow>
          </SectionBlock>
        ))}
      </MobileSectionDashboard>
    </ScreenScroll>
  );
}
