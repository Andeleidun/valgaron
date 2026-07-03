import type { ReactNode } from 'react';
import Grid2 from '@mui/material/Unstable_Grid2';
import type { Grid2Props } from '@mui/material/Unstable_Grid2';

type GridItemsProps = Grid2Props & {
  children?: ReactNode;
  component?: 'li' | 'div';
  noPadding?: boolean;
};

export function VWorldBuilderGridItem({
  children,
  xs = 6,
  component = 'div',
  noPadding = false,
  sx,
  ...props
}: GridItemsProps) {
  return (
    <Grid2
      xs={xs}
      component={component}
      {...props}
      sx={{
        ...sx,
        ...(noPadding && {
          padding: '0',
        }),
      }}
    >
      {children}
    </Grid2>
  );
}

export default VWorldBuilderGridItem;
