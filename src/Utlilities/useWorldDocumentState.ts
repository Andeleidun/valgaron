import { useMemo, useState } from 'react';
import type {
  RecoverySnapshot,
  RecoverySnapshotReason,
  RecoverySnapshotSummary,
  InFictionWorld,
  WorldCodex,
  WorldDocument,
  WorldEntry,
  WorldRelationship,
  WorldSectionConfig,
  WorldWorkspace,
} from '../types';
import { applyEntry, deleteEntry, setEntryArchived } from './codexEntries';
import {
  deleteRelationship,
  deleteRelationshipsForEntry,
  upsertRelationship,
} from './codexRelationships';
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
import {
  createCustomEntryType,
  createWorkspace,
  deleteCustomEntryType,
  deletePlanetaryWorld,
  deleteWorkspace,
  duplicateWorkspace,
  setActiveWorkspace,
  setPlanetaryWorldArchived,
  setWorkspaceArchived,
  updateActiveWorkspace,
  updateWorkspaceMetadata,
  upsertPlanetaryWorld,
  type EntryTypeDraft,
  type PlanetaryWorldDraft,
  type WorkspaceDraft,
} from './workspaceManagement';
import { getActiveWorld, updateActiveWorld } from './worldDocument';

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
      updateActiveWorld(currentDocument, (world) => ({
        ...world,
        codex: applyEntry(world.codex, entry, world.entryTypes),
        updatedAt: new Date().toISOString(),
      }))
    );
  };

  const archiveEntry = (entry: WorldEntry, archived: boolean) => {
    setUnsavedDocument((currentDocument) =>
      updateActiveWorld(currentDocument, (world) => ({
        ...world,
        codex: setEntryArchived(world.codex, entry, archived, world.entryTypes),
        updatedAt: new Date().toISOString(),
      }))
    );
  };

  const permanentlyDeleteEntry = (entry: WorldEntry) => {
    captureSnapshot(document, 'permanent-delete');
    setUnsavedDocument((currentDocument) =>
      updateActiveWorld(currentDocument, (world) => ({
        ...world,
        codex: deleteEntry(world.codex, entry, world.entryTypes),
        relationships: deleteRelationshipsForEntry(
          world.relationships,
          entry.id
        ),
        updatedAt: new Date().toISOString(),
      }))
    );
  };

  const saveRelationship = (relationship: WorldRelationship) => {
    setUnsavedDocument((currentDocument) =>
      updateActiveWorld(currentDocument, (world) => ({
        ...world,
        relationships: upsertRelationship(world.relationships, relationship),
        updatedAt: new Date().toISOString(),
      }))
    );
  };

  const removeRelationship = (relationshipId: string) => {
    captureSnapshot(document, 'relationship-delete');
    setUnsavedDocument((currentDocument) =>
      updateActiveWorld(currentDocument, (world) => ({
        ...world,
        relationships: deleteRelationship(world.relationships, relationshipId),
        updatedAt: new Date().toISOString(),
      }))
    );
  };

  const resetToSeed = () => {
    captureSnapshot(document, 'reset');
    setLoadStatus({
      state: 'loaded',
      source: 'seed',
      message:
        'Starter data was loaded by reset. Use Save to write it to localStorage.',
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
      message:
        'Imported backup is loaded in this session. Use Save to write it to localStorage.',
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
      message:
        'Recovery snapshot is loaded in this session. Use Save to write it to localStorage.',
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
      updateActiveWorkspace(currentDocument, (workspace) =>
        upsertPlanetaryWorld(workspace, draft, existingPlanetaryWorld)
      )
    );
  };

  const archivePlanetaryWorld = (
    planetaryWorldId: string,
    archived: boolean
  ) => {
    setUnsavedDocument((currentDocument) =>
      updateActiveWorkspace(currentDocument, (workspace) =>
        setPlanetaryWorldArchived(workspace, planetaryWorldId, archived)
      )
    );
  };

  const permanentlyDeletePlanetaryWorld = (planetaryWorldId: string) => {
    captureSnapshot(document, 'planetary-world-delete');
    setUnsavedDocument((currentDocument) =>
      updateActiveWorkspace(currentDocument, (workspace) =>
        deletePlanetaryWorld(workspace, planetaryWorldId)
      )
    );
  };

  const createEntryType = (draft: EntryTypeDraft) => {
    setUnsavedDocument((currentDocument) =>
      updateActiveWorkspace(currentDocument, (workspace) =>
        createCustomEntryType(workspace, draft)
      )
    );
  };

  const permanentlyDeleteEntryType = (sectionId: string) => {
    captureSnapshot(document, 'entry-type-delete');
    setUnsavedDocument((currentDocument) =>
      updateActiveWorkspace(currentDocument, (workspace) =>
        deleteCustomEntryType(workspace, sectionId)
      )
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
