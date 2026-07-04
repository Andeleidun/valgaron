import { useEffect, useMemo, useRef, useState } from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import type {
  EntryTypeDraft,
  InFictionWorld,
  PlanetaryWorldDraft,
  WorkspaceDraft,
  WorldWorkspace,
} from '@valgaron/core';
import {
  getCodexHelpRoute,
  getCodexScreenIntro,
  getWorkspaceFormKicker,
  getWorkspaceFormTitle,
  getWorkspaceFeatureModel,
  entryTypeDraftFields,
  hasUnsavedChanges,
  lastActiveWorkspaceArchiveMessage,
  normalizePlanetaryWorldDraft,
  normalizeWorkspaceDraft,
  planetaryWorldDraftFrom,
  planetaryWorldDraftFields,
  workspaceDraftFields,
  workspaceFeatureActions,
  workspaceFeatureCopy,
} from '@valgaron/core';
import {
  valgaronColors,
  valgaronRadius,
  valgaronSpacing,
  valgaronTypography,
} from '@valgaron/ui-tokens';
import { useMobileCodex } from '../state/MobileCodexContext';
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
import { getMobileFeedbackTone } from '../state/mobileFeedback';
import { getMobileRouteHref } from '../navigation/mobileRoutes';

const blankWorkspaceDraft: WorkspaceDraft = {
  name: '',
  summary: '',
  defaultEra: '',
};

const blankEntryTypeDraft: EntryTypeDraft = {
  title: '',
  singularTitle: '',
  description: '',
  fields: '',
};

function workspaceDraftFrom(workspace?: WorldWorkspace): WorkspaceDraft {
  return {
    name: workspace?.name ?? '',
    summary: workspace?.summary ?? '',
    defaultEra: workspace?.defaultEra ?? '',
  };
}

export function WorkspacesScreen() {
  const controller = useMobileCodex();
  const intro = getCodexScreenIntro('workspaces');
  const activeWorkspaceIdRef = useRef(controller.activeWorld.id);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string | null>(
    controller.activeWorld.id
  );
  const [workspaceDraft, setWorkspaceDraft] = useState<WorkspaceDraft>(() =>
    workspaceDraftFrom(controller.activeWorld)
  );
  const [entryTypeDraft, setEntryTypeDraft] =
    useState<EntryTypeDraft>(blankEntryTypeDraft);
  const [selectedPlanetaryWorldId, setSelectedPlanetaryWorldId] = useState<
    string | null
  >(null);
  const [planetaryWorldDraft, setPlanetaryWorldDraft] =
    useState<PlanetaryWorldDraft>(() => planetaryWorldDraftFrom());
  const [workspaceQuery, setWorkspaceQuery] = useState('');
  const [entryTypeQuery, setEntryTypeQuery] = useState('');
  const [planetaryWorldQuery, setPlanetaryWorldQuery] = useState('');

  useEffect(() => {
    if (activeWorkspaceIdRef.current === controller.activeWorld.id) {
      return;
    }
    activeWorkspaceIdRef.current = controller.activeWorld.id;
    setSelectedWorkspaceId(controller.activeWorld.id);
    setWorkspaceDraft(workspaceDraftFrom(controller.activeWorld));
    setSelectedPlanetaryWorldId(null);
    setPlanetaryWorldDraft(planetaryWorldDraftFrom());
  }, [controller.activeWorld]);

  useEffect(() => {
    if (
      selectedWorkspaceId &&
      !controller.document.worlds.some(
        (workspace) => workspace.id === selectedWorkspaceId
      )
    ) {
      setSelectedWorkspaceId(null);
      setWorkspaceDraft(blankWorkspaceDraft);
    }
  }, [controller.document.worlds, selectedWorkspaceId]);

  useEffect(() => {
    if (
      selectedPlanetaryWorldId &&
      !controller.activeWorld.planetaryWorlds.some(
        (planetaryWorld) => planetaryWorld.id === selectedPlanetaryWorldId
      )
    ) {
      setSelectedPlanetaryWorldId(null);
      setPlanetaryWorldDraft(planetaryWorldDraftFrom());
    }
  }, [controller.activeWorld.planetaryWorlds, selectedPlanetaryWorldId]);

  const workspaceModel = useMemo(
    () =>
      getWorkspaceFeatureModel({
        activeWorld: controller.activeWorld,
        document: controller.document,
        queries: {
          workspaces: workspaceQuery,
          customEntryTypes: entryTypeQuery,
          planetaryWorlds: planetaryWorldQuery,
        },
        selectedWorkspaceId,
      }),
    [
      controller.activeWorld,
      controller.document,
      entryTypeQuery,
      planetaryWorldQuery,
      selectedWorkspaceId,
      workspaceQuery,
    ]
  );
  const selectedWorkspace = workspaceModel.selectedWorkspace;
  const workspaceBaselineDraft = workspaceDraftFrom(
    selectedWorkspace ?? undefined
  );
  const isWorkspaceDraftDirty = hasUnsavedChanges(
    workspaceBaselineDraft,
    workspaceDraft
  );
  const isEntryTypeDraftDirty = hasUnsavedChanges(
    blankEntryTypeDraft,
    entryTypeDraft
  );
  const selectedPlanetaryWorld = selectedPlanetaryWorldId
    ? controller.activeWorld.planetaryWorlds.find(
        (planetaryWorld) => planetaryWorld.id === selectedPlanetaryWorldId
      ) ?? null
    : null;
  const planetaryWorldBaselineDraft = planetaryWorldDraftFrom(
    selectedPlanetaryWorld ?? undefined
  );
  const isPlanetaryWorldDraftDirty = hasUnsavedChanges(
    planetaryWorldBaselineDraft,
    planetaryWorldDraft
  );
  const hasDirtyDraft =
    isWorkspaceDraftDirty ||
    isEntryTypeDraftDirty ||
    isPlanetaryWorldDraftDirty;

  function editWorkspace(workspace: WorldWorkspace) {
    if (selectedWorkspaceId === workspace.id) {
      return;
    }
    confirmMobileDiscardUnsavedChanges(hasDirtyDraft, () => {
      setSelectedWorkspaceId(workspace.id);
      setWorkspaceDraft(workspaceDraftFrom(workspace));
    });
  }

  function resetWorkspaceDraft(force = false) {
    const reset = () => {
      setSelectedWorkspaceId(null);
      setWorkspaceDraft(blankWorkspaceDraft);
    };
    if (force) {
      reset();
      return;
    }
    confirmMobileDiscardUnsavedChanges(hasDirtyDraft, reset);
  }

  function shouldConfirmWorkspaceAction(workspaceId: string) {
    return (
      hasDirtyDraft &&
      (workspaceId === controller.activeWorld.id ||
        workspaceId === selectedWorkspaceId)
    );
  }

  function archiveWorkspace(workspace: WorldWorkspace) {
    confirmMobileDiscardUnsavedChanges(
      shouldConfirmWorkspaceAction(workspace.id),
      () => {
        const wasActiveWorkspace = workspace.id === controller.activeWorld.id;
        controller.archiveWorkspace(
          workspace.id,
          workspace.status !== 'archived'
        );
        if (workspace.id === selectedWorkspaceId && !wasActiveWorkspace) {
          setWorkspaceDraft(workspaceDraftFrom(workspace));
        }
      }
    );
  }

  function duplicateWorkspace(workspaceId: string) {
    confirmMobileDiscardUnsavedChanges(hasDirtyDraft, () =>
      controller.duplicateWorkspace(workspaceId)
    );
  }

  function deleteWorkspace(workspaceId: string) {
    confirmMobileDiscardUnsavedChanges(
      shouldConfirmWorkspaceAction(workspaceId),
      () =>
        confirmMobileDestructiveAction('delete-workspace', () =>
          controller.permanentlyDeleteWorkspace(workspaceId)
        )
    );
  }

  function editPlanetaryWorld(planetaryWorld: InFictionWorld) {
    if (selectedPlanetaryWorldId === planetaryWorld.id) {
      return;
    }
    confirmMobileDiscardUnsavedChanges(hasDirtyDraft, () => {
      setSelectedPlanetaryWorldId(planetaryWorld.id);
      setPlanetaryWorldDraft(planetaryWorldDraftFrom(planetaryWorld));
    });
  }

  function resetPlanetaryWorldDraft(force = false) {
    const reset = () => {
      setSelectedPlanetaryWorldId(null);
      setPlanetaryWorldDraft(planetaryWorldDraftFrom());
    };
    if (force) {
      reset();
      return;
    }
    confirmMobileDiscardUnsavedChanges(hasDirtyDraft, reset);
  }

  function savePlanetaryWorld() {
    const normalizedDraft = normalizePlanetaryWorldDraft(planetaryWorldDraft);
    const didSave = controller.savePlanetaryWorld(
      normalizedDraft,
      selectedPlanetaryWorld ?? undefined
    );
    if (didSave) {
      if (selectedPlanetaryWorld) {
        setPlanetaryWorldDraft(normalizedDraft);
      } else {
        resetPlanetaryWorldDraft(true);
      }
    }
  }

  function archivePlanetaryWorld(planetaryWorld: InFictionWorld) {
    confirmMobileDiscardUnsavedChanges(
      selectedPlanetaryWorldId === planetaryWorld.id &&
        isPlanetaryWorldDraftDirty,
      () =>
        controller.archivePlanetaryWorld(
          planetaryWorld.id,
          planetaryWorld.status !== 'archived'
        )
    );
  }

  function deletePlanetaryWorld(planetaryWorld: InFictionWorld) {
    confirmMobileDiscardUnsavedChanges(
      selectedPlanetaryWorldId === planetaryWorld.id &&
        isPlanetaryWorldDraftDirty,
      () =>
        confirmMobileDestructiveAction('delete-planetary-world', () =>
          controller.permanentlyDeletePlanetaryWorld(planetaryWorld.id)
        )
    );
  }

  function updatePlanetaryWorldDraft(
    key: (typeof planetaryWorldDraftFields)[number]['key'],
    value: string
  ) {
    setPlanetaryWorldDraft((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function updateWorkspaceDraft(
    key: (typeof workspaceDraftFields)[number]['key'],
    value: string
  ) {
    setWorkspaceDraft((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function updateEntryTypeDraft(
    key: (typeof entryTypeDraftFields)[number]['key'],
    value: string
  ) {
    setEntryTypeDraft((current) => ({
      ...current,
      [key]: value,
    }));
  }

  return (
    <ScreenScroll>
      <ScreenHeader title={intro.title} detail={intro.detail} />
      {controller.formMessage ? (
        <StatusText tone={getMobileFeedbackTone(controller.formMessage)}>
          {controller.formMessage}
        </StatusText>
      ) : null}

      <SectionBlock title={workspaceFeatureCopy.sections.workspaces}>
        <ButtonRow>
          <ActionButton
            label={workspaceFeatureActions.workspaceHelp}
            onPress={() =>
              confirmMobileDiscardUnsavedChanges(hasDirtyDraft, () =>
                router.push({
                  ...getMobileRouteHref(getCodexHelpRoute('workspaces')),
                })
              )
            }
          />
        </ButtonRow>
        <Field
          autoCapitalize="none"
          autoCorrect={false}
          label={workspaceModel.workspaces.label}
          value={workspaceQuery}
          onChangeText={setWorkspaceQuery}
          placeholder={workspaceModel.workspaces.placeholder}
        />
        {workspaceModel.workspaces.rows.length > 0 ? (
          workspaceModel.workspaces.rows.map((workspaceRow) => {
            const { actionState, workspace } = workspaceRow;
            return (
              <View key={workspace.id} style={styles.workspaceRow}>
                <Text style={styles.itemTitle}>{workspaceRow.name}</Text>
                <MutedText>{workspaceRow.statusLine}</MutedText>
                <MutedText>{workspaceRow.summaryText}</MutedText>
                <ButtonRow>
                  <ActionButton
                    accessibilityLabel={`Edit workspace ${workspace.name}`}
                    label={workspaceFeatureActions.edit}
                    selected={workspace.id === selectedWorkspaceId}
                    tone={
                      workspace.id === selectedWorkspaceId
                        ? 'accent'
                        : 'neutral'
                    }
                    onPress={() => editWorkspace(workspace)}
                  />
                  <ActionButton
                    accessibilityLabel={`${actionState.switchLabel} ${workspace.name}`}
                    label={actionState.switchLabel}
                    selected={workspace.id === controller.activeWorld.id}
                    tone={
                      workspace.id === controller.activeWorld.id
                        ? 'accent'
                        : 'neutral'
                    }
                    disabled={!actionState.canSwitch}
                    onPress={() =>
                      confirmMobileDiscardUnsavedChanges(hasDirtyDraft, () =>
                        controller.switchWorkspace(workspace.id)
                      )
                    }
                  />
                  <ActionButton
                    accessibilityLabel={
                      workspace.status === 'archived'
                        ? `Restore workspace ${workspace.name}`
                        : `Archive workspace ${workspace.name}`
                    }
                    label={
                      workspace.status === 'archived'
                        ? workspaceFeatureActions.restore
                        : workspaceFeatureActions.archive
                    }
                    disabled={!actionState.canArchive}
                    onPress={() => archiveWorkspace(workspace)}
                  />
                  <ActionButton
                    accessibilityLabel={`Duplicate workspace ${workspace.name}`}
                    label={workspaceFeatureActions.duplicate}
                    onPress={() => duplicateWorkspace(workspace.id)}
                  />
                  <ActionButton
                    accessibilityHint="Deletes this workspace after confirmation."
                    accessibilityLabel={`Delete workspace ${workspace.name}`}
                    label={workspaceFeatureActions.deletePermanently}
                    tone="danger"
                    disabled={!actionState.canDelete}
                    onPress={() => deleteWorkspace(workspace.id)}
                  />
                </ButtonRow>
                {!actionState.canArchive ? (
                  <StatusText tone="warning">
                    {lastActiveWorkspaceArchiveMessage}
                  </StatusText>
                ) : null}
              </View>
            );
          })
        ) : (
          <MutedText>{workspaceModel.workspaces.emptyText}</MutedText>
        )}
        {workspaceModel.workspaces.hiddenCount > 0 ? (
          <MutedText>{workspaceModel.workspaces.hiddenText}</MutedText>
        ) : null}
      </SectionBlock>

      <SectionBlock
        title={`${getWorkspaceFormKicker(
          selectedWorkspace?.name
        )}: ${getWorkspaceFormTitle(selectedWorkspace?.name)}`}
      >
        {isWorkspaceDraftDirty ? (
          <StatusText tone="warning">Unsaved workspace draft.</StatusText>
        ) : null}
        {workspaceDraftFields.map((field) => (
          <Field
            key={field.key}
            label={field.label}
            multiline={field.multiline}
            placeholder={field.placeholder}
            value={workspaceDraft[field.key]}
            onChangeText={(value) => updateWorkspaceDraft(field.key, value)}
          />
        ))}
        <ButtonRow>
          <ActionButton
            label={
              selectedWorkspace
                ? workspaceFeatureActions.saveWorkspace
                : workspaceFeatureActions.createWorkspace
            }
            tone="accent"
            onPress={() => {
              const normalizedDraft = normalizeWorkspaceDraft(workspaceDraft);
              const didSave = selectedWorkspace
                ? controller.updateWorkspace(
                    selectedWorkspace.id,
                    normalizedDraft
                  )
                : controller.createWorkspace(normalizedDraft);
              if (didSave) {
                if (selectedWorkspace) {
                  setWorkspaceDraft(normalizedDraft);
                } else {
                  resetWorkspaceDraft(true);
                }
              }
            }}
          />
          <ActionButton
            label={workspaceFeatureActions.newWorkspace}
            onPress={resetWorkspaceDraft}
          />
        </ButtonRow>
      </SectionBlock>

      <SectionBlock title={workspaceFeatureCopy.sections.planetaryWorlds}>
        {isPlanetaryWorldDraftDirty ? (
          <StatusText tone="warning">
            Unsaved in-fiction world draft.
          </StatusText>
        ) : null}
        <Field
          autoCapitalize="none"
          autoCorrect={false}
          label={workspaceModel.planetaryWorlds.label}
          value={planetaryWorldQuery}
          onChangeText={setPlanetaryWorldQuery}
          placeholder={workspaceModel.planetaryWorlds.placeholder}
        />
        {workspaceModel.planetaryWorlds.rows.length > 0 ? (
          workspaceModel.planetaryWorlds.rows.map((planetaryWorldRow) => {
            const { planetaryWorld } = planetaryWorldRow;
            return (
              <View key={planetaryWorld.id} style={styles.workspaceRow}>
                <Text style={styles.itemTitle}>{planetaryWorldRow.name}</Text>
                <MutedText>{planetaryWorldRow.statusLine}</MutedText>
                <MutedText>{planetaryWorldRow.climateText}</MutedText>
                <MutedText>{planetaryWorldRow.terrainText}</MutedText>
                <MutedText>{planetaryWorldRow.summaryText}</MutedText>
                <MutedText>{planetaryWorldRow.tagsText}</MutedText>
                <ButtonRow>
                  <ActionButton
                    accessibilityLabel={`Edit in-fiction world ${planetaryWorld.name}`}
                    label={workspaceFeatureActions.edit}
                    selected={planetaryWorld.id === selectedPlanetaryWorldId}
                    tone={
                      planetaryWorld.id === selectedPlanetaryWorldId
                        ? 'accent'
                        : 'neutral'
                    }
                    onPress={() => editPlanetaryWorld(planetaryWorld)}
                  />
                  <ActionButton
                    accessibilityLabel={
                      planetaryWorld.status === 'archived'
                        ? `Restore in-fiction world ${planetaryWorld.name}`
                        : `Archive in-fiction world ${planetaryWorld.name}`
                    }
                    label={
                      planetaryWorld.status === 'archived'
                        ? workspaceFeatureActions.restore
                        : workspaceFeatureActions.archive
                    }
                    onPress={() => archivePlanetaryWorld(planetaryWorld)}
                  />
                  <ActionButton
                    accessibilityHint="Deletes this in-fiction world after confirmation."
                    accessibilityLabel={`Delete in-fiction world ${planetaryWorld.name}`}
                    label={workspaceFeatureActions.deletePermanently}
                    tone="danger"
                    onPress={() => deletePlanetaryWorld(planetaryWorld)}
                  />
                </ButtonRow>
              </View>
            );
          })
        ) : (
          <MutedText>{workspaceModel.planetaryWorlds.emptyText}</MutedText>
        )}
        {workspaceModel.planetaryWorlds.hiddenCount > 0 ? (
          <MutedText>{workspaceModel.planetaryWorlds.hiddenText}</MutedText>
        ) : null}
        {planetaryWorldDraftFields.map((field) => (
          <Field
            autoCapitalize={field.key === 'tags' ? 'words' : undefined}
            autoCorrect={field.key === 'tags' ? false : undefined}
            key={field.key}
            label={field.label}
            multiline={'multiline' in field ? field.multiline : undefined}
            placeholder={'placeholder' in field ? field.placeholder : undefined}
            value={planetaryWorldDraft[field.key]}
            onChangeText={(value) =>
              updatePlanetaryWorldDraft(field.key, value)
            }
          />
        ))}
        <ButtonRow>
          <ActionButton
            label={
              selectedPlanetaryWorld
                ? workspaceFeatureActions.saveWorld
                : workspaceFeatureActions.createWorld
            }
            tone="accent"
            onPress={savePlanetaryWorld}
          />
          <ActionButton
            label={workspaceFeatureActions.newWorldDraft}
            onPress={resetPlanetaryWorldDraft}
          />
        </ButtonRow>
      </SectionBlock>

      <SectionBlock title={workspaceFeatureCopy.sections.customEntryTypes}>
        {isEntryTypeDraftDirty ? (
          <StatusText tone="warning">Unsaved custom type draft.</StatusText>
        ) : null}
        <Field
          autoCapitalize="none"
          autoCorrect={false}
          label={workspaceModel.customEntryTypes.label}
          value={entryTypeQuery}
          onChangeText={setEntryTypeQuery}
          placeholder={workspaceModel.customEntryTypes.placeholder}
        />
        {workspaceModel.customEntryTypes.rows.length > 0 ? (
          workspaceModel.customEntryTypes.rows.map((entryTypeRow) => (
            <View key={entryTypeRow.id} style={styles.workspaceRow}>
              <Text style={styles.itemTitle}>{entryTypeRow.title}</Text>
              <MutedText>{entryTypeRow.descriptionText}</MutedText>
              <MutedText>Fields: {entryTypeRow.fieldsText}</MutedText>
              <ActionButton
                accessibilityHint="Deletes this custom entry type, its entries, and its relationships after confirmation."
                accessibilityLabel={`Delete custom entry type ${entryTypeRow.title}`}
                label={workspaceFeatureActions.deleteType}
                tone="danger"
                onPress={() =>
                  confirmMobileDestructiveAction('delete-entry-type', () =>
                    controller.permanentlyDeleteEntryType(entryTypeRow.id)
                  )
                }
              />
            </View>
          ))
        ) : (
          <MutedText>{workspaceModel.customEntryTypes.emptyText}</MutedText>
        )}
        {workspaceModel.customEntryTypes.hiddenCount > 0 ? (
          <MutedText>{workspaceModel.customEntryTypes.hiddenText}</MutedText>
        ) : null}
        {entryTypeDraftFields.map((field) => (
          <Field
            autoCapitalize={field.key === 'fields' ? 'words' : undefined}
            autoCorrect={field.key === 'fields' ? false : undefined}
            key={field.key}
            label={field.label}
            multiline={field.multiline}
            placeholder={field.placeholder}
            value={entryTypeDraft[field.key]}
            onChangeText={(value) => updateEntryTypeDraft(field.key, value)}
          />
        ))}
        <ButtonRow>
          <ActionButton
            label={workspaceFeatureActions.createEntryType}
            tone="accent"
            onPress={() => {
              if (controller.createEntryType(entryTypeDraft)) {
                setEntryTypeDraft(blankEntryTypeDraft);
              }
            }}
          />
        </ButtonRow>
      </SectionBlock>
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  workspaceRow: {
    borderColor: valgaronColors.border,
    borderRadius: valgaronRadius.md,
    borderWidth: 1,
    gap: valgaronSpacing.sm,
    padding: valgaronSpacing.md,
  },
  itemTitle: {
    color: valgaronColors.heading,
    fontSize: valgaronTypography.sizes.md,
    fontWeight: '700',
  },
});
