import React, { useState } from 'react';
import { Checkbox, FormControlLabel, IconButton } from '@mui/material/';
import type { CheckboxProps } from '@mui/material/Checkbox';
import { styled } from '@mui/material/styles';
import { Add } from '@mui/icons-material';
import { Grid, GridItem, Input } from '../';
import {
  getReadOnlyChoiceSx,
  READ_ONLY_CONTROL_CLASS,
  READ_ONLY_DATA_ATTRIBUTE,
} from './readOnlyStyles';

/**
 * Field names for checkbox updates.
 */
type CheckboxChangeNameType = string | string[];

type VWorldBuilderCheckboxProps = CheckboxProps & {
  handleChange: (
    name: CheckboxChangeNameType,
    value: string,
    dataSet?: string
  ) => void;
  inline?: boolean;
  value: string;
  dataSet?: string;
};

type VWorldBuilderCheckboxGroupProps = VWorldBuilderCheckboxProps & {
  options: string[];
  label: string;
  checkedState?: string[];
  trailingInput?: boolean;
  optionsName?: string;
  addLabel?: string;
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

export const VWorldBuilderCheckbox = ({
  value,
  checked,
  handleChange,
  dataSet,
  ...props
}: VWorldBuilderCheckboxProps) => {
  const isReadOnly = Boolean(props.disabled || props.inputProps?.readOnly);
  return (
    <Grid
      className={`no-space ${isReadOnly ? READ_ONLY_CONTROL_CLASS : ''}`.trim()}
      {...(isReadOnly ? { [READ_ONLY_DATA_ATTRIBUTE]: 'true' } : {})}
    >
      <GridItem container xs={12}>
        <StyledLabel
          sx={getReadOnlyChoiceSx(isReadOnly)}
          label={value}
          control={
            <StyledCheckbox
              onChange={(e) => handleChange(e.target.name, value, dataSet)}
              inputProps={{
                'aria-label': value,
              }}
              value={value}
              checked={checked}
              sx={getReadOnlyChoiceSx(isReadOnly)}
              {...props}
            />
          }
        />
      </GridItem>
    </Grid>
  );
};

export const VWorldBuilderCheckboxGroup = ({
  label,
  options,
  inline,
  id,
  trailingInput,
  handleChange,
  checkedState = [],
  name = '',
  optionsName = '',
  addLabel = '',
  dataSet,
  error,
  helperText,
  ...props
}: VWorldBuilderCheckboxGroupProps) => {
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
        <StyledLegend>{label}</StyledLegend>
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
                c.toLocaleLowerCase() === useOption.label.toLocaleLowerCase()
              : useOption.value.toLocaleLowerCase()
          );
        if (props.disabled && !isChecked) {
          return null;
        }
        return (
          <GridItem container xs={12} key={index}>
            <VWorldBuilderCheckbox
              checked={isChecked}
              id={`${id}-${useOption.value}`}
              handleChange={handleChange}
              name={name}
              {...props}
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
                  placeholder={addLabel}
                  aria-label={addLabel}
                  onKeyDown={handleKeyDown}
                />
              }
              value={inputValue}
              control={<StyledCheckbox checked={!!inputValue} />}
            />
          </GridItem>
          <GridItem container xs={1}>
            <IconButton aria-label={addLabel} onClick={handleAdd}>
              <Add sx={{ color: 'text.primary' }} />
            </IconButton>
          </GridItem>
        </GridItem>
      )}
    </Grid>
  );
};
