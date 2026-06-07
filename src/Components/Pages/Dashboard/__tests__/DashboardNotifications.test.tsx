import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import DashboardNotifications from '../DashboardNotifications';
import {
  blankDatingProfile,
  buildDefaultRelationshipState,
  fetchTranslations,
  RelationshipProvider,
  User,
  UserContext,
} from '../../../../Utlilities';
import * as dataModule from '../../../../Utlilities/data';
import { getProfilesForMode } from '../../../../Utlilities/data';
import { DIRECT_CHAT_SELF_ID } from '../../../../Utlilities/chatIdentity';
import { selectDashboardDirectChats } from '../dashboardDirectChats';
import {
  buildCommunityPath,
  buildConnectionsPath,
  buildMessagesPath,
} from '../dashboardRoutes';
import { selectDashboardShellSummary } from '../dashboardSelectors';
import { buildDashboardNotificationsViewModel } from '../dashboardViewModels';
import type { ProfileType, RelationshipStateType } from '../../../../types';

const translations = fetchTranslations();
const relationshipState = buildDefaultRelationshipState();
const occupiedDatingProfileIds = new Set([
  ...relationshipState.byMode.dating.connectionIds,
  ...relationshipState.byMode.dating.incomingInterestIds,
]);
const firstInterestedProfileId =
  relationshipState.byMode.dating.incomingInterestIds[0];
const firstInterestedProfile = getProfilesForMode('dating').find(
  (profile) => profile.id === firstInterestedProfileId
);
const requestProfile = getProfilesForMode('dating').find(
  (profile) => !occupiedDatingProfileIds.has(profile.id)
);
const firstActiveDatingGroup = relationshipState.byMode.dating.groups.find(
  (group) => group.chatRooms.some((chatRoom) => chatRoom.messages.length > 0)
);
const firstDirectChatContact =
  relationshipState.byMode.friends.directChats[0]?.members.find(
    (member) => member.id !== DIRECT_CHAT_SELF_ID
  );

if (
  !firstInterestedProfile ||
  !requestProfile ||
  !firstActiveDatingGroup ||
  !firstDirectChatContact
) {
  throw new Error(
    'Expected seeded interest, request, group, and direct-chat profiles for notifications tests.'
  );
}

/**
 * Render the current router location for navigation assertions.
 */
const LocationProbe = () => {
  const location = useLocation();
  return <div>{`${location.pathname}${location.search}`}</div>;
};

/**
 * Render the notifications workspace with stable providers.
 */
const renderDashboardNotifications = (
  initialState: RelationshipStateType = relationshipState,
  user: User = new User(),
  modeId: 'dating' | 'friends' = 'dating'
) => {
  return render(
    <MemoryRouter
      initialEntries={['/dashboard/notifications?filter=all']}
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <RelationshipProvider initialState={initialState}>
        <UserContext.Provider
          value={{
            user,
            setUserProfile: jest.fn(),
            setUserGroupMemberships: jest.fn(),
            setUserSettings: jest.fn(),
          }}
        >
          <>
            <DashboardNotifications
              mode={{ id: modeId }}
              language="en"
              strings={{
                dashboard: translations.dashboard,
                common: translations.common,
              }}
            />
            <LocationProbe />
          </>
        </UserContext.Provider>
      </RelationshipProvider>
    </MemoryRouter>
  );
};

/**
 * Render notifications behind a route boundary so navigation unmounts the page.
 */
const renderRoutedDashboardNotifications = (
  initialState: RelationshipStateType = relationshipState,
  user: User = new User(),
  modeId: 'dating' | 'friends' = 'dating'
) => {
  return render(
    <MemoryRouter
      initialEntries={['/dashboard/notifications?filter=all']}
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <RelationshipProvider initialState={initialState}>
        <UserContext.Provider
          value={{
            user,
            setUserProfile: jest.fn(),
            setUserGroupMemberships: jest.fn(),
            setUserSettings: jest.fn(),
          }}
        >
          <Routes>
            <Route
              path="/dashboard/notifications"
              element={
                <DashboardNotifications
                  mode={{ id: modeId }}
                  language="en"
                  strings={{
                    dashboard: translations.dashboard,
                    common: translations.common,
                  }}
                />
              }
            />
            <Route path="*" element={<LocationProbe />} />
          </Routes>
        </UserContext.Provider>
      </RelationshipProvider>
    </MemoryRouter>
  );
};

describe('DashboardNotifications', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  test('renders the notifications workspace with feed filters and seeded activity', () => {
    renderDashboardNotifications();

    expect(screen.getByText('Notifications')).toBeInTheDocument();
    expect(screen.getByText('Notifications center')).toBeInTheDocument();
    expect(
      screen.getByRole('tab', { name: 'Connections' })
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole('button', { name: 'Preview' }).length
    ).toBeGreaterThan(0);
  });

  test('supports dismissing feed items inline', () => {
    renderDashboardNotifications();

    const dismissButtons = screen.getAllByRole('button', { name: 'Dismiss' });
    const initialCount = dismissButtons.length;

    fireEvent.click(dismissButtons[0]);

    expect(screen.getAllByRole('button', { name: 'Dismiss' }).length).toBe(
      initialCount - 1
    );
  });

  test('routes interest notifications to the interested tab with the correct preview', () => {
    renderDashboardNotifications();

    fireEvent.click(
      screen.getAllByRole('button', { name: 'Open connections' })[0]
    );

    expect(
      screen.getByText(
        buildConnectionsPath('interested', firstInterestedProfile.id)
      )
    ).toBeInTheDocument();
  });

  test('routes direct-request notifications to the requests tab with the correct preview', () => {
    const requestState = buildDefaultRelationshipState();
    requestState.byMode.dating = {
      ...requestState.byMode.dating,
      incomingConnectionRequestIds: [requestProfile.id],
    };

    renderDashboardNotifications(requestState);

    fireEvent.click(screen.getByRole('button', { name: 'Review' }));

    expect(
      screen.getByText(buildConnectionsPath('requests', requestProfile.id))
    ).toBeInTheDocument();
  });

  test('hides restricted profile fields in connection notifications', () => {
    const originalGetProfilesForMode = dataModule.getProfilesForMode;
    const hiddenName = 'Private Surface Name';
    const hiddenLocation = 'Private Harbor';
    const privacyLimitedProfile = {
      ...requestProfile,
      id: 'notification-privacy-limited-profile',
      name: hiddenName,
      profileVisibility: 'connections_only' as const,
      main: {
        ...requestProfile.main,
        location: hiddenLocation,
        seeking: [],
      },
      prompts: {
        ...requestProfile.prompts,
        selfSummary: '',
      },
      fieldVisibility: {
        ...requestProfile.fieldVisibility,
        location: 'connections_only' as const,
      },
    } as ProfileType;
    const getProfilesForModeSpy = jest
      .spyOn(dataModule, 'getProfilesForMode')
      .mockImplementation((modeId) => [
        ...originalGetProfilesForMode(modeId),
        privacyLimitedProfile,
      ]);
    const requestState = buildDefaultRelationshipState();
    requestState.byMode.dating = {
      ...requestState.byMode.dating,
      connectionIds: [],
      incomingInterestIds: [],
      incomingConnectionRequestIds: [privacyLimitedProfile.id],
      outgoingConnectionRequestIds: [],
      declinedProfileIds: [],
    };

    try {
      renderDashboardNotifications(requestState);

      expect(screen.queryByText(hiddenName)).not.toBeInTheDocument();
      expect(screen.queryByText(hiddenLocation)).not.toBeInTheDocument();
      expect(
        screen.getAllByText('Unnamed profile sent a direct request').length
      ).toBeGreaterThan(0);
      expect(
        screen.getAllByText(
          translations.dashboard.viewModels.defaults.profileReadyToReview.en
        ).length
      ).toBeGreaterThan(0);
    } finally {
      getProfilesForModeSpy.mockRestore();
    }
  });

  test('adds a profile freshness notification when reminders are enabled and the profile is stale', () => {
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

    renderDashboardNotifications(relationshipState, user);

    expect(
      screen.getAllByText('Profile refresh recommended').length
    ).toBeGreaterThan(0);
    expect(
      screen.getByRole('button', { name: 'Refresh profile' })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/This profile has not been refreshed in 39 days\./i)
    ).toBeInTheDocument();

    jest.useRealTimers();
  });

  test('updates the active filter from header tabs', () => {
    renderDashboardNotifications();

    fireEvent.click(screen.getByRole('tab', { name: 'Messages' }));

    expect(
      screen.getByText('/dashboard/notifications?filter=messages')
    ).toBeInTheDocument();
  });

  test('includes active-mode direct chats in the messages filter', () => {
    const user = new User();
    const viewModel = buildDashboardNotificationsViewModel({
      activeFilter: 'messages',
      language: 'en',
      modeId: 'friends',
      relationshipState,
      strings: translations.dashboard,
      user,
    });

    renderDashboardNotifications(relationshipState, user, 'friends');

    fireEvent.click(screen.getByRole('tab', { name: 'Messages' }));

    expect(viewModel.items).toHaveLength(
      selectDashboardDirectChats({
        modeId: 'friends',
        relationshipState,
      }).length
    );
    expect(
      screen.getAllByText(viewModel.items[0].title).length
    ).toBeGreaterThan(0);
    expect(viewModel.items[0].primaryAction?.path).toBe(
      buildMessagesPath({
        contactId: firstDirectChatContact.id,
      })
    );
  });

  test('excludes blocked direct chats from notification message items', () => {
    const user = new User();
    const blockedState = buildDefaultRelationshipState();
    blockedState.byMode.dating.directChats = [
      {
        members: [
          { id: DIRECT_CHAT_SELF_ID, name: 'Me' },
          { id: requestProfile.id, name: requestProfile.name },
        ],
        messages: [
          {
            sender: { id: requestProfile.id, name: requestProfile.name },
            text: 'Checking whether this still shows up.',
            sentAt: '2026-01-01T10:00:00.000Z',
          },
        ],
      },
    ];
    blockedState.byMode.dating.blockedProfileIds = [requestProfile.id];

    const viewModel = buildDashboardNotificationsViewModel({
      activeFilter: 'messages',
      language: 'en',
      modeId: 'dating',
      relationshipState: blockedState,
      strings: translations.dashboard,
      user,
    });

    expect(viewModel.items).toHaveLength(0);

    renderDashboardNotifications(blockedState, user);

    fireEvent.click(screen.getByRole('tab', { name: 'Messages' }));

    expect(screen.queryByText(requestProfile.name)).not.toBeInTheDocument();
  });

  test('excludes blocked groups from notification items and the community filter', () => {
    const user = new User();
    const blockedState = buildDefaultRelationshipState();
    blockedState.byMode.dating.blockedGroupIds = [firstActiveDatingGroup.id];

    const viewModel = buildDashboardNotificationsViewModel({
      activeFilter: 'community',
      language: 'en',
      modeId: 'dating',
      relationshipState: blockedState,
      strings: translations.dashboard,
      user,
    });

    expect(viewModel.items).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: expect.stringContaining(`group-${firstActiveDatingGroup.id}-`),
        }),
      ])
    );

    renderDashboardNotifications(blockedState, user);

    fireEvent.click(screen.getAllByRole('tab', { name: 'Community' })[1]);

    expect(
      screen.queryByText(firstActiveDatingGroup.groupName)
    ).not.toBeInTheDocument();
  });

  test('builds activity deep links for discoverable groups with messages', () => {
    const user = new User();
    const activityState = buildDefaultRelationshipState();
    const discoverableActivityGroup = activityState.byMode.dating.groups[0];

    if (!discoverableActivityGroup?.chatRooms[0]) {
      throw new Error('Expected a seeded dating group with a chat room.');
    }

    discoverableActivityGroup.chatRooms[0] = {
      ...discoverableActivityGroup.chatRooms[0],
      messages: [
        {
          groupId: discoverableActivityGroup.id,
          messageId: 'discoverable-activity-message',
          senderId: 'member-discoverable',
          content: 'Discoverable activity update',
          sentAt: '2026-04-01T12:30:00.000Z',
        },
      ],
    };

    const communityItem = buildDashboardNotificationsViewModel({
      activeFilter: 'community',
      language: 'en',
      modeId: 'dating',
      relationshipState: activityState,
      strings: translations.dashboard,
      user,
    }).items.find(
      (item) =>
        item.primaryAction?.path ===
        buildCommunityPath({
          tab: 'activity',
          previewId: discoverableActivityGroup.id,
        })
    );

    expect(communityItem).toEqual(
      expect.objectContaining({
        type: 'community',
        title: expect.stringContaining(discoverableActivityGroup.groupName),
        primaryAction: expect.objectContaining({
          path: buildCommunityPath({
            tab: 'activity',
            previewId: discoverableActivityGroup.id,
          }),
        }),
      })
    );
  });

  test('dismisses the selected preview item and falls back to another visible notification', () => {
    const user = new User();
    const viewModel = buildDashboardNotificationsViewModel({
      activeFilter: 'all',
      language: 'en',
      modeId: 'dating',
      relationshipState,
      strings: translations.dashboard,
      user,
    });

    renderDashboardNotifications(relationshipState, user);

    fireEvent.click(screen.getAllByRole('button', { name: 'Preview' })[1]);

    expect(
      screen.getAllByText(viewModel.items[1].title).length
    ).toBeGreaterThan(0);

    const previewPanel = screen.getByText(
      translations.dashboard.notificationsWorkspace.previewTitle.en
    ).parentElement;

    expect(previewPanel).not.toBeNull();

    fireEvent.click(
      within(previewPanel as HTMLElement).getByRole('button', {
        name: 'Dismiss',
      })
    );

    expect(screen.queryAllByText(viewModel.items[1].title)).toHaveLength(0);
    expect(previewPanel).toHaveTextContent(viewModel.items[0].title);
    expect(previewPanel).not.toHaveTextContent(
      translations.dashboard.notificationsWorkspace.previewEmpty.en
    );
  });

  test('persists preview-panel primary actions before routed navigation', () => {
    const user = new User();
    const viewModel = buildDashboardNotificationsViewModel({
      activeFilter: 'all',
      language: 'en',
      modeId: 'dating',
      relationshipState,
      strings: translations.dashboard,
      user,
    });
    const firstActionableItem = viewModel.items.find(
      (item) => item.primaryAction
    );

    if (!firstActionableItem?.primaryAction) {
      throw new Error('Expected an actionable notification in the seed data.');
    }
    const primaryActionPath = firstActionableItem.primaryAction.path;

    if (!primaryActionPath) {
      throw new Error(
        'Expected the actionable notification to include a path.'
      );
    }

    const routedRender = renderRoutedDashboardNotifications(
      relationshipState,
      user
    );

    const previewPanel = screen.getByText(
      translations.dashboard.notificationsWorkspace.previewTitle.en
    ).parentElement;

    expect(previewPanel).not.toBeNull();

    fireEvent.click(
      within(previewPanel as HTMLElement).getByRole('button', {
        name: firstActionableItem.primaryAction.label,
      })
    );

    expect(screen.getByText(primaryActionPath)).toBeInTheDocument();

    routedRender.unmount();
    renderDashboardNotifications(relationshipState, user);

    expect(
      within(
        screen.getByTestId(
          `dashboard-notification-row-${firstActionableItem.id}`
        )
      ).getByRole('button', {
        name: translations.dashboard.notificationsWorkspace.markRead.en,
      })
    ).toBeDisabled();
  });

  test('keeps the selected preview item visible when marking it read from the preview panel', () => {
    const user = new User();
    const viewModel = buildDashboardNotificationsViewModel({
      activeFilter: 'all',
      language: 'en',
      modeId: 'dating',
      relationshipState,
      strings: translations.dashboard,
      user,
    });

    renderDashboardNotifications(relationshipState, user);
    fireEvent.click(screen.getAllByRole('button', { name: 'Preview' })[1]);

    const previewPanel = screen.getByText(
      translations.dashboard.notificationsWorkspace.previewTitle.en
    ).parentElement;

    expect(previewPanel).not.toBeNull();

    const previewMarkReadButton = within(previewPanel as HTMLElement).getByRole(
      'button',
      {
        name: translations.dashboard.notificationsWorkspace.markRead.en,
      }
    );

    fireEvent.click(previewMarkReadButton);

    expect(previewPanel).toHaveTextContent(viewModel.items[1].title);
    expect(previewMarkReadButton).toBeDisabled();
  });

  test('marks notifications read from list rows', () => {
    renderDashboardNotifications();

    const rowMarkReadButton = screen.getAllByRole('button', {
      name: translations.dashboard.notificationsWorkspace.markRead.en,
    })[1];

    fireEvent.click(rowMarkReadButton);

    expect(rowMarkReadButton).toBeDisabled();
  });

  test('persists row primary actions before routed navigation', () => {
    const user = new User();
    const viewModel = buildDashboardNotificationsViewModel({
      activeFilter: 'all',
      language: 'en',
      modeId: 'dating',
      relationshipState,
      strings: translations.dashboard,
      user,
    });
    const firstActionableItem = viewModel.items.find(
      (item) => item.primaryAction
    );

    if (!firstActionableItem?.primaryAction) {
      throw new Error('Expected an actionable notification in the seed data.');
    }

    const primaryActionPath = firstActionableItem.primaryAction.path;

    if (!primaryActionPath) {
      throw new Error(
        'Expected the actionable notification to include a path.'
      );
    }

    const routedRender = renderRoutedDashboardNotifications(
      relationshipState,
      user
    );

    fireEvent.click(
      within(
        screen.getByTestId(
          `dashboard-notification-row-${firstActionableItem.id}`
        )
      ).getByRole('button', {
        name: firstActionableItem.primaryAction.label,
      })
    );

    expect(screen.getByText(primaryActionPath)).toBeInTheDocument();

    routedRender.unmount();
    renderDashboardNotifications(relationshipState, user);

    expect(
      within(
        screen.getByTestId(
          `dashboard-notification-row-${firstActionableItem.id}`
        )
      ).getByRole('button', {
        name: translations.dashboard.notificationsWorkspace.markRead.en,
      })
    ).toBeDisabled();
  });

  test('persists dismissed group activity notifications across remounts', () => {
    const user = new User();
    const communityItem = buildDashboardNotificationsViewModel({
      activeFilter: 'all',
      language: 'en',
      modeId: 'dating',
      relationshipState,
      strings: translations.dashboard,
      user,
    }).items.find((item) => item.type === 'community');

    if (!communityItem) {
      throw new Error('Expected a community notification in the seed data.');
    }

    const firstRender = renderDashboardNotifications(relationshipState, user);

    fireEvent.click(
      within(
        screen.getByTestId(`dashboard-notification-row-${communityItem.id}`)
      ).getByRole('button', { name: 'Dismiss' })
    );

    expect(
      screen.queryByTestId(`dashboard-notification-row-${communityItem.id}`)
    ).toBeNull();

    firstRender.unmount();
    renderDashboardNotifications(relationshipState, user);

    expect(
      screen.queryByTestId(`dashboard-notification-row-${communityItem.id}`)
    ).toBeNull();
  });

  test('updates the top tab notification badge immediately when dismissing group activity', () => {
    const user = new User();
    const initialUnreadCount = selectDashboardShellSummary({
      modeId: 'dating',
      user,
      relationshipState,
    }).unreadNotificationCount;
    const communityItem = buildDashboardNotificationsViewModel({
      activeFilter: 'all',
      language: 'en',
      modeId: 'dating',
      relationshipState,
      strings: translations.dashboard,
      user,
    }).items.find((item) => item.type === 'community');

    if (!communityItem) {
      throw new Error('Expected a community notification in the seed data.');
    }

    renderDashboardNotifications(relationshipState, user);

    fireEvent.click(
      within(
        screen.getByTestId(`dashboard-notification-row-${communityItem.id}`)
      ).getByRole('button', { name: 'Dismiss' })
    );

    expect(
      screen.getByRole('tab', {
        name: `Notifications (${initialUnreadCount - 1})`,
      })
    ).toBeInTheDocument();
  });

  test('persists read state for group activity notifications across remounts', () => {
    const user = new User();
    const communityItem = buildDashboardNotificationsViewModel({
      activeFilter: 'all',
      language: 'en',
      modeId: 'dating',
      relationshipState,
      strings: translations.dashboard,
      user,
    }).items.find((item) => item.type === 'community');

    if (!communityItem) {
      throw new Error('Expected a community notification in the seed data.');
    }

    const firstRender = renderDashboardNotifications(relationshipState, user);

    fireEvent.click(
      within(
        screen.getByTestId(`dashboard-notification-row-${communityItem.id}`)
      ).getByRole('button', {
        name: translations.dashboard.notificationsWorkspace.markRead.en,
      })
    );

    expect(
      within(
        screen.getByTestId(`dashboard-notification-row-${communityItem.id}`)
      ).getByRole('button', {
        name: translations.dashboard.notificationsWorkspace.markRead.en,
      })
    ).toBeDisabled();

    firstRender.unmount();
    renderDashboardNotifications(relationshipState, user);

    expect(
      within(
        screen.getByTestId(`dashboard-notification-row-${communityItem.id}`)
      ).getByRole('button', {
        name: translations.dashboard.notificationsWorkspace.markRead.en,
      })
    ).toBeDisabled();
  });

  test('treats new group activity as a new notification instance', () => {
    const user = new User();
    const baseCommunityItem = buildDashboardNotificationsViewModel({
      activeFilter: 'all',
      language: 'en',
      modeId: 'dating',
      relationshipState,
      strings: translations.dashboard,
      user,
    }).items.find(
      (item) =>
        item.type === 'community' &&
        item.primaryAction?.path ===
          buildCommunityPath({
            tab: 'activity',
            previewId: firstActiveDatingGroup.id,
          })
    );

    if (!baseCommunityItem) {
      throw new Error(
        'Expected a seeded community notification for the active group.'
      );
    }

    const updatedState = buildDefaultRelationshipState();
    updatedState.byMode.dating = {
      ...updatedState.byMode.dating,
      groups: updatedState.byMode.dating.groups.map((group) => {
        if (group.id !== firstActiveDatingGroup.id) {
          return group;
        }

        return {
          ...group,
          chatRooms: group.chatRooms.map((chatRoom, index) =>
            index !== 0
              ? chatRoom
              : {
                  ...chatRoom,
                  messages: [
                    ...chatRoom.messages,
                    {
                      groupId: group.id,
                      messageId: 'community-update-message',
                      senderId: chatRoom.members[0]?.userId ?? 'group-member',
                      content: 'New update for the group thread.',
                      sentAt: '2026-05-01T12:00:00.000Z',
                    },
                  ],
                }
          ),
        };
      }),
    };

    const updatedCommunityItem = buildDashboardNotificationsViewModel({
      activeFilter: 'all',
      language: 'en',
      modeId: 'dating',
      relationshipState: updatedState,
      strings: translations.dashboard,
      user,
    }).items.find(
      (item) =>
        item.type === 'community' &&
        item.primaryAction?.path ===
          buildCommunityPath({
            tab: 'activity',
            previewId: firstActiveDatingGroup.id,
          })
    );

    expect(updatedCommunityItem?.id).not.toBe(baseCommunityItem.id);
  });
});
