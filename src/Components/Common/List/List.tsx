import type { ReactNode } from 'react';
import List from '@mui/material/List';
import type { SxProps } from '@mui/material/styles';

type ListProps = {
  children: ReactNode;
  className?: string;
  component?: 'ul' | 'ol' | 'menu';
  disablePadding?: boolean;
  sx?: SxProps;
};

function VWorldBuilderList({
  children,
  className = '',
  component = 'ul',
  disablePadding = false,
  sx = {},
}: ListProps) {
  return (
    <List
      className={`List ${className}`}
      component={component}
      disablePadding={disablePadding}
      sx={sx}
    >
      {children}
    </List>
  );
}

export default VWorldBuilderList;
