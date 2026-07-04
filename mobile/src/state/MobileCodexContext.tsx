import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type {
  InFictionWorld,
  TimelineOrderDirection,
  WorldDocument,
  WorldEntry,
  WorldRelationship,
  WorldSectionConfig,
} from '@valgaron/core';
import {
  applyEntry,
  createCustomEntryType,
  createEmptyRelationshipDraft,
  createSeedWorldDocument,
  createWorkspace as createCoreWorkspace,
  deleteCustomEntryType,
  deleteEntry,
  deletePlanetaryWorld,
  deleteRelationship,
  deleteRelationshipsForEntry,
  deleteWorkspace as deleteCoreWorkspace,
  duplicateEntry as duplicateCoreEntry,
  duplicateWorkspace as duplicateCoreWorkspace,
  entryFromDraft,
  formatDraftValidationErrors,
  getActiveWorld,
  getEntries,
  getRelationshipEntries,
  getTimelineOrderUpdates,
  localPersistenceCopy,
  relationshipFromDraft,
  setActiveWorkspace,
  setEntryArchived,
  setPlanetaryWorldArchived,
  setWorkspaceArchived,
  updateActiveWorkspace,
  updateActiveWorld,
  updateWorkspaceMetadata,
  upsertPlanetaryWorld,
  upsertRelationship,
  validateEntryDraft,
  validateEntryTypeDraft,
  validatePlanetaryWorldDraft,
  validateRelationshipDraft,
  validateWorkspaceDraft,
  type DraftValidationResult,
  type EntryDraft,
  type EntryTypeDraft,
  type PlanetaryWorldDraft,
  type RelationshipDraft,
  type WorkspaceDraft,
} from '@valgaron/core';
import { asyncStorageAdapter } from '../storage/asyncStorageAdapter';
import {
  createMobileRecoverySnapshot,
  deleteMobileRecoverySnapshotById,
  loadMobileRecoverySnapshots,
  loadMobileWorldDocument,
  parseMobileWorldImport,
  saveMobileRecoverySnapshot,
  saveMobileWorldDocument,
  type MobileDocumentLoadStatus,
  type MobileImportResult,
  type MobileRecoverySnapshot,
  type MobileRecoverySnapshotReason,
} from '../storage/mobileStorage';
import {
  getMobileDataActionResultMessage,
  mobileRecoverySnapshotSaveFailedMessage,
} from './mobileDestructiveActions';
import {
  getMobileCommitPendingMessage,
  getMobileCommitResolvedMessage,
} from './mobileCommitFeedback';
type MobileCodexState = {
  document: WorldDocument;
  loadStatus: MobileDocumentLoadStatus;
  isLoading: boolean;
  saveMessage: string;
  formMessage: string;
  importResult: MobileImportResult | null;
  lastRecoverySnapshot: MobileRecoverySnapshot | null;
  recoverySnapshots: readonly MobileRecoverySnapshot[];
};

export type MobileCodexController = MobileCodexState & {
  activeWorld: ReturnType<typeof getActiveWorld>;
  sections: readonly WorldSectionConfig[];
  saveEntryDraft: (
    section: WorldSectionConfig,
    draft: EntryDraft,
    existingEntry?: WorldEntry
  ) => WorldEntry | null;
  archiveEntry: (entry: WorldEntry, archived: boolean) => void;
  duplicateEntry: (
    section: WorldSectionConfig,
    entry: WorldEntry
  ) => WorldEntry;
  moveTimelineEvent: (
    eventId: string,
    direction: TimelineOrderDirection
  ) => void;
  permanentlyDeleteEntry: (entry: WorldEntry) => void;
  createRelationshipDraft: () => RelationshipDraft;
  saveRelationshipDraft: (
    draft: RelationshipDraft,
    existingRelationship?: WorldRelationship
  ) => boolean;
  removeRelationship: (relationshipId: string) => void;
  unlinkRelationship: (relationshipId: string) => void;
  createWorkspace: (draft: WorkspaceDraft) => boolean;
  updateWorkspace: (workspaceId: string, draft: WorkspaceDraft) => boolean;
  switchWorkspace: (workspaceId: string) => void;
  archiveWorkspace: (workspaceId: string, archived: boolean) => void;
  duplicateWorkspace: (workspaceId: string) => void;
  permanentlyDeleteWorkspace: (workspaceId: string) => void;
  savePlanetaryWorld: (
    draft: PlanetaryWorldDraft,
    existingPlanetaryWorld?: InFictionWorld
  ) => boolean;
  archivePlanetaryWorld: (planetaryWorldId: string, archived: boolean) => void;
  permanentlyDeletePlanetaryWorld: (planetaryWorldId: string) => void;
  createEntryType: (draft: EntryTypeDraft) => boolean;
  permanentlyDeleteEntryType: (sectionId: string) => void;
  importDocumentText: (text: string) => void;
  restoreRecoverySnapshot: (snapshotId: string) => void;
  deleteRecoverySnapshot: (snapshotId: string) => void;
  resetToSeed: () => void;
};

const initialDocument = createSeedWorldDocument();

const MobileCodexContext = createContext<MobileCodexController | null>(null);

export function MobileCodexProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<MobileCodexState>(() => ({
    document: initialDocument,
    loadStatus: {
      source: 'seed',
      message: 'Opening starter data.',
      checkedAt: initialDocument.savedAt,
    },
    isLoading: true,
    saveMessage: `Loading the codex stored on ${localPersistenceCopy.deviceSaveTarget}.`,
    formMessage: '',
    importResult: null,
    lastRecoverySnapshot: null,
    recoverySnapshots: [],
  }));

  useEffect(() => {
    let mounted = true;
    async function loadDocument() {
      const [loadResult, recoverySnapshots] = await Promise.all([
        loadMobileWorldDocument(asyncStorageAdapter),
        loadMobileRecoverySnapshots(asyncStorageAdapter),
      ]);
      if (!mounted) {
        return;
      }
      setState((current) => ({
        ...current,
        document: loadResult.document,
        loadStatus: loadResult.status,
        isLoading: false,
        saveMessage: loadResult.status.message,
        lastRecoverySnapshot: recoverySnapshots[0] ?? null,
        recoverySnapshots,
      }));
    }
    void loadDocument();
    return () => {
      mounted = false;
    };
  }, []);

  const commitDocument = useCallback(
    (
      updateDocument: (currentDocument: WorldDocument) => WorldDocument,
      recoveryReason?: MobileRecoverySnapshotReason,
      savedFormMessage = ''
    ) => {
      setState((current) => {
        const nextDocument = updateDocument(current.document);
        const snapshot = recoveryReason
          ? createMobileRecoverySnapshot(current.document, recoveryReason)
          : null;
        if (snapshot) {
          void saveMobileRecoverySnapshot(asyncStorageAdapter, snapshot).then(
            (didSave) => {
              if (didSave) {
                return;
              }
              setState((latest) => {
                const nextRecoverySnapshots = latest.recoverySnapshots.filter(
                  (item) => item.id !== snapshot.id
                );
                const snapshotWasVisible =
                  nextRecoverySnapshots.length !==
                    latest.recoverySnapshots.length ||
                  latest.lastRecoverySnapshot?.id === snapshot.id;
                if (!snapshotWasVisible) {
                  return latest;
                }
                return {
                  ...latest,
                  formMessage: mobileRecoverySnapshotSaveFailedMessage,
                  lastRecoverySnapshot:
                    latest.lastRecoverySnapshot?.id === snapshot.id
                      ? nextRecoverySnapshots[0] ?? null
                      : latest.lastRecoverySnapshot,
                  recoverySnapshots: nextRecoverySnapshots,
                };
              });
            }
          );
        }
        void saveMobileWorldDocument(asyncStorageAdapter, nextDocument).then(
          (didSave) => {
            setState((latest) =>
              latest.document === nextDocument
                ? {
                    ...latest,
                    saveMessage: didSave
                      ? localPersistenceCopy.deviceSaved
                      : localPersistenceCopy.deviceSaveFailed,
                    formMessage: getMobileCommitResolvedMessage({
                      currentFormMessage: latest.formMessage,
                      didSave,
                      savedFormMessage,
                    }),
                  }
                : latest
            );
          }
        );
        return {
          ...current,
          document: nextDocument,
          saveMessage: localPersistenceCopy.deviceSaving,
          formMessage: getMobileCommitPendingMessage(savedFormMessage),
          lastRecoverySnapshot: snapshot ?? current.lastRecoverySnapshot,
          recoverySnapshots: snapshot
            ? [
                snapshot,
                ...current.recoverySnapshots.filter(
                  (item) => item.id !== snapshot.id
                ),
              ].slice(0, 8)
            : current.recoverySnapshots,
        };
      });
    },
    []
  );

  const activeWorld = useMemo(
    () => getActiveWorld(state.document),
    [state.document]
  );

  const setFormValidationError = useCallback(
    (validation: DraftValidationResult) => {
      setState((current) => ({
        ...current,
        formMessage: formatDraftValidationErrors(validation),
      }));
    },
    []
  );

  const controller = useMemo<MobileCodexController>(
    () => ({
      ...state,
      activeWorld,
      sections: activeWorld.entryTypes,
      saveEntryDraft(section, draft, existingEntry) {
        const validation = validateEntryDraft(section, draft);
        if (!validation.ok) {
          setFormValidationError(validation);
          return null;
        }
        const entry = entryFromDraft(section, draft, existingEntry);
        commitDocument(
          (currentDocument) =>
            updateActiveWorld(currentDocument, (world) => ({
              ...world,
              codex: applyEntry(world.codex, entry, world.entryTypes),
              updatedAt: new Date().toISOString(),
            })),
          undefined,
          existingEntry
            ? 'Updated entry on this device.'
            : 'Saved entry on this device.'
        );
        return entry;
      },
      archiveEntry(entry, archived) {
        commitDocument((currentDocument) =>
          updateActiveWorld(currentDocument, (world) => ({
            ...world,
            codex: setEntryArchived(
              world.codex,
              entry,
              archived,
              world.entryTypes
            ),
            updatedAt: new Date().toISOString(),
          }))
        );
      },
      duplicateEntry(section, entry) {
        const duplicate = duplicateCoreEntry(section, entry);
        commitDocument((currentDocument) =>
          updateActiveWorld(currentDocument, (world) => ({
            ...world,
            codex: applyEntry(world.codex, duplicate, world.entryTypes),
            updatedAt: new Date().toISOString(),
          }))
        );
        return duplicate;
      },
      moveTimelineEvent(eventId, direction) {
        commitDocument((currentDocument) =>
          updateActiveWorld(currentDocument, (world) => {
            const updates = getTimelineOrderUpdates(
              getEntries(world.codex, 'timeline'),
              eventId,
              direction
            );
            if (updates.length === 0) {
              return world;
            }
            return {
              ...world,
              codex: updates.reduce(
                (codex, event) => applyEntry(codex, event, world.entryTypes),
                world.codex
              ),
              updatedAt: new Date().toISOString(),
            };
          })
        );
      },
      permanentlyDeleteEntry(entry) {
        commitDocument(
          (currentDocument) =>
            updateActiveWorld(currentDocument, (world) => ({
              ...world,
              codex: deleteEntry(world.codex, entry, world.entryTypes),
              relationships: deleteRelationshipsForEntry(
                world.relationships,
                entry.id
              ),
              updatedAt: new Date().toISOString(),
            })),
          'permanent-delete'
        );
      },
      createRelationshipDraft: createEmptyRelationshipDraft,
      saveRelationshipDraft(draft, existingRelationship) {
        const validation = validateRelationshipDraft(
          draft,
          getRelationshipEntries(activeWorld.codex, activeWorld.entryTypes).map(
            (entry) => entry.id
          )
        );
        if (!validation.ok) {
          setFormValidationError(validation);
          return false;
        }
        const relationship = relationshipFromDraft(draft, existingRelationship);
        commitDocument(
          (currentDocument) =>
            updateActiveWorld(currentDocument, (world) => ({
              ...world,
              relationships: upsertRelationship(
                world.relationships,
                relationship
              ),
              updatedAt: new Date().toISOString(),
            })),
          undefined,
          existingRelationship
            ? 'Updated relationship on this device.'
            : 'Saved relationship on this device.'
        );
        return true;
      },
      unlinkRelationship(relationshipId) {
        commitDocument((currentDocument) =>
          updateActiveWorld(currentDocument, (world) => ({
            ...world,
            relationships: deleteRelationship(
              world.relationships,
              relationshipId
            ),
            updatedAt: new Date().toISOString(),
          }))
        );
      },
      removeRelationship(relationshipId) {
        commitDocument(
          (currentDocument) =>
            updateActiveWorld(currentDocument, (world) => ({
              ...world,
              relationships: deleteRelationship(
                world.relationships,
                relationshipId
              ),
              updatedAt: new Date().toISOString(),
            })),
          'relationship-delete'
        );
      },
      createWorkspace(draft) {
        const validation = validateWorkspaceDraft(draft);
        if (!validation.ok) {
          setFormValidationError(validation);
          return false;
        }
        commitDocument(
          (currentDocument) => createCoreWorkspace(currentDocument, draft),
          undefined,
          'Created workspace on this device.'
        );
        return true;
      },
      updateWorkspace(workspaceId, draft) {
        const validation = validateWorkspaceDraft(draft);
        if (!validation.ok) {
          setFormValidationError(validation);
          return false;
        }
        commitDocument(
          (currentDocument) =>
            updateWorkspaceMetadata(currentDocument, workspaceId, draft),
          undefined,
          'Updated workspace on this device.'
        );
        return true;
      },
      switchWorkspace(workspaceId) {
        commitDocument((currentDocument) =>
          setActiveWorkspace(currentDocument, workspaceId)
        );
      },
      archiveWorkspace(workspaceId, archived) {
        commitDocument((currentDocument) =>
          setWorkspaceArchived(currentDocument, workspaceId, archived)
        );
      },
      duplicateWorkspace(workspaceId) {
        commitDocument((currentDocument) =>
          duplicateCoreWorkspace(currentDocument, workspaceId)
        );
      },
      permanentlyDeleteWorkspace(workspaceId) {
        commitDocument(
          (currentDocument) =>
            deleteCoreWorkspace(currentDocument, workspaceId),
          'workspace-delete'
        );
      },
      savePlanetaryWorld(draft, existingPlanetaryWorld) {
        const validation = validatePlanetaryWorldDraft(draft);
        if (!validation.ok) {
          setFormValidationError(validation);
          return false;
        }
        commitDocument(
          (currentDocument) =>
            updateActiveWorkspace(currentDocument, (workspace) =>
              upsertPlanetaryWorld(workspace, draft, existingPlanetaryWorld)
            ),
          undefined,
          existingPlanetaryWorld
            ? 'Updated in-fiction world on this device.'
            : 'Saved in-fiction world on this device.'
        );
        return true;
      },
      archivePlanetaryWorld(planetaryWorldId, archived) {
        commitDocument((currentDocument) =>
          updateActiveWorkspace(currentDocument, (workspace) =>
            setPlanetaryWorldArchived(workspace, planetaryWorldId, archived)
          )
        );
      },
      permanentlyDeletePlanetaryWorld(planetaryWorldId) {
        commitDocument(
          (currentDocument) =>
            updateActiveWorkspace(currentDocument, (workspace) =>
              deletePlanetaryWorld(workspace, planetaryWorldId)
            ),
          'planetary-world-delete'
        );
      },
      createEntryType(draft) {
        const validation = validateEntryTypeDraft(draft);
        if (!validation.ok) {
          setFormValidationError(validation);
          return false;
        }
        commitDocument(
          (currentDocument) =>
            updateActiveWorkspace(currentDocument, (workspace) =>
              createCustomEntryType(workspace, draft)
            ),
          undefined,
          'Created entry type on this device.'
        );
        return true;
      },
      permanentlyDeleteEntryType(sectionId) {
        commitDocument(
          (currentDocument) =>
            updateActiveWorkspace(currentDocument, (workspace) =>
              deleteCustomEntryType(workspace, sectionId)
            ),
          'entry-type-delete'
        );
      },
      importDocumentText(text) {
        const importResult = parseMobileWorldImport(text);
        if (!importResult.ok) {
          setState((current) => ({
            ...current,
            importResult,
            formMessage: importResult.error,
          }));
          return;
        }
        setState((current) => ({ ...current, importResult }));
        commitDocument(
          () => importResult.document,
          'import',
          getMobileDataActionResultMessage('import-document')
        );
      },
      restoreRecoverySnapshot(snapshotId) {
        const snapshot =
          state.recoverySnapshots.find((item) => item.id === snapshotId) ??
          null;
        if (!snapshot) {
          setState((current) => ({
            ...current,
            formMessage: 'No recovery snapshot is available on this device.',
          }));
          return;
        }
        commitDocument(
          () => snapshot.document,
          'restore',
          getMobileDataActionResultMessage('restore-snapshot')
        );
        setState((current) => ({ ...current, importResult: null }));
      },
      deleteRecoverySnapshot(snapshotId) {
        void deleteMobileRecoverySnapshotById(
          asyncStorageAdapter,
          snapshotId
        ).then((didDelete) => {
          setState((current) => ({
            ...current,
            formMessage: didDelete
              ? 'Deleted the recovery snapshot from this device.'
              : 'Could not delete the recovery snapshot from this device.',
            recoverySnapshots: didDelete
              ? current.recoverySnapshots.filter(
                  (snapshot) => snapshot.id !== snapshotId
                )
              : current.recoverySnapshots,
            lastRecoverySnapshot: didDelete
              ? current.recoverySnapshots.find(
                  (snapshot) => snapshot.id !== snapshotId
                ) ?? null
              : current.lastRecoverySnapshot,
          }));
        });
      },
      resetToSeed() {
        commitDocument(
          () => createSeedWorldDocument(),
          'reset',
          getMobileDataActionResultMessage('reset-document')
        );
        setState((current) => ({ ...current, importResult: null }));
      },
    }),
    [activeWorld, commitDocument, setFormValidationError, state]
  );

  return (
    <MobileCodexContext.Provider value={controller}>
      {children}
    </MobileCodexContext.Provider>
  );
}

export function useMobileCodex(): MobileCodexController {
  const controller = useContext(MobileCodexContext);
  if (!controller) {
    throw new Error('useMobileCodex must be used inside MobileCodexProvider.');
  }
  return controller;
}
