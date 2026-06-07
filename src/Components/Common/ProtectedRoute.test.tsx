import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import { useAuth } from '../../Utlilities/auth/AuthContext';
import type { AuthState } from '../../Utlilities/auth/AuthTypes';

/**
 * Mocked useAuth return type for tests.
 */
type UseAuthReturn = ReturnType<typeof useAuth>;

jest.mock('../../Utlilities/auth/AuthContext', () => ({
  useAuth: jest.fn(),
}));

const mockedUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

/**
 * Render protected routes with a mocked auth state.
 */
const renderWithAuth = (path: string, authState: AuthState) => {
  const mockReturn: UseAuthReturn = {
    ...authState,
    signIn: async () => undefined,
    signOut: async () => undefined,
    signUp: async () => undefined,
  };
  mockedUseAuth.mockReturnValue(mockReturn);

  render(
    <MemoryRouter
      initialEntries={[path]}
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <Routes>
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <div>Protected Root</div>
            </ProtectedRoute>
          }
        />
        <Route
          path="/messages"
          element={
            <ProtectedRoute>
              <div>Protected Messages</div>
            </ProtectedRoute>
          }
        />
        <Route
          path="/community"
          element={
            <ProtectedRoute>
              <div>Protected Community</div>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <div>Protected Dashboard</div>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/profile"
          element={
            <ProtectedRoute>
              <div>Protected Profile</div>
            </ProtectedRoute>
          }
        />
        <Route path="/login" element={<LoginRouteState />} />
      </Routes>
    </MemoryRouter>
  );
};

/**
 * Login route placeholder for asserting redirect state.
 */
const LoginRouteState = () => {
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
      <div>Login Page</div>
      <div>From: {fromPath}</div>
    </div>
  );
};

describe('ProtectedRoute', () => {
  beforeEach(() => {
    mockedUseAuth.mockReset();
  });

  test.each([
    '/',
    '/messages',
    '/community',
    '/dashboard',
    '/dashboard/profile',
  ])('redirects unauthenticated users to /login for %s', (path) => {
    renderWithAuth(path, { status: 'signed_out', user: null });
    expect(screen.getByText('Login Page')).toBeInTheDocument();
  });

  test('renders protected content for signed-in users', () => {
    renderWithAuth('/messages', {
      status: 'signed_in',
      user: { uid: 'user-1', email: 'user@example.com' },
    });
    expect(screen.getByText('Protected Messages')).toBeInTheDocument();
  });

  test('renders a loading spinner while auth is loading', () => {
    renderWithAuth('/community', { status: 'loading', user: null });
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  test('preserves the originally requested path for redirect back', () => {
    renderWithAuth('/dashboard/profile', { status: 'signed_out', user: null });
    expect(screen.getByText('Login Page')).toBeInTheDocument();
    expect(screen.getByText('From: /dashboard/profile')).toBeInTheDocument();
  });
});
