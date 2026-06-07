import { render, screen, fireEvent } from '@testing-library/react';
import ModeMenu from './ModeMenu';
import { modes } from '../../Utlilities/config';
import { fetchTranslations } from '../../Utlilities';
import type { ModeType } from '../../types';

describe('ModeMenu', () => {
  const translations = fetchTranslations();
  const modeStrings = translations.header.modes;
  const language = 'en';
  const activeMode: ModeType = modes[0];

  test('renders a menu item for each configured mode', () => {
    const handleModeClick = jest.fn();
    render(
      <ModeMenu
        mode={activeMode}
        modes={modes}
        handleModeClick={handleModeClick}
        strings={modeStrings}
        language={language}
      />
    );

    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(modes.length);
  });

  test('clicking a mode triggers handleModeClick with the correct mode', () => {
    const handleModeClick = jest.fn();
    render(
      <ModeMenu
        mode={activeMode}
        modes={modes}
        handleModeClick={handleModeClick}
        strings={modeStrings}
        language={language}
      />
    );

    const targetMode = modes[modes.length - 1];
    const label = modeStrings[targetMode.id]?.title?.[language];
    if (!label) {
      return;
    }

    fireEvent.click(screen.getByText(label));
    expect(handleModeClick).toHaveBeenCalledWith(targetMode);
  });

  test('mode menu labels match translations for the selected language', () => {
    const handleModeClick = jest.fn();
    render(
      <ModeMenu
        mode={activeMode}
        modes={modes}
        handleModeClick={handleModeClick}
        strings={modeStrings}
        language={language}
      />
    );

    modes.forEach((mode) => {
      const label = modeStrings[mode.id]?.title?.[language] ?? '';
      expect(screen.getByText(label)).toBeInTheDocument();
    });
  });
});
