import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { NavLink } from 'react-router-dom';
import {
  type EntryTypeDraft,
  formatDraftValidationErrors,
  formatDestructiveActionTitle,
  formatUpdatedAt,
  getCodexHelpRoute,
  getCodexScreenIntro,
  getDestructiveActionCopy,
  getEntries,
  getWorkspaceActionState,
  lastActiveWorkspaceArchiveMessage,
  validateEntryTypeDraft,
  validateWorkspaceDraft,
  type WorkspaceDraft,
} from '@valgaron/core';
import type {
  WorldDocument,
  WorldSectionConfig,
  WorldWorkspace,
} from '../types';
import {
  confirmDiscardUnsavedChanges,
  hasUnsavedChanges,
  useUnsavedChangesWarning,
} from '../Utlilities/unsavedChanges';
import { useDialogFocus } from '../Utlilities/dialogFocus';

type PendingDelete =
  | { type: 'workspace'; id: string; name: string }
  | { type: 'entry-type'; id: string; name: string };

const pendingDeleteActionIdByType = {
  workspace: 'delete-workspace',
  'entry-type': 'delete-entry-type',
} as const satisfies Record<PendingDelete['type'], string>;

function workspaceDraftFrom(workspace?: WorldWorkspace): WorkspaceDraft {
  return {
    name: workspace?.name ?? '',
    summary: workspace?.summary ?? '',
    defaultEra: workspace?.defaultEra ?? '',
  };
}

function emptyEntryTypeDraft(): EntryTypeDraft {
  return {
    title: '',
    singularTitle: '',
    description: '',
    fields: '',
  };
}

function getSectionEntryCount(
  workspace: WorldWorkspace,
  section: WorldSectionConfig
) {
  return getEntries(workspace.codex, section.id).length;
}

function ConfirmDeleteDialog({
  pendingDelete,
  onCancel,
  onConfirm,
}: {
  pendingDelete: PendingDelete;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const dialogRef = useDialogFocus<HTMLElement>(true, onCancel);
  const actionId = pendingDeleteActionIdByType[pendingDelete.type];
  const copy = getDestructiveActionCopy(actionId);

  return (
    <div className="vwb-dialog-backdrop" role="presentation">
      <section
        aria-labelledby="workspace-delete-title"
        aria-describedby="workspace-delete-description"
        className="vwb-dialog"
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        tabIndex={-1}
      >
        <p className="vwb-kicker">Permanent delete</p>
        <h2 id="workspace-delete-title">
          {formatDestructiveActionTitle(actionId, pendingDelete.name)}
        </h2>
        <p id="workspace-delete-description">{copy.message}</p>
        <div className="vwb-form-actions">
          <button
            className="vwb-secondary-button"
            type="button"
            onClick={onCancel}
          >
            Cancel
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

export function WorkspacesPage({
  activeWorld,
  document,
  onArchiveWorkspace,
  onCreateEntryType,
  onCreateWorkspace,
  onDeleteEntryType,
  onDeleteWorkspace,
  onDuplicateWorkspace,
  onSwitchWorkspace,
  onUpdateWorkspace,
}: {
  activeWorld: WorldWorkspace;
  document: WorldDocument;
  onArchiveWorkspace: (workspaceId: string, archived: boolean) => void;
  onCreateEntryType: (draft: EntryTypeDraft) => void;
  onCreateWorkspace: (draft: WorkspaceDraft) => void;
  onDeleteEntryType: (sectionId: string) => void;
  onDeleteWorkspace: (workspaceId: string) => void;
  onDuplicateWorkspace: (workspaceId: string) => void;
  onSwitchWorkspace: (workspaceId: string) => void;
  onUpdateWorkspace: (workspaceId: string, draft: WorkspaceDraft) => void;
}) {
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState(
    activeWorld.id
  );
  const [workspaceDraft, setWorkspaceDraft] = useState<WorkspaceDraft>(() =>
    workspaceDraftFrom(activeWorld)
  );
  const [workspaceError, setWorkspaceError] = useState('');
  const [entryTypeDraft, setEntryTypeDraft] = useState<EntryTypeDraft>({
    ...emptyEntryTypeDraft(),
  });
  const [entryTypeError, setEntryTypeError] = useState('');
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(
    null
  );
  const activeWorkspaceIdRef = useRef(activeWorld.id);
  const intro = getCodexScreenIntro('workspaces');

  const selectedWorkspace = useMemo(
    () =>
      document.worlds.find((workspace) => workspace.id === selectedWorkspaceId),
    [document.worlds, selectedWorkspaceId]
  );
  const activeWorkspaceCount = document.worlds.filter(
    (workspace) => workspace.status !== 'archived'
  ).length;
  const selectedWorkspaceDraftKey = selectedWorkspace?.id ?? '';
  const selectedWorkspaceActionState = selectedWorkspace
    ? getWorkspaceActionState({
        activeWorkspaceId: activeWorld.id,
        activeWorkspaceCount,
        workspace: selectedWorkspace,
        workspaceCount: document.worlds.length,
      })
    : null;
  const customEntryTypes = activeWorld.entryTypes.filter(
    (section) => section.custom
  );
  const workspaceBaselineDraft = workspaceDraftFrom(selectedWorkspace);
  const entryTypeBaselineDraft = emptyEntryTypeDraft();
  const isWorkspaceDraftDirty = hasUnsavedChanges(
    workspaceBaselineDraft,
    workspaceDraft
  );
  const isEntryTypeDraftDirty = hasUnsavedChanges(
    entryTypeBaselineDraft,
    entryTypeDraft
  );
  const hasDirtyDraft = isWorkspaceDraftDirty || isEntryTypeDraftDirty;

  useUnsavedChangesWarning(hasDirtyDraft);

  useEffect(() => {
    if (activeWorkspaceIdRef.current === activeWorld.id) {
      return;
    }
    activeWorkspaceIdRef.current = activeWorld.id;
    setSelectedWorkspaceId(activeWorld.id);
    setWorkspaceDraft(workspaceDraftFrom(activeWorld));
  }, [activeWorld]);

  useEffect(() => {
    setWorkspaceDraft(workspaceDraftFrom(selectedWorkspace));
    setWorkspaceError('');
  }, [selectedWorkspaceDraftKey]);

  const submitWorkspace = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validation = validateWorkspaceDraft(workspaceDraft);
    if (!validation.ok) {
      setWorkspaceError(formatDraftValidationErrors(validation));
      return;
    }
    if (selectedWorkspace) {
      onUpdateWorkspace(selectedWorkspace.id, workspaceDraft);
    } else {
      onCreateWorkspace(workspaceDraft);
    }
    setWorkspaceError('');
  };

  const submitEntryType = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validation = validateEntryTypeDraft(entryTypeDraft);
    if (!validation.ok) {
      setEntryTypeError(formatDraftValidationErrors(validation));
      return;
    }
    onCreateEntryType(entryTypeDraft);
    setEntryTypeDraft({
      ...emptyEntryTypeDraft(),
    });
    setEntryTypeError('');
  };

  const discardIfAllowed = (action: () => void) => {
    if (confirmDiscardUnsavedChanges(hasDirtyDraft)) {
      action();
    }
  };

  const confirmDelete = () => {
    if (!pendingDelete) {
      return;
    }
    if (pendingDelete.type === 'workspace') {
      onDeleteWorkspace(pendingDelete.id);
    }
    if (pendingDelete.type === 'entry-type') {
      onDeleteEntryType(pendingDelete.id);
    }
    setPendingDelete(null);
  };

  return (
    <main
      className="vwb-main vwb-workspace-layout"
      id="main-content"
      tabIndex={-1}
    >
      <section className="vwb-hero" aria-labelledby="workspaces-title">
        <div>
          <p className="vwb-kicker">{intro.kicker}</p>
          <h1 id="workspaces-title">{intro.title}</h1>
        </div>
        <p>{intro.detail}</p>
        <NavLink
          className="vwb-secondary-button"
          to={getCodexHelpRoute('workspaces')}
          onClick={(event) => {
            if (!confirmDiscardUnsavedChanges(hasDirtyDraft)) {
              event.preventDefault();
            }
          }}
        >
          Workspace Help
        </NavLink>
      </section>

      <section className="vwb-panel" aria-labelledby="workspace-manager-title">
        <div className="vwb-section-heading">
          <div>
            <p className="vwb-kicker">
              {document.worlds.length} project workspace
              {document.worlds.length === 1 ? '' : 's'}
            </p>
            <h2 id="workspace-manager-title">Project/universe workspaces</h2>
          </div>
          <button
            className="vwb-secondary-button"
            type="button"
            onClick={() =>
              discardIfAllowed(() => {
                setSelectedWorkspaceId('');
                setWorkspaceDraft(workspaceDraftFrom());
              })
            }
          >
            New Workspace
          </button>
        </div>
        <div className="vwb-management-grid">
          <div className="vwb-entry-list">
            {document.worlds.map((workspace) => {
              const actionState = getWorkspaceActionState({
                activeWorkspaceId: activeWorld.id,
                activeWorkspaceCount,
                workspace,
                workspaceCount: document.worlds.length,
              });
              return (
                <article
                  className={`vwb-entry-card ${
                    workspace.id === activeWorld.id ? 'is-selected' : ''
                  }`}
                  key={workspace.id}
                >
                  <div className="vwb-entry-card-header">
                    <div>
                      <p className="vwb-entry-kind">
                        {workspace.status === 'archived'
                          ? 'Archived workspace'
                          : 'Project/universe workspace'}
                      </p>
                      <h3>{workspace.name}</h3>
                    </div>
                    {workspace.id === activeWorld.id ? (
                      <span className="vwb-status-pill">Active</span>
                    ) : null}
                  </div>
                  <p>{workspace.summary || 'No summary yet.'}</p>
                  <small>Updated {formatUpdatedAt(workspace.updatedAt)}</small>
                  <div className="vwb-form-actions">
                    <button
                      className="vwb-secondary-button"
                      type="button"
                      onClick={() =>
                        discardIfAllowed(() =>
                          setSelectedWorkspaceId(workspace.id)
                        )
                      }
                    >
                      Edit
                    </button>
                    {actionState.canSwitch ? (
                      <button
                        className="vwb-primary-button"
                        type="button"
                        onClick={() =>
                          discardIfAllowed(() =>
                            onSwitchWorkspace(workspace.id)
                          )
                        }
                      >
                        {actionState.switchLabel}
                      </button>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>
          <form className="vwb-form" onSubmit={submitWorkspace}>
            <div className="vwb-section-heading">
              <div>
                <p className="vwb-kicker">
                  {selectedWorkspace ? 'Edit workspace' : 'New workspace'}
                </p>
                <h3>
                  {selectedWorkspace
                    ? selectedWorkspace.name
                    : 'Create project/universe'}
                </h3>
              </div>
              {isWorkspaceDraftDirty ? (
                <span className="vwb-status-pill">Unsaved</span>
              ) : null}
            </div>
            <label>
              Workspace name
              <input
                value={workspaceDraft.name}
                onChange={(event) =>
                  setWorkspaceDraft({
                    ...workspaceDraft,
                    name: event.target.value,
                  })
                }
              />
            </label>
            <label>
              Summary
              <textarea
                rows={4}
                value={workspaceDraft.summary}
                onChange={(event) =>
                  setWorkspaceDraft({
                    ...workspaceDraft,
                    summary: event.target.value,
                  })
                }
              />
            </label>
            <label>
              Default era
              <input
                value={workspaceDraft.defaultEra}
                onChange={(event) =>
                  setWorkspaceDraft({
                    ...workspaceDraft,
                    defaultEra: event.target.value,
                  })
                }
              />
            </label>
            {workspaceError ? (
              <p className="vwb-form-error">{workspaceError}</p>
            ) : null}
            <div className="vwb-form-actions">
              <button className="vwb-primary-button" type="submit">
                {selectedWorkspace ? 'Save Workspace' : 'Create Workspace'}
              </button>
              {selectedWorkspace ? (
                <>
                  <button
                    className="vwb-secondary-button"
                    type="button"
                    onClick={() =>
                      discardIfAllowed(() =>
                        onDuplicateWorkspace(selectedWorkspace.id)
                      )
                    }
                  >
                    Duplicate
                  </button>
                  <button
                    className="vwb-secondary-button"
                    type="button"
                    disabled={!selectedWorkspaceActionState?.canArchive}
                    onClick={() =>
                      discardIfAllowed(() =>
                        onArchiveWorkspace(
                          selectedWorkspace.id,
                          selectedWorkspace.status !== 'archived'
                        )
                      )
                    }
                  >
                    {selectedWorkspace.status === 'archived'
                      ? 'Restore'
                      : 'Archive'}
                  </button>
                  <button
                    className="vwb-secondary-button vwb-danger-button"
                    type="button"
                    disabled={!selectedWorkspaceActionState?.canDelete}
                    onClick={() =>
                      discardIfAllowed(() =>
                        setPendingDelete({
                          type: 'workspace',
                          id: selectedWorkspace.id,
                          name: selectedWorkspace.name,
                        })
                      )
                    }
                  >
                    Delete Permanently
                  </button>
                </>
              ) : null}
            </div>
            {selectedWorkspace && !selectedWorkspaceActionState?.canArchive ? (
              <p className="vwb-inline-status">
                {lastActiveWorkspaceArchiveMessage}
              </p>
            ) : null}
          </form>
        </div>
      </section>

      <section className="vwb-panel" aria-labelledby="custom-types-title">
        <div className="vwb-section-heading">
          <div>
            <p className="vwb-kicker">{customEntryTypes.length} custom types</p>
            <h2 id="custom-types-title">Custom entry types</h2>
          </div>
        </div>
        <div className="vwb-management-grid">
          <div className="vwb-entry-list">
            {customEntryTypes.length > 0 ? (
              customEntryTypes.map((section) => (
                <article className="vwb-entry-card" key={section.id}>
                  <div className="vwb-entry-card-header">
                    <div>
                      <p className="vwb-entry-kind">Custom codex section</p>
                      <h3>{section.title}</h3>
                    </div>
                    <span className="vwb-status-pill">
                      {getSectionEntryCount(activeWorld, section)} entries
                    </span>
                  </div>
                  <p>{section.description || 'No description yet.'}</p>
                  <small>
                    Fields:{' '}
                    {section.detailFields
                      .map((field) => field.label)
                      .join(', ')}
                  </small>
                  <div className="vwb-form-actions">
                    <button
                      className="vwb-secondary-button vwb-danger-button"
                      type="button"
                      onClick={() =>
                        discardIfAllowed(() =>
                          setPendingDelete({
                            type: 'entry-type',
                            id: section.id,
                            name: section.title,
                          })
                        )
                      }
                    >
                      Delete Type
                    </button>
                  </div>
                </article>
              ))
            ) : (
              <div className="vwb-empty-results" role="status">
                <strong>No custom entry types yet.</strong>
                <p>Create one when the built-in sections are not enough.</p>
              </div>
            )}
          </div>
          <form className="vwb-form" onSubmit={submitEntryType}>
            <div className="vwb-section-heading">
              <div>
                <p className="vwb-kicker">New custom section</p>
                <h3>Create entry type</h3>
              </div>
              {isEntryTypeDraftDirty ? (
                <span className="vwb-status-pill">Unsaved</span>
              ) : null}
            </div>
            <div className="vwb-form-grid">
              <label>
                Section title
                <input
                  value={entryTypeDraft.title}
                  onChange={(event) =>
                    setEntryTypeDraft({
                      ...entryTypeDraft,
                      title: event.target.value,
                    })
                  }
                  placeholder="Artifacts"
                />
              </label>
              <label>
                Singular title
                <input
                  value={entryTypeDraft.singularTitle}
                  onChange={(event) =>
                    setEntryTypeDraft({
                      ...entryTypeDraft,
                      singularTitle: event.target.value,
                    })
                  }
                  placeholder="Artifact"
                />
              </label>
            </div>
            <label>
              Description
              <textarea
                rows={3}
                value={entryTypeDraft.description}
                onChange={(event) =>
                  setEntryTypeDraft({
                    ...entryTypeDraft,
                    description: event.target.value,
                  })
                }
              />
            </label>
            <label>
              Detail fields
              <input
                value={entryTypeDraft.fields}
                onChange={(event) =>
                  setEntryTypeDraft({
                    ...entryTypeDraft,
                    fields: event.target.value,
                  })
                }
                placeholder="Origin, Power, Current holder"
              />
            </label>
            {entryTypeError ? (
              <p className="vwb-form-error">{entryTypeError}</p>
            ) : null}
            <div className="vwb-form-actions">
              <button className="vwb-primary-button" type="submit">
                Create Entry Type
              </button>
            </div>
          </form>
        </div>
      </section>

      {pendingDelete ? (
        <ConfirmDeleteDialog
          pendingDelete={pendingDelete}
          onCancel={() => setPendingDelete(null)}
          onConfirm={confirmDelete}
        />
      ) : null}
    </main>
  );
}
