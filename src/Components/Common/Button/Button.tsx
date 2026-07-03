import { Button } from '@mui/material';
import type { ButtonProps } from '@mui/material';
import './Button.css';

/**
 * Shared button props used across the app's wrapped MUI button.
 */
export type VWorldBuilderButtonProps = ButtonProps;

/**
 * Render the app's standard button wrapper.
 */
export function VWorldBuilderButton({
  onClick = () => ({}),
  children,
  className,
  variant = 'contained',
  ...props
}: VWorldBuilderButtonProps) {
  return (
    <Button
      className={`button ${className ? className : ''}`}
      onClick={onClick}
      variant={variant}
      {...props}
    >
      {children}
    </Button>
  );
}
