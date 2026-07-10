import { describe, expect, it } from '@jest/globals';
import { createSeedWorldDocument } from '@valgaron/core';
import {
  createMemoryStringStorage,
  type AsyncStringStorageAdapter,
} from '@valgaron/platform';
import {
  MOBILE_RECOVERY_SNAPSHOTS_STORAGE_KEY,
  LEGACY_MOBILE_WORLD_DOCUMENT_STORAGE_KEY,
  MOBILE_WORLD_DOCUMENT_STORAGE_KEY,
  createMobileRecoverySnapshot,
  deleteMobileRecoverySnapshot,
  deleteMobileRecoverySnapshotById,
  loadMobileRecoverySnapshot,
  loadMobileRecoverySnapshots,
  loadMobileWorldDocument,
  parseMobileWorldImport,
  resetMobileE2EWorldDocument,
  saveMobileRecoverySnapshot,
  saveMobileWorldDocument,
} from './mobileStorage';

describe('mobile storage', () => {
  it('loads starter data when no device-local document exists', async () => {
    const storage = createMemoryStringStorage();

    await expect(loadMobileWorldDocument(storage)).resolves.toMatchObject({
      status: { source: 'seed' },
      document: { schemaVersion: 4 },
    });
  });

  it('saves and reloads a Valgaron world document', async () => {
    const storage = createMemoryStringStorage();
    const document = createSeedWorldDocument();

    await expect(saveMobileWorldDocument(storage, document)).resolves.toBe(
      true
    );
    await expect(loadMobileWorldDocument(storage)).resolves.toMatchObject({
      status: { source: 'saved' },
      document,
    });
  });

  it('migrates a schema 3 document from the legacy mobile key', async () => {
    const current = createSeedWorldDocument();
    const legacy = {
      ...current,
      schemaVersion: 3,
      assets: undefined,
    };
    const storage = createMemoryStringStorage({
      [LEGACY_MOBILE_WORLD_DOCUMENT_STORAGE_KEY]: JSON.stringify(legacy),
    });

    await expect(loadMobileWorldDocument(storage)).resolves.toMatchObject({
      document: { schemaVersion: 4, assets: [] },
      status: { source: 'saved' },
    });
  });

  it('resets mobile E2E storage to seed data and clears recovery snapshots', async () => {
    const storage = createMemoryStringStorage({
      [MOBILE_RECOVERY_SNAPSHOTS_STORAGE_KEY]: JSON.stringify([
        createMobileRecoverySnapshot(createSeedWorldDocument(), 'reset'),
      ]),
      [MOBILE_WORLD_DOCUMENT_STORAGE_KEY]: JSON.stringify({
        schemaVersion: 999,
      }),
    });

    await expect(resetMobileE2EWorldDocument(storage)).resolves.toMatchObject({
      document: createSeedWorldDocument(),
      status: { source: 'seed' },
    });
    expect(storage.snapshot()[MOBILE_WORLD_DOCUMENT_STORAGE_KEY]).toContain(
      '"schemaVersion":4'
    );
    expect(
      storage.snapshot()[MOBILE_RECOVERY_SNAPSHOTS_STORAGE_KEY]
    ).toBeUndefined();
  });

  it('recovers to starter data when saved mobile JSON is corrupt', async () => {
    const storage = createMemoryStringStorage({
      [MOBILE_WORLD_DOCUMENT_STORAGE_KEY]: '{not valid json',
    });

    await expect(loadMobileWorldDocument(storage)).resolves.toMatchObject({
      status: {
        source: 'recovered',
        message:
          'This is not valid JSON. Starter data is open until a valid import or save replaces it.',
      },
      document: createSeedWorldDocument(),
    });
  });

  it('recovers to starter data when saved mobile data fails schema validation', async () => {
    const storage = createMemoryStringStorage({
      [MOBILE_WORLD_DOCUMENT_STORAGE_KEY]: JSON.stringify({
        schemaVersion: 999,
      }),
    });

    await expect(loadMobileWorldDocument(storage)).resolves.toMatchObject({
      status: {
        source: 'recovered',
        message:
          'Saved data is not a valid Valgaron World Codex document. Starter data is open until a valid import or save replaces it.',
      },
      document: createSeedWorldDocument(),
    });
  });

  it('reports failed mobile document and snapshot writes', async () => {
    const document = createSeedWorldDocument();
    const failingStorage: AsyncStringStorageAdapter = {
      async read() {
        return null;
      },
      async write() {
        return false;
      },
      async remove() {
        return true;
      },
    };

    await expect(
      saveMobileWorldDocument(failingStorage, document)
    ).resolves.toBe(false);
    await expect(
      saveMobileRecoverySnapshot(
        failingStorage,
        createMobileRecoverySnapshot(document, 'reset')
      )
    ).resolves.toBe(false);
  });

  it('parses pasted JSON imports and rejects invalid text', () => {
    const document = createSeedWorldDocument();

    expect(parseMobileWorldImport(JSON.stringify(document))).toMatchObject({
      ok: true,
      preview: { activeWorldName: 'Sample Atlas' },
    });
    expect(parseMobileWorldImport('not json')).toEqual({
      ok: false,
      error: 'This is not valid JSON.',
    });
  });

  it('uses the shared import validator for duplicate local records', () => {
    const document = createSeedWorldDocument();
    const activeWorld = document.worlds[0];
    const duplicateEntry = activeWorld.codex.characters[0];
    const duplicateDocument = {
      ...document,
      worlds: [
        {
          ...activeWorld,
          codex: {
            ...activeWorld.codex,
            characters: [duplicateEntry, duplicateEntry],
          },
        },
      ],
    };

    expect(parseMobileWorldImport(JSON.stringify(duplicateDocument))).toEqual({
      ok: false,
      error: `Import contains duplicate entry id "${duplicateEntry.id}".`,
    });
  });

  it('stores recovery snapshot history before destructive mobile actions', async () => {
    const storage = createMemoryStringStorage();
    const document = createSeedWorldDocument();
    const firstSnapshot = {
      ...createMobileRecoverySnapshot(document, 'permanent-delete'),
      createdAt: '2026-06-01T09:00:00.000Z',
      id: 'mobile-snapshot-permanent-delete-20260601090000000',
    };
    const secondSnapshot = {
      ...createMobileRecoverySnapshot(document, 'relationship-delete'),
      createdAt: '2026-06-02T09:00:00.000Z',
      id: 'mobile-snapshot-relationship-delete-20260602090000000',
    };

    await expect(
      saveMobileRecoverySnapshot(storage, firstSnapshot)
    ).resolves.toBe(true);
    await expect(
      saveMobileRecoverySnapshot(storage, secondSnapshot)
    ).resolves.toBe(true);
    expect(storage.snapshot()[MOBILE_RECOVERY_SNAPSHOTS_STORAGE_KEY]).toContain(
      'permanent-delete'
    );
    await expect(loadMobileRecoverySnapshots(storage)).resolves.toEqual([
      secondSnapshot,
      expect.objectContaining({
        id: expect.stringContaining('mobile-snapshot-permanent-delete'),
        reason: 'permanent-delete',
        document,
      }),
    ]);
    await expect(loadMobileRecoverySnapshot(storage)).resolves.toMatchObject({
      id: 'mobile-snapshot-relationship-delete-20260602090000000',
      reason: 'relationship-delete',
      document,
    });
    await expect(
      deleteMobileRecoverySnapshotById(storage, secondSnapshot.id)
    ).resolves.toBe(true);
    await expect(
      deleteMobileRecoverySnapshotById(storage, secondSnapshot.id)
    ).resolves.toBe(false);
    await expect(loadMobileRecoverySnapshot(storage)).resolves.toMatchObject({
      reason: 'permanent-delete',
    });
    await expect(deleteMobileRecoverySnapshot(storage)).resolves.toBe(true);
    await expect(loadMobileRecoverySnapshot(storage)).resolves.toBeNull();
  });

  it('creates distinct recovery snapshot ids for rapid repeated actions', () => {
    const document = createSeedWorldDocument();
    const firstSnapshot = createMobileRecoverySnapshot(document, 'reset');
    const secondSnapshot = createMobileRecoverySnapshot(document, 'reset');

    expect(firstSnapshot.id).not.toBe(secondSnapshot.id);
  });
});
