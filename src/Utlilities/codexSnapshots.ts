import type {
  RecoverySnapshot,
  RecoverySnapshotReason,
  RecoverySnapshotSummary,
  WorldDocument,
} from '../types';
import { getEntries } from './codexEntries';
import { browserLocalStorageAdapter } from './storageAdapter';
import { getActiveWorld, parseWorldDocument } from './worldDocument';

export const RECOVERY_SNAPSHOT_STORAGE_KEY = 'valgaron.recoverySnapshots.v1';
export const MAX_RECOVERY_SNAPSHOTS = 12;

const SNAPSHOT_REASONS: readonly RecoverySnapshotReason[] = [
  'import',
  'reset',
  'permanent-delete',
  'relationship-delete',
  'restore',
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isValidDateString(value: string): boolean {
  return Number.isFinite(Date.parse(value));
}

function isSnapshotReason(value: unknown): value is RecoverySnapshotReason {
  return (
    typeof value === 'string' &&
    SNAPSHOT_REASONS.includes(value as RecoverySnapshotReason)
  );
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
    !isSnapshotReason(reason) ||
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

export function summarizeRecoverySnapshot(
  snapshot: RecoverySnapshot
): RecoverySnapshotSummary {
  const activeWorld = getActiveWorld(snapshot.document);
  return {
    id: snapshot.id,
    reason: snapshot.reason,
    createdAt: snapshot.createdAt,
    activeWorldName: activeWorld.name,
    worldCount: snapshot.document.worlds.length,
    entryCount: snapshot.document.worlds.reduce(
      (total, world) =>
        total +
        world.entryTypes.reduce(
          (entryTotal, section) =>
            entryTotal + getEntries(world.codex, section.id).length,
          0
        ),
      0
    ),
    relationshipCount: snapshot.document.worlds.reduce(
      (total, world) => total + world.relationships.length,
      0
    ),
  };
}

export function summarizeRecoverySnapshots(
  snapshots: readonly RecoverySnapshot[]
): RecoverySnapshotSummary[] {
  return snapshots.map(summarizeRecoverySnapshot);
}
