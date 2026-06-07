import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { act } from 'react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import Discovery from './Discovery';
import { ToastProvider } from '../../Common';
import {
  blankDatingProfile,
  buildDefaultRelationshipState,
  fetchTranslations,
  RelationshipProvider,
  User,
  UserContext,
  useRelationship,
} from '../../../Utlilities';
import { useAuth } from '../../../Utlilities/auth/AuthContext';
import {
  datingProfileData,
  neighborhoodProfileData,
} from '../../../Utlilities/data';
import type {
  GroupType,
  ModeType,
  ProfileType,
  RelationshipStateType,
} from '../../../types';
import { fetchProfileDataAsync } from './DiscoveryHelper';
import { buildMessagesPath } from '../Dashboard/dashboardRoutes';

jest.mock('./DiscoveryHelper', () => ({
  ...jest.requireActual('./DiscoveryHelper'),
  fetchProfileDataAsync: jest.fn(),
}));
jest.mock('../../../Utlilities/auth/AuthContext', () => ({
  useAuth: jest.fn(),
}));

const mockedFetchProfileDataAsync =
  fetchProfileDataAsync as jest.MockedFunction<typeof fetchProfileDataAsync>;
const mockedUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const translations = fetchTranslations();
const reportLabel = translations.common.reportLabel?.en ?? 'Report';
const reportSavedLabel =
  translations.common.reportSavedLabel?.en ?? 'Report saved for review.';
const blockLabel = translations.common.blockLabel?.en ?? 'Block';
const blockedGroupLabel =
  translations.common.blockedGroupLabel?.en ?? 'Group hidden in this mode.';
const recipientUnavailableForConnectionsLabel =
  translations.common.recipientUnavailableForConnections?.en ??
  'This user cannot receive new connection requests right now.';
const connectionsOnlyDatingProfile = datingProfileData.find(
  (profile) =>
    profile.messagingPrivacy === 'connections_only' &&
    profile.restrictionState === 'active' &&
    Boolean(profile.id) &&
    Boolean(profile.name)
) as ProfileType | undefined;

type RenderDiscoveryOptions = {
  mode?: ModeType;
  joinedGroups?: string[];
  userProfile?: ProfileType;
  relationshipState?: RelationshipStateType;
  setUserGroupMemberships?: jest.Mock;
  onModeSurfaceLoadingChange?: jest.Mock;
  waitForLoad?: boolean;
};

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
 * Attach a mode profile to the test user without weakening types.
 */
const setModeUserProfile = (
  user: User,
  modeId: ModeType['id'],
  profile: ProfileType
): void => {
  switch (modeId) {
    case 'dating':
      user.dating = profile as User['dating'];
      return;
    case 'friends':
      user.friends = profile as User['friends'];
      return;
    case 'academic':
      user.academic = profile as User['academic'];
      return;
    case 'professional':
      user.professional = profile as User['professional'];
      return;
    case 'neighborhood':
      user.neighborhood = profile as User['neighborhood'];
      return;
  }
};

/**
 * Build canonical relationship state for a single discovery mode.
 */
const buildRelationshipState = (
  modeId: ModeType['id'],
  overrides: Partial<RelationshipStateType['byMode'][ModeType['id']]> = {}
): RelationshipStateType => {
  const state = buildDefaultRelationshipState();
  state.byMode[modeId] = {
    ...state.byMode[modeId],
    connectionIds: [],
    outgoingConnectionRequestIds: [],
    incomingConnectionRequestIds: [],
    incomingInterestIds: [],
    declinedProfileIds: [],
    groups: [],
    ...overrides,
  };
  return state;
};

/**
 * Build an activation-ready dating profile for discovery interaction tests.
 */
const buildActivatedDatingProfile = (
  overrides: Partial<ProfileType> = {}
): ProfileType => {
  const overrideMain = (overrides.main ?? {}) as typeof blankDatingProfile.main;
  const overrideHobbies = (overrides.hobbies ??
    {}) as typeof blankDatingProfile.hobbies;
  const overridePrompts = (overrides.prompts ??
    {}) as typeof blankDatingProfile.prompts;
  const overrideConnectionStyle = (overrides.connectionStyle ??
    {}) as typeof blankDatingProfile.connectionStyle;

  return {
    ...blankDatingProfile,
    ...overrides,
    id: overrides.id ?? 'discovery-ready-profile',
    pictures: overrides.pictures ?? [
      'https://images.example.com/discovery-ready.jpg',
    ],
    name: overrides.name ?? 'Discovery Ready User',
    main: {
      ...blankDatingProfile.main,
      ...overrideMain,
      age: overrideMain.age ?? 31,
      location: overrideMain.location ?? 'Portland, OR',
      pronouns: overrideMain.pronouns ?? 'they/them',
      seeking: overrideMain.seeking ?? ['Long-term relationship'],
    },
    hobbies: {
      ...blankDatingProfile.hobbies,
      ...overrideHobbies,
      full: overrideHobbies.full ?? ['Cooking'],
    },
    prompts: {
      ...blankDatingProfile.prompts,
      ...overridePrompts,
      selfSummary: overridePrompts.selfSummary ?? 'Ready to connect.',
    },
    connectionStyle: {
      ...blankDatingProfile.connectionStyle,
      ...overrideConnectionStyle,
      communicationPace:
        overrideConnectionStyle?.communicationPace ?? 'balanced',
    },
  } as ProfileType;
};

/**
 * Render Discovery with mocked profile data and the shared relationship provider.
 */
const renderDiscovery = async ({
  mode = { id: 'dating' },
  joinedGroups = [],
  userProfile,
  relationshipState = buildRelationshipState(mode.id),
  setUserGroupMemberships = jest.fn(),
  onModeSurfaceLoadingChange,
  waitForLoad = true,
}: RenderDiscoveryOptions = {}) => {
  const user = new User();
  const resolvedUserProfile =
    mode.id === 'dating'
      ? buildActivatedDatingProfile(userProfile)
      : userProfile ?? undefined;
  user.groupMemberships = {
    ...user.groupMemberships,
    [mode.id]: joinedGroups,
  };
  if (resolvedUserProfile) {
    setModeUserProfile(user, mode.id, resolvedUserProfile);
  }

  let renderResult: ReturnType<typeof render> | undefined;

  renderResult = render(
    <MemoryRouter
      initialEntries={['/']}
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <ToastProvider>
        <RelationshipProvider initialState={relationshipState}>
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
                path="/"
                element={
                  <Discovery
                    mode={mode}
                    language="en"
                    strings={{
                      discovery: translations.discovery,
                      profile: translations.profile,
                      common: translations.common,
                      connectionStyle: translations.connectionStyle,
                      discoveryGuidance: translations.discoveryGuidance,
                      communityGuidance: translations.communityGuidance,
                    }}
                    onModeSurfaceLoadingChange={onModeSurfaceLoadingChange}
                  />
                }
              />
              <Route path="/messages" element={<div>Messages page</div>} />
              <Route
                path="/community/:groupId"
                element={<div>Community detail page</div>}
              />
            </Routes>
            <LocationProbe />
            <GroupMemberNameProbe groupId="join-group" />
          </UserContext.Provider>
        </RelationshipProvider>
      </ToastProvider>
    </MemoryRouter>
  );

  if (!renderResult) {
    throw new Error('Discovery render did not return a result.');
  }

  if (waitForLoad) {
    await waitFor(() =>
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
    );
  }

  return renderResult;
};

/**
 * Resolve the interactive filter combobox when card fields share a label.
 */
const getInteractiveCombobox = (label: string): HTMLElement => {
  const combobox = screen
    .getAllByRole('combobox', { name: label })
    .find(
      (element) =>
        element.getAttribute('aria-haspopup') === 'listbox' &&
        !element.hasAttribute('disabled') &&
        !element.hasAttribute('readonly')
    );

  if (!(combobox instanceof HTMLElement)) {
    throw new Error(`Expected interactive combobox labeled "${label}".`);
  }

  return combobox;
};

/**
 * Choose an option from a labeled MUI select in the discovery workspace.
 */
const chooseSelectOption = async (
  label: string,
  optionName: string
): Promise<void> => {
  fireEvent.mouseDown(getInteractiveCombobox(label));
  fireEvent.click(await screen.findByRole('option', { name: optionName }));
};

/**
 * Assert that one rendered text node appears before another in document order.
 */
const expectTextBefore = (firstText: string, secondText: string): void => {
  const firstElement = screen.getByText(firstText);
  const secondElement = screen.getByText(secondText);

  expect(
    firstElement.compareDocumentPosition(secondElement) &
      Node.DOCUMENT_POSITION_FOLLOWING
  ).toBeTruthy();
};

/**
 * Resolve the visible card container for a rendered discovery group.
 */
const getGroupCard = (groupName: string): HTMLElement => {
  const title = screen.getByText(groupName);
  const card = title.closest('.MuiCard-root');

  if (!(card instanceof HTMLElement)) {
    throw new Error(`Expected group card for "${groupName}".`);
  }

  return card;
};

/**
 * Render the current router location for deep-link assertions.
 */
const LocationProbe = () => {
  const location = useLocation();
  return (
    <div data-testid="location-probe">{`${location.pathname}${location.search}`}</div>
  );
};

/**
 * Render canonical membership names for one discovery group after join actions.
 */
const GroupMemberNameProbe = ({ groupId }: { groupId: string }) => {
  const { getModeState } = useRelationship();
  const targetGroup = getModeState('dating').groups.find(
    (group) => group.id === groupId
  );

  return (
    <div data-testid="group-member-name-probe">
      {(targetGroup?.members ?? []).map((member) => member.userName).join(',')}
    </div>
  );
};

if (!connectionsOnlyDatingProfile?.id || !connectionsOnlyDatingProfile.name) {
  throw new Error(
    'Expected a seeded connections-only dating profile for discovery tests.'
  );
}

describe('Discovery', () => {
  beforeEach(() => {
    mockedFetchProfileDataAsync.mockReset();
    mockedUseAuth.mockReset();
    mockedUseAuth.mockReturnValue({
      status: 'signed_in',
      user: { uid: 'discovery-user', email: 'discovery@example.com' },
      error: null,
      signIn: jest.fn(async () => undefined),
      signUp: jest.fn(async () => undefined),
      signOut: jest.fn(async () => undefined),
    });
  });

  test('renders a PeopleCard for each discoverable profile in the people tab', async () => {
    const profiles: ProfileType[] = datingProfileData.slice(0, 2);
    mockedFetchProfileDataAsync.mockResolvedValue(profiles);

    await renderDiscovery();

    for (const profile of profiles) {
      expect(await screen.findByText(profile.name ?? '')).toBeInTheDocument();
    }
  });

  test('reports mode-surface loading state while discovery profiles are fetched', async () => {
    let resolveProfiles: ((profiles: ProfileType[] | null) => void) | undefined;
    const onModeSurfaceLoadingChange = jest.fn();
    mockedFetchProfileDataAsync.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveProfiles = resolve;
        })
    );

    const renderPromise = renderDiscovery({
      onModeSurfaceLoadingChange,
      waitForLoad: false,
    });

    await waitFor(() => {
      expect(onModeSurfaceLoadingChange).toHaveBeenCalledWith({
        modeId: 'dating',
        isLoading: true,
      });
    });

    if (!resolveProfiles) {
      throw new Error('Expected discovery profile request resolver.');
    }

    const resolveDiscoveryProfiles = resolveProfiles;
    await act(async () => {
      resolveDiscoveryProfiles([datingProfileData[0] as ProfileType]);
      await Promise.resolve();
    });
    await renderPromise;

    expect(onModeSurfaceLoadingChange).toHaveBeenCalledWith({
      modeId: 'dating',
      isLoading: false,
    });
  });

  test('reports mode-surface loading completion when discovery unmounts mid-fetch', async () => {
    let resolveProfiles: ((profiles: ProfileType[] | null) => void) | undefined;
    const onModeSurfaceLoadingChange = jest.fn();
    mockedFetchProfileDataAsync.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveProfiles = resolve;
        })
    );

    const renderResult = await renderDiscovery({
      onModeSurfaceLoadingChange,
      waitForLoad: false,
    });

    await waitFor(() => {
      expect(onModeSurfaceLoadingChange).toHaveBeenCalledWith({
        modeId: 'dating',
        isLoading: true,
      });
    });

    renderResult.unmount();

    expect(onModeSurfaceLoadingChange).toHaveBeenCalledWith({
      modeId: 'dating',
      isLoading: false,
    });

    if (!resolveProfiles) {
      throw new Error('Expected discovery profile request resolver.');
    }

    const resolveDiscoveryProfiles = resolveProfiles;
    await act(async () => {
      resolveDiscoveryProfiles([datingProfileData[0] as ProfileType]);
      await Promise.resolve();
    });

    const completedLoadingCalls = onModeSurfaceLoadingChange.mock.calls.filter(
      ([change]) => change.modeId === 'dating' && change.isLoading === false
    );

    expect(completedLoadingCalls).toHaveLength(1);
  });

  test('filters out the current user, existing connections, and declined profiles', async () => {
    const selfProfile: ProfileType = {
      ...datingProfileData[0],
      id: 'self-profile',
      name: 'Self Profile',
    };
    const connectedProfile: ProfileType = {
      ...datingProfileData[1],
      id: 'connected-profile',
      name: 'Connected Profile',
    };
    const declinedProfile: ProfileType = {
      ...datingProfileData[2],
      id: 'declined-profile',
      name: 'Declined Profile',
    };
    const visibleProfile: ProfileType = {
      ...datingProfileData[3],
      id: 'visible-profile',
      name: 'Visible Profile',
    };
    mockedFetchProfileDataAsync.mockResolvedValue([
      connectedProfile,
      declinedProfile,
      visibleProfile,
    ]);

    await renderDiscovery({
      userProfile: selfProfile,
      relationshipState: buildRelationshipState('dating', {
        connectionIds: [connectedProfile.id],
        declinedProfileIds: [declinedProfile.id],
      }),
    });

    expect(await screen.findByText('Visible Profile')).toBeInTheDocument();
    expect(screen.queryByText('Connected Profile')).not.toBeInTheDocument();
    expect(screen.queryByText('Declined Profile')).not.toBeInTheDocument();
    expect(screen.queryByText('Self Profile')).not.toBeInTheDocument();
  });

  test('neighborhood discovery shows an empty state when only existing connections remain', async () => {
    const neighborhoodProfiles = neighborhoodProfileData.slice(0, 3);
    mockedFetchProfileDataAsync.mockResolvedValue(neighborhoodProfiles);

    await renderDiscovery({
      mode: { id: 'neighborhood' },
      relationshipState: buildRelationshipState('neighborhood', {
        connectionIds: neighborhoodProfiles.map((profile) => profile.id),
        incomingInterestIds: [],
        groups: [],
      }),
    });

    expect(await screen.findByText('No profiles found')).toBeInTheDocument();
  });

  test('neighborhood discovery paginates the expanded cross-mode seed pool', async () => {
    mockedFetchProfileDataAsync.mockResolvedValue(neighborhoodProfileData);

    await renderDiscovery({
      mode: { id: 'neighborhood' },
    });

    expect(
      await screen.findByRole('button', { name: /load more/i })
    ).toBeInTheDocument();
  });

  test('groups tab renders canonical relationship groups', async () => {
    mockedFetchProfileDataAsync.mockResolvedValue(
      datingProfileData.slice(0, 1)
    );

    await renderDiscovery({
      relationshipState: buildRelationshipState('dating', {
        groups: [
          buildGroup({
            id: 'group-1',
            groupName: 'Test Group One',
            mode: 'dating',
          }),
        ],
      }),
    });

    await screen.findByText(datingProfileData[0].name ?? '');
    fireEvent.click(
      screen.getByRole('tab', {
        name: translations.discovery.dating.groupsButton.en,
      })
    );

    expect(await screen.findByText('Test Group One')).toBeInTheDocument();
  });

  test('supports joining discovery groups and opening their detail routes', async () => {
    const setUserGroupMemberships = jest.fn();
    const userProfile: ProfileType = {
      ...datingProfileData[0],
      id: 'discovery-profile-user',
      name: 'Discovery Public Name',
    };
    mockedFetchProfileDataAsync.mockResolvedValue(
      datingProfileData.slice(0, 1)
    );

    await renderDiscovery({
      relationshipState: buildRelationshipState('dating', {
        groups: [
          buildGroup({
            id: 'join-group',
            groupName: 'Join Group',
            mode: 'dating',
          }),
          buildGroup({
            id: 'detail-group',
            groupName: 'Detail Group',
            mode: 'dating',
          }),
        ],
      }),
      userProfile,
      setUserGroupMemberships,
    });

    await screen.findByText(datingProfileData[0].name ?? '');
    fireEvent.click(
      screen.getByRole('tab', {
        name: translations.discovery.dating.groupsButton.en,
      })
    );

    fireEvent.click(
      within(getGroupCard('Join Group')).getByRole('button', {
        name: translations.common.join.en,
      })
    );

    expect(await screen.findByText('Joined Join Group')).toBeInTheDocument();
    expect(setUserGroupMemberships).toHaveBeenCalledWith('dating', [
      'join-group',
    ]);
    expect(screen.getByTestId('group-member-name-probe')).toHaveTextContent(
      'Discovery Public Name'
    );

    fireEvent.click(
      within(getGroupCard('Detail Group')).getByRole('button', {
        name: translations.common.viewDetails.en,
      })
    );

    expect(
      await screen.findByText('Community detail page')
    ).toBeInTheDocument();
  });

  test('supports reporting and blocking discovery groups', async () => {
    mockedFetchProfileDataAsync.mockResolvedValue(
      datingProfileData.slice(0, 1)
    );

    await renderDiscovery({
      relationshipState: buildRelationshipState('dating', {
        groups: [
          buildGroup({
            id: 'safety-group',
            groupName: 'Safety Group',
            mode: 'dating',
          }),
        ],
      }),
    });

    await screen.findByText(datingProfileData[0].name ?? '');
    fireEvent.click(
      screen.getByRole('tab', {
        name: translations.discovery.dating.groupsButton.en,
      })
    );

    const groupCard = getGroupCard('Safety Group');

    expect(
      within(groupCard).getByRole('button', { name: reportLabel })
    ).toBeInTheDocument();
    expect(
      within(groupCard).getByRole('button', { name: blockLabel })
    ).toBeInTheDocument();

    fireEvent.click(
      within(groupCard).getByRole('button', { name: reportLabel })
    );
    expect(await screen.findByText(reportSavedLabel)).toBeInTheDocument();

    fireEvent.click(
      within(groupCard).getByRole('button', { name: blockLabel })
    );

    expect(await screen.findByText(blockedGroupLabel)).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.queryByText('Safety Group')).not.toBeInTheDocument();
    });
  });

  test('filter changes update displayed results', async () => {
    const profiles: ProfileType[] = [
      {
        ...datingProfileData[0],
        id: '10',
        name: 'Zeta Person',
      },
      {
        ...datingProfileData[1],
        id: '11',
        name: 'Alpha Person',
      },
    ];
    mockedFetchProfileDataAsync.mockResolvedValue(profiles);

    await renderDiscovery();

    expect(await screen.findByText('Zeta Person')).toBeInTheDocument();
    expect(screen.getByText('Alpha Person')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Search'), {
      target: { value: 'Alpha' },
    });

    expect(screen.getByText('Alpha Person')).toBeInTheDocument();
    expect(screen.queryByText('Zeta Person')).not.toBeInTheDocument();
  });

  test('does not let discovery search match hidden name or location', async () => {
    const hiddenName = 'Private Search Name';
    const hiddenLocation = 'Private Harbor';
    mockedFetchProfileDataAsync.mockResolvedValue([
      {
        ...datingProfileData[0],
        id: 'visible-search-profile',
        name: 'Visible Search Profile',
      },
      {
        ...datingProfileData[1],
        id: 'hidden-search-profile',
        name: hiddenName,
        profileVisibility: 'connections_only' as const,
        main: {
          ...datingProfileData[1].main,
          location: hiddenLocation,
        },
        fieldVisibility: {
          ...datingProfileData[1].fieldVisibility,
          location: 'connections_only' as const,
        },
      },
    ]);

    await renderDiscovery();

    await screen.findByText('Visible Search Profile');

    fireEvent.change(
      screen.getByLabelText(translations.discovery.dating.searchLabel.en),
      {
        target: { value: hiddenName },
      }
    );

    expect(
      await screen.findByText(translations.discovery.dating.noProfiles.en)
    ).toBeInTheDocument();

    fireEvent.change(
      screen.getByLabelText(translations.discovery.dating.searchLabel.en),
      {
        target: { value: hiddenLocation },
      }
    );

    expect(
      await screen.findByText(translations.discovery.dating.noProfiles.en)
    ).toBeInTheDocument();
  });

  test('clear action resets people filters after an empty-state search', async () => {
    mockedFetchProfileDataAsync.mockResolvedValue([
      {
        ...datingProfileData[0],
        id: 'clear-filter-profile',
        name: 'Clear Filter Profile',
      },
    ]);

    await renderDiscovery();

    await screen.findByText('Clear Filter Profile');
    fireEvent.change(
      screen.getByLabelText(translations.discovery.dating.searchLabel.en),
      {
        target: { value: 'No Match Here' },
      }
    );

    expect(
      await screen.findByText(translations.discovery.dating.noProfiles.en)
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole('button', { name: translations.common.clear.en })
    );

    expect(await screen.findByText('Clear Filter Profile')).toBeInTheDocument();
  });

  test('compatibility filters narrow results and surface best-next-step guidance', async () => {
    const viewerProfile: ProfileType = {
      ...datingProfileData[0],
      id: 'viewer-profile',
      name: 'Viewer Profile',
      hobbies: {
        ...datingProfileData[0].hobbies,
        full: ['hiking'],
      },
      main: {
        ...datingProfileData[0].main,
        location: 'Portland, OR',
      },
      connectionStyle: {
        availabilityPattern: 'weekends',
        communicationPace: 'low_pressure',
        introductionPreference: 'group_first',
        planningStyle: 'plan_ahead',
        languageComfort: {
          preferredLanguages: ['en'],
          multilingualWelcome: true,
        },
      },
    };
    const weekendProfile: ProfileType = {
      ...datingProfileData[1],
      id: 'weekend-profile',
      name: 'Weekend Match',
      hobbies: {
        ...datingProfileData[1].hobbies,
        full: ['hiking'],
      },
      main: {
        ...datingProfileData[1].main,
        location: 'Portland, OR',
      },
      connectionStyle: {
        availabilityPattern: 'weekends',
        communicationPace: 'low_pressure',
        introductionPreference: 'group_first',
        planningStyle: 'plan_ahead',
        languageComfort: {
          preferredLanguages: ['en'],
          multilingualWelcome: true,
        },
      },
    };
    const weekdayProfile: ProfileType = {
      ...datingProfileData[2],
      id: 'weekday-profile',
      name: 'Weekday Match',
      hobbies: {
        ...datingProfileData[2].hobbies,
        full: ['cooking'],
      },
      main: {
        ...datingProfileData[2].main,
        location: 'Seattle, WA',
      },
      connectionStyle: {
        availabilityPattern: 'evenings',
        communicationPace: 'balanced',
        introductionPreference: 'direct_intro_ok',
        planningStyle: 'spontaneous',
        languageComfort: {
          preferredLanguages: ['en'],
        },
      },
    };
    mockedFetchProfileDataAsync.mockResolvedValue([
      weekendProfile,
      weekdayProfile,
    ]);

    await renderDiscovery({
      userProfile: viewerProfile,
      relationshipState: buildRelationshipState('dating', {
        groups: [
          {
            ...buildGroup({
              id: 'shared-context-group',
              groupName: 'Shared Context Group',
              mode: 'dating',
            }),
            tags: ['hiking'],
            interests: ['hiking'],
          },
        ],
      }),
    });

    await screen.findByText('Weekend Match');
    expect(screen.getByText('Weekday Match')).toBeInTheDocument();

    fireEvent.mouseDown(
      screen.getByRole('combobox', {
        name: 'Availability',
      })
    );
    fireEvent.click(await screen.findByRole('option', { name: 'Weekends' }));

    expect(screen.getByText('Weekend Match')).toBeInTheDocument();
    expect(screen.queryByText('Weekday Match')).not.toBeInTheDocument();
    expect(
      screen.getByText('Best next step: Start with shared context')
    ).toBeInTheDocument();
  });

  test('EmptyState renders when no people are available', async () => {
    mockedFetchProfileDataAsync.mockResolvedValue([]);

    await renderDiscovery({
      relationshipState: buildRelationshipState('dating', { groups: [] }),
    });

    expect(await screen.findByText('No profiles found')).toBeInTheDocument();
  });

  test('renders a profile error state when loading fails', async () => {
    mockedFetchProfileDataAsync.mockRejectedValue(
      new Error('Profiles failed to load')
    );

    await renderDiscovery();

    expect(
      await screen.findByText('Profiles failed to load')
    ).toBeInTheDocument();
  });

  test('EmptyState renders when no groups are available', async () => {
    mockedFetchProfileDataAsync.mockResolvedValue(
      datingProfileData.slice(0, 1)
    );

    await renderDiscovery({
      relationshipState: buildRelationshipState('dating', { groups: [] }),
    });

    await screen.findByText(datingProfileData[0].name ?? '');
    fireEvent.click(
      screen.getByRole('tab', {
        name: translations.discovery.dating.groupsButton.en,
      })
    );

    expect(await screen.findByText('No groups found')).toBeInTheDocument();
  });

  test('load more paginates the people list', async () => {
    const profiles: ProfileType[] = Array.from({ length: 8 }, (_, index) => ({
      ...datingProfileData[0],
      id: `${100 + index}`,
      name: `Person ${index + 1}`,
    }));
    mockedFetchProfileDataAsync.mockResolvedValue(profiles);

    await renderDiscovery();

    expect(await screen.findByText('Person 1')).toBeInTheDocument();
    expect(screen.queryByText('Person 7')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /load more/i }));

    expect(await screen.findByText('Person 7')).toBeInTheDocument();
  });

  test('supports sorting people by name and recent profile ids with mode prefixes', async () => {
    mockedFetchProfileDataAsync.mockResolvedValue([
      {
        ...datingProfileData[0],
        id: '11',
        name: 'Zeta Person',
      },
      {
        ...datingProfileData[1],
        id: '10',
        name: 'Alpha Person',
      },
      {
        ...datingProfileData[2],
        id: 'dating-20',
        name: 'Newest Person',
      },
    ]);

    await renderDiscovery();

    await screen.findByText('Zeta Person');
    expect(screen.getByText('Alpha Person')).toBeInTheDocument();

    await chooseSelectOption(
      translations.discovery.dating.sortLabel.en,
      translations.discovery.dating.sortName.en
    );
    expectTextBefore('Alpha Person', 'Zeta Person');

    await chooseSelectOption(
      translations.discovery.dating.sortLabel.en,
      translations.discovery.dating.sortRecent.en
    );
    expectTextBefore('Newest Person', 'Zeta Person');
    expectTextBefore('Zeta Person', 'Alpha Person');
  });

  test('sorts groups in the groups tab by name and member count', async () => {
    const groups: GroupType[] = [
      buildGroup({
        id: 'group-zeta',
        groupName: 'Zeta Group',
        mode: 'dating',
        members: [
          {
            groupId: 'group-zeta',
            userId: 'member-zeta',
            userName: 'Member Zeta',
            joinedAt: '2026-01-01T00:00:00.000Z',
          },
        ],
      }),
      buildGroup({
        id: 'group-alpha',
        groupName: 'Alpha Group',
        mode: 'dating',
        members: [
          {
            groupId: 'group-alpha',
            userId: 'member-alpha-1',
            userName: 'Member Alpha 1',
            joinedAt: '2026-01-01T00:00:00.000Z',
          },
          {
            groupId: 'group-alpha',
            userId: 'member-alpha-2',
            userName: 'Member Alpha 2',
            joinedAt: '2026-01-02T00:00:00.000Z',
          },
          {
            groupId: 'group-alpha',
            userId: 'member-alpha-3',
            userName: 'Member Alpha 3',
            joinedAt: '2026-01-03T00:00:00.000Z',
          },
        ],
      }),
      buildGroup({
        id: 'group-middle',
        groupName: 'Middle Group',
        mode: 'dating',
        members: [
          {
            groupId: 'group-middle',
            userId: 'member-middle-1',
            userName: 'Member Middle 1',
            joinedAt: '2026-01-01T00:00:00.000Z',
          },
          {
            groupId: 'group-middle',
            userId: 'member-middle-2',
            userName: 'Member Middle 2',
            joinedAt: '2026-01-02T00:00:00.000Z',
          },
        ],
      }),
    ];
    mockedFetchProfileDataAsync.mockResolvedValue(
      datingProfileData.slice(0, 1)
    );

    await renderDiscovery({
      relationshipState: buildRelationshipState('dating', {
        groups,
      }),
    });

    await screen.findByText(datingProfileData[0].name ?? '');
    fireEvent.click(
      screen.getByRole('tab', {
        name: translations.discovery.dating.groupsButton.en,
      })
    );

    await chooseSelectOption(
      translations.discovery.dating.sortLabel.en,
      translations.discovery.dating.sortName.en
    );
    expectTextBefore('Alpha Group', 'Zeta Group');

    await chooseSelectOption(
      translations.discovery.dating.sortLabel.en,
      translations.discovery.dating.sortMembers.en
    );
    expectTextBefore('Alpha Group', 'Zeta Group');
  });

  test('derives group mode-specific filter options from community metadata', async () => {
    mockedFetchProfileDataAsync.mockResolvedValue([
      {
        ...datingProfileData[0],
        id: 'dating-filter-profile',
        name: 'Dating Filter Profile',
        main: {
          ...datingProfileData[0].main,
          seeking: ['casual connections'],
        },
      },
    ]);

    await renderDiscovery({
      relationshipState: buildRelationshipState('dating', {
        groups: [
          {
            ...buildGroup({
              id: 'board-games-group',
              groupName: 'Board Games Social',
              mode: 'dating',
            }),
            category: 'shared hobby',
            location: 'Seattle, WA',
            tags: ['board games'],
          },
          {
            ...buildGroup({
              id: 'running-group',
              groupName: 'Running Club',
              mode: 'dating',
            }),
            category: 'outdoors',
            location: 'Portland, OR',
            tags: ['running'],
          },
        ],
      }),
    });

    await screen.findByText('Dating Filter Profile');
    fireEvent.click(
      screen.getByRole('tab', {
        name: translations.discovery.dating.groupsButton.en,
      })
    );

    fireEvent.mouseDown(
      screen.getByRole('combobox', {
        name: translations.discovery.dating.modeSpecificLabel.en,
      })
    );

    expect(
      await screen.findByRole('option', { name: 'board games' })
    ).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'casual connections' })).toBe(
      null
    );

    fireEvent.click(screen.getByRole('option', { name: 'board games' }));

    expect(await screen.findByText('Board Games Social')).toBeInTheDocument();
    expect(screen.queryByText('Running Club')).not.toBeInTheDocument();
  });

  test('load more paginates groups in the groups tab', async () => {
    mockedFetchProfileDataAsync.mockResolvedValue(
      datingProfileData.slice(0, 1)
    );

    await renderDiscovery({
      relationshipState: buildRelationshipState('dating', {
        groups: Array.from({ length: 8 }, (_, index) =>
          buildGroup({
            id: `group-extra-${index + 1}`,
            groupName: `Group ${index + 1}`,
            mode: 'dating',
          })
        ),
      }),
    });

    await screen.findByText(datingProfileData[0].name ?? '');
    fireEvent.click(
      screen.getByRole('tab', {
        name: translations.discovery.dating.groupsButton.en,
      })
    );

    expect(screen.queryByText('Group 7')).not.toBeInTheDocument();

    fireEvent.click(
      screen.getByRole('button', { name: translations.common.loadMore.en })
    );

    expect(await screen.findByText('Group 7')).toBeInTheDocument();
  });

  test('like action updates the profile CTA using relationship state', async () => {
    const profile: ProfileType = {
      ...datingProfileData[0],
      id: 'like-1',
      name: 'Alex Like',
    };
    mockedFetchProfileDataAsync.mockResolvedValue([profile]);

    await renderDiscovery();

    await screen.findByText('Alex Like');
    fireEvent.click(screen.getByRole('button', { name: 'Like' }));

    expect(screen.getByRole('button', { name: 'Liked' })).toBeInTheDocument();
  });

  test('like action accepts incoming interest and shows connection feedback', async () => {
    const profile: ProfileType = {
      ...datingProfileData[0],
      id: 'accepted-like-profile',
      name: 'Accepted Like Profile',
    };
    mockedFetchProfileDataAsync.mockResolvedValue([profile]);

    await renderDiscovery({
      relationshipState: buildRelationshipState('dating', {
        incomingInterestIds: [profile.id],
      }),
    });

    await screen.findByText('Accepted Like Profile');
    fireEvent.click(
      screen.getByRole('button', { name: translations.common.like.en })
    );

    expect(
      await screen.findByText('Connected with Accepted Like Profile')
    ).toBeInTheDocument();
  });

  test('like action explains when a connection request was already sent', async () => {
    const profile: ProfileType = {
      ...datingProfileData[0],
      id: 'already-requested-profile',
      name: 'Already Requested Profile',
    };
    mockedFetchProfileDataAsync.mockResolvedValue([profile]);

    await renderDiscovery({
      relationshipState: buildRelationshipState('dating', {
        outgoingConnectionRequestIds: [profile.id],
      }),
    });

    await screen.findByText('Already Requested Profile');
    fireEvent.click(
      screen.getByRole('button', { name: translations.common.liked.en })
    );

    expect(
      await screen.findByText(
        'Connection request already sent to Already Requested Profile.'
      )
    ).toBeInTheDocument();
  });

  test('like action explains when a profile cannot receive new connection requests', async () => {
    const profile: ProfileType = {
      ...datingProfileData[0],
      id: 'restricted-recipient-profile',
      name: 'Restricted Recipient',
      restrictionState: 'restricted',
    };
    mockedFetchProfileDataAsync.mockResolvedValue([profile]);

    await renderDiscovery();

    await screen.findByText('Restricted Recipient');
    fireEvent.click(
      screen.getByRole('button', { name: translations.common.like.en })
    );

    expect(
      (await screen.findAllByText(recipientUnavailableForConnectionsLabel))
        .length
    ).toBeGreaterThan(0);
  });

  test('message action navigates to messages for an allowed profile', async () => {
    const profile: ProfileType = {
      ...datingProfileData[0],
      id: 'message-1',
      name: 'Alex Message',
    };
    mockedFetchProfileDataAsync.mockResolvedValue([profile]);

    await renderDiscovery();

    await screen.findByText('Alex Message');
    fireEvent.click(screen.getByRole('button', { name: 'Message' }));

    expect(await screen.findByText('Messages page')).toBeInTheDocument();
    expect(screen.getByTestId('location-probe')).toHaveTextContent(
      buildMessagesPath({ contactId: 'message-1' })
    );
  });

  test('message action explains when a seeded profile only accepts connections', async () => {
    mockedFetchProfileDataAsync.mockResolvedValue([
      connectionsOnlyDatingProfile,
    ]);

    await renderDiscovery();

    await screen.findByText(connectionsOnlyDatingProfile.name);
    fireEvent.click(screen.getByRole('button', { name: 'Message' }));

    expect(
      (await screen.findAllByText('Only connections can message this user.'))
        .length
    ).toBeGreaterThan(0);
    expect(screen.queryByText('Messages page')).not.toBeInTheDocument();
  });

  test('infers group memberships from the authenticated user id', async () => {
    const authUserId = 'auth-user-77';
    const setUserGroupMemberships = jest.fn();
    mockedUseAuth.mockReturnValue({
      status: 'signed_in',
      user: { uid: authUserId, email: 'auth-user@example.com' },
      error: null,
      signIn: jest.fn(async () => undefined),
      signUp: jest.fn(async () => undefined),
      signOut: jest.fn(async () => undefined),
    });
    mockedFetchProfileDataAsync.mockResolvedValue(
      datingProfileData.slice(0, 1)
    );

    await renderDiscovery({
      relationshipState: buildRelationshipState('dating', {
        groups: [
          buildGroup({
            id: 'group-auth',
            groupName: 'Authenticated Group',
            mode: 'dating',
            members: [
              {
                groupId: 'group-auth',
                userId: authUserId,
                userName: 'Authenticated User',
                joinedAt: '2024-01-01T00:00:00.000Z',
              },
            ],
          }),
        ],
      }),
      setUserGroupMemberships,
    });

    await waitFor(() => {
      expect(setUserGroupMemberships).toHaveBeenCalledWith('dating', [
        'group-auth',
      ]);
    });
  });

  test('surfaces why-shown context and supports blocking a profile', async () => {
    const profile = {
      ...datingProfileData[0],
      id: 'why-shown-profile',
      name: 'Why Shown Profile',
    };
    mockedFetchProfileDataAsync.mockResolvedValue([profile]);

    await renderDiscovery({
      relationshipState: buildRelationshipState('dating', {
        incomingInterestIds: [profile.id],
      }),
    });

    await screen.findByText('Why Shown Profile');
    const profileCard = screen
      .getByText('Why Shown Profile')
      .closest('.MuiCard-root');

    if (!(profileCard instanceof HTMLElement)) {
      throw new Error('Expected Why Shown Profile to render inside a card.');
    }

    expect(
      within(profileCard).getByRole('button', { name: 'Why shown' })
    ).toBeInTheDocument();
    expect(
      within(profileCard).getByRole('button', { name: reportLabel })
    ).toBeInTheDocument();
    expect(
      within(profileCard).getByRole('button', { name: blockLabel })
    ).toBeInTheDocument();

    fireEvent.click(
      within(profileCard).getByRole('button', { name: reportLabel })
    );

    expect(await screen.findByText(reportSavedLabel)).toBeInTheDocument();

    fireEvent.click(
      within(profileCard).getByRole('button', { name: 'Why shown' })
    );

    expect(
      await screen.findByText(
        'They already signaled interest, so this is a high-confidence next step.'
      )
    ).toBeInTheDocument();

    fireEvent.click(within(profileCard).getByRole('button', { name: 'Block' }));
    await waitFor(() =>
      expect(screen.queryByText('Why Shown Profile')).not.toBeInTheDocument()
    );
  });
});
