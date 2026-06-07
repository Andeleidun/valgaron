import type {
  CommonStringsType,
  CommunityGuidanceModeStringsType,
  CommunitySurfaceGuidanceType,
  GroupType,
  StringOrOptionType,
  StringsOrOptionsType,
} from '../../../types';
import { renderValue, returnStringOrValue } from '../../../Utlilities';
import { resolveGovernanceModerationSummary } from '../../../Utlilities/communityGovernance';

const getUniqueValues = (values: string[]): string[] =>
  Array.from(
    new Set(
      values.map((value) => value.trim()).filter((value) => value.length > 0)
    )
  );

const getLocalizedCollectionValues = (
  values: StringsOrOptionsType | undefined,
  language: string
): string[] =>
  Array.isArray(values)
    ? getUniqueValues(
        values.map((value) => returnStringOrValue(language, value))
      )
    : [];

const getLocalizedValue = (
  value: StringOrOptionType | undefined,
  language: string
): string => returnStringOrValue(language, value).trim();

const getLeadOrganizerCue = (group: GroupType): string | undefined => {
  const adminIds = new Set(group.admins ?? []);
  if (adminIds.size === 0) {
    return undefined;
  }

  const adminNames = getUniqueValues(
    (group.members ?? [])
      .filter((member) => adminIds.has(member.userId))
      .map((member) => member.userName)
  );

  if (adminNames.length > 0) {
    return adminNames.slice(0, 2).join(', ');
  }

  return Array.from(adminIds).slice(0, 2).join(', ');
};

const getNormsCue = (
  group: GroupType,
  language: string,
  commonStrings: CommonStringsType
): string | undefined => {
  const moderationSummary = resolveGovernanceModerationSummary({
    governance: group.governance,
    strings: commonStrings,
    language,
  }).trim();
  if (moderationSummary.length > 0) {
    return moderationSummary;
  }

  const rules = renderValue(language, group.rules).trim();
  return rules.length > 0 ? rules : undefined;
};

const getActivityCue = (group: GroupType): string | undefined => {
  const eventTitle = group.events?.[0]?.title?.trim() ?? '';
  if (eventTitle.length > 0) {
    return eventTitle;
  }

  const activeRoom = group.chatRooms.find(
    (chatRoom) =>
      chatRoom.roomName.trim().length > 0 && chatRoom.messages.length > 0
  );
  if (activeRoom) {
    return activeRoom.roomName.trim();
  }

  const availabilityLabel = group.availabilityOptions?.[0]?.label?.trim() ?? '';
  return availabilityLabel.length > 0 ? availabilityLabel : undefined;
};

const getWhyJoinReasons = ({
  group,
  language,
  activityCue,
}: {
  group: GroupType;
  language: string;
  activityCue?: string;
}): string[] => {
  const topicValues = getUniqueValues([
    ...getLocalizedCollectionValues(group.starredTags, language),
    ...getLocalizedCollectionValues(group.tags, language),
    ...getLocalizedCollectionValues(group.interests, language),
    getLocalizedValue(group.category, language),
    getLocalizedValue(group.groupType, language),
  ]);
  const locationValue = getLocalizedValue(group.location, language);

  return getUniqueValues([
    topicValues[0] ?? '',
    activityCue ?? '',
    locationValue,
  ]).slice(0, 3);
};

/**
 * Build the summary guidance shown on community cards and group detail views.
 */
export const buildCommunitySurfaceGuidance = ({
  group,
  joined,
  strings,
  commonStrings,
  language,
}: {
  group: GroupType;
  joined: boolean;
  strings: CommunityGuidanceModeStringsType;
  commonStrings: CommonStringsType;
  language: string;
}): CommunitySurfaceGuidanceType => {
  const organizerCue = getLeadOrganizerCue(group);
  const normsCue = getNormsCue(group, language, commonStrings);
  const activityCue = getActivityCue(group);
  const whyJoinReasons = getWhyJoinReasons({
    group,
    language,
    activityCue,
  });
  const hasContextualTrustSignals =
    Boolean(organizerCue) || Boolean(normsCue) || Boolean(activityCue);
  const whyJoinRecommendation =
    !joined && hasContextualTrustSignals
      ? strings.joinFirstRecommendation[language] ??
        strings.joinFirstRecommendation.en ??
        ''
      : undefined;

  return {
    whyJoinReasons,
    whyJoinRecommendation:
      whyJoinRecommendation && whyJoinRecommendation.trim().length > 0
        ? whyJoinRecommendation
        : undefined,
    organizerCue,
    normsCue,
    activityCue,
  };
};
