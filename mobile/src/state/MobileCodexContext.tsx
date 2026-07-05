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
  archiveEntryInActiveWorkspace,
  archivePlanetaryWorldInActiveWorkspace,
  createEntryTypeInActiveWorkspace,
  createEmptyRelationshipDraft,
  createSeedWorldDocument,
  createWorkspace as createCoreWorkspace,
  deleteEntryTypeFromActiveWorkspace,
  deleteEntryFromActiveWorkspace,
  deletePlanetaryWorldFromActiveWorkspace,
  deleteRelationshipFromActiveWorkspace,
  deleteWorkspace as deleteCoreWorkspace,
  duplicateEntry as duplicateCoreEntry,
  duplicateWorkspace as duplicateCoreWorkspace,
  entryFromDraft,
  formatDraftValidationErrors,
  getActiveWorld,
  getDataActionResultMessage,
  dataRecoverySnapshotDeleteFailedMessage,
  dataRecoverySnapshotSaveFailedMessage,
  dataRecoverySnapshotUnavailableMessage,
  getRelationshipEntries,
  getDeviceCommitPendingMessage,
  getDeviceCommitResolvedMessage,
  getDeviceCommitResultMessage,
  localPersistenceCopy,
  moveTimelineEventInActiveWorkspace,
  relationshipFromDraft,
  saveEntryInActiveWorkspace,
  savePlanetaryWorldInActiveWorkspace,
  saveRelationshipInActiveWorkspace,
  setActiveWorkspace,
  setWorkspaceArchived,
  updateActiveWorld,
  updateWorkspaceMetadata,
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
  resetMobileE2EWorldDocument,
  saveMobileRecoverySnapshot,
  saveMobileWorldDocument,
  type MobileDocumentLoadStatus,
  type MobileImportResult,
  type MobileRecoverySnapshot,
  type MobileRecoverySnapshotReason,
} from '../storage/mobileStorage';
import { isMobileE2EMode } from './mobileE2E';
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
      const e2eMode = isMobileE2EMode();
      const loadResult = e2eMode
        ? await resetMobileE2EWorldDocument(asyncStorageAdapter)
        : await loadMobileWorldDocument(asyncStorageAdapter);
      const recoverySnapshots = e2eMode
        ? []
        : await loadMobileRecoverySnapshots(asyncStorageAdapter);
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
                  formMessage: dataRecoverySnapshotSaveFailedMessage,
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
                    formMessage: getDeviceCommitResolvedMessage({
                      blockingFailureMessage:
                        dataRecoverySnapshotSaveFailedMessage,
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
          formMessage: getDeviceCommitPendingMessage(savedFormMessage),
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
            saveEntryInActiveWorkspace({
              document: currentDocument,
              entry,
            }),
          undefined,
          existingEntry
            ? getDeviceCommitResultMessage('entry-updated')
            : getDeviceCommitResultMessage('entry-saved')
        );
        return entry;
      },
      archiveEntry(entry, archived) {
        commitDocument((currentDocument) =>
          archiveEntryInActiveWorkspace({
            archived,
            document: currentDocument,
            entry,
          })
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
          moveTimelineEventInActiveWorkspace({
            direction,
            document: currentDocument,
            eventId,
          })
        );
      },
      permanentlyDeleteEntry(entry) {
        commitDocument(
          (currentDocument) =>
            deleteEntryFromActiveWorkspace({
              document: currentDocument,
              entry,
            }),
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
            saveRelationshipInActiveWorkspace({
              document: currentDocument,
              relationship,
            }),
          undefined,
          existingRelationship
            ? getDeviceCommitResultMessage('relationship-updated')
            : getDeviceCommitResultMessage('relationship-saved')
        );
        return true;
      },
      unlinkRelationship(relationshipId) {
        commitDocument((currentDocument) =>
          deleteRelationshipFromActiveWorkspace({
            document: currentDocument,
            relationshipId,
          })
        );
      },
      removeRelationship(relationshipId) {
        commitDocument(
          (currentDocument) =>
            deleteRelationshipFromActiveWorkspace({
              document: currentDocument,
              relationshipId,
            }),
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
          getDeviceCommitResultMessage('workspace-created')
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
          getDeviceCommitResultMessage('workspace-updated')
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
            savePlanetaryWorldInActiveWorkspace({
              document: currentDocument,
              draft,
              existingPlanetaryWorld,
            }),
          undefined,
          existingPlanetaryWorld
            ? getDeviceCommitResultMessage('planetary-world-updated')
            : getDeviceCommitResultMessage('planetary-world-saved')
        );
        return true;
      },
      archivePlanetaryWorld(planetaryWorldId, archived) {
        commitDocument((currentDocument) =>
          archivePlanetaryWorldInActiveWorkspace({
            archived,
            document: currentDocument,
            planetaryWorldId,
          })
        );
      },
      permanentlyDeletePlanetaryWorld(planetaryWorldId) {
        commitDocument(
          (currentDocument) =>
            deletePlanetaryWorldFromActiveWorkspace({
              document: currentDocument,
              planetaryWorldId,
            }),
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
            createEntryTypeInActiveWorkspace({
              document: currentDocument,
              draft,
            }),
          undefined,
          getDeviceCommitResultMessage('entry-type-created')
        );
        return true;
      },
      permanentlyDeleteEntryType(sectionId) {
        commitDocument(
          (currentDocument) =>
            deleteEntryTypeFromActiveWorkspace({
              document: currentDocument,
              sectionId,
            }),
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
          getDataActionResultMessage('import-document')
        );
      },
      restoreRecoverySnapshot(snapshotId) {
        const snapshot =
          state.recoverySnapshots.find((item) => item.id === snapshotId) ??
          null;
        if (!snapshot) {
          setState((current) => ({
            ...current,
            formMessage: dataRecoverySnapshotUnavailableMessage,
          }));
          return;
        }
        commitDocument(
          () => snapshot.document,
          'restore',
          getDataActionResultMessage('restore-snapshot')
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
              ? getDataActionResultMessage('delete-snapshot')
              : dataRecoverySnapshotDeleteFailedMessage,
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
          getDataActionResultMessage('reset-document')
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
