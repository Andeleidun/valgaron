import { afterEach, beforeEach, describe, expect, it } from '@jest/globals';
import type { WorldDocument } from '../types';
import {
  MAX_RECOVERY_SNAPSHOTS,
  RECOVERY_SNAPSHOT_STORAGE_KEY,
  addRecoverySnapshot,
  deleteRecoverySnapshot,
  loadRecoverySnapshots,
  summarizeRecoverySnapshots,
} from './codexSnapshots';
import { createSeedWorldDocument } from './seedCodex';
import { getActiveWorld } from './worldDocument';

class MemoryStorage {
  private readonly entries = new Map<string, string>();

  shouldThrowOnSet = false;

  getItem(key: string): string | null {
    return this.entries.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    if (this.shouldThrowOnSet) {
      throw new Error('Storage write failed.');
    }
    this.entries.set(key, value);
  }
}

function installWindow(storage: MemoryStorage): void {
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: {
      localStorage: storage,
    },
  });
}

function renamedDocument(name: string): WorldDocument {
  const document = createSeedWorldDocument();
  const activeWorld = getActiveWorld(document);
  return {
    ...document,
    worlds: document.worlds.map((world) =>
      world.id === activeWorld.id ? { ...world, name } : world
    ),
    savedAt: new Date().toISOString(),
  };
}

describe('codex recovery snapshots', () => {
  let storage: MemoryStorage;

  beforeEach(() => {
    storage = new MemoryStorage();
    installWindow(storage);
  });

  afterEach(() => {
    Reflect.deleteProperty(globalThis, 'window');
  });

  it('loads no snapshots when storage is empty or invalid', () => {
    expect(loadRecoverySnapshots()).toEqual([]);

    storage.setItem(RECOVERY_SNAPSHOT_STORAGE_KEY, '{not valid json');

    expect(loadRecoverySnapshots()).toEqual([]);
  });

  it('adds and summarizes recovery snapshots', () => {
    const result = addRecoverySnapshot(createSeedWorldDocument(), 'reset');
    const snapshots = loadRecoverySnapshots();

    expect(result.ok).toBe(true);
    expect(snapshots).toHaveLength(1);
    expect(summarizeRecoverySnapshots(snapshots)).toEqual([
      expect.objectContaining({
        id: result.snapshot.id,
        reason: 'reset',
        activeWorldName: 'Sample Atlas',
        worldCount: 1,
        entryCount: 10,
        relationshipCount: 5,
      }),
    ]);
  });

  it('keeps only the most recent recovery snapshots', () => {
    for (let index = 0; index < MAX_RECOVERY_SNAPSHOTS + 2; index += 1) {
      addRecoverySnapshot(renamedDocument(`Snapshot ${index}`), 'import');
    }

    const summaries = summarizeRecoverySnapshots(loadRecoverySnapshots());

    expect(summaries).toHaveLength(MAX_RECOVERY_SNAPSHOTS);
    expect(summaries[0].activeWorldName).toBe(
      `Snapshot ${MAX_RECOVERY_SNAPSHOTS + 1}`
    );
    expect(
      summaries.some((summary) => summary.activeWorldName === 'Snapshot 0')
    ).toBe(false);
  });

  it('deletes a recovery snapshot by id', () => {
    const result = addRecoverySnapshot(createSeedWorldDocument(), 'reset');

    expect(deleteRecoverySnapshot(result.snapshot.id)).toEqual([]);
    expect(loadRecoverySnapshots()).toEqual([]);
  });

  it('reports write failure without losing the in-memory snapshot result', () => {
    storage.shouldThrowOnSet = true;

    const result = addRecoverySnapshot(
      createSeedWorldDocument(),
      'permanent-delete'
    );

    expect(result.ok).toBe(false);
    expect(result.snapshots).toHaveLength(1);
    expect(loadRecoverySnapshots()).toEqual([]);
  });

  it('loads all current destructive-action snapshot reasons', () => {
    const document = createSeedWorldDocument();
    storage.setItem(
      RECOVERY_SNAPSHOT_STORAGE_KEY,
      JSON.stringify([
        {
          id: 'snapshot-workspace-delete-test',
          reason: 'workspace-delete',
          createdAt: '2026-06-01T00:00:00.000Z',
          document,
        },
        {
          id: 'snapshot-planetary-delete-test',
          reason: 'planetary-world-delete',
          createdAt: '2026-06-01T00:01:00.000Z',
          document,
        },
        {
          id: 'snapshot-entry-type-delete-test',
          reason: 'entry-type-delete',
          createdAt: '2026-06-01T00:02:00.000Z',
          document,
        },
      ])
    );

    expect(loadRecoverySnapshots().map((snapshot) => snapshot.reason)).toEqual([
      'entry-type-delete',
      'planetary-world-delete',
      'workspace-delete',
    ]);
  });
});
