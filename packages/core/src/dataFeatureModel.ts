import type {
  CodexExportMode,
  WorldImportResult,
  WorldImportPreview,
} from './codexDataPortability';
import {
  codexExportOptions,
  exportWorldToMarkdown,
  formatWorldImportPreviewText,
  getCodexExportOption,
  serializeActiveWorldBackup,
  serializeWorldDocumentBackup,
  type WorldImportPreviewText,
} from './codexDataPortability';
import {
  createWorldDocumentDiagnosticsReport,
  serializeWorldDocumentDiagnosticsReport,
  type WorldDocumentDiagnosticsRuntime,
} from './documentDiagnostics';
import type { WorldDocument } from './types';
import type { RecoverySnapshotSummary } from './types';
import { localPersistenceCopy } from './shell';
import { getActiveWorld } from './worldDocument';
import { formatUpdatedAt } from './codexEntries';
import {
  getRecoverySnapshotReasonPhrase,
  getRecoverySnapshotReasonTitle,
} from './recoverySnapshots';

export type DataExportMode = CodexExportMode;

export type DataExportOptionModel = {
  mode: DataExportMode;
  label: string;
};

export type DataExportSharePayload = {
  title: string;
  message: string;
};

export type DataImportReviewState = {
  canImport: boolean;
  error: string;
  previewText: WorldImportPreviewText | null;
};

export type DataExportDraftState = {
  canShare: boolean;
  isEdited: boolean;
  statusMessage: string;
};

export type DataExportTextOptions = {
  diagnosticsRuntime?: WorldDocumentDiagnosticsRuntime;
  diagnosticsStorageTarget?: string;
};

export type DataRecoverySnapshotRow = {
  id: string;
  reasonTitle: string;
  reasonPhrase: string;
  activeWorldName: string;
  countSummary: string;
  createdAtText: string;
  mobileSummaryText: string;
  restoreLabel: string;
  deleteLabel: string;
  latestPrefix: string;
};

export type DataRecoverySnapshotModel = {
  title: string;
  description: string;
  countLabel: string;
  emptyTitle: string;
  emptyDetail: string;
  rows: DataRecoverySnapshotRow[];
};

export type DataStorageStatusModel = {
  loadLine: string;
  saveLine: string;
  recoveryLine: string;
};

export type DataStorageStatusLoadState = {
  checkedAt: string;
  source: string;
};

export type DataStorageStatusRecoverySnapshot = Pick<
  RecoverySnapshotSummary,
  'createdAt' | 'reason'
>;

function getRecoverySnapshotCreatedAtTime(
  snapshot: Pick<RecoverySnapshotSummary, 'createdAt'>
): number {
  const time = Date.parse(snapshot.createdAt);
  return Number.isFinite(time) ? time : 0;
}

function compareRecoverySnapshotsByCreatedAtDescending(
  left: Pick<RecoverySnapshotSummary, 'createdAt'>,
  right: Pick<RecoverySnapshotSummary, 'createdAt'>
): number {
  return (
    getRecoverySnapshotCreatedAtTime(right) -
    getRecoverySnapshotCreatedAtTime(left)
  );
}

export const dataExportOptions: readonly DataExportOptionModel[] =
  codexExportOptions.map((option) => ({
    mode: option.mode,
    label: option.label,
  }));

export const dataRecoverySnapshotCopy = {
  title: 'Recovery snapshots',
  description:
    'Recovery snapshots are saved before import, reset, selected snapshot restore, and permanent deletes for this local document.',
  emptyTitle: 'No recovery snapshots yet.',
  emptyDetail:
    'A snapshot is created automatically before import, reset, restore, and delete actions.',
  restoreLabel: 'Restore Snapshot',
  deleteLabel: 'Delete Snapshot',
} as const;

export const dataImportCopy = {
  title: 'Import JSON backup',
  kicker: 'Validated import',
  fileLabel: 'Choose JSON file',
  textAreaLabel: 'Backup JSON',
  placeholder: 'Paste a Valgaron World Codex JSON backup',
  previewLabel: 'Preview Import',
  importLabel: 'Import Backup',
  clearLabel: 'Clear',
} as const;

export const dataExportCopy = {
  title: 'Export',
  shareLabel: 'Share Export',
  refreshLabel: 'Refresh Export',
  refreshedMessage: 'Refreshed the export text.',
  shareOpenedMessage: 'Opened the device share sheet.',
  shareUnavailableMessage:
    'Sharing is unavailable here. The export text is still ready to select and copy.',
  replaceEditedTitle: 'Replace edited export text?',
  replaceEditedMessage:
    'The visible export text has local edits that will be replaced by the selected export format.',
  refreshEditedTitle: 'Refresh export text?',
  refreshEditedMessage:
    'The visible export text has local edits that will be replaced by the latest generated export.',
} as const;

export const dataResetCopy = {
  title: 'Reset starter data',
  kicker: 'Destructive action',
  description:
    'Reset replaces the current local world document with neutral starter data. Export JSON first if you need a backup.',
  actionLabel: 'Reset Starter Data',
  accessibilityHint:
    'Replaces the current document with starter data after confirmation.',
} as const;

export function getDataExportText(
  document: WorldDocument,
  mode: DataExportMode,
  options: DataExportTextOptions = {}
): string {
  switch (mode) {
    case 'full-json':
      return serializeWorldDocumentBackup(document);
    case 'active-json':
      return serializeActiveWorldBackup(document);
    case 'markdown':
      return exportWorldToMarkdown(getActiveWorld(document));
    case 'diagnostics':
      return serializeWorldDocumentDiagnosticsReport(
        createWorldDocumentDiagnosticsReport({
          document,
          runtime: options.diagnosticsRuntime,
          storageTarget:
            options.diagnosticsStorageTarget ??
            localPersistenceCopy.deviceSaveTarget,
        })
      );
  }
}

export function getDataExportSharePayload(
  mode: DataExportMode,
  text: string
): DataExportSharePayload {
  const option = getCodexExportOption(mode);
  return {
    title: option.shareTitle,
    message: text,
  };
}

export function getDataExportDraftState(
  generatedText: string,
  visibleText: string
): DataExportDraftState {
  const isEdited = visibleText !== generatedText;
  return {
    canShare: visibleText.trim().length > 0,
    isEdited,
    statusMessage: isEdited
      ? 'Export text has local edits. Refresh it before sharing if you need the exact generated export.'
      : '',
  };
}

export function getNextVisibleExportText({
  currentGeneratedText,
  nextGeneratedText,
  visibleText,
}: {
  currentGeneratedText: string;
  nextGeneratedText: string;
  visibleText: string;
}): string {
  return visibleText === currentGeneratedText ? nextGeneratedText : visibleText;
}

export function getDataImportPreviewText(
  preview: WorldImportPreview
): WorldImportPreviewText {
  return formatWorldImportPreviewText(preview);
}

export function getDataImportReviewState(
  importText: string,
  importResult: WorldImportResult | null
): DataImportReviewState {
  if (!importText.trim() || !importResult) {
    return { canImport: false, error: '', previewText: null };
  }
  if (!importResult.ok) {
    return {
      canImport: false,
      error: importResult.error,
      previewText: null,
    };
  }
  return {
    canImport: true,
    error: '',
    previewText: getDataImportPreviewText(importResult.preview),
  };
}

export function getDataRecoverySnapshotModel(
  snapshots: readonly RecoverySnapshotSummary[]
): DataRecoverySnapshotModel {
  const rows = [...snapshots]
    .sort(compareRecoverySnapshotsByCreatedAtDescending)
    .map((snapshot, index) => {
      const reasonPhrase = getRecoverySnapshotReasonPhrase(snapshot.reason);
      const countSummary = `${snapshot.worldCount} world${
        snapshot.worldCount === 1 ? '' : 's'
      }, ${snapshot.entryCount} entries, ${
        snapshot.relationshipCount
      } relationships`;
      const createdAtText = formatUpdatedAt(snapshot.createdAt);
      return {
        id: snapshot.id,
        reasonTitle: getRecoverySnapshotReasonTitle(snapshot.reason),
        reasonPhrase,
        activeWorldName: snapshot.activeWorldName,
        countSummary,
        createdAtText,
        mobileSummaryText: `Recovery snapshot ${reasonPhrase}: ${snapshot.activeWorldName}, ${snapshot.entryCount} entries, ${snapshot.relationshipCount} relationships, saved ${createdAtText}.`,
        restoreLabel: dataRecoverySnapshotCopy.restoreLabel,
        deleteLabel: dataRecoverySnapshotCopy.deleteLabel,
        latestPrefix: index === 0 ? 'Latest: ' : 'Older: ',
      };
    });

  return {
    title: dataRecoverySnapshotCopy.title,
    description: dataRecoverySnapshotCopy.description,
    countLabel: `${snapshots.length} saved recovery point${
      snapshots.length === 1 ? '' : 's'
    }`,
    emptyTitle: dataRecoverySnapshotCopy.emptyTitle,
    emptyDetail: dataRecoverySnapshotCopy.emptyDetail,
    rows,
  };
}

export function getDataStorageStatusModel({
  lastRecoverySnapshot,
  loadStatus,
  recoverySnapshotCount,
  recoverySnapshots,
  saveLineLabel = 'Device save',
  saveMessage,
}: {
  lastRecoverySnapshot?: DataStorageStatusRecoverySnapshot | null;
  loadStatus: DataStorageStatusLoadState;
  recoverySnapshotCount?: number;
  recoverySnapshots?: readonly DataStorageStatusRecoverySnapshot[];
  saveLineLabel?: string;
  saveMessage: string;
}): DataStorageStatusModel {
  const availableSnapshots =
    recoverySnapshots ?? (lastRecoverySnapshot ? [lastRecoverySnapshot] : []);
  const latestRecoverySnapshot =
    lastRecoverySnapshot ??
    [...availableSnapshots].sort(
      compareRecoverySnapshotsByCreatedAtDescending
    )[0] ??
    null;
  const snapshotCount = recoverySnapshotCount ?? availableSnapshots.length;
  const snapshotLabel =
    snapshotCount === 1 ? '1 snapshot' : `${snapshotCount} snapshots`;
  return {
    loadLine: `Load state: ${loadStatus.source}, checked ${formatUpdatedAt(
      loadStatus.checkedAt
    )}.`,
    saveLine: `${saveLineLabel}: ${saveMessage}`,
    recoveryLine: latestRecoverySnapshot
      ? `Recovery snapshots: ${snapshotLabel} saved, latest ${getRecoverySnapshotReasonPhrase(
          latestRecoverySnapshot.reason
        )}, saved ${formatUpdatedAt(latestRecoverySnapshot.createdAt)}.`
      : 'Recovery snapshots: none saved for this local document.',
  };
}
