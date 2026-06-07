import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import Messages, { ChatView } from '../Messages';
import type {
  ChatType,
  GroupType,
  ModeType,
  RelationshipStateType,
} from '../../../../types';
import {
  blankDatingProfile,
  blankFriendProfile,
  buildDefaultRelationshipState,
  fetchTranslations,
  RelationshipProvider,
  User,
  UserContext,
  useRelationship,
} from '../../../../Utlilities';
import { getProfilesForMode } from '../../../../Utlilities/data';
import { useAuth } from '../../../../Utlilities/auth/AuthContext';
import { LOCAL_AUTH_USER_UID } from '../../../../Utlilities/auth/localIdentity';
import { DIRECT_CHAT_SELF_ID } from '../../../../Utlilities/chatIdentity';

jest.mock('../../../../Utlilities/auth/AuthContext', () => ({
  useAuth: jest.fn(),
}));

const mockedUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

type RenderMessagesOptions = {
  mode?: ModeType;
  groupMemberships?: string[];
  relationshipState?: RelationshipStateType;
  userOverride?: User;
  initialEntries?: Array<
    | string
    | { pathname: string; state: { contactId?: string; groupId?: string } }
  >;
};

/**
 * Build deterministic direct-chat fixtures for message UX tests.
 */
const buildDirectChats = (): ChatType[] => [
  {
    members: [
      { id: DIRECT_CHAT_SELF_ID, name: 'Me' },
      { id: 'u-1', name: 'Alex Rivera' },
    ],
    messages: [
      {
        sender: { id: 'u-1', name: 'Alex Rivera' },
        text: 'Brunch still on?',
        sentAt: '2024-06-15T10:00:00Z',
      },
      {
        sender: { id: DIRECT_CHAT_SELF_ID, name: 'Me' },
        text: 'Yep, see you at noon.',
        sentAt: '2024-06-15T10:02:00Z',
        status: 'delivered',
      },
    ],
  },
  {
    members: [
      { id: DIRECT_CHAT_SELF_ID, name: 'Me' },
      { id: 'u-2', name: 'Jordan Cole' },
    ],
    messages: [
      {
        sender: { id: 'u-2', name: 'Jordan Cole' },
        text: 'Design mock is ready.',
        sentAt: '2024-06-15T13:00:00Z',
      },
    ],
  },
];

/**
 * Build a canonical group payload with one chat room.
 */
const buildGroup = (): GroupType => ({
  id: 'group-1',
  groupName: 'Neighborhood Circle',
  groupPicture: '',
  description: 'Shared neighborhood updates',
  category: 'general',
  location: 'Portland, OR',
  groupType: 'public',
  interests: [],
  rules: '',
  tags: [],
  starredTags: [],
  admins: [],
  members: [
    {
      groupId: 'group-1',
      userId: LOCAL_AUTH_USER_UID,
      userName: 'You',
      joinedAt: '2026-01-01T00:00:00.000Z',
    },
    {
      groupId: 'group-1',
      userId: 'u-3',
      userName: 'Taylor Brook',
      joinedAt: '2026-01-01T00:00:00.000Z',
    },
  ],
  createdAt: '2026-01-01T00:00:00.000Z',
  chatRooms: [
    {
      roomId: 'group-room-1',
      groupId: 'group-1',
      roomName: 'General',
      createdAt: '2026-01-01T00:00:00.000Z',
      members: [
        {
          groupId: 'group-1',
          userId: LOCAL_AUTH_USER_UID,
          userName: 'You',
          joinedAt: '2026-01-01T00:00:00.000Z',
        },
        {
          groupId: 'group-1',
          userId: 'u-3',
          userName: 'Taylor Brook',
          joinedAt: '2026-01-01T00:00:00.000Z',
        },
      ],
      messages: [
        {
          groupId: 'group-1',
          messageId: 'group-message-1',
          senderId: 'u-3',
          content: 'Block party this Saturday.',
          sentAt: '2026-01-01T10:00:00.000Z',
        },
      ],
    },
  ],
  mode: 'friends',
});

/**
 * Build deterministic relationship state for messages tests.
 */
const buildRelationshipState = ({
  modeId = 'friends',
  directChats = buildDirectChats(),
  groups = [],
  blockedProfileIds = [],
  connectionIds,
}: {
  modeId?: ModeType['id'];
  directChats?: ChatType[];
  groups?: GroupType[];
  blockedProfileIds?: string[];
  connectionIds?: string[];
} = {}): RelationshipStateType => {
  const state = buildDefaultRelationshipState();
  state.byMode[modeId] = {
    ...state.byMode[modeId],
    directChats,
    groups,
    blockedProfileIds,
    connectionIds: connectionIds ?? state.byMode[modeId].connectionIds,
  };
  return state;
};

/**
 * Build an activation-ready user for message interaction tests.
 */
const buildActivatedUser = (modeId: ModeType['id']): User => {
  const user = new User();
  user.userSettings.mode = { id: modeId };

  if (modeId === 'dating') {
    user.dating = {
      ...blankDatingProfile,
      id: 'messages-ready-dating-profile',
      pictures: ['https://images.example.com/messages-dating.jpg'],
      name: 'Ready Dating User',
      main: {
        ...blankDatingProfile.main,
        age: 31,
        location: 'Portland',
        pronouns: 'they/them',
        seeking: ['Long-term relationship'],
      },
      hobbies: {
        ...blankDatingProfile.hobbies,
        full: ['Cooking'],
      },
      prompts: {
        ...blankDatingProfile.prompts,
        selfSummary: 'Ready to connect.',
      },
      connectionStyle: {
        ...blankDatingProfile.connectionStyle,
        communicationPace: 'balanced',
      },
    };
    return user;
  }

  user.friends = {
    ...blankFriendProfile,
    id: 'messages-ready-friends-profile',
    pictures: ['https://images.example.com/messages-friends.jpg'],
    name: 'Ready Friends User',
    main: {
      ...blankFriendProfile.main,
      age: 29,
      location: 'Portland',
      pronouns: 'they/them',
      seeking: ['New friends'],
    },
    hobbies: {
      ...blankFriendProfile.hobbies,
      full: ['Coffee'],
    },
    prompts: {
      ...blankFriendProfile.prompts,
      selfSummary: 'Ready to meet people.',
    },
    connectionStyle: {
      ...blankFriendProfile.connectionStyle,
      communicationPace: 'balanced',
    },
  };

  return user;
};

/**
 * Surface relationship state for assertions that need canonical persisted data.
 */
const RelationshipStateProbe = ({
  groupId,
  modeId,
}: {
  groupId: string;
  modeId: ModeType['id'];
}) => {
  const { getModeState } = useRelationship();
  const lastGroupMessageSenderId =
    getModeState(modeId)
      .groups.find((group) => group.id === groupId)
      ?.chatRooms[0]?.messages.at(-1)?.senderId ?? '';

  return (
    <div data-testid="group-message-sender-id">{lastGroupMessageSenderId}</div>
  );
};

/**
 * Surface blocked direct-contact ids for assertions around direct-contact blocking.
 */
const BlockedProfileIdsProbe = ({ modeId }: { modeId: ModeType['id'] }) => {
  const { getModeState } = useRelationship();
  const blockedProfileIds = getModeState(modeId).blockedProfileIds ?? [];

  return (
    <div data-testid="blocked-profile-ids">{blockedProfileIds.join(',')}</div>
  );
};

/**
 * Surface persisted safety reports for assertions around canonical moderation ids.
 */
const SafetyReportsProbe = () => {
  const { state } = useRelationship();
  const latestReport = state.safetyReports?.at(-1);

  return (
    <div data-testid="latest-safety-report-target">
      {latestReport
        ? `${latestReport.targetType}:${latestReport.targetId}`
        : ''}
    </div>
  );
};

/**
 * Surface the active location for deep-link assertions.
 */
const LocationProbe = () => {
  const location = useLocation();

  return (
    <div data-testid="messages-location">{`${location.pathname}${location.search}`}</div>
  );
};

/**
 * Render Messages with user context, router wrappers, and shared relationship state.
 */
const renderMessages = ({
  mode = { id: 'friends' },
  groupMemberships = [],
  relationshipState = buildRelationshipState({ modeId: mode.id }),
  userOverride,
  initialEntries = ['/messages'],
}: RenderMessagesOptions = {}) => {
  const translations = fetchTranslations();
  const user = userOverride ?? buildActivatedUser(mode.id);
  user.groupMemberships = {
    ...user.groupMemberships,
    [mode.id]: groupMemberships,
  };

  return render(
    <MemoryRouter
      initialEntries={initialEntries}
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
          <Routes>
            <Route
              path="/messages"
              element={
                <>
                  <Messages
                    mode={mode}
                    strings={{
                      messages: translations.messages,
                      messagingGuidance: translations.messagingGuidance,
                      common: translations.common,
                    }}
                    language="en"
                  />
                  <RelationshipStateProbe groupId="group-1" modeId={mode.id} />
                  <BlockedProfileIdsProbe modeId={mode.id} />
                  <SafetyReportsProbe />
                  <LocationProbe />
                </>
              }
            />
          </Routes>
        </UserContext.Provider>
      </RelationshipProvider>
    </MemoryRouter>
  );
};

/**
 * Override `matchMedia` so responsive message layouts can be tested
 * deterministically.
 */
const setViewportWidth = (width: number): (() => void) => {
  const previousMatchMedia = window.matchMedia;
  const nextMatchMedia = (query: string): MediaQueryList => {
    const normalizedQuery = query.replace(/^@media\s*/, '');
    const minWidthMatch = normalizedQuery.match(/\(min-width:\s*([\d.]+)px\)/);
    const maxWidthMatch = normalizedQuery.match(/\(max-width:\s*([\d.]+)px\)/);
    const minWidth = minWidthMatch ? Number(minWidthMatch[1]) : null;
    const maxWidth = maxWidthMatch ? Number(maxWidthMatch[1]) : null;
    const matches =
      (minWidth === null || width >= minWidth) &&
      (maxWidth === null || width <= maxWidth);

    return {
      matches,
      media: query,
      onchange: null,
      addListener: () => undefined,
      removeListener: () => undefined,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      dispatchEvent: () => false,
    } as MediaQueryList;
  };

  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: nextMatchMedia,
  });

  return () => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      configurable: true,
      value: previousMatchMedia,
    });
  };
};

const chatViewLabels = {
  back: 'Back',
  send: 'Send',
  placeholder: 'Type a message',
  statusSent: 'Sent',
  statusDelivered: 'Delivered',
  statusRead: 'Read',
  avatarPrefix: 'Avatar',
  currentUserName: 'You',
  report: 'Report',
  block: 'Block',
  suggestedOpeners: 'Suggested openers',
  useSuggestion: 'Use suggestion',
};

describe('Messages shared conversation state', () => {
  beforeEach(() => {
    mockedUseAuth.mockReset();
    mockedUseAuth.mockReturnValue({
      status: 'signed_in',
      user: {
        uid: LOCAL_AUTH_USER_UID,
        email: 'messages@example.com',
      },
      error: null,
      signIn: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
    });
    if (!HTMLElement.prototype.scrollIntoView) {
      HTMLElement.prototype.scrollIntoView = jest.fn();
    }
  });

  test('renders tab controls and search input for the active chat list', async () => {
    renderMessages();

    expect(
      await screen.findByRole('tab', { name: 'Direct' })
    ).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Groups' })).toBeInTheDocument();
    expect(
      screen.getByRole('searchbox', { name: /search/i })
    ).toBeInTheDocument();
  });

  test('filters direct chats by participant name and latest message snippet', async () => {
    renderMessages();

    const searchInput = await screen.findByRole('searchbox', {
      name: /search/i,
    });

    fireEvent.change(searchInput, { target: { value: 'Jordan' } });
    expect(screen.getByText('Jordan Cole')).toBeInTheDocument();
    expect(screen.queryByText('Alex Rivera')).not.toBeInTheDocument();

    fireEvent.change(searchInput, { target: { value: 'noon' } });
    expect(screen.getByText('Alex Rivera')).toBeInTheDocument();
    expect(screen.queryByText('Jordan Cole')).not.toBeInTheDocument();
  });

  test('shows a no-selection placeholder when chats exist and none are selected', async () => {
    renderMessages();

    expect(
      await screen.findByText(/select a conversation/i)
    ).toBeInTheDocument();
  });

  test('renders avatar fallback initials in list and message rows', async () => {
    renderMessages();

    expect((await screen.findAllByText('AR')).length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole('button', { name: /alex rivera/i }));
    expect((await screen.findAllByText('AR')).length).toBeGreaterThan(0);
  });

  test('renders message status labels for self messages', async () => {
    renderMessages();

    fireEvent.click(
      await screen.findByRole('button', { name: /alex rivera/i })
    );
    expect(await screen.findByText('Delivered')).toBeInTheDocument();
  });

  test('opens the requested direct chat from route state', async () => {
    renderMessages({
      initialEntries: [
        {
          pathname: '/messages',
          state: { contactId: 'u-2' },
        },
      ],
    });

    expect((await screen.findAllByText('Jordan Cole')).length).toBeGreaterThan(
      0
    );
    expect(
      (await screen.findAllByText('Design mock is ready.')).length
    ).toBeGreaterThan(0);
  });

  test('consumes routed direct-chat state after the initial selection', async () => {
    renderMessages({
      initialEntries: [
        {
          pathname: '/messages',
          state: { contactId: 'u-2' },
        },
      ],
    });

    await waitFor(() => {
      expect(screen.getAllByText('Design mock is ready.').length).toBe(2);
    });

    fireEvent.click(screen.getByRole('button', { name: /alex rivera/i }));

    await waitFor(() => {
      expect(screen.getAllByText('Design mock is ready.').length).toBe(1);
      expect(screen.getAllByText('Yep, see you at noon.').length).toBe(2);
    });

    fireEvent.change(screen.getByRole('textbox', { name: /type a message/i }), {
      target: { value: 'Still on for noon.' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Send' }));

    await waitFor(() => {
      expect(screen.getAllByText('Still on for noon.').length).toBe(2);
      expect(screen.getAllByText('Design mock is ready.').length).toBe(1);
    });
  });

  test('creates an empty direct thread from route state when no prior chat exists', async () => {
    const seededRecipient = getProfilesForMode('friends')[0];
    if (!seededRecipient) {
      throw new Error('Expected a seeded recipient profile.');
    }

    renderMessages({
      relationshipState: buildRelationshipState({
        modeId: 'friends',
        directChats: [],
      }),
      initialEntries: [
        {
          pathname: '/messages',
          state: { contactId: seededRecipient.id },
        },
      ],
    });

    fireEvent.change(
      await screen.findByRole('textbox', { name: /type a message/i }),
      {
        target: { value: 'First hello from a routed contact.' },
      }
    );
    fireEvent.click(screen.getByRole('button', { name: 'Send' }));

    expect(
      (await screen.findAllByText('First hello from a routed contact.')).length
    ).toBeGreaterThan(0);
    expect(
      (await screen.findAllByText(seededRecipient.name)).length
    ).toBeGreaterThan(0);
  });

  test('derives group chats from canonical joined groups', async () => {
    renderMessages({
      relationshipState: buildRelationshipState({
        groups: [buildGroup()],
      }),
      groupMemberships: ['group-1'],
    });

    fireEvent.click(await screen.findByRole('tab', { name: 'Groups' }));

    expect(await screen.findByText('Neighborhood Circle')).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole('button', { name: /neighborhood circle/i })
    );
    expect(
      (await screen.findAllByText('Block party this Saturday.')).length
    ).toBeGreaterThan(0);
  });

  test('shows per-tab empty states when no direct chats or joined groups exist', async () => {
    renderMessages({
      relationshipState: buildRelationshipState({
        directChats: [],
        groups: [],
      }),
      groupMemberships: [],
    });

    expect(await screen.findByText(/no direct chats/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('tab', { name: 'Groups' }));
    expect(await screen.findByText(/no group chats/i)).toBeInTheDocument();
  });

  test('opens canonical seeded chats from route state and appends a sent message', async () => {
    const seededState = buildDefaultRelationshipState();
    const seededContact =
      seededState.byMode.friends.directChats[0]?.members.find(
        (member) => member.id !== DIRECT_CHAT_SELF_ID
      );
    if (!seededContact) {
      throw new Error('Expected a canonical seeded direct chat contact.');
    }

    renderMessages({
      relationshipState: seededState,
      initialEntries: [
        {
          pathname: '/messages',
          state: { contactId: seededContact.id },
        },
      ],
    });

    expect(
      (await screen.findAllByText(seededContact.name)).length
    ).toBeGreaterThan(0);
    fireEvent.change(screen.getByRole('textbox', { name: /type a message/i }), {
      target: { value: 'Following up from the seeded chat.' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Send' }));

    expect(
      (await screen.findAllByText('Following up from the seeded chat.')).length
    ).toBeGreaterThan(0);
    expect(await screen.findByText('Sent')).toBeInTheDocument();
  });

  test('shows first-message suggestions for empty direct chats', async () => {
    const seededRecipient = getProfilesForMode('friends')[0];
    if (!seededRecipient) {
      throw new Error('Expected a seeded recipient profile.');
    }

    const user = new User();
    const emptyChatState = buildRelationshipState({
      directChats: [
        {
          members: [
            { id: DIRECT_CHAT_SELF_ID, name: 'Me' },
            { id: seededRecipient.id, name: seededRecipient.name },
          ],
          messages: [],
        },
      ],
    });

    renderMessages({
      relationshipState: emptyChatState,
      userOverride: user,
      initialEntries: [
        {
          pathname: '/messages',
          state: { contactId: seededRecipient.id },
        },
      ],
    });

    expect(await screen.findByText('Suggested openers')).toBeInTheDocument();
    expect(
      (await screen.findAllByRole('button', { name: 'Use suggestion' })).length
    ).toBeGreaterThan(0);
  });

  test('shows first-contact guidance banner and prompt tray for empty direct chats', async () => {
    const seededRecipient = getProfilesForMode('friends')[0];
    const viewerProfile = getProfilesForMode('friends')[1];
    if (!seededRecipient || !viewerProfile) {
      throw new Error(
        'Expected seeded friends profiles for first-contact guidance.'
      );
    }

    const user = new User();
    user.friends = {
      ...viewerProfile,
      id: 'viewer-friends-profile',
      restrictionState: 'active',
      lifecycleState: 'ready_to_connect',
    } as User['friends'];

    renderMessages({
      mode: { id: 'friends' },
      relationshipState: buildRelationshipState({
        modeId: 'friends',
        directChats: [
          {
            members: [
              { id: DIRECT_CHAT_SELF_ID, name: 'Me' },
              { id: seededRecipient.id, name: seededRecipient.name },
            ],
            messages: [],
          },
        ],
      }),
      userOverride: user,
      initialEntries: [
        {
          pathname: '/messages',
          state: { contactId: seededRecipient.id },
        },
      ],
    });

    expect(
      await screen.findByText('Low-pressure intro allowed')
    ).toBeInTheDocument();
    expect(await screen.findByText('Shared hobby')).toBeInTheDocument();
    expect(await screen.findByText('Shared community')).toBeInTheDocument();
  });

  test('shows blocked first-contact guidance and disables sending when intro is unavailable', async () => {
    const blockedRecipient = getProfilesForMode('dating').find(
      (profile) =>
        profile.messagingPrivacy === 'connections_only' &&
        profile.restrictionState === 'active'
    );
    const viewerProfile = getProfilesForMode('dating').find(
      (profile) => profile.id !== blockedRecipient?.id
    );
    if (!blockedRecipient || !viewerProfile) {
      throw new Error(
        'Expected seeded dating profiles for blocked-contact guidance.'
      );
    }

    const blockedState = buildRelationshipState({
      modeId: 'dating',
      directChats: [
        {
          members: [
            { id: 'me', name: 'Me' },
            { id: blockedRecipient.id, name: blockedRecipient.name },
          ],
          messages: [],
        },
      ],
    });
    blockedState.byMode.dating = {
      ...blockedState.byMode.dating,
      connectionIds: [],
    };

    const user = new User();
    user.dating = {
      ...viewerProfile,
      id: 'viewer-dating-profile',
      restrictionState: 'active',
      lifecycleState: 'ready_to_connect',
      verificationTier: 'baseline_verified',
    } as User['dating'];

    renderMessages({
      mode: { id: 'dating' },
      relationshipState: blockedState,
      userOverride: user,
      initialEntries: [
        {
          pathname: '/messages',
          state: { contactId: blockedRecipient.id },
        },
      ],
    });

    fireEvent.change(screen.getByRole('textbox', { name: /type a message/i }), {
      target: { value: 'Hello there' },
    });

    expect(
      await screen.findByText('Only connections can message this user.')
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Send' })).toBeDisabled();
    expect(screen.queryByText('Shared interest')).not.toBeInTheDocument();
  });

  test('disables the composer and explains the activation gate when the profile is incomplete', async () => {
    renderMessages({
      userOverride: new User(),
      initialEntries: [
        {
          pathname: '/messages',
          state: { contactId: 'u-1' },
        },
      ],
    });

    expect(
      await screen.findByText(
        'Complete your profile to send messages. You can still review conversations while you finish it.'
      )
    ).toBeInTheDocument();
    expect(
      screen.getByRole('textbox', { name: /type a message/i })
    ).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Send' })).toBeDisabled();
  });

  test('allows first contact when an existing connection already has a direct chat', async () => {
    const connectedRecipient = getProfilesForMode('dating').find(
      (profile) =>
        profile.messagingPrivacy === 'connections_only' &&
        profile.restrictionState === 'active'
    );
    const viewerProfile = getProfilesForMode('dating').find(
      (profile) => profile.id !== connectedRecipient?.id
    );
    if (!connectedRecipient || !viewerProfile) {
      throw new Error(
        'Expected seeded dating profiles for connected-contact guidance.'
      );
    }

    const connectedState = buildRelationshipState({
      modeId: 'dating',
      directChats: [
        {
          members: [
            { id: DIRECT_CHAT_SELF_ID, name: 'Me' },
            { id: connectedRecipient.id, name: connectedRecipient.name },
          ],
          messages: [],
        },
      ],
      connectionIds: [connectedRecipient.id],
    });

    const user = new User();
    user.dating = {
      ...viewerProfile,
      id: 'viewer-dating-profile',
      restrictionState: 'active',
      lifecycleState: 'ready_to_connect',
      verificationTier: 'baseline_verified',
    } as User['dating'];

    renderMessages({
      mode: { id: 'dating' },
      relationshipState: connectedState,
      userOverride: user,
      initialEntries: [
        {
          pathname: '/messages',
          state: { contactId: connectedRecipient.id },
        },
      ],
    });

    fireEvent.change(
      await screen.findByRole('textbox', { name: /type a message/i }),
      {
        target: { value: 'Connected hello' },
      }
    );

    expect(
      screen.queryByText('Only connections can message this user.')
    ).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Send' })).toBeEnabled();

    fireEvent.click(screen.getByRole('button', { name: 'Send' }));

    expect(
      (await screen.findAllByText('Connected hello')).length
    ).toBeGreaterThan(0);
  });

  test('supports reporting and blocking from the selected conversation header', async () => {
    renderMessages();

    fireEvent.click(
      await screen.findByRole('button', { name: /alex rivera/i })
    );

    fireEvent.click(screen.getByRole('button', { name: 'Report' }));
    expect(
      await screen.findByText('Report saved for review.')
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Block' }));
    expect(
      await screen.findByText(/select a conversation/i)
    ).toBeInTheDocument();
    await waitFor(() => {
      expect(
        screen.queryByRole('button', { name: /alex rivera/i })
      ).not.toBeInTheDocument();
    });
    expect(
      screen.getByRole('button', { name: /jordan cole/i })
    ).toBeInTheDocument();
  });

  test('blocks direct contacts using the canonical profile id and removes them from the list', async () => {
    const seededRecipient = getProfilesForMode('friends')[0];
    if (!seededRecipient) {
      throw new Error('Expected a seeded friends profile.');
    }

    renderMessages({
      relationshipState: buildRelationshipState({
        modeId: 'friends',
        directChats: [
          {
            members: [
              { id: DIRECT_CHAT_SELF_ID, name: 'Me' },
              { id: seededRecipient.id, name: seededRecipient.name },
            ],
            messages: [
              {
                sender: { id: seededRecipient.id, name: seededRecipient.name },
                text: 'Direct thread',
                sentAt: '2026-01-01T10:00:00.000Z',
              },
            ],
          },
        ],
      }),
      initialEntries: [
        {
          pathname: '/messages',
          state: { contactId: seededRecipient.id },
        },
      ],
    });

    expect(
      (await screen.findAllByText(seededRecipient.name)).length
    ).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole('button', { name: 'Block' }));

    expect(await screen.findByText(/no direct chats/i)).toBeInTheDocument();
    expect(screen.queryByText(seededRecipient.name)).not.toBeInTheDocument();
    expect(screen.getByTestId('blocked-profile-ids')).toHaveTextContent(
      seededRecipient.id
    );
  });

  test('stores canonical profile ids when reporting direct conversations', async () => {
    const seededRecipient = getProfilesForMode('friends')[0];
    if (!seededRecipient) {
      throw new Error('Expected a seeded friends profile.');
    }

    renderMessages({
      relationshipState: buildRelationshipState({
        modeId: 'friends',
        directChats: [
          {
            members: [
              { id: DIRECT_CHAT_SELF_ID, name: 'Me' },
              { id: seededRecipient.id, name: seededRecipient.name },
            ],
            messages: [
              {
                sender: { id: seededRecipient.id, name: seededRecipient.name },
                text: 'Please review this conversation.',
                sentAt: '2026-01-01T10:00:00.000Z',
              },
            ],
          },
        ],
      }),
      initialEntries: [
        {
          pathname: '/messages',
          state: { contactId: seededRecipient.id },
        },
      ],
    });

    expect(
      (await screen.findAllByText(seededRecipient.name)).length
    ).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole('button', { name: 'Report' }));

    expect(
      await screen.findByText('Report saved for review.')
    ).toBeInTheDocument();
    expect(screen.getByTestId('latest-safety-report-target')).toHaveTextContent(
      `conversation:${seededRecipient.id}`
    );
  });

  test('does not create a blocked direct thread from routed state', async () => {
    const seededRecipient = getProfilesForMode('friends')[0];
    if (!seededRecipient) {
      throw new Error('Expected a seeded friends profile.');
    }

    renderMessages({
      relationshipState: buildRelationshipState({
        modeId: 'friends',
        directChats: [],
        blockedProfileIds: [seededRecipient.id],
      }),
      initialEntries: [
        {
          pathname: '/messages',
          state: { contactId: seededRecipient.id },
        },
      ],
    });

    expect(await screen.findByText(/no direct chats/i)).toBeInTheDocument();
    expect(
      screen.queryByRole('textbox', { name: /type a message/i })
    ).not.toBeInTheDocument();
    expect(screen.queryByText(seededRecipient.name)).not.toBeInTheDocument();
  });

  test('clears a blocked direct-chat query deep link so groups remain reachable', async () => {
    renderMessages({
      relationshipState: buildRelationshipState({
        modeId: 'friends',
        directChats: [],
        blockedProfileIds: ['blocked-contact'],
        groups: [buildGroup()],
      }),
      groupMemberships: ['group-1'],
      initialEntries: ['/messages?contactId=blocked-contact'],
    });

    expect(await screen.findByText(/no direct chats/i)).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByTestId('messages-location')).toHaveTextContent(
        '/messages'
      );
    });

    fireEvent.click(screen.getByRole('tab', { name: 'Groups' }));

    expect(
      await screen.findByRole('button', { name: /neighborhood circle/i })
    ).toBeInTheDocument();
  });

  test('clears an unresolved direct-chat query deep link so groups remain reachable', async () => {
    renderMessages({
      relationshipState: buildRelationshipState({
        modeId: 'friends',
        directChats: [],
        groups: [buildGroup()],
      }),
      groupMemberships: ['group-1'],
      initialEntries: ['/messages?contactId=unknown-contact'],
    });

    expect(await screen.findByText(/no direct chats/i)).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByTestId('messages-location')).toHaveTextContent(
        '/messages'
      );
    });

    fireEvent.click(screen.getByRole('tab', { name: 'Groups' }));

    expect(
      await screen.findByRole('button', { name: /neighborhood circle/i })
    ).toBeInTheDocument();
  });

  test('clears an unresolved group-chat query deep link so direct chats remain reachable', async () => {
    renderMessages({
      relationshipState: buildRelationshipState({
        modeId: 'friends',
        groups: [buildGroup()],
      }),
      groupMemberships: [],
      initialEntries: ['/messages?groupId=group-1'],
    });

    await waitFor(() => {
      expect(screen.getByTestId('messages-location')).toHaveTextContent(
        '/messages'
      );
    });

    expect(
      await screen.findByRole('button', { name: /alex rivera/i })
    ).toBeInTheDocument();
  });

  test('clears an unresolved group-chat route target so direct chats remain reachable', async () => {
    renderMessages({
      relationshipState: buildRelationshipState({
        modeId: 'friends',
        groups: [buildGroup()],
      }),
      groupMemberships: [],
      initialEntries: [
        {
          pathname: '/messages',
          state: { groupId: 'group-1' },
        },
      ],
    });

    expect(
      await screen.findByRole('button', { name: /alex rivera/i })
    ).toBeInTheDocument();
  });

  test('opens the requested direct chat from a query-string deep link', async () => {
    renderMessages({
      mode: { id: 'friends' },
      relationshipState: buildRelationshipState({
        modeId: 'friends',
        directChats: [
          {
            members: [
              { id: DIRECT_CHAT_SELF_ID, name: 'Me' },
              { id: 'friends-contact-1', name: 'Morgan Hale' },
            ],
            messages: [
              {
                sender: { id: 'friends-contact-1', name: 'Morgan Hale' },
                text: 'Checking in before tonight.',
                sentAt: '2026-01-01T09:00:00.000Z',
              },
            ],
          },
        ],
      }),
      initialEntries: ['/messages?contactId=friends-contact-1'],
    });

    expect((await screen.findAllByText('Morgan Hale')).length).toBeGreaterThan(
      0
    );
    expect(
      (await screen.findAllByText('Checking in before tonight.')).length
    ).toBeGreaterThan(0);
  });

  test('consumes a direct-chat query deep link after the first selection', async () => {
    const { container } = renderMessages({
      mode: { id: 'friends' },
      relationshipState: buildRelationshipState({
        modeId: 'friends',
        directChats: [
          {
            members: [
              { id: DIRECT_CHAT_SELF_ID, name: 'Me' },
              { id: 'friends-contact-1', name: 'Morgan Hale' },
            ],
            messages: [
              {
                sender: { id: 'friends-contact-1', name: 'Morgan Hale' },
                text: 'Checking in before tonight.',
                sentAt: '2026-01-01T09:00:00.000Z',
              },
            ],
          },
          {
            members: [
              { id: DIRECT_CHAT_SELF_ID, name: 'Me' },
              { id: 'friends-contact-2', name: 'Jordan Cole' },
            ],
            messages: [
              {
                sender: { id: 'friends-contact-2', name: 'Jordan Cole' },
                text: 'Design mock is ready.',
                sentAt: '2026-01-01T10:00:00.000Z',
              },
            ],
          },
        ],
      }),
      initialEntries: ['/messages?contactId=friends-contact-1'],
    });

    await waitFor(() => {
      expect(container.querySelector('.chat-title')?.textContent).toBe(
        'Morgan Hale'
      );
    });
    expect(screen.getByTestId('messages-location')).toHaveTextContent(
      '/messages'
    );

    fireEvent.click(screen.getByRole('button', { name: /jordan cole/i }));

    await waitFor(() => {
      expect(container.querySelector('.chat-title')?.textContent).toBe(
        'Jordan Cole'
      );
    });

    fireEvent.change(screen.getByRole('textbox', { name: /type a message/i }), {
      target: { value: 'Need one more revision.' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Send' }));

    await waitFor(() => {
      expect(container.querySelector('.chat-title')?.textContent).toBe(
        'Jordan Cole'
      );
    });
    expect(
      (await screen.findAllByText('Need one more revision.')).length
    ).toBeGreaterThan(0);
  });

  test('opens, sends, reports, and blocks a group conversation from a group deep link', async () => {
    renderMessages({
      relationshipState: buildRelationshipState({
        groups: [buildGroup()],
      }),
      groupMemberships: ['group-1'],
      initialEntries: ['/messages?groupId=group-1'],
    });

    expect(
      (await screen.findAllByText('Neighborhood Circle')).length
    ).toBeGreaterThan(0);
    fireEvent.change(screen.getByRole('textbox', { name: /type a message/i }), {
      target: { value: 'I can help with setup.' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Send' }));

    expect(
      (await screen.findAllByText('I can help with setup.')).length
    ).toBeGreaterThan(0);
    await waitFor(() => {
      expect(screen.getByTestId('group-message-sender-id')).toHaveTextContent(
        LOCAL_AUTH_USER_UID
      );
    });

    fireEvent.click(screen.getByRole('button', { name: 'Report' }));
    expect(
      await screen.findByText('Report saved for review.')
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Block' }));
    expect(await screen.findByText(/no group chats/i)).toBeInTheDocument();
  });

  test('supports back navigation and clears a selected direct chat when search removes it', async () => {
    renderMessages();

    fireEvent.click(
      await screen.findByRole('button', { name: /alex rivera/i })
    );
    expect((await screen.findAllByText('Alex Rivera')).length).toBeGreaterThan(
      0
    );

    fireEvent.click(screen.getByRole('button', { name: 'Back' }));
    expect(
      await screen.findByText(/select a conversation/i)
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /alex rivera/i }));
    fireEvent.change(screen.getByRole('searchbox', { name: /search/i }), {
      target: { value: 'Jordan' },
    });

    expect(
      await screen.findByText(/select a conversation/i)
    ).toBeInTheDocument();
    expect(screen.getByText('Jordan Cole')).toBeInTheDocument();
    expect(screen.queryByText('Alex Rivera')).not.toBeInTheDocument();
  });

  test('uses a dedicated mobile thread view when a chat is selected', async () => {
    const restoreViewport = setViewportWidth(375);

    try {
      renderMessages();

      expect(
        await screen.findByRole('searchbox', { name: /search/i })
      ).toBeInTheDocument();
      expect(
        screen.queryByRole('textbox', { name: /type a message/i })
      ).not.toBeInTheDocument();

      fireEvent.click(
        await screen.findByRole('button', { name: /alex rivera/i })
      );

      expect(
        screen.queryByRole('searchbox', { name: /search/i })
      ).not.toBeInTheDocument();
      expect(
        await screen.findByRole('textbox', { name: /type a message/i })
      ).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: 'Back' }));

      expect(
        await screen.findByRole('searchbox', { name: /search/i })
      ).toBeInTheDocument();
      expect(
        screen.queryByRole('textbox', { name: /type a message/i })
      ).not.toBeInTheDocument();
    } finally {
      restoreViewport();
    }
  });

  test('uses the canonical self id for seeded chats so titles exclude the current user', async () => {
    renderMessages({
      relationshipState: buildDefaultRelationshipState(),
    });

    expect(await screen.findByText('Tom Dillo')).toBeInTheDocument();
    expect(screen.queryByText('Me, Tom Dillo')).not.toBeInTheDocument();
  });
});

describe('ChatView', () => {
  test('uses suggested openers, ignores blank submits, and forwards header actions', () => {
    const onSend = jest.fn();
    const onBack = jest.fn();
    const onReport = jest.fn();
    const onBlock = jest.fn();

    render(
      <ChatView
        chat={{
          members: [
            { id: DIRECT_CHAT_SELF_ID, name: 'Me' },
            { id: 'u-1', name: 'Alex Rivera' },
          ],
          messages: [],
        }}
        language="en"
        onSend={onSend}
        onBack={onBack}
        labels={chatViewLabels}
        suggestions={['Hello Alex']}
        onReport={onReport}
        onBlock={onBlock}
      />
    );

    const composer = screen
      .getByRole('textbox', { name: chatViewLabels.placeholder })
      .closest('form');
    if (!(composer instanceof HTMLFormElement)) {
      throw new Error('Expected a composer form.');
    }

    fireEvent.change(
      screen.getByRole('textbox', { name: chatViewLabels.placeholder }),
      {
        target: { value: '   ' },
      }
    );
    fireEvent.submit(composer);
    expect(onSend).not.toHaveBeenCalled();

    fireEvent.click(
      screen.getByRole('button', { name: chatViewLabels.useSuggestion })
    );
    expect(
      screen.getByRole('textbox', { name: chatViewLabels.placeholder })
    ).toHaveValue('Hello Alex');

    fireEvent.submit(composer);
    expect(onSend).toHaveBeenCalledWith('Hello Alex');

    fireEvent.click(screen.getByRole('button', { name: chatViewLabels.back }));
    fireEvent.click(
      screen.getByRole('button', { name: chatViewLabels.report })
    );
    fireEvent.click(screen.getByRole('button', { name: chatViewLabels.block }));

    expect(onBack).toHaveBeenCalled();
    expect(onReport).toHaveBeenCalled();
    expect(onBlock).toHaveBeenCalled();
  });

  test('renders read status labels for self-authored messages', () => {
    render(
      <ChatView
        chat={{
          members: [
            { id: DIRECT_CHAT_SELF_ID, name: 'Me' },
            { id: 'u-1', name: 'Alex Rivera' },
          ],
          messages: [
            {
              sender: { id: DIRECT_CHAT_SELF_ID, name: 'Me' },
              text: 'Already read',
              sentAt: '2026-01-01T10:00:00.000Z',
              status: 'read',
            },
          ],
        }}
        language="en"
        onSend={jest.fn()}
        onBack={jest.fn()}
        labels={chatViewLabels}
      />
    );

    expect(screen.getByText('Read')).toBeInTheDocument();
  });
});
