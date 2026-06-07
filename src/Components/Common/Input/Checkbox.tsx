import React, { useState } from 'react';
import { Checkbox, FormControlLabel, IconButton } from '@mui/material/';
import type { CheckboxProps } from '@mui/material/Checkbox';
import { styled } from '@mui/material/styles';
import { Star, StarOutline, Add } from '@mui/icons-material';
import { Grid, GridItem, Input } from '../';
import { renderValue } from '../../../Utlilities';
import type {
  StringOrOptionType,
  StringsOrOptionsType,
  OptionType,
} from '../../../types';
import {
  getReadOnlyChoiceSx,
  READ_ONLY_CONTROL_CLASS,
  READ_ONLY_DATA_ATTRIBUTE,
} from './readOnlyStyles';

/**
 * Field names for checkbox updates.
 */
type CheckboxChangeNameType = string | string[];

type WhoCheckboxProps = CheckboxProps & {
  handleChange: (
    name: CheckboxChangeNameType,
    value: OptionType | string,
    dataSet?: string
  ) => void;
  starred?: boolean;
  starName?: string;
  inline?: boolean;
  value: StringOrOptionType;
  language: string;
  dataSet?: string;
  starAriaLabel?: string;
};

type WhoCheckboxGroupProps = WhoCheckboxProps & {
  options: OptionType[];
  label: StringOrOptionType;
  checkedState?: StringsOrOptionsType;
  starredState?: StringsOrOptionsType;
  trailingInput?: boolean;
  optionsName?: string;
  addLabel?: StringOrOptionType;
  starAriaLabel?: string;
  error?: boolean;
  helperText?: string;
};

const StyledCheckbox = styled(Checkbox)(({ theme }) => ({
  color: theme.palette.text.primary,
  '& :checked + svg': {
    color: theme.palette.text.primary,
  },
}));

const StyledLabel = styled(FormControlLabel)(({ theme }) => ({
  color: theme.palette.text.primary,
}));

const StyledLegend = styled('legend')(({ theme }) => ({
  color: theme.palette.text.primary,
  marginBottom: '5px',
}));

const starStyles = {
  justifyContent: 'center',
  alignItems: 'center',
};

/**
 * Normalize checkbox values into the supported handler payload shape.
 */
const normalizeCheckboxValue = (
  value: StringOrOptionType,
  language: string
): OptionType | string => {
  if (typeof value === 'string') {
    return value;
  }
  if ('value' in value && typeof value.value === 'string') {
    return {
      value: value.value,
      label: renderValue(language, value.label),
    };
  }
  return renderValue(language, value);
};

export const WhoCheckbox = ({
  value,
  checked,
  handleChange,
  starName,
  starred,
  language,
  dataSet,
  starAriaLabel,
  ...props
}: WhoCheckboxProps) => {
  const isReadOnly = Boolean(props.disabled || props.inputProps?.readOnly);
  const normalizedValue = normalizeCheckboxValue(value, language);
  return (
    <Grid
      className={`no-space ${isReadOnly ? READ_ONLY_CONTROL_CLASS : ''}`.trim()}
      {...(isReadOnly ? { [READ_ONLY_DATA_ATTRIBUTE]: 'true' } : {})}
    >
      <GridItem container xs={starName ? 11 : 12}>
        <StyledLabel
          sx={getReadOnlyChoiceSx(isReadOnly)}
          label={renderValue(language, value)}
          control={
            <StyledCheckbox
              onChange={(e) =>
                handleChange(e.target.name, normalizedValue, dataSet)
              }
              inputProps={{
                'aria-label': renderValue(language, value),
              }}
              value={typeof value === 'string' ? value : value.value}
              checked={checked}
              sx={getReadOnlyChoiceSx(isReadOnly)}
              {...props}
            />
          }
        />
      </GridItem>
      {checked && starName && (
        <GridItem container xs={1} sx={starStyles}>
          <IconButton
            aria-label={starAriaLabel}
            onClick={() => handleChange(starName, normalizedValue, dataSet)}
            sx={getReadOnlyChoiceSx(isReadOnly)}
          >
            {starred ? (
              <Star sx={{ color: 'text.primary' }} />
            ) : (
              <StarOutline sx={{ color: 'text.secondary' }} />
            )}
          </IconButton>
        </GridItem>
      )}
    </Grid>
  );
};

export const WhoCheckboxGroup = ({
  label,
  options,
  inline,
  id,
  starName,
  trailingInput,
  handleChange,
  checkedState = [],
  starredState = [],
  name = '',
  optionsName = '',
  addLabel = '',
  language,
  dataSet,
  starAriaLabel,
  error,
  helperText,
  ...props
}: WhoCheckboxGroupProps) => {
  void error;
  void helperText;
  const [inputValue, setInputValue] = useState('');
  const handleAdd = () => {
    handleChange([optionsName, name], inputValue, dataSet);
    setInputValue('');
  };
  const handleKeyDown: React.KeyboardEventHandler<HTMLDivElement> = (e) => {
    const key = e.key;
    if (key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
  };
  return (
    <Grid
      className={inline ? 'inline-styles' : 'box-styles'}
      spacing={0}
      id={id}
      {...(props.disabled ? { [READ_ONLY_DATA_ATTRIBUTE]: 'true' } : {})}
    >
      <GridItem container xs={12}>
        <StyledLegend>{renderValue(language, label)}</StyledLegend>
      </GridItem>
      {options.map((option, index) => {
        const useOption =
          typeof option === 'string'
            ? {
                value: option,
                label: option,
              }
            : option;
        const isChecked =
          Array.isArray(checkedState) &&
          checkedState?.some((c) =>
            typeof c === 'string'
              ? c.toLocaleLowerCase() === useOption.value.toLocaleLowerCase() ||
                c.toLocaleLowerCase() ===
                  renderValue(language, useOption).toLocaleLowerCase()
              : c.value.toLocaleLowerCase() ===
                  useOption.value.toLocaleLowerCase() ||
                (typeof c.label === typeof useOption &&
                  renderValue(language, c.label).toLocaleLowerCase() ===
                    renderValue(language, useOption).toLocaleLowerCase())
          );
        const isStarred =
          Array.isArray(starredState) &&
          starredState?.some((c) =>
            typeof c === 'string'
              ? c.toLocaleLowerCase() === useOption.value.toLocaleLowerCase() ||
                c.toLocaleLowerCase() ===
                  renderValue(language, useOption).toLocaleLowerCase()
              : c.value.toLocaleLowerCase() ===
                  useOption.value.toLocaleLowerCase() ||
                renderValue(language, c.label).toLocaleLowerCase() ===
                  renderValue(language, useOption).toLocaleLowerCase()
          );
        if (props.disabled && !isChecked && !isStarred) {
          return null;
        }
        return (
          <GridItem container xs={12} key={index}>
            <WhoCheckbox
              checked={isChecked}
              starred={isStarred}
              starName={starName}
              id={`${id}-${useOption.value}`}
              handleChange={handleChange}
              name={name}
              {...props}
              value={useOption}
              language={language}
              starAriaLabel={starAriaLabel}
            />
          </GridItem>
        );
      })}
      {trailingInput && !props.disabled && (
        <GridItem container xs={12} key="other">
          <GridItem container xs={11}>
            <StyledLabel
              label={
                <Input
                  inline
                  value={inputValue}
                  handleChange={(e) => setInputValue(e.target.value)}
                  placeholder={renderValue(language, addLabel)}
                  aria-label={renderValue(language, addLabel)}
                  onKeyDown={handleKeyDown}
                />
              }
              value={inputValue}
              control={<StyledCheckbox checked={!!inputValue} />}
            />
          </GridItem>
          <GridItem container xs={1} sx={starStyles}>
            <IconButton
              aria-label={renderValue(language, addLabel)}
              onClick={handleAdd}
            >
              <Add sx={{ color: 'text.primary' }} />
            </IconButton>
          </GridItem>
        </GridItem>
      )}
    </Grid>
  );
};
