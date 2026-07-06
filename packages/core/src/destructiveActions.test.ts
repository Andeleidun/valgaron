import { describe, expect, it } from '@jest/globals';
import {
  destructiveActionCopy,
  formatDestructiveActionTitle,
  getDestructiveActionCopy,
} from './destructiveActions';

describe('destructive action copy', () => {
  it('requires confirmation copy for every destructive local workflow', () => {
    expect(Object.keys(destructiveActionCopy).sort()).toEqual([
      'clear-hidden-entry-details',
      'delete-entry',
      'delete-entry-type',
      'delete-planetary-world',
      'delete-relationship',
      'delete-snapshot',
      'delete-workspace',
      'import-document',
      'remove-entry-type-field',
      'reset-document',
      'restore-snapshot',
    ]);
  });

  it('keeps data-loss actions explicit about recovery snapshots', () => {
    for (const [actionId, copy] of Object.entries(destructiveActionCopy)) {
      if (actionId === 'remove-entry-type-field') {
        expect(copy.message).toContain('hidden details');
      } else {
        expect(copy.message).toContain('recovery snapshot');
      }
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
    expect(
      formatDestructiveActionTitle('remove-entry-type-field', 'Power')
    ).toBe('Remove Power?');
    expect(
      formatDestructiveActionTitle('clear-hidden-entry-details', 'unused')
    ).toBe('Clear hidden detail values?');
  });
});
