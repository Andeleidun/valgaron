import type {
  CommonStringsType,
  CommunityStringsType,
  ModeType,
  ProfileStringsType,
} from '../../../types';
import {
  Container,
  Button,
  EmptyState,
  ErrorBoundary,
  ErrorState,
  useToast,
} from '../../';
import CommunityForm from './CommunityForm';
import CommunityList from './CommunityList';
import GroupDetail from './GroupDetail';
import { useContext, useMemo } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import type { GroupType } from '../../../types';
import {
  formatTemplate,
  UserContext,
  useRelationship,
} from '../../../Utlilities';
import { getModeActivationStatus } from '../../../Utlilities/userActivation';
import { createSafetyReport } from '../../../Utlilities/safety';
import { resolvePublicUserName } from '../../../Utlilities/userIdentity';
import { buildCurrentGroupMember } from '../../../Utlilities/groupMemberships';
import { useModeGroupMemberships } from '../../../Utlilities/useModeGroupMemberships';
import { useAuth } from '../../../Utlilities/auth/AuthContext';
import { LOCAL_AUTH_USER_UID } from '../../../Utlilities/auth/localIdentity';
import { buildCommunitySurfaceGuidance } from './communityGuidance';
import { buildMessagesPath } from '../Dashboard/dashboardRoutes';
import InteractionGateNotice from '../../Common/InteractionGateNotice';

type CommunityProps = {
  mode: ModeType;
  strings: {
    community: CommunityStringsType;
    common: CommonStringsType;
    communityGuidance: import('../../../types').CommunityGuidanceStringsType;
    profile: ProfileStringsType;
  };
  language: string;
};

/**
 * Community workspace that switches between list, create, edit, and detail
 * flows for the active mode's groups.
 */
function Community({ mode, strings, language }: CommunityProps) {
  const userContext = useContext(UserContext);
  const {
    getModeState,
    upsertModeGroup,
    setGroupMembership,
    assignGroupRole,
    removeGroupRole,
    scheduleCommunityEvent,
    respondToCommunityEvent,
    setCommunityAvailabilityOptions,
    voteCommunityAvailability,
    submitSafetyReport,
    blockGroup,
  } = useRelationship();
  const { user: authUser } = useAuth();
  const relationshipState = getModeState(mode.id);
  const { pushToast } = useToast();
  const { groupId } = useParams<{ groupId?: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const currentUserId = authUser?.uid ?? LOCAL_AUTH_USER_UID;
  const currentMemberName = resolvePublicUserName({
    profileName: userContext.user[mode.id]?.name,
    authDisplayName: authUser?.displayName,
    fallbackLabel: strings.common.youLabel?.[language] ?? '',
  });
  const retryLabel = strings.common.retry?.[language] ?? '';
  const communityStrings: CommunityStringsType[ModeType['id']] =
    strings.community[mode.id];
  const noCommunitiesTitle =
    communityStrings.emptyTitle?.[language] ??
    communityStrings.emptyTitle?.en ??
    strings.common['noCommunitiesTitle']?.[language] ??
    strings.common['noCommunitiesTitle']?.en ??
    '';
  const noCommunitiesMessage =
    communityStrings.emptyMessage?.[language] ??
    communityStrings.emptyMessage?.en ??
    strings.common['noCommunitiesMessage']?.[language] ??
    strings.common['noCommunitiesMessage']?.en ??
    '';
  const reportSavedLabel =
    strings.common['reportSavedLabel']?.[language] ??
    strings.common['reportSavedLabel']?.en ??
    '';
  const blockedGroupLabel =
    strings.common['blockedGroupLabel']?.[language] ??
    strings.common['blockedGroupLabel']?.en ??
    '';
  const groupReportedTemplate =
    strings.common['groupReportedTemplate']?.[language] ??
    strings.common['groupReportedTemplate']?.en ??
    '';
  const communityGuidanceStrings = strings.communityGuidance[mode.id];
  const groups = relationshipState.groups;
  const blockedGroupIds = relationshipState.blockedGroupIds ?? [];
  const { joinedGroupIds, setModeGroupMembership } = useModeGroupMemberships({
    currentUserId,
    groups,
    groupMemberships: userContext.user.groupMemberships,
    modeId: mode.id,
    setUserGroupMemberships: userContext.setUserGroupMemberships,
  });
  const activationStatus = getModeActivationStatus({
    user: userContext.user,
    modeId: mode.id,
  });
  const interactionGate = useMemo(
    () => ({
      isLocked: !activationStatus.isReady,
      message:
        strings.common.activationGateInteractionsMessage?.[language] ??
        strings.common.activationGateInteractionsMessage?.en ??
        '',
    }),
    [activationStatus.isReady, language, strings.common]
  );
  const communityManagementGate = useMemo(
    () => ({
      isLocked: interactionGate.isLocked,
      message:
        strings.common.activationGateCommunityManagementMessage?.[language] ??
        strings.common.activationGateCommunityManagementMessage?.en ??
        '',
    }),
    [interactionGate.isLocked, language, strings.common]
  );

  /**
   * Toggle join state for a group.
   */
  const toggleJoin = (id: string) => {
    if (interactionGate.isLocked) {
      return;
    }
    const groupName =
      groups.find((group) => group.id === id)?.groupName ??
      strings.common.groupLabel?.[language] ??
      '';
    const willJoin = !joinedGroupIds.has(id);
    setModeGroupMembership({
      groupId: id,
      joined: willJoin,
    });

    if (willJoin) {
      pushToast(
        (strings.common.joinedGroupTemplate?.[language] ?? '').replace(
          '{{name}}',
          groupName
        )
      );
    } else {
      pushToast(
        (strings.common.leftGroupTemplate?.[language] ?? '').replace(
          '{{name}}',
          groupName
        )
      );
    }

    setGroupMembership(
      mode.id,
      id,
      buildCurrentGroupMember({
        groupId: id,
        userId: currentUserId,
        userName: currentMemberName,
      }),
      willJoin
    );
  };

  /**
   * Navigate to group detail view.
   */
  const viewDetails = (id: string) => {
    navigate(`/community/${id}`);
  };

  /**
   * Navigate back to community list.
   */
  const handleBack = () => {
    navigate('/community');
  };

  /**
   * Navigate to create group form.
   */
  const handleCreateGroup = () => {
    if (communityManagementGate.isLocked) {
      return;
    }
    navigate('/community/create');
  };

  /**
   * Navigate to group messages.
   */
  const handleMessageGroup = (id: string) => {
    if (interactionGate.isLocked) {
      return;
    }
    navigate(buildMessagesPath({ groupId: id }));
  };

  /**
   * Navigate to edit group form.
   */
  const handleEditGroup = (id: string) => {
    if (interactionGate.isLocked) {
      return;
    }
    navigate(`/community/${id}/edit`);
  };

  /**
   * Save a local-first moderation report for the selected group.
   */
  const handleReportGroup = (group: GroupType): void => {
    submitSafetyReport(
      createSafetyReport({
        modeId: mode.id,
        targetType: 'group',
        targetId: group.id,
        reason: 'community_rule_violation',
        range: 'full_conversation',
        summary: formatTemplate(groupReportedTemplate, {
          name: group.groupName,
        }),
        excerpt: [group.description].filter((value) => value.trim().length > 0),
      })
    );
    pushToast(reportSavedLabel);
  };

  /**
   * Persist group changes and navigate to detail view.
   */
  const handleGroupCreated = (group: GroupType) => {
    if (communityManagementGate.isLocked) {
      return;
    }
    const creatorMember = buildCurrentGroupMember({
      groupId: group.id,
      userId: currentUserId,
      userName: currentMemberName,
    });
    const isEditingExistingGroup = selectedGroup?.id === group.id;
    const nextGroup = {
      ...group,
      admins: isEditingExistingGroup
        ? group.admins ?? []
        : Array.from(new Set([...(group.admins ?? []), currentUserId])),
      members: (group.members ?? []).some(
        (member) => member.userId === currentUserId
      )
        ? group.members
        : [...(group.members ?? []), creatorMember],
      chatRooms: (group.chatRooms ?? []).map((chatRoom) => ({
        ...chatRoom,
        members: chatRoom.members.some(
          (member) => member.userId === currentUserId
        )
          ? chatRoom.members
          : [...chatRoom.members, creatorMember],
      })),
    };
    upsertModeGroup(mode.id, nextGroup);
    setModeGroupMembership({
      groupId: group.id,
      joined: true,
    });
    navigate(`/community/${group.id}`);
  };

  const isCreatePage = groupId === 'create';
  const isEditPage = Boolean(groupId && location.pathname.endsWith('/edit'));
  const blockedGroupIdSet = useMemo(
    () => new Set(blockedGroupIds),
    [blockedGroupIds]
  );
  const visibleGroups = useMemo(() => {
    return groups
      .filter((group) => !blockedGroupIdSet.has(group.id))
      .sort((left, right) => {
        const leftJoined = Number(joinedGroupIds.has(left.id));
        const rightJoined = Number(joinedGroupIds.has(right.id));
        return rightJoined - leftJoined;
      });
  }, [blockedGroupIdSet, groups, joinedGroupIds]);
  const selectedGroup =
    groupId && !isCreatePage
      ? visibleGroups.find((group) => group.id === groupId)
      : null;
  const isAdmin = (group: GroupType) =>
    Boolean(group.admins?.includes(currentUserId));
  const canEditSelectedGroup = Boolean(selectedGroup && isAdmin(selectedGroup));
  const shouldRenderCommunityForm =
    isCreatePage || (isEditPage && canEditSelectedGroup);
  const shouldRenderEditUnavailableState = isEditPage && !canEditSelectedGroup;
  const guidanceByGroupId = useMemo(
    () =>
      new Map(
        visibleGroups.map((group) => [
          group.id,
          buildCommunitySurfaceGuidance({
            group,
            joined: joinedGroupIds.has(group.id),
            strings: communityGuidanceStrings,
            commonStrings: strings.common,
            language,
          }),
        ])
      ),
    [
      communityGuidanceStrings,
      joinedGroupIds,
      language,
      strings.common,
      visibleGroups,
    ]
  );
  const createLabel =
    communityStrings.createLabel?.[language] ??
    communityStrings.createLabel?.en ??
    strings.common.create?.[language] ??
    strings.common.create?.en ??
    '';
  const editLabel = strings.common.edit?.[language] ?? '';

  return (
    <Container component="main" className={`who-main community ${mode.id}`}>
      {shouldRenderCommunityForm || shouldRenderEditUnavailableState ? (
        <Container>
          <Button
            onClick={handleBack}
            className="secondary"
            sx={{ marginBottom: 2 }}
          >
            {strings.common.back[language]}
          </Button>
          {shouldRenderEditUnavailableState ? (
            <ErrorState
              title={
                strings.common.communityFormUnavailableTitle?.[language] ?? ''
              }
              message={
                strings.common.communityFormUnavailableMessage?.[language] ?? ''
              }
              actionLabel={strings.common.back[language]}
              onAction={handleBack}
            />
          ) : (
            <ErrorBoundary
              resetKeys={[
                mode.id,
                location.pathname,
                selectedGroup?.id ?? 'new',
              ]}
              fallback={({ resetErrorBoundary }) => (
                <ErrorState
                  title={
                    strings.common.communityFormUnavailableTitle?.[language] ??
                    ''
                  }
                  message={
                    strings.common.communityFormUnavailableMessage?.[
                      language
                    ] ?? ''
                  }
                  actionLabel={retryLabel}
                  onAction={resetErrorBoundary}
                />
              )}
            >
              <CommunityForm
                commonStrings={strings.common}
                profileStrings={strings.profile}
                language={language}
                mode={mode}
                initialGroup={
                  isEditPage ? selectedGroup ?? undefined : undefined
                }
                submitLabel={isEditPage ? editLabel : undefined}
                onSubmitGroup={handleGroupCreated}
                interactionGate={communityManagementGate}
              />
            </ErrorBoundary>
          )}
        </Container>
      ) : selectedGroup ? (
        <GroupDetail
          group={selectedGroup}
          language={language}
          joined={joinedGroupIds.has(selectedGroup.id)}
          isAdmin={isAdmin(selectedGroup)}
          currentUserId={currentUserId}
          onJoinToggle={toggleJoin}
          onBack={handleBack}
          onMessageGroup={handleMessageGroup}
          onEditGroup={handleEditGroup}
          onAssignRole={(groupId, memberUserId, roleId) =>
            assignGroupRole(mode.id, groupId, memberUserId, roleId)
          }
          onRemoveRole={(groupId, memberUserId, roleId) =>
            removeGroupRole(mode.id, groupId, memberUserId, roleId)
          }
          onScheduleEvent={(groupId, title, description, location, startsAt) =>
            scheduleCommunityEvent(mode.id, groupId, {
              id: `event-${Date.now()}`,
              title,
              description,
              location,
              startsAt,
              createdBy: currentUserId,
              attendance: {
                going: [],
                interested: [],
                cant_make_it: [],
              },
            })
          }
          onRespondToEvent={(groupId, eventId, response) =>
            respondToCommunityEvent(
              mode.id,
              groupId,
              eventId,
              currentUserId,
              response
            )
          }
          onSetAvailabilityOptions={(groupId, labels) =>
            setCommunityAvailabilityOptions(
              mode.id,
              groupId,
              labels.map((label, index) => ({
                id: `availability-${Date.now()}-${index}`,
                label,
                voterUserIds: [],
              }))
            )
          }
          onVoteAvailability={(groupId, optionId) =>
            voteCommunityAvailability(mode.id, groupId, optionId, currentUserId)
          }
          onReportGroup={handleReportGroup}
          onBlockGroup={(groupId) => {
            blockGroup(mode.id, groupId);
            navigate('/community');
            pushToast(blockedGroupLabel);
          }}
          strings={{
            common: strings.common,
            communityGuidance: communityGuidanceStrings,
          }}
          guidance={guidanceByGroupId.get(selectedGroup.id)}
          interactionGate={interactionGate}
        />
      ) : visibleGroups.length === 0 ? (
        <Container>
          <EmptyState
            title={noCommunitiesTitle}
            message={noCommunitiesMessage}
          />
          <InteractionGateNotice
            gate={communityManagementGate}
            variant="body2"
          />
          <Button
            onClick={handleCreateGroup}
            className="secondary"
            disabled={communityManagementGate.isLocked}
          >
            {createLabel}
          </Button>
        </Container>
      ) : (
        <Container>
          <InteractionGateNotice
            gate={communityManagementGate}
            variant="body2"
          />
          <Button
            onClick={handleCreateGroup}
            className="secondary"
            disabled={communityManagementGate.isLocked}
          >
            {createLabel}
          </Button>
          <CommunityList
            groups={visibleGroups}
            mode={mode}
            language={language}
            joinedGroupIds={joinedGroupIds}
            onJoinToggle={toggleJoin}
            onViewDetails={viewDetails}
            onMessageGroup={handleMessageGroup}
            onEditGroup={handleEditGroup}
            isAdmin={isAdmin}
            strings={{
              common: strings.common,
              communityGuidance: communityGuidanceStrings,
            }}
            guidanceByGroupId={guidanceByGroupId}
            interactionGate={interactionGate}
          />
        </Container>
      )}
    </Container>
  );
}

export default Community;
