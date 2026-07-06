import { afterEach, beforeEach, describe, expect, it } from '@jest/globals';
import {
  CODEX_STORAGE_KEY,
  loadWorldDocument,
  loadWorldDocumentWithStatus,
  resetWorldDocumentStorage,
  saveWorldDocument,
} from './codexStorage';
import { createSeedWorldDocument, getActiveWorld } from '@valgaron/core';

class MemoryStorage {
  private readonly entries = new Map<string, string>();

  shouldThrowOnSet = false;

  shouldThrowOnGet = false;

  get length(): number {
    return this.entries.size;
  }

  clear(): void {
    this.entries.clear();
  }

  getItem(key: string): string | null {
    if (this.shouldThrowOnGet) {
      throw new Error('Storage read failed.');
    }
    return this.entries.get(key) ?? null;
  }

  key(index: number): string | null {
    return Array.from(this.entries.keys())[index] ?? null;
  }

  removeItem(key: string): void {
    this.entries.delete(key);
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

describe('codex storage', () => {
  let storage: MemoryStorage;

  beforeEach(() => {
    storage = new MemoryStorage();
    installWindow(storage);
  });

  afterEach(() => {
    Reflect.deleteProperty(globalThis, 'window');
  });

  it('loads seed data when storage is empty', () => {
    expect(loadWorldDocument()).toEqual(createSeedWorldDocument());
  });

  it('uses safe fallbacks outside the browser runtime', () => {
    Reflect.deleteProperty(globalThis, 'window');

    expect(loadWorldDocument()).toEqual(createSeedWorldDocument());
    expect(saveWorldDocument(createSeedWorldDocument())).toBe(false);
  });

  it('saves and loads a valid world document', () => {
    const document = createSeedWorldDocument();
    const activeWorld = getActiveWorld(document);
    const editedDocument = {
      ...document,
      worlds: document.worlds.map((world) =>
        world.id === activeWorld.id
          ? {
              ...world,
              name: 'Edited World',
            }
          : world
      ),
    };

    expect(saveWorldDocument(editedDocument)).toBe(true);

    expect(loadWorldDocument()).toEqual(editedDocument);
  });

  it('does not throw when storage writes fail', () => {
    storage.shouldThrowOnSet = true;

    expect(saveWorldDocument(createSeedWorldDocument())).toBe(false);
  });

  it('falls back to seed data for invalid stored JSON', () => {
    storage.setItem(CODEX_STORAGE_KEY, '{not valid json');

    expect(loadWorldDocument()).toEqual(createSeedWorldDocument());
  });

  it('reports recovery when stored JSON falls back to seed data', () => {
    storage.setItem(CODEX_STORAGE_KEY, '{not valid json');

    const result = loadWorldDocumentWithStatus();

    expect(result.document).toEqual(createSeedWorldDocument());
    expect(result.status.state).toBe('recovered');
    expect(result.status.source).toBe('seed');
    expect(result.status.issues).toContain(
      `${CODEX_STORAGE_KEY} is not valid JSON.`
    );
  });

  it('falls back to seed data when storage reads fail', () => {
    storage.shouldThrowOnGet = true;

    expect(loadWorldDocument()).toEqual(createSeedWorldDocument());
  });

  it('reports recovery when local storage reads fail', () => {
    storage.shouldThrowOnGet = true;

    const result = loadWorldDocumentWithStatus();

    expect(result.document).toEqual(createSeedWorldDocument());
    expect(result.status.state).toBe('recovered');
    expect(result.status.issues).toHaveLength(1);
    expect(result.status.issues[0]).toContain('could not be read');
  });

  it('falls back to seed data when the stored document has invalid timestamps', () => {
    const document = createSeedWorldDocument();
    const activeWorld = getActiveWorld(document);
    const invalidDocument = {
      ...document,
      worlds: document.worlds.map((world) =>
        world.id === activeWorld.id
          ? {
              ...world,
              codex: {
                ...world.codex,
                characters: [
                  {
                    ...world.codex.characters[0],
                    updatedAt: 'not-a-date',
                  },
                ],
              },
            }
          : world
      ),
    };
    storage.setItem(CODEX_STORAGE_KEY, JSON.stringify(invalidDocument));

    expect(loadWorldDocument()).toEqual(createSeedWorldDocument());
  });

  it('creates a fresh seed world document for reset flows', () => {
    const resetDocument = resetWorldDocumentStorage();

    expect(resetDocument).toEqual(createSeedWorldDocument());
    expect(storage.getItem(CODEX_STORAGE_KEY)).toBeNull();
  });

  it('persists reset documents through the normal save path', () => {
    const resetDocument = resetWorldDocumentStorage();

    expect(saveWorldDocument(resetDocument)).toBe(true);
    expect(JSON.parse(storage.getItem(CODEX_STORAGE_KEY) ?? '')).toEqual(
      createSeedWorldDocument()
    );
  });
});
