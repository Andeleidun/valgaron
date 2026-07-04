import { useEffect, useMemo, useRef, useState } from 'react';
import { Share } from 'react-native';
import {
  codexDataHelpTopics,
  codexDataHelpSummary,
  codexFirstUseHelp,
  codexPrivacyHelp,
  codexReleaseLimitsHelp,
  codexWorkflowHelpTopics,
  formatUpdatedAt,
  getCodexExportOption,
  getCodexScreenIntro,
  getWorldDocumentDiagnostics,
  summarizeRecoverySnapshot,
} from '@valgaron/core';
import { useMobileCodex } from '../state/MobileCodexContext';
import {
  getMobileExportDraftState,
  getMobileExportSharePayload,
  getMobileExportText,
  getMobileImportReviewState,
  getMobileImportPreviewText,
  getNextMobileVisibleExportText,
  mobileExportOptions,
  type MobileExportMode,
} from '../state/mobileDataExport';
import { getMobileFeedbackTone } from '../state/mobileFeedback';
import {
  getMobileDataStorageStatus,
  getMobileRecoverySnapshotText,
} from '../state/mobileCodexViewModels';
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
  const [exportMode, setExportMode] = useState<MobileExportMode>('full-json');
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
    () => getMobileExportDraftState(currentExportText, exportText),
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
    () => getMobileImportReviewState(importText, importPreview),
    [importPreview, importText]
  );
  const recoverySnapshotSummary = controller.lastRecoverySnapshot
    ? summarizeRecoverySnapshot(controller.lastRecoverySnapshot)
    : null;
  const storageStatus = getMobileDataStorageStatus({
    lastRecoverySnapshot: controller.lastRecoverySnapshot,
    loadStatus: controller.loadStatus,
    saveMessage: controller.saveMessage,
  });
  const lastImportPreviewText = controller.importResult?.ok
    ? getMobileImportPreviewText(controller.importResult.preview)
    : null;
  const hasImportText = importText.trim().length > 0;

  useEffect(() => {
    setExportText((visibleText) =>
      getNextMobileVisibleExportText({
        currentGeneratedText: generatedExportTextRef.current,
        nextGeneratedText: currentExportText,
        visibleText,
      })
    );
    generatedExportTextRef.current = currentExportText;
  }, [currentExportText]);

  function selectExportMode(mode: MobileExportMode) {
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
        message:
          'The visible export text has local edits that will be replaced by the selected export format.',
        title: 'Replace edited export text?',
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
        setShareMessage('Refreshed the export text.');
      },
      undefined,
      {
        message:
          'The visible export text has local edits that will be replaced by the latest generated export.',
        title: 'Refresh export text?',
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
      await Share.share(getMobileExportSharePayload(exportMode, exportText));
      setShareMessage('Opened the device share sheet.');
    } catch {
      setShareMessage(
        'Sharing is unavailable here. The export text is still ready to select and copy.'
      );
    }
  }

  return (
    <ScreenScroll>
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

      <SectionBlock title="Export">
        <ButtonRow>
          {mobileExportOptions.map((option) => (
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
            label="Share Export"
            tone="accent"
            disabled={!exportDraftState.canShare}
            onPress={() => {
              void shareExport();
            }}
          />
          {exportDraftState.isEdited ? (
            <ActionButton label="Refresh Export" onPress={refreshExportText} />
          ) : null}
        </ButtonRow>
        {shareMessage ? (
          <StatusText tone={getMobileFeedbackTone(shareMessage)}>
            {shareMessage}
          </StatusText>
        ) : null}
      </SectionBlock>

      <SectionBlock title="Import">
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
          label="Paste JSON backup"
          value={importText}
          multiline
          onChangeText={setImportText}
        />
        <ButtonRow>
          <ActionButton
            label="Import JSON"
            tone="accent"
            disabled={!importReview.canImport}
            onPress={requestImport}
          />
          <ActionButton
            label="Clear"
            disabled={!hasImportText}
            onPress={clearImportText}
          />
        </ButtonRow>
      </SectionBlock>

      <SectionBlock title="Reset">
        <MutedText>
          Reset loads the starter codex and stores one recovery snapshot first.
        </MutedText>
        {controller.lastRecoverySnapshot ? (
          <>
            {recoverySnapshotSummary ? (
              <MutedText>
                {getMobileRecoverySnapshotText(recoverySnapshotSummary)}
              </MutedText>
            ) : null}
            <ActionButton
              accessibilityHint="Restores the latest saved recovery snapshot after confirmation."
              label="Restore Latest Snapshot"
              onPress={() =>
                replaceDocumentAfterConfirm('restore-snapshot', () =>
                  controller.restoreLastRecoverySnapshot()
                )
              }
            />
            <ActionButton
              accessibilityHint="Deletes the latest saved recovery snapshot after confirmation."
              label="Delete Latest Snapshot"
              tone="danger"
              onPress={() =>
                confirmMobileDestructiveAction('delete-snapshot', () =>
                  controller.deleteLastRecoverySnapshot()
                )
              }
            />
          </>
        ) : null}
        <ActionButton
          accessibilityHint="Replaces the current document with starter data after confirmation."
          label="Reset To Starter"
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
        <BodyText>{codexFirstUseHelp}</BodyText>
        <MutedText>{codexDataHelpSummary}</MutedText>
        {codexWorkflowHelpTopics.map((topic) => (
          <MutedText key={topic.title}>
            {topic.title}: {topic.items.join(' ')}
          </MutedText>
        ))}
        {codexDataHelpTopics.map((topic) => (
          <MutedText key={topic.title}>
            {topic.title}: {topic.items.join(' ')}
          </MutedText>
        ))}
        <MutedText>{codexPrivacyHelp}</MutedText>
        <MutedText>{codexReleaseLimitsHelp}</MutedText>
      </SectionBlock>
    </ScreenScroll>
  );
}
