import {
  createDashboardPreferenceDocument,
  createDashboardPagePreference,
  dashboardCardDefinitions,
  getDashboardPreset,
  parseDashboardPreferenceDocument,
  type DashboardPageId,
  type DashboardPagePreference,
  type DashboardPreferenceDocument,
} from '@valgaron/core';
import { browserLocalStorageAdapter } from './storageAdapter';

export const DASHBOARD_LAYOUT_STORAGE_KEY = 'valgaron.dashboardLayout.v1';
export const LEGACY_WORKBENCH_LAYOUT_STORAGE_KEY =
  'valgaron:workbench-layout:v1';

type LegacyWorkbenchPreference = {
  isContextCollapsed?: boolean;
  isIndexCollapsed?: boolean;
};

function migrateLegacyWorkbenchPreference(
  rawValue: string
): DashboardPreferenceDocument | null {
  try {
    const parsed: unknown = JSON.parse(rawValue);
    if (!parsed || typeof parsed !== 'object') return null;
    const legacy = parsed as LegacyWorkbenchPreference;
    const preference = createDashboardPagePreference({
      pageId: 'workbench',
      preset: getDashboardPreset('workbench', 'default'),
      definitions: dashboardCardDefinitions,
    });
    preference.cards['workbench.records']!.collapsed =
      legacy.isIndexCollapsed === true;
    preference.cards['workbench.record-context']!.collapsed =
      legacy.isContextCollapsed === true;
    return createDashboardPreferenceDocument({ workbench: preference });
  } catch {
    return null;
  }
}

export function loadDashboardPreferenceDocument(): DashboardPreferenceDocument {
  const current = parseDashboardPreferenceDocument(
    browserLocalStorageAdapter.read(DASHBOARD_LAYOUT_STORAGE_KEY),
    dashboardCardDefinitions
  );
  if (current) return current;

  const legacyValue = browserLocalStorageAdapter.read(
    LEGACY_WORKBENCH_LAYOUT_STORAGE_KEY
  );
  const migrated = legacyValue
    ? migrateLegacyWorkbenchPreference(legacyValue)
    : null;
  if (migrated && saveDashboardPreferenceDocument(migrated)) {
    browserLocalStorageAdapter.remove(LEGACY_WORKBENCH_LAYOUT_STORAGE_KEY);
    return migrated;
  }
  return createDashboardPreferenceDocument({});
}

export function saveDashboardPreferenceDocument(
  document: DashboardPreferenceDocument
): boolean {
  return browserLocalStorageAdapter.write(
    DASHBOARD_LAYOUT_STORAGE_KEY,
    JSON.stringify(document)
  );
}

export function clearDashboardPreferenceDocument(): boolean {
  return browserLocalStorageAdapter.remove(DASHBOARD_LAYOUT_STORAGE_KEY);
}

export function updateDashboardPagePreference(
  document: DashboardPreferenceDocument,
  pageId: DashboardPageId,
  preference: DashboardPagePreference
): DashboardPreferenceDocument {
  return createDashboardPreferenceDocument({
    ...document.pages,
    [pageId]: preference,
  });
}
