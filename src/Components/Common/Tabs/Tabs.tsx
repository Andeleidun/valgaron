import type { SyntheticEvent } from 'react';
import type { PanelsType } from '../../../types';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import type { SxProps } from '@mui/material/styles';
import { Box } from '../';
import TabPanel from './TabPanel';

/**
 * Build the accessibility attributes for a tab and its paired panel.
 */
function a11yProps(index: number, title: string) {
  return {
    id: `${title}-tab-${index}`,
    'aria-controls': `${title}-tabpanel-${index}`,
  };
}

type WhoTabsProps = {
  panels: PanelsType;
  title: string;
  ariaLabel?: string;
  tabIndex: number;
  setTabIndex: (tabIndex: number) => void;
  sx?: SxProps;
  renderPanels?: boolean;
};

/**
 * Shared tab strip used across routed and in-page workspaces.
 */
function WhoTabs({
  panels,
  title,
  ariaLabel,
  tabIndex,
  sx = {},
  setTabIndex,
  renderPanels = true,
}: WhoTabsProps) {
  const panelCount = panels.length;
  const useDistributedLayout = panelCount >= 2 && panelCount <= 4;
  const handleChange = (_event: SyntheticEvent, newTabIndex: number) => {
    setTabIndex(newTabIndex);
  };

  return (
    <Box>
      <Box>
        <Tabs
          value={tabIndex}
          onChange={handleChange}
          aria-label={
            ariaLabel || panels.map((panel) => panel.title).join(', ')
          }
          className={`${title}-tab-container who-tab-container ${
            useDistributedLayout ? 'who-tab-container--distributed' : ''
          }`}
          variant={useDistributedLayout ? 'fullWidth' : 'scrollable'}
          scrollButtons={useDistributedLayout ? false : 'auto'}
          allowScrollButtonsMobile={!useDistributedLayout}
          sx={sx}
        >
          {panels?.map((panel, index) => (
            <Tab
              label={`${panel.title}`}
              className={`${title}-tab who-tab ${
                tabIndex === index ? 'active' : ''
              }`}
              {...a11yProps(index, title)}
              key={index}
              sx={{
                bgcolor: 'tint.darker',
                color: 'secondary.contrastText',
                minWidth: useDistributedLayout ? 0 : { xs: 112, sm: 140 },
                width: useDistributedLayout ? '100%' : 'auto',
                maxWidth: 'none',
                flex: useDistributedLayout ? '1 1 0' : undefined,
                '&.Mui-selected': {
                  bgcolor: 'secondary.main',
                  color: 'secondary.contrastText',
                },
              }}
            />
          ))}
        </Tabs>
      </Box>
      {renderPanels
        ? panels?.map((panel, index) => (
            <TabPanel
              tabIndex={tabIndex}
              index={index}
              key={index}
              title={title}
            >
              {panel.panel}
            </TabPanel>
          ))
        : null}
    </Box>
  );
}

export default WhoTabs;
