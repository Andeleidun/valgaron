import type { ChangeEvent } from 'react';
import { Box } from '../';
import TextField from '@mui/material/TextField';
import type { TextFieldProps } from '@mui/material/TextField';
import { styled } from '@mui/material/styles';
import {
  READ_ONLY_STYLE_TOKENS,
  READ_ONLY_CONTROL_CLASS,
  READ_ONLY_DATA_ATTRIBUTE,
} from './readOnlyStyles';

type TextInputProps = TextFieldProps & {
  inline?: boolean;
  dataSet?: string;
  handleChange: (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    dataSet?: string
  ) => void;
};

const StyledTextField = styled(TextField)(({ theme }) => ({
  input: {
    color: theme.palette.text.primary,
  },
  label: {
    color: theme.palette.text.primary,
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

export const TextInput = ({
  handleChange,
  variant = 'standard',
  inline,
  dataSet,
  inputProps,
  'aria-label': ariaLabel,
  ...props
}: TextInputProps) => {
  const isReadOnly = Boolean(props.disabled || props.InputProps?.readOnly);
  return (
    <Box
      className={inline ? 'inline-styles' : 'box-styles'}
      {...(isReadOnly ? { [READ_ONLY_DATA_ATTRIBUTE]: 'true' } : {})}
    >
      <StyledTextField
        onChange={(e) => handleChange(e, dataSet)}
        {...props}
        className={isReadOnly ? READ_ONLY_CONTROL_CLASS : undefined}
        InputProps={{
          ...props.InputProps,
          readOnly: isReadOnly || props.InputProps?.readOnly,
        }}
        inputProps={{
          ...inputProps,
          'aria-label': ariaLabel ?? inputProps?.['aria-label'],
        }}
        variant={variant}
      />
    </Box>
  );
};
