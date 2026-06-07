import type {
  ConnectionStyleModeStringsType,
  ConnectionStyleProfileFormFieldsType,
  ConnectionStyleType,
  ModeType,
  MultiOptionsType,
  OptionType,
  StringsOrOptionsType,
} from '../../../types';
import type { FormElementConfigType } from '../../Common/FormElements';
import { buildEmptyConnectionStyle, renderValue } from '../../../Utlilities';

const MULTILINGUAL_WELCOME_VALUE = 'multilingual_welcome';
const SIMPLE_ENGLISH_OK_VALUE = 'simple_english_ok';

/**
 * Summary row used by the read-only profile connection-style preview.
 */
export type ConnectionStyleSummaryItemType = {
  id: string;
  label: string;
  value: string;
};

/**
 * Narrow unknown values to the option objects emitted by shared form controls.
 */
const isOptionLike = (value: unknown): value is Pick<OptionType, 'value'> =>
  value !== null &&
  typeof value === 'object' &&
  'value' in value &&
  typeof (value as { value: unknown }).value === 'string';

/**
 * Normalize a checkbox/autocomplete selection array into stable string values.
 */
const getSelectionValues = (values: StringsOrOptionsType = []): string[] =>
  Array.from(
    new Set(
      values
        .map((value) => {
          if (typeof value === 'string') {
            return value.trim();
          }
          if (isOptionLike(value)) {
            return value.value.trim();
          }
          return '';
        })
        .filter((value) => value.length > 0)
    )
  );

/**
 * Map translated option groups into the shared select/checkbox config shape.
 */
const getFormOptions = (
  options: MultiOptionsType,
  language: string
): OptionType[] =>
  options.map((option) => ({
    value: option.value,
    label: renderValue(language, option.label),
  }));

/**
 * Prefix select options with a reversible empty-state choice.
 */
const getSelectOptions = (
  options: MultiOptionsType,
  language: string,
  clearLabel: string
): OptionType[] => [
  {
    value: '',
    label: clearLabel,
  },
  ...getFormOptions(options, language),
];

/**
 * Resolve one translated option label by value with a string fallback.
 */
const getOptionLabel = (
  options: MultiOptionsType,
  value: string,
  language: string
): string =>
  renderValue(
    language,
    options.find((option) => option.value === value)?.label ?? value
  );

/**
 * Flatten the nested language-comfort payload into a single multi-select field.
 */
const getLanguageComfortSelections = (
  connectionStyle?: ConnectionStyleType
): StringsOrOptionsType => {
  const preferredLanguages =
    connectionStyle?.languageComfort?.preferredLanguages ?? [];

  return getSelectionValues([
    ...preferredLanguages,
    ...(connectionStyle?.languageComfort?.multilingualWelcome
      ? [MULTILINGUAL_WELCOME_VALUE]
      : []),
    ...(connectionStyle?.languageComfort?.simpleEnglishOk
      ? [SIMPLE_ENGLISH_OK_VALUE]
      : []),
  ]);
};

/**
 * Build flat profile-form fields from a persisted connection-style object.
 */
export const getConnectionStyleProfileBaseFormFields = (
  connectionStyle?: ConnectionStyleType
): ConnectionStyleProfileFormFieldsType => ({
  connectionAvailabilityPattern: connectionStyle?.availabilityPattern ?? '',
  connectionCommunicationPace: connectionStyle?.communicationPace ?? '',
  connectionIntroductionPreference:
    connectionStyle?.introductionPreference ?? '',
  connectionLanguageComfort: getLanguageComfortSelections(connectionStyle),
  connectionPlanningStyle: connectionStyle?.planningStyle ?? '',
});

/**
 * Rebuild the persistable connection-style payload from flat profile-form data.
 */
export const buildConnectionStyleProfileValue = (
  profileFormData: ConnectionStyleProfileFormFieldsType
): ConnectionStyleType => {
  const baseConnectionStyle = buildEmptyConnectionStyle();
  const languageSelections = getSelectionValues(
    profileFormData.connectionLanguageComfort
  );
  const preferredLanguages = languageSelections.filter(
    (value) =>
      value !== MULTILINGUAL_WELCOME_VALUE && value !== SIMPLE_ENGLISH_OK_VALUE
  );

  return {
    ...baseConnectionStyle,
    availabilityPattern:
      profileFormData.connectionAvailabilityPattern || undefined,
    communicationPace: profileFormData.connectionCommunicationPace || undefined,
    introductionPreference:
      profileFormData.connectionIntroductionPreference || undefined,
    planningStyle: profileFormData.connectionPlanningStyle || undefined,
    languageComfort: {
      ...baseConnectionStyle.languageComfort,
      preferredLanguages,
      multilingualWelcome: languageSelections.includes(
        MULTILINGUAL_WELCOME_VALUE
      )
        ? true
        : undefined,
      simpleEnglishOk: languageSelections.includes(SIMPLE_ENGLISH_OK_VALUE)
        ? true
        : undefined,
    },
  };
};

type GetConnectionStyleProfileFormConfigArgs<
  FormFields extends ConnectionStyleProfileFormFieldsType
> = {
  mode: ModeType;
  strings: ConnectionStyleModeStringsType;
  profileFormData: FormFields;
  language: string;
  clearLabel: string;
};

/**
 * Build the shared editable connection-style section for one profile mode.
 */
export const getConnectionStyleProfileFormConfig = <
  FormFields extends ConnectionStyleProfileFormFieldsType
>({
  mode,
  strings,
  profileFormData,
  language,
  clearLabel,
}: GetConnectionStyleProfileFormConfigArgs<FormFields>): FormElementConfigType[] => [
  {
    type: 'select',
    name: 'connectionAvailabilityPattern',
    label: strings.availabilityPattern.title[language],
    value: profileFormData.connectionAvailabilityPattern,
    options: getSelectOptions(
      strings.availabilityPattern.options ?? [],
      language,
      clearLabel
    ),
    helperText: strings.availabilityPattern.description[language],
    id: `${mode.id}-connection-style-availability-select`,
  },
  {
    type: 'select',
    name: 'connectionCommunicationPace',
    label: strings.communicationPace.title[language],
    value: profileFormData.connectionCommunicationPace,
    options: getSelectOptions(
      strings.communicationPace.options ?? [],
      language,
      clearLabel
    ),
    helperText: strings.communicationPace.description[language],
    id: `${mode.id}-connection-style-pace-select`,
  },
  {
    type: 'select',
    name: 'connectionIntroductionPreference',
    label: strings.introductionPreference.title[language],
    value: profileFormData.connectionIntroductionPreference,
    options: getSelectOptions(
      strings.introductionPreference.options ?? [],
      language,
      clearLabel
    ),
    helperText: strings.introductionPreference.description[language],
    id: `${mode.id}-connection-style-introduction-select`,
  },
  {
    type: 'checkboxGroup',
    name: 'connectionLanguageComfort',
    label: strings.languageComfort.title[language],
    options: getFormOptions(strings.languageComfort.options, language),
    checkedState: profileFormData.connectionLanguageComfort,
    helperText: strings.languageComfort.description[language],
    id: `${mode.id}-connection-style-language-checkbox`,
    md: 12,
  },
  {
    type: 'select',
    name: 'connectionPlanningStyle',
    label: strings.planningStyle.title[language],
    value: profileFormData.connectionPlanningStyle,
    options: getSelectOptions(
      strings.planningStyle.options ?? [],
      language,
      clearLabel
    ),
    helperText: strings.planningStyle.description[language],
    id: `${mode.id}-connection-style-planning-select`,
  },
];

/**
 * Build the visible connection-style summary rows for read-only profile view.
 */
export const getConnectionStyleProfileSummaryItems = ({
  connectionStyle,
  strings,
  language,
}: {
  connectionStyle?: ConnectionStyleType;
  strings: ConnectionStyleModeStringsType;
  language: string;
}): ConnectionStyleSummaryItemType[] => {
  const summaryItems: ConnectionStyleSummaryItemType[] = [];
  const languageSelections = getLanguageComfortSelections(connectionStyle);
  const languageValues = getSelectionValues(languageSelections);

  if (connectionStyle?.availabilityPattern) {
    summaryItems.push({
      id: 'availability',
      label: strings.availabilityPattern.title[language],
      value: getOptionLabel(
        strings.availabilityPattern.options ?? [],
        connectionStyle.availabilityPattern,
        language
      ),
    });
  }

  if (connectionStyle?.communicationPace) {
    summaryItems.push({
      id: 'pace',
      label: strings.communicationPace.title[language],
      value: getOptionLabel(
        strings.communicationPace.options ?? [],
        connectionStyle.communicationPace,
        language
      ),
    });
  }

  if (connectionStyle?.introductionPreference) {
    summaryItems.push({
      id: 'introduction',
      label: strings.introductionPreference.title[language],
      value: getOptionLabel(
        strings.introductionPreference.options ?? [],
        connectionStyle.introductionPreference,
        language
      ),
    });
  }

  if (languageValues.length > 0) {
    summaryItems.push({
      id: 'language',
      label: strings.languageComfort.title[language],
      value: languageValues
        .map((value) =>
          getOptionLabel(strings.languageComfort.options, value, language)
        )
        .join(', '),
    });
  }

  if (connectionStyle?.planningStyle) {
    summaryItems.push({
      id: 'planning',
      label: strings.planningStyle.title[language],
      value: getOptionLabel(
        strings.planningStyle.options ?? [],
        connectionStyle.planningStyle,
        language
      ),
    });
  }

  return summaryItems;
};
