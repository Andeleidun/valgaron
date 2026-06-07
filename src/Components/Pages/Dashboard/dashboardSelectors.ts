import type {
  GroupType,
  GroupMembershipsType,
  ModeType,
  ProfileFreshnessStateType,
  RelationshipStateType,
  UserType,
} from '../../../types';
import type {
  DashboardCompletionResult,
  DashboardTaskId,
} from './dashboardCompletion';
import { calculateDashboardCompletion } from './dashboardCompletion';
import { loadDashboardNotificationState } from '../../../Utlilities/dashboardNotificationState';
import { evaluateProfileFreshness } from '../../../Utlilities/profileFreshness';
import {
  selectDashboardDirectChatCounterpart,
  selectDashboardDirectChats,
} from './dashboardDirectChats';
import {
  buildGroupNotificationId,
  buildInterestNotificationId,
  buildMessageNotificationId,
  buildProfileCompletionNotificationId,
  buildProfileFreshnessNotificationId,
  buildRequestNotificationId,
} from './dashboardNotificationIdentity';

/**
 * Summary counts rendered across dashboard pages.
 */
export type DashboardRelationshipCounts = {
  connections: number;
  interested: number;
  requests: number;
};

/**
 * Summary counts for community membership and visible activity.
 */
export type DashboardCommunityCounts = {
  joined: number;
  discoverable: number;
  activity: number;
};

/**
 * Summary counts for the notifications center.
 */
export type DashboardNotificationCounts = {
  all: number;
  connections: number;
  community: number;
  messages: number;
  profile: number;
};

/**
 * Hero decision signals derived from profile maturity and current activity.
 */
export type DashboardHeroSignals = {
  completion: DashboardCompletionResult;
  freshness: ProfileFreshnessStateType;
  hasMeaningfulActivity: boolean;
  pendingInterestCount: number;
  requestCount: number;
  joinedGroupCount: number;
  unreadNotificationCount: number;
};

/**
 * Return the groups that remain visible after active-mode community blocks are
 * applied.
 */
export const selectVisibleCommunityGroups = ({
  modeId,
  relationshipState,
}: {
  modeId: ModeType['id'];
  relationshipState: RelationshipStateType;
}): GroupType[] => {
  const modeState = relationshipState.byMode[modeId];
  const blockedGroupIds = new Set(modeState.blockedGroupIds ?? []);

  return modeState.groups.filter((group) => !blockedGroupIds.has(group.id));
};

/**
 * Count joined groups using persisted user memberships after blocked groups are
 * removed from the visible surface.
 */
const countJoinedGroups = ({
  groupMemberships,
  modeId,
  visibleGroups,
}: {
  groupMemberships: GroupMembershipsType | undefined;
  modeId: ModeType['id'];
  visibleGroups: GroupType[];
}): number => {
  const visibleGroupIds = new Set(visibleGroups.map((group) => group.id));
  return (groupMemberships?.[modeId] ?? []).filter((groupId) =>
    visibleGroupIds.has(groupId)
  ).length;
};

/**
 * Return visible groups with seeded or user-generated activity.
 */
export const selectCommunityActivityGroups = (
  visibleGroups: GroupType[]
): GroupType[] =>
  visibleGroups.filter((group) =>
    group.chatRooms.some((chatRoom) => chatRoom.messages.length > 0)
  );

/**
 * Resolve the profile completion result for the active dashboard mode.
 */
const selectActiveModeCompletion = (
  modeId: ModeType['id'],
  user: UserType
): DashboardCompletionResult =>
  calculateDashboardCompletion({
    modeId,
    profile: user[modeId],
  });

/**
 * Resolve the freshness state for the active mode profile.
 */
export const selectProfileFreshness = ({
  modeId,
  user,
}: {
  modeId: ModeType['id'];
  user: UserType;
}): ProfileFreshnessStateType => {
  const completion = selectActiveModeCompletion(modeId, user);
  return evaluateProfileFreshness({
    profile: user[modeId],
    promptLevel: user.userSettings?.freshnessPrompts,
    completionPercentage: completion.percentage,
  });
};

/**
 * Build shell summary counts for dashboard surfaces.
 */
export const selectDashboardShellSummary = ({
  modeId,
  user,
  relationshipState,
}: {
  modeId: ModeType['id'];
  user: UserType;
  relationshipState: RelationshipStateType;
}) => {
  const relationshipCounts = selectRelationshipCounts({
    modeId,
    relationshipState,
  });
  const visibleGroups = selectVisibleCommunityGroups({
    modeId,
    relationshipState,
  });
  const joinedGroupCount = countJoinedGroups({
    groupMemberships: user.groupMemberships,
    modeId,
    visibleGroups,
  });

  return {
    profileStrength: selectActiveModeCompletion(modeId, user).percentage,
    pendingInterestCount: relationshipCounts.interested,
    connectionCount: relationshipCounts.connections,
    joinedGroupCount,
    unreadNotificationCount: selectNotificationCounts({
      modeId,
      user,
      relationshipState,
    }).all,
  };
};

/**
 * Build relationship summary counts for the active mode.
 */
export const selectRelationshipCounts = ({
  modeId,
  relationshipState,
}: {
  modeId: ModeType['id'];
  relationshipState: RelationshipStateType;
}): DashboardRelationshipCounts => {
  const modeState = relationshipState.byMode[modeId];
  return {
    connections: modeState.connectionIds.length,
    interested: modeState.incomingInterestIds.length,
    requests:
      modeState.outgoingConnectionRequestIds.length +
      modeState.incomingConnectionRequestIds.length,
  };
};

/**
 * Build community summary counts for the active mode.
 */
export const selectCommunityCounts = ({
  modeId,
  user,
  relationshipState,
}: {
  modeId: ModeType['id'];
  user: UserType;
  relationshipState: RelationshipStateType;
}): DashboardCommunityCounts => {
  const visibleGroups = selectVisibleCommunityGroups({
    modeId,
    relationshipState,
  });
  const visibleGroupCount = visibleGroups.length;
  const joined = countJoinedGroups({
    groupMemberships: user.groupMemberships,
    modeId,
    visibleGroups,
  });
  return {
    joined,
    discoverable: Math.max(visibleGroupCount - joined, 0),
    activity: selectCommunityActivityGroups(visibleGroups).length,
  };
};

/**
 * Build notification summary counts for the active mode.
 */
export const selectNotificationCounts = ({
  modeId,
  user,
  relationshipState,
}: {
  modeId: ModeType['id'];
  user: UserType;
  relationshipState: RelationshipStateType;
}): DashboardNotificationCounts => {
  const modeState = relationshipState.byMode[modeId];
  const visibleGroups = selectVisibleCommunityGroups({
    modeId,
    relationshipState,
  });
  const persistedNotificationState = loadDashboardNotificationState(modeId);
  const readNotificationIds = new Set(
    persistedNotificationState.readNotificationIds
  );
  const dismissedNotificationIds = new Set(
    persistedNotificationState.dismissedNotificationIds
  );
  const isUnreadNotification = (notificationId: string): boolean =>
    !readNotificationIds.has(notificationId) &&
    !dismissedNotificationIds.has(notificationId);
  const connections =
    modeState.incomingInterestIds.reduce(
      (count, profileId) =>
        count +
        (isUnreadNotification(buildInterestNotificationId(profileId)) ? 1 : 0),
      0
    ) +
    modeState.incomingConnectionRequestIds.reduce(
      (count, profileId) =>
        count +
        (isUnreadNotification(buildRequestNotificationId(profileId)) ? 1 : 0),
      0
    );
  const community = selectCommunityActivityGroups(visibleGroups).reduce(
    (count, group) =>
      count + (isUnreadNotification(buildGroupNotificationId(group)) ? 1 : 0),
    0
  );
  const messages = selectDashboardDirectChats({
    modeId,
    relationshipState,
  }).reduce((count, chat, index) => {
    const latestMessage = chat.messages.at(-1);
    const counterpart = selectDashboardDirectChatCounterpart(chat);

    return (
      count +
      (isUnreadNotification(
        buildMessageNotificationId({
          contactId: counterpart?.id,
          fallbackIndex: index,
          sentAt: latestMessage?.sentAt,
        })
      )
        ? 1
        : 0)
    );
  }, 0);
  const completion = selectActiveModeCompletion(modeId, user);
  const freshness = selectProfileFreshness({ modeId, user });
  const profile =
    completion.percentage < 100
      ? isUnreadNotification(buildProfileCompletionNotificationId(modeId))
        ? 1
        : 0
      : freshness.isActionable &&
        isUnreadNotification(buildProfileFreshnessNotificationId(modeId))
      ? 1
      : 0;

  return {
    all: connections + community + messages + profile,
    connections,
    community,
    messages,
    profile,
  };
};

/**
 * Build hero-decision signals for the active dashboard mode.
 */
export const selectDashboardHeroSignals = ({
  modeId,
  user,
  relationshipState,
}: {
  modeId: ModeType['id'];
  user: UserType;
  relationshipState: RelationshipStateType;
}): DashboardHeroSignals => {
  const completion = selectActiveModeCompletion(modeId, user);
  const relationshipCounts = selectRelationshipCounts({
    modeId,
    relationshipState,
  });
  const notificationCounts = selectNotificationCounts({
    modeId,
    user,
    relationshipState,
  });
  const freshness = selectProfileFreshness({ modeId, user });
  const visibleGroups = selectVisibleCommunityGroups({
    modeId,
    relationshipState,
  });
  const joinedGroupCount = countJoinedGroups({
    groupMemberships: user.groupMemberships,
    modeId,
    visibleGroups,
  });

  return {
    completion,
    freshness,
    hasMeaningfulActivity:
      relationshipCounts.connections > 0 ||
      relationshipCounts.interested > 0 ||
      relationshipCounts.requests > 0 ||
      joinedGroupCount > 0 ||
      notificationCounts.community > 0 ||
      notificationCounts.messages > 0,
    pendingInterestCount: relationshipCounts.interested,
    requestCount: relationshipCounts.requests,
    joinedGroupCount,
    unreadNotificationCount: notificationCounts.all,
  };
};

/**
 * Build the minimal overview summary needed before richer page view models exist.
 */
export const selectOverviewSummary = ({
  modeId,
  user,
  relationshipState,
}: {
  modeId: ModeType['id'];
  user: UserType;
  relationshipState: RelationshipStateType;
}): {
  completion: DashboardCompletionResult;
  freshness: ProfileFreshnessStateType;
  topMissingTaskId?: DashboardTaskId;
  shellSummary: ReturnType<typeof selectDashboardShellSummary>;
} => {
  const completion = selectActiveModeCompletion(modeId, user);
  const freshness = selectProfileFreshness({ modeId, user });
  return {
    completion,
    freshness,
    topMissingTaskId: completion.missingTaskIds[0],
    shellSummary: selectDashboardShellSummary({
      modeId,
      user,
      relationshipState,
    }),
  };
};
