import { describe, expect, it } from '@jest/globals';
import {
  classifyImageUri,
  createImageAssetIdentity,
  createImageReference,
  getImageAssetCounts,
  getReachableImageAssets,
  getRetainedAssetIds,
  moveImageReference,
  pruneUnreferencedAssetMetadata,
  validateDocumentImageAssets,
} from './imageAssets';
import { createSeedWorldDocument } from './seedCodex';
import type { WorldDocument, WorldImageAsset } from './types';

const asset: WorldImageAsset = {
  id: 'asset-map-1',
  uri: 'images/asset-map-1.png',
  originalFilename: 'Map.png',
  mediaType: 'image/png',
  byteSize: 4,
  sha256: 'a'.repeat(64),
  createdAt: '2026-07-10T00:00:00.000Z',
};

function documentWithImages(): WorldDocument {
  const document = createSeedWorldDocument();
  const firstEntry = document.worlds[0].codex.characters[0];
  return {
    ...document,
    assets: [asset],
    worlds: [
      {
        ...document.worlds[0],
        codex: {
          ...document.worlds[0].codex,
          characters: [
            {
              ...firstEntry,
              images: [
                {
                  id: 'image-uploaded',
                  uri: asset.uri,
                  altText: 'A regional map',
                  caption: '',
                  decorative: false,
                },
                {
                  id: 'image-remote',
                  uri: 'https://example.test/map.png?size=large#detail',
                  altText: 'A second map',
                  caption: 'Remote source',
                  decorative: false,
                },
              ],
            },
            ...document.worlds[0].codex.characters.slice(1),
          ],
        },
      },
    ],
  };
}

describe('image asset domain', () => {
  it('classifies approved persisted URI forms and preserves remote query text', () => {
    expect(classifyImageUri('images/asset-map-1.png')).toBe('uploaded');
    expect(
      classifyImageUri('https://example.test/map.png?token=abc#detail')
    ).toBe('remote');
    expect(classifyImageUri('http://example.test/map.png')).toBeNull();
    expect(
      classifyImageUri('https://user:secret@example.test/map.png')
    ).toBeNull();
    expect(classifyImageUri('blob:temporary')).toBeNull();
    expect(classifyImageUri('data:image/png;base64,AA==')).toBeNull();
  });

  it('creates stable relative upload identities', () => {
    expect(createImageAssetIdentity('image/jpeg', 'map-1')).toEqual({
      id: 'asset-map-1',
      uri: 'images/asset-map-1.jpg',
    });
  });

  it('validates references, counts sources, and selects reachable assets', () => {
    const document = documentWithImages();
    expect(validateDocumentImageAssets(document)).toBeNull();
    expect(getImageAssetCounts(document)).toEqual({
      remoteImageCount: 1,
      uploadedImageCount: 1,
      assetMetadataCount: 1,
      reachableUploadedByteTotal: 4,
    });
    expect(getReachableImageAssets(document)).toEqual([asset]);
  });

  it('rejects missing uploaded metadata and non-explicit decorative alt text', () => {
    const document = documentWithImages();
    expect(validateDocumentImageAssets({ ...document, assets: [] })).toContain(
      'missing image asset'
    );
    const entry = document.worlds[0].codex.characters[0];
    entry.images[0] = { ...entry.images[0], altText: '' };
    expect(validateDocumentImageAssets(document)).toContain(
      'requires alternative text'
    );
  });

  it('rejects asset URIs whose extension disagrees with the media type', () => {
    const document = documentWithImages();
    document.assets[0] = {
      ...document.assets[0],
      uri: 'images/asset-map-1.jpg',
    };
    document.worlds[0].codex.characters[0].images[0] = {
      ...document.worlds[0].codex.characters[0].images[0],
      uri: 'images/asset-map-1.jpg',
    };
    expect(validateDocumentImageAssets(document)).toContain(
      'invalid generated URI'
    );
  });

  it('rejects empty uploaded filenames', () => {
    const document = documentWithImages();
    document.assets[0] = { ...document.assets[0], originalFilename: '  ' };
    expect(validateDocumentImageAssets(document)).toContain(
      'requires an original filename'
    );
  });

  it('moves image references without mutating the input', () => {
    const images = documentWithImages().worlds[0].codex.characters[0].images;
    const moved = moveImageReference(images, 'image-remote', -1);
    expect(moved.map((image) => image.id)).toEqual([
      'image-remote',
      'image-uploaded',
    ]);
    expect(images[0].id).toBe('image-uploaded');
  });

  it('prunes metadata after the final uploaded reference is removed', () => {
    const document = documentWithImages();
    const entry = document.worlds[0].codex.characters[0];
    entry.images = entry.images.filter((image) => image.uri !== asset.uri);
    expect(pruneUnreferencedAssetMetadata(document).assets).toEqual([]);
  });

  it('retains asset ids reachable only through history or recovery', () => {
    const present = createSeedWorldDocument();
    const historical = documentWithImages();
    const recoveryDocument = {
      ...createSeedWorldDocument(),
      assets: [{ ...asset, id: 'asset-recovery', uri: 'images/recovery.png' }],
    };
    const retained = getRetainedAssetIds(
      present,
      [
        {
          id: 'snapshot-1',
          reason: 'reset',
          createdAt: '2026-07-17T00:00:00.000Z',
          document: recoveryDocument,
        },
      ],
      [historical]
    );

    expect([...retained].sort()).toEqual(['asset-map-1', 'asset-recovery']);
  });

  it('creates new reference ids without changing URI metadata', () => {
    expect(
      createImageReference(
        {
          uri: 'https://example.test/image.png',
          altText: 'Example',
          caption: '',
          decorative: false,
        },
        'example'
      )
    ).toEqual({
      id: 'image-example',
      uri: 'https://example.test/image.png',
      altText: 'Example',
      caption: '',
      decorative: false,
    });
  });
});
