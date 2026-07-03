import { useEffect, useState } from 'react';
import { Radio, RadioGroup, FormLabel, FormControlLabel } from '@mui/material';
import type { RadioGroupProps } from '@mui/material/';
import { styled } from '@mui/material/styles';
import { Grid, GridItem, Input } from '../';
import {
  getReadOnlyChoiceSx,
  READ_ONLY_CONTROL_CLASS,
  READ_ONLY_DATA_ATTRIBUTE,
} from './readOnlyStyles';

type VWorldBuilderRadioGroupProps = RadioGroupProps & {
  options: string[];
  label: string;
  trailingInput?: boolean;
  trailingInputLabel?: string;
  inline?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
};

const StyledRadio = styled(Radio)(({ theme }) => ({
  color: theme.palette.text.primary,
  '&.Mui-checked': {
    color: theme.palette.text.primary,
  },
}));

const StyledLabel = styled(FormLabel)(({ theme }) => ({
  color: theme.palette.text.primary,
}));

const StyledControlLabel = styled(FormControlLabel)(({ theme }) => ({
  color: theme.palette.text.primary,
}));

export const VWorldBuilderRadioGroup = ({
  label,
  options,
  trailingInput,
  trailingInputLabel = '',
  value,
  inline,
  ...props
}: VWorldBuilderRadioGroupProps) => {
  const isReadOnly = Boolean(props.disabled || props.readOnly);
  const [inputValue, setInputValue] = useState('');
  useEffect(() => {
    if (value && value.length > 0) {
      setInputValue(value);
    }
  }, []);

  return (
    <Grid
      className={`${inline ? 'inline-styles' : 'box-styles'} ${
        isReadOnly ? READ_ONLY_CONTROL_CLASS : ''
      }`.trim()}
      spacing={0}
      {...(isReadOnly ? { [READ_ONLY_DATA_ATTRIBUTE]: 'true' } : {})}
    >
      <GridItem container xs={12}>
        <StyledLabel id={label + '-label'} sx={getReadOnlyChoiceSx(isReadOnly)}>
          {label}
        </StyledLabel>
      </GridItem>
      <RadioGroup aria-labelledby={label + '-label'} value={value} {...props}>
        {options.map((option, index) => (
          <GridItem container xs={12} key={index}>
            <StyledControlLabel
              label={option}
              value={option}
              control={
                <StyledRadio
                  sx={getReadOnlyChoiceSx(isReadOnly)}
                  disabled={isReadOnly}
                />
              }
              disabled={isReadOnly}
              sx={getReadOnlyChoiceSx(isReadOnly)}
            />
          </GridItem>
        ))}
        {trailingInput && (
          <GridItem container xs={12} key="other">
            <StyledControlLabel
              label={
                <Input
                  inline
                  value={inputValue}
                  handleChange={(e) => setInputValue(e.target.value)}
                  placeholder={trailingInputLabel}
                  aria-label={trailingInputLabel}
                  disabled={isReadOnly}
                />
              }
              value={inputValue}
              control={
                <StyledRadio
                  sx={getReadOnlyChoiceSx(isReadOnly)}
                  disabled={isReadOnly}
                />
              }
              disabled={isReadOnly}
              sx={getReadOnlyChoiceSx(isReadOnly)}
            />
          </GridItem>
        )}
      </RadioGroup>
    </Grid>
  );
};
