import type { ReactNode, SyntheticEvent } from 'react';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import type { SxProps } from '@mui/material/styles';
import { Box } from '../';
import TabPanel from './TabPanel';

type TabPanelConfig = {
  title: string;
  panel: ReactNode;
};

/**
 * Build the accessibility attributes for a tab and its paired panel.
 */
function a11yProps(index: number, title: string) {
  return {
    id: `${title}-tab-${index}`,
    'aria-controls': `${title}-tabpanel-${index}`,
  };
}

type VWorldBuilderTabsProps = {
  panels: TabPanelConfig[];
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
function VWorldBuilderTabs({
  panels,
  title,
  ariaLabel,
  tabIndex,
  sx = {},
  setTabIndex,
  renderPanels = true,
}: VWorldBuilderTabsProps) {
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
          className={`${title}-tab-container vwb-tab-container ${
            useDistributedLayout ? 'vwb-tab-container--distributed' : ''
          }`}
          variant={useDistributedLayout ? 'fullWidth' : 'scrollable'}
          scrollButtons={useDistributedLayout ? false : 'auto'}
          allowScrollButtonsMobile={!useDistributedLayout}
          sx={sx}
        >
          {panels?.map((panel, index) => (
            <Tab
              label={`${panel.title}`}
              className={`${title}-tab vwb-tab ${
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

export default VWorldBuilderTabs;
