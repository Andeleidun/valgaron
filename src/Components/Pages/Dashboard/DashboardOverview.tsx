import { useContext } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import type {
  CommonStringsType,
  DashboardGuidanceStringsType,
  DashboardFeedItemType,
  DashboardGroupListItemType,
  DashboardPersonListItemType,
  DashboardStringsType,
  ModeType,
} from '../../../types';
import {
  emitWhoTelemetryEvent,
  UserContext,
  useRelationship,
} from '../../../Utlilities';
import { Button, Grid, GridItem, Text } from '../../';
import DashboardSectionCard from './DashboardSectionCard';
import DashboardShell from './DashboardShell';
import {
  buildCommunityPath,
  buildConnectionsPath,
  buildNotificationsPath,
} from './dashboardRoutes';
import {
  buildProfileFreshnessDescription,
  buildProfileFreshnessTimestampLabel,
} from './dashboardFreshness';
import { selectOverviewSummary } from './dashboardSelectors';
import {
  buildDashboardCommunityViewModel,
  buildDashboardCommunityActionLabel,
  buildDashboardConnectionsViewModel,
  buildDashboardOverviewViewModel,
  buildDashboardNotificationsViewModel,
  buildOverviewSubtitle,
} from './dashboardViewModels';
import { resolveDashboardStringGroups } from './dashboardFallbacks';

type DashboardOverviewProps = {
  mode: ModeType;
  strings: {
    dashboard: DashboardStringsType;
    dashboardGuidance: DashboardGuidanceStringsType;
    common: CommonStringsType;
  };
  language: string;
};

/**
 * Dashboard overview landing page with hero guidance and quick actions.
 */
const DashboardOverview = ({
  mode,
  strings,
  language,
}: DashboardOverviewProps) => {
  const {
    dashboard: dashboardStrings,
    dashboardGuidance: dashboardGuidanceStrings,
    common: commonStrings,
  } = resolveDashboardStringGroups(strings);
  const openCommunityLabel = buildDashboardCommunityActionLabel({
    modeId: mode.id,
    language,
    template: dashboardStrings.overview.openCommunity,
  });
  const { user } = useContext(UserContext);
  const { state: relationshipState } = useRelationship();
  const viewModel = buildDashboardOverviewViewModel({
    modeId: mode.id,
    language,
    strings: dashboardStrings,
    guidance: dashboardGuidanceStrings[mode.id],
    user,
    relationshipState,
  });
  const overviewSummary = selectOverviewSummary({
    modeId: mode.id,
    user,
    relationshipState,
  });
  const connectionPreview = buildDashboardConnectionsViewModel({
    modeId: mode.id,
    activeTab: 'connections',
    language,
    strings: dashboardStrings,
    user,
    relationshipState,
  });
  const communityPreview = buildDashboardCommunityViewModel({
    modeId: mode.id,
    activeTab: 'joined',
    language,
    strings: dashboardStrings,
    user,
    relationshipState,
  });
  const notificationPreview = buildDashboardNotificationsViewModel({
    modeId: mode.id,
    activeFilter: 'all',
    language,
    strings: dashboardStrings,
    user,
    relationshipState,
  });
  const topMissingTasks = overviewSummary.completion.missingTaskIds.slice(0, 3);
  const notificationItems = notificationPreview.items.slice(0, 3);
  const connectionItems = connectionPreview.items.slice(0, 4);
  const groupItems = communityPreview.items.slice(0, 4);
  const settingsAction = viewModel.quickActions.find(
    (action) => action.id === 'settings'
  );
  const freshnessDescription = buildProfileFreshnessDescription({
    freshness: overviewSummary.freshness,
    language,
    strings: dashboardStrings,
  });
  const freshnessTimestampLabel = buildProfileFreshnessTimestampLabel({
    freshness: overviewSummary.freshness,
    language,
    strings: dashboardStrings,
  });
  const primaryQuickActions = viewModel.quickActions.filter(
    (action) => action.id !== 'settings'
  );

  /**
   * Emit one dashboard action event for overview-originated navigation.
   */
  const trackDashboardAction = (destination: string): void => {
    emitWhoTelemetryEvent({
      type: 'dashboard_action_clicked',
      modeId: mode.id,
      destination,
    });
  };

  /**
   * Build initials for compact preview tiles when no image is available.
   */
  const getPreviewInitials = (name: string): string =>
    name
      .split(' ')
      .map((value) => value[0] ?? '')
      .join('')
      .slice(0, 2)
      .toUpperCase();

  /**
   * Render a compact visual grid for connection and group previews.
   */
  const renderPreviewGrid = (
    items: Array<DashboardPersonListItemType | DashboardGroupListItemType>,
    emptyLabel: string,
    getItemPath: (
      item: DashboardPersonListItemType | DashboardGroupListItemType
    ) => string
  ) => {
    if (items.length === 0) {
      return (
        <Text variant="body2" color="text.secondary">
          {emptyLabel}
        </Text>
      );
    }

    return (
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
          gap: 10,
        }}
      >
        {items.map((item) => (
          <RouterLink
            key={item.id}
            to={getItemPath(item)}
            style={{ textDecoration: 'none', color: 'inherit' }}
          >
            <div
              style={{
                display: 'grid',
                gap: 8,
                justifyItems: 'center',
                textAlign: 'center',
                padding: 12,
                borderRadius: 14,
                background: 'rgba(0, 0, 0, 0.04)',
              }}
            >
              {item.imageUrl ? (
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 16,
                    objectFit: 'cover',
                  }}
                />
              ) : (
                <div
                  aria-label={item.name}
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 16,
                    background: 'rgba(24, 123, 210, 0.12)',
                    color: '#187bd2',
                    display: 'grid',
                    placeItems: 'center',
                    fontWeight: 700,
                  }}
                >
                  {getPreviewInitials(item.name)}
                </div>
              )}
              <Text variant="body2">{item.name}</Text>
            </div>
          </RouterLink>
        ))}
      </div>
    );
  };

  /**
   * Render a short notification stack for hub triage.
   */
  const renderNotificationPreview = (items: DashboardFeedItemType[]) => {
    if (items.length === 0) {
      return (
        <Text variant="body2" color="text.secondary">
          {dashboardStrings.overview.activityEmpty[language]}
        </Text>
      );
    }

    return (
      <div style={{ display: 'grid', gap: 10 }}>
        {items.map((item) => (
          <div
            key={item.id}
            style={{
              padding: 12,
              borderRadius: 12,
              background: 'rgba(24, 123, 210, 0.08)',
              display: 'grid',
              gap: 4,
            }}
          >
            <Text variant="subtitle2">{item.title}</Text>
            <Text variant="body2" color="text.secondary">
              {item.description}
            </Text>
            {item.primaryAction?.path ? (
              <RouterLink
                to={item.primaryAction.path}
                style={{ textDecoration: 'none' }}
              >
                <Button
                  onClick={() =>
                    trackDashboardAction(item.primaryAction?.path ?? item.id)
                  }
                >
                  {item.primaryAction.label}
                </Button>
              </RouterLink>
            ) : null}
          </div>
        ))}
      </div>
    );
  };

  return (
    <DashboardShell
      mode={mode}
      language={language}
      strings={{ dashboard: dashboardStrings, common: commonStrings }}
      activeSection="overview"
      pageTitle={dashboardStrings.title[language]}
      pageSubtitle={buildOverviewSubtitle({
        modeId: mode.id,
        language,
        strings: dashboardStrings,
        user,
        relationshipState,
      })}
    >
      <Grid spacing={2}>
        <GridItem xs={12}>
          <DashboardSectionCard>
            <Grid spacing={2}>
              <GridItem xs={12} md={8}>
                <Text variant="h5">{viewModel.hero.title}</Text>
                <Text variant="body1" color="text.secondary" sx={{ mt: 1 }}>
                  {viewModel.hero.subtitle}
                </Text>
                {viewModel.hero.ctaLabel && viewModel.hero.ctaPath ? (
                  <div style={{ marginTop: 16 }}>
                    <RouterLink
                      to={viewModel.hero.ctaPath}
                      style={{ textDecoration: 'none' }}
                    >
                      <Button
                        onClick={() =>
                          trackDashboardAction(viewModel.hero.ctaPath ?? 'hero')
                        }
                      >
                        {viewModel.hero.ctaLabel}
                      </Button>
                    </RouterLink>
                  </div>
                ) : null}
              </GridItem>
              <GridItem xs={12} md={4}>
                <div
                  style={{
                    padding: 16,
                    borderRadius: 16,
                    background:
                      viewModel.hero.mode === 'progress'
                        ? 'rgba(24, 123, 210, 0.12)'
                        : 'rgba(17, 152, 72, 0.12)',
                    display: 'grid',
                    gap: 8,
                  }}
                >
                  <Text variant="subtitle2" color="text.secondary">
                    {viewModel.hero.primaryMetricLabel}
                  </Text>
                  <Text variant="h3">{viewModel.hero.primaryMetricValue}</Text>
                  {viewModel.hero.secondaryLabel &&
                  viewModel.hero.secondaryValue ? (
                    <>
                      <Text variant="subtitle2" color="text.secondary">
                        {viewModel.hero.secondaryLabel}
                      </Text>
                      <Text variant="body1">
                        {viewModel.hero.secondaryValue}
                      </Text>
                    </>
                  ) : null}
                </div>
              </GridItem>
            </Grid>
          </DashboardSectionCard>
        </GridItem>
        <GridItem xs={12} sm={6} lg={3}>
          <DashboardSectionCard
            title={dashboardStrings.overview.profileStrengthTitle[language]}
            subtitle={dashboardStrings.completionDescription[language]}
          >
            <div style={{ display: 'grid', gap: 12 }}>
              <Text variant="h4">{`${viewModel.summary.profileStrength}%`}</Text>
              {topMissingTasks.length > 0 ? (
                <div style={{ display: 'grid', gap: 8 }}>
                  <Text variant="subtitle2" color="text.secondary">
                    {dashboardStrings.overview.prioritiesTitle[language]}
                  </Text>
                  {topMissingTasks.map((taskId) => (
                    <div
                      key={taskId}
                      style={{
                        padding: 12,
                        borderRadius: 12,
                        background: 'rgba(24, 123, 210, 0.08)',
                      }}
                    >
                      <Text variant="body2">
                        {dashboardStrings.tasks[taskId]?.[language] ?? taskId}
                      </Text>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ display: 'grid', gap: 10 }}>
                  <Text variant="body2" color="text.secondary">
                    {dashboardStrings.overview.profileComplete[language]}
                  </Text>
                  {overviewSummary.freshness.isActionable ? (
                    <div
                      style={{
                        display: 'grid',
                        gap: 8,
                        padding: 12,
                        borderRadius: 12,
                        background: 'rgba(24, 123, 210, 0.08)',
                      }}
                    >
                      <Text variant="subtitle2">
                        {dashboardStrings.viewModels.freshness.title[language]}
                      </Text>
                      <Text variant="body2" color="text.secondary">
                        {freshnessDescription}
                      </Text>
                      {freshnessTimestampLabel ? (
                        <Text variant="caption">{freshnessTimestampLabel}</Text>
                      ) : null}
                      <RouterLink
                        to="/dashboard/profile"
                        style={{ textDecoration: 'none' }}
                      >
                        <Button
                          onClick={() =>
                            trackDashboardAction('/dashboard/profile')
                          }
                        >
                          {
                            dashboardStrings.viewModels.freshness.refreshCta[
                              language
                            ]
                          }
                        </Button>
                      </RouterLink>
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          </DashboardSectionCard>
        </GridItem>
        <GridItem xs={12} sm={6} lg={3}>
          <DashboardSectionCard
            title={dashboardStrings.viewModels.stats.notifications[language]}
            subtitle={
              dashboardStrings.notificationsWorkspace.sectionSubtitle[language]
            }
          >
            <div style={{ display: 'grid', gap: 12 }}>
              <Text variant="h4">{`${viewModel.summary.unreadNotificationCount}`}</Text>
              {renderNotificationPreview(notificationItems)}
              <RouterLink
                to={buildNotificationsPath({ filter: 'all' })}
                style={{ textDecoration: 'none' }}
              >
                <Button
                  fullWidth
                  onClick={() =>
                    trackDashboardAction(
                      buildNotificationsPath({ filter: 'all' })
                    )
                  }
                >
                  {dashboardStrings.overview.openFeed[language]}
                </Button>
              </RouterLink>
            </div>
          </DashboardSectionCard>
        </GridItem>
        <GridItem xs={12} sm={6} lg={3}>
          <DashboardSectionCard
            title={dashboardStrings.viewModels.stats.connections[language]}
            subtitle={buildOverviewSubtitle({
              modeId: mode.id,
              language,
              strings: dashboardStrings,
              user,
              relationshipState,
            })}
          >
            <div style={{ display: 'grid', gap: 12 }}>
              <Text variant="h4">{`${viewModel.summary.connectionCount}`}</Text>
              {renderPreviewGrid(
                connectionItems,
                dashboardStrings.overview.connectionsEmpty[language],
                (item) => buildConnectionsPath('connections', item.id)
              )}
              <RouterLink
                to={buildConnectionsPath('connections')}
                style={{ textDecoration: 'none' }}
              >
                <Button
                  fullWidth
                  onClick={() =>
                    trackDashboardAction(buildConnectionsPath('connections'))
                  }
                >
                  {dashboardStrings.overview.openConnections[language]}
                </Button>
              </RouterLink>
            </div>
          </DashboardSectionCard>
        </GridItem>
        <GridItem xs={12} sm={6} lg={3}>
          <DashboardSectionCard
            title={dashboardStrings.viewModels.stats.joinedGroups[language]}
            subtitle={
              dashboardStrings.communityWorkspace.sectionSubtitle[language]
            }
          >
            <div style={{ display: 'grid', gap: 12 }}>
              <Text variant="h4">{`${viewModel.summary.joinedGroupCount}`}</Text>
              {renderPreviewGrid(
                groupItems,
                dashboardStrings.overview.communityEmpty[language],
                (item) =>
                  buildCommunityPath({
                    tab: 'joined',
                    previewId: item.id,
                  })
              )}
              <RouterLink
                to={buildCommunityPath({ tab: 'joined' })}
                style={{ textDecoration: 'none' }}
              >
                <Button
                  fullWidth
                  onClick={() =>
                    trackDashboardAction(buildCommunityPath({ tab: 'joined' }))
                  }
                >
                  {openCommunityLabel}
                </Button>
              </RouterLink>
            </div>
          </DashboardSectionCard>
        </GridItem>
        {viewModel.nextAction ? (
          <GridItem xs={12} md={7}>
            <DashboardSectionCard title={viewModel.nextAction.title}>
              <Text variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                {viewModel.nextAction.description}
              </Text>
              {viewModel.nextAction.supportingMessages &&
              viewModel.nextAction.supportingMessages.length > 0 ? (
                <div style={{ display: 'grid', gap: 8, marginBottom: 16 }}>
                  {viewModel.nextAction.supportingMessages.map((message) => (
                    <Text key={message} variant="body2" color="text.secondary">
                      {message}
                    </Text>
                  ))}
                </div>
              ) : null}
              <RouterLink
                to={viewModel.nextAction.ctaPath}
                style={{ textDecoration: 'none' }}
              >
                <Button
                  onClick={() =>
                    trackDashboardAction(
                      viewModel.nextAction?.ctaPath ?? 'next_action'
                    )
                  }
                >
                  {viewModel.nextAction.ctaLabel}
                </Button>
              </RouterLink>
            </DashboardSectionCard>
          </GridItem>
        ) : null}
        <GridItem xs={12} md={viewModel.nextAction ? 5 : 12}>
          <DashboardSectionCard
            title={dashboardStrings.overview.quickActionsTitle[language]}
          >
            <div style={{ display: 'grid', gap: 12 }}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                  gap: 12,
                }}
              >
                {primaryQuickActions.map((action) => (
                  <RouterLink
                    key={action.id}
                    to={action.path}
                    style={{ textDecoration: 'none' }}
                  >
                    <Button
                      fullWidth
                      onClick={() => trackDashboardAction(action.path)}
                    >
                      {action.label}
                    </Button>
                  </RouterLink>
                ))}
              </div>
              {settingsAction ? (
                <RouterLink
                  to={settingsAction.path}
                  style={{ textDecoration: 'none' }}
                >
                  <Button
                    fullWidth
                    onClick={() => trackDashboardAction(settingsAction.path)}
                  >
                    {settingsAction.label}
                  </Button>
                </RouterLink>
              ) : null}
            </div>
          </DashboardSectionCard>
        </GridItem>
        <GridItem xs={12}>
          <DashboardSectionCard
            title={dashboardStrings.overview.recentActivityTitle[language]}
            subtitle={
              dashboardStrings.overview.recentActivitySubtitle[language]
            }
          >
            <div style={{ display: 'grid', gap: 12 }}>
              {notificationPreview.items.slice(0, 3).map((item) => (
                <div
                  key={item.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: 16,
                    alignItems: 'center',
                    padding: 12,
                    borderRadius: 12,
                    background: 'rgba(0, 0, 0, 0.04)',
                    flexWrap: 'wrap',
                  }}
                >
                  <div style={{ flex: '1 1 240px' }}>
                    <Text variant="subtitle2">{item.title}</Text>
                    <Text variant="body2" color="text.secondary">
                      {item.description}
                    </Text>
                  </div>
                  {item.primaryAction ? (
                    <RouterLink
                      to={
                        item.primaryAction.path ??
                        buildNotificationsPath({ filter: 'all' })
                      }
                      style={{ textDecoration: 'none' }}
                    >
                      <Button
                        onClick={() =>
                          trackDashboardAction(
                            item.primaryAction?.path ??
                              buildNotificationsPath({ filter: 'all' })
                          )
                        }
                      >
                        {item.primaryAction.label}
                      </Button>
                    </RouterLink>
                  ) : null}
                </div>
              ))}
              {notificationPreview.items.length === 0 ? (
                <Text variant="body2" color="text.secondary">
                  {dashboardStrings.overview.recentActivityEmpty[language]}
                </Text>
              ) : null}
            </div>
          </DashboardSectionCard>
        </GridItem>
      </Grid>
    </DashboardShell>
  );
};

export default DashboardOverview;
