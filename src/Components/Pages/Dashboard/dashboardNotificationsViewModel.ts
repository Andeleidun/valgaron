import type {
  DashboardFeedItemType,
  DashboardNotificationFilterType,
  DashboardNotificationsViewModelType,
  DashboardStringsType,
} from '../../../types';
import { pageIds } from '../../../Utlilities';
import { getDashboardFallbackStrings } from './dashboardFallbacks';
import { buildProfileFreshnessDescription } from './dashboardFreshness';
import {
  buildGroupNotificationId,
  buildInterestNotificationId,
  buildMessageNotificationId,
  buildProfileCompletionNotificationId,
  buildProfileFreshnessNotificationId,
  buildRequestNotificationId,
  getLatestGroupActivityTimestamp,
} from './dashboardNotificationIdentity';
import {
  buildCommunityPath,
  buildConnectionsPath,
  buildMessagesPath,
} from './dashboardRoutes';
import {
  selectCommunityActivityGroups,
  selectNotificationCounts,
  selectOverviewSummary,
  selectVisibleCommunityGroups,
} from './dashboardSelectors';
import { formatDashboardTemplate } from './dashboardStrings';
import {
  selectDashboardDirectChatCounterpart,
  selectDashboardDirectChats,
} from './dashboardDirectChats';
import {
  type DashboardViewModelBaseParamsType,
  getGroupSubtitle,
  getProfileMap,
  getVisibleProfileSummary,
} from './dashboardViewModelShared';

/**
 * Format a short relative time label without adding a date library.
 */
const getRelativeTimeLabel = (
  value: Date | string | undefined,
  language: string,
  strings: DashboardStringsType
): string | undefined => {
  if (!value) {
    return undefined;
  }
  const timestamp = new Date(value).getTime();
  if (Number.isNaN(timestamp)) {
    return undefined;
  }
  const diffMinutes = Math.max(Math.round((Date.now() - timestamp) / 60000), 0);
  if (diffMinutes < 60) {
    return formatDashboardTemplate(
      strings.viewModels.defaults.minuteAgoTemplate[language],
      {
        count: diffMinutes,
      }
    );
  }
  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) {
    return formatDashboardTemplate(
      strings.viewModels.defaults.hourAgoTemplate[language],
      {
        count: diffHours,
      }
    );
  }
  const diffDays = Math.round(diffHours / 24);
  return formatDashboardTemplate(
    strings.viewModels.defaults.dayAgoTemplate[language],
    {
      count: diffDays,
    }
  );
};

/**
 * Build the dashboard notifications page model.
 */
export const buildDashboardNotificationsViewModel = ({
  modeId,
  activeFilter,
  language,
  strings = getDashboardFallbackStrings().dashboard,
  user,
  relationshipState,
}: DashboardViewModelBaseParamsType & {
  activeFilter: DashboardNotificationFilterType;
}): DashboardNotificationsViewModelType => {
  const overviewSummary = selectOverviewSummary({
    modeId,
    user,
    relationshipState,
  });
  const modeState = relationshipState.byMode[modeId];
  const profiles = getProfileMap(modeId);
  const relationshipItems = [
    ...modeState.incomingInterestIds.flatMap((profileId) => {
      const profile = profiles.get(profileId);
      const visibleSummary = profile
        ? getVisibleProfileSummary({
            profile,
            viewer: user[modeId],
            isConnection: modeState.connectionIds.includes(profile.id),
            language,
            strings,
          })
        : null;
      return profile
        ? [
            {
              id: buildInterestNotificationId(profile.id),
              type: 'connections' as const,
              title: formatDashboardTemplate(
                strings.viewModels.notifications.wantsToConnectTemplate[
                  language
                ],
                {
                  name:
                    visibleSummary?.name ??
                    strings.viewModels.defaults.unnamedProfile[language],
                }
              ),
              description:
                visibleSummary?.subtitle ??
                strings.viewModels.defaults.profileReadyToReview[language],
              primaryAction: {
                label:
                  strings.viewModels.notifications.openConnections[language],
                path: buildConnectionsPath('interested', profile.id),
              },
            },
          ]
        : [];
    }),
    ...modeState.incomingConnectionRequestIds.flatMap((profileId) => {
      const profile = profiles.get(profileId);
      const visibleSummary = profile
        ? getVisibleProfileSummary({
            profile,
            viewer: user[modeId],
            isConnection: modeState.connectionIds.includes(profile.id),
            language,
            strings,
          })
        : null;
      return profile
        ? [
            {
              id: buildRequestNotificationId(profile.id),
              type: 'connections' as const,
              title: formatDashboardTemplate(
                strings.viewModels.notifications.directRequestTemplate[
                  language
                ],
                {
                  name:
                    visibleSummary?.name ??
                    strings.viewModels.defaults.unnamedProfile[language],
                }
              ),
              description:
                visibleSummary?.subtitle ??
                strings.viewModels.defaults.profileReadyToReview[language],
              primaryAction: {
                label: strings.viewModels.notifications.review[language],
                path: buildConnectionsPath('requests', profile.id),
              },
            },
          ]
        : [];
    }),
  ];

  const communityItems = selectCommunityActivityGroups(
    selectVisibleCommunityGroups({
      modeId,
      relationshipState,
    })
  ).map((group): DashboardFeedItemType => {
    const latestActivityTimestamp = getLatestGroupActivityTimestamp(group);

    return {
      id: buildGroupNotificationId(group),
      type: 'community',
      title: formatDashboardTemplate(
        strings.viewModels.notifications.groupActivityTemplate[language],
        {
          name: group.groupName,
        }
      ),
      description: getGroupSubtitle({ group, language, strings }),
      timestampLabel: getRelativeTimeLabel(
        latestActivityTimestamp,
        language,
        strings
      ),
      primaryAction: {
        label: strings.viewModels.notifications.openGroup[language],
        path: buildCommunityPath({
          tab: 'activity',
          previewId: group.id,
        }),
      },
    };
  });

  const messageItems = selectDashboardDirectChats({
    modeId,
    relationshipState,
  }).map((chat, index): DashboardFeedItemType => {
    const contact = selectDashboardDirectChatCounterpart(chat);
    const latestMessage = chat.messages.at(-1);
    return {
      id: buildMessageNotificationId({
        contactId: contact?.id,
        fallbackIndex: index,
        sentAt: latestMessage?.sentAt,
      }),
      type: 'messages',
      title: formatDashboardTemplate(
        strings.viewModels.notifications.conversationWithTemplate[language],
        {
          name:
            contact?.name ||
            strings.viewModels.defaults.contactFallback[language],
        }
      ),
      description:
        latestMessage?.text ||
        strings.viewModels.defaults.readyToContinue[language],
      timestampLabel: getRelativeTimeLabel(
        latestMessage?.sentAt,
        language,
        strings
      ),
      primaryAction: {
        label: strings.viewModels.notifications.openMessages[language],
        path: buildMessagesPath({
          contactId: contact?.id,
        }),
      },
    };
  });

  const profileItems: DashboardFeedItemType[] =
    user[modeId] && overviewSummary.completion.percentage < 100
      ? [
          {
            id: buildProfileCompletionNotificationId(modeId),
            type: 'profile',
            title:
              strings.viewModels.notifications.profileNeedsWorkTitle[language],
            description:
              strings.viewModels.notifications.profileNeedsWorkDescription[
                language
              ],
            primaryAction: {
              label: strings.viewModels.notifications.editProfile[language],
              path: `/dashboard/${pageIds.profile}`,
            },
          },
        ]
      : overviewSummary.freshness.isActionable
      ? [
          {
            id: buildProfileFreshnessNotificationId(modeId),
            type: 'profile',
            title: strings.viewModels.freshness.title[language],
            description: buildProfileFreshnessDescription({
              freshness: overviewSummary.freshness,
              language,
              strings,
            }),
            primaryAction: {
              label: strings.viewModels.freshness.refreshCta[language],
              path: `/dashboard/${pageIds.profile}`,
            },
          },
        ]
      : [];

  const items = [
    ...relationshipItems,
    ...communityItems,
    ...messageItems,
    ...profileItems,
  ].filter((item) => activeFilter === 'all' || item.type === activeFilter);

  return {
    activeFilter,
    items,
  };
};

/**
 * Build summary copy for the notifications header.
 */
export const buildNotificationsSubtitle = ({
  modeId,
  language,
  strings = getDashboardFallbackStrings().dashboard,
  user,
  relationshipState,
}: DashboardViewModelBaseParamsType): string => {
  const counts = selectNotificationCounts({
    modeId,
    user,
    relationshipState,
  });
  return formatDashboardTemplate(
    strings.viewModels.summaries.notificationsTemplate[language],
    {
      count: counts.all,
    }
  );
};
