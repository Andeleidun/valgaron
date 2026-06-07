import { fireEvent, render, screen } from '@testing-library/react';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { createFormStore } from '../../../Common/FormElements';
import { ProfilePicturesField } from '../ProfilePicturesField';
import type { ProfilePictureFormStateType } from '../../../../types';
import { fetchTranslations, getThemeOptions } from '../../../../Utlilities';

type TestProfilePictureFormState = ProfilePictureFormStateType;

const translations = fetchTranslations();
const theme = createTheme(
  getThemeOptions({ themeMode: 'light', whoMode: { id: 'dating' } })
);

/**
 * Render the profile pictures field with a controlled form store.
 */
const renderProfilePicturesField = (
  initialValues: TestProfilePictureFormState
) => {
  const store = createFormStore<TestProfilePictureFormState>(initialValues);

  render(
    <ThemeProvider theme={theme}>
      <ProfilePicturesField
        store={store}
        fieldLabel="Pictures"
        language="en"
        strings={translations.common}
        id="test-profile-pictures-input"
      />
    </ThemeProvider>
  );

  return { store };
};

describe('ProfilePicturesField', () => {
  test('lets the user change overall profile visibility', () => {
    const { store } = renderProfilePicturesField({
      pictures: ['https://example.com/first.jpg'],
      profileVisibility: 'open',
      defaultPicture: 'https://example.com/first.jpg',
      pictureVisibility: {},
    });

    fireEvent.mouseDown(
      screen.getByRole('combobox', { name: 'Visibility: Profile' })
    );
    fireEvent.click(
      screen.getByRole('option', { name: 'Verified users only' })
    );

    expect(store.getValues().profileVisibility).toBe('verified_only');
  });

  test('slides between pictures and allows choosing a new default picture', () => {
    const { store } = renderProfilePicturesField({
      pictures: [
        'https://example.com/first.jpg',
        'https://example.com/second.jpg',
      ],
      profileVisibility: 'open',
      defaultPicture: 'https://example.com/first.jpg',
      pictureVisibility: {
        'https://example.com/second.jpg': 'connections_only',
      },
    });

    expect(screen.getByText('Default profile picture')).toBeInTheDocument();
    expect(
      screen.getByText(
        'The default picture follows overall profile visibility.'
      )
    ).toBeInTheDocument();
    expect(
      document.getElementById('current-picture-visibility-select')
    ).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Show next image' }));

    expect(
      screen.getByRole('button', { name: 'Set as default picture' })
    ).toBeInTheDocument();
    expect(
      document.getElementById('current-picture-visibility-select')
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole('button', { name: 'Set as default picture' })
    );

    expect(store.getValues().defaultPicture).toBe(
      'https://example.com/second.jpg'
    );
    expect(screen.getByText('Default profile picture')).toBeInTheDocument();
    expect(
      document.getElementById('current-picture-visibility-select')
    ).toBeNull();
  });
});
