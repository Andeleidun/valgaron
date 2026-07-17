import { afterEach, describe, expect, it, jest } from '@jest/globals';
import { createSeedWorldDocument } from '@valgaron/core';
import { cleanupBrowserImageAssets } from './imageAssetGarbageCollection';
import { browserImageAssetRepository } from './imageAssetStorage';

afterEach(() => {
  jest.restoreAllMocks();
});

describe('browser image asset garbage collection', () => {
  it('keeps history, recovery, and staged assets while removing orphans', async () => {
    const present = createSeedWorldDocument();
    const historical = {
      ...present,
      assets: [
        {
          id: 'asset-history',
          uri: 'images/history.png',
          originalFilename: 'history.png',
          mediaType: 'image/png' as const,
          byteSize: 10,
          sha256: 'a'.repeat(64),
          createdAt: '2026-07-17T00:00:00.000Z',
        },
      ],
    };
    const recovery = {
      ...present,
      assets: [
        {
          ...historical.assets[0],
          id: 'asset-recovery',
          uri: 'images/recovery.png',
        },
      ],
    };
    jest
      .spyOn(browserImageAssetRepository, 'listIds')
      .mockResolvedValue([
        'asset-history',
        'asset-recovery',
        'asset-staged',
        'asset-orphan',
      ]);
    const remove = jest
      .spyOn(browserImageAssetRepository, 'remove')
      .mockResolvedValue(true);

    await expect(
      cleanupBrowserImageAssets(present, {
        retainedDocuments: [historical],
        snapshots: [
          {
            id: 'snapshot-1',
            reason: 'reset',
            createdAt: '2026-07-17T00:00:00.000Z',
            document: recovery,
          },
        ],
        stagedAssetIds: ['asset-staged'],
      })
    ).resolves.toBe(1);
    expect(remove).toHaveBeenCalledTimes(1);
    expect(remove).toHaveBeenCalledWith('asset-orphan');
  });
});
