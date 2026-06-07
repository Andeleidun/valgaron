import { ReactNode } from 'react';
import ListItem from '@mui/material/ListItem';
import { SxProps } from '@mui/material/styles';

type ListItemProps = {
  children: ReactNode;
  className?: string;
  component?: 'li' | 'div';
  disablePadding?: boolean;
  sx?: SxProps;
};

function WhoListItem({
  children,
  className = '',
  component = 'li',
  disablePadding = false,
  sx = {},
}: ListItemProps) {
  return (
    <ListItem
      className={`list-item ${className}`}
      component={component}
      disablePadding={disablePadding}
      sx={sx}
    >
      {children}
    </ListItem>
  );
}

export default WhoListItem;
