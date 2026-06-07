import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import OnboardingRoute from './OnboardingRoute';
import { User, UserContext } from '../../Utlilities';
import { buildEmptyConnectionStyle } from '../../Utlilities/models';

/**
 * Probe component for asserting the redirect destination and preserved router
 * state.
 */
const OnboardingRedirectProbe = () => {
  const location = useLocation();
  const fromPath =
    typeof location.state === 'object' &&
    location.state &&
    'from' in location.state &&
    typeof (location.state as { from?: { pathname?: string } }).from
      ?.pathname === 'string'
      ? (location.state as { from: { pathname: string } }).from.pathname
      : '';

  return (
    <div>
      <div>{location.pathname}</div>
      <div>{`From: ${fromPath}`}</div>
    </div>
  );
};

/**
 * Build a dating user with optional onboarding completion.
 */
const buildDatingUser = (complete = false): User => {
  const user = new User();
  user.userSettings.mode = { id: 'dating' };

  if (complete && user.dating) {
    user.onboardingState.dating = {
      modeIntent: {
        modeId: 'dating',
        intentId: 'intentional_dating',
      },
      completedAt: '2026-04-18T12:00:00.000Z',
    };
    user.dating = {
      ...user.dating,
      connectionStyle: {
        ...user.dating.connectionStyle,
        communicationPace: 'balanced',
      },
    };
  }

  return user;
};

/**
 * Render OnboardingRoute inside a minimal router and user context.
 */
const renderOnboardingRoute = ({
  path = '/messages',
  user = buildDatingUser(),
}: {
  path?: string;
  user?: User;
} = {}) =>
  render(
    <MemoryRouter
      initialEntries={[path]}
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
        <Routes>
          <Route
            path="/messages"
            element={
              <OnboardingRoute mode={{ id: 'dating' }}>
                <div>Protected Messages</div>
              </OnboardingRoute>
            }
          />
          <Route path="/onboarding" element={<OnboardingRedirectProbe />} />
        </Routes>
      </UserContext.Provider>
    </MemoryRouter>
  );

describe('OnboardingRoute', () => {
  test('redirects incomplete users to onboarding and preserves the original path', () => {
    renderOnboardingRoute();

    expect(screen.getByText('/onboarding')).toBeInTheDocument();
    expect(screen.getByText('From: /messages')).toBeInTheDocument();
  });

  test('renders protected content for users who completed onboarding', () => {
    renderOnboardingRoute({ user: buildDatingUser(true) });

    expect(screen.getByText('Protected Messages')).toBeInTheDocument();
  });

  test('keeps protected content available after connection-style fields are later cleared', () => {
    const user = buildDatingUser(true);

    if (!user.dating) {
      throw new Error('Expected a dating profile for onboarding route tests.');
    }

    user.dating = {
      ...user.dating,
      connectionStyle: buildEmptyConnectionStyle(),
    };

    renderOnboardingRoute({ user });

    expect(screen.getByText('Protected Messages')).toBeInTheDocument();
  });
});
