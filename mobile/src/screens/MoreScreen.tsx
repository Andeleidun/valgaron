import { Fragment, useEffect, useRef, useState } from 'react';
import { ScrollView } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import {
  emptyEntryTypeDraft,
  entryTypeDraftFields,
  formatUtilityOverviewActionAccessibilityLabel,
  formatWorkflowDestinationAccessibilityLabel,
  getCodexScreenIntro,
  getEntryTypeDraftFieldPreview,
  getFeedbackTone,
  getKnowledgeRouteFocusTargetId,
  getKnowledgeSchemaModel,
  getUtilitiesOverviewModel,
  getUtilitiesRouteFocusTargetId,
  knowledgeRouteFocusTargetIds,
  utilityRouteFocusTargetIds,
  workspaceFeatureActions,
  workspaceFeatureCopy,
  type EntryTypeDraft,
} from '@valgaron/core';
import { useMobileCodex } from '../state/MobileCodexContext';
import {
  getMobileRouteHref,
  mobileRouteFocusParam,
} from '../navigation/mobileRoutes';
import { getMobileRouteParam } from '../navigation/mobileRouteParams';
import {
  ActionButton,
  BodyText,
  ButtonRow,
  Field,
  MutedText,
  ScreenHeader,
  ScreenScroll,
  SectionBlock,
  StatusText,
} from './screenPrimitives';
import { confirmMobileDestructiveAction } from './mobileConfirm';

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
  const [showAllVocabularyRows, setShowAllVocabularyRows] = useState(false);
  const [showAllHiddenDetailRows, setShowAllHiddenDetailRows] = useState(false);
  const [showAllSchemaSections, setShowAllSchemaSections] = useState(false);
  const [
    showAllRelationshipFieldSummaries,
    setShowAllRelationshipFieldSummaries,
  ] = useState(false);
  const [expandedVocabularyValueRows, setExpandedVocabularyValueRows] =
    useState<Record<string, boolean>>({});
  const entryTypeFieldPreview = getEntryTypeDraftFieldPreview(
    entryTypeDraft.fields
  );
  const customTypes = schemaModel.sections.filter((section) => section.custom);
  const visibleVocabularyRows = showAllVocabularyRows
    ? schemaModel.vocabulary.rows
    : schemaModel.vocabulary.rows.slice(0, 5);
  const hiddenVocabularyRowCount =
    schemaModel.vocabulary.rows.length - visibleVocabularyRows.length;
  const visibleHiddenDetailRows = showAllHiddenDetailRows
    ? schemaModel.hiddenDetails.rows
    : schemaModel.hiddenDetails.rows.slice(0, 5);
  const hiddenDetailOverflowCount =
    schemaModel.hiddenDetails.rows.length - visibleHiddenDetailRows.length;
  const visibleSchemaSections = showAllSchemaSections
    ? schemaModel.sections
    : schemaModel.sections.slice(0, 4);
  const hiddenSchemaSectionCount =
    schemaModel.sections.length - visibleSchemaSections.length;
  const relationshipFieldSummaries = schemaModel.sections.flatMap((section) =>
    section.fields
      .filter((field) => field.targetSectionTitles.length > 0)
      .map((field) => ({
        field,
        section,
      }))
  );
  const visibleRelationshipFieldSummaries = showAllRelationshipFieldSummaries
    ? relationshipFieldSummaries
    : relationshipFieldSummaries.slice(0, 4);
  const hiddenRelationshipFieldSummaryCount =
    relationshipFieldSummaries.length -
    visibleRelationshipFieldSummaries.length;
  const customFieldDraftDescriptor = entryTypeDraftFields.find(
    (field) => field.key === 'fields'
  );
  const getFieldLabelDraftKey = (sectionId: string, fieldKey: string) =>
    `${sectionId}:${fieldKey}`;

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
        [sectionId]: 'Add at least one field.',
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
    setFieldLabelDrafts((current) => ({
      ...current,
      [draftKey]: value,
    }));
    setFieldLabelErrors((current) => ({
      ...current,
      [draftKey]: '',
    }));
  };

  const renameEntryTypeField = (
    sectionId: string,
    fieldKey: string,
    currentLabel: string
  ) => {
    const draftKey = getFieldLabelDraftKey(sectionId, fieldKey);
    const nextLabel = (fieldLabelDrafts[draftKey] ?? currentLabel).trim();
    if (!nextLabel) {
      setFieldLabelErrors((current) => ({
        ...current,
        [draftKey]: 'Field label is required.',
      }));
      return;
    }
    if (nextLabel === currentLabel) {
      return;
    }
    if (controller.renameEntryTypeField(sectionId, fieldKey, nextLabel)) {
      setFieldLabelDrafts((current) => ({
        ...current,
        [draftKey]: nextLabel,
      }));
      setFieldLabelErrors((current) => ({
        ...current,
        [draftKey]: '',
      }));
    }
  };

  return (
    <ScreenScroll scrollRef={scrollRef}>
      <ScreenHeader title={intro.title} detail={intro.detail} />

      <SectionBlock
        title="Project Tools"
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
        <MutedText>
          {overview.knowledgeSummary.metrics.slice(0, 3).join(', ')}.
        </MutedText>
        <MutedText>{overview.knowledgeSummary.metrics[3]}</MutedText>
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
          <MutedText>No cross-surface review hotspots need action.</MutedText>
        )}
      </SectionBlock>

      <SectionBlock title={schemaModel.title}>
        <MutedText>
          {schemaModel.totals.entryTypeCount} entry types,{' '}
          {schemaModel.totals.fieldCount} fields, and{' '}
          {schemaModel.totals.relationshipFieldCount} relationship-backed
          fields.
        </MutedText>
        <MutedText>
          {schemaModel.totals.hiddenDetailCount}{' '}
          {schemaModel.totals.hiddenDetailCount === 1
            ? 'hidden detail cleanup target'
            : 'hidden detail cleanup targets'}
          .
        </MutedText>
        {visibleSchemaSections.map((section) => (
          <MutedText key={section.id}>
            {section.title}: {section.fieldCount} fields,{' '}
            {section.relationshipFieldCount} linked.
          </MutedText>
        ))}
        {hiddenSchemaSectionCount > 0 ? (
          <MutedText>
            {hiddenSchemaSectionCount} more entry type
            {hiddenSchemaSectionCount === 1 ? '' : 's'}.
          </MutedText>
        ) : null}
        <ButtonRow>
          {visibleSchemaSections.map((section) => (
            <ActionButton
              key={section.id}
              label={`Open ${section.title}`}
              onPress={() => router.push(getMobileRouteHref(section.route))}
            />
          ))}
        </ButtonRow>
        {schemaModel.sections.length > 4 ? (
          <ButtonRow>
            <ActionButton
              expanded={showAllSchemaSections}
              label={
                showAllSchemaSections
                  ? 'Show Fewer Entry Types'
                  : `Show ${hiddenSchemaSectionCount} More Entry Types`
              }
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
            {hiddenRelationshipFieldSummaryCount} more relationship-backed field
            {hiddenRelationshipFieldSummaryCount === 1 ? '' : 's'}.
          </MutedText>
        ) : null}
        {relationshipFieldSummaries.length > 4 ? (
          <ButtonRow>
            <ActionButton
              expanded={showAllRelationshipFieldSummaries}
              label={
                showAllRelationshipFieldSummaries
                  ? 'Show Fewer Linked Fields'
                  : `Show ${hiddenRelationshipFieldSummaryCount} More Linked Fields`
              }
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
            label={schemaModel.typeSetup.actionLabel}
            onPress={() =>
              router.push(getMobileRouteHref(schemaModel.typeSetup.route))
            }
          />
          {schemaModel.totals.hiddenDetailCount > 0 ? (
            <ActionButton
              label="Review Cleanup"
              onPress={() =>
                router.push(
                  getMobileRouteHref(
                    `/knowledge#${knowledgeRouteFocusTargetIds.hiddenDetails}`
                  )
                )
              }
            />
          ) : null}
        </ButtonRow>
      </SectionBlock>

      <SectionBlock
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
        <MutedText>
          {schemaModel.typeSetup.customTypeCount} custom types in this
          workspace.
        </MutedText>
        {customTypes.length === 0 ? (
          <MutedText>
            No custom entry types yet. Create one when built-in sections are not
            enough.
          </MutedText>
        ) : null}
        {customTypes.map((section) => {
          const fieldDraft = entryTypeFieldDrafts[section.id] ?? '';
          const fieldPreview = getEntryTypeDraftFieldPreview(fieldDraft);
          return (
            <Fragment key={`${section.id}-fields`}>
              <MutedText>
                {section.title}: {section.fieldCount} fields,{' '}
                {section.entryCountLabel}.
              </MutedText>
              {section.fields.map((field, fieldIndex) => (
                <Fragment key={`${section.id}-${field.key}-order`}>
                  <MutedText>
                    {field.label}: {field.modeLabel}
                  </MutedText>
                  <Field
                    autoCapitalize="words"
                    label={`Rename ${field.label}`}
                    value={
                      fieldLabelDrafts[
                        getFieldLabelDraftKey(section.id, field.key)
                      ] ?? field.label
                    }
                    onChangeText={(value) =>
                      updateFieldLabelDraft(section.id, field.key, value)
                    }
                  />
                  <MutedText>Values stay saved under {field.key}.</MutedText>
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
                      label={workspaceFeatureActions.saveFieldLabel}
                      onPress={() =>
                        renameEntryTypeField(section.id, field.key, field.label)
                      }
                    />
                    <ActionButton
                      accessibilityLabel={`Move ${field.label} up`}
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
                      accessibilityLabel={`Move ${field.label} down`}
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
                      accessibilityHint="Removes this field from the custom type. Existing entry values stay saved as hidden details."
                      accessibilityLabel={`Remove ${field.label}`}
                      label={workspaceFeatureActions.removeField}
                      tone="danger"
                      onPress={() =>
                        confirmMobileDestructiveAction(
                          'remove-entry-type-field',
                          () =>
                            controller.removeEntryTypeField(
                              section.id,
                              field.key
                            )
                        )
                      }
                    />
                  </ButtonRow>
                </Fragment>
              ))}
              <Field
                autoCapitalize="words"
                autoCorrect={false}
                label={`Add fields to ${section.title}`}
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
                  New field preview:{' '}
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
                  label={`Open ${section.title}`}
                  onPress={() => router.push(getMobileRouteHref(section.route))}
                />
                <ActionButton
                  disabled={fieldPreview.length === 0}
                  label={workspaceFeatureActions.addFields}
                  onPress={() => addEntryTypeFields(section.id)}
                />
                <ActionButton
                  accessibilityHint="Deletes this custom entry type, its entries, and its relationships after confirmation."
                  accessibilityLabel={`Delete custom entry type ${section.title}`}
                  label={workspaceFeatureActions.deleteType}
                  tone="danger"
                  onPress={() =>
                    confirmMobileDestructiveAction('delete-entry-type', () =>
                      controller.permanentlyDeleteEntryType(section.id)
                    )
                  }
                />
              </ButtonRow>
            </Fragment>
          );
        })}
        {entryTypeDraftFields.map((field) => (
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
            Field preview:{' '}
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

      <SectionBlock title={schemaModel.vocabulary.title}>
        <MutedText>{schemaModel.vocabulary.detail}</MutedText>
        {visibleVocabularyRows.map((row) => (
          <Fragment key={row.id}>
            <MutedText>
              {row.sectionTitle} {row.fieldLabel}: {row.sourceLabel}.{' '}
              {row.summary}
            </MutedText>
            <MutedText>
              {(expandedVocabularyValueRows[row.id]
                ? row.values
                : row.values.slice(0, 4)
              ).join(', ')}
              {!expandedVocabularyValueRows[row.id] && row.values.length > 4
                ? `, and ${row.values.length - 4} more value${
                    row.values.length - 4 === 1 ? '' : 's'
                  }`
                : ''}
            </MutedText>
            <ButtonRow>
              <ActionButton
                label={`Open ${row.sectionTitle}`}
                onPress={() => router.push(getMobileRouteHref(row.route))}
              />
              {row.values.length > 4 ? (
                <ActionButton
                  expanded={Boolean(expandedVocabularyValueRows[row.id])}
                  label={
                    expandedVocabularyValueRows[row.id]
                      ? `Show Fewer ${row.fieldLabel} Values`
                      : `Show All ${row.fieldLabel} Values`
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
          </Fragment>
        ))}
        {schemaModel.vocabulary.rows.length > 5 ? (
          <ButtonRow>
            <ActionButton
              expanded={showAllVocabularyRows}
              label={
                showAllVocabularyRows
                  ? 'Show Fewer Value Rows'
                  : `Show ${hiddenVocabularyRowCount} More Value Rows`
              }
              onPress={() =>
                setShowAllVocabularyRows((currentValue) => !currentValue)
              }
            />
          </ButtonRow>
        ) : null}
      </SectionBlock>

      <SectionBlock
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
            <ButtonRow>
              <ActionButton
                label="Clear Hidden Details"
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
                    label="Review Entry"
                    onPress={() => router.push(getMobileRouteHref(row.route))}
                  />
                </ButtonRow>
              </Fragment>
            ))}
            {schemaModel.hiddenDetails.rows.length > 5 ? (
              <ButtonRow>
                <ActionButton
                  expanded={showAllHiddenDetailRows}
                  label={
                    showAllHiddenDetailRows
                      ? 'Show Fewer Cleanup Rows'
                      : `Show ${hiddenDetailOverflowCount} More Cleanup ${
                          hiddenDetailOverflowCount === 1 ? 'Row' : 'Rows'
                        }`
                  }
                  onPress={() =>
                    setShowAllHiddenDetailRows((currentValue) => !currentValue)
                  }
                />
              </ButtonRow>
            ) : null}
          </>
        ) : (
          <MutedText>No hidden detail cleanup targets.</MutedText>
        )}
      </SectionBlock>

      <SectionBlock title={schemaModel.reusableKnowledge.title}>
        <MutedText>{schemaModel.reusableKnowledge.detail}</MutedText>
        <ButtonRow>
          {schemaModel.reusableKnowledge.destinations.map((destination) => (
            <ActionButton
              key={destination.id}
              label={`Open ${destination.title}`}
              onPress={() => router.push(getMobileRouteHref(destination.route))}
            />
          ))}
        </ButtonRow>
      </SectionBlock>

      <SectionBlock title={schemaModel.reusableKnowledge.loreDefinitionsTitle}>
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
                label="Open Lore"
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
          title={destination.title}
          testID={`more.${destination.id}`}
          onLayout={(event) => {
            setFocusedSectionOffset(destination.id, event.nativeEvent.layout.y);
          }}
        >
          <MutedText>{destination.detail}</MutedText>
          <ButtonRow>
            <ActionButton
              accessibilityLabel={formatWorkflowDestinationAccessibilityLabel(
                destination
              )}
              label={destination.actionLabel}
              onPress={() => router.push(getMobileRouteHref(destination.path))}
            />
          </ButtonRow>
        </SectionBlock>
      ))}
    </ScreenScroll>
  );
}
