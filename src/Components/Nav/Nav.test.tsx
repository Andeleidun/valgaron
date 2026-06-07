import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { PageType } from '../../types';
import Nav from './Nav';

jest.mock('../../Utlilities/auth/AuthContext', () => ({
  useAuth: jest.fn(),
}));

const { useAuth } = jest.requireMock('../../Utlilities/auth/AuthContext') as {
  useAuth: jest.Mock;
};

/**
 * Build deterministic page definitions for nav tests.
 */
const buildPages = (): PageType[] => [
  {
    id: 'discovery',
    path: '/',
    title: 'Discovery',
    element: <div />,
    icon: <span aria-hidden="true">D</span>,
  },
  {
    id: 'messages',
    path: '/messages',
    title: 'Messages',
    element: <div />,
    icon: <span aria-hidden="true">M</span>,
  },
  {
    id: 'community',
    path: '/community',
    title: 'Community',
    element: <div />,
    icon: <span aria-hidden="true">C</span>,
  },
  {
    id: 'dashboard',
    path: '/dashboard',
    title: 'Dashboard',
    element: <div />,
    icon: <span aria-hidden="true">P</span>,
  },
];

describe('Nav accessibility behavior', () => {
  test('marks the active destination with aria-current when signed in', () => {
    useAuth.mockReturnValue({
      status: 'signed_in',
      user: { id: '1', email: 'user@example.com' },
      error: null,
      signIn: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
    });

    render(
      <MemoryRouter
        initialEntries={['/messages']}
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <Nav pages={buildPages()} />
      </MemoryRouter>
    );

    expect(screen.getByRole('link', { name: /messages/i })).toHaveAttribute(
      'aria-current',
      'page'
    );
  });

  test('does not render navigable links while signed out', () => {
    useAuth.mockReturnValue({
      status: 'signed_out',
      user: null,
      error: null,
      signIn: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
    });

    render(
      <MemoryRouter
        initialEntries={['/']}
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <Nav pages={buildPages()} />
      </MemoryRouter>
    );

    expect(screen.queryByRole('link', { name: /discovery/i })).toBeNull();
    expect(screen.getByRole('button', { name: /discovery/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /messages/i })).toBeDisabled();
  });
});
