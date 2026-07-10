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
  'valgaron.mobile.worldDocument.v4';
export const LEGACY_MOBILE_WORLD_DOCUMENT_STORAGE_KEY =
  'valgaron.mobile.worldDocument.v3';
export const MOBILE_RECOVERY_SNAPSHOTS_STORAGE_KEY =
  'valgaron.mobile.recoverySnapshots.v2';
const MOBILE_RECOVERY_SNAPSHOT_LIMIT = 8;
let mobileSnapshotIdSequence = 0;

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
  const legacyLoaded = await loadJsonValue(
    storage,
    LEGACY_MOBILE_WORLD_DOCUMENT_STORAGE_KEY,
    parseWorldDocument,
    'Saved schema 3 data is not a valid Valgaron World Codex document.'
  );
  if (legacyLoaded.ok && legacyLoaded.value) {
    return {
      document: legacyLoaded.value,
      status: {
        source: loaded.ok ? 'saved' : 'recovered',
        message: `Loaded and migrated the schema 3 codex from ${localPersistenceCopy.deviceSaveTarget}. The schema 3 value remains available until schema 4 saves successfully.`,
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

export async function resetMobileE2EWorldDocument(
  storage: AsyncStringStorageAdapter
): Promise<MobileDocumentLoadResult> {
  const document = createSeedWorldDocument();
  const checkedAt = new Date().toISOString();
  await Promise.all([
    saveMobileWorldDocument(storage, document),
    storage.remove(MOBILE_RECOVERY_SNAPSHOTS_STORAGE_KEY),
  ]);
  return {
    document,
    status: {
      source: 'seed',
      message: 'Loaded deterministic mobile E2E starter data.',
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
  const snapshots = await loadMobileRecoverySnapshots(storage);
  const nextSnapshots = [
    snapshot,
    ...snapshots.filter((item) => item.id !== snapshot.id),
  ].slice(0, MOBILE_RECOVERY_SNAPSHOT_LIMIT);
  const didSave = await saveJsonValue(
    storage,
    MOBILE_RECOVERY_SNAPSHOTS_STORAGE_KEY,
    nextSnapshots
  );
  return didSave;
}

export async function loadMobileRecoverySnapshot(
  storage: AsyncStringStorageAdapter
): Promise<MobileRecoverySnapshot | null> {
  return (await loadMobileRecoverySnapshots(storage))[0] ?? null;
}

export async function loadMobileRecoverySnapshots(
  storage: AsyncStringStorageAdapter
): Promise<MobileRecoverySnapshot[]> {
  const loadedSnapshots = await loadJsonValue(
    storage,
    MOBILE_RECOVERY_SNAPSHOTS_STORAGE_KEY,
    parseMobileRecoverySnapshots,
    'Saved recovery snapshots are not valid Valgaron documents.'
  );
  if (loadedSnapshots.ok && loadedSnapshots.value) {
    return loadedSnapshots.value;
  }
  return [];
}

export async function deleteMobileRecoverySnapshot(
  storage: AsyncStringStorageAdapter
): Promise<boolean> {
  return storage.remove(MOBILE_RECOVERY_SNAPSHOTS_STORAGE_KEY);
}

export async function deleteMobileRecoverySnapshotById(
  storage: AsyncStringStorageAdapter,
  snapshotId: string
): Promise<boolean> {
  const snapshots = await loadMobileRecoverySnapshots(storage);
  if (!snapshots.some((snapshot) => snapshot.id === snapshotId)) {
    return false;
  }
  const nextSnapshots = snapshots.filter(
    (snapshot) => snapshot.id !== snapshotId
  );
  return saveJsonValue(
    storage,
    MOBILE_RECOVERY_SNAPSHOTS_STORAGE_KEY,
    nextSnapshots
  );
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

function parseMobileRecoverySnapshots(
  value: unknown
): MobileRecoverySnapshot[] | null {
  if (!Array.isArray(value)) {
    return null;
  }
  const snapshots = value.map(parseMobileRecoverySnapshot);
  if (snapshots.some((snapshot) => snapshot === null)) {
    return null;
  }
  return snapshots
    .filter((snapshot): snapshot is MobileRecoverySnapshot => snapshot !== null)
    .sort((first, second) => second.createdAt.localeCompare(first.createdAt));
}

function normalizeMobileRecoverySnapshotReason(
  value: string
): MobileRecoverySnapshotReason | null {
  return isRecoverySnapshotReason(value) ? value : null;
}

function createMobileSnapshotId(
  reason: MobileRecoverySnapshotReason,
  createdAt: string
): string {
  mobileSnapshotIdSequence += 1;
  return `mobile-snapshot-${reason}-${createdAt.replace(
    /[^0-9]/g,
    ''
  )}-${mobileSnapshotIdSequence}`;
}
