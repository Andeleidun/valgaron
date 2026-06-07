import { useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import type {
  CommonStringsType,
  DashboardCommunityTabType,
  DashboardPreviewEntityType,
  DashboardStringsType,
  ModeType,
  PanelsType,
} from '../../../types';
import { UserContext, useRelationship } from '../../../Utlilities';
import { buildCurrentGroupMember } from '../../../Utlilities/groupMemberships';
import { useModeGroupMemberships } from '../../../Utlilities/useModeGroupMemberships';
import { useAuth } from '../../../Utlilities/auth/AuthContext';
import { LOCAL_AUTH_USER_UID } from '../../../Utlilities/auth/localIdentity';
import { resolvePublicUserName } from '../../../Utlilities/userIdentity';
import { Button, Grid, GridItem, Tabs, Text } from '../../';
import { buildCommunityPath, parseCommunityTab } from './dashboardRoutes';
import DashboardEmptyState from './DashboardEmptyState';
import DashboardPreviewPanel from './DashboardPreviewPanel';
import DashboardSectionCard from './DashboardSectionCard';
import DashboardShell from './DashboardShell';
import {
  buildCommunitySubtitle,
  buildDashboardCommunityViewModel,
} from './dashboardViewModels';
import { resolveDashboardStringGroups } from './dashboardFallbacks';

type DashboardCommunityProps = {
  mode: ModeType;
  strings: {
    dashboard: DashboardStringsType;
    common: CommonStringsType;
  };
  language: string;
};

/**
 * Dashboard-native community workspace with local preview state and inline actions.
 */
const DashboardCommunity = ({
  mode,
  strings,
  language,
}: DashboardCommunityProps) => {
  const { dashboard: dashboardStrings, common: commonStrings } =
    resolveDashboardStringGroups(strings);
  const { user, setUserGroupMemberships } = useContext(UserContext);
  const { state: relationshipState, setGroupMembership } = useRelationship();
  const { user: authUser } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const activeTab = parseCommunityTab(searchParams.get('tab'));
  const requestedPreviewId = searchParams.get('preview');
  const currentUserId = authUser?.uid ?? LOCAL_AUTH_USER_UID;
  const currentUserName = resolvePublicUserName({
    profileName: user[mode.id]?.name,
    authDisplayName: authUser?.displayName,
    fallbackLabel:
      dashboardStrings.viewModels.defaults.currentUserName[language],
  });
  const { setModeGroupMembership } = useModeGroupMemberships({
    currentUserId,
    groups: relationshipState.byMode[mode.id]?.groups ?? [],
    groupMemberships: user.groupMemberships,
    modeId: mode.id,
    setUserGroupMemberships,
  });
  const viewModel = buildDashboardCommunityViewModel({
    modeId: mode.id,
    activeTab,
    language,
    strings: dashboardStrings,
    user,
    relationshipState,
  });
  const firstItemId = viewModel.items[0]?.id ?? null;
  const [previewEntity, setPreviewEntity] =
    useState<DashboardPreviewEntityType | null>(null);

  useEffect(() => {
    const requestedItem = requestedPreviewId
      ? viewModel.items.find((item) => item.id === requestedPreviewId)
      : null;
    const nextGroupId = requestedItem?.id ?? firstItemId ?? null;

    setPreviewEntity((currentValue) => {
      if (!nextGroupId) {
        return currentValue === null ? currentValue : null;
      }

      if (
        currentValue?.kind === 'group' &&
        currentValue.groupId === nextGroupId &&
        currentValue.modeId === mode.id
      ) {
        return currentValue;
      }

      return {
        kind: 'group',
        groupId: nextGroupId,
        modeId: mode.id,
      };
    });
  }, [firstItemId, mode.id, requestedPreviewId, viewModel.items]);

  const selectedGroup = useMemo(
    () =>
      previewEntity?.kind === 'group'
        ? viewModel.items.find((item) => item.id === previewEntity.groupId) ??
          null
        : null,
    [previewEntity, viewModel.items]
  );

  const handlePrimaryAction = (groupId: string): void => {
    if (activeTab === 'discover') {
      setModeGroupMembership({
        groupId,
        joined: true,
      });
      setGroupMembership(
        mode.id,
        groupId,
        buildCurrentGroupMember({
          groupId,
          userId: currentUserId,
          userName: currentUserName,
        }),
        true
      );
      return;
    }

    navigate(`/community/${groupId}`);
  };

  const tabs: DashboardCommunityTabType[] = ['joined', 'discover', 'activity'];
  const communityPanels = useMemo<PanelsType>(
    () =>
      tabs.map((tabId) => ({
        title: dashboardStrings.communityWorkspace.tabs[tabId][language],
        panel: null,
      })),
    [dashboardStrings.communityWorkspace.tabs, language, tabs]
  );
  const activeTabIndex = Math.max(tabs.indexOf(activeTab), 0);

  return (
    <DashboardShell
      mode={mode}
      language={language}
      strings={{ dashboard: dashboardStrings, common: commonStrings }}
      activeSection="community"
      pageTitle={dashboardStrings.communityWorkspace.pageTitle[language]}
      pageSubtitle={buildCommunitySubtitle({
        modeId: mode.id,
        language,
        strings: dashboardStrings,
        user,
        relationshipState,
      })}
      preview={
        <DashboardPreviewPanel
          title={dashboardStrings.communityWorkspace.previewTitle[language]}
          subtitle={
            dashboardStrings.communityWorkspace.previewSubtitle[language]
          }
        >
          {selectedGroup ? (
            <div style={{ display: 'grid', gap: 10 }}>
              <Text variant="h6">{selectedGroup.name}</Text>
              {selectedGroup.subtitle ? (
                <Text variant="body2" color="text.secondary">
                  {selectedGroup.subtitle}
                </Text>
              ) : null}
              {selectedGroup.activityLabel ? (
                <Text variant="body2">{selectedGroup.activityLabel}</Text>
              ) : null}
              {selectedGroup.helperText ? (
                <Text variant="body2" color="text.secondary">
                  {selectedGroup.helperText}
                </Text>
              ) : null}
            </div>
          ) : (
            <Text variant="body2" color="text.secondary">
              {dashboardStrings.communityWorkspace.previewEmpty[language]}
            </Text>
          )}
        </DashboardPreviewPanel>
      }
      headerActions={
        <div style={{ width: '100%' }}>
          <Tabs
            panels={communityPanels}
            title="dashboard-community-tabs"
            tabIndex={activeTabIndex}
            setTabIndex={(nextTabIndex) =>
              setSearchParams({
                tab: tabs[nextTabIndex],
              })
            }
            renderPanels={false}
          />
        </div>
      }
    >
      <DashboardSectionCard
        title={dashboardStrings.communityWorkspace.tabs[activeTab][language]}
        subtitle={dashboardStrings.communityWorkspace.sectionSubtitle[language]}
      >
        {viewModel.items.length === 0 ? (
          <DashboardEmptyState
            title={dashboardStrings.communityWorkspace.emptyTitle[language]}
            description={
              dashboardStrings.communityWorkspace.emptyDescription[language]
            }
            ctaLabel={dashboardStrings.communityWorkspace.emptyCta[language]}
            onCta={() =>
              navigate(
                buildCommunityPath({
                  tab: 'discover',
                })
              )
            }
          />
        ) : (
          <Grid spacing={2}>
            {viewModel.items.map((item) => (
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
                    {item.helperText ? (
                      <Text variant="caption">{item.helperText}</Text>
                    ) : null}
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <Button
                      color="secondary"
                      onClick={() =>
                        setPreviewEntity({
                          kind: 'group',
                          groupId: item.id,
                          modeId: mode.id,
                        })
                      }
                    >
                      {
                        dashboardStrings.communityWorkspace.previewButton[
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
                    {item.secondaryAction ? (
                      <Button
                        color={item.primaryAction ? 'secondary' : 'primary'}
                        onClick={() =>
                          setPreviewEntity({
                            kind: 'group',
                            groupId: item.id,
                            modeId: mode.id,
                          })
                        }
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

export default DashboardCommunity;
