import { useMemo, useState } from 'react';
import {
  getDataExportText,
  getRuntimeRecoveryCopy,
  localPersistenceCopy,
  sanitizeDiagnosticsRoute,
  type WorldDocument,
} from '@valgaron/core';
import type { WorldDocumentLoadStatus } from '../../Utlilities/codexStorage';
import { downloadTextFile } from '../../Utlilities/fileDownloads';
import type {
  RecoverySnapshotStatus,
  WorldDocumentSaveStatus,
} from '../../Utlilities/useWorldDocumentState';

export function RuntimeErrorFallback({
  basePath,
  document,
  error,
  loadStatus,
  onRetry,
  recoverySnapshotCount,
  recoverySnapshotStatus,
  route,
  saveStatus,
}: {
  basePath: string;
  document: WorldDocument;
  error: Error | null;
  loadStatus: WorldDocumentLoadStatus;
  onRetry: () => void;
  recoverySnapshotCount: number;
  recoverySnapshotStatus: RecoverySnapshotStatus;
  route: string;
  saveStatus: WorldDocumentSaveStatus;
}) {
  const [downloadMessage, setDownloadMessage] = useState('');
  const copy = getRuntimeRecoveryCopy();
  const diagnosticsText = useMemo(() => {
    return getDataExportText(document, 'diagnostics', {
      diagnosticsRuntime: {
        route: sanitizeDiagnosticsRoute(route),
        userAgent:
          typeof navigator === 'undefined'
            ? 'Unavailable'
            : navigator.userAgent,
        loadState: loadStatus.source,
        loadCheckedAt: loadStatus.checkedAt,
        loadMessage: loadStatus.message,
        loadIssueCount: loadStatus.issues.length,
        saveState: saveStatus.state,
        recoverySnapshotAvailable: recoverySnapshotCount > 0,
        recoverySnapshotCount,
        recoverySnapshotState: recoverySnapshotStatus.state,
        runtimeErrorName: error?.name ?? 'UnknownError',
      },
      diagnosticsStorageTarget: localPersistenceCopy.browserSaveTarget,
    });
  }, [
    document,
    error,
    loadStatus,
    recoverySnapshotCount,
    recoverySnapshotStatus,
    route,
    saveStatus,
  ]);

  const downloadDiagnostics = () => {
    const didDownload = downloadTextFile(
      'valgaron-diagnostics.json',
      diagnosticsText
    );
    setDownloadMessage(
      didDownload
        ? copy.diagnosticsDownloadedMessage
        : copy.diagnosticsUnavailableMessage
    );
  };

  return (
    <main
      className="vwb-main vwb-runtime-error"
      id="main-content"
      tabIndex={-1}
    >
      <section className="vwb-panel">
        <p className="vwb-kicker">{copy.kicker}</p>
        <h1>{copy.title}</h1>
        <p>{copy.detail}</p>
        {error ? (
          <p className="vwb-form-error" role="alert">
            {error.name}: {error.message}
          </p>
        ) : null}
        <div className="vwb-form-actions">
          <button
            className="vwb-primary-button"
            type="button"
            onClick={onRetry}
          >
            {copy.retryLabel}
          </button>
          <a className="vwb-secondary-link" href={`${basePath}data`}>
            {copy.dataLabel}
          </a>
          <button
            className="vwb-secondary-button"
            type="button"
            onClick={() => window.location.reload()}
          >
            {copy.reloadLabel}
          </button>
        </div>
      </section>

      <section
        className="vwb-panel"
        aria-labelledby="runtime-diagnostics-title"
      >
        <div className="vwb-section-heading">
          <div>
            <p className="vwb-kicker">{copy.diagnosticsKickerLabel}</p>
            <h2 id="runtime-diagnostics-title">{copy.diagnosticsTitle}</h2>
          </div>
          <button
            className="vwb-primary-button"
            type="button"
            onClick={downloadDiagnostics}
          >
            {copy.downloadDiagnosticsLabel}
          </button>
        </div>
        <p>{copy.diagnosticsDescription}</p>
        <textarea
          className="vwb-export-textarea"
          readOnly
          rows={10}
          value={diagnosticsText}
          aria-label={copy.diagnosticsTextAreaLabel}
        />
        {downloadMessage ? (
          <p className="vwb-inline-status" role="status">
            {downloadMessage}
          </p>
        ) : null}
      </section>
    </main>
  );
}
