import { useEffect, useMemo, useState } from 'react';
import {
  Autocomplete as BaseAutocomplete,
  Chip,
  createFilterOptions,
  TextField,
} from '@mui/material/';
import type { AutocompleteProps } from '@mui/material/Autocomplete';
import type { TextFieldProps } from '@mui/material/TextField';
import { styled } from '@mui/material/styles';
import { Box } from '../';
import { renderTextValue } from '../../../Utlilities';
import type { StringOrOptionType, OptionType } from '../../../types';
import {
  READ_ONLY_STYLE_TOKENS,
  READ_ONLY_CONTROL_CLASS,
  READ_ONLY_DATA_ATTRIBUTE,
} from './readOnlyStyles';

export type AutocompleteOptionsType = {
  value?: string;
  label?: StringOrOptionType;
  inputValue?: string;
  temporaryLabel?: string; // used to suggest 'add X'
};

/**
 * Autocomplete value shape supported by VWorldBuilderAutocomplete.
 */
type AutocompleteValueType =
  | string
  | AutocompleteOptionsType
  | Array<string | AutocompleteOptionsType>
  | null
  | undefined;

/**
 * Normalized selection payload emitted by VWorldBuilderAutocomplete.
 */
export type AutocompleteSelectionType =
  | AutocompleteOptionsType
  | AutocompleteOptionsType[]
  | null;

/**
 * Check whether a value is a non-null object.
 */
const isObjectValue = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object';

/**
 * Resolve a stable comparison key for option equality checks.
 */
const getOptionComparisonKey = (
  option: AutocompleteOptionsType | string
): string => {
  if (typeof option === 'string') {
    return option.trim().toLowerCase();
  }
  const optionValue =
    typeof option.value === 'string' ? option.value.trim() : '';
  if (optionValue.length > 0) {
    return optionValue.toLowerCase();
  }
  return renderTextValue(option.label).trim().toLowerCase();
};

/**
 * Normalize a single raw MUI autocomplete value into the shared option shape.
 */
const normalizeAutocompleteOption = (
  option: AutocompleteOptionsType | string,
  valueLabelMap: Map<string, string>
): AutocompleteOptionsType => {
  if (typeof option === 'string') {
    return {
      value: option,
      label: valueLabelMap.get(option) ?? option,
    };
  }
  const normalizedValue =
    typeof option.value === 'string'
      ? option.value
      : typeof option.inputValue === 'string'
      ? option.inputValue
      : renderTextValue(option.label);
  const normalizedLabel = resolveOptionLabel(option, valueLabelMap);
  return {
    value: normalizedValue,
    label: normalizedLabel || normalizedValue,
  };
};

export type VWorldBuilderAutocompleteProps<T> = Partial<
  AutocompleteProps<T, boolean | undefined, undefined, boolean | undefined>
> & {
  handleChange: (
    name: string,
    change: AutocompleteSelectionType,
    dataSet?: string
  ) => void;
  options: AutocompleteOptionsType[] | OptionType[];
  label?: StringOrOptionType;
  name?: string;
  inline?: boolean;
  addLabel?: StringOrOptionType;
  dataSet?: string;
  InputProps?: TextFieldProps['InputProps'];
  error?: boolean;
  helperText?: string;
};

/**
 * Resolve an option label with fallbacks.
 */
const resolveOptionLabel = (
  option: AutocompleteOptionsType | string,
  valueLabelMap: Map<string, string>
): string => {
  if (typeof option === 'string') {
    return valueLabelMap.get(option) ?? option.trim();
  }
  const rendered = renderTextValue(option.label).trim();
  if (rendered.length > 0) return rendered;
  if (option.inputValue && option.inputValue.trim().length > 0) {
    return option.inputValue.trim();
  }
  if (option.value && option.value.trim().length > 0) {
    return valueLabelMap.get(option.value) ?? option.value.trim();
  }
  return '';
};

/**
 * Normalize and filter tag labels for rendering.
 */
const getTagLabels = (
  values: Array<AutocompleteOptionsType | string>,
  valueLabelMap: Map<string, string>
): string[] =>
  values
    .map((option) => resolveOptionLabel(option, valueLabelMap))
    .filter((label) => label.length > 0);

const StyledChip = styled(Chip)(({ theme }) => ({
  color: theme.palette.text.primary,
  '.MuiChip-deleteIcon': {
    color: theme.palette.text.primary,
    ':hover': {
      color: theme.palette.primary.main,
    },
  },
  label: {
    color: theme.palette.text.primary,
  },
}));

const StyledTextField = styled(TextField)(({ theme }) => ({
  input: {
    color: theme.palette.text.primary,
  },
  label: {
    color: theme.palette.text.primary,
    '& .Mui-focused': {
      color: theme.palette.text.primary,
    },
  },
  [`&.${READ_ONLY_CONTROL_CLASS} .MuiInputBase-root`]: {
    backgroundColor: READ_ONLY_STYLE_TOKENS.background(theme),
    cursor: 'default',
  },
  [`&.${READ_ONLY_CONTROL_CLASS} .MuiInputBase-input`]: {
    color: READ_ONLY_STYLE_TOKENS.text(theme),
  },
  [`&.${READ_ONLY_CONTROL_CLASS} .MuiOutlinedInput-notchedOutline`]: {
    borderColor: READ_ONLY_STYLE_TOKENS.border(theme),
  },
}));

export const VWorldBuilderAutocomplete = ({
  options: passedOptions,
  inline = false,
  value,
  handleChange,
  label = '',
  name = '',
  freeSolo = true,
  multiple = false,
  addLabel = '',
  InputProps,
  error = false,
  helperText,
  ...props
}: VWorldBuilderAutocompleteProps<AutocompleteOptionsType>) => {
  const isReadOnly = Boolean(
    props.readOnly || props.disabled || InputProps?.readOnly
  );
  const [useOptions, setUseOptions] = useState(passedOptions);
  const valueLabelMap = useMemo(() => {
    const options = Array.isArray(passedOptions) ? passedOptions : [];
    const pairs = options
      .map((option) => {
        if (!option || typeof option !== 'object') return null;
        const value =
          typeof option.value === 'string' ? option.value.trim() : '';
        if (!value) return null;
        const label = renderTextValue(option.label).trim();
        return [value, label || value] as const;
      })
      .filter((pair): pair is readonly [string, string] => Boolean(pair));
    return new Map(pairs);
  }, [passedOptions]);
  const filter = createFilterOptions<AutocompleteOptionsType>();
  const normalizedValue = useMemo((): AutocompleteValueType => {
    if (multiple) {
      if (Array.isArray(value)) return value;
      if (value == null) return [];
      return [value];
    }
    if (Array.isArray(value)) return value[0] ?? null;
    return value ?? null;
  }, [multiple, value]);

  useEffect(() => {
    const baseOptions = Array.isArray(passedOptions) ? passedOptions : [];
    const newOptions: Array<AutocompleteOptionsType | OptionType> = [
      ...baseOptions,
    ];
    const nextValues = Array.isArray(value)
      ? value
      : value == null
      ? []
      : [value];
    nextValues.forEach((currentValue) => {
      const normalizedValue = normalizeAutocompleteOption(
        currentValue,
        valueLabelMap
      );
      const alreadyPresent = newOptions.some(
        (option) =>
          getOptionComparisonKey(option as AutocompleteOptionsType | string) ===
          getOptionComparisonKey(normalizedValue)
      );
      if (!alreadyPresent) {
        newOptions.push(normalizedValue);
      }
    });
    setUseOptions(newOptions);
  }, [passedOptions, value, valueLabelMap]);

  return (
    <Box
      className={inline ? 'inline-styles' : 'box-styles'}
      sx={{ width: '100%' }}
      {...(isReadOnly ? { [READ_ONLY_DATA_ATTRIBUTE]: 'true' } : {})}
    >
      <BaseAutocomplete
        value={normalizedValue}
        {...props}
        readOnly={isReadOnly}
        className={isReadOnly ? READ_ONLY_CONTROL_CLASS : undefined}
        onChange={(_event, newValue: AutocompleteValueType) => {
          if (Array.isArray(newValue)) {
            handleChange(
              name,
              newValue.map((valueItem) =>
                normalizeAutocompleteOption(valueItem, valueLabelMap)
              )
            );
            return;
          }
          if (typeof newValue === 'string') {
            handleChange(
              name,
              normalizeAutocompleteOption(newValue, valueLabelMap)
            );
          } else if (
            isObjectValue(newValue) &&
            typeof newValue.inputValue === 'string'
          ) {
            // Create a new value from the user input
            handleChange(
              name,
              normalizeAutocompleteOption(newValue, valueLabelMap)
            );
          } else {
            handleChange(
              name,
              newValue
                ? normalizeAutocompleteOption(newValue, valueLabelMap)
                : null
            );
          }
        }}
        isOptionEqualToValue={(option, compareValue) =>
          getOptionComparisonKey(option) ===
          getOptionComparisonKey(compareValue)
        }
        filterOptions={(options, params) => {
          const filtered = filter(options, params);

          const { inputValue } = params;
          // Suggest the creation of a new value
          const isExisting = options.some(
            (option) => inputValue === option.label
          );
          if (inputValue !== '' && !isExisting) {
            const addPrefix = renderTextValue(addLabel).trim();
            filtered.push({
              value: inputValue,
              label: inputValue,
              temporaryLabel: addPrefix
                ? `${addPrefix} ${inputValue}`
                : inputValue,
            });
          }

          return filtered;
        }}
        options={useOptions}
        getOptionLabel={(option) => {
          // Value selected with enter, right from the input
          if (typeof option === 'string') {
            return resolveOptionLabel(option, valueLabelMap);
          }
          // Add "xxx" option created dynamically
          if (option.inputValue) {
            return option.inputValue;
          }
          // Regular option
          return resolveOptionLabel(option, valueLabelMap);
        }}
        renderOption={(props, option) => (
          <li {...props} key={option.value}>
            {option.temporaryLabel
              ? option.temporaryLabel
              : resolveOptionLabel(option, valueLabelMap)}
          </li>
        )}
        renderInput={(params) => (
          <StyledTextField
            {...params}
            className={isReadOnly ? READ_ONLY_CONTROL_CLASS : undefined}
            label={renderTextValue(label)}
            variant="outlined"
            error={error}
            helperText={helperText}
            inputProps={{
              ...params.inputProps,
              'aria-label': renderTextValue(label),
            }}
            InputProps={{
              ...params.InputProps,
              ...InputProps,
              readOnly: isReadOnly || InputProps?.readOnly,
            }}
          />
        )}
        renderTags={(
          value: Array<AutocompleteOptionsType | string>,
          getTagProps
        ) =>
          getTagLabels(value, valueLabelMap).map((label, index: number) => {
            const { key, ...tagProps } = getTagProps({ index });
            return (
              <StyledChip
                key={key}
                variant="outlined"
                label={label}
                {...tagProps}
              />
            );
          })
        }
        limitTags={3}
        freeSolo={freeSolo}
        multiple={multiple}
        selectOnFocus
        clearOnBlur
        handleHomeEndKeys
        fullWidth
        sx={props.sx}
      />
    </Box>
  );
};
