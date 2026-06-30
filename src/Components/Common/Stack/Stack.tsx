import type { ReactNode } from 'react';
import Stack from '@mui/material/Stack';
import type { SxProps } from '@mui/material/styles';

type StackProps = {
  children: ReactNode;
  className?: string;
  sx?: SxProps;
  direction?: 'row' | 'column';
  spacing?: number;
};

function VWorldBuilderStack({
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

export default VWorldBuilderStack;
