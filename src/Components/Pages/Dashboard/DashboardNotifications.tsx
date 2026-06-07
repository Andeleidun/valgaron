import { useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import type {
  CommonStringsType,
  DashboardNotificationFilterType,
  DashboardPreviewEntityType,
  DashboardStringsType,
  ModeType,
  PanelsType,
} from '../../../types';
import {
  areDashboardNotificationIdListsEqual,
  loadDashboardNotificationState,
  persistDashboardNotificationState,
  pruneDashboardNotificationState,
  emitWhoTelemetryEvent,
  UserContext,
  pageIds,
  useRelationship,
} from '../../../Utlilities';
import { Button, Grid, GridItem, Tabs, Text } from '../../';
import { parseNotificationFilter } from './dashboardRoutes';
import DashboardEmptyState from './DashboardEmptyState';
import DashboardPreviewPanel from './DashboardPreviewPanel';
import DashboardSectionCard from './DashboardSectionCard';
import DashboardShell from './DashboardShell';
import { formatDashboardTemplate } from './dashboardStrings';
import { buildDashboardNotificationsViewModel } from './dashboardViewModels';
import { resolveDashboardStringGroups } from './dashboardFallbacks';

type DashboardNotificationsProps = {
  mode: ModeType;
  strings: {
    dashboard: DashboardStringsType;
    common: CommonStringsType;
  };
  language: string;
};

/**
 * Build the preview descriptor for one notification item.
 */
const buildNotificationPreviewEntity = (
  notificationId: string
): DashboardPreviewEntityType => ({
  kind: 'notification',
  notificationId,
});

/**
 * Notifications center embedded inside the dashboard workspace.
 */
const DashboardNotifications = ({
  mode,
  strings,
  language,
}: DashboardNotificationsProps) => {
  const { dashboard: dashboardStrings, common: commonStrings } =
    resolveDashboardStringGroups(strings);
  const { user } = useContext(UserContext);
  const { state: relationshipState } = useRelationship();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const activeFilter = parseNotificationFilter(searchParams.get('filter'));
  const allNotificationsViewModel = buildDashboardNotificationsViewModel({
    modeId: mode.id,
    activeFilter: 'all',
    language,
    strings: dashboardStrings,
    user,
    relationshipState,
  });
  const viewModel = buildDashboardNotificationsViewModel({
    modeId: mode.id,
    activeFilter,
    language,
    strings: dashboardStrings,
    user,
    relationshipState,
  });
  const [readNotificationIds, setReadNotificationIds] = useState<string[]>(
    () => loadDashboardNotificationState(mode.id).readNotificationIds
  );
  const [dismissedNotificationIds, setDismissedNotificationIds] = useState<
    string[]
  >(() => loadDashboardNotificationState(mode.id).dismissedNotificationIds);
  const [loadedModeId, setLoadedModeId] = useState(mode.id);
  const allNotificationIds = useMemo(
    () => allNotificationsViewModel.items.map((item) => item.id),
    [allNotificationsViewModel.items]
  );
  const unreadNotificationCount = useMemo(() => {
    const readNotificationIdSet = new Set(readNotificationIds);
    const dismissedNotificationIdSet = new Set(dismissedNotificationIds);

    return allNotificationIds.filter(
      (notificationId) =>
        !readNotificationIdSet.has(notificationId) &&
        !dismissedNotificationIdSet.has(notificationId)
    ).length;
  }, [allNotificationIds, dismissedNotificationIds, readNotificationIds]);
  const pageSubtitle = formatDashboardTemplate(
    dashboardStrings.viewModels.summaries.notificationsTemplate[language],
    {
      count: unreadNotificationCount,
    }
  );

  useEffect(() => {
    const persistedState = loadDashboardNotificationState(mode.id);
    setLoadedModeId(mode.id);
    setReadNotificationIds(persistedState.readNotificationIds);
    setDismissedNotificationIds(persistedState.dismissedNotificationIds);
  }, [mode.id]);

  useEffect(() => {
    if (loadedModeId !== mode.id) {
      return;
    }

    const nextState = pruneDashboardNotificationState({
      state: {
        readNotificationIds,
        dismissedNotificationIds,
      },
      validNotificationIds: allNotificationIds,
    });

    if (
      !areDashboardNotificationIdListsEqual(
        readNotificationIds,
        nextState.readNotificationIds
      ) ||
      !areDashboardNotificationIdListsEqual(
        dismissedNotificationIds,
        nextState.dismissedNotificationIds
      )
    ) {
      setReadNotificationIds(nextState.readNotificationIds);
      setDismissedNotificationIds(nextState.dismissedNotificationIds);
      return;
    }

    persistDashboardNotificationState({
      modeId: mode.id,
      state: nextState,
    });
  }, [
    allNotificationIds,
    dismissedNotificationIds,
    loadedModeId,
    mode.id,
    readNotificationIds,
  ]);
  const visibleItems = useMemo(
    () =>
      viewModel.items
        .filter((item) => !dismissedNotificationIds.includes(item.id))
        .sort((leftItem, rightItem) => {
          const leftUnread = readNotificationIds.includes(leftItem.id) ? 0 : 1;
          const rightUnread = readNotificationIds.includes(rightItem.id)
            ? 0
            : 1;
          return rightUnread - leftUnread;
        }),
    [dismissedNotificationIds, readNotificationIds, viewModel.items]
  );
  const [previewEntity, setPreviewEntity] =
    useState<DashboardPreviewEntityType | null>(null);

  useEffect(() => {
    if (visibleItems.length === 0) {
      setPreviewEntity(null);
      return;
    }

    const selectedNotificationId =
      previewEntity?.kind === 'notification'
        ? previewEntity.notificationId
        : null;

    if (
      selectedNotificationId &&
      visibleItems.some((item) => item.id === selectedNotificationId)
    ) {
      return;
    }

    setPreviewEntity(buildNotificationPreviewEntity(visibleItems[0].id));
  }, [previewEntity, visibleItems]);

  const selectedItem = useMemo(
    () =>
      previewEntity?.kind === 'notification'
        ? visibleItems.find(
            (item) => item.id === previewEntity.notificationId
          ) ?? null
        : null,
    [previewEntity, visibleItems]
  );

  /**
   * Persist a notification-state transition immediately so routed navigations do
   * not lose read or dismiss actions before the effect-based sync runs.
   */
  const commitNotificationState = ({
    nextReadNotificationIds,
    nextDismissedNotificationIds,
  }: {
    nextReadNotificationIds: string[];
    nextDismissedNotificationIds: string[];
  }): void => {
    const nextState = pruneDashboardNotificationState({
      state: {
        readNotificationIds: nextReadNotificationIds,
        dismissedNotificationIds: nextDismissedNotificationIds,
      },
      validNotificationIds: allNotificationIds,
    });

    if (
      !areDashboardNotificationIdListsEqual(
        readNotificationIds,
        nextState.readNotificationIds
      )
    ) {
      setReadNotificationIds(nextState.readNotificationIds);
    }
    if (
      !areDashboardNotificationIdListsEqual(
        dismissedNotificationIds,
        nextState.dismissedNotificationIds
      )
    ) {
      setDismissedNotificationIds(nextState.dismissedNotificationIds);
    }

    persistDashboardNotificationState({
      modeId: mode.id,
      state: nextState,
    });
  };

  const handlePrimaryAction = (notificationId: string): void => {
    const targetItem = visibleItems.find((item) => item.id === notificationId);
    const destinationPath =
      targetItem?.primaryAction?.path ??
      (targetItem?.type === 'connections'
        ? '/dashboard/connections?tab=interested'
        : targetItem?.type === 'community'
        ? '/dashboard/community?tab=activity'
        : targetItem?.type === 'messages'
        ? '/messages'
        : `/dashboard/${pageIds.profile}`);

    if (!readNotificationIds.includes(notificationId)) {
      commitNotificationState({
        nextReadNotificationIds: [...readNotificationIds, notificationId],
        nextDismissedNotificationIds: dismissedNotificationIds,
      });
    }

    emitWhoTelemetryEvent({
      type: 'dashboard_action_clicked',
      modeId: mode.id,
      destination: destinationPath,
    });
    navigate(destinationPath);
  };

  const markRead = (notificationId: string): void => {
    if (readNotificationIds.includes(notificationId)) {
      return;
    }

    commitNotificationState({
      nextReadNotificationIds: [...readNotificationIds, notificationId],
      nextDismissedNotificationIds: dismissedNotificationIds,
    });
  };

  const dismissNotification = (notificationId: string): void => {
    if (dismissedNotificationIds.includes(notificationId)) {
      return;
    }

    commitNotificationState({
      nextReadNotificationIds: readNotificationIds,
      nextDismissedNotificationIds: [
        ...dismissedNotificationIds,
        notificationId,
      ],
    });
    setPreviewEntity((previousEntity) => {
      if (
        previousEntity?.kind !== 'notification' ||
        previousEntity.notificationId !== notificationId
      ) {
        return previousEntity;
      }

      const nextVisibleItem = visibleItems.find(
        (item) => item.id !== notificationId
      );

      return nextVisibleItem
        ? buildNotificationPreviewEntity(nextVisibleItem.id)
        : null;
    });
  };

  const filters: DashboardNotificationFilterType[] = [
    'all',
    'connections',
    'community',
    'messages',
    'profile',
  ];
  const notificationPanels = useMemo<PanelsType>(
    () =>
      filters.map((filterId) => ({
        title:
          dashboardStrings.notificationsWorkspace.filters[filterId][language],
        panel: null,
      })),
    [dashboardStrings.notificationsWorkspace.filters, filters, language]
  );
  const activeTabIndex = Math.max(filters.indexOf(activeFilter), 0);

  return (
    <DashboardShell
      mode={mode}
      language={language}
      strings={{ dashboard: dashboardStrings, common: commonStrings }}
      activeSection="notifications"
      pageTitle={dashboardStrings.notificationsWorkspace.pageTitle[language]}
      pageSubtitle={pageSubtitle}
      notificationBadgeCountOverride={unreadNotificationCount}
      preview={
        <DashboardPreviewPanel
          title={dashboardStrings.notificationsWorkspace.previewTitle[language]}
          subtitle={
            dashboardStrings.notificationsWorkspace.previewSubtitle[language]
          }
        >
          {selectedItem ? (
            <div style={{ display: 'grid', gap: 10 }}>
              <Text variant="h6">{selectedItem.title}</Text>
              <Text variant="body2" color="text.secondary">
                {selectedItem.description}
              </Text>
              {selectedItem.timestampLabel ? (
                <Text variant="caption">{selectedItem.timestampLabel}</Text>
              ) : null}
              <div style={{ display: 'grid', gap: 8 }}>
                {selectedItem.primaryAction ? (
                  <Button
                    color="primary"
                    onClick={() => handlePrimaryAction(selectedItem.id)}
                  >
                    {selectedItem.primaryAction.label}
                  </Button>
                ) : null}
                <Button
                  color={selectedItem.primaryAction ? 'secondary' : 'primary'}
                  onClick={() => markRead(selectedItem.id)}
                  disabled={readNotificationIds.includes(selectedItem.id)}
                >
                  {dashboardStrings.notificationsWorkspace.markRead[language]}
                </Button>
                <Button
                  color="secondary"
                  onClick={() => dismissNotification(selectedItem.id)}
                >
                  {commonStrings.dismiss[language]}
                </Button>
              </div>
            </div>
          ) : (
            <Text variant="body2" color="text.secondary">
              {dashboardStrings.notificationsWorkspace.previewEmpty[language]}
            </Text>
          )}
        </DashboardPreviewPanel>
      }
      headerActions={
        <div style={{ width: '100%' }}>
          <Tabs
            panels={notificationPanels}
            title="dashboard-notifications-tabs"
            tabIndex={activeTabIndex}
            setTabIndex={(nextTabIndex) =>
              setSearchParams({
                filter: filters[nextTabIndex],
              })
            }
            renderPanels={false}
          />
        </div>
      }
    >
      <DashboardSectionCard
        title={dashboardStrings.notificationsWorkspace.sectionTitle[language]}
        subtitle={
          dashboardStrings.notificationsWorkspace.sectionSubtitle[language]
        }
      >
        {visibleItems.length === 0 ? (
          <DashboardEmptyState
            title={dashboardStrings.notificationsWorkspace.emptyTitle[language]}
            description={
              dashboardStrings.notificationsWorkspace.emptyDescription[language]
            }
          />
        ) : (
          <Grid spacing={2}>
            {visibleItems.map((item) => (
              <GridItem xs={12} key={item.id}>
                <div
                  data-testid={`dashboard-notification-row-${item.id}`}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: 16,
                    alignItems: 'center',
                    padding: 16,
                    borderRadius: 12,
                    background: readNotificationIds.includes(item.id)
                      ? 'rgba(0, 0, 0, 0.03)'
                      : 'rgba(24, 123, 210, 0.08)',
                    flexWrap: 'wrap',
                  }}
                >
                  <div style={{ flex: '1 1 240px' }}>
                    <Text variant="subtitle1">{item.title}</Text>
                    <Text variant="body2" color="text.secondary">
                      {item.description}
                    </Text>
                    {item.timestampLabel ? (
                      <Text variant="caption">{item.timestampLabel}</Text>
                    ) : null}
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <Button
                      color="secondary"
                      onClick={() =>
                        setPreviewEntity(
                          buildNotificationPreviewEntity(item.id)
                        )
                      }
                    >
                      {
                        dashboardStrings.notificationsWorkspace.previewButton[
                          language
                        ]
                      }
                    </Button>
                    {item.primaryAction ? (
                      <Button
                        color="primary"
                        onClick={() => handlePrimaryAction(item.id)}
                      >
                        {item.primaryAction.label}
                      </Button>
                    ) : null}
                    <Button
                      color={item.primaryAction ? 'secondary' : 'primary'}
                      onClick={() => markRead(item.id)}
                      disabled={readNotificationIds.includes(item.id)}
                    >
                      {
                        dashboardStrings.notificationsWorkspace.markRead[
                          language
                        ]
                      }
                    </Button>
                    <Button
                      color="secondary"
                      onClick={() => dismissNotification(item.id)}
                    >
                      {commonStrings.dismiss[language]}
                    </Button>
                  </div>
                </div>
              </GridItem>
            ))}
          </Grid>
        )}
      </DashboardSectionCard>
    </DashboardShell>
  );
};

export default DashboardNotifications;
