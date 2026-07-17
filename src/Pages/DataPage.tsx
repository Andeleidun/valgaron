import { useEffect, useMemo, useState, type ChangeEvent } from 'react';
import { NavLink } from 'react-router-dom';
import {
  type DestructiveActionId,
  codexShellRoutes,
  codexDataHelpSummary,
  codexDataHelpTopics,
  destructiveActionDialogCopy,
  exportWorldToMarkdown,
  formatDestructiveActionTitle,
  getCodexExportFilename,
  getCodexExportOption,
  getCodexHelpRoute,
  getCodexScreenIntro,
  getDataImportReviewState,
  getDataRecoverySnapshotModel,
  getDataRouteFocusTargetId,
  getDataStorageStatusModel,
  getLocalSaveStatusModel,
  getDestructiveActionCopy,
  dataDownloadCopy,
  dataExportCopy,
  dataHelpCopy,
  dataImportCopy,
  dataResetCopy,
  dataExportSectionIds,
  dataStorageCopy,
  formatDataDownloadSuccessMessage,
  formatDataImportFileLoadedMessage,
  formatDataImportFileReadFailedMessage,
  getDataExportText,
  localPersistenceCopy,
  parseWorldImport,
  sanitizeDiagnosticsRoute,
  serializeActiveWorldBackup,
  serializeWorldDocumentBackup,
  type WorldImportResult,
  type RecoverySnapshotSummary,
  type WorldDocument,
  type WorldWorkspace,
} from '@valgaron/core';
import { DashboardPage } from '../Components/Dashboard/DashboardPage';
import {
  isZipArchiveBytes,
  MAX_ZIP_COMPRESSED_BYTES,
} from '@valgaron/platform';
import {
  downloadBinaryFile,
  downloadTextFile,
  slugFilename,
} from '../Utlilities/fileDownloads';
import {
  createWorldZipBackup,
  installWorldZipAssetsWithRollback,
  parseWorldZipBackup,
  type ParsedWorldZipBackup,
} from '../Utlilities/zipBackups';
import {
  confirmDiscardUnsavedChanges,
  useUnsavedChangesWarning,
} from '../Utlilities/unsavedChanges';
import { useDialogFocus } from '../Utlilities/dialogFocus';
import { useDocumentDraftRegistration } from '../Utlilities/documentDraftState';
import type { WorldDocumentLoadStatus } from '../Utlilities/codexStorage';
import type {
  RecoverySnapshotStatus,
  WorldDocumentSaveStatus,
} from '../Utlilities/useWorldDocumentState';

type PendingSnapshotAction = {
  actionId: Extract<
    DestructiveActionId,
    'restore-snapshot' | 'delete-snapshot'
  >;
  snapshotId: string;
  subjectName: string;
};

function getWindowDataRouteFocusTargetId(): string {
  if (typeof window === 'undefined') {
    return '';
  }
  return getDataRouteFocusTargetId({
    focusId: decodeURIComponent(window.location.hash.replace(/^#/, '')),
    mode: new URLSearchParams(window.location.search).get('mode'),
  });
}

function DataActionConfirmationDialog({
  actionId,
  onCancel,
  onConfirm,
  title,
}: {
  actionId: DestructiveActionId;
  onCancel: () => void;
  onConfirm: () => void;
  title: string;
}) {
  const dialogRef = useDialogFocus<HTMLElement>(true, onCancel);
  const copy = getDestructiveActionCopy(actionId);
  const titleId = `${actionId}-confirm-title`;
  const descriptionId = `${actionId}-confirm-description`;

  return (
    <div className="vwb-dialog-backdrop" role="presentation">
      <section
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className="vwb-dialog"
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        tabIndex={-1}
      >
        <p className="vwb-kicker">
          {destructiveActionDialogCopy.destructiveActionKickerLabel}
        </p>
        <h2 id={titleId}>{title}</h2>
        <p id={descriptionId}>{copy.message}</p>
        <div className="vwb-form-actions">
          <button
            className="vwb-secondary-button"
            type="button"
            onClick={onCancel}
          >
            {destructiveActionDialogCopy.cancelLabel}
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

export function DataPage({
  activeWorld,
  document,
  loadStatus,
  onDeleteSnapshot,
  onImportDocument,
  onRequestReset,
  onRestoreSnapshot,
  recoverySnapshots,
  recoverySnapshotStatus,
  saveStatus,
}: {
  activeWorld: WorldWorkspace;
  document: WorldDocument;
  loadStatus: WorldDocumentLoadStatus;
  onDeleteSnapshot: (snapshotId: string) => void;
  onImportDocument: (document: WorldDocument) => boolean;
  onRequestReset: (afterReset?: () => void) => void;
  onRestoreSnapshot: (snapshotId: string) => void;
  recoverySnapshots: readonly RecoverySnapshotSummary[];
  recoverySnapshotStatus: RecoverySnapshotStatus;
  saveStatus: WorldDocumentSaveStatus;
}) {
  const [importText, setImportText] = useState('');
  const [importResult, setImportResult] = useState<WorldImportResult | null>(
    null
  );
  const [zipImportResult, setZipImportResult] =
    useState<ParsedWorldZipBackup | null>(null);
  const [downloadMessages, setDownloadMessages] = useState<
    Record<'activeJson' | 'allJson' | 'md', string>
  >({
    activeJson: '',
    allJson: '',
    md: '',
  });
  const [diagnosticsDownloadMessage, setDiagnosticsDownloadMessage] =
    useState('');
  const [zipDownloadMessage, setZipDownloadMessage] = useState('');
  const [isZipBusy, setIsZipBusy] = useState(false);
  const [importFileMessage, setImportFileMessage] = useState('');
  const [isImportConfirmationOpen, setIsImportConfirmationOpen] =
    useState(false);
  const [pendingSnapshotAction, setPendingSnapshotAction] =
    useState<PendingSnapshotAction | null>(null);
  const intro = getCodexScreenIntro('data');
  const isImportDirty = importText.trim().length > 0;
  useUnsavedChangesWarning(isImportDirty);
  const jsonExport = useMemo(
    () => serializeActiveWorldBackup(document),
    [document]
  );
  const fullJsonExport = useMemo(
    () => serializeWorldDocumentBackup(document),
    [document]
  );
  const markdownExport = useMemo(
    () => exportWorldToMarkdown(activeWorld),
    [activeWorld]
  );
  useEffect(() => {
    const focusTargetId = getWindowDataRouteFocusTargetId();
    if (!focusTargetId) {
      return;
    }
    const focusedSection = window.document.getElementById(focusTargetId);
    focusedSection?.scrollIntoView({ block: 'start' });
    focusedSection?.focus({ preventScroll: true });
  }, []);
  const diagnosticsText = useMemo(() => {
    const latestRecoverySnapshot =
      recoverySnapshots.reduce<RecoverySnapshotSummary | null>(
        (latestSnapshot, snapshot) => {
          if (!latestSnapshot) {
            return snapshot;
          }
          return Date.parse(snapshot.createdAt) >
            Date.parse(latestSnapshot.createdAt)
            ? snapshot
            : latestSnapshot;
        },
        null
      );
    return getDataExportText(document, 'diagnostics', {
      diagnosticsRuntime: {
        route: sanitizeDiagnosticsRoute(
          typeof window === 'undefined'
            ? codexShellRoutes.data.path
            : `${window.location.pathname}${window.location.search}`
        ),
        userAgent:
          typeof navigator === 'undefined'
            ? 'Unavailable'
            : navigator.userAgent,
        loadState: loadStatus.source,
        loadCheckedAt: loadStatus.checkedAt,
        loadMessage: loadStatus.message,
        loadIssueCount: loadStatus.issues.length,
        saveState: saveStatus.state,
        recoverySnapshotAvailable: recoverySnapshots.length > 0,
        recoverySnapshotCount: recoverySnapshots.length,
        recoverySnapshotState: recoverySnapshotStatus.state,
        recoverySnapshotReason: latestRecoverySnapshot?.reason,
        recoverySnapshotCreatedAt: latestRecoverySnapshot?.createdAt,
      },
      diagnosticsStorageTarget: localPersistenceCopy.browserSaveTarget,
    });
  }, [
    document,
    loadStatus,
    recoverySnapshots,
    recoverySnapshotStatus,
    saveStatus,
  ]);
  const filenameBase = slugFilename(activeWorld.name);
  const activeJsonExportOption = getCodexExportOption('active-json');
  const fullJsonExportOption = getCodexExportOption('full-json');
  const markdownExportOption = getCodexExportOption('markdown');
  const diagnosticsExportOption = getCodexExportOption('diagnostics');
  const recoverySnapshotModel = useMemo(
    () => getDataRecoverySnapshotModel(recoverySnapshots),
    [recoverySnapshots]
  );
  const importReview = useMemo(
    () => getDataImportReviewState(importText, importResult),
    [importResult, importText]
  );
  const saveStatusModel = getLocalSaveStatusModel({
    attemptedAt: saveStatus.attemptedAt,
    savedAt: saveStatus.savedAt,
    state: saveStatus.state,
    targetLabel: localPersistenceCopy.browserSaveTarget,
  });
  const storageStatus = useMemo(
    () =>
      getDataStorageStatusModel({
        loadStatus,
        recoverySnapshots,
        saveLineLabel: dataStorageCopy.manualSaveLineLabel,
        saveMessage: saveStatusModel.detail,
      }),
    [loadStatus, recoverySnapshots, saveStatusModel.detail]
  );

  const downloadExport = (
    key: 'activeJson' | 'allJson' | 'md',
    filename: string,
    text: string
  ) => {
    const didDownload = downloadTextFile(filename, text);
    const message = didDownload
      ? formatDataDownloadSuccessMessage(filename)
      : dataDownloadCopy.exportUnavailableMessage;
    setDownloadMessages((currentMessages) => ({
      ...currentMessages,
      [key]: message,
    }));
  };

  const downloadDiagnostics = () => {
    const diagnosticsFilename = getCodexExportFilename(
      'diagnostics',
      filenameBase
    );
    const didDownload = downloadTextFile(diagnosticsFilename, diagnosticsText);
    setDiagnosticsDownloadMessage(
      didDownload
        ? formatDataDownloadSuccessMessage(diagnosticsFilename)
        : dataDownloadCopy.diagnosticsUnavailableMessage
    );
  };

  const downloadZip = async (mode: 'active' | 'full') => {
    setIsZipBusy(true);
    setZipDownloadMessage('Verifying images and creating ZIP…');
    try {
      const backup = await createWorldZipBackup(
        document,
        activeWorld.name,
        mode,
        undefined,
        mode === 'active' ? jsonExport : fullJsonExport
      );
      const didDownload = downloadBinaryFile(
        backup.filename,
        backup.bytes,
        'application/zip'
      );
      setZipDownloadMessage(
        didDownload
          ? `${backup.filename} downloaded with JSON and uploaded images.`
          : dataDownloadCopy.exportUnavailableMessage
      );
    } catch (error) {
      setZipDownloadMessage(
        error instanceof Error ? error.message : 'ZIP export failed.'
      );
    } finally {
      setIsZipBusy(false);
    }
  };

  const previewImport = () => {
    setImportResult(parseWorldImport(importText));
  };

  const clearImportDraft = () => {
    setImportText('');
    setImportResult(null);
    setZipImportResult(null);
    setImportFileMessage('');
    setIsImportConfirmationOpen(false);
  };

  useDocumentDraftRegistration({
    isDirty: isImportDirty,
    onDiscard: clearImportDraft,
  });

  const discardImportIfAllowed = (action: () => void) => {
    if (confirmDiscardUnsavedChanges(isImportDirty)) {
      action();
    }
  };

  const readImportFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    if (isImportDirty && !confirmDiscardUnsavedChanges(true)) {
      event.target.value = '';
      return;
    }
    event.target.value = '';
    void file
      .slice(0, 4)
      .arrayBuffer()
      .then(async (prefixBuffer) => {
        const isZip = isZipArchiveBytes(new Uint8Array(prefixBuffer));
        if (isZip && file.size > MAX_ZIP_COMPRESSED_BYTES) {
          const result = {
            ok: false as const,
            error: 'ZIP file exceeds the compressed size limit.',
          };
          setImportText('ZIP package selected');
          setImportResult(result);
          setZipImportResult(null);
          setImportFileMessage(result.error);
          return;
        }
        const buffer = await file.arrayBuffer();
        const bytes = new Uint8Array(buffer);
        if (isZip) {
          const result = await parseWorldZipBackup(bytes);
          setImportText('ZIP package selected');
          setImportResult(result);
          setZipImportResult(result.ok ? result : null);
          setImportFileMessage(
            result.ok
              ? `${file.name} loaded with ${
                  result.files.length
                } uploaded image file${result.files.length === 1 ? '' : 's'}.`
              : result.error
          );
          return;
        }
        const text = new TextDecoder().decode(bytes);
        setImportText(text);
        setImportResult(parseWorldImport(text));
        setZipImportResult(null);
        setImportFileMessage(formatDataImportFileLoadedMessage(file.name));
      })
      .catch(() =>
        setImportFileMessage(formatDataImportFileReadFailedMessage(file.name))
      );
  };

  const applyImport = () => {
    if (importResult?.ok) {
      setIsImportConfirmationOpen(true);
    }
  };

  const confirmImport = async () => {
    if (importResult?.ok) {
      const installation = zipImportResult
        ? await installWorldZipAssetsWithRollback(zipImportResult)
        : null;
      if (installation && !installation.ok) {
        setImportFileMessage(
          installation.rollbackComplete
            ? 'Uploaded images could not be stored. Partial image writes were rolled back, and the current document was left unchanged.'
            : 'Uploaded images could not be stored, and some partial image bytes could not be rolled back. The current document was left unchanged; save or export current work before reloading so safe cleanup can run.'
        );
        setIsImportConfirmationOpen(false);
        return;
      }
      let didImport: boolean;
      try {
        didImport = onImportDocument(importResult.document);
      } catch {
        const didRollback = installation?.ok
          ? await installation.rollback()
          : true;
        setImportFileMessage(
          didRollback
            ? 'The backup could not be applied. Newly installed image bytes were rolled back.'
            : 'The backup could not be applied, and some newly installed image bytes could not be rolled back. Save or export current work before reloading; safe cleanup runs on next load.'
        );
        setIsImportConfirmationOpen(false);
        return;
      }
      if (!didImport) {
        const didRollback = installation?.ok
          ? await installation.rollback()
          : true;
        setImportFileMessage(
          didRollback
            ? 'The imported backup did not change the current document.'
            : 'The imported backup did not change the current document, and some newly installed image bytes could not be rolled back. Save or export current work before reloading; safe cleanup runs on next load.'
        );
        setIsImportConfirmationOpen(false);
        return;
      }
      clearImportDraft();
    }
  };

  const confirmSnapshotAction = () => {
    if (!pendingSnapshotAction) {
      return;
    }
    if (pendingSnapshotAction.actionId === 'restore-snapshot') {
      onRestoreSnapshot(pendingSnapshotAction.snapshotId);
      clearImportDraft();
    }
    if (pendingSnapshotAction.actionId === 'delete-snapshot') {
      onDeleteSnapshot(pendingSnapshotAction.snapshotId);
    }
    setPendingSnapshotAction(null);
  };

  return (
    <main className="vwb-main vwb-data-layout" id="main-content" tabIndex={-1}>
      <section className="vwb-panel vwb-section-intro">
        <p className="vwb-kicker">{intro.kicker}</p>
        <h1>{intro.title}</h1>
        <p>{intro.detail}</p>
        <NavLink
          className="vwb-secondary-button"
          to={getCodexHelpRoute('data')}
          onClick={(event) => {
            if (!confirmDiscardUnsavedChanges(isImportDirty)) {
              event.preventDefault();
            }
          }}
        >
          {dataHelpCopy.backupHelpLabel}
        </NavLink>
      </section>

      <DashboardPage
        ariaLabel="Data dashboard cards"
        forcedVisibleCardIds={[
          ...(loadStatus.issues.length > 0 ? ['data.save-health'] : []),
          ...(importReview.error ? ['data.import'] : []),
        ]}
        pageId="data"
        summary="Arrange backup, recovery, import, and diagnostic tools."
      >
        <section
          className="vwb-panel"
          aria-labelledby="save-status-title"
          data-dashboard-card-id="data.save-health"
        >
          <div className="vwb-section-heading">
            <div>
              <p className="vwb-kicker">{dataStorageCopy.kicker}</p>
              <h2 id="save-status-title">{dataStorageCopy.title}</h2>
            </div>
            <span
              className={`vwb-status-pill ${
                saveStatus.state === 'failed' || saveStatus.state === 'paused'
                  ? 'is-danger'
                  : saveStatus.state === 'dirty' ||
                    saveStatus.state === 'unsaved'
                  ? 'is-dirty'
                  : ''
              }`}
            >
              {saveStatusModel.label}
            </span>
          </div>
          <p>
            {storageStatus.saveLine} {dataStorageCopy.manualSaveGuidance}
          </p>
          {saveStatus.state === 'paused' ? (
            <p className="vwb-inline-status is-danger" role="status">
              The app loaded starter data because saved local data could not be
              used. Export JSON before saving if you need to preserve a
              recovered or unreadable local value.
            </p>
          ) : null}
          <p>
            {storageStatus.loadLine} {loadStatus.message}{' '}
            {loadStatus.issues.length > 0
              ? `${loadStatus.issues.length} local storage issue${
                  loadStatus.issues.length === 1 ? '' : 's'
                } found.`
              : dataStorageCopy.noRecoveryIssueMessage}
          </p>
          {loadStatus.issues.length > 0 ? (
            <ul
              className="vwb-compact-list"
              aria-label={dataStorageCopy.storageLoadIssuesLabel}
            >
              {loadStatus.issues.map((issue) => (
                <li key={issue}>{issue}</li>
              ))}
            </ul>
          ) : null}
          <p>
            {storageStatus.recoveryLine} {dataStorageCopy.recoveryGuidance}
          </p>
        </section>

        <section
          className="vwb-panel"
          data-dashboard-card-id="data.diagnostics"
          id={dataExportSectionIds.diagnostics}
          tabIndex={-1}
          aria-labelledby="diagnostics-title"
        >
          <div className="vwb-section-heading">
            <div>
              <p className="vwb-kicker">
                {dataExportCopy.localOnlyReportKicker}
              </p>
              <h2 id="diagnostics-title">{diagnosticsExportOption.heading}</h2>
            </div>
            <button
              className="vwb-primary-button"
              type="button"
              onClick={downloadDiagnostics}
            >
              {diagnosticsExportOption.downloadLabel}
            </button>
          </div>
          <p>{diagnosticsExportOption.description}</p>
          <textarea
            className="vwb-export-textarea"
            readOnly
            rows={10}
            value={diagnosticsText}
            aria-label={diagnosticsExportOption.textAreaLabel}
          />
          {diagnosticsDownloadMessage ? (
            <p className="vwb-inline-status" role="status">
              {diagnosticsDownloadMessage}
            </p>
          ) : null}
        </section>

        <section
          className="vwb-panel"
          data-dashboard-card-id="data.export"
          id={dataExportSectionIds['active-json']}
          tabIndex={-1}
          aria-labelledby="json-export-title"
        >
          <div className="vwb-section-heading">
            <div>
              <p className="vwb-kicker">{activeJsonExportOption.kicker}</p>
              <h2 id="json-export-title">{activeJsonExportOption.heading}</h2>
            </div>
            <div className="vwb-action-row">
              <button
                className="vwb-primary-button"
                type="button"
                onClick={() =>
                  downloadExport(
                    'activeJson',
                    getCodexExportFilename('active-json', filenameBase),
                    jsonExport
                  )
                }
              >
                {activeJsonExportOption.downloadLabel}
              </button>
              <button
                className="vwb-secondary-button"
                disabled={isZipBusy}
                onClick={() => void downloadZip('active')}
                type="button"
              >
                Download Active ZIP
              </button>
            </div>
          </div>
          <p>{activeJsonExportOption.description}</p>
          <p>ZIP includes uploaded images. Web image links remain links.</p>
          <textarea
            className="vwb-export-textarea"
            readOnly
            rows={12}
            value={jsonExport}
            aria-label={activeJsonExportOption.textAreaLabel}
          />
          {downloadMessages.activeJson ? (
            <p className="vwb-inline-status" role="status">
              {downloadMessages.activeJson}
            </p>
          ) : null}
        </section>

        <section
          className="vwb-panel"
          data-dashboard-card-id="data.full-export"
          id={dataExportSectionIds['full-json']}
          tabIndex={-1}
          aria-labelledby="full-json-export-title"
        >
          <div className="vwb-section-heading">
            <div>
              <p className="vwb-kicker">{fullJsonExportOption.kicker}</p>
              <h2 id="full-json-export-title">
                {fullJsonExportOption.heading}
              </h2>
            </div>
            <div className="vwb-action-row">
              <button
                className="vwb-primary-button"
                type="button"
                onClick={() =>
                  downloadExport(
                    'allJson',
                    getCodexExportFilename('full-json', filenameBase),
                    fullJsonExport
                  )
                }
              >
                {fullJsonExportOption.downloadLabel}
              </button>
              <button
                className="vwb-secondary-button"
                disabled={isZipBusy}
                onClick={() => void downloadZip('full')}
                type="button"
              >
                Download All ZIP
              </button>
            </div>
          </div>
          <p>{fullJsonExportOption.description}</p>
          <p>ZIP includes uploaded images. Web image links remain links.</p>
          <textarea
            className="vwb-export-textarea"
            readOnly
            rows={12}
            value={fullJsonExport}
            aria-label={fullJsonExportOption.textAreaLabel}
          />
          {downloadMessages.allJson ? (
            <p className="vwb-inline-status" role="status">
              {downloadMessages.allJson}
            </p>
          ) : null}
          {zipDownloadMessage ? (
            <p className="vwb-inline-status" role="status">
              {zipDownloadMessage}
            </p>
          ) : null}
        </section>

        <section
          className="vwb-panel"
          data-dashboard-card-id="data.markdown-export"
          id={dataExportSectionIds.markdown}
          tabIndex={-1}
          aria-labelledby="markdown-export-title"
        >
          <div className="vwb-section-heading">
            <div>
              <p className="vwb-kicker">{markdownExportOption.kicker}</p>
              <h2 id="markdown-export-title">{markdownExportOption.heading}</h2>
            </div>
            <button
              className="vwb-primary-button"
              type="button"
              onClick={() =>
                downloadExport(
                  'md',
                  getCodexExportFilename('markdown', filenameBase),
                  markdownExport
                )
              }
            >
              {markdownExportOption.downloadLabel}
            </button>
          </div>
          <p>{markdownExportOption.description}</p>
          <textarea
            className="vwb-export-textarea"
            readOnly
            rows={12}
            value={markdownExport}
            aria-label={markdownExportOption.textAreaLabel}
          />
          {downloadMessages.md ? (
            <p className="vwb-inline-status" role="status">
              {downloadMessages.md}
            </p>
          ) : null}
        </section>

        <section
          className="vwb-panel"
          data-dashboard-card-id="data.import"
          id="import-json-backup"
          tabIndex={-1}
          aria-labelledby="import-title"
        >
          <div className="vwb-section-heading">
            <div>
              <p className="vwb-kicker">{dataImportCopy.kicker}</p>
              <h2 id="import-title">{dataImportCopy.title}</h2>
            </div>
            {isImportDirty ? (
              <span className="vwb-status-pill">
                {dataImportCopy.unappliedLabel}
              </span>
            ) : null}
          </div>
          <div className="vwb-form">
            <label>
              {dataImportCopy.fileLabel}
              <input
                accept="application/json,application/zip,.json,.zip"
                type="file"
                onChange={readImportFile}
              />
            </label>
            {importFileMessage ? (
              <p className="vwb-inline-status" role="status">
                {importFileMessage}
              </p>
            ) : null}
            <label>
              {dataImportCopy.textAreaLabel}
              <textarea
                rows={10}
                value={importText}
                onChange={(event) => {
                  setImportText(event.target.value);
                  setImportResult(null);
                  setZipImportResult(null);
                }}
                placeholder={dataImportCopy.placeholder}
              />
            </label>
            <div className="vwb-form-actions">
              <button
                className="vwb-primary-button"
                type="button"
                onClick={previewImport}
              >
                {dataImportCopy.previewLabel}
              </button>
              {importReview.canImport ? (
                <button
                  className="vwb-secondary-button"
                  type="button"
                  onClick={applyImport}
                >
                  {dataImportCopy.importLabel}
                </button>
              ) : null}
            </div>
            {importReview.previewText ? (
              <div className="vwb-import-preview" role="status">
                <strong>{importReview.previewText.title}</strong>
                <span>{importReview.previewText.detail}</span>
              </div>
            ) : null}
            {importReview.error ? (
              <p className="vwb-form-error" role="alert">
                {importReview.error}
              </p>
            ) : null}
          </div>
        </section>

        {isImportConfirmationOpen ? (
          <DataActionConfirmationDialog
            actionId="import-document"
            onCancel={() => setIsImportConfirmationOpen(false)}
            onConfirm={confirmImport}
            title={formatDestructiveActionTitle('import-document', 'backup')}
          />
        ) : null}

        {pendingSnapshotAction ? (
          <DataActionConfirmationDialog
            actionId={pendingSnapshotAction.actionId}
            onCancel={() => setPendingSnapshotAction(null)}
            onConfirm={confirmSnapshotAction}
            title={formatDestructiveActionTitle(
              pendingSnapshotAction.actionId,
              pendingSnapshotAction.subjectName
            )}
          />
        ) : null}

        <section
          className="vwb-panel"
          aria-labelledby="recovery-title"
          data-dashboard-card-id="data.recovery"
        >
          <div className="vwb-section-heading">
            <div>
              <p className="vwb-kicker">{recoverySnapshotModel.countLabel}</p>
              <h2 id="recovery-title">{recoverySnapshotModel.title}</h2>
            </div>
          </div>
          <p>{recoverySnapshotModel.description}</p>
          {recoverySnapshotStatus.message ? (
            <p
              className={`vwb-inline-status ${
                recoverySnapshotStatus.state === 'failed' ? 'is-danger' : ''
              }`}
              role="status"
            >
              {recoverySnapshotStatus.message}
            </p>
          ) : null}
          {recoverySnapshotModel.rows.length > 0 ? (
            <div className="vwb-snapshot-list">
              {recoverySnapshotModel.rows.map((snapshot) => (
                <article className="vwb-snapshot-row" key={snapshot.id}>
                  <div>
                    <span className="vwb-entry-kind">
                      {snapshot.reasonTitle}
                    </span>
                    <strong>{snapshot.activeWorldName}</strong>
                    <p>{snapshot.countSummary}</p>
                    <small>{snapshot.createdAtText}</small>
                  </div>
                  <div className="vwb-form-actions">
                    <button
                      aria-label={snapshot.restoreAccessibilityLabel}
                      className="vwb-primary-button"
                      type="button"
                      onClick={() =>
                        discardImportIfAllowed(() =>
                          setPendingSnapshotAction({
                            actionId: 'restore-snapshot',
                            snapshotId: snapshot.id,
                            subjectName: snapshot.confirmationSubject,
                          })
                        )
                      }
                    >
                      {snapshot.restoreLabel}
                    </button>
                    <button
                      aria-label={snapshot.deleteAccessibilityLabel}
                      className="vwb-secondary-button vwb-danger-button"
                      type="button"
                      onClick={() =>
                        discardImportIfAllowed(() =>
                          setPendingSnapshotAction({
                            actionId: 'delete-snapshot',
                            snapshotId: snapshot.id,
                            subjectName: snapshot.confirmationSubject,
                          })
                        )
                      }
                    >
                      {snapshot.deleteLabel}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="vwb-empty-results" role="status">
              <strong>{recoverySnapshotModel.emptyTitle}</strong>
              <p>{recoverySnapshotModel.emptyDetail}</p>
            </div>
          )}
        </section>

        <section
          className="vwb-panel"
          aria-labelledby="reset-title"
          data-dashboard-card-id="data.danger-zone"
        >
          <div className="vwb-section-heading">
            <div>
              <p className="vwb-kicker">{dataResetCopy.kicker}</p>
              <h2 id="reset-title">{dataResetCopy.title}</h2>
            </div>
            <button
              className="vwb-secondary-button vwb-danger-button"
              type="button"
              onClick={() =>
                discardImportIfAllowed(() => onRequestReset(clearImportDraft))
              }
            >
              {dataResetCopy.actionLabel}
            </button>
          </div>
          <p>{dataResetCopy.description}</p>
        </section>

        <section
          className="vwb-panel"
          aria-labelledby="data-help-title"
          data-dashboard-card-id="data.help"
        >
          <div className="vwb-section-heading">
            <div>
              <p className="vwb-kicker">{dataHelpCopy.kicker}</p>
              <h2 id="data-help-title">{dataHelpCopy.title}</h2>
            </div>
            <NavLink
              className="vwb-secondary-button"
              to={getCodexHelpRoute('data')}
              onClick={(event) => {
                if (!confirmDiscardUnsavedChanges(isImportDirty)) {
                  event.preventDefault();
                }
              }}
            >
              {dataHelpCopy.openHelpLabel}
            </NavLink>
          </div>
          <p>{codexDataHelpSummary}</p>
          <ul className="vwb-compact-list">
            {codexDataHelpTopics.map((topic) => (
              <li key={topic.title}>
                <strong>{topic.title}:</strong> {topic.items.join(' ')}
              </li>
            ))}
          </ul>
        </section>
      </DashboardPage>
    </main>
  );
}
