import { useState, type ChangeEvent } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Container,
  Grid,
  GridItem,
  Input,
  Text,
} from '../../Common';
import { renderValue, returnStringOrValue } from '../../../Utlilities';
import {
  createAvailabilityOptions,
  createGroupEvent,
  resolveGovernanceModerationSummary,
  resolveGroupRoleCopy,
} from '../../../Utlilities/communityGovernance';
import type {
  CommonStringsType,
  CommunityGuidanceModeStringsType,
  CommunitySurfaceGuidanceType,
  GroupEventAttendanceType,
  GroupType,
  InteractionGateType,
} from '../../../types';
import InteractionGateNotice from '../../Common/InteractionGateNotice';
import './GroupDetail.css';

/**
 * Props for GroupDetail view.
 */
type GroupDetailProps = {
  group: GroupType;
  language: string;
  joined: boolean;
  isAdmin: boolean;
  currentUserId: string;
  onJoinToggle: (groupId: string) => void;
  onBack: () => void;
  onMessageGroup?: (groupId: string) => void;
  onEditGroup?: (groupId: string) => void;
  onAssignRole: (groupId: string, memberUserId: string, roleId: string) => void;
  onRemoveRole: (groupId: string, memberUserId: string, roleId: string) => void;
  onScheduleEvent: (
    groupId: string,
    title: string,
    description: string,
    location: string,
    startsAt: string
  ) => void;
  onRespondToEvent: (
    groupId: string,
    eventId: string,
    response: GroupEventAttendanceType
  ) => void;
  onSetAvailabilityOptions: (groupId: string, labels: string[]) => void;
  onVoteAvailability: (groupId: string, optionId: string) => void;
  onReportGroup?: (group: GroupType) => void;
  onBlockGroup?: (groupId: string) => void;
  strings: {
    common: CommonStringsType;
    communityGuidance?: CommunityGuidanceModeStringsType;
  };
  guidance?: CommunitySurfaceGuidanceType;
  interactionGate?: InteractionGateType;
};

/**
 * Resolve a common translated label.
 */
const getCommonLabel = (
  strings: CommonStringsType,
  language: string,
  key: string
): string => strings[key]?.[language] ?? strings[key]?.en ?? '';

type EventDraftState = {
  title: string;
  description: string;
  location: string;
  startsAt: string;
};

const EMPTY_EVENT_DRAFT: EventDraftState = {
  title: '',
  description: '',
  location: '',
  startsAt: '',
};

/**
 * Format governance policy ids into localized labels.
 */
const formatPolicyLabel = ({
  strings,
  language,
  key,
  value,
}: {
  strings: CommonStringsType;
  language: string;
  key: 'join' | 'posting';
  value: string;
}): string => {
  if (key === 'join') {
    if (value === 'open') {
      return getCommonLabel(strings, language, 'joinPolicyOpenLabel');
    }
    if (value === 'invite_only') {
      return getCommonLabel(strings, language, 'joinPolicyInviteOnlyLabel');
    }
    return getCommonLabel(strings, language, 'joinPolicyApprovalRequiredLabel');
  }

  if (value === 'all_members') {
    return getCommonLabel(strings, language, 'postingPolicyAllMembersLabel');
  }
  if (value === 'admins_only') {
    return getCommonLabel(strings, language, 'postingPolicyAdminsOnlyLabel');
  }
  return getCommonLabel(strings, language, 'postingPolicyAdminsAndRolesLabel');
};

/**
 * Format an event timestamp for community detail cards.
 */
const formatEventDateTime = (startsAt: string, language: string): string => {
  const parsedDate = new Date(startsAt);
  if (Number.isNaN(parsedDate.getTime())) {
    return startsAt;
  }
  return parsedDate.toLocaleString(language);
};

/**
 * Renders a detailed view for a selected group.
 */
const GroupDetail = ({
  group,
  language,
  joined,
  isAdmin,
  currentUserId,
  onJoinToggle,
  onBack,
  onMessageGroup,
  onEditGroup,
  onAssignRole,
  onRemoveRole,
  onScheduleEvent,
  onRespondToEvent,
  onSetAvailabilityOptions,
  onVoteAvailability,
  onReportGroup,
  onBlockGroup,
  strings,
  guidance,
  interactionGate,
}: GroupDetailProps) => {
  const [eventDraft, setEventDraft] =
    useState<EventDraftState>(EMPTY_EVENT_DRAFT);
  const [availabilityDraft, setAvailabilityDraft] = useState('');
  const joinLabel = joined
    ? strings.common.leave[language]
    : strings.common.join[language];
  const rulesText = renderValue(language, group.rules).trim();
  const membersLabel = getCommonLabel(strings.common, language, 'membersLabel');
  const governanceLabel = getCommonLabel(
    strings.common,
    language,
    'governanceLabel'
  );
  const joinPolicyLabel = getCommonLabel(
    strings.common,
    language,
    'joinPolicyLabel'
  );
  const postingPolicyLabel = getCommonLabel(
    strings.common,
    language,
    'postingPolicyLabel'
  );
  const moderationSummaryLabel = getCommonLabel(
    strings.common,
    language,
    'moderationSummaryLabel'
  );
  const rolesLabel = getCommonLabel(strings.common, language, 'rolesLabel');
  const noRoleAssignmentsLabel = getCommonLabel(
    strings.common,
    language,
    'noRoleAssignmentsLabel'
  );
  const assignRoleLabel = getCommonLabel(
    strings.common,
    language,
    'assignRoleLabel'
  );
  const removeRoleLabel = getCommonLabel(
    strings.common,
    language,
    'removeRoleLabel'
  );
  const eventsLabel = getCommonLabel(strings.common, language, 'eventsLabel');
  const noEventsLabel = getCommonLabel(
    strings.common,
    language,
    'noEventsLabel'
  );
  const eventTitleLabel = getCommonLabel(
    strings.common,
    language,
    'eventTitleLabel'
  );
  const eventDescriptionLabel = getCommonLabel(
    strings.common,
    language,
    'eventDescriptionLabel'
  );
  const eventLocationLabel = getCommonLabel(
    strings.common,
    language,
    'eventLocationLabel'
  );
  const eventStartsAtLabel = getCommonLabel(
    strings.common,
    language,
    'eventStartsAtLabel'
  );
  const scheduleEventLabel = getCommonLabel(
    strings.common,
    language,
    'scheduleEventLabel'
  );
  const availabilityLabel = getCommonLabel(
    strings.common,
    language,
    'availabilityLabel'
  );
  const noAvailabilityOptionsLabel = getCommonLabel(
    strings.common,
    language,
    'noAvailabilityOptionsLabel'
  );
  const availabilityOptionsLabel = getCommonLabel(
    strings.common,
    language,
    'availabilityOptionsLabel'
  );
  const availabilityPlaceholder = getCommonLabel(
    strings.common,
    language,
    'availabilityPlaceholder'
  );
  const saveAvailabilityLabel = getCommonLabel(
    strings.common,
    language,
    'saveAvailabilityLabel'
  );
  const voteLabel = getCommonLabel(strings.common, language, 'voteLabel');
  const reportGroupLabel = getCommonLabel(
    strings.common,
    language,
    'reportGroupLabel'
  );
  const blockLabel = getCommonLabel(strings.common, language, 'blockLabel');
  const communityDetailsLabel = getCommonLabel(
    strings.common,
    language,
    'communityDetailsLabel'
  );
  const adminToolsLabel = getCommonLabel(
    strings.common,
    language,
    'adminToolsLabel'
  );
  const locationLabel = getCommonLabel(
    strings.common,
    language,
    'locationLabel'
  );
  const categoryLabel = getCommonLabel(
    strings.common,
    language,
    'categoryLabel'
  );
  const groupTypeLabel = getCommonLabel(
    strings.common,
    language,
    'groupTypeLabel'
  );
  const rulesLabel = getCommonLabel(strings.common, language, 'rulesLabel');
  const tagsLabel = getCommonLabel(strings.common, language, 'tagsLabel');
  const goingLabel = getCommonLabel(strings.common, language, 'goingLabel');
  const interestedLabel = getCommonLabel(
    strings.common,
    language,
    'interestedLabel'
  );
  const cantMakeItLabel = getCommonLabel(
    strings.common,
    language,
    'cantMakeItLabel'
  );
  const memberCount = group.members?.length ?? 0;
  const categoryValue = returnStringOrValue(language, group.category).trim();
  const locationValue = returnStringOrValue(language, group.location).trim();
  const groupTypeValue = returnStringOrValue(language, group.groupType).trim();
  const tags = (group.tags ?? [])
    .map((tag) => returnStringOrValue(language, tag))
    .filter((tag) => tag.length > 0);
  const starredTags = (group.starredTags ?? [])
    .map((tag) => returnStringOrValue(language, tag))
    .filter((tag) => tag.length > 0);
  const governance = group.governance;
  const roles = group.roles ?? [];
  const members = group.members ?? [];
  const moderationSummary = resolveGovernanceModerationSummary({
    governance,
    strings: strings.common,
    language,
  });
  const events = group.events ?? [];
  const availabilityOptions = group.availabilityOptions ?? [];
  const communityGuidance = strings.communityGuidance;
  const isInteractionLocked = interactionGate?.isLocked ?? false;
  const whyJoinReasons = guidance?.whyJoinReasons ?? [];
  const hasGuidanceContent =
    Boolean(communityGuidance) &&
    (whyJoinReasons.length > 0 ||
      Boolean(guidance?.whyJoinRecommendation) ||
      Boolean(guidance?.organizerCue) ||
      Boolean(guidance?.normsCue) ||
      Boolean(guidance?.activityCue));
  const canMessageGroup = Boolean(onMessageGroup && joined);
  const canEditGroup = Boolean(isAdmin && onEditGroup);
  const hasCommunityDetails =
    rulesText.length > 0 || starredTags.length > 0 || tags.length > 0;

  const handleScheduleEvent = (): void => {
    if (isInteractionLocked) {
      return;
    }
    if (
      eventDraft.title.trim().length === 0 ||
      eventDraft.location.trim().length === 0 ||
      eventDraft.startsAt.trim().length === 0
    ) {
      return;
    }
    const nextEvent = createGroupEvent({
      title: eventDraft.title,
      description: eventDraft.description,
      location: eventDraft.location,
      startsAt: eventDraft.startsAt,
      createdBy: currentUserId,
    });
    onScheduleEvent(
      group.id,
      nextEvent.title,
      nextEvent.description,
      nextEvent.location,
      String(nextEvent.startsAt)
    );
    setEventDraft(EMPTY_EVENT_DRAFT);
  };

  const handleSaveAvailability = (): void => {
    if (isInteractionLocked) {
      return;
    }
    const nextOptions = createAvailabilityOptions(
      availabilityDraft.split(',').map((value) => value.trim())
    );
    if (nextOptions.length === 0) {
      return;
    }
    onSetAvailabilityOptions(
      group.id,
      nextOptions.map((option) => option.label)
    );
    setAvailabilityDraft('');
  };

  /**
   * Update one event-draft field using a typed input handler.
   */
  const handleEventDraftChange =
    (field: keyof EventDraftState) =>
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>): void => {
      setEventDraft((previousValue) => ({
        ...previousValue,
        [field]: event.target.value,
      }));
    };

  return (
    <Container className="who-group-detail">
      <Box className="who-group-detail-header">
        <Button onClick={onBack} className="secondary">
          {strings.common.back[language]}
        </Button>
        <Box className="who-group-detail-intro">
          <Text className="who-group-detail-title">{group.groupName}</Text>
          <Text className="who-group-detail-description">
            {group.description}
          </Text>
          <Box className="who-group-detail-meta">
            <Text variant="body2">{`${membersLabel}: ${memberCount}`}</Text>
            {categoryValue ? (
              <Text variant="body2">{`${categoryLabel}: ${categoryValue}`}</Text>
            ) : null}
            {locationValue ? (
              <Text variant="body2">{`${locationLabel}: ${locationValue}`}</Text>
            ) : null}
            {groupTypeValue ? (
              <Text variant="body2">{`${groupTypeLabel}: ${groupTypeValue}`}</Text>
            ) : null}
          </Box>
        </Box>
        <Box className="who-group-detail-actions">
          <Button
            onClick={() => onJoinToggle(group.id)}
            disabled={isInteractionLocked}
          >
            {joinLabel}
          </Button>
          {canMessageGroup ? (
            <Button
              onClick={() => onMessageGroup?.(group.id)}
              className="secondary"
              disabled={isInteractionLocked}
            >
              {strings.common.message[language]}
            </Button>
          ) : null}
          {onReportGroup ? (
            <Button onClick={() => onReportGroup(group)} className="secondary">
              {reportGroupLabel}
            </Button>
          ) : null}
          {onBlockGroup ? (
            <Button
              onClick={() => onBlockGroup(group.id)}
              className="secondary"
            >
              {blockLabel}
            </Button>
          ) : null}
        </Box>
        {interactionGate?.isLocked ? (
          <InteractionGateNotice gate={interactionGate} variant="body2" />
        ) : null}
      </Box>
      <Grid spacing={2} className="who-group-detail-grid">
        <GridItem xs={12} lg={7}>
          <Card className="who-group-detail-section">
            <CardHeader title={communityDetailsLabel} />
            <CardContent className="who-group-detail-section-content">
              {hasGuidanceContent && communityGuidance ? (
                <Box className="who-group-detail-guidance">
                  <Text variant="subtitle2">
                    {communityGuidance.whyJoinTitle[language]}
                  </Text>
                  {whyJoinReasons.length > 0 ? (
                    <Text variant="body2">{whyJoinReasons.join(' • ')}</Text>
                  ) : null}
                  {guidance?.whyJoinRecommendation ? (
                    <Text variant="body2" color="text.secondary">
                      {guidance.whyJoinRecommendation}
                    </Text>
                  ) : null}
                  {guidance?.organizerCue ? (
                    <Text variant="body2" color="text.secondary">
                      {`${communityGuidance.organizerLabel[language]}: ${guidance.organizerCue}`}
                    </Text>
                  ) : null}
                  {guidance?.normsCue ? (
                    <Text variant="body2" color="text.secondary">
                      {`${communityGuidance.normsLabel[language]}: ${guidance.normsCue}`}
                    </Text>
                  ) : null}
                  {guidance?.activityCue ? (
                    <Text variant="body2" color="text.secondary">
                      {`${communityGuidance.activityLabel[language]}: ${guidance.activityCue}`}
                    </Text>
                  ) : null}
                </Box>
              ) : null}
              {hasCommunityDetails ? (
                <Box className="who-group-detail-detail-list">
                  {rulesText.length > 0 ? (
                    <Box className="who-group-detail-detail-item">
                      <Text variant="subtitle2">{rulesLabel}</Text>
                      <Text variant="body2">{rulesText}</Text>
                    </Box>
                  ) : null}
                  {starredTags.length > 0 ? (
                    <Box className="who-group-detail-detail-item">
                      <Text variant="subtitle2">{tagsLabel}</Text>
                      <Box className="who-group-detail-tag-list is-featured">
                        {starredTags.map((tag) => (
                          <Text key={`featured-${tag}`} variant="caption">
                            {tag}
                          </Text>
                        ))}
                      </Box>
                    </Box>
                  ) : null}
                  {tags.length > 0 ? (
                    <Box className="who-group-detail-detail-item">
                      <Box className="who-group-detail-tag-list">
                        {tags.map((tag) => (
                          <Text key={tag} variant="caption">
                            {tag}
                          </Text>
                        ))}
                      </Box>
                    </Box>
                  ) : null}
                </Box>
              ) : null}
            </CardContent>
          </Card>
          <Card className="who-group-detail-section">
            <CardHeader title={eventsLabel} />
            <CardContent className="who-group-detail-section-content">
              {events.length === 0 ? (
                <Text variant="body2" color="text.secondary">
                  {noEventsLabel}
                </Text>
              ) : (
                <Box className="who-group-detail-list">
                  {events.map((event) => (
                    <Box className="who-group-detail-list-item" key={event.id}>
                      <Text variant="subtitle1">{event.title}</Text>
                      {event.description ? (
                        <Text variant="body2">{event.description}</Text>
                      ) : null}
                      <Text variant="body2" color="text.secondary">
                        {`${event.location} · ${formatEventDateTime(
                          String(event.startsAt),
                          language
                        )}`}
                      </Text>
                      <Text variant="body2" color="text.secondary">
                        {`${goingLabel}: ${event.attendance.going.length} · ${interestedLabel}: ${event.attendance.interested.length} · ${cantMakeItLabel}: ${event.attendance.cant_make_it.length}`}
                      </Text>
                      {joined ? (
                        <Box className="who-group-detail-inline-actions">
                          <Button
                            className="secondary"
                            disabled={isInteractionLocked}
                            onClick={() =>
                              onRespondToEvent(group.id, event.id, 'going')
                            }
                          >
                            {goingLabel}
                          </Button>
                          <Button
                            className="secondary"
                            disabled={isInteractionLocked}
                            onClick={() =>
                              onRespondToEvent(group.id, event.id, 'interested')
                            }
                          >
                            {interestedLabel}
                          </Button>
                          <Button
                            className="secondary"
                            disabled={isInteractionLocked}
                            onClick={() =>
                              onRespondToEvent(
                                group.id,
                                event.id,
                                'cant_make_it'
                              )
                            }
                          >
                            {cantMakeItLabel}
                          </Button>
                        </Box>
                      ) : null}
                    </Box>
                  ))}
                </Box>
              )}
            </CardContent>
          </Card>
          <Card className="who-group-detail-section">
            <CardHeader title={availabilityLabel} />
            <CardContent className="who-group-detail-section-content">
              {availabilityOptions.length === 0 ? (
                <Text variant="body2" color="text.secondary">
                  {noAvailabilityOptionsLabel}
                </Text>
              ) : (
                <Box className="who-group-detail-list">
                  {availabilityOptions.map((option) => (
                    <Box className="who-group-detail-list-item" key={option.id}>
                      <Text variant="body2">
                        {`${option.label} (${option.voterUserIds.length})`}
                      </Text>
                      {joined ? (
                        <Button
                          className="secondary"
                          disabled={isInteractionLocked}
                          onClick={() =>
                            onVoteAvailability(group.id, option.id)
                          }
                        >
                          {voteLabel}
                        </Button>
                      ) : null}
                    </Box>
                  ))}
                </Box>
              )}
            </CardContent>
          </Card>
        </GridItem>
        <GridItem xs={12} lg={5}>
          <Card className="who-group-detail-section">
            <CardHeader title={membersLabel} />
            <CardContent className="who-group-detail-section-content">
              <Box className="who-group-detail-list">
                {members.map((member) => {
                  const roleNames = (member.roleIds ?? [])
                    .map(
                      (roleId) =>
                        resolveGroupRoleCopy({
                          role: roles.find((role) => role.id === roleId) ?? {
                            id: roleId,
                            name: roleId,
                            description: '',
                            permissionIds: [],
                          },
                          strings: strings.common,
                          language,
                        }).name
                    )
                    .filter((value) => value.length > 0);

                  return (
                    <Box
                      className="who-group-detail-list-item"
                      key={member.userId}
                    >
                      <Text variant="subtitle2">{member.userName}</Text>
                      <Text variant="body2" color="text.secondary">
                        {roleNames.length > 0
                          ? roleNames.join(', ')
                          : noRoleAssignmentsLabel}
                      </Text>
                    </Box>
                  );
                })}
              </Box>
            </CardContent>
          </Card>
          {governance ? (
            <Card className="who-group-detail-section">
              <CardHeader title={governanceLabel} />
              <CardContent className="who-group-detail-section-content">
                <Text variant="body2">
                  {`${joinPolicyLabel}: ${formatPolicyLabel({
                    strings: strings.common,
                    language,
                    key: 'join',
                    value: governance.joinPolicy,
                  })}`}
                </Text>
                <Text variant="body2">
                  {`${postingPolicyLabel}: ${formatPolicyLabel({
                    strings: strings.common,
                    language,
                    key: 'posting',
                    value: governance.postingPolicy,
                  })}`}
                </Text>
                <Text variant="body2" color="text.secondary">
                  {`${moderationSummaryLabel}: ${moderationSummary}`}
                </Text>
              </CardContent>
            </Card>
          ) : null}
          {roles.length > 0 ? (
            <Card className="who-group-detail-section">
              <CardHeader title={rolesLabel} />
              <CardContent className="who-group-detail-section-content">
                <Box className="who-group-detail-list">
                  {roles.map((role) => {
                    const roleCopy = resolveGroupRoleCopy({
                      role,
                      strings: strings.common,
                      language,
                    });
                    const assignedMembers = members.filter((member) =>
                      (member.roleIds ?? []).includes(role.id)
                    );

                    return (
                      <Box className="who-group-detail-list-item" key={role.id}>
                        <Text variant="subtitle2">{roleCopy.name}</Text>
                        <Text variant="body2">{roleCopy.description}</Text>
                        <Text variant="body2" color="text.secondary">
                          {assignedMembers.length > 0
                            ? assignedMembers
                                .map((member) => member.userName)
                                .join(', ')
                            : noRoleAssignmentsLabel}
                        </Text>
                      </Box>
                    );
                  })}
                </Box>
              </CardContent>
            </Card>
          ) : null}
          {isAdmin ? (
            <Card className="who-group-detail-section">
              <CardHeader title={adminToolsLabel} />
              <CardContent className="who-group-detail-section-content">
                {canEditGroup ? (
                  <Button
                    className="secondary"
                    onClick={() => onEditGroup?.(group.id)}
                    disabled={isInteractionLocked}
                  >
                    {strings.common.edit?.[language] ?? ''}
                  </Button>
                ) : null}
                <Box className="who-group-detail-admin-panel">
                  <Text variant="subtitle2">{eventsLabel}</Text>
                  <Grid spacing={1}>
                    <GridItem xs={12} md={6}>
                      <Input
                        inline
                        fullWidth
                        variant="outlined"
                        className="who-group-detail-input"
                        label={eventTitleLabel}
                        aria-label={eventTitleLabel}
                        value={eventDraft.title}
                        disabled={isInteractionLocked}
                        handleChange={handleEventDraftChange('title')}
                      />
                    </GridItem>
                    <GridItem xs={12} md={6}>
                      <Input
                        inline
                        fullWidth
                        variant="outlined"
                        className="who-group-detail-input"
                        label={eventLocationLabel}
                        aria-label={eventLocationLabel}
                        value={eventDraft.location}
                        disabled={isInteractionLocked}
                        handleChange={handleEventDraftChange('location')}
                      />
                    </GridItem>
                    <GridItem xs={12}>
                      <Input
                        inline
                        fullWidth
                        variant="outlined"
                        className="who-group-detail-input"
                        label={eventDescriptionLabel}
                        aria-label={eventDescriptionLabel}
                        value={eventDraft.description}
                        disabled={isInteractionLocked}
                        multiline
                        minRows={2}
                        handleChange={handleEventDraftChange('description')}
                      />
                    </GridItem>
                    <GridItem xs={12} md={7}>
                      <Input
                        inline
                        fullWidth
                        variant="outlined"
                        className="who-group-detail-input"
                        type="datetime-local"
                        label={eventStartsAtLabel}
                        aria-label={eventStartsAtLabel}
                        value={eventDraft.startsAt}
                        disabled={isInteractionLocked}
                        InputLabelProps={{ shrink: true }}
                        handleChange={handleEventDraftChange('startsAt')}
                      />
                    </GridItem>
                    <GridItem xs={12} md={5}>
                      <Button
                        onClick={handleScheduleEvent}
                        disabled={isInteractionLocked}
                      >
                        {scheduleEventLabel}
                      </Button>
                    </GridItem>
                  </Grid>
                </Box>
                <Box className="who-group-detail-admin-panel">
                  <Text variant="subtitle2">{availabilityLabel}</Text>
                  <Grid spacing={1}>
                    <GridItem xs={12} md={8}>
                      <Input
                        inline
                        fullWidth
                        variant="outlined"
                        className="who-group-detail-input"
                        label={availabilityOptionsLabel}
                        aria-label={availabilityOptionsLabel}
                        placeholder={availabilityPlaceholder}
                        value={availabilityDraft}
                        disabled={isInteractionLocked}
                        handleChange={(
                          event: ChangeEvent<
                            HTMLInputElement | HTMLTextAreaElement
                          >
                        ) => setAvailabilityDraft(event.target.value)}
                      />
                    </GridItem>
                    <GridItem xs={12} md={4}>
                      <Button
                        onClick={handleSaveAvailability}
                        disabled={isInteractionLocked}
                      >
                        {saveAvailabilityLabel}
                      </Button>
                    </GridItem>
                  </Grid>
                </Box>
                {roles.length > 0 ? (
                  <Box className="who-group-detail-admin-panel">
                    <Text variant="subtitle2">{rolesLabel}</Text>
                    <Box className="who-group-detail-list">
                      {roles.map((role) => {
                        const roleCopy = resolveGroupRoleCopy({
                          role,
                          strings: strings.common,
                          language,
                        });

                        return (
                          <Box
                            className="who-group-detail-list-item"
                            key={`admin-${role.id}`}
                          >
                            <Text variant="subtitle2">{roleCopy.name}</Text>
                            <Text variant="body2" color="text.secondary">
                              {roleCopy.description}
                            </Text>
                            <Box className="who-group-detail-inline-actions">
                              {members.map((member) => {
                                const isAssigned = (
                                  member.roleIds ?? []
                                ).includes(role.id);

                                return (
                                  <Button
                                    className="secondary"
                                    disabled={isInteractionLocked}
                                    key={`${role.id}-${member.userId}`}
                                    onClick={() =>
                                      isAssigned
                                        ? onRemoveRole(
                                            group.id,
                                            member.userId,
                                            role.id
                                          )
                                        : onAssignRole(
                                            group.id,
                                            member.userId,
                                            role.id
                                          )
                                    }
                                  >
                                    {isAssigned
                                      ? `${removeRoleLabel}: ${member.userName}`
                                      : `${assignRoleLabel}: ${member.userName}`}
                                  </Button>
                                );
                              })}
                            </Box>
                          </Box>
                        );
                      })}
                    </Box>
                  </Box>
                ) : null}
              </CardContent>
            </Card>
          ) : null}
        </GridItem>
      </Grid>
    </Container>
  );
};

export default GroupDetail;
