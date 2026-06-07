import { Box } from '../';
import Grid2 from '@mui/material/Unstable_Grid2';
import type { Grid2Props } from '@mui/material/Unstable_Grid2';

type GridProps = Grid2Props & {
  noPadding?: boolean;
};

export function WhoGrid({
  children,
  spacing = 1,
  component = 'div',
  direction = 'row',
  noPadding = false,
  sx,
  ...props
}: GridProps) {
  return (
    <Box sx={{ flexGrow: 1 }}>
      <Grid2
        container
        spacing={spacing}
        component={component}
        direction={direction}
        sx={{
          ...sx,
          ...(noPadding && {
            padding: '0',
          }),
        }}
        {...props}
      >
        {children}
      </Grid2>
    </Box>
  );
}
