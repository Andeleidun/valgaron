import Switch from '@mui/material/Switch';
import { Text, Box } from '../';
import type { SxProps } from '@mui/material/styles';
import './Switch.css';

type SwitchProps = {
  checked: boolean;
  label: string;
  id: string;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
  iconEnabled?: boolean;
  sx?: SxProps;
  size?: 'small' | 'medium';
};

function VWorldBuilderSwitch({
  checked,
  label,
  id,
  onClick = () => ({}),
  className,
  disabled,
  sx = {},
  size = 'medium',
}: SwitchProps) {
  return (
    <Box className="switch-container">
      <Text className="switch-label" id={id + '-switch-label'}>
        {label}
      </Text>
      <Switch
        checked={checked}
        className={`switch ${className ? className : ''}`}
        onClick={onClick}
        disabled={disabled}
        sx={sx}
        size={size}
        id={id + '-switch'}
        aria-labelledby={id + '-switch-label'}
      />
    </Box>
  );
}

export default VWorldBuilderSwitch;
