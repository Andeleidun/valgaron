import {
  getRetainedAssetIds,
  type RecoverySnapshot,
  type WorldDocument,
  type WorldImageAsset,
} from '@valgaron/core';
import { loadRecoverySnapshots } from './codexSnapshots';
import { browserImageAssetRepository } from './imageAssetStorage';

export async function cleanupBrowserImageAssets(
  document: WorldDocument,
  {
    retainedDocuments = [],
    snapshots = loadRecoverySnapshots(),
    stagedAssetIds = [],
  }: {
    retainedDocuments?: readonly WorldDocument[];
    snapshots?: readonly RecoverySnapshot[];
    stagedAssetIds?: readonly string[];
  } = {}
): Promise<number> {
  const retained = getRetainedAssetIds(document, snapshots, retainedDocuments);
  stagedAssetIds.forEach((assetId) => retained.add(assetId));
  const ids = await browserImageAssetRepository.listIds();
  let removed = 0;
  for (const id of ids) {
    if (!retained.has(id) && (await browserImageAssetRepository.remove(id))) {
      removed += 1;
    }
  }
  return removed;
}

export async function discardBrowserStagedImageAssets(
  assets: readonly WorldImageAsset[] = []
): Promise<void> {
  await Promise.all(
    assets.map((asset) => browserImageAssetRepository.remove(asset.id))
  );
}
