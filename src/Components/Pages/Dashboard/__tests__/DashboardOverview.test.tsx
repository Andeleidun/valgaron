import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type {
  DashboardCommunityViewModelType,
  DashboardConnectionsViewModelType,
  DashboardFeedItemType,
  DashboardNotificationsViewModelType,
  DashboardOverviewViewModelType,
  ProfileFreshnessStateType,
} from '../../../../types';
import {
  buildDefaultRelationshipState,
  emitWhoTelemetryEvent,
  fetchTranslations,
  RelationshipProvider,
  User,
  UserContext,
} from '../../../../Utlilities';
import DashboardOverview from '../DashboardOverview';
import { selectOverviewSummary } from '../dashboardSelectors';
import {
  buildCommunityPath,
  buildConnectionsPath,
  buildNotificationsPath,
} from '../dashboardRoutes';
import {
  buildProfileFreshnessDescription,
  buildProfileFreshnessTimestampLabel,
} from '../dashboardFreshness';
import {
  buildDashboardCommunityViewModel,
  buildDashboardConnectionsViewModel,
  buildDashboardNotificationsViewModel,
  buildDashboardOverviewViewModel,
  buildOverviewSubtitle,
} from '../dashboardViewModels';
import { formatDashboardTemplate } from '../dashboardStrings';

jest.mock('../../../../Utlilities', () => {
  const actual = jest.requireActual('../../../../Utlilities');
  return {
    ...actual,
    emitWhoTelemetryEvent: jest.fn(),
  };
});

jest.mock('../dashboardSelectors', () => {
  const actual = jest.requireActual('../dashboardSelectors');
  return {
    ...actual,
    selectOverviewSummary: jest.fn(),
  };
});

jest.mock('../dashboardFreshness', () => {
  const actual = jest.requireActual('../dashboardFreshness');
  return {
    ...actual,
    buildProfileFreshnessDescription: jest.fn(),
    buildProfileFreshnessTimestampLabel: jest.fn(),
  };
});

jest.mock('../dashboardViewModels', () => {
  const actual = jest.requireActual('../dashboardViewModels');
  return {
    ...actual,
    buildDashboardOverviewViewModel: jest.fn(),
    buildDashboardConnectionsViewModel: jest.fn(),
    buildDashboardCommunityViewModel: jest.fn(),
    buildDashboardNotificationsViewModel: jest.fn(),
    buildOverviewSubtitle: jest.fn(),
  };
});

const mode = { id: 'dating' } as const;
const translations = fetchTranslations();
const openCommunityLabel = formatDashboardTemplate(
  translations.dashboard.overview.openCommunity.en,
  {
    section: translations.pages.dating.community.en,
  }
);

const mockedEmitWhoTelemetryEvent =
  emitWhoTelemetryEvent as jest.MockedFunction<typeof emitWhoTelemetryEvent>;
const mockedSelectOverviewSummary =
  selectOverviewSummary as jest.MockedFunction<typeof selectOverviewSummary>;
const mockedBuildProfileFreshnessDescription =
  buildProfileFreshnessDescription as jest.MockedFunction<
    typeof buildProfileFreshnessDescription
  >;
const mockedBuildProfileFreshnessTimestampLabel =
  buildProfileFreshnessTimestampLabel as jest.MockedFunction<
    typeof buildProfileFreshnessTimestampLabel
  >;
const mockedBuildDashboardOverviewViewModel =
  buildDashboardOverviewViewModel as jest.MockedFunction<
    typeof buildDashboardOverviewViewModel
  >;
const mockedBuildDashboardConnectionsViewModel =
  buildDashboardConnectionsViewModel as jest.MockedFunction<
    typeof buildDashboardConnectionsViewModel
  >;
const mockedBuildDashboardCommunityViewModel =
  buildDashboardCommunityViewModel as jest.MockedFunction<
    typeof buildDashboardCommunityViewModel
  >;
const mockedBuildDashboardNotificationsViewModel =
  buildDashboardNotificationsViewModel as jest.MockedFunction<
    typeof buildDashboardNotificationsViewModel
  >;
const mockedBuildOverviewSubtitle =
  buildOverviewSubtitle as jest.MockedFunction<typeof buildOverviewSubtitle>;

type DashboardOverviewViewModelOverrides = {
  hero?: Partial<DashboardOverviewViewModelType['hero']>;
  summary?: Partial<DashboardOverviewViewModelType['summary']>;
  nextAction?: DashboardOverviewViewModelType['nextAction'];
  quickActions?: DashboardOverviewViewModelType['quickActions'];
};

/**
 * Build a baseline overview page model with deterministic labels.
 */
const createOverviewViewModel = (
  overrides: DashboardOverviewViewModelOverrides = {}
): DashboardOverviewViewModelType => {
  const base: DashboardOverviewViewModelType = {
    hero: {
      mode: 'progress',
      title: 'Complete your Dating profile',
      subtitle: 'A little more detail helps the right people find you.',
      primaryMetricLabel: 'Profile strength',
      primaryMetricValue: '67%',
      secondaryLabel: 'Top opportunity',
      secondaryValue: 'Add a little more context',
      ctaLabel: 'Open hero action',
      ctaPath: '/dashboard/profile',
    },
    summary: {
      profileStrength: 67,
      pendingInterestCount: 2,
      connectionCount: 4,
      joinedGroupCount: 3,
      unreadNotificationCount: 5,
    },
    nextAction: {
      title: 'Next best step',
      description: 'Tighten the part of your profile that still blocks trust.',
      ctaLabel: 'Open next action',
      ctaPath: '/dashboard/profile',
    },
    quickActions: [
      {
        id: 'profile',
        label: 'Quick profile action',
        path: '/dashboard/profile',
      },
      {
        id: 'connections',
        label: 'Quick connections action',
        path: buildConnectionsPath('interested'),
      },
      {
        id: 'settings',
        label: 'Quick settings action',
        path: '/dashboard/settings',
      },
    ],
  };

  return {
    ...base,
    ...overrides,
    hero: {
      ...base.hero,
      ...overrides.hero,
    },
    summary: {
      ...base.summary,
      ...overrides.summary,
    },
    nextAction:
      overrides.nextAction !== undefined
        ? overrides.nextAction
        : base.nextAction,
    quickActions: overrides.quickActions ?? base.quickActions,
  };
};

/**
 * Build a baseline overview selector payload with overridable freshness.
 */
const createOverviewSummary = ({
  completion = { percentage: 100, missingTaskIds: [] },
  freshness = { status: 'current', isActionable: false },
  topMissingTaskId,
  shellSummary,
}: Partial<ReturnType<typeof selectOverviewSummary>> = {}): ReturnType<
  typeof selectOverviewSummary
> => ({
  completion,
  freshness: freshness as ProfileFreshnessStateType,
  topMissingTaskId,
  shellSummary: shellSummary ?? createOverviewViewModel().summary,
});

/**
 * Render DashboardOverview with stable providers and mocked view models.
 */
const renderOverview = (user = new User()) =>
  render(
    <MemoryRouter
      initialEntries={['/dashboard']}
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <RelationshipProvider initialState={buildDefaultRelationshipState()}>
        <UserContext.Provider
          value={{
            user,
            setUserProfile: jest.fn(),
            setUserGroupMemberships: jest.fn(),
            setUserSettings: jest.fn(),
          }}
        >
          <DashboardOverview
            mode={mode}
            language="en"
            strings={{
              dashboard: translations.dashboard,
              dashboardGuidance: translations.dashboardGuidance,
              common: translations.common,
            }}
          />
        </UserContext.Provider>
      </RelationshipProvider>
    </MemoryRouter>
  );

describe('DashboardOverview', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedBuildOverviewSubtitle.mockReturnValue('Overview subtitle');
    mockedBuildProfileFreshnessDescription.mockReturnValue(
      'Refresh your profile soon.'
    );
    mockedBuildProfileFreshnessTimestampLabel.mockReturnValue('');
    mockedBuildDashboardOverviewViewModel.mockReturnValue(
      createOverviewViewModel()
    );
    mockedSelectOverviewSummary.mockReturnValue(createOverviewSummary());
    mockedBuildDashboardConnectionsViewModel.mockReturnValue({
      activeTab: 'connections',
      counts: {
        connections: 0,
        interested: 0,
        requests: 0,
      },
      items: [],
    } satisfies DashboardConnectionsViewModelType);
    mockedBuildDashboardCommunityViewModel.mockReturnValue({
      activeTab: 'joined',
      items: [],
    } satisfies DashboardCommunityViewModelType);
    mockedBuildDashboardNotificationsViewModel.mockReturnValue({
      activeFilter: 'all',
      items: [],
    } satisfies DashboardNotificationsViewModelType);
  });

  test('renders overview empty states when previews and optional actions are absent', () => {
    mockedBuildDashboardOverviewViewModel.mockReturnValue(
      createOverviewViewModel({
        hero: {
          mode: 'activity',
          secondaryLabel: undefined,
          secondaryValue: undefined,
          ctaLabel: undefined,
          ctaPath: undefined,
        },
        nextAction: null,
        quickActions: [
          {
            id: 'profile',
            label: 'Quick profile action',
            path: '/dashboard/profile',
          },
        ],
      })
    );
    mockedSelectOverviewSummary.mockReturnValue(
      createOverviewSummary({
        completion: {
          percentage: 67,
          missingTaskIds: ['addPhoto', 'addSummary'],
        },
        topMissingTaskId: 'addPhoto',
      })
    );

    renderOverview();

    expect(
      screen.queryByRole('button', { name: 'Open hero action' })
    ).toBeNull();
    expect(screen.queryByText('Top opportunity')).toBeNull();
    expect(
      screen.getByText(translations.dashboard.tasks.addPhoto.en)
    ).toBeInTheDocument();
    expect(
      screen.getByText(translations.dashboard.tasks.addSummary.en)
    ).toBeInTheDocument();
    expect(
      screen.getByText(translations.dashboard.overview.activityEmpty.en)
    ).toBeInTheDocument();
    expect(
      screen.getByText(translations.dashboard.overview.connectionsEmpty.en)
    ).toBeInTheDocument();
    expect(
      screen.getByText(translations.dashboard.overview.communityEmpty.en)
    ).toBeInTheDocument();
    expect(
      screen.getByText(translations.dashboard.overview.recentActivityEmpty.en)
    ).toBeInTheDocument();
    expect(screen.queryByText('Next best step')).toBeNull();
    expect(
      screen.queryByRole('button', { name: 'Quick settings action' })
    ).toBeNull();
  });

  test('renders preview tiles and emits telemetry for overview-originated actions', () => {
    const notificationPath = buildNotificationsPath({ filter: 'all' });
    const previewNotifications: DashboardFeedItemType[] = [
      {
        id: 'notification-with-path',
        type: 'connections',
        title: 'New connection request',
        description: 'Someone wants to connect.',
        primaryAction: {
          label: 'Review request',
          path: buildConnectionsPath('requests'),
        },
      },
      {
        id: 'notification-without-action',
        type: 'messages',
        title: 'Message reminder',
        description: 'No inline action for this item.',
      },
      {
        id: 'notification-fallback-path',
        type: 'community',
        title: 'Community reminder',
        description: 'Falls back to notifications when opened here.',
        primaryAction: {
          label: 'Fallback activity action',
        },
      },
    ];

    mockedBuildDashboardConnectionsViewModel.mockReturnValue({
      activeTab: 'connections',
      counts: {
        connections: 2,
        interested: 1,
        requests: 1,
      },
      items: [
        {
          id: 'jordan-diaz',
          name: 'Jordan Diaz',
        },
        {
          id: 'taylor-ng',
          name: 'Taylor Ng',
          imageUrl: 'https://example.com/taylor.jpg',
        },
      ],
    } satisfies DashboardConnectionsViewModelType);
    mockedBuildDashboardCommunityViewModel.mockReturnValue({
      activeTab: 'joined',
      items: [
        {
          id: 'chess-club',
          name: 'Chess Club',
        },
        {
          id: 'hiking-crew',
          name: 'Hiking Crew',
          imageUrl: 'https://example.com/hiking.jpg',
        },
      ],
    } satisfies DashboardCommunityViewModelType);
    mockedBuildDashboardNotificationsViewModel.mockReturnValue({
      activeFilter: 'all',
      items: previewNotifications,
    } satisfies DashboardNotificationsViewModelType);

    renderOverview();

    expect(screen.getByText('JD')).toBeInTheDocument();
    expect(screen.getByAltText('Taylor Ng')).toHaveAttribute(
      'src',
      'https://example.com/taylor.jpg'
    );
    expect(screen.getByText('CC')).toBeInTheDocument();
    expect(screen.getByAltText('Hiking Crew')).toHaveAttribute(
      'src',
      'https://example.com/hiking.jpg'
    );

    const fallbackActivityButton = screen.getByRole('button', {
      name: 'Fallback activity action',
    });
    expect(fallbackActivityButton.closest('a')).toHaveAttribute(
      'href',
      expect.stringContaining(notificationPath)
    );

    fireEvent.click(screen.getByRole('button', { name: 'Open hero action' }));
    fireEvent.click(
      screen.getAllByRole('button', { name: 'Review request' })[0]
    );
    fireEvent.click(
      screen.getByRole('button', {
        name: translations.dashboard.overview.openFeed.en,
      })
    );
    fireEvent.click(
      screen.getByRole('button', {
        name: translations.dashboard.overview.openConnections.en,
      })
    );
    fireEvent.click(
      screen.getByRole('button', {
        name: openCommunityLabel,
      })
    );
    fireEvent.click(screen.getByRole('button', { name: 'Open next action' }));
    fireEvent.click(
      screen.getByRole('button', { name: 'Quick profile action' })
    );
    fireEvent.click(
      screen.getByRole('button', { name: 'Quick settings action' })
    );
    fireEvent.click(fallbackActivityButton);

    const destinations = mockedEmitWhoTelemetryEvent.mock.calls
      .map(([event]) => event)
      .filter(
        (
          event
        ): event is Extract<
          Parameters<typeof emitWhoTelemetryEvent>[0],
          { type: 'dashboard_action_clicked' }
        > => event.type === 'dashboard_action_clicked'
      )
      .map((event) => event.destination);

    expect(destinations).toEqual(
      expect.arrayContaining([
        '/dashboard/profile',
        buildConnectionsPath('requests'),
        notificationPath,
        buildConnectionsPath('connections'),
        buildCommunityPath({ tab: 'joined' }),
        '/dashboard/settings',
      ])
    );
  });

  test('shows actionable freshness guidance for complete profiles and tracks refresh CTA clicks', () => {
    mockedSelectOverviewSummary.mockReturnValue(
      createOverviewSummary({
        freshness: {
          status: 'due_soon',
          isActionable: true,
          daysUntilDue: 2,
          lastUpdatedAt: '2026-04-10T12:00:00.000Z',
        },
      })
    );
    mockedBuildProfileFreshnessDescription.mockReturnValue(
      'Your profile is about to feel stale.'
    );
    mockedBuildProfileFreshnessTimestampLabel.mockReturnValue(
      'Last updated 8 days ago'
    );

    renderOverview();

    expect(
      screen.getByText(translations.dashboard.overview.profileComplete.en)
    ).toBeInTheDocument();
    expect(
      screen.getByText(translations.dashboard.viewModels.freshness.title.en)
    ).toBeInTheDocument();
    expect(
      screen.getByText('Your profile is about to feel stale.')
    ).toBeInTheDocument();
    expect(screen.getByText('Last updated 8 days ago')).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole('button', {
        name: translations.dashboard.viewModels.freshness.refreshCta.en,
      })
    );

    expect(mockedEmitWhoTelemetryEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'dashboard_action_clicked',
        modeId: 'dating',
        destination: '/dashboard/profile',
      })
    );
  });
});
