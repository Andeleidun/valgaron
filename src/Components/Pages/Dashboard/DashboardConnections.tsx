import {
  useContext,
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import TextField from '@mui/material/TextField';
import type {
  CommonStringsType,
  DashboardConnectionsTabType,
  DashboardPersonListItemType,
  DashboardPreviewEntityType,
  DashboardStringsType,
  ModeType,
  PanelsType,
  ProfileType,
} from '../../../types';
import {
  evaluateConnectionRequestGate,
  resolveGateActor,
  resolveVisibleProfileFieldValue,
  UserContext,
  useRelationship,
} from '../../../Utlilities';
import { getProfilesForMode } from '../../../Utlilities/data';
import { useAuth } from '../../../Utlilities/auth/AuthContext';
import { LOCAL_AUTH_USER_UID } from '../../../Utlilities/auth/localIdentity';
import { emitWhoTelemetryEvent } from '../../../Utlilities/telemetry';
import { Button, Grid, GridItem, Tabs, Text } from '../../';
import {
  buildDiscoveryPath,
  buildMessagesPath,
  parseConnectionsTab,
} from './dashboardRoutes';
import DashboardEmptyState from './DashboardEmptyState';
import { resolveDashboardStringGroups } from './dashboardFallbacks';
import DashboardPreviewPanel from './DashboardPreviewPanel';
import DashboardSectionCard from './DashboardSectionCard';
import DashboardShell from './DashboardShell';
import {
  buildConnectionsSubtitle,
  buildDashboardConnectionsViewModel,
} from './dashboardViewModels';

type DashboardConnectionsProps = {
  mode: ModeType;
  strings: {
    dashboard: DashboardStringsType;
    common: CommonStringsType;
  };
  language: string;
};

type ConnectionWorkspaceFilterType = 'all' | 'actionable' | 'settled';

type RequestStatusType =
  | 'ready'
  | 'accept'
  | 'already_connected'
  | 'already_requested'
  | 'declined_conflict'
  | 'self';

const CONNECTION_TAB_IDS: DashboardConnectionsTabType[] = [
  'connections',
  'interested',
  'requests',
];

/**
 * Evaluate whether one connections workspace item belongs in the current filter.
 */
export const matchesConnectionWorkspaceFilter = ({
  item,
  workspaceFilter,
  activeTab,
}: {
  item: DashboardPersonListItemType;
  workspaceFilter: ConnectionWorkspaceFilterType;
  activeTab: DashboardConnectionsTabType;
}): boolean => {
  if (workspaceFilter === 'actionable') {
    return Boolean(item.primaryAction && !item.primaryAction.disabled);
  }

  if (workspaceFilter === 'settled') {
    return activeTab === 'connections' || Boolean(item.primaryAction?.disabled);
  }

  return true;
};

/**
 * Normalize free-text search into comparable lowercase tokens.
 */
const normalizeSearchText = (value: string): string =>
  value.trim().toLowerCase();

/**
 * Build searchable text for a candidate profile.
 */
const buildProfileSearchIndex = ({
  profile,
  language,
  viewerActor,
  isConnection,
}: {
  profile: ProfileType;
  language: string;
  viewerActor: ReturnType<typeof resolveGateActor>;
  isConnection: boolean;
}): string => {
  const name = resolveVisibleProfileFieldValue({
    profile,
    fieldName: 'name',
    value: profile.name,
    language,
    viewer: viewerActor,
    isConnection,
  });
  const location = resolveVisibleProfileFieldValue({
    profile,
    fieldName: 'location',
    value: profile.main?.location,
    language,
    viewer: viewerActor,
    isConnection,
  });
  const email = resolveVisibleProfileFieldValue({
    profile,
    fieldName: 'email',
    value: profile.about?.email,
    language,
    viewer: viewerActor,
    isConnection,
  });
  const affiliation = resolveVisibleProfileFieldValue({
    profile,
    fieldName: 'primaryAffiliation',
    value: profile.main?.primaryAffiliation,
    language,
    viewer: viewerActor,
    isConnection,
  });
  const industry = resolveVisibleProfileFieldValue({
    profile,
    fieldName: 'industry',
    value: profile.main?.industry,
    language,
    viewer: viewerActor,
    isConnection,
  });
  const fieldOfStudy = resolveVisibleProfileFieldValue({
    profile,
    fieldName: 'fieldOfStudy',
    value: profile.main?.fieldOfStudy,
    language,
    viewer: viewerActor,
    isConnection,
  });

  return [name, location, email, affiliation, industry, fieldOfStudy]
    .join(' ')
    .toLowerCase();
};

/**
 * Resolve the current direct-request status for a profile.
 */
const getRequestStatus = ({
  profile,
  currentProfileId,
  connectionIds,
  outgoingConnectionRequestIds,
  incomingConnectionRequestIds,
  incomingInterestIds,
  declinedProfileIds,
}: {
  profile: ProfileType;
  currentProfileId?: string;
  connectionIds: string[];
  outgoingConnectionRequestIds: string[];
  incomingConnectionRequestIds: string[];
  incomingInterestIds: string[];
  declinedProfileIds: string[];
}): RequestStatusType => {
  if (currentProfileId && profile.id === currentProfileId) {
    return 'self';
  }
  if (connectionIds.includes(profile.id)) {
    return 'already_connected';
  }
  if (outgoingConnectionRequestIds.includes(profile.id)) {
    return 'already_requested';
  }
  if (
    incomingConnectionRequestIds.includes(profile.id) ||
    incomingInterestIds.includes(profile.id)
  ) {
    return 'accept';
  }
  if (declinedProfileIds.includes(profile.id)) {
    return 'declined_conflict';
  }
  return 'ready';
};

/**
 * Consolidated connections workspace for connections, interest, and requests.
 */
const DashboardConnections = ({
  mode,
  strings,
  language,
}: DashboardConnectionsProps) => {
  const { dashboard: dashboardStrings, common: commonStrings } =
    resolveDashboardStringGroups(strings);
  const { user } = useContext(UserContext);
  const { user: authUser } = useAuth();
  const {
    state: relationshipState,
    getModeState,
    requestConnection,
    declineIncomingInterest,
  } = useRelationship();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const activeTab = parseConnectionsTab(searchParams.get('tab'));
  const requestedPreviewId = searchParams.get('preview');
  const isDirectRequestExpanded = searchParams.get('directRequest') === '1';
  const viewModel = buildDashboardConnectionsViewModel({
    modeId: mode.id,
    activeTab,
    language,
    strings: dashboardStrings,
    user,
    relationshipState,
  });
  const [searchValue, setSearchValue] = useState('');
  const [directRequestQuery, setDirectRequestQuery] = useState('');
  const deferredSearchValue = useDeferredValue(searchValue);
  const deferredDirectRequestQuery = useDeferredValue(directRequestQuery);
  const [sortBy, setSortBy] = useState<'name' | 'status'>('name');
  const [workspaceFilter, setWorkspaceFilter] =
    useState<ConnectionWorkspaceFilterType>('all');
  const modeRelationshipState = getModeState(mode.id);
  const currentProfile = user[mode.id];
  const currentProfileId = currentProfile?.id;
  const viewerActor = resolveGateActor(currentProfile);
  const currentUserId = authUser?.uid ?? LOCAL_AUTH_USER_UID;
  const [previewEntity, setPreviewEntity] =
    useState<DashboardPreviewEntityType | null>(null);

  /**
   * Keep search-param updates additive so workspace state is not accidentally lost.
   */
  const updateWorkspaceQuery = (updates: Record<string, string | null>) => {
    const nextParams = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value.length === 0) {
        nextParams.delete(key);
        return;
      }
      nextParams.set(key, value);
    });
    setSearchParams(nextParams);
  };

  const filteredItems = useMemo(() => {
    const normalizedQuery = deferredSearchValue.trim().toLowerCase();
    const visibleItems = viewModel.items.filter((item) => {
      const passesQueryFilter =
        normalizedQuery.length === 0 ||
        item.name.toLowerCase().includes(normalizedQuery) ||
        item.subtitle?.toLowerCase().includes(normalizedQuery) ||
        item.statusLabel?.toLowerCase().includes(normalizedQuery);

      if (!passesQueryFilter) {
        return false;
      }

      return matchesConnectionWorkspaceFilter({
        item,
        workspaceFilter,
        activeTab,
      });
    });

    return [...visibleItems].sort((leftItem, rightItem) => {
      if (sortBy === 'status') {
        return (leftItem.statusLabel ?? '').localeCompare(
          rightItem.statusLabel ?? ''
        );
      }

      return leftItem.name.localeCompare(rightItem.name);
    });
  }, [
    activeTab,
    deferredSearchValue,
    sortBy,
    viewModel.items,
    workspaceFilter,
  ]);
  const firstFilteredItemId = filteredItems[0]?.id ?? null;

  useEffect(() => {
    const requestedItem = requestedPreviewId
      ? filteredItems.find((item) => item.id === requestedPreviewId)
      : null;
    const nextProfileId = requestedItem?.id ?? firstFilteredItemId ?? null;

    setPreviewEntity((currentValue) => {
      if (!nextProfileId) {
        return currentValue === null ? currentValue : null;
      }

      if (
        currentValue?.kind === 'profile' &&
        currentValue.profileId === nextProfileId &&
        currentValue.modeId === mode.id
      ) {
        return currentValue;
      }

      return {
        kind: 'profile',
        profileId: nextProfileId,
        modeId: mode.id,
      };
    });
  }, [filteredItems, firstFilteredItemId, mode.id, requestedPreviewId]);

  const selectedItem = useMemo(
    () =>
      previewEntity?.kind === 'profile'
        ? filteredItems.find((item) => item.id === previewEntity.profileId) ??
          null
        : null,
    [filteredItems, previewEntity]
  );

  const normalizedDirectRequestQuery = normalizeSearchText(
    deferredDirectRequestQuery
  );
  const directRequestResults = useMemo(() => {
    if (normalizedDirectRequestQuery.length < 2) {
      return [];
    }

    const blockedProfileIds = new Set(
      modeRelationshipState.blockedProfileIds ?? []
    );

    return getProfilesForMode(mode.id)
      .filter((profile) => {
        if (!profile.id || !profile.name) {
          return false;
        }
        if (blockedProfileIds.has(profile.id)) {
          return false;
        }
        return buildProfileSearchIndex({
          profile,
          language,
          viewerActor,
          isConnection: modeRelationshipState.connectionIds.includes(
            profile.id
          ),
        }).includes(normalizedDirectRequestQuery);
      })
      .slice(0, 8);
  }, [
    language,
    mode.id,
    modeRelationshipState.blockedProfileIds,
    modeRelationshipState.connectionIds,
    normalizedDirectRequestQuery,
    viewerActor,
  ]);

  const handlePrimaryAction = (profileId: string): void => {
    if (activeTab === 'connections') {
      emitWhoTelemetryEvent({
        type: 'dashboard_action_clicked',
        modeId: mode.id,
        destination: 'messages',
      });
      navigate(buildMessagesPath({ contactId: profileId }));
      return;
    }

    requestConnection(mode.id, profileId);
    emitWhoTelemetryEvent({
      type: 'dashboard_action_clicked',
      modeId: mode.id,
      destination: `connections_${activeTab}`,
    });
  };

  const handleSecondaryAction = (profileId: string): void => {
    if (activeTab === 'interested') {
      declineIncomingInterest(mode.id, profileId);
      emitWhoTelemetryEvent({
        type: 'dashboard_action_clicked',
        modeId: mode.id,
        destination: 'decline_interest',
      });
      return;
    }
  };

  const connectionPanels = useMemo<PanelsType>(
    () =>
      CONNECTION_TAB_IDS.map((tabId) => ({
        title: `${dashboardStrings.connectionsWorkspace.tabs[tabId][language]} (${viewModel.counts[tabId]})`,
        panel: null,
      })),
    [dashboardStrings.connectionsWorkspace.tabs, language, viewModel]
  );
  const activeTabIndex = Math.max(CONNECTION_TAB_IDS.indexOf(activeTab), 0);
  const directRequestStrings = dashboardStrings.directRequest;

  return (
    <DashboardShell
      mode={mode}
      language={language}
      strings={{ dashboard: dashboardStrings, common: commonStrings }}
      activeSection="connections"
      pageTitle={dashboardStrings.connectionsWorkspace.pageTitle[language]}
      pageSubtitle={buildConnectionsSubtitle({
        modeId: mode.id,
        language,
        strings: dashboardStrings,
        relationshipState,
      })}
      preview={
        <DashboardPreviewPanel
          title={dashboardStrings.connectionsWorkspace.previewTitle[language]}
          subtitle={
            dashboardStrings.connectionsWorkspace.previewSubtitle[language]
          }
        >
          {selectedItem ? (
            <div style={{ display: 'grid', gap: 10 }}>
              <Text variant="h6">{selectedItem.name}</Text>
              {selectedItem.subtitle ? (
                <Text variant="body2" color="text.secondary">
                  {selectedItem.subtitle}
                </Text>
              ) : null}
              {selectedItem.statusLabel ? (
                <Text variant="body2">{selectedItem.statusLabel}</Text>
              ) : null}
              {selectedItem.helperText ? (
                <Text variant="body2" color="text.secondary">
                  {selectedItem.helperText}
                </Text>
              ) : null}
              <div style={{ display: 'grid', gap: 8 }}>
                {selectedItem.primaryAction ? (
                  <Button
                    color="primary"
                    onClick={() => handlePrimaryAction(selectedItem.id)}
                    disabled={selectedItem.primaryAction.disabled}
                  >
                    {selectedItem.primaryAction.label}
                  </Button>
                ) : null}
                {selectedItem.secondaryAction ? (
                  <Button
                    color={selectedItem.primaryAction ? 'secondary' : 'primary'}
                    onClick={() => handleSecondaryAction(selectedItem.id)}
                    disabled={selectedItem.secondaryAction.disabled}
                  >
                    {selectedItem.secondaryAction.label}
                  </Button>
                ) : null}
              </div>
            </div>
          ) : (
            <Text variant="body2" color="text.secondary">
              {dashboardStrings.connectionsWorkspace.previewEmpty[language]}
            </Text>
          )}
        </DashboardPreviewPanel>
      }
      headerActions={
        <div style={{ width: '100%' }}>
          <Tabs
            panels={connectionPanels}
            title="dashboard-connections-tabs"
            tabIndex={activeTabIndex}
            setTabIndex={(nextTabIndex) =>
              updateWorkspaceQuery({
                tab: CONNECTION_TAB_IDS[nextTabIndex],
                preview: null,
              })
            }
            renderPanels={false}
          />
        </div>
      }
    >
      <DashboardSectionCard
        title={dashboardStrings.connectionsWorkspace.tabs[activeTab][language]}
        subtitle={
          dashboardStrings.connectionsWorkspace.sectionSubtitle[language]
        }
      >
        <Grid spacing={1} sx={{ mb: 1 }}>
          <GridItem xs={12} md={5}>
            <TextField
              fullWidth
              size="small"
              label={
                dashboardStrings.connectionsWorkspace.searchLabel[language]
              }
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
            />
          </GridItem>
          <GridItem xs={12} md={4}>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <Button
                color={sortBy === 'name' ? 'primary' : 'secondary'}
                onClick={() => setSortBy('name')}
              >
                {dashboardStrings.connectionsWorkspace.sortName[language]}
              </Button>
              <Button
                color={sortBy === 'status' ? 'primary' : 'secondary'}
                onClick={() => setSortBy('status')}
              >
                {dashboardStrings.connectionsWorkspace.sortStatus[language]}
              </Button>
            </div>
          </GridItem>
          <GridItem xs={12} md={3}>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <Button
                color={workspaceFilter === 'all' ? 'primary' : 'secondary'}
                onClick={() => setWorkspaceFilter('all')}
              >
                {dashboardStrings.connectionsWorkspace.filterAll[language]}
              </Button>
              <Button
                color={
                  workspaceFilter === 'actionable' ? 'primary' : 'secondary'
                }
                onClick={() => setWorkspaceFilter('actionable')}
              >
                {
                  dashboardStrings.connectionsWorkspace.filterActionable[
                    language
                  ]
                }
              </Button>
              <Button
                color={isDirectRequestExpanded ? 'primary' : 'secondary'}
                onClick={() =>
                  updateWorkspaceQuery({
                    directRequest: isDirectRequestExpanded ? null : '1',
                  })
                }
              >
                {dashboardStrings.actions.directRequest[language]}
              </Button>
            </div>
          </GridItem>
        </Grid>
        {isDirectRequestExpanded ? (
          <DashboardSectionCard
            title={directRequestStrings.title[language]}
            subtitle={directRequestStrings.description[language]}
          >
            <Grid spacing={2}>
              <GridItem xs={12} md={6}>
                <TextField
                  fullWidth
                  size="small"
                  label={directRequestStrings.searchLabel[language]}
                  value={directRequestQuery}
                  onChange={(event) =>
                    setDirectRequestQuery(event.target.value)
                  }
                  placeholder={directRequestStrings.searchPlaceholder[language]}
                />
              </GridItem>
              {normalizedDirectRequestQuery.length < 2 ? (
                <GridItem xs={12}>
                  <Text variant="body2" color="text.secondary">
                    {directRequestStrings.minimumSearch[language]}
                  </Text>
                </GridItem>
              ) : directRequestResults.length === 0 ? (
                <GridItem xs={12}>
                  <Text variant="body2" color="text.secondary">
                    {directRequestStrings.noResults[language]}
                  </Text>
                </GridItem>
              ) : (
                directRequestResults.map((profile) => {
                  const isConnection =
                    modeRelationshipState.connectionIds.includes(profile.id);
                  const status = getRequestStatus({
                    profile,
                    currentProfileId,
                    connectionIds: modeRelationshipState.connectionIds,
                    outgoingConnectionRequestIds:
                      modeRelationshipState.outgoingConnectionRequestIds,
                    incomingConnectionRequestIds:
                      modeRelationshipState.incomingConnectionRequestIds,
                    incomingInterestIds:
                      modeRelationshipState.incomingInterestIds,
                    declinedProfileIds:
                      modeRelationshipState.declinedProfileIds,
                  });
                  const profileActor = resolveGateActor(profile);
                  const gateDecision = evaluateConnectionRequestGate({
                    sender: {
                      ...viewerActor,
                      id: currentProfileId ?? currentUserId,
                    },
                    recipient: profileActor,
                    alreadyConnected: status === 'already_connected',
                    language,
                  });
                  const isDisabled =
                    status === 'already_connected' ||
                    status === 'already_requested' ||
                    status === 'declined_conflict' ||
                    status === 'self' ||
                    !gateDecision.allowed;
                  const helperText =
                    status === 'already_connected'
                      ? directRequestStrings.alreadyConnected[language]
                      : status === 'already_requested'
                      ? directRequestStrings.alreadyRequested[language]
                      : status === 'declined_conflict'
                      ? directRequestStrings.conflict[language]
                      : status === 'self'
                      ? directRequestStrings.self[language]
                      : status === 'accept'
                      ? directRequestStrings.acceptHint[language]
                      : gateDecision.reason ??
                        directRequestStrings.readyHint[language];
                  const buttonLabel =
                    status === 'accept'
                      ? directRequestStrings.acceptButton[language]
                      : status === 'already_connected'
                      ? directRequestStrings.connectedButton[language]
                      : status === 'already_requested'
                      ? directRequestStrings.sentButton[language]
                      : directRequestStrings.sendButton[language];
                  const visibleName =
                    resolveVisibleProfileFieldValue({
                      profile,
                      fieldName: 'name',
                      value: profile.name,
                      language,
                      viewer: viewerActor,
                      isConnection,
                    }) ||
                    dashboardStrings.viewModels.defaults.unnamedProfile[
                      language
                    ];
                  const visibleLocationText = resolveVisibleProfileFieldValue({
                    profile,
                    fieldName: 'location',
                    value: profile.main?.location,
                    language,
                    viewer: viewerActor,
                    isConnection,
                  });

                  return (
                    <GridItem xs={12} key={profile.id}>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          gap: 16,
                          alignItems: 'center',
                          padding: 16,
                          borderRadius: 12,
                          background: 'rgba(0, 0, 0, 0.04)',
                          flexWrap: 'wrap',
                        }}
                      >
                        <div style={{ flex: '1 1 260px' }}>
                          <Text variant="subtitle1">{visibleName}</Text>
                          {visibleLocationText ? (
                            <Text variant="body2" color="text.secondary">
                              {visibleLocationText}
                            </Text>
                          ) : null}
                          <Text variant="body2" color="text.secondary">
                            {helperText}
                          </Text>
                        </div>
                        <Button
                          color="primary"
                          disabled={isDisabled}
                          onClick={() => {
                            requestConnection(mode.id, profile.id);
                            emitWhoTelemetryEvent({
                              type: 'dashboard_action_clicked',
                              modeId: mode.id,
                              destination: 'direct_request',
                            });
                          }}
                        >
                          {buttonLabel}
                        </Button>
                      </div>
                    </GridItem>
                  );
                })
              )}
            </Grid>
          </DashboardSectionCard>
        ) : null}
        {filteredItems.length === 0 ? (
          <DashboardEmptyState
            title={dashboardStrings.connectionsWorkspace.emptyTitle[language]}
            description={
              dashboardStrings.connectionsWorkspace.emptyDescription[language]
            }
            ctaLabel={dashboardStrings.connectionsWorkspace.emptyCta[language]}
            onCta={() => navigate(buildDiscoveryPath())}
          />
        ) : (
          <Grid spacing={2}>
            {filteredItems.map((item) => (
              <GridItem xs={12} key={item.id}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: 16,
                    alignItems: 'center',
                    padding: 16,
                    borderRadius: 12,
                    background: 'rgba(0, 0, 0, 0.04)',
                    flexWrap: 'wrap',
                  }}
                >
                  <div style={{ flex: '1 1 240px' }}>
                    <Text variant="subtitle1">{item.name}</Text>
                    {item.subtitle ? (
                      <Text variant="body2" color="text.secondary">
                        {item.subtitle}
                      </Text>
                    ) : null}
                    {item.statusLabel ? (
                      <Text variant="caption">{item.statusLabel}</Text>
                    ) : null}
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <Button
                      color="secondary"
                      onClick={() => updateWorkspaceQuery({ preview: item.id })}
                    >
                      {
                        dashboardStrings.connectionsWorkspace.previewButton[
                          language
                        ]
                      }
                    </Button>
                    {item.primaryAction ? (
                      <Button
                        color="primary"
                        onClick={() => handlePrimaryAction(item.id)}
                        disabled={item.primaryAction.disabled}
                      >
                        {item.primaryAction.label}
                      </Button>
                    ) : null}
                    {item.secondaryAction ? (
                      <Button
                        color={item.primaryAction ? 'secondary' : 'primary'}
                        onClick={() => handleSecondaryAction(item.id)}
                        disabled={item.secondaryAction.disabled}
                      >
                        {item.secondaryAction.label}
                      </Button>
                    ) : null}
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

export default DashboardConnections;
