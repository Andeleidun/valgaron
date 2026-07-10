import { getReachableImageAssets, MAX_ZIP_ASSET_BYTES } from './imageAssets';
import { getActiveWorld } from './worldDocument';
import type { WorldDocument, WorldImageAsset } from './types';

export type WorldZipBackupMode = 'active' | 'full';

export type WorldZipBackupPlan = {
  mode: WorldZipBackupMode;
  jsonFilename: string;
  jsonText: string;
  zipFilename: string;
  assets: readonly WorldImageAsset[];
  uploadedByteTotal: number;
};

export function createWorldZipBackupPlan({
  activeWorkspaceFilenameBase,
  document,
  jsonText,
  mode,
}: {
  activeWorkspaceFilenameBase: string;
  document: WorldDocument;
  jsonText: string;
  mode: WorldZipBackupMode;
}): WorldZipBackupPlan {
  const assets = getReachableImageAssets(
    document,
    mode === 'active' ? getActiveWorld(document) : undefined
  );
  const uploadedByteTotal = assets.reduce(
    (total, asset) => total + asset.byteSize,
    0
  );
  if (uploadedByteTotal > MAX_ZIP_ASSET_BYTES) {
    throw new Error('Uploaded images exceed the 100 MB ZIP package limit.');
  }
  return {
    mode,
    jsonFilename:
      mode === 'active'
        ? `${activeWorkspaceFilenameBase}.json`
        : 'valgaron-all-workspaces.json',
    jsonText,
    zipFilename:
      mode === 'active'
        ? `${activeWorkspaceFilenameBase}.zip`
        : 'valgaron-all-workspaces.zip',
    assets,
    uploadedByteTotal,
  };
}
