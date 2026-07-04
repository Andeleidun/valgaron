import { useEffect, useMemo, useRef, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { Text, View, StyleSheet } from 'react-native';
import {
  draftFromRelationship,
  getCodexEntriesRoute,
  getCodexHelpRoute,
  getCodexScreenIntro,
  getEntryStatusLabel,
  getRelationshipEntries,
  hasUnsavedChanges,
  relationshipDirectionalControl,
  relationshipDraftStatusControl,
  relationshipGraphStatusFilterControl,
  relationshipGraphTypeFilterControl,
  relationshipListTypeFilterControl,
  relationshipSourceControl,
  relationshipTargetControl,
  relationshipTypeOptions,
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
  getMobileBrokenRelationshipList,
  getMobileOrphanedRelationshipEntries,
  getMobileRelationshipEntryPickerItems,
  getMobileRelationshipGraphView,
  getMobileRelationshipHealthSummary,
  getMobileRelationshipList,
} from '../state/mobileCodexViewModels';
import { getMobileFeedbackTone } from '../state/mobileFeedback';
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
import { confirmMobileDiscardUnsavedChanges } from './mobileUnsavedChanges';

const MOBILE_PICKER_RESULT_LIMIT = 24;
const MOBILE_RELATIONSHIP_RESULT_LIMIT = 40;
const MOBILE_ORPHAN_SUMMARY_LIMIT = 12;

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
  const entries = getMobileRelationshipEntryPickerItems(
    controller.activeWorld,
    entryQuery
  );
  const displayedEntries = entries.slice(0, MOBILE_PICKER_RESULT_LIMIT);
  const hiddenEntryCount = Math.max(
    0,
    entries.length - displayedEntries.length
  );
  const relationshipItems = getMobileRelationshipList(
    controller.activeWorld,
    relationshipQuery,
    { entryId: entryFilter, type: typeFilter }
  );
  const displayedRelationshipItems = relationshipItems.slice(
    0,
    MOBILE_RELATIONSHIP_RESULT_LIMIT
  );
  const hiddenRelationshipCount = Math.max(
    0,
    relationshipItems.length - displayedRelationshipItems.length
  );
  const relationshipEntries = useMemo(
    () =>
      getRelationshipEntries(
        controller.activeWorld.codex,
        controller.activeWorld.entryTypes
      ),
    [controller.activeWorld.codex, controller.activeWorld.entryTypes]
  );
  const relationshipEntryOptions = useMemo(
    () => [
      { value: '', label: 'Choose entry' },
      ...relationshipEntries.map((entry) => ({
        value: entry.id,
        label: `${entry.name} (${entry.sectionTitle})`,
      })),
    ],
    [relationshipEntries]
  );
  const selectedEntryFilter = entryFilter
    ? relationshipEntries.find((entry) => entry.id === entryFilter) ?? null
    : null;
  const selectedSourceEntry = draft.sourceEntryId
    ? relationshipEntries.find((entry) => entry.id === draft.sourceEntryId) ??
      null
    : null;
  const selectedTargetEntry = draft.targetEntryId
    ? relationshipEntries.find((entry) => entry.id === draft.targetEntryId) ??
      null
    : null;
  const relationshipHealth = getMobileRelationshipHealthSummary(
    controller.activeWorld
  );
  const brokenRelationships = getMobileBrokenRelationshipList(
    controller.activeWorld
  );
  const orphanedEntries = getMobileOrphanedRelationshipEntries(
    controller.activeWorld
  );
  const availableRelationshipTypes = useMemo(
    () =>
      Array.from(
        new Set(
          controller.activeWorld.relationships.map(
            (relationship) => relationship.type
          )
        )
      ).sort((first, second) => first.localeCompare(second)),
    [controller.activeWorld.relationships]
  );
  const relationshipTypeFilterOptions = useMemo(
    () => [
      { value: '', label: 'Any type' },
      ...availableRelationshipTypes.map((type) => ({
        value: type,
        label: type,
      })),
    ],
    [availableRelationshipTypes]
  );
  const availableGraphTags = useMemo(
    () =>
      Array.from(new Set(relationshipEntries.flatMap((entry) => entry.tags)))
        .filter(Boolean)
        .sort((first, second) => first.localeCompare(second)),
    [relationshipEntries]
  );
  const graphView = getMobileRelationshipGraphView(controller.activeWorld, {
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
  const displayedGraphNodes = matchingGraphNodes.slice(
    0,
    MOBILE_PICKER_RESULT_LIMIT
  );
  const hiddenGraphNodeCount = Math.max(
    0,
    matchingGraphNodes.length - displayedGraphNodes.length
  );
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
  const visibleOrphanedEntries = orphanedEntries.slice(
    0,
    MOBILE_ORPHAN_SUMMARY_LIMIT
  );
  const hiddenOrphanedEntryCount = Math.max(
    0,
    orphanedEntries.length - visibleOrphanedEntries.length
  );
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
      confirmMobileDiscardUnsavedChanges(true, applyRouteState, () => {
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
    confirmMobileDiscardUnsavedChanges(isDraftDirty, reset);
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
    confirmMobileDiscardUnsavedChanges(isDraftDirty, () => {
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
    confirmMobileDiscardUnsavedChanges(
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
    confirmMobileDiscardUnsavedChanges(isDraftDirty, () => {
      router.push({
        ...getMobileRouteHref(
          getCodexEntriesRoute({
            entryId,
            intent: 'edit',
            query: name,
            sectionId,
          })
        ),
      });
    });
  }

  return (
    <ScreenScroll>
      <ScreenHeader title={intro.title} detail={intro.detail} />

      <SectionBlock title="Relationship Health">
        <ButtonRow>
          <ActionButton
            label="Relationship Help"
            onPress={() =>
              confirmMobileDiscardUnsavedChanges(isDraftDirty, () =>
                router.push({
                  ...getMobileRouteHref(getCodexHelpRoute('relationships')),
                })
              )
            }
          />
        </ButtonRow>
        <MutedText>
          Broken references: {relationshipHealth.brokenRelationshipCount}.
          Orphaned records: {relationshipHealth.orphanedEntryCount}.
        </MutedText>
        <MutedText>
          Graph view: {graphView.nodes.length} connected records and{' '}
          {graphView.edges.length} visible links.
        </MutedText>
      </SectionBlock>

      <SectionBlock title="Repair Broken Links">
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
                  label="Repair"
                  tone="accent"
                  onPress={() => repairRelationship(relationship.id)}
                />
                <ActionButton
                  accessibilityHint="Deletes this broken relationship after confirmation."
                  accessibilityLabel={`Delete broken ${relationship.type} relationship`}
                  label="Delete"
                  tone="danger"
                  onPress={() => deleteRelationship(relationship.id)}
                />
              </ButtonRow>
            </View>
          ))
        ) : (
          <MutedText>No broken relationships.</MutedText>
        )}
        {orphanedEntries.length > 0 ? (
          <MutedText>
            Orphaned records:{' '}
            {visibleOrphanedEntries.map((entry) => entry.name).join(', ')}
            {hiddenOrphanedEntryCount > 0
              ? `, and ${hiddenOrphanedEntryCount} more`
              : ''}
            .
          </MutedText>
        ) : (
          <MutedText>Every relationship-capable record is connected.</MutedText>
        )}
      </SectionBlock>

      <SectionBlock title="Graph Browser">
        <Field
          autoCapitalize="none"
          autoCorrect={false}
          label="Search graph records"
          value={graphNodeQuery}
          onChangeText={setGraphNodeQuery}
          placeholder="Name, section, tag, status, or id"
        />
        <ButtonRow>
          <ActionButton
            label="Any Section"
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
        {availableRelationshipTypes.length > 0 ? (
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
              label="All Tags"
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
              label="Clear Graph Filters"
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
              <MutedText>No graph records match this search.</MutedText>
            )}
            {hiddenGraphNodeCount > 0 ? (
              <MutedText>
                Refine graph search to show {hiddenGraphNodeCount} more record
                {hiddenGraphNodeCount === 1 ? '' : 's'}.
              </MutedText>
            ) : null}
            {selectedGraphNode ? (
              <View style={styles.relationshipRow}>
                <Text style={styles.entryTitle}>{selectedGraphNode.name}</Text>
                <MutedText>
                  {selectedGraphNode.sectionTitle} -{' '}
                  {getEntryStatusLabel(selectedGraphNode.status)}
                </MutedText>
                {selectedGraphEdges.map((edge) => (
                  <MutedText key={edge.id}>
                    {edge.sourceName} {edge.directionLabel} {edge.targetName} -{' '}
                    {edge.label}
                  </MutedText>
                ))}
                <ButtonRow>
                  <ActionButton
                    label="Open Entry"
                    onPress={() =>
                      openEntry({
                        entryId: selectedGraphNode.id,
                        name: selectedGraphNode.name,
                        sectionId: selectedGraphNode.sectionId,
                      })
                    }
                  />
                  <ActionButton
                    label="Filter List"
                    onPress={() => setEntryFilter(selectedGraphNode.id)}
                  />
                </ButtonRow>
              </View>
            ) : null}
          </>
        ) : (
          <MutedText>No connected graph records match these filters.</MutedText>
        )}
      </SectionBlock>

      <SectionBlock title="Entry Pickers">
        <Field
          autoCapitalize="none"
          autoCorrect={false}
          label="Search entries"
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
                    label="Source"
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
                    label="Target"
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
                Refine entry search to show {hiddenEntryCount} more record
                {hiddenEntryCount === 1 ? '' : 's'}.
              </MutedText>
            ) : null}
          </>
        ) : (
          <MutedText>No entries match this picker search.</MutedText>
        )}
      </SectionBlock>

      <SectionBlock
        title={
          editingRelationship
            ? `Edit ${editingRelationship.type}`
            : 'Relationship Form'
        }
      >
        {controller.formMessage ? (
          <StatusText tone={getMobileFeedbackTone(controller.formMessage)}>
            {controller.formMessage}
          </StatusText>
        ) : null}
        {isDraftDirty ? (
          <StatusText tone="warning">Unsaved relationship draft.</StatusText>
        ) : null}
        {relationshipEntries.length < 2 ? (
          <StatusText tone="warning">
            Create at least two entries before adding relationships.
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
              label="Type"
              value={draft.type}
              onChangeText={(value) =>
                setDraft((current) => ({ ...current, type: value }))
              }
            />
            <ButtonRow>
              {relationshipTypeOptions.slice(0, 7).map((type) => (
                <ActionButton
                  key={type}
                  label={type}
                  selected={draft.type === type}
                  tone={draft.type === type ? 'accent' : 'neutral'}
                  onPress={() => setDraft((current) => ({ ...current, type }))}
                />
              ))}
            </ButtonRow>
            <Field
              label="Note"
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
                label="Save Relationship"
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
              <ActionButton label="Clear" onPress={resetDraft} />
            </ButtonRow>
          </>
        )}
      </SectionBlock>

      <SectionBlock title="Saved Relationships">
        <Field
          autoCapitalize="none"
          autoCorrect={false}
          label="Search relationships"
          value={relationshipQuery}
          onChangeText={setRelationshipQuery}
          placeholder="Entry, type, note, or id"
        />
        {availableRelationshipTypes.length > 0 ? (
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
                label="Clear Type Filter"
                onPress={() => setTypeFilter('')}
              />
            ) : null}
            {entryFilter ? (
              <ActionButton
                label="Clear Entry Filter"
                onPress={() => setEntryFilter('')}
              />
            ) : null}
            {relationshipQuery ? (
              <ActionButton
                label="Clear Search"
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
                <MutedText>
                  {getEntryStatusLabel(relationship.status)}
                </MutedText>
                {relationship.note ? (
                  <MutedText>{relationship.note}</MutedText>
                ) : null}
                <ButtonRow>
                  <ActionButton
                    accessibilityLabel={`Open source entry ${relationship.sourceName}`}
                    label="Open Source"
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
                    label="Open Target"
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
                    label="Edit"
                    onPress={() => editRelationship(relationship.id)}
                  />
                  <ActionButton
                    accessibilityHint="Deletes this relationship after confirmation."
                    accessibilityLabel={`Delete ${relationship.type} relationship between ${relationship.sourceName} and ${relationship.targetName}`}
                    label="Delete"
                    tone="danger"
                    onPress={() => deleteRelationship(relationship.id)}
                  />
                </ButtonRow>
              </View>
            ))}
            {hiddenRelationshipCount > 0 ? (
              <MutedText>
                Refine relationship search or filters to show{' '}
                {hiddenRelationshipCount} more link
                {hiddenRelationshipCount === 1 ? '' : 's'}.
              </MutedText>
            ) : null}
          </>
        ) : (
          <MutedText>
            {relationshipQuery.trim() || typeFilter || entryFilter
              ? 'No relationships match these filters.'
              : 'No relationships saved in this workspace.'}
          </MutedText>
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
