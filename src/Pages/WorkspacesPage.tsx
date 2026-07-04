import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { NavLink } from 'react-router-dom';
import {
  type EntryTypeDraft,
  formatDraftValidationErrors,
  formatDestructiveActionTitle,
  getCodexHelpRoute,
  getCodexScreenIntro,
  getDestructiveActionCopy,
  getWorkspaceFeatureModel,
  entryTypeDraftFields,
  lastActiveWorkspaceArchiveMessage,
  normalizePlanetaryWorldDraft,
  normalizeWorkspaceDraft,
  planetaryWorldDraftFrom,
  planetaryWorldDraftFields,
  validatePlanetaryWorldDraft,
  validateEntryTypeDraft,
  validateWorkspaceDraft,
  workspaceDraftFields,
  workspaceFeatureActions,
  workspaceFeatureCopy,
  getPlanetaryWorldFormKicker,
  getPlanetaryWorldFormTitle,
  getWorkspaceFormKicker,
  getWorkspaceFormTitle,
  type PlanetaryWorldDraft,
  type WorkspaceDraft,
} from '@valgaron/core';
import type { InFictionWorld, WorldDocument, WorldWorkspace } from '../types';
import {
  confirmDiscardUnsavedChanges,
  hasUnsavedChanges,
  useUnsavedChangesWarning,
} from '../Utlilities/unsavedChanges';
import { useDialogFocus } from '../Utlilities/dialogFocus';

type PendingDelete =
  | { type: 'workspace'; id: string; name: string }
  | { type: 'entry-type'; id: string; name: string }
  | { type: 'planetary-world'; id: string; name: string };

const pendingDeleteActionIdByType = {
  workspace: 'delete-workspace',
  'entry-type': 'delete-entry-type',
  'planetary-world': 'delete-planetary-world',
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
  onCreateEntryType: (draft: EntryTypeDraft) => void;
  onCreateWorkspace: (draft: WorkspaceDraft) => void;
  onDeleteEntryType: (sectionId: string) => void;
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
  const [entryTypeDraft, setEntryTypeDraft] = useState<EntryTypeDraft>({
    ...emptyEntryTypeDraft(),
  });
  const [entryTypeError, setEntryTypeError] = useState('');
  const [selectedPlanetaryWorldId, setSelectedPlanetaryWorldId] = useState<
    string | null
  >(null);
  const [planetaryWorldDraft, setPlanetaryWorldDraft] =
    useState<PlanetaryWorldDraft>(() => planetaryWorldDraftFrom());
  const [planetaryWorldError, setPlanetaryWorldError] = useState('');
  const [workspaceQuery, setWorkspaceQuery] = useState('');
  const [entryTypeQuery, setEntryTypeQuery] = useState('');
  const [planetaryWorldQuery, setPlanetaryWorldQuery] = useState('');
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
          customEntryTypes: entryTypeQuery,
          planetaryWorlds: planetaryWorldQuery,
        },
        selectedWorkspaceId,
      }),
    [
      activeWorld,
      document,
      entryTypeQuery,
      planetaryWorldQuery,
      selectedWorkspaceId,
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
  const entryTypeBaselineDraft = emptyEntryTypeDraft();
  const planetaryWorldBaselineDraft = planetaryWorldDraftFrom(
    selectedPlanetaryWorld ?? undefined
  );
  const isWorkspaceDraftDirty = hasUnsavedChanges(
    workspaceBaselineDraft,
    workspaceDraft
  );
  const isEntryTypeDraftDirty = hasUnsavedChanges(
    entryTypeBaselineDraft,
    entryTypeDraft
  );
  const isPlanetaryWorldDraftDirty = hasUnsavedChanges(
    planetaryWorldBaselineDraft,
    planetaryWorldDraft
  );
  const hasDirtyDraft =
    isWorkspaceDraftDirty ||
    isEntryTypeDraftDirty ||
    isPlanetaryWorldDraftDirty;

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
    key: (typeof planetaryWorldDraftFields)[number]['key'],
    value: string
  ) => {
    setPlanetaryWorldDraft({
      ...planetaryWorldDraft,
      [key]: value,
    });
  };

  const updateWorkspaceDraft = (
    key: (typeof workspaceDraftFields)[number]['key'],
    value: string
  ) => {
    setWorkspaceDraft({
      ...workspaceDraft,
      [key]: value,
    });
  };

  const updateEntryTypeDraft = (
    key: (typeof entryTypeDraftFields)[number]['key'],
    value: string
  ) => {
    setEntryTypeDraft({
      ...entryTypeDraft,
      [key]: value,
    });
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

      <section className="vwb-panel" aria-labelledby="workspace-manager-title">
        <div className="vwb-section-heading">
          <div>
            <p className="vwb-kicker">
              {workspaceModel.workspaces.totalCount} project workspace
              {workspaceModel.workspaces.totalCount === 1 ? '' : 's'}
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
                        <span className="vwb-status-pill">Active</span>
                      ) : null}
                    </div>
                    <p>{workspaceRow.summaryText}</p>
                    <small>{workspaceRow.updatedText}</small>
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
                {workspaceModel.workspaces.hiddenText}
              </p>
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
                <span className="vwb-status-pill">Unsaved</span>
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
            {selectedWorkspace && !selectedWorkspaceActionState?.canArchive ? (
              <p className="vwb-inline-status">
                {lastActiveWorkspaceArchiveMessage}
              </p>
            ) : null}
          </form>
        </div>
      </section>

      <section className="vwb-panel" aria-labelledby="planetary-worlds-title">
        <div className="vwb-section-heading">
          <div>
            <p className="vwb-kicker">
              {workspaceModel.planetaryWorlds.totalCount} in-fiction world
              {workspaceModel.planetaryWorlds.totalCount === 1 ? '' : 's'}
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
                onChange={(event) => setPlanetaryWorldQuery(event.target.value)}
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
                {workspaceModel.planetaryWorlds.hiddenText}
              </p>
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
                <span className="vwb-status-pill">Unsaved</span>
              ) : null}
            </div>
            <div className="vwb-form-grid">
              {planetaryWorldDraftFields.slice(0, 4).map((field) => (
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
            {planetaryWorldDraftFields.slice(4).map((field) => (
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

      <section className="vwb-panel" aria-labelledby="custom-types-title">
        <div className="vwb-section-heading">
          <div>
            <p className="vwb-kicker">
              {workspaceModel.customEntryTypes.totalCount} custom types
            </p>
            <h2 id="custom-types-title">
              {workspaceFeatureCopy.sections.customEntryTypes}
            </h2>
          </div>
        </div>
        <div className="vwb-management-grid">
          <div className="vwb-entry-list">
            <label>
              {workspaceModel.customEntryTypes.label}
              <input
                value={entryTypeQuery}
                onChange={(event) => setEntryTypeQuery(event.target.value)}
                placeholder={workspaceModel.customEntryTypes.placeholder}
              />
            </label>
            {workspaceModel.customEntryTypes.rows.length > 0 ? (
              workspaceModel.customEntryTypes.rows.map((entryTypeRow) => (
                <article className="vwb-entry-card" key={entryTypeRow.id}>
                  <div className="vwb-entry-card-header">
                    <div>
                      <p className="vwb-entry-kind">Custom codex section</p>
                      <h3>{entryTypeRow.title}</h3>
                    </div>
                    <span className="vwb-status-pill">
                      {entryTypeRow.entryCountLabel}
                    </span>
                  </div>
                  <p>{entryTypeRow.descriptionText}</p>
                  <small>Fields: {entryTypeRow.fieldsText}</small>
                  <div className="vwb-form-actions">
                    <button
                      className="vwb-secondary-button vwb-danger-button"
                      type="button"
                      onClick={() =>
                        discardIfAllowed(() =>
                          setPendingDelete({
                            type: 'entry-type',
                            id: entryTypeRow.id,
                            name: entryTypeRow.title,
                          })
                        )
                      }
                    >
                      {workspaceFeatureActions.deleteType}
                    </button>
                  </div>
                </article>
              ))
            ) : (
              <div className="vwb-empty-results" role="status">
                <strong>{workspaceModel.customEntryTypes.emptyText}</strong>
              </div>
            )}
            {workspaceModel.customEntryTypes.hiddenCount > 0 ? (
              <p className="vwb-inline-status">
                {workspaceModel.customEntryTypes.hiddenText}
              </p>
            ) : null}
          </div>
          <form className="vwb-form" onSubmit={submitEntryType}>
            <div className="vwb-section-heading">
              <div>
                <p className="vwb-kicker">
                  {workspaceFeatureCopy.forms.newCustomSection}
                </p>
                <h3>{workspaceFeatureCopy.forms.createEntryType}</h3>
              </div>
              {isEntryTypeDraftDirty ? (
                <span className="vwb-status-pill">Unsaved</span>
              ) : null}
            </div>
            <div className="vwb-form-grid">
              {entryTypeDraftFields.slice(0, 2).map((field) => (
                <label key={field.key}>
                  {field.label}
                  <input
                    value={entryTypeDraft[field.key]}
                    onChange={(event) =>
                      updateEntryTypeDraft(field.key, event.target.value)
                    }
                    placeholder={field.placeholder}
                  />
                </label>
              ))}
            </div>
            {entryTypeDraftFields.slice(2).map((field) => (
              <label key={field.key}>
                {field.label}
                {field.multiline ? (
                  <textarea
                    rows={3}
                    value={entryTypeDraft[field.key]}
                    onChange={(event) =>
                      updateEntryTypeDraft(field.key, event.target.value)
                    }
                    placeholder={field.placeholder}
                  />
                ) : (
                  <input
                    value={entryTypeDraft[field.key]}
                    onChange={(event) =>
                      updateEntryTypeDraft(field.key, event.target.value)
                    }
                    placeholder={field.placeholder}
                  />
                )}
              </label>
            ))}
            {entryTypeError ? (
              <p className="vwb-form-error">{entryTypeError}</p>
            ) : null}
            <div className="vwb-form-actions">
              <button className="vwb-primary-button" type="submit">
                {workspaceFeatureActions.createEntryType}
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
