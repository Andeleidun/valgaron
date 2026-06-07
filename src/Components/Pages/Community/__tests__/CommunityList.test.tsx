import { render, screen } from '@testing-library/react';
import { fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import Community from '../Community';
import { ToastProvider } from '../../../Common';
import {
  buildDefaultRelationshipState,
  fetchTranslations,
  RelationshipProvider,
  User,
  UserContext,
} from '../../../../Utlilities';
import { useAuth } from '../../../../Utlilities/auth/AuthContext';
import type {
  CommonStringsType,
  GroupEventType,
  GroupGovernanceSettingsType,
  GroupType,
  ModeType,
  ProfileStringsType,
  RelationshipStateType,
} from '../../../../types';

jest.mock('../../../../Utlilities/auth/AuthContext', () => ({
  useAuth: jest.fn(),
}));

const mockedUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const translations = fetchTranslations();

/**
 * Build a complete test group object with defaults.
 */
const buildGroup = (
  group: Pick<GroupType, 'id' | 'groupName' | 'mode'> & {
    admins?: string[];
    events?: GroupEventType[];
    governance?: GroupGovernanceSettingsType;
    members?: GroupType['members'];
    tags?: string[];
  }
): GroupType => ({
  id: group.id,
  groupName: group.groupName,
  groupPicture: '',
  description: `${group.groupName} description`,
  category: 'general',
  location: 'Portland, OR',
  groupType: 'public',
  interests: ['community'],
  rules: 'Be respectful.',
  tags: group.tags ?? ['community'],
  starredTags: [],
  admins: group.admins ?? [],
  governance: group.governance,
  members: group.members ?? [],
  createdAt: '2026-01-01T00:00:00.000Z',
  chatRooms: [],
  events: group.events,
  mode: group.mode,
});

/**
 * Build deterministic relationship state for community tests.
 */
const buildRelationshipState = (groups: GroupType[]): RelationshipStateType => {
  const state = buildDefaultRelationshipState();
  state.byMode.friends = {
    ...state.byMode.friends,
    groups,
  };
  return state;
};

/**
 * Render Community with translations, router context, and shared relationship state.
 */
const renderCommunity = ({
  groups,
  joinedGroupIds = [],
}: {
  groups: GroupType[];
  joinedGroupIds?: string[];
}) => {
  const mode: ModeType = { id: 'friends' };
  const commonStrings: CommonStringsType = translations.common;
  const profileStrings: ProfileStringsType = translations.profile;
  const user = new User();
  user.groupMemberships = {
    ...user.groupMemberships,
    friends: joinedGroupIds,
  };

  return render(
    <RelationshipProvider initialState={buildRelationshipState(groups)}>
      <MemoryRouter
        initialEntries={['/community']}
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <ToastProvider>
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
                path="/community"
                element={
                  <Community
                    mode={mode}
                    language="en"
                    strings={{
                      community: translations.community,
                      common: commonStrings,
                      communityGuidance: translations.communityGuidance,
                      profile: profileStrings,
                    }}
                  />
                }
              />
              <Route
                path="/community/:groupId"
                element={
                  <Community
                    mode={mode}
                    language="en"
                    strings={{
                      community: translations.community,
                      common: commonStrings,
                      communityGuidance: translations.communityGuidance,
                      profile: profileStrings,
                    }}
                  />
                }
              />
            </Routes>
          </UserContext.Provider>
        </ToastProvider>
      </MemoryRouter>
    </RelationshipProvider>
  );
};

describe('Community list and detail navigation', () => {
  beforeEach(() => {
    mockedUseAuth.mockReset();
    mockedUseAuth.mockReturnValue({
      status: 'signed_in',
      user: { uid: 'community-user', email: 'community@example.com' },
      error: null,
      signIn: jest.fn(async () => undefined),
      signUp: jest.fn(async () => undefined),
      signOut: jest.fn(async () => undefined),
    });
  });

  test('renders a group list from shared relationship state', () => {
    const groups = [
      buildGroup({
        id: 'friends-group-1',
        groupName: 'Friends One',
        mode: 'friends',
      }),
    ];

    renderCommunity({
      groups,
      joinedGroupIds: groups.map((group) => group.id),
    });

    expect(screen.getByText('Friends One')).toBeInTheDocument();
  });

  test('navigates to group detail view when a group is clicked', () => {
    const groups = [
      buildGroup({
        id: 'friends-group-1',
        groupName: 'Friends One',
        mode: 'friends',
        admins: ['community-user'],
        governance: {
          joinPolicy: 'open',
          postingPolicy: 'all_members',
          moderationSummary: 'Clear moderation and respectful participation.',
        },
        events: [
          {
            id: 'event-1',
            title: 'Monthly meetup',
            description: 'Catch up over coffee.',
            location: 'Portland, OR',
            startsAt: '2026-05-01T18:00:00.000Z',
            createdBy: 'community-user',
            attendance: {
              going: [],
              interested: [],
              cant_make_it: [],
            },
          },
        ],
        members: [
          {
            groupId: 'friends-group-1',
            userId: 'community-user',
            userName: 'Community Host',
            joinedAt: '2026-01-01T00:00:00.000Z',
          },
        ],
        tags: ['community', 'coffee'],
      }),
    ];

    renderCommunity({
      groups,
      joinedGroupIds: groups.map((group) => group.id),
    });

    fireEvent.click(screen.getByRole('button', { name: 'View Details' }));

    expect(screen.getByText('Friends One description')).toBeInTheDocument();
    expect(screen.getByText('Why join this community')).toBeInTheDocument();
    expect(
      screen.getByText('community • Monthly meetup • Portland, OR')
    ).toBeInTheDocument();
    expect(screen.getByText('Organizer: Community Host')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Community norms: Clear moderation and respectful participation.'
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText('Activity level: Monthly meetup')
    ).toBeInTheDocument();
  });

  test('EmptyState renders when the canonical group list is empty', () => {
    renderCommunity({ groups: [] });

    expect(
      screen.getByText(translations.community.friends.emptyTitle.en)
    ).toBeInTheDocument();
  });

  test('shows available groups even when the user has not joined any yet', () => {
    renderCommunity({
      groups: [
        buildGroup({
          id: 'friends-group-2',
          groupName: 'Friends Open Group',
          mode: 'friends',
        }),
      ],
    });

    expect(screen.getByText('Friends Open Group')).toBeInTheDocument();
    expect(
      screen.queryByText(translations.community.friends.emptyTitle.en)
    ).not.toBeInTheDocument();
  });
});
