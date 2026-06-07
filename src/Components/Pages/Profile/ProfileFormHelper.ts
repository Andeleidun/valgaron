import {
  OpenStringsOrOptionsType,
  AcademicProfileFormDataType,
  ProfessionalProfileFormDataType,
  EducationType,
  JobHistoryType,
  HobbiesOptionsType,
  HobbiesType,
  JobHistoryItemType,
  EducationItemType,
  ModeType,
  TranslationStringType,
} from '../../../types';
import {
  blankEducationData,
  blankJobHistoryData,
  renderValue,
} from '../../../Utlilities';

export type AcademicOrProfessionalProfileFormDataType =
  | AcademicProfileFormDataType
  | ProfessionalProfileFormDataType;

export type DataSetType =
  | AcademicOrProfessionalProfileFormDataType
  | EducationItemType
  | JobHistoryItemType;

export type AddEducationDataType = (arg: {
  profileFormData: AcademicOrProfessionalProfileFormDataType;
  educationFormData: EducationItemType;
  language: string;
}) => EducationType;

export type DeleteEducationDataType = (arg: {
  profileFormData: AcademicOrProfessionalProfileFormDataType;
  id: number;
}) => EducationType;

export type SaveEducationDataType = (arg: {
  profileFormData: AcademicOrProfessionalProfileFormDataType;
  educationFormData: EducationItemType;
  id: number;
}) => EducationType;

export type AddJobHistoryDataType = (arg: {
  profileFormData: AcademicOrProfessionalProfileFormDataType;
  jobHistoryFormData: JobHistoryItemType;
  language: string;
}) => JobHistoryType;

export type DeleteJobHistoryDataType = (arg: {
  profileFormData: AcademicOrProfessionalProfileFormDataType;
  id: number;
}) => JobHistoryType;

export type SaveJobHistoryDataType = (arg: {
  profileFormData: AcademicOrProfessionalProfileFormDataType;
  jobHistoryFormData: JobHistoryItemType;
  id: number;
}) => JobHistoryType;

export type GetHobbiesOptionsType = (arg: {
  strings: {
    hobbiesOptions: Array<{ value: string; label: TranslationStringType }>;
  };
  fullHobbies: HobbiesType['full'];
  language: string;
  allowedValues?: string[];
}) => HobbiesOptionsType;

/**
 * Return a curated list of hobby values per mode.
 */
export const getModeHobbyValues = (modeId: ModeType['id']): string[] => {
  const optionsByMode: Record<ModeType['id'], string[]> = {
    friends: [
      'reading',
      'traveling',
      'cooking',
      'gardening',
      'biking',
      'hiking',
      'painting',
      'drawing',
      'yoga',
      'photography',
      'dancing',
      'fitness',
      'video_games',
      'tabletop_games',
      'board_games',
      'music',
      'watching_movies',
      'watching_tv_shows',
      'crafts',
      'fishing',
      'knitting',
      'sewing',
      'running',
      'swimming',
      'camping',
      'kayaking',
      'climbing',
      'skiing',
      'tennis',
      'soccer',
      'basketball',
      'volunteering',
      'museums',
      'live_music',
    ],
    dating: [
      'traveling',
      'cooking',
      'hiking',
      'yoga',
      'photography',
      'dancing',
      'fitness',
      'music',
      'watching_movies',
      'watching_tv_shows',
      'reading',
      'gardening',
      'painting',
      'running',
      'swimming',
      'camping',
      'kayaking',
      'climbing',
      'tennis',
      'museums',
      'live_music',
      'volunteering',
      'soccer',
    ],
    academic: [
      'reading',
      'traveling',
      'photography',
      'music',
      'painting',
      'drawing',
      'crafts',
      'hiking',
      'museums',
      'live_music',
      'volunteering',
      'running',
      'swimming',
      'camping',
      'kayaking',
      'climbing',
      'tennis',
      'watching_movies',
      'watching_tv_shows',
    ],
    professional: [
      'reading',
      'traveling',
      'fitness',
      'music',
      'photography',
      'cooking',
      'gardening',
      'running',
      'swimming',
      'tennis',
      'museums',
      'live_music',
      'volunteering',
      'hiking',
      'camping',
      'kayaking',
      'climbing',
    ],
    neighborhood: [
      'gardening',
      'biking',
      'hiking',
      'cooking',
      'crafts',
      'fishing',
      'fitness',
      'yoga',
      'photography',
      'watching_movies',
      'running',
      'swimming',
      'camping',
      'kayaking',
      'climbing',
      'soccer',
      'basketball',
      'volunteering',
      'museums',
      'live_music',
    ],
  };
  return optionsByMode[modeId];
};

export const baseAddEducationData: AddEducationDataType = ({
  profileFormData,
  educationFormData,
  language,
}) => {
  const isPrevData = profileFormData?.education?.length > 0;
  const max = isPrevData
    ? profileFormData.education.reduce(
        (prev, current) =>
          (prev.id ?? 0) > (current.id ?? 0) ? prev : current,
        blankEducationData
      ).id ?? 0
    : 0;
  const id = max + 1;
  const toKeep = Object.keys(blankEducationData);
  const addEducation = Object.fromEntries(
    Object.entries({
      ...educationFormData,
      id,
    }).filter(([key, value]) => {
      const useValue = value as number | OpenStringsOrOptionsType;
      return toKeep.includes(key) && !!useValue && typeof useValue !== 'number'
        ? renderValue(language, useValue).length > 0
        : (value as number) > 0;
    })
  );
  const newEducationData = isPrevData
    ? [...profileFormData.education, addEducation]
    : [addEducation];
  return newEducationData;
};

export const baseDeleteEducationData: DeleteEducationDataType = ({
  profileFormData,
  id,
}) => {
  const newEducationData = profileFormData.education.filter(
    (item) => item.id !== id
  );
  return newEducationData;
};

export const baseSaveEducationData: SaveEducationDataType = ({
  profileFormData,
  educationFormData,
  id,
}) => {
  const newEducationFormData = { ...educationFormData, id };
  const newEducationData = [
    ...profileFormData.education.filter((item) => item.id !== id),
    newEducationFormData,
  ];
  return newEducationData;
};

export const baseAddJobHistoryData: AddJobHistoryDataType = ({
  profileFormData,
  jobHistoryFormData,
  language,
}) => {
  const isPrevData = profileFormData?.jobHistory?.length > 0;
  const max = isPrevData
    ? profileFormData.jobHistory.reduce(
        (prev, current) =>
          (prev.id ?? 0) > (current.id ?? 0) ? prev : current,
        blankEducationData
      ).id ?? 0
    : 0;
  const id = max + 1;
  const toKeep = Object.keys(blankJobHistoryData);
  const addJobHistory = Object.fromEntries(
    Object.entries({
      ...jobHistoryFormData,
      id,
    }).filter(([key, value]) =>
      toKeep.includes(key) && !!value && typeof value !== 'number'
        ? renderValue(language, value).length > 0
        : (value as number) > 0
    )
  );
  const newJobHistoryData = isPrevData
    ? [...profileFormData.jobHistory, addJobHistory]
    : [addJobHistory];
  return newJobHistoryData;
};

export const baseDeleteJobHistoryData: DeleteJobHistoryDataType = ({
  profileFormData,
  id,
}) => {
  const newJobHistoryData = profileFormData.jobHistory.filter(
    (item) => item.id !== id
  );
  return newJobHistoryData;
};

export const baseSaveJobHistoryData: SaveJobHistoryDataType = ({
  profileFormData,
  jobHistoryFormData,
  id,
}) => {
  const newJobHistoryFormData = { ...jobHistoryFormData, id };
  const newJobHistoryData = [
    ...profileFormData.jobHistory.filter((item) => item.id !== id),
    newJobHistoryFormData,
  ];
  return newJobHistoryData;
};

export const getHobbiesOptions: GetHobbiesOptionsType = ({
  strings,
  fullHobbies,
  language,
  allowedValues,
}) => {
  const baseOptions = allowedValues
    ? strings.hobbiesOptions.filter((option) =>
        allowedValues.includes(option.value)
      )
    : strings.hobbiesOptions;

  return [
    ...baseOptions.map((option) => ({
      value: option.value,
      label: option.label[language],
    })),
    ...(fullHobbies
      ? fullHobbies
          .filter((option) =>
            baseOptions.every(
              (hobby) =>
                renderValue(language, option).toLocaleLowerCase() !==
                  hobby.value.toLocaleLowerCase() &&
                renderValue(language, option).toLocaleLowerCase() !==
                  hobby.label[language].toLocaleLowerCase()
            )
          )
          .map((option) => ({
            value: option,
            label: option,
          }))
      : []),
  ];
};
