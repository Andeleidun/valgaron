import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Discovery from './Discovery';
import { ToastProvider } from '../../Common';
import {
  buildDefaultRelationshipState,
  fetchTranslations,
  modes,
  RelationshipProvider,
  returnStringOrValue,
  User,
  UserContext,
} from '../../../Utlilities';
import { useAuth } from '../../../Utlilities/auth/AuthContext';
import {
  datingProfileData,
  neighborhoodProfileData,
} from '../../../Utlilities/data';
import type {
  GroupType,
  ModeType,
  RelationshipStateType,
} from '../../../types';
import { fetchProfileDataAsync } from './DiscoveryHelper';

jest.mock('./DiscoveryHelper', () => ({
  ...jest.requireActual('./DiscoveryHelper'),
  fetchProfileDataAsync: jest.fn(),
}));
jest.mock('../../../Utlilities/auth/AuthContext', () => ({
  useAuth: jest.fn(),
}));

const mockedFetchProfileDataAsync =
  fetchProfileDataAsync as jest.MockedFunction<typeof fetchProfileDataAsync>;
const mockedUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const translations = fetchTranslations();

/**
 * Build a complete test group object with defaults.
 */
const buildGroup = (
  group: Pick<GroupType, 'id' | 'groupName' | 'mode'>
): GroupType => ({
  id: group.id,
  groupName: group.groupName,
  groupPicture: '',
  description: `${group.groupName} description`,
  category: 'general',
  location: 'Portland, OR',
  groupType: 'public',
  interests: [],
  rules: '',
  tags: [],
  starredTags: [],
  admins: [],
  members: [],
  createdAt: '2026-01-01T00:00:00.000Z',
  chatRooms: [],
  mode: group.mode,
});

/**
 * Clear seeded relationship ids so discovery mode tests control visibility.
 */
const clearSeededModeState = (
  state: RelationshipStateType,
  modeId: ModeType['id']
): void => {
  state.byMode[modeId] = {
    ...state.byMode[modeId],
    connectionIds: [],
    outgoingConnectionRequestIds: [],
    incomingConnectionRequestIds: [],
    incomingInterestIds: [],
    declinedProfileIds: [],
    blockedProfileIds: [],
    blockedGroupIds: [],
  };
};

/**
 * Build deterministic relationship state for discovery mode tests.
 */
const buildRelationshipState = (): RelationshipStateType => {
  const state = buildDefaultRelationshipState();
  clearSeededModeState(state, 'friends');
  clearSeededModeState(state, 'dating');
  clearSeededModeState(state, 'academic');
  clearSeededModeState(state, 'professional');
  clearSeededModeState(state, 'neighborhood');
  state.byMode.friends = {
    ...state.byMode.friends,
    groups: [
      buildGroup({
        id: 'friends-mode-discovery-group',
        groupName: 'Friends Discovery Circle',
        mode: 'friends',
      }),
    ],
  };
  state.byMode.dating = {
    ...state.byMode.dating,
    groups: [
      buildGroup({
        id: 'dating-mode-discovery-group',
        groupName: 'Dating Discovery Circle',
        mode: 'dating',
      }),
    ],
  };
  return state;
};

const initialRelationshipState = buildRelationshipState();

/**
 * Resolve the interactive filter combobox when card fields share a label.
 */
const getInteractiveCombobox = (label: string): HTMLElement => {
  const combobox = screen
    .getAllByRole('combobox', { name: label })
    .find(
      (element) =>
        element.getAttribute('aria-haspopup') === 'listbox' &&
        !element.hasAttribute('disabled') &&
        !element.hasAttribute('readonly')
    );

  if (!(combobox instanceof HTMLElement)) {
    throw new Error(`Expected interactive combobox labeled "${label}".`);
  }

  return combobox;
};

/**
 * Choose an option from a labeled MUI select in discovery.
 */
const chooseSelectOption = async (
  label: string,
  optionName: string
): Promise<void> => {
  fireEvent.mouseDown(getInteractiveCombobox(label));
  fireEvent.click(await screen.findByRole('option', { name: optionName }));
};

/**
 * Build the Discovery tree with the required providers for the indicated mode.
 */
const discoveryTree = (mode: ModeType, user = new User()) => {
  return (
    <MemoryRouter
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <ToastProvider>
        <RelationshipProvider initialState={initialRelationshipState}>
          <UserContext.Provider
            value={{
              user,
              setUserProfile: jest.fn(),
              setUserGroupMemberships: jest.fn(),
              setUserSettings: jest.fn(),
            }}
          >
            <Discovery
              mode={mode}
              language="en"
              strings={{
                discovery: translations.discovery,
                profile: translations.profile,
                common: translations.common,
                connectionStyle: translations.connectionStyle,
                discoveryGuidance: translations.discoveryGuidance,
                communityGuidance: translations.communityGuidance,
              }}
            />
          </UserContext.Provider>
        </RelationshipProvider>
      </ToastProvider>
    </MemoryRouter>
  );
};

describe('Discovery modes', () => {
  beforeEach(() => {
    mockedFetchProfileDataAsync.mockResolvedValue([]);
    mockedUseAuth.mockReset();
    mockedUseAuth.mockReturnValue({
      status: 'signed_in',
      user: { uid: 'discovery-mode-user', email: 'discovery@example.com' },
      error: null,
      signIn: jest.fn(async () => undefined),
      signUp: jest.fn(async () => undefined),
      signOut: jest.fn(async () => undefined),
    });
  });

  test.each([
    'dating',
    'friends',
    'neighborhood',
    'academic',
    'professional',
  ] as const)('renders tabs for %s mode', async (modeId) => {
    const mode = modes.find((item) => item.id === modeId) ?? { id: modeId };
    render(discoveryTree(mode));

    expect(
      await screen.findByRole('tab', {
        name: translations.discovery[modeId].peopleButton.en,
      })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('tab', {
        name: translations.discovery[modeId].groupsButton.en,
      })
    ).toBeInTheDocument();
  });

  test('switching modes updates filters, labels, and canonical groups consistently', async () => {
    const friendsMode = modes.find((item) => item.id === 'friends') ?? {
      id: 'friends',
    };
    const datingMode = modes.find((item) => item.id === 'dating') ?? {
      id: 'dating',
    };

    const { rerender } = render(discoveryTree(friendsMode));

    expect(
      await screen.findByLabelText(
        translations.discovery.friends.modeSpecificLabel.en
      )
    ).toBeInTheDocument();
    expect(
      screen.getByRole('combobox', {
        name: translations.connectionStyle.friends.availabilityPattern.title.en,
      })
    ).toBeInTheDocument();

    fireEvent.click(
      await screen.findByRole('tab', {
        name: translations.discovery.friends.groupsButton.en,
      })
    );
    expect(
      await screen.findByText('Friends Discovery Circle')
    ).toBeInTheDocument();

    rerender(discoveryTree(datingMode));

    expect(
      await screen.findByLabelText(
        translations.discovery.dating.modeSpecificLabel.en
      )
    ).toBeInTheDocument();
    fireEvent.click(
      await screen.findByRole('tab', {
        name: translations.discovery.dating.peopleButton.en,
      })
    );
    expect(
      screen.getByRole('combobox', {
        name: translations.connectionStyle.dating.availabilityPattern.title.en,
      })
    ).toBeInTheDocument();

    fireEvent.click(
      await screen.findByRole('tab', {
        name: translations.discovery.dating.groupsButton.en,
      })
    );
    expect(
      await screen.findByText('Dating Discovery Circle')
    ).toBeInTheDocument();
  });

  test('switching to neighborhood clears stale people filters so profiles remain visible', async () => {
    const datingMode = modes.find((item) => item.id === 'dating') ?? {
      id: 'dating',
    };
    const neighborhoodMode = modes.find(
      (item) => item.id === 'neighborhood'
    ) ?? {
      id: 'neighborhood',
    };
    const datingProfile = datingProfileData[0];
    const neighborhoodProfile = neighborhoodProfileData[1];
    const datingFilterValue = returnStringOrValue(
      'en',
      datingProfile.main.seeking[0]
    );
    const user = new User();

    user.dating = {
      ...datingProfileData[1],
      id: 'dating-mode-viewer',
      name: 'Dating Mode Viewer',
    } as User['dating'];
    user.neighborhood = {
      ...neighborhoodProfileData[0],
      id: 'neighborhood-mode-viewer',
      name: 'Neighborhood Mode Viewer',
    } as User['neighborhood'];

    mockedFetchProfileDataAsync.mockImplementation(async (mode) => {
      if (mode.id === 'dating') {
        return [datingProfile];
      }

      if (mode.id === 'neighborhood') {
        return [neighborhoodProfile];
      }

      return [];
    });

    const { rerender } = render(discoveryTree(datingMode, user));

    expect(await screen.findByText(datingProfile.name)).toBeInTheDocument();

    await chooseSelectOption(
      translations.discovery.dating.modeSpecificLabel.en,
      datingFilterValue
    );

    rerender(discoveryTree(neighborhoodMode, user));

    expect(
      await screen.findByText(neighborhoodProfile.name)
    ).toBeInTheDocument();
    expect(
      screen.queryByText(translations.discovery.neighborhood.noProfiles.en)
    ).not.toBeInTheDocument();
  });
});
