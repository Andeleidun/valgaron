import { Box } from '../';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import FormHelperText from '@mui/material/FormHelperText';
import Select from '@mui/material/Select';
import type { SelectProps } from '@mui/material/Select';
import { styled } from '@mui/material/styles';
import { renderValue } from '../../../Utlilities';
import type { StringOrOptionType, OptionType } from '../../../types';
import {
  READ_ONLY_STYLE_TOKENS,
  READ_ONLY_CONTROL_CLASS,
  READ_ONLY_DATA_ATTRIBUTE,
} from './readOnlyStyles';

type WhoSelectProps = SelectProps & {
  options: OptionType[];
  language: string;
  inline?: boolean;
  label: StringOrOptionType;
  helperText?: string;
};

const StyledSelect = styled(Select)(({ theme }) => ({
  backgroundColor: theme.palette.background.paper,
  color: theme.palette.text.primary,
  '&:hover': {
    backgroundColor: theme.palette.background.paper,
  },
  '& .MuiSelect-select': {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-start',
    textAlign: 'left',
    color: theme.palette.text.primary,
  },
  '& .MuiSelect-icon': {
    color: theme.palette.text.secondary,
  },
  '& .MuiOutlinedInput-notchedOutline': {
    borderColor: theme.palette.divider,
  },
  [`&.${READ_ONLY_CONTROL_CLASS}`]: {
    background: READ_ONLY_STYLE_TOKENS.background(theme),
    color: READ_ONLY_STYLE_TOKENS.text(theme),
    cursor: 'default',
  },
  [`&.${READ_ONLY_CONTROL_CLASS} .MuiOutlinedInput-notchedOutline`]: {
    borderColor: READ_ONLY_STYLE_TOKENS.border(theme),
  },
}));

const StyledInputLabel = styled(InputLabel)(({ theme }) => ({
  color: theme.palette.text.secondary,
  '&.Mui-focused': {
    color: theme.palette.text.primary,
  },
  [`&.${READ_ONLY_CONTROL_CLASS}`]: {
    color: READ_ONLY_STYLE_TOKENS.text(theme),
  },
}));

/**
 * Render a themed Select input.
 */
export const WhoSelect = ({
  label,
  language,
  value,
  onChange,
  options,
  inline,
  helperText,
  error = false,
  ...props
}: WhoSelectProps) => {
  const isReadOnly = Boolean(props.disabled || props.inputProps?.readOnly);
  const labelText = renderValue(language, label);
  const baseId =
    props.id ??
    props.name ??
    labelText.toLowerCase().replace(/\s+/g, '-') ??
    'who-select';
  const labelId = `${baseId}-label`;
  return (
    <Box
      sx={{ minWidth: 120, width: '100%' }}
      className={inline ? 'inline-styles' : 'box-styles'}
      {...(isReadOnly ? { [READ_ONLY_DATA_ATTRIBUTE]: 'true' } : {})}
    >
      <FormControl fullWidth variant="outlined" error={error}>
        <StyledInputLabel
          id={labelId}
          className={isReadOnly ? READ_ONLY_CONTROL_CLASS : undefined}
        >
          {labelText}
        </StyledInputLabel>
        <StyledSelect
          {...props}
          labelId={labelId}
          id={baseId}
          className={isReadOnly ? READ_ONLY_CONTROL_CLASS : undefined}
          label={labelText}
          value={value}
          onChange={onChange}
          inputProps={{
            ...props.inputProps,
            readOnly: isReadOnly || props.inputProps?.readOnly,
          }}
          variant="outlined"
        >
          {options.map((option, index) => (
            <MenuItem key={index} value={option.value}>
              {renderValue(language, option.label)}
            </MenuItem>
          ))}
        </StyledSelect>
        {helperText ? <FormHelperText>{helperText}</FormHelperText> : null}
      </FormControl>
    </Box>
  );
};
