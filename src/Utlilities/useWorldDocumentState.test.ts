import { describe, expect, it } from '@jest/globals';
import { shouldPauseInitialSaveAfterLoad } from './useWorldDocumentState';
import type { WorldDocumentLoadStatus } from './codexStorage';

const checkedAt = '2026-06-01T00:00:00.000Z';

function loadStatus(
  status: Partial<WorldDocumentLoadStatus>
): WorldDocumentLoadStatus {
  return {
    state: 'loaded',
    source: 'current',
    message: 'Loaded.',
    issues: [],
    checkedAt,
    ...status,
  };
}

describe('world document state helpers', () => {
  it('pauses the first save only when fallback seed data replaced unreadable storage', () => {
    expect(
      shouldPauseInitialSaveAfterLoad(
        loadStatus({
          state: 'recovered',
          source: 'seed',
          issues: ['valgaron.worldDocument.v2 is not valid JSON.'],
        })
      )
    ).toBe(true);

    expect(
      shouldPauseInitialSaveAfterLoad(
        loadStatus({
          state: 'recovered',
          source: 'legacy',
          issues: ['valgaron.worldDocument.v2 is not valid JSON.'],
        })
      )
    ).toBe(false);

    expect(
      shouldPauseInitialSaveAfterLoad(
        loadStatus({
          state: 'empty',
          source: 'seed',
          issues: [],
        })
      )
    ).toBe(false);
  });
});
