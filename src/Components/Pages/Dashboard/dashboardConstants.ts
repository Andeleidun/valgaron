import type {
  DashboardCommunityTabType,
  DashboardConnectionsTabType,
  DashboardNotificationFilterType,
  DashboardSectionType,
} from '../../../types';

/**
 * Shared section order for the dashboard top-tab workspace navigation.
 */
export const DASHBOARD_SECTION_ORDER: DashboardSectionType[] = [
  'overview',
  'profile',
  'connections',
  'community',
  'notifications',
  'settings',
];

/**
 * Default connections tab when no explicit query parameter is provided.
 */
export const DASHBOARD_DEFAULT_CONNECTIONS_TAB: DashboardConnectionsTabType =
  'connections';

/**
 * Default community tab when no explicit query parameter is provided.
 */
export const DASHBOARD_DEFAULT_COMMUNITY_TAB: DashboardCommunityTabType =
  'joined';

/**
 * Default notifications filter when no explicit query parameter is provided.
 */
export const DASHBOARD_DEFAULT_NOTIFICATION_FILTER: DashboardNotificationFilterType =
  'all';
