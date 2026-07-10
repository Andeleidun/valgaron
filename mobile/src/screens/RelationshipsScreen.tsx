import { useEffect, useMemo, useRef, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { Text, View, StyleSheet } from 'react-native';
import {
  buildRelationshipTextReviewBatchMigration,
  draftFromRelationship,
  draftFromEntry,
  formatExpansionControlLabel,
  formatHiddenCountText,
  getCodexHelpRoute,
  getCodexScreenIntro,
  getFeedbackTone,
  getEntries,
  getLimitedResultModel,
  getRelationshipEditorOptionsModel,
  getRelationshipFormHeaderModel,
  getRelationshipGraphNodeResultSummary,
  getRelationshipGraphViewModel,
  getRelationshipListModel,
  getRelationshipPickerItemActionModel,
  getRelationshipStudioModeModel,
  getRelationshipStudioReviewModel,
  getRelationshipTextReviewExactMatchLabel,
  getRelationshipTextReviewSummary,
  getRelationshipTextReviewUnresolvedLabel,
  getWorkbenchRecordPickerModel,
  hasUnsavedChanges,
  mobileFeatureDisplayLimits,
  relationshipFeatureCopy,
  relationshipReviewDisplayLimits,
  relationshipDirectionalControl,
  relationshipDraftStatusControl,
  relationshipGraphStatusFilterControl,
  relationshipGraphTypeFilterControl,
  relationshipListTypeFilterControl,
  relationshipNoteControl,
  relationshipSourceControl,
  relationshipTargetControl,
  relationshipTextReviewCopy,
  relationshipTypeControl,
  type RelationshipDraft,
  type RelationshipStudioModeId,
  type WorldEntryStatus,
} from '@valgaron/core';
import {
  valgaronColors,
  valgaronRadius,
  valgaronSpacing,
  valgaronTypography,
} from '@valgaron/ui-tokens';
import { useMobileCodex } from '../state/MobileCodexContext';
import { useMobileSectionPreferences } from '../state/useMobileSectionPreferences';
import { getMobileRouteHref } from '../navigation/mobileRoutes';
import { getMobileRouteParam } from '../navigation/mobileRouteParams';
import {
  ActionButton,
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
import { confirmDiscardUnsavedChangesOnMobile } from './unsavedChangesConfirm';

const relationshipDashboardSectionIds = [
  'links.mode',
  'links.health',
  'links.repair',
  'links.graph',
  'links.pickers',
  'links.editor',
  'links.saved',
  'links.review',
] as const;

export function RelationshipsScreen() {
  const controller = useMobileCodex();
  const dashboard = useMobileSectionPreferences({
    screenId: 'links',
    sectionIds: relationshipDashboardSectionIds,
  });
  const routeParams = useLocalSearchParams<{
    entryId?: string;
    entryQuery?: string;
    relationshipQuery?: string;
  }>();
  const requestedEntryId = getMobileRouteParam(routeParams.entryId);
  const requestedEntryQuery = getMobileRouteParam(routeParams.entryQuery);
  const requestedRelationshipQuery = getMobileRouteParam(
    routeParams.relationshipQuery
  );
  const routeKey = [
    controller.activeWorld.id,
    requestedEntryId ?? '',
    requestedEntryQuery ?? '',
    requestedRelationshipQuery ?? '',
  ].join('|');
  const intro = getCodexScreenIntro('relationships');
  const requestedEntryExists = requestedEntryId
    ? controller.sections.some((section) =>
        getEntries(controller.activeWorld.codex, section.id).some(
          (entry) => entry.id === requestedEntryId
        )
      )
    : false;
  const hasRouteRelationshipFocus = Boolean(
    requestedEntryId ||
      requestedEntryQuery !== undefined ||
      requestedRelationshipQuery !== undefined
  );
  const appliedRouteKeyRef = useRef(hasRouteRelationshipFocus ? routeKey : '');
  const [editingRelationshipId, setEditingRelationshipId] = useState<
    string | null
  >(null);
  const [draft, setDraft] = useState<RelationshipDraft>(() => {
    const nextDraft = controller.createRelationshipDraft();
    return requestedEntryId && requestedEntryExists
      ? { ...nextDraft, sourceEntryId: requestedEntryId }
      : nextDraft;
  });
  const [entryQuery, setEntryQuery] = useState(requestedEntryQuery ?? '');
  const [entryFilter, setEntryFilter] = useState(
    requestedEntryExists ? requestedEntryId ?? '' : ''
  );
  const [typeFilter, setTypeFilter] = useState('');
  const [relationshipQuery, setRelationshipQuery] = useState(
    requestedRelationshipQuery ?? requestedEntryQuery ?? ''
  );
  const [studioMode, setStudioMode] = useState<RelationshipStudioModeId>(
    hasRouteRelationshipFocus ? 'links' : 'review'
  );
  const [graphSectionFilter, setGraphSectionFilter] = useState('');
  const [graphStatusFilter, setGraphStatusFilter] = useState<
    WorldEntryStatus | ''
  >('');
  const [graphTagFilter, setGraphTagFilter] = useState('');
  const [graphTypeFilter, setGraphTypeFilter] = useState('');
  const [graphNodeQuery, setGraphNodeQuery] = useState('');
  const [selectedGraphNodeId, setSelectedGraphNodeId] = useState<string | null>(
    null
  );
  const [showAllGraphNodes, setShowAllGraphNodes] = useState(false);
  const [showAllOrphanedEntries, setShowAllOrphanedEntries] = useState(false);
  const [showAllDuplicateGroups, setShowAllDuplicateGroups] = useState(false);
  const [showAllLegacyTextItems, setShowAllLegacyTextItems] = useState(false);
  const [showAllEntryPickerRecords, setShowAllEntryPickerRecords] =
    useState(false);
  const [showAllRelationshipResults, setShowAllRelationshipResults] =
    useState(false);
  const entryPickerModel = getWorkbenchRecordPickerModel(
    controller.activeWorld,
    {
      limit: showAllEntryPickerRecords
        ? Number.MAX_SAFE_INTEGER
        : mobileFeatureDisplayLimits.pickerResults,
      query: entryQuery,
      selectedEntryIds: [draft.sourceEntryId, draft.targetEntryId].filter(
        Boolean
      ),
    }
  );
  const entries = entryPickerModel.items;
  const displayedEntries = entryPickerModel.visibleItems;
  const hiddenEntryCount = entryPickerModel.hiddenCount;
  const relationshipItems = getRelationshipListModel(controller.activeWorld, {
    entryId: entryFilter,
    query: relationshipQuery,
    type: typeFilter,
  });
  const relationshipResultModel = getLimitedResultModel(
    relationshipItems,
    showAllRelationshipResults
      ? relationshipItems.length
      : mobileFeatureDisplayLimits.relationshipResults
  );
  const displayedRelationshipItems = relationshipResultModel.visibleItems;
  const hiddenRelationshipCount = relationshipResultModel.hiddenCount;
  const relationshipOptions = useMemo(
    () =>
      getRelationshipEditorOptionsModel(
        controller.activeWorld,
        draft,
        entryFilter
      ),
    [
      controller.activeWorld,
      draft.sourceEntryId,
      draft.targetEntryId,
      entryFilter,
    ]
  );
  const relationshipEntries = relationshipOptions.entries;
  const relationshipEntryOptions = relationshipOptions.entryOptions;
  const selectedEntryFilter = relationshipOptions.selectedEntryFilter;
  const relationshipReview = getRelationshipStudioReviewModel(
    controller.activeWorld
  );
  const studioModeModel = getRelationshipStudioModeModel(studioMode);
  const showReviewMode = studioModeModel.activeMode.id === 'review';
  const showGraphMode = studioModeModel.activeMode.id === 'graph';
  const showLinksMode = studioModeModel.activeMode.id === 'links';
  const showBulkEditMode = studioModeModel.activeMode.id === 'bulk-edit';
  const brokenRelationships = relationshipReview.brokenRelationships;
  const orphanedEntries = relationshipReview.orphanedEntries;
  const duplicateRelationshipGroups =
    relationshipReview.duplicateRelationshipGroups;
  const legacyTextItems = relationshipReview.legacyTextItems;
  const exactLegacyTextItems = legacyTextItems.filter(
    (item) => item.exactMatchCount > 0
  );
  const editableEntryById = useMemo(
    () =>
      new Map(
        controller.sections.flatMap((section) =>
          getEntries(controller.activeWorld.codex, section.id).map((entry) => [
            entry.id,
            { entry, section },
          ])
        )
      ),
    [controller.activeWorld.codex, controller.sections]
  );
  const relationshipTypeFilterOptions =
    relationshipOptions.relationshipTypeFilterOptions;
  const availableGraphTags = relationshipOptions.graphTagOptions;
  const relationshipTypeSuggestions =
    relationshipOptions.relationshipTypeSuggestions;
  const graphView = getRelationshipGraphViewModel(controller.activeWorld, {
    sectionId: graphSectionFilter,
    status: graphStatusFilter,
    tag: graphTagFilter,
    type: graphTypeFilter,
  });
  const normalizedGraphNodeQuery = graphNodeQuery.trim().toLowerCase();
  const matchingGraphNodes = normalizedGraphNodeQuery
    ? graphView.nodes.filter((node) =>
        [
          node.id,
          node.name,
          node.sectionId,
          node.sectionTitle,
          node.status,
          ...node.tags,
        ].some((value) =>
          value.toLowerCase().includes(normalizedGraphNodeQuery)
        )
      )
    : graphView.nodes;
  const graphNodeModel = getLimitedResultModel(
    matchingGraphNodes,
    showAllGraphNodes
      ? matchingGraphNodes.length
      : mobileFeatureDisplayLimits.pickerResults
  );
  const displayedGraphNodes = graphNodeModel.visibleItems;
  const hiddenGraphNodeCount = graphNodeModel.hiddenCount;
  const selectedGraphNode = selectedGraphNodeId
    ? matchingGraphNodes.find((node) => node.id === selectedGraphNodeId) ?? null
    : null;
  const selectedGraphEdges = selectedGraphNode
    ? graphView.edges.filter(
        (edge) =>
          edge.sourceId === selectedGraphNode.id ||
          edge.targetId === selectedGraphNode.id
      )
    : [];
  const hasGraphFilters = Boolean(
    graphSectionFilter ||
      graphStatusFilter ||
      graphTagFilter ||
      graphTypeFilter ||
      graphNodeQuery
  );
  const orphanedEntryModel = getLimitedResultModel(
    orphanedEntries,
    showAllOrphanedEntries
      ? orphanedEntries.length
      : relationshipReviewDisplayLimits.orphanedEntries
  );
  const visibleOrphanedEntries = orphanedEntryModel.visibleItems;
  const hiddenOrphanedEntryCount = orphanedEntryModel.hiddenCount;
  const duplicateRelationshipGroupModel = getLimitedResultModel(
    duplicateRelationshipGroups,
    showAllDuplicateGroups
      ? duplicateRelationshipGroups.length
      : relationshipReviewDisplayLimits.duplicateRelationshipGroups
  );
  const visibleDuplicateRelationshipGroups =
    duplicateRelationshipGroupModel.visibleItems;
  const hiddenDuplicateRelationshipGroupCount =
    duplicateRelationshipGroupModel.hiddenCount;
  const legacyTextReviewModel = getLimitedResultModel(
    legacyTextItems,
    showAllLegacyTextItems
      ? legacyTextItems.length
      : relationshipReviewDisplayLimits.legacyTextItems
  );
  const visibleLegacyTextItems = legacyTextReviewModel.visibleItems;
  const hiddenLegacyTextItemCount = legacyTextReviewModel.hiddenCount;
  const editingRelationship = editingRelationshipId
    ? controller.activeWorld.relationships.find(
        (relationship) => relationship.id === editingRelationshipId
      ) ?? null
    : null;
  const baselineDraft = editingRelationship
    ? draftFromRelationship(editingRelationship)
    : controller.createRelationshipDraft();
  const isDraftDirty = hasUnsavedChanges(baselineDraft, draft);
  const relationshipFormHeaderModel =
    getRelationshipFormHeaderModel(editingRelationship);

  useEffect(() => {
    if (appliedRouteKeyRef.current === routeKey) {
      return;
    }
    if (
      !requestedEntryId &&
      requestedEntryQuery === undefined &&
      requestedRelationshipQuery === undefined
    ) {
      appliedRouteKeyRef.current = routeKey;
      return;
    }
    const applyRouteState = () => {
      setStudioMode('links');
      if (requestedEntryQuery !== undefined) {
        setEntryQuery(requestedEntryQuery);
      }
      const nextRelationshipQuery =
        requestedRelationshipQuery ?? requestedEntryQuery;
      if (nextRelationshipQuery !== undefined) {
        setRelationshipQuery(nextRelationshipQuery);
      }
      if (requestedEntryId) {
        const requestedEntry = relationshipEntries.find(
          (entry) => entry.id === requestedEntryId
        );
        if (!requestedEntry) {
          appliedRouteKeyRef.current = routeKey;
          return;
        }
        setEntryFilter(requestedEntryId);
        setDraft((current) => ({
          ...current,
          sourceEntryId: requestedEntryId,
        }));
      }
      appliedRouteKeyRef.current = routeKey;
    };

    if (
      requestedEntryId &&
      requestedEntryId !== draft.sourceEntryId &&
      isDraftDirty
    ) {
      confirmDiscardUnsavedChangesOnMobile(true, applyRouteState, () => {
        appliedRouteKeyRef.current = routeKey;
      });
      return;
    }
    applyRouteState();
  }, [
    controller.activeWorld.codex,
    controller.activeWorld.id,
    controller.activeWorld.entryTypes,
    draft.sourceEntryId,
    isDraftDirty,
    relationshipEntries,
    requestedEntryId,
    requestedEntryQuery,
    requestedRelationshipQuery,
  ]);

  useEffect(() => {
    setShowAllGraphNodes(false);
  }, [
    controller.activeWorld.id,
    graphNodeQuery,
    graphSectionFilter,
    graphStatusFilter,
    graphTagFilter,
    graphTypeFilter,
  ]);

  useEffect(() => {
    setShowAllEntryPickerRecords(false);
  }, [controller.activeWorld.id, entryQuery]);

  useEffect(() => {
    setShowAllRelationshipResults(false);
  }, [controller.activeWorld.id, entryFilter, relationshipQuery, typeFilter]);

  function resetDraft(force = false) {
    const reset = () => {
      setEditingRelationshipId(null);
      setDraft(controller.createRelationshipDraft());
    };
    if (force) {
      reset();
      return;
    }
    confirmDiscardUnsavedChangesOnMobile(isDraftDirty, reset);
  }

  function editRelationship(relationshipId: string) {
    const relationship = controller.activeWorld.relationships.find(
      (item) => item.id === relationshipId
    );
    if (!relationship) {
      return;
    }
    if (relationship.id === editingRelationshipId) {
      setStudioMode('links');
      return;
    }
    confirmDiscardUnsavedChangesOnMobile(isDraftDirty, () => {
      setEditingRelationshipId(relationship.id);
      setDraft(draftFromRelationship(relationship));
      setStudioMode('links');
    });
  }

  function repairRelationship(relationshipId: string) {
    editRelationship(relationshipId);
  }

  function clearGraphFilters() {
    setGraphSectionFilter('');
    setGraphStatusFilter('');
    setGraphTagFilter('');
    setGraphTypeFilter('');
    setGraphNodeQuery('');
    setSelectedGraphNodeId(null);
    setShowAllGraphNodes(false);
  }

  function deleteRelationship(relationshipId: string) {
    const relationship = relationshipItems.find(
      (item) => item.id === relationshipId
    );
    const subjectName = relationship
      ? `${relationship.sourceName} ${relationship.type} ${relationship.targetName}`
      : undefined;
    confirmDiscardUnsavedChangesOnMobile(
      editingRelationshipId === relationshipId && isDraftDirty,
      () =>
        confirmMobileDestructiveAction(
          'delete-relationship',
          () => {
            controller.removeRelationship(relationshipId);
            if (editingRelationshipId === relationshipId) {
              resetDraft(true);
            }
          },
          subjectName
        )
    );
  }

  function migrateExactLegacyText() {
    if (exactLegacyTextItems.length === 0 || isDraftDirty) {
      return;
    }
    const migration = buildRelationshipTextReviewBatchMigration({
      codex: controller.activeWorld.codex,
      items: exactLegacyTextItems,
      relationships: controller.activeWorld.relationships,
      sections: controller.sections,
    });
    migration.relationshipIdsToDelete.forEach((relationshipId) => {
      controller.unlinkRelationship(relationshipId);
    });
    migration.relationshipsToSave.forEach(
      ({ relationship, existingRelationship }) => {
        controller.saveRelationshipDraft(relationship, existingRelationship);
      }
    );
    const updatedAt = new Date().toISOString();
    for (const update of migration.entryFieldUpdates) {
      const target = editableEntryById.get(update.entryId);
      if (!target) {
        continue;
      }
      controller.saveEntryDraft(
        target.section,
        draftFromEntry(
          {
            ...target.entry,
            fields: update.fields,
            updatedAt,
          },
          target.section
        ),
        target.entry
      );
    }
  }

  function deleteDuplicateRelationships() {
    if (duplicateRelationshipGroups.length === 0 || isDraftDirty) {
      return;
    }
    duplicateRelationshipGroups
      .flatMap((group) => group.duplicateRelationshipIds)
      .forEach(controller.unlinkRelationship);
  }

  return (
    <ScreenScroll>
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
        <SectionBlock sectionId="links.mode" title={studioModeModel.title}>
          <MutedText>{studioModeModel.activeMode.detail}</MutedText>
          <ButtonRow>
            {studioModeModel.modes.map((mode) => (
              <ActionButton
                key={mode.id}
                label={mode.label}
                selected={mode.isActive}
                tone={mode.isActive ? 'accent' : 'neutral'}
                onPress={() => setStudioMode(mode.id)}
              />
            ))}
          </ButtonRow>
        </SectionBlock>

        {showReviewMode ? (
          <SectionBlock
            sectionId="links.health"
            title={relationshipFeatureCopy.healthSectionTitle}
          >
            <ButtonRow>
              <ActionButton
                label={relationshipFeatureCopy.helpLabel}
                onPress={() =>
                  confirmDiscardUnsavedChangesOnMobile(isDraftDirty, () =>
                    router.push({
                      ...getMobileRouteHref(getCodexHelpRoute('relationships')),
                    })
                  )
                }
              />
            </ButtonRow>
            {relationshipReview.reviewSummary.items.map((item) => (
              <MutedText key={item.id}>
                {item.title}: {item.countLabel}. {item.detail}
              </MutedText>
            ))}
            <MutedText>
              {relationshipFeatureCopy.graphViewTitle}: {graphView.summaryLabel}
            </MutedText>
          </SectionBlock>
        ) : null}

        {showReviewMode ? (
          <SectionBlock
            sectionId="links.repair"
            title={relationshipFeatureCopy.repairBrokenLinksTitle}
          >
            {brokenRelationships.length > 0 ? (
              brokenRelationships.map((relationship) => (
                <View key={relationship.id} style={styles.relationshipRow}>
                  <Text style={styles.entryTitle}>{relationship.type}</Text>
                  <MutedText>{relationship.sourceLineLabel}</MutedText>
                  <MutedText>{relationship.targetLineLabel}</MutedText>
                  <ButtonRow>
                    <ActionButton
                      accessibilityLabel={relationship.repairAccessibilityLabel}
                      label={relationshipFeatureCopy.repairLabel}
                      tone="accent"
                      onPress={() => repairRelationship(relationship.id)}
                    />
                    <ActionButton
                      accessibilityHint={relationship.deleteAccessibilityHint}
                      accessibilityLabel={relationship.deleteAccessibilityLabel}
                      label={relationshipFeatureCopy.deleteLabel}
                      tone="danger"
                      onPress={() => deleteRelationship(relationship.id)}
                    />
                  </ButtonRow>
                </View>
              ))
            ) : (
              <MutedText>
                {relationshipFeatureCopy.noBrokenRelationshipsTitle}
              </MutedText>
            )}
            {orphanedEntries.length > 0 ? (
              <>
                <MutedText>
                  {relationshipFeatureCopy.orphanedRecordsLabel}
                </MutedText>
                {visibleOrphanedEntries.map((entry) => (
                  <View key={entry.id} style={styles.relationshipRow}>
                    <Text style={styles.entryTitle}>{entry.name}</Text>
                    <MutedText>{entry.sectionTitle}</MutedText>
                    <ButtonRow>
                      <ActionButton
                        accessibilityLabel={entry.manageLinksAccessibilityLabel}
                        label={entry.manageLinksLabel}
                        onPress={() =>
                          confirmDiscardUnsavedChangesOnMobile(
                            isDraftDirty,
                            () => {
                              setEntryFilter(entry.id);
                              setEntryQuery(entry.name);
                              setRelationshipQuery(entry.name);
                              setDraft((current) => ({
                                ...current,
                                sourceEntryId: entry.id,
                              }));
                              setStudioMode('links');
                            }
                          )
                        }
                      />
                    </ButtonRow>
                  </View>
                ))}
                {hiddenOrphanedEntryCount > 0 ? (
                  <MutedText>
                    {formatHiddenCountText({
                      hiddenCount: hiddenOrphanedEntryCount,
                      singularItemLabel: 'orphaned record',
                      pluralItemLabel: 'orphaned records',
                    })}
                  </MutedText>
                ) : null}
                {orphanedEntries.length >
                relationshipReviewDisplayLimits.orphanedEntries ? (
                  <ButtonRow>
                    <ActionButton
                      expanded={showAllOrphanedEntries}
                      label={formatExpansionControlLabel({
                        isExpanded: showAllOrphanedEntries,
                        hiddenCount: hiddenOrphanedEntryCount,
                        pluralItemLabel: 'Orphaned Records',
                        singularItemLabel: 'Orphaned Record',
                      })}
                      onPress={() =>
                        setShowAllOrphanedEntries(
                          (currentValue) => !currentValue
                        )
                      }
                    />
                  </ButtonRow>
                ) : null}
              </>
            ) : (
              <MutedText>
                {relationshipFeatureCopy.noOrphanedRecordsMessage}
              </MutedText>
            )}
            {duplicateRelationshipGroups.length > 0 ? (
              <>
                <MutedText>
                  {relationshipFeatureCopy.duplicateRelationshipsLabel}
                </MutedText>
                <MutedText>
                  {relationshipFeatureCopy.duplicateRelationshipsDetail}
                </MutedText>
                {visibleDuplicateRelationshipGroups.map((group) => (
                  <View key={group.id} style={styles.relationshipRow}>
                    <Text style={styles.entryTitle}>
                      {group.sourceName} - {group.targetName}
                    </Text>
                    <MutedText>{group.type}</MutedText>
                    <MutedText>{group.removalSummaryLabel}</MutedText>
                  </View>
                ))}
                {hiddenDuplicateRelationshipGroupCount > 0 ? (
                  <MutedText>
                    {formatHiddenCountText({
                      hiddenCount: hiddenDuplicateRelationshipGroupCount,
                      singularItemLabel: 'duplicate group',
                      pluralItemLabel: 'duplicate groups',
                    })}
                  </MutedText>
                ) : null}
                {duplicateRelationshipGroups.length >
                relationshipReviewDisplayLimits.duplicateRelationshipGroups ? (
                  <ButtonRow>
                    <ActionButton
                      expanded={showAllDuplicateGroups}
                      label={formatExpansionControlLabel({
                        isExpanded: showAllDuplicateGroups,
                        hiddenCount: hiddenDuplicateRelationshipGroupCount,
                        pluralItemLabel: 'Duplicate Groups',
                        singularItemLabel: 'Duplicate Group',
                      })}
                      onPress={() =>
                        setShowAllDuplicateGroups(
                          (currentValue) => !currentValue
                        )
                      }
                    />
                  </ButtonRow>
                ) : null}
              </>
            ) : null}
            {legacyTextItems.length > 0 ? (
              <>
                <MutedText>{relationshipTextReviewCopy.title}</MutedText>
                <MutedText>
                  {getRelationshipTextReviewSummary(legacyTextItems.length)}
                </MutedText>
                {visibleLegacyTextItems.map((item) => (
                  <View
                    key={`${item.entryId}-${item.fieldKey}`}
                    style={styles.relationshipRow}
                  >
                    <Text style={styles.entryTitle}>{item.entryName}</Text>
                    <MutedText>{item.fieldLabel}</MutedText>
                    <MutedText>
                      {relationshipTextReviewCopy.unresolvedLabel}:{' '}
                      {getRelationshipTextReviewUnresolvedLabel(item)}.{' '}
                      {getRelationshipTextReviewExactMatchLabel(item)}
                    </MutedText>
                    <ButtonRow>
                      <ActionButton
                        accessibilityLabel={item.reviewEntryAccessibilityLabel}
                        label={item.reviewEntryLabel}
                        onPress={() => {
                          confirmDiscardUnsavedChangesOnMobile(
                            isDraftDirty,
                            () => {
                              router.push({
                                ...getMobileRouteHref(item.reviewEntryRoute),
                              });
                            }
                          );
                        }}
                      />
                    </ButtonRow>
                  </View>
                ))}
                {hiddenLegacyTextItemCount > 0 ? (
                  <MutedText>
                    {formatHiddenCountText({
                      hiddenCount: hiddenLegacyTextItemCount,
                      singularItemLabel: 'legacy text item',
                      pluralItemLabel: 'legacy text items',
                    })}
                  </MutedText>
                ) : null}
                {legacyTextItems.length >
                relationshipReviewDisplayLimits.legacyTextItems ? (
                  <ButtonRow>
                    <ActionButton
                      expanded={showAllLegacyTextItems}
                      label={formatExpansionControlLabel({
                        isExpanded: showAllLegacyTextItems,
                        hiddenCount: hiddenLegacyTextItemCount,
                        pluralItemLabel: 'Legacy Text Items',
                        singularItemLabel: 'Legacy Text Item',
                      })}
                      onPress={() =>
                        setShowAllLegacyTextItems(
                          (currentValue) => !currentValue
                        )
                      }
                    />
                  </ButtonRow>
                ) : null}
              </>
            ) : null}
          </SectionBlock>
        ) : null}

        {showGraphMode ? (
          <SectionBlock
            sectionId="links.graph"
            title={relationshipFeatureCopy.graphBrowserTitle}
          >
            <Field
              autoCapitalize="none"
              autoCorrect={false}
              label={relationshipFeatureCopy.searchGraphRecordsLabel}
              value={graphNodeQuery}
              onChangeText={setGraphNodeQuery}
              placeholder={
                relationshipFeatureCopy.searchGraphRecordsPlaceholder
              }
            />
            <ButtonRow>
              <ActionButton
                label={relationshipFeatureCopy.anySectionLabel}
                selected={graphSectionFilter === ''}
                tone={graphSectionFilter === '' ? 'accent' : 'neutral'}
                onPress={() => setGraphSectionFilter('')}
              />
              {controller.sections.map((item) => (
                <ActionButton
                  key={item.id}
                  label={item.title}
                  selected={graphSectionFilter === item.id}
                  tone={graphSectionFilter === item.id ? 'accent' : 'neutral'}
                  onPress={() =>
                    setGraphSectionFilter((current) =>
                      current === item.id ? '' : item.id
                    )
                  }
                />
              ))}
            </ButtonRow>
            <SelectField
              accessibilityLabel={
                relationshipGraphStatusFilterControl.accessibilityLabel
              }
              label={relationshipGraphStatusFilterControl.label}
              options={relationshipGraphStatusFilterControl.options}
              value={graphStatusFilter}
              onValueChange={setGraphStatusFilter}
            />
            {relationshipTypeFilterOptions.length > 1 ? (
              <SelectField
                accessibilityLabel={
                  relationshipGraphTypeFilterControl.accessibilityLabel
                }
                label={relationshipGraphTypeFilterControl.label}
                options={relationshipTypeFilterOptions}
                value={graphTypeFilter}
                onValueChange={setGraphTypeFilter}
              />
            ) : null}
            {availableGraphTags.length > 0 ? (
              <ButtonRow>
                <ActionButton
                  label={relationshipFeatureCopy.allTagsLabel}
                  selected={graphTagFilter === ''}
                  tone={graphTagFilter === '' ? 'accent' : 'neutral'}
                  onPress={() => setGraphTagFilter('')}
                />
                {availableGraphTags.map((tag) => (
                  <ActionButton
                    key={tag}
                    label={tag}
                    selected={graphTagFilter === tag}
                    tone={graphTagFilter === tag ? 'accent' : 'neutral'}
                    onPress={() =>
                      setGraphTagFilter((current) =>
                        current === tag ? '' : tag
                      )
                    }
                  />
                ))}
              </ButtonRow>
            ) : null}
            {hasGraphFilters ? (
              <ButtonRow>
                <ActionButton
                  label={relationshipFeatureCopy.clearGraphFiltersLabel}
                  onPress={clearGraphFilters}
                />
              </ButtonRow>
            ) : null}
            {graphView.nodes.length > 0 ? (
              <>
                <MutedText>
                  {getRelationshipGraphNodeResultSummary({
                    matchedCount: matchingGraphNodes.length,
                    totalCount: graphView.nodes.length,
                  })}
                </MutedText>
                {displayedGraphNodes.length > 0 ? (
                  <ButtonRow>
                    {displayedGraphNodes.map((node) => (
                      <ActionButton
                        key={node.id}
                        label={node.name}
                        selected={selectedGraphNodeId === node.id}
                        tone={
                          selectedGraphNodeId === node.id ? 'accent' : 'neutral'
                        }
                        onPress={() =>
                          setSelectedGraphNodeId((current) =>
                            current === node.id ? null : node.id
                          )
                        }
                      />
                    ))}
                  </ButtonRow>
                ) : (
                  <MutedText>
                    {relationshipFeatureCopy.noGraphSearchMatchesMessage}
                  </MutedText>
                )}
                {hiddenGraphNodeCount > 0 ? (
                  <MutedText>
                    {formatHiddenCountText({
                      hiddenCount: hiddenGraphNodeCount,
                      singularItemLabel: 'graph record',
                      pluralItemLabel: 'graph records',
                    })}
                  </MutedText>
                ) : null}
                {matchingGraphNodes.length >
                mobileFeatureDisplayLimits.pickerResults ? (
                  <ButtonRow>
                    <ActionButton
                      expanded={showAllGraphNodes}
                      label={formatExpansionControlLabel({
                        isExpanded: showAllGraphNodes,
                        hiddenCount: hiddenGraphNodeCount,
                        pluralItemLabel: 'Graph Records',
                        singularItemLabel: 'Graph Record',
                      })}
                      onPress={() =>
                        setShowAllGraphNodes((currentValue) => !currentValue)
                      }
                    />
                  </ButtonRow>
                ) : null}
                {selectedGraphNode ? (
                  <View style={styles.relationshipRow}>
                    <Text style={styles.entryTitle}>
                      {selectedGraphNode.name}
                    </Text>
                    <MutedText>
                      {selectedGraphNode.sectionTitle} -{' '}
                      {selectedGraphNode.statusLabel}
                    </MutedText>
                    {selectedGraphEdges.map((edge) => (
                      <View key={edge.id} style={styles.graphEdgeRow}>
                        <MutedText>
                          {edge.sourceName} {edge.directionLabel}{' '}
                          {edge.targetName} - {edge.label}
                        </MutedText>
                        <ButtonRow>
                          <ActionButton
                            accessibilityLabel={edge.editAccessibilityLabel}
                            label={edge.editLabel}
                            onPress={() => editRelationship(edge.id)}
                          />
                        </ButtonRow>
                      </View>
                    ))}
                    <ButtonRow>
                      <ActionButton
                        accessibilityLabel={
                          selectedGraphNode.openEntryAccessibilityLabel
                        }
                        label={selectedGraphNode.openEntryLabel}
                        onPress={() =>
                          confirmDiscardUnsavedChangesOnMobile(
                            isDraftDirty,
                            () => {
                              router.push({
                                ...getMobileRouteHref(
                                  selectedGraphNode.contextRoute
                                ),
                              });
                            }
                          )
                        }
                      />
                      <ActionButton
                        accessibilityLabel={
                          selectedGraphNode.filterListAccessibilityLabel
                        }
                        label={selectedGraphNode.filterListLabel}
                        onPress={() => {
                          setEntryFilter(selectedGraphNode.id);
                          setStudioMode('links');
                        }}
                      />
                    </ButtonRow>
                  </View>
                ) : null}
              </>
            ) : (
              <MutedText>
                {relationshipFeatureCopy.noConnectedGraphMatchesMessage}
              </MutedText>
            )}
          </SectionBlock>
        ) : null}

        {showLinksMode ? (
          <SectionBlock
            sectionId="links.pickers"
            title={relationshipFeatureCopy.entryPickersTitle}
          >
            <Field
              autoCapitalize="none"
              autoCorrect={false}
              label={relationshipFeatureCopy.searchEntriesLabel}
              value={entryQuery}
              onChangeText={setEntryQuery}
              placeholder={relationshipFeatureCopy.searchEntriesPlaceholder}
            />
            {entries.length > 0 ? (
              <>
                {displayedEntries.map((entry) => {
                  const pickerActions =
                    getRelationshipPickerItemActionModel(entry);
                  return (
                    <View key={entry.id} style={styles.entryPickerRow}>
                      <View style={styles.entryText}>
                        <Text style={styles.entryTitle}>{entry.label}</Text>
                        <MutedText>{entry.detailText}</MutedText>
                      </View>
                      <ButtonRow>
                        <ActionButton
                          accessibilityLabel={
                            pickerActions.sourceAccessibilityLabel
                          }
                          label={pickerActions.sourceLabel}
                          selected={draft.sourceEntryId === entry.id}
                          tone={
                            draft.sourceEntryId === entry.id
                              ? 'accent'
                              : 'neutral'
                          }
                          onPress={() =>
                            setDraft((current) => ({
                              ...current,
                              sourceEntryId: entry.id,
                            }))
                          }
                        />
                        <ActionButton
                          accessibilityLabel={
                            pickerActions.targetAccessibilityLabel
                          }
                          label={pickerActions.targetLabel}
                          selected={draft.targetEntryId === entry.id}
                          tone={
                            draft.targetEntryId === entry.id
                              ? 'accent'
                              : 'neutral'
                          }
                          onPress={() =>
                            setDraft((current) => ({
                              ...current,
                              targetEntryId: entry.id,
                            }))
                          }
                        />
                      </ButtonRow>
                    </View>
                  );
                })}
                {hiddenEntryCount > 0 ? (
                  <MutedText>
                    {formatHiddenCountText({
                      hiddenCount: hiddenEntryCount,
                      singularItemLabel: 'record',
                      pluralItemLabel: 'records',
                    })}
                  </MutedText>
                ) : null}
                {entries.length > mobileFeatureDisplayLimits.pickerResults ? (
                  <ButtonRow>
                    <ActionButton
                      expanded={showAllEntryPickerRecords}
                      label={formatExpansionControlLabel({
                        isExpanded: showAllEntryPickerRecords,
                        hiddenCount: hiddenEntryCount,
                        pluralItemLabel: 'Entry Records',
                        singularItemLabel: 'Entry Record',
                      })}
                      onPress={() =>
                        setShowAllEntryPickerRecords(
                          (currentValue) => !currentValue
                        )
                      }
                    />
                  </ButtonRow>
                ) : null}
              </>
            ) : (
              <MutedText>{entryPickerModel.emptyText}</MutedText>
            )}
          </SectionBlock>
        ) : null}

        {showLinksMode ? (
          <SectionBlock
            sectionId="links.editor"
            title={relationshipFormHeaderModel.title}
          >
            {controller.formMessage ? (
              <StatusText tone={getFeedbackTone(controller.formMessage)}>
                {controller.formMessage}
              </StatusText>
            ) : null}
            {isDraftDirty ? (
              <StatusText tone="warning">
                {relationshipFormHeaderModel.unsavedDraftLabel}
              </StatusText>
            ) : null}
            {relationshipEntries.length < 2 ? (
              <StatusText tone="warning">
                {relationshipFeatureCopy.minimumEntriesTitle}{' '}
                {relationshipFeatureCopy.minimumEntriesDetail}
              </StatusText>
            ) : (
              <>
                <SelectField
                  accessibilityLabel={
                    relationshipSourceControl.accessibilityLabel
                  }
                  label={relationshipSourceControl.label}
                  options={relationshipEntryOptions}
                  searchable
                  searchPlaceholder={
                    relationshipFeatureCopy.searchEntriesPlaceholder
                  }
                  value={draft.sourceEntryId}
                  onValueChange={(value) =>
                    setDraft((current) => ({
                      ...current,
                      sourceEntryId: value,
                    }))
                  }
                />
                {relationshipOptions.selectedSourceSummaryLabel ? (
                  <MutedText>
                    {relationshipOptions.selectedSourceSummaryLabel}
                  </MutedText>
                ) : null}
                <SelectField
                  accessibilityLabel={
                    relationshipTargetControl.accessibilityLabel
                  }
                  label={relationshipTargetControl.label}
                  options={relationshipEntryOptions}
                  searchable
                  searchPlaceholder={
                    relationshipFeatureCopy.searchEntriesPlaceholder
                  }
                  value={draft.targetEntryId}
                  onValueChange={(value) =>
                    setDraft((current) => ({
                      ...current,
                      targetEntryId: value,
                    }))
                  }
                />
                {relationshipOptions.selectedTargetSummaryLabel ? (
                  <MutedText>
                    {relationshipOptions.selectedTargetSummaryLabel}
                  </MutedText>
                ) : null}
                <Field
                  label={relationshipTypeControl.label}
                  placeholder={relationshipTypeControl.placeholder}
                  value={draft.type}
                  onChangeText={(value) =>
                    setDraft((current) => ({ ...current, type: value }))
                  }
                />
                <ButtonRow>
                  {relationshipTypeSuggestions
                    .slice(
                      0,
                      mobileFeatureDisplayLimits.relationshipTypeSuggestions
                    )
                    .map((type) => (
                      <ActionButton
                        key={type}
                        label={type}
                        selected={draft.type === type}
                        tone={draft.type === type ? 'accent' : 'neutral'}
                        onPress={() =>
                          setDraft((current) => ({ ...current, type }))
                        }
                      />
                    ))}
                </ButtonRow>
                <Field
                  label={relationshipNoteControl.label}
                  placeholder={relationshipNoteControl.placeholder}
                  value={draft.note}
                  multiline
                  onChangeText={(value) =>
                    setDraft((current) => ({ ...current, note: value }))
                  }
                />
                <CheckboxField
                  accessibilityLabel={
                    relationshipDirectionalControl.accessibilityLabel
                  }
                  checked={draft.directional}
                  label={relationshipDirectionalControl.label}
                  onChange={(checked) =>
                    setDraft((current) => ({
                      ...current,
                      directional: checked,
                    }))
                  }
                />
                <SelectField
                  accessibilityLabel={
                    relationshipDraftStatusControl.accessibilityLabel
                  }
                  label={relationshipDraftStatusControl.label}
                  options={relationshipDraftStatusControl.options}
                  value={draft.status}
                  onValueChange={(value) =>
                    setDraft((current) => ({
                      ...current,
                      status: value,
                    }))
                  }
                />
                <ButtonRow>
                  <ActionButton
                    label={relationshipFeatureCopy.saveRelationshipLabel}
                    tone="accent"
                    onPress={() => {
                      const didSave = controller.saveRelationshipDraft(
                        draft,
                        editingRelationship ?? undefined
                      );
                      if (didSave) {
                        resetDraft(true);
                      }
                    }}
                  />
                  <ActionButton
                    label={relationshipFeatureCopy.clearDraftLabel}
                    onPress={() => resetDraft()}
                  />
                </ButtonRow>
              </>
            )}
          </SectionBlock>
        ) : null}

        {showLinksMode ? (
          <SectionBlock
            sectionId="links.saved"
            title={relationshipFeatureCopy.savedSectionTitle}
          >
            <Field
              autoCapitalize="none"
              autoCorrect={false}
              label={relationshipFeatureCopy.searchRelationshipsLabel}
              value={relationshipQuery}
              onChangeText={setRelationshipQuery}
              placeholder={
                relationshipFeatureCopy.searchRelationshipsPlaceholder
              }
            />
            {relationshipTypeFilterOptions.length > 1 ? (
              <SelectField
                accessibilityLabel={
                  relationshipListTypeFilterControl.accessibilityLabel
                }
                label={relationshipListTypeFilterControl.label}
                options={relationshipTypeFilterOptions}
                value={typeFilter}
                onValueChange={setTypeFilter}
              />
            ) : null}
            {entryFilter ? (
              <MutedText>
                {`Showing links attached to ${
                  selectedEntryFilter?.name ?? entryFilter
                }.`}
              </MutedText>
            ) : null}
            {entryFilter || relationshipQuery || typeFilter ? (
              <ButtonRow>
                {typeFilter ? (
                  <ActionButton
                    label={relationshipFeatureCopy.clearTypeFilterLabel}
                    onPress={() => setTypeFilter('')}
                  />
                ) : null}
                {entryFilter ? (
                  <ActionButton
                    label={relationshipFeatureCopy.clearEntryFilterLabel}
                    onPress={() => setEntryFilter('')}
                  />
                ) : null}
                {relationshipQuery ? (
                  <ActionButton
                    label={relationshipFeatureCopy.clearSearchLabel}
                    onPress={() => setRelationshipQuery('')}
                  />
                ) : null}
              </ButtonRow>
            ) : null}
            {relationshipItems.length > 0 ? (
              <>
                {displayedRelationshipItems.map((relationship) => (
                  <View key={relationship.id} style={styles.relationshipRow}>
                    <Text style={styles.entryTitle}>{relationship.type}</Text>
                    <MutedText>
                      {relationship.sourceName} {relationship.directionLabel}{' '}
                      {relationship.targetName}
                    </MutedText>
                    <MutedText>{relationship.directionStatusLabel}</MutedText>
                    {relationship.note ? (
                      <MutedText>{relationship.note}</MutedText>
                    ) : null}
                    <ButtonRow>
                      <ActionButton
                        accessibilityLabel={
                          relationship.openSourceAccessibilityLabel
                        }
                        label={relationship.openSourceLabel}
                        disabled={!relationship.sourceContextRoute}
                        onPress={() =>
                          confirmDiscardUnsavedChangesOnMobile(
                            isDraftDirty,
                            () => {
                              router.push({
                                ...getMobileRouteHref(
                                  relationship.sourceContextRoute
                                ),
                              });
                            }
                          )
                        }
                      />
                      <ActionButton
                        accessibilityLabel={
                          relationship.openTargetAccessibilityLabel
                        }
                        label={relationship.openTargetLabel}
                        disabled={!relationship.targetContextRoute}
                        onPress={() =>
                          confirmDiscardUnsavedChangesOnMobile(
                            isDraftDirty,
                            () => {
                              router.push({
                                ...getMobileRouteHref(
                                  relationship.targetContextRoute
                                ),
                              });
                            }
                          )
                        }
                      />
                      <ActionButton
                        accessibilityLabel={relationship.editAccessibilityLabel}
                        label={relationship.editLabel}
                        onPress={() => editRelationship(relationship.id)}
                      />
                      <ActionButton
                        accessibilityHint={relationship.deleteAccessibilityHint}
                        accessibilityLabel={
                          relationship.deleteAccessibilityLabel
                        }
                        label={relationship.deleteLabel}
                        tone="danger"
                        onPress={() => deleteRelationship(relationship.id)}
                      />
                    </ButtonRow>
                  </View>
                ))}
                {hiddenRelationshipCount > 0 ? (
                  <MutedText>
                    {formatHiddenCountText({
                      hiddenCount: hiddenRelationshipCount,
                      singularItemLabel: 'link',
                      pluralItemLabel: 'links',
                    })}
                  </MutedText>
                ) : null}
                {relationshipItems.length >
                mobileFeatureDisplayLimits.relationshipResults ? (
                  <ButtonRow>
                    <ActionButton
                      expanded={showAllRelationshipResults}
                      label={formatExpansionControlLabel({
                        isExpanded: showAllRelationshipResults,
                        hiddenCount: hiddenRelationshipCount,
                        pluralItemLabel: 'Relationship Links',
                        singularItemLabel: 'Relationship Link',
                      })}
                      onPress={() =>
                        setShowAllRelationshipResults(
                          (currentValue) => !currentValue
                        )
                      }
                    />
                  </ButtonRow>
                ) : null}
              </>
            ) : (
              <>
                <MutedText>
                  {relationshipQuery.trim() || typeFilter || entryFilter
                    ? relationshipFeatureCopy.noMatchesTitle
                    : relationshipFeatureCopy.emptyTitle}
                </MutedText>
                <MutedText>
                  {relationshipQuery.trim() || typeFilter || entryFilter
                    ? relationshipFeatureCopy.noMatchesDetail
                    : relationshipFeatureCopy.emptyDetail}
                </MutedText>
              </>
            )}
          </SectionBlock>
        ) : null}

        {showBulkEditMode ? (
          <SectionBlock
            sectionId="links.review"
            title={studioModeModel.activeMode.label}
          >
            <MutedText>{studioModeModel.activeMode.detail}</MutedText>
            {legacyTextItems.length > 0 ? (
              <>
                <MutedText>
                  {getRelationshipTextReviewSummary(legacyTextItems.length)}
                </MutedText>
                {isDraftDirty ? (
                  <StatusText tone="warning">
                    {relationshipTextReviewCopy.draftBlockedMessage}
                  </StatusText>
                ) : null}
                {exactLegacyTextItems.length > 0 ? (
                  <ButtonRow>
                    <ActionButton
                      disabled={isDraftDirty}
                      label={relationshipTextReviewCopy.batchExactMatchLabel}
                      tone="accent"
                      onPress={migrateExactLegacyText}
                    />
                  </ButtonRow>
                ) : (
                  <MutedText>
                    {relationshipTextReviewCopy.noExactMatchesFound}
                  </MutedText>
                )}
              </>
            ) : null}
            {duplicateRelationshipGroups.length > 0 ? (
              <>
                <MutedText>
                  {relationshipReview.duplicateRelationshipCleanupSummary}
                </MutedText>
                {isDraftDirty ? (
                  <StatusText tone="warning">
                    {
                      relationshipFeatureCopy.duplicateRelationshipsCleanupBlockedMessage
                    }
                  </StatusText>
                ) : null}
                <ButtonRow>
                  <ActionButton
                    disabled={isDraftDirty}
                    label={
                      relationshipFeatureCopy.duplicateRelationshipsCleanupLabel
                    }
                    tone="accent"
                    onPress={deleteDuplicateRelationships}
                  />
                </ButtonRow>
              </>
            ) : null}
          </SectionBlock>
        ) : null}
      </MobileSectionDashboard>
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  entryPickerRow: {
    borderColor: valgaronColors.border,
    borderRadius: valgaronRadius.md,
    borderWidth: 1,
    gap: valgaronSpacing.sm,
    padding: valgaronSpacing.md,
  },
  relationshipRow: {
    borderColor: valgaronColors.border,
    borderRadius: valgaronRadius.md,
    borderWidth: 1,
    gap: valgaronSpacing.sm,
    padding: valgaronSpacing.md,
  },
  graphEdgeRow: {
    gap: valgaronSpacing.xs,
  },
  entryText: {
    gap: valgaronSpacing.xs,
  },
  entryTitle: {
    color: valgaronColors.heading,
    fontSize: valgaronTypography.sizes.md,
    fontWeight: '700',
  },
});
