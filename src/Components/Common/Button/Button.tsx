import { Button } from '@mui/material';
import type { ButtonProps } from '@mui/material';
import './Button.css';

/**
 * Shared button props used across the app's wrapped MUI button.
 */
export type WhoButtonProps = ButtonProps;

/**
 * Render the app's standard button wrapper.
 */
export function WhoButton({
  onClick = () => ({}),
  children,
  className,
  variant = 'contained',
  ...props
}: WhoButtonProps) {
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
