import type {
  RecoverySnapshot,
  RecoverySnapshotReason,
  RecoverySnapshotSummary,
} from './types';
import { getEntries } from './codexEntries';
import { getActiveWorld } from './worldDocument';

export const recoverySnapshotReasons = [
  'import',
  'reset',
  'permanent-delete',
  'relationship-delete',
  'restore',
  'workspace-delete',
  'planetary-world-delete',
  'entry-type-delete',
] as const satisfies readonly RecoverySnapshotReason[];

const recoverySnapshotReasonLabels: Record<
  RecoverySnapshotReason,
  { title: string; phrase: string }
> = {
  import: { title: 'Before import', phrase: 'before import' },
  reset: { title: 'Before reset', phrase: 'before reset' },
  'permanent-delete': {
    title: 'Before entry delete',
    phrase: 'before entry delete',
  },
  'relationship-delete': {
    title: 'Before relationship delete',
    phrase: 'before relationship delete',
  },
  restore: {
    title: 'Before snapshot restore',
    phrase: 'before snapshot restore',
  },
  'workspace-delete': {
    title: 'Before workspace delete',
    phrase: 'before workspace delete',
  },
  'planetary-world-delete': {
    title: 'Before in-fiction world delete',
    phrase: 'before in-fiction world delete',
  },
  'entry-type-delete': {
    title: 'Before custom entry type delete',
    phrase: 'before custom entry type delete',
  },
};

export function isRecoverySnapshotReason(
  value: unknown
): value is RecoverySnapshotReason {
  return (
    typeof value === 'string' &&
    recoverySnapshotReasons.includes(value as RecoverySnapshotReason)
  );
}

export function getRecoverySnapshotReasonTitle(
  reason: RecoverySnapshotReason
): string {
  return recoverySnapshotReasonLabels[reason].title;
}

export function getRecoverySnapshotReasonPhrase(
  reason: RecoverySnapshotReason
): string {
  return recoverySnapshotReasonLabels[reason].phrase;
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
