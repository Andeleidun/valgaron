import type {
  AcademicProfileFormDataType,
  DatingProfileFormDataType,
  FriendsProfileFormDataType,
  ModeType,
  NeighborhoodProfileFormDataType,
  ProfessionalProfileFormDataType,
} from '../../../types';
import fetchTranslations from '../../../Utlilities/translations';

/**
 * Validation error map keyed by form field name.
 */
export type ProfileValidationErrors<T extends object> = Partial<
  Record<Extract<keyof T, string>, string>
>;

/**
 * Supported profile form data by mode.
 */
export type ProfileFormDataByMode = {
  friends: FriendsProfileFormDataType;
  dating: DatingProfileFormDataType;
  neighborhood: NeighborhoodProfileFormDataType;
  academic: AcademicProfileFormDataType;
  professional: ProfessionalProfileFormDataType;
};

/**
 * Resolve the current UI language from persisted user settings.
 */
const getProfileValidationLanguage = (): string => {
  if (typeof window === 'undefined' || !window.localStorage) {
    return 'en';
  }
  const rawUserProfile = window.localStorage.getItem('userProfile');
  if (!rawUserProfile) {
    return 'en';
  }
  try {
    const parsedProfile = JSON.parse(rawUserProfile) as {
      userSettings?: { language?: string };
    };
    return parsedProfile.userSettings?.language === 'es' ? 'es' : 'en';
  } catch {
    return 'en';
  }
};

/**
 * Read a translated validation message from the shared translation source.
 */
const getValidationText = (key: string): string => {
  const translations = fetchTranslations().common;
  const language = getProfileValidationLanguage();
  return translations[key]?.[language] ?? translations[key]?.en ?? '';
};

/**
 * Narrow object-like values for required checks.
 */
const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

/**
 * Resolve a primitive display value from mixed string/option payloads.
 */
const readTextValue = (value: unknown): string => {
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number') return `${value}`.trim();
  if (Array.isArray(value)) {
    return value
      .map((entry) => readTextValue(entry))
      .filter((entry) => entry.length > 0)
      .join(',');
  }
  if (isRecord(value)) {
    if (typeof value.value === 'string') return value.value.trim();
    if (typeof value.label === 'string') return value.label.trim();
  }
  return '';
};

/**
 * Check whether a field has a non-empty value.
 */
const hasValue = (value: unknown): boolean => readTextValue(value).length > 0;

/**
 * Check whether a list contains at least one meaningful entry.
 */
const hasMeaningfulListValue = (value: unknown): boolean =>
  Array.isArray(value)
    ? value.some((entry) => readTextValue(entry).length > 0)
    : readTextValue(value).length > 0;

/**
 * Check whether a profile has at least one usable photo reference.
 */
const hasUsablePhoto = (value: unknown): boolean =>
  Array.isArray(value) &&
  value.some((entry) => typeof entry === 'string' && entry.trim().length > 0);

/**
 * Check whether at least one contact method is present.
 */
const hasContactMethod = (data: {
  email?: unknown;
  phone?: unknown;
  websites?: unknown;
}): boolean =>
  hasValue(data.email) ||
  hasValue(data.phone) ||
  hasMeaningfulListValue(data.websites);

/**
 * Check whether a profile includes enough highlight content to be useful.
 */
const hasHighlightContent = (data: {
  summary?: unknown;
  highlightSkills?: unknown;
  accomplishments?: unknown;
  papers?: unknown;
  books?: unknown;
  awards?: unknown;
  projects?: unknown;
}): boolean =>
  hasValue(data.summary) ||
  hasMeaningfulListValue(data.highlightSkills) ||
  hasMeaningfulListValue(data.accomplishments) ||
  hasMeaningfulListValue(data.papers) ||
  hasMeaningfulListValue(data.books) ||
  hasMeaningfulListValue(data.awards) ||
  hasMeaningfulListValue(data.projects);

/**
 * Check whether a social profile includes enough self-description to be useful.
 */
const hasSocialSummary = (data: {
  selfSummary?: unknown;
  currentGoal?: unknown;
}): boolean => hasValue(data.selfSummary) || hasValue(data.currentGoal);

/**
 * Validate age-like values after string/number coercion.
 */
const validateAge = (value: unknown): string | null => {
  const text = readTextValue(value);
  if (text.length === 0) return getValidationText('validationAgeRequired');
  const numericAge = Number(text);
  if (!Number.isFinite(numericAge))
    return getValidationText('validationAgeNumber');
  if (numericAge < 1 || numericAge > 120) {
    return getValidationText('validationAgeRange');
  }
  return null;
};

/**
 * Validate optional email fields.
 */
const validateEmail = (value: unknown): string | null => {
  const text = readTextValue(value);
  if (text.length === 0) return null;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(text) ? null : getValidationText('validationEmail');
};

/**
 * Validate optional website URL values.
 */
const validateWebsites = (value: unknown): string | null => {
  if (!value) return null;
  const asList = Array.isArray(value)
    ? value.map((entry) => readTextValue(entry))
    : readTextValue(value)
        .split(',')
        .map((entry) => entry.trim());
  const urls = asList.filter((entry) => entry.length > 0);
  for (const url of urls) {
    try {
      void new URL(url);
    } catch {
      return getValidationText('validationWebsite');
    }
  }
  return null;
};

/**
 * Validate Friends form data.
 */
const validateFriends = (
  data: FriendsProfileFormDataType
): ProfileValidationErrors<FriendsProfileFormDataType> => {
  const errors: ProfileValidationErrors<FriendsProfileFormDataType> = {};
  if (!hasValue(data.name))
    errors.name = getValidationText('validationNameRequired');
  const ageError = validateAge(data.age);
  if (ageError) errors.age = ageError;
  if (!hasValue(data.location))
    errors.location = getValidationText('locationRequired');
  if (!hasUsablePhoto(data.pictures)) {
    errors.pictures = getValidationText('validationPhotoRequired');
  }
  if (!hasValue(data.pronouns)) {
    errors.pronouns = getValidationText('validationPronounsRequired');
  }
  if (!hasMeaningfulListValue(data.seeking)) {
    errors.seeking = getValidationText('validationSeekingRequired');
  }
  if (!hasMeaningfulListValue(data.fullHobbies)) {
    errors.fullHobbies = getValidationText('validationHobbyRequired');
  }
  if (!hasSocialSummary(data)) {
    errors.selfSummary = getValidationText('validationSummaryGoalRequired');
  }
  return errors;
};

/**
 * Validate Dating form data.
 */
const validateDating = (
  data: DatingProfileFormDataType
): ProfileValidationErrors<DatingProfileFormDataType> => {
  const errors: ProfileValidationErrors<DatingProfileFormDataType> = {};
  if (!hasValue(data.name))
    errors.name = getValidationText('validationNameRequired');
  const ageError = validateAge(data.age);
  if (ageError) errors.age = ageError;
  if (!hasValue(data.location))
    errors.location = getValidationText('locationRequired');
  if (!hasUsablePhoto(data.pictures)) {
    errors.pictures = getValidationText('validationPhotoRequired');
  }
  if (!hasValue(data.pronouns)) {
    errors.pronouns = getValidationText('validationPronounsRequired');
  }
  if (!hasMeaningfulListValue(data.seeking)) {
    errors.seeking = getValidationText('validationSeekingRequired');
  }
  if (!hasMeaningfulListValue(data.fullHobbies)) {
    errors.fullHobbies = getValidationText('validationHobbyRequired');
  }
  if (!hasSocialSummary(data)) {
    errors.selfSummary = getValidationText('validationSummaryGoalRequired');
  }
  return errors;
};

/**
 * Validate Neighborhood form data.
 */
const validateNeighborhood = (
  data: NeighborhoodProfileFormDataType
): ProfileValidationErrors<NeighborhoodProfileFormDataType> => {
  const errors: ProfileValidationErrors<NeighborhoodProfileFormDataType> = {};
  if (!hasValue(data.name))
    errors.name = getValidationText('validationNameRequired');
  const ageError = validateAge(data.age);
  if (ageError) errors.age = ageError;
  if (!hasValue(data.location))
    errors.location = getValidationText('locationRequired');
  if (!hasUsablePhoto(data.pictures)) {
    errors.pictures = getValidationText('validationPhotoRequired');
  }
  if (!hasValue(data.pronouns)) {
    errors.pronouns = getValidationText('validationPronounsRequired');
  }
  if (!hasMeaningfulListValue(data.seeking)) {
    errors.seeking = getValidationText('validationSeekingRequired');
  }
  if (!hasMeaningfulListValue(data.fullHobbies)) {
    errors.fullHobbies = getValidationText('validationHobbyRequired');
  }
  return errors;
};

/**
 * Validate Academic form data.
 */
const validateAcademic = (
  data: AcademicProfileFormDataType
): ProfileValidationErrors<AcademicProfileFormDataType> => {
  const errors: ProfileValidationErrors<AcademicProfileFormDataType> = {};
  if (!hasValue(data.name))
    errors.name = getValidationText('validationNameRequired');
  if (!hasValue(data.location))
    errors.location = getValidationText('locationRequired');
  if (!hasValue(data.tagline))
    errors.tagline = getValidationText('validationTaglineRequired');
  if (!hasUsablePhoto(data.pictures)) {
    errors.pictures = getValidationText('validationPhotoRequired');
  }
  if (!hasValue(data.pronouns)) {
    errors.pronouns = getValidationText('validationPronounsRequired');
  }
  if (!hasValue(data.primaryAffiliation)) {
    errors.primaryAffiliation = getValidationText(
      'validationPrimaryAffiliationRequired'
    );
  }
  if (!hasMeaningfulListValue(data.seeking)) {
    errors.seeking = getValidationText('validationSeekingRequired');
  }
  if (!hasContactMethod(data)) {
    errors.email = getValidationText('validationContactRequired');
  }
  if (!hasHighlightContent(data)) {
    errors.summary = getValidationText('validationHighlightsRequired');
  }
  const emailError = validateEmail(data.email);
  if (emailError) errors.email = emailError;
  const websitesError = validateWebsites(data.websites);
  if (websitesError) errors.websites = websitesError;
  return errors;
};

/**
 * Validate Professional form data.
 */
const validateProfessional = (
  data: ProfessionalProfileFormDataType
): ProfileValidationErrors<ProfessionalProfileFormDataType> => {
  const errors: ProfileValidationErrors<ProfessionalProfileFormDataType> = {};
  if (!hasValue(data.name))
    errors.name = getValidationText('validationNameRequired');
  if (!hasValue(data.location))
    errors.location = getValidationText('locationRequired');
  if (!hasValue(data.tagline))
    errors.tagline = getValidationText('validationTaglineRequired');
  if (!hasUsablePhoto(data.pictures)) {
    errors.pictures = getValidationText('validationPhotoRequired');
  }
  if (!hasValue(data.pronouns)) {
    errors.pronouns = getValidationText('validationPronounsRequired');
  }
  if (!hasMeaningfulListValue(data.seeking)) {
    errors.seeking = getValidationText('validationSeekingRequired');
  }
  if (!hasContactMethod(data)) {
    errors.email = getValidationText('validationContactRequired');
  }
  if (!hasHighlightContent(data)) {
    errors.summary = getValidationText('validationHighlightsRequired');
  }
  const emailError = validateEmail(data.email);
  if (emailError) errors.email = emailError;
  const websitesError = validateWebsites(data.websites);
  if (websitesError) errors.websites = websitesError;
  return errors;
};

/**
 * Per-mode validation rule implementations.
 */
export const profileValidationByMode = {
  friends: validateFriends,
  dating: validateDating,
  neighborhood: validateNeighborhood,
  academic: validateAcademic,
  professional: validateProfessional,
} as const;

/**
 * Validate profile form data for friends mode.
 */
export function validateProfileFormData(
  modeId: 'friends',
  formData: FriendsProfileFormDataType
): ProfileValidationErrors<FriendsProfileFormDataType>;

/**
 * Validate profile form data for dating mode.
 */
export function validateProfileFormData(
  modeId: 'dating',
  formData: DatingProfileFormDataType
): ProfileValidationErrors<DatingProfileFormDataType>;

/**
 * Validate profile form data for neighborhood mode.
 */
export function validateProfileFormData(
  modeId: 'neighborhood',
  formData: NeighborhoodProfileFormDataType
): ProfileValidationErrors<NeighborhoodProfileFormDataType>;

/**
 * Validate profile form data for academic mode.
 */
export function validateProfileFormData(
  modeId: 'academic',
  formData: AcademicProfileFormDataType
): ProfileValidationErrors<AcademicProfileFormDataType>;

/**
 * Validate profile form data for professional mode.
 */
export function validateProfileFormData(
  modeId: 'professional',
  formData: ProfessionalProfileFormDataType
): ProfileValidationErrors<ProfessionalProfileFormDataType>;

/**
 * Validate profile form data for a specific mode.
 */
export function validateProfileFormData(
  modeId: ModeType['id'],
  formData:
    | FriendsProfileFormDataType
    | DatingProfileFormDataType
    | NeighborhoodProfileFormDataType
    | AcademicProfileFormDataType
    | ProfessionalProfileFormDataType
):
  | ProfileValidationErrors<FriendsProfileFormDataType>
  | ProfileValidationErrors<DatingProfileFormDataType>
  | ProfileValidationErrors<NeighborhoodProfileFormDataType>
  | ProfileValidationErrors<AcademicProfileFormDataType>
  | ProfileValidationErrors<ProfessionalProfileFormDataType> {
  switch (modeId) {
    case 'friends':
      return validateFriends(formData as FriendsProfileFormDataType);
    case 'dating':
      return validateDating(formData as DatingProfileFormDataType);
    case 'neighborhood':
      return validateNeighborhood(formData as NeighborhoodProfileFormDataType);
    case 'academic':
      return validateAcademic(formData as AcademicProfileFormDataType);
    case 'professional':
      return validateProfessional(formData as ProfessionalProfileFormDataType);
    default:
      return {};
  }
}

/**
 * True when a profile form has at least one validation error.
 */
export const hasProfileValidationErrors = <T extends object>(
  errors: ProfileValidationErrors<T>
): boolean => Object.keys(errors).length > 0;

/**
 * Attach field-level validation metadata to form config elements.
 */
export const withValidationErrors = <
  TConfigItem extends {
    name?: string;
    type?: string;
    error?: boolean;
    helperText?: string;
  }
>(
  config: TConfigItem[],
  errors: Record<string, string | undefined>
): TConfigItem[] =>
  config.map((item) => {
    if (!item.name) return item;
    if (
      item.type !== 'text' &&
      item.type !== 'number' &&
      item.type !== 'select' &&
      item.type !== 'autocomplete' &&
      item.type !== 'checkboxGroup'
    ) {
      return item;
    }
    const message = errors[item.name];
    if (!message) {
      return {
        ...item,
        error: false,
        helperText: undefined,
      };
    }
    return {
      ...item,
      error: true,
      helperText: message,
    };
  });
