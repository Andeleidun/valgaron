import { blankDatingProfile } from '../../../../Utlilities/models';
import { persistDashboardNotificationState } from '../../../../Utlilities/dashboardNotificationState';
import { User } from '../../../../Utlilities/user';
import { buildDefaultRelationshipState } from '../../../../Utlilities/RelationshipContext';
import { DIRECT_CHAT_SELF_ID } from '../../../../Utlilities/chatIdentity';
import { selectDashboardDirectChats } from '../dashboardDirectChats';
import {
  buildGroupNotificationId,
  buildInterestNotificationId,
} from '../dashboardNotificationIdentity';
import {
  selectCommunityCounts,
  selectDashboardHeroSignals,
  selectDashboardShellSummary,
  selectNotificationCounts,
  selectOverviewSummary,
  selectProfileFreshness,
  selectRelationshipCounts,
} from '../dashboardSelectors';

/**
 * Count groups with visible chat activity for a single mode.
 */
const countActiveGroups = (
  groups: ReturnType<
    typeof buildDefaultRelationshipState
  >['byMode']['dating']['groups']
): number =>
  groups.filter((group) =>
    group.chatRooms.some((chatRoom) => chatRoom.messages.length > 0)
  ).length;

/**
 * Count direct chats surfaced on dashboard pages.
 */
const countDashboardDirectChats = (
  modeId: Parameters<typeof selectDashboardDirectChats>[0]['modeId'],
  relationshipState: ReturnType<typeof buildDefaultRelationshipState>
): number =>
  selectDashboardDirectChats({
    modeId,
    relationshipState,
  }).length;

describe('dashboardSelectors', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  test('builds shell summary counts for the active mode', () => {
    const user = new User();
    const relationshipState = buildDefaultRelationshipState();
    const joinedGroupIds = relationshipState.byMode.dating.groups
      .slice(0, 2)
      .map((group) => group.id);
    user.dating = {
      ...blankDatingProfile,
      pictures: ['https://example.com/profile.jpg'],
      name: 'Jordan',
      main: {
        ...blankDatingProfile.main,
        location: 'Seattle',
        seeking: ['Long-term connection'],
      },
      prompts: {
        ...blankDatingProfile.prompts,
        selfSummary: 'Curious and kind.',
      },
    };
    user.groupMemberships.dating = joinedGroupIds;
    const activeGroupCount = countActiveGroups(
      relationshipState.byMode.dating.groups
    );
    const datingMessageCount = countDashboardDirectChats(
      'dating',
      relationshipState
    );
    const pendingInterestCount =
      relationshipState.byMode.dating.incomingInterestIds.length;
    const unreadNotificationCount =
      pendingInterestCount + activeGroupCount + datingMessageCount + 1;

    expect(
      selectDashboardShellSummary({
        modeId: 'dating',
        user,
        relationshipState,
      })
    ).toEqual({
      profileStrength: 63,
      pendingInterestCount,
      connectionCount: 3,
      joinedGroupCount: joinedGroupIds.length,
      unreadNotificationCount,
    });
  });

  test('keeps relationship counts scoped to the active mode', () => {
    const relationshipState = buildDefaultRelationshipState();
    const datingState = relationshipState.byMode.dating;

    expect(
      selectRelationshipCounts({
        modeId: 'dating',
        relationshipState,
      })
    ).toEqual({
      connections: datingState.connectionIds.length,
      interested: datingState.incomingInterestIds.length,
      requests:
        datingState.outgoingConnectionRequestIds.length +
        datingState.incomingConnectionRequestIds.length,
    });
  });

  test('derives community counts from memberships and visible groups', () => {
    const user = new User();
    const relationshipState = buildDefaultRelationshipState();
    const blockedGroupId = relationshipState.byMode.dating.groups[0]?.id;
    const visibleJoinedGroupId = relationshipState.byMode.dating.groups[2]?.id;
    if (!blockedGroupId || !visibleJoinedGroupId) {
      throw new Error('Expected seeded dating groups for community counts.');
    }
    user.groupMemberships.dating = [blockedGroupId, visibleJoinedGroupId];
    user.groupMemberships.friends = relationshipState.byMode.friends.groups
      .slice(0, 2)
      .map((group) => group.id);
    relationshipState.byMode.dating.blockedGroupIds = [blockedGroupId];
    const visibleGroups = relationshipState.byMode.dating.groups.filter(
      (group) =>
        !relationshipState.byMode.dating.blockedGroupIds?.includes(group.id)
    );
    const visibleActiveGroupCount = countActiveGroups(visibleGroups);

    expect(
      selectCommunityCounts({
        modeId: 'dating',
        user,
        relationshipState,
      })
    ).toEqual({
      joined: 1,
      discoverable: visibleGroups.length - 1,
      activity: visibleActiveGroupCount,
    });
    expect(
      selectDashboardShellSummary({
        modeId: 'dating',
        user,
        relationshipState,
      }).joinedGroupCount
    ).toBe(1);
    expect(
      selectNotificationCounts({
        modeId: 'dating',
        user,
        relationshipState,
      }).community
    ).toBe(visibleActiveGroupCount);
  });

  test('builds notification counts for the active mode only', () => {
    const user = new User();
    const relationshipState = buildDefaultRelationshipState();
    const community = countActiveGroups(relationshipState.byMode.dating.groups);
    const messages = countDashboardDirectChats('dating', relationshipState);
    const connections =
      relationshipState.byMode.dating.incomingInterestIds.length +
      relationshipState.byMode.dating.incomingConnectionRequestIds.length;
    const profile = 1;

    expect(
      selectNotificationCounts({
        modeId: 'dating',
        user,
        relationshipState,
      })
    ).toEqual({
      all: connections + community + messages + profile,
      connections,
      community,
      messages,
      profile,
    });
  });

  test('excludes persisted dismissed group activity from notification counts', () => {
    const user = new User();
    const relationshipState = buildDefaultRelationshipState();
    const activeGroup = relationshipState.byMode.dating.groups.find((group) =>
      group.chatRooms.some((chatRoom) => chatRoom.messages.length > 0)
    );

    if (!activeGroup) {
      throw new Error('Expected an active dating group in the seed data.');
    }

    persistDashboardNotificationState({
      modeId: 'dating',
      state: {
        readNotificationIds: [],
        dismissedNotificationIds: [buildGroupNotificationId(activeGroup)],
      },
    });

    const counts = selectNotificationCounts({
      modeId: 'dating',
      user,
      relationshipState,
    });

    expect(counts.community).toBe(
      countActiveGroups(relationshipState.byMode.dating.groups) - 1
    );
    expect(
      selectDashboardShellSummary({
        modeId: 'dating',
        user,
        relationshipState,
      }).unreadNotificationCount
    ).toBe(counts.all);
  });

  test('excludes persisted read interests from unread notification counts', () => {
    const user = new User();
    const relationshipState = buildDefaultRelationshipState();
    const firstInterestId =
      relationshipState.byMode.dating.incomingInterestIds[0];

    if (!firstInterestId) {
      throw new Error('Expected an incoming interest in the seed data.');
    }

    persistDashboardNotificationState({
      modeId: 'dating',
      state: {
        readNotificationIds: [buildInterestNotificationId(firstInterestId)],
        dismissedNotificationIds: [],
      },
    });

    expect(
      selectNotificationCounts({
        modeId: 'dating',
        user,
        relationshipState,
      }).connections
    ).toBe(
      relationshipState.byMode.dating.incomingInterestIds.length +
        relationshipState.byMode.dating.incomingConnectionRequestIds.length -
        1
    );
  });

  test('excludes blocked direct chats from message notification counts', () => {
    const user = new User();
    const relationshipState = buildDefaultRelationshipState();
    const blockedProfileId =
      relationshipState.byMode.dating.incomingInterestIds[0];

    if (!blockedProfileId) {
      throw new Error('Expected a seeded dating profile to block.');
    }

    relationshipState.byMode.dating.directChats = [
      {
        members: [
          { id: DIRECT_CHAT_SELF_ID, name: 'Me' },
          { id: blockedProfileId, name: 'Blocked contact' },
        ],
        messages: [
          {
            sender: { id: blockedProfileId, name: 'Blocked contact' },
            text: 'This should not count.',
            sentAt: '2026-01-01T10:00:00.000Z',
          },
        ],
      },
    ];
    relationshipState.byMode.dating.blockedProfileIds = [blockedProfileId];

    expect(
      selectNotificationCounts({
        modeId: 'dating',
        user,
        relationshipState,
      }).messages
    ).toBe(0);
  });

  test('marks complete profiles as freshness-actionable when reminders are enabled and recency is stale', () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-04-18T12:00:00.000Z'));

    const user = new User();
    user.userSettings.freshnessPrompts = 'medium';
    user.dating = {
      ...blankDatingProfile,
      pictures: ['https://example.com/profile.jpg'],
      name: 'Jordan',
      updatedAt: '2026-03-10T12:00:00.000Z',
      main: {
        ...blankDatingProfile.main,
        age: 31,
        location: 'Seattle',
        pronouns: 'they/them',
        seeking: ['Long-term connection'],
      },
      hobbies: {
        ...blankDatingProfile.hobbies,
        full: ['Board games'],
      },
      prompts: {
        ...blankDatingProfile.prompts,
        selfSummary: 'Curious and kind.',
      },
    };
    const relationshipState = buildDefaultRelationshipState();

    expect(
      selectProfileFreshness({
        modeId: 'dating',
        user,
      })
    ).toMatchObject({
      status: 'stale',
      isActionable: true,
      daysSinceUpdate: 39,
    });
    expect(
      selectNotificationCounts({
        modeId: 'dating',
        user,
        relationshipState,
      }).profile
    ).toBe(1);
    expect(
      selectOverviewSummary({
        modeId: 'dating',
        user,
        relationshipState,
      }).freshness.status
    ).toBe('stale');

    jest.useRealTimers();
  });

  test('switches hero signals based on profile completion and activity', () => {
    const incompleteUser = new User();
    const completeUser = new User();
    completeUser.dating = {
      ...blankDatingProfile,
      pictures: ['https://example.com/profile.jpg'],
      name: 'Jordan',
      main: {
        ...blankDatingProfile.main,
        age: 31,
        location: 'Seattle',
        pronouns: 'they/them',
        seeking: ['Long-term connection'],
      },
      hobbies: {
        ...blankDatingProfile.hobbies,
        full: ['Board games'],
      },
      prompts: {
        ...blankDatingProfile.prompts,
        selfSummary: 'Curious and kind.',
      },
    };
    const relationshipState = buildDefaultRelationshipState();

    expect(
      selectDashboardHeroSignals({
        modeId: 'dating',
        user: incompleteUser,
        relationshipState,
      }).completion.percentage
    ).toBe(0);

    const completeSignals = selectDashboardHeroSignals({
      modeId: 'dating',
      user: completeUser,
      relationshipState,
    });

    expect(completeSignals.completion.percentage).toBe(100);
    expect(completeSignals.hasMeaningfulActivity).toBe(true);
  });

  test('builds an overview summary with top missing task metadata', () => {
    const user = new User();
    const relationshipState = buildDefaultRelationshipState();

    expect(
      selectOverviewSummary({
        modeId: 'dating',
        user,
        relationshipState,
      }).topMissingTaskId
    ).toBe('addPhoto');
  });
});
