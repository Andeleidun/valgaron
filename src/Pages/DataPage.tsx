import { useEffect, useMemo, useState, type ChangeEvent } from 'react';
import { NavLink } from 'react-router-dom';
import {
  type DestructiveActionId,
  exportWorldToMarkdown,
  formatDestructiveActionTitle,
  formatUpdatedAt,
  formatWorldImportPreviewText,
  getCodexExportFilename,
  getCodexExportOption,
  getCodexHelpRoute,
  getCodexScreenIntro,
  getDataRecoverySnapshotModel,
  getDataStorageStatusModel,
  getDestructiveActionCopy,
  isCodexExportMode,
  dataImportCopy,
  dataResetCopy,
  localPersistenceCopy,
  parseWorldImport,
  serializeActiveWorldBackup,
  serializeWorldDocumentBackup,
  type WorldImportResult,
  type CodexExportMode,
} from '@valgaron/core';
import { downloadTextFile, slugFilename } from '../Utlilities/fileDownloads';
import {
  createLocalDiagnosticsReport,
  serializeLocalDiagnosticsReport,
  type LocalDiagnosticMessage,
} from '../Utlilities/localDiagnostics';
import {
  confirmDiscardUnsavedChanges,
  useUnsavedChangesWarning,
} from '../Utlilities/unsavedChanges';
import { useDialogFocus } from '../Utlilities/dialogFocus';
import type {
  RecoverySnapshotSummary,
  WorldDocument,
  WorldWorkspace,
} from '../types';
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
};

const dataExportSectionIds = {
  'active-json': 'active-json-export',
  'full-json': 'full-json-export',
  markdown: 'markdown-export',
  diagnostics: 'diagnostics-export',
} as const satisfies Record<CodexExportMode, string>;

function getDataRouteFocusTargetId(): string {
  if (typeof window === 'undefined') {
    return '';
  }
  const hash = decodeURIComponent(window.location.hash.replace(/^#/, ''));
  if (hash !== 'export') {
    return hash;
  }
  const mode = new URLSearchParams(window.location.search).get('mode');
  return isCodexExportMode(mode)
    ? dataExportSectionIds[mode]
    : dataExportSectionIds['active-json'];
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
        <p className="vwb-kicker">Destructive action</p>
        <h2 id={titleId}>{title}</h2>
        <p id={descriptionId}>{copy.message}</p>
        <div className="vwb-form-actions">
          <button
            className="vwb-secondary-button"
            type="button"
            onClick={onCancel}
          >
            Cancel
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
  onImportDocument: (document: WorldDocument) => void;
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
  const [downloadMessages, setDownloadMessages] = useState<
    Record<'activeJson' | 'allJson' | 'md', string>
  >({
    activeJson: '',
    allJson: '',
    md: '',
  });
  const [diagnosticsDownloadMessage, setDiagnosticsDownloadMessage] =
    useState('');
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
    const focusTargetId = getDataRouteFocusTargetId();
    if (!focusTargetId) {
      return;
    }
    const focusedSection = window.document.getElementById(focusTargetId);
    focusedSection?.scrollIntoView({ block: 'start' });
    focusedSection?.focus({ preventScroll: true });
  }, []);
  const diagnosticsText = useMemo(() => {
    const recentMessages: LocalDiagnosticMessage[] = [
      {
        level: loadStatus.state === 'recovered' ? 'warning' : 'info',
        source: 'storage-load',
        message: loadStatus.message,
        occurredAt: loadStatus.checkedAt,
      },
    ];
    if (saveStatus.state === 'failed') {
      recentMessages.push({
        level: 'error',
        source: 'storage-save',
        message:
          'The most recent local browser save failed. Export JSON before continuing risky edits.',
        occurredAt: saveStatus.savedAt,
      });
    }
    if (saveStatus.state === 'paused') {
      recentMessages.push({
        level: 'warning',
        source: 'storage-save',
        message:
          'Local storage recovery loaded starter data. Use the Save button only after exporting anything you may need.',
        occurredAt: saveStatus.savedAt,
      });
    }
    if (recoverySnapshotStatus.state === 'failed') {
      recentMessages.push({
        level: 'error',
        source: 'recovery-snapshot',
        message: recoverySnapshotStatus.message,
        occurredAt: recoverySnapshotStatus.updatedAt,
      });
    }
    return serializeLocalDiagnosticsReport(
      createLocalDiagnosticsReport({
        activeWorld,
        document,
        loadStatus,
        recentMessages,
        recoverySnapshotCount: recoverySnapshots.length,
        recoverySnapshotStatus,
        route:
          typeof window === 'undefined'
            ? '/data'
            : `${window.location.pathname}${window.location.search}`,
        saveStatus,
        userAgent:
          typeof navigator === 'undefined'
            ? 'Unavailable'
            : navigator.userAgent,
      })
    );
  }, [
    activeWorld,
    document,
    loadStatus,
    recoverySnapshots.length,
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
  const importPreviewText = importResult?.ok
    ? formatWorldImportPreviewText(importResult.preview)
    : null;
  const saveStatusLabel =
    saveStatus.state === 'saved'
      ? 'Saved'
      : saveStatus.state === 'paused'
      ? 'Save Paused'
      : saveStatus.state === 'unsaved'
      ? 'Needs Save'
      : saveStatus.state === 'dirty'
      ? 'Unsaved'
      : 'Save Failed';
  const saveStatusDescription =
    saveStatus.state === 'paused'
      ? `Manual save paused after local storage recovery: ${formatUpdatedAt(
          saveStatus.savedAt
        )}.`
      : saveStatus.state === 'unsaved'
      ? `This document is loaded in the session but has not been saved to current ${
          localPersistenceCopy.browserSaveTarget
        } yet. Last document timestamp: ${formatUpdatedAt(saveStatus.savedAt)}.`
      : saveStatus.state === 'dirty'
      ? `Unsaved session changes. Last ${
          localPersistenceCopy.browserSaveTarget
        } save: ${formatUpdatedAt(saveStatus.savedAt)}.`
      : `Last save attempt: ${formatUpdatedAt(saveStatus.savedAt)}.`;
  const storageStatus = useMemo(
    () =>
      getDataStorageStatusModel({
        loadStatus,
        recoverySnapshots,
        saveLineLabel: 'Manual save',
        saveMessage: saveStatusDescription,
      }),
    [loadStatus, recoverySnapshots, saveStatusDescription]
  );

  const downloadExport = (
    key: 'activeJson' | 'allJson' | 'md',
    filename: string,
    text: string
  ) => {
    const didDownload = downloadTextFile(filename, text);
    const message = didDownload
      ? `Downloaded ${filename}.`
      : 'Download is unavailable in this runtime; copy the export text instead.';
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
        ? `Downloaded ${diagnosticsFilename}.`
        : 'Download is unavailable in this runtime; copy the diagnostics text instead.'
    );
  };

  const previewImport = () => {
    setImportResult(parseWorldImport(importText));
  };

  const clearImportDraft = () => {
    setImportText('');
    setImportResult(null);
    setImportFileMessage('');
    setIsImportConfirmationOpen(false);
  };

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
    if (typeof FileReader === 'undefined') {
      setImportFileMessage(
        'File import is unavailable in this runtime; paste the JSON backup instead.'
      );
      return;
    }
    const reader = new FileReader();
    reader.addEventListener('load', () => {
      const text = typeof reader.result === 'string' ? reader.result : '';
      setImportText(text);
      setImportResult(parseWorldImport(text));
      setImportFileMessage(
        `Loaded ${file.name}. Review the preview before importing.`
      );
    });
    reader.addEventListener('error', () => {
      setImportFileMessage(
        `Could not read ${file.name}. Paste the JSON backup instead.`
      );
    });
    reader.readAsText(file);
  };

  const applyImport = () => {
    if (importResult?.ok) {
      setIsImportConfirmationOpen(true);
    }
  };

  const confirmImport = () => {
    if (importResult?.ok) {
      onImportDocument(importResult.document);
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
          Backup Help
        </NavLink>
      </section>

      <section className="vwb-panel" aria-labelledby="save-status-title">
        <div className="vwb-section-heading">
          <div>
            <p className="vwb-kicker">Storage status</p>
            <h2 id="save-status-title">Manual local save</h2>
          </div>
          <span
            className={`vwb-status-pill ${
              saveStatus.state === 'failed' || saveStatus.state === 'paused'
                ? 'is-danger'
                : saveStatus.state === 'dirty' || saveStatus.state === 'unsaved'
                ? 'is-dirty'
                : ''
            }`}
          >
            {saveStatusLabel}
          </span>
        </div>
        <p>
          {storageStatus.saveLine} Edits stay in this session until you use the
          header Save button. Export JSON backups before clearing browser data,
          switching browsers, or changing devices.
        </p>
        {saveStatus.state === 'paused' ? (
          <p className="vwb-inline-status is-danger" role="status">
            The app loaded starter data because saved local data could not be
            used. Export JSON before saving if you need to preserve a recovered
            or unreadable local value.
          </p>
        ) : null}
        <p>
          {storageStatus.loadLine} {loadStatus.message}{' '}
          {loadStatus.issues.length > 0
            ? `${loadStatus.issues.length} local storage issue${
                loadStatus.issues.length === 1 ? '' : 's'
              } found.`
            : 'No local storage recovery issue was found.'}
        </p>
        {loadStatus.issues.length > 0 ? (
          <ul className="vwb-compact-list" aria-label="Storage load issues">
            {loadStatus.issues.map((issue) => (
              <li key={issue}>{issue}</li>
            ))}
          </ul>
        ) : null}
        <p>
          {storageStatus.recoveryLine} Recovery snapshots are saved before
          import, reset, permanent entry delete, relationship delete, and
          snapshot restore actions. Keep JSON exports as your device-independent
          backup.
        </p>
      </section>

      <section
        className="vwb-panel"
        id={dataExportSectionIds.diagnostics}
        tabIndex={-1}
        aria-labelledby="diagnostics-title"
      >
        <div className="vwb-section-heading">
          <div>
            <p className="vwb-kicker">Local-only report</p>
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
        id={dataExportSectionIds['active-json']}
        tabIndex={-1}
        aria-labelledby="json-export-title"
      >
        <div className="vwb-section-heading">
          <div>
            <p className="vwb-kicker">{activeJsonExportOption.kicker}</p>
            <h2 id="json-export-title">{activeJsonExportOption.heading}</h2>
          </div>
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
        </div>
        <p>{activeJsonExportOption.description}</p>
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
        id={dataExportSectionIds['full-json']}
        tabIndex={-1}
        aria-labelledby="full-json-export-title"
      >
        <div className="vwb-section-heading">
          <div>
            <p className="vwb-kicker">{fullJsonExportOption.kicker}</p>
            <h2 id="full-json-export-title">{fullJsonExportOption.heading}</h2>
          </div>
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
        </div>
        <p>{fullJsonExportOption.description}</p>
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
      </section>

      <section
        className="vwb-panel"
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
            <span className="vwb-status-pill">Unsaved</span>
          ) : null}
        </div>
        <div className="vwb-form">
          <label>
            {dataImportCopy.fileLabel}
            <input
              accept="application/json,.json"
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
            {importResult?.ok ? (
              <button
                className="vwb-secondary-button"
                type="button"
                onClick={applyImport}
              >
                {dataImportCopy.importLabel}
              </button>
            ) : null}
          </div>
          {importPreviewText ? (
            <div className="vwb-import-preview" role="status">
              <strong>{importPreviewText.title}</strong>
              <span>{importPreviewText.detail}</span>
            </div>
          ) : null}
          {importResult && !importResult.ok ? (
            <p className="vwb-form-error" role="alert">
              {importResult.error}
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
            'recovery snapshot'
          )}
        />
      ) : null}

      <section className="vwb-panel" aria-labelledby="recovery-title">
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
                  <span className="vwb-entry-kind">{snapshot.reasonTitle}</span>
                  <strong>{snapshot.activeWorldName}</strong>
                  <p>{snapshot.countSummary}</p>
                  <small>{snapshot.createdAtText}</small>
                </div>
                <div className="vwb-form-actions">
                  <button
                    className="vwb-primary-button"
                    type="button"
                    onClick={() =>
                      discardImportIfAllowed(() =>
                        setPendingSnapshotAction({
                          actionId: 'restore-snapshot',
                          snapshotId: snapshot.id,
                        })
                      )
                    }
                  >
                    {snapshot.restoreLabel}
                  </button>
                  <button
                    className="vwb-secondary-button vwb-danger-button"
                    type="button"
                    onClick={() =>
                      discardImportIfAllowed(() =>
                        setPendingSnapshotAction({
                          actionId: 'delete-snapshot',
                          snapshotId: snapshot.id,
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

      <section className="vwb-panel" aria-labelledby="reset-title">
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
    </main>
  );
}
