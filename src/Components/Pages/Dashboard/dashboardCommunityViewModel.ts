import type {
  DashboardCommunityTabType,
  DashboardCommunityViewModelType,
  DashboardGroupListItemType,
} from '../../../types';
import { getDashboardFallbackStrings } from './dashboardFallbacks';
import {
  selectCommunityActivityGroups,
  selectCommunityCounts,
  selectVisibleCommunityGroups,
} from './dashboardSelectors';
import { formatDashboardTemplate } from './dashboardStrings';
import {
  type DashboardViewModelBaseParamsType,
  getGroupSubtitle,
} from './dashboardViewModelShared';

/**
 * Build the dashboard community page model.
 */
export const buildDashboardCommunityViewModel = ({
  modeId,
  activeTab,
  language,
  strings = getDashboardFallbackStrings().dashboard,
  user,
  relationshipState,
}: DashboardViewModelBaseParamsType & {
  activeTab: DashboardCommunityTabType;
}): DashboardCommunityViewModelType => {
  const visibleGroups = selectVisibleCommunityGroups({
    modeId,
    relationshipState,
  });
  const activityGroups = selectCommunityActivityGroups(visibleGroups);
  const items = (activeTab === 'activity' ? activityGroups : visibleGroups)
    .filter((group) => {
      const joined =
        user.groupMemberships?.[modeId]?.includes(group.id) ?? false;
      if (activeTab === 'joined') {
        return joined;
      }
      if (activeTab === 'discover') {
        return !joined;
      }
      return true;
    })
    .map(
      (group): DashboardGroupListItemType => ({
        id: group.id,
        name: group.groupName,
        subtitle: getGroupSubtitle({ group, language, strings }),
        imageUrl: group.groupPicture,
        activityLabel:
          activeTab === 'activity'
            ? strings.viewModels.community.recentActivity[language]
            : undefined,
        primaryAction: {
          label:
            activeTab === 'discover'
              ? strings.viewModels.community.join[language]
              : strings.viewModels.community.openPreview[language],
        },
        secondaryAction: {
          label: strings.viewModels.community.select[language],
        },
      })
    );

  return {
    activeTab,
    items,
  };
};

/**
 * Build summary copy for the community header.
 */
export const buildCommunitySubtitle = ({
  modeId,
  language,
  strings = getDashboardFallbackStrings().dashboard,
  user,
  relationshipState,
}: DashboardViewModelBaseParamsType): string => {
  const counts = selectCommunityCounts({
    modeId,
    user,
    relationshipState,
  });
  return formatDashboardTemplate(
    strings.viewModels.summaries.communityTemplate[language],
    {
      joined: counts.joined,
      discoverable: counts.discoverable,
      activity: counts.activity,
    }
  );
};
