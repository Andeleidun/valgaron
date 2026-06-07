import { render, screen, within } from '@testing-library/react';
import {
  blankDatingProfile,
  fetchTranslations,
  User,
  UserContext,
} from '../../../../Utlilities';
import { datingProfileData } from '../../../../Utlilities/data';
import { ProfileView } from '../ProfileView';
import type { ModeType, ProfileType } from '../../../../types';

const translations = fetchTranslations();

/**
 * Render ProfileView with the app user context and translations.
 */
const renderProfileView = (mode: ModeType, profile?: ProfileType) => {
  const user = Object.assign(new User(), {
    [mode.id]: profile,
  }) as User;

  return render(
    <UserContext.Provider
      value={{
        user,
        setUserProfile: jest.fn(),
        setUserGroupMemberships: jest.fn(),
        setUserSettings: jest.fn(),
      }}
    >
      <ProfileView
        mode={mode}
        language="en"
        strings={{
          profile: translations.profile,
          connectionStyle: translations.connectionStyle,
          common: translations.common,
        }}
      />
    </UserContext.Provider>
  );
};

describe('ProfileView', () => {
  test('renders a PeopleCard when a profile exists', async () => {
    const profile = datingProfileData[0] as ProfileType;
    renderProfileView({ id: 'dating' }, profile);

    if (profile.name) {
      expect(await screen.findByText(profile.name)).toBeInTheDocument();
    }
  });

  test('renders empty state when no profile exists', () => {
    renderProfileView({ id: 'academic' });

    expect(
      screen.getByRole('heading', {
        name: translations.common.profileEmptyTitle?.en ?? '',
      })
    ).toBeInTheDocument();
    expect(
      screen.getByText(translations.common.profileEmptyMessage?.en ?? '')
    ).toBeInTheDocument();
  });

  test('does not render discovery actions on the user profile view', () => {
    const profile = datingProfileData[0] as ProfileType;
    renderProfileView({ id: 'dating' }, profile);

    expect(
      screen.queryByRole('button', { name: translations.common.like.en })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: translations.common.message.en })
    ).not.toBeInTheDocument();
  });

  test('renders connection-style summary when profile values exist', () => {
    const profile = {
      ...blankDatingProfile,
      id: 'dating-connection-style-profile',
      name: 'Taylor',
      connectionStyle: {
        availabilityPattern: 'weekends',
        communicationPace: 'balanced',
        introductionPreference: 'direct_intro_ok',
        planningStyle: 'plan_ahead',
        languageComfort: {
          preferredLanguages: ['en', 'es'],
          multilingualWelcome: true,
        },
      },
    } as ProfileType;

    renderProfileView({ id: 'dating' }, profile);

    const summary = document.getElementById('dating-connection-style-summary');
    expect(summary).not.toBeNull();
    expect(
      within(summary as HTMLElement).getByText(
        translations.connectionStyle.common.sectionTitle.en
      )
    ).toBeInTheDocument();
    expect(
      within(summary as HTMLElement).getByText('Weekends')
    ).toBeInTheDocument();
    expect(
      within(summary as HTMLElement).getByText('Balanced')
    ).toBeInTheDocument();
    expect(
      within(summary as HTMLElement).getByText('Plan ahead')
    ).toBeInTheDocument();
  });
});
