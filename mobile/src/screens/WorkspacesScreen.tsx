import { useEffect, useMemo, useRef, useState } from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import type {
  EntryTypeDraft,
  WorkspaceDraft,
  WorldWorkspace,
} from '@valgaron/core';
import {
  getCodexHelpRoute,
  getCodexScreenIntro,
  hasUnsavedChanges,
  lastActiveWorkspaceArchiveMessage,
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
import { getMobileWorkspaceActionState } from '../state/mobileCodexViewModels';
import { getMobileFeedbackTone } from '../state/mobileFeedback';
import { getMobileRouteHref } from '../navigation/mobileRoutes';

const MOBILE_WORKSPACE_RESULT_LIMIT = 40;
const MOBILE_ENTRY_TYPE_RESULT_LIMIT = 40;

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

function matchesQuery(values: readonly string[], query: string): boolean {
  const normalizedQuery = query.trim().toLowerCase();
  return (
    !normalizedQuery ||
    values.some((value) => value.toLowerCase().includes(normalizedQuery))
  );
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
  const [workspaceQuery, setWorkspaceQuery] = useState('');
  const [entryTypeQuery, setEntryTypeQuery] = useState('');

  useEffect(() => {
    if (activeWorkspaceIdRef.current === controller.activeWorld.id) {
      return;
    }
    activeWorkspaceIdRef.current = controller.activeWorld.id;
    setSelectedWorkspaceId(controller.activeWorld.id);
    setWorkspaceDraft(workspaceDraftFrom(controller.activeWorld));
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

  const selectedWorkspace = selectedWorkspaceId
    ? controller.document.worlds.find(
        (workspace) => workspace.id === selectedWorkspaceId
      ) ?? null
    : null;
  const activeWorkspaceCount = controller.document.worlds.filter(
    (workspace) => workspace.status !== 'archived'
  ).length;
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
  const hasDirtyDraft = isWorkspaceDraftDirty || isEntryTypeDraftDirty;
  const customEntryTypes = useMemo(
    () => controller.activeWorld.entryTypes.filter((section) => section.custom),
    [controller.activeWorld.entryTypes]
  );
  const matchingWorkspaces = useMemo(
    () =>
      controller.document.worlds.filter((workspace) =>
        matchesQuery(
          [
            workspace.id,
            workspace.name,
            workspace.summary,
            workspace.defaultEra,
            workspace.status,
          ],
          workspaceQuery
        )
      ),
    [controller.document.worlds, workspaceQuery]
  );
  const displayedWorkspaces = matchingWorkspaces.slice(
    0,
    MOBILE_WORKSPACE_RESULT_LIMIT
  );
  const hiddenWorkspaceCount = Math.max(
    0,
    matchingWorkspaces.length - displayedWorkspaces.length
  );
  const matchingCustomEntryTypes = useMemo(
    () =>
      customEntryTypes.filter((section) =>
        matchesQuery(
          [
            section.id,
            section.title,
            section.singularTitle,
            section.description,
            ...section.detailFields.flatMap((field) => [
              field.key,
              field.label,
            ]),
          ],
          entryTypeQuery
        )
      ),
    [customEntryTypes, entryTypeQuery]
  );
  const displayedCustomEntryTypes = matchingCustomEntryTypes.slice(
    0,
    MOBILE_ENTRY_TYPE_RESULT_LIMIT
  );
  const hiddenCustomEntryTypeCount = Math.max(
    0,
    matchingCustomEntryTypes.length - displayedCustomEntryTypes.length
  );

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

  return (
    <ScreenScroll>
      <ScreenHeader title={intro.title} detail={intro.detail} />
      {controller.formMessage ? (
        <StatusText tone={getMobileFeedbackTone(controller.formMessage)}>
          {controller.formMessage}
        </StatusText>
      ) : null}

      <SectionBlock title="Saved Workspaces">
        <ButtonRow>
          <ActionButton
            label="Workspace Help"
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
          label="Search workspaces"
          value={workspaceQuery}
          onChangeText={setWorkspaceQuery}
          placeholder="Name, summary, era, status, or id"
        />
        {displayedWorkspaces.length > 0 ? (
          displayedWorkspaces.map((workspace) => {
            const actionState = getMobileWorkspaceActionState({
              activeWorkspaceId: controller.activeWorld.id,
              activeWorkspaceCount,
              workspace,
              workspaceCount: controller.document.worlds.length,
            });
            return (
              <View key={workspace.id} style={styles.workspaceRow}>
                <Text style={styles.itemTitle}>{workspace.name}</Text>
                <MutedText>
                  {workspace.status} -{' '}
                  {workspace.defaultEra || 'No default era'}
                </MutedText>
                <MutedText>{workspace.summary || 'No summary yet.'}</MutedText>
                <ButtonRow>
                  <ActionButton
                    accessibilityLabel={`Edit workspace ${workspace.name}`}
                    label="Edit"
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
                      workspace.status === 'archived' ? 'Restore' : 'Archive'
                    }
                    disabled={!actionState.canArchive}
                    onPress={() => archiveWorkspace(workspace)}
                  />
                  <ActionButton
                    accessibilityLabel={`Duplicate workspace ${workspace.name}`}
                    label="Duplicate"
                    onPress={() => duplicateWorkspace(workspace.id)}
                  />
                  <ActionButton
                    accessibilityHint="Deletes this workspace after confirmation."
                    accessibilityLabel={`Delete workspace ${workspace.name}`}
                    label="Delete"
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
          <MutedText>No workspaces match this search.</MutedText>
        )}
        {hiddenWorkspaceCount > 0 ? (
          <MutedText>
            Refine workspace search to show {hiddenWorkspaceCount} more
            workspace{hiddenWorkspaceCount === 1 ? '' : 's'}.
          </MutedText>
        ) : null}
      </SectionBlock>

      <SectionBlock
        title={
          selectedWorkspace
            ? `Edit ${selectedWorkspace.name}`
            : 'New Workspace Metadata'
        }
      >
        {isWorkspaceDraftDirty ? (
          <StatusText tone="warning">Unsaved workspace draft.</StatusText>
        ) : null}
        <Field
          label="Name"
          value={workspaceDraft.name}
          onChangeText={(value) =>
            setWorkspaceDraft((current) => ({ ...current, name: value }))
          }
        />
        <Field
          label="Summary"
          value={workspaceDraft.summary}
          multiline
          onChangeText={(value) =>
            setWorkspaceDraft((current) => ({ ...current, summary: value }))
          }
        />
        <Field
          label="Default era"
          value={workspaceDraft.defaultEra}
          onChangeText={(value) =>
            setWorkspaceDraft((current) => ({ ...current, defaultEra: value }))
          }
        />
        <ButtonRow>
          <ActionButton
            label={selectedWorkspace ? 'Save Workspace' : 'Create Workspace'}
            tone="accent"
            onPress={() => {
              const didSave = selectedWorkspace
                ? controller.updateWorkspace(
                    selectedWorkspace.id,
                    workspaceDraft
                  )
                : controller.createWorkspace(workspaceDraft);
              if (didSave && !selectedWorkspace) {
                resetWorkspaceDraft(true);
              }
            }}
          />
          <ActionButton
            label="New Workspace Draft"
            onPress={resetWorkspaceDraft}
          />
        </ButtonRow>
      </SectionBlock>

      <SectionBlock title="Custom Entry Types">
        {isEntryTypeDraftDirty ? (
          <StatusText tone="warning">Unsaved custom type draft.</StatusText>
        ) : null}
        <Field
          autoCapitalize="none"
          autoCorrect={false}
          label="Search custom entry types"
          value={entryTypeQuery}
          onChangeText={setEntryTypeQuery}
          placeholder="Title, field, description, or id"
        />
        {displayedCustomEntryTypes.length > 0 ? (
          displayedCustomEntryTypes.map((section) => (
            <View key={section.id} style={styles.workspaceRow}>
              <Text style={styles.itemTitle}>{section.title}</Text>
              <MutedText>{section.description || 'No description.'}</MutedText>
              <MutedText>
                Fields:{' '}
                {section.detailFields.length > 0
                  ? section.detailFields.map((field) => field.label).join(', ')
                  : 'No custom fields'}
              </MutedText>
              <ActionButton
                accessibilityHint="Deletes this custom entry type, its entries, and its relationships after confirmation."
                accessibilityLabel={`Delete custom entry type ${section.title}`}
                label="Delete"
                tone="danger"
                onPress={() =>
                  confirmMobileDestructiveAction('delete-entry-type', () =>
                    controller.permanentlyDeleteEntryType(section.id)
                  )
                }
              />
            </View>
          ))
        ) : entryTypeQuery.trim() ? (
          <MutedText>No custom entry types match this search.</MutedText>
        ) : (
          <MutedText>
            No custom entry types yet. Create one when the built-in sections are
            not enough.
          </MutedText>
        )}
        {hiddenCustomEntryTypeCount > 0 ? (
          <MutedText>
            Refine custom type search to show {hiddenCustomEntryTypeCount} more
            type{hiddenCustomEntryTypeCount === 1 ? '' : 's'}.
          </MutedText>
        ) : null}
        <Field
          label="Plural title"
          value={entryTypeDraft.title}
          onChangeText={(value) =>
            setEntryTypeDraft((current) => ({ ...current, title: value }))
          }
        />
        <Field
          label="Singular title"
          value={entryTypeDraft.singularTitle}
          onChangeText={(value) =>
            setEntryTypeDraft((current) => ({
              ...current,
              singularTitle: value,
            }))
          }
        />
        <Field
          label="Description"
          value={entryTypeDraft.description}
          multiline
          onChangeText={(value) =>
            setEntryTypeDraft((current) => ({
              ...current,
              description: value,
            }))
          }
        />
        <Field
          autoCapitalize="words"
          autoCorrect={false}
          label="Fields"
          value={entryTypeDraft.fields}
          placeholder="Origin, Cost, Current holder"
          onChangeText={(value) =>
            setEntryTypeDraft((current) => ({ ...current, fields: value }))
          }
        />
        <ButtonRow>
          <ActionButton
            label="Create Type"
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
