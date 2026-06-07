import {
  GetNeighborhoodBaseFormStateType,
  GetNeighborhoodProfileSubmissionType,
  NeighborhoodFormConfigType,
} from '../../../types';
import { getProfilePictureFormState, renderValue } from '../../../Utlilities';
import {
  buildConnectionStyleProfileValue,
  getConnectionStyleProfileBaseFormFields,
  getConnectionStyleProfileFormConfig,
} from './ConnectionStyleProfileConfig';

export const getNeighborhoodBaseFormState: GetNeighborhoodBaseFormStateType = ({
  useProfile,
  hobbiesOptions,
}) => ({
  ...getProfilePictureFormState({
    pictures: useProfile.pictures,
    profileVisibility: useProfile.profileVisibility,
    defaultPicture: useProfile.defaultPicture,
    pictureVisibility: useProfile.pictureVisibility,
  }),
  ...getConnectionStyleProfileBaseFormFields(useProfile.connectionStyle),
  name: useProfile.name,
  age: useProfile.main.age,
  location: useProfile.main.location,
  pronouns: useProfile.main.pronouns,
  gender: useProfile.main.gender,
  orientation: useProfile.main.orientation,
  seeking: useProfile.main.seeking,
  ethnicity: useProfile.demographics.ethnicity || [],
  religion: useProfile.demographics.religion || '',
  politicalLean: useProfile.demographics.politicalLean || '',
  occupation: useProfile.demographics.occupation || '',
  education: useProfile.demographics.education || '',
  languages: useProfile.demographics.languages || [],
  dietary: useProfile.preferences.dietary || '',
  tobacco: useProfile.preferences.tobacco || '',
  alcohol: useProfile.preferences.alcohol || '',
  cannabis: useProfile.preferences.cannabis || '',
  kids: useProfile.homeLife.kids || '',
  cats: useProfile.homeLife.cats || '',
  dogs: useProfile.homeLife.dogs || '',
  otherAnimals: useProfile.homeLife.otherAnimals || '',
  starredHobbies: useProfile.hobbies.starred || [],
  fullHobbies: useProfile.hobbies.full || [],
  hobbiesOptions: hobbiesOptions,
});

export const getNeighborhoodProfileSubmission: GetNeighborhoodProfileSubmissionType =
  ({ useProfile, profileFormData, language }) => ({
    id: useProfile.id,
    friends: useProfile.friends,
    pictures: profileFormData.pictures,
    profileVisibility: profileFormData.profileVisibility,
    defaultPicture: profileFormData.defaultPicture,
    pictureVisibility: profileFormData.pictureVisibility,
    connectionStyle: buildConnectionStyleProfileValue(profileFormData),
    name: profileFormData.name,
    main: {
      age: profileFormData.age,
      location: profileFormData.location,
      gender: profileFormData.gender,
      orientation: profileFormData.orientation,
      pronouns: profileFormData.pronouns,
      seeking: profileFormData.seeking,
    },
    demographics: {
      ethnicity: profileFormData.ethnicity,
      religion: profileFormData.religion,
      politicalLean: profileFormData.politicalLean,
      occupation: profileFormData.occupation,
      education: profileFormData.education,
      languages: profileFormData.languages,
    },
    preferences: {
      dietary: profileFormData.dietary,
      tobacco: profileFormData.tobacco,
      alcohol: profileFormData.alcohol,
      cannabis: profileFormData.cannabis,
    },
    homeLife: {
      kids: profileFormData.kids,
      cats: profileFormData.cats,
      dogs: profileFormData.dogs,
      otherAnimals: profileFormData.otherAnimals,
    },
    hobbies: {
      full: profileFormData.fullHobbies?.map((option) =>
        renderValue(language, option)
      ),
      starred: profileFormData.starredHobbies?.map((option) =>
        renderValue(language, option)
      ),
    },
  });

export const getNeighborhoodProfileMainFormConfig = ({
  strings,
  profileFormData,
  language,
}: NeighborhoodFormConfigType) => [
  {
    type: 'text',
    name: 'name',
    label: strings.questions?.name[language],
    value: profileFormData.name,
    id: 'neighborhood-profile-name-input',
    md: 12,
    hidePrivacyControl: true,
  },
  {
    type: 'number',
    name: 'age',
    label: strings.questions?.main.age[language],
    value: profileFormData.age,
    id: 'neighborhood-profile-age-input',
  },
  {
    type: 'text',
    name: 'location',
    label: strings.questions?.main.location[language],
    value: profileFormData.location,
    id: 'neighborhood-profile-location-input',
  },
  {
    type: 'autocomplete',
    name: 'gender',
    label: strings.questions?.main.gender[language],
    value: profileFormData.gender,
    options: strings.genderOptions.map((option) => ({
      value: option.value,
      label: option.label[language],
    })),
    id: 'neighborhood-profile-gender-autocomplete',
  },
  {
    type: 'autocomplete',
    name: 'pronouns',
    label: strings.questions?.main.pronouns[language],
    value: profileFormData.pronouns,
    options: strings.pronounsOptions.map((option) => ({
      value: option.value,
      label: option.label[language],
    })),
    id: 'neighborhood-profile-pronouns-autocomplete',
  },
  {
    type: 'autocomplete',
    name: 'seeking',
    label: strings.questions?.main.seeking[language],
    value: profileFormData.seeking,
    options: strings.questions?.main.seekingOptions.map((option) => ({
      value: option.value,
      label: option.label[language],
    })),
    id: 'neighborhood-profile-seeking-autocomplete',
    multiple: true,
    md: 12,
  },
];

export const getNeighborhoodProfileHobbiesFormConfig = ({
  profileFormData,
  strings,
  language,
}: NeighborhoodFormConfigType) => [
  {
    type: 'checkboxGroup',
    name: 'fullHobbies',
    label: strings.questions.hobbies.full[language],
    options: profileFormData.hobbiesOptions,
    starName: 'starredHobbies',
    checkedState: profileFormData.fullHobbies,
    starredState: profileFormData.starredHobbies,
    id: 'neighborhood-profile-hobbies-checkbox',
    md: 12,
    trailingInput: true,
    addLabel: strings.questions.hobbies.addHobbyLabel[language],
    optionsName: 'hobbiesOptions',
  },
];

export const getNeighborhoodConnectionStyleFormConfig = ({
  profileFormData,
  strings,
  language,
}: NeighborhoodFormConfigType) =>
  getConnectionStyleProfileFormConfig({
    mode: { id: 'neighborhood' },
    strings: strings.connectionStyle,
    profileFormData,
    language,
    clearLabel: strings.clear[language],
  });

export const getNeighborhoodProfileAboutFormConfig = ({
  profileFormData,
  strings,
  language,
}: NeighborhoodFormConfigType) => [
  {
    type: 'autocomplete',
    name: 'orientation',
    label: strings.questions?.main.orientation[language],
    value: profileFormData.orientation,
    options: strings.orientationOptions.map((option) => ({
      value: option.value,
      label: option.label[language],
    })),
    id: 'neighborhood-profile-orientation-autocomplete',
  },
  {
    type: 'text',
    name: 'religion',
    label: strings.questions.demographics.religion[language],
    value: profileFormData.religion,
    id: 'neighborhood-about-religion-input',
  },
  {
    type: 'text',
    name: 'politicalLean',
    label: strings.questions.demographics.politicalLean[language],
    value: profileFormData.politicalLean,
    id: 'neighborhood-about-politicalLean-input',
  },
  {
    type: 'text',
    name: 'occupation',
    label: strings.questions.demographics.occupation[language],
    value: profileFormData.occupation,
    id: 'neighborhood-about-occupation-input',
  },
  {
    type: 'text',
    name: 'education',
    label: strings.questions.demographics.education[language],
    value: profileFormData.education,
    id: 'neighborhood-about-education-input',
  },
  {
    type: 'autocomplete',
    name: 'ethnicity',
    label: strings.questions.demographics.ethnicity[language],
    value: profileFormData.ethnicity,
    options: strings.ethnicityOptions.map((option) => ({
      value: option.value,
      label: option.label[language],
    })),
    id: 'neighborhood-about-ethnicity-autocomplete',
    multiple: true,
    md: 12,
  },
  {
    type: 'autocomplete',
    name: 'languages',
    label: strings.questions.demographics.languages[language],
    value: profileFormData.languages,
    options: strings.languagesOptions.map((option) => ({
      value: option.value,
      label: option.label[language],
    })),
    id: 'neighborhood-about-languages-autocomplete',
    multiple: true,
    md: 12,
  },
];

export const getNeighborhoodProfilePreferencesFormConfig = ({
  profileFormData,
  strings,
  language,
}: NeighborhoodFormConfigType) => [
  {
    type: 'text',
    name: 'dietary',
    label: strings.questions.preferences.dietary[language],
    value: profileFormData.dietary,
    id: 'neighborhood-preferences-dietary-input',
  },
  {
    type: 'text',
    name: 'tobacco',
    label: strings.questions.preferences.tobacco[language],
    value: profileFormData.tobacco,
    id: 'neighborhood-preferences-tobacco-input',
  },
  {
    type: 'text',
    name: 'alcohol',
    label: strings.questions.preferences.alcohol[language],
    value: profileFormData.alcohol,
    id: 'neighborhood-preferences-alcohol-input',
  },
  {
    type: 'text',
    name: 'cannabis',
    label: strings.questions.preferences.cannabis[language],
    value: profileFormData.cannabis,
    id: 'neighborhood-preferences-cannabis-input',
  },
];

export const getNeighborhoodProfileHomeLifeFormConfig = ({
  profileFormData,
  strings,
  language,
}: NeighborhoodFormConfigType) => [
  {
    type: 'text',
    name: 'kids',
    label: strings.questions.homeLife.kids[language],
    value: profileFormData.kids,
    id: 'neighborhood-homeLife-kids-input',
  },
  {
    type: 'text',
    name: 'cats',
    label: strings.questions.homeLife.cats[language],
    value: profileFormData.cats,
    id: 'neighborhood-homeLife-cats-input',
  },
  {
    type: 'text',
    name: 'dogs',
    label: strings.questions.homeLife.dogs[language],
    value: profileFormData.dogs,
    id: 'neighborhood-homeLife-dogs-input',
  },
  {
    type: 'text',
    name: 'otherAnimals',
    label: strings.questions.homeLife.otherAnimals[language],
    value: profileFormData.otherAnimals,
    id: 'neighborhood-homeLife-otherAnimals-input',
  },
];
