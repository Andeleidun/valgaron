import {
  isRecoverySnapshotReason,
  parseWorldDocument,
  type RecoverySnapshot,
  type RecoverySnapshotReason,
  summarizeRecoverySnapshot,
  summarizeRecoverySnapshots,
  type WorldDocument,
} from '@valgaron/core';
import { browserLocalStorageAdapter } from './storageAdapter';

export { summarizeRecoverySnapshot, summarizeRecoverySnapshots };

export const RECOVERY_SNAPSHOT_STORAGE_KEY = 'valgaron.recoverySnapshots.v1';
export const MAX_RECOVERY_SNAPSHOTS = 12;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isValidDateString(value: string): boolean {
  return Number.isFinite(Date.parse(value));
}

function parseRecoverySnapshot(value: unknown): RecoverySnapshot | null {
  if (!isRecord(value)) {
    return null;
  }
  const id = value.id;
  const reason = value.reason;
  const createdAt = value.createdAt;
  const document = parseWorldDocument(value.document);
  if (
    typeof id !== 'string' ||
    !isRecoverySnapshotReason(reason) ||
    typeof createdAt !== 'string' ||
    !isValidDateString(createdAt) ||
    !document
  ) {
    return null;
  }
  return {
    id,
    reason,
    createdAt,
    document,
  };
}

function readStoredSnapshotValue(): string | null {
  return browserLocalStorageAdapter.read(RECOVERY_SNAPSHOT_STORAGE_KEY);
}

function writeRecoverySnapshots(
  snapshots: readonly RecoverySnapshot[]
): boolean {
  return browserLocalStorageAdapter.write(
    RECOVERY_SNAPSHOT_STORAGE_KEY,
    JSON.stringify(snapshots)
  );
}

function sortSnapshots(
  snapshots: readonly RecoverySnapshot[]
): RecoverySnapshot[] {
  return [...snapshots].sort(
    (first, second) =>
      new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime()
  );
}

function createSnapshotId(reason: RecoverySnapshotReason, createdAt: string) {
  return [
    'snapshot',
    reason,
    createdAt.replace(/[^0-9]/g, ''),
    Math.random().toString(36).slice(2, 8),
  ].join('-');
}

export function loadRecoverySnapshots(): RecoverySnapshot[] {
  const storedValue = readStoredSnapshotValue();
  if (!storedValue) {
    return [];
  }
  try {
    const parsedValue: unknown = JSON.parse(storedValue);
    if (!Array.isArray(parsedValue)) {
      return [];
    }
    return sortSnapshots(
      parsedValue
        .map(parseRecoverySnapshot)
        .filter((snapshot): snapshot is RecoverySnapshot => snapshot !== null)
    ).slice(0, MAX_RECOVERY_SNAPSHOTS);
  } catch {
    return [];
  }
}

export function createRecoverySnapshot(
  document: WorldDocument,
  reason: RecoverySnapshotReason
): RecoverySnapshot {
  const createdAt = new Date().toISOString();
  return {
    id: createSnapshotId(reason, createdAt),
    reason,
    createdAt,
    document,
  };
}

export type AddRecoverySnapshotResult = {
  ok: boolean;
  snapshots: RecoverySnapshot[];
  snapshot: RecoverySnapshot;
};

export function addRecoverySnapshot(
  document: WorldDocument,
  reason: RecoverySnapshotReason
): AddRecoverySnapshotResult {
  const snapshot = createRecoverySnapshot(document, reason);
  const snapshots = sortSnapshots([snapshot, ...loadRecoverySnapshots()]).slice(
    0,
    MAX_RECOVERY_SNAPSHOTS
  );
  return {
    ok: writeRecoverySnapshots(snapshots),
    snapshots,
    snapshot,
  };
}

export function deleteRecoverySnapshot(snapshotId: string): RecoverySnapshot[] {
  const snapshots = loadRecoverySnapshots().filter(
    (snapshot) => snapshot.id !== snapshotId
  );
  writeRecoverySnapshots(snapshots);
  return snapshots;
}
