import { describe, expect, it } from '@jest/globals';
import {
  createMemoryBinaryAssetRepository,
  createMemoryStringStorage,
  createZipArchive,
  isZipArchiveBytes,
  loadJsonValue,
  parseJsonValue,
  readZipArchive,
  saveJsonValue,
} from './index';

describe('binary asset and ZIP platform helpers', () => {
  function findSignature(bytes: Uint8Array, signature: number): number {
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    for (let offset = 0; offset <= bytes.length - 4; offset += 1) {
      if (view.getUint32(offset, true) === signature) return offset;
    }
    throw new Error(`ZIP signature ${signature.toString(16)} was not found.`);
  }

  it('copies binary repository bytes on write and read', async () => {
    const repository = createMemoryBinaryAssetRepository();
    const bytes = new Uint8Array([1, 2, 3]);
    await repository.write('asset-one', { bytes, mediaType: 'image/png' });
    bytes[0] = 9;
    await expect(repository.read('asset-one')).resolves.toEqual({
      bytes: new Uint8Array([1, 2, 3]),
      mediaType: 'image/png',
    });
  });

  it('creates and safely reads a ZIP archive', () => {
    const zip = createZipArchive(
      new Map([
        ['world.json', new TextEncoder().encode('{"ok":true}')],
        ['images/asset-one.png', new Uint8Array([1, 2, 3])],
      ])
    );
    const result = readZipArchive(zip);
    expect(isZipArchiveBytes(zip)).toBe(true);
    expect(isZipArchiveBytes(new TextEncoder().encode('{"ok":true}'))).toBe(
      false
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(new TextDecoder().decode(result.files.get('world.json'))).toBe(
        '{"ok":true}'
      );
    }
  });

  it('rejects unsafe output paths and bounded input', () => {
    expect(() =>
      createZipArchive(new Map([['../world.json', new Uint8Array([1])]]))
    ).toThrow('Unsafe ZIP path');
    expect(() =>
      createZipArchive(new Map([['__proto__', new Uint8Array([1])]]))
    ).toThrow('Unsafe ZIP path');
    const zip = createZipArchive(new Map([['world.json', new Uint8Array(20)]]));
    expect(readZipArchive(zip, { maxExpandedBytes: 10 })).toEqual({
      ok: false,
      error: 'ZIP file exceeds the expanded size limit.',
    });
  });

  it.each([
    {
      label: 'encrypted entries',
      mutate(view: DataView, centralOffset: number) {
        view.setUint16(centralOffset + 8, 1, true);
      },
      error: 'Encrypted ZIP entries are not supported.',
    },
    {
      label: 'unsupported compression methods',
      mutate(view: DataView, centralOffset: number) {
        view.setUint16(centralOffset + 10, 99, true);
      },
      error: 'ZIP entry uses an unsupported compression method.',
    },
    {
      label: 'symbolic links',
      mutate(view: DataView, centralOffset: number) {
        view.setUint16(centralOffset + 4, (3 << 8) | 20, true);
        view.setUint32(centralOffset + 38, 0xa0000000, true);
      },
      error: 'ZIP symbolic links are not supported.',
    },
  ])('rejects $label before decompression', ({ mutate, error }) => {
    const zip = createZipArchive(
      new Map([['world.json', new Uint8Array([1, 2, 3])]])
    ).slice();
    const centralOffset = findSignature(zip, 0x02014b50);
    mutate(
      new DataView(zip.buffer, zip.byteOffset, zip.byteLength),
      centralOffset
    );
    expect(readZipArchive(zip)).toEqual({ ok: false, error });
  });

  it('rejects split archives and inconsistent local headers', () => {
    const splitZip = createZipArchive(
      new Map([['world.json', new Uint8Array([1])]])
    ).slice();
    const splitView = new DataView(
      splitZip.buffer,
      splitZip.byteOffset,
      splitZip.byteLength
    );
    splitView.setUint16(findSignature(splitZip, 0x06054b50) + 4, 1, true);
    expect(readZipArchive(splitZip)).toEqual({
      ok: false,
      error: 'Split ZIP archives are not supported.',
    });

    const mismatchedZip = createZipArchive(
      new Map([['world.json', new Uint8Array([1])]])
    ).slice();
    const mismatchedView = new DataView(
      mismatchedZip.buffer,
      mismatchedZip.byteOffset,
      mismatchedZip.byteLength
    );
    mismatchedView.setUint16(
      findSignature(mismatchedZip, 0x04034b50) + 8,
      99,
      true
    );
    expect(readZipArchive(mismatchedZip)).toEqual({
      ok: false,
      error: 'ZIP entry headers do not agree.',
    });
  });
});

type NamedRecord = {
  name: string;
};

function parseNamedRecord(value: unknown): NamedRecord | null {
  return typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    typeof (value as { name?: unknown }).name === 'string'
    ? { name: (value as { name: string }).name }
    : null;
}

describe('platform storage helpers', () => {
  it('parses valid JSON through a narrow value parser', () => {
    expect(
      parseJsonValue('{"name":"Aster"}', parseNamedRecord, 'Invalid record.')
    ).toEqual({ ok: true, value: { name: 'Aster' } });
  });

  it('reports invalid JSON and invalid shapes without throwing', () => {
    expect(parseJsonValue('{', parseNamedRecord, 'Invalid record.')).toEqual({
      ok: false,
      error: 'This is not valid JSON.',
    });
    expect(parseJsonValue('42', parseNamedRecord, 'Invalid record.')).toEqual({
      ok: false,
      error: 'Invalid record.',
    });
  });

  it('loads and saves JSON through an async string adapter', async () => {
    const storage = createMemoryStringStorage();

    await expect(
      loadJsonValue(storage, 'world', parseNamedRecord, 'Invalid record.')
    ).resolves.toEqual({ ok: true, value: null });

    await expect(
      saveJsonValue(storage, 'world', { name: 'Aster' })
    ).resolves.toBe(true);

    await expect(
      loadJsonValue(storage, 'world', parseNamedRecord, 'Invalid record.')
    ).resolves.toEqual({ ok: true, value: { name: 'Aster' } });
  });
});
