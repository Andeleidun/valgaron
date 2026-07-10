import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { NavLink } from 'react-router-dom';
import {
  formatExpansionControlLabel,
  formatHiddenCountText,
  destructiveActionDialogCopy,
  formatDraftValidationErrors,
  formatDestructiveActionTitle,
  formatWorkspaceFeatureAccessibilityLabel,
  getCodexHelpRoute,
  getCodexScreenIntro,
  getDestructiveActionCopy,
  getWorkspaceFeatureModel,
  lastActiveWorkspaceArchiveMessage,
  normalizePlanetaryWorldDraft,
  normalizeWorkspaceDraft,
  getPlanetaryWorldDraftFieldLayout,
  planetaryWorldDraftFrom,
  validatePlanetaryWorldDraft,
  validateWorkspaceDraft,
  workspaceDraftFields,
  workspaceDraftFrom,
  workspaceFeatureActions,
  workspaceFeatureCopy,
  workspaceFeatureResultLimit,
  getPlanetaryWorldFormKicker,
  getPlanetaryWorldFormTitle,
  getWorkspaceFormKicker,
  getWorkspaceFormTitle,
  type InFictionWorld,
  type PlanetaryWorldDraft,
  type WorldDocument,
  type WorldWorkspace,
  type WorkspaceDraft,
} from '@valgaron/core';
import { DashboardPage } from '../Components/Dashboard/DashboardPage';
import {
  confirmDiscardUnsavedChanges,
  hasUnsavedChanges,
  useUnsavedChangesWarning,
} from '../Utlilities/unsavedChanges';
import { useDialogFocus } from '../Utlilities/dialogFocus';

type PendingDelete =
  | { type: 'workspace'; id: string; name: string }
  | { type: 'planetary-world'; id: string; name: string };

const pendingDeleteActionIdByType = {
  workspace: 'delete-workspace',
  'planetary-world': 'delete-planetary-world',
} as const satisfies Record<PendingDelete['type'], string>;

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
        <p className="vwb-kicker">
          {destructiveActionDialogCopy.permanentDeleteKickerLabel}
        </p>
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
            {destructiveActionDialogCopy.cancelLabel}
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
  onCreateWorkspace,
  onDeletePlanetaryWorld,
  onDeleteWorkspace,
  onDuplicateWorkspace,
  onArchivePlanetaryWorld,
  onSavePlanetaryWorld,
  onSwitchWorkspace,
  onUpdateWorkspace,
}: {
  activeWorld: WorldWorkspace;
  document: WorldDocument;
  onArchiveWorkspace: (workspaceId: string, archived: boolean) => void;
  onArchivePlanetaryWorld: (
    planetaryWorldId: string,
    archived: boolean
  ) => void;
  onCreateWorkspace: (draft: WorkspaceDraft) => void;
  onDeletePlanetaryWorld: (planetaryWorldId: string) => void;
  onDeleteWorkspace: (workspaceId: string) => void;
  onDuplicateWorkspace: (workspaceId: string) => void;
  onSavePlanetaryWorld: (
    draft: PlanetaryWorldDraft,
    existingPlanetaryWorld?: InFictionWorld
  ) => void;
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
  const [selectedPlanetaryWorldId, setSelectedPlanetaryWorldId] = useState<
    string | null
  >(null);
  const [planetaryWorldDraft, setPlanetaryWorldDraft] =
    useState<PlanetaryWorldDraft>(() => planetaryWorldDraftFrom());
  const [planetaryWorldError, setPlanetaryWorldError] = useState('');
  const [workspaceQuery, setWorkspaceQuery] = useState('');
  const [planetaryWorldQuery, setPlanetaryWorldQuery] = useState('');
  const [showAllWorkspaces, setShowAllWorkspaces] = useState(false);
  const [showAllPlanetaryWorlds, setShowAllPlanetaryWorlds] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(
    null
  );
  const activeWorkspaceIdRef = useRef(activeWorld.id);
  const intro = getCodexScreenIntro('workspaces');

  const workspaceModel = useMemo(
    () =>
      getWorkspaceFeatureModel({
        activeWorld,
        document,
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
      activeWorld,
      document,
      planetaryWorldQuery,
      selectedWorkspaceId,
      showAllPlanetaryWorlds,
      showAllWorkspaces,
      workspaceQuery,
    ]
  );
  const selectedWorkspace = workspaceModel.selectedWorkspace;
  const selectedWorkspaceDraftKey = selectedWorkspace?.id ?? '';
  const selectedWorkspaceActionState =
    workspaceModel.selectedWorkspaceActionState;
  const selectedPlanetaryWorld =
    selectedPlanetaryWorldId === null
      ? null
      : activeWorld.planetaryWorlds.find(
          (planetaryWorld) => planetaryWorld.id === selectedPlanetaryWorldId
        ) ?? null;
  const workspaceBaselineDraft = workspaceDraftFrom(
    selectedWorkspace ?? undefined
  );
  const planetaryWorldBaselineDraft = planetaryWorldDraftFrom(
    selectedPlanetaryWorld ?? undefined
  );
  const planetaryWorldFieldLayout = getPlanetaryWorldDraftFieldLayout();
  const isWorkspaceDraftDirty = hasUnsavedChanges(
    workspaceBaselineDraft,
    workspaceDraft
  );
  const isPlanetaryWorldDraftDirty = hasUnsavedChanges(
    planetaryWorldBaselineDraft,
    planetaryWorldDraft
  );
  const hasDirtyDraft = isWorkspaceDraftDirty || isPlanetaryWorldDraftDirty;

  useUnsavedChangesWarning(hasDirtyDraft);

  useEffect(() => {
    if (activeWorkspaceIdRef.current === activeWorld.id) {
      return;
    }
    activeWorkspaceIdRef.current = activeWorld.id;
    setSelectedWorkspaceId(activeWorld.id);
    setWorkspaceDraft(workspaceDraftFrom(activeWorld));
    setSelectedPlanetaryWorldId(null);
    setPlanetaryWorldDraft(planetaryWorldDraftFrom());
    setPlanetaryWorldError('');
  }, [activeWorld]);

  useEffect(() => {
    setWorkspaceDraft(workspaceDraftFrom(selectedWorkspace ?? undefined));
    setWorkspaceError('');
  }, [selectedWorkspaceDraftKey]);

  useEffect(() => {
    setShowAllWorkspaces(false);
  }, [activeWorld.id, workspaceQuery]);

  useEffect(() => {
    setShowAllPlanetaryWorlds(false);
  }, [activeWorld.id, planetaryWorldQuery]);

  useEffect(() => {
    if (
      selectedPlanetaryWorldId &&
      !activeWorld.planetaryWorlds.some(
        (planetaryWorld) => planetaryWorld.id === selectedPlanetaryWorldId
      )
    ) {
      setSelectedPlanetaryWorldId(null);
      setPlanetaryWorldDraft(planetaryWorldDraftFrom());
      setPlanetaryWorldError('');
    }
  }, [activeWorld.planetaryWorlds, selectedPlanetaryWorldId]);

  const submitWorkspace = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validation = validateWorkspaceDraft(workspaceDraft);
    if (!validation.ok) {
      setWorkspaceError(formatDraftValidationErrors(validation));
      return;
    }
    if (selectedWorkspace) {
      const normalizedDraft = normalizeWorkspaceDraft(workspaceDraft);
      onUpdateWorkspace(selectedWorkspace.id, normalizedDraft);
      setWorkspaceDraft(normalizedDraft);
    } else {
      onCreateWorkspace(normalizeWorkspaceDraft(workspaceDraft));
    }
    setWorkspaceError('');
  };

  const submitPlanetaryWorld = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validation = validatePlanetaryWorldDraft(planetaryWorldDraft);
    if (!validation.ok) {
      setPlanetaryWorldError(formatDraftValidationErrors(validation));
      return;
    }
    const normalizedDraft = normalizePlanetaryWorldDraft(planetaryWorldDraft);
    onSavePlanetaryWorld(normalizedDraft, selectedPlanetaryWorld ?? undefined);
    if (!selectedPlanetaryWorld) {
      setSelectedPlanetaryWorldId(null);
      setPlanetaryWorldDraft(planetaryWorldDraftFrom());
    } else {
      setPlanetaryWorldDraft(normalizedDraft);
    }
    setPlanetaryWorldError('');
  };

  const updatePlanetaryWorldDraft = (
    key: (typeof planetaryWorldFieldLayout.fields)[number]['key'],
    value: string
  ) => {
    setPlanetaryWorldDraft((currentDraft) => ({
      ...currentDraft,
      [key]: value,
    }));
  };

  const updateWorkspaceDraft = (
    key: (typeof workspaceDraftFields)[number]['key'],
    value: string
  ) => {
    setWorkspaceDraft((currentDraft) => ({
      ...currentDraft,
      [key]: value,
    }));
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
    if (pendingDelete.type === 'planetary-world') {
      onDeletePlanetaryWorld(pendingDelete.id);
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
          {workspaceFeatureActions.workspaceHelp}
        </NavLink>
      </section>

      <DashboardPage
        ariaLabel="Workspace dashboard cards"
        pageId="workspaces"
        summary="Arrange workspace management and planetary world tools."
      >
        <section
          className="vwb-panel"
          aria-labelledby="workspace-manager-title"
          data-dashboard-card-id="workspaces.editor"
        >
          <div className="vwb-section-heading">
            <div>
              <p className="vwb-kicker">
                {workspaceModel.workspaces.countLabel}
              </p>
              <h2 id="workspace-manager-title">
                {workspaceFeatureCopy.sections.workspaces}
              </h2>
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
              {workspaceFeatureActions.newWorkspace}
            </button>
          </div>
          <div className="vwb-management-grid">
            <div className="vwb-entry-list">
              <label>
                {workspaceModel.workspaces.label}
                <input
                  value={workspaceQuery}
                  onChange={(event) => setWorkspaceQuery(event.target.value)}
                  placeholder={workspaceModel.workspaces.placeholder}
                />
              </label>
              {workspaceModel.workspaces.rows.length > 0 ? (
                workspaceModel.workspaces.rows.map((workspaceRow) => {
                  const { actionState, workspace } = workspaceRow;
                  return (
                    <article
                      className={`vwb-entry-card ${
                        workspaceRow.isActive ? 'is-selected' : ''
                      }`}
                      key={workspaceRow.id}
                    >
                      <div className="vwb-entry-card-header">
                        <div>
                          <p className="vwb-entry-kind">
                            {workspaceRow.kindLabel}
                          </p>
                          <h3>{workspaceRow.name}</h3>
                        </div>
                        {workspaceRow.isActive ? (
                          <span className="vwb-status-pill">
                            {workspaceFeatureCopy.status.active}
                          </span>
                        ) : null}
                      </div>
                      <p>{workspaceRow.summaryText}</p>
                      <small>{workspaceRow.updatedText}</small>
                      <div className="vwb-form-actions">
                        <button
                          className="vwb-secondary-button"
                          type="button"
                          aria-label={formatWorkspaceFeatureAccessibilityLabel(
                            'edit-workspace',
                            workspace.name
                          )}
                          onClick={() =>
                            discardIfAllowed(() =>
                              setSelectedWorkspaceId(workspace.id)
                            )
                          }
                        >
                          {workspaceFeatureActions.edit}
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
                })
              ) : (
                <div className="vwb-empty-results" role="status">
                  <strong>{workspaceModel.workspaces.emptyText}</strong>
                </div>
              )}
              {workspaceModel.workspaces.hiddenCount > 0 ? (
                <p className="vwb-inline-status">
                  {formatHiddenCountText({
                    hiddenCount: workspaceModel.workspaces.hiddenCount,
                    singularItemLabel: 'workspace',
                    pluralItemLabel: 'workspaces',
                  })}
                </p>
              ) : null}
              {workspaceModel.workspaces.totalCount >
              workspaceFeatureResultLimit ? (
                <div className="vwb-action-row">
                  <button
                    className="vwb-secondary-button"
                    type="button"
                    aria-expanded={showAllWorkspaces}
                    onClick={() =>
                      setShowAllWorkspaces((currentValue) => !currentValue)
                    }
                  >
                    {formatExpansionControlLabel({
                      isExpanded: showAllWorkspaces,
                      hiddenCount: workspaceModel.workspaces.hiddenCount,
                      pluralItemLabel: 'Workspaces',
                      singularItemLabel: 'Workspace',
                    })}
                  </button>
                </div>
              ) : null}
            </div>
            <form className="vwb-form" onSubmit={submitWorkspace}>
              <div className="vwb-section-heading">
                <div>
                  <p className="vwb-kicker">
                    {getWorkspaceFormKicker(selectedWorkspace?.name)}
                  </p>
                  <h3>{getWorkspaceFormTitle(selectedWorkspace?.name)}</h3>
                </div>
                {isWorkspaceDraftDirty ? (
                  <span className="vwb-status-pill">
                    {workspaceFeatureCopy.status.unsaved}
                  </span>
                ) : null}
              </div>
              {workspaceDraftFields.map((field) => (
                <label key={field.key}>
                  {field.label}
                  {field.multiline ? (
                    <textarea
                      rows={4}
                      value={workspaceDraft[field.key]}
                      onChange={(event) =>
                        updateWorkspaceDraft(field.key, event.target.value)
                      }
                      placeholder={field.placeholder}
                    />
                  ) : (
                    <input
                      value={workspaceDraft[field.key]}
                      onChange={(event) =>
                        updateWorkspaceDraft(field.key, event.target.value)
                      }
                      placeholder={field.placeholder}
                    />
                  )}
                </label>
              ))}
              {workspaceError ? (
                <p className="vwb-form-error">{workspaceError}</p>
              ) : null}
              <div className="vwb-form-actions">
                <button className="vwb-primary-button" type="submit">
                  {selectedWorkspace
                    ? workspaceFeatureActions.saveWorkspace
                    : workspaceFeatureActions.createWorkspace}
                </button>
                {selectedWorkspace ? (
                  <>
                    <button
                      className="vwb-secondary-button"
                      type="button"
                      aria-label={formatWorkspaceFeatureAccessibilityLabel(
                        'duplicate-workspace',
                        selectedWorkspace.name
                      )}
                      onClick={() =>
                        discardIfAllowed(() =>
                          onDuplicateWorkspace(selectedWorkspace.id)
                        )
                      }
                    >
                      {workspaceFeatureActions.duplicate}
                    </button>
                    <button
                      className="vwb-secondary-button"
                      type="button"
                      disabled={!selectedWorkspaceActionState?.canArchive}
                      aria-label={formatWorkspaceFeatureAccessibilityLabel(
                        selectedWorkspace.status === 'archived'
                          ? 'restore-workspace'
                          : 'archive-workspace',
                        selectedWorkspace.name
                      )}
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
                        ? workspaceFeatureActions.restore
                        : workspaceFeatureActions.archive}
                    </button>
                    <button
                      className="vwb-secondary-button vwb-danger-button"
                      type="button"
                      disabled={!selectedWorkspaceActionState?.canDelete}
                      aria-label={formatWorkspaceFeatureAccessibilityLabel(
                        'delete-workspace',
                        selectedWorkspace.name
                      )}
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
                      {workspaceFeatureActions.deletePermanently}
                    </button>
                  </>
                ) : null}
              </div>
              {selectedWorkspace &&
              !selectedWorkspaceActionState?.canArchive ? (
                <p className="vwb-inline-status">
                  {lastActiveWorkspaceArchiveMessage}
                </p>
              ) : null}
            </form>
          </div>
        </section>

        <section
          className="vwb-panel"
          aria-labelledby="planetary-worlds-title"
          data-dashboard-card-id="workspaces.planetary-worlds"
        >
          <div className="vwb-section-heading">
            <div>
              <p className="vwb-kicker">
                {workspaceModel.planetaryWorlds.countLabel}
              </p>
              <h2 id="planetary-worlds-title">
                {workspaceFeatureCopy.sections.planetaryWorlds}
              </h2>
            </div>
            <button
              className="vwb-secondary-button"
              type="button"
              onClick={() =>
                discardIfAllowed(() => {
                  setSelectedPlanetaryWorldId(null);
                  setPlanetaryWorldDraft(planetaryWorldDraftFrom());
                  setPlanetaryWorldError('');
                })
              }
            >
              {workspaceFeatureActions.newWorld}
            </button>
          </div>
          <div className="vwb-management-grid">
            <div className="vwb-entry-list">
              <label>
                {workspaceModel.planetaryWorlds.label}
                <input
                  value={planetaryWorldQuery}
                  onChange={(event) =>
                    setPlanetaryWorldQuery(event.target.value)
                  }
                  placeholder={workspaceModel.planetaryWorlds.placeholder}
                />
              </label>
              {workspaceModel.planetaryWorlds.rows.length > 0 ? (
                workspaceModel.planetaryWorlds.rows.map((planetaryWorldRow) => {
                  const { planetaryWorld } = planetaryWorldRow;
                  return (
                    <article className="vwb-entry-card" key={planetaryWorld.id}>
                      <div className="vwb-entry-card-header">
                        <div>
                          <p className="vwb-entry-kind">
                            {planetaryWorldRow.kindLabel}
                          </p>
                          <h3>{planetaryWorldRow.name}</h3>
                        </div>
                        <span className="vwb-status-pill">
                          {planetaryWorldRow.classificationLabel}
                        </span>
                      </div>
                      <p>{planetaryWorldRow.summaryText}</p>
                      <small>
                        {planetaryWorldRow.climateText} |{' '}
                        {planetaryWorldRow.terrainText}
                      </small>
                      <small>{planetaryWorldRow.tagsText}</small>
                      <div className="vwb-form-actions">
                        <button
                          className="vwb-secondary-button"
                          type="button"
                          aria-label={formatWorkspaceFeatureAccessibilityLabel(
                            'edit-planetary-world',
                            planetaryWorld.name
                          )}
                          onClick={() =>
                            discardIfAllowed(() => {
                              setSelectedPlanetaryWorldId(planetaryWorld.id);
                              setPlanetaryWorldDraft(
                                planetaryWorldDraftFrom(planetaryWorld)
                              );
                              setPlanetaryWorldError('');
                            })
                          }
                        >
                          {workspaceFeatureActions.edit}
                        </button>
                        <button
                          className="vwb-secondary-button"
                          type="button"
                          aria-label={formatWorkspaceFeatureAccessibilityLabel(
                            planetaryWorld.status === 'archived'
                              ? 'restore-planetary-world'
                              : 'archive-planetary-world',
                            planetaryWorld.name
                          )}
                          onClick={() =>
                            discardIfAllowed(() =>
                              onArchivePlanetaryWorld(
                                planetaryWorld.id,
                                planetaryWorld.status !== 'archived'
                              )
                            )
                          }
                        >
                          {planetaryWorld.status === 'archived'
                            ? workspaceFeatureActions.restore
                            : workspaceFeatureActions.archive}
                        </button>
                        <button
                          className="vwb-secondary-button vwb-danger-button"
                          type="button"
                          aria-label={formatWorkspaceFeatureAccessibilityLabel(
                            'delete-planetary-world',
                            planetaryWorld.name
                          )}
                          onClick={() =>
                            discardIfAllowed(() =>
                              setPendingDelete({
                                type: 'planetary-world',
                                id: planetaryWorld.id,
                                name: planetaryWorld.name,
                              })
                            )
                          }
                        >
                          {workspaceFeatureActions.deletePermanently}
                        </button>
                      </div>
                    </article>
                  );
                })
              ) : (
                <div className="vwb-empty-results" role="status">
                  <strong>{workspaceModel.planetaryWorlds.emptyText}</strong>
                </div>
              )}
              {workspaceModel.planetaryWorlds.hiddenCount > 0 ? (
                <p className="vwb-inline-status">
                  {formatHiddenCountText({
                    hiddenCount: workspaceModel.planetaryWorlds.hiddenCount,
                    singularItemLabel: 'in-fiction world',
                    pluralItemLabel: 'in-fiction worlds',
                  })}
                </p>
              ) : null}
              {workspaceModel.planetaryWorlds.totalCount >
              workspaceFeatureResultLimit ? (
                <div className="vwb-action-row">
                  <button
                    className="vwb-secondary-button"
                    type="button"
                    aria-expanded={showAllPlanetaryWorlds}
                    onClick={() =>
                      setShowAllPlanetaryWorlds((currentValue) => !currentValue)
                    }
                  >
                    {formatExpansionControlLabel({
                      isExpanded: showAllPlanetaryWorlds,
                      hiddenCount: workspaceModel.planetaryWorlds.hiddenCount,
                      pluralItemLabel: 'In-Fiction Worlds',
                      singularItemLabel: 'In-Fiction World',
                    })}
                  </button>
                </div>
              ) : null}
            </div>
            <form className="vwb-form" onSubmit={submitPlanetaryWorld}>
              <div className="vwb-section-heading">
                <div>
                  <p className="vwb-kicker">
                    {getPlanetaryWorldFormKicker(selectedPlanetaryWorld?.name)}
                  </p>
                  <h3>
                    {getPlanetaryWorldFormTitle(selectedPlanetaryWorld?.name)}
                  </h3>
                </div>
                {isPlanetaryWorldDraftDirty ? (
                  <span className="vwb-status-pill">
                    {workspaceFeatureCopy.status.unsaved}
                  </span>
                ) : null}
              </div>
              <div className="vwb-form-grid">
                {planetaryWorldFieldLayout.leadingFields.map((field) => (
                  <label key={field.key}>
                    {field.label}
                    <input
                      value={planetaryWorldDraft[field.key]}
                      onChange={(event) =>
                        updatePlanetaryWorldDraft(field.key, event.target.value)
                      }
                      placeholder={
                        'placeholder' in field ? field.placeholder : undefined
                      }
                    />
                  </label>
                ))}
              </div>
              {planetaryWorldFieldLayout.trailingFields.map((field) => (
                <label key={field.key}>
                  {field.label}
                  {'multiline' in field && field.multiline ? (
                    <textarea
                      rows={field.key === 'notes' ? 4 : 3}
                      value={planetaryWorldDraft[field.key]}
                      onChange={(event) =>
                        updatePlanetaryWorldDraft(field.key, event.target.value)
                      }
                      placeholder={
                        'placeholder' in field ? field.placeholder : undefined
                      }
                    />
                  ) : (
                    <input
                      value={planetaryWorldDraft[field.key]}
                      onChange={(event) =>
                        updatePlanetaryWorldDraft(field.key, event.target.value)
                      }
                      placeholder={
                        'placeholder' in field ? field.placeholder : undefined
                      }
                    />
                  )}
                </label>
              ))}
              {planetaryWorldError ? (
                <p className="vwb-form-error">{planetaryWorldError}</p>
              ) : null}
              <div className="vwb-form-actions">
                <button className="vwb-primary-button" type="submit">
                  {selectedPlanetaryWorld
                    ? workspaceFeatureActions.saveWorld
                    : workspaceFeatureActions.createWorld}
                </button>
                <button
                  className="vwb-secondary-button"
                  type="button"
                  onClick={() =>
                    discardIfAllowed(() => {
                      setSelectedPlanetaryWorldId(null);
                      setPlanetaryWorldDraft(planetaryWorldDraftFrom());
                      setPlanetaryWorldError('');
                    })
                  }
                >
                  {workspaceFeatureActions.newWorldDraft}
                </button>
              </div>
            </form>
          </div>
        </section>
      </DashboardPage>

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
