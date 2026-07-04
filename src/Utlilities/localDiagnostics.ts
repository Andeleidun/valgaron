import type { WorldDocument, WorldWorkspace } from '../types';
import {
  contentSafeDiagnosticOmittedFields,
  getWorldDocumentDiagnostics,
  type WorldDocumentDiagnostics,
} from '@valgaron/core';
import { APP_NAME, APP_VERSION } from './appMetadata';
import { CURRENT_WORLD_SCHEMA_VERSION, getActiveWorld } from './worldDocument';
import type { WorldDocumentLoadStatus } from './codexStorage';
import type {
  RecoverySnapshotStatus,
  WorldDocumentSaveStatus,
} from './useWorldDocumentState';

export type LocalDiagnosticMessage = {
  level: 'info' | 'warning' | 'error';
  source: string;
  message: string;
  occurredAt: string;
};

export type LocalDiagnosticsInput = {
  document: WorldDocument;
  activeWorld?: WorldWorkspace;
  route: string;
  userAgent: string;
  loadStatus: WorldDocumentLoadStatus;
  saveStatus: WorldDocumentSaveStatus;
  recoverySnapshotStatus: RecoverySnapshotStatus;
  recoverySnapshotCount: number;
  recentMessages?: readonly LocalDiagnosticMessage[];
};

export type LocalDiagnosticsReport = {
  app: {
    name: string;
    version: string;
    schemaVersion: number;
  };
  runtime: {
    route: string;
    userAgent: string;
    generatedAt: string;
  };
  storage: {
    loadState: WorldDocumentLoadStatus['state'];
    loadSource: WorldDocumentLoadStatus['source'];
    loadMessage: string;
    loadIssueCount: number;
    loadIssues: readonly string[];
    saveState: WorldDocumentSaveStatus['state'];
    lastSaveAttemptAt: string;
    recoverySnapshotState: RecoverySnapshotStatus['state'];
    recoverySnapshotMessage: string;
    recoverySnapshotCount: number;
  };
  document: WorldDocumentDiagnostics;
  recentMessages: readonly LocalDiagnosticMessage[];
  contentPolicy: {
    includesWorldContent: false;
    omittedFields: readonly string[];
  };
};

export function sanitizeDiagnosticsRoute(route: string): string {
  const [path, search = ''] = route.split('?');
  if (!search) {
    return path;
  }
  const keys = new URLSearchParams(search);
  const sanitizedSearch = Array.from(keys.keys())
    .map((key) => `${encodeURIComponent(key)}=redacted`)
    .join('&');
  return sanitizedSearch ? `${path}?${sanitizedSearch}` : path;
}

/** Build a local-only diagnostics report that excludes world content. */
export function createLocalDiagnosticsReport(
  input: LocalDiagnosticsInput
): LocalDiagnosticsReport {
  const activeWorld = input.activeWorld ?? getActiveWorld(input.document);
  return {
    app: {
      name: APP_NAME,
      version: APP_VERSION,
      schemaVersion: CURRENT_WORLD_SCHEMA_VERSION,
    },
    runtime: {
      route: sanitizeDiagnosticsRoute(input.route),
      userAgent: input.userAgent,
      generatedAt: new Date().toISOString(),
    },
    storage: {
      loadState: input.loadStatus.state,
      loadSource: input.loadStatus.source,
      loadMessage: input.loadStatus.message,
      loadIssueCount: input.loadStatus.issues.length,
      loadIssues: input.loadStatus.issues,
      saveState: input.saveStatus.state,
      lastSaveAttemptAt: input.saveStatus.savedAt,
      recoverySnapshotState: input.recoverySnapshotStatus.state,
      recoverySnapshotMessage: input.recoverySnapshotStatus.message,
      recoverySnapshotCount: input.recoverySnapshotCount,
    },
    document: getWorldDocumentDiagnostics(input.document, activeWorld),
    recentMessages: input.recentMessages ?? [],
    contentPolicy: {
      includesWorldContent: false,
      omittedFields: contentSafeDiagnosticOmittedFields,
    },
  };
}

/** Serialize diagnostics as formatted JSON for download or copy/paste. */
export function serializeLocalDiagnosticsReport(
  report: LocalDiagnosticsReport
): string {
  return `${JSON.stringify(report, null, 2)}\n`;
}
