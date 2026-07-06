import { describe, expect, it } from '@jest/globals';
import {
  getRecoverySnapshotReasonPhrase,
  getRecoverySnapshotReasonTitle,
  isRecoverySnapshotReason,
  recoverySnapshotReasons,
  summarizeRecoverySnapshot,
} from './recoverySnapshots';
import { createSeedWorldDocument } from './seedCodex';

describe('recovery snapshot summaries', () => {
  it('summarizes snapshot content for recovery UI', () => {
    expect(
      summarizeRecoverySnapshot({
        id: 'snapshot-reset-test',
        reason: 'reset',
        createdAt: '2026-06-01T00:00:00.000Z',
        document: createSeedWorldDocument(),
      })
    ).toEqual({
      id: 'snapshot-reset-test',
      reason: 'reset',
      createdAt: '2026-06-01T00:00:00.000Z',
      activeWorldName: 'Sample Atlas',
      worldCount: 1,
      entryCount: 10,
      relationshipCount: 5,
    });
  });

  it('keeps reason parsing and labels shared across web and mobile', () => {
    expect(recoverySnapshotReasons).toEqual([
      'import',
      'reset',
      'permanent-delete',
      'relationship-delete',
      'restore',
      'workspace-delete',
      'planetary-world-delete',
      'entry-type-delete',
      'schema-cleanup',
    ]);
    expect(isRecoverySnapshotReason('planetary-world-delete')).toBe(true);
    expect(isRecoverySnapshotReason('entry-delete')).toBe(false);
    expect(getRecoverySnapshotReasonTitle('entry-type-delete')).toBe(
      'Before custom entry type delete'
    );
    expect(getRecoverySnapshotReasonTitle('schema-cleanup')).toBe(
      'Before schema cleanup'
    );
    expect(getRecoverySnapshotReasonPhrase('permanent-delete')).toBe(
      'before entry delete'
    );
  });
});
