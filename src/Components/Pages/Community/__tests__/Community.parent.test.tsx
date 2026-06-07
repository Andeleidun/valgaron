import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import type {
  GroupType,
  ModeType,
  RelationshipStateType,
} from '../../../../types';
import {
  blankFriendProfile,
  buildDefaultRelationshipState,
  fetchTranslations,
  formatTemplate,
  type useRelationship as useRelationshipType,
  User,
  UserContext,
  useRelationship,
} from '../../../../Utlilities';
import { ToastProvider } from '../../../Common';
import { runWithReactAct } from '../../../../test/reactAct';
import { useAuth } from '../../../../Utlilities/auth/AuthContext';
import Community from '../Community';

jest.mock('../../../../Utlilities', () => {
  const actual = jest.requireActual('../../../../Utlilities');
  return {
    ...actual,
    useRelationship: jest.fn(),
  };
});

jest.mock('../../../../Utlilities/auth/AuthContext', () => ({
  useAuth: jest.fn(),
}));

type MockCommunityFormProps = {
  initialGroup?: GroupType;
  onSubmitGroup: (group: GroupType) => void;
  submitLabel?: string;
};

type MockCommunityListProps = {
  groups: GroupType[];
  onEditGroup: (id: string) => void;
  onJoinToggle: (id: string) => void;
  onMessageGroup: (id: string) => void;
  onViewDetails: (id: string) => void;
};

type MockGroupDetailProps = {
  currentUserId: string;
  group: GroupType;
  onAssignRole: (groupId: string, memberUserId: string, roleId: string) => void;
  onBack: () => void;
  onBlockGroup: (groupId: string) => void;
  onEditGroup: (id: string) => void;
  onJoinToggle: (id: string) => void;
  onMessageGroup: (id: string) => void;
  onRemoveRole: (groupId: string, memberUserId: string, roleId: string) => void;
  onReportGroup: (group: GroupType) => void;
  onRespondToEvent: (
    groupId: string,
    eventId: string,
    response: 'going' | 'interested' | 'cant_make_it'
  ) => void;
  onScheduleEvent: (
    groupId: string,
    title: string,
    description: string,
    location: string,
    startsAt: string
  ) => void;
  onSetAvailabilityOptions: (groupId: string, labels: string[]) => void;
  onVoteAvailability: (groupId: string, optionId: string) => void;
};

const mockedUseRelationship = useRelationship as jest.MockedFunction<
  typeof useRelationship
>;
const mockedUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

type CommunityMockRuntimeType = {
  communityFormShouldThrow: boolean;
  submittedGroup: GroupType;
};

const setCommunityMockRuntime = (
  runtime: CommunityMockRuntimeType
): CommunityMockRuntimeType => {
  (
    globalThis as typeof globalThis & {
      __communityMockRuntime?: CommunityMockRuntimeType;
    }
  ).__communityMockRuntime = runtime;
  return runtime;
};

jest.mock('../CommunityForm', () => ({
  __esModule: true,
  default: (props: MockCommunityFormProps) => {
    const runtime = (
      globalThis as typeof globalThis & {
        __communityMockRuntime?: CommunityMockRuntimeType;
      }
    ).__communityMockRuntime;

    if (runtime?.communityFormShouldThrow) {
      throw new Error('Mock community form render failed.');
    }

    if (!runtime?.submittedGroup) {
      throw new Error('Expected community mock runtime to provide a group.');
    }

    return (
      <div>
        <div data-testid="community-form-initial">
          {props.initialGroup?.id ?? 'new'}
        </div>
        <div data-testid="community-form-submit">
          {props.submitLabel ?? 'default'}
        </div>
        <button onClick={() => props.onSubmitGroup(runtime.submittedGroup)}>
          Submit mocked community form
        </button>
      </div>
    );
  },
}));

jest.mock('../CommunityList', () => ({
  __esModule: true,
  default: (props: MockCommunityListProps) => (
    <div>
      <div data-testid="community-list-order">
        {props.groups.map((group) => group.id).join(',')}
      </div>
      {props.groups.map((group) => (
        <div key={group.id}>
          <button onClick={() => props.onJoinToggle(group.id)}>
            Toggle {group.id}
          </button>
          <button onClick={() => props.onViewDetails(group.id)}>
            View {group.id}
          </button>
          <button onClick={() => props.onMessageGroup(group.id)}>
            Message {group.id}
          </button>
          <button onClick={() => props.onEditGroup(group.id)}>
            Edit {group.id}
          </button>
        </div>
      ))}
    </div>
  ),
}));

jest.mock('../GroupDetail', () => ({
  __esModule: true,
  default: (props: MockGroupDetailProps) => (
    <div>
      <div data-testid="group-detail-group">{props.group.id}</div>
      <div data-testid="group-detail-current-user">{props.currentUserId}</div>
      <button onClick={() => props.onJoinToggle(props.group.id)}>
        Toggle join
      </button>
      <button onClick={props.onBack}>Back from detail</button>
      <button onClick={() => props.onMessageGroup(props.group.id)}>
        Message detail group
      </button>
      <button onClick={() => props.onEditGroup(props.group.id)}>
        Edit detail group
      </button>
      <button
        onClick={() =>
          props.onAssignRole(props.group.id, 'member-1', 'organizer')
        }
      >
        Assign role
      </button>
      <button
        onClick={() =>
          props.onRemoveRole(props.group.id, 'member-1', 'organizer')
        }
      >
        Remove role
      </button>
      <button
        onClick={() =>
          props.onScheduleEvent(
            props.group.id,
            'Planning Night',
            'Plan the next meetup.',
            'Portland',
            '2026-05-01T18:30'
          )
        }
      >
        Schedule event
      </button>
      <button
        onClick={() =>
          props.onRespondToEvent(props.group.id, 'event-42', 'interested')
        }
      >
        Respond to event
      </button>
      <button
        onClick={() =>
          props.onSetAvailabilityOptions(props.group.id, [
            'Saturday morning',
            'Sunday afternoon',
          ])
        }
      >
        Save availability
      </button>
      <button
        onClick={() => props.onVoteAvailability(props.group.id, 'option-1')}
      >
        Vote availability
      </button>
      <button onClick={() => props.onReportGroup(props.group)}>
        Report group
      </button>
      <button onClick={() => props.onBlockGroup(props.group.id)}>
        Block group
      </button>
    </div>
  ),
}));

type RelationshipHarnessType = {
  assignGroupRole: jest.Mock<void, [string, string, string, string]>;
  blockGroup: jest.Mock<void, [string, string]>;
  getModeState: jest.Mock<
    RelationshipStateType['byMode'][ModeType['id']],
    [ModeType['id']]
  >;
  removeGroupRole: jest.Mock<void, [string, string, string, string]>;
  respondToCommunityEvent: jest.Mock<
    void,
    [string, string, string, string, 'going' | 'interested' | 'cant_make_it']
  >;
  scheduleCommunityEvent: jest.Mock<void, [string, string, unknown]>;
  setCommunityAvailabilityOptions: jest.Mock<void, [string, string, unknown]>;
  setGroupMembership: jest.Mock<void, [string, string, unknown, boolean]>;
  submitSafetyReport: jest.Mock<void, [unknown]>;
  upsertModeGroup: jest.Mock<void, [string, GroupType]>;
  voteCommunityAvailability: jest.Mock<void, [string, string, string, string]>;
};

type RenderCommunityArgs = {
  blockedGroupIds?: string[];
  groups?: GroupType[];
  joinedGroupIds?: string[];
  route?: string;
  authEmail?: string;
  authUserId?: string;
  publicName?: string;
};

/**
 * Build an activation-ready friends profile for community parent tests.
 */
const buildActivatedFriendsProfile = (publicName: string): User['friends'] => ({
  ...blankFriendProfile,
  id: 'community-ready-profile',
  pictures: ['https://images.example.com/community-ready.jpg'],
  name: publicName,
  main: {
    ...blankFriendProfile.main,
    age: 29,
    location: 'Portland, OR',
    pronouns: 'they/them',
    seeking: ['New friends'],
  },
  hobbies: {
    ...blankFriendProfile.hobbies,
    full: ['Coffee'],
  },
  prompts: {
    ...blankFriendProfile.prompts,
    selfSummary: 'Ready to join groups.',
  },
  connectionStyle: {
    ...blankFriendProfile.connectionStyle,
    communicationPace: 'balanced',
  },
});

/**
 * Build a complete community group fixture with deterministic defaults.
 */
const buildGroup = (
  group: Pick<GroupType, 'id' | 'groupName' | 'mode'> & {
    admins?: string[];
    description?: string;
    members?: GroupType['members'];
  }
): GroupType => ({
  id: group.id,
  groupName: group.groupName,
  groupPicture: '',
  description: group.description ?? `${group.groupName} description`,
  category: 'general',
  location: 'Portland, OR',
  groupType: 'public',
  interests: ['community'],
  rules: 'Be respectful.',
  tags: ['community'],
  starredTags: [],
  admins: group.admins ?? [],
  members: group.members ?? [],
  createdAt: '2026-01-01T00:00:00.000Z',
  chatRooms: [],
  mode: group.mode,
});

/**
 * Show the current router location for navigation assertions.
 */
const LocationDisplay = () => {
  const location = useLocation();
  return (
    <>
      <div data-testid="location-path">{location.pathname}</div>
      <div data-testid="location-search">{location.search}</div>
      <div data-testid="location-state">
        {JSON.stringify(location.state ?? null)}
      </div>
    </>
  );
};

/**
 * Build deterministic relationship hook spies for a community render.
 */
const buildRelationshipHarness = (
  groups: GroupType[],
  blockedGroupIds: string[] = []
): RelationshipHarnessType => {
  const state = buildDefaultRelationshipState();
  state.byMode.friends = {
    ...state.byMode.friends,
    blockedGroupIds,
    groups,
  };

  return {
    getModeState: jest.fn((modeId: ModeType['id']) => state.byMode[modeId]),
    upsertModeGroup: jest.fn(),
    setGroupMembership: jest.fn(),
    assignGroupRole: jest.fn(),
    removeGroupRole: jest.fn(),
    scheduleCommunityEvent: jest.fn(),
    respondToCommunityEvent: jest.fn(),
    setCommunityAvailabilityOptions: jest.fn(),
    voteCommunityAvailability: jest.fn(),
    submitSafetyReport: jest.fn(),
    blockGroup: jest.fn(),
  };
};

/**
 * Render Community with router, user context, toasts, and mocked relationship hooks.
 */
const renderCommunity = ({
  blockedGroupIds = [],
  groups = [],
  joinedGroupIds = [],
  route = '/community',
  authEmail = 'community@example.com',
  authUserId = 'community-user',
  publicName = 'Community Public Name',
}: RenderCommunityArgs = {}) => {
  const translations = fetchTranslations();
  const relationship = buildRelationshipHarness(groups, blockedGroupIds);
  const setUserGroupMemberships = jest.fn();
  const user = new User();
  user.groupMemberships = {
    ...user.groupMemberships,
    friends: joinedGroupIds,
  };
  user.friends = buildActivatedFriendsProfile(publicName);

  mockedUseAuth.mockReturnValue({
    status: 'signed_in',
    user: { uid: authUserId, email: authEmail },
    error: null,
    signIn: jest.fn(async () => undefined),
    signUp: jest.fn(async () => undefined),
    signOut: jest.fn(async () => undefined),
  });
  mockedUseRelationship.mockReturnValue(
    relationship as unknown as ReturnType<typeof useRelationshipType>
  );

  const view = render(
    <MemoryRouter
      initialEntries={[route]}
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <ToastProvider>
        <UserContext.Provider
          value={{
            user,
            setUserProfile: jest.fn(),
            setUserGroupMemberships,
            setUserSettings: jest.fn(),
          }}
        >
          <Routes>
            <Route
              path="/community"
              element={
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
              }
            />
            <Route
              path="/community/:groupId"
              element={
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
              }
            />
            <Route
              path="/community/:groupId/edit"
              element={
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
              }
            />
            <Route path="/messages" element={<div>Messages page</div>} />
          </Routes>
          <LocationDisplay />
        </UserContext.Provider>
      </ToastProvider>
    </MemoryRouter>
  );

  return {
    ...view,
    relationship,
    setUserGroupMemberships,
    translations,
  };
};

describe('Community parent behaviors', () => {
  beforeEach(() => {
    setCommunityMockRuntime({
      communityFormShouldThrow: false,
      submittedGroup: {
        ...buildGroup({
          id: 'created-group',
          groupName: 'Created Group',
          mode: 'friends',
          description: 'Created group description',
        }),
        members: [],
        admins: [],
        chatRooms: [
          {
            roomId: 'room-1',
            groupId: 'created-group',
            roomName: 'General',
            createdAt: '2026-01-01T00:00:00.000Z',
            members: [],
            messages: [],
          },
        ],
      },
    });
    mockedUseAuth.mockReset();
    mockedUseRelationship.mockReset();
  });

  afterEach(() => {
    setCommunityMockRuntime({
      communityFormShouldThrow: false,
      submittedGroup: {
        ...buildGroup({
          id: 'created-group',
          groupName: 'Created Group',
          mode: 'friends',
          description: 'Created group description',
        }),
        members: [],
        admins: [],
        chatRooms: [],
      },
    });
  });

  test('infers missing memberships from group membership records', () => {
    const authUserId = 'community-user';
    const group = buildGroup({
      id: 'friends-group',
      groupName: 'Friends Group',
      mode: 'friends',
      members: [
        {
          groupId: 'friends-group',
          userId: authUserId,
          userName: 'Community User',
          joinedAt: '2026-01-01T00:00:00.000Z',
        },
      ],
    });

    const { setUserGroupMemberships } = renderCommunity({
      groups: [group],
      joinedGroupIds: [],
      authUserId,
    });

    expect(setUserGroupMemberships).toHaveBeenCalledWith('friends', [group.id]);
  });

  test('sorts joined groups first and toggles membership with join and leave toasts', async () => {
    const joinedGroup = buildGroup({
      id: 'joined-group',
      groupName: 'Joined Group',
      mode: 'friends',
    });
    const openGroup = buildGroup({
      id: 'open-group',
      groupName: 'Open Group',
      mode: 'friends',
    });

    const { relationship, setUserGroupMemberships, translations } =
      renderCommunity({
        groups: [openGroup, joinedGroup],
        joinedGroupIds: [joinedGroup.id],
      });

    expect(screen.getByTestId('community-list-order')).toHaveTextContent(
      'joined-group,open-group'
    );

    await runWithReactAct(async () => {
      fireEvent.click(
        screen.getByRole('button', { name: 'Toggle joined-group' })
      );
    });

    expect(relationship.setGroupMembership).toHaveBeenCalledWith(
      'friends',
      joinedGroup.id,
      expect.objectContaining({
        groupId: joinedGroup.id,
        userId: 'community-user',
        userName: 'Community Public Name',
      }),
      false
    );
    expect(setUserGroupMemberships).toHaveBeenCalledWith('friends', []);
    expect(
      await screen.findByText(
        (translations.common.leftGroupTemplate?.en ?? '').replace(
          '{{name}}',
          joinedGroup.groupName
        )
      )
    ).toBeInTheDocument();

    await runWithReactAct(async () => {
      fireEvent.click(
        screen.getByRole('button', { name: 'Toggle open-group' })
      );
    });

    expect(relationship.setGroupMembership).toHaveBeenLastCalledWith(
      'friends',
      openGroup.id,
      expect.objectContaining({
        groupId: openGroup.id,
        userId: 'community-user',
        userName: 'Community Public Name',
      }),
      true
    );
    expect(setUserGroupMemberships).toHaveBeenLastCalledWith('friends', [
      openGroup.id,
    ]);
    expect(
      await screen.findByText(
        (translations.common.joinedGroupTemplate?.en ?? '').replace(
          '{{name}}',
          openGroup.groupName
        )
      )
    ).toBeInTheDocument();
  });

  test('hides blocked groups from the main community workspace list', () => {
    const visibleGroup = buildGroup({
      id: 'visible-group',
      groupName: 'Visible Group',
      mode: 'friends',
    });
    const blockedGroup = buildGroup({
      id: 'blocked-group',
      groupName: 'Blocked Group',
      mode: 'friends',
    });

    renderCommunity({
      groups: [visibleGroup, blockedGroup],
      blockedGroupIds: [blockedGroup.id],
    });

    expect(screen.getByTestId('community-list-order')).toHaveTextContent(
      'visible-group'
    );
    expect(screen.getByTestId('community-list-order')).not.toHaveTextContent(
      'blocked-group'
    );
  });

  test('submits create flow with creator admin and member defaults before navigating', async () => {
    const { relationship, setUserGroupMemberships } = renderCommunity({
      route: '/community/create',
    });

    expect(screen.getByTestId('community-form-initial')).toHaveTextContent(
      'new'
    );
    expect(screen.getByTestId('community-form-submit')).toHaveTextContent(
      'default'
    );

    await runWithReactAct(async () => {
      fireEvent.click(
        screen.getByRole('button', { name: 'Submit mocked community form' })
      );
    });

    expect(relationship.upsertModeGroup).toHaveBeenCalledWith(
      'friends',
      expect.objectContaining({
        id: 'created-group',
        admins: ['community-user'],
      })
    );

    const savedGroup = relationship.upsertModeGroup.mock.calls[0]?.[1];

    expect(savedGroup.members).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          groupId: 'created-group',
          userId: 'community-user',
          userName: 'Community Public Name',
        }),
      ])
    );
    expect(savedGroup.chatRooms[0]?.members).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          groupId: 'created-group',
          userId: 'community-user',
          userName: 'Community Public Name',
        }),
      ])
    );
    expect(setUserGroupMemberships).toHaveBeenCalledWith('friends', [
      'created-group',
    ]);
    expect(screen.getByTestId('location-path')).toHaveTextContent(
      '/community/created-group'
    );
  });

  test('passes edit state into CommunityForm and supports back navigation', async () => {
    const editableGroup = buildGroup({
      id: 'editable-group',
      groupName: 'Editable Group',
      mode: 'friends',
      admins: ['community-user'],
    });
    const { translations } = renderCommunity({
      groups: [editableGroup],
      route: '/community/editable-group/edit',
    });

    expect(screen.getByTestId('community-form-initial')).toHaveTextContent(
      'editable-group'
    );
    expect(screen.getByTestId('community-form-submit')).toHaveTextContent(
      translations.common.edit?.en ?? ''
    );

    await runWithReactAct(async () => {
      fireEvent.click(
        screen.getByRole('button', {
          name: translations.common.back.en,
        })
      );
    });

    expect(screen.getByTestId('location-path')).toHaveTextContent('/community');
  });

  test('rejects non-admin deep links to the community edit form', () => {
    const protectedGroup = buildGroup({
      id: 'protected-group',
      groupName: 'Protected Group',
      mode: 'friends',
      admins: ['group-owner'],
    });
    const { translations } = renderCommunity({
      groups: [protectedGroup],
      route: '/community/protected-group/edit',
      authUserId: 'community-user',
    });

    expect(
      screen.queryByTestId('community-form-initial')
    ).not.toBeInTheDocument();
    expect(
      screen.getByText(
        translations.common.communityFormUnavailableTitle?.en ?? ''
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        translations.common.communityFormUnavailableMessage?.en ?? ''
      )
    ).toBeInTheDocument();
    expect(screen.getByTestId('location-path')).toHaveTextContent(
      '/community/protected-group/edit'
    );
  });

  test('fails missing edit targets instead of rendering the creation form', () => {
    const { translations } = renderCommunity({
      groups: [],
      route: '/community/missing-group/edit',
    });

    expect(
      screen.queryByTestId('community-form-initial')
    ).not.toBeInTheDocument();
    expect(
      screen.getByText(
        translations.common.communityFormUnavailableTitle?.en ?? ''
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        translations.common.communityFormUnavailableMessage?.en ?? ''
      )
    ).toBeInTheDocument();
    expect(screen.getByTestId('location-path')).toHaveTextContent(
      '/community/missing-group/edit'
    );
  });

  test('navigates group message entry points with a stable query-string deep link', async () => {
    const detailGroup = buildGroup({
      id: 'detail-group',
      groupName: 'Detail Group',
      mode: 'friends',
    });

    renderCommunity({
      groups: [detailGroup],
      route: '/community/detail-group',
    });

    await runWithReactAct(async () => {
      fireEvent.click(
        screen.getByRole('button', { name: 'Message detail group' })
      );
    });

    expect(screen.getByTestId('location-path')).toHaveTextContent('/messages');
    expect(screen.getByTestId('location-search')).toHaveTextContent(
      '?groupId=detail-group'
    );
    expect(screen.getByTestId('location-state')).toHaveTextContent('null');
  });

  test('delegates detail callbacks, shapes derived payloads, and handles report and block flows', async () => {
    const detailGroup = buildGroup({
      id: 'detail-group',
      groupName: 'Detail Group',
      mode: 'friends',
      description: 'Detail group description',
    });
    const { relationship, translations } = renderCommunity({
      groups: [detailGroup],
      route: '/community/detail-group',
    });

    expect(screen.getByTestId('group-detail-current-user')).toHaveTextContent(
      'community-user'
    );

    await runWithReactAct(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Assign role' }));
      fireEvent.click(screen.getByRole('button', { name: 'Remove role' }));
      fireEvent.click(screen.getByRole('button', { name: 'Schedule event' }));
      fireEvent.click(screen.getByRole('button', { name: 'Respond to event' }));
      fireEvent.click(
        screen.getByRole('button', { name: 'Save availability' })
      );
      fireEvent.click(
        screen.getByRole('button', { name: 'Vote availability' })
      );
      fireEvent.click(screen.getByRole('button', { name: 'Report group' }));
    });

    expect(relationship.assignGroupRole).toHaveBeenCalledWith(
      'friends',
      detailGroup.id,
      'member-1',
      'organizer'
    );
    expect(relationship.removeGroupRole).toHaveBeenCalledWith(
      'friends',
      detailGroup.id,
      'member-1',
      'organizer'
    );

    const scheduledEvent = relationship.scheduleCommunityEvent.mock
      .calls[0]?.[2] as {
      attendance: Record<'going' | 'interested' | 'cant_make_it', string[]>;
      createdBy: string;
      description: string;
      id: string;
      location: string;
      startsAt: string;
      title: string;
    };

    expect(relationship.scheduleCommunityEvent).toHaveBeenCalledWith(
      'friends',
      detailGroup.id,
      expect.objectContaining({
        title: 'Planning Night',
        description: 'Plan the next meetup.',
        location: 'Portland',
        startsAt: '2026-05-01T18:30',
        createdBy: 'community-user',
      })
    );
    expect(scheduledEvent.id).toMatch(/^event-/);
    expect(scheduledEvent.attendance).toEqual({
      going: [],
      interested: [],
      cant_make_it: [],
    });

    expect(relationship.respondToCommunityEvent).toHaveBeenCalledWith(
      'friends',
      detailGroup.id,
      'event-42',
      'community-user',
      'interested'
    );

    const availabilityOptions = relationship.setCommunityAvailabilityOptions
      .mock.calls[0]?.[2] as Array<{
      id: string;
      label: string;
      voterUserIds: string[];
    }>;

    expect(relationship.setCommunityAvailabilityOptions).toHaveBeenCalledWith(
      'friends',
      detailGroup.id,
      expect.arrayContaining([
        expect.objectContaining({
          label: 'Saturday morning',
          voterUserIds: [],
        }),
        expect.objectContaining({
          label: 'Sunday afternoon',
          voterUserIds: [],
        }),
      ])
    );
    expect(availabilityOptions).toHaveLength(2);
    expect(availabilityOptions[0]?.id).toMatch(/^availability-/);
    expect(relationship.voteCommunityAvailability).toHaveBeenCalledWith(
      'friends',
      detailGroup.id,
      'option-1',
      'community-user'
    );

    expect(relationship.submitSafetyReport).toHaveBeenCalledWith(
      expect.objectContaining({
        modeId: 'friends',
        targetType: 'group',
        targetId: detailGroup.id,
        reason: 'community_rule_violation',
        range: 'full_conversation',
        summary: formatTemplate(
          translations.common.groupReportedTemplate?.en ?? '',
          { name: detailGroup.groupName }
        ),
        excerpt: [detailGroup.description],
      })
    );
    expect(
      await screen.findByText(translations.common.reportSavedLabel?.en ?? '')
    ).toBeInTheDocument();

    await runWithReactAct(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Block group' }));
    });

    expect(relationship.blockGroup).toHaveBeenCalledWith(
      'friends',
      detailGroup.id
    );
    expect(screen.getByTestId('location-path')).toHaveTextContent('/community');
    expect(
      await screen.findByText(translations.common.blockedGroupLabel?.en ?? '')
    ).toBeInTheDocument();
  });

  test('renders the create/edit fallback when CommunityForm throws', () => {
    const consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);

    setCommunityMockRuntime({
      communityFormShouldThrow: true,
      submittedGroup: {
        ...buildGroup({
          id: 'created-group',
          groupName: 'Created Group',
          mode: 'friends',
          description: 'Created group description',
        }),
        members: [],
        admins: [],
        chatRooms: [],
      },
    });
    const { translations } = renderCommunity({
      route: '/community/create',
    });

    expect(
      screen.getByText(
        translations.common.communityFormUnavailableTitle?.en ?? ''
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        translations.common.communityFormUnavailableMessage?.en ?? ''
      )
    ).toBeInTheDocument();

    consoleErrorSpy.mockRestore();
  });
});
