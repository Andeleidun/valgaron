import { afterEach, beforeEach, describe, expect, it } from '@jest/globals';
import { browserLocalStorageAdapter } from './storageAdapter';

class MemoryStorage {
  private readonly entries = new Map<string, string>();

  shouldThrowOnSet = false;

  shouldThrowOnGet = false;

  getItem(key: string): string | null {
    if (this.shouldThrowOnGet) {
      throw new Error('Storage read failed.');
    }
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

describe('browser localStorage adapter', () => {
  let storage: MemoryStorage;

  beforeEach(() => {
    storage = new MemoryStorage();
    installWindow(storage);
  });

  afterEach(() => {
    Reflect.deleteProperty(globalThis, 'window');
  });

  it('reads and writes strings in browser storage', () => {
    expect(browserLocalStorageAdapter.write('key', 'value')).toBe(true);
    expect(browserLocalStorageAdapter.read('key')).toBe('value');
    expect(browserLocalStorageAdapter.readResult('key')).toEqual({
      ok: true,
      value: 'value',
    });
  });

  it('uses safe fallbacks when browser storage is unavailable', () => {
    Reflect.deleteProperty(globalThis, 'window');

    expect(browserLocalStorageAdapter.read('key')).toBeNull();
    expect(browserLocalStorageAdapter.readResult('key')).toEqual({
      ok: false,
      errorMessage: 'Browser localStorage is unavailable.',
    });
    expect(browserLocalStorageAdapter.write('key', 'value')).toBe(false);
  });

  it('uses safe fallbacks when storage throws', () => {
    storage.shouldThrowOnGet = true;
    storage.shouldThrowOnSet = true;

    expect(browserLocalStorageAdapter.read('key')).toBeNull();
    expect(browserLocalStorageAdapter.readResult('key')).toEqual({
      ok: false,
      errorMessage: 'Storage read failed.',
    });
    expect(browserLocalStorageAdapter.write('key', 'value')).toBe(false);
  });
});
