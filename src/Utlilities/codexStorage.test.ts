import { afterEach, beforeEach, describe, expect, it } from '@jest/globals';
import {
  CODEX_STORAGE_KEY,
  loadCodex,
  resetCodexStorage,
  saveCodex,
} from './codexStorage';
import { createSeedCodex } from './seedCodex';

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
  });

  it('uses safe fallbacks outside the browser runtime', () => {
    Reflect.deleteProperty(globalThis, 'window');

    expect(loadCodex()).toEqual(createSeedCodex());
    expect(saveCodex(createSeedCodex())).toBe(false);
  });

  it('saves and loads a valid codex document', () => {
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

  it('does not throw when storage writes fail', () => {
    storage.shouldThrowOnSet = true;

    expect(saveCodex(createSeedCodex())).toBe(false);
  });

  it('falls back to seed data for invalid stored JSON', () => {
    storage.setItem(CODEX_STORAGE_KEY, '{not valid json');

    expect(loadCodex()).toEqual(createSeedCodex());
  });

  it('falls back to seed data when storage reads fail', () => {
    storage.shouldThrowOnGet = true;

    expect(loadCodex()).toEqual(createSeedCodex());
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
    expect(JSON.parse(storage.getItem(CODEX_STORAGE_KEY) ?? '')).toEqual(
      createSeedCodex()
    );
  });
});
