import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import type {
  DashboardStringsType,
  DashboardSectionType,
  DashboardTopTabItemType,
  PanelsType,
} from '../../../types';
import { Tabs } from '../../';

type DashboardTopTabsProps = {
  activeSection: DashboardSectionType;
  items: DashboardTopTabItemType[];
  strings: DashboardStringsType;
  language: string;
};

/**
 * Route-driven top tabs for the consolidated dashboard workspace.
 */
const DashboardTopTabs = ({
  activeSection,
  items,
  strings,
  language,
}: DashboardTopTabsProps) => {
  const navigate = useNavigate();
  const panels = useMemo<PanelsType>(
    () =>
      items.map((item) => ({
        title:
          item.badgeCount && item.badgeCount > 0
            ? `${item.label} (${item.badgeCount})`
            : item.label,
        panel: null,
      })),
    [items]
  );
  const activeTabIndex = Math.max(
    items.findIndex((item) => item.id === activeSection),
    0
  );

  return (
    <div aria-label={strings.shell.sectionAriaLabel[language]}>
      <Tabs
        panels={panels}
        title="dashboard-top-tabs"
        tabIndex={activeTabIndex}
        setTabIndex={(nextTabIndex) => navigate(items[nextTabIndex].path)}
        renderPanels={false}
        sx={{ mb: 2 }}
      />
    </div>
  );
};

export default DashboardTopTabs;
