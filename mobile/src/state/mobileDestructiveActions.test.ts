import { describe, expect, it } from '@jest/globals';
import {
  getMobileDataActionResultMessage,
  mobileDataActionResultMessages,
  mobileDestructiveActionCopy,
  mobileRecoverySnapshotSaveFailedMessage,
} from './mobileDestructiveActions';

describe('mobile destructive action copy', () => {
  it('requires confirmation copy for every destructive mobile workflow', () => {
    expect(Object.keys(mobileDestructiveActionCopy).sort()).toEqual([
      'delete-entry',
      'delete-entry-type',
      'delete-planetary-world',
      'delete-relationship',
      'delete-snapshot',
      'delete-workspace',
      'import-document',
      'reset-document',
      'restore-snapshot',
    ]);
  });

  it('mentions recovery snapshots for data-loss actions', () => {
    for (const copy of Object.values(mobileDestructiveActionCopy)) {
      expect(copy.message).toContain('recovery snapshot');
    }
  });

  it('keeps mobile data action result messages local and recovery-aware', () => {
    expect(Object.keys(mobileDataActionResultMessages).sort()).toEqual([
      'import-document',
      'reset-document',
      'restore-snapshot',
    ]);
    expect(getMobileDataActionResultMessage('import-document')).toContain(
      'on this device'
    );
    expect(getMobileDataActionResultMessage('reset-document')).toContain(
      'recovery snapshot'
    );
    expect(getMobileDataActionResultMessage('restore-snapshot')).toContain(
      'previous document'
    );
    expect(mobileRecoverySnapshotSaveFailedMessage).toContain('Export JSON');
  });
});
