import { useEffect, useMemo, useRef, useState } from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import type {
  InFictionWorld,
  PlanetaryWorldDraft,
  WorkspaceDraft,
  WorldWorkspace,
} from '@valgaron/core';
import {
  formatExpansionControlLabel,
  formatHiddenCountText,
  getCodexHelpRoute,
  getCodexScreenIntro,
  formatWorkspaceFeatureAccessibilityLabel,
  getPlanetaryWorldDraftFieldLayout,
  getWorkspaceFormKicker,
  getWorkspaceFormTitle,
  getWorkspaceFeatureModel,
  getFeedbackTone,
  hasUnsavedChanges,
  lastActiveWorkspaceArchiveMessage,
  normalizePlanetaryWorldDraft,
  normalizeWorkspaceDraft,
  planetaryWorldDraftFrom,
  workspaceDraftFields,
  workspaceDraftFrom,
  workspaceFeatureActions,
  workspaceFeatureCopy,
  workspaceFeatureResultLimit,
} from '@valgaron/core';
import {
  valgaronColors,
  valgaronRadius,
  valgaronSpacing,
  valgaronTypography,
} from '@valgaron/ui-tokens';
import { useMobileCodex } from '../state/MobileCodexContext';
import { useMobileSectionPreferences } from '../state/useMobileSectionPreferences';
import {
  ActionButton,
  ButtonRow,
  Field,
  MutedText,
  MobileSectionDashboard,
  ScreenHeader,
  ScreenScroll,
  SectionBlock,
  StatusText,
} from './screenPrimitives';
import { confirmMobileDestructiveAction } from './mobileConfirm';
import { confirmDiscardUnsavedChangesOnMobile } from './unsavedChangesConfirm';
import { getMobileRouteHref } from '../navigation/mobileRoutes';

const workspaceDashboardSectionIds = [
  'workspaces.list',
  'workspaces.editor',
  'workspaces.worlds',
] as const;

export function WorkspacesScreen() {
  const controller = useMobileCodex();
  const dashboard = useMobileSectionPreferences({
    screenId: 'workspaces',
    sectionIds: workspaceDashboardSectionIds,
  });
  const intro = getCodexScreenIntro('workspaces');
  const activeWorkspaceIdRef = useRef(controller.activeWorld.id);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string | null>(
    controller.activeWorld.id
  );
  const [workspaceDraft, setWorkspaceDraft] = useState<WorkspaceDraft>(() =>
    workspaceDraftFrom(controller.activeWorld)
  );
  const [selectedPlanetaryWorldId, setSelectedPlanetaryWorldId] = useState<
    string | null
  >(null);
  const [planetaryWorldDraft, setPlanetaryWorldDraft] =
    useState<PlanetaryWorldDraft>(() => planetaryWorldDraftFrom());
  const [workspaceQuery, setWorkspaceQuery] = useState('');
  const [planetaryWorldQuery, setPlanetaryWorldQuery] = useState('');
  const [showAllWorkspaces, setShowAllWorkspaces] = useState(false);
  const [showAllPlanetaryWorlds, setShowAllPlanetaryWorlds] = useState(false);

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
      setWorkspaceDraft(workspaceDraftFrom());
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

  useEffect(() => {
    setShowAllWorkspaces(false);
  }, [controller.activeWorld.id, workspaceQuery]);

  useEffect(() => {
    setShowAllPlanetaryWorlds(false);
  }, [controller.activeWorld.id, planetaryWorldQuery]);

  const workspaceModel = useMemo(
    () =>
      getWorkspaceFeatureModel({
        activeWorld: controller.activeWorld,
        document: controller.document,
        queries: {
          workspaces: workspaceQuery,
          planetaryWorlds: planetaryWorldQuery,
        },
        resultLimits: {
          workspaces: showAllWorkspaces ? Number.MAX_SAFE_INTEGER : undefined,
          planetaryWorlds: showAllPlanetaryWorlds
            ? Number.MAX_SAFE_INTEGER
            : undefined,
        },
        selectedWorkspaceId,
      }),
    [
      controller.activeWorld,
      controller.document,
      planetaryWorldQuery,
      selectedWorkspaceId,
      showAllPlanetaryWorlds,
      showAllWorkspaces,
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
  const selectedPlanetaryWorld = selectedPlanetaryWorldId
    ? controller.activeWorld.planetaryWorlds.find(
        (planetaryWorld) => planetaryWorld.id === selectedPlanetaryWorldId
      ) ?? null
    : null;
  const planetaryWorldBaselineDraft = planetaryWorldDraftFrom(
    selectedPlanetaryWorld ?? undefined
  );
  const planetaryWorldFieldLayout = getPlanetaryWorldDraftFieldLayout();
  const isPlanetaryWorldDraftDirty = hasUnsavedChanges(
    planetaryWorldBaselineDraft,
    planetaryWorldDraft
  );
  const hasDirtyDraft = isWorkspaceDraftDirty || isPlanetaryWorldDraftDirty;

  function editWorkspace(workspace: WorldWorkspace) {
    if (selectedWorkspaceId === workspace.id) {
      return;
    }
    confirmDiscardUnsavedChangesOnMobile(hasDirtyDraft, () => {
      setSelectedWorkspaceId(workspace.id);
      setWorkspaceDraft(workspaceDraftFrom(workspace));
    });
  }

  function resetWorkspaceDraft(force = false) {
    const reset = () => {
      setSelectedWorkspaceId(null);
      setWorkspaceDraft(workspaceDraftFrom());
    };
    if (force) {
      reset();
      return;
    }
    confirmDiscardUnsavedChangesOnMobile(hasDirtyDraft, reset);
  }

  function shouldConfirmWorkspaceAction(workspaceId: string) {
    return (
      hasDirtyDraft &&
      (workspaceId === controller.activeWorld.id ||
        workspaceId === selectedWorkspaceId)
    );
  }

  function archiveWorkspace(workspace: WorldWorkspace) {
    confirmDiscardUnsavedChangesOnMobile(
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
    confirmDiscardUnsavedChangesOnMobile(hasDirtyDraft, () =>
      controller.duplicateWorkspace(workspaceId)
    );
  }

  function deleteWorkspace(workspaceId: string, workspaceName: string) {
    confirmDiscardUnsavedChangesOnMobile(
      shouldConfirmWorkspaceAction(workspaceId),
      () =>
        confirmMobileDestructiveAction(
          'delete-workspace',
          () => controller.permanentlyDeleteWorkspace(workspaceId),
          workspaceName
        )
    );
  }

  function editPlanetaryWorld(planetaryWorld: InFictionWorld) {
    if (selectedPlanetaryWorldId === planetaryWorld.id) {
      return;
    }
    confirmDiscardUnsavedChangesOnMobile(hasDirtyDraft, () => {
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
    confirmDiscardUnsavedChangesOnMobile(hasDirtyDraft, reset);
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
    confirmDiscardUnsavedChangesOnMobile(
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
    confirmDiscardUnsavedChangesOnMobile(
      selectedPlanetaryWorldId === planetaryWorld.id &&
        isPlanetaryWorldDraftDirty,
      () =>
        confirmMobileDestructiveAction(
          'delete-planetary-world',
          () => controller.permanentlyDeletePlanetaryWorld(planetaryWorld.id),
          planetaryWorld.name
        )
    );
  }

  function updatePlanetaryWorldDraft(
    key: (typeof planetaryWorldFieldLayout.fields)[number]['key'],
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

  return (
    <ScreenScroll>
      <ScreenHeader title={intro.title} detail={intro.detail} />
      {controller.formMessage ? (
        <StatusText tone={getFeedbackTone(controller.formMessage)}>
          {controller.formMessage}
        </StatusText>
      ) : null}

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
          sectionId="workspaces.list"
          title={workspaceFeatureCopy.sections.workspaces}
        >
          <MutedText>{workspaceModel.workspaces.countLabel}</MutedText>
          <ButtonRow>
            <ActionButton
              label={workspaceFeatureActions.workspaceHelp}
              onPress={() =>
                confirmDiscardUnsavedChangesOnMobile(hasDirtyDraft, () =>
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
                      accessibilityLabel={formatWorkspaceFeatureAccessibilityLabel(
                        'edit-workspace',
                        workspace.name
                      )}
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
                        confirmDiscardUnsavedChangesOnMobile(
                          hasDirtyDraft,
                          () => controller.switchWorkspace(workspace.id)
                        )
                      }
                    />
                    <ActionButton
                      accessibilityLabel={
                        workspace.status === 'archived'
                          ? formatWorkspaceFeatureAccessibilityLabel(
                              'restore-workspace',
                              workspace.name
                            )
                          : formatWorkspaceFeatureAccessibilityLabel(
                              'archive-workspace',
                              workspace.name
                            )
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
                      accessibilityLabel={formatWorkspaceFeatureAccessibilityLabel(
                        'duplicate-workspace',
                        workspace.name
                      )}
                      label={workspaceFeatureActions.duplicate}
                      onPress={() => duplicateWorkspace(workspace.id)}
                    />
                    <ActionButton
                      accessibilityHint={workspaceRow.deleteAccessibilityHint}
                      accessibilityLabel={formatWorkspaceFeatureAccessibilityLabel(
                        'delete-workspace',
                        workspace.name
                      )}
                      label={workspaceFeatureActions.deletePermanently}
                      tone="danger"
                      disabled={!actionState.canDelete}
                      onPress={() =>
                        deleteWorkspace(workspace.id, workspace.name)
                      }
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
            <MutedText>
              {formatHiddenCountText({
                hiddenCount: workspaceModel.workspaces.hiddenCount,
                singularItemLabel: 'workspace',
                pluralItemLabel: 'workspaces',
              })}
            </MutedText>
          ) : null}
          {workspaceModel.workspaces.totalCount >
          workspaceFeatureResultLimit ? (
            <ButtonRow>
              <ActionButton
                expanded={showAllWorkspaces}
                label={formatExpansionControlLabel({
                  isExpanded: showAllWorkspaces,
                  hiddenCount: workspaceModel.workspaces.hiddenCount,
                  pluralItemLabel: 'Workspaces',
                  singularItemLabel: 'Workspace',
                })}
                onPress={() =>
                  setShowAllWorkspaces((currentValue) => !currentValue)
                }
              />
            </ButtonRow>
          ) : null}
        </SectionBlock>

        <SectionBlock
          sectionId="workspaces.editor"
          title={`${getWorkspaceFormKicker(
            selectedWorkspace?.name
          )}: ${getWorkspaceFormTitle(selectedWorkspace?.name)}`}
        >
          {isWorkspaceDraftDirty ? (
            <StatusText tone="warning">
              {workspaceFeatureCopy.draftStatus.workspace}
            </StatusText>
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
                  ? workspaceFeatureActions.updateWorkspace
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
              onPress={() => resetWorkspaceDraft()}
            />
          </ButtonRow>
        </SectionBlock>

        <SectionBlock
          sectionId="workspaces.worlds"
          title={workspaceFeatureCopy.sections.planetaryWorlds}
        >
          <MutedText>{workspaceModel.planetaryWorlds.countLabel}</MutedText>
          {isPlanetaryWorldDraftDirty ? (
            <StatusText tone="warning">
              {workspaceFeatureCopy.draftStatus.planetaryWorld}
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
                      accessibilityLabel={formatWorkspaceFeatureAccessibilityLabel(
                        'edit-planetary-world',
                        planetaryWorld.name
                      )}
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
                          ? formatWorkspaceFeatureAccessibilityLabel(
                              'restore-planetary-world',
                              planetaryWorld.name
                            )
                          : formatWorkspaceFeatureAccessibilityLabel(
                              'archive-planetary-world',
                              planetaryWorld.name
                            )
                      }
                      label={
                        planetaryWorld.status === 'archived'
                          ? workspaceFeatureActions.restore
                          : workspaceFeatureActions.archive
                      }
                      onPress={() => archivePlanetaryWorld(planetaryWorld)}
                    />
                    <ActionButton
                      accessibilityHint={
                        planetaryWorldRow.deleteAccessibilityHint
                      }
                      accessibilityLabel={formatWorkspaceFeatureAccessibilityLabel(
                        'delete-planetary-world',
                        planetaryWorld.name
                      )}
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
            <MutedText>
              {formatHiddenCountText({
                hiddenCount: workspaceModel.planetaryWorlds.hiddenCount,
                singularItemLabel: 'in-fiction world',
                pluralItemLabel: 'in-fiction worlds',
              })}
            </MutedText>
          ) : null}
          {workspaceModel.planetaryWorlds.totalCount >
          workspaceFeatureResultLimit ? (
            <ButtonRow>
              <ActionButton
                expanded={showAllPlanetaryWorlds}
                label={formatExpansionControlLabel({
                  isExpanded: showAllPlanetaryWorlds,
                  hiddenCount: workspaceModel.planetaryWorlds.hiddenCount,
                  pluralItemLabel: 'In-Fiction Worlds',
                  singularItemLabel: 'In-Fiction World',
                })}
                onPress={() =>
                  setShowAllPlanetaryWorlds((currentValue) => !currentValue)
                }
              />
            </ButtonRow>
          ) : null}
          {planetaryWorldFieldLayout.fields.map((field) => (
            <Field
              autoCapitalize={field.key === 'tags' ? 'words' : undefined}
              autoCorrect={field.key === 'tags' ? false : undefined}
              key={field.key}
              label={field.label}
              multiline={'multiline' in field ? field.multiline : undefined}
              placeholder={
                'placeholder' in field ? field.placeholder : undefined
              }
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
                  ? workspaceFeatureActions.updateWorld
                  : workspaceFeatureActions.createWorld
              }
              tone="accent"
              onPress={savePlanetaryWorld}
            />
            <ActionButton
              label={workspaceFeatureActions.newWorldDraft}
              onPress={() => resetPlanetaryWorldDraft()}
            />
          </ButtonRow>
        </SectionBlock>
      </MobileSectionDashboard>
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
