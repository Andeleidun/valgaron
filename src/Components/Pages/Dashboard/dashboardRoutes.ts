import { pageIds } from '../../../Utlilities/config';
import type {
  DashboardCommunityTabType,
  DashboardConnectionsTabType,
  DashboardNotificationFilterType,
  DashboardSectionType,
} from '../../../types';
import {
  DASHBOARD_DEFAULT_COMMUNITY_TAB,
  DASHBOARD_DEFAULT_CONNECTIONS_TAB,
  DASHBOARD_DEFAULT_NOTIFICATION_FILTER,
} from './dashboardConstants';

/**
 * Canonical route paths for dashboard sections.
 */
export const dashboardSectionPaths: Record<DashboardSectionType, string> = {
  overview: `/${pageIds.dashboard}`,
  profile: `/${pageIds.dashboard}/${pageIds.profile}`,
  connections: `/${pageIds.dashboard}/connections`,
  community: `/${pageIds.dashboard}/community`,
  notifications: `/${pageIds.dashboard}/notifications`,
  settings: `/${pageIds.dashboard}/settings`,
};

const DASHBOARD_CONNECTIONS_TABS = new Set<DashboardConnectionsTabType>([
  'connections',
  'interested',
  'requests',
]);

const DASHBOARD_COMMUNITY_TABS = new Set<DashboardCommunityTabType>([
  'joined',
  'discover',
  'activity',
]);

const DASHBOARD_NOTIFICATION_FILTERS = new Set<DashboardNotificationFilterType>(
  ['all', 'connections', 'community', 'messages', 'profile']
);

/**
 * Parse the connections tab query parameter with a safe default.
 */
export const parseConnectionsTab = (
  value: string | null
): DashboardConnectionsTabType =>
  value && DASHBOARD_CONNECTIONS_TABS.has(value as DashboardConnectionsTabType)
    ? (value as DashboardConnectionsTabType)
    : DASHBOARD_DEFAULT_CONNECTIONS_TAB;

/**
 * Parse the community tab query parameter with a safe default.
 */
export const parseCommunityTab = (
  value: string | null
): DashboardCommunityTabType =>
  value && DASHBOARD_COMMUNITY_TABS.has(value as DashboardCommunityTabType)
    ? (value as DashboardCommunityTabType)
    : DASHBOARD_DEFAULT_COMMUNITY_TAB;

/**
 * Parse the notifications filter query parameter with a safe default.
 */
export const parseNotificationFilter = (
  value: string | null
): DashboardNotificationFilterType =>
  value &&
  DASHBOARD_NOTIFICATION_FILTERS.has(value as DashboardNotificationFilterType)
    ? (value as DashboardNotificationFilterType)
    : DASHBOARD_DEFAULT_NOTIFICATION_FILTER;

/**
 * Build the canonical connections route for a specific tab.
 */
export const buildConnectionsPath = (
  tab: DashboardConnectionsTabType = DASHBOARD_DEFAULT_CONNECTIONS_TAB,
  previewId?: string
): string =>
  `${dashboardSectionPaths.connections}?tab=${tab}${
    previewId ? `&preview=${encodeURIComponent(previewId)}` : ''
  }`;

/**
 * Build the canonical community route for a specific tab.
 */
export const buildCommunityPath = ({
  tab = DASHBOARD_DEFAULT_COMMUNITY_TAB,
  previewId,
}: {
  tab?: DashboardCommunityTabType;
  previewId?: string;
} = {}): string =>
  `${dashboardSectionPaths.community}?tab=${tab}${
    previewId ? `&preview=${encodeURIComponent(previewId)}` : ''
  }`;

/**
 * Build the canonical notifications route for a specific filter.
 */
export const buildNotificationsPath = ({
  filter = DASHBOARD_DEFAULT_NOTIFICATION_FILTER,
}: {
  filter?: DashboardNotificationFilterType;
} = {}): string => `${dashboardSectionPaths.notifications}?filter=${filter}`;

/**
 * Build a messages route that can deep-link into a direct or group thread.
 */
export const buildMessagesPath = ({
  contactId,
  groupId,
}: {
  contactId?: string;
  groupId?: string;
} = {}): string => {
  const params = new URLSearchParams();
  if (contactId) {
    params.set('contactId', contactId);
  }
  if (groupId) {
    params.set('groupId', groupId);
  }

  const query = params.toString();
  return query.length > 0 ? `/messages?${query}` : '/messages';
};

/**
 * Build the canonical discovery route.
 */
export const buildDiscoveryPath = (): string => '/';

/**
 * Build the canonical direct-request route inside the dashboard workspace.
 */
export const buildDirectRequestPath = (): string =>
  `${buildConnectionsPath('requests')}&directRequest=1`;

/**
 * Legacy dashboard child routes redirected into the consolidated connections workspace.
 */
export const dashboardLegacyRedirectPaths = {
  connections: buildConnectionsPath('connections'),
  interested: buildConnectionsPath('interested'),
} as const;
