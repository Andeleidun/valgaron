import { useEffect, useMemo, useRef, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { Text, View, StyleSheet } from 'react-native';
import {
  draftFromRelationship,
  getCodexEntriesRoute,
  getCodexScreenIntro,
  getEntryStatusLabel,
  getRelationshipEntries,
  hasUnsavedChanges,
  relationshipTypeOptions,
  type RelationshipDraft,
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
  getMobileRelationshipEntryPickerItems,
  getMobileRelationshipHealthSummary,
  getMobileRelationshipList,
} from '../state/mobileCodexViewModels';
import { getMobileFeedbackTone } from '../state/mobileFeedback';
import {
  ActionButton,
  ButtonRow,
  Field,
  MutedText,
  ScreenHeader,
  ScreenScroll,
  SectionBlock,
  StatusText,
} from './screenPrimitives';
import { confirmMobileDestructiveAction } from './mobileConfirm';
import { confirmMobileDiscardUnsavedChanges } from './mobileUnsavedChanges';

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
  const entries = getMobileRelationshipEntryPickerItems(
    controller.activeWorld,
    entryQuery
  );
  const relationshipItems = getMobileRelationshipList(
    controller.activeWorld,
    relationshipQuery,
    { entryId: entryFilter, type: typeFilter }
  );
  const relationshipEntries = useMemo(
    () =>
      getRelationshipEntries(
        controller.activeWorld.codex,
        controller.activeWorld.entryTypes
      ),
    [controller.activeWorld.codex, controller.activeWorld.entryTypes]
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
        <MutedText>
          Broken references: {relationshipHealth.brokenRelationshipCount}.
          Orphaned records: {relationshipHealth.orphanedEntryCount}.
        </MutedText>
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
          entries.map((entry) => (
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
                  tone={draft.sourceEntryId === entry.id ? 'accent' : 'neutral'}
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
                  tone={draft.targetEntryId === entry.id ? 'accent' : 'neutral'}
                  onPress={() =>
                    setDraft((current) => ({
                      ...current,
                      targetEntryId: entry.id,
                    }))
                  }
                />
              </ButtonRow>
            </View>
          ))
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
            <Field
              autoCapitalize="none"
              autoCorrect={false}
              label="Source entry id"
              value={draft.sourceEntryId}
              onChangeText={(value) =>
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
            <Field
              autoCapitalize="none"
              autoCorrect={false}
              label="Target entry id"
              value={draft.targetEntryId}
              onChangeText={(value) =>
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
            <ButtonRow>
              <ActionButton
                label={draft.directional ? 'Directional' : 'Mutual'}
                selected={draft.directional}
                tone={draft.directional ? 'accent' : 'neutral'}
                onPress={() =>
                  setDraft((current) => ({
                    ...current,
                    directional: !current.directional,
                  }))
                }
              />
              <ActionButton
                label={draft.status === 'canon' ? 'Canon' : 'Draft'}
                selected={draft.status === 'canon'}
                tone={draft.status === 'canon' ? 'accent' : 'neutral'}
                onPress={() =>
                  setDraft((current) => ({
                    ...current,
                    status: current.status === 'canon' ? 'draft' : 'canon',
                  }))
                }
              />
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
          <ButtonRow>
            <ActionButton
              label="Any Type"
              selected={typeFilter === ''}
              tone={typeFilter === '' ? 'accent' : 'neutral'}
              onPress={() => setTypeFilter('')}
            />
            {availableRelationshipTypes.map((type) => (
              <ActionButton
                key={type}
                label={type}
                selected={typeFilter === type}
                tone={typeFilter === type ? 'accent' : 'neutral'}
                onPress={() =>
                  setTypeFilter((current) => (current === type ? '' : type))
                }
              />
            ))}
          </ButtonRow>
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
          relationshipItems.map((relationship) => (
            <View key={relationship.id} style={styles.relationshipRow}>
              <Text style={styles.entryTitle}>{relationship.type}</Text>
              <MutedText>
                {relationship.sourceName} {relationship.directionLabel}{' '}
                {relationship.targetName}
              </MutedText>
              <MutedText>{getEntryStatusLabel(relationship.status)}</MutedText>
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
          ))
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
