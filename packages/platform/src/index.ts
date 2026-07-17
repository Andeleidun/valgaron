import { strFromU8, strToU8, unzipSync, zipSync } from 'fflate';

export type AsyncStringStorageAdapter = {
  read: (key: string) => Promise<string | null>;
  write: (key: string, value: string) => Promise<boolean>;
  remove: (key: string) => Promise<boolean>;
};

export type BinaryAsset = {
  bytes: Uint8Array;
  mediaType: string;
};

export type BinaryAssetRepository = {
  read: (assetId: string) => Promise<BinaryAsset | null>;
  write: (assetId: string, asset: BinaryAsset) => Promise<boolean>;
  remove: (assetId: string) => Promise<boolean>;
  listIds: () => Promise<readonly string[]>;
};

export type BinaryAssetInstall = {
  assetId: string;
  asset: BinaryAsset;
};

export type BinaryAssetInstallTransaction =
  | { ok: false; rollbackComplete: boolean }
  | { ok: true; rollback: () => Promise<boolean> };

export async function installBinaryAssetsWithRollback(
  files: readonly BinaryAssetInstall[],
  repository: BinaryAssetRepository
): Promise<BinaryAssetInstallTransaction> {
  const previous = new Map<string, BinaryAsset | null>();
  const written: string[] = [];
  const rollback = async (ids: readonly string[]) => {
    const results: boolean[] = [];
    for (const id of ids) {
      const prior = previous.get(id);
      results.push(
        prior ? await repository.write(id, prior) : await repository.remove(id)
      );
    }
    return results.every(Boolean);
  };
  for (const file of files) {
    const existing = await repository.read(file.assetId);
    previous.set(file.assetId, existing);
    if (existing) {
      if (
        existing.bytes.byteLength !== file.asset.bytes.byteLength ||
        existing.bytes.some((value, index) => value !== file.asset.bytes[index])
      ) {
        const rollbackComplete = await rollback([...written].reverse());
        return { ok: false, rollbackComplete };
      }
      continue;
    }
    if (!(await repository.write(file.assetId, file.asset))) {
      const rollbackComplete = await rollback([
        file.assetId,
        ...[...written].reverse(),
      ]);
      return { ok: false, rollbackComplete };
    }
    written.push(file.assetId);
  }
  let didRollback = false;
  return {
    ok: true,
    rollback: async () => {
      if (didRollback) {
        return true;
      }
      didRollback = await rollback([...written].reverse());
      return didRollback;
    },
  };
}

export async function installBinaryAssetsTransaction(
  files: readonly BinaryAssetInstall[],
  repository: BinaryAssetRepository
): Promise<boolean> {
  return (await installBinaryAssetsWithRollback(files, repository)).ok;
}

export type ZipArchiveLimits = {
  maxCompressedBytes: number;
  maxEntries: number;
  maxExpandedBytes: number;
};

export type ZipArchiveReadResult =
  | { ok: true; files: ReadonlyMap<string, Uint8Array> }
  | { ok: false; error: string };

export const MAX_ZIP_COMPRESSED_BYTES = 110 * 1024 * 1024;

const DEFAULT_ZIP_LIMITS: ZipArchiveLimits = {
  maxCompressedBytes: MAX_ZIP_COMPRESSED_BYTES,
  maxEntries: 1000,
  maxExpandedBytes: 110 * 1024 * 1024,
};

function isSafeZipPath(path: string): boolean {
  const segments = path.split('/');
  return (
    path.length > 0 &&
    path.length <= 240 &&
    !path.startsWith('/') &&
    !path.includes('\\') &&
    !segments.some(
      (part) =>
        !part ||
        part === '.' ||
        part === '..' ||
        part === '__proto__' ||
        part === 'prototype' ||
        part === 'constructor'
    ) &&
    !/^[a-zA-Z]:/.test(path)
  );
}

export function isZipArchiveBytes(bytes: Uint8Array): boolean {
  if (bytes.byteLength < 4) return false;
  const signature = new DataView(
    bytes.buffer,
    bytes.byteOffset,
    bytes.byteLength
  ).getUint32(0, true);
  return signature === 0x04034b50 || signature === 0x06054b50;
}

export function encodeUtf8(value: string): Uint8Array {
  return strToU8(value);
}

export function decodeUtf8(bytes: Uint8Array): string {
  return strFromU8(bytes);
}

type ZipCentralDirectoryReadResult =
  | {
      ok: true;
      entries: readonly { name: string; uncompressedSize: number }[];
      expandedBytes: number;
    }
  | { ok: false; error: string };

function readCentralDirectory(
  bytes: Uint8Array
): ZipCentralDirectoryReadResult {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let eocdOffset = -1;
  const minimumOffset = Math.max(0, bytes.length - 65557);
  for (let offset = bytes.length - 22; offset >= minimumOffset; offset -= 1) {
    if (
      view.getUint32(offset, true) === 0x06054b50 &&
      offset + 22 + view.getUint16(offset + 20, true) === bytes.length
    ) {
      eocdOffset = offset;
      break;
    }
  }
  if (eocdOffset < 0) {
    return { ok: false, error: 'ZIP end-of-directory record is invalid.' };
  }
  const diskNumber = view.getUint16(eocdOffset + 4, true);
  const centralDiskNumber = view.getUint16(eocdOffset + 6, true);
  const entriesOnDisk = view.getUint16(eocdOffset + 8, true);
  const entryCount = view.getUint16(eocdOffset + 10, true);
  const centralSize = view.getUint32(eocdOffset + 12, true);
  const centralOffset = view.getUint32(eocdOffset + 16, true);
  if (
    diskNumber !== 0 ||
    centralDiskNumber !== 0 ||
    entriesOnDisk !== entryCount
  ) {
    return { ok: false, error: 'Split ZIP archives are not supported.' };
  }
  if (
    entryCount === 0xffff ||
    centralSize === 0xffffffff ||
    centralOffset === 0xffffffff
  ) {
    return { ok: false, error: 'ZIP64 archives are not supported.' };
  }
  if (centralOffset + centralSize !== eocdOffset) {
    return { ok: false, error: 'ZIP central directory bounds are invalid.' };
  }
  const entries: { name: string; uncompressedSize: number }[] = [];
  let expandedBytes = 0;
  let offset = centralOffset;
  for (let index = 0; index < entryCount; index += 1) {
    if (
      offset + 46 > bytes.length ||
      view.getUint32(offset, true) !== 0x02014b50
    ) {
      return { ok: false, error: 'ZIP central directory entry is invalid.' };
    }
    const versionMadeBy = view.getUint16(offset + 4, true);
    const flags = view.getUint16(offset + 8, true);
    const compressionMethod = view.getUint16(offset + 10, true);
    const uncompressedSize = view.getUint32(offset + 24, true);
    const filenameLength = view.getUint16(offset + 28, true);
    const extraLength = view.getUint16(offset + 30, true);
    const commentLength = view.getUint16(offset + 32, true);
    const externalAttributes = view.getUint32(offset + 38, true);
    const localHeaderOffset = view.getUint32(offset + 42, true);
    const nameStart = offset + 46;
    const nameEnd = nameStart + filenameLength;
    const entryEnd = nameEnd + extraLength + commentLength;
    if (
      entryEnd > eocdOffset ||
      uncompressedSize === 0xffffffff ||
      localHeaderOffset === 0xffffffff
    ) {
      return { ok: false, error: 'ZIP directory entry bounds are invalid.' };
    }
    if ((flags & 0x41) !== 0) {
      return { ok: false, error: 'Encrypted ZIP entries are not supported.' };
    }
    if (compressionMethod !== 0 && compressionMethod !== 8) {
      return {
        ok: false,
        error: 'ZIP entry uses an unsupported compression method.',
      };
    }
    const hostSystem = versionMadeBy >>> 8;
    const unixMode = externalAttributes >>> 16;
    if (hostSystem === 3 && (unixMode & 0xf000) === 0xa000) {
      return { ok: false, error: 'ZIP symbolic links are not supported.' };
    }
    if (
      localHeaderOffset + 30 > centralOffset ||
      view.getUint32(localHeaderOffset, true) !== 0x04034b50
    ) {
      return { ok: false, error: 'ZIP local file header is invalid.' };
    }
    const localFlags = view.getUint16(localHeaderOffset + 6, true);
    const localCompressionMethod = view.getUint16(localHeaderOffset + 8, true);
    const localFilenameLength = view.getUint16(localHeaderOffset + 26, true);
    const localExtraLength = view.getUint16(localHeaderOffset + 28, true);
    const localNameStart = localHeaderOffset + 30;
    const localNameEnd = localNameStart + localFilenameLength;
    if (
      localNameEnd + localExtraLength > centralOffset ||
      localFlags !== flags ||
      localCompressionMethod !== compressionMethod
    ) {
      return { ok: false, error: 'ZIP entry headers do not agree.' };
    }
    const name = decodeUtf8(bytes.subarray(nameStart, nameEnd));
    const localName = decodeUtf8(bytes.subarray(localNameStart, localNameEnd));
    if (name !== localName) {
      return { ok: false, error: 'ZIP entry names do not agree.' };
    }
    entries.push({ name, uncompressedSize });
    expandedBytes += uncompressedSize;
    offset = entryEnd;
  }
  if (offset !== eocdOffset) {
    return { ok: false, error: 'ZIP central directory size is invalid.' };
  }
  return { ok: true, entries, expandedBytes };
}

export function createZipArchive(
  files: ReadonlyMap<string, Uint8Array>
): Uint8Array {
  const input = Object.create(null) as Record<string, Uint8Array>;
  for (const [path, bytes] of [...files].sort(([a], [b]) =>
    a.localeCompare(b)
  )) {
    if (!isSafeZipPath(path)) throw new Error(`Unsafe ZIP path: ${path}`);
    input[path] = bytes;
  }
  return zipSync(input, { level: 6 });
}

export function readZipArchive(
  bytes: Uint8Array,
  limits: Partial<ZipArchiveLimits> = {}
): ZipArchiveReadResult {
  const effective = { ...DEFAULT_ZIP_LIMITS, ...limits };
  if (bytes.byteLength > effective.maxCompressedBytes) {
    return { ok: false, error: 'ZIP file exceeds the compressed size limit.' };
  }
  const central = readCentralDirectory(bytes);
  if (!central.ok) return central;
  if (central.entries.length > effective.maxEntries) {
    return { ok: false, error: 'ZIP file contains too many entries.' };
  }
  if (central.expandedBytes > effective.maxExpandedBytes) {
    return { ok: false, error: 'ZIP file exceeds the expanded size limit.' };
  }
  const names = new Set<string>();
  for (const { name } of central.entries) {
    if (!isSafeZipPath(name))
      return { ok: false, error: `ZIP contains an unsafe path: ${name}` };
    if (names.has(name))
      return { ok: false, error: `ZIP contains duplicate path: ${name}` };
    names.add(name);
  }
  try {
    const files = unzipSync(bytes);
    if (
      Object.keys(files).length !== central.entries.length ||
      central.entries.some(
        (entry) => files[entry.name]?.byteLength !== entry.uncompressedSize
      )
    ) {
      return { ok: false, error: 'ZIP contents do not match its directory.' };
    }
    return {
      ok: true,
      files: new Map(
        Object.entries(files).map(([path, fileBytes]) => [
          path,
          new Uint8Array(fileBytes),
        ])
      ),
    };
  } catch {
    return { ok: false, error: 'ZIP contents could not be decompressed.' };
  }
}

export type JsonParseResult<TValue> =
  | {
      ok: true;
      value: TValue;
    }
  | {
      ok: false;
      error: string;
    };

export type JsonStorageLoadResult<TValue> =
  | {
      ok: true;
      value: TValue | null;
    }
  | {
      ok: false;
      error: string;
    };

export function parseJsonValue<TValue>(
  text: string,
  parseValue: (value: unknown) => TValue | null,
  invalidMessage: string
): JsonParseResult<TValue> {
  try {
    const parsedValue: unknown = JSON.parse(text);
    const value = parseValue(parsedValue);
    return value ? { ok: true, value } : { ok: false, error: invalidMessage };
  } catch {
    return { ok: false, error: 'This is not valid JSON.' };
  }
}

export async function loadJsonValue<TValue>(
  storage: AsyncStringStorageAdapter,
  key: string,
  parseValue: (value: unknown) => TValue | null,
  invalidMessage: string
): Promise<JsonStorageLoadResult<TValue>> {
  const storedValue = await storage.read(key);
  if (storedValue === null) {
    return { ok: true, value: null };
  }
  const parsed = parseJsonValue(storedValue, parseValue, invalidMessage);
  return parsed.ok ? { ok: true, value: parsed.value } : parsed;
}

export async function saveJsonValue<TValue>(
  storage: AsyncStringStorageAdapter,
  key: string,
  value: TValue
): Promise<boolean> {
  return storage.write(key, JSON.stringify(value));
}

export function createMemoryStringStorage(
  seed: Readonly<Record<string, string>> = {}
): AsyncStringStorageAdapter & {
  snapshot: () => Record<string, string>;
} {
  const values = new Map(Object.entries(seed));
  return {
    async read(key) {
      return values.get(key) ?? null;
    },
    async write(key, value) {
      values.set(key, value);
      return true;
    },
    async remove(key) {
      values.delete(key);
      return true;
    },
    snapshot() {
      return Object.fromEntries(values);
    },
  };
}

export function createMemoryBinaryAssetRepository(
  seed: Readonly<Record<string, BinaryAsset>> = {}
): BinaryAssetRepository & { snapshot: () => Record<string, BinaryAsset> } {
  const values = new Map(
    Object.entries(seed).map(([id, asset]) => [
      id,
      { bytes: new Uint8Array(asset.bytes), mediaType: asset.mediaType },
    ])
  );
  return {
    async read(assetId) {
      const asset = values.get(assetId);
      return asset
        ? { bytes: new Uint8Array(asset.bytes), mediaType: asset.mediaType }
        : null;
    },
    async write(assetId, asset) {
      values.set(assetId, {
        bytes: new Uint8Array(asset.bytes),
        mediaType: asset.mediaType,
      });
      return true;
    },
    async remove(assetId) {
      return values.delete(assetId);
    },
    async listIds() {
      return [...values.keys()];
    },
    snapshot() {
      return Object.fromEntries(
        [...values].map(([id, asset]) => [
          id,
          { bytes: new Uint8Array(asset.bytes), mediaType: asset.mediaType },
        ])
      );
    },
  };
}
