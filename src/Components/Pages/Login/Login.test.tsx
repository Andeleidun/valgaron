import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { act } from 'react';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';
import Login from './Login';
import ProtectedRoute from '../../Common/ProtectedRoute';
import { useAuth } from '../../../Utlilities/auth/AuthContext';
import type { AuthState } from '../../../Utlilities/auth/AuthTypes';
import fetchTranslations from '../../../Utlilities/translations';

/**
 * Mocked useAuth return type for tests.
 */
jest.mock('../../../Utlilities/auth/AuthContext', () => ({
  useAuth: jest.fn(),
}));

const mockedUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const translations = fetchTranslations();

/**
 * Render the login flow routes.
 */
const renderLoginFlow = (
  initialEntries: React.ComponentProps<
    typeof MemoryRouter
  >['initialEntries'] = ['/login']
) =>
  render(
    <MemoryRouter
      initialEntries={initialEntries}
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <Routes>
        <Route
          path="/login"
          element={<Login strings={translations.common} language="en" />}
        />
        <Route path="/dashboard/profile" element={<RedirectTarget />} />
        <Route path="/redirected" element={<div>Redirected</div>} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <div>Protected Home</div>
            </ProtectedRoute>
          }
        />
      </Routes>
    </MemoryRouter>
  );

/**
 * Probe component for asserting post-login redirect destinations.
 */
const RedirectTarget = () => {
  const location = useLocation();
  return <div>{`${location.pathname}${location.search}${location.hash}`}</div>;
};

describe('Login', () => {
  beforeEach(() => {
    mockedUseAuth.mockReset();
  });

  test('blocks submit when email or password is empty and shows validation errors', async () => {
    const signIn = jest.fn(async () => undefined);
    const signUp = jest.fn(async () => undefined);
    const signOut = jest.fn(async () => undefined);

    mockedUseAuth.mockReturnValue({
      status: 'signed_out',
      user: null,
      signIn,
      signUp,
      signOut,
    });

    renderLoginFlow();
    await act(async () => {
      await userEvent.click(screen.getByRole('button', { name: 'Sign In' }));
    });

    expect(signIn).not.toHaveBeenCalled();
    expect(signUp).not.toHaveBeenCalled();
    expect(screen.getByText('Email is required')).toBeInTheDocument();
    expect(screen.getByText('Password is required')).toBeInTheDocument();
  });

  test('successful sign-in calls signIn and navigates to the default route', async () => {
    let authState: AuthState = { status: 'signed_out', user: null };
    const signIn = jest.fn(async (email: string) => {
      authState = { status: 'signed_in', user: { uid: 'user-1', email } };
      return undefined;
    });

    mockedUseAuth.mockImplementation(() => ({
      ...authState,
      signIn,
      signUp: async () => undefined,
      signOut: async () => undefined,
    }));

    renderLoginFlow();
    await act(async () => {
      await userEvent.type(screen.getByLabelText('Email'), 'user@example.com');
      await userEvent.type(screen.getByLabelText('Password'), 'password');
      await userEvent.click(screen.getByRole('button', { name: 'Sign In' }));
    });

    expect(signIn).toHaveBeenCalledWith('user@example.com', 'password');
    expect(await screen.findByText('Protected Home')).toBeInTheDocument();
  });

  test('sign-up calls signUp and navigates to the default route', async () => {
    let authState: AuthState = { status: 'signed_out', user: null };
    const signUp = jest.fn(async (email: string) => {
      authState = { status: 'signed_in', user: { uid: 'user-2', email } };
      return undefined;
    });

    mockedUseAuth.mockImplementation(() => ({
      ...authState,
      signIn: async () => undefined,
      signUp,
      signOut: async () => undefined,
    }));

    renderLoginFlow();
    await act(async () => {
      await userEvent.type(screen.getByLabelText('Email'), 'new@example.com');
      await userEvent.type(screen.getByLabelText('Password'), 'password');
      await userEvent.click(screen.getByRole('button', { name: 'Sign Up' }));
    });
    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: 'Cancel' })
      ).toBeInTheDocument();
    });
    await act(async () => {
      await userEvent.type(
        await screen.findByLabelText('Display Name'),
        'New User'
      );
      await userEvent.click(screen.getByRole('button', { name: 'Sign Up' }));
    });

    expect(signUp).toHaveBeenCalledWith(
      'new@example.com',
      'password',
      'New User'
    );
    expect(await screen.findByText('Protected Home')).toBeInTheDocument();
  });

  test('first sign-up click switches to sign-up flow and cancel returns to sign-in', async () => {
    mockedUseAuth.mockReturnValue({
      status: 'signed_out',
      user: null,
      signIn: async () => undefined,
      signUp: async () => undefined,
      signOut: async () => undefined,
    });

    renderLoginFlow();

    await act(async () => {
      await userEvent.click(screen.getByRole('button', { name: 'Sign Up' }));
    });

    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
    expect(screen.getByLabelText('Display Name')).toBeInTheDocument();

    await act(async () => {
      await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    });

    expect(screen.getByRole('button', { name: 'Sign In' })).toBeInTheDocument();
    expect(screen.queryByLabelText('Display Name')).toBeNull();
  });

  test('sign-out triggers ProtectedRoute redirect back to /login when auth becomes signed_out', async () => {
    let authState: AuthState = {
      status: 'signed_in',
      user: { uid: 'user-3', email: 'signedin@example.com' },
    };
    const signOut = jest.fn(async () => {
      authState = { status: 'signed_out', user: null };
      return undefined;
    });

    mockedUseAuth.mockImplementation(() => ({
      ...authState,
      signIn: async () => undefined,
      signUp: async () => undefined,
      signOut,
    }));

    const { rerender } = renderLoginFlow(['/']);
    expect(screen.getByText('Protected Home')).toBeInTheDocument();

    await signOut();
    rerender(
      <MemoryRouter
        initialEntries={['/']}
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <Routes>
          <Route
            path="/login"
            element={<Login strings={translations.common} language="en" />}
          />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <div>Protected Home</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Login')).toBeInTheDocument();
  });

  test('session persistence allows access to protected route', () => {
    mockedUseAuth.mockReturnValue({
      status: 'signed_in',
      user: { uid: 'user-1', email: 'user@example.com' },
      signIn: async () => undefined,
      signUp: async () => undefined,
      signOut: async () => undefined,
    });

    renderLoginFlow(['/']);

    expect(screen.getByText('Protected Home')).toBeInTheDocument();
  });

  test('failed sign-in keeps the user on the login page and does not redirect', async () => {
    const signIn = jest.fn(async () => {
      throw new Error('Invalid credentials');
    });

    mockedUseAuth.mockReturnValue({
      status: 'signed_out',
      user: null,
      error: 'Invalid credentials',
      signIn,
      signUp: async () => undefined,
      signOut: async () => undefined,
    });

    renderLoginFlow([
      {
        pathname: '/login',
        state: { from: { pathname: '/redirected' } },
      },
    ]);

    await act(async () => {
      await userEvent.type(screen.getByLabelText('Email'), 'user@example.com');
      await userEvent.type(screen.getByLabelText('Password'), 'password');
      await userEvent.click(screen.getByRole('button', { name: 'Sign In' }));
    });

    expect(signIn).toHaveBeenCalledWith('user@example.com', 'password');
    expect(screen.getByText('Login')).toBeInTheDocument();
    expect(screen.queryByText('Redirected')).toBeNull();
    expect(screen.getByRole('alert')).toHaveTextContent('Invalid credentials');
  });

  test('successful sign-in preserves query parameters and hash fragments', async () => {
    let authState: AuthState = { status: 'signed_out', user: null };
    const signIn = jest.fn(async (email: string) => {
      authState = { status: 'signed_in', user: { uid: 'user-4', email } };
      return undefined;
    });

    mockedUseAuth.mockImplementation(() => ({
      ...authState,
      signIn,
      signUp: async () => undefined,
      signOut: async () => undefined,
    }));

    renderLoginFlow([
      {
        pathname: '/login',
        state: {
          from: {
            pathname: '/dashboard/profile',
            search: '?activate=1',
            hash: '#photos',
          },
        },
      },
    ]);

    await act(async () => {
      await userEvent.type(screen.getByLabelText('Email'), 'user@example.com');
      await userEvent.type(screen.getByLabelText('Password'), 'password');
      await userEvent.click(screen.getByRole('button', { name: 'Sign In' }));
    });

    expect(signIn).toHaveBeenCalledWith('user@example.com', 'password');
    expect(
      await screen.findByText('/dashboard/profile?activate=1#photos')
    ).toBeInTheDocument();
  });
});
