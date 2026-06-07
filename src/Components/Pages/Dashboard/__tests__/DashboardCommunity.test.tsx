import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import DashboardCommunity from '../DashboardCommunity';
import { buildCommunityPath } from '../dashboardRoutes';
import {
  buildDefaultRelationshipState,
  fetchTranslations,
  RelationshipProvider,
  User,
  UserContext,
  useRelationship,
} from '../../../../Utlilities';
import * as AuthContext from '../../../../Utlilities/auth/AuthContext';
import type { RelationshipStateType } from '../../../../types';
import type {
  AuthState,
  AuthStatus,
  AuthUser,
} from '../../../../Utlilities/auth/AuthTypes';

const translations = fetchTranslations();
const relationshipState = buildDefaultRelationshipState();
const firstDiscoverableGroup = relationshipState.byMode.dating.groups[0];
const requestedDiscoverGroup = relationshipState.byMode.dating.groups[1];

/**
 * Auth context value for dashboard community tests.
 */
type MockAuthContext = AuthState & {
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (
    email: string,
    password: string,
    displayName?: string
  ) => Promise<void>;
  signOut: () => Promise<void>;
};

const mockUser: AuthUser = {
  uid: 'dashboard-community-user',
  email: 'dashboard@example.com',
  displayName: null,
};

const noopSignIn = async (_email: string, _password: string): Promise<void> => {
  void _email;
  void _password;
};

const noopSignUp = async (
  _email: string,
  _password: string,
  _displayName?: string
): Promise<void> => {
  void _email;
  void _password;
  void _displayName;
};

const noopSignOut = async (): Promise<void> => undefined;

/**
 * Build a mock auth context value for the requested status.
 */
const buildMockAuthContext = (status: AuthStatus): MockAuthContext => ({
  status,
  user: status === 'signed_in' ? mockUser : null,
  error: null,
  signIn: noopSignIn,
  signUp: noopSignUp,
  signOut: noopSignOut,
});

/**
 * Render canonical membership ids for a single group after dashboard actions.
 */
const MembershipProbe = ({ groupId }: { groupId: string }) => {
  const { state } = useRelationship();
  const targetGroup = state.byMode.dating.groups.find(
    (group) => group.id === groupId
  );

  return (
    <div data-testid="membership-probe">
      {(targetGroup?.members ?? []).map((member) => member.userId).join(',')}
    </div>
  );
};

/**
 * Render canonical membership names for a single group after dashboard actions.
 */
const MembershipNameProbe = ({ groupId }: { groupId: string }) => {
  const { state } = useRelationship();
  const targetGroup = state.byMode.dating.groups.find(
    (group) => group.id === groupId
  );

  return (
    <div data-testid="membership-name-probe">
      {(targetGroup?.members ?? []).map((member) => member.userName).join(',')}
    </div>
  );
};

/**
 * Render the community workspace with stable providers.
 */
const renderDashboardCommunity = ({
  initialState = relationshipState,
  groupMemberships = [],
  initialEntries = ['/dashboard/community?tab=discover'],
}: {
  initialState?: RelationshipStateType;
  groupMemberships?: string[];
  initialEntries?: string[];
} = {}) => {
  const user = new User();
  if (user.dating) {
    user.dating = {
      ...user.dating,
      name: 'Dashboard Public Name',
    };
  }
  user.groupMemberships = {
    ...user.groupMemberships,
    dating: groupMemberships,
  };
  const setUserGroupMemberships = jest.fn();

  render(
    <MemoryRouter
      initialEntries={initialEntries}
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <RelationshipProvider initialState={initialState}>
        <UserContext.Provider
          value={{
            user,
            setUserProfile: jest.fn(),
            setUserGroupMemberships,
            setUserSettings: jest.fn(),
          }}
        >
          <DashboardCommunity
            mode={{ id: 'dating' }}
            language="en"
            strings={{
              dashboard: translations.dashboard,
              common: translations.common,
            }}
          />
          <MembershipProbe groupId={firstDiscoverableGroup.id} />
          <MembershipNameProbe groupId={firstDiscoverableGroup.id} />
        </UserContext.Provider>
      </RelationshipProvider>
    </MemoryRouter>
  );

  return { setUserGroupMemberships };
};

describe('DashboardCommunity', () => {
  beforeEach(() => {
    jest
      .spyOn(AuthContext, 'useAuth')
      .mockImplementation(() => buildMockAuthContext('signed_in'));
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('renders seeded groups in the dashboard-native community workspace', () => {
    renderDashboardCommunity();

    expect(
      screen.getByRole('heading', { name: 'Community' })
    ).toBeInTheDocument();
    expect(
      screen.getAllByText(firstDiscoverableGroup.groupName).length
    ).toBeGreaterThan(0);
  });

  test('hides blocked groups from dashboard community cards', () => {
    const blockedState = buildDefaultRelationshipState();
    blockedState.byMode.dating.blockedGroupIds = [firstDiscoverableGroup.id];

    renderDashboardCommunity({ initialState: blockedState });

    expect(
      screen.queryByText(firstDiscoverableGroup.groupName)
    ).not.toBeInTheDocument();
    expect(
      screen.getAllByText(requestedDiscoverGroup.groupName).length
    ).toBeGreaterThan(0);
  });

  test('honors preview query params when opening a specific group', () => {
    const user = new User();

    render(
      <MemoryRouter
        initialEntries={[
          `/dashboard/community?tab=discover&preview=${requestedDiscoverGroup.id}`,
        ]}
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <RelationshipProvider initialState={relationshipState}>
          <UserContext.Provider
            value={{
              user,
              setUserProfile: jest.fn(),
              setUserGroupMemberships: jest.fn(),
              setUserSettings: jest.fn(),
            }}
          >
            <DashboardCommunity
              mode={{ id: 'dating' }}
              language="en"
              strings={{
                dashboard: translations.dashboard,
                common: translations.common,
              }}
            />
          </UserContext.Provider>
        </RelationshipProvider>
      </MemoryRouter>
    );

    const previewHeading = screen.getByRole('heading', {
      name: 'Group preview',
    });
    const previewCard = previewHeading.closest('.MuiCard-root');

    if (!(previewCard instanceof HTMLElement)) {
      throw new Error('Expected community preview card to render.');
    }

    expect(
      within(previewCard).getByText(requestedDiscoverGroup.groupName)
    ).toBeInTheDocument();
  });

  test('infers missing memberships from canonical group members', () => {
    const initialState = buildDefaultRelationshipState();
    const inferredGroup = initialState.byMode.dating.groups[0];

    inferredGroup.members = [
      ...(inferredGroup.members ?? []),
      {
        groupId: inferredGroup.id,
        userId: mockUser.uid,
        userName: 'Dashboard Public Name',
        joinedAt: '2026-04-01T12:00:00.000Z',
      },
    ];

    const { setUserGroupMemberships } = renderDashboardCommunity({
      initialState,
      groupMemberships: [],
    });

    expect(setUserGroupMemberships).toHaveBeenCalledWith(
      'dating',
      expect.arrayContaining([inferredGroup.id])
    );
  });

  test('joining a group records the authenticated user in canonical membership state', () => {
    const { setUserGroupMemberships } = renderDashboardCommunity();

    fireEvent.click(screen.getAllByRole('button', { name: /join/i })[0]);

    expect(setUserGroupMemberships).toHaveBeenCalledWith(
      'dating',
      expect.arrayContaining([firstDiscoverableGroup.id])
    );
    expect(screen.getByTestId('membership-probe')).toHaveTextContent(
      'dashboard-community-user'
    );
    expect(screen.getByTestId('membership-name-probe')).toHaveTextContent(
      'Dashboard Public Name'
    );
  });

  test('shows visible activity from joined and discoverable groups in the activity tab', () => {
    const initialState = buildDefaultRelationshipState();
    const joinedActivityGroup = initialState.byMode.dating.groups[0];
    const discoverableActivityGroup = initialState.byMode.dating.groups[1];

    if (
      !joinedActivityGroup?.chatRooms[0] ||
      !discoverableActivityGroup?.chatRooms[0]
    ) {
      throw new Error('Expected seeded dating groups with chat rooms.');
    }

    joinedActivityGroup.chatRooms[0] = {
      ...joinedActivityGroup.chatRooms[0],
      messages: [
        {
          groupId: joinedActivityGroup.id,
          messageId: 'joined-activity-message',
          senderId: 'member-1',
          content: 'Joined activity update',
          sentAt: '2026-04-01T10:00:00.000Z',
        },
      ],
    };
    discoverableActivityGroup.chatRooms[0] = {
      ...discoverableActivityGroup.chatRooms[0],
      messages: [
        {
          groupId: discoverableActivityGroup.id,
          messageId: 'discover-activity-message',
          senderId: 'member-2',
          content: 'Discover activity update',
          sentAt: '2026-04-01T11:00:00.000Z',
        },
      ],
    };

    renderDashboardCommunity({
      initialState,
      groupMemberships: [joinedActivityGroup.id],
      initialEntries: ['/dashboard/community?tab=activity'],
    });

    expect(
      screen.getAllByText(joinedActivityGroup.groupName).length
    ).toBeGreaterThan(0);
    expect(
      screen.getAllByText(discoverableActivityGroup.groupName).length
    ).toBeGreaterThan(0);
  });

  test('keeps discoverable activity reachable from deep links into the activity tab', () => {
    const initialState = buildDefaultRelationshipState();
    const discoverableActivityGroup = initialState.byMode.dating.groups[0];

    if (!discoverableActivityGroup?.chatRooms[0]) {
      throw new Error('Expected a seeded dating group with a chat room.');
    }

    discoverableActivityGroup.chatRooms[0] = {
      ...discoverableActivityGroup.chatRooms[0],
      messages: [
        {
          groupId: discoverableActivityGroup.id,
          messageId: 'discover-only-activity-message',
          senderId: 'member-3',
          content: 'Discover-only activity update',
          sentAt: '2026-04-01T12:00:00.000Z',
        },
      ],
    };

    renderDashboardCommunity({
      initialState,
      initialEntries: [
        buildCommunityPath({
          tab: 'activity',
          previewId: discoverableActivityGroup.id,
        }),
      ],
    });

    expect(
      screen.getAllByText(discoverableActivityGroup.groupName).length
    ).toBeGreaterThan(0);
    expect(
      screen.queryByText(
        translations.dashboard.communityWorkspace.emptyDescription.en
      )
    ).not.toBeInTheDocument();
  });
});
