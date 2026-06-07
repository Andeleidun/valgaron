import React, { useState } from 'react';
import type { ButtonProps } from '@mui/material/Button';
import type { TextFieldProps } from '@mui/material/TextField';
import { useTheme } from '@mui/material/styles';
import type {
  AutocompleteOptionsType,
  AutocompleteSelectionType,
} from '../Input/Autocomplete';
import {
  Autocomplete,
  Button,
  CheckboxGroup,
  GridItem,
  Input,
  RadioGroup,
  Select,
  Text,
} from '..';
import { ProfileFieldWithPrivacy } from './ProfileFieldWithPrivacy';
import type { FormStoreSubscriberType } from './FormStore';
import { useOptionalFormFieldSnapshot } from './FormStore';
import type {
  OpenStringsOrOptionsType,
  OptionType,
  ProfileFieldPrivacyLevelType,
  StringOrOptionType,
  TranslationStringType,
} from '../../../types';
import { formatTemplate, renderValue } from '../../../Utlilities';

/**
 * Generic form-data record used by shared form helper handlers.
 */
export type FormDataRecord = Record<string, unknown>;

/**
 * Shared layout attributes for form config items.
 */
type FormElementLayoutType = {
  id?: string;
  xs?: number;
  md?: number;
};

/**
 * Supported form config element discriminators.
 */
export type FormElementKindType =
  | 'text'
  | 'number'
  | 'select'
  | 'radioGroup'
  | 'autocomplete'
  | 'checkboxGroup'
  | 'button'
  | 'repeatingList';

/**
 * Base form config element.
 */
type BaseFormElementConfigType = FormElementLayoutType & {
  type: FormElementKindType;
  hidePrivacyControl?: boolean;
};

/**
 * Text and number input form config item.
 */
export type TextFormElementConfigType = BaseFormElementConfigType & {
  type: 'text' | 'number';
  name: string;
  label: StringOrOptionType;
  value?: string | number;
  InputProps?: TextFieldProps['InputProps'];
  InputLabelProps?: TextFieldProps['InputLabelProps'];
  placeholder?: string;
  multiline?: boolean;
  disabled?: boolean;
};

/**
 * Select form config item.
 */
export type SelectFormElementConfigType = BaseFormElementConfigType & {
  type: 'select';
  name: string;
  label: StringOrOptionType;
  value?: unknown;
  options: OptionType[];
  helperText?: string;
  error?: boolean;
  disabled?: boolean;
};

/**
 * Radio group form config item.
 */
export type RadioGroupFormElementConfigType = BaseFormElementConfigType & {
  type: 'radioGroup';
  name: string;
  label: StringOrOptionType;
  value?: string;
  options: OptionType[];
  trailingInput?: boolean;
  trailingInputLabel?: StringOrOptionType;
  disabled?: boolean;
};

/**
 * Autocomplete form config item.
 */
export type AutocompleteFormElementConfigType = BaseFormElementConfigType & {
  type: 'autocomplete';
  name: string;
  label: StringOrOptionType;
  value?: OpenStringsOrOptionsType;
  options: OptionType[];
  multiple?: boolean;
  freeSolo?: boolean;
  disabled?: boolean;
  InputProps?: TextFieldProps['InputProps'];
  addLabel?: StringOrOptionType;
  addlabel?: StringOrOptionType;
  dataSet?: string;
  helperText?: string;
  error?: boolean;
};

/**
 * Checkbox group form config item.
 */
export type CheckboxGroupFormElementConfigType = BaseFormElementConfigType & {
  type: 'checkboxGroup';
  name: string;
  label: StringOrOptionType;
  options: OptionType[];
  checkedState?: OpenStringsOrOptionsType;
  starredState?: OpenStringsOrOptionsType;
  starName?: string;
  trailingInput?: boolean;
  addLabel?: StringOrOptionType;
  addlabel?: StringOrOptionType;
  optionsName?: string;
  disabled?: boolean;
  dataSet?: string;
  helperText?: string;
  error?: boolean;
};

/**
 * Button form config item.
 */
export type ButtonFormElementConfigType = BaseFormElementConfigType &
  Omit<ButtonProps, 'children'> & {
    type: 'button';
    children: React.ReactNode;
  };

/**
 * Repeating list form config item — renders a dynamic add/remove list of strings.
 */
export type RepeatingListFormElementConfigType = BaseFormElementConfigType & {
  type: 'repeatingList';
  name: string;
  label: string;
  value?: string[];
  placeholder?: string;
  addLabel?: string;
  disabled?: boolean;
};

/**
 * Compatibility config item for existing dynamic config producers.
 */
export type UnknownFormElementConfigType = FormElementLayoutType & {
  type?: string;
  [key: string]: unknown;
};

/**
 * Full discriminated union of supported form config items.
 */
export type FormElementConfigType =
  | TextFormElementConfigType
  | SelectFormElementConfigType
  | RadioGroupFormElementConfigType
  | AutocompleteFormElementConfigType
  | CheckboxGroupFormElementConfigType
  | ButtonFormElementConfigType
  | RepeatingListFormElementConfigType
  | UnknownFormElementConfigType;

/**
 * Runtime translation subset required by form renderer.
 */
export type FormElementsStringsType = {
  add?: TranslationStringType;
  addFieldTemplate?: TranslationStringType;
  removeItemTemplate?: TranslationStringType;
  otherPleaseSpecify?: TranslationStringType;
  starLabel?: TranslationStringType;
  privacyVisibility?: TranslationStringType;
  privacyOpen?: TranslationStringType;
  privacyConnectionsOnly?: TranslationStringType;
  privacyVerifiedOnly?: TranslationStringType;
  starredIntentHelper?: TranslationStringType;
};

/**
 * Bivariant callback utility used to keep renderer handlers compatible with
 * existing call sites while retaining typed arguments.
 */
type BivariantCallbackType<Args extends unknown[]> = {
  bivarianceHack: (...args: Args) => void;
}['bivarianceHack'];

/**
 * Shared text/select/radio change handler signature.
 */
export type FormElementChangeHandlerType = BivariantCallbackType<
  [event: React.ChangeEvent<HTMLInputElement>, dataSet?: never]
>;

/**
 * Shared checkbox-group change handler signature.
 */
export type FormElementCheckboxChangeHandlerType = BivariantCallbackType<
  [name: string | string[], value: OptionType | string, dataSet?: never]
>;

/**
 * Normalized autocomplete option shape used by profile/community forms.
 */
export type FormElementAutocompleteOptionType = {
  value: string;
  label: string;
};

/**
 * Shared autocomplete change handler signature.
 */
export type FormElementAutocompleteChangeHandlerType = BivariantCallbackType<
  [
    name: string,
    value:
      | FormElementAutocompleteOptionType
      | FormElementAutocompleteOptionType[],
    multi?: boolean,
    dataSet?: never
  ]
>;

/**
 * Repeating list change handler — called with the full updated string array.
 */
export type FormElementRepeatingListChangeHandlerType = BivariantCallbackType<
  [name: string, values: string[]]
>;

/**
 * RenderFormElements props.
 */
export type RenderFormElementsProps = {
  config: Array<FormElementConfigType | undefined>;
  handleChange: FormElementChangeHandlerType;
  handleCheckboxChange: FormElementCheckboxChangeHandlerType;
  handleAutocompleteChange: FormElementAutocompleteChangeHandlerType;
  handleRepeatingListChange?: FormElementRepeatingListChangeHandlerType;
  strings: FormElementsStringsType;
  language: string;
  store?: FormStoreSubscriberType<FormDataRecord>;
  privacyStore?: FormStoreSubscriberType<FormDataRecord>;
  privacyByField?: Record<string, ProfileFieldPrivacyLevelType>;
  handleFieldPrivacyChange?: (
    fieldName: string,
    level: ProfileFieldPrivacyLevelType
  ) => void;
};

/**
 * Check that a value is a dictionary-like object.
 */
const isObjectRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object';

/**
 * Narrow config objects to text/number input configs.
 */
const isTextElementConfig = (
  config: FormElementConfigType
): config is TextFormElementConfigType =>
  (config.type === 'text' || config.type === 'number') &&
  typeof config.name === 'string' &&
  'label' in config;

/**
 * Narrow config objects to select configs.
 */
const isSelectElementConfig = (
  config: FormElementConfigType
): config is SelectFormElementConfigType =>
  config.type === 'select' &&
  typeof config.name === 'string' &&
  Array.isArray(config.options) &&
  'label' in config;

/**
 * Narrow config objects to radio group configs.
 */
const isRadioGroupElementConfig = (
  config: FormElementConfigType
): config is RadioGroupFormElementConfigType =>
  config.type === 'radioGroup' &&
  typeof config.name === 'string' &&
  Array.isArray(config.options) &&
  'label' in config;

/**
 * Narrow config objects to autocomplete configs.
 */
const isAutocompleteElementConfig = (
  config: FormElementConfigType
): config is AutocompleteFormElementConfigType =>
  config.type === 'autocomplete' &&
  typeof config.name === 'string' &&
  Array.isArray(config.options) &&
  'label' in config;

/**
 * Narrow config objects to checkbox group configs.
 */
const isCheckboxGroupElementConfig = (
  config: FormElementConfigType
): config is CheckboxGroupFormElementConfigType =>
  config.type === 'checkboxGroup' &&
  typeof config.name === 'string' &&
  Array.isArray(config.options) &&
  'label' in config;

/**
 * Narrow config objects to button configs.
 */
const isButtonElementConfig = (
  config: FormElementConfigType
): config is ButtonFormElementConfigType =>
  config.type === 'button' && 'children' in config;

/**
 * Narrow config objects to repeating list configs.
 */
const isRepeatingListElementConfig = (
  config: FormElementConfigType
): config is RepeatingListFormElementConfigType =>
  config.type === 'repeatingList' &&
  typeof (config as RepeatingListFormElementConfigType).name === 'string';

/**
 * Convert open form values into the option/value shape expected by WhoAutocomplete.
 */
const normalizeAutocompleteValue = (
  value: OpenStringsOrOptionsType | undefined,
  language: string
):
  | string
  | AutocompleteOptionsType
  | Array<string | AutocompleteOptionsType>
  | undefined => {
  if (!value) {
    return undefined;
  }
  if (typeof value === 'string') {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map((item) => {
      if (typeof item === 'string') {
        return item;
      }
      const nextValue = isObjectRecord(item) ? item.value : '';
      const normalizedValue = typeof nextValue === 'string' ? nextValue : '';
      const normalizedLabel = renderValue(
        language,
        (isObjectRecord(item)
          ? item.label
          : normalizedValue) as OpenStringsOrOptionsType
      );
      return {
        value: normalizedValue,
        label: normalizedLabel || normalizedValue,
      };
    });
  }
  if (isObjectRecord(value)) {
    const nextValue = typeof value.value === 'string' ? value.value : '';
    const normalizedLabel = renderValue(
      language,
      (value.label ?? nextValue) as OpenStringsOrOptionsType
    );
    return {
      value: nextValue,
      label: normalizedLabel || nextValue,
    };
  }
  return renderValue(language, value);
};

/**
 * Normalize one autocomplete selection into the shared option shape.
 */
const normalizeAutocompleteSelection = (
  value: AutocompleteOptionsType | string,
  language: string
): FormElementAutocompleteOptionType => {
  if (typeof value === 'string') {
    return { value, label: value };
  }
  const nextValue = typeof value.value === 'string' ? value.value : '';
  const nextLabel = renderValue(
    language,
    (value.label ?? nextValue) as OpenStringsOrOptionsType
  );
  return {
    value: nextValue,
    label: nextLabel || nextValue,
  };
};

/**
 * Inline add/remove list of string entries for repeating-list form fields.
 */
const RepeatingListField = ({
  name,
  label,
  value = [],
  placeholder,
  addLabel,
  disabled,
  language,
  onChange,
  strings,
}: {
  name: string;
  label: string;
  value?: string[];
  placeholder?: string;
  addLabel?: string;
  disabled?: boolean;
  language: string;
  onChange: (name: string, values: string[]) => void;
  strings: FormElementsStringsType;
}): JSX.Element => {
  const theme = useTheme();
  const [draft, setDraft] = useState('');

  const handleAdd = () => {
    const trimmed = draft.trim();
    if (!trimmed) return;
    onChange(name, [...value, trimmed]);
    setDraft('');
  };

  const handleRemove = (index: number) => {
    onChange(
      name,
      value.filter((_, i) => i !== index)
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
  };

  return (
    <div>
      <Text variant="caption" style={{ display: 'block', marginBottom: 4 }}>
        {label}
      </Text>
      {value.map((entry, index) => (
        <div
          key={index}
          style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: 4,
            color: theme.palette.text.primary,
          }}
        >
          <Text variant="body2" style={{ flex: 1 }}>
            {entry}
          </Text>
          <button
            type="button"
            aria-label={
              formatTemplate(
                renderValue(language, strings.removeItemTemplate),
                {
                  value: entry,
                  label,
                }
              ) || entry
            }
            disabled={disabled}
            onClick={() => handleRemove(index)}
            style={{
              background: 'none',
              border: 'none',
              color: theme.palette.text.primary,
              cursor: 'pointer',
              padding: '0 4px',
              fontSize: '1rem',
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>
      ))}
      <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
        <Input
          inline
          type="text"
          name={`${name}Draft`}
          value={draft}
          placeholder={placeholder ?? label}
          disabled={disabled}
          handleChange={(event) => setDraft(event.target.value)}
          onKeyDown={handleKeyDown}
          aria-label={
            formatTemplate(renderValue(language, strings.addFieldTemplate), {
              label,
            }) || label
          }
          fullWidth
          variant="outlined"
        />
        <Button
          type="button"
          disabled={disabled || !draft.trim()}
          onClick={handleAdd}
        >
          {addLabel ?? '+'}
        </Button>
      </div>
    </div>
  );
};

type FieldMessageProps = {
  error?: boolean;
  helperText?: string;
};

type FormElementRowSharedProps = Omit<RenderFormElementsProps, 'config'> & {
  element: FormElementConfigType;
  index: number;
};

/**
 * Merge store-driven validation metadata with config-provided fallback metadata.
 */
const getResolvedFieldMessage = (
  fieldError: string | undefined,
  fallback: FieldMessageProps = {}
): Required<FieldMessageProps> => ({
  error: Boolean(fieldError) || Boolean(fallback.error),
  helperText: fieldError ?? fallback.helperText ?? '',
});

/**
 * Wrap a rendered control in the default grid item.
 */
const FormGridItem = ({
  children,
  xs,
  md,
  fullRow = false,
}: {
  children: React.ReactNode;
  xs?: number;
  md?: number;
  fullRow?: boolean;
}) => (
  <GridItem xs={xs ?? 12} md={md ?? (fullRow ? 12 : 6)}>
    {children}
  </GridItem>
);

/**
 * Render a store-aware text or number input row.
 */
const TextFormElementRow = React.memo(
  ({
    element,
    store,
    handleChange,
    language,
    strings,
    privacyStore,
    privacyByField,
    handleFieldPrivacyChange,
  }: FormElementRowSharedProps & { element: TextFormElementConfigType }) => {
    const fieldSnapshot = useOptionalFormFieldSnapshot(store, element.name);
    const privacyFieldSnapshot = useOptionalFormFieldSnapshot(
      privacyStore ?? store,
      element.name
    );
    const { type, xs, md, label, hidePrivacyControl, ...inputProps } = element;
    const showPrivacyControl =
      Boolean(handleFieldPrivacyChange) && !hidePrivacyControl;
    const sanitizedInputProps = {
      ...inputProps,
    } as typeof inputProps & {
      error?: boolean;
      helperText?: string;
      trailingInput?: unknown;
    };
    if ('trailingInput' in sanitizedInputProps) {
      delete sanitizedInputProps.trailingInput;
    }
    const resolvedMessages = getResolvedFieldMessage(fieldSnapshot.error, {
      error: sanitizedInputProps.error,
      helperText: sanitizedInputProps.helperText,
    });
    const resolvedValue = store
      ? (fieldSnapshot.value as TextFormElementConfigType['value'])
      : element.value;

    return (
      <FormGridItem xs={xs} md={md} fullRow={showPrivacyControl}>
        <ProfileFieldWithPrivacy
          fieldName={sanitizedInputProps.name}
          fieldLabel={label}
          language={language}
          strings={strings}
          selectedLevel={
            privacyFieldSnapshot.privacyLevel ?? privacyByField?.[element.name]
          }
          privacyByField={privacyByField}
          handleFieldPrivacyChange={
            showPrivacyControl ? handleFieldPrivacyChange : undefined
          }
          control={
            <Input
              type={type}
              variant="outlined"
              handleChange={(event, dataSet) =>
                handleChange(
                  event as React.ChangeEvent<HTMLInputElement>,
                  dataSet as never
                )
              }
              label={renderValue(language, label)}
              InputLabelProps={{ shrink: true }}
              placeholder={renderValue(language, label)}
              {...sanitizedInputProps}
              {...resolvedMessages}
              value={resolvedValue}
              helperText={resolvedMessages.helperText || undefined}
              fullWidth
            />
          }
        />
      </FormGridItem>
    );
  }
);

/**
 * Render a store-aware select row.
 */
const SelectFormElementRow = React.memo(
  ({
    element,
    store,
    handleChange,
    language,
    strings,
    privacyStore,
    privacyByField,
    handleFieldPrivacyChange,
  }: FormElementRowSharedProps & { element: SelectFormElementConfigType }) => {
    const fieldSnapshot = useOptionalFormFieldSnapshot(store, element.name);
    const privacyFieldSnapshot = useOptionalFormFieldSnapshot(
      privacyStore ?? store,
      element.name
    );
    const { type, xs, md, label, hidePrivacyControl, ...selectProps } = element;
    const showPrivacyControl =
      Boolean(handleFieldPrivacyChange) && !hidePrivacyControl;
    void type;
    const resolvedMessages = getResolvedFieldMessage(fieldSnapshot.error, {
      error: selectProps.error,
      helperText: selectProps.helperText,
    });
    const resolvedValue = store ? fieldSnapshot.value : element.value;

    return (
      <FormGridItem xs={xs} md={md} fullRow={showPrivacyControl}>
        <ProfileFieldWithPrivacy
          fieldName={selectProps.name}
          fieldLabel={label}
          language={language}
          strings={strings}
          selectedLevel={
            privacyFieldSnapshot.privacyLevel ?? privacyByField?.[element.name]
          }
          privacyByField={privacyByField}
          handleFieldPrivacyChange={
            showPrivacyControl ? handleFieldPrivacyChange : undefined
          }
          control={
            <Select
              {...selectProps}
              {...resolvedMessages}
              helperText={resolvedMessages.helperText || undefined}
              value={resolvedValue}
              label={renderValue(language, label)}
              onChange={
                handleChange as React.ComponentProps<typeof Select>['onChange']
              }
              variant="filled"
              language={language}
            />
          }
        />
      </FormGridItem>
    );
  }
);

/**
 * Render a store-aware radio group row.
 */
const RadioGroupFormElementRow = React.memo(
  ({
    element,
    store,
    handleChange,
    language,
    strings,
    privacyStore,
    privacyByField,
    handleFieldPrivacyChange,
  }: FormElementRowSharedProps & {
    element: RadioGroupFormElementConfigType;
  }) => {
    const fieldSnapshot = useOptionalFormFieldSnapshot(store, element.name);
    const privacyFieldSnapshot = useOptionalFormFieldSnapshot(
      privacyStore ?? store,
      element.name
    );
    const showPrivacyControl =
      Boolean(handleFieldPrivacyChange) && !element.hidePrivacyControl;
    const radioElement = element as RadioGroupFormElementConfigType & {
      InputProps?: TextFieldProps['InputProps'];
    };
    const { type, xs, md, InputProps, hidePrivacyControl, ...radioProps } =
      radioElement;
    void type;
    void InputProps;
    void hidePrivacyControl;
    const resolvedTrailingInputLabel =
      radioProps.trailingInputLabel ??
      renderValue(language, strings.otherPleaseSpecify);
    const resolvedValue = store
      ? (fieldSnapshot.value as RadioGroupFormElementConfigType['value'])
      : element.value;

    return (
      <FormGridItem xs={xs} md={md} fullRow={showPrivacyControl}>
        <ProfileFieldWithPrivacy
          fieldName={radioProps.name}
          fieldLabel={radioProps.label}
          language={language}
          strings={strings}
          selectedLevel={
            privacyFieldSnapshot.privacyLevel ?? privacyByField?.[element.name]
          }
          privacyByField={privacyByField}
          handleFieldPrivacyChange={
            showPrivacyControl ? handleFieldPrivacyChange : undefined
          }
          control={
            <RadioGroup
              {...radioProps}
              trailingInputLabel={resolvedTrailingInputLabel}
              value={resolvedValue}
              language={language}
              onChange={
                handleChange as unknown as React.ComponentProps<
                  typeof RadioGroup
                >['onChange']
              }
            />
          }
        />
      </FormGridItem>
    );
  }
);

/**
 * Render a store-aware autocomplete row.
 */
const AutocompleteFormElementRow = React.memo(
  ({
    element,
    store,
    handleAutocompleteChange,
    language,
    strings,
    privacyStore,
    privacyByField,
    handleFieldPrivacyChange,
  }: FormElementRowSharedProps & {
    element: AutocompleteFormElementConfigType;
  }) => {
    const fieldSnapshot = useOptionalFormFieldSnapshot(store, element.name);
    const privacyFieldSnapshot = useOptionalFormFieldSnapshot(
      privacyStore ?? store,
      element.name
    );
    const showPrivacyControl =
      Boolean(handleFieldPrivacyChange) && !element.hidePrivacyControl;
    const {
      type,
      xs,
      md,
      value,
      addLabel,
      addlabel,
      InputProps,
      hidePrivacyControl,
      ...autocompleteProps
    } = element;
    void type;
    void hidePrivacyControl;
    const sanitizedAutocompleteProps = {
      ...autocompleteProps,
    } as typeof autocompleteProps & {
      trailingInput?: unknown;
    };
    if ('trailingInput' in sanitizedAutocompleteProps) {
      delete sanitizedAutocompleteProps.trailingInput;
    }
    const addTranslation = strings.add;
    const resolvedAddLabel =
      addLabel ??
      addlabel ??
      (addTranslation ? addTranslation[language] ?? addTranslation.en : '');
    const resolvedMessages = getResolvedFieldMessage(fieldSnapshot.error, {
      error: autocompleteProps.error,
      helperText: autocompleteProps.helperText,
    });
    const resolvedValue = store
      ? (fieldSnapshot.value as OpenStringsOrOptionsType | undefined)
      : value;

    return (
      <FormGridItem xs={xs} md={md} fullRow={showPrivacyControl}>
        <ProfileFieldWithPrivacy
          fieldName={sanitizedAutocompleteProps.name}
          fieldLabel={autocompleteProps.label}
          language={language}
          strings={strings}
          selectedLevel={
            privacyFieldSnapshot.privacyLevel ?? privacyByField?.[element.name]
          }
          privacyByField={privacyByField}
          handleFieldPrivacyChange={
            showPrivacyControl ? handleFieldPrivacyChange : undefined
          }
          control={
            <Autocomplete
              {...sanitizedAutocompleteProps}
              {...resolvedMessages}
              helperText={resolvedMessages.helperText || undefined}
              value={normalizeAutocompleteValue(resolvedValue, language)}
              handleChange={(
                name: string,
                change: AutocompleteSelectionType,
                dataSet?: unknown
              ): void => {
                if (!change) {
                  return;
                }
                if (Array.isArray(change)) {
                  handleAutocompleteChange(
                    name,
                    change.map((selection) =>
                      normalizeAutocompleteSelection(selection, language)
                    ),
                    Boolean(sanitizedAutocompleteProps.multiple),
                    dataSet as never
                  );
                  return;
                }
                handleAutocompleteChange(
                  name,
                  normalizeAutocompleteSelection(change, language),
                  Boolean(sanitizedAutocompleteProps.multiple),
                  dataSet as never
                );
              }}
              addLabel={resolvedAddLabel}
              InputProps={InputProps as TextFieldProps['InputProps']}
              language={language}
            />
          }
        />
      </FormGridItem>
    );
  }
);

/**
 * Render a store-aware checkbox group row.
 */
const CheckboxGroupFormElementRow = React.memo(
  ({
    element,
    store,
    handleCheckboxChange,
    language,
    strings,
    privacyStore,
    privacyByField,
    handleFieldPrivacyChange,
  }: FormElementRowSharedProps & {
    element: CheckboxGroupFormElementConfigType;
  }) => {
    const fieldSnapshot = useOptionalFormFieldSnapshot(store, element.name);
    const privacyFieldSnapshot = useOptionalFormFieldSnapshot(
      privacyStore ?? store,
      element.name
    );
    const starredFieldSnapshot = useOptionalFormFieldSnapshot(
      store,
      element.starName ?? ''
    );
    const optionsFieldSnapshot = useOptionalFormFieldSnapshot(
      store,
      element.optionsName ?? ''
    );
    const checkboxElement = element as CheckboxGroupFormElementConfigType & {
      InputProps?: TextFieldProps['InputProps'];
    };
    const showPrivacyControl =
      Boolean(handleFieldPrivacyChange) && !element.hidePrivacyControl;
    const {
      type,
      xs,
      md,
      trailingInput,
      addLabel,
      addlabel,
      InputProps,
      hidePrivacyControl,
      ...checkboxProps
    } = checkboxElement;
    void type;
    void InputProps;
    void hidePrivacyControl;
    const resolvedMessages = getResolvedFieldMessage(fieldSnapshot.error, {
      error: checkboxProps.error,
      helperText: checkboxProps.helperText,
    });
    const resolvedCheckedState = store
      ? Array.isArray(fieldSnapshot.value)
        ? fieldSnapshot.value
        : []
      : checkboxProps.checkedState;
    const resolvedStarredState = store
      ? Array.isArray(starredFieldSnapshot.value)
        ? starredFieldSnapshot.value
        : []
      : checkboxProps.starredState;
    const resolvedOptions =
      store && Array.isArray(optionsFieldSnapshot.value)
        ? (optionsFieldSnapshot.value as OptionType[])
        : checkboxProps.options;

    return (
      <FormGridItem xs={xs} md={md} fullRow={showPrivacyControl}>
        <ProfileFieldWithPrivacy
          fieldName={checkboxProps.name}
          fieldLabel={checkboxProps.label}
          language={language}
          strings={strings}
          selectedLevel={
            privacyFieldSnapshot.privacyLevel ?? privacyByField?.[element.name]
          }
          privacyByField={privacyByField}
          handleFieldPrivacyChange={
            showPrivacyControl ? handleFieldPrivacyChange : undefined
          }
          control={
            <>
              <CheckboxGroup
                {...checkboxProps}
                options={resolvedOptions}
                value=""
                handleChange={(name, value, dataSet) =>
                  handleCheckboxChange(name, value, dataSet as never)
                }
                language={language}
                checkedState={
                  Array.isArray(resolvedCheckedState)
                    ? resolvedCheckedState
                    : []
                }
                starredState={
                  Array.isArray(resolvedStarredState)
                    ? resolvedStarredState
                    : []
                }
                trailingInput={Boolean(trailingInput)}
                addLabel={addLabel ?? addlabel}
                starAriaLabel={renderValue(language, strings.starLabel)}
              />
              {resolvedMessages.error && resolvedMessages.helperText ? (
                <Text variant="caption" role="alert">
                  {resolvedMessages.helperText}
                </Text>
              ) : null}
              {checkboxProps.starName ? (
                <Text variant="caption">
                  {renderValue(language, strings.starredIntentHelper)}
                </Text>
              ) : null}
            </>
          }
        />
      </FormGridItem>
    );
  }
);

/**
 * Render a store-aware repeating list row.
 */
const RepeatingListFormElementRow = React.memo(
  ({
    element,
    store,
    handleRepeatingListChange,
    language,
    strings,
    privacyStore,
    privacyByField,
    handleFieldPrivacyChange,
  }: FormElementRowSharedProps & {
    element: RepeatingListFormElementConfigType;
  }) => {
    const fieldSnapshot = useOptionalFormFieldSnapshot(store, element.name);
    const privacyFieldSnapshot = useOptionalFormFieldSnapshot(
      privacyStore ?? store,
      element.name
    );
    const showPrivacyControl =
      Boolean(handleFieldPrivacyChange) && !element.hidePrivacyControl;
    const { xs, md, name, label, value, placeholder, addLabel, disabled } =
      element;
    const resolvedAddLabel = addLabel ?? renderValue(language, strings.add);
    const resolvedValue = store
      ? Array.isArray(fieldSnapshot.value)
        ? fieldSnapshot.value
        : []
      : value;

    return (
      <FormGridItem xs={xs} md={md} fullRow={showPrivacyControl}>
        <ProfileFieldWithPrivacy
          fieldName={name}
          fieldLabel={label}
          language={language}
          strings={strings}
          selectedLevel={
            privacyFieldSnapshot.privacyLevel ?? privacyByField?.[element.name]
          }
          privacyByField={privacyByField}
          handleFieldPrivacyChange={
            showPrivacyControl ? handleFieldPrivacyChange : undefined
          }
          control={
            <RepeatingListField
              name={name}
              label={label}
              value={Array.isArray(resolvedValue) ? resolvedValue : []}
              placeholder={placeholder}
              addLabel={resolvedAddLabel}
              disabled={disabled}
              language={language}
              strings={strings}
              onChange={(fieldName, values) => {
                if (handleRepeatingListChange) {
                  handleRepeatingListChange(fieldName, values);
                }
              }}
            />
          }
        />
      </FormGridItem>
    );
  }
);

/**
 * Render a button row.
 */
const ButtonFormElementRow = React.memo(
  ({
    element,
  }: FormElementRowSharedProps & {
    element: ButtonFormElementConfigType;
  }) => {
    const { type, xs, md, hidePrivacyControl, ...buttonProps } = element;
    void hidePrivacyControl;
    return (
      <FormGridItem xs={xs} md={md}>
        <Button type={type} {...buttonProps} />
      </FormGridItem>
    );
  }
);

/**
 * Render one configured field row.
 */
const FormElementRow = React.memo((props: FormElementRowSharedProps) => {
  const { element } = props;
  if (isTextElementConfig(element)) {
    return <TextFormElementRow {...props} element={element} />;
  }
  if (isSelectElementConfig(element)) {
    return <SelectFormElementRow {...props} element={element} />;
  }
  if (isRadioGroupElementConfig(element)) {
    return <RadioGroupFormElementRow {...props} element={element} />;
  }
  if (isAutocompleteElementConfig(element)) {
    return <AutocompleteFormElementRow {...props} element={element} />;
  }
  if (isCheckboxGroupElementConfig(element)) {
    return <CheckboxGroupFormElementRow {...props} element={element} />;
  }
  if (isRepeatingListElementConfig(element)) {
    return <RepeatingListFormElementRow {...props} element={element} />;
  }
  if (isButtonElementConfig(element)) {
    return <ButtonFormElementRow {...props} element={element} />;
  }
  return null;
});

/**
 * Render configured form controls using the shared component system.
 */
export const RenderFormElements = ({
  config,
  handleChange,
  handleCheckboxChange,
  handleAutocompleteChange,
  handleRepeatingListChange,
  strings,
  language,
  store,
  privacyStore,
  privacyByField = {},
  handleFieldPrivacyChange,
}: RenderFormElementsProps): JSX.Element => {
  return (
    <>
      {config.map((element, index) => {
        if (!element) {
          return null;
        }
        const elementKey =
          element.id ??
          ('name' in element && typeof element.name === 'string'
            ? element.name
            : index);
        return (
          <FormElementRow
            key={elementKey}
            index={index}
            element={element}
            handleChange={handleChange}
            handleCheckboxChange={handleCheckboxChange}
            handleAutocompleteChange={handleAutocompleteChange}
            handleRepeatingListChange={handleRepeatingListChange}
            strings={strings}
            language={language}
            store={store}
            privacyStore={privacyStore}
            privacyByField={privacyByField}
            handleFieldPrivacyChange={handleFieldPrivacyChange}
          />
        );
      })}
    </>
  );
};

/**
 * Safely coerce unknown object-like values into string lists for comparisons.
 */
const toComparableValues = (value: unknown, language: string): string[] => {
  if (typeof value === 'string') {
    return [value.toLowerCase()];
  }
  if (!value || typeof value !== 'object') {
    return [];
  }
  return Object.values(value as Record<string, unknown>)
    .map((itemValue) =>
      renderValue(language, itemValue as OpenStringsOrOptionsType).toLowerCase()
    )
    .filter((itemValue) => itemValue.length > 0);
};

/**
 * Check whether an item already aligns with the given value in a language-aware way.
 */
const checkItemValue = (
  item: OpenStringsOrOptionsType,
  value: OptionType | string,
  language: string
): boolean => {
  const itemValues = toComparableValues(item, language);
  const valueValues = toComparableValues(value, language);

  if (typeof item === 'string') {
    return valueValues.includes(item.toLowerCase());
  }
  if (typeof value === 'string') {
    return itemValues.includes(value.toLowerCase());
  }
  return (
    item === value ||
    itemValues.some((itemValue) => valueValues.includes(itemValue)) ||
    valueValues.some((valueValue) => itemValues.includes(valueValue))
  );
};

/**
 * Read an array-like field value from form data.
 */
const getArrayFieldValue = (
  formData: FormDataRecord,
  name: string
): OpenStringsOrOptionsType[] => {
  const fieldValue = formData[name];
  return Array.isArray(fieldValue)
    ? (fieldValue as OpenStringsOrOptionsType[])
    : [];
};

/**
 * Coerce number-input payloads into numeric values while preserving draft
 * strings for empty or invalid intermediate states.
 */
const getNormalizedInputValue = ({
  type,
  value,
}: Pick<HTMLInputElement, 'type' | 'value'>): string | number => {
  if (type !== 'number') {
    return value;
  }

  const trimmedValue = value.trim();
  if (trimmedValue.length === 0) {
    return value;
  }

  const numericValue = Number(trimmedValue);
  return Number.isFinite(numericValue) ? numericValue : value;
};

/**
 * Update a single text field in form data.
 */
export const baseHandleInputChange = <T extends FormDataRecord>(
  event: React.ChangeEvent<HTMLInputElement>,
  formData: T
): T => {
  const { name } = event.target;
  return {
    ...formData,
    [name]: getNormalizedInputValue(event.target),
  };
};

/**
 * Toggle a checkbox value in a list field.
 */
export const baseHandleCheckboxChange = <T extends FormDataRecord>(
  name: string,
  value: OptionType | string,
  formData: T,
  language: string
): T => {
  const currentValues = getArrayFieldValue(formData, name);
  const updatedValues = currentValues.some((item) =>
    checkItemValue(item, value, language)
  )
    ? currentValues.filter((item) => !checkItemValue(item, value, language))
    : [...currentValues, value];
  return { ...formData, [name]: updatedValues };
};

/**
 * Args for base autocomplete field updates.
 */
export type BaseHandleAutocompleteChangeArgsType<T extends FormDataRecord> = {
  name: string;
  value: OptionType | OptionType[];
  formData: T;
  multi: boolean;
  language: string;
};

/**
 * Type for base autocomplete change helper.
 */
export type BaseHandleAutocompleteChangeType = <T extends FormDataRecord>(
  args: BaseHandleAutocompleteChangeArgsType<T>
) => T;

/**
 * Replace a repeating list field value in form data.
 */
export const baseHandleRepeatingListChange = <T extends FormDataRecord>(
  name: string,
  values: string[],
  formData: T
): T => ({ ...formData, [name]: values });

/**
 * Update autocomplete field values for single or multi selection controls.
 */
export const baseHandleAutocompleteChange: BaseHandleAutocompleteChangeType = <
  T extends FormDataRecord
>({
  name,
  value,
  formData,
  language,
  multi = false,
}: BaseHandleAutocompleteChangeArgsType<T>): T => {
  if (multi) {
    if (Array.isArray(value)) {
      return { ...formData, [name]: value };
    }
    const currentValues = getArrayFieldValue(formData, name);
    const updatedValues = currentValues.some((item) =>
      checkItemValue(item, value, language)
    )
      ? currentValues.filter((item) => !checkItemValue(item, value, language))
      : [...currentValues, value];
    return { ...formData, [name]: updatedValues };
  }
  return { ...formData, [name]: value };
};
