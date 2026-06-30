import { useMemo, useState } from 'react';
import type { WorldDocument, WorldWorkspace } from '../../types';
import type { WorldDocumentLoadStatus } from '../../Utlilities/codexStorage';
import { downloadTextFile } from '../../Utlilities/fileDownloads';
import {
  createLocalDiagnosticsReport,
  serializeLocalDiagnosticsReport,
} from '../../Utlilities/localDiagnostics';
import type {
  RecoverySnapshotStatus,
  WorldDocumentSaveStatus,
} from '../../Utlilities/useWorldDocumentState';

export function RuntimeErrorFallback({
  activeWorld,
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
  activeWorld: WorldWorkspace;
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
  const diagnosticsText = useMemo(() => {
    const report = createLocalDiagnosticsReport({
      activeWorld,
      document,
      loadStatus,
      recentMessages: [
        {
          level: 'error',
          source: 'runtime',
          message: error
            ? `${error.name}: ${error.message}`
            : 'Unknown rendering error.',
          occurredAt: new Date().toISOString(),
        },
      ],
      recoverySnapshotCount,
      recoverySnapshotStatus,
      route,
      saveStatus,
      userAgent:
        typeof navigator === 'undefined' ? 'Unavailable' : navigator.userAgent,
    });
    return serializeLocalDiagnosticsReport(report);
  }, [
    activeWorld,
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
        ? 'Diagnostics downloaded.'
        : 'Download is unavailable in this runtime; copy the diagnostics text instead.'
    );
  };

  return (
    <main
      className="vwb-main vwb-runtime-error"
      id="main-content"
      tabIndex={-1}
    >
      <section className="vwb-panel">
        <p className="vwb-kicker">Recovery</p>
        <h1>Something went wrong</h1>
        <p>
          The app caught a rendering failure before the page went blank. Your
          local document was not deleted by this recovery screen.
        </p>
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
            Retry
          </button>
          <a className="vwb-secondary-link" href={`${basePath}data`}>
            Open Data
          </a>
          <button
            className="vwb-secondary-button"
            type="button"
            onClick={() => window.location.reload()}
          >
            Reload App
          </button>
        </div>
      </section>

      <section
        className="vwb-panel"
        aria-labelledby="runtime-diagnostics-title"
      >
        <div className="vwb-section-heading">
          <div>
            <p className="vwb-kicker">Local-only report</p>
            <h2 id="runtime-diagnostics-title">Diagnostics</h2>
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
          This report excludes world names, entry names, notes, summaries, tags,
          and ids by default.
        </p>
        <textarea
          className="vwb-export-textarea"
          readOnly
          rows={10}
          value={diagnosticsText}
          aria-label="Runtime diagnostics JSON"
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
