import {
  buildCommunityPath,
  buildConnectionsPath,
  buildMessagesPath,
  buildNotificationsPath,
  dashboardLegacyRedirectPaths,
  dashboardSectionPaths,
  parseCommunityTab,
  parseConnectionsTab,
  parseNotificationFilter,
} from '../dashboardRoutes';

describe('dashboardRoutes', () => {
  test('exposes canonical dashboard section paths', () => {
    expect(dashboardSectionPaths.overview).toBe('/dashboard');
    expect(dashboardSectionPaths.profile).toBe('/dashboard/profile');
    expect(dashboardSectionPaths.connections).toBe('/dashboard/connections');
    expect(dashboardSectionPaths.community).toBe('/dashboard/community');
    expect(dashboardSectionPaths.notifications).toBe(
      '/dashboard/notifications'
    );
    expect(dashboardSectionPaths.settings).toBe('/dashboard/settings');
  });

  test('parses connections tabs with a safe default', () => {
    expect(parseConnectionsTab('connections')).toBe('connections');
    expect(parseConnectionsTab('interested')).toBe('interested');
    expect(parseConnectionsTab('requests')).toBe('requests');
    expect(parseConnectionsTab('unknown')).toBe('connections');
    expect(parseConnectionsTab(null)).toBe('connections');
  });

  test('parses community tabs with a safe default', () => {
    expect(parseCommunityTab('joined')).toBe('joined');
    expect(parseCommunityTab('discover')).toBe('discover');
    expect(parseCommunityTab('activity')).toBe('activity');
    expect(parseCommunityTab('other')).toBe('joined');
    expect(parseCommunityTab(null)).toBe('joined');
  });

  test('parses notifications filters with a safe default', () => {
    expect(parseNotificationFilter('all')).toBe('all');
    expect(parseNotificationFilter('connections')).toBe('connections');
    expect(parseNotificationFilter('community')).toBe('community');
    expect(parseNotificationFilter('messages')).toBe('messages');
    expect(parseNotificationFilter('profile')).toBe('profile');
    expect(parseNotificationFilter('other')).toBe('all');
    expect(parseNotificationFilter(null)).toBe('all');
  });

  test('builds canonical dashboard routes with defaults and overrides', () => {
    expect(buildConnectionsPath()).toBe(
      '/dashboard/connections?tab=connections'
    );
    expect(buildConnectionsPath('requests')).toBe(
      '/dashboard/connections?tab=requests'
    );
    expect(buildConnectionsPath('connections', 'profile-22')).toBe(
      '/dashboard/connections?tab=connections&preview=profile-22'
    );
    expect(buildCommunityPath()).toBe('/dashboard/community?tab=joined');
    expect(buildCommunityPath({ tab: 'activity' })).toBe(
      '/dashboard/community?tab=activity'
    );
    expect(
      buildCommunityPath({
        tab: 'joined',
        previewId: 'group-22',
      })
    ).toBe('/dashboard/community?tab=joined&preview=group-22');
    expect(buildNotificationsPath()).toBe(
      '/dashboard/notifications?filter=all'
    );
    expect(buildNotificationsPath({ filter: 'community' })).toBe(
      '/dashboard/notifications?filter=community'
    );
    expect(buildMessagesPath()).toBe('/messages');
    expect(buildMessagesPath({ contactId: 'dating-12' })).toBe(
      '/messages?contactId=dating-12'
    );
    expect(buildMessagesPath({ groupId: 'group-7' })).toBe(
      '/messages?groupId=group-7'
    );
  });

  test('maps legacy dashboard child routes to consolidated workspaces', () => {
    expect(dashboardLegacyRedirectPaths.connections).toBe(
      '/dashboard/connections?tab=connections'
    );
    expect(dashboardLegacyRedirectPaths.interested).toBe(
      '/dashboard/connections?tab=interested'
    );
    expect('request' in dashboardLegacyRedirectPaths).toBe(false);
  });
});
