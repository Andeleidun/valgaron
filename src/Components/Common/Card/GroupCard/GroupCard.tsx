import type { ReactNode } from 'react';
import { Card, CardActions, CardContent, CardHeader } from '../';
import { Button, Text, Box } from '../../';
import type {
  CommunitySurfaceGuidanceType,
  GroupType,
  ModeType,
  CommonStringsType,
  CommunityGuidanceModeStringsType,
  InteractionGateType,
} from '../../../../types';
import InteractionGateNotice from '../../InteractionGateNotice';
import './GroupCard.css';

/**
 * Props for the GroupCard component.
 */
type GroupCardProps = {
  group: GroupType;
  language: string;
  mode: ModeType;
  joined: boolean;
  onJoinToggle: (groupId: string) => void;
  onViewDetails?: (groupId: string) => void;
  onMessageGroup?: (groupId: string) => void;
  isAdmin?: boolean;
  onEditGroup?: (groupId: string) => void;
  strings: {
    common: CommonStringsType;
    communityGuidance?: CommunityGuidanceModeStringsType;
  };
  guidance?: CommunitySurfaceGuidanceType;
  interactionGate?: InteractionGateType;
  supplementalActions?: ReactNode;
};

/**
 * Render group tags as a compact list.
 */
const renderTags = (tags: string[]) => (
  <Box className="who-group-tags">
    {tags.map((tag) => (
      <Text key={tag} variant="caption">
        {tag}
      </Text>
    ))}
  </Box>
);

/**
 * Renders a summary card for a group.
 */
const GroupCard = ({
  group,
  language,
  joined,
  onJoinToggle,
  onViewDetails,
  onMessageGroup,
  isAdmin,
  onEditGroup,
  strings,
  guidance,
  interactionGate,
  supplementalActions,
}: GroupCardProps) => {
  const memberCount = group.members?.length ?? 0;
  const description = group.description?.trim() ?? '';
  const tags = (group.tags ?? []) as string[];
  const starredTags = (group.starredTags ?? []) as string[];
  const joinLabel = joined
    ? strings.common.leave[language]
    : strings.common.join[language];
  const hasDetails = Boolean(onViewDetails);
  const hasMessage = Boolean(onMessageGroup);
  const hasEdit = Boolean(isAdmin && onEditGroup);
  const communityGuidance = strings.communityGuidance;
  const isInteractionLocked = interactionGate?.isLocked ?? false;
  const membersLabel = strings.common.membersLabel?.[language] ?? '';
  const whyJoinReasons = guidance?.whyJoinReasons ?? [];
  const hasGuidanceContent =
    Boolean(communityGuidance) &&
    (whyJoinReasons.length > 0 ||
      Boolean(guidance?.whyJoinRecommendation) ||
      Boolean(guidance?.organizerCue) ||
      Boolean(guidance?.normsCue) ||
      Boolean(guidance?.activityCue));

  return (
    <Card className="who-group-card">
      <CardHeader title={group.groupName} />
      <CardContent className="who-group-card-content">
        <Box className="who-group-card-summary">
          {description.length > 0 ? (
            <Text className="who-group-card-description">{description}</Text>
          ) : null}
          <Text className="who-group-card-meta" variant="body2">
            {`${membersLabel}: ${memberCount}`}
          </Text>
          {hasGuidanceContent && communityGuidance ? (
            <Box className="who-discovery-guidance who-group-card-guidance">
              {whyJoinReasons.length > 0 ? (
                <Text variant="caption">
                  {`${
                    communityGuidance.whyJoinTitle[language]
                  }: ${whyJoinReasons.join(' • ')}`}
                </Text>
              ) : null}
              {guidance?.whyJoinRecommendation ? (
                <Text variant="caption">{guidance.whyJoinRecommendation}</Text>
              ) : null}
              {guidance?.organizerCue ? (
                <Text variant="caption">
                  {`${communityGuidance.organizerLabel[language]}: ${guidance.organizerCue}`}
                </Text>
              ) : null}
              {guidance?.normsCue ? (
                <Text variant="caption">
                  {`${communityGuidance.normsLabel[language]}: ${guidance.normsCue}`}
                </Text>
              ) : null}
              {guidance?.activityCue ? (
                <Text variant="caption">
                  {`${communityGuidance.activityLabel[language]}: ${guidance.activityCue}`}
                </Text>
              ) : null}
            </Box>
          ) : null}
          {starredTags.length > 0 ? renderTags(starredTags) : null}
          {tags.length > 0 ? renderTags(tags) : null}
          {interactionGate?.isLocked ? (
            <InteractionGateNotice gate={interactionGate} />
          ) : null}
        </Box>
      </CardContent>
      <CardActions className="who-group-card-actions">
        <Box className="who-group-card-primary-actions">
          <Box className="who-group-card-action-item">
            <Button
              onClick={() => onJoinToggle(group.id)}
              disabled={isInteractionLocked}
            >
              {joinLabel}
            </Button>
          </Box>
          {onViewDetails ? (
            <Box className="who-group-card-action-item">
              <Button
                onClick={() => onViewDetails(group.id)}
                className="secondary"
              >
                {strings.common.viewDetails[language]}
              </Button>
            </Box>
          ) : null}
        </Box>
        {hasMessage || hasEdit ? (
          <Box className="who-group-card-secondary-actions">
            {onMessageGroup ? (
              <Box className="who-group-card-action-item">
                <Button
                  onClick={() => onMessageGroup(group.id)}
                  className="secondary"
                  disabled={isInteractionLocked}
                >
                  {strings.common.message[language]}
                </Button>
              </Box>
            ) : null}
            {isAdmin && onEditGroup ? (
              <Box className="who-group-card-action-item">
                <Button
                  onClick={() => onEditGroup(group.id)}
                  className="secondary"
                  disabled={isInteractionLocked}
                >
                  {strings.common.edit?.[language] ?? ''}
                </Button>
              </Box>
            ) : null}
          </Box>
        ) : null}
        {supplementalActions ? (
          <Box className="who-group-card-utility-actions">
            {supplementalActions}
          </Box>
        ) : null}
      </CardActions>
    </Card>
  );
};

export default GroupCard;
