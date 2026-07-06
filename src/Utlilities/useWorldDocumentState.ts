import { useMemo, useState } from 'react';
import {
  addEntryTypeFieldsInActiveWorkspace,
  addVocabularyValue,
  archiveEntryInActiveWorkspace,
  archivePlanetaryWorldInActiveWorkspace,
  clearHiddenEntryDetailInActiveWorkspace,
  clearHiddenEntryDetailsInActiveWorkspace,
  createEntryTypeInActiveWorkspace,
  createWorkspace,
  deleteEntryTypeFromActiveWorkspace,
  deleteEntryFromActiveWorkspace,
  deletePlanetaryWorldFromActiveWorkspace,
  deleteRelationshipFromActiveWorkspace,
  deleteWorkspace,
  duplicateWorkspace,
  getActiveWorld,
  localPersistenceCopy,
  moveEntryTypeFieldInActiveWorkspace,
  moveVocabularyValue,
  renameEntryTypeFieldInActiveWorkspace,
  removeEntryTypeFieldInActiveWorkspace,
  saveEntryInActiveWorkspace,
  savePlanetaryWorldInActiveWorkspace,
  saveRelationshipInActiveWorkspace,
  setActiveWorkspace,
  setVocabularyValueArchived,
  setWorkspaceArchived,
  updateActiveWorkspace,
  updateFieldOverride,
  updateVocabularyValue,
  updateWorkspaceMetadata,
  type EntryTypeDraft,
  type CustomEntryTypeFieldMoveDirection,
  type FieldOverrideDraft,
  type InFictionWorld,
  type PlanetaryWorldDraft,
  type RecoverySnapshot,
  type RecoverySnapshotReason,
  type RecoverySnapshotSummary,
  type WorldCodex,
  type WorldDocument,
  type WorldEntry,
  type WorldRelationship,
  type WorldSectionConfig,
  type WorldWorkspace,
  type WorkspaceDraft,
  type VocabularyValueDraft,
  type VocabularyValueMoveDirection,
} from '@valgaron/core';
import {
  addRecoverySnapshot,
  deleteRecoverySnapshot,
  loadRecoverySnapshots,
  summarizeRecoverySnapshots,
} from './codexSnapshots';
import {
  loadWorldDocumentWithStatus,
  resetWorldDocumentStorage,
  saveWorldDocument,
  type WorldDocumentLoadStatus,
} from './codexStorage';

export type WorldDocumentSaveStatus = {
  state: 'saved' | 'unsaved' | 'dirty' | 'failed' | 'paused';
  savedAt: string;
};

export type RecoverySnapshotStatus = {
  state: 'idle' | 'saved' | 'failed' | 'restored' | 'deleted';
  message: string;
  updatedAt: string;
};

export type WorldDocumentState = {
  document: WorldDocument;
  loadStatus: WorldDocumentLoadStatus;
  activeWorld: WorldWorkspace;
  sections: readonly WorldSectionConfig[];
  codex: WorldCodex;
  relationships: readonly WorldRelationship[];
  saveStatus: WorldDocumentSaveStatus;
  hasUnsavedDocumentChanges: boolean;
  recoverySnapshots: readonly RecoverySnapshotSummary[];
  recoverySnapshotStatus: RecoverySnapshotStatus;
  saveCurrentDocument: () => void;
  saveEntry: (entry: WorldEntry) => void;
  archiveEntry: (entry: WorldEntry, archived: boolean) => void;
  permanentlyDeleteEntry: (entry: WorldEntry) => void;
  saveRelationship: (relationship: WorldRelationship) => void;
  removeRelationship: (relationshipId: string) => void;
  unlinkRelationship: (relationshipId: string) => void;
  resetToSeed: () => void;
  importDocument: (nextDocument: WorldDocument) => void;
  restoreSnapshot: (snapshotId: string) => void;
  deleteSnapshot: (snapshotId: string) => void;
  createWorkspace: (draft: WorkspaceDraft) => void;
  updateWorkspace: (workspaceId: string, draft: WorkspaceDraft) => void;
  switchWorkspace: (workspaceId: string) => void;
  archiveWorkspace: (workspaceId: string, archived: boolean) => void;
  duplicateWorkspace: (workspaceId: string) => void;
  permanentlyDeleteWorkspace: (workspaceId: string) => void;
  savePlanetaryWorld: (
    draft: PlanetaryWorldDraft,
    existingPlanetaryWorld?: InFictionWorld
  ) => void;
  archivePlanetaryWorld: (planetaryWorldId: string, archived: boolean) => void;
  permanentlyDeletePlanetaryWorld: (planetaryWorldId: string) => void;
  createEntryType: (draft: EntryTypeDraft) => void;
  addEntryTypeFields: (sectionId: string, fieldsText: string) => void;
  moveEntryTypeField: (
    sectionId: string,
    fieldKey: string,
    direction: CustomEntryTypeFieldMoveDirection
  ) => void;
  renameEntryTypeField: (
    sectionId: string,
    fieldKey: string,
    label: string
  ) => void;
  removeEntryTypeField: (sectionId: string, fieldKey: string) => void;
  addVocabularyValue: (
    vocabularyId: string,
    draft: VocabularyValueDraft
  ) => void;
  updateVocabularyValue: (
    vocabularyId: string,
    valueId: string,
    draft: VocabularyValueDraft
  ) => void;
  archiveVocabularyValue: (
    vocabularyId: string,
    valueId: string,
    archived: boolean
  ) => void;
  moveVocabularyValue: (
    vocabularyId: string,
    valueId: string,
    direction: VocabularyValueMoveDirection
  ) => void;
  updateFieldOverride: (
    sectionId: string,
    fieldKey: string,
    draft: FieldOverrideDraft
  ) => void;
  clearHiddenEntryDetail: (
    sectionId: string,
    entryId: string,
    fieldKey: string
  ) => void;
  clearHiddenEntryDetails: () => void;
  permanentlyDeleteEntryType: (sectionId: string) => void;
};

/** Owns browser document persistence and active-workspace mutation wiring. */
export function useWorldDocumentState(): WorldDocumentState {
  const [initialLoadResult] = useState(() => loadWorldDocumentWithStatus());
  const [document, setDocument] = useState<WorldDocument>(
    () => initialLoadResult.document
  );
  const [loadStatus, setLoadStatus] = useState<WorldDocumentLoadStatus>(
    () => initialLoadResult.status
  );
  const [saveStatus, setSaveStatus] = useState<WorldDocumentSaveStatus>(() => ({
    state: getInitialSaveStateAfterLoad(initialLoadResult.status),
    savedAt: document.savedAt,
  }));
  const [hasUnsavedDocumentChanges, setHasUnsavedDocumentChanges] =
    useState(false);
  const [snapshots, setSnapshots] = useState<RecoverySnapshot[]>(() =>
    loadRecoverySnapshots()
  );
  const [recoverySnapshotStatus, setRecoverySnapshotStatus] =
    useState<RecoverySnapshotStatus>(() => ({
      state: 'idle',
      message: 'Recovery snapshots are ready.',
      updatedAt: document.savedAt,
    }));
  const activeWorld = useMemo(() => getActiveWorld(document), [document]);
  const sections = activeWorld.entryTypes;
  const codex = activeWorld.codex;
  const relationships = activeWorld.relationships;
  const recoverySnapshots = useMemo(
    () => summarizeRecoverySnapshots(snapshots),
    [snapshots]
  );

  const markUnsaved = () => {
    setHasUnsavedDocumentChanges(true);
    setSaveStatus((currentStatus) => ({
      state: 'dirty',
      savedAt: currentStatus.savedAt,
    }));
  };

  const setUnsavedDocument = (
    updateDocument: (currentDocument: WorldDocument) => WorldDocument
  ) => {
    setDocument((currentDocument) => {
      return applyUnsavedDocumentUpdate(currentDocument, updateDocument);
    });
    markUnsaved();
  };

  const saveCurrentDocument = () => {
    const savedAt = new Date().toISOString();
    const savedDocument = createManualSaveDocument(document, savedAt);
    const didSave = saveWorldDocument(savedDocument);
    if (didSave) {
      setDocument(savedDocument);
      setHasUnsavedDocumentChanges(false);
    }
    setSaveStatus({
      state: didSave ? 'saved' : 'failed',
      savedAt,
    });
  };

  const captureSnapshot = (
    currentDocument: WorldDocument,
    reason: RecoverySnapshotReason
  ) => {
    const result = addRecoverySnapshot(currentDocument, reason);
    setSnapshots(result.snapshots);
    setRecoverySnapshotStatus({
      state: result.ok ? 'saved' : 'failed',
      message: result.ok
        ? 'Recovery snapshot saved before the destructive change.'
        : 'Recovery snapshot could not be saved. Export JSON before continuing risky changes.',
      updatedAt: result.snapshot.createdAt,
    });
  };

  const saveEntry = (entry: WorldEntry) => {
    setUnsavedDocument((currentDocument) =>
      saveEntryInActiveWorkspace({ document: currentDocument, entry })
    );
  };

  const archiveEntry = (entry: WorldEntry, archived: boolean) => {
    setUnsavedDocument((currentDocument) =>
      archiveEntryInActiveWorkspace({
        archived,
        document: currentDocument,
        entry,
      })
    );
  };

  const permanentlyDeleteEntry = (entry: WorldEntry) => {
    captureSnapshot(document, 'permanent-delete');
    setUnsavedDocument((currentDocument) =>
      deleteEntryFromActiveWorkspace({ document: currentDocument, entry })
    );
  };

  const saveRelationship = (relationship: WorldRelationship) => {
    setUnsavedDocument((currentDocument) =>
      saveRelationshipInActiveWorkspace({
        document: currentDocument,
        relationship,
      })
    );
  };

  const unlinkRelationship = (relationshipId: string) => {
    setUnsavedDocument((currentDocument) =>
      deleteRelationshipFromActiveWorkspace({
        document: currentDocument,
        relationshipId,
      })
    );
  };

  const removeRelationship = (relationshipId: string) => {
    captureSnapshot(document, 'relationship-delete');
    unlinkRelationship(relationshipId);
  };

  const resetToSeed = () => {
    captureSnapshot(document, 'reset');
    setLoadStatus({
      state: 'loaded',
      source: 'seed',
      message: `Starter data was loaded by reset. Use Save to write it to ${localPersistenceCopy.browserSaveTarget}.`,
      issues: [],
      checkedAt: new Date().toISOString(),
    });
    setUnsavedDocument(() => resetWorldDocumentStorage());
  };

  const importDocument = (nextDocument: WorldDocument) => {
    captureSnapshot(document, 'import');
    setLoadStatus({
      state: 'loaded',
      source: 'current',
      message: `Imported backup is loaded in this session. Use Save to write it to ${localPersistenceCopy.browserSaveTarget}.`,
      issues: [],
      checkedAt: new Date().toISOString(),
    });
    setUnsavedDocument(() => nextDocument);
  };

  const restoreSnapshot = (snapshotId: string) => {
    const snapshot = snapshots.find((item) => item.id === snapshotId);
    if (!snapshot) {
      setRecoverySnapshotStatus({
        state: 'failed',
        message: 'Recovery snapshot could not be found.',
        updatedAt: new Date().toISOString(),
      });
      return;
    }
    captureSnapshot(document, 'restore');
    setLoadStatus({
      state: 'loaded',
      source: 'current',
      message: `Recovery snapshot is loaded in this session. Use Save to write it to ${localPersistenceCopy.browserSaveTarget}.`,
      issues: [],
      checkedAt: new Date().toISOString(),
    });
    setUnsavedDocument(() => snapshot.document);
    setRecoverySnapshotStatus({
      state: 'restored',
      message: `Restored ${
        getActiveWorld(snapshot.document).name
      } from a recovery snapshot.`,
      updatedAt: new Date().toISOString(),
    });
  };

  const deleteSnapshot = (snapshotId: string) => {
    const nextSnapshots = deleteRecoverySnapshot(snapshotId);
    setSnapshots(nextSnapshots);
    setRecoverySnapshotStatus({
      state: 'deleted',
      message: 'Recovery snapshot deleted.',
      updatedAt: new Date().toISOString(),
    });
  };

  const createWorkspaceFromDraft = (draft: WorkspaceDraft) => {
    setUnsavedDocument((currentDocument) =>
      createWorkspace(currentDocument, draft)
    );
  };

  const updateWorkspace = (workspaceId: string, draft: WorkspaceDraft) => {
    setUnsavedDocument((currentDocument) =>
      updateWorkspaceMetadata(currentDocument, workspaceId, draft)
    );
  };

  const switchWorkspace = (workspaceId: string) => {
    setUnsavedDocument((currentDocument) =>
      setActiveWorkspace(currentDocument, workspaceId)
    );
  };

  const archiveWorkspace = (workspaceId: string, archived: boolean) => {
    setUnsavedDocument((currentDocument) =>
      setWorkspaceArchived(currentDocument, workspaceId, archived)
    );
  };

  const duplicateWorkspaceFromId = (workspaceId: string) => {
    setUnsavedDocument((currentDocument) =>
      duplicateWorkspace(currentDocument, workspaceId)
    );
  };

  const permanentlyDeleteWorkspace = (workspaceId: string) => {
    captureSnapshot(document, 'workspace-delete');
    setUnsavedDocument((currentDocument) =>
      deleteWorkspace(currentDocument, workspaceId)
    );
  };

  const savePlanetaryWorld = (
    draft: PlanetaryWorldDraft,
    existingPlanetaryWorld?: InFictionWorld
  ) => {
    setUnsavedDocument((currentDocument) =>
      savePlanetaryWorldInActiveWorkspace({
        document: currentDocument,
        draft,
        existingPlanetaryWorld,
      })
    );
  };

  const archivePlanetaryWorld = (
    planetaryWorldId: string,
    archived: boolean
  ) => {
    setUnsavedDocument((currentDocument) =>
      archivePlanetaryWorldInActiveWorkspace({
        archived,
        document: currentDocument,
        planetaryWorldId,
      })
    );
  };

  const permanentlyDeletePlanetaryWorld = (planetaryWorldId: string) => {
    captureSnapshot(document, 'planetary-world-delete');
    setUnsavedDocument((currentDocument) =>
      deletePlanetaryWorldFromActiveWorkspace({
        document: currentDocument,
        planetaryWorldId,
      })
    );
  };

  const createEntryType = (draft: EntryTypeDraft) => {
    setUnsavedDocument((currentDocument) =>
      createEntryTypeInActiveWorkspace({ document: currentDocument, draft })
    );
  };

  const addEntryTypeFields = (sectionId: string, fieldsText: string) => {
    setUnsavedDocument((currentDocument) =>
      addEntryTypeFieldsInActiveWorkspace({
        document: currentDocument,
        fieldsText,
        sectionId,
      })
    );
  };

  const moveEntryTypeField = (
    sectionId: string,
    fieldKey: string,
    direction: CustomEntryTypeFieldMoveDirection
  ) => {
    setUnsavedDocument((currentDocument) =>
      moveEntryTypeFieldInActiveWorkspace({
        direction,
        document: currentDocument,
        fieldKey,
        sectionId,
      })
    );
  };

  const renameEntryTypeField = (
    sectionId: string,
    fieldKey: string,
    label: string
  ) => {
    setUnsavedDocument((currentDocument) =>
      renameEntryTypeFieldInActiveWorkspace({
        document: currentDocument,
        fieldKey,
        label,
        sectionId,
      })
    );
  };

  const removeEntryTypeField = (sectionId: string, fieldKey: string) => {
    setUnsavedDocument((currentDocument) =>
      removeEntryTypeFieldInActiveWorkspace({
        document: currentDocument,
        fieldKey,
        sectionId,
      })
    );
  };

  const addWorkspaceVocabularyValue = (
    vocabularyId: string,
    draft: VocabularyValueDraft
  ) => {
    setUnsavedDocument((currentDocument) =>
      updateActiveWorkspace(currentDocument, (workspace) =>
        addVocabularyValue(workspace, vocabularyId, draft)
      )
    );
  };

  const updateWorkspaceVocabularyValue = (
    vocabularyId: string,
    valueId: string,
    draft: VocabularyValueDraft
  ) => {
    setUnsavedDocument((currentDocument) =>
      updateActiveWorkspace(currentDocument, (workspace) =>
        updateVocabularyValue(workspace, vocabularyId, valueId, draft)
      )
    );
  };

  const archiveWorkspaceVocabularyValue = (
    vocabularyId: string,
    valueId: string,
    archived: boolean
  ) => {
    setUnsavedDocument((currentDocument) =>
      updateActiveWorkspace(currentDocument, (workspace) =>
        setVocabularyValueArchived(workspace, vocabularyId, valueId, archived)
      )
    );
  };

  const moveWorkspaceVocabularyValue = (
    vocabularyId: string,
    valueId: string,
    direction: VocabularyValueMoveDirection
  ) => {
    setUnsavedDocument((currentDocument) =>
      updateActiveWorkspace(currentDocument, (workspace) =>
        moveVocabularyValue(workspace, vocabularyId, valueId, direction)
      )
    );
  };

  const updateWorkspaceFieldOverride = (
    sectionId: string,
    fieldKey: string,
    draft: FieldOverrideDraft
  ) => {
    setUnsavedDocument((currentDocument) =>
      updateActiveWorkspace(currentDocument, (workspace) =>
        updateFieldOverride(workspace, sectionId, fieldKey, draft)
      )
    );
  };

  const clearHiddenEntryDetails = () => {
    captureSnapshot(document, 'schema-cleanup');
    setUnsavedDocument((currentDocument) =>
      clearHiddenEntryDetailsInActiveWorkspace({
        document: currentDocument,
      })
    );
  };

  const clearHiddenEntryDetail = (
    sectionId: string,
    entryId: string,
    fieldKey: string
  ) => {
    captureSnapshot(document, 'schema-cleanup');
    setUnsavedDocument((currentDocument) =>
      clearHiddenEntryDetailInActiveWorkspace({
        document: currentDocument,
        entryId,
        fieldKey,
        sectionId,
      })
    );
  };

  const permanentlyDeleteEntryType = (sectionId: string) => {
    captureSnapshot(document, 'entry-type-delete');
    setUnsavedDocument((currentDocument) =>
      deleteEntryTypeFromActiveWorkspace({
        document: currentDocument,
        sectionId,
      })
    );
  };

  return {
    document,
    loadStatus,
    activeWorld,
    sections,
    codex,
    relationships,
    saveStatus,
    hasUnsavedDocumentChanges,
    recoverySnapshots,
    recoverySnapshotStatus,
    saveCurrentDocument,
    saveEntry,
    archiveEntry,
    permanentlyDeleteEntry,
    saveRelationship,
    removeRelationship,
    unlinkRelationship,
    resetToSeed,
    importDocument,
    restoreSnapshot,
    deleteSnapshot,
    createWorkspace: createWorkspaceFromDraft,
    updateWorkspace,
    switchWorkspace,
    archiveWorkspace,
    duplicateWorkspace: duplicateWorkspaceFromId,
    permanentlyDeleteWorkspace,
    savePlanetaryWorld,
    archivePlanetaryWorld,
    permanentlyDeletePlanetaryWorld,
    createEntryType,
    addEntryTypeFields,
    moveEntryTypeField,
    renameEntryTypeField,
    removeEntryTypeField,
    addVocabularyValue: addWorkspaceVocabularyValue,
    updateVocabularyValue: updateWorkspaceVocabularyValue,
    archiveVocabularyValue: archiveWorkspaceVocabularyValue,
    moveVocabularyValue: moveWorkspaceVocabularyValue,
    updateFieldOverride: updateWorkspaceFieldOverride,
    clearHiddenEntryDetail,
    clearHiddenEntryDetails,
    permanentlyDeleteEntryType,
  };
}

/** Avoid overwriting corrupt or unreadable saved data immediately after fallback. */
export function shouldPauseInitialSaveAfterLoad(
  status: WorldDocumentLoadStatus
): boolean {
  return (
    status.state === 'recovered' &&
    status.source === 'seed' &&
    status.issues.length > 0
  );
}

export function getInitialSaveStateAfterLoad(
  status: WorldDocumentLoadStatus
): WorldDocumentSaveStatus['state'] {
  if (shouldPauseInitialSaveAfterLoad(status)) {
    return 'paused';
  }
  return status.source === 'current' ? 'saved' : 'unsaved';
}

export function applyUnsavedDocumentUpdate(
  currentDocument: WorldDocument,
  updateDocument: (currentDocument: WorldDocument) => WorldDocument
): WorldDocument {
  return {
    ...updateDocument(currentDocument),
    savedAt: currentDocument.savedAt,
  };
}

export function createManualSaveDocument(
  document: WorldDocument,
  savedAt: string
): WorldDocument {
  return {
    ...document,
    savedAt,
  };
}
