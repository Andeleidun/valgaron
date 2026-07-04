import type {
  RecoverySnapshot,
  RecoverySnapshotReason,
  WorldDocument,
  WorldImportResult,
} from '@valgaron/core';
import {
  createSeedWorldDocument,
  isRecoverySnapshotReason,
  localPersistenceCopy,
  parseWorldImport,
  parseWorldDocument,
} from '@valgaron/core';
import {
  loadJsonValue,
  saveJsonValue,
  type AsyncStringStorageAdapter,
} from '@valgaron/platform';

export const MOBILE_WORLD_DOCUMENT_STORAGE_KEY =
  'valgaron.mobile.worldDocument.v2';
export const MOBILE_RECOVERY_SNAPSHOT_STORAGE_KEY =
  'valgaron.mobile.recoverySnapshot.v1';

export type MobileDocumentLoadStatus = {
  source: 'saved' | 'seed' | 'recovered';
  message: string;
  checkedAt: string;
};

export type MobileDocumentLoadResult = {
  document: WorldDocument;
  status: MobileDocumentLoadStatus;
};

export type MobileRecoverySnapshotReason = RecoverySnapshotReason;

export type MobileRecoverySnapshot = RecoverySnapshot;

export async function loadMobileWorldDocument(
  storage: AsyncStringStorageAdapter
): Promise<MobileDocumentLoadResult> {
  const loaded = await loadJsonValue(
    storage,
    MOBILE_WORLD_DOCUMENT_STORAGE_KEY,
    parseWorldDocument,
    'Saved data is not a valid Valgaron World Codex document.'
  );
  const checkedAt = new Date().toISOString();
  if (loaded.ok && loaded.value) {
    return {
      document: loaded.value,
      status: {
        source: 'saved',
        message: `Loaded the saved codex from ${localPersistenceCopy.deviceSaveTarget}.`,
        checkedAt,
      },
    };
  }
  const document = createSeedWorldDocument();
  return {
    document,
    status: {
      source: loaded.ok ? 'seed' : 'recovered',
      message: loaded.ok
        ? `No saved mobile codex was found on ${localPersistenceCopy.deviceSaveTarget}, so starter data is open.`
        : `${loaded.error} Starter data is open until a valid import or save replaces it.`,
      checkedAt,
    },
  };
}

export async function saveMobileWorldDocument(
  storage: AsyncStringStorageAdapter,
  document: WorldDocument
): Promise<boolean> {
  return saveJsonValue(storage, MOBILE_WORLD_DOCUMENT_STORAGE_KEY, document);
}

export function createMobileRecoverySnapshot(
  document: WorldDocument,
  reason: MobileRecoverySnapshotReason
): MobileRecoverySnapshot {
  const createdAt = new Date().toISOString();
  return {
    id: createMobileSnapshotId(reason, createdAt),
    reason,
    createdAt,
    document,
  };
}

export async function saveMobileRecoverySnapshot(
  storage: AsyncStringStorageAdapter,
  snapshot: MobileRecoverySnapshot
): Promise<boolean> {
  return saveJsonValue(storage, MOBILE_RECOVERY_SNAPSHOT_STORAGE_KEY, snapshot);
}

export async function loadMobileRecoverySnapshot(
  storage: AsyncStringStorageAdapter
): Promise<MobileRecoverySnapshot | null> {
  const loaded = await loadJsonValue(
    storage,
    MOBILE_RECOVERY_SNAPSHOT_STORAGE_KEY,
    parseMobileRecoverySnapshot,
    'Saved recovery snapshot is not a valid Valgaron document.'
  );
  return loaded.ok ? loaded.value : null;
}

export async function deleteMobileRecoverySnapshot(
  storage: AsyncStringStorageAdapter
): Promise<boolean> {
  return storage.remove(MOBILE_RECOVERY_SNAPSHOT_STORAGE_KEY);
}

export type MobileImportResult = WorldImportResult;

export function parseMobileWorldImport(text: string): MobileImportResult {
  return parseWorldImport(text);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseMobileRecoverySnapshot(
  value: unknown
): MobileRecoverySnapshot | null {
  if (!isRecord(value)) {
    return null;
  }
  const reason = value.reason;
  const createdAt = value.createdAt;
  const document = parseWorldDocument(value.document);
  const normalizedReason =
    typeof reason === 'string'
      ? normalizeMobileRecoverySnapshotReason(reason)
      : null;
  if (
    !normalizedReason ||
    typeof createdAt !== 'string' ||
    Number.isNaN(Date.parse(createdAt)) ||
    !document
  ) {
    return null;
  }
  const id =
    typeof value.id === 'string'
      ? value.id
      : createMobileSnapshotId(normalizedReason, createdAt);
  return {
    id,
    reason: normalizedReason,
    createdAt,
    document,
  };
}

function normalizeMobileRecoverySnapshotReason(
  value: string
): MobileRecoverySnapshotReason | null {
  if (isRecoverySnapshotReason(value)) {
    return value;
  }
  return value === 'entry-delete' ? 'permanent-delete' : null;
}

function createMobileSnapshotId(
  reason: MobileRecoverySnapshotReason,
  createdAt: string
): string {
  return `mobile-snapshot-${reason}-${createdAt.replace(/[^0-9]/g, '')}`;
}
