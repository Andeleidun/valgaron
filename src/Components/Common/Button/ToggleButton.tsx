import CheckBoxOutlinedIcon from '@mui/icons-material/CheckBoxOutlined';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import ToggleButton, { type ToggleButtonProps } from '@mui/material/ToggleButton';
import { Text, Box } from '../';
import './Button.css';

/**
 * Shared props for the app's labeled toggle button.
 */
export type VWorldBuilderToggleButtonProps = ToggleButtonProps & {
  label: string;
  iconEnabled?: boolean;
};

/**
 * Render a labeled toggle button with optional checkbox-style state icons.
 */
export function VWorldBuilderToggleButton({
  value,
  label,
  id,
  onClick,
  className,
  disabled,
  iconEnabled = true,
  sx = {},
  selected,
}: VWorldBuilderToggleButtonProps) {
  const isSelected = selected ?? Boolean(value);

  return (
    <Box className="toggle-button-container">
      <ToggleButton
        value={value}
        selected={isSelected}
        className={`toggle-button ${className ? className : ''}`}
        onClick={onClick}
        disabled={disabled}
        sx={sx}
        id={id + '-toggle-button'}
        aria-labelledby={id + '-toggle-button-label'}
      >
        <Text className="toggle-button-label" id={id + '-toggle-button-label'}>
          {label}
        </Text>
        {iconEnabled && isSelected ? (
          <CheckBoxOutlinedIcon />
        ) : (
          <CheckBoxOutlineBlankIcon />
        )}
      </ToggleButton>
    </Box>
  );
}
