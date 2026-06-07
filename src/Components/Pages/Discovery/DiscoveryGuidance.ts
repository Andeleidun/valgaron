import type {
  CommonStringsType,
  CommunityGuidanceModeStringsType,
  ConnectionStyleModeStringsType,
  ConnectionStyleType,
  DiscoveryGuidanceModeStringsType,
  DiscoveryRationaleType,
  GroupType,
  ModeType,
  ProfileType,
  RecommendedNextActionType,
} from '../../../types';
import {
  canViewProfileField,
  formatTemplate,
  renderValue,
  resolveVisibleProfileFieldValue,
  returnStringOrValue,
} from '../../../Utlilities';
import {
  ensureGroupGovernanceData,
  resolveGovernanceModerationSummary,
} from '../../../Utlilities/communityGovernance';
import type { GateActorLikeType } from '../../../Utlilities/verificationGateFeedback';

/**
 * Serializable compatibility-filter values supported by discovery.
 */
export type DiscoveryCompatibilityFiltersType = {
  availabilityPattern: string;
  communicationPace: string;
  introductionPreference: string;
  languageComfort: string;
  planningStyle: string;
};

/**
 * Resolved guidance payload for one profile discovery card.
 */
export type ProfileDiscoveryGuidanceType = {
  rationale: DiscoveryRationaleType;
  reasonLabels: string[];
  detailLines: string[];
  recommendedActionLabel: string;
  compatibilityBadges: string[];
  hintMessages: string[];
  relevantGroupIds: string[];
  joinRecommendedGroupIds: string[];
};

/**
 * Resolved guidance payload for one community discovery card.
 */
export type GroupDiscoveryGuidanceType = {
  whyJoinReasons: string[];
  whyJoinRecommendation: string;
  organizerCue?: string;
  normsCue?: string;
  activityCue?: string;
};

const normalizeText = (value: string): string => value.trim().toLowerCase();

const getUniqueValues = (values: string[]): string[] =>
  Array.from(
    new Set(
      values.map((value) => value.trim()).filter((value) => value.length > 0)
    )
  );

const getSharedDisplayValues = (
  left: string[],
  right: string[],
  limit?: number
): string[] => {
  const rightValues = new Set(right.map(normalizeText));
  const sharedValues = getUniqueValues(
    left.filter((value) => rightValues.has(normalizeText(value)))
  );

  if (typeof limit === 'number') {
    return sharedValues.slice(0, limit);
  }

  return sharedValues;
};

const hasLocationOverlap = (
  leftLocation: string,
  rightLocation: string
): boolean => {
  const normalizedLeft = normalizeText(leftLocation);
  const normalizedRight = normalizeText(rightLocation);

  if (normalizedLeft.length === 0 || normalizedRight.length === 0) {
    return false;
  }

  if (normalizedLeft === normalizedRight) {
    return true;
  }

  const [leftRegion] = normalizedLeft.split(',');
  const [rightRegion] = normalizedRight.split(',');
  return Boolean(leftRegion) && leftRegion === rightRegion;
};

const getConnectionStyleLanguageValues = (
  connectionStyle?: ConnectionStyleType
): string[] => {
  const preferredLanguages =
    connectionStyle?.languageComfort?.preferredLanguages ?? [];
  return getUniqueValues([
    ...preferredLanguages,
    ...(connectionStyle?.languageComfort?.multilingualWelcome
      ? ['multilingual_welcome']
      : []),
    ...(connectionStyle?.languageComfort?.simpleEnglishOk
      ? ['simple_english_ok']
      : []),
  ]);
};

const hasConnectionStyleValue = (
  connectionStyle?: ConnectionStyleType
): boolean =>
  Boolean(
    connectionStyle?.availabilityPattern ||
      connectionStyle?.communicationPace ||
      connectionStyle?.introductionPreference ||
      connectionStyle?.planningStyle ||
      getConnectionStyleLanguageValues(connectionStyle).length > 0
  );

/**
 * Resolve the candidate's connection-style fields that are actually visible to
 * the active discovery viewer.
 */
const getVisibleConnectionStyle = ({
  profile,
  viewer,
  isConnection,
  language,
}: {
  profile: ProfileType;
  viewer?: GateActorLikeType;
  isConnection: boolean;
  language: string;
}): ConnectionStyleType | undefined => {
  const connectionStyle = profile.connectionStyle;
  if (!connectionStyle) {
    return undefined;
  }

  const visibleConnectionStyle: ConnectionStyleType = {
    availabilityPattern: canViewProfileField({
      profile,
      fieldName: 'connectionAvailabilityPattern',
      viewer,
      isConnection,
      language,
    })
      ? connectionStyle.availabilityPattern
      : undefined,
    communicationPace: canViewProfileField({
      profile,
      fieldName: 'connectionCommunicationPace',
      viewer,
      isConnection,
      language,
    })
      ? connectionStyle.communicationPace
      : undefined,
    introductionPreference: canViewProfileField({
      profile,
      fieldName: 'connectionIntroductionPreference',
      viewer,
      isConnection,
      language,
    })
      ? connectionStyle.introductionPreference
      : undefined,
    planningStyle: canViewProfileField({
      profile,
      fieldName: 'connectionPlanningStyle',
      viewer,
      isConnection,
      language,
    })
      ? connectionStyle.planningStyle
      : undefined,
    languageComfort: canViewProfileField({
      profile,
      fieldName: 'connectionLanguageComfort',
      viewer,
      isConnection,
      language,
    })
      ? connectionStyle.languageComfort
      : undefined,
  };

  return hasConnectionStyleValue(visibleConnectionStyle)
    ? visibleConnectionStyle
    : undefined;
};

const getProfileLocation = (
  profile: ProfileType | undefined,
  language: string
): string => returnStringOrValue(language, profile?.main?.location);

/**
 * Resolve the candidate location only when the active viewer is allowed to see
 * that profile field.
 */
const getVisibleProfileLocation = ({
  profile,
  viewer,
  isConnection,
  language,
}: {
  profile?: ProfileType;
  viewer?: GateActorLikeType;
  isConnection: boolean;
  language: string;
}): string => {
  if (!profile) {
    return '';
  }

  return resolveVisibleProfileFieldValue({
    profile,
    fieldName: 'location',
    value: profile.main?.location,
    language,
    viewer,
    isConnection,
  });
};

const getGroupLocation = (group: GroupType, language: string): string =>
  returnStringOrValue(language, group.location);

const getGroupTerms = (group: GroupType, language: string): string[] =>
  getUniqueValues([
    ...(group.tags ?? []).map((value) => returnStringOrValue(language, value)),
    ...(group.interests ?? []).map((value) =>
      returnStringOrValue(language, value)
    ),
    returnStringOrValue(language, group.category),
  ]);

/**
 * Resolve discovery tags from candidate fields that remain visible to the
 * current viewer.
 */
const getVisibleDiscoveryProfileTags = ({
  profile,
  mode,
  viewer,
  isConnection,
  language,
}: {
  profile: ProfileType;
  mode: ModeType;
  viewer?: GateActorLikeType;
  isConnection: boolean;
  language: string;
}): string[] => {
  if (mode.id === 'academic') {
    const visibleSkills = canViewProfileField({
      profile,
      fieldName: 'highlightSkills',
      viewer,
      isConnection,
      language,
    })
      ? (profile.highlights?.skills ?? []).map((value) =>
          returnStringOrValue(language, value)
        )
      : [];
    const visibleFieldOfStudy = resolveVisibleProfileFieldValue({
      profile,
      fieldName: 'fieldOfStudy',
      value: profile.main?.fieldOfStudy,
      language,
      viewer,
      isConnection,
    });

    return getUniqueValues([...visibleSkills, visibleFieldOfStudy]);
  }

  if (mode.id === 'professional') {
    const visibleSkills = canViewProfileField({
      profile,
      fieldName: 'highlightSkills',
      viewer,
      isConnection,
      language,
    })
      ? (profile.highlights?.skills ?? []).map((value) =>
          returnStringOrValue(language, value)
        )
      : [];
    const visibleIndustry = resolveVisibleProfileFieldValue({
      profile,
      fieldName: 'industry',
      value: profile.main?.industry,
      language,
      viewer,
      isConnection,
    });

    return getUniqueValues([...visibleSkills, visibleIndustry]);
  }

  return canViewProfileField({
    profile,
    fieldName: 'fullHobbies',
    viewer,
    isConnection,
    language,
  })
    ? getUniqueValues(
        (profile.hobbies?.full ?? []).map((value) =>
          returnStringOrValue(language, value)
        )
      )
    : [];
};

const getModeSpecificValues = (
  profile: ProfileType,
  mode: ModeType,
  language: string
) => {
  if (mode.id === 'dating') {
    return getUniqueValues(
      (profile.main?.seeking ?? []).map((value) =>
        returnStringOrValue(language, value)
      )
    );
  }

  if (mode.id === 'friends') {
    return getUniqueValues(
      (profile.hobbies?.full ?? []).map((value) =>
        returnStringOrValue(language, value)
      )
    );
  }

  if (mode.id === 'neighborhood') {
    return getUniqueValues([
      returnStringOrValue(language, profile.main?.location),
    ]);
  }

  if (mode.id === 'academic') {
    return getUniqueValues([
      returnStringOrValue(
        language,
        profile.main?.fieldOfStudy ?? profile.main?.primaryAffiliation
      ),
    ]);
  }

  return getUniqueValues([
    returnStringOrValue(language, profile.main?.industry),
  ]);
};

const getMatchingConnectionStyleSignalCount = (
  viewerConnectionStyle: ConnectionStyleType | undefined,
  candidateConnectionStyle: ConnectionStyleType | undefined
): number => {
  if (!viewerConnectionStyle || !candidateConnectionStyle) {
    return 0;
  }
  let matchCount = 0;

  if (
    viewerConnectionStyle.availabilityPattern &&
    viewerConnectionStyle.availabilityPattern ===
      candidateConnectionStyle.availabilityPattern
  ) {
    matchCount += 1;
  }

  if (
    viewerConnectionStyle.communicationPace &&
    viewerConnectionStyle.communicationPace ===
      candidateConnectionStyle.communicationPace
  ) {
    matchCount += 1;
  }

  if (
    viewerConnectionStyle.introductionPreference &&
    viewerConnectionStyle.introductionPreference ===
      candidateConnectionStyle.introductionPreference
  ) {
    matchCount += 1;
  }

  if (
    viewerConnectionStyle.planningStyle &&
    viewerConnectionStyle.planningStyle ===
      candidateConnectionStyle.planningStyle
  ) {
    matchCount += 1;
  }

  if (
    getSharedDisplayValues(
      getConnectionStyleLanguageValues(viewerConnectionStyle),
      getConnectionStyleLanguageValues(candidateConnectionStyle)
    ).length > 0
  ) {
    matchCount += 1;
  }

  return matchCount;
};

const getRelevantGroups = ({
  viewerProfile,
  candidateProfile,
  viewer,
  isConnection,
  mode,
  groups,
  language,
}: {
  viewerProfile?: ProfileType;
  candidateProfile: ProfileType;
  viewer?: GateActorLikeType;
  isConnection: boolean;
  mode: ModeType;
  groups: GroupType[];
  language: string;
}): GroupType[] => {
  const viewerTags = viewerProfile
    ? getDiscoveryProfileTags(viewerProfile, mode, language)
    : [];
  const candidateTags = getVisibleDiscoveryProfileTags({
    profile: candidateProfile,
    mode,
    viewer,
    isConnection,
    language,
  });
  const viewerLocation = getProfileLocation(viewerProfile, language);
  const candidateLocation = getVisibleProfileLocation({
    profile: candidateProfile,
    viewer,
    isConnection,
    language,
  });

  return groups.filter((group) => {
    const groupTerms = getGroupTerms(group, language);
    const candidateTagMatches = getSharedDisplayValues(
      candidateTags,
      groupTerms
    ).length;
    const viewerTagMatches = getSharedDisplayValues(
      viewerTags,
      groupTerms
    ).length;
    const candidateLocationMatch = hasLocationOverlap(
      candidateLocation,
      getGroupLocation(group, language)
    );
    const viewerLocationMatch = hasLocationOverlap(
      viewerLocation,
      getGroupLocation(group, language)
    );

    const score =
      candidateTagMatches * 2 +
      viewerTagMatches +
      (candidateLocationMatch ? 2 : 0) +
      (viewerLocationMatch ? 1 : 0);

    return score >= 2;
  });
};

const buildRecommendedNextAction = ({
  connectionStyle,
  canSendIntro,
  canRequestConnection,
  hasOutgoingRequest,
  joinRecommendedGroupIds,
  relevantGroupIds,
}: {
  connectionStyle?: ConnectionStyleType;
  canSendIntro: boolean;
  canRequestConnection: boolean;
  hasOutgoingRequest: boolean;
  joinRecommendedGroupIds: string[];
  relevantGroupIds: string[];
}): RecommendedNextActionType => {
  if (hasOutgoingRequest) {
    return 'view_profile';
  }

  const introductionPreference = connectionStyle?.introductionPreference;
  const prefersGroupContext =
    introductionPreference === 'group_first' ||
    introductionPreference === 'context_before_direct';

  if (prefersGroupContext && joinRecommendedGroupIds.length > 0) {
    return 'join_community_first';
  }

  if (
    introductionPreference === 'context_before_direct' &&
    canRequestConnection
  ) {
    return 'open_direct_request';
  }

  if (canSendIntro) {
    return 'send_intro';
  }

  if (canRequestConnection) {
    return 'request_connection';
  }

  if (joinRecommendedGroupIds.length > 0 || relevantGroupIds.length > 0) {
    return 'join_community_first';
  }

  return 'not_reachable_yet';
};

const buildReasonLabels = ({
  reasonIds,
  strings,
  language,
}: {
  reasonIds: string[];
  strings: DiscoveryGuidanceModeStringsType;
  language: string;
}): string[] =>
  getUniqueValues(
    reasonIds
      .map((reasonId) =>
        returnStringOrValue(language, strings.rationaleReasons[reasonId])
      )
      .filter((value) => value.length > 0)
  );

const buildWhyShownDetails = ({
  rationale,
  hasIncomingInterest,
  sharedTags,
  candidateLocation,
  commonStrings,
  discoveryGuidanceStrings,
  language,
}: {
  rationale: DiscoveryRationaleType;
  hasIncomingInterest: boolean;
  sharedTags: string[];
  candidateLocation: string;
  commonStrings: CommonStringsType;
  discoveryGuidanceStrings: DiscoveryGuidanceModeStringsType;
  language: string;
}): string[] => {
  const detailLines: string[] = [];

  if (hasIncomingInterest) {
    detailLines.push(commonStrings.whyShownInterestTemplate?.[language] ?? '');
  }

  rationale.reasonIds.forEach((reasonId) => {
    if (reasonId === 'shared_interests' && sharedTags.length > 0) {
      detailLines.push(
        formatTemplate(
          commonStrings.whyShownSharedTagsTemplate?.[language] ?? '',
          {
            value: sharedTags.slice(0, 3).join(', '),
          }
        )
      );
      return;
    }

    if (reasonId === 'local_relevance' && candidateLocation.length > 0) {
      detailLines.push(
        formatTemplate(
          commonStrings.whyShownLocationTemplate?.[language] ?? '',
          {
            value: candidateLocation,
          }
        )
      );
      return;
    }

    const label = returnStringOrValue(
      language,
      discoveryGuidanceStrings.rationaleReasons[reasonId]
    );
    if (label.length > 0) {
      detailLines.push(label);
    }
  });

  return getUniqueValues(detailLines);
};

/**
 * Extract display-ready profile tags used by discovery filtering and rationale.
 */
export const getDiscoveryProfileTags = (
  profile: ProfileType,
  mode: ModeType,
  language: string
): string[] => {
  if (mode.id === 'academic') {
    return getUniqueValues([
      ...(profile.highlights?.skills ?? []).map((value) =>
        returnStringOrValue(language, value)
      ),
      returnStringOrValue(language, profile.main?.fieldOfStudy),
    ]);
  }

  if (mode.id === 'professional') {
    return getUniqueValues([
      ...(profile.highlights?.skills ?? []).map((value) =>
        returnStringOrValue(language, value)
      ),
      returnStringOrValue(language, profile.main?.industry),
    ]);
  }

  return getUniqueValues(
    (profile.hobbies?.full ?? []).map((value) =>
      returnStringOrValue(language, value)
    )
  );
};

/**
 * Extract mode-specific profile values used by discovery filtering and intent checks.
 */
export const getModeSpecificDiscoveryValues = (
  profile: ProfileType,
  mode: ModeType,
  language: string
): string[] => getModeSpecificValues(profile, mode, language);

/**
 * Check whether a profile matches the active compatibility filters.
 */
export const profileMatchesCompatibilityFilters = (
  profile: ProfileType,
  filters: DiscoveryCompatibilityFiltersType,
  {
    viewer,
    isConnection,
    language,
  }: {
    viewer?: GateActorLikeType;
    isConnection: boolean;
    language: string;
  }
): boolean => {
  const connectionStyle = getVisibleConnectionStyle({
    profile,
    viewer,
    isConnection,
    language,
  });
  const languageValues = getConnectionStyleLanguageValues(connectionStyle);

  if (
    filters.availabilityPattern.length > 0 &&
    connectionStyle?.availabilityPattern !== filters.availabilityPattern
  ) {
    return false;
  }

  if (
    filters.communicationPace.length > 0 &&
    connectionStyle?.communicationPace !== filters.communicationPace
  ) {
    return false;
  }

  if (
    filters.introductionPreference.length > 0 &&
    connectionStyle?.introductionPreference !== filters.introductionPreference
  ) {
    return false;
  }

  if (
    filters.languageComfort.length > 0 &&
    !languageValues.includes(filters.languageComfort)
  ) {
    return false;
  }

  if (
    filters.planningStyle.length > 0 &&
    connectionStyle?.planningStyle !== filters.planningStyle
  ) {
    return false;
  }

  return true;
};

/**
 * Convert one profile into resolved discovery rationale and next-step guidance.
 */
export const buildProfileDiscoveryGuidance = ({
  mode,
  profile,
  viewerProfile,
  viewer,
  isConnection,
  groups,
  joinedGroupIds,
  language,
  commonStrings,
  connectionStyleStrings,
  discoveryGuidanceStrings,
  canSendIntro,
  canRequestConnection,
  hasIncomingInterest,
  hasOutgoingRequest,
}: {
  mode: ModeType;
  profile: ProfileType;
  viewerProfile?: ProfileType;
  viewer?: GateActorLikeType;
  isConnection: boolean;
  groups: GroupType[];
  joinedGroupIds: Set<string>;
  language: string;
  commonStrings: CommonStringsType;
  connectionStyleStrings: ConnectionStyleModeStringsType;
  discoveryGuidanceStrings: DiscoveryGuidanceModeStringsType;
  canSendIntro: boolean;
  canRequestConnection: boolean;
  hasIncomingInterest: boolean;
  hasOutgoingRequest: boolean;
}): ProfileDiscoveryGuidanceType => {
  const visibleConnectionStyle = getVisibleConnectionStyle({
    profile,
    viewer,
    isConnection,
    language,
  });
  const viewerTags = viewerProfile
    ? getDiscoveryProfileTags(viewerProfile, mode, language)
    : [];
  const candidateTags = getVisibleDiscoveryProfileTags({
    profile,
    mode,
    viewer,
    isConnection,
    language,
  });
  const sharedTags = getSharedDisplayValues(candidateTags, viewerTags, 3);
  const viewerModeValues = viewerProfile
    ? getModeSpecificValues(viewerProfile, mode, language)
    : [];
  const candidateModeValues = getModeSpecificValues(profile, mode, language);
  const sharedModeValues = getSharedDisplayValues(
    candidateModeValues,
    viewerModeValues
  );
  const candidateLocation = getVisibleProfileLocation({
    profile,
    viewer,
    isConnection,
    language,
  });
  const viewerLocation = getProfileLocation(viewerProfile, language);
  const relevantGroups = getRelevantGroups({
    viewerProfile,
    candidateProfile: profile,
    viewer,
    isConnection,
    mode,
    groups,
    language,
  });
  const relevantGroupIds = relevantGroups.map((group) => group.id);
  const joinRecommendedGroupIds = relevantGroups
    .filter((group) => !joinedGroupIds.has(group.id))
    .map((group) => group.id);
  const matchingSignalCount = getMatchingConnectionStyleSignalCount(
    viewerProfile?.connectionStyle,
    visibleConnectionStyle
  );
  const reasonIds: string[] = [];

  if (sharedTags.length > 0) {
    reasonIds.push('shared_interests');
  }

  if (sharedModeValues.length > 0) {
    reasonIds.push('aligned_intent');
  }

  if (matchingSignalCount > 0) {
    reasonIds.push('compatible_pace');
  }

  if (relevantGroupIds.length > 0) {
    reasonIds.push('community_context');
  }

  if (hasLocationOverlap(viewerLocation, candidateLocation)) {
    reasonIds.push('local_relevance');
  }

  if (
    (canSendIntro || canRequestConnection) &&
    (matchingSignalCount > 0 ||
      sharedTags.length > 0 ||
      relevantGroupIds.length > 0 ||
      hasIncomingInterest)
  ) {
    reasonIds.push('credibility_match');
  } else if (
    reasonIds.length === 0 &&
    hasConnectionStyleValue(visibleConnectionStyle)
  ) {
    reasonIds.push('credibility_match');
  }

  const rationale: DiscoveryRationaleType = {
    reasonIds: getUniqueValues(reasonIds),
    recommendedNextAction: buildRecommendedNextAction({
      connectionStyle: visibleConnectionStyle,
      canSendIntro,
      canRequestConnection,
      hasOutgoingRequest,
      joinRecommendedGroupIds,
      relevantGroupIds,
    }),
  };
  const reasonLabels = buildReasonLabels({
    reasonIds: rationale.reasonIds,
    strings: discoveryGuidanceStrings,
    language,
  });
  const hintMessages = getUniqueValues([
    ...(joinRecommendedGroupIds.length > 0 &&
    rationale.recommendedNextAction === 'join_community_first'
      ? [discoveryGuidanceStrings.groupFirstHint[language] ?? '']
      : []),
    ...(!canSendIntro
      ? [discoveryGuidanceStrings.blockedIntro[language] ?? '']
      : []),
    ...(!canRequestConnection
      ? [discoveryGuidanceStrings.blockedConnection[language] ?? '']
      : []),
  ]);

  return {
    rationale,
    reasonLabels,
    detailLines: buildWhyShownDetails({
      rationale,
      hasIncomingInterest,
      sharedTags,
      candidateLocation,
      commonStrings,
      discoveryGuidanceStrings,
      language,
    }),
    recommendedActionLabel:
      discoveryGuidanceStrings.recommendedActions[
        rationale.recommendedNextAction
      ]?.[language] ?? '',
    compatibilityBadges: buildConnectionStyleBadgeLabels({
      profile,
      viewer,
      isConnection,
      strings: connectionStyleStrings,
      language,
    }),
    hintMessages,
    relevantGroupIds,
    joinRecommendedGroupIds,
  };
};

/**
 * Convert one community into resolved join rationale and trust-framing cues.
 */
export const buildGroupDiscoveryGuidance = ({
  mode,
  group,
  viewerProfile,
  language,
  commonStrings,
  discoveryGuidanceStrings,
  communityGuidanceStrings,
}: {
  mode: ModeType;
  group: GroupType;
  viewerProfile?: ProfileType;
  language: string;
  commonStrings: CommonStringsType;
  discoveryGuidanceStrings: DiscoveryGuidanceModeStringsType;
  communityGuidanceStrings: CommunityGuidanceModeStringsType;
}): GroupDiscoveryGuidanceType => {
  const viewerTags = viewerProfile
    ? getDiscoveryProfileTags(viewerProfile, mode, language)
    : [];
  const groupTerms = getGroupTerms(group, language);
  const sharedTags = getSharedDisplayValues(viewerTags, groupTerms);
  const viewerLocation = getProfileLocation(viewerProfile, language);
  const groupLocation = getGroupLocation(group, language);
  const resolvedGroup = ensureGroupGovernanceData(group);
  const rulesValue = renderValue(language, resolvedGroup.rules).trim();
  const moderationValue = resolveGovernanceModerationSummary({
    governance: resolvedGroup.governance,
    strings: commonStrings,
    language,
  }).trim();
  const normsCue = rulesValue || moderationValue || undefined;
  const organizerCue =
    resolvedGroup.members.find((member) =>
      resolvedGroup.admins?.includes(member.userId)
    )?.userName ||
    resolvedGroup.members.find((member) =>
      member.roleIds?.includes('organizer')
    )?.userName;
  const firstEventTitle = resolvedGroup.events?.[0]?.title?.trim() ?? '';
  const firstAvailabilityLabel =
    resolvedGroup.availabilityOptions?.[0]?.label?.trim() ?? '';
  const memberCount = resolvedGroup.members?.length ?? 0;
  const activityCue =
    firstEventTitle ||
    firstAvailabilityLabel ||
    `${commonStrings.membersLabel?.[language] ?? ''}: ${memberCount}`;
  const reasonIds = getUniqueValues([
    ...(sharedTags.length > 0 ? ['shared_interests'] : []),
    ...(hasLocationOverlap(viewerLocation, groupLocation)
      ? ['local_relevance']
      : []),
    ...(groupTerms.length > 0 ? ['aligned_intent'] : []),
    ...(normsCue ? ['community_context'] : []),
    ...(organizerCue || normsCue ? ['credibility_match'] : []),
  ]);

  return {
    whyJoinReasons: buildReasonLabels({
      reasonIds,
      strings: discoveryGuidanceStrings,
      language,
    }).slice(0, 4),
    whyJoinRecommendation:
      communityGuidanceStrings.joinFirstRecommendation[language] ?? '',
    organizerCue,
    normsCue,
    activityCue,
  };
};

/**
 * Resolve display-ready connection-style badges for discovery cards.
 */
export const buildConnectionStyleBadgeLabels = ({
  profile,
  viewer,
  isConnection,
  strings,
  language,
}: {
  profile: ProfileType;
  viewer?: GateActorLikeType;
  isConnection: boolean;
  strings: ConnectionStyleModeStringsType;
  language: string;
}): string[] => {
  const connectionStyle = getVisibleConnectionStyle({
    profile,
    viewer,
    isConnection,
    language,
  });

  return getUniqueValues([
    ...(connectionStyle?.introductionPreference === 'group_first'
      ? [returnStringOrValue(language, strings.badges.groupFirst)]
      : []),
    ...(connectionStyle?.introductionPreference === 'direct_intro_ok'
      ? [returnStringOrValue(language, strings.badges.directIntroOk)]
      : []),
    ...(connectionStyle?.communicationPace === 'low_pressure'
      ? [returnStringOrValue(language, strings.badges.lowPressure)]
      : []),
    ...(connectionStyle?.languageComfort?.multilingualWelcome
      ? [returnStringOrValue(language, strings.badges.multilingual)]
      : []),
    ...(connectionStyle?.planningStyle === 'plan_ahead'
      ? [returnStringOrValue(language, strings.badges.planAhead)]
      : []),
  ]);
};
