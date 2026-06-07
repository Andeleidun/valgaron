import type {
  DashboardActionItemType,
  DashboardGuidanceModeStringsType,
  DashboardOverviewViewModelType,
  DashboardStringsType,
} from '../../../types';
import { pageIds } from '../../../Utlilities';
import { buildProfileFreshnessDescription } from './dashboardFreshness';
import { getDashboardFallbackStrings } from './dashboardFallbacks';
import {
  buildCommunityPath,
  buildConnectionsPath,
  buildDirectRequestPath,
  buildMessagesPath,
  buildNotificationsPath,
} from './dashboardRoutes';
import {
  selectCommunityCounts,
  selectDashboardHeroSignals,
  selectDashboardShellSummary,
  selectOverviewSummary,
  selectRelationshipCounts,
} from './dashboardSelectors';
import { formatDashboardTemplate } from './dashboardStrings';
import { selectDashboardDirectChats } from './dashboardDirectChats';
import {
  buildDashboardCommunityActionLabel,
  type DashboardViewModelBaseParamsType,
} from './dashboardViewModelShared';

const getUniqueMessages = (values: string[]): string[] =>
  Array.from(
    new Set(
      values.map((value) => value.trim()).filter((value) => value.length > 0)
    )
  );

const resolveGuidanceMessage = (
  messages: Record<string, { [key: string]: string }>,
  id: string,
  language: string
): string => messages[id]?.[language] ?? messages[id]?.en ?? '';

const hasConnectionStyleSelections = (
  user: DashboardViewModelBaseParamsType['user'],
  modeId: DashboardViewModelBaseParamsType['modeId']
): boolean => {
  const connectionStyle = user[modeId]?.connectionStyle;
  const preferredLanguages =
    connectionStyle?.languageComfort?.preferredLanguages ?? [];

  return Boolean(
    connectionStyle?.availabilityPattern ||
      connectionStyle?.communicationPace ||
      connectionStyle?.introductionPreference ||
      connectionStyle?.planningStyle ||
      preferredLanguages.some((value) => value.trim().length > 0)
  );
};

const buildNextActionSupportMessages = ({
  guidance,
  language,
  includeCompatibility,
  includeCommunity,
  includeTrust,
  excludedMessages = [],
}: {
  guidance: DashboardGuidanceModeStringsType;
  language: string;
  includeCompatibility: boolean;
  includeCommunity: boolean;
  includeTrust: boolean;
  excludedMessages?: string[];
}): string[] =>
  getUniqueMessages([
    ...(includeCompatibility
      ? [
          resolveGuidanceMessage(
            guidance.compatibilityPromptMessages,
            'complete_connection_style',
            language
          ),
        ]
      : []),
    ...(includeCommunity
      ? [
          resolveGuidanceMessage(
            guidance.communityPromptMessages,
            'join_relevant_community',
            language
          ),
        ]
      : []),
    ...(includeTrust
      ? [
          resolveGuidanceMessage(
            guidance.trustPromptMessages,
            'review_visibility',
            language
          ),
        ]
      : []),
  ]).filter((message) => !excludedMessages.includes(message));

const buildQuickActions = ({
  modeId,
  language,
  strings,
}: {
  modeId: DashboardViewModelBaseParamsType['modeId'];
  language: string;
  strings: DashboardStringsType;
}): DashboardActionItemType[] => [
  {
    id: 'profile',
    label: strings.viewModels.quickActions.editProfile[language],
    path: `/dashboard/${pageIds.profile}`,
  },
  {
    id: 'connections',
    label: strings.viewModels.quickActions.reviewConnections[language],
    path: buildConnectionsPath('interested'),
  },
  {
    id: 'directRequest',
    label: strings.actions.directRequest[language],
    path: buildDirectRequestPath(),
  },
  {
    id: 'community',
    label: buildDashboardCommunityActionLabel({
      modeId,
      language,
      template: strings.viewModels.quickActions.openCommunity,
    }),
    path: buildCommunityPath({ tab: 'joined' }),
  },
  {
    id: 'notifications',
    label: strings.viewModels.quickActions.viewNotifications[language],
    path: buildNotificationsPath({ filter: 'all' }),
  },
  {
    id: 'settings',
    label: strings.viewModels.quickActions.settings[language],
    path: '/dashboard/settings',
  },
];

/**
 * Build the dashboard overview page model.
 */
export const buildDashboardOverviewViewModel = ({
  modeId,
  language,
  strings = getDashboardFallbackStrings().dashboard,
  guidance = getDashboardFallbackStrings().dashboardGuidance[modeId],
  user,
  relationshipState,
}: DashboardViewModelBaseParamsType): DashboardOverviewViewModelType => {
  const heroSignals = selectDashboardHeroSignals({
    modeId,
    user,
    relationshipState,
  });
  const modeState = relationshipState.byMode[modeId];
  const overviewSummary = selectOverviewSummary({
    modeId,
    user,
    relationshipState,
  });
  const completion = overviewSummary.completion;
  const freshness = overviewSummary.freshness;
  const relationshipCounts = selectRelationshipCounts({
    modeId,
    relationshipState,
  });
  const communityCounts = selectCommunityCounts({
    modeId,
    user,
    relationshipState,
  });
  const connectionStyleComplete = hasConnectionStyleSelections(user, modeId);
  const compatibilityMessage = resolveGuidanceMessage(
    guidance.compatibilityPromptMessages,
    'complete_connection_style',
    language
  );
  const communityMessage = resolveGuidanceMessage(
    guidance.communityPromptMessages,
    'join_relevant_community',
    language
  );
  const hasDirectMessages =
    selectDashboardDirectChats({
      modeId,
      relationshipState,
    }).length > 0;
  const hasCommunityActivity = communityCounts.activity > 0;
  const isProgressHero = heroSignals.completion.percentage < 100;
  const modeLabel = strings.viewModels.modeLabels[modeId][language];
  const keepMomentumAction =
    modeState.incomingConnectionRequestIds.length > 0
      ? {
          ctaLabel: strings.viewModels.notifications.review[language],
          ctaPath: buildConnectionsPath('requests'),
        }
      : modeState.incomingInterestIds.length > 0
      ? {
          ctaLabel: strings.viewModels.quickActions.reviewConnections[language],
          ctaPath: buildConnectionsPath('interested'),
        }
      : hasDirectMessages
      ? {
          ctaLabel: strings.viewModels.notifications.openMessages[language],
          ctaPath: buildMessagesPath(),
        }
      : hasCommunityActivity
      ? {
          ctaLabel: buildDashboardCommunityActionLabel({
            modeId,
            language,
            template: strings.viewModels.quickActions.openCommunity,
          }),
          ctaPath: buildCommunityPath({ tab: 'activity' }),
        }
      : {
          ctaLabel: strings.actions.directRequest[language],
          ctaPath: buildDirectRequestPath(),
        };

  return {
    hero: isProgressHero
      ? {
          mode: 'progress',
          title: formatDashboardTemplate(
            strings.viewModels.hero.progressTitleTemplate[language],
            {
              mode: modeLabel,
            }
          ),
          subtitle: strings.viewModels.hero.progressSubtitle[language],
          primaryMetricLabel:
            strings.viewModels.hero.progressPrimaryMetricLabel[language],
          primaryMetricValue: `${heroSignals.completion.percentage}%`,
          secondaryLabel:
            strings.viewModels.hero.progressSecondaryLabel[language],
          secondaryValue: `${heroSignals.pendingInterestCount}`,
          ctaLabel: strings.viewModels.hero.progressCta[language],
          ctaPath: `/dashboard/${pageIds.profile}`,
        }
      : {
          mode: 'activity',
          title: formatDashboardTemplate(
            strings.viewModels.hero.activeTitleTemplate[language],
            {
              mode: modeLabel,
            }
          ),
          subtitle: strings.viewModels.hero.activeSubtitle[language],
          primaryMetricLabel:
            strings.viewModels.hero.activePrimaryMetricLabel[language],
          primaryMetricValue: `${heroSignals.unreadNotificationCount}`,
          secondaryLabel:
            strings.viewModels.hero.activeSecondaryLabel[language],
          secondaryValue: `${heroSignals.pendingInterestCount}`,
          ctaLabel: strings.viewModels.hero.activeCta[language],
          ctaPath: buildNotificationsPath({ filter: 'all' }),
        },
    summary: selectDashboardShellSummary({
      modeId,
      user,
      relationshipState,
    }),
    nextAction:
      completion.percentage < 100
        ? {
            title: strings.viewModels.nextAction.profileGapTitle[language],
            description:
              strings.viewModels.nextAction.profileGapDescription[language],
            ctaLabel: strings.viewModels.nextAction.profileGapCta[language],
            ctaPath: `/dashboard/${pageIds.profile}`,
            supportingMessages: buildNextActionSupportMessages({
              guidance,
              language,
              includeCompatibility: !connectionStyleComplete,
              includeCommunity: communityCounts.joined === 0,
              includeTrust: relationshipCounts.connections === 0,
            }),
          }
        : !connectionStyleComplete
        ? {
            title:
              guidance.nextBestActionTitle[language] ??
              guidance.nextBestActionTitle.en ??
              strings.viewModels.nextAction.profileGapTitle[language],
            description:
              compatibilityMessage ||
              strings.viewModels.nextAction.profileGapDescription[language],
            ctaLabel: strings.viewModels.nextAction.profileGapCta[language],
            ctaPath: `/dashboard/${pageIds.profile}`,
            supportingMessages: buildNextActionSupportMessages({
              guidance,
              language,
              includeCompatibility: false,
              includeCommunity: communityCounts.joined === 0,
              includeTrust: relationshipCounts.connections === 0,
              excludedMessages: [compatibilityMessage],
            }),
          }
        : freshness.isActionable
        ? {
            title: strings.viewModels.freshness.title[language],
            description: buildProfileFreshnessDescription({
              freshness,
              language,
              strings,
            }),
            ctaLabel: strings.viewModels.freshness.refreshCta[language],
            ctaPath: `/dashboard/${pageIds.profile}`,
            supportingMessages: buildNextActionSupportMessages({
              guidance,
              language,
              includeCompatibility: false,
              includeCommunity: communityCounts.joined === 0,
              includeTrust: relationshipCounts.connections === 0,
            }),
          }
        : communityCounts.joined === 0 &&
          relationshipCounts.connections === 0 &&
          relationshipCounts.interested === 0 &&
          relationshipCounts.requests === 0 &&
          !hasDirectMessages
        ? {
            title:
              guidance.nextBestActionTitle[language] ??
              guidance.nextBestActionTitle.en ??
              strings.viewModels.nextAction.keepMomentumTitle[language],
            description:
              communityMessage ||
              strings.viewModels.nextAction.keepMomentumDescription[language],
            ctaLabel: buildDashboardCommunityActionLabel({
              modeId,
              language,
              template: strings.viewModels.quickActions.openCommunity,
            }),
            ctaPath: buildCommunityPath({ tab: 'discover' }),
            supportingMessages: buildNextActionSupportMessages({
              guidance,
              language,
              includeCompatibility: false,
              includeCommunity: false,
              includeTrust: true,
              excludedMessages: [communityMessage],
            }),
          }
        : {
            title: strings.viewModels.nextAction.keepMomentumTitle[language],
            description:
              strings.viewModels.nextAction.keepMomentumDescription[language],
            ctaLabel: keepMomentumAction.ctaLabel,
            ctaPath: keepMomentumAction.ctaPath,
            supportingMessages: buildNextActionSupportMessages({
              guidance,
              language,
              includeCompatibility: false,
              includeCommunity: communityCounts.joined === 0,
              includeTrust: relationshipCounts.connections === 0,
            }),
          },
    quickActions: buildQuickActions({ modeId, language, strings }),
  };
};

/**
 * Build summary copy for the overview header.
 */
export const buildOverviewSubtitle = ({
  modeId,
  language,
  strings = getDashboardFallbackStrings().dashboard,
  user,
  relationshipState,
}: DashboardViewModelBaseParamsType): string => {
  const summary = selectDashboardShellSummary({
    modeId,
    user,
    relationshipState,
  });
  return formatDashboardTemplate(
    strings.viewModels.summaries.overviewTemplate[language],
    {
      connections: summary.connectionCount,
      groups: summary.joinedGroupCount,
      notifications: summary.unreadNotificationCount,
      mode: strings.viewModels.modeLabels[modeId][language],
    }
  );
};
