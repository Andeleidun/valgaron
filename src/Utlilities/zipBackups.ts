import {
  createActiveWorldBackup,
  createWorldZipBackupPlan,
  detectImageMediaType,
  parseWorldImport,
  serializeActiveWorldBackup,
  serializeWorldDocumentBackup,
  type WorldDocument,
  type WorldImageAsset,
  type WorldImportResult,
  type WorldZipBackupMode,
} from '@valgaron/core';
import {
  createZipArchive,
  installBinaryAssetsWithRollback,
  installBinaryAssetsTransaction,
  readZipArchive,
  type BinaryAssetRepository,
} from '@valgaron/platform';
import { browserImageAssetRepository } from './imageAssetStorage';
import { sha256Hex } from './imageFilePreparation';
import { slugFilename } from './fileDownloads';

export type CreatedWorldZipBackup = {
  bytes: Uint8Array;
  filename: string;
  jsonFilename: string;
  jsonText: string;
};

export type ParsedWorldZipBackup = Extract<WorldImportResult, { ok: true }> & {
  files: readonly { asset: WorldImageAsset; bytes: Uint8Array }[];
};

export type WorldZipImportResult =
  | ParsedWorldZipBackup
  | Extract<WorldImportResult, { ok: false }>;

export type WorldZipAssetInstallation =
  | { ok: false; rollbackComplete: boolean }
  | {
      ok: true;
      rollback: () => Promise<boolean>;
    };

export async function createWorldZipBackup(
  document: WorldDocument,
  activeWorkspaceName: string,
  mode: WorldZipBackupMode,
  repository: BinaryAssetRepository = browserImageAssetRepository,
  existingJsonText?: string
): Promise<CreatedWorldZipBackup> {
  const jsonText =
    existingJsonText ??
    (mode === 'active'
      ? serializeActiveWorldBackup(document)
      : serializeWorldDocumentBackup(document));
  const plan = createWorldZipBackupPlan({
    activeWorkspaceFilenameBase: slugFilename(activeWorkspaceName),
    document,
    jsonText,
    mode,
  });
  const files = new Map<string, Uint8Array>([
    [plan.jsonFilename, new TextEncoder().encode(plan.jsonText)],
  ]);
  for (const asset of plan.assets) {
    const binary = await repository.read(asset.id);
    if (!binary)
      throw new Error(`Uploaded image is missing: ${asset.originalFilename}`);
    if (
      binary.bytes.byteLength !== asset.byteSize ||
      detectImageMediaType(binary.bytes) !== asset.mediaType ||
      (await sha256Hex(binary.bytes)) !== asset.sha256
    ) {
      throw new Error(
        `Uploaded image failed integrity checking: ${asset.originalFilename}`
      );
    }
    files.set(asset.uri, binary.bytes);
  }
  return {
    bytes: createZipArchive(files),
    filename: plan.zipFilename,
    jsonFilename: plan.jsonFilename,
    jsonText: plan.jsonText,
  };
}

export async function parseWorldZipBackup(
  bytes: Uint8Array
): Promise<WorldZipImportResult> {
  const archive = readZipArchive(bytes);
  if (!archive.ok) return archive;
  const jsonPaths = [...archive.files.keys()].filter(
    (path) => !path.includes('/') && path.toLowerCase().endsWith('.json')
  );
  if (jsonPaths.length !== 1) {
    return {
      ok: false,
      error: 'ZIP must contain exactly one root JSON backup.',
    };
  }
  const jsonBytes = archive.files.get(jsonPaths[0]);
  const parsed = parseWorldImport(
    jsonBytes ? new TextDecoder().decode(jsonBytes) : ''
  );
  if (!parsed.ok) return parsed;
  const expectedPaths = new Set([
    jsonPaths[0],
    ...parsed.document.assets.map((asset) => asset.uri),
  ]);
  const unexpectedPath = [...archive.files.keys()].find(
    (path) => !expectedPaths.has(path)
  );
  if (unexpectedPath) {
    return {
      ok: false,
      error: `ZIP contains unexpected entry "${unexpectedPath}".`,
    };
  }
  const files: ParsedWorldZipBackup['files'][number][] = [];
  for (const asset of parsed.document.assets) {
    const fileBytes = archive.files.get(asset.uri);
    if (!fileBytes) {
      return {
        ok: false,
        error: `ZIP is missing uploaded image "${asset.uri}".`,
      };
    }
    if (
      fileBytes.byteLength !== asset.byteSize ||
      detectImageMediaType(fileBytes) !== asset.mediaType ||
      (await sha256Hex(fileBytes)) !== asset.sha256
    ) {
      return {
        ok: false,
        error: `ZIP image failed integrity checking: "${asset.uri}".`,
      };
    }
    files.push({ asset, bytes: fileBytes });
  }
  return { ...parsed, files };
}

export async function installWorldZipAssets(
  parsed: ParsedWorldZipBackup,
  repository: BinaryAssetRepository = browserImageAssetRepository
): Promise<boolean> {
  return installBinaryAssetsTransaction(
    parsed.files.map((file) => ({
      assetId: file.asset.id,
      asset: { bytes: file.bytes, mediaType: file.asset.mediaType },
    })),
    repository
  );
}

export async function installWorldZipAssetsWithRollback(
  parsed: ParsedWorldZipBackup,
  repository: BinaryAssetRepository = browserImageAssetRepository
): Promise<WorldZipAssetInstallation> {
  return installBinaryAssetsWithRollback(
    parsed.files.map((file) => ({
      assetId: file.asset.id,
      asset: { bytes: file.bytes, mediaType: file.asset.mediaType },
    })),
    repository
  );
}

export function getActiveZipDocument(document: WorldDocument): WorldDocument {
  return createActiveWorldBackup(document);
}
