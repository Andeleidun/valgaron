import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type {
  RelationshipStateType,
  SafetyReportType,
} from '../../../../types';
import * as dataModule from '../../../../Utlilities/data';
import DashboardSettings from '../DashboardSettings';
import {
  buildDefaultRelationshipState,
  fetchTranslations,
  RelationshipProvider,
  User,
  UserContext,
} from '../../../../Utlilities';
import { getProfilesForMode } from '../../../../Utlilities/data';
import { blankDatingProfile } from '../../../../Utlilities/models';

const translations = fetchTranslations();
const datingTrustProfile = getProfilesForMode('dating')[0];

if (!datingTrustProfile) {
  throw new Error('Expected at least one seeded dating profile for tests.');
}

/**
 * Render the dashboard settings workspace with a controlled user context.
 */
const renderDashboardSettings = (
  options: {
    relationshipState?: RelationshipStateType;
    user?: User;
  } = {}
) => {
  const {
    relationshipState = buildDefaultRelationshipState(),
    user = new User(),
  } = options;
  const hasCustomUser = typeof options.user !== 'undefined';
  const setUserSettings = jest.fn();
  const setUserProfile = jest.fn();

  user.userSettings = {
    ...user.userSettings,
    mode: { id: 'dating' },
    language: 'es',
    darkMode: 'dark',
    freshnessPrompts: 'medium',
  };
  const existingDatingProfile = user.dating;
  user.dating = {
    ...blankDatingProfile,
    ...existingDatingProfile,
    profileVisibility: 'connections_only',
    messagingPrivacy:
      existingDatingProfile?.messagingPrivacy ?? 'connections_only',
    connectionStyle: {
      availabilityPattern: 'weekends',
      communicationPace: 'balanced',
      introductionPreference: 'group_first',
      planningStyle: 'plan_ahead',
      ...existingDatingProfile?.connectionStyle,
      languageComfort: {
        ...existingDatingProfile?.connectionStyle?.languageComfort,
        preferredLanguages: hasCustomUser
          ? existingDatingProfile?.connectionStyle?.languageComfort
              ?.preferredLanguages ?? []
          : ['en'],
      },
    },
  };

  render(
    <MemoryRouter
      initialEntries={['/dashboard/settings']}
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <RelationshipProvider initialState={relationshipState}>
        <UserContext.Provider
          value={{
            user,
            setUserProfile,
            setUserGroupMemberships: jest.fn(),
            setUserSettings,
          }}
        >
          <DashboardSettings
            mode={{ id: 'dating' }}
            language="en"
            strings={{
              dashboard: translations.dashboard,
              dashboardGuidance: translations.dashboardGuidance,
              common: translations.common,
              connectionStyle: translations.connectionStyle,
            }}
          />
        </UserContext.Provider>
      </RelationshipProvider>
    </MemoryRouter>
  );

  return { setUserProfile, setUserSettings };
};

/**
 * Seed active-mode trust fixtures used by dashboard settings regressions.
 */
const buildTrustState = (): {
  relationshipState: RelationshipStateType;
  blockedGroupName: string;
} => {
  const relationshipState = buildDefaultRelationshipState();
  const blockedGroup = relationshipState.byMode.dating.groups[0];

  if (!blockedGroup) {
    throw new Error('Expected at least one seeded dating group for tests.');
  }

  const report: SafetyReportType = {
    id: 'report-dashboard-settings-1',
    modeId: 'dating',
    targetType: 'conversation',
    targetId: datingTrustProfile.id,
    reason: 'harassment',
    range: 'last_5_messages',
    summary: 'Repeated insults in a direct conversation.',
    excerpt: ['Please leave me alone.'],
    createdAt: '2026-04-17T12:00:00.000Z',
  };

  return {
    relationshipState: {
      ...relationshipState,
      byMode: {
        ...relationshipState.byMode,
        dating: {
          ...relationshipState.byMode.dating,
          blockedProfileIds: [datingTrustProfile.id],
          blockedGroupIds: [blockedGroup.id],
        },
      },
      safetyReports: [report],
    },
    blockedGroupName: blockedGroup.groupName,
  };
};

describe('DashboardSettings', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('renders the settings workspace sections', () => {
    renderDashboardSettings();

    expect(
      screen.getByRole('heading', { name: 'Settings' })
    ).toBeInTheDocument();
    expect(
      screen.getByText(translations.dashboard.settings.languageLabel.en)
    ).toBeInTheDocument();
    expect(
      screen.getByText(translations.dashboard.settings.darkModeLabel.en)
    ).toBeInTheDocument();
    expect(
      screen.getByText(translations.dashboard.settings.messagingPrivacyLabel.en)
    ).toBeInTheDocument();
    expect(
      screen.getByText(translations.dashboard.settings.freshnessPromptsLabel.en)
    ).toBeInTheDocument();
    expect(
      screen.getByText(translations.connectionStyle.common.sectionTitle.en)
    ).toBeInTheDocument();
    expect(
      screen.getByText('Visibility: Connections only')
    ).toBeInTheDocument();
    expect(
      screen.getByText(translations.dashboard.settings.trustSafetyLabel.en)
    ).toBeInTheDocument();
    expect(screen.getByText('Availability: Weekends')).toBeInTheDocument();
    expect(
      screen.getByText('Communication pace: Balanced')
    ).toBeInTheDocument();
    expect(
      screen.getByText('Introduction preference: Group first')
    ).toBeInTheDocument();
    expect(screen.getByText('Planning style: Plan ahead')).toBeInTheDocument();
    expect(screen.getByText('Language comfort: EN')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'DE' })).toBeInTheDocument();
  });

  test('updates settings through the expected partial payloads', () => {
    const { setUserProfile, setUserSettings } = renderDashboardSettings();

    fireEvent.click(screen.getByRole('button', { name: 'DE' }));
    fireEvent.click(
      screen.getByRole('button', {
        name: translations.dashboard.settings.darkModeOff.en,
      })
    );
    fireEvent.click(
      screen.getByRole('button', {
        name: translations.dashboard.settings.messagingPrivacyOpen.en,
      })
    );
    fireEvent.click(
      screen.getByRole('button', {
        name: translations.dashboard.settings.freshnessHigh.en,
      })
    );

    expect(setUserSettings).toHaveBeenNthCalledWith(1, { language: 'de' });
    expect(setUserSettings).toHaveBeenNthCalledWith(2, {
      darkMode: 'light',
    });
    expect(setUserProfile).toHaveBeenCalledWith(
      expect.objectContaining({
        messagingPrivacy: 'open_intro',
      }),
      expect.objectContaining({ id: 'dating' })
    );
    expect(setUserSettings).toHaveBeenNthCalledWith(3, {
      freshnessPrompts: 'high',
    });
  });

  test('surfaces blocked entities and recent reports with unblock controls', async () => {
    const { relationshipState, blockedGroupName } = buildTrustState();

    renderDashboardSettings({ relationshipState });

    expect(screen.getByText(datingTrustProfile.name)).toBeInTheDocument();
    expect(screen.getByText(blockedGroupName)).toBeInTheDocument();
    expect(
      screen.getByText(`Conversation report: ${datingTrustProfile.name}`)
    ).toBeInTheDocument();
    expect(
      screen.getByText('Repeated insults in a direct conversation.')
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole('button', {
        name: translations.dashboard.settings.unblockProfileAction.en,
      })
    );
    fireEvent.click(
      screen.getByRole('button', {
        name: translations.dashboard.settings.unblockGroupAction.en,
      })
    );

    await waitFor(() => {
      expect(
        screen.getByText(translations.dashboard.settings.noBlockedProfiles.en)
      ).toBeInTheDocument();
      expect(
        screen.getByText(translations.dashboard.settings.noBlockedGroups.en)
      ).toBeInTheDocument();
    });
  });

  test('keeps boolean-only language comfort selections visible in the connection-style summary', () => {
    const user = new User();
    user.dating = {
      ...blankDatingProfile,
      connectionStyle: {
        languageComfort: {
          preferredLanguages: [],
          multilingualWelcome: true,
        },
      },
    };

    renderDashboardSettings({ user });

    expect(
      screen.getByText('Language comfort: Multilingual welcome')
    ).toBeInTheDocument();
    expect(
      screen.queryByText(
        translations.dashboardGuidance.dating.compatibilityPromptMessages
          .complete_connection_style.en
      )
    ).not.toBeInTheDocument();
  });

  test('does not reveal hidden profile names in blocked rows or safety reports', () => {
    const hiddenNameProfile = {
      ...datingTrustProfile,
      name: 'Private Casey',
      profileVisibility: 'connections_only' as const,
    };
    const seededProfiles = getProfilesForMode('dating');
    jest
      .spyOn(dataModule, 'getProfilesForMode')
      .mockReturnValue([
        hiddenNameProfile,
        ...seededProfiles.filter(
          (profile) => profile.id !== hiddenNameProfile.id
        ),
      ]);

    const relationshipState = buildDefaultRelationshipState();
    const fallbackLabel = `Unknown profile (${hiddenNameProfile.id})`;
    const hiddenNameReport: SafetyReportType = {
      id: 'report-dashboard-settings-hidden-name',
      modeId: 'dating',
      targetType: 'conversation',
      targetId: hiddenNameProfile.id,
      reason: 'harassment',
      range: 'last_5_messages',
      summary: 'Escalated for repeated unwanted contact.',
      excerpt: ['Please stop contacting me.'],
      createdAt: '2026-04-18T09:00:00.000Z',
    };

    renderDashboardSettings({
      relationshipState: {
        ...relationshipState,
        byMode: {
          ...relationshipState.byMode,
          dating: {
            ...relationshipState.byMode.dating,
            connectionIds: [],
            blockedProfileIds: [hiddenNameProfile.id],
          },
        },
        safetyReports: [hiddenNameReport],
      },
    });

    expect(screen.getByText(fallbackLabel)).toBeInTheDocument();
    expect(
      screen.getByText(`Conversation report: ${fallbackLabel}`)
    ).toBeInTheDocument();
    expect(screen.queryByText(hiddenNameProfile.name)).not.toBeInTheDocument();
  });
});
