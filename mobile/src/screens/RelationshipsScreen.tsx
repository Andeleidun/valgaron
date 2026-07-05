import { useEffect, useMemo, useRef, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { Text, View, StyleSheet } from 'react-native';
import {
  draftFromRelationship,
  getCodexHelpRoute,
  getCodexScreenIntro,
  getFeedbackTone,
  formatHiddenResultCountMessage,
  getLimitedResultModel,
  getRelationshipDiagnosticsModel,
  getRelationshipEditorOptionsModel,
  getRelationshipEntryRoute,
  getRelationshipEntryPickerItems,
  getRelationshipGraphViewModel,
  getRelationshipListModel,
  hasUnsavedChanges,
  mobileFeatureDisplayLimits,
  relationshipFeatureCopy,
  relationshipDirectionalControl,
  relationshipDraftStatusControl,
  relationshipGraphStatusFilterControl,
  relationshipGraphTypeFilterControl,
  relationshipListTypeFilterControl,
  relationshipNoteControl,
  relationshipSourceControl,
  relationshipTargetControl,
  relationshipTypeControl,
  type RelationshipDraft,
  type WorldEntryStatus,
} from '@valgaron/core';
import {
  valgaronColors,
  valgaronRadius,
  valgaronSpacing,
  valgaronTypography,
} from '@valgaron/ui-tokens';
import { useMobileCodex } from '../state/MobileCodexContext';
import { getMobileRouteHref } from '../navigation/mobileRoutes';
import { getMobileRouteParam } from '../navigation/mobileRouteParams';
import {
  ActionButton,
  ButtonRow,
  CheckboxField,
  Field,
  MutedText,
  ScreenHeader,
  ScreenScroll,
  SectionBlock,
  SelectField,
  StatusText,
} from './screenPrimitives';
import { confirmMobileDestructiveAction } from './mobileConfirm';
import { confirmDiscardUnsavedChangesOnMobile } from './unsavedChangesConfirm';

export function RelationshipsScreen() {
  const controller = useMobileCodex();
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
  const appliedRouteKeyRef = useRef('');
  const intro = getCodexScreenIntro('relationships');
  const [editingRelationshipId, setEditingRelationshipId] = useState<
    string | null
  >(null);
  const [draft, setDraft] = useState<RelationshipDraft>(() =>
    controller.createRelationshipDraft()
  );
  const [entryQuery, setEntryQuery] = useState('');
  const [entryFilter, setEntryFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [relationshipQuery, setRelationshipQuery] = useState('');
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
  const entries = getRelationshipEntryPickerItems(
    controller.activeWorld.codex,
    controller.activeWorld.entryTypes,
    entryQuery
  );
  const entryPickerModel = getLimitedResultModel(
    entries,
    mobileFeatureDisplayLimits.pickerResults
  );
  const displayedEntries = entryPickerModel.visibleItems;
  const hiddenEntryCount = entryPickerModel.hiddenCount;
  const relationshipItems = getRelationshipListModel(controller.activeWorld, {
    entryId: entryFilter,
    query: relationshipQuery,
    type: typeFilter,
  });
  const relationshipResultModel = getLimitedResultModel(
    relationshipItems,
    mobileFeatureDisplayLimits.relationshipResults
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
  const selectedSourceEntry = relationshipOptions.selectedSourceEntry;
  const selectedTargetEntry = relationshipOptions.selectedTargetEntry;
  const relationshipDiagnostics = getRelationshipDiagnosticsModel(
    controller.activeWorld
  );
  const relationshipHealth = relationshipDiagnostics.healthSummary;
  const brokenRelationships = relationshipDiagnostics.brokenRelationships;
  const orphanedEntries = relationshipDiagnostics.orphanedEntries;
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
    mobileFeatureDisplayLimits.pickerResults
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
    mobileFeatureDisplayLimits.orphanSummary
  );
  const visibleOrphanedEntries = orphanedEntryModel.visibleItems;
  const hiddenOrphanedEntryCount = orphanedEntryModel.hiddenCount;
  const editingRelationship = editingRelationshipId
    ? controller.activeWorld.relationships.find(
        (relationship) => relationship.id === editingRelationshipId
      ) ?? null
    : null;
  const baselineDraft = editingRelationship
    ? draftFromRelationship(editingRelationship)
    : controller.createRelationshipDraft();
  const isDraftDirty = hasUnsavedChanges(baselineDraft, draft);

  useEffect(() => {
    const routeKey = [
      controller.activeWorld.id,
      requestedEntryId ?? '',
      requestedEntryQuery ?? '',
      requestedRelationshipQuery ?? '',
    ].join('|');
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
      return;
    }
    confirmDiscardUnsavedChangesOnMobile(isDraftDirty, () => {
      setEditingRelationshipId(relationship.id);
      setDraft(draftFromRelationship(relationship));
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
  }

  function deleteRelationship(relationshipId: string) {
    confirmDiscardUnsavedChangesOnMobile(
      editingRelationshipId === relationshipId && isDraftDirty,
      () =>
        confirmMobileDestructiveAction('delete-relationship', () => {
          controller.removeRelationship(relationshipId);
          if (editingRelationshipId === relationshipId) {
            resetDraft(true);
          }
        })
    );
  }

  function openEntry({
    entryId,
    name,
    sectionId,
  }: {
    entryId: string;
    name: string;
    sectionId: string;
  }) {
    if (!sectionId) {
      return;
    }
    confirmDiscardUnsavedChangesOnMobile(isDraftDirty, () => {
      router.push({
        ...getMobileRouteHref(
          getRelationshipEntryRoute({ entryId, name, sectionId })
        ),
      });
    });
  }

  return (
    <ScreenScroll>
      <ScreenHeader title={intro.title} detail={intro.detail} />

      <SectionBlock title={relationshipFeatureCopy.healthSectionTitle}>
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
        <MutedText>
          {relationshipFeatureCopy.brokenReferencesLabel}:{' '}
          {relationshipHealth.brokenRelationshipCount}.{' '}
          {relationshipFeatureCopy.orphanedRecordsLabel}:{' '}
          {relationshipHealth.orphanedEntryCount}.
        </MutedText>
        <MutedText>
          {relationshipFeatureCopy.graphViewTitle}: {graphView.nodes.length}{' '}
          connected records and {graphView.edges.length} visible links.
        </MutedText>
      </SectionBlock>

      <SectionBlock title={relationshipFeatureCopy.repairBrokenLinksTitle}>
        {brokenRelationships.length > 0 ? (
          brokenRelationships.map((relationship) => (
            <View key={relationship.id} style={styles.relationshipRow}>
              <Text style={styles.entryTitle}>{relationship.type}</Text>
              <MutedText>
                {relationship.missingSource ? 'Missing source: ' : 'Source: '}
                {relationship.sourceName}
              </MutedText>
              <MutedText>
                {relationship.missingTarget ? 'Missing target: ' : 'Target: '}
                {relationship.targetName}
              </MutedText>
              <ButtonRow>
                <ActionButton
                  accessibilityLabel={`Repair ${relationship.type} relationship`}
                  label={relationshipFeatureCopy.repairLabel}
                  tone="accent"
                  onPress={() => repairRelationship(relationship.id)}
                />
                <ActionButton
                  accessibilityHint="Deletes this broken relationship after confirmation."
                  accessibilityLabel={`Delete broken ${relationship.type} relationship`}
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
          <MutedText>
            {relationshipFeatureCopy.orphanedRecordsLabel}:{' '}
            {visibleOrphanedEntries.map((entry) => entry.name).join(', ')}
            {hiddenOrphanedEntryCount > 0
              ? `, and ${hiddenOrphanedEntryCount} more`
              : ''}
            .
          </MutedText>
        ) : (
          <MutedText>
            {relationshipFeatureCopy.noOrphanedRecordsMessage}
          </MutedText>
        )}
      </SectionBlock>

      <SectionBlock title={relationshipFeatureCopy.graphBrowserTitle}>
        <Field
          autoCapitalize="none"
          autoCorrect={false}
          label={relationshipFeatureCopy.searchGraphRecordsLabel}
          value={graphNodeQuery}
          onChangeText={setGraphNodeQuery}
          placeholder="Name, section, tag, status, or id"
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
                  setGraphTagFilter((current) => (current === tag ? '' : tag))
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
              Showing {matchingGraphNodes.length} of {graphView.nodes.length}{' '}
              connected records.
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
                {formatHiddenResultCountMessage({
                  hiddenCount: hiddenGraphNodeCount,
                  itemLabel: 'record',
                  refinementLabel: 'graph search',
                })}
              </MutedText>
            ) : null}
            {selectedGraphNode ? (
              <View style={styles.relationshipRow}>
                <Text style={styles.entryTitle}>{selectedGraphNode.name}</Text>
                <MutedText>
                  {selectedGraphNode.sectionTitle} -{' '}
                  {selectedGraphNode.statusLabel}
                </MutedText>
                {selectedGraphEdges.map((edge) => (
                  <MutedText key={edge.id}>
                    {edge.sourceName} {edge.directionLabel} {edge.targetName} -{' '}
                    {edge.label}
                  </MutedText>
                ))}
                <ButtonRow>
                  <ActionButton
                    label={relationshipFeatureCopy.openEntryLabel}
                    onPress={() =>
                      openEntry({
                        entryId: selectedGraphNode.id,
                        name: selectedGraphNode.name,
                        sectionId: selectedGraphNode.sectionId,
                      })
                    }
                  />
                  <ActionButton
                    label={relationshipFeatureCopy.filterListLabel}
                    onPress={() => setEntryFilter(selectedGraphNode.id)}
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

      <SectionBlock title={relationshipFeatureCopy.entryPickersTitle}>
        <Field
          autoCapitalize="none"
          autoCorrect={false}
          label={relationshipFeatureCopy.searchEntriesLabel}
          value={entryQuery}
          onChangeText={setEntryQuery}
          placeholder="Name, section, tag, or id"
        />
        {entries.length > 0 ? (
          <>
            {displayedEntries.map((entry) => (
              <View key={entry.id} style={styles.entryPickerRow}>
                <View style={styles.entryText}>
                  <Text style={styles.entryTitle}>{entry.name}</Text>
                  <MutedText>
                    {entry.sectionTitle} - {entry.id}
                  </MutedText>
                </View>
                <ButtonRow>
                  <ActionButton
                    accessibilityLabel={`Use ${entry.name} as relationship source`}
                    label={relationshipFeatureCopy.sourcePickerLabel}
                    selected={draft.sourceEntryId === entry.id}
                    tone={
                      draft.sourceEntryId === entry.id ? 'accent' : 'neutral'
                    }
                    onPress={() =>
                      setDraft((current) => ({
                        ...current,
                        sourceEntryId: entry.id,
                      }))
                    }
                  />
                  <ActionButton
                    accessibilityLabel={`Use ${entry.name} as relationship target`}
                    label={relationshipFeatureCopy.targetPickerLabel}
                    selected={draft.targetEntryId === entry.id}
                    tone={
                      draft.targetEntryId === entry.id ? 'accent' : 'neutral'
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
            ))}
            {hiddenEntryCount > 0 ? (
              <MutedText>
                {formatHiddenResultCountMessage({
                  hiddenCount: hiddenEntryCount,
                  itemLabel: 'record',
                  refinementLabel: 'entry search',
                })}
              </MutedText>
            ) : null}
          </>
        ) : (
          <MutedText>
            {relationshipFeatureCopy.noEntryPickerMatchesMessage}
          </MutedText>
        )}
      </SectionBlock>

      <SectionBlock
        title={
          editingRelationship
            ? `Edit ${editingRelationship.type}`
            : relationshipFeatureCopy.relationshipFormTitle
        }
      >
        {controller.formMessage ? (
          <StatusText tone={getFeedbackTone(controller.formMessage)}>
            {controller.formMessage}
          </StatusText>
        ) : null}
        {isDraftDirty ? (
          <StatusText tone="warning">
            {relationshipFeatureCopy.unsavedDraftMessage}
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
              accessibilityLabel={relationshipSourceControl.accessibilityLabel}
              label={relationshipSourceControl.label}
              options={relationshipEntryOptions}
              searchable
              searchPlaceholder="Search entries"
              value={draft.sourceEntryId}
              onValueChange={(value) =>
                setDraft((current) => ({ ...current, sourceEntryId: value }))
              }
            />
            {draft.sourceEntryId ? (
              <MutedText>
                Source:{' '}
                {selectedSourceEntry
                  ? `${selectedSourceEntry.name} (${selectedSourceEntry.sectionTitle})`
                  : 'Missing entry'}
              </MutedText>
            ) : null}
            <SelectField
              accessibilityLabel={relationshipTargetControl.accessibilityLabel}
              label={relationshipTargetControl.label}
              options={relationshipEntryOptions}
              searchable
              searchPlaceholder="Search entries"
              value={draft.targetEntryId}
              onValueChange={(value) =>
                setDraft((current) => ({ ...current, targetEntryId: value }))
              }
            />
            {draft.targetEntryId ? (
              <MutedText>
                Target:{' '}
                {selectedTargetEntry
                  ? `${selectedTargetEntry.name} (${selectedTargetEntry.sectionTitle})`
                  : 'Missing entry'}
              </MutedText>
            ) : null}
            <Field
              label={relationshipTypeControl.label}
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
                onPress={resetDraft}
              />
            </ButtonRow>
          </>
        )}
      </SectionBlock>

      <SectionBlock title={relationshipFeatureCopy.savedSectionTitle}>
        <Field
          autoCapitalize="none"
          autoCorrect={false}
          label={relationshipFeatureCopy.searchRelationshipsLabel}
          value={relationshipQuery}
          onChangeText={setRelationshipQuery}
          placeholder="Entry, type, note, or id"
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
                <MutedText>{relationship.statusLabel}</MutedText>
                {relationship.note ? (
                  <MutedText>{relationship.note}</MutedText>
                ) : null}
                <ButtonRow>
                  <ActionButton
                    accessibilityLabel={`Open source entry ${relationship.sourceName}`}
                    label={relationshipFeatureCopy.openSourceLabel}
                    disabled={!relationship.sourceSectionId}
                    onPress={() =>
                      openEntry({
                        entryId: relationship.sourceEntryId,
                        name: relationship.sourceName,
                        sectionId: relationship.sourceSectionId,
                      })
                    }
                  />
                  <ActionButton
                    accessibilityLabel={`Open target entry ${relationship.targetName}`}
                    label={relationshipFeatureCopy.openTargetLabel}
                    disabled={!relationship.targetSectionId}
                    onPress={() =>
                      openEntry({
                        entryId: relationship.targetEntryId,
                        name: relationship.targetName,
                        sectionId: relationship.targetSectionId,
                      })
                    }
                  />
                  <ActionButton
                    accessibilityLabel={`Edit ${relationship.type} relationship between ${relationship.sourceName} and ${relationship.targetName}`}
                    label={relationshipFeatureCopy.editLabel}
                    onPress={() => editRelationship(relationship.id)}
                  />
                  <ActionButton
                    accessibilityHint="Deletes this relationship after confirmation."
                    accessibilityLabel={`Delete ${relationship.type} relationship between ${relationship.sourceName} and ${relationship.targetName}`}
                    label={relationshipFeatureCopy.deleteLabel}
                    tone="danger"
                    onPress={() => deleteRelationship(relationship.id)}
                  />
                </ButtonRow>
              </View>
            ))}
            {hiddenRelationshipCount > 0 ? (
              <MutedText>
                {formatHiddenResultCountMessage({
                  hiddenCount: hiddenRelationshipCount,
                  itemLabel: 'link',
                  refinementLabel: 'relationship search or filters',
                })}
              </MutedText>
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
  entryText: {
    gap: valgaronSpacing.xs,
  },
  entryTitle: {
    color: valgaronColors.heading,
    fontSize: valgaronTypography.sizes.md,
    fontWeight: '700',
  },
});
