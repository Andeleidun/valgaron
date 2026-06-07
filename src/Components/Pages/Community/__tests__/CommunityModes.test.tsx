import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Community from '../Community';
import { ToastProvider } from '../../../Common';
import {
  buildDefaultRelationshipState,
  fetchTranslations,
  modes,
  RelationshipProvider,
  User,
  UserContext,
} from '../../../../Utlilities';
import { useAuth } from '../../../../Utlilities/auth/AuthContext';
import type {
  GroupType,
  ModeType,
  RelationshipStateType,
} from '../../../../types';

jest.mock('../../../../Utlilities/auth/AuthContext', () => ({
  useAuth: jest.fn(),
}));

const mockedUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

/**
 * Build a complete test group object with defaults.
 */
const buildGroup = (
  group: Pick<GroupType, 'id' | 'groupName' | 'mode'> & {
    admins?: string[];
    members?: GroupType['members'];
  }
): GroupType => ({
  id: group.id,
  groupName: group.groupName,
  groupPicture: '',
  description: `${group.groupName} description`,
  category: 'general',
  location: 'anywhere',
  groupType: 'public',
  interests: [],
  rules: '',
  tags: [],
  starredTags: [],
  admins: group.admins ?? [],
  members: group.members ?? [],
  createdAt: '2026-01-01T00:00:00.000Z',
  chatRooms: [],
  mode: group.mode,
});

/**
 * Build deterministic relationship state for community mode tests.
 */
const buildRelationshipState = (): RelationshipStateType => {
  const state = buildDefaultRelationshipState();
  state.byMode.dating = {
    ...state.byMode.dating,
    groups: [
      buildGroup({
        id: 'dating-group',
        groupName: 'Dating Group',
        mode: 'dating',
      }),
    ],
  };
  state.byMode.friends = {
    ...state.byMode.friends,
    groups: [
      buildGroup({
        id: 'friends-group',
        groupName: 'Friends Group',
        mode: 'friends',
      }),
    ],
  };
  state.byMode.academic = {
    ...state.byMode.academic,
    groups: [
      buildGroup({
        id: 'academic-group',
        groupName: 'Academic Group',
        mode: 'academic',
      }),
    ],
  };
  state.byMode.professional = {
    ...state.byMode.professional,
    groups: [
      buildGroup({
        id: 'professional-group',
        groupName: 'Professional Group',
        mode: 'professional',
      }),
    ],
  };
  state.byMode.neighborhood = {
    ...state.byMode.neighborhood,
    groups: [
      buildGroup({
        id: 'neighborhood-group',
        groupName: 'Neighborhood Group',
        mode: 'neighborhood',
      }),
    ],
  };
  return state;
};

const initialRelationshipState = buildRelationshipState();
const translations = fetchTranslations();

/**
 * Build the Community test tree.
 */
const buildCommunityView = (mode: ModeType): JSX.Element => {
  const user = new User();
  user.groupMemberships = {
    friends: ['friends-group'],
    dating: ['dating-group'],
    academic: ['academic-group'],
    professional: ['professional-group'],
    neighborhood: ['neighborhood-group'],
  };
  return (
    <RelationshipProvider initialState={initialRelationshipState}>
      <MemoryRouter
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <UserContext.Provider
          value={{
            user,
            setUserProfile: () => undefined,
            setUserGroupMemberships: () => undefined,
            setUserSettings: () => undefined,
          }}
        >
          <ToastProvider>
            <Community
              mode={mode}
              language="en"
              strings={{
                community: translations.community,
                common: translations.common,
                communityGuidance: translations.communityGuidance,
                profile: translations.profile,
              }}
            />
          </ToastProvider>
        </UserContext.Provider>
      </MemoryRouter>
    </RelationshipProvider>
  );
};

/**
 * Render Community for a specific mode.
 */
const renderCommunity = (mode: ModeType) => render(buildCommunityView(mode));

describe('Community modes', () => {
  beforeEach(() => {
    mockedUseAuth.mockReset();
    mockedUseAuth.mockReturnValue({
      status: 'signed_in',
      user: { uid: 'community-mode-user', email: 'community@example.com' },
      error: null,
      signIn: jest.fn(async () => undefined),
      signUp: jest.fn(async () => undefined),
      signOut: jest.fn(async () => undefined),
    });
  });

  test.each([
    'dating',
    'friends',
    'neighborhood',
    'academic',
    'professional',
  ] as const)('renders Community for %s mode', (modeId) => {
    const mode = modes.find((item) => item.id === modeId) ?? { id: modeId };
    renderCommunity(mode);
    expect(
      screen.getByRole('button', {
        name: translations.community[modeId].createLabel.en,
      })
    ).toBeInTheDocument();
  });

  test('switching modes updates labels and canonical group cards consistently', () => {
    const datingMode = modes.find((item) => item.id === 'dating') ?? {
      id: 'dating',
    };
    const friendsMode = modes.find((item) => item.id === 'friends') ?? {
      id: 'friends',
    };

    const { rerender } = renderCommunity(datingMode);
    expect(screen.getByText('Dating Group')).toBeInTheDocument();

    rerender(buildCommunityView(friendsMode));

    expect(screen.getByText('Friends Group')).toBeInTheDocument();
    expect(screen.queryByText('Dating Group')).not.toBeInTheDocument();
  });

  test('renders mode-specific community guidance labels on cards', () => {
    const datingMode = modes.find((item) => item.id === 'dating') ?? {
      id: 'dating',
    };

    renderCommunity(datingMode);

    expect(
      screen.getByText('Why start here: general • anywhere')
    ).toBeInTheDocument();
  });

  test('admin controls follow the authenticated user id instead of a literal value', () => {
    const authUserId = 'auth-user-42';
    const adminState = buildDefaultRelationshipState();
    adminState.byMode.friends = {
      ...adminState.byMode.friends,
      groups: [
        buildGroup({
          id: 'friends-group',
          groupName: 'Friends Group',
          mode: 'friends',
          admins: [authUserId],
          members: [
            {
              groupId: 'friends-group',
              userId: authUserId,
              userName: 'Current User',
              joinedAt: '2026-01-01T00:00:00.000Z',
            },
          ],
        }),
      ],
    };
    mockedUseAuth.mockReturnValue({
      status: 'signed_in',
      user: { uid: authUserId, email: 'auth-user@example.com' },
      error: null,
      signIn: jest.fn(async () => undefined),
      signUp: jest.fn(async () => undefined),
      signOut: jest.fn(async () => undefined),
    });
    const user = new User();
    user.groupMemberships = {
      ...user.groupMemberships,
      friends: ['friends-group'],
    };

    render(
      <RelationshipProvider initialState={adminState}>
        <MemoryRouter
          future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
        >
          <UserContext.Provider
            value={{
              user,
              setUserProfile: jest.fn(),
              setUserGroupMemberships: jest.fn(),
              setUserSettings: jest.fn(),
            }}
          >
            <ToastProvider>
              <Community
                mode={{ id: 'friends' }}
                language="en"
                strings={{
                  community: translations.community,
                  common: translations.common,
                  communityGuidance: translations.communityGuidance,
                  profile: translations.profile,
                }}
              />
            </ToastProvider>
          </UserContext.Provider>
        </MemoryRouter>
      </RelationshipProvider>
    );

    expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument();
  });
});
