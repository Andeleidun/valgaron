import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import Onboarding from './Onboarding';
import fetchTranslations from '../../../Utlilities/translations';
import { User } from '../../../Utlilities';
import type { OnboardingCompletionType } from '../../../types';

const translations = fetchTranslations();

/**
 * Render the onboarding flow inside a minimal router.
 */
const renderOnboarding = ({
  modeId = 'dating',
  user = new User(),
  onComplete = jest.fn<void, [OnboardingCompletionType]>(),
  language = 'en',
  initialEntries = [
    {
      pathname: '/onboarding',
      state: { from: { pathname: '/messages' } },
    },
  ],
}: {
  modeId?: 'friends' | 'dating' | 'academic' | 'professional' | 'neighborhood';
  user?: User;
  onComplete?: jest.Mock<void, [OnboardingCompletionType]>;
  language?: string;
  initialEntries?: React.ComponentProps<typeof MemoryRouter>['initialEntries'];
} = {}) => {
  const buildTree = (nextUser: User, nextLanguage: string) => {
    nextUser.userSettings.mode = { id: modeId };

    return (
      <MemoryRouter
        initialEntries={initialEntries}
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <Routes>
          <Route
            path="/onboarding"
            element={
              <Onboarding
                mode={{ id: modeId }}
                user={nextUser}
                strings={{
                  onboarding: translations.onboarding,
                  connectionStyle: translations.connectionStyle,
                  common: translations.common,
                }}
                language={nextLanguage}
                onComplete={onComplete}
              />
            }
          />
          <Route path="/dashboard/profile" element={<RedirectTarget />} />
          <Route path="/messages" element={<MessagesRedirectTarget />} />
          <Route path="/" element={<div>Home Route</div>} />
        </Routes>
      </MemoryRouter>
    );
  };

  const renderResult = render(buildTree(user, language));

  return {
    onComplete,
    ...renderResult,
    rerenderOnboarding: ({
      nextUser = user,
      nextLanguage = language,
    }: {
      nextUser?: User;
      nextLanguage?: string;
    } = {}) => renderResult.rerender(buildTree(nextUser, nextLanguage)),
  };
};

/**
 * Probe component for asserting post-onboarding redirect destinations.
 */
const RedirectTarget = () => {
  const location = useLocation();
  return <div>{`${location.pathname}${location.search}${location.hash}`}</div>;
};

/**
 * Probe component for asserting post-onboarding message redirects and state.
 */
const MessagesRedirectTarget = () => {
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
      <div>Messages Route</div>
      <div>{`Contact: ${contactId}`}</div>
    </div>
  );
};

describe('Onboarding', () => {
  /**
   * Advance the flow from intro to the practical-fit step with a chosen intent.
   */
  const advanceToPracticalFitStep = (intentLabel = 'Intentional dating') => {
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    fireEvent.click(screen.getByRole('radio', { name: intentLabel }));
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
  };

  /**
   * Open a MUI select and choose one option by its accessible label.
   */
  const chooseSelectOption = ({
    fieldLabel,
    optionLabel,
  }: {
    fieldLabel: string;
    optionLabel: string;
  }) => {
    fireEvent.mouseDown(screen.getByRole('combobox', { name: fieldLabel }));
    fireEvent.click(screen.getByRole('option', { name: optionLabel }));
  };

  test('renders mode-aware intro copy and requires an intent before advancing', async () => {
    renderOnboarding({ modeId: 'friends' });

    expect(
      screen.getByText('Build the kind of friendship you want right now')
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));

    expect(
      screen.getByText('What kind of friendship are you hoping for right now?')
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Continue' })).toBeDisabled();
  });

  test('saves the selected intent and practical-fit answer, then redirects back to the requested route', async () => {
    const { onComplete } = renderOnboarding();

    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    expect(
      screen.getByText(
        'What kind of dating experience are you looking for right now?'
      )
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('radio', { name: 'Intentional dating' }));
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    expect(
      screen.getByText(
        'What most affects whether dating feels realistic for you?'
      )
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole('radio', { name: 'Language comfort' }));
    chooseSelectOption({
      fieldLabel: 'Language comfort',
      optionLabel: 'Spanish',
    });
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));

    expect(screen.getByText('Your dating setup is ready')).toBeInTheDocument();
    expect(screen.getByText('Intentional dating')).toBeInTheDocument();
    expect(screen.getByText('Language comfort: Spanish')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(onComplete).toHaveBeenCalledWith({
      modeId: 'dating',
      intentId: 'intentional_dating',
      connectionStyle: {
        languageComfort: {
          preferredLanguages: ['es'],
        },
      },
    });
    expect(await screen.findByText('Messages Route')).toBeInTheDocument();
  });

  test('preserves query parameters and hash fragments when onboarding completes', async () => {
    const { onComplete } = renderOnboarding({
      initialEntries: [
        {
          pathname: '/onboarding',
          state: {
            from: {
              pathname: '/dashboard/profile',
              search: '?activate=1',
              hash: '#photos',
            },
          },
        },
      ],
    });

    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    fireEvent.click(screen.getByRole('radio', { name: 'Intentional dating' }));
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    fireEvent.click(screen.getByRole('radio', { name: 'Language comfort' }));
    chooseSelectOption({
      fieldLabel: 'Language comfort',
      optionLabel: 'Spanish',
    });
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(onComplete).toHaveBeenCalled();
    expect(
      await screen.findByText('/dashboard/profile?activate=1#photos')
    ).toBeInTheDocument();
  });

  test('preserves nested router state when onboarding returns to messages', async () => {
    renderOnboarding({
      initialEntries: [
        {
          pathname: '/onboarding',
          state: {
            from: {
              pathname: '/messages',
              state: {
                contactId: 'u-2',
              },
            },
          },
        },
      ],
    });

    advanceToPracticalFitStep();
    fireEvent.click(screen.getByRole('radio', { name: 'Language comfort' }));
    chooseSelectOption({
      fieldLabel: 'Language comfort',
      optionLabel: 'Spanish',
    });
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(await screen.findByText('Messages Route')).toBeInTheDocument();
    expect(screen.getByText('Contact: u-2')).toBeInTheDocument();
  });

  test('falls back to the home route when redirect state is missing', async () => {
    renderOnboarding({
      initialEntries: [{ pathname: '/onboarding', state: null }],
    });

    advanceToPracticalFitStep();
    fireEvent.click(screen.getByRole('radio', { name: 'Language comfort' }));
    chooseSelectOption({
      fieldLabel: 'Language comfort',
      optionLabel: 'Spanish',
    });
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(await screen.findByText('Home Route')).toBeInTheDocument();
  });

  test('supports the remaining practical-fit categories and avoids redirecting back to onboarding', async () => {
    renderOnboarding({
      initialEntries: [
        {
          pathname: '/onboarding',
          state: { from: { pathname: '/onboarding' } },
        },
      ],
    });

    advanceToPracticalFitStep();

    fireEvent.click(screen.getByRole('radio', { name: 'Schedule' }));
    expect(
      screen.getByRole('combobox', { name: 'Availability' })
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('radio', { name: 'Communication pace' }));
    expect(
      screen.getByRole('combobox', { name: 'Communication pace' })
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole('radio', { name: 'Shared context first' })
    );
    expect(
      screen.getByRole('combobox', { name: 'Introduction preference' })
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('radio', { name: 'Planning style' }));
    expect(
      screen.getByRole('combobox', { name: 'Planning style' })
    ).toBeInTheDocument();

    chooseSelectOption({
      fieldLabel: 'Planning style',
      optionLabel: 'Plan ahead',
    });
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(await screen.findByText('Home Route')).toBeInTheDocument();
  });

  test('does not reset in-progress onboarding when unrelated user settings change', async () => {
    const user = new User();
    const { rerenderOnboarding } = renderOnboarding({ user });

    advanceToPracticalFitStep();
    fireEvent.click(screen.getByRole('radio', { name: 'Language comfort' }));
    chooseSelectOption({
      fieldLabel: 'Language comfort',
      optionLabel: 'Spanish',
    });
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));

    expect(screen.getByText('Your dating setup is ready')).toBeInTheDocument();
    expect(screen.getByText('Intentional dating')).toBeInTheDocument();
    expect(screen.getByText('Language comfort: Spanish')).toBeInTheDocument();

    const updatedUser = new User();
    updatedUser.userSettings = {
      ...user.userSettings,
      darkMode: 'dark',
    };

    rerenderOnboarding({ nextUser: updatedUser });

    expect(screen.getByText('Your dating setup is ready')).toBeInTheDocument();
    expect(screen.getByText('Intentional dating')).toBeInTheDocument();
    expect(screen.getByText('Language comfort: Spanish')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Continue' })
    ).not.toBeInTheDocument();
  });
});
