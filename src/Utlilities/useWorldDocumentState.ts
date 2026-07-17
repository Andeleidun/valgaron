import { useEffect, useMemo, useRef, useState } from 'react';
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
  canRedoWorldDocumentRevision,
  canUndoWorldDocumentRevision,
  commitWorldDocumentRevision,
  createWorldDocumentHistory,
  formatWorldDocumentActionLabel,
  getActiveWorld,
  getRedoWorldDocumentActionLabel,
  getUndoWorldDocumentActionLabel,
  getWorldDocumentHistoryDocuments,
  getWorldDocumentHistorySaveState,
  hasUnpersistedWorldDocumentRevision,
  pruneUnreferencedAssetMetadata,
  localPersistenceCopy,
  moveEntryTypeFieldInActiveWorkspace,
  moveVocabularyValue,
  markWorldDocumentRevisionPersisted,
  renameEntryTypeFieldInActiveWorkspace,
  removeEntryTypeFieldInActiveWorkspace,
  saveEntryInActiveWorkspace,
  savePlanetaryWorldInActiveWorkspace,
  saveRelationshipInActiveWorkspace,
  setActiveWorkspace,
  setVocabularyValueArchived,
  setWorkspaceArchived,
  redoWorldDocumentRevision,
  updateActiveWorkspace,
  updateFieldOverride,
  updateVocabularyValue,
  updateWorkspaceMetadata,
  undoWorldDocumentRevision,
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
  type WorldImageAsset,
  type WorldDocumentHistory,
  type WorldDocumentRevisionOrigin,
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
import { cleanupBrowserImageAssets } from './imageAssetGarbageCollection';

export type WorldDocumentSaveStatus = {
  state: 'saved' | 'unsaved' | 'dirty' | 'failed' | 'paused';
  savedAt: string;
  attemptedAt: string | null;
};

export type RecoverySnapshotStatus = {
  state: 'idle' | 'saved' | 'failed' | 'restored' | 'deleted';
  message: string;
  updatedAt: string;
};

export type EntryRelationshipDocumentTransaction = {
  actionLabel: string;
  assets?: readonly WorldImageAsset[];
  entries?: readonly WorldEntry[];
  relationships?: readonly WorldRelationship[];
  relationshipIdsToDelete?: readonly string[];
};

function getEntryRecordType(
  world: WorldWorkspace,
  entry: Pick<WorldEntry, 'kind'>
): string {
  return (
    world.entryTypes.find((section) => section.id === entry.kind)
      ?.singularTitle ?? 'Entry'
  );
}

export function applyEntryRelationshipDocumentTransaction(
  currentDocument: WorldDocument,
  {
    assets = [],
    entries = [],
    relationships: relationshipsToSave = [],
    relationshipIdsToDelete = [],
  }: Omit<EntryRelationshipDocumentTransaction, 'actionLabel'>
): WorldDocument {
  let nextDocument = currentDocument;
  for (const relationshipId of relationshipIdsToDelete) {
    nextDocument = deleteRelationshipFromActiveWorkspace({
      document: nextDocument,
      relationshipId,
    });
  }
  for (const relationship of relationshipsToSave) {
    nextDocument = saveRelationshipInActiveWorkspace({
      document: nextDocument,
      relationship,
    });
  }
  for (const entry of entries) {
    nextDocument = saveEntryInActiveWorkspace({
      document: nextDocument,
      entry,
    });
  }
  const assetById = new Map(
    [...nextDocument.assets, ...assets].map((asset) => [asset.id, asset])
  );
  const assetsChanged =
    assetById.size !== nextDocument.assets.length ||
    assets.some(
      (asset) =>
        nextDocument.assets.find((candidate) => candidate.id === asset.id) !==
        asset
    );
  return pruneUnreferencedAssetMetadata(
    assetsChanged
      ? { ...nextDocument, assets: [...assetById.values()] }
      : nextDocument
  );
}

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
  canUndo: boolean;
  canRedo: boolean;
  undoLabel: string | null;
  redoLabel: string | null;
  historyAnnouncement: string;
  presentRevisionId: number;
  undoDocumentChange: () => void;
  redoDocumentChange: () => void;
  saveCurrentDocument: (stagedAssetIds?: readonly string[]) => void;
  commitEntryRelationshipTransaction: (
    transaction: EntryRelationshipDocumentTransaction
  ) => void;
  saveEntry: (entry: WorldEntry, assets?: readonly WorldImageAsset[]) => void;
  archiveEntry: (entry: WorldEntry, archived: boolean) => void;
  permanentlyDeleteEntry: (entry: WorldEntry) => void;
  saveRelationship: (relationship: WorldRelationship) => void;
  removeRelationship: (relationshipId: string) => void;
  unlinkRelationship: (relationshipId: string) => void;
  resetToSeed: () => void;
  importDocument: (nextDocument: WorldDocument) => boolean;
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
  const [initialHistory] = useState(() =>
    createWorldDocumentHistory({
      document: initialLoadResult.document,
      persisted: initialLoadResult.status.source === 'current',
      initialUnpersistedState: shouldPauseInitialSaveAfterLoad(
        initialLoadResult.status
      )
        ? 'paused'
        : initialLoadResult.status.source === 'current'
        ? null
        : 'unsaved',
    })
  );
  const [history, setHistory] = useState<WorldDocumentHistory>(initialHistory);
  const historyRef = useRef(initialHistory);
  const [loadStatus, setLoadStatus] = useState<WorldDocumentLoadStatus>(
    () => initialLoadResult.status
  );
  const [failedSaveAttempt, setFailedSaveAttempt] = useState<{
    attemptedAt: string;
    revisionId: number;
  } | null>(null);
  const [historyAnnouncement, setHistoryAnnouncement] = useState('');
  const [snapshots, setSnapshots] = useState<RecoverySnapshot[]>(() =>
    loadRecoverySnapshots()
  );
  const [recoverySnapshotStatus, setRecoverySnapshotStatus] =
    useState<RecoverySnapshotStatus>(() => ({
      state: 'idle',
      message: 'Recovery snapshots are ready.',
      updatedAt: initialLoadResult.document.savedAt,
    }));
  const document = history.present.document;
  const baseSaveState = getWorldDocumentHistorySaveState(history);
  const saveStatus: WorldDocumentSaveStatus = {
    state:
      failedSaveAttempt?.revisionId === history.present.id &&
      baseSaveState !== 'saved'
        ? 'failed'
        : baseSaveState,
    savedAt: history.lastPersistedAt ?? history.documentSavedAt,
    attemptedAt: failedSaveAttempt?.attemptedAt ?? null,
  };
  const hasUnsavedDocumentChanges =
    hasUnpersistedWorldDocumentRevision(history);
  const activeWorld = useMemo(() => getActiveWorld(document), [document]);
  const sections = activeWorld.entryTypes;
  const codex = activeWorld.codex;
  const relationships = activeWorld.relationships;
  const recoverySnapshots = useMemo(
    () => summarizeRecoverySnapshots(snapshots),
    [snapshots]
  );

  useEffect(() => {
    void cleanupBrowserImageAssets(initialLoadResult.document, {
      retainedDocuments: getWorldDocumentHistoryDocuments(initialHistory),
    });
  }, [initialHistory, initialLoadResult.document]);

  const installHistory = (nextHistory: WorldDocumentHistory) => {
    historyRef.current = nextHistory;
    setHistory(nextHistory);
  };

  const commitDocumentChange = (
    actionLabel: string,
    prepareDocument: (currentDocument: WorldDocument) => WorldDocument,
    options: {
      origin?: Exclude<WorldDocumentRevisionOrigin, 'initial'>;
      recoveryReason?: RecoverySnapshotReason;
    } = {}
  ): boolean => {
    const currentHistory = historyRef.current;
    const nextDocument = applyUnsavedDocumentUpdate(
      currentHistory.present.document,
      prepareDocument
    );
    const nextHistory = commitWorldDocumentRevision(currentHistory, {
      actionLabel,
      document: nextDocument,
      ...(options.origin ? { origin: options.origin } : {}),
    });
    if (nextHistory === currentHistory) {
      return false;
    }
    if (options.recoveryReason) {
      captureSnapshot(currentHistory.present.document, options.recoveryReason);
    }
    installHistory(nextHistory);
    setHistoryAnnouncement('');
    return true;
  };

  const saveCurrentDocument = (stagedAssetIds: readonly string[] = []) => {
    setHistoryAnnouncement('');
    const savedAt = new Date().toISOString();
    const currentHistory = historyRef.current;
    const savedDocument = createManualSaveDocument(
      currentHistory.present.document,
      savedAt
    );
    const didSave = saveWorldDocument(savedDocument);
    if (didSave) {
      const persistedHistory = markWorldDocumentRevisionPersisted(
        currentHistory,
        savedAt
      );
      installHistory(persistedHistory);
      setFailedSaveAttempt(null);
      void cleanupBrowserImageAssets(savedDocument, {
        retainedDocuments: getWorldDocumentHistoryDocuments(persistedHistory),
        snapshots,
        stagedAssetIds,
      });
    } else {
      setFailedSaveAttempt({
        attemptedAt: savedAt,
        revisionId: currentHistory.present.id,
      });
    }
  };

  const undoDocumentChange = () => {
    const currentHistory = historyRef.current;
    const actionLabel = getUndoWorldDocumentActionLabel(currentHistory);
    const nextHistory = undoWorldDocumentRevision(currentHistory);
    if (nextHistory === currentHistory) {
      return;
    }
    installHistory(nextHistory);
    setFailedSaveAttempt(null);
    setLoadStatus(
      getLoadStatusForRevisionOrigin({
        checkedAt: new Date().toISOString(),
        initialStatus: initialLoadResult.status,
        origin: nextHistory.present.origin,
      })
    );
    setHistoryAnnouncement(
      actionLabel ? `Undid ${actionLabel}.` : 'Undid change.'
    );
  };

  const redoDocumentChange = () => {
    const currentHistory = historyRef.current;
    const actionLabel = getRedoWorldDocumentActionLabel(currentHistory);
    const nextHistory = redoWorldDocumentRevision(currentHistory);
    if (nextHistory === currentHistory) {
      return;
    }
    installHistory(nextHistory);
    setFailedSaveAttempt(null);
    setLoadStatus(
      getLoadStatusForRevisionOrigin({
        checkedAt: new Date().toISOString(),
        initialStatus: initialLoadResult.status,
        origin: nextHistory.present.origin,
      })
    );
    setHistoryAnnouncement(
      actionLabel ? `Redid ${actionLabel}.` : 'Redid change.'
    );
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

  const saveEntry = (
    entry: WorldEntry,
    assets: readonly WorldImageAsset[] = []
  ) => {
    const currentWorld = getActiveWorld(historyRef.current.present.document);
    const existingEntry = currentWorld.codex[entry.kind]?.some(
      (candidate) => candidate.id === entry.id
    );
    const recordType = getEntryRecordType(currentWorld, entry);
    commitDocumentChange(
      formatWorldDocumentActionLabel({
        action: existingEntry ? 'Update' : 'Create',
        recordType,
        subject: entry.name,
      }),
      (currentDocument) => {
        const assetById = new Map(
          [...currentDocument.assets, ...assets].map((asset) => [
            asset.id,
            asset,
          ])
        );
        return pruneUnreferencedAssetMetadata({
          ...saveEntryInActiveWorkspace({ document: currentDocument, entry }),
          assets: [...assetById.values()],
        });
      }
    );
  };

  const commitEntryRelationshipTransaction = ({
    actionLabel,
    assets = [],
    entries = [],
    relationships: relationshipsToSave = [],
    relationshipIdsToDelete = [],
  }: EntryRelationshipDocumentTransaction) => {
    commitDocumentChange(actionLabel, (currentDocument) =>
      applyEntryRelationshipDocumentTransaction(currentDocument, {
        assets,
        entries,
        relationships: relationshipsToSave,
        relationshipIdsToDelete,
      })
    );
  };

  const archiveEntry = (entry: WorldEntry, archived: boolean) => {
    const recordType = getEntryRecordType(
      getActiveWorld(historyRef.current.present.document),
      entry
    );
    commitDocumentChange(
      formatWorldDocumentActionLabel({
        action: archived ? 'Archive' : 'Restore',
        recordType,
        subject: entry.name,
      }),
      (currentDocument) =>
        archiveEntryInActiveWorkspace({
          archived,
          document: currentDocument,
          entry,
        })
    );
  };

  const permanentlyDeleteEntry = (entry: WorldEntry) => {
    const recordType = getEntryRecordType(
      getActiveWorld(historyRef.current.present.document),
      entry
    );
    commitDocumentChange(
      formatWorldDocumentActionLabel({
        action: 'Delete',
        recordType,
        subject: entry.name,
      }),
      (currentDocument) =>
        pruneUnreferencedAssetMetadata(
          deleteEntryFromActiveWorkspace({ document: currentDocument, entry })
        ),
      { recoveryReason: 'permanent-delete' }
    );
  };

  const saveRelationship = (relationship: WorldRelationship) => {
    const exists = getActiveWorld(
      historyRef.current.present.document
    ).relationships.some((candidate) => candidate.id === relationship.id);
    commitDocumentChange(
      `${exists ? 'Update' : 'Create'} Relationship`,
      (currentDocument) =>
        saveRelationshipInActiveWorkspace({
          document: currentDocument,
          relationship,
        })
    );
  };

  const unlinkRelationship = (relationshipId: string) => {
    commitDocumentChange('Delete Relationship', (currentDocument) =>
      deleteRelationshipFromActiveWorkspace({
        document: currentDocument,
        relationshipId,
      })
    );
  };

  const removeRelationship = (relationshipId: string) => {
    commitDocumentChange(
      'Delete Relationship',
      (currentDocument) =>
        deleteRelationshipFromActiveWorkspace({
          document: currentDocument,
          relationshipId,
        }),
      { recoveryReason: 'relationship-delete' }
    );
  };

  const resetToSeed = () => {
    const didCommit = commitDocumentChange(
      'Reset to starter data',
      () => resetWorldDocumentStorage(),
      { origin: 'reset', recoveryReason: 'reset' }
    );
    if (didCommit) {
      setLoadStatus(
        getLoadStatusForRevisionOrigin({
          origin: 'reset',
          initialStatus: initialLoadResult.status,
          checkedAt: new Date().toISOString(),
        })
      );
    }
  };

  const importDocument = (nextDocument: WorldDocument) => {
    const didCommit = commitDocumentChange(
      'Import backup',
      () => nextDocument,
      { origin: 'import', recoveryReason: 'import' }
    );
    if (didCommit) {
      setLoadStatus(
        getLoadStatusForRevisionOrigin({
          origin: 'import',
          initialStatus: initialLoadResult.status,
          checkedAt: new Date().toISOString(),
        })
      );
    }
    return didCommit;
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
    const didCommit = commitDocumentChange(
      formatWorldDocumentActionLabel({
        action: 'Restore',
        recordType: 'Recovery Snapshot',
        subject: getActiveWorld(snapshot.document).name,
      }),
      () => snapshot.document,
      { origin: 'recovery-restore', recoveryReason: 'restore' }
    );
    if (!didCommit) {
      return;
    }
    setLoadStatus(
      getLoadStatusForRevisionOrigin({
        origin: 'recovery-restore',
        initialStatus: initialLoadResult.status,
        checkedAt: new Date().toISOString(),
      })
    );
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
    void cleanupBrowserImageAssets(historyRef.current.present.document, {
      retainedDocuments: getWorldDocumentHistoryDocuments(historyRef.current),
      snapshots: nextSnapshots,
    });
    setRecoverySnapshotStatus({
      state: 'deleted',
      message: 'Recovery snapshot deleted.',
      updatedAt: new Date().toISOString(),
    });
  };

  const createWorkspaceFromDraft = (draft: WorkspaceDraft) => {
    commitDocumentChange(
      formatWorldDocumentActionLabel({
        action: 'Create',
        recordType: 'Workspace',
        subject: draft.name,
      }),
      (currentDocument) => createWorkspace(currentDocument, draft)
    );
  };

  const updateWorkspace = (workspaceId: string, draft: WorkspaceDraft) => {
    commitDocumentChange(
      formatWorldDocumentActionLabel({
        action: 'Update',
        recordType: 'Workspace',
        subject: draft.name,
      }),
      (currentDocument) =>
        updateWorkspaceMetadata(currentDocument, workspaceId, draft)
    );
  };

  const switchWorkspace = (workspaceId: string) => {
    const workspace = historyRef.current.present.document.worlds.find(
      (candidate) => candidate.id === workspaceId
    );
    commitDocumentChange(
      formatWorldDocumentActionLabel({
        action: 'Switch to',
        recordType: 'Workspace',
        subject: workspace?.name,
      }),
      (currentDocument) => setActiveWorkspace(currentDocument, workspaceId)
    );
  };

  const archiveWorkspace = (workspaceId: string, archived: boolean) => {
    const workspace = historyRef.current.present.document.worlds.find(
      (candidate) => candidate.id === workspaceId
    );
    commitDocumentChange(
      formatWorldDocumentActionLabel({
        action: archived ? 'Archive' : 'Restore',
        recordType: 'Workspace',
        subject: workspace?.name,
      }),
      (currentDocument) =>
        setWorkspaceArchived(currentDocument, workspaceId, archived)
    );
  };

  const duplicateWorkspaceFromId = (workspaceId: string) => {
    const workspace = historyRef.current.present.document.worlds.find(
      (candidate) => candidate.id === workspaceId
    );
    commitDocumentChange(
      formatWorldDocumentActionLabel({
        action: 'Duplicate',
        recordType: 'Workspace',
        subject: workspace?.name,
      }),
      (currentDocument) => duplicateWorkspace(currentDocument, workspaceId)
    );
  };

  const permanentlyDeleteWorkspace = (workspaceId: string) => {
    const workspace = historyRef.current.present.document.worlds.find(
      (candidate) => candidate.id === workspaceId
    );
    commitDocumentChange(
      formatWorldDocumentActionLabel({
        action: 'Delete',
        recordType: 'Workspace',
        subject: workspace?.name,
      }),
      (currentDocument) =>
        pruneUnreferencedAssetMetadata(
          deleteWorkspace(currentDocument, workspaceId)
        ),
      { recoveryReason: 'workspace-delete' }
    );
  };

  const savePlanetaryWorld = (
    draft: PlanetaryWorldDraft,
    existingPlanetaryWorld?: InFictionWorld
  ) => {
    commitDocumentChange(
      formatWorldDocumentActionLabel({
        action: existingPlanetaryWorld ? 'Update' : 'Create',
        recordType: 'World',
        subject: draft.name,
      }),
      (currentDocument) =>
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
    const planetaryWorld = getActiveWorld(
      historyRef.current.present.document
    ).planetaryWorlds.find((candidate) => candidate.id === planetaryWorldId);
    commitDocumentChange(
      formatWorldDocumentActionLabel({
        action: archived ? 'Archive' : 'Restore',
        recordType: 'World',
        subject: planetaryWorld?.name,
      }),
      (currentDocument) =>
        archivePlanetaryWorldInActiveWorkspace({
          archived,
          document: currentDocument,
          planetaryWorldId,
        })
    );
  };

  const permanentlyDeletePlanetaryWorld = (planetaryWorldId: string) => {
    const planetaryWorld = getActiveWorld(
      historyRef.current.present.document
    ).planetaryWorlds.find((candidate) => candidate.id === planetaryWorldId);
    commitDocumentChange(
      formatWorldDocumentActionLabel({
        action: 'Delete',
        recordType: 'World',
        subject: planetaryWorld?.name,
      }),
      (currentDocument) =>
        deletePlanetaryWorldFromActiveWorkspace({
          document: currentDocument,
          planetaryWorldId,
        }),
      { recoveryReason: 'planetary-world-delete' }
    );
  };

  const createEntryType = (draft: EntryTypeDraft) => {
    commitDocumentChange(
      formatWorldDocumentActionLabel({
        action: 'Create',
        recordType: 'Entry Type',
        subject: draft.title,
      }),
      (currentDocument) =>
        createEntryTypeInActiveWorkspace({ document: currentDocument, draft })
    );
  };

  const addEntryTypeFields = (sectionId: string, fieldsText: string) => {
    commitDocumentChange('Add Entry Type Fields', (currentDocument) =>
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
    commitDocumentChange(
      `Move Entry Type Field ${direction === 'up' ? 'Up' : 'Down'}`,
      (currentDocument) =>
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
    commitDocumentChange(
      formatWorldDocumentActionLabel({
        action: 'Update',
        recordType: 'Field Label',
        subject: label,
      }),
      (currentDocument) =>
        renameEntryTypeFieldInActiveWorkspace({
          document: currentDocument,
          fieldKey,
          label,
          sectionId,
        })
    );
  };

  const removeEntryTypeField = (sectionId: string, fieldKey: string) => {
    commitDocumentChange('Remove Entry Type Field', (currentDocument) =>
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
    commitDocumentChange(
      formatWorldDocumentActionLabel({
        action: 'Add',
        recordType: 'Vocabulary Value',
        subject: draft.label,
      }),
      (currentDocument) =>
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
    commitDocumentChange(
      formatWorldDocumentActionLabel({
        action: 'Update',
        recordType: 'Vocabulary Value',
        subject: draft.label,
      }),
      (currentDocument) =>
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
    commitDocumentChange(
      `${archived ? 'Archive' : 'Restore'} Vocabulary Value`,
      (currentDocument) =>
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
    commitDocumentChange(
      `Move Vocabulary Value ${direction === 'up' ? 'Up' : 'Down'}`,
      (currentDocument) =>
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
    commitDocumentChange(
      formatWorldDocumentActionLabel({
        action: 'Update',
        recordType: 'Field Settings',
        subject: draft.label,
      }),
      (currentDocument) =>
        updateActiveWorkspace(currentDocument, (workspace) =>
          updateFieldOverride(workspace, sectionId, fieldKey, draft)
        )
    );
  };

  const clearHiddenEntryDetails = () => {
    commitDocumentChange(
      'Clear All Hidden Entry Details',
      (currentDocument) =>
        clearHiddenEntryDetailsInActiveWorkspace({
          document: currentDocument,
        }),
      { recoveryReason: 'schema-cleanup' }
    );
  };

  const clearHiddenEntryDetail = (
    sectionId: string,
    entryId: string,
    fieldKey: string
  ) => {
    commitDocumentChange(
      'Clear Hidden Entry Detail',
      (currentDocument) =>
        clearHiddenEntryDetailInActiveWorkspace({
          document: currentDocument,
          entryId,
          fieldKey,
          sectionId,
        }),
      { recoveryReason: 'schema-cleanup' }
    );
  };

  const permanentlyDeleteEntryType = (sectionId: string) => {
    const section = getActiveWorld(
      historyRef.current.present.document
    ).entryTypes.find((candidate) => candidate.id === sectionId);
    commitDocumentChange(
      formatWorldDocumentActionLabel({
        action: 'Delete',
        recordType: 'Entry Type',
        subject: section?.title,
      }),
      (currentDocument) =>
        pruneUnreferencedAssetMetadata(
          deleteEntryTypeFromActiveWorkspace({
            document: currentDocument,
            sectionId,
          })
        ),
      { recoveryReason: 'entry-type-delete' }
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
    canUndo: canUndoWorldDocumentRevision(history),
    canRedo: canRedoWorldDocumentRevision(history),
    undoLabel: getUndoWorldDocumentActionLabel(history),
    redoLabel: getRedoWorldDocumentActionLabel(history),
    historyAnnouncement,
    presentRevisionId: history.present.id,
    undoDocumentChange,
    redoDocumentChange,
    saveCurrentDocument,
    commitEntryRelationshipTransaction,
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

export function getLoadStatusForRevisionOrigin({
  checkedAt,
  initialStatus,
  origin,
}: {
  checkedAt: string;
  initialStatus: WorldDocumentLoadStatus;
  origin: WorldDocumentRevisionOrigin;
}): WorldDocumentLoadStatus {
  switch (origin) {
    case 'initial':
      return initialStatus;
    case 'import':
      return {
        state: 'loaded',
        source: 'current',
        message: `Imported backup is loaded in this session. Use Save to write it to ${localPersistenceCopy.browserSaveTarget}.`,
        issues: initialStatus.issues,
        checkedAt,
      };
    case 'reset':
      return {
        state: 'loaded',
        source: 'seed',
        message: `Starter data was loaded by reset. Use Save to write it to ${localPersistenceCopy.browserSaveTarget}.`,
        issues: initialStatus.issues,
        checkedAt,
      };
    case 'recovery-restore':
      return {
        state: 'loaded',
        source: 'current',
        message: `Recovery snapshot is loaded in this session. Use Save to write it to ${localPersistenceCopy.browserSaveTarget}.`,
        issues: initialStatus.issues,
        checkedAt,
      };
  }
}

export function applyUnsavedDocumentUpdate(
  currentDocument: WorldDocument,
  updateDocument: (currentDocument: WorldDocument) => WorldDocument
): WorldDocument {
  const nextDocument = updateDocument(currentDocument);
  if (nextDocument === currentDocument) {
    return currentDocument;
  }
  return nextDocument.savedAt === currentDocument.savedAt
    ? nextDocument
    : { ...nextDocument, savedAt: currentDocument.savedAt };
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
