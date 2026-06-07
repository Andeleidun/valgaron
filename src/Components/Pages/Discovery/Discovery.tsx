import { useState, useEffect, useContext, useMemo, useRef } from 'react';
import {
  ModeType,
  ProfileType,
  ProfilesType,
  PanelsType,
  DiscoveryStringsType,
  CommonStringsType,
  ProfileStringsType,
  GroupType,
  ConnectionStyleStringsType,
  DiscoveryGuidanceStringsType,
  CommunityGuidanceStringsType,
  ModeSurfaceLoadingChangeHandlerType,
  OptionType,
} from '../../../types';
import { fetchProfileDataAsync } from './DiscoveryHelper';
import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Container,
  Grid,
  GridItem,
  Collapse,
  PeopleCard,
  Tabs,
  Text,
  Spinner,
  EmptyState,
  ErrorState,
  GroupCard,
  useToast,
} from '../../';
import {
  evaluateConnectionRequestGate,
  evaluateIntroMessageGate,
  formatTemplate,
  resolveGateActor,
  resolveVisibleProfileFieldValue,
  UserContext,
  useRelationship,
  returnStringOrValue,
} from '../../../Utlilities';
import { getModeActivationStatus } from '../../../Utlilities/userActivation';
import { createSafetyReport } from '../../../Utlilities/safety';
import { buildCurrentGroupMember } from '../../../Utlilities/groupMemberships';
import { useModeGroupMemberships } from '../../../Utlilities/useModeGroupMemberships';
import { useAuth } from '../../../Utlilities/auth/AuthContext';
import { LOCAL_AUTH_USER_UID } from '../../../Utlilities/auth/localIdentity';
import { resolvePublicUserName } from '../../../Utlilities/userIdentity';
import { useNavigate } from 'react-router-dom';
import { buildMessagesPath } from '../Dashboard/dashboardRoutes';
import DiscoveryFilterBar, {
  type DiscoveryFilters,
  type DiscoverySelectFilterConfig,
  type DiscoverySortOption,
} from './DiscoveryFilterBar';
import {
  buildGroupDiscoveryGuidance,
  buildProfileDiscoveryGuidance,
  getDiscoveryProfileTags,
  getModeSpecificDiscoveryValues,
  profileMatchesCompatibilityFilters,
} from './DiscoveryGuidance';
import './Discovery.css';

type DiscoveryProps = {
  mode: ModeType;
  strings: {
    discovery: DiscoveryStringsType;
    profile: ProfileStringsType;
    common: CommonStringsType;
    connectionStyle: ConnectionStyleStringsType;
    discoveryGuidance: DiscoveryGuidanceStringsType;
    communityGuidance: CommunityGuidanceStringsType;
  };
  language: string;
  onModeSurfaceLoadingChange?: ModeSurfaceLoadingChangeHandlerType;
};

type DiscoveryCtaType = 'like' | 'message';

type DiscoveryCtaState = {
  type: DiscoveryCtaType;
  name: string;
};

/**
 * Build a fresh set of default discovery filters.
 */
const createDefaultDiscoveryFilters = (): DiscoveryFilters => ({
  searchText: '',
  tags: [],
  modeSpecific: '',
  availabilityPattern: '',
  communicationPace: '',
  introductionPreference: '',
  languageComfort: '',
  planningStyle: '',
});

/**
 * Convert mixed profile text values into normalized lowercase tokens.
 */
const normalizeDiscoveryValues = (values: string[]): string[] =>
  values
    .map((value) => value.trim().toLowerCase())
    .filter((value) => value.length > 0);

/**
 * Convert plain string values into select options.
 */
const buildStringOptions = (values: string[]): OptionType[] =>
  Array.from(new Set(values.filter((value) => value.length > 0))).map(
    (value) => ({
      value,
      label: value,
    })
  );

/**
 * Resolve the community metadata values used by the group-only discovery filter.
 */
const getGroupModeSpecificValues = (
  group: GroupType,
  language: string
): string[] =>
  Array.from(
    new Set(
      [
        ...(group.tags ?? []).map((tag) => returnStringOrValue(language, tag)),
        returnStringOrValue(language, group.category),
        returnStringOrValue(language, group.location),
      ]
        .map((value) => value.trim())
        .filter((value) => value.length > 0)
    )
  );

/**
 * Resolve a stable "recent" sort value from seeded profile ids.
 *
 * Discovery fixtures use both numeric ids and mode-prefixed ids such as
 * `dating-20`, so recent sorting needs the trailing numeric segment rather
 * than a direct `Number(id)` cast.
 */
const getProfileRecentSortValue = (
  profile: Pick<ProfileType, 'id'>
): number => {
  const numericSuffixMatch = profile.id.match(/(\d+)(?!.*\d)/);

  if (!numericSuffixMatch) {
    return Number.NEGATIVE_INFINITY;
  }

  const parsedValue = Number(numericSuffixMatch[1]);
  return Number.isNaN(parsedValue) ? Number.NEGATIVE_INFINITY : parsedValue;
};

/**
 * Convert translated multi-options into select options for discovery filters.
 */
const buildTranslatedOptions = (
  options: NonNullable<
    ConnectionStyleStringsType['dating']['availabilityPattern']['options']
  >,
  language: string
): OptionType[] =>
  options.map((option) => ({
    value: option.value,
    label: returnStringOrValue(language, option.label),
  }));

/**
 * Score a profile for default discovery ordering.
 */
const scoreDiscoveryProfile = ({
  viewerLocation,
  candidateLocation,
  viewerTags,
  viewerSeeking,
  candidateTags,
  candidateSeeking,
  hasIncomingInterest,
  hasOutgoingRequest,
}: {
  viewerLocation: string;
  candidateLocation: string;
  viewerTags: string[];
  viewerSeeking: string[];
  candidateTags: string[];
  candidateSeeking: string[];
  hasIncomingInterest: boolean;
  hasOutgoingRequest: boolean;
}): number => {
  const normalizedViewerLocation = viewerLocation.trim().toLowerCase();
  const normalizedCandidateLocation = candidateLocation.trim().toLowerCase();
  const tagOverlapCount = candidateTags.filter((tag) =>
    viewerTags.includes(tag)
  ).length;
  const seekingOverlapCount = candidateSeeking.filter((value) =>
    viewerSeeking.includes(value)
  ).length;
  const exactLocationHit =
    normalizedViewerLocation.length > 0 &&
    normalizedViewerLocation === normalizedCandidateLocation;
  const regionLocationHit =
    !exactLocationHit &&
    normalizedViewerLocation.length > 0 &&
    normalizedCandidateLocation.length > 0 &&
    normalizedViewerLocation.split(',')[0] ===
      normalizedCandidateLocation.split(',')[0];

  return (
    tagOverlapCount * 12 +
    seekingOverlapCount * 16 +
    (exactLocationHit ? 30 : 0) +
    (regionLocationHit ? 12 : 0) +
    (hasIncomingInterest ? 40 : 0) +
    (hasOutgoingRequest ? 8 : 0)
  );
};

/**
 * Discovery workspace for the active mode.
 *
 * This page merges seeded profile data, the current user's profile, relationship
 * gating, and community membership actions into the app's main browse-and-act
 * surface.
 */
function Discovery({
  mode,
  strings,
  language,
  onModeSurfaceLoadingChange,
}: DiscoveryProps) {
  const onModeSurfaceLoadingChangeRef = useRef(onModeSurfaceLoadingChange);
  const pendingModeSurfaceLoadRef = useRef<ModeType['id'] | null>(null);
  const userContext = useContext(UserContext);
  const {
    getModeState,
    requestConnection,
    ensureDirectChat,
    setGroupMembership,
    blockProfile,
    blockGroup,
    submitSafetyReport,
  } = useRelationship();
  const { user: authUser } = useAuth();
  const currentUserId = authUser?.uid ?? LOCAL_AUTH_USER_UID;
  const relationshipState = getModeState(mode.id);
  const [profiles, setProfiles] = useState<ProfilesType>();
  const [tabIndex, setTabIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [filters, setFilters] = useState<DiscoveryFilters>(
    createDefaultDiscoveryFilters
  );
  const [sortOption, setSortOption] = useState<DiscoverySortOption>('');
  const { pushToast } = useToast();
  const [ctaState, setCtaState] = useState<DiscoveryCtaState | null>(null);
  const [whyShownProfileId, setWhyShownProfileId] = useState<string | null>(
    null
  );
  const [peoplePageIndex, setPeoplePageIndex] = useState(1);
  const [groupsPageIndex, setGroupsPageIndex] = useState(1);
  const userProfile = userContext.user[mode.id];
  const communities = relationshipState.groups;
  const navigate = useNavigate();
  const pageSize = 6;
  const commonLabel = (key: string): string =>
    strings.common[key]?.[language] ?? strings.common[key]?.en ?? '';
  const currentUserLabel = commonLabel('youLabel');
  const profileLabel = commonLabel('profileLabel');
  const { joinedGroupIds, setModeGroupMembership } = useModeGroupMemberships({
    currentUserId,
    groups: communities,
    groupMemberships: userContext.user.groupMemberships,
    modeId: mode.id,
    setUserGroupMemberships: userContext.setUserGroupMemberships,
  });
  const currentGroupMemberName = resolvePublicUserName({
    profileName: userProfile?.name,
    authDisplayName: authUser?.displayName,
    fallbackLabel: currentUserLabel,
  });
  const reportLabel = commonLabel('reportLabel');
  const blockLabel = commonLabel('blockLabel');
  const whyShownLabel = commonLabel('whyShownLabel');
  const reportSavedLabel = commonLabel('reportSavedLabel');
  const blockedUserLabel = commonLabel('blockedUserLabel');
  const blockedGroupLabel = commonLabel('blockedGroupLabel');
  const noProfilesErrorTitle = commonLabel('noProfilesErrorTitle');
  const adjustFiltersMessage = commonLabel('adjustFiltersMessage');
  const createGroupOrCheckLaterMessage = commonLabel(
    'createGroupOrCheckLaterMessage'
  );
  const filtersAndSortLabel = commonLabel('filtersAndSortLabel');
  const noGroupsMessage = createGroupOrCheckLaterMessage;
  const connectionStyleStrings = strings.connectionStyle[mode.id];
  const discoveryGuidanceStrings = strings.discoveryGuidance[mode.id];
  const communityGuidanceStrings = strings.communityGuidance[mode.id];
  const joinedGroupTemplate = commonLabel('joinedGroupTemplate');
  const leftGroupTemplate = commonLabel('leftGroupTemplate');
  const connectionAcceptedTemplate = commonLabel('connectionAcceptedTemplate');
  const alreadyConnectedTemplate = commonLabel('alreadyConnectedTemplate');
  const connectionRequestAlreadySentTemplate = commonLabel(
    'connectionRequestAlreadySentTemplate'
  );
  const connectionRequestSentTemplate = commonLabel(
    'connectionRequestSentTemplate'
  );
  const connectionRequestUnavailable = commonLabel(
    'connectionRequestUnavailable'
  );
  const messageUnavailable = commonLabel('messageUnavailable');
  const profileReportedTemplate = commonLabel('profileReportedTemplate');
  const groupReportedTemplate = commonLabel('groupReportedTemplate');
  const activationGateInteractionsMessage = commonLabel(
    'activationGateInteractionsMessage'
  );
  const viewerActor = resolveGateActor({
    id: userProfile?.id,
    verificationTier: userProfile?.verificationTier,
    restrictionState: userProfile?.restrictionState,
    lifecycleState: userProfile?.lifecycleState,
  });
  const activationStatus = getModeActivationStatus({
    user: userContext.user,
    modeId: mode.id,
  });
  const interactionGate = useMemo(
    () => ({
      isLocked: !activationStatus.isReady,
      message: activationGateInteractionsMessage,
    }),
    [activationGateInteractionsMessage, activationStatus.isReady]
  );

  useEffect(() => {
    onModeSurfaceLoadingChangeRef.current = onModeSurfaceLoadingChange;
  }, [onModeSurfaceLoadingChange]);

  useEffect(() => {
    pendingModeSurfaceLoadRef.current = mode.id;
    onModeSurfaceLoadingChangeRef.current?.({
      modeId: mode.id,
      isLoading: true,
    });

    return () => {
      if (pendingModeSurfaceLoadRef.current !== mode.id) {
        return;
      }

      pendingModeSurfaceLoadRef.current = null;
      onModeSurfaceLoadingChangeRef.current?.({
        modeId: mode.id,
        isLoading: false,
      });
    };
  }, [mode.id]);

  useEffect(() => {
    let isCancelled = false;
    setLoading(true);
    setProfileError(null);

    fetchProfileDataAsync(mode)
      .then((profileData) => {
        if (isCancelled) {
          return;
        }
        const useProfiles = [
          ...(profileData || []),
          ...(userProfile?.id ? [userProfile] : []),
        ];
        setProfiles(useProfiles as ProfilesType);
      })
      .catch((error: Error) => {
        if (!isCancelled) {
          setProfileError(error.message);
        }
      })
      .finally(() => {
        if (!isCancelled) {
          setLoading(false);
          if (pendingModeSurfaceLoadRef.current === mode.id) {
            pendingModeSurfaceLoadRef.current = null;
            onModeSurfaceLoadingChangeRef.current?.({
              modeId: mode.id,
              isLoading: false,
            });
          }
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [mode, userProfile]);

  /**
   * Reset pagination and CTA state when filters or mode change.
   */
  useEffect(() => {
    setPeoplePageIndex(1);
    setGroupsPageIndex(1);
    setCtaState(null);
    setWhyShownProfileId(null);
  }, [filters, sortOption, mode.id]);

  /**
   * Clear filters when changing modes so stale values do not hide valid
   * profiles from the newly selected mode.
   */
  useEffect(() => {
    setFilters(createDefaultDiscoveryFilters());
    setSortOption('');
  }, [mode.id]);

  /**
   * Reset all discovery filters to defaults.
   */
  const resetFilters = () => {
    setFilters(createDefaultDiscoveryFilters());
  };

  /**
   * Show a toast message.
   */
  const showToast = (message: string) => {
    pushToast(message);
  };

  /**
   * Show inline CTA feedback for discovery actions.
   */
  const showCtaFeedback = (type: DiscoveryCtaType, name: string) => {
    setCtaState({ type, name });
  };

  /**
   * Toggle join state for a group.
   */
  const toggleJoin = (groupId: string) => {
    if (interactionGate.isLocked) {
      return;
    }
    const groupName =
      communities?.find((group) => group.id === groupId)?.groupName ??
      commonLabel('groupLabel');
    const willJoin = !joinedGroupIds.has(groupId);
    setModeGroupMembership({
      groupId,
      joined: willJoin,
    });
    showToast(
      formatTemplate(willJoin ? joinedGroupTemplate : leftGroupTemplate, {
        name: groupName,
      })
    );
    setGroupMembership(
      mode.id,
      groupId,
      buildCurrentGroupMember({
        groupId,
        userId: currentUserId,
        userName: currentGroupMemberName,
      }),
      willJoin
    );
  };

  /**
   * Navigate to community group details.
   */
  const viewDetails = (groupId: string) => {
    navigate(`/community/${groupId}`);
  };

  /**
   * Extract a list of tags from a profile for filtering.
   */
  const getProfileTags = (profile: ProfileType): string[] =>
    profile ? getDiscoveryProfileTags(profile, mode, language) : [];

  /**
   * Determine if a profile passes the current filters.
   */
  const profilePassesFilters = (profile: ProfileType) => {
    if (!profile) return false;
    const search = filters.searchText.trim().toLowerCase();
    const isConnection = relationshipState.connectionIds.includes(profile.id);
    const visibleName = resolveVisibleProfileFieldValue({
      profile,
      fieldName: 'name',
      value: profile.name,
      language,
      viewer: viewerActor,
      isConnection,
    });
    const visibleLocation = resolveVisibleProfileFieldValue({
      profile,
      fieldName: 'location',
      value: profile.main?.location,
      language,
      viewer: viewerActor,
      isConnection,
    });
    const nameIncludesSearch = visibleName.toLowerCase().includes(search);
    const locationIncludesSearch = visibleLocation
      .toLowerCase()
      .includes(search);
    const passesSearch =
      search.length === 0 || nameIncludesSearch || locationIncludesSearch;
    const profileTags = getProfileTags(profile).map((tag) => tag.toLowerCase());
    const filterTags = filters.tags.map((tag) => tag.toLowerCase());
    const passesTags =
      filterTags.length === 0 ||
      filterTags.some((tag) => profileTags.includes(tag));
    const modeSpecificValues = getModeSpecificDiscoveryValues(
      profile,
      mode,
      language
    ).map((value) => value.toLowerCase());
    const passesModeSpecific =
      filters.modeSpecific.length === 0 ||
      modeSpecificValues.includes(filters.modeSpecific.toLowerCase());
    const passesCompatibilityFilters = profileMatchesCompatibilityFilters(
      profile,
      filters,
      {
        viewer: viewerActor,
        isConnection,
        language,
      }
    );

    return (
      passesSearch &&
      passesTags &&
      passesModeSpecific &&
      passesCompatibilityFilters
    );
  };

  /**
   * Determine if a group passes the current filters.
   */
  const groupPassesFilters = (group: GroupType) => {
    const search = filters.searchText.trim().toLowerCase();
    const nameIncludesSearch = group.groupName.toLowerCase().includes(search);
    const descriptionIncludesSearch = group.description
      .toLowerCase()
      .includes(search);
    const passesSearch =
      search.length === 0 || nameIncludesSearch || descriptionIncludesSearch;
    const groupTags = (group.tags ?? [])
      .map((tag) => returnStringOrValue(language, tag).toLowerCase())
      .filter((tag) => tag.length > 0);
    const filterTags = filters.tags.map((tag) => tag.toLowerCase());
    const passesTags =
      filterTags.length === 0 ||
      filterTags.some((tag) => groupTags.includes(tag));
    if (filters.modeSpecific.length === 0) {
      return passesSearch && passesTags;
    }
    const modeValue = filters.modeSpecific.toLowerCase();
    const modeFitsFilter = getGroupModeSpecificValues(group, language)
      .map((value) => value.toLowerCase())
      .includes(modeValue);
    return passesSearch && passesTags && modeFitsFilter;
  };

  /**
   * Sort a list of profiles.
   */
  const sortProfiles = (items: ProfileType[]) => {
    const sorted = [...items];
    if (sortOption === 'name') {
      return sorted.sort((a, b) => (a.name ?? '').localeCompare(b.name ?? ''));
    }
    if (sortOption === 'recent') {
      return sorted.sort(
        (a, b) => getProfileRecentSortValue(b) - getProfileRecentSortValue(a)
      );
    }
    const viewerTags = normalizeDiscoveryValues(
      userProfile ? getProfileTags(userProfile) : []
    );
    const viewerSeeking = normalizeDiscoveryValues(
      userProfile
        ? getModeSpecificDiscoveryValues(userProfile, mode, language)
        : []
    );
    const viewerLocation = returnStringOrValue(
      language,
      userProfile?.main?.location
    );

    return sorted.sort((left, right) => {
      const leftScore = scoreDiscoveryProfile({
        viewerLocation,
        candidateLocation: returnStringOrValue(language, left.main?.location),
        viewerTags,
        viewerSeeking,
        candidateTags: normalizeDiscoveryValues(getProfileTags(left)),
        candidateSeeking: normalizeDiscoveryValues(
          getModeSpecificDiscoveryValues(left, mode, language)
        ),
        hasIncomingInterest: relationshipState.incomingInterestIds.includes(
          left.id
        ),
        hasOutgoingRequest:
          relationshipState.outgoingConnectionRequestIds.includes(left.id),
      });
      const rightScore = scoreDiscoveryProfile({
        viewerLocation,
        candidateLocation: returnStringOrValue(language, right.main?.location),
        viewerTags,
        viewerSeeking,
        candidateTags: normalizeDiscoveryValues(getProfileTags(right)),
        candidateSeeking: normalizeDiscoveryValues(
          getModeSpecificDiscoveryValues(right, mode, language)
        ),
        hasIncomingInterest: relationshipState.incomingInterestIds.includes(
          right.id
        ),
        hasOutgoingRequest:
          relationshipState.outgoingConnectionRequestIds.includes(right.id),
      });

      if (rightScore !== leftScore) {
        return rightScore - leftScore;
      }
      return (left.name ?? '').localeCompare(right.name ?? '');
    });
  };

  /**
   * Sort a list of groups.
   */
  const sortGroups = (items: GroupType[]) => {
    const sorted = [...items];
    if (sortOption === 'name') {
      return sorted.sort((a, b) => a.groupName.localeCompare(b.groupName));
    }
    if (sortOption === 'membersCount') {
      return sorted.sort(
        (a, b) => (b.members?.length ?? 0) - (a.members?.length ?? 0)
      );
    }
    return sorted;
  };

  const filteredProfiles = useMemo(() => {
    const blockedProfileIds = new Set(
      relationshipState.blockedProfileIds ?? []
    );
    const candidateProfiles =
      profiles?.filter(
        (profile) =>
          profile?.id &&
          profile?.name &&
          profile.id !== userProfile?.id &&
          !blockedProfileIds.has(profile.id) &&
          !relationshipState.declinedProfileIds.includes(profile.id)
      ) ?? [];
    const discoverableProfiles = candidateProfiles.filter(
      (profile) => !relationshipState.connectionIds.includes(profile.id)
    );

    return sortProfiles(discoverableProfiles.filter(profilePassesFilters));
  }, [
    filters,
    language,
    mode,
    profiles,
    relationshipState,
    sortOption,
    userProfile,
  ]);

  const pagedProfiles = useMemo(() => {
    return filteredProfiles.slice(0, peoplePageIndex * pageSize);
  }, [filteredProfiles, peoplePageIndex]);

  const filteredGroups = useMemo(() => {
    const groupList = communities.filter(
      (group) =>
        !joinedGroupIds.has(group.id) &&
        !(relationshipState.blockedGroupIds ?? []).includes(group.id)
    );
    return sortGroups(groupList.filter(groupPassesFilters));
  }, [
    communities,
    filters,
    joinedGroupIds,
    mode,
    relationshipState.blockedGroupIds,
    sortOption,
  ]);

  const pagedGroups = useMemo(() => {
    return filteredGroups.slice(0, groupsPageIndex * pageSize);
  }, [filteredGroups, groupsPageIndex]);

  const tagOptions = useMemo(() => {
    const profileTags = (profiles ?? [])
      .filter((profile): profile is ProfileType => Boolean(profile))
      .flatMap((profile) => getProfileTags(profile))
      .map((tag) => `${tag}`.toLowerCase());
    const groupTags = (communities ?? [])
      .flatMap((group) => group.tags ?? [])
      .map((tag) => returnStringOrValue(language, tag).toLowerCase())
      .filter((tag) => tag.length > 0);
    return Array.from(new Set([...profileTags, ...groupTags])).filter(
      (tag) => tag.length > 0
    );
  }, [communities, language, mode, profiles]);

  const modeSpecificOptions = useMemo(() => {
    if (!profiles) return [];
    return Array.from(
      new Set(
        profiles.flatMap((profile) =>
          profile ? getModeSpecificDiscoveryValues(profile, mode, language) : []
        )
      )
    ).filter((value) => value.length > 0);
  }, [language, mode, profiles]);

  const groupModeSpecificOptions = useMemo(
    () =>
      Array.from(
        new Set(
          communities.flatMap((group) =>
            getGroupModeSpecificValues(group, language)
          )
        )
      ),
    [communities, language]
  );

  const profileGuidanceById = useMemo(() => {
    const guidanceEntries = filteredProfiles.map((profile) => {
      const profileActor = resolveGateActor({
        id: profile.id,
        verificationTier: profile.verificationTier,
        restrictionState: profile.restrictionState,
        lifecycleState: profile.lifecycleState,
      });
      const isConnection = relationshipState.connectionIds.includes(profile.id);
      const connectionDecision = evaluateConnectionRequestGate({
        sender: viewerActor,
        recipient: profileActor,
        alreadyConnected: isConnection,
        language,
      });
      const introDecision = evaluateIntroMessageGate({
        sender: viewerActor,
        recipient: profileActor,
        isConnection,
        messagingPrivacy: profile.messagingPrivacy ?? 'open_intro',
        language,
      });

      return [
        profile.id,
        buildProfileDiscoveryGuidance({
          mode,
          profile,
          viewerProfile: userProfile,
          viewer: viewerActor,
          isConnection,
          groups: communities,
          joinedGroupIds,
          language,
          commonStrings: strings.common,
          connectionStyleStrings,
          discoveryGuidanceStrings,
          canSendIntro: introDecision.allowed,
          canRequestConnection: connectionDecision.allowed,
          hasIncomingInterest: relationshipState.incomingInterestIds.includes(
            profile.id
          ),
          hasOutgoingRequest:
            relationshipState.outgoingConnectionRequestIds.includes(profile.id),
        }),
      ] as const;
    });

    return new Map(guidanceEntries);
  }, [
    communities,
    connectionStyleStrings,
    discoveryGuidanceStrings,
    filteredProfiles,
    joinedGroupIds,
    language,
    mode,
    relationshipState.connectionIds,
    relationshipState.incomingInterestIds,
    relationshipState.outgoingConnectionRequestIds,
    strings.common,
    userProfile,
    viewerActor,
  ]);

  const groupGuidanceById = useMemo(
    () =>
      new Map(
        filteredGroups.map((group) => [
          group.id,
          buildGroupDiscoveryGuidance({
            mode,
            group,
            viewerProfile: userProfile,
            language,
            commonStrings: strings.common,
            discoveryGuidanceStrings,
            communityGuidanceStrings,
          }),
        ])
      ),
    [
      communityGuidanceStrings,
      discoveryGuidanceStrings,
      filteredGroups,
      language,
      mode,
      strings.common,
      userProfile,
    ]
  );

  const peopleSelectFilters = useMemo<DiscoverySelectFilterConfig[]>(
    () => [
      {
        key: 'modeSpecific',
        label: strings.discovery[mode.id].modeSpecificLabel[language],
        options: buildStringOptions(modeSpecificOptions),
      },
      {
        key: 'availabilityPattern',
        label: connectionStyleStrings.availabilityPattern.title[language],
        options: buildTranslatedOptions(
          connectionStyleStrings.availabilityPattern.options ?? [],
          language
        ),
      },
      {
        key: 'communicationPace',
        label: connectionStyleStrings.communicationPace.title[language],
        options: buildTranslatedOptions(
          connectionStyleStrings.communicationPace.options ?? [],
          language
        ),
      },
      {
        key: 'introductionPreference',
        label: connectionStyleStrings.introductionPreference.title[language],
        options: buildTranslatedOptions(
          connectionStyleStrings.introductionPreference.options ?? [],
          language
        ),
      },
      {
        key: 'languageComfort',
        label: connectionStyleStrings.languageComfort.title[language],
        options: buildTranslatedOptions(
          connectionStyleStrings.languageComfort.options ?? [],
          language
        ),
      },
      {
        key: 'planningStyle',
        label: connectionStyleStrings.planningStyle.title[language],
        options: buildTranslatedOptions(
          connectionStyleStrings.planningStyle.options ?? [],
          language
        ),
      },
    ],
    [
      connectionStyleStrings,
      language,
      mode.id,
      modeSpecificOptions,
      strings.discovery,
    ]
  );

  const groupSelectFilters = useMemo<DiscoverySelectFilterConfig[]>(
    () => [
      {
        key: 'modeSpecific',
        label: strings.discovery[mode.id].modeSpecificLabel[language],
        options: buildStringOptions(groupModeSpecificOptions),
      },
    ],
    [groupModeSpecificOptions, language, mode.id, strings.discovery]
  );

  function generateProfiles() {
    if (profileError) {
      return (
        <ErrorState
          title={noProfilesErrorTitle}
          message={profileError}
          actionLabel={strings.common.clear[language]}
          onAction={resetFilters}
        />
      );
    }
    if (filteredProfiles.length === 0) {
      return (
        <EmptyState
          title={strings.discovery[mode.id].noProfiles[language]}
          message={adjustFiltersMessage}
          actionLabel={strings.common.clear[language]}
          onAction={resetFilters}
        />
      );
    }
    return (
      <Grid spacing={4}>
        {pagedProfiles.map((profile) => {
          const guidance = profileGuidanceById.get(profile.id);
          return (
            <GridItem xs={12} lg={6} key={profile.id}>
              <Box sx={{ display: 'grid', gap: 1 }}>
                <PeopleCard
                  profile={profile}
                  mode={mode}
                  like={() => {
                    const profileActor = resolveGateActor({
                      id: profile.id,
                      verificationTier: profile.verificationTier,
                      restrictionState: profile.restrictionState,
                      lifecycleState: profile.lifecycleState,
                    });
                    const isConnection =
                      relationshipState.connectionIds.includes(profile.id);
                    const gateDecision = evaluateConnectionRequestGate({
                      sender: viewerActor,
                      recipient: profileActor,
                      alreadyConnected: isConnection,
                      language,
                    });
                    if (!gateDecision.allowed) {
                      showToast(
                        gateDecision.reason ?? connectionRequestUnavailable
                      );
                      return;
                    }
                    const result = requestConnection(mode.id, profile.id);
                    showCtaFeedback('like', profile.name ?? profileLabel);
                    if (result === 'accepted') {
                      showToast(
                        formatTemplate(connectionAcceptedTemplate, {
                          name: profile.name ?? profileLabel,
                        })
                      );
                      return;
                    }
                    if (result === 'already_connected') {
                      showToast(
                        formatTemplate(alreadyConnectedTemplate, {
                          name: profile.name ?? profileLabel,
                        })
                      );
                      return;
                    }
                    if (result === 'already_requested') {
                      showToast(
                        formatTemplate(connectionRequestAlreadySentTemplate, {
                          name: profile.name ?? profileLabel,
                        })
                      );
                      return;
                    }
                    showToast(
                      formatTemplate(connectionRequestSentTemplate, {
                        name: profile.name ?? profileLabel,
                      })
                    );
                  }}
                  message={() => {
                    const profileActor = resolveGateActor({
                      id: profile.id,
                      verificationTier: profile.verificationTier,
                      restrictionState: profile.restrictionState,
                      lifecycleState: profile.lifecycleState,
                    });
                    const isConnection =
                      relationshipState.connectionIds.includes(profile.id);
                    const gateDecision = evaluateIntroMessageGate({
                      sender: viewerActor,
                      recipient: profileActor,
                      isConnection,
                      messagingPrivacy:
                        profile.messagingPrivacy ?? 'open_intro',
                      language,
                    });
                    if (!gateDecision.allowed) {
                      showToast(gateDecision.reason ?? messageUnavailable);
                      return;
                    }
                    ensureDirectChat(mode.id, {
                      id: profile.id,
                      name: profile.name ?? profileLabel,
                      avatarUrl: profile.pictures?.[0],
                    });
                    setCtaState(null);
                    navigate(buildMessagesPath({ contactId: profile.id }));
                  }}
                  language={language}
                  strings={{
                    profile: strings.profile,
                    common: strings.common,
                    connectionStyle: strings.connectionStyle,
                  }}
                  isConnection={relationshipState.connectionIds.includes(
                    profile.id
                  )}
                  likeActive={relationshipState.outgoingConnectionRequestIds.includes(
                    profile.id
                  )}
                  guidance={{
                    whyShownTitle:
                      discoveryGuidanceStrings.whyShownTitle[language],
                    whyShownReasons: guidance?.reasonLabels,
                    recommendedActionTitle:
                      discoveryGuidanceStrings.recommendedActionTitle[language],
                    recommendedActionLabel: guidance?.recommendedActionLabel,
                    hintMessages: guidance?.hintMessages,
                    compatibilityBadges: guidance?.compatibilityBadges,
                  }}
                  interactionGate={interactionGate}
                  secondaryActions={
                    <>
                      <Button
                        className="secondary"
                        onClick={() =>
                          setWhyShownProfileId((currentValue) =>
                            currentValue === profile.id ? null : profile.id
                          )
                        }
                      >
                        {whyShownLabel}
                      </Button>
                      <Button
                        className="secondary"
                        onClick={() => {
                          submitSafetyReport(
                            createSafetyReport({
                              modeId: mode.id,
                              targetType: 'profile',
                              targetId: profile.id,
                              reason: 'other',
                              range: 'full_conversation',
                              summary: formatTemplate(profileReportedTemplate, {
                                name: profile.name ?? profileLabel,
                              }),
                              excerpt: [],
                            })
                          );
                          showToast(reportSavedLabel);
                        }}
                      >
                        {reportLabel}
                      </Button>
                      <Button
                        className="secondary"
                        onClick={() => {
                          blockProfile(mode.id, profile.id);
                          showToast(blockedUserLabel);
                        }}
                      >
                        {blockLabel}
                      </Button>
                    </>
                  }
                  secondaryDetails={
                    whyShownProfileId === profile.id
                      ? profileGuidanceById
                          .get(profile.id)
                          ?.detailLines.map((line) => (
                            <Text
                              key={`${profile.id}-${line}`}
                              variant="body2"
                              color="text.secondary"
                            >
                              {line}
                            </Text>
                          ))
                      : null
                  }
                />
              </Box>
            </GridItem>
          );
        })}
      </Grid>
    );
  }

  function generateCommunities() {
    if (filteredGroups.length === 0) {
      return (
        <EmptyState
          title={strings.discovery[mode.id].noGroups[language]}
          message={noGroupsMessage}
          actionLabel={strings.common.clear[language]}
          onAction={resetFilters}
        />
      );
    }
    return (
      <Box className="discovery-groups-grid">
        <Grid spacing={4}>
          {pagedGroups.map((community) => (
            <GridItem xs={12} lg={6} key={community.id}>
              <GroupCard
                group={community}
                language={language}
                mode={mode}
                joined={joinedGroupIds.has(community.id)}
                onJoinToggle={toggleJoin}
                onViewDetails={viewDetails}
                strings={{
                  common: strings.common,
                  communityGuidance: communityGuidanceStrings,
                }}
                guidance={groupGuidanceById.get(community.id)}
                interactionGate={interactionGate}
                supplementalActions={
                  <>
                    <Button
                      className="secondary"
                      onClick={() => {
                        submitSafetyReport(
                          createSafetyReport({
                            modeId: mode.id,
                            targetType: 'group',
                            targetId: community.id,
                            reason: 'community_rule_violation',
                            range: 'full_conversation',
                            summary: formatTemplate(groupReportedTemplate, {
                              name: community.groupName,
                            }),
                            excerpt: [community.description].filter(
                              (value) => value.trim().length > 0
                            ),
                          })
                        );
                        showToast(reportSavedLabel);
                      }}
                    >
                      {reportLabel}
                    </Button>
                    <Button
                      className="secondary"
                      onClick={() => {
                        blockGroup(mode.id, community.id);
                        showToast(blockedGroupLabel);
                      }}
                    >
                      {blockLabel}
                    </Button>
                  </>
                }
              />
            </GridItem>
          ))}
        </Grid>
      </Box>
    );
  }

  const panels: PanelsType = [
    {
      panel: generateProfiles(),
      title: strings.discovery[mode.id].peopleButton[language],
    },
    {
      panel: generateCommunities(),
      title: strings.discovery[mode.id].groupsButton[language],
    },
  ];

  const hasMoreProfiles = filteredProfiles.length > pagedProfiles.length;
  const hasMoreGroups = filteredGroups.length > pagedGroups.length;
  const showLoadMore = tabIndex === 0 ? hasMoreProfiles : hasMoreGroups;
  const ctaLabel =
    ctaState?.type === 'like'
      ? strings.common.liked[language]
      : strings.common.messaged[language];
  const ctaActionLabel =
    ctaState?.type === 'message'
      ? strings.common.message[language]
      : strings.common.clear[language];

  return (
    <Container component="main" className={`who-main discovery ${mode.id}`}>
      {loading ? (
        <Spinner />
      ) : (
        <Box>
          {ctaState ? (
            <Card className="discovery-cta" sx={{ marginBottom: 2 }}>
              <CardContent>
                <Text role="status">{`${ctaLabel} ${ctaState.name}`}</Text>
              </CardContent>
              <CardActions>
                {ctaState.type === 'message' ? (
                  <Button
                    className="secondary"
                    onClick={() => {
                      setCtaState(null);
                      navigate('/messages');
                    }}
                  >
                    {ctaActionLabel}
                  </Button>
                ) : null}
                <Button className="secondary" onClick={() => setCtaState(null)}>
                  {strings.common.clear[language]}
                </Button>
              </CardActions>
            </Card>
          ) : null}
          <Collapse
            className="discovery-filter-collapse"
            title={filtersAndSortLabel}
            collapsedSize={0}
          >
            <DiscoveryFilterBar
              language={language}
              strings={strings.discovery[mode.id]}
              filters={filters}
              sortOption={sortOption}
              tagOptions={tagOptions}
              selectFilters={
                tabIndex === 0 ? peopleSelectFilters : groupSelectFilters
              }
              onFiltersChange={(next) =>
                setFilters((prev) => ({ ...prev, ...next }))
              }
              onSortChange={setSortOption}
            />
          </Collapse>
          <Tabs
            panels={panels}
            title="discovery-tabs"
            tabIndex={tabIndex}
            setTabIndex={setTabIndex}
          />
          {showLoadMore ? (
            <Button
              onClick={() =>
                tabIndex === 0
                  ? setPeoplePageIndex((prev) => prev + 1)
                  : setGroupsPageIndex((prev) => prev + 1)
              }
            >
              {strings.common.loadMore[language]}
            </Button>
          ) : null}
        </Box>
      )}
    </Container>
  );
}

export default Discovery;
