import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import {
  matchesConnectionWorkspaceFilter,
  default as DashboardConnections,
} from '../DashboardConnections';
import {
  buildDefaultRelationshipState,
  fetchTranslations,
  RelationshipProvider,
  User,
  UserContext,
} from '../../../../Utlilities';
import * as dataModule from '../../../../Utlilities/data';
import { getProfilesForMode } from '../../../../Utlilities/data';
import { useAuth } from '../../../../Utlilities/auth/AuthContext';
import { emitWhoTelemetryEvent } from '../../../../Utlilities/telemetry';
import type { ProfileType, RelationshipStateType } from '../../../../types';
import {
  buildDirectRequestPath,
  buildDiscoveryPath,
  buildMessagesPath,
} from '../dashboardRoutes';

jest.mock('../../../../Utlilities/auth/AuthContext', () => ({
  useAuth: jest.fn(),
}));

jest.mock('../../../../Utlilities/telemetry', () => ({
  emitWhoTelemetryEvent: jest.fn(),
}));

const mockedUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockedEmitWhoTelemetryEvent =
  emitWhoTelemetryEvent as jest.MockedFunction<typeof emitWhoTelemetryEvent>;

const translations = fetchTranslations();
const relationshipState = buildDefaultRelationshipState();
const occupiedDatingProfileIds = new Set([
  ...relationshipState.byMode.dating.connectionIds,
  ...relationshipState.byMode.dating.incomingInterestIds,
]);
const availableDatingProfiles = getProfilesForMode('dating').filter(
  (profile) => !occupiedDatingProfileIds.has(profile.id)
);
const firstConnectionProfileId =
  relationshipState.byMode.dating.connectionIds[0];
const firstConnectionProfile = getProfilesForMode('dating').find(
  (profile) => profile.id === firstConnectionProfileId
);
const firstInterestedProfileId =
  relationshipState.byMode.dating.incomingInterestIds[0];
const firstInterestedProfile = getProfilesForMode('dating').find(
  (profile) => profile.id === firstInterestedProfileId
);
const requestProfile = getProfilesForMode('dating').find(
  (profile) => !occupiedDatingProfileIds.has(profile.id)
);
const outgoingRequestProfile = availableDatingProfiles[1];
const declinedConnectionProfile = availableDatingProfiles[2];
const selfRequestProfile = availableDatingProfiles[3];
const requestedConnectionProfileId =
  relationshipState.byMode.dating.connectionIds[1];
const requestedConnectionProfile = getProfilesForMode('dating').find(
  (profile) => profile.id === requestedConnectionProfileId
);
const firstSortedConnectionProfile =
  relationshipState.byMode.dating.connectionIds
    .map((profileId) =>
      getProfilesForMode('dating').find((profile) => profile.id === profileId)
    )
    .filter((profile): profile is NonNullable<typeof firstConnectionProfile> =>
      Boolean(profile)
    )
    .sort((leftProfile, rightProfile) =>
      leftProfile.name.localeCompare(rightProfile.name)
    )[0];

if (
  !firstConnectionProfile ||
  !firstInterestedProfile ||
  !firstSortedConnectionProfile ||
  !requestProfile ||
  !outgoingRequestProfile ||
  !declinedConnectionProfile ||
  !selfRequestProfile ||
  !requestedConnectionProfile
) {
  throw new Error(
    'Expected seeded connection profiles for dashboard connections tests.'
  );
}

/**
 * Render the current router location for navigation assertions.
 */
const LocationProbe = () => {
  const location = useLocation();
  return (
    <div data-testid="location-probe">{`${location.pathname}${location.search}`}</div>
  );
};

/**
 * Build a dating-specific relationship state with minimal overrides.
 */
const buildDatingConnectionsState = (
  overrides: Partial<RelationshipStateType['byMode']['dating']> = {}
): RelationshipStateType => {
  const nextState = buildDefaultRelationshipState();
  nextState.byMode.dating = {
    ...nextState.byMode.dating,
    ...overrides,
  };
  return nextState;
};

/**
 * Render the connections workspace with stable providers.
 */
const renderDashboardConnections = ({
  initialEntry = '/dashboard/connections?tab=interested',
  initialState = relationshipState,
  user = new User(),
  language = 'en',
}: {
  initialEntry?: string;
  initialState?: RelationshipStateType;
  user?: User;
  language?: 'de' | 'en' | 'es';
} = {}) => {
  render(
    <MemoryRouter
      initialEntries={[initialEntry]}
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
            <DashboardConnections
              mode={{ id: 'dating' }}
              language={language}
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
 * Return the rendered list-row title element for a profile, excluding preview headings.
 */
const queryListRowTitle = (profileName: string): HTMLElement | undefined =>
  screen
    .queryAllByText(profileName)
    .find(
      (element): element is HTMLElement =>
        element instanceof HTMLElement &&
        element.className.includes('MuiTypography-subtitle1')
    );

/**
 * Resolve the list-row container for a profile in the connections results grid.
 */
const getListRowForProfile = (profileName: string): HTMLElement => {
  const listRowTitle = queryListRowTitle(profileName);

  if (!(listRowTitle instanceof HTMLElement)) {
    throw new Error(`Expected a list row for profile "${profileName}".`);
  }

  const row = listRowTitle.parentElement?.parentElement;

  if (!(row instanceof HTMLElement)) {
    throw new Error(`Expected a row container for profile "${profileName}".`);
  }

  return row;
};

describe('DashboardConnections', () => {
  beforeEach(() => {
    mockedUseAuth.mockReset();
    mockedEmitWhoTelemetryEvent.mockReset();
    mockedUseAuth.mockReturnValue({
      status: 'signed_in',
      user: { uid: 'dashboard-user', email: 'dashboard@example.com' },
      error: null,
      signIn: jest.fn(async () => undefined),
      signUp: jest.fn(async () => undefined),
      signOut: jest.fn(async () => undefined),
    });
  });

  test('renders the unified connections workspace and seeded interested profiles', () => {
    renderDashboardConnections();

    expect(screen.getByText('Connections')).toBeInTheDocument();
    expect(
      screen.getByRole('tab', { name: /Interested/i })
    ).toBeInTheDocument();
    expect(
      screen.getAllByText(firstInterestedProfile.name).length
    ).toBeGreaterThan(0);
    expect(
      screen.getAllByRole('button', { name: 'Preview' }).length
    ).toBeGreaterThan(0);
  });

  test('honors preview query params when opening a specific connection', () => {
    const user = new User();

    render(
      <MemoryRouter
        initialEntries={[
          `/dashboard/connections?tab=connections&preview=${requestedConnectionProfile.id}`,
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
            <>
              <DashboardConnections
                mode={{ id: 'dating' }}
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

    const previewHeading = screen.getByRole('heading', { name: 'Preview' });
    const previewCard = previewHeading.closest('.MuiCard-root');

    if (!(previewCard instanceof HTMLElement)) {
      throw new Error('Expected connections preview card to render.');
    }

    expect(
      within(previewCard).getByText(requestedConnectionProfile.name)
    ).toBeInTheDocument();
  });

  test('updates the workspace query when previewing a profile from the list', () => {
    renderDashboardConnections({
      initialEntry: '/dashboard/connections?tab=connections',
    });

    fireEvent.click(screen.getAllByRole('button', { name: 'Preview' })[0]);

    expect(
      screen.getByText(
        `/dashboard/connections?tab=connections&preview=${firstSortedConnectionProfile.id}`
      )
    ).toBeInTheDocument();
  });

  test('removes redundant open-profile actions from connected profiles', () => {
    renderDashboardConnections({
      initialEntry: '/dashboard/connections?tab=connections',
    });

    expect(
      screen.queryByRole('button', { name: 'Open profile' })
    ).not.toBeInTheDocument();
    expect(
      screen.getAllByRole('button', { name: 'Message' }).length
    ).toBeGreaterThan(0);
  });

  test('treats connected rows as settled without relying on localized status text', () => {
    expect(
      matchesConnectionWorkspaceFilter({
        item: {
          id: firstSortedConnectionProfile.id,
          name: firstSortedConnectionProfile.name,
          statusLabel:
            translations.dashboard.viewModels.connections.connected.es,
          primaryAction: {
            label: translations.dashboard.viewModels.connections.message.es,
          },
        },
        workspaceFilter: 'settled',
        activeTab: 'connections',
      })
    ).toBe(true);
  });

  test('removes the misleading keep-pending button from request rows', () => {
    const requestState = buildDefaultRelationshipState();
    requestState.byMode.dating = {
      ...requestState.byMode.dating,
      incomingConnectionRequestIds: [requestProfile.id],
    };

    renderDashboardConnections({
      initialEntry: '/dashboard/connections?tab=requests',
      initialState: requestState,
    });

    expect(
      screen.queryByRole('button', { name: 'Keep pending' })
    ).not.toBeInTheDocument();
    expect(
      screen.getAllByRole('button', { name: 'Accept' }).length
    ).toBeGreaterThan(0);
  });

  test('hides restricted fields in pending request rows', () => {
    const originalGetProfilesForMode = dataModule.getProfilesForMode;
    const hiddenName = 'Private Surface Name';
    const hiddenSummary = 'Private Surface Summary';
    const privacyLimitedProfile = {
      ...requestProfile,
      id: 'pending-privacy-limited-profile',
      name: hiddenName,
      profileVisibility: 'connections_only' as const,
      main: {
        ...requestProfile.main,
        location: '',
        seeking: [],
      },
      prompts: {
        ...requestProfile.prompts,
        selfSummary: hiddenSummary,
      },
      fieldVisibility: {
        ...requestProfile.fieldVisibility,
        selfSummary: 'connections_only' as const,
      },
    } as ProfileType;
    const getProfilesForModeSpy = jest
      .spyOn(dataModule, 'getProfilesForMode')
      .mockImplementation((modeId) => [
        ...originalGetProfilesForMode(modeId),
        privacyLimitedProfile,
      ]);

    try {
      renderDashboardConnections({
        initialEntry: '/dashboard/connections?tab=requests',
        initialState: buildDatingConnectionsState({
          blockedProfileIds: [],
          connectionIds: [],
          incomingInterestIds: [],
          incomingConnectionRequestIds: [privacyLimitedProfile.id],
          outgoingConnectionRequestIds: [],
          declinedProfileIds: [],
        }),
      });

      expect(screen.queryByText(hiddenName)).not.toBeInTheDocument();
      expect(screen.queryByText(hiddenSummary)).not.toBeInTheDocument();
      expect(
        screen.getAllByText(
          translations.dashboard.viewModels.defaults.unnamedProfile.en
        ).length
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

  test('expands the in-workspace direct request flow', () => {
    renderDashboardConnections({
      initialEntry: '/dashboard/connections?tab=interested&directRequest=1',
    });

    const directRequestSearch = screen.getByPlaceholderText(
      'Search by name, email, location, or affiliation'
    );
    expect(directRequestSearch).toBeInTheDocument();
    fireEvent.change(directRequestSearch, {
      target: { value: firstInterestedProfile.name.slice(0, 3) },
    });

    expect(
      screen.getByRole('button', { name: 'Accept connection' })
    ).toBeInTheDocument();
  });

  test('navigates connected preview actions to messages and tracks telemetry', () => {
    renderDashboardConnections({
      initialEntry: '/dashboard/connections?tab=connections',
    });

    const previewHeading = screen.getByRole('heading', { name: 'Preview' });
    const previewCard = previewHeading.closest('.MuiCard-root');

    if (!(previewCard instanceof HTMLElement)) {
      throw new Error('Expected connections preview card to render.');
    }

    fireEvent.click(
      within(previewCard).getByRole('button', { name: 'Message' })
    );

    expect(screen.getByTestId('location-probe')).toHaveTextContent(
      buildMessagesPath({ contactId: firstSortedConnectionProfile.id })
    );
    expect(mockedEmitWhoTelemetryEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'dashboard_action_clicked',
        modeId: 'dating',
        destination: 'messages',
      })
    );
  });

  test('declines interested profiles from the preview and tracks telemetry', async () => {
    renderDashboardConnections();

    const previewHeading = screen.getByRole('heading', { name: 'Preview' });
    const previewCard = previewHeading.closest('.MuiCard-root');

    if (!(previewCard instanceof HTMLElement)) {
      throw new Error('Expected interested preview card to render.');
    }

    fireEvent.click(
      within(previewCard).getByRole('button', { name: 'Decline' })
    );

    await waitFor(() => {
      expect(
        screen.queryByText(firstInterestedProfile.name)
      ).not.toBeInTheDocument();
    });
    expect(mockedEmitWhoTelemetryEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'dashboard_action_clicked',
        modeId: 'dating',
        destination: 'decline_interest',
      })
    );
  });

  test('clears the preview query when switching tabs', () => {
    renderDashboardConnections({
      initialEntry: `/dashboard/connections?tab=connections&preview=${requestedConnectionProfile.id}`,
    });

    fireEvent.click(screen.getByRole('tab', { name: /Requests/i }));

    expect(
      screen.getByText('/dashboard/connections?tab=requests')
    ).toBeInTheDocument();
  });

  test('keeps the preview aligned with the filtered list after search narrows results', async () => {
    renderDashboardConnections({
      initialEntry: `/dashboard/connections?tab=connections&preview=${requestedConnectionProfile.id}`,
    });

    const previewHeading = screen.getByRole('heading', { name: 'Preview' });
    const previewCard = previewHeading.closest('.MuiCard-root');

    if (!(previewCard instanceof HTMLElement)) {
      throw new Error('Expected connections preview card to render.');
    }

    expect(
      within(previewCard).getByText(requestedConnectionProfile.name)
    ).toBeInTheDocument();

    fireEvent.change(
      screen.getByLabelText(
        translations.dashboard.connectionsWorkspace.searchLabel.en
      ),
      {
        target: { value: firstConnectionProfile.name },
      }
    );

    await waitFor(() => {
      expect(
        within(previewCard).getByText(firstConnectionProfile.name)
      ).toBeInTheDocument();
    });
    expect(
      within(previewCard).queryByText(requestedConnectionProfile.name)
    ).not.toBeInTheDocument();
    expect(queryListRowTitle(firstConnectionProfile.name)).toBeDefined();
    expect(queryListRowTitle(requestedConnectionProfile.name)).toBeUndefined();
  });

  test('shows the empty-state call to action when the search removes all visible items', () => {
    renderDashboardConnections({
      initialEntry: '/dashboard/connections?tab=connections',
    });

    fireEvent.change(
      screen.getByLabelText(
        translations.dashboard.connectionsWorkspace.searchLabel.en
      ),
      {
        target: { value: 'no matching connection' },
      }
    );

    expect(
      screen.getByText(
        translations.dashboard.connectionsWorkspace.emptyTitle.en
      )
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole('button', {
        name: translations.dashboard.connectionsWorkspace.emptyCta.en,
      })
    );

    expect(screen.getByText(buildDiscoveryPath())).toBeInTheDocument();
  });

  test('shows minimum-search guidance and no-results feedback in direct request mode', () => {
    renderDashboardConnections({
      initialEntry: '/dashboard/connections?tab=interested&directRequest=1',
    });

    expect(
      screen.getByText(translations.dashboard.directRequest.minimumSearch.en)
    ).toBeInTheDocument();

    fireEvent.change(
      screen.getByPlaceholderText(
        translations.dashboard.directRequest.searchPlaceholder.en
      ),
      {
        target: { value: 'zzzzzzzz' },
      }
    );

    expect(
      screen.getByText(translations.dashboard.directRequest.noResults.en)
    ).toBeInTheDocument();
  });

  test.each([
    {
      name: 'self',
      profileName: selfRequestProfile.name,
      buildState: () => buildDatingConnectionsState(),
      buildUser: () => {
        const user = new User();
        if (!user.dating) {
          throw new Error('Expected seeded dating profile on user.');
        }
        user.dating = {
          ...user.dating,
          id: selfRequestProfile.id,
        };
        return user;
      },
      buttonLabel: translations.dashboard.directRequest.sendButton.en,
      helperText: translations.dashboard.directRequest.self.en,
      disabled: true,
    },
    {
      name: 'already connected',
      profileName: firstConnectionProfile.name,
      buildState: () => buildDatingConnectionsState(),
      buildUser: () => new User(),
      buttonLabel: translations.dashboard.directRequest.connectedButton.en,
      helperText: translations.dashboard.directRequest.alreadyConnected.en,
      disabled: true,
    },
    {
      name: 'already requested',
      profileName: outgoingRequestProfile.name,
      buildState: () =>
        buildDatingConnectionsState({
          outgoingConnectionRequestIds: [outgoingRequestProfile.id],
          connectionIds: [],
          incomingInterestIds: [],
          incomingConnectionRequestIds: [],
          declinedProfileIds: [],
        }),
      buildUser: () => new User(),
      buttonLabel: translations.dashboard.directRequest.sentButton.en,
      helperText: translations.dashboard.directRequest.alreadyRequested.en,
      disabled: true,
    },
    {
      name: 'declined conflict',
      profileName: declinedConnectionProfile.name,
      buildState: () =>
        buildDatingConnectionsState({
          outgoingConnectionRequestIds: [],
          connectionIds: [],
          incomingInterestIds: [],
          incomingConnectionRequestIds: [],
          declinedProfileIds: [declinedConnectionProfile.id],
        }),
      buildUser: () => new User(),
      buttonLabel: translations.dashboard.directRequest.sendButton.en,
      helperText: translations.dashboard.directRequest.conflict.en,
      disabled: true,
    },
    {
      name: 'ready',
      profileName: requestProfile.name,
      buildState: () =>
        buildDatingConnectionsState({
          outgoingConnectionRequestIds: [],
          connectionIds: [],
          incomingInterestIds: [],
          incomingConnectionRequestIds: [],
          declinedProfileIds: [],
        }),
      buildUser: () => new User(),
      buttonLabel: translations.dashboard.directRequest.sendButton.en,
      helperText: translations.dashboard.directRequest.readyHint.en,
      disabled: false,
    },
  ])(
    'renders direct request status feedback for $name profiles',
    ({
      buildState,
      buildUser,
      profileName,
      buttonLabel,
      helperText,
      disabled,
    }) => {
      renderDashboardConnections({
        initialEntry: '/dashboard/connections?tab=interested&directRequest=1',
        initialState: buildState(),
        user: buildUser(),
      });

      fireEvent.change(
        screen.getByPlaceholderText(
          translations.dashboard.directRequest.searchPlaceholder.en
        ),
        {
          target: { value: profileName },
        }
      );

      expect(screen.getByText(helperText)).toBeInTheDocument();
      const actionButton = screen.getByRole('button', { name: buttonLabel });

      if (disabled) {
        expect(actionButton).toBeDisabled();
      } else {
        expect(actionButton).toBeEnabled();
      }
    }
  );

  test('sends ready direct requests and tracks direct-request telemetry', () => {
    renderDashboardConnections({
      initialEntry: '/dashboard/connections?tab=interested&directRequest=1',
      initialState: buildDatingConnectionsState({
        outgoingConnectionRequestIds: [],
        connectionIds: [],
        incomingInterestIds: [],
        incomingConnectionRequestIds: [],
        declinedProfileIds: [],
      }),
    });

    fireEvent.change(
      screen.getByPlaceholderText(
        translations.dashboard.directRequest.searchPlaceholder.en
      ),
      {
        target: { value: requestProfile.name },
      }
    );

    fireEvent.click(
      screen.getByRole('button', {
        name: translations.dashboard.directRequest.sendButton.en,
      })
    );

    expect(mockedEmitWhoTelemetryEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'dashboard_action_clicked',
        modeId: 'dating',
        destination: 'direct_request',
      })
    );
  });

  test('hides blocked profiles from direct request search results', () => {
    renderDashboardConnections({
      initialEntry: '/dashboard/connections?tab=interested&directRequest=1',
      initialState: buildDatingConnectionsState({
        blockedProfileIds: [requestProfile.id],
        outgoingConnectionRequestIds: [],
        connectionIds: [],
        incomingInterestIds: [],
        incomingConnectionRequestIds: [],
        declinedProfileIds: [],
      }),
    });

    fireEvent.change(
      screen.getByPlaceholderText(
        translations.dashboard.directRequest.searchPlaceholder.en
      ),
      {
        target: { value: requestProfile.name },
      }
    );

    expect(
      screen.getByText(translations.dashboard.directRequest.noResults.en)
    ).toBeInTheDocument();
  });

  test('excludes hidden email fields from the direct-request search index', () => {
    const originalGetProfilesForMode = dataModule.getProfilesForMode;
    const hiddenEmail = 'hidden-private@example.com';
    const visibleEmail = 'visible-public@example.com';
    const hiddenEmailProfile = {
      ...requestProfile,
      id: 'hidden-email-profile',
      name: 'Hidden Email Profile',
      about: {
        ...requestProfile.about,
        email: hiddenEmail,
      },
      fieldVisibility: {
        ...requestProfile.fieldVisibility,
        email: 'connections_only' as const,
      },
    } as ProfileType;
    const visibleEmailProfile = {
      ...requestProfile,
      id: 'visible-email-profile',
      name: 'Visible Email Profile',
      about: {
        ...requestProfile.about,
        email: visibleEmail,
      },
      fieldVisibility: {
        ...requestProfile.fieldVisibility,
        email: 'open' as const,
      },
    } as ProfileType;
    const getProfilesForModeSpy = jest
      .spyOn(dataModule, 'getProfilesForMode')
      .mockImplementation((modeId) => [
        ...originalGetProfilesForMode(modeId),
        hiddenEmailProfile,
        visibleEmailProfile,
      ]);

    try {
      renderDashboardConnections({
        initialEntry: buildDirectRequestPath(),
        initialState: buildDatingConnectionsState({
          blockedProfileIds: [],
          connectionIds: [],
          incomingInterestIds: [],
          incomingConnectionRequestIds: [],
          outgoingConnectionRequestIds: [],
          declinedProfileIds: [],
        }),
      });

      const directRequestSearch = screen.getByPlaceholderText(
        translations.dashboard.directRequest.searchPlaceholder.en
      );

      fireEvent.change(directRequestSearch, {
        target: { value: hiddenEmail },
      });

      expect(
        screen.queryByText(hiddenEmailProfile.name)
      ).not.toBeInTheDocument();
      expect(
        screen.getByText(translations.dashboard.directRequest.noResults.en)
      ).toBeInTheDocument();

      fireEvent.change(directRequestSearch, {
        target: { value: visibleEmail },
      });

      expect(
        screen.getAllByText(visibleEmailProfile.name).length
      ).toBeGreaterThan(0);
    } finally {
      getProfilesForModeSpy.mockRestore();
    }
  });

  test('matches translated location and affiliation fields in direct request search', () => {
    const originalGetProfilesForMode = dataModule.getProfilesForMode;
    const translatedFieldProfile = {
      ...requestProfile,
      id: 'translated-field-profile',
      name: 'Translated Field Profile',
      main: {
        ...requestProfile.main,
        location: {
          en: 'Harbor District',
          es: 'Distrito del puerto',
          de: 'Hafenviertel',
        },
        primaryAffiliation: {
          en: 'Portland Studio Collective',
          es: 'Colectivo del estudio de Portland',
          de: 'Portland Studio Kollektiv',
        },
      },
      fieldVisibility: {
        ...requestProfile.fieldVisibility,
        location: 'open' as const,
        primaryAffiliation: 'open' as const,
      },
    } as ProfileType;
    const getProfilesForModeSpy = jest
      .spyOn(dataModule, 'getProfilesForMode')
      .mockImplementation((modeId) => [
        ...originalGetProfilesForMode(modeId),
        translatedFieldProfile,
      ]);

    try {
      renderDashboardConnections({
        initialEntry: buildDirectRequestPath(),
        initialState: buildDatingConnectionsState({
          blockedProfileIds: [],
          connectionIds: [],
          incomingInterestIds: [],
          incomingConnectionRequestIds: [],
          outgoingConnectionRequestIds: [],
          declinedProfileIds: [],
        }),
      });

      const directRequestSearch = screen.getByPlaceholderText(
        translations.dashboard.directRequest.searchPlaceholder.en
      );

      fireEvent.change(directRequestSearch, {
        target: { value: 'Harbor District' },
      });

      expect(
        screen.getAllByText(translatedFieldProfile.name).length
      ).toBeGreaterThan(0);

      fireEvent.change(directRequestSearch, {
        target: { value: 'Portland Studio Collective' },
      });

      expect(
        screen.getAllByText(translatedFieldProfile.name).length
      ).toBeGreaterThan(0);
    } finally {
      getProfilesForModeSpy.mockRestore();
    }
  });

  test('does not expose hidden name or location in direct request results', () => {
    const originalGetProfilesForMode = dataModule.getProfilesForMode;
    const visibleEmail = 'privacy-visible@example.com';
    const hiddenName = 'Private Surface Name';
    const hiddenLocation = 'Private Harbor';
    const privacyLimitedProfile = {
      ...requestProfile,
      id: 'privacy-limited-profile',
      name: hiddenName,
      profileVisibility: 'connections_only' as const,
      main: {
        ...requestProfile.main,
        location: {
          en: hiddenLocation,
          es: 'Puerto privado',
          de: 'Privathafen',
        },
      },
      about: {
        ...requestProfile.about,
        email: visibleEmail,
      },
      fieldVisibility: {
        ...requestProfile.fieldVisibility,
        email: 'open' as const,
        location: 'connections_only' as const,
      },
    } as ProfileType;
    const getProfilesForModeSpy = jest
      .spyOn(dataModule, 'getProfilesForMode')
      .mockImplementation((modeId) => [
        ...originalGetProfilesForMode(modeId),
        privacyLimitedProfile,
      ]);

    try {
      renderDashboardConnections({
        initialEntry: buildDirectRequestPath(),
        initialState: buildDatingConnectionsState({
          blockedProfileIds: [],
          connectionIds: [],
          incomingInterestIds: [],
          incomingConnectionRequestIds: [],
          outgoingConnectionRequestIds: [],
          declinedProfileIds: [],
        }),
      });

      fireEvent.change(
        screen.getByPlaceholderText(
          translations.dashboard.directRequest.searchPlaceholder.en
        ),
        {
          target: { value: visibleEmail },
        }
      );

      expect(screen.queryByText(hiddenName)).not.toBeInTheDocument();
      expect(screen.queryByText(hiddenLocation)).not.toBeInTheDocument();
      expect(
        screen.getByText(
          translations.dashboard.viewModels.defaults.unnamedProfile.en
        )
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', {
          name: translations.dashboard.directRequest.sendButton.en,
        })
      ).toBeInTheDocument();
    } finally {
      getProfilesForModeSpy.mockRestore();
    }
  });

  test('skips malformed direct request candidates while keeping valid matches searchable', () => {
    const originalGetProfilesForMode = dataModule.getProfilesForMode;
    const getProfilesForModeSpy = jest
      .spyOn(dataModule, 'getProfilesForMode')
      .mockImplementation((modeId) => [
        ...originalGetProfilesForMode(modeId),
        {
          ...requestProfile,
          id: '',
          name: '',
        },
      ]);

    try {
      renderDashboardConnections({
        initialEntry: '/dashboard/connections?tab=interested&directRequest=1',
        initialState: buildDatingConnectionsState({
          blockedProfileIds: [],
          connectionIds: [],
          incomingInterestIds: [],
          incomingConnectionRequestIds: [],
          outgoingConnectionRequestIds: [],
          declinedProfileIds: [],
        }),
      });

      fireEvent.change(
        screen.getByPlaceholderText(
          translations.dashboard.directRequest.searchPlaceholder.en
        ),
        {
          target: { value: requestProfile.name },
        }
      );

      expect(screen.getAllByText(requestProfile.name).length).toBeGreaterThan(
        0
      );
      expect(
        screen.queryByText(translations.dashboard.directRequest.noResults.en)
      ).not.toBeInTheDocument();
    } finally {
      getProfilesForModeSpy.mockRestore();
    }
  });

  test('updates request workspace controls and toggles direct request query state', () => {
    renderDashboardConnections({
      initialEntry: '/dashboard/connections?tab=requests',
      initialState: buildDatingConnectionsState({
        connectionIds: [],
        incomingInterestIds: [],
        incomingConnectionRequestIds: [requestProfile.id],
        outgoingConnectionRequestIds: [outgoingRequestProfile.id],
        declinedProfileIds: [],
      }),
    });

    fireEvent.click(
      screen.getByRole('button', {
        name: translations.dashboard.connectionsWorkspace.sortStatus.en,
      })
    );
    fireEvent.click(
      screen.getByRole('button', {
        name: translations.dashboard.connectionsWorkspace.sortName.en,
      })
    );
    fireEvent.click(
      screen.getByRole('button', {
        name: translations.dashboard.connectionsWorkspace.filterActionable.en,
      })
    );

    expect(screen.getAllByText(requestProfile.name).length).toBeGreaterThan(0);
    expect(
      screen.queryByText(outgoingRequestProfile.name)
    ).not.toBeInTheDocument();

    fireEvent.click(
      screen.getByRole('button', {
        name: translations.dashboard.connectionsWorkspace.filterAll.en,
      })
    );

    expect(
      screen.getAllByText(outgoingRequestProfile.name).length
    ).toBeGreaterThan(0);

    fireEvent.click(
      screen.getByRole('button', {
        name: translations.dashboard.actions.directRequest.en,
      })
    );

    expect(
      screen.getByText('/dashboard/connections?tab=requests&directRequest=1')
    ).toBeInTheDocument();
    expect(
      screen.getByText(translations.dashboard.directRequest.minimumSearch.en)
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole('button', {
        name: translations.dashboard.actions.directRequest.en,
      })
    );

    expect(
      screen.getByText('/dashboard/connections?tab=requests')
    ).toBeInTheDocument();
  });

  test('accepts interested profiles from list rows and tracks telemetry', async () => {
    renderDashboardConnections({
      initialEntry: '/dashboard/connections?tab=interested',
      initialState: buildDatingConnectionsState({
        connectionIds: [],
        incomingInterestIds: [firstInterestedProfile.id, requestProfile.id],
        incomingConnectionRequestIds: [],
        outgoingConnectionRequestIds: [],
        declinedProfileIds: [],
      }),
    });

    fireEvent.click(
      within(getListRowForProfile(requestProfile.name)).getByRole('button', {
        name: translations.dashboard.viewModels.connections.connect.en,
      })
    );

    await waitFor(() => {
      expect(queryListRowTitle(requestProfile.name)).toBeUndefined();
    });
    expect(mockedEmitWhoTelemetryEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'dashboard_action_clicked',
        modeId: 'dating',
        destination: 'connections_interested',
      })
    );
  });

  test('declines interested profiles from list rows and tracks telemetry', async () => {
    renderDashboardConnections({
      initialEntry: '/dashboard/connections?tab=interested',
      initialState: buildDatingConnectionsState({
        connectionIds: [],
        incomingInterestIds: [firstInterestedProfile.id, requestProfile.id],
        incomingConnectionRequestIds: [],
        outgoingConnectionRequestIds: [],
        declinedProfileIds: [],
      }),
    });

    fireEvent.click(
      within(getListRowForProfile(requestProfile.name)).getByRole('button', {
        name: translations.dashboard.viewModels.connections.decline.en,
      })
    );

    await waitFor(() => {
      expect(queryListRowTitle(requestProfile.name)).toBeUndefined();
    });
    expect(mockedEmitWhoTelemetryEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'dashboard_action_clicked',
        modeId: 'dating',
        destination: 'decline_interest',
      })
    );
  });
});
