import { render, screen } from '@testing-library/react';
import PeopleCard from './PeopleCard';
import { datingProfileData } from '../../../../Utlilities/data';
import {
  blankDatingProfile,
  blankProfessionalProfile,
  fetchTranslations,
  User,
  UserContext,
} from '../../../../Utlilities';
import { READ_ONLY_DATA_ATTRIBUTE } from '../../Input/readOnlyStyles';
import type {
  InteractionGateType,
  ModeType,
  ProfileType,
} from '../../../../types';

const PROFILE_FIELD_PRIVACY_STORAGE_KEY = 'whoProfileFieldPrivacy';

/**
 * Seed the viewer profile in the matching mode bucket for a PeopleCard test.
 */
const setViewerProfileForMode = ({
  user,
  modeId,
  viewerProfile,
}: {
  user: User;
  modeId: ModeType['id'];
  viewerProfile: ProfileType;
}): void => {
  switch (modeId) {
    case 'friends':
      user.friends = viewerProfile as typeof user.friends;
      return;
    case 'dating':
      user.dating = viewerProfile as typeof user.dating;
      return;
    case 'academic':
      user.academic = viewerProfile as typeof user.academic;
      return;
    case 'professional':
      user.professional = viewerProfile as typeof user.professional;
      return;
    case 'neighborhood':
      user.neighborhood = viewerProfile as typeof user.neighborhood;
  }
};

/**
 * Render a PeopleCard with common props.
 */
const renderPeopleCard = ({
  profile = datingProfileData[0] as ProfileType,
  modeId = 'dating',
  discoveryMode = false,
  isConnection = false,
  viewerProfile,
  guidance,
  interactionGate,
}: {
  profile?: ProfileType;
  modeId?: ModeType['id'];
  discoveryMode?: boolean;
  isConnection?: boolean;
  viewerProfile?: ProfileType;
  guidance?: {
    whyShownTitle?: string;
    whyShownReasons?: string[];
    recommendedActionTitle?: string;
    recommendedActionLabel?: string;
    hintMessages?: string[];
    compatibilityBadges?: string[];
  };
  interactionGate?: InteractionGateType;
} = {}) => {
  const translations = fetchTranslations();
  const user = new User();
  if (viewerProfile) {
    setViewerProfileForMode({ user, modeId, viewerProfile });
  }

  return render(
    <UserContext.Provider
      value={{
        user,
        setUserProfile: jest.fn(),
        setUserGroupMemberships: jest.fn(),
        setUserSettings: jest.fn(),
      }}
    >
      <PeopleCard
        profile={profile}
        mode={{ id: modeId }}
        like={jest.fn()}
        message={jest.fn()}
        language="en"
        strings={{ profile: translations.profile, common: translations.common }}
        discoveryMode={discoveryMode}
        isConnection={isConnection}
        guidance={guidance}
        interactionGate={interactionGate}
      />
    </UserContext.Provider>
  );
};

describe('PeopleCard', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  test('renders readonly form fields', () => {
    renderPeopleCard();

    expect(
      document.querySelector(`[${READ_ONLY_DATA_ATTRIBUTE}="true"]`)
    ).toBeInTheDocument();
  });

  test('ignores viewer-local field privacy when viewing another profile in discovery mode', () => {
    window.localStorage.setItem(
      PROFILE_FIELD_PRIVACY_STORAGE_KEY,
      JSON.stringify({
        dating: {
          location: 'connections_only',
        },
      })
    );

    renderPeopleCard({ discoveryMode: true });

    expect(screen.getByDisplayValue('Portland, OR')).toBeInTheDocument();
  });

  test('hides connection-only persisted fields for non-connections in discovery mode', () => {
    renderPeopleCard({
      discoveryMode: true,
      profile: {
        ...datingProfileData[0],
        fieldVisibility: {
          location: 'connections_only',
        },
      } as ProfileType,
    });

    expect(screen.queryByDisplayValue('Portland, OR')).not.toBeInTheDocument();
    expect(
      screen.getByText('Some fields are hidden by privacy settings (1).')
    ).toBeInTheDocument();
  });

  test('shows verified-only persisted fields to verified viewers in discovery mode', () => {
    renderPeopleCard({
      discoveryMode: true,
      profile: {
        ...datingProfileData[0],
        fieldVisibility: {
          location: 'verified_only',
        },
      } as ProfileType,
      viewerProfile: {
        ...datingProfileData[1],
        id: 'verified-viewer',
        verificationTier: 'baseline_verified',
        restrictionState: 'active',
      },
    });

    expect(screen.getByDisplayValue('Portland, OR')).toBeInTheDocument();
    expect(
      screen.queryByText(/Some fields are hidden by privacy settings/i)
    ).not.toBeInTheDocument();
  });

  test('hides profile pictures when picture visibility is restricted in discovery mode', () => {
    const hiddenDefaultPictureProfile = {
      ...datingProfileData[0],
      name: 'Taylor',
      pictures: [
        'https://example.com/default-hidden.jpg',
        'https://example.com/open-gallery.jpg',
      ],
      profileVisibility: 'connections_only' as const,
      defaultPicture: 'https://example.com/default-hidden.jpg',
      pictureVisibility: {
        'https://example.com/open-gallery.jpg': 'open' as const,
      },
    };

    const { container } = renderPeopleCard({
      profile: hiddenDefaultPictureProfile,
      discoveryMode: true,
    });

    const previewImage = container.querySelector(
      '.profile-picture-preview'
    ) as HTMLImageElement | null;

    expect(screen.getByText('Profile')).toBeInTheDocument();
    expect(previewImage?.getAttribute('src')).toBe(
      'https://example.com/open-gallery.jpg'
    );
    expect(
      screen.getByText(/Some fields are hidden by privacy settings \(\d+\)\./i)
    ).toBeInTheDocument();
  });

  test('renders compact discovery guidance badges and next-step messaging', () => {
    renderPeopleCard({
      discoveryMode: true,
      guidance: {
        whyShownTitle: 'Why shown',
        whyShownReasons: ['Shared interests', 'Compatible dating pace'],
        recommendedActionTitle: 'Best next step',
        recommendedActionLabel: 'Start with shared context',
        hintMessages: [
          'Shared context may help this first contact feel more natural.',
        ],
        compatibilityBadges: ['Group first', 'Low pressure'],
      },
    });

    expect(screen.getByText('Group first')).toBeInTheDocument();
    expect(screen.getByText('Low pressure')).toBeInTheDocument();
    expect(
      screen.getByText('Why shown: Shared interests • Compatible dating pace')
    ).toBeInTheDocument();
    expect(
      screen.getByText('Best next step: Start with shared context')
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'Shared context may help this first contact feel more natural.'
      )
    ).toBeInTheDocument();
  });

  test('disables discovery actions when the activation interaction gate is locked', () => {
    renderPeopleCard({
      discoveryMode: true,
      interactionGate: {
        isLocked: true,
        message: 'Complete your profile to interact with people and groups.',
      },
    });

    expect(
      screen.getByText(/Complete your profile to interact/i)
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Like' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Message' })).toBeDisabled();
  });

  test('renders dating profiles even when social nested sections are missing', () => {
    expect(() =>
      renderPeopleCard({
        modeId: 'dating',
        profile: {
          ...blankDatingProfile,
          name: 'Taylor',
          main: {
            ...blankDatingProfile.main,
            age: 29,
            location: 'Portland',
            pronouns: 'they/them',
            seeking: ['dating'],
          },
          demographics: undefined,
          preferences: undefined,
          homeLife: undefined,
          hobbies: undefined,
          prompts: undefined,
        } as unknown as ProfileType,
      })
    ).not.toThrow();

    expect(screen.getByText('Taylor')).toBeInTheDocument();
  });

  test('renders professional profiles even when nested career sections are missing', () => {
    expect(() =>
      renderPeopleCard({
        modeId: 'professional',
        profile: {
          ...blankProfessionalProfile,
          name: 'Jordan',
          main: {
            ...blankProfessionalProfile.main,
            location: 'Portland',
            pronouns: 'they/them',
            seeking: ['networking'],
            tagline: 'Building thoughtful teams.',
          },
          about: undefined,
          highlights: undefined,
          education: undefined,
          jobHistory: undefined,
          conferences: undefined,
          professionalMemberships: undefined,
        } as unknown as ProfileType,
      })
    ).not.toThrow();

    expect(screen.getByText('Jordan')).toBeInTheDocument();
  });
});
