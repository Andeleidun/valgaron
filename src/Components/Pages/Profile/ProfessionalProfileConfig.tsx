import {
  GetProfessionalBaseFormStateType,
  GetProfessionalProfileSubmissionType,
  ProfessionalFormConfigType,
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

export const getProfessionalBaseFormState: GetProfessionalBaseFormStateType = ({
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
    location: main?.location ?? '',
    seeking: main?.seeking ?? [],
    pronouns: main?.pronouns ?? '',
    tagline: main?.tagline ?? '',
    education: useProfile.education ?? [],
    jobHistory: useProfile.jobHistory ?? [],
    conferences: useProfile.conferences ?? [],
    memberships: useProfile.professionalMemberships ?? [],
  };
};

export const getProfessionalProfileSubmission: GetProfessionalProfileSubmissionType =
  ({ useProfile, profileFormData }) => ({
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

export const getProfessionalProfileMainFormConfig = ({
  strings,
  profileFormData,
  language,
}: ProfessionalFormConfigType) => [
  {
    type: 'text',
    name: 'name',
    label: strings.questions.name[language],
    value: profileFormData.name,
    id: 'professional-profile-name-input',
    md: 12,
    hidePrivacyControl: true,
  },
  {
    type: 'text',
    name: 'tagline',
    label: strings.questions.main.tagline[language],
    value: profileFormData.tagline,
    id: 'professional-profile-tagline-input',
  },
  {
    type: 'text',
    name: 'location',
    label: strings.questions.main.location[language],
    value: profileFormData.location,
    id: 'professional-profile-location-input',
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
    id: 'professional-profile-seeking-autocomplete',
    multiple: true,
    md: 12,
  },
];

export const getProfessionalProfileAboutFormConfig = ({
  profileFormData,
  strings,
  language,
}: ProfessionalFormConfigType) => [
  {
    type: 'autocomplete',
    name: 'pronouns',
    label: strings.questions.main.pronouns[language],
    value: profileFormData.pronouns,
    options: strings.pronounsOptions.map((option) => ({
      value: option.value,
      label: option.label[language],
    })),
    id: 'professional-profile-pronouns-autocomplete',
  },
  {
    type: 'text',
    name: 'email',
    label: strings.questions.about.contact.email[language],
    value: profileFormData.email,
    id: 'professional-about-email-input',
  },
  {
    type: 'text',
    name: 'phone',
    label: strings.questions.about.contact.phone[language],
    value: profileFormData.phone,
    id: 'professional-about-phone-input',
  },
  {
    type: 'text',
    name: 'websites',
    label: strings.questions.about.contact.websites[language],
    value: profileFormData.websites,
    id: 'professional-about-websites-input',
  },
  {
    type: 'autocomplete',
    name: 'languages',
    label: strings.questions.about.languages[language],
    value: profileFormData.languages,
    options: strings.languagesOptions.map((option) => ({
      value: option.value,
      label: option.label[language],
    })),
    id: 'professional-about-languages-autocomplete',
    multiple: true,
  },
];

export const getProfessionalConnectionStyleFormConfig = ({
  profileFormData,
  strings,
  language,
}: ProfessionalFormConfigType) =>
  getConnectionStyleProfileFormConfig({
    mode: { id: 'professional' },
    strings: strings.connectionStyle,
    profileFormData,
    language,
    clearLabel: strings.clear[language],
  });

export const getProfessionalProfileHighlightsFormConfig = ({
  profileFormData,
  strings,
  language,
}: ProfessionalFormConfigType) => [
  {
    type: 'text',
    name: 'summary',
    label: strings.questions.highlights.summary[language],
    value: profileFormData.summary,
    id: 'professional-highlights-summary-input',
  },
  {
    type: 'repeatingList',
    name: 'books',
    label: strings.questions.highlights.books[language],
    value: Array.isArray(profileFormData.books)
      ? (profileFormData.books as string[])
      : [],
    id: 'professional-highlights-books-input',
  },
  {
    type: 'repeatingList',
    name: 'papers',
    label: strings.questions.highlights.papers[language],
    value: Array.isArray(profileFormData.papers)
      ? (profileFormData.papers as string[])
      : [],
    id: 'professional-highlights-papers-input',
  },
  {
    type: 'repeatingList',
    name: 'awards',
    label: strings.questions.highlights.awards[language],
    value: Array.isArray(profileFormData.awards)
      ? (profileFormData.awards as string[])
      : [],
    id: 'professional-highlights-awards-input',
  },
  {
    type: 'repeatingList',
    name: 'accomplishments',
    label: strings.questions.highlights.accomplishments[language],
    value: Array.isArray(profileFormData.accomplishments)
      ? (profileFormData.accomplishments as string[])
      : [],
    id: 'professional-highlights-accomplishments-input',
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
    id: 'professional-highlightSkills-autocomplete',
    multiple: true,
  },
];

export const getProfessionalProfileJobHistoryFormConfig = ({
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
}: ProfessionalFormConfigType) => [
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
    value: jobHistoryFormData?.jobHistoryEmployer ?? '',
    id: 'professional-jobHistoryEmployer-input',
  },
  {
    type: 'text',
    name: 'jobHistoryTitle',
    label: strings.questions.jobHistory.jobTitle[language],
    value: jobHistoryFormData?.jobHistoryTitle ?? '',
    id: 'professional-jobHistoryTitle-input',
  },
  {
    type: 'text',
    name: 'jobHistoryStartDate',
    label: strings.questions.jobHistory.startDate[language],
    value: jobHistoryFormData?.jobHistoryStartDate ?? '',
    id: 'professional-jobHistoryStartDate-input',
  },
  {
    type: 'text',
    name: 'jobHistoryEndDate',
    label: strings.questions.jobHistory.endDate[language],
    value: jobHistoryFormData?.jobHistoryEndDate ?? '',
    id: 'professional-jobHistoryEndDate-input',
  },
  {
    type: 'text',
    name: 'jobHistoryKeyPoints',
    label: strings.questions.jobHistory.keyPoints[language],
    value: jobHistoryFormData?.jobHistoryKeyPoints ?? '',
    id: 'professional-jobHistoryKeyPoints-input',
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
    id: 'professional-jobHistorySkills-autocomplete',
    multiple: true,
  },
  ...(jobHistoryFormData?.id
    ? [
        {
          type: 'button',
          name: 'jobHistoryClear',
          children: strings.clear[language],
          id: 'professional-jobHistoryClear-button',
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
        id: 'professional-jobHistorySave-button',
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
        id: 'professional-jobHistoryAdd-button',
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
          id: 'professional-jobHistoryDelete-button',
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

export const getProfessionalProfileEducationFormConfig = ({
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
}: ProfessionalFormConfigType) => [
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
            id: `professional-education-select-${educationItem.id}-button`,
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
    value: educationFormData?.educationSchool ?? '',
    id: 'professional-educationSchool-input',
  },
  {
    type: 'text',
    name: 'educationDegree',
    label: strings.questions.education.degree[language],
    value: educationFormData?.educationDegree ?? '',
    id: 'professional-educationDegree-input',
  },
  {
    type: 'text',
    name: 'educationStartDate',
    label: strings.questions.education.startDate[language],
    value: educationFormData?.educationStartDate ?? '',
    id: 'professional-educationStartDate-input',
  },
  {
    type: 'text',
    name: 'educationEndDate',
    label: strings.questions.education.endDate[language],
    value: educationFormData?.educationEndDate ?? '',
    id: 'professional-educationEndDate-input',
  },
  ...(educationFormData?.id
    ? [
        {
          type: 'button',
          name: 'educationClear',
          children: strings.clear[language],
          id: 'professional-educationClear-button',
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
        id: 'professional-educationSave-button',
        onClick: () =>
          saveEducationData && saveEducationData(educationFormData.id ?? 0),
        sx: {
          background: theme?.palette.success.main,
        },
        xs: 4,
      }
    : {
        type: 'button',
        name: 'educationAdd',
        children: strings.add[language],
        id: 'professional-educationAdd-button',
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
          id: 'professional-educationDelete-button',
          onClick: () => {
            const educationId = educationFormData.id;
            if (!educationId || !deleteEducationData) return;
            deleteEducationData(educationId);
          },
          sx: {
            background: theme?.palette.error.main,
          },
          xs: 4,
        },
      ]
    : []),
];
