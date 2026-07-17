import { describe, expect, it, jest } from '@jest/globals';
import {
  discardDocumentDraftRegistrations,
  createDocumentDraftRegistry,
  getDocumentDraftAggregate,
  type DocumentDraftRegistration,
} from './documentDraftState';

function registration(
  overrides: Partial<DocumentDraftRegistration> = {}
): DocumentDraftRegistration {
  return {
    isDirty: false,
    onDiscard: jest.fn(),
    stagedAssetIds: [],
    ...overrides,
  };
}

describe('document draft coordination', () => {
  it('aggregates dirty drafts and deduplicates their staged assets', () => {
    const aggregate = getDocumentDraftAggregate([
      registration({ isDirty: true, stagedAssetIds: ['asset-a', 'asset-b'] }),
      registration({ isDirty: true, stagedAssetIds: ['asset-b', ''] }),
      registration({ stagedAssetIds: ['clean-asset'] }),
    ]);

    expect(aggregate).toEqual({
      dirtyCount: 2,
      hasDirtyDraft: true,
      stagedAssetIds: ['asset-a', 'asset-b'],
    });
  });

  it('discards only dirty registrations', () => {
    const dirtyDiscard = jest.fn();
    const cleanDiscard = jest.fn();

    discardDocumentDraftRegistrations([
      registration({ isDirty: true, onDiscard: dirtyDiscard }),
      registration({ onDiscard: cleanDiscard }),
    ]);

    expect(dirtyDiscard).toHaveBeenCalledTimes(1);
    expect(cleanDiscard).not.toHaveBeenCalled();
  });

  it('aggregates replacements and ignores stale unregister callbacks', () => {
    const registry = createDocumentDraftRegistry();
    const unregisterOld = registry.register(
      'editor',
      registration({ isDirty: true, stagedAssetIds: ['asset-old'] })
    );
    const unregisterCurrent = registry.register(
      'editor',
      registration({ isDirty: true, stagedAssetIds: ['asset-current'] })
    );

    expect(unregisterOld()).toBe(false);
    expect(registry.getAggregate()).toEqual({
      dirtyCount: 1,
      hasDirtyDraft: true,
      stagedAssetIds: ['asset-current'],
    });
    expect(unregisterCurrent()).toBe(true);
    expect(registry.getAggregate()).toEqual({
      dirtyCount: 0,
      hasDirtyDraft: false,
      stagedAssetIds: [],
    });
  });
});
