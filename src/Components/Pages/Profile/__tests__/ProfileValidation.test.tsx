import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { act } from 'react';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import Profile from '../Profile';
import {
  blankAcademicProfile,
  blankDatingProfile,
  blankFriendProfile,
  blankNeighborhoodProfile,
  blankProfessionalProfile,
  fetchTranslations,
  getThemeOptions,
  User,
  UserContext,
} from '../../../../Utlilities';
import type { ModeType } from '../../../../types';

const translations = fetchTranslations();
const PROFILE_VALIDATION_TIMEOUT_MS = 30000;

type RenderProfileOptions = {
  user?: User;
  setUserProfile?: jest.Mock;
  setUserGroupMemberships?: jest.Mock;
};

/**
 * Build the shared test theme for a profile mode and disable ripples to keep
 * MUI interaction tests deterministic.
 */
const createProfileTestTheme = (mode: ModeType) => {
  const themeOptions = getThemeOptions({ themeMode: 'light', whoMode: mode });
  return createTheme(themeOptions, {
    components: {
      MuiButtonBase: {
        defaultProps: {
          disableRipple: true,
        },
      },
    },
  });
};

/**
 * Render Profile with the app's user context, translations, and theme.
 */
const renderProfile = (mode: ModeType, options: RenderProfileOptions = {}) => {
  const {
    user = new User(),
    setUserProfile = jest.fn(),
    setUserGroupMemberships = jest.fn(),
  } = options;
  const theme = createProfileTestTheme(mode);
  return render(
    <ThemeProvider theme={theme}>
      <UserContext.Provider
        value={{
          user,
          setUserProfile,
          setUserGroupMemberships,
          setUserSettings: jest.fn(),
        }}
      >
        <Profile
          mode={mode}
          language="en"
          strings={{
            profile: translations.profile,
            connectionStyle: translations.connectionStyle,
            common: translations.common,
          }}
        />
      </UserContext.Provider>
    </ThemeProvider>
  );
};

describe('Profile validation planning', () => {
  /**
   * Click an interactive element within React's act boundary.
   */
  const clickElement = async (element: Element) => {
    await act(async () => {
      fireEvent.click(element);
    });
  };

  /**
   * Click a button by its accessible name.
   */
  const clickButton = async (name: string) => {
    await clickElement(screen.getByRole('button', { name }));
  };

  /**
   * Find an input by label and set a new value.
   */
  const setInputValueByLabel = async (label: string, value: string) => {
    await act(async () => {
      fireEvent.change(screen.getByLabelText(label), {
        target: { value },
      });
    });
  };

  /**
   * Submit the active mode form directly to avoid extra button interaction
   * noise from MUI wrappers during validation tests.
   */
  const submitProfileForm = async (modeId: ModeType['id']) => {
    const form = document.getElementById(
      `${modeId}-profile-form`
    ) as HTMLFormElement | null;
    expect(form).not.toBeNull();
    await act(async () => {
      fireEvent.submit(form as HTMLFormElement);
    });
  };

  /**
   * Click the primary save button inside the active mode form.
   */
  const clickSaveButton = async (modeId: ModeType['id']) => {
    const form = document.getElementById(
      `${modeId}-profile-form`
    ) as HTMLFormElement | null;
    expect(form).not.toBeNull();
    const saveButton = (form as HTMLFormElement).querySelector(
      'button[type="submit"]'
    );
    expect(saveButton).toBeInstanceOf(HTMLButtonElement);
    await clickElement(saveButton as HTMLButtonElement);
  };

  test('friends mode can enter edit state and render profile form shell', async () => {
    renderProfile({ id: 'friends' });

    await clickButton('Edit');

    expect(
      screen.getByRole('button', { name: translations.common.save.en })
    ).toBeInTheDocument();
    expect(document.getElementById('friends-profile-form')).toBeInTheDocument();
  });

  test('dating mode can enter edit state and render profile form shell', async () => {
    renderProfile({ id: 'dating' });

    await clickButton('Edit');

    expect(
      screen.getByRole('button', { name: translations.common.save.en })
    ).toBeInTheDocument();
    expect(document.getElementById('dating-profile-form')).toBeInTheDocument();
    expect(
      document.getElementById('profile-visibility-select')
    ).toBeInTheDocument();
    expect(document.getElementById('pictures-privacy-select')).toBeNull();
    expect(document.getElementById('name-privacy-select')).toBeNull();
  });

  test('professional mode can enter edit state and render profile form shell', async () => {
    renderProfile({ id: 'professional' });

    await clickButton('Edit');

    expect(
      screen.getByRole('button', { name: translations.common.save.en })
    ).toBeInTheDocument();
    expect(
      document.getElementById('professional-profile-form')
    ).toBeInTheDocument();
  });

  test('academic mode can enter edit state and render profile form shell', async () => {
    renderProfile({ id: 'academic' });

    await clickButton('Edit');

    expect(
      screen.getByRole('button', { name: translations.common.save.en })
    ).toBeInTheDocument();
    expect(
      document.getElementById('academic-profile-form')
    ).toBeInTheDocument();
  });

  test('neighborhood mode can enter edit state and render profile form shell', async () => {
    renderProfile({ id: 'neighborhood' });

    await clickButton('Edit');

    expect(
      screen.getByRole('button', { name: translations.common.save.en })
    ).toBeInTheDocument();
    expect(
      document.getElementById('neighborhood-profile-form')
    ).toBeInTheDocument();
  });

  test.each([
    { id: 'friends' },
    { id: 'dating' },
    { id: 'academic' },
    { id: 'professional' },
    { id: 'neighborhood' },
  ] as ModeType[])(
    '$id mode renders the connection-style section in edit mode',
    async (mode) => {
      renderProfile(mode);

      await clickButton('Edit');

      expect(
        screen.getByRole('button', {
          name: translations.connectionStyle.common.sectionTitle.en,
        })
      ).toBeInTheDocument();
    }
  );

  const academicMode: ModeType = { id: 'academic' };
  const professionalMode: ModeType = { id: 'professional' };
  const readyToSaveFriendProfile = {
    ...blankFriendProfile,
    id: 'friend-save-user',
    pictures: ['https://example.com/friend.jpg'],
    name: 'Alice',
    main: {
      ...blankFriendProfile.main,
      age: 30,
      location: 'Seattle',
      seeking: ['New friends'],
      pronouns: 'she/her',
    },
    hobbies: {
      ...blankFriendProfile.hobbies,
      starred: ['Board games'],
      full: ['Board games'],
    },
    prompts: {
      ...blankFriendProfile.prompts,
      selfSummary: 'Always up for a park day and a long conversation.',
    },
  };
  const readyToSaveAcademicProfile = {
    ...blankAcademicProfile,
    id: 'academic-save-user',
    pictures: ['https://example.com/academic.jpg'],
    name: 'A. Researcher',
    main: {
      ...blankAcademicProfile.main,
      tagline: 'Applied systems research',
      primaryAffiliation: 'Berkeley Institute',
      pronouns: 'they/them',
      location: 'Berkeley',
      seeking: ['Research collaborators'],
    },
    about: {
      ...blankAcademicProfile.about,
      email: 'researcher@example.com',
    },
    highlights: {
      ...blankAcademicProfile.highlights,
      summary: 'Publishing pragmatic work on civic technology.',
    },
  };
  const readyToSaveProfessionalProfile = {
    ...blankProfessionalProfile,
    id: 'professional-save-user',
    pictures: ['https://example.com/professional.jpg'],
    name: 'A. Professional',
    main: {
      ...blankProfessionalProfile.main,
      tagline: 'Building practical systems',
      location: 'San Diego',
      seeking: ['Mentorship'],
      pronouns: 'she/her',
    },
    about: {
      ...blankProfessionalProfile.about,
      email: 'professional@example.com',
    },
    highlights: {
      ...blankProfessionalProfile.highlights,
      summary: 'Leading product and operations programs.',
    },
  };
  const readyToSaveNeighborhoodProfile = {
    ...blankNeighborhoodProfile,
    id: 'neighborhood-save-user',
    pictures: ['https://example.com/neighborhood.jpg'],
    name: 'Neighbor Alex',
    main: {
      ...blankNeighborhoodProfile.main,
      age: 35,
      location: 'Oakland',
      seeking: ['Mutual aid'],
      pronouns: 'he/him',
    },
    hobbies: {
      ...blankNeighborhoodProfile.hobbies,
      starred: ['Gardening'],
      full: ['Gardening'],
    },
  };
  const readyToSaveDatingProfile = {
    ...blankDatingProfile,
    id: 'dating-save-user',
    pictures: ['https://example.com/dating.jpg'],
    name: 'Taylor',
    main: {
      ...blankDatingProfile.main,
      age: 31,
      location: 'Portland',
      gender: 'Woman',
      pronouns: 'she/her',
      orientation: 'Straight',
      relationshipStatus: 'Single',
      relationshipStyle: 'Monogamous',
      seeking: ['Long-term relationship'],
    },
    hobbies: {
      ...blankDatingProfile.hobbies,
      starred: ['Cooking'],
      full: ['Cooking'],
    },
    prompts: {
      ...blankDatingProfile.prompts,
      selfSummary: 'Looking for something grounded and real.',
    },
  };

  const academicProfileWithEntries = {
    id: 'academic-user',
    pictures: [],
    name: 'Test Academic',
    main: {
      tagline: 'Academic tag',
      primaryAffiliation: 'Test Uni',
      otherAffiliations: [],
      position: 'Professor',
      pronouns: 'they/them',
      location: 'Seattle',
      seeking: [],
    },
    about: {
      email: '',
      phone: '',
      websites: [],
      languages: [],
    },
    highlights: {
      papers: [],
      books: [],
      awards: [],
      summary: '',
      skills: [],
    },
    education: [
      {
        id: 5,
        educationSchool: 'Academic University',
        educationDegree: 'PhD',
        educationStartDate: '2005',
        educationEndDate: '2010',
      },
    ],
    jobHistory: [
      {
        id: 7,
        jobHistoryEmployer: 'Academic Employer',
        jobHistoryTitle: 'Researcher',
        jobHistoryStartDate: '2011',
        jobHistoryEndDate: '2016',
        jobHistoryKeyPoints: ['Published new work'],
        jobHistorySkills: ['Research'],
      },
    ],
    network: [],
    conferences: [],
    professionalMemberships: [],
  };

  const professionalProfileWithEntries = {
    id: 'professional-user',
    pictures: [],
    name: 'Test Professional',
    main: {
      tagline: 'Professional tag',
      pronouns: 'she/her',
      seeking: [],
      location: 'Austin',
    },
    network: [],
    about: {
      email: '',
      phone: '',
      websites: [],
      languages: [],
    },
    highlights: {
      accomplishments: '',
      summary: '',
      skills: [],
      projects: '',
      papers: [],
      books: [],
      awards: [],
    },
    jobHistory: [
      {
        id: 9,
        jobHistoryEmployer: 'Professional Employer',
        jobHistoryTitle: 'Manager',
        jobHistoryStartDate: '2018',
        jobHistoryEndDate: '2022',
        jobHistoryKeyPoints: ['Led initiatives'],
        jobHistorySkills: ['Leadership'],
      },
    ],
    education: [
      {
        id: 11,
        educationSchool: 'Professional College',
        educationDegree: 'MBA',
        educationStartDate: '2015',
        educationEndDate: '2017',
      },
    ],
    conferences: [],
    professionalMemberships: [],
  };

  describe('Profile history entry editing', () => {
    test(
      'academic mode loads, edits, and saves job history and education entries',
      async () => {
        const user = new User();
        user.academic = academicProfileWithEntries;
        renderProfile(academicMode, { user });

        await clickButton('Edit');
        await clickButton('Job History');
        await clickElement(screen.getByText('Academic Employer'));

        const employerInput = screen.getByLabelText(
          'Employer'
        ) as HTMLInputElement;
        expect(employerInput.value).toBe('Academic Employer');
        await setInputValueByLabel('Employer', 'Academic Employer Updated');

        const jobSaveButton = document.getElementById(
          'academic-jobHistorySave-button'
        );
        expect(jobSaveButton).toBeInstanceOf(HTMLButtonElement);
        await clickElement(jobSaveButton as HTMLButtonElement);
        await screen.findByText('Academic Employer Updated');

        await clickButton('Education');
        await clickElement(screen.getByText('Academic University'));

        const schoolInput = screen.getByLabelText('School') as HTMLInputElement;
        expect(schoolInput.value).toBe('Academic University');
        await setInputValueByLabel('School', 'Academic College');

        const educationSaveButton = document.getElementById(
          'academic-educationSave-button'
        );
        expect(educationSaveButton).toBeInstanceOf(HTMLButtonElement);
        await clickElement(educationSaveButton as HTMLButtonElement);
        await screen.findByText('Academic College');
      },
      PROFILE_VALIDATION_TIMEOUT_MS
    );

    test(
      'professional mode loads, edits, and saves job history and education entries',
      async () => {
        const user = new User();
        user.professional = professionalProfileWithEntries;
        renderProfile(professionalMode, { user });

        await clickButton('Edit');
        await clickButton('Job History');
        await clickElement(screen.getByText('Professional Employer'));

        const employerInput = screen.getByLabelText(
          'Employer'
        ) as HTMLInputElement;
        expect(employerInput.value).toBe('Professional Employer');
        await setInputValueByLabel('Employer', 'Professional Employer Pro');

        const jobSaveButton = document.getElementById(
          'professional-jobHistorySave-button'
        );
        expect(jobSaveButton).toBeInstanceOf(HTMLButtonElement);
        await clickElement(jobSaveButton as HTMLButtonElement);
        await screen.findByText('Professional Employer Pro');

        await clickButton('Education Background');
        await clickElement(screen.getByText('Professional College'));

        const schoolInput = screen.getByLabelText(
          'Institution Name'
        ) as HTMLInputElement;
        expect(schoolInput.value).toBe('Professional College');
        await setInputValueByLabel(
          'Institution Name',
          'Professional Institute'
        );

        const educationSaveButton = document.getElementById(
          'professional-educationSave-button'
        );
        expect(educationSaveButton).toBeInstanceOf(HTMLButtonElement);
        await clickElement(educationSaveButton as HTMLButtonElement);
        await screen.findByText('Professional Institute');
      },
      PROFILE_VALIDATION_TIMEOUT_MS
    );
  });

  describe('Standalone profile save flow', () => {
    test.each([
      {
        mode: { id: 'friends' } as ModeType,
        assignProfile: (user: User) => {
          user.friends = readyToSaveFriendProfile;
        },
      },
      {
        mode: { id: 'dating' } as ModeType,
        assignProfile: (user: User) => {
          user.dating = readyToSaveDatingProfile;
        },
      },
      {
        mode: { id: 'academic' } as ModeType,
        assignProfile: (user: User) => {
          user.academic = readyToSaveAcademicProfile;
        },
      },
      {
        mode: { id: 'professional' } as ModeType,
        assignProfile: (user: User) => {
          user.professional = readyToSaveProfessionalProfile;
        },
      },
      {
        mode: { id: 'neighborhood' } as ModeType,
        assignProfile: (user: User) => {
          user.neighborhood = readyToSaveNeighborhoodProfile;
        },
      },
    ])(
      '$mode.id mode saves through the Save button and exits edit mode',
      async ({ mode, assignProfile }) => {
        const saveProfile = jest.fn();
        const user = new User();
        assignProfile(user);
        renderProfile(mode, { user, setUserProfile: saveProfile });

        await clickButton('Edit');

        expect(
          document.getElementById(`${mode.id}-profile-form`)
        ).toBeInTheDocument();

        await clickSaveButton(mode.id);

        expect(saveProfile).toHaveBeenCalledTimes(1);
        await waitFor(() => {
          expect(
            document.getElementById(`${mode.id}-profile-form`)
          ).not.toBeInTheDocument();
        });
      },
      15000
    );

    test(
      'save failure keeps the standalone profile in edit mode',
      async () => {
        const saveProfile = jest.fn(() => {
          throw new Error('save failed');
        });
        const user = new User();
        user.friends = readyToSaveFriendProfile;
        renderProfile({ id: 'friends' }, { user, setUserProfile: saveProfile });

        await clickButton('Edit');
        await clickSaveButton('friends');

        expect(
          await screen.findByText('Unable to save profile.')
        ).toBeInTheDocument();
        expect(
          document.getElementById('friends-profile-form')
        ).toBeInTheDocument();
      },
      PROFILE_VALIDATION_TIMEOUT_MS
    );
  });

  test('friends mode shows required-field errors when submitting invalid required inputs', async () => {
    renderProfile({ id: 'friends' });

    await clickButton('Edit');
    await submitProfileForm('friends');

    expect(screen.getByText('Name is required.')).toBeInTheDocument();
    expect(
      screen.getByText('Age must be between 1 and 120.')
    ).toBeInTheDocument();
    expect(screen.getByText('Location is required.')).toBeInTheDocument();
  });

  test(
    'friends mode shows inline error for out-of-range age',
    async () => {
      renderProfile({ id: 'friends' });

      await clickButton('Edit');

      await setInputValueByLabel('Name', 'Alice');
      await setInputValueByLabel('Location', 'Seattle');
      await setInputValueByLabel('Age', '0');

      await submitProfileForm('friends');

      expect(
        screen.getByText('Age must be between 1 and 120.')
      ).toBeInTheDocument();
    },
    PROFILE_VALIDATION_TIMEOUT_MS
  );

  test('dating mode shows required-field errors when submitting invalid required inputs', async () => {
    renderProfile({ id: 'dating' });

    await clickButton('Edit');
    await submitProfileForm('dating');

    expect(screen.getByText('Name is required.')).toBeInTheDocument();
    expect(
      screen.getByText('Age must be between 1 and 120.')
    ).toBeInTheDocument();
    expect(screen.getByText('Location is required.')).toBeInTheDocument();
  });

  test('academic mode shows required-field errors when submitting invalid required inputs', async () => {
    renderProfile({ id: 'academic' });

    await clickButton('Edit');
    await submitProfileForm('academic');

    expect(screen.getByText('Name is required.')).toBeInTheDocument();
    expect(screen.getByText('Location is required.')).toBeInTheDocument();
    expect(screen.getByText('Tagline is required.')).toBeInTheDocument();
  });

  test('professional mode shows required-field errors when submitting invalid required inputs', async () => {
    renderProfile({ id: 'professional' });

    await clickButton('Edit');
    await submitProfileForm('professional');

    expect(screen.getByText('Name is required.')).toBeInTheDocument();
    expect(screen.getByText('Location is required.')).toBeInTheDocument();
    expect(screen.getByText('Tagline is required.')).toBeInTheDocument();
  });

  test('neighborhood mode shows required-field errors when submitting invalid required inputs', async () => {
    renderProfile({ id: 'neighborhood' });

    await clickButton('Edit');
    await submitProfileForm('neighborhood');

    expect(screen.getByText('Name is required.')).toBeInTheDocument();
    expect(
      screen.getByText('Age must be between 1 and 120.')
    ).toBeInTheDocument();
    expect(screen.getByText('Location is required.')).toBeInTheDocument();
  });

  test(
    'friends mode shows save success feedback after valid submit',
    async () => {
      const saveProfile = jest.fn();
      const user = new User();
      user.friends = readyToSaveFriendProfile;
      renderProfile({ id: 'friends' }, { user, setUserProfile: saveProfile });

      await clickButton('Edit');

      await submitProfileForm('friends');

      expect(saveProfile).toHaveBeenCalledTimes(1);
      await waitFor(() => {
        expect(
          document.getElementById('friends-profile-form')
        ).not.toBeInTheDocument();
      });
    },
    PROFILE_VALIDATION_TIMEOUT_MS
  );

  test(
    'friends mode shows save error feedback and retry can recover',
    async () => {
      const saveProfile = jest
        .fn()
        .mockImplementationOnce(() => {
          throw new Error('save failed');
        })
        .mockImplementationOnce(() => undefined);
      const user = new User();
      user.friends = readyToSaveFriendProfile;
      renderProfile({ id: 'friends' }, { user, setUserProfile: saveProfile });

      await clickButton('Edit');

      await submitProfileForm('friends');

      expect(
        await screen.findByText('Unable to save profile.')
      ).toBeInTheDocument();
      await clickButton('Retry');
      expect(saveProfile).toHaveBeenCalledTimes(2);
      await waitFor(() => {
        expect(
          document.getElementById('friends-profile-form')
        ).not.toBeInTheDocument();
      });
    },
    PROFILE_VALIDATION_TIMEOUT_MS
  );

  test(
    'professional mode shows save success feedback after valid submit',
    async () => {
      const saveProfile = jest.fn();
      const user = new User();
      user.professional = readyToSaveProfessionalProfile;
      renderProfile(
        { id: 'professional' },
        { user, setUserProfile: saveProfile }
      );

      await clickButton('Edit');

      await submitProfileForm('professional');

      expect(saveProfile).toHaveBeenCalledTimes(1);
      await waitFor(() => {
        expect(
          document.getElementById('professional-profile-form')
        ).not.toBeInTheDocument();
      });
    },
    PROFILE_VALIDATION_TIMEOUT_MS
  );

  test(
    'professional mode shows save error feedback and retry can recover',
    async () => {
      const saveProfile = jest
        .fn()
        .mockImplementationOnce(() => {
          throw new Error('save failed');
        })
        .mockImplementationOnce(() => undefined);
      const user = new User();
      user.professional = readyToSaveProfessionalProfile;
      renderProfile(
        { id: 'professional' },
        { user, setUserProfile: saveProfile }
      );

      await clickButton('Edit');

      await submitProfileForm('professional');

      expect(
        await screen.findByText('Unable to save profile.')
      ).toBeInTheDocument();
      await clickButton('Retry');
      expect(saveProfile).toHaveBeenCalledTimes(2);
      await waitFor(() => {
        expect(
          document.getElementById('professional-profile-form')
        ).not.toBeInTheDocument();
      });
    },
    PROFILE_VALIDATION_TIMEOUT_MS
  );

  test(
    'academic mode shows save success feedback after valid submit',
    async () => {
      const saveProfile = jest.fn();
      const user = new User();
      user.academic = readyToSaveAcademicProfile;
      renderProfile({ id: 'academic' }, { user, setUserProfile: saveProfile });

      await clickButton('Edit');

      await submitProfileForm('academic');

      expect(saveProfile).toHaveBeenCalledTimes(1);
      await waitFor(() => {
        expect(
          document.getElementById('academic-profile-form')
        ).not.toBeInTheDocument();
      });
    },
    PROFILE_VALIDATION_TIMEOUT_MS
  );

  test(
    'academic mode shows save error feedback and retry can recover',
    async () => {
      const saveProfile = jest
        .fn()
        .mockImplementationOnce(() => {
          throw new Error('save failed');
        })
        .mockImplementationOnce(() => undefined);
      const user = new User();
      user.academic = readyToSaveAcademicProfile;
      renderProfile({ id: 'academic' }, { user, setUserProfile: saveProfile });

      await clickButton('Edit');

      await submitProfileForm('academic');

      expect(
        await screen.findByText('Unable to save profile.')
      ).toBeInTheDocument();
      await clickButton('Retry');
      expect(saveProfile).toHaveBeenCalledTimes(2);
      await waitFor(() => {
        expect(
          document.getElementById('academic-profile-form')
        ).not.toBeInTheDocument();
      });
    },
    PROFILE_VALIDATION_TIMEOUT_MS
  );

  test(
    'neighborhood mode shows save success feedback after valid submit',
    async () => {
      const saveProfile = jest.fn();
      const user = new User();
      user.neighborhood = readyToSaveNeighborhoodProfile;
      renderProfile(
        { id: 'neighborhood' },
        { user, setUserProfile: saveProfile }
      );

      await clickButton('Edit');

      await submitProfileForm('neighborhood');

      expect(saveProfile).toHaveBeenCalledTimes(1);
      await waitFor(() => {
        expect(
          document.getElementById('neighborhood-profile-form')
        ).not.toBeInTheDocument();
      });
    },
    PROFILE_VALIDATION_TIMEOUT_MS
  );

  test(
    'neighborhood mode shows save error feedback and retry can recover',
    async () => {
      const saveProfile = jest
        .fn()
        .mockImplementationOnce(() => {
          throw new Error('save failed');
        })
        .mockImplementationOnce(() => undefined);
      const user = new User();
      user.neighborhood = readyToSaveNeighborhoodProfile;
      renderProfile(
        { id: 'neighborhood' },
        { user, setUserProfile: saveProfile }
      );

      await clickButton('Edit');

      await submitProfileForm('neighborhood');

      expect(
        await screen.findByText('Unable to save profile.')
      ).toBeInTheDocument();
      await clickButton('Retry');
      expect(saveProfile).toHaveBeenCalledTimes(2);
      await waitFor(() => {
        expect(
          document.getElementById('neighborhood-profile-form')
        ).not.toBeInTheDocument();
      });
    },
    PROFILE_VALIDATION_TIMEOUT_MS
  );

  test(
    'dating mode shows inline error for out-of-range age',
    async () => {
      renderProfile({ id: 'dating' });

      await clickButton('Edit');

      await setInputValueByLabel('Name', 'Taylor');
      await setInputValueByLabel('Location', 'Portland');
      await setInputValueByLabel('Age', '121');

      await submitProfileForm('dating');

      expect(
        screen.getByText('Age must be between 1 and 120.')
      ).toBeInTheDocument();
    },
    PROFILE_VALIDATION_TIMEOUT_MS
  );
});
