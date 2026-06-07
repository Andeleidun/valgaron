import { fireEvent, screen } from '@testing-library/react';
import SettingsMenu from './SettingsMenu';
import { fetchTranslations } from '../../Utlilities';
import { renderWithAppTheme } from '../../test/renderWithAppTheme';
import { useAuth } from '../../Utlilities/auth/AuthContext';
import type { AuthUser } from '../../Utlilities/auth/AuthTypes';

jest.mock('../../Utlilities/auth/AuthContext', () => ({
  useAuth: jest.fn(),
}));

const mockedUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const translations = fetchTranslations();
const mockUser: AuthUser = {
  uid: 'settings-user',
  email: 'settings@example.com',
};

/**
 * Render the settings menu with a mocked auth state.
 */
const renderSettingsMenu = ({
  status = 'signed_in',
  themeMode = 'light',
  signOut = jest.fn(),
  setLanguage = jest.fn(),
  toggleDarkMode = jest.fn(),
}: {
  status?: 'signed_in' | 'signed_out';
  themeMode?: 'light' | 'dark';
  signOut?: jest.Mock;
  setLanguage?: jest.Mock;
  toggleDarkMode?: jest.Mock;
} = {}) => {
  mockedUseAuth.mockReturnValue({
    status,
    user: status === 'signed_in' ? mockUser : null,
    error: null,
    signIn: async () => undefined,
    signUp: async () => undefined,
    signOut,
  });

  renderWithAppTheme(
    <SettingsMenu
      language="en"
      setLanguage={setLanguage}
      toggleDarkMode={toggleDarkMode}
      strings={translations.header.settings}
    />,
    { themeMode }
  );

  return { signOut, setLanguage, toggleDarkMode };
};

describe('SettingsMenu', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders translated actions and forwards user interactions', () => {
    const { signOut, setLanguage, toggleDarkMode } = renderSettingsMenu({
      themeMode: 'dark',
    });

    fireEvent.click(
      screen.getByRole('button', {
        name: translations.header.settings.languages.de.en,
      })
    );
    fireEvent.click(
      screen.getByRole('button', {
        name: translations.header.settings.darkMode.on.en,
      })
    );
    fireEvent.click(
      screen.getByRole('button', {
        name: translations.header.settings.signOut.en,
      })
    );

    expect(
      screen.getByRole('button', {
        name: translations.header.settings.languages.en.en,
      })
    ).toBeInTheDocument();
    expect(setLanguage).toHaveBeenCalledWith('de');
    expect(toggleDarkMode).toHaveBeenCalledTimes(1);
    expect(signOut).toHaveBeenCalledTimes(1);
  });

  test('disables sign out when the user is signed out', () => {
    renderSettingsMenu({ status: 'signed_out' });

    expect(
      screen.getByRole('button', {
        name: translations.header.settings.signOut.en,
      })
    ).toBeDisabled();
  });
});
