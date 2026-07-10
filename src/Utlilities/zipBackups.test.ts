import { describe, expect, it } from '@jest/globals';
import {
  createMemoryBinaryAssetRepository,
  createZipArchive,
  readZipArchive,
  type BinaryAssetRepository,
} from '@valgaron/platform';
import { createSeedWorldDocument, type WorldDocument } from '@valgaron/core';
import { sha256Hex } from './imageFilePreparation';
import {
  createWorldZipBackup,
  installWorldZipAssets,
  parseWorldZipBackup,
} from './zipBackups';

const pngBytes = new Uint8Array([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1, 2, 3, 4,
]);

async function documentWithUpload(): Promise<WorldDocument> {
  const document = createSeedWorldDocument();
  const asset = {
    id: 'asset-map-test',
    uri: 'images/asset-map-test.png',
    originalFilename: 'map.png',
    mediaType: 'image/png' as const,
    byteSize: pngBytes.byteLength,
    sha256: await sha256Hex(pngBytes),
    createdAt: '2026-07-10T00:00:00.000Z',
  };
  return {
    ...document,
    assets: [asset],
    worlds: document.worlds.map((world, worldIndex) =>
      worldIndex === 0
        ? {
            ...world,
            codex: {
              ...world.codex,
              characters: world.codex.characters.map((entry, entryIndex) =>
                entryIndex === 0
                  ? {
                      ...entry,
                      images: [
                        {
                          id: 'image-map-test',
                          uri: asset.uri,
                          altText: 'A map',
                          caption: '',
                          decorative: false,
                        },
                      ],
                    }
                  : entry
              ),
            },
          }
        : world
    ),
  };
}

describe('web ZIP backups', () => {
  it('packages the exact JSON bytes and restores uploaded images', async () => {
    const document = await documentWithUpload();
    const source = createMemoryBinaryAssetRepository({
      'asset-map-test': { bytes: pngBytes, mediaType: 'image/png' },
    });
    const backup = await createWorldZipBackup(
      document,
      'Sample Atlas',
      'full',
      source
    );
    const archive = readZipArchive(backup.bytes);
    expect(archive.ok).toBe(true);
    if (archive.ok) {
      expect(
        new TextDecoder().decode(archive.files.get(backup.jsonFilename))
      ).toBe(backup.jsonText);
      expect(archive.files.get('images/asset-map-test.png')).toEqual(pngBytes);
    }
    const parsed = await parseWorldZipBackup(backup.bytes);
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      const destination = createMemoryBinaryAssetRepository();
      await expect(installWorldZipAssets(parsed, destination)).resolves.toBe(
        true
      );
      await expect(destination.read('asset-map-test')).resolves.toEqual({
        bytes: pngBytes,
        mediaType: 'image/png',
      });
    }
  });

  it('uses a precomputed JSON export without serializing it again', async () => {
    const document = await documentWithUpload();
    const source = createMemoryBinaryAssetRepository({
      'asset-map-test': { bytes: pngBytes, mediaType: 'image/png' },
    });
    const existingJsonText = '{"exact":true}\n';
    const backup = await createWorldZipBackup(
      document,
      'Sample Atlas',
      'full',
      source,
      existingJsonText
    );
    const archive = readZipArchive(backup.bytes);
    expect(backup.jsonText).toBe(existingJsonText);
    expect(archive.ok).toBe(true);
    if (archive.ok) {
      expect(
        new TextDecoder().decode(archive.files.get(backup.jsonFilename))
      ).toBe(existingJsonText);
    }
  });

  it('rejects unexpected entries and missing local source bytes', async () => {
    const document = await documentWithUpload();
    await expect(
      createWorldZipBackup(
        document,
        'Sample Atlas',
        'full',
        createMemoryBinaryAssetRepository()
      )
    ).rejects.toThrow('Uploaded image is missing');

    const json = JSON.stringify(document);
    const zip = createZipArchive(
      new Map([
        ['world.json', new TextEncoder().encode(json)],
        ['images/asset-map-test.png', pngBytes],
        ['unexpected.txt', new Uint8Array([1])],
      ])
    );
    await expect(parseWorldZipBackup(zip)).resolves.toEqual({
      ok: false,
      error: 'ZIP contains unexpected entry "unexpected.txt".',
    });
  });

  it('removes a partial current asset when a repository reports a failed write', async () => {
    const document = await documentWithUpload();
    const source = createMemoryBinaryAssetRepository({
      'asset-map-test': { bytes: pngBytes, mediaType: 'image/png' },
    });
    const parsed = await parseWorldZipBackup(
      (
        await createWorldZipBackup(document, 'Atlas', 'full', source)
      ).bytes
    );
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;

    let stored: { bytes: Uint8Array; mediaType: string } | null = null;
    let shouldFail = true;
    const destination: BinaryAssetRepository = {
      async read() {
        return stored
          ? { bytes: stored.bytes.slice(), mediaType: stored.mediaType }
          : null;
      },
      async write(_assetId, asset) {
        stored = { bytes: asset.bytes.slice(), mediaType: asset.mediaType };
        if (shouldFail) {
          shouldFail = false;
          return false;
        }
        return true;
      },
      async remove() {
        stored = null;
        return true;
      },
      async listIds() {
        return ['asset-map-test'];
      },
    };
    await expect(installWorldZipAssets(parsed, destination)).resolves.toBe(
      false
    );
    expect(stored).toBeNull();
  });

  it('rejects a same-id byte collision without overwriting the existing asset', async () => {
    const document = await documentWithUpload();
    const source = createMemoryBinaryAssetRepository({
      'asset-map-test': { bytes: pngBytes, mediaType: 'image/png' },
    });
    const parsed = await parseWorldZipBackup(
      (
        await createWorldZipBackup(document, 'Atlas', 'full', source)
      ).bytes
    );
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    const existingBytes = new Uint8Array([9, 8, 7]);
    const destination = createMemoryBinaryAssetRepository({
      'asset-map-test': { bytes: existingBytes, mediaType: 'image/png' },
    });
    await expect(installWorldZipAssets(parsed, destination)).resolves.toBe(
      false
    );
    await expect(destination.read('asset-map-test')).resolves.toEqual({
      bytes: existingBytes,
      mediaType: 'image/png',
    });
  });
});
