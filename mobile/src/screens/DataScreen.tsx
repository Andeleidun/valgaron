import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, Share } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import {
  codexDataHelpTopics,
  codexDataHelpSummary,
  dataExportCopy,
  dataExportOptions,
  dataHelpCopy,
  dataImportCopy,
  dataResetCopy,
  dataExportSectionIds,
  dataStorageCopy,
  getCodexExportOption,
  getCodexHelpRoute,
  getCodexScreenIntro,
  getDataDiagnosticsSummaryText,
  getDataExportDraftState,
  getDataExportSharePayload,
  getDataImportPreviewText,
  getDataImportReviewState,
  getDataRecoverySnapshotModel,
  getDataRouteFocusTargetId,
  getDataStorageStatusModel,
  getFeedbackTone,
  getNextVisibleExportText,
  getWorldDocumentDiagnostics,
  isCodexExportMode,
  summarizeRecoverySnapshots,
  type DataExportMode,
} from '@valgaron/core';
import { useMobileCodex } from '../state/MobileCodexContext';
import { useMobileSectionPreferences } from '../state/useMobileSectionPreferences';
import {
  getMobileRouteHref,
  mobileRouteFocusParam,
} from '../navigation/mobileRoutes';
import { getMobileRouteParam } from '../navigation/mobileRouteParams';
import { getMobileExportText } from '../state/mobileDataExport';
import {
  installMobileZipAssets,
  pickMobileWorldBackup,
  shareMobileZipBackup,
  type ParsedMobileWorldZipBackup,
} from '../state/mobileZipBackups';
import { parseMobileWorldImport } from '../storage/mobileStorage';
import {
  ActionButton,
  BodyText,
  ButtonRow,
  Field,
  MutedText,
  MobileSectionDashboard,
  ScreenHeader,
  ScreenScroll,
  SectionBlock,
  StatusText,
} from './screenPrimitives';
import { confirmMobileDestructiveAction } from './mobileConfirm';
import { confirmDiscardUnsavedChangesOnMobile } from './unsavedChangesConfirm';

const dataDashboardSectionIds = [
  'data.storage',
  'data.export',
  'data.import',
  'data.recovery',
  'data.reset',
  'data.help',
] as const;

export function DataScreen() {
  const controller = useMobileCodex();
  const dashboard = useMobileSectionPreferences({
    screenId: 'data',
    sectionIds: dataDashboardSectionIds,
  });
  const intro = getCodexScreenIntro('data');
  const routeParams = useLocalSearchParams<{
    [mobileRouteFocusParam]?: string;
    mode?: string;
  }>();
  const routeFocusId = getMobileRouteParam(routeParams[mobileRouteFocusParam]);
  const routeModeParam = getMobileRouteParam(routeParams.mode);
  const routeFocusTargetId = getDataRouteFocusTargetId({
    focusId: routeFocusId,
    mode: routeModeParam,
  });
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
  const [importResult, setImportResult] = useState<ReturnType<
    typeof parseMobileWorldImport
  > | null>(null);
  const [zipImportResult, setZipImportResult] =
    useState<ParsedMobileWorldZipBackup | null>(null);
  const importReview = useMemo(
    () => getDataImportReviewState(importText, importResult),
    [importResult, importText]
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
    currentWorkspaceName: controller.activeWorld.name,
    lastRecoverySnapshot: controller.lastRecoverySnapshot,
    loadStatus: controller.loadStatus,
    recoverySnapshotCount: controller.recoverySnapshots.length,
    savedAt: controller.document.savedAt,
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
    if (!routeFocusTargetId) {
      return undefined;
    }
    const focusedOffset = focusedSectionOffsets.current[routeFocusTargetId];
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
  }, [focusedSectionLayoutVersion, routeFocusTargetId]);

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

  function setFocusedSectionOffsets(
    focusIds: readonly string[],
    offset: number
  ) {
    for (const focusId of focusIds) {
      setFocusedSectionOffset(focusId, offset);
    }
  }

  function selectExportMode(mode: DataExportMode) {
    if (mode === exportMode) {
      return;
    }
    confirmDiscardUnsavedChangesOnMobile(
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
    confirmDiscardUnsavedChangesOnMobile(
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
    confirmDiscardUnsavedChangesOnMobile(
      hasImportText,
      () => {
        setImportText('');
        setImportResult(null);
        setZipImportResult(null);
        setShareMessage('');
      },
      undefined,
      {
        message: dataImportCopy.clearEditedMessage,
        title: dataImportCopy.clearEditedTitle,
      }
    );
  }

  function clearTransientDataDrafts() {
    setImportText('');
    setImportResult(null);
    setZipImportResult(null);
    setShareMessage('');
  }

  function openDataHelp() {
    confirmDiscardUnsavedChangesOnMobile(
      hasImportText || exportDraftState.isEdited,
      () =>
        router.push({
          ...getMobileRouteHref(getCodexHelpRoute('data')),
        }),
      undefined,
      {
        message: dataHelpCopy.leaveWithDraftMessage,
        title: dataHelpCopy.leaveWithDraftTitle,
      }
    );
  }

  function requestImport() {
    if (!importResult?.ok) {
      return;
    }
    confirmMobileDestructiveAction('import-document', () => {
      void (async () => {
        if (
          zipImportResult &&
          !(await installMobileZipAssets(zipImportResult))
        ) {
          setShareMessage(
            'Uploaded images could not be stored. The current document was left unchanged.'
          );
          return;
        }
        controller.importDocumentText(importText);
        clearTransientDataDrafts();
      })();
    });
  }

  function previewImport() {
    setImportResult(parseMobileWorldImport(importText));
  }

  function replaceDocumentAfterConfirm(
    actionId: 'reset-document' | 'restore-snapshot',
    replaceDocument: () => void,
    subjectName?: string
  ) {
    confirmDiscardUnsavedChangesOnMobile(
      hasImportText,
      () =>
        confirmMobileDestructiveAction(
          actionId,
          () => {
            replaceDocument();
            clearTransientDataDrafts();
          },
          subjectName
        ),
      undefined,
      {
        message: dataImportCopy.clearAfterReplacementMessage,
        title: dataImportCopy.clearEditedTitle,
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

  async function shareZip() {
    if (exportMode !== 'active-json' && exportMode !== 'full-json') return;
    try {
      setShareMessage('Verifying images and creating ZIP…');
      setShareMessage(
        await shareMobileZipBackup(
          controller.document,
          controller.activeWorld.name,
          exportMode === 'active-json' ? 'active' : 'full'
        )
      );
    } catch (error) {
      setShareMessage(
        error instanceof Error ? error.message : 'ZIP sharing failed.'
      );
    }
  }

  async function chooseBackupFile() {
    try {
      const picked = await pickMobileWorldBackup();
      if (!picked) return;
      setImportText(picked.jsonText);
      setImportResult(picked.result);
      setZipImportResult(picked.zip);
      setShareMessage(
        picked.result.ok
          ? `${picked.filename} loaded${
              picked.zip
                ? ` with ${picked.zip.files.length} uploaded image file${
                    picked.zip.files.length === 1 ? '' : 's'
                  }`
                : ''
            }.`
          : picked.result.error
      );
    } catch {
      setShareMessage('The selected backup could not be read.');
    }
  }

  return (
    <ScreenScroll scrollRef={scrollRef}>
      <ScreenHeader title={intro.title} detail={intro.detail} />

      <MobileSectionDashboard
        collapsed={dashboard.collapsed}
        isLoaded={dashboard.isLoaded}
        onMove={dashboard.move}
        onReset={dashboard.reset}
        onResetAll={dashboard.resetAll}
        onSetCollapsed={dashboard.setCollapsed}
        order={dashboard.order}
      >
        <SectionBlock sectionId="data.storage" title={dataStorageCopy.title}>
          <BodyText>{storageStatus.saveLine}</BodyText>
          {controller.formMessage ? (
            <StatusText tone={getFeedbackTone(controller.formMessage)}>
              {controller.formMessage}
            </StatusText>
          ) : null}
          <MutedText>{storageStatus.loadLine}</MutedText>
          <MutedText>{storageStatus.recoveryLine}</MutedText>
          {storageStatus.currentWorkspaceLine ? (
            <MutedText>{storageStatus.currentWorkspaceLine}</MutedText>
          ) : null}
          <MutedText>
            {dataStorageCopy.diagnosticsLabel}:{' '}
            {getDataDiagnosticsSummaryText(diagnostics)}
          </MutedText>
          {lastImportPreviewText ? (
            <MutedText>
              {dataImportCopy.lastImportLabel}: {lastImportPreviewText.title}.{' '}
              {lastImportPreviewText.detail}
            </MutedText>
          ) : null}
        </SectionBlock>

        <SectionBlock
          sectionId="data.export"
          title={dataExportCopy.title}
          onLayout={(event) => {
            setFocusedSectionOffsets(
              Object.values(dataExportSectionIds),
              event.nativeEvent.layout.y
            );
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
            <StatusText tone={getFeedbackTone(exportDraftState.statusMessage)}>
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
            {exportMode === 'active-json' || exportMode === 'full-json' ? (
              <ActionButton
                label={
                  exportMode === 'active-json'
                    ? 'Share Active ZIP'
                    : 'Share Full ZIP'
                }
                onPress={() => void shareZip()}
              />
            ) : null}
            {exportDraftState.isEdited ? (
              <ActionButton
                label={dataExportCopy.refreshLabel}
                onPress={refreshExportText}
              />
            ) : null}
          </ButtonRow>
          {shareMessage ? (
            <StatusText tone={getFeedbackTone(shareMessage)}>
              {shareMessage}
            </StatusText>
          ) : null}
        </SectionBlock>

        <SectionBlock
          sectionId="data.import"
          title={dataImportCopy.title}
          onLayout={(event) => {
            setFocusedSectionOffset(
              'import-json-backup',
              event.nativeEvent.layout.y
            );
          }}
        >
          <ActionButton
            label="Choose JSON or ZIP backup"
            onPress={() => void chooseBackupFile()}
          />
          {importReview.error ? (
            <StatusText tone="danger">{importReview.error}</StatusText>
          ) : null}
          {importReview.previewText ? (
            <MutedText>
              {dataImportCopy.previewStatusLabel}:{' '}
              {importReview.previewText.title}.{' '}
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
            onChangeText={(text) => {
              setImportText(text);
              setImportResult(null);
            }}
          />
          <ButtonRow>
            <ActionButton
              label={dataImportCopy.previewLabel}
              disabled={!hasImportText}
              onPress={previewImport}
            />
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

        <SectionBlock
          sectionId="data.recovery"
          title={recoverySnapshotModel.title}
        >
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
                      accessibilityLabel={snapshot.restoreAccessibilityLabel}
                      accessibilityHint={snapshot.restoreAccessibilityHint}
                      label={snapshot.restoreLabel}
                      onPress={() =>
                        replaceDocumentAfterConfirm(
                          'restore-snapshot',
                          () => controller.restoreRecoverySnapshot(snapshot.id),
                          snapshot.confirmationSubject
                        )
                      }
                    />
                    <ActionButton
                      accessibilityLabel={snapshot.deleteAccessibilityLabel}
                      accessibilityHint={snapshot.deleteAccessibilityHint}
                      label={snapshot.deleteLabel}
                      tone="danger"
                      onPress={() =>
                        confirmMobileDestructiveAction(
                          'delete-snapshot',
                          () => controller.deleteRecoverySnapshot(snapshot.id),
                          snapshot.confirmationSubject
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

        <SectionBlock sectionId="data.reset" title={dataResetCopy.title}>
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

        <SectionBlock sectionId="data.help" title={dataHelpCopy.title}>
          <BodyText>{codexDataHelpSummary}</BodyText>
          <ActionButton
            label={dataHelpCopy.openHelpLabel}
            onPress={openDataHelp}
          />
          {codexDataHelpTopics.map((topic) => (
            <MutedText key={topic.title}>
              {topic.title}: {topic.items.join(' ')}
            </MutedText>
          ))}
        </SectionBlock>
      </MobileSectionDashboard>
    </ScreenScroll>
  );
}
