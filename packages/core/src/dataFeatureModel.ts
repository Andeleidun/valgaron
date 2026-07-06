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
  isCodexExportMode,
  serializeActiveWorldBackup,
  serializeWorldDocumentBackup,
  type WorldImportPreviewText,
} from './codexDataPortability';
import {
  createWorldDocumentDiagnosticsReport,
  serializeWorldDocumentDiagnosticsReport,
  type WorldDocumentDiagnostics,
  type WorldDocumentDiagnosticsRuntime,
} from './documentDiagnostics';
import type { WorldDocument } from './types';
import type { RecoverySnapshotSummary } from './types';
import { localPersistenceCopy } from './shell';
import { getActiveWorld } from './worldDocument';
import { formatUpdatedAt } from './codexEntries';
import { pluralizeCountLabel } from './featureDisplayLimits';
import {
  getRecoverySnapshotReasonPhrase,
  getRecoverySnapshotReasonTitle,
} from './recoverySnapshots';
import type { DestructiveActionId } from './destructiveActions';

export type DataExportMode = CodexExportMode;

export type DataExportOptionModel = {
  mode: DataExportMode;
  label: string;
};

export type DataShellExportAction = {
  downloadLabel: string;
  heading: string;
  mode: Exclude<DataExportMode, 'diagnostics'>;
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
  confirmationSubject: string;
  countSummary: string;
  createdAtText: string;
  mobileSummaryText: string;
  restoreLabel: string;
  restoreAccessibilityLabel: string;
  restoreAccessibilityHint: string;
  deleteLabel: string;
  deleteAccessibilityLabel: string;
  deleteAccessibilityHint: string;
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
  currentWorkspaceLine: string;
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

export type DataActionResultId = Extract<
  DestructiveActionId,
  'delete-snapshot' | 'import-document' | 'reset-document' | 'restore-snapshot'
>;

export const dataExportSectionIds = {
  'active-json': 'active-json-export',
  'full-json': 'full-json-export',
  markdown: 'markdown-export',
  diagnostics: 'diagnostics-export',
} as const satisfies Record<DataExportMode, string>;

export const dataRouteFocusTargetIds = {
  export: 'export',
  importJsonBackup: 'import-json-backup',
} as const;

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

const dataShellExportActionModes: readonly Exclude<
  DataExportMode,
  'diagnostics'
>[] = ['active-json', 'full-json', 'markdown'];

export const dataShellExportActions: readonly DataShellExportAction[] =
  dataShellExportActionModes.map((mode) => {
    const option = getCodexExportOption(mode);
    return {
      downloadLabel: option.downloadLabel,
      heading: option.heading,
      mode,
    };
  });

export const dataShellMenuCopy = {
  triggerLabel: 'Data Menu',
  menuAccessibilityLabel: 'Data actions',
  importJsonBackupLabel: 'Import JSON Backup',
  downloadUnavailableMessage:
    'Download is unavailable in this runtime; open Data for copyable exports.',
} as const;

export function formatDataShellDownloadResultMessage({
  didDownload,
  successLabel,
}: {
  didDownload: boolean;
  successLabel: string;
}): string {
  return didDownload
    ? `${successLabel} downloaded.`
    : dataShellMenuCopy.downloadUnavailableMessage;
}

export const dataRecoverySnapshotCopy = {
  title: 'Recovery snapshots',
  description:
    'Recovery snapshots are saved before import, reset, selected snapshot restore, and permanent deletes for this local document.',
  emptyTitle: 'No recovery snapshots yet.',
  emptyDetail:
    'A snapshot is created automatically before import, reset, restore, and delete actions.',
  restoreLabel: 'Restore Snapshot',
  restoreAccessibilityHint:
    'Restores this saved recovery snapshot after confirmation.',
  deleteLabel: 'Delete Snapshot',
  deleteAccessibilityHint: 'Deletes this recovery snapshot after confirmation.',
} as const;

export const dataActionResultMessages: Record<DataActionResultId, string> = {
  'import-document':
    'Imported backup on this device. A recovery snapshot was saved first.',
  'reset-document':
    'Starter data is open on this device. A recovery snapshot was saved first.',
  'restore-snapshot':
    'Restored the selected recovery snapshot. The previous document was saved as a new recovery snapshot first.',
  'delete-snapshot': 'Deleted the recovery snapshot from this device.',
};

export const dataRecoverySnapshotSaveFailedMessage =
  'Could not save the recovery snapshot to this device. Export JSON before continuing destructive edits.';
export const dataRecoverySnapshotUnavailableMessage =
  'No recovery snapshot is available on this device.';
export const dataRecoverySnapshotDeleteFailedMessage =
  'Could not delete the recovery snapshot from this device.';

export function getDataActionResultMessage(
  actionId: DataActionResultId
): string {
  return dataActionResultMessages[actionId];
}

export function getDataRouteFocusTargetId({
  focusId,
  mode,
}: {
  focusId?: string | null;
  mode?: string | null;
}): string {
  const normalizedFocusId = focusId?.trim() ?? '';
  if (!normalizedFocusId) {
    return '';
  }
  if (normalizedFocusId !== dataRouteFocusTargetIds.export) {
    return normalizedFocusId;
  }
  return isCodexExportMode(mode)
    ? dataExportSectionIds[mode]
    : dataExportSectionIds['active-json'];
}

export const dataImportCopy = {
  title: 'Import JSON backup',
  kicker: 'Validated import',
  fileLabel: 'Choose JSON file',
  textAreaLabel: 'Backup JSON',
  placeholder: 'Paste a Valgaron World Codex JSON backup',
  previewLabel: 'Preview Import',
  previewStatusLabel: 'Preview',
  importLabel: 'Import Backup',
  clearLabel: 'Clear',
  unsavedLabel: 'Unsaved',
  lastImportLabel: 'Last import',
  clearEditedTitle: 'Clear import text?',
  clearEditedMessage:
    'The pasted import text will be cleared from this screen.',
  clearAfterReplacementMessage:
    'The pasted import text will be cleared after this document replacement.',
  fileUnavailableMessage:
    'File import is unavailable in this runtime; paste the JSON backup instead.',
} as const;

export function formatDataImportFileLoadedMessage(filename: string): string {
  return `Loaded ${filename}. Review the preview before importing.`;
}

export function formatDataImportFileReadFailedMessage(
  filename: string
): string {
  return `Could not read ${filename}. Paste the JSON backup instead.`;
}

export const dataExportCopy = {
  title: 'Export',
  localOnlyReportKicker: 'Local-only report',
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

export const dataDownloadCopy = {
  exportUnavailableMessage:
    'Download is unavailable in this runtime; copy the export text instead.',
  diagnosticsUnavailableMessage:
    'Download is unavailable in this runtime; copy the diagnostics text instead.',
} as const;

export function formatDataDownloadSuccessMessage(filename: string): string {
  return `Downloaded ${filename}.`;
}

export const dataStorageCopy = {
  kicker: 'Storage status',
  title: 'Manual local save',
  manualSaveLineLabel: 'Manual save',
  manualSaveGuidance:
    'Edits stay in this session until you use the header Save button. Export JSON backups before clearing browser data, switching browsers, using private browsing, uninstalling the mobile app, or changing devices.',
  mobileCurrentWorkspaceLabel: 'Current workspace',
  mobileSavedTimestampLabel: 'Saved timestamp',
  diagnosticsLabel: 'Diagnostics',
  noRecoveryIssueMessage: 'No local storage recovery issue was found.',
  recoveryGuidance:
    'Recovery snapshots are saved before import, reset, permanent entry delete, relationship delete, and snapshot restore actions. Keep JSON exports as your device-independent backup.',
  storageLoadIssuesLabel: 'Storage load issues',
} as const;

export const dataHelpCopy = {
  kicker: 'Backup guidance',
  title: 'Help',
  backupHelpLabel: 'Backup Help',
  openHelpLabel: 'Open Help',
  leaveWithDraftTitle: 'Open Help?',
  leaveWithDraftMessage:
    'The pasted import text or edited export text may not be preserved after leaving Data.',
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

export function getDataDiagnosticsSummaryText(
  diagnostics: Pick<
    WorldDocumentDiagnostics,
    | 'archivedEntryCount'
    | 'relationshipCount'
    | 'totalEntryCount'
    | 'workspaceCount'
  >
): string {
  return `${diagnostics.workspaceCount} ${pluralizeCountLabel(
    diagnostics.workspaceCount,
    'workspace'
  )}, ${diagnostics.totalEntryCount} ${pluralizeCountLabel(
    diagnostics.totalEntryCount,
    'entry',
    'entries'
  )}, ${diagnostics.relationshipCount} ${pluralizeCountLabel(
    diagnostics.relationshipCount,
    'relationship'
  )}, ${diagnostics.archivedEntryCount} ${pluralizeCountLabel(
    diagnostics.archivedEntryCount,
    'archived entry',
    'archived entries'
  )}.`;
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
      const reasonTitle = getRecoverySnapshotReasonTitle(snapshot.reason);
      const confirmationSubject = `${reasonTitle} for ${snapshot.activeWorldName}`;
      const countSummary = `${snapshot.worldCount} world${
        snapshot.worldCount === 1 ? '' : 's'
      }, ${snapshot.entryCount} entries, ${
        snapshot.relationshipCount
      } relationships`;
      const createdAtText = formatUpdatedAt(snapshot.createdAt);
      return {
        id: snapshot.id,
        reasonTitle,
        reasonPhrase,
        activeWorldName: snapshot.activeWorldName,
        confirmationSubject,
        countSummary,
        createdAtText,
        mobileSummaryText: `Recovery snapshot ${reasonPhrase}: ${snapshot.activeWorldName}, ${snapshot.entryCount} entries, ${snapshot.relationshipCount} relationships, saved ${createdAtText}.`,
        restoreLabel: dataRecoverySnapshotCopy.restoreLabel,
        restoreAccessibilityLabel: `Restore ${confirmationSubject}`,
        restoreAccessibilityHint:
          dataRecoverySnapshotCopy.restoreAccessibilityHint,
        deleteLabel: dataRecoverySnapshotCopy.deleteLabel,
        deleteAccessibilityLabel: `Delete ${confirmationSubject}`,
        deleteAccessibilityHint:
          dataRecoverySnapshotCopy.deleteAccessibilityHint,
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
  currentWorkspaceName,
  lastRecoverySnapshot,
  loadStatus,
  recoverySnapshotCount,
  recoverySnapshots,
  savedAt,
  saveLineLabel = 'Device save',
  saveMessage,
}: {
  currentWorkspaceName?: string;
  lastRecoverySnapshot?: DataStorageStatusRecoverySnapshot | null;
  loadStatus: DataStorageStatusLoadState;
  recoverySnapshotCount?: number;
  recoverySnapshots?: readonly DataStorageStatusRecoverySnapshot[];
  savedAt?: string;
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
    currentWorkspaceLine:
      currentWorkspaceName && savedAt
        ? `${
            dataStorageCopy.mobileCurrentWorkspaceLabel
          }: ${currentWorkspaceName}. ${
            dataStorageCopy.mobileSavedTimestampLabel
          }: ${formatUpdatedAt(savedAt)}.`
        : '',
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
