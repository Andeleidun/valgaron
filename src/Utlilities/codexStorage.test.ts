import { afterEach, beforeEach, describe, expect, it } from '@jest/globals';
import {
  CODEX_STORAGE_KEY,
  LEGACY_CODEX_STORAGE_KEY,
  loadCodex,
  loadWorldDocument,
  loadWorldDocumentWithStatus,
  resetCodexStorage,
  resetWorldDocumentStorage,
  saveCodex,
  saveWorldDocument,
} from './codexStorage';
import {
  createSeedCodex,
  createSeedWorldDocument,
  getActiveWorld,
} from '@valgaron/core';

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
    expect(loadCodex()).toEqual(createSeedCodex());
    expect(loadWorldDocument()).toEqual(createSeedWorldDocument());
  });

  it('uses safe fallbacks outside the browser runtime', () => {
    Reflect.deleteProperty(globalThis, 'window');

    expect(loadCodex()).toEqual(createSeedCodex());
    expect(saveCodex(createSeedCodex())).toBe(false);
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

  it('saves and loads a valid codex through compatibility helpers', () => {
    const codex = createSeedCodex();
    const editedCodex = {
      ...codex,
      characters: [
        {
          ...codex.characters[0],
          name: 'Edited Character',
        },
      ],
    };

    expect(saveCodex(editedCodex)).toBe(true);

    expect(loadCodex()).toEqual(editedCodex);
  });

  it('migrates a legacy codex document from the v1 storage key', () => {
    const legacyCodex = createSeedCodex();
    storage.setItem(LEGACY_CODEX_STORAGE_KEY, JSON.stringify(legacyCodex));

    const migratedDocument = loadWorldDocument();

    expect(migratedDocument.schemaVersion).toBe(2);
    expect(migratedDocument.worlds).toHaveLength(1);
    expect(getActiveWorld(migratedDocument).codex).toEqual(legacyCodex);
  });

  it('uses legacy storage when the v2 document is invalid', () => {
    const legacyCodex = createSeedCodex();
    storage.setItem(CODEX_STORAGE_KEY, '{not valid json');
    storage.setItem(LEGACY_CODEX_STORAGE_KEY, JSON.stringify(legacyCodex));

    expect(getActiveWorld(loadWorldDocument()).codex).toEqual(legacyCodex);
  });

  it('reports recovery when current storage is invalid but legacy storage loads', () => {
    const legacyCodex = createSeedCodex();
    storage.setItem(CODEX_STORAGE_KEY, '{not valid json');
    storage.setItem(LEGACY_CODEX_STORAGE_KEY, JSON.stringify(legacyCodex));

    const result = loadWorldDocumentWithStatus();

    expect(getActiveWorld(result.document).codex).toEqual(legacyCodex);
    expect(result.status.state).toBe('recovered');
    expect(result.status.source).toBe('legacy');
    expect(result.status.issues).toContain(
      `${CODEX_STORAGE_KEY} is not valid JSON.`
    );
  });

  it('does not throw when storage writes fail', () => {
    storage.shouldThrowOnSet = true;

    expect(saveCodex(createSeedCodex())).toBe(false);
    expect(saveWorldDocument(createSeedWorldDocument())).toBe(false);
  });

  it('falls back to seed data for invalid stored JSON', () => {
    storage.setItem(CODEX_STORAGE_KEY, '{not valid json');

    expect(loadCodex()).toEqual(createSeedCodex());
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

    expect(loadCodex()).toEqual(createSeedCodex());
  });

  it('reports recovery when local storage reads fail', () => {
    storage.shouldThrowOnGet = true;

    const result = loadWorldDocumentWithStatus();

    expect(result.document).toEqual(createSeedWorldDocument());
    expect(result.status.state).toBe('recovered');
    expect(result.status.issues).toHaveLength(2);
    expect(result.status.issues[0]).toContain('could not be read');
  });

  it('falls back to seed data when stored entries have invalid timestamps', () => {
    const codex = createSeedCodex();
    const invalidCodex = {
      ...codex,
      characters: [
        {
          ...codex.characters[0],
          updatedAt: 'not-a-date',
        },
      ],
    };
    storage.setItem(CODEX_STORAGE_KEY, JSON.stringify(invalidCodex));

    expect(loadCodex()).toEqual(createSeedCodex());
  });

  it('resets storage to a fresh seed codex', () => {
    const resetCodex = resetCodexStorage();

    expect(resetCodex).toEqual(createSeedCodex());
    expect(storage.getItem(CODEX_STORAGE_KEY)).toBeNull();
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
