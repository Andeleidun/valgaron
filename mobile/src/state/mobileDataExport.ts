import type {
  CodexExportMode,
  WorldDocument,
  WorldImportResult,
} from '@valgaron/core';
import {
  codexExportOptions,
  createWorldDocumentDiagnosticsReport,
  exportWorldToMarkdown,
  getCodexExportOption,
  formatWorldImportPreviewText,
  getActiveWorld,
  localPersistenceCopy,
  serializeActiveWorldBackup,
  serializeWorldDocumentDiagnosticsReport,
  serializeWorldDocumentBackup,
} from '@valgaron/core';
import type {
  MobileDocumentLoadStatus,
  MobileRecoverySnapshot,
} from '../storage/mobileStorage';

export type MobileExportMode = CodexExportMode;

export type MobileExportOption = {
  mode: MobileExportMode;
  label: string;
};

export type MobileExportSharePayload = {
  title: string;
  message: string;
};

export type MobileImportPreviewText = {
  title: string;
  detail: string;
};

export type MobileImportReviewState = {
  canImport: boolean;
  error: string;
  previewText: MobileImportPreviewText | null;
};

export type MobileExportDraftState = {
  canShare: boolean;
  isEdited: boolean;
  statusMessage: string;
};

export type MobileDiagnosticsContext = {
  loadStatus?: MobileDocumentLoadStatus;
  saveMessage?: string;
  lastRecoverySnapshot?: MobileRecoverySnapshot | null;
};

export const mobileExportOptions: readonly MobileExportOption[] =
  codexExportOptions.map((option) => ({
    mode: option.mode,
    label: option.label,
  }));

export function getMobileExportText(
  document: WorldDocument,
  mode: MobileExportMode,
  diagnosticsContext: MobileDiagnosticsContext = {}
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
          runtime: getMobileDiagnosticsRuntime(diagnosticsContext),
          storageTarget: localPersistenceCopy.deviceSaveTarget,
        })
      );
  }
}

function getMobileDiagnosticsRuntime({
  lastRecoverySnapshot,
  loadStatus,
  saveMessage,
}: MobileDiagnosticsContext): NonNullable<
  Parameters<typeof createWorldDocumentDiagnosticsReport>[0]['runtime']
> {
  return {
    loadState: loadStatus?.source,
    loadCheckedAt: loadStatus?.checkedAt,
    saveState: saveMessage,
    recoverySnapshotAvailable: Boolean(lastRecoverySnapshot),
    recoverySnapshotReason: lastRecoverySnapshot?.reason,
    recoverySnapshotCreatedAt: lastRecoverySnapshot?.createdAt,
  };
}

export function getMobileExportSharePayload(
  mode: MobileExportMode,
  text: string
): MobileExportSharePayload {
  const option = getCodexExportOption(mode);
  return {
    title: option.shareTitle,
    message: text,
  };
}

export function getMobileExportDraftState(
  generatedText: string,
  visibleText: string
): MobileExportDraftState {
  const isEdited = visibleText !== generatedText;
  return {
    canShare: visibleText.trim().length > 0,
    isEdited,
    statusMessage: isEdited
      ? 'Export text has local edits. Refresh it before sharing if you need the exact generated export.'
      : '',
  };
}

export function getNextMobileVisibleExportText({
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

export function getMobileImportPreviewText(
  ...args: Parameters<typeof formatWorldImportPreviewText>
): MobileImportPreviewText {
  return formatWorldImportPreviewText(...args);
}

export function getMobileImportReviewState(
  importText: string,
  importResult: WorldImportResult | null
): MobileImportReviewState {
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
    previewText: getMobileImportPreviewText(importResult.preview),
  };
}
