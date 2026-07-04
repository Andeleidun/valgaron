import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, Share } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import {
  codexDataHelpTopics,
  codexDataHelpSummary,
  dataExportCopy,
  dataExportOptions,
  dataImportCopy,
  dataResetCopy,
  formatUpdatedAt,
  getCodexExportOption,
  getCodexHelpRoute,
  getCodexScreenIntro,
  getDataExportDraftState,
  getDataExportSharePayload,
  getDataImportPreviewText,
  getDataImportReviewState,
  getDataRecoverySnapshotModel,
  getDataStorageStatusModel,
  getNextVisibleExportText,
  getWorldDocumentDiagnostics,
  isCodexExportMode,
  summarizeRecoverySnapshots,
  type DataExportMode,
} from '@valgaron/core';
import { useMobileCodex } from '../state/MobileCodexContext';
import {
  getMobileRouteHref,
  mobileRouteFocusParam,
} from '../navigation/mobileRoutes';
import { getMobileRouteParam } from '../navigation/mobileRouteParams';
import { getMobileExportText } from '../state/mobileDataExport';
import { getMobileFeedbackTone } from '../state/mobileFeedback';
import { parseMobileWorldImport } from '../storage/mobileStorage';
import {
  ActionButton,
  BodyText,
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

export function DataScreen() {
  const controller = useMobileCodex();
  const intro = getCodexScreenIntro('data');
  const routeParams = useLocalSearchParams<{
    [mobileRouteFocusParam]?: string;
    mode?: string;
  }>();
  const routeFocusId = getMobileRouteParam(routeParams[mobileRouteFocusParam]);
  const routeModeParam = getMobileRouteParam(routeParams.mode);
  const routeExportMode = isCodexExportMode(routeModeParam)
    ? routeModeParam
    : null;
  const scrollRef = useRef<ScrollView | null>(null);
  const focusedSectionOffsets = useRef<Partial<Record<string, number>>>({});
  const [focusedSectionLayoutVersion, setFocusedSectionLayoutVersion] =
    useState(0);
  const [exportMode, setExportMode] = useState<DataExportMode>(
    () => routeExportMode ?? 'full-json'
  );
  const selectedExportOption = getCodexExportOption(exportMode);
  const diagnosticsContext = useMemo(
    () => ({
      lastRecoverySnapshot: controller.lastRecoverySnapshot,
      loadStatus: controller.loadStatus,
      saveMessage: controller.saveMessage,
    }),
    [
      controller.lastRecoverySnapshot,
      controller.loadStatus,
      controller.saveMessage,
    ]
  );
  const currentExportText = useMemo(
    () =>
      getMobileExportText(controller.document, exportMode, diagnosticsContext),
    [controller.document, diagnosticsContext, exportMode]
  );
  const [exportText, setExportText] = useState(currentExportText);
  const generatedExportTextRef = useRef(currentExportText);
  const [shareMessage, setShareMessage] = useState('');
  const [importText, setImportText] = useState('');
  const exportDraftState = useMemo(
    () => getDataExportDraftState(currentExportText, exportText),
    [currentExportText, exportText]
  );
  const diagnostics = useMemo(
    () => getWorldDocumentDiagnostics(controller.document),
    [controller.document]
  );
  const importPreview = useMemo(
    () =>
      importText.trim().length > 0 ? parseMobileWorldImport(importText) : null,
    [importText]
  );
  const importReview = useMemo(
    () => getDataImportReviewState(importText, importPreview),
    [importPreview, importText]
  );
  const recoverySnapshotSummaries = useMemo(
    () => summarizeRecoverySnapshots(controller.recoverySnapshots),
    [controller.recoverySnapshots]
  );
  const recoverySnapshotModel = useMemo(
    () => getDataRecoverySnapshotModel(recoverySnapshotSummaries),
    [recoverySnapshotSummaries]
  );
  const storageStatus = getDataStorageStatusModel({
    lastRecoverySnapshot: controller.lastRecoverySnapshot,
    loadStatus: controller.loadStatus,
    recoverySnapshotCount: controller.recoverySnapshots.length,
    saveMessage: controller.saveMessage,
  });
  const lastImportPreviewText = controller.importResult?.ok
    ? getDataImportPreviewText(controller.importResult.preview)
    : null;
  const hasImportText = importText.trim().length > 0;

  useEffect(() => {
    setExportText((visibleText) =>
      getNextVisibleExportText({
        currentGeneratedText: generatedExportTextRef.current,
        nextGeneratedText: currentExportText,
        visibleText,
      })
    );
    generatedExportTextRef.current = currentExportText;
  }, [currentExportText]);

  useEffect(() => {
    if (!routeFocusId) {
      return undefined;
    }
    const focusedOffset = focusedSectionOffsets.current[routeFocusId];
    if (focusedOffset === undefined) {
      return undefined;
    }
    const timeout = setTimeout(() => {
      scrollRef.current?.scrollTo({
        animated: true,
        y: Math.max(focusedOffset - 12, 0),
      });
    }, 0);
    return () => clearTimeout(timeout);
  }, [focusedSectionLayoutVersion, routeFocusId]);

  useEffect(() => {
    if (!routeExportMode || routeExportMode === exportMode) {
      return;
    }
    const routeExportText = getMobileExportText(
      controller.document,
      routeExportMode,
      diagnosticsContext
    );
    setExportMode(routeExportMode);
    setExportText(routeExportText);
    generatedExportTextRef.current = routeExportText;
    setShareMessage('');
  }, [controller.document, diagnosticsContext, exportMode, routeExportMode]);

  function setFocusedSectionOffset(focusId: string, offset: number) {
    if (focusedSectionOffsets.current[focusId] === offset) {
      return;
    }
    focusedSectionOffsets.current[focusId] = offset;
    setFocusedSectionLayoutVersion((version) => version + 1);
  }

  function selectExportMode(mode: DataExportMode) {
    if (mode === exportMode) {
      return;
    }
    confirmMobileDiscardUnsavedChanges(
      exportDraftState.isEdited,
      () => {
        setExportMode(mode);
        setExportText(
          getMobileExportText(controller.document, mode, diagnosticsContext)
        );
        setShareMessage('');
      },
      undefined,
      {
        message: dataExportCopy.replaceEditedMessage,
        title: dataExportCopy.replaceEditedTitle,
      }
    );
  }

  function updateExportText(text: string) {
    setExportText(text);
    setShareMessage('');
  }

  function refreshExportText() {
    confirmMobileDiscardUnsavedChanges(
      exportDraftState.isEdited,
      () => {
        setExportText(currentExportText);
        setShareMessage(dataExportCopy.refreshedMessage);
      },
      undefined,
      {
        message: dataExportCopy.refreshEditedMessage,
        title: dataExportCopy.refreshEditedTitle,
      }
    );
  }

  function clearImportText() {
    confirmMobileDiscardUnsavedChanges(
      hasImportText,
      () => {
        setImportText('');
        setShareMessage('');
      },
      undefined,
      {
        message: 'The pasted import text will be cleared from this screen.',
        title: 'Clear import text?',
      }
    );
  }

  function clearTransientDataDrafts() {
    setImportText('');
    setShareMessage('');
  }

  function openDataHelp() {
    confirmMobileDiscardUnsavedChanges(
      hasImportText || exportDraftState.isEdited,
      () =>
        router.push({
          ...getMobileRouteHref(getCodexHelpRoute('data')),
        }),
      undefined,
      {
        message:
          'The pasted import text or edited export text may not be preserved after leaving Data.',
        title: 'Open Help?',
      }
    );
  }

  function requestImport() {
    const importResult = parseMobileWorldImport(importText);
    if (!importResult.ok) {
      return;
    }
    confirmMobileDestructiveAction('import-document', () => {
      controller.importDocumentText(importText);
      clearTransientDataDrafts();
    });
  }

  function replaceDocumentAfterConfirm(
    actionId: 'reset-document' | 'restore-snapshot',
    replaceDocument: () => void
  ) {
    confirmMobileDiscardUnsavedChanges(
      hasImportText,
      () =>
        confirmMobileDestructiveAction(actionId, () => {
          replaceDocument();
          clearTransientDataDrafts();
        }),
      undefined,
      {
        message:
          'The pasted import text will be cleared after this document replacement.',
        title: 'Clear import text?',
      }
    );
  }

  async function shareExport() {
    try {
      await Share.share(getDataExportSharePayload(exportMode, exportText));
      setShareMessage(dataExportCopy.shareOpenedMessage);
    } catch {
      setShareMessage(dataExportCopy.shareUnavailableMessage);
    }
  }

  return (
    <ScreenScroll scrollRef={scrollRef}>
      <ScreenHeader title={intro.title} detail={intro.detail} />

      <SectionBlock title="Local Storage">
        <BodyText>{storageStatus.saveLine}</BodyText>
        {controller.formMessage ? (
          <StatusText tone={getMobileFeedbackTone(controller.formMessage)}>
            {controller.formMessage}
          </StatusText>
        ) : null}
        <MutedText>{storageStatus.loadLine}</MutedText>
        <MutedText>{storageStatus.recoveryLine}</MutedText>
        <MutedText>
          Current workspace: {controller.activeWorld.name}. Saved timestamp:{' '}
          {formatUpdatedAt(controller.document.savedAt)}.
        </MutedText>
        <MutedText>
          Diagnostics: {diagnostics.workspaceCount} workspace(s),{' '}
          {diagnostics.totalEntryCount} entries, {diagnostics.relationshipCount}{' '}
          relationships, {diagnostics.archivedEntryCount} archived entries.
        </MutedText>
        {lastImportPreviewText ? (
          <MutedText>
            Last import: {lastImportPreviewText.title}.{' '}
            {lastImportPreviewText.detail}
          </MutedText>
        ) : null}
      </SectionBlock>

      <SectionBlock
        title={dataExportCopy.title}
        onLayout={(event) => {
          setFocusedSectionOffset('export', event.nativeEvent.layout.y);
        }}
      >
        <ButtonRow>
          {dataExportOptions.map((option) => (
            <ActionButton
              key={option.mode}
              label={option.label}
              selected={exportMode === option.mode}
              tone={exportMode === option.mode ? 'accent' : 'neutral'}
              onPress={() => selectExportMode(option.mode)}
            />
          ))}
        </ButtonRow>
        <MutedText>{selectedExportOption.description}</MutedText>
        <Field
          autoCapitalize="none"
          autoCorrect={false}
          label={selectedExportOption.textAreaLabel}
          value={exportText}
          multiline
          onChangeText={updateExportText}
        />
        {exportDraftState.statusMessage ? (
          <StatusText
            tone={getMobileFeedbackTone(exportDraftState.statusMessage)}
          >
            {exportDraftState.statusMessage}
          </StatusText>
        ) : null}
        <ButtonRow>
          <ActionButton
            label={dataExportCopy.shareLabel}
            tone="accent"
            disabled={!exportDraftState.canShare}
            onPress={() => {
              void shareExport();
            }}
          />
          {exportDraftState.isEdited ? (
            <ActionButton
              label={dataExportCopy.refreshLabel}
              onPress={refreshExportText}
            />
          ) : null}
        </ButtonRow>
        {shareMessage ? (
          <StatusText tone={getMobileFeedbackTone(shareMessage)}>
            {shareMessage}
          </StatusText>
        ) : null}
      </SectionBlock>

      <SectionBlock
        title={dataImportCopy.title}
        onLayout={(event) => {
          setFocusedSectionOffset(
            'import-json-backup',
            event.nativeEvent.layout.y
          );
        }}
      >
        {importReview.error ? (
          <StatusText tone="danger">{importReview.error}</StatusText>
        ) : null}
        {importReview.previewText ? (
          <MutedText>
            Preview: {importReview.previewText.title}.{' '}
            {importReview.previewText.detail}
          </MutedText>
        ) : null}
        <Field
          autoCapitalize="none"
          autoCorrect={false}
          label={dataImportCopy.textAreaLabel}
          value={importText}
          multiline
          placeholder={dataImportCopy.placeholder}
          onChangeText={setImportText}
        />
        <ButtonRow>
          <ActionButton
            label={dataImportCopy.importLabel}
            tone="accent"
            disabled={!importReview.canImport}
            onPress={requestImport}
          />
          <ActionButton
            label={dataImportCopy.clearLabel}
            disabled={!hasImportText}
            onPress={clearImportText}
          />
        </ButtonRow>
      </SectionBlock>

      <SectionBlock title={recoverySnapshotModel.title}>
        <MutedText>{recoverySnapshotModel.countLabel}</MutedText>
        <MutedText>{recoverySnapshotModel.description}</MutedText>
        {recoverySnapshotModel.rows.length > 0 ? (
          <>
            {recoverySnapshotModel.rows.map((snapshot) => (
              <Fragment key={snapshot.id}>
                <MutedText>
                  {snapshot.latestPrefix}
                  {snapshot.mobileSummaryText}
                </MutedText>
                <ButtonRow>
                  <ActionButton
                    accessibilityHint="Restores this saved recovery snapshot after confirmation."
                    label={snapshot.restoreLabel}
                    onPress={() =>
                      replaceDocumentAfterConfirm('restore-snapshot', () =>
                        controller.restoreRecoverySnapshot(snapshot.id)
                      )
                    }
                  />
                  <ActionButton
                    accessibilityHint="Deletes this recovery snapshot after confirmation."
                    label={snapshot.deleteLabel}
                    tone="danger"
                    onPress={() =>
                      confirmMobileDestructiveAction('delete-snapshot', () =>
                        controller.deleteRecoverySnapshot(snapshot.id)
                      )
                    }
                  />
                </ButtonRow>
              </Fragment>
            ))}
          </>
        ) : (
          <>
            <MutedText>{recoverySnapshotModel.emptyTitle}</MutedText>
            <MutedText>{recoverySnapshotModel.emptyDetail}</MutedText>
          </>
        )}
      </SectionBlock>

      <SectionBlock title={dataResetCopy.title}>
        <MutedText>{dataResetCopy.description}</MutedText>
        <ActionButton
          accessibilityHint={dataResetCopy.accessibilityHint}
          label={dataResetCopy.actionLabel}
          tone="danger"
          onPress={() =>
            replaceDocumentAfterConfirm(
              'reset-document',
              controller.resetToSeed
            )
          }
        />
      </SectionBlock>

      <SectionBlock title="Help">
        <BodyText>{codexDataHelpSummary}</BodyText>
        <ActionButton label="Open Help" onPress={openDataHelp} />
        {codexDataHelpTopics.map((topic) => (
          <MutedText key={topic.title}>
            {topic.title}: {topic.items.join(' ')}
          </MutedText>
        ))}
      </SectionBlock>
    </ScreenScroll>
  );
}
