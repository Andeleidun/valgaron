import { File, Paths } from 'expo-file-system';
import * as DocumentPicker from 'expo-document-picker';
import * as Sharing from 'expo-sharing';
import {
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
  decodeUtf8,
  encodeUtf8,
  installBinaryAssetsTransaction,
  isZipArchiveBytes,
  readZipArchive,
} from '@valgaron/platform';
import {
  getMobileSha256,
  mobileImageAssetRepository,
} from '../storage/mobileImageAssetStorage';

function slugFilename(value: string): string {
  return (
    value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'world'
  );
}

export type ParsedMobileWorldZipBackup = Extract<
  WorldImportResult,
  { ok: true }
> & {
  files: readonly { asset: WorldImageAsset; bytes: Uint8Array }[];
};

export type PickedMobileBackup = {
  jsonText: string;
  result: WorldImportResult;
  zip: ParsedMobileWorldZipBackup | null;
  filename: string;
};

export async function shareMobileZipBackup(
  document: WorldDocument,
  activeWorkspaceName: string,
  mode: WorldZipBackupMode
): Promise<string> {
  const jsonText =
    mode === 'active'
      ? serializeActiveWorldBackup(document)
      : serializeWorldDocumentBackup(document);
  const plan = createWorldZipBackupPlan({
    activeWorkspaceFilenameBase: slugFilename(activeWorkspaceName),
    document,
    jsonText,
    mode,
  });
  const files = new Map<string, Uint8Array>([
    [plan.jsonFilename, encodeUtf8(jsonText)],
  ]);
  for (const asset of plan.assets) {
    const binary = await mobileImageAssetRepository.read(asset.id);
    if (!binary)
      throw new Error(`Uploaded image is missing: ${asset.originalFilename}`);
    if (
      binary.bytes.byteLength !== asset.byteSize ||
      detectImageMediaType(binary.bytes) !== asset.mediaType ||
      (await getMobileSha256(binary.bytes)) !== asset.sha256
    ) {
      throw new Error(
        `Uploaded image failed integrity checking: ${asset.originalFilename}`
      );
    }
    files.set(asset.uri, binary.bytes);
  }
  if (!(await Sharing.isAvailableAsync())) {
    throw new Error('File sharing is unavailable on this device.');
  }
  const output = new File(Paths.cache, plan.zipFilename);
  output.create({ overwrite: true, intermediates: true });
  output.write(createZipArchive(files));
  try {
    await Sharing.shareAsync(output.uri, {
      mimeType: 'application/zip',
      dialogTitle: `Share ${plan.zipFilename}`,
    });
  } finally {
    if (output.exists) output.delete();
  }
  return `${plan.zipFilename} is ready in the share sheet.`;
}

async function parseZip(bytes: Uint8Array): Promise<{
  jsonText: string;
  result: WorldImportResult;
  zip: ParsedMobileWorldZipBackup | null;
}> {
  const archive = readZipArchive(bytes);
  if (!archive.ok) return { jsonText: '', result: archive, zip: null };
  const jsonPaths = [...archive.files.keys()].filter(
    (path) => !path.includes('/') && path.toLowerCase().endsWith('.json')
  );
  if (jsonPaths.length !== 1) {
    const result = {
      ok: false as const,
      error: 'ZIP must contain exactly one root JSON backup.',
    };
    return { jsonText: '', result, zip: null };
  }
  const jsonText = decodeUtf8(archive.files.get(jsonPaths[0])!);
  const result = parseWorldImport(jsonText);
  if (!result.ok) return { jsonText, result, zip: null };
  const expected = new Set([
    jsonPaths[0],
    ...result.document.assets.map((asset) => asset.uri),
  ]);
  const unexpected = [...archive.files.keys()].find(
    (path) => !expected.has(path)
  );
  if (unexpected) {
    const failure = {
      ok: false as const,
      error: `ZIP contains unexpected entry "${unexpected}".`,
    };
    return { jsonText, result: failure, zip: null };
  }
  const files: ParsedMobileWorldZipBackup['files'][number][] = [];
  for (const asset of result.document.assets) {
    const fileBytes = archive.files.get(asset.uri);
    if (
      !fileBytes ||
      fileBytes.byteLength !== asset.byteSize ||
      detectImageMediaType(fileBytes) !== asset.mediaType ||
      (await getMobileSha256(fileBytes)) !== asset.sha256
    ) {
      const failure = {
        ok: false as const,
        error: `ZIP image is missing or failed integrity checking: "${asset.uri}".`,
      };
      return { jsonText, result: failure, zip: null };
    }
    files.push({ asset, bytes: fileBytes });
  }
  return { jsonText, result, zip: { ...result, files } };
}

export async function pickMobileWorldBackup(): Promise<PickedMobileBackup | null> {
  const picked = await DocumentPicker.getDocumentAsync({
    type: ['application/json', 'application/zip'],
    copyToCacheDirectory: true,
  });
  if (picked.canceled || !picked.assets[0]) return null;
  const asset = picked.assets[0];
  const file = new File(asset.uri);
  const bytes = await file.bytes();
  if (isZipArchiveBytes(bytes)) {
    return { ...(await parseZip(bytes)), filename: asset.name };
  }
  const jsonText = decodeUtf8(bytes);
  return {
    jsonText,
    result: parseWorldImport(jsonText),
    zip: null,
    filename: asset.name,
  };
}

export async function installMobileZipAssets(
  parsed: ParsedMobileWorldZipBackup
): Promise<boolean> {
  return installBinaryAssetsTransaction(
    parsed.files.map((file) => ({
      assetId: file.asset.id,
      asset: { bytes: file.bytes, mediaType: file.asset.mediaType },
    })),
    mobileImageAssetRepository
  );
}
