import type { AsyncStringStorageAdapter } from '@valgaron/platform';

export const MOBILE_DASHBOARD_STORAGE_KEY = 'valgaron.dashboardSections.v1';

export type MobileDashboardScreenId =
  | 'overview'
  | 'workbench'
  | 'timeline'
  | 'links'
  | 'more'
  | 'data'
  | 'workspaces'
  | 'help';

export type MobileSectionPreference = {
  order: readonly string[];
  collapsed: readonly string[];
};

export type MobileDashboardPreferenceDocument = {
  version: 1;
  screens: Partial<Record<MobileDashboardScreenId, MobileSectionPreference>>;
};

const mobileDashboardScreenIds: readonly MobileDashboardScreenId[] = [
  'overview',
  'workbench',
  'timeline',
  'links',
  'more',
  'data',
  'workspaces',
  'help',
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function stringList(value: unknown): readonly string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : [];
}

export async function loadMobileDashboardPreferences(
  storage: AsyncStringStorageAdapter
): Promise<MobileDashboardPreferenceDocument> {
  try {
    const raw = await storage.read(MOBILE_DASHBOARD_STORAGE_KEY);
    if (!raw) return { version: 1, screens: {} };
    const parsed: unknown = JSON.parse(raw);
    if (
      !isRecord(parsed) ||
      parsed.version !== 1 ||
      !isRecord(parsed.screens)
    ) {
      return { version: 1, screens: {} };
    }
    const screens: MobileDashboardPreferenceDocument['screens'] = {};
    for (const [screenId, value] of Object.entries(parsed.screens)) {
      if (
        !mobileDashboardScreenIds.includes(
          screenId as MobileDashboardScreenId
        ) ||
        !isRecord(value)
      ) {
        continue;
      }
      screens[screenId as MobileDashboardScreenId] = {
        order: stringList(value.order),
        collapsed: stringList(value.collapsed),
      };
    }
    return { version: 1, screens };
  } catch {
    return { version: 1, screens: {} };
  }
}

export async function saveMobileDashboardPreferences(
  storage: AsyncStringStorageAdapter,
  document: MobileDashboardPreferenceDocument
): Promise<boolean> {
  try {
    return await storage.write(
      MOBILE_DASHBOARD_STORAGE_KEY,
      JSON.stringify(document)
    );
  } catch {
    return false;
  }
}

export async function clearMobileDashboardPreferences(
  storage: AsyncStringStorageAdapter
): Promise<boolean> {
  try {
    return await storage.remove(MOBILE_DASHBOARD_STORAGE_KEY);
  } catch {
    return false;
  }
}
