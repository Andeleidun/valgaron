import { useMemo, useState, type ChangeEvent } from 'react';
import {
  exportWorldToMarkdown,
  parseWorldImport,
  serializeActiveWorldBackup,
  serializeWorldDocumentBackup,
  type WorldImportResult,
} from '../Utlilities/codexDataPortability';
import { formatUpdatedAt } from '../Utlilities/codexEntries';
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
import type {
  RecoverySnapshotReason,
  RecoverySnapshotSummary,
  WorldDocument,
  WorldWorkspace,
} from '../types';
import type { WorldDocumentLoadStatus } from '../Utlilities/codexStorage';
import type {
  RecoverySnapshotStatus,
  WorldDocumentSaveStatus,
} from '../Utlilities/useWorldDocumentState';

const snapshotReasonLabels: Record<RecoverySnapshotReason, string> = {
  import: 'Before import',
  reset: 'Before reset',
  'permanent-delete': 'Before permanent delete',
  'relationship-delete': 'Before relationship delete',
  restore: 'Before snapshot restore',
  'workspace-delete': 'Before workspace delete',
  'planetary-world-delete': 'Before in-fiction world delete',
  'entry-type-delete': 'Before custom entry type delete',
};

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
  onRequestReset: () => void;
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
          'The initial save was paused after storage recovery to avoid overwriting unreadable local data.',
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
    const didDownload = downloadTextFile(
      'valgaron-diagnostics.json',
      diagnosticsText
    );
    setDiagnosticsDownloadMessage(
      didDownload
        ? 'Downloaded valgaron-diagnostics.json.'
        : 'Download is unavailable in this runtime; copy the diagnostics text instead.'
    );
  };

  const previewImport = () => {
    setImportResult(parseWorldImport(importText));
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
      onImportDocument(importResult.document);
      setImportText('');
      setImportResult(null);
    }
  };

  return (
    <main className="vwb-main vwb-data-layout" id="main-content" tabIndex={-1}>
      <section className="vwb-panel vwb-section-intro">
        <p className="vwb-kicker">Local data</p>
        <h1>Data</h1>
        <p>
          Export JSON backups for the active workspace or the full local
          document, copy a Markdown reference, import a validated backup, or
          reset to starter data.
        </p>
      </section>

      <section className="vwb-panel" aria-labelledby="save-status-title">
        <div className="vwb-section-heading">
          <div>
            <p className="vwb-kicker">Storage status</p>
            <h2 id="save-status-title">Local browser save</h2>
          </div>
          <span
            className={`vwb-status-pill ${
              saveStatus.state === 'failed' || saveStatus.state === 'paused'
                ? 'is-danger'
                : ''
            }`}
          >
            {saveStatus.state === 'saved'
              ? 'Saved'
              : saveStatus.state === 'paused'
              ? 'Save Paused'
              : 'Save Failed'}
          </span>
        </div>
        <p>
          {saveStatus.state === 'paused'
            ? `Initial save paused: ${formatUpdatedAt(saveStatus.savedAt)}.`
            : `Last save attempt: ${formatUpdatedAt(saveStatus.savedAt)}.`}{' '}
          Data stays in this browser profile only. Export JSON backups before
          clearing browser data, switching browsers, or changing devices.
        </p>
        {saveStatus.state === 'paused' ? (
          <p className="vwb-inline-status is-danger" role="status">
            The app loaded starter data because saved local data could not be
            used. The first save was paused to avoid overwriting the unreadable
            saved value. Export JSON before making risky changes.
          </p>
        ) : null}
        <p>
          Load status: {loadStatus.message}{' '}
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
          Recovery snapshots are saved before import, reset, permanent entry
          delete, relationship delete, and snapshot restore actions. Keep JSON
          exports as your device-independent backup.
        </p>
      </section>

      <section className="vwb-panel" aria-labelledby="diagnostics-title">
        <div className="vwb-section-heading">
          <div>
            <p className="vwb-kicker">Local-only report</p>
            <h2 id="diagnostics-title">Diagnostics</h2>
          </div>
          <button
            className="vwb-primary-button"
            type="button"
            onClick={downloadDiagnostics}
          >
            Download Diagnostics
          </button>
        </div>
        <p>
          Diagnostics include app version, schema version, route, browser,
          storage state, and counts. They exclude world names, entry names,
          notes, summaries, tags, and ids by default.
        </p>
        <textarea
          className="vwb-export-textarea"
          readOnly
          rows={10}
          value={diagnosticsText}
          aria-label="Local diagnostics JSON"
        />
        {diagnosticsDownloadMessage ? (
          <p className="vwb-inline-status" role="status">
            {diagnosticsDownloadMessage}
          </p>
        ) : null}
      </section>

      <section className="vwb-panel" aria-labelledby="json-export-title">
        <div className="vwb-section-heading">
          <div>
            <p className="vwb-kicker">Active workspace backup</p>
            <h2 id="json-export-title">Active workspace JSON</h2>
          </div>
          <button
            className="vwb-primary-button"
            type="button"
            onClick={() =>
              downloadExport('activeJson', `${filenameBase}.json`, jsonExport)
            }
          >
            Download Active JSON
          </button>
        </div>
        <p>
          This backup contains the current project/universe workspace only. Use
          all-workspaces export when you need every workspace in this browser
          profile.
        </p>
        <textarea
          className="vwb-export-textarea"
          readOnly
          rows={12}
          value={jsonExport}
          aria-label="Active workspace JSON backup"
        />
        {downloadMessages.activeJson ? (
          <p className="vwb-inline-status" role="status">
            {downloadMessages.activeJson}
          </p>
        ) : null}
      </section>

      <section className="vwb-panel" aria-labelledby="full-json-export-title">
        <div className="vwb-section-heading">
          <div>
            <p className="vwb-kicker">All-workspaces backup</p>
            <h2 id="full-json-export-title">Full document JSON</h2>
          </div>
          <button
            className="vwb-primary-button"
            type="button"
            onClick={() =>
              downloadExport(
                'allJson',
                'valgaron-all-workspaces.json',
                fullJsonExport
              )
            }
          >
            Download All JSON
          </button>
        </div>
        <p>
          This backup contains every project/universe workspace, every
          in-fiction world or planet, custom entry types, entries, and
          relationships in this local document.
        </p>
        <textarea
          className="vwb-export-textarea"
          readOnly
          rows={12}
          value={fullJsonExport}
          aria-label="All workspaces JSON backup"
        />
        {downloadMessages.allJson ? (
          <p className="vwb-inline-status" role="status">
            {downloadMessages.allJson}
          </p>
        ) : null}
      </section>

      <section className="vwb-panel" aria-labelledby="markdown-export-title">
        <div className="vwb-section-heading">
          <div>
            <p className="vwb-kicker">Drafting reference</p>
            <h2 id="markdown-export-title">Markdown export</h2>
          </div>
          <button
            className="vwb-primary-button"
            type="button"
            onClick={() =>
              downloadExport('md', `${filenameBase}.md`, markdownExport)
            }
          >
            Download Markdown
          </button>
        </div>
        <textarea
          className="vwb-export-textarea"
          readOnly
          rows={12}
          value={markdownExport}
          aria-label="Markdown world export"
        />
        {downloadMessages.md ? (
          <p className="vwb-inline-status" role="status">
            {downloadMessages.md}
          </p>
        ) : null}
      </section>

      <section className="vwb-panel" aria-labelledby="import-title">
        <div className="vwb-section-heading">
          <div>
            <p className="vwb-kicker">Validated import</p>
            <h2 id="import-title">Import JSON backup</h2>
          </div>
          {isImportDirty ? (
            <span className="vwb-status-pill">Unsaved</span>
          ) : null}
        </div>
        <div className="vwb-form">
          <label>
            Choose JSON file
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
            Backup JSON
            <textarea
              rows={10}
              value={importText}
              onChange={(event) => {
                setImportText(event.target.value);
                setImportResult(null);
              }}
              placeholder="Paste a Valgaron World Codex JSON backup"
            />
          </label>
          <div className="vwb-form-actions">
            <button
              className="vwb-primary-button"
              type="button"
              onClick={previewImport}
            >
              Preview Import
            </button>
            {importResult?.ok ? (
              <button
                className="vwb-secondary-button"
                type="button"
                onClick={applyImport}
              >
                Import Backup
              </button>
            ) : null}
          </div>
          {importResult?.ok ? (
            <div className="vwb-import-preview" role="status">
              <strong>{importResult.preview.activeWorldName}</strong>
              <span>{importResult.preview.worldCount} world(s)</span>
              <span>
                {importResult.preview.planetaryWorldCount} in-fiction world(s)
              </span>
              <span>{importResult.preview.entryCount} entries</span>
              <span>
                {importResult.preview.relationshipCount} relationships
              </span>
              <span>Saved {formatUpdatedAt(importResult.preview.savedAt)}</span>
            </div>
          ) : null}
          {importResult && !importResult.ok ? (
            <p className="vwb-form-error" role="alert">
              {importResult.error}
            </p>
          ) : null}
        </div>
      </section>

      <section className="vwb-panel" aria-labelledby="recovery-title">
        <div className="vwb-section-heading">
          <div>
            <p className="vwb-kicker">
              {recoverySnapshots.length} saved recovery point
              {recoverySnapshots.length === 1 ? '' : 's'}
            </p>
            <h2 id="recovery-title">Recovery snapshots</h2>
          </div>
        </div>
        <p>
          Snapshots restore the local document state from before destructive
          actions in this browser profile.
        </p>
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
        {recoverySnapshots.length > 0 ? (
          <div className="vwb-snapshot-list">
            {recoverySnapshots.map((snapshot) => (
              <article className="vwb-snapshot-row" key={snapshot.id}>
                <div>
                  <span className="vwb-entry-kind">
                    {snapshotReasonLabels[snapshot.reason]}
                  </span>
                  <strong>{snapshot.activeWorldName}</strong>
                  <p>
                    {snapshot.worldCount} world
                    {snapshot.worldCount === 1 ? '' : 's'},{' '}
                    {snapshot.entryCount} entries, {snapshot.relationshipCount}{' '}
                    relationships
                  </p>
                  <small>{formatUpdatedAt(snapshot.createdAt)}</small>
                </div>
                <div className="vwb-form-actions">
                  <button
                    className="vwb-primary-button"
                    type="button"
                    onClick={() =>
                      discardImportIfAllowed(() =>
                        onRestoreSnapshot(snapshot.id)
                      )
                    }
                  >
                    Restore
                  </button>
                  <button
                    className="vwb-secondary-button vwb-danger-button"
                    type="button"
                    onClick={() =>
                      discardImportIfAllowed(() =>
                        onDeleteSnapshot(snapshot.id)
                      )
                    }
                  >
                    Delete Snapshot
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="vwb-empty-results" role="status">
            <strong>No recovery snapshots yet.</strong>
            <p>
              A snapshot is created automatically before import, reset, and
              delete actions.
            </p>
          </div>
        )}
      </section>

      <section className="vwb-panel" aria-labelledby="reset-title">
        <div className="vwb-section-heading">
          <div>
            <p className="vwb-kicker">Destructive action</p>
            <h2 id="reset-title">Reset starter data</h2>
          </div>
          <button
            className="vwb-secondary-button vwb-danger-button"
            type="button"
            onClick={() => discardImportIfAllowed(onRequestReset)}
          >
            Reset Starter Data
          </button>
        </div>
        <p>
          Reset replaces the current local world document with neutral starter
          data. Export JSON first if you need a backup.
        </p>
      </section>
    </main>
  );
}
