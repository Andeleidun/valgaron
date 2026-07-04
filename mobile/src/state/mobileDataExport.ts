import type {
  DataExportMode,
  WorldDocumentDiagnosticsRuntime,
  WorldDocument,
} from '@valgaron/core';
import { getDataExportText, localPersistenceCopy } from '@valgaron/core';
import type {
  MobileDocumentLoadStatus,
  MobileRecoverySnapshot,
} from '../storage/mobileStorage';

export type MobileDiagnosticsContext = {
  loadStatus?: MobileDocumentLoadStatus;
  saveMessage?: string;
  lastRecoverySnapshot?: MobileRecoverySnapshot | null;
};

export function getMobileExportText(
  document: WorldDocument,
  mode: DataExportMode,
  diagnosticsContext: MobileDiagnosticsContext = {}
): string {
  return getDataExportText(document, mode, {
    diagnosticsRuntime: getMobileDiagnosticsRuntime(diagnosticsContext),
    diagnosticsStorageTarget: localPersistenceCopy.deviceSaveTarget,
  });
}

function getMobileDiagnosticsRuntime({
  lastRecoverySnapshot,
  loadStatus,
  saveMessage,
}: MobileDiagnosticsContext): WorldDocumentDiagnosticsRuntime {
  return {
    loadState: loadStatus?.source,
    loadCheckedAt: loadStatus?.checkedAt,
    saveState: saveMessage,
    recoverySnapshotAvailable: Boolean(lastRecoverySnapshot),
    recoverySnapshotReason: lastRecoverySnapshot?.reason,
    recoverySnapshotCreatedAt: lastRecoverySnapshot?.createdAt,
  };
}
