import {
  createImageAssetIdentity,
  detectImageMediaType,
  MAX_IMAGE_FILE_BYTES,
  type WorldImageAsset,
} from '@valgaron/core';
import { writeImageAsset } from './imageAssetStorage';

export type PreparedImageUploadResult =
  | { ok: true; asset: WorldImageAsset }
  | { ok: false; error: string };

export async function sha256Hex(bytes: Uint8Array): Promise<string> {
  if (typeof crypto === 'undefined' || !crypto.subtle) {
    throw new Error('Secure image hashing is unavailable in this browser.');
  }
  const copied = new Uint8Array(bytes);
  const digest = await crypto.subtle.digest('SHA-256', copied.buffer);
  return [...new Uint8Array(digest)]
    .map((value) => value.toString(16).padStart(2, '0'))
    .join('');
}

export async function prepareAndStoreImageFile(
  file: File
): Promise<PreparedImageUploadResult> {
  if (file.size <= 0) {
    return { ok: false, error: 'Choose a non-empty image file.' };
  }
  if (file.size > MAX_IMAGE_FILE_BYTES) {
    return { ok: false, error: 'Images must be 10 MB or smaller.' };
  }
  const bytes = new Uint8Array(await file.arrayBuffer());
  const mediaType = detectImageMediaType(bytes);
  if (!mediaType) {
    return {
      ok: false,
      error: 'Choose a JPEG, PNG, WebP, or GIF image. SVG is not supported.',
    };
  }
  if (file.type && file.type !== mediaType) {
    return {
      ok: false,
      error: 'The image contents do not match the file media type.',
    };
  }
  try {
    const identity = createImageAssetIdentity(mediaType);
    const asset: WorldImageAsset = {
      ...identity,
      originalFilename:
        file.name.trim() || `image.${identity.uri.split('.').pop()}`,
      mediaType,
      byteSize: bytes.byteLength,
      sha256: await sha256Hex(bytes),
      createdAt: new Date().toISOString(),
    };
    const didWrite = await writeImageAsset(asset.id, { bytes, mediaType });
    return didWrite
      ? { ok: true, asset }
      : {
          ok: false,
          error:
            'The image could not be saved in browser storage. Check available storage and try again.',
        };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : 'The image could not be prepared.',
    };
  }
}
