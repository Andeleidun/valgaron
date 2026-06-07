import type {
  ConnectionStyleProfileFormFieldsType,
  ConnectionStyleType,
} from '../../../../types';
import {
  blankAcademicProfile,
  blankDatingProfile,
  blankFriendProfile,
  blankNeighborhoodProfile,
  blankProfessionalProfile,
} from '../../../../Utlilities';
import {
  getAcademicBaseFormState,
  getAcademicProfileSubmission,
} from '../AcademicProfileConfig';
import {
  getDatingBaseFormState,
  getDatingProfileSubmission,
} from '../DatingProfileConfig';
import {
  getFriendsBaseFormState,
  getFriendsProfileSubmission,
} from '../FriendsProfileConfig';
import {
  getNeighborhoodBaseFormState,
  getNeighborhoodProfileSubmission,
} from '../NeighborhoodProfileConfig';
import {
  getProfessionalBaseFormState,
  getProfessionalProfileSubmission,
} from '../ProfessionalProfileConfig';

const hydratedConnectionStyle: ConnectionStyleType = {
  availabilityPattern: 'weekends',
  communicationPace: 'balanced',
  introductionPreference: 'direct_intro_ok',
  planningStyle: 'plan_ahead',
  languageComfort: {
    preferredLanguages: ['en', 'es'],
    multilingualWelcome: true,
    simpleEnglishOk: true,
  },
};

const submittedConnectionStyleFields: ConnectionStyleProfileFormFieldsType = {
  connectionAvailabilityPattern: 'weekends',
  connectionCommunicationPace: 'balanced',
  connectionIntroductionPreference: 'direct_intro_ok',
  connectionLanguageComfort: [
    'en',
    'es',
    'multilingual_welcome',
    'simple_english_ok',
  ],
  connectionPlanningStyle: 'plan_ahead',
};

const expectHydratedConnectionStyleFields = (
  formData: ConnectionStyleProfileFormFieldsType
) => {
  expect(formData.connectionAvailabilityPattern).toBe('weekends');
  expect(formData.connectionCommunicationPace).toBe('balanced');
  expect(formData.connectionIntroductionPreference).toBe('direct_intro_ok');
  expect(formData.connectionPlanningStyle).toBe('plan_ahead');
  expect(formData.connectionLanguageComfort).toEqual(
    expect.arrayContaining([
      'en',
      'es',
      'multilingual_welcome',
      'simple_english_ok',
    ])
  );
};

const expectPersistedConnectionStyle = (
  connectionStyle: ConnectionStyleType | undefined
) => {
  expect(connectionStyle).toEqual({
    availabilityPattern: 'weekends',
    communicationPace: 'balanced',
    introductionPreference: 'direct_intro_ok',
    planningStyle: 'plan_ahead',
    languageComfort: {
      preferredLanguages: ['en', 'es'],
      multilingualWelcome: true,
      simpleEnglishOk: true,
    },
  });
};

describe('Connection-style profile integration', () => {
  test.each([
    {
      modeId: 'friends',
      hydrate: () =>
        getFriendsBaseFormState({
          useProfile: {
            ...blankFriendProfile,
            connectionStyle: hydratedConnectionStyle,
          },
          hobbiesOptions: [],
        }),
    },
    {
      modeId: 'dating',
      hydrate: () =>
        getDatingBaseFormState({
          useProfile: {
            ...blankDatingProfile,
            connectionStyle: hydratedConnectionStyle,
          },
          hobbiesOptions: [],
        }),
    },
    {
      modeId: 'academic',
      hydrate: () =>
        getAcademicBaseFormState({
          useProfile: {
            ...blankAcademicProfile,
            connectionStyle: hydratedConnectionStyle,
          },
        }),
    },
    {
      modeId: 'professional',
      hydrate: () =>
        getProfessionalBaseFormState({
          useProfile: {
            ...blankProfessionalProfile,
            connectionStyle: hydratedConnectionStyle,
          },
        }),
    },
    {
      modeId: 'neighborhood',
      hydrate: () =>
        getNeighborhoodBaseFormState({
          useProfile: {
            ...blankNeighborhoodProfile,
            connectionStyle: hydratedConnectionStyle,
          },
          hobbiesOptions: [],
        }),
    },
  ])('hydrates connection-style fields for $modeId mode', ({ hydrate }) => {
    expectHydratedConnectionStyleFields(hydrate());
  });

  test.each([
    {
      modeId: 'friends',
      submit: () =>
        getFriendsProfileSubmission({
          useProfile: blankFriendProfile,
          profileFormData: {
            ...getFriendsBaseFormState({
              useProfile: blankFriendProfile,
              hobbiesOptions: [],
            }),
            ...submittedConnectionStyleFields,
          },
          language: 'en',
        }),
    },
    {
      modeId: 'dating',
      submit: () =>
        getDatingProfileSubmission({
          useProfile: blankDatingProfile,
          profileFormData: {
            ...getDatingBaseFormState({
              useProfile: blankDatingProfile,
              hobbiesOptions: [],
            }),
            ...submittedConnectionStyleFields,
          },
          language: 'en',
        }),
    },
    {
      modeId: 'academic',
      submit: () =>
        getAcademicProfileSubmission({
          useProfile: blankAcademicProfile,
          profileFormData: {
            ...getAcademicBaseFormState({
              useProfile: blankAcademicProfile,
            }),
            ...submittedConnectionStyleFields,
          },
        }),
    },
    {
      modeId: 'professional',
      submit: () =>
        getProfessionalProfileSubmission({
          useProfile: blankProfessionalProfile,
          profileFormData: {
            ...getProfessionalBaseFormState({
              useProfile: blankProfessionalProfile,
            }),
            ...submittedConnectionStyleFields,
          },
        }),
    },
    {
      modeId: 'neighborhood',
      submit: () =>
        getNeighborhoodProfileSubmission({
          useProfile: blankNeighborhoodProfile,
          profileFormData: {
            ...getNeighborhoodBaseFormState({
              useProfile: blankNeighborhoodProfile,
              hobbiesOptions: [],
            }),
            ...submittedConnectionStyleFields,
          },
          language: 'en',
        }),
    },
  ])('persists connection-style fields for $modeId mode', ({ submit }) => {
    expectPersistedConnectionStyle(submit().connectionStyle);
  });
});
