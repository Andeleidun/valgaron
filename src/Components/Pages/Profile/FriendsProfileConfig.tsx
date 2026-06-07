import {
  FriendsFormConfigType,
  GetFriendsBaseFormStateType,
  GetFriendsProfileSubmissionType,
} from '../../../types';
import { getProfilePictureFormState, renderValue } from '../../../Utlilities';
import {
  buildConnectionStyleProfileValue,
  getConnectionStyleProfileBaseFormFields,
  getConnectionStyleProfileFormConfig,
} from './ConnectionStyleProfileConfig';

export const getFriendsBaseFormState: GetFriendsBaseFormStateType = ({
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
  selfSummary: useProfile.prompts.selfSummary || '',
  currentGoal: useProfile.prompts.currentGoal || '',
  woher: useProfile.prompts.woher || '',
  likeMaking: useProfile.prompts.likeMaking || '',
  style: useProfile.prompts.style || '',
  actuallyLookingFor: useProfile.prompts.actuallyLookingFor || '',
  typicalFriday: useProfile.prompts.typicalFriday || '',
  typicalWeekend: useProfile.prompts.typicalWeekend || '',
  beforeDateNeedKnow: useProfile.prompts.beforeDateNeedKnow || '',
  mostPrivateAdmit: useProfile.prompts.mostPrivateAdmit || '',
  favoriteGameSeries: useProfile.prompts.favoriteGameSeries || '',
  lastShowBinged: useProfile.prompts.lastShowBinged || '',
  couldProbablyBeatYouAt: useProfile.prompts.couldProbablyBeatYouAt || '',
  goldenRule: useProfile.prompts.goldenRule || '',
  valueAnswers: useProfile.valueAnswers,
});

export const getFriendsProfileSubmission: GetFriendsProfileSubmissionType = ({
  useProfile,
  profileFormData,
  language,
}) => ({
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
  prompts: {
    selfSummary: profileFormData.selfSummary,
    currentGoal: profileFormData.currentGoal,
    woher: profileFormData.woher,
    likeMaking: profileFormData.likeMaking,
    actuallyLookingFor: profileFormData.actuallyLookingFor,
    typicalFriday: profileFormData.typicalFriday,
    typicalWeekend: profileFormData.typicalWeekend,
    beforeDateNeedKnow: profileFormData.beforeDateNeedKnow,
    mostPrivateAdmit: profileFormData.mostPrivateAdmit,
    favoriteGameSeries: profileFormData.favoriteGameSeries,
    lastShowBinged: profileFormData.lastShowBinged,
    couldProbablyBeatYouAt: profileFormData.couldProbablyBeatYouAt,
    goldenRule: profileFormData.goldenRule,
  },
  valueAnswers: profileFormData.valueAnswers ?? [],
});

export const getFriendsProfileMainFormConfig = ({
  strings,
  profileFormData,
  language,
}: FriendsFormConfigType) => [
  {
    type: 'text',
    name: 'name',
    label: strings.questions?.name[language],
    value: profileFormData.name,
    id: 'friends-profile-name-input',
    md: 12,
    hidePrivacyControl: true,
  },
  {
    type: 'number',
    name: 'age',
    label: strings.questions?.main.age[language],
    value: profileFormData.age,
    id: 'friends-profile-age-input',
  },
  {
    type: 'text',
    name: 'location',
    label: strings.questions?.main.location[language],
    value: profileFormData.location,
    id: 'friends-profile-location-input',
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
    id: 'friends-profile-gender-autocomplete',
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
    id: 'friends-profile-pronouns-autocomplete',
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
    id: 'friends-profile-seeking-autocomplete',
    multiple: true,
    md: 12,
  },
];

export const getFriendsProfileHobbiesFormConfig = ({
  profileFormData,
  strings,
  language,
}: FriendsFormConfigType) => [
  {
    type: 'checkboxGroup',
    name: 'fullHobbies',
    label: strings.questions.hobbies.full[language],
    options: profileFormData.hobbiesOptions,
    starName: 'starredHobbies',
    checkedState: profileFormData.fullHobbies,
    starredState: profileFormData.starredHobbies,
    id: 'friends-profile-hobbies-checkbox',
    md: 12,
    trailingInput: true,
    addLabel: strings.questions.hobbies.addHobbyLabel[language],
    optionsName: 'hobbiesOptions',
  },
];

export const getFriendsConnectionStyleFormConfig = ({
  profileFormData,
  strings,
  language,
}: FriendsFormConfigType) =>
  getConnectionStyleProfileFormConfig({
    mode: { id: 'friends' },
    strings: strings.connectionStyle,
    profileFormData,
    language,
    clearLabel: strings.clear[language],
  });

export const getFriendsProfileAboutFormConfig = ({
  profileFormData,
  strings,
  language,
}: FriendsFormConfigType) => [
  {
    type: 'autocomplete',
    name: 'orientation',
    label: strings.questions?.main.orientation[language],
    value: profileFormData.orientation,
    options: strings.orientationOptions.map((option) => ({
      value: option.value,
      label: option.label[language],
    })),
    id: 'friends-profile-orientation-autocomplete',
  },
  {
    type: 'text',
    name: 'religion',
    label: strings.questions.demographics.religion[language],
    value: profileFormData.religion,
    id: 'friends-about-religion-input',
  },
  {
    type: 'text',
    name: 'politicalLean',
    label: strings.questions.demographics.politicalLean[language],
    value: profileFormData.politicalLean,
    id: 'friends-about-politicalLean-input',
  },
  {
    type: 'text',
    name: 'occupation',
    label: strings.questions.demographics.occupation[language],
    value: profileFormData.occupation,
    id: 'friends-about-occupation-input',
  },
  {
    type: 'text',
    name: 'education',
    label: strings.questions.demographics.education[language],
    value: profileFormData.education,
    id: 'friends-about-education-input',
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
    id: 'friends-about-ethnicity-autocomplete',
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
    id: 'friends-about-languages-autocomplete',
    multiple: true,
    md: 12,
  },
];

export const getFriendsProfilePreferencesFormConfig = ({
  profileFormData,
  strings,
  language,
}: FriendsFormConfigType) => [
  {
    type: 'text',
    name: 'dietary',
    label: strings.questions.preferences.dietary[language],
    value: profileFormData.dietary,
    id: 'friends-preferences-dietary-input',
  },
  {
    type: 'text',
    name: 'tobacco',
    label: strings.questions.preferences.tobacco[language],
    value: profileFormData.tobacco,
    id: 'friends-preferences-tobacco-input',
  },
  {
    type: 'text',
    name: 'alcohol',
    label: strings.questions.preferences.alcohol[language],
    value: profileFormData.alcohol,
    id: 'friends-preferences-alcohol-input',
  },
  {
    type: 'text',
    name: 'cannabis',
    label: strings.questions.preferences.cannabis[language],
    value: profileFormData.cannabis,
    id: 'friends-preferences-cannabis-input',
  },
];

export const getFriendsProfileHomeLifeFormConfig = ({
  profileFormData,
  strings,
  language,
}: FriendsFormConfigType) => [
  {
    type: 'text',
    name: 'kids',
    label: strings.questions.homeLife.kids[language],
    value: profileFormData.kids,
    id: 'friends-homeLife-kids-input',
  },
  {
    type: 'text',
    name: 'cats',
    label: strings.questions.homeLife.cats[language],
    value: profileFormData.cats,
    id: 'friends-homeLife-cats-input',
  },
  {
    type: 'text',
    name: 'dogs',
    label: strings.questions.homeLife.dogs[language],
    value: profileFormData.dogs,
    id: 'friends-homeLife-dogs-input',
  },
  {
    type: 'text',
    name: 'otherAnimals',
    label: strings.questions.homeLife.otherAnimals[language],
    value: profileFormData.otherAnimals,
    id: 'friends-homeLife-otherAnimals-input',
  },
];

export const getFriendsProfilePromptsFormConfig = ({
  profileFormData,
  strings,
  language,
}: FriendsFormConfigType) => [
  {
    type: 'text',
    name: 'selfSummary',
    label: strings.questions.prompts.selfSummary[language],
    value: profileFormData.selfSummary,
    id: 'friends-prompts-selfSummary-input',
  },
  {
    type: 'text',
    name: 'currentGoal',
    label: strings.questions.prompts.currentGoal[language],
    value: profileFormData.currentGoal,
    id: 'friends-prompts-currentGoal-input',
  },
  {
    type: 'text',
    name: 'woher',
    label: strings.questions.prompts.woher[language],
    value: profileFormData.woher,
    id: 'friends-prompts-woher-input',
  },
  {
    type: 'text',
    name: 'likeMaking',
    label: strings.questions.prompts.likeMaking[language],
    value: profileFormData.likeMaking,
    id: 'friends-prompts-likeMaking-input',
  },
  {
    type: 'text',
    name: 'style',
    label: strings.questions.prompts.style[language],
    value: profileFormData.style,
    id: 'friends-prompts-style-input',
  },
  {
    type: 'text',
    name: 'actuallyLookingFor',
    label: strings.questions.prompts.actuallyLookingFor[language],
    value: profileFormData.actuallyLookingFor,
    id: 'friends-prompts-actuallyLookingFor-input',
  },
  {
    type: 'text',
    name: 'typicalFriday',
    label: strings.questions.prompts.typicalFriday[language],
    value: profileFormData.typicalFriday,
    id: 'friends-prompts-typicalFriday-input',
  },
  {
    type: 'text',
    name: 'typicalWeekend',
    label: strings.questions.prompts.typicalWeekend[language],
    value: profileFormData.typicalWeekend,
    id: 'friends-prompts-typicalWeekend-input',
  },
  {
    type: 'text',
    name: 'beforeDateNeedKnow',
    label: strings.questions.prompts.beforeDateNeedKnow[language],
    value: profileFormData.beforeDateNeedKnow,
    id: 'friends-prompts-beforeDateNeedKnow-input',
  },
  {
    type: 'text',
    name: 'mostPrivateAdmit',
    label: strings.questions.prompts.mostPrivateAdmit[language],
    value: profileFormData.mostPrivateAdmit,
    id: 'friends-prompts-mostPrivateAdmit-input',
  },
  {
    type: 'text',
    name: 'favoriteGameSeries',
    label: strings.questions.prompts.favoriteGameSeries[language],
    value: profileFormData.favoriteGameSeries,
    id: 'friends-prompts-favoriteGameSeries-input',
  },
  {
    type: 'text',
    name: 'lastShowBinged',
    label: strings.questions.prompts.lastShowBinged[language],
    value: profileFormData.lastShowBinged,
    id: 'friends-prompts-lastShowBinged-input',
  },
  {
    type: 'text',
    name: 'couldProbablyBeatYouAt',
    label: strings.questions.prompts.couldProbablyBeatYouAt[language],
    value: profileFormData.couldProbablyBeatYouAt,
    id: 'friends-prompts-couldProbablyBeatYouAt-input',
  },
  {
    type: 'text',
    name: 'goldenRule',
    label: strings.questions.prompts.goldenRule[language],
    value: profileFormData.goldenRule,
    id: 'friends-prompts-goldenRule-input',
  },
];
