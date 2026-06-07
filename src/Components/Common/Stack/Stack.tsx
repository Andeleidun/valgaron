import { ReactNode } from 'react';
import Stack from '@mui/material/Stack';
import { SxProps } from '@mui/material/styles';

type StackProps = {
  children: ReactNode;
  className?: string;
  sx?: SxProps;
  direction?: 'row' | 'column';
  spacing?: number;
};

function WhoStack({
  children,
  className = '',
  sx = {},
  direction = 'column',
  spacing = 1,
}: StackProps) {
  return (
    <Stack
      className={`stack ${className}`}
      sx={sx}
      direction={direction}
      spacing={spacing}
    >
      {children}
    </Stack>
  );
}

export default WhoStack;
