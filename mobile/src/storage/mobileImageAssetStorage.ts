import { Directory, File, Paths } from 'expo-file-system';
import * as Crypto from 'expo-crypto';
import * as ImagePicker from 'expo-image-picker';
import {
  createImageAssetIdentity,
  detectImageMediaType,
  MAX_IMAGE_FILE_BYTES,
  type WorldImageAsset,
  type RecoverySnapshot,
  type WorldDocument,
  getRetainedAssetIds,
} from '@valgaron/core';
import type { BinaryAssetRepository } from '@valgaron/platform';

const assetDirectory = new Directory(Paths.document, 'valgaron-image-assets');

function ensureAssetDirectory(): void {
  assetDirectory.create({ idempotent: true, intermediates: true });
}

function assetFile(assetId: string): File {
  return new File(assetDirectory, `${assetId}.bin`);
}

export const mobileImageAssetRepository: BinaryAssetRepository = {
  async read(assetId) {
    try {
      const file = assetFile(assetId);
      if (!file.exists) return null;
      return {
        bytes: await file.bytes(),
        mediaType: 'application/octet-stream',
      };
    } catch {
      return null;
    }
  },
  async write(assetId, asset) {
    try {
      ensureAssetDirectory();
      const file = assetFile(assetId);
      file.create({ overwrite: true, intermediates: true });
      file.write(asset.bytes);
      return true;
    } catch {
      return false;
    }
  },
  async remove(assetId) {
    try {
      const file = assetFile(assetId);
      if (file.exists) file.delete();
      return true;
    } catch {
      return false;
    }
  },
  async listIds() {
    try {
      if (!assetDirectory.exists) return [];
      return assetDirectory
        .list()
        .filter((item): item is File => item instanceof File)
        .map((file) => file.name.replace(/\.bin$/, ''));
    } catch {
      return [];
    }
  },
};

export function getMobileImageAssetUri(assetId: string): string | null {
  try {
    const file = assetFile(assetId);
    return file.exists ? file.uri : null;
  } catch {
    return null;
  }
}

async function sha256Hex(bytes: Uint8Array): Promise<string> {
  const digest = await Crypto.digest(
    Crypto.CryptoDigestAlgorithm.SHA256,
    new Uint8Array(bytes).buffer
  );
  return [...new Uint8Array(digest)]
    .map((value) => value.toString(16).padStart(2, '0'))
    .join('');
}

export type MobilePickedImageResult =
  | { ok: true; asset: WorldImageAsset }
  | { ok: false; canceled?: boolean; error: string };

export async function pickAndStoreMobileImage(): Promise<MobilePickedImageResult> {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsMultipleSelection: false,
    exif: false,
    quality: 1,
  });
  if (result.canceled || !result.assets[0]) {
    return { ok: false, canceled: true, error: 'Image selection canceled.' };
  }
  const picked = result.assets[0];
  try {
    const source = new File(picked.uri);
    const bytes = await source.bytes();
    if (bytes.byteLength <= 0 || bytes.byteLength > MAX_IMAGE_FILE_BYTES) {
      return {
        ok: false,
        error: 'Images must be non-empty and 10 MB or smaller.',
      };
    }
    const mediaType = detectImageMediaType(bytes);
    if (!mediaType) {
      return {
        ok: false,
        error: 'Choose a JPEG, PNG, WebP, or GIF image. SVG is not supported.',
      };
    }
    if (picked.mimeType && picked.mimeType !== mediaType) {
      return {
        ok: false,
        error: 'The image contents do not match its media type.',
      };
    }
    const identity = createImageAssetIdentity(mediaType, Crypto.randomUUID());
    const asset: WorldImageAsset = {
      ...identity,
      originalFilename:
        picked.fileName ?? `image.${identity.uri.split('.').pop()}`,
      mediaType,
      byteSize: bytes.byteLength,
      sha256: await sha256Hex(bytes),
      createdAt: new Date().toISOString(),
    };
    return (await mobileImageAssetRepository.write(asset.id, {
      bytes,
      mediaType,
    }))
      ? { ok: true, asset }
      : { ok: false, error: 'The image could not be copied into app storage.' };
  } catch {
    return { ok: false, error: 'The selected image could not be read.' };
  }
}

export async function getMobileSha256(bytes: Uint8Array): Promise<string> {
  return sha256Hex(bytes);
}

export async function cleanupMobileImageAssets(
  document: WorldDocument,
  snapshots: readonly RecoverySnapshot[] = []
): Promise<number> {
  const retained = getRetainedAssetIds(document, snapshots);
  const ids = await mobileImageAssetRepository.listIds();
  let removed = 0;
  for (const id of ids) {
    if (!retained.has(id) && (await mobileImageAssetRepository.remove(id))) {
      removed += 1;
    }
  }
  return removed;
}

export async function discardMobileStagedImageAssets(
  assets: readonly WorldImageAsset[] = []
): Promise<void> {
  await Promise.all(
    assets.map((asset) => mobileImageAssetRepository.remove(asset.id))
  );
}
