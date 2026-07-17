import { makeLocalIdSuffix } from './ids';
import type {
  RecoverySnapshot,
  WorldDocument,
  WorldEntry,
  WorldImageAsset,
  WorldImageMediaType,
  WorldImageReference,
  WorldWorkspace,
} from './types';

export const MAX_IMAGES_PER_ENTRY = 6;
export const MAX_IMAGE_FILE_BYTES = 10 * 1024 * 1024;
export const MAX_ZIP_ASSET_BYTES = 100 * 1024 * 1024;

export const supportedImageMediaTypes = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
] as const satisfies readonly WorldImageMediaType[];

const IMAGE_URI_PATTERN = /^images\/(asset-[a-z0-9-]+)\.(jpg|png|webp|gif)$/;
const SHA256_PATTERN = /^[a-f0-9]{64}$/;

export type WorldImageSourceKind = 'remote' | 'uploaded';

export type ImageAssetCounts = {
  remoteImageCount: number;
  uploadedImageCount: number;
  assetMetadataCount: number;
  reachableUploadedByteTotal: number;
};

export function isSupportedImageMediaType(
  value: unknown
): value is WorldImageMediaType {
  return (
    typeof value === 'string' &&
    supportedImageMediaTypes.includes(value as WorldImageMediaType)
  );
}

export function getImageExtension(mediaType: WorldImageMediaType): string {
  switch (mediaType) {
    case 'image/jpeg':
      return 'jpg';
    case 'image/png':
      return 'png';
    case 'image/webp':
      return 'webp';
    case 'image/gif':
      return 'gif';
  }
}

export function detectImageMediaType(
  bytes: Uint8Array
): WorldImageMediaType | null {
  if (
    bytes.length >= 3 &&
    bytes[0] === 0xff &&
    bytes[1] === 0xd8 &&
    bytes[2] === 0xff
  ) {
    return 'image/jpeg';
  }
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return 'image/png';
  }
  const header = String.fromCharCode(...bytes.slice(0, 12));
  if (header.startsWith('GIF87a') || header.startsWith('GIF89a')) {
    return 'image/gif';
  }
  if (header.startsWith('RIFF') && header.slice(8, 12) === 'WEBP') {
    return 'image/webp';
  }
  return null;
}

export function isRemoteImageUri(uri: string): boolean {
  try {
    const parsed = new URL(uri);
    return (
      parsed.protocol === 'https:' &&
      Boolean(parsed.hostname) &&
      !parsed.username &&
      !parsed.password
    );
  } catch {
    return false;
  }
}

export function getUploadedAssetIdFromUri(uri: string): string | null {
  return IMAGE_URI_PATTERN.exec(uri)?.[1] ?? null;
}

export function isUploadedImageUri(uri: string): boolean {
  return getUploadedAssetIdFromUri(uri) !== null;
}

export function classifyImageUri(uri: string): WorldImageSourceKind | null {
  if (isRemoteImageUri(uri)) {
    return 'remote';
  }
  return isUploadedImageUri(uri) ? 'uploaded' : null;
}

export function createImageAssetIdentity(
  mediaType: WorldImageMediaType,
  suffix = makeLocalIdSuffix()
): { id: string; uri: string } {
  const id = `asset-${suffix}`;
  return { id, uri: `images/${id}.${getImageExtension(mediaType)}` };
}

export function createImageReference(
  input: Omit<WorldImageReference, 'id'>,
  suffix = makeLocalIdSuffix()
): WorldImageReference {
  return { id: `image-${suffix}`, ...input };
}

export function validateImageReference(
  image: WorldImageReference
): string | null {
  if (!image.id.trim()) {
    return 'Image reference id is required.';
  }
  if (!classifyImageUri(image.uri)) {
    return `Image reference "${image.id}" has an unsupported URI.`;
  }
  if (!image.decorative && !image.altText.trim()) {
    return `Image reference "${image.id}" requires alternative text.`;
  }
  if (image.decorative && image.altText.length > 0) {
    return `Decorative image reference "${image.id}" must use empty alternative text.`;
  }
  return null;
}

export function validateImageAsset(asset: WorldImageAsset): string | null {
  if (
    !asset.id.trim() ||
    getUploadedAssetIdFromUri(asset.uri) !== asset.id ||
    (isSupportedImageMediaType(asset.mediaType) &&
      asset.uri !== `images/${asset.id}.${getImageExtension(asset.mediaType)}`)
  ) {
    return `Image asset "${asset.id}" has an invalid generated URI.`;
  }
  if (!isSupportedImageMediaType(asset.mediaType)) {
    return `Image asset "${asset.id}" has an unsupported media type.`;
  }
  if (!asset.originalFilename.trim()) {
    return `Image asset "${asset.id}" requires an original filename.`;
  }
  if (
    !Number.isInteger(asset.byteSize) ||
    asset.byteSize <= 0 ||
    asset.byteSize > MAX_IMAGE_FILE_BYTES
  ) {
    return `Image asset "${asset.id}" has an invalid byte size.`;
  }
  if (!SHA256_PATTERN.test(asset.sha256)) {
    return `Image asset "${asset.id}" has an invalid SHA-256 value.`;
  }
  if (!Number.isFinite(Date.parse(asset.createdAt))) {
    return `Image asset "${asset.id}" has an invalid created date.`;
  }
  return null;
}

export function getWorkspaceEntries(world: WorldWorkspace): WorldEntry[] {
  return world.entryTypes.flatMap((section) => world.codex[section.id] ?? []);
}

export function getDocumentEntries(document: WorldDocument): WorldEntry[] {
  return document.worlds.flatMap(getWorkspaceEntries);
}

export function validateDocumentImageAssets(
  document: WorldDocument
): string | null {
  const assetIdSet = new Set<string>();
  const assetUriSet = new Set<string>();
  for (const asset of document.assets) {
    const error = validateImageAsset(asset);
    if (error) return error;
    if (assetIdSet.has(asset.id)) {
      return `Document contains duplicate image asset id "${asset.id}".`;
    }
    if (assetUriSet.has(asset.uri)) {
      return `Document contains duplicate image asset URI "${asset.uri}".`;
    }
    assetIdSet.add(asset.id);
    assetUriSet.add(asset.uri);
  }

  const assetByUri = new Map(
    document.assets.map((asset) => [asset.uri, asset])
  );
  for (const entry of getDocumentEntries(document)) {
    if (entry.images.length > MAX_IMAGES_PER_ENTRY) {
      return `Entry "${entry.id}" contains more than ${MAX_IMAGES_PER_ENTRY} images.`;
    }
    const referenceIds = new Set<string>();
    for (const image of entry.images) {
      const error = validateImageReference(image);
      if (error) return error;
      if (referenceIds.has(image.id)) {
        return `Entry "${entry.id}" contains duplicate image reference id "${image.id}".`;
      }
      referenceIds.add(image.id);
      if (isUploadedImageUri(image.uri) && !assetByUri.has(image.uri)) {
        return `Entry "${entry.id}" references missing image asset "${image.uri}".`;
      }
      if (isRemoteImageUri(image.uri) && assetByUri.has(image.uri)) {
        return `Remote image URI "${image.uri}" must not have uploaded asset metadata.`;
      }
    }
  }

  const referencedUploadedUris = new Set(
    getDocumentEntries(document).flatMap((entry) =>
      entry.images
        .filter((image) => isUploadedImageUri(image.uri))
        .map((image) => image.uri)
    )
  );
  const orphan = document.assets.find(
    (asset) => !referencedUploadedUris.has(asset.uri)
  );
  return orphan
    ? `Document contains unreferenced image asset "${orphan.id}".`
    : null;
}

export function getReachableImageAssets(
  document: WorldDocument,
  world?: WorldWorkspace
): WorldImageAsset[] {
  const entries = world
    ? getWorkspaceEntries(world)
    : getDocumentEntries(document);
  const uris = new Set(
    entries.flatMap((entry) =>
      entry.images
        .filter((image) => isUploadedImageUri(image.uri))
        .map((image) => image.uri)
    )
  );
  return document.assets.filter((asset) => uris.has(asset.uri));
}

export function getImageAssetCounts(document: WorldDocument): ImageAssetCounts {
  const images = getDocumentEntries(document).flatMap((entry) => entry.images);
  return {
    remoteImageCount: images.filter((image) => isRemoteImageUri(image.uri))
      .length,
    uploadedImageCount: images.filter((image) => isUploadedImageUri(image.uri))
      .length,
    assetMetadataCount: document.assets.length,
    reachableUploadedByteTotal: getReachableImageAssets(document).reduce(
      (total, asset) => total + asset.byteSize,
      0
    ),
  };
}

export function getRetainedAssetIds(
  document: WorldDocument,
  snapshots: readonly RecoverySnapshot[] = [],
  retainedDocuments: readonly WorldDocument[] = []
): Set<string> {
  return new Set(
    [
      document,
      ...retainedDocuments,
      ...snapshots.map((snapshot) => snapshot.document),
    ].flatMap((item) => item.assets.map((asset) => asset.id))
  );
}

export function moveImageReference(
  images: readonly WorldImageReference[],
  imageId: string,
  direction: -1 | 1
): WorldImageReference[] {
  const index = images.findIndex((image) => image.id === imageId);
  const nextIndex = index + direction;
  if (index < 0 || nextIndex < 0 || nextIndex >= images.length) {
    return images.map((image) => ({ ...image }));
  }
  const next = images.map((image) => ({ ...image }));
  [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
  return next;
}

export function removeImageReference(
  images: readonly WorldImageReference[],
  imageId: string
): WorldImageReference[] {
  return images
    .filter((image) => image.id !== imageId)
    .map((image) => ({ ...image }));
}

export function pruneUnreferencedAssetMetadata(
  document: WorldDocument
): WorldDocument {
  const reachableUris = new Set(
    getDocumentEntries(document).flatMap((entry) =>
      entry.images
        .filter((image) => isUploadedImageUri(image.uri))
        .map((image) => image.uri)
    )
  );
  const assets = document.assets.filter((asset) =>
    reachableUris.has(asset.uri)
  );
  return assets.length === document.assets.length
    ? document
    : { ...document, assets };
}
