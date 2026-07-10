import { afterEach, beforeEach, describe, expect, it } from '@jest/globals';
import {
  DASHBOARD_LAYOUT_STORAGE_KEY,
  clearDashboardPreferenceDocument,
  LEGACY_WORKBENCH_LAYOUT_STORAGE_KEY,
  loadDashboardPreferenceDocument,
  saveDashboardPreferenceDocument,
} from './dashboardLayoutStorage';

class MemoryStorage {
  readonly entries = new Map<string, string>();
  getItem(key: string) {
    return this.entries.get(key) ?? null;
  }
  setItem(key: string, value: string) {
    this.entries.set(key, value);
  }
  removeItem(key: string) {
    this.entries.delete(key);
  }
}

describe('dashboard layout storage', () => {
  let storage: MemoryStorage;

  beforeEach(() => {
    storage = new MemoryStorage();
    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      value: { localStorage: storage },
    });
  });

  afterEach(() => {
    Reflect.deleteProperty(globalThis, 'window');
  });

  it('returns a valid empty preference document by default', () => {
    expect(loadDashboardPreferenceDocument()).toMatchObject({
      version: 1,
      pages: {},
    });
  });

  it('migrates and removes the legacy Workbench preference', () => {
    storage.setItem(
      LEGACY_WORKBENCH_LAYOUT_STORAGE_KEY,
      JSON.stringify({ isIndexCollapsed: true, isContextCollapsed: false })
    );
    const document = loadDashboardPreferenceDocument();
    expect(
      document.pages.workbench?.cards['workbench.records']?.collapsed
    ).toBe(true);
    expect(storage.getItem(LEGACY_WORKBENCH_LAYOUT_STORAGE_KEY)).toBeNull();
    expect(storage.getItem(DASHBOARD_LAYOUT_STORAGE_KEY)).not.toBeNull();
  });

  it('saves preference documents safely', () => {
    const document = loadDashboardPreferenceDocument();
    expect(saveDashboardPreferenceDocument(document)).toBe(true);
  });

  it('clears all dashboard layouts', () => {
    storage.setItem(DASHBOARD_LAYOUT_STORAGE_KEY, '{}');
    expect(clearDashboardPreferenceDocument()).toBe(true);
    expect(storage.getItem(DASHBOARD_LAYOUT_STORAGE_KEY)).toBeNull();
  });
});
