import { describe, expect, it } from '@jest/globals';
import { createMemoryStringStorage } from '@valgaron/platform';
import {
  clearMobileDashboardPreferences,
  MOBILE_DASHBOARD_STORAGE_KEY,
  loadMobileDashboardPreferences,
  saveMobileDashboardPreferences,
} from './mobileDashboardStorage';

describe('mobile dashboard storage', () => {
  it('round trips section order and collapse preferences', async () => {
    const storage = createMemoryStringStorage();
    await saveMobileDashboardPreferences(storage, {
      version: 1,
      screens: {
        overview: {
          order: ['recent', 'search'],
          collapsed: ['search'],
        },
      },
    });
    await expect(loadMobileDashboardPreferences(storage)).resolves.toEqual({
      version: 1,
      screens: {
        overview: {
          order: ['recent', 'search'],
          collapsed: ['search'],
        },
      },
    });
  });

  it('recovers from invalid stored data', async () => {
    const storage = createMemoryStringStorage({
      'valgaron.dashboardSections.v1': '{bad',
    });
    await expect(loadMobileDashboardPreferences(storage)).resolves.toEqual({
      version: 1,
      screens: {},
    });
  });

  it('reports adapter write failures', async () => {
    const storage = createMemoryStringStorage();
    storage.write = async () => false;
    await expect(
      saveMobileDashboardPreferences(storage, { version: 1, screens: {} })
    ).resolves.toBe(false);
  });

  it('ignores preferences for unknown screens', async () => {
    const storage = createMemoryStringStorage({
      [MOBILE_DASHBOARD_STORAGE_KEY]: JSON.stringify({
        version: 1,
        screens: {
          unknown: { order: ['unsafe'], collapsed: ['unsafe'] },
        },
      }),
    });
    await expect(loadMobileDashboardPreferences(storage)).resolves.toEqual({
      version: 1,
      screens: {},
    });
  });

  it('clears all saved section layouts', async () => {
    const storage = createMemoryStringStorage({
      [MOBILE_DASHBOARD_STORAGE_KEY]: JSON.stringify({
        version: 1,
        screens: { overview: { order: [], collapsed: [] } },
      }),
    });
    await expect(clearMobileDashboardPreferences(storage)).resolves.toBe(true);
    await expect(
      storage.read(MOBILE_DASHBOARD_STORAGE_KEY)
    ).resolves.toBeNull();
  });
});
