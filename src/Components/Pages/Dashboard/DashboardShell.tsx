import { useContext, useMemo, type ReactNode } from 'react';
import type {
  CommonStringsType,
  DashboardSectionType,
  DashboardStringsType,
  DashboardTopTabItemType,
  ModeType,
} from '../../../types';
import { UserContext, useRelationship } from '../../../Utlilities';
import { Container, Grid, GridItem } from '../../';
import { resolveDashboardStringGroups } from './dashboardFallbacks';
import { dashboardSectionPaths } from './dashboardRoutes';
import { selectDashboardShellSummary } from './dashboardSelectors';
import DashboardPageHeader from './DashboardPageHeader';
import DashboardTopTabs from './DashboardTopTabs';

type DashboardShellProps = {
  mode: ModeType;
  language: string;
  strings: {
    dashboard: DashboardStringsType;
    common: CommonStringsType;
  };
  pageTitle: string;
  pageSubtitle?: string;
  headerDetails?: ReactNode;
  activeSection: DashboardSectionType;
  preview?: ReactNode;
  headerActions?: ReactNode;
  notificationBadgeCountOverride?: number;
  children: ReactNode;
};

/**
 * Shared dashboard layout with top tabs, page header, and optional preview rail.
 */
const DashboardShell = ({
  mode,
  language,
  strings,
  pageTitle,
  pageSubtitle,
  headerDetails,
  activeSection,
  preview,
  headerActions,
  notificationBadgeCountOverride,
  children,
}: DashboardShellProps) => {
  const { dashboard: dashboardStrings, pages } =
    resolveDashboardStringGroups(strings);
  const pageStrings = pages[mode.id];
  const { user } = useContext(UserContext);
  const { state: relationshipState } = useRelationship();
  const shellSummary = selectDashboardShellSummary({
    modeId: mode.id,
    user,
    relationshipState,
  });
  const labels = dashboardStrings.shell.sections;
  const modeSectionLabels = dashboardStrings.shell.modeSections;
  const topTabs = useMemo<DashboardTopTabItemType[]>(
    () => [
      {
        id: 'overview',
        label: labels.overview[language],
        path: dashboardSectionPaths.overview,
      },
      {
        id: 'profile',
        label: pageStrings.profile[language],
        path: dashboardSectionPaths.profile,
      },
      {
        id: 'connections',
        label: modeSectionLabels.connections[mode.id][language],
        path: dashboardSectionPaths.connections,
        badgeCount: shellSummary.pendingInterestCount,
      },
      {
        id: 'community',
        label: pageStrings.community[language],
        path: dashboardSectionPaths.community,
        badgeCount: shellSummary.joinedGroupCount,
      },
      {
        id: 'notifications',
        label: labels.notifications[language],
        path: dashboardSectionPaths.notifications,
        badgeCount:
          notificationBadgeCountOverride ??
          shellSummary.unreadNotificationCount,
      },
      {
        id: 'settings',
        label: labels.settings[language],
        path: dashboardSectionPaths.settings,
      },
    ],
    [
      language,
      labels,
      mode.id,
      modeSectionLabels.connections,
      pageStrings.community,
      pageStrings.profile,
      shellSummary.joinedGroupCount,
      shellSummary.pendingInterestCount,
      shellSummary.unreadNotificationCount,
      notificationBadgeCountOverride,
    ]
  );

  return (
    <Container component="main" className={`who-main dashboard ${mode.id}`}>
      <DashboardTopTabs
        activeSection={activeSection}
        items={topTabs}
        strings={dashboardStrings}
        language={language}
      />
      <DashboardPageHeader
        title={pageTitle}
        subtitle={pageSubtitle}
        details={headerDetails}
        actions={headerActions}
      />
      <Grid spacing={2} sx={{ mt: 0.5 }}>
        <GridItem xs={12} md={preview ? 8 : 12}>
          {children}
        </GridItem>
        {preview ? (
          <GridItem xs={12} md={4}>
            {preview}
          </GridItem>
        ) : null}
      </Grid>
    </Container>
  );
};

export default DashboardShell;
