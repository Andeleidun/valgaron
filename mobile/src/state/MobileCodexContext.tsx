import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type {
  InFictionWorld,
  TimelineOrderDirection,
  WorldDocument,
  WorldEntry,
  WorldImageAsset,
  WorldRelationship,
  WorldSectionConfig,
} from '@valgaron/core';
import {
  addEntryTypeFieldsInActiveWorkspace,
  addVocabularyValue as addCoreVocabularyValue,
  applyEntry,
  archiveEntryInActiveWorkspace,
  archivePlanetaryWorldInActiveWorkspace,
  clearHiddenEntryDetailInActiveWorkspace,
  clearHiddenEntryDetailsInActiveWorkspace,
  commitEntryDraftTransaction,
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
  moveEntryTypeFieldInActiveWorkspace,
  moveVocabularyValue as moveCoreVocabularyValue,
  moveTimelineEventInActiveWorkspace,
  renameEntryTypeFieldInActiveWorkspace,
  removeEntryTypeFieldInActiveWorkspace,
  reassignTimelineEraInActiveWorkspace,
  relationshipFromDraft,
  savePlanetaryWorldInActiveWorkspace,
  saveRelationshipInActiveWorkspace,
  setActiveWorkspace,
  setVocabularyValueArchived,
  setWorkspaceArchived,
  updateFieldOverride as updateCoreFieldOverride,
  updateActiveWorld,
  updateVocabularyValue as updateCoreVocabularyValue,
  updateWorkspaceMetadata,
  pruneUnreferencedAssetMetadata,
  validateEntryDraftTransaction,
  validateEntryTypeDraft,
  validatePlanetaryWorldDraft,
  validateRelationshipDraft,
  validateWorkspaceDraft,
  type DraftValidationResult,
  type CustomEntryTypeFieldMoveDirection,
  type EntryDraft,
  type EntryTypeDraft,
  type FieldOverrideDraft,
  type PlanetaryWorldDraft,
  type RelationshipDraft,
  type StagedRelationshipDraft,
  type VocabularyValueDraft,
  type VocabularyValueMoveDirection,
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
import { cleanupMobileImageAssets } from '../storage/mobileImageAssetStorage';
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
    existingEntry?: WorldEntry,
    stagedRelationships?: readonly StagedRelationshipDraft[]
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
  reassignTimelineEra: (sourceEra: string, targetEra: string) => boolean;
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
  addEntryTypeFields: (sectionId: string, fieldsText: string) => boolean;
  moveEntryTypeField: (
    sectionId: string,
    fieldKey: string,
    direction: CustomEntryTypeFieldMoveDirection
  ) => boolean;
  renameEntryTypeField: (
    sectionId: string,
    fieldKey: string,
    label: string
  ) => boolean;
  removeEntryTypeField: (sectionId: string, fieldKey: string) => boolean;
  addVocabularyValue: (
    vocabularyId: string,
    draft: VocabularyValueDraft
  ) => boolean;
  updateVocabularyValue: (
    vocabularyId: string,
    valueId: string,
    draft: VocabularyValueDraft
  ) => boolean;
  archiveVocabularyValue: (
    vocabularyId: string,
    valueId: string,
    archived: boolean
  ) => boolean;
  moveVocabularyValue: (
    vocabularyId: string,
    valueId: string,
    direction: VocabularyValueMoveDirection
  ) => boolean;
  updateFieldOverride: (
    sectionId: string,
    fieldKey: string,
    draft: FieldOverrideDraft
  ) => boolean;
  clearHiddenEntryDetail: (
    sectionId: string,
    entryId: string,
    fieldKey: string
  ) => void;
  clearHiddenEntryDetails: () => void;
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
  const stateRef = useRef(state);
  stateRef.current = state;

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
      void cleanupMobileImageAssets(loadResult.document, recoverySnapshots);
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
            if (didSave) {
              void cleanupMobileImageAssets(nextDocument, [
                ...(snapshot ? [snapshot] : []),
                ...current.recoverySnapshots,
              ]);
            }
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
      saveEntryDraft(section, draft, existingEntry, stagedRelationships = []) {
        const validation = validateEntryDraftTransaction({
          codex: activeWorld.codex,
          entryDraft: draft,
          existingEntry,
          section,
          stagedRelationships,
          workspaceSchema: activeWorld.schema,
        });
        if (!validation.ok) {
          setFormValidationError(validation);
          return null;
        }
        let savedEntry: WorldEntry | null = null;
        commitDocument(
          (currentDocument) => {
            const assetById = new Map<string, WorldImageAsset>(
              [...currentDocument.assets, ...(draft.stagedAssets ?? [])].map(
                (asset) => [asset.id, asset]
              )
            );
            const updatedDocument = updateActiveWorld(
              currentDocument,
              (world) => {
                const currentSection =
                  world.entryTypes.find((item) => item.id === section.id) ??
                  section;
                const transaction = commitEntryDraftTransaction({
                  codex: world.codex,
                  entryDraft: draft,
                  existingEntry,
                  relationships: world.relationships,
                  section: currentSection,
                  stagedRelationships,
                  workspaceSchema: world.schema,
                });
                savedEntry = transaction.entry;

                return {
                  ...world,
                  codex: transaction.codex,
                  relationships: [...transaction.relationships],
                  updatedAt: new Date().toISOString(),
                };
              }
            );
            return pruneUnreferencedAssetMetadata({
              ...updatedDocument,
              assets: [...assetById.values()],
            });
          },
          undefined,
          existingEntry
            ? getDeviceCommitResultMessage('entry-updated')
            : getDeviceCommitResultMessage('entry-saved')
        );
        return savedEntry;
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
      reassignTimelineEra(sourceEra, targetEra) {
        commitDocument(
          (currentDocument) =>
            reassignTimelineEraInActiveWorkspace({
              document: currentDocument,
              draft: {
                sourceEra,
                targetEra,
              },
            }),
          undefined,
          getDeviceCommitResultMessage('entry-updated')
        );
        return true;
      },
      permanentlyDeleteEntry(entry) {
        commitDocument(
          (currentDocument) =>
            pruneUnreferencedAssetMetadata(
              deleteEntryFromActiveWorkspace({
                document: currentDocument,
                entry,
              })
            ),
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
            pruneUnreferencedAssetMetadata(
              deleteCoreWorkspace(currentDocument, workspaceId)
            ),
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
      addEntryTypeFields(sectionId, fieldsText) {
        commitDocument(
          (currentDocument) =>
            addEntryTypeFieldsInActiveWorkspace({
              document: currentDocument,
              fieldsText,
              sectionId,
            }),
          undefined,
          getDeviceCommitResultMessage('entry-type-updated')
        );
        return true;
      },
      moveEntryTypeField(sectionId, fieldKey, direction) {
        commitDocument(
          (currentDocument) =>
            moveEntryTypeFieldInActiveWorkspace({
              direction,
              document: currentDocument,
              fieldKey,
              sectionId,
            }),
          undefined,
          getDeviceCommitResultMessage('entry-type-updated')
        );
        return true;
      },
      renameEntryTypeField(sectionId, fieldKey, label) {
        commitDocument(
          (currentDocument) =>
            renameEntryTypeFieldInActiveWorkspace({
              document: currentDocument,
              fieldKey,
              label,
              sectionId,
            }),
          undefined,
          getDeviceCommitResultMessage('entry-type-updated')
        );
        return true;
      },
      removeEntryTypeField(sectionId, fieldKey) {
        commitDocument(
          (currentDocument) =>
            removeEntryTypeFieldInActiveWorkspace({
              document: currentDocument,
              fieldKey,
              sectionId,
            }),
          undefined,
          getDeviceCommitResultMessage('entry-type-updated')
        );
        return true;
      },
      addVocabularyValue(vocabularyId, draft) {
        commitDocument(
          (currentDocument) =>
            updateActiveWorld(currentDocument, (workspace) =>
              addCoreVocabularyValue(workspace, vocabularyId, draft)
            ),
          undefined,
          getDeviceCommitResultMessage('entry-type-updated')
        );
        return true;
      },
      updateVocabularyValue(vocabularyId, valueId, draft) {
        commitDocument(
          (currentDocument) =>
            updateActiveWorld(currentDocument, (workspace) =>
              updateCoreVocabularyValue(workspace, vocabularyId, valueId, draft)
            ),
          undefined,
          getDeviceCommitResultMessage('entry-type-updated')
        );
        return true;
      },
      archiveVocabularyValue(vocabularyId, valueId, archived) {
        commitDocument(
          (currentDocument) =>
            updateActiveWorld(currentDocument, (workspace) =>
              setVocabularyValueArchived(
                workspace,
                vocabularyId,
                valueId,
                archived
              )
            ),
          undefined,
          getDeviceCommitResultMessage('entry-type-updated')
        );
        return true;
      },
      moveVocabularyValue(vocabularyId, valueId, direction) {
        commitDocument(
          (currentDocument) =>
            updateActiveWorld(currentDocument, (workspace) =>
              moveCoreVocabularyValue(
                workspace,
                vocabularyId,
                valueId,
                direction
              )
            ),
          undefined,
          getDeviceCommitResultMessage('entry-type-updated')
        );
        return true;
      },
      updateFieldOverride(sectionId, fieldKey, draft) {
        commitDocument(
          (currentDocument) =>
            updateActiveWorld(currentDocument, (workspace) =>
              updateCoreFieldOverride(workspace, sectionId, fieldKey, draft)
            ),
          undefined,
          getDeviceCommitResultMessage('entry-type-updated')
        );
        return true;
      },
      clearHiddenEntryDetails() {
        commitDocument(
          (currentDocument) =>
            clearHiddenEntryDetailsInActiveWorkspace({
              document: currentDocument,
            }),
          'schema-cleanup',
          getDeviceCommitResultMessage('entry-type-updated')
        );
      },
      clearHiddenEntryDetail(sectionId, entryId, fieldKey) {
        commitDocument(
          (currentDocument) =>
            clearHiddenEntryDetailInActiveWorkspace({
              document: currentDocument,
              entryId,
              fieldKey,
              sectionId,
            }),
          'schema-cleanup',
          getDeviceCommitResultMessage('entry-type-updated')
        );
      },
      permanentlyDeleteEntryType(sectionId) {
        commitDocument(
          (currentDocument) =>
            pruneUnreferencedAssetMetadata(
              deleteEntryTypeFromActiveWorkspace({
                document: currentDocument,
                sectionId,
              })
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
          if (didDelete) {
            const latest = stateRef.current;
            void cleanupMobileImageAssets(
              latest.document,
              latest.recoverySnapshots.filter(
                (snapshot) => snapshot.id !== snapshotId
              )
            );
          }
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
