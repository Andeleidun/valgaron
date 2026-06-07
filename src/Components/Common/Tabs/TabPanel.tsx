import { ReactNode } from 'react';
import { SxProps } from '@mui/material/styles';
import { Box } from '../';

interface TabPanelProps {
  children?: ReactNode;
  index: number;
  tabIndex: number;
  title: string;
  sx?: SxProps;
}

function TabPanel({
  children,
  tabIndex,
  index,
  sx = {},
  title,
}: TabPanelProps) {
  const show = tabIndex === index;
  return (
    <Box
      role="tabpanel"
      id={`${title}-tabpanel-${index}`}
      aria-labelledby={`${title}-tab-${index}`}
      hidden={!show}
      sx={sx}
    >
      {show && <Box>{children}</Box>}
    </Box>
  );
}

export default TabPanel;
