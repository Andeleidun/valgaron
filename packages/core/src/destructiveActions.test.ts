import { describe, expect, it } from '@jest/globals';
import {
  destructiveActionCopy,
  formatDestructiveActionTitle,
  getDestructiveActionCopy,
} from './destructiveActions';

describe('destructive action copy', () => {
  it('requires confirmation copy for every destructive local workflow', () => {
    expect(Object.keys(destructiveActionCopy).sort()).toEqual([
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

  it('keeps data-loss actions explicit about recovery snapshots', () => {
    for (const copy of Object.values(destructiveActionCopy)) {
      expect(copy.message).toContain('recovery snapshot');
    }
  });

  it('formats subject-specific dialog titles', () => {
    expect(formatDestructiveActionTitle('delete-entry', 'Mira Rowan')).toBe(
      'Delete Mira Rowan?'
    );
    expect(formatDestructiveActionTitle('reset-document')).toBe('Reset Codex');
    expect(getDestructiveActionCopy('delete-entry-type').confirmLabel).toBe(
      'Delete Type'
    );
  });
});
