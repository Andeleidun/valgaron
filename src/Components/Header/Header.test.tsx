import { fireEvent, screen } from '@testing-library/react';
import Header from './Header';
import {
  capitalizeFirstLetter,
  fetchTranslations,
  modes,
} from '../../Utlilities';
import { renderWithAppTheme } from '../../test/renderWithAppTheme';
import { useAuth } from '../../Utlilities/auth/AuthContext';
import type { AuthUser } from '../../Utlilities/auth/AuthTypes';

jest.mock('../../Utlilities/auth/AuthContext', () => ({
  useAuth: jest.fn(),
}));

const mockedUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const translations = fetchTranslations();
const currentMode = modes[0];
const targetMode = modes[1];
const mockUser: AuthUser = {
  uid: 'header-user',
  email: 'header@example.com',
};

if (!currentMode || !targetMode) {
  throw new Error('Expected at least two configured modes for header tests.');
}

/**
 * Resolve a toggle button by its class selector.
 */
const getRequiredButton = (
  container: HTMLElement,
  selector: string
): HTMLButtonElement => {
  const button = container.querySelector(selector);
  if (!(button instanceof HTMLButtonElement)) {
    throw new Error(`Expected selector "${selector}" to resolve to a button.`);
  }
  return button;
};

/**
 * Render the header with a stable auth mock.
 */
const renderHeader = ({
  themeMode = 'light',
}: { themeMode?: 'light' | 'dark' } = {}) => {
  const setMode = jest.fn();
  const setLanguage = jest.fn();
  const toggleDarkMode = jest.fn();

  mockedUseAuth.mockReturnValue({
    status: 'signed_in',
    user: mockUser,
    error: null,
    signIn: async () => undefined,
    signUp: async () => undefined,
    signOut: async () => undefined,
  });

  const renderResult = renderWithAppTheme(
    <Header
      mode={currentMode}
      modes={modes}
      setMode={setMode}
      strings={translations.header}
      language="en"
      setLanguage={setLanguage}
      toggleDarkMode={toggleDarkMode}
    />,
    {
      themeMode,
      mode: currentMode,
    }
  );

  return {
    ...renderResult,
    setMode,
    setLanguage,
    toggleDarkMode,
  };
};

describe('Header', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('opens the mode menu, selects a mode, and closes it again', () => {
    const { container, setMode } = renderHeader();
    const nextModeLabel = capitalizeFirstLetter(
      translations.header.modes[targetMode.id].title.en
    );

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      `Who ${capitalizeFirstLetter(
        translations.header.modes[currentMode.id].title.en
      )}`
    );

    fireEvent.click(getRequiredButton(container, '.who-mode-toggle-button'));
    expect(
      screen.getByRole('button', { name: nextModeLabel })
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: nextModeLabel }));

    expect(setMode).toHaveBeenCalledWith(targetMode);
    expect(
      screen.queryByRole('button', { name: nextModeLabel })
    ).not.toBeInTheDocument();
  });

  test('opens the settings menu, forwards settings actions, and closes it', () => {
    const { container, setLanguage, toggleDarkMode } = renderHeader();

    fireEvent.click(
      getRequiredButton(container, '.who-settings-toggle-button')
    );

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

    expect(setLanguage).toHaveBeenCalledWith('de');
    expect(toggleDarkMode).toHaveBeenCalledTimes(1);

    fireEvent.click(
      getRequiredButton(container, '.who-settings-toggle-button')
    );

    expect(
      screen.queryByRole('button', {
        name: translations.header.settings.signOut.en,
      })
    ).not.toBeInTheDocument();
  });

  test('applies the active dark theme classes to portaled menu papers', () => {
    const { container } = renderHeader({ themeMode: 'dark' });

    fireEvent.click(getRequiredButton(container, '.who-mode-toggle-button'));
    expect(document.getElementById('who-mode-drawer')).toHaveClass(
      'who-header-popover-paper',
      'dark-theme',
      `${currentMode.id}-theme`
    );

    fireEvent.click(
      getRequiredButton(container, '.who-settings-toggle-button')
    );
    expect(document.getElementById('who-settings-drawer')).toHaveClass(
      'who-header-drawer-paper',
      'dark-theme',
      `${currentMode.id}-theme`
    );
  });
});
