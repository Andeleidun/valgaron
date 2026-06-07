import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { act, useState } from 'react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import DashboardProfile from '../DashboardProfile';
import {
  blankDatingProfile,
  buildDefaultRelationshipState,
  fetchTranslations,
  RelationshipProvider,
  User,
  UserContext,
} from '../../../../Utlilities';
import type { ModeType, ProfileType } from '../../../../types';

const translations = fetchTranslations();

/**
 * Probe component for asserting the activation return route and nested state.
 */
const RedirectStateProbe = () => {
  const location = useLocation();
  const contactId =
    typeof location.state === 'object' &&
    location.state &&
    'contactId' in location.state &&
    typeof location.state.contactId === 'string'
      ? location.state.contactId
      : '';

  return (
    <div>
      <div>{`${location.pathname}${location.search}${location.hash}`}</div>
      <div>{`Contact: ${contactId}`}</div>
    </div>
  );
};

/**
 * Render the dashboard-native profile workspace with stable providers.
 */
const renderDashboardProfile = ({
  user = new User(),
  setUserProfile = jest.fn(),
}: {
  user?: User;
  setUserProfile?: jest.Mock;
} = {}) => {
  const saveProfile = setUserProfile;

  render(
    <MemoryRouter
      initialEntries={['/dashboard/profile']}
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <RelationshipProvider initialState={buildDefaultRelationshipState()}>
        <UserContext.Provider
          value={{
            user,
            setUserProfile: saveProfile,
            setUserGroupMemberships: jest.fn(),
            setUserSettings: jest.fn(),
          }}
        >
          <DashboardProfile
            mode={{ id: 'dating' }}
            language="en"
            strings={{
              dashboard: translations.dashboard,
              profile: translations.profile,
              connectionStyle: translations.connectionStyle,
              common: translations.common,
            }}
          />
        </UserContext.Provider>
      </RelationshipProvider>
    </MemoryRouter>
  );

  return { saveProfile };
};

/**
 * Build an activation-ready dating user for redirect coverage.
 */
const buildActivationReadyUser = (): User => {
  const user = new User();
  user.dating = {
    ...blankDatingProfile,
    id: 'dashboard-dating-ready-user',
    pictures: ['https://images.example.com/profile.jpg'],
    name: 'Taylor',
    main: {
      ...blankDatingProfile.main,
      age: 31,
      location: 'Portland',
      gender: 'Woman',
      pronouns: 'she/her',
      orientation: 'Straight',
      relationshipStatus: 'Single',
      relationshipStyle: 'Monogamous',
      seeking: ['Long-term relationship'],
    },
    hobbies: {
      ...blankDatingProfile.hobbies,
      full: ['Cooking'],
      starred: ['Cooking'],
    },
    prompts: {
      ...blankDatingProfile.prompts,
      selfSummary: 'Looking for a grounded, curious partner.',
    },
  };

  return user;
};

/**
 * Render the dashboard profile route with live local user state updates.
 */
const renderStatefulDashboardProfile = (initialUser: User) => {
  const StatefulDashboardProfile = () => {
    const [user, setUser] = useState(initialUser);

    const handleUserProfileChange = (change: ProfileType, mode: ModeType) => {
      setUser((currentUser) => ({ ...currentUser, [mode.id]: change } as User));
    };

    return (
      <MemoryRouter
        initialEntries={['/dashboard/profile']}
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <RelationshipProvider initialState={buildDefaultRelationshipState()}>
          <UserContext.Provider
            value={{
              user,
              setUserProfile: handleUserProfileChange,
              setUserGroupMemberships: jest.fn(),
              setUserSettings: jest.fn(),
            }}
          >
            <DashboardProfile
              mode={{ id: 'dating' }}
              language="en"
              strings={{
                dashboard: translations.dashboard,
                profile: translations.profile,
                connectionStyle: translations.connectionStyle,
                common: translations.common,
              }}
            />
          </UserContext.Provider>
        </RelationshipProvider>
      </MemoryRouter>
    );
  };

  render(<StatefulDashboardProfile />);
};

describe('DashboardProfile', () => {
  test('keeps incomplete profiles in activation edit mode with next-step guidance', () => {
    renderDashboardProfile();

    const profileHeading = screen.getByRole('heading', { name: 'Profile' });

    expect(profileHeading).toBeInTheDocument();
    expect(screen.getByText('Profile status')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Exit edit mode' })
    ).toBeInTheDocument();
    expect(screen.getByText('Next best action')).toBeInTheDocument();
    expect(
      screen.getByText(
        /Close the biggest profile gap first to unlock stronger connection quality/i
      )
    ).toBeInTheDocument();
    expect(document.getElementById('dating-profile-form')).toBeInTheDocument();
  });

  test('submits a valid dashboard profile edit, updates preview data, and reopens with saved values', async () => {
    const user = new User();
    user.dating = {
      ...blankDatingProfile,
      id: 'dashboard-dating-save-user',
      pictures: ['https://images.example.com/profile.jpg'],
      name: 'Taylor',
      main: {
        ...blankDatingProfile.main,
        age: 31,
        location: 'Portland',
        gender: 'Woman',
        pronouns: 'she/her',
        orientation: 'Straight',
        relationshipStatus: 'Single',
        relationshipStyle: 'Monogamous',
        seeking: ['Long-term relationship'],
      },
      hobbies: {
        ...blankDatingProfile.hobbies,
        full: ['Cooking'],
        starred: ['Cooking'],
      },
      prompts: {
        ...blankDatingProfile.prompts,
        selfSummary: 'Looking for a grounded, curious partner.',
      },
    };
    renderStatefulDashboardProfile(user);

    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));

    const form = document.getElementById('dating-profile-form');
    expect(form).toBeInstanceOf(HTMLFormElement);

    fireEvent.change(within(form as HTMLFormElement).getByLabelText('Name'), {
      target: { value: 'Taylor Updated' },
    });

    await act(async () => {
      fireEvent.submit(form as HTMLFormElement);
    });

    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Edit' })).toBeInTheDocument()
    );
    expect(
      screen.queryByRole('button', { name: 'Exit edit mode' })
    ).not.toBeInTheDocument();
    expect(screen.getByText('Taylor Updated')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));

    expect(
      (
        within(
          document.getElementById('dating-profile-form') as HTMLFormElement
        ).getByLabelText('Name') as HTMLInputElement
      ).value
    ).toBe('Taylor Updated');
  });

  test('shows freshness guidance for complete profiles that have gone stale', () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-04-18T12:00:00.000Z'));

    const user = new User();
    user.userSettings.freshnessPrompts = 'medium';
    user.dating = {
      ...blankDatingProfile,
      id: 'dashboard-dating-freshness-user',
      pictures: ['https://images.example.com/profile.jpg'],
      name: 'Taylor',
      updatedAt: '2026-03-10T12:00:00.000Z',
      main: {
        ...blankDatingProfile.main,
        age: 31,
        location: 'Portland',
        gender: 'Woman',
        pronouns: 'she/her',
        orientation: 'Straight',
        relationshipStatus: 'Single',
        relationshipStyle: 'Monogamous',
        seeking: ['Long-term relationship'],
      },
      hobbies: {
        ...blankDatingProfile.hobbies,
        full: ['Cooking'],
        starred: ['Cooking'],
      },
      prompts: {
        ...blankDatingProfile.prompts,
        selfSummary: 'Looking for a grounded, curious partner.',
      },
    };

    renderDashboardProfile({ user });

    expect(screen.getByText('Profile refresh recommended')).toBeInTheDocument();
    expect(
      screen.getByText(/This profile has not been refreshed in 39 days/i)
    ).toBeInTheDocument();

    jest.useRealTimers();
  });

  test('returns to the requested direct conversation with router state after activation completes', async () => {
    const user = buildActivationReadyUser();

    render(
      <MemoryRouter
        initialEntries={[
          {
            pathname: '/dashboard/profile',
            search: '?activate=1',
            state: {
              from: {
                pathname: '/messages',
                state: {
                  contactId: 'u-2',
                },
              },
            },
          },
        ]}
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
            <Routes>
              <Route
                path="/dashboard/profile"
                element={
                  <DashboardProfile
                    mode={{ id: 'dating' }}
                    language="en"
                    strings={{
                      dashboard: translations.dashboard,
                      profile: translations.profile,
                      connectionStyle: translations.connectionStyle,
                      common: translations.common,
                    }}
                  />
                }
              />
              <Route path="/messages" element={<RedirectStateProbe />} />
            </Routes>
          </UserContext.Provider>
        </RelationshipProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('/messages')).toBeInTheDocument();
    });
    expect(screen.getByText('Contact: u-2')).toBeInTheDocument();
  });
});
