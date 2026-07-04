import { describe, expect, it } from '@jest/globals';
import { createSeedWorldDocument } from '@valgaron/core';
import { createMemoryStringStorage } from '@valgaron/platform';
import {
  MOBILE_RECOVERY_SNAPSHOT_STORAGE_KEY,
  createMobileRecoverySnapshot,
  deleteMobileRecoverySnapshot,
  loadMobileRecoverySnapshot,
  loadMobileWorldDocument,
  parseMobileWorldImport,
  saveMobileRecoverySnapshot,
  saveMobileWorldDocument,
} from './mobileStorage';

describe('mobile storage', () => {
  it('loads starter data when no device-local document exists', async () => {
    const storage = createMemoryStringStorage();

    await expect(loadMobileWorldDocument(storage)).resolves.toMatchObject({
      status: { source: 'seed' },
      document: { schemaVersion: 2 },
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

  it('stores one recovery snapshot before destructive mobile actions', async () => {
    const storage = createMemoryStringStorage();
    const document = createSeedWorldDocument();
    const snapshot = createMobileRecoverySnapshot(document, 'permanent-delete');

    await expect(saveMobileRecoverySnapshot(storage, snapshot)).resolves.toBe(
      true
    );
    expect(storage.snapshot()[MOBILE_RECOVERY_SNAPSHOT_STORAGE_KEY]).toContain(
      'permanent-delete'
    );
    await expect(loadMobileRecoverySnapshot(storage)).resolves.toMatchObject({
      id: expect.stringContaining('mobile-snapshot-permanent-delete'),
      reason: 'permanent-delete',
      document,
    });
    await expect(deleteMobileRecoverySnapshot(storage)).resolves.toBe(true);
    await expect(loadMobileRecoverySnapshot(storage)).resolves.toBeNull();
  });

  it('loads legacy mobile entry-delete snapshots as permanent delete snapshots', async () => {
    const document = createSeedWorldDocument();
    const storage = createMemoryStringStorage({
      [MOBILE_RECOVERY_SNAPSHOT_STORAGE_KEY]: JSON.stringify({
        id: 'mobile-snapshot-entry-delete-legacy',
        reason: 'entry-delete',
        createdAt: '2026-06-01T09:00:00.000Z',
        document,
      }),
    });

    await expect(loadMobileRecoverySnapshot(storage)).resolves.toMatchObject({
      id: 'mobile-snapshot-entry-delete-legacy',
      reason: 'permanent-delete',
      document,
    });
  });
});
