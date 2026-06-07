import type {
  ConnectionStyleFormStringsType,
  ConnectionStyleStringsType,
  ProfileType,
  ModeType,
  CommonStringsType,
  ProfileStringsType,
  DatingProfileDataType,
  FriendsProfileDataType,
  AcademicProfileDataType,
  ProfessionalProfileDataType,
  NeighborhoodProfileDataType,
  EducationType,
  JobHistoryType,
  ConferencesType,
  ProfessionalMembershipsType,
} from '../../../types';
import type { FormElementConfigType } from '../../Common/FormElements';
import {
  blankDatingProfile,
  blankFriendProfile,
  blankNeighborhoodProfile,
  renderValue,
} from '../../../Utlilities';
import {
  getDatingBaseFormState,
  getDatingProfileAboutFormConfig,
  getDatingProfileHobbiesFormConfig,
  getDatingProfileHomeLifeFormConfig,
  getDatingProfileMainFormConfig,
  getDatingProfilePreferencesFormConfig,
  getDatingProfilePromptsFormConfig,
} from './DatingProfileConfig';
import {
  getFriendsBaseFormState,
  getFriendsProfileAboutFormConfig,
  getFriendsProfileHobbiesFormConfig,
  getFriendsProfileHomeLifeFormConfig,
  getFriendsProfileMainFormConfig,
  getFriendsProfilePreferencesFormConfig,
  getFriendsProfilePromptsFormConfig,
} from './FriendsProfileConfig';
import {
  getNeighborhoodBaseFormState,
  getNeighborhoodProfileAboutFormConfig,
  getNeighborhoodProfileHobbiesFormConfig,
  getNeighborhoodProfileHomeLifeFormConfig,
  getNeighborhoodProfileMainFormConfig,
  getNeighborhoodProfilePreferencesFormConfig,
} from './NeighborhoodProfileConfig';
import {
  getAcademicBaseFormState,
  getAcademicProfileAboutFormConfig,
  getAcademicProfileHighlightsFormConfig,
  getAcademicProfileMainFormConfig,
} from './AcademicProfileConfig';
import {
  getProfessionalBaseFormState,
  getProfessionalProfileAboutFormConfig,
  getProfessionalProfileHighlightsFormConfig,
  getProfessionalProfileMainFormConfig,
} from './ProfessionalProfileConfig';
import { getHobbiesOptions } from './ProfileFormHelper';

type ReadonlyProfileSectionType = {
  title?: string;
  config: FormElementConfigType[];
};

type ReadonlyFormConfigItem = FormElementConfigType & {
  InputProps?: Record<string, unknown>;
  disabled?: boolean;
  md?: number;
  multiline?: boolean;
  onClick?: (() => void) | undefined;
  sm?: number;
  trailingInput?: boolean;
  value?: unknown;
  xs?: number;
};

/**
 * Remove sections that have no visible config items.
 */
const filterEmptySections = (
  sections: ReadonlyProfileSectionType[]
): ReadonlyProfileSectionType[] =>
  sections.filter((section) => section.config.length > 0);

/**
 * Merge a partial object into stable defaults without letting undefined values
 * erase required readonly sections.
 */
const mergeDefinedObject = <T extends object>(
  defaults: T,
  value?: Partial<T>
): T => {
  const mergedValue = { ...defaults };
  if (!value) {
    return mergedValue;
  }

  (Object.keys(value) as Array<keyof T>).forEach((key) => {
    const nextValue = value[key];
    if (nextValue !== undefined) {
      mergedValue[key] = nextValue as T[keyof T];
    }
  });

  return mergedValue;
};

/**
 * Normalize dating discovery data so readonly rendering can tolerate omitted
 * nested sections from partially hydrated profiles.
 */
const normalizeDatingReadonlyProfile = (
  profile: ProfileType
): DatingProfileDataType => {
  const partialProfile = profile as Partial<DatingProfileDataType>;

  return {
    ...mergeDefinedObject(blankDatingProfile, partialProfile),
    main: mergeDefinedObject(blankDatingProfile.main, partialProfile.main),
    demographics: mergeDefinedObject(
      blankDatingProfile.demographics,
      partialProfile.demographics
    ),
    preferences: mergeDefinedObject(
      blankDatingProfile.preferences,
      partialProfile.preferences
    ),
    homeLife: mergeDefinedObject(
      blankDatingProfile.homeLife,
      partialProfile.homeLife
    ),
    hobbies: mergeDefinedObject(
      blankDatingProfile.hobbies,
      partialProfile.hobbies
    ),
    prompts: mergeDefinedObject(
      blankDatingProfile.prompts,
      partialProfile.prompts
    ),
  };
};

/**
 * Normalize friends discovery data so readonly rendering can tolerate omitted
 * nested sections from partially hydrated profiles.
 */
const normalizeFriendsReadonlyProfile = (
  profile: ProfileType
): FriendsProfileDataType => {
  const partialProfile = profile as Partial<FriendsProfileDataType>;

  return {
    ...mergeDefinedObject(blankFriendProfile, partialProfile),
    main: mergeDefinedObject(blankFriendProfile.main, partialProfile.main),
    demographics: mergeDefinedObject(
      blankFriendProfile.demographics,
      partialProfile.demographics
    ),
    preferences: mergeDefinedObject(
      blankFriendProfile.preferences,
      partialProfile.preferences
    ),
    homeLife: mergeDefinedObject(
      blankFriendProfile.homeLife,
      partialProfile.homeLife
    ),
    hobbies: mergeDefinedObject(
      blankFriendProfile.hobbies,
      partialProfile.hobbies
    ),
    prompts: mergeDefinedObject(
      blankFriendProfile.prompts,
      partialProfile.prompts
    ),
  };
};

/**
 * Normalize neighborhood discovery data so readonly rendering can tolerate
 * omitted nested sections from partially hydrated profiles.
 */
const normalizeNeighborhoodReadonlyProfile = (
  profile: ProfileType
): NeighborhoodProfileDataType => {
  const partialProfile = profile as Partial<NeighborhoodProfileDataType>;

  return {
    ...mergeDefinedObject(blankNeighborhoodProfile, partialProfile),
    main: mergeDefinedObject(
      blankNeighborhoodProfile.main,
      partialProfile.main
    ),
    demographics: mergeDefinedObject(
      blankNeighborhoodProfile.demographics,
      partialProfile.demographics
    ),
    preferences: mergeDefinedObject(
      blankNeighborhoodProfile.preferences,
      partialProfile.preferences
    ),
    homeLife: mergeDefinedObject(
      blankNeighborhoodProfile.homeLife,
      partialProfile.homeLife
    ),
    hobbies: mergeDefinedObject(
      blankNeighborhoodProfile.hobbies,
      partialProfile.hobbies
    ),
  };
};

/**
 * Create a read-only version of form config items.
 */
const toReadonlyConfig = (
  config: FormElementConfigType[]
): FormElementConfigType[] =>
  config
    .map((item) => {
      const readonlyItem = item as ReadonlyFormConfigItem;
      const isMultiline = Boolean(readonlyItem.multiline);
      return {
        ...readonlyItem,
        xs: readonlyItem.xs ?? (isMultiline ? 12 : 6),
        sm: readonlyItem.sm ?? (isMultiline ? 12 : 6),
        md: readonlyItem.md ?? (isMultiline ? 12 : 6),
        disabled: true,
        trailingInput: false,
        onClick: undefined,
        InputProps: {
          ...(readonlyItem.InputProps ?? {}),
          readOnly: true,
        },
      };
    })
    .filter((item) => {
      const readonlyItem = item as ReadonlyFormConfigItem;
      const hasValue = Object.prototype.hasOwnProperty.call(
        readonlyItem,
        'value'
      );
      if (!hasValue) {
        return true;
      }

      const value = readonlyItem.value;
      if (value === null || value === undefined) {
        return false;
      }
      if (typeof value === 'string') {
        return value.trim().length > 0;
      }
      if (Array.isArray(value)) {
        return value.length > 0;
      }

      return true;
    });

/**
 * Format education entries for readonly display.
 */
const formatEducation = (education: EducationType, language: string) =>
  education
    .map((item) =>
      [
        renderValue(language, item.educationSchool ?? ''),
        renderValue(language, item.educationDegree ?? ''),
        renderValue(language, item.educationStartDate ?? ''),
        renderValue(language, item.educationEndDate ?? ''),
      ]
        .filter((value) => value && `${value}`.length > 0)
        .join(' • ')
    )
    .join('\n');

/**
 * Format job history entries for readonly display.
 */
const formatJobHistory = (jobHistory: JobHistoryType, language: string) =>
  jobHistory
    .map((item) =>
      [
        renderValue(language, item.jobHistoryEmployer ?? ''),
        renderValue(language, item.jobHistoryTitle ?? ''),
        renderValue(language, item.jobHistoryStartDate ?? ''),
        renderValue(language, item.jobHistoryEndDate ?? ''),
      ]
        .filter((value) => value && `${value}`.length > 0)
        .join(' • ')
    )
    .join('\n');

/**
 * Format conference entries for readonly display.
 */
const formatConferences = (conferences: ConferencesType, language: string) =>
  conferences
    .map((item) =>
      [
        renderValue(language, item.name ?? ''),
        renderValue(language, item.role ?? ''),
        renderValue(language, item.location ?? ''),
        renderValue(language, item.date ?? ''),
      ]
        .filter((value) => value && `${value}`.length > 0)
        .join(' • ')
    )
    .join('\n');

/**
 * Format professional memberships for readonly display.
 */
const formatMemberships = (
  memberships: ProfessionalMembershipsType,
  language: string
) =>
  memberships
    .map((item) =>
      [
        renderValue(language, item.organization ?? ''),
        renderValue(language, item.membershipType ?? ''),
        renderValue(language, item.since ?? ''),
      ]
        .filter((value) => value && `${value}`.length > 0)
        .join(' • ')
    )
    .join('\n');

/**
 * Build read-only profile sections for the active mode without requiring
 * `PeopleCard` to import the edit-time profile config modules directly.
 */
export const buildReadonlyProfileSections = ({
  profile,
  mode,
  profileStrings,
  commonStrings,
  connectionStyleStrings,
  language,
}: {
  profile: ProfileType;
  mode: ModeType;
  profileStrings: ProfileStringsType;
  commonStrings: CommonStringsType;
  connectionStyleStrings: ConnectionStyleStringsType;
  language: string;
}): ReadonlyProfileSectionType[] => {
  const commonProfileStrings = profileStrings.common;

  if (mode.id === 'dating') {
    const modeStrings = profileStrings.dating;
    const modeFormStrings = {
      ...commonProfileStrings,
      ...modeStrings,
      ...commonStrings,
      connectionStyle: connectionStyleStrings.dating,
      connectionStyleCommon: connectionStyleStrings.common,
    } as ProfileStringsType['dating'] &
      ProfileStringsType['common'] &
      ConnectionStyleFormStringsType &
      CommonStringsType;
    const typedProfile = normalizeDatingReadonlyProfile(profile);
    const fullHobbies = typedProfile.hobbies.full ?? [];
    const hobbiesOptions = getHobbiesOptions({
      strings: modeFormStrings,
      fullHobbies,
      language,
    });
    const profileFormData = getDatingBaseFormState({
      useProfile: typedProfile,
      hobbiesOptions,
    });
    return filterEmptySections([
      {
        config: toReadonlyConfig(
          getDatingProfileMainFormConfig({
            strings: modeFormStrings,
            profileFormData,
            language,
          })
        ),
      },
      {
        title: modeStrings.questions.demographics.title[language],
        config: toReadonlyConfig(
          getDatingProfileAboutFormConfig({
            strings: modeFormStrings,
            profileFormData,
            language,
          })
        ),
      },
      {
        title: modeStrings.questions.hobbies.title[language],
        config: toReadonlyConfig(
          getDatingProfileHobbiesFormConfig({
            strings: modeFormStrings,
            profileFormData,
            language,
          })
        ),
      },
      {
        title: modeStrings.questions.preferences.title[language],
        config: toReadonlyConfig(
          getDatingProfilePreferencesFormConfig({
            strings: modeFormStrings,
            profileFormData,
            language,
          })
        ),
      },
      {
        title: modeStrings.questions.homeLife.title[language],
        config: toReadonlyConfig(
          getDatingProfileHomeLifeFormConfig({
            strings: modeFormStrings,
            profileFormData,
            language,
          })
        ),
      },
      {
        title: modeStrings.questions.prompts.title[language],
        config: toReadonlyConfig(
          getDatingProfilePromptsFormConfig({
            strings: modeFormStrings,
            profileFormData,
            language,
          })
        ),
      },
    ]);
  }

  if (mode.id === 'friends') {
    const modeStrings = profileStrings.friends;
    const modeFormStrings = {
      ...commonProfileStrings,
      ...modeStrings,
      ...commonStrings,
      connectionStyle: connectionStyleStrings.friends,
      connectionStyleCommon: connectionStyleStrings.common,
    } as ProfileStringsType['friends'] &
      ProfileStringsType['common'] &
      ConnectionStyleFormStringsType &
      CommonStringsType;
    const typedProfile = normalizeFriendsReadonlyProfile(profile);
    const fullHobbies = typedProfile.hobbies.full ?? [];
    const hobbiesOptions = getHobbiesOptions({
      strings: modeFormStrings,
      fullHobbies,
      language,
    });
    const profileFormData = getFriendsBaseFormState({
      useProfile: typedProfile,
      hobbiesOptions,
    });
    return filterEmptySections([
      {
        config: toReadonlyConfig(
          getFriendsProfileMainFormConfig({
            strings: modeFormStrings,
            profileFormData,
            language,
          })
        ),
      },
      {
        title: modeStrings.questions.demographics.title[language],
        config: toReadonlyConfig(
          getFriendsProfileAboutFormConfig({
            strings: modeFormStrings,
            profileFormData,
            language,
          })
        ),
      },
      {
        title: modeStrings.questions.hobbies.title[language],
        config: toReadonlyConfig(
          getFriendsProfileHobbiesFormConfig({
            strings: modeFormStrings,
            profileFormData,
            language,
          })
        ),
      },
      {
        title: modeStrings.questions.preferences.title[language],
        config: toReadonlyConfig(
          getFriendsProfilePreferencesFormConfig({
            strings: modeFormStrings,
            profileFormData,
            language,
          })
        ),
      },
      {
        title: modeStrings.questions.homeLife.title[language],
        config: toReadonlyConfig(
          getFriendsProfileHomeLifeFormConfig({
            strings: modeFormStrings,
            profileFormData,
            language,
          })
        ),
      },
      {
        title: modeStrings.questions.prompts.title[language],
        config: toReadonlyConfig(
          getFriendsProfilePromptsFormConfig({
            strings: modeFormStrings,
            profileFormData,
            language,
          })
        ),
      },
    ]);
  }

  if (mode.id === 'academic') {
    const modeStrings = profileStrings.academic;
    const modeFormStrings = {
      ...commonProfileStrings,
      ...modeStrings,
      ...commonStrings,
      connectionStyle: connectionStyleStrings.academic,
      connectionStyleCommon: connectionStyleStrings.common,
    } as ProfileStringsType['academic'] &
      ProfileStringsType['common'] &
      ConnectionStyleFormStringsType &
      CommonStringsType;
    const typedProfile = profile as AcademicProfileDataType;
    const profileFormData = getAcademicBaseFormState({
      useProfile: typedProfile,
    });
    const educationText = formatEducation(
      profileFormData.education ?? [],
      language
    );
    const jobHistoryText = formatJobHistory(
      profileFormData.jobHistory ?? [],
      language
    );
    const conferencesText = formatConferences(
      profileFormData.conferences ?? [],
      language
    );
    const membershipsText = formatMemberships(
      profileFormData.memberships ?? [],
      language
    );
    return filterEmptySections([
      {
        config: toReadonlyConfig(
          getAcademicProfileMainFormConfig({
            strings: modeFormStrings,
            profileFormData,
            language,
          })
        ),
      },
      {
        title: modeStrings.questions.about.title[language],
        config: toReadonlyConfig(
          getAcademicProfileAboutFormConfig({
            strings: modeFormStrings,
            profileFormData,
            language,
          })
        ),
      },
      {
        title: modeStrings.questions.highlights.title[language],
        config: toReadonlyConfig(
          getAcademicProfileHighlightsFormConfig({
            strings: modeFormStrings,
            profileFormData,
            language,
          })
        ),
      },
      {
        title: modeStrings.questions.education.title[language],
        config: toReadonlyConfig([
          {
            type: 'text',
            name: 'education',
            label: modeStrings.questions.education.title[language],
            value: educationText,
            id: 'academic-profile-education-readonly',
            multiline: true,
            md: 12,
          },
        ]),
      },
      {
        title: modeStrings.questions.jobHistory.title[language],
        config: toReadonlyConfig([
          {
            type: 'text',
            name: 'jobHistory',
            label: modeStrings.questions.jobHistory.title[language],
            value: jobHistoryText,
            id: 'academic-profile-jobHistory-readonly',
            multiline: true,
            md: 12,
          },
        ]),
      },
      {
        title: modeStrings.questions.conferences.title[language],
        config: toReadonlyConfig([
          {
            type: 'text',
            name: 'conferences',
            label: modeStrings.questions.conferences.title[language],
            value: conferencesText,
            id: 'academic-profile-conferences-readonly',
            multiline: true,
            md: 12,
          },
        ]),
      },
      {
        title: modeStrings.questions.professionalMemberships.title[language],
        config: toReadonlyConfig([
          {
            type: 'text',
            name: 'professionalMemberships',
            label:
              modeStrings.questions.professionalMemberships.title[language],
            value: membershipsText,
            id: 'academic-profile-memberships-readonly',
            multiline: true,
            md: 12,
          },
        ]),
      },
    ]);
  }

  if (mode.id === 'professional') {
    const modeStrings = profileStrings.professional;
    const modeFormStrings = {
      ...commonProfileStrings,
      ...modeStrings,
      ...commonStrings,
      connectionStyle: connectionStyleStrings.professional,
      connectionStyleCommon: connectionStyleStrings.common,
    } as ProfileStringsType['professional'] &
      ProfileStringsType['common'] &
      ConnectionStyleFormStringsType &
      CommonStringsType;
    const typedProfile = profile as ProfessionalProfileDataType;
    const profileFormData = getProfessionalBaseFormState({
      useProfile: typedProfile,
    });
    const educationText = formatEducation(
      profileFormData.education ?? [],
      language
    );
    const jobHistoryText = formatJobHistory(
      profileFormData.jobHistory ?? [],
      language
    );
    const membershipsText = formatMemberships(
      profileFormData.memberships ?? [],
      language
    );
    return filterEmptySections([
      {
        config: toReadonlyConfig(
          getProfessionalProfileMainFormConfig({
            strings: modeFormStrings,
            profileFormData,
            language,
          })
        ),
      },
      {
        title: modeStrings.questions.about.title[language],
        config: toReadonlyConfig(
          getProfessionalProfileAboutFormConfig({
            strings: modeFormStrings,
            profileFormData,
            language,
          })
        ),
      },
      {
        title: modeStrings.questions.highlights.title[language],
        config: toReadonlyConfig(
          getProfessionalProfileHighlightsFormConfig({
            strings: modeFormStrings,
            profileFormData,
            language,
          })
        ),
      },
      {
        title: modeStrings.questions.education.title[language],
        config: toReadonlyConfig([
          {
            type: 'text',
            name: 'education',
            label: modeStrings.questions.education.title[language],
            value: educationText,
            id: 'professional-profile-education-readonly',
            multiline: true,
            md: 12,
          },
        ]),
      },
      {
        title: modeStrings.questions.jobHistory.title[language],
        config: toReadonlyConfig([
          {
            type: 'text',
            name: 'jobHistory',
            label: modeStrings.questions.jobHistory.title[language],
            value: jobHistoryText,
            id: 'professional-profile-jobHistory-readonly',
            multiline: true,
            md: 12,
          },
        ]),
      },
      {
        title: modeStrings.questions.professionalMemberships.title[language],
        config: toReadonlyConfig([
          {
            type: 'text',
            name: 'professionalMemberships',
            label:
              modeStrings.questions.professionalMemberships.title[language],
            value: membershipsText,
            id: 'professional-profile-memberships-readonly',
            multiline: true,
            md: 12,
          },
        ]),
      },
    ]);
  }

  const modeStrings = profileStrings.neighborhood;
  const modeFormStrings = {
    ...commonProfileStrings,
    ...modeStrings,
    ...commonStrings,
    connectionStyle: connectionStyleStrings.neighborhood,
    connectionStyleCommon: connectionStyleStrings.common,
  } as ProfileStringsType['neighborhood'] &
    ProfileStringsType['common'] &
    ConnectionStyleFormStringsType &
    CommonStringsType;
  const typedProfile = normalizeNeighborhoodReadonlyProfile(profile);
  const fullHobbies = typedProfile.hobbies.full ?? [];
  const hobbiesOptions = getHobbiesOptions({
    strings: modeFormStrings,
    fullHobbies,
    language,
  });
  const profileFormData = getNeighborhoodBaseFormState({
    useProfile: typedProfile,
    hobbiesOptions,
  });

  return filterEmptySections([
    {
      config: toReadonlyConfig(
        getNeighborhoodProfileMainFormConfig({
          strings: modeFormStrings,
          profileFormData,
          language,
        })
      ),
    },
    {
      title: modeStrings.questions.demographics.title[language],
      config: toReadonlyConfig(
        getNeighborhoodProfileAboutFormConfig({
          strings: modeFormStrings,
          profileFormData,
          language,
        })
      ),
    },
    {
      title: modeStrings.questions.hobbies.title[language],
      config: toReadonlyConfig(
        getNeighborhoodProfileHobbiesFormConfig({
          strings: modeFormStrings,
          profileFormData,
          language,
        })
      ),
    },
    {
      title: modeStrings.questions.preferences.title[language],
      config: toReadonlyConfig(
        getNeighborhoodProfilePreferencesFormConfig({
          strings: modeFormStrings,
          profileFormData,
          language,
        })
      ),
    },
    {
      title: modeStrings.questions.homeLife.title[language],
      config: toReadonlyConfig(
        getNeighborhoodProfileHomeLifeFormConfig({
          strings: modeFormStrings,
          profileFormData,
          language,
        })
      ),
    },
  ]);
};
