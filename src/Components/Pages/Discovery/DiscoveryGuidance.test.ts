import {
  buildConnectionStyleBadgeLabels,
  buildGroupDiscoveryGuidance,
  buildProfileDiscoveryGuidance,
  profileMatchesCompatibilityFilters,
} from './DiscoveryGuidance';
import { blankDatingProfile, fetchTranslations } from '../../../Utlilities';
import { datingProfileData } from '../../../Utlilities/data';
import type { GroupType, ProfileType } from '../../../types';

const translations = fetchTranslations();

/**
 * Build a minimal group fixture for discovery-guidance tests.
 */
const buildGroup = (overrides: Partial<GroupType> = {}): GroupType => ({
  id: 'group-1',
  groupName: 'Intentional Dating Circle',
  groupPicture: '',
  description: 'Small group for low-pressure dating introductions.',
  category: 'dating',
  location: 'Portland, OR',
  groupType: 'public',
  interests: ['hiking'],
  rules: 'Respect pacing and boundaries.',
  tags: ['hiking', 'intentional'],
  starredTags: [],
  admins: ['host-1'],
  members: [
    {
      groupId: 'group-1',
      userId: 'host-1',
      userName: 'Host Name',
      joinedAt: '2026-01-01T00:00:00.000Z',
    },
  ],
  createdAt: '2026-01-01T00:00:00.000Z',
  chatRooms: [],
  mode: 'dating',
  events: [
    {
      id: 'event-1',
      title: 'Coffee walk',
      description: 'Meet and walk.',
      location: 'Portland, OR',
      startsAt: '2026-02-01T00:00:00.000Z',
      createdBy: 'host-1',
      attendance: {
        going: [],
        interested: [],
        cant_make_it: [],
      },
    },
  ],
  ...overrides,
});

describe('DiscoveryGuidance', () => {
  test('resolves compact connection-style badges from profile settings', () => {
    const viewerProfile: ProfileType = {
      ...blankDatingProfile,
      id: 'viewer-badge-profile',
      name: 'Viewer Badge Profile',
    };
    const profile: ProfileType = {
      ...blankDatingProfile,
      id: 'badge-profile',
      profileVisibility: 'open',
      fieldVisibility: {},
      connectionStyle: {
        availabilityPattern: 'weekends',
        communicationPace: 'low_pressure',
        introductionPreference: 'group_first',
        planningStyle: 'plan_ahead',
        languageComfort: {
          preferredLanguages: ['en'],
          multilingualWelcome: true,
        },
      },
    };
    const labels = buildConnectionStyleBadgeLabels({
      profile,
      viewer: viewerProfile,
      isConnection: false,
      strings: translations.connectionStyle.dating,
      language: 'en',
    });

    expect(labels).toEqual(
      expect.arrayContaining([
        'Group first',
        'Low pressure',
        'Multilingual',
        'Plans ahead',
      ])
    );
  });

  test('omits hidden connection-style badges for non-connections', () => {
    const viewerProfile: ProfileType = {
      ...datingProfileData[2],
      id: 'viewer-hidden-badge-profile',
      name: 'Viewer Hidden Badge Profile',
      verificationTier: 'baseline_verified',
    };
    const profile: ProfileType = {
      ...datingProfileData[0],
      id: 'hidden-badge-profile',
      fieldVisibility: {
        ...datingProfileData[0].fieldVisibility,
        connectionIntroductionPreference: 'connections_only',
        connectionCommunicationPace: 'connections_only',
        connectionLanguageComfort: 'connections_only',
        connectionPlanningStyle: 'connections_only',
      },
      connectionStyle: {
        availabilityPattern: 'weekends',
        communicationPace: 'low_pressure',
        introductionPreference: 'group_first',
        planningStyle: 'plan_ahead',
        languageComfort: {
          preferredLanguages: ['en'],
          multilingualWelcome: true,
        },
      },
    };

    expect(
      buildConnectionStyleBadgeLabels({
        profile,
        viewer: viewerProfile,
        isConnection: false,
        strings: translations.connectionStyle.dating,
        language: 'en',
      })
    ).toEqual([]);
  });

  test('matches compatibility filters against stored connection-style fields', () => {
    const viewerProfile: ProfileType = {
      ...blankDatingProfile,
      id: 'viewer-compatibility',
      name: 'Viewer Compatibility',
    };
    const profile: ProfileType = {
      ...blankDatingProfile,
      profileVisibility: 'open',
      fieldVisibility: {},
      connectionStyle: {
        availabilityPattern: 'weekends',
        communicationPace: 'balanced',
        introductionPreference: 'direct_intro_ok',
        planningStyle: 'plan_ahead',
        languageComfort: {
          preferredLanguages: ['en'],
          simpleEnglishOk: true,
        },
      },
    };

    expect(
      profileMatchesCompatibilityFilters(
        profile,
        {
          availabilityPattern: 'weekends',
          communicationPace: '',
          introductionPreference: '',
          languageComfort: 'simple_english_ok',
          planningStyle: 'plan_ahead',
        },
        {
          viewer: viewerProfile,
          isConnection: false,
          language: 'en',
        }
      )
    ).toBe(true);
    expect(
      profileMatchesCompatibilityFilters(
        profile,
        {
          availabilityPattern: '',
          communicationPace: 'low_pressure',
          introductionPreference: '',
          languageComfort: '',
          planningStyle: '',
        },
        {
          viewer: viewerProfile,
          isConnection: false,
          language: 'en',
        }
      )
    ).toBe(false);
  });

  test('does not match hidden connection-style filters for non-connections', () => {
    const viewerProfile: ProfileType = {
      ...datingProfileData[2],
      id: 'viewer-hidden-compatibility',
      name: 'Viewer Hidden Compatibility',
      verificationTier: 'baseline_verified',
    };
    const profile: ProfileType = {
      ...datingProfileData[0],
      id: 'hidden-compatibility-profile',
      fieldVisibility: {
        ...datingProfileData[0].fieldVisibility,
        connectionAvailabilityPattern: 'connections_only',
        connectionLanguageComfort: 'connections_only',
      },
      connectionStyle: {
        availabilityPattern: 'weekends',
        communicationPace: 'balanced',
        introductionPreference: 'direct_intro_ok',
        planningStyle: 'plan_ahead',
        languageComfort: {
          preferredLanguages: ['en'],
          simpleEnglishOk: true,
        },
      },
    };

    expect(
      profileMatchesCompatibilityFilters(
        profile,
        {
          availabilityPattern: 'weekends',
          communicationPace: '',
          introductionPreference: '',
          languageComfort: 'simple_english_ok',
          planningStyle: '',
        },
        {
          viewer: viewerProfile,
          isConnection: false,
          language: 'en',
        }
      )
    ).toBe(false);
  });

  test('does not interpolate hidden hobbies or location into why-shown details', () => {
    const hiddenLocation = 'Private Harbor';
    const viewerProfile: ProfileType = {
      ...datingProfileData[0],
      id: 'viewer-hidden-rationale',
      name: 'Viewer Hidden Rationale',
      hobbies: {
        ...datingProfileData[0].hobbies,
        full: ['hiking'],
      },
      main: {
        ...datingProfileData[0].main,
        location: hiddenLocation,
      },
    };
    const candidateProfile: ProfileType = {
      ...datingProfileData[1],
      id: 'candidate-hidden-rationale',
      name: 'Candidate Hidden Rationale',
      hobbies: {
        ...datingProfileData[1].hobbies,
        full: ['hiking'],
      },
      main: {
        ...datingProfileData[1].main,
        location: hiddenLocation,
      },
      fieldVisibility: {
        ...datingProfileData[1].fieldVisibility,
        fullHobbies: 'connections_only',
        location: 'connections_only',
      },
    };

    const guidance = buildProfileDiscoveryGuidance({
      mode: { id: 'dating' },
      profile: candidateProfile,
      viewerProfile,
      viewer: viewerProfile,
      isConnection: false,
      groups: [],
      joinedGroupIds: new Set<string>(),
      language: 'en',
      commonStrings: translations.common,
      connectionStyleStrings: translations.connectionStyle.dating,
      discoveryGuidanceStrings: translations.discoveryGuidance.dating,
      canSendIntro: false,
      canRequestConnection: false,
      hasIncomingInterest: false,
      hasOutgoingRequest: false,
    });

    expect(guidance.reasonLabels).not.toContain('Shared interests');
    expect(guidance.reasonLabels).not.toContain('Helpful location overlap');
    expect(guidance.detailLines.join(' ')).not.toContain('hiking');
    expect(guidance.detailLines.join(' ')).not.toContain(hiddenLocation);
  });

  test('recommends community-first discovery when profile fit and community context align', () => {
    const viewerProfile: ProfileType = {
      ...datingProfileData[0],
      id: 'viewer-1',
      name: 'Viewer',
      hobbies: {
        ...datingProfileData[0].hobbies,
        full: ['hiking'],
      },
      connectionStyle: {
        availabilityPattern: 'weekends',
        communicationPace: 'low_pressure',
        introductionPreference: 'group_first',
        planningStyle: 'plan_ahead',
        languageComfort: {
          preferredLanguages: ['en'],
          multilingualWelcome: true,
        },
      },
    };
    const candidateProfile: ProfileType = {
      ...datingProfileData[1],
      id: 'candidate-1',
      name: 'Candidate',
      main: {
        ...datingProfileData[1].main,
        location: 'Portland, OR',
      },
      hobbies: {
        ...datingProfileData[1].hobbies,
        full: ['hiking'],
      },
      connectionStyle: {
        availabilityPattern: 'weekends',
        communicationPace: 'low_pressure',
        introductionPreference: 'group_first',
        planningStyle: 'plan_ahead',
        languageComfort: {
          preferredLanguages: ['en'],
          multilingualWelcome: true,
        },
      },
    };

    const guidance = buildProfileDiscoveryGuidance({
      mode: { id: 'dating' },
      profile: candidateProfile,
      viewerProfile,
      viewer: viewerProfile,
      isConnection: false,
      groups: [buildGroup()],
      joinedGroupIds: new Set<string>(),
      language: 'en',
      commonStrings: translations.common,
      connectionStyleStrings: translations.connectionStyle.dating,
      discoveryGuidanceStrings: translations.discoveryGuidance.dating,
      canSendIntro: true,
      canRequestConnection: true,
      hasIncomingInterest: true,
      hasOutgoingRequest: false,
    });

    expect(guidance.rationale.recommendedNextAction).toBe(
      'join_community_first'
    );
    expect(guidance.recommendedActionLabel).toBe('Start with shared context');
    expect(guidance.reasonLabels).toEqual(
      expect.arrayContaining([
        'Shared interests',
        'Compatible dating pace',
        'Useful shared context',
      ])
    );
    expect(guidance.detailLines).toEqual(
      expect.arrayContaining([
        'They already signaled interest, so this is a high-confidence next step.',
        'Shared interests: hiking.',
      ])
    );
    expect(guidance.hintMessages).toContain(
      'Shared context may help this first contact feel more natural.'
    );
  });

  test('builds community guidance with rationale, organizer, norms, and activity cues', () => {
    const viewerProfile: ProfileType = {
      ...datingProfileData[0],
      id: 'viewer-2',
      name: 'Viewer',
      hobbies: {
        ...datingProfileData[0].hobbies,
        full: ['hiking'],
      },
      main: {
        ...datingProfileData[0].main,
        location: 'Portland, OR',
      },
    };

    const guidance = buildGroupDiscoveryGuidance({
      mode: { id: 'dating' },
      group: buildGroup(),
      viewerProfile,
      language: 'en',
      commonStrings: translations.common,
      discoveryGuidanceStrings: translations.discoveryGuidance.dating,
      communityGuidanceStrings: translations.communityGuidance.dating,
    });

    expect(guidance.whyJoinReasons).toEqual(
      expect.arrayContaining(['Shared interests', 'Helpful location overlap'])
    );
    expect(guidance.whyJoinRecommendation).toBe(
      'Shared context may improve dating trust here.'
    );
    expect(guidance.organizerCue).toBe('Host Name');
    expect(guidance.normsCue).toBe('Respect pacing and boundaries.');
    expect(guidance.activityCue).toBe('Coffee walk');
  });
});
