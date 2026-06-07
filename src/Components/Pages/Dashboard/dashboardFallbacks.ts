import type {
  CommonStringsType,
  ConnectionStyleStringsType,
  DashboardGuidanceStringsType,
  DashboardStringsType,
  PageStringsType,
  ProfileStringsType,
} from '../../../types';
import fetchTranslations from '../../../Utlilities/translations';

const translations = fetchTranslations();
const dashboardFallbackStrings = {
  dashboard: translations.dashboard,
  dashboardGuidance: translations.dashboardGuidance,
  common: translations.common,
  connectionStyle: translations.connectionStyle,
  pages: translations.pages,
  profile: translations.profile,
};

type DashboardFallbackStringGroups = {
  dashboard: DashboardStringsType;
  dashboardGuidance: DashboardGuidanceStringsType;
  common: CommonStringsType;
  connectionStyle: ConnectionStyleStringsType;
  pages: PageStringsType;
  profile: ProfileStringsType;
};

/**
 * Resolve dashboard-related translation groups with safe fallbacks.
 */
export const getDashboardFallbackStrings = (): DashboardFallbackStringGroups =>
  dashboardFallbackStrings;

/**
 * Merge partial dashboard string groups onto the shared fallback bundle.
 */
export const resolveDashboardStringGroups = <
  T extends Partial<DashboardFallbackStringGroups>
>(
  strings?: T
): DashboardFallbackStringGroups & T =>
  ({
    ...dashboardFallbackStrings,
    ...strings,
  } as DashboardFallbackStringGroups & T);
