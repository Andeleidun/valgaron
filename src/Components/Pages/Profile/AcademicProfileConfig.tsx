import {
  GetAcademicBaseFormStateType,
  GetAcademicProfileSubmissionType,
  AcademicFormConfigType,
  AcademicEducationFormConfigType,
} from '../../../types';
import { getProfilePictureFormState, renderValue } from '../../../Utlilities';
import {
  buildConnectionStyleProfileValue,
  getConnectionStyleProfileBaseFormFields,
  getConnectionStyleProfileFormConfig,
} from './ConnectionStyleProfileConfig';
import {
  getCareerProfileAboutFormFields,
  getCareerProfileHighlightFormFields,
} from './CareerProfileConfigHelpers';

export const getAcademicBaseFormState: GetAcademicBaseFormStateType = ({
  useProfile,
}) => {
  const main = useProfile.main;
  const aboutFormFields = getCareerProfileAboutFormFields(useProfile.about);
  const highlightFormFields = getCareerProfileHighlightFormFields(
    useProfile.highlights
  );

  return {
    ...getProfilePictureFormState({
      pictures: useProfile.pictures,
      profileVisibility: useProfile.profileVisibility,
      defaultPicture: useProfile.defaultPicture,
      pictureVisibility: useProfile.pictureVisibility,
    }),
    ...getConnectionStyleProfileBaseFormFields(useProfile.connectionStyle),
    ...aboutFormFields,
    ...highlightFormFields,
    name: useProfile.name ?? '',
    age: main?.age,
    location: main?.location ?? '',
    pronouns: main?.pronouns ?? '',
    tagline: main?.tagline ?? '',
    primaryAffiliation: main?.primaryAffiliation ?? '',
    otherAffiliations: main?.otherAffiliations ?? [],
    seeking: main?.seeking ?? [],
    position: main?.position ?? '',
    education: useProfile.education ?? [],
    jobHistory: useProfile.jobHistory ?? [],
    conferences: useProfile.conferences ?? [],
    memberships: useProfile.professionalMemberships ?? [],
  };
};

export const getAcademicProfileSubmission: GetAcademicProfileSubmissionType = ({
  useProfile,
  profileFormData,
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
    location: profileFormData.location,
    pronouns: profileFormData.pronouns,
    tagline: profileFormData.tagline,
    primaryAffiliation: profileFormData.primaryAffiliation,
    position: profileFormData.position,
    otherAffiliations: profileFormData.otherAffiliations,
    seeking: profileFormData.seeking,
  },
  network: useProfile.network,
  about: {
    email: profileFormData.email,
    phone: profileFormData.phone,
    websites: profileFormData.websites,
    languages: profileFormData.languages,
  },
  highlights: {
    papers: profileFormData.papers,
    books: profileFormData.books,
    awards: profileFormData.awards,
    summary: profileFormData.summary,
    skills: profileFormData.highlightSkills,
    accomplishments: profileFormData.accomplishments,
  },
  education: profileFormData.education,
  jobHistory: profileFormData.jobHistory,
  conferences: profileFormData.conferences,
  professionalMemberships: profileFormData.memberships,
});

export const getAcademicProfileMainFormConfig = ({
  strings,
  profileFormData,
  language,
}: AcademicFormConfigType) => [
  {
    type: 'text',
    name: 'name',
    label: strings.questions.name[language],
    value: profileFormData.name,
    id: 'academic-profile-name-input',
    md: 12,
    hidePrivacyControl: true,
  },
  {
    type: 'text',
    name: 'tagline',
    label: strings.questions.main.tagline[language],
    value: profileFormData.tagline,
    id: 'academic-profile-tagline-input',
  },
  {
    type: 'text',
    name: 'location',
    label: strings.questions.main.location[language],
    value: profileFormData.location,
    id: 'academic-profile-location-input',
  },
  {
    type: 'text',
    name: 'primaryAffiliation',
    label: strings.questions.main.primaryAffiliation[language],
    value: profileFormData.primaryAffiliation,
    id: 'academic-profile-primaryAffiliation-input',
  },
  {
    type: 'text',
    name: 'position',
    label: strings.questions.main.position[language],
    value: profileFormData.position,
    id: 'academic-profile-position-input',
  },
  {
    type: 'autocomplete',
    name: 'seeking',
    label: strings.questions.main.seeking[language],
    value: profileFormData.seeking,
    options: strings.questions.main.seekingOptions.map((option) => ({
      value: option.value,
      label: option.label[language],
    })),
    id: 'academic-profile-seeking-autocomplete',
    multiple: true,
    md: 12,
  },
];

export const getAcademicProfileAboutFormConfig = ({
  profileFormData,
  strings,
  language,
}: AcademicFormConfigType) => [
  {
    type: 'autocomplete',
    name: 'pronouns',
    label: strings.questions.main.pronouns[language],
    value: profileFormData.pronouns,
    options: strings.pronounsOptions.map((option) => ({
      value: option.value,
      label: option.label[language],
    })),
    id: 'academic-profile-pronouns-autocomplete',
  },
  {
    type: 'text',
    name: 'email',
    label: strings.questions.about.contact.email[language],
    value: profileFormData.email,
    id: 'academic-about-email-input',
  },
  {
    type: 'text',
    name: 'phone',
    label: strings.questions.about.contact.phone[language],
    value: profileFormData.phone,
    id: 'academic-about-phone-input',
  },
  {
    type: 'text',
    name: 'websites',
    label: strings.questions.about.contact.websites[language],
    value: profileFormData.websites,
    id: 'academic-about-websites-input',
  },
  {
    type: 'autocomplete',
    name: 'languages',
    label: strings.questions.about.languages[language],
    value: profileFormData.languages || [],
    options: strings.languagesOptions.map((option) => ({
      value: option.value,
      label: option.label[language],
    })),
    id: 'academic-about-languages-autocomplete',
    multiple: true,
  },
  {
    type: 'text',
    name: 'otherAffiliations',
    label: strings.questions.main.otherAffiliations[language],
    value: profileFormData.otherAffiliations,
    id: 'academic-profile-otherAffiliations-input',
  },
];

export const getAcademicConnectionStyleFormConfig = ({
  profileFormData,
  strings,
  language,
}: AcademicFormConfigType) =>
  getConnectionStyleProfileFormConfig({
    mode: { id: 'academic' },
    strings: strings.connectionStyle,
    profileFormData,
    language,
    clearLabel: strings.clear[language],
  });

export const getAcademicProfileHighlightsFormConfig = ({
  profileFormData,
  strings,
  language,
}: AcademicFormConfigType) => [
  {
    type: 'text',
    name: 'summary',
    label: strings.questions.highlights.summary[language],
    value: profileFormData.summary,
    id: 'academic-highlights-summary-input',
    multiline: true,
  },
  {
    type: 'repeatingList',
    name: 'books',
    label: strings.questions.highlights.books[language],
    value: Array.isArray(profileFormData.books)
      ? (profileFormData.books as string[])
      : [],
    id: 'academic-highlights-books-input',
  },
  {
    type: 'repeatingList',
    name: 'papers',
    label: strings.questions.highlights.papers[language],
    value: Array.isArray(profileFormData.papers)
      ? (profileFormData.papers as string[])
      : [],
    id: 'academic-highlights-papers-input',
  },
  {
    type: 'repeatingList',
    name: 'awards',
    label: strings.questions.highlights.awards[language],
    value: Array.isArray(profileFormData.awards)
      ? (profileFormData.awards as string[])
      : [],
    id: 'academic-highlights-awards-input',
  },
  {
    type: 'repeatingList',
    name: 'accomplishments',
    label: strings.questions.highlights.accomplishments[language],
    value: Array.isArray(profileFormData.accomplishments)
      ? (profileFormData.accomplishments as string[])
      : [],
    id: 'academic-highlights-accomplishments-input',
  },
  {
    type: 'autocomplete',
    name: 'highlightSkills',
    label: strings.questions.highlights.skills[language],
    value: profileFormData.highlightSkills,
    options: strings.skillsOptions.map((option) => ({
      value: option.value,
      label: option.label[language],
    })),
    id: 'academic-highlightSkills-autocomplete',
    multiple: true,
  },
];

export const getAcademicProfileEducationFormConfig = ({
  profileFormData,
  strings,
  language,
  theme,
  educationFormData,
  addEducationData,
  clearEducationData,
  deleteEducationData,
  saveEducationData,
  setEducationFormData,
}: AcademicEducationFormConfigType) => [
  ...(profileFormData?.education?.length > 0
    ? profileFormData.education.map((educationItem) => {
        if (educationItem.id) {
          return {
            type: 'button',
            name: `educationItem-${educationItem.id}`,
            children: (
              <>
                <span>
                  {renderValue(language, educationItem.educationSchool)}
                </span>
                <span>
                  {renderValue(language, educationItem.educationDegree)}
                </span>
                <span>
                  {renderValue(language, educationItem.educationStartDate)}
                </span>
                <span>
                  {renderValue(language, educationItem.educationEndDate)}
                </span>
              </>
            ),
            id: `academic-education-select-${educationItem.id}-button`,
            onClick: () =>
              setEducationFormData && setEducationFormData(educationItem),
            sx: {
              display: 'grid',
              gridTemplateColumns: '50% 50%',
              width: '100%',
              background: theme?.palette.background.paper,
            },
          };
        }
      })
    : []),
  {
    type: 'text',
    name: 'educationSchool',
    label: strings.questions.education.school[language],
    value: educationFormData?.educationSchool || '',
    id: 'academic-educationSchool-input',
  },
  {
    type: 'text',
    name: 'educationDegree',
    label: strings.questions.education.degree[language],
    value: educationFormData?.educationDegree || '',
    id: 'academic-educationDegree-input',
  },
  {
    type: 'text',
    name: 'educationStartDate',
    label: strings.questions.education.startDate[language],
    value: educationFormData?.educationStartDate || '',
    id: 'academic-educationStartDate-input',
  },
  {
    type: 'text',
    name: 'educationEndDate',
    label: strings.questions.education.endDate[language],
    value: educationFormData?.educationEndDate || '',
    id: 'academic-educationEndDate-input',
  },
  ...(educationFormData?.id
    ? [
        {
          type: 'button',
          name: 'educationClear',
          children: strings.clear[language],
          id: 'academic-educationClear-button',
          onClick: clearEducationData,
          sx: {
            background: theme?.palette.info.main,
          },
          xs: 4,
        },
      ]
    : []),
  educationFormData?.id
    ? {
        type: 'button',
        name: 'educationSave',
        children: strings.save[language],
        id: 'academic-educationSave-button',
        onClick: () =>
          saveEducationData &&
          saveEducationData(
            educationFormData.id || profileFormData.education.length
          ),
        sx: {
          background: theme?.palette.success.main,
        },
        xs: 4,
      }
    : {
        type: 'button',
        name: 'educationAdd',
        children: strings.add[language],
        id: 'academic-educationAdd-button',
        onClick: addEducationData,
        sx: {
          background: theme?.palette.success.main,
        },
      },
  ...(educationFormData?.id
    ? [
        {
          type: 'button',
          name: 'educationDelete',
          children: strings.delete[language],
          id: 'academic-educationDelete-button',
          onClick: deleteEducationData,
          sx: {
            background: theme?.palette.error.main,
          },
          xs: 4,
        },
      ]
    : []),
];

export const getAcademicProfileJobHistoryFormConfig = ({
  profileFormData,
  jobHistoryFormData,
  strings,
  theme,
  language,
  addJobHistoryData,
  clearJobHistoryData,
  deleteJobHistoryData,
  saveJobHistoryData,
  setJobHistoryFormData,
}: AcademicFormConfigType) => [
  ...(profileFormData?.jobHistory?.length > 0
    ? profileFormData.jobHistory.map((jobHistoryItem) => {
        if (jobHistoryItem.id)
          return {
            type: 'button',
            name: `jobHistoryItem-${jobHistoryItem.id}`,
            children: (
              <>
                <span>
                  {renderValue(language, jobHistoryItem.jobHistoryEmployer)}
                </span>
                <span>
                  {renderValue(language, jobHistoryItem.jobHistoryTitle)}
                </span>
                <span>
                  {renderValue(language, jobHistoryItem.jobHistoryStartDate)}
                </span>
                <span>
                  {renderValue(language, jobHistoryItem.jobHistoryEndDate)}
                </span>
              </>
            ),
            id: `academic-education-select-${jobHistoryItem.id}-button`,
            onClick: () =>
              setJobHistoryFormData && setJobHistoryFormData(jobHistoryItem),
            sx: {
              display: 'grid',
              gridTemplateColumns: '50% 50%',
              width: '100%',
              background: theme?.palette.background.paper,
            },
          };
      })
    : []),
  {
    type: 'text',
    name: 'jobHistoryEmployer',
    label: strings.questions.jobHistory.employer[language],
    value: jobHistoryFormData?.jobHistoryEmployer || '',
    id: 'academic-jobHistoryEmployer-input',
  },
  {
    type: 'text',
    name: 'jobHistoryTitle',
    label: strings.questions.jobHistory.jobTitle[language],
    value: jobHistoryFormData?.jobHistoryTitle || '',
    id: 'academic-jobHistoryTitle-input',
  },
  {
    type: 'text',
    name: 'jobHistoryStartDate',
    label: strings.questions.jobHistory.startDate[language],
    value: jobHistoryFormData?.jobHistoryStartDate || '',
    id: 'academic-jobHistoryStartDate-input',
  },
  {
    type: 'text',
    name: 'jobHistoryEndDate',
    label: strings.questions.jobHistory.endDate[language],
    value: jobHistoryFormData?.jobHistoryEndDate || '',
    id: 'academic-jobHistoryEndDate-input',
  },
  {
    type: 'text',
    name: 'jobHistoryKeyPoints',
    label: strings.questions.jobHistory.keyPoints[language],
    value: jobHistoryFormData?.jobHistoryKeyPoints || '',
    id: 'academic-jobHistoryKeyPoints-input',
  },
  {
    type: 'autocomplete',
    name: 'jobHistorySkills',
    label: strings.questions.jobHistory.skills[language],
    value: jobHistoryFormData?.jobHistorySkills || [],
    options: strings.skillsOptions.map((option) => ({
      value: option.value,
      label: option.label[language],
    })),
    id: 'academic-jobHistorySkills-autocomplete',
    multiple: true,
  },
  ...(jobHistoryFormData?.id
    ? [
        {
          type: 'button',
          name: 'jobHistoryClear',
          children: strings.clear[language],
          id: 'academic-jobHistoryClear-button',
          onClick: clearJobHistoryData,
          sx: {
            background: theme?.palette.info.main,
          },
        },
      ]
    : []),
  jobHistoryFormData?.id
    ? {
        type: 'button',
        name: 'jobHistorySave',
        children: strings.save[language],
        id: 'academic-jobHistorySave-button',
        onClick: () =>
          saveJobHistoryData &&
          saveJobHistoryData(
            jobHistoryFormData.id || profileFormData.jobHistory.length
          ),
        sx: {
          background: theme?.palette.success.main,
        },
      }
    : {
        type: 'button',
        name: 'jobHistoryAdd',
        children: strings.add[language],
        id: 'academic-jobHistoryAdd-button',
        onClick: addJobHistoryData,
        sx: {
          background: theme?.palette.success.main,
        },
      },
  ...(jobHistoryFormData?.id
    ? [
        {
          type: 'button',
          name: 'jobHistoryDelete',
          children: strings.delete[language],
          id: 'academic-jobHistoryDelete-button',
          onClick: () => {
            const jobHistoryId = jobHistoryFormData.id;
            if (!jobHistoryId || !deleteJobHistoryData) return;
            deleteJobHistoryData(jobHistoryId);
          },
          sx: {
            background: theme?.palette.error.main,
          },
        },
      ]
    : []),
];

export const getAcademicProfileConferencesFormConfig = ({
  profileFormData,
  strings,
  language,
}: AcademicFormConfigType) => [
  {
    type: 'text',
    name: 'conferences',
    label: strings.questions.conferences.title[language],
    value: profileFormData.conferences,
    id: 'academic-profile-conferences-input',
  },
];
