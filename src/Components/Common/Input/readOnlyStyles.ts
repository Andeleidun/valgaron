import type { SxProps, Theme } from '@mui/material/styles';

/**
 * Shared data attribute used by readonly-aware form controls.
 */
export const READ_ONLY_DATA_ATTRIBUTE = 'data-vwb-readonly';

/**
 * Shared class name used to target readonly-aware controls.
 */
export const READ_ONLY_CONTROL_CLASS = 'vwb-readonly-control';

/**
 * Shared readonly style tokens for form controls.
 */
export const READ_ONLY_STYLE_TOKENS = {
  background: (theme: Theme): string => theme.palette.action.disabledBackground,
  border: (theme: Theme): string => theme.palette.action.disabled,
  text: (theme: Theme): string => theme.palette.text.secondary,
} as const;

/**
 * Build readonly styles for text-like controls.
 */
export const getReadOnlyFieldSx = (isReadOnly: boolean): SxProps<Theme> =>
  isReadOnly
    ? {
        backgroundColor: (theme: Theme) =>
          READ_ONLY_STYLE_TOKENS.background(theme),
        cursor: 'default',
        '& .MuiInputBase-input': {
          color: (theme: Theme) => READ_ONLY_STYLE_TOKENS.text(theme),
        },
        '& .MuiOutlinedInput-notchedOutline': {
          borderColor: (theme: Theme) => READ_ONLY_STYLE_TOKENS.border(theme),
        },
        '&:hover .MuiOutlinedInput-notchedOutline': {
          borderColor: (theme: Theme) => READ_ONLY_STYLE_TOKENS.border(theme),
        },
      }
    : {};

/**
 * Build readonly styles for checkbox/radio controls and labels.
 */
export const getReadOnlyChoiceSx = (isReadOnly: boolean): SxProps<Theme> =>
  isReadOnly
    ? {
        color: (theme: Theme) => READ_ONLY_STYLE_TOKENS.text(theme),
        cursor: 'default',
      }
    : {};
