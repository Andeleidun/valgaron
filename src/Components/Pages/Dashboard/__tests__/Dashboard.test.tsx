import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Dashboard from '../Dashboard';
import fetchTranslations from '../../../../Utlilities/translations';
import { formatDashboardTemplate } from '../dashboardStrings';
import {
  buildDefaultRelationshipState,
  RelationshipProvider,
  User,
  UserContext,
} from '../../../../Utlilities';
import { blankDatingProfile } from '../../../../Utlilities/models';
import type {
  DatingProfileDataType,
  ModeType,
  RelationshipStateType,
} from '../../../../types';

const mode: ModeType = { id: 'dating' };
const translations = fetchTranslations();
const openCommunityLabel = formatDashboardTemplate(
  translations.dashboard.viewModels.quickActions.openCommunity.en,
  {
    section: translations.pages.dating.community.en,
  }
);

/**
 * Build a dating profile that satisfies dashboard completion and connection-style
 * requirements unless a test intentionally overrides part of it.
 */
type CompleteDatingProfileOverrides = Partial<DatingProfileDataType> & {
  main?: Partial<DatingProfileDataType['main']>;
  hobbies?: Partial<DatingProfileDataType['hobbies']>;
  prompts?: Partial<DatingProfileDataType['prompts']>;
};

const buildCompleteDatingProfile = (
  overrides: CompleteDatingProfileOverrides = {}
): DatingProfileDataType => {
  const main = {
    ...blankDatingProfile.main,
    age: 31,
    location: 'Seattle',
    pronouns: 'they/them',
    seeking: ['Long-term connection'],
    ...overrides.main,
  };
  const hobbies = {
    ...blankDatingProfile.hobbies,
    full: ['Board games'],
    ...overrides.hobbies,
  };
  const prompts = {
    ...blankDatingProfile.prompts,
    selfSummary: 'Curious and kind.',
    ...overrides.prompts,
  };
  const connectionStyle: DatingProfileDataType['connectionStyle'] = {
    availabilityPattern: 'weekends',
    communicationPace: 'balanced',
    introductionPreference: 'group_first',
    planningStyle: 'one_to_two_days',
    languageComfort: {
      preferredLanguages: ['en'],
    },
    ...overrides.connectionStyle,
  };

  return {
    ...blankDatingProfile,
    pictures: ['https://example.com/p.jpg'],
    name: 'Jordan',
    ...overrides,
    main,
    hobbies,
    prompts,
    connectionStyle,
  };
};

/**
 * Render dashboard with a controlled user context.
 */
const renderDashboard = ({
  profile,
  freshnessPrompts,
  relationshipState = buildDefaultRelationshipState(),
}: {
  profile?: DatingProfileDataType;
  freshnessPrompts?: 'off' | 'low' | 'medium' | 'high';
  relationshipState?: RelationshipStateType;
} = {}) => {
  const user = new User();
  user.userSettings.mode = mode;
  user.userSettings.freshnessPrompts = freshnessPrompts;
  user.dating = profile
    ? (profile as typeof user.dating)
    : {
        ...blankDatingProfile,
      };

  render(
    <MemoryRouter
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
          <Dashboard
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
};

describe('Dashboard', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  test('renders the overview shell with progress-first guidance for incomplete profiles', () => {
    renderDashboard();

    expect(screen.getByText('Your hub')).toBeInTheDocument();
    expect(screen.getByText('Overview')).toBeInTheDocument();
    expect(screen.getByText(/Connections \(3\)/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Complete your Dating profile/i)
    ).toBeInTheDocument();
    expect(screen.getByText('Quick actions')).toBeInTheDocument();
    expect(
      screen.getByRole('button', {
        name: translations.dashboard.actions.directRequest.en,
      })
    ).toBeInTheDocument();
  });

  test('switches to activity-first guidance for complete profiles', () => {
    renderDashboard({
      profile: buildCompleteDatingProfile(),
    });

    expect(
      screen.getByText(/Your Dating space is active/i)
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Open notifications' })
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/Complete your Dating profile/i)
    ).not.toBeInTheDocument();
  });

  test('prioritizes profile refresh guidance for complete but stale profiles', () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-04-18T12:00:00.000Z'));

    renderDashboard({
      profile: buildCompleteDatingProfile({
        updatedAt: '2026-03-10T12:00:00.000Z',
      }),
      freshnessPrompts: 'medium',
    });

    expect(
      screen.getAllByText('Profile refresh recommended').length
    ).toBeGreaterThan(0);
    expect(
      screen.getAllByRole('button', { name: 'Refresh profile' }).length
    ).toBeGreaterThan(0);

    jest.useRealTimers();
  });

  test('recommends community-first next action when momentum signals are still empty', () => {
    const quietRelationshipState = buildDefaultRelationshipState();
    quietRelationshipState.byMode.dating.directChats = [];
    quietRelationshipState.byMode.dating = {
      ...quietRelationshipState.byMode.dating,
      connectionIds: [],
      incomingInterestIds: [],
      incomingConnectionRequestIds: [],
      outgoingConnectionRequestIds: [],
    };

    renderDashboard({
      relationshipState: quietRelationshipState,
      profile: buildCompleteDatingProfile(),
    });

    expect(
      screen.getByText(
        translations.dashboardGuidance.dating.communityPromptMessages
          .join_relevant_community.en
      )
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole('button', { name: openCommunityLabel }).length
    ).toBeGreaterThan(0);
  });
});
