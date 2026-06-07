import { useContext, useMemo } from 'react';
import type {
  CommonStringsType,
  ConnectionStyleType,
  ConnectionStyleStringsType,
  DashboardGuidanceStringsType,
  DashboardStringsType,
  FreshnessPromptLevelType,
  MessagingPrivacyLevelType,
  ModeType,
  MultiOptionsType,
  ProfileFieldPrivacyLevelType,
  UserType,
} from '../../../types';
import {
  returnStringOrValue,
  resolveVisibleProfileFieldValue,
  UserContext,
  useRelationship,
} from '../../../Utlilities';
import { languages } from '../../../Utlilities/config';
import { getProfilesForMode } from '../../../Utlilities/data';
import { Button, Grid, GridItem, Text } from '../../';
import { resolveDashboardStringGroups } from './dashboardFallbacks';
import DashboardSectionCard from './DashboardSectionCard';
import DashboardShell from './DashboardShell';

type DashboardSettingsProps = {
  mode: ModeType;
  strings: {
    dashboard: DashboardStringsType;
    dashboardGuidance?: DashboardGuidanceStringsType;
    common: CommonStringsType;
    connectionStyle?: ConnectionStyleStringsType;
  };
  language: string;
};

/**
 * Replace lightweight `{{token}}` placeholders in dashboard copy.
 */
const formatTemplate = (
  template: string,
  replacements: Record<string, string>
): string =>
  Object.entries(replacements).reduce(
    (value, [key, replacement]) => value.replaceAll(`{{${key}}}`, replacement),
    template
  );

/**
 * Preserve a readable fallback label when a blocked entity can no longer be resolved.
 */
const buildFallbackEntityLabel = (label: string, id: string): string =>
  `${label} (${id})`;

/**
 * Convert a persisted timestamp into a stable numeric value for sorting.
 */
const toTimestamp = (timestamp: Date | string): number => {
  const parsed = new Date(timestamp).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
};

/**
 * Format persisted safety-report timestamps for the settings workspace.
 */
const formatReportTimestamp = (
  timestamp: Date | string,
  language: string
): string => {
  const parsed = new Date(timestamp);
  if (Number.isNaN(parsed.getTime())) {
    return '';
  }
  return new Intl.DateTimeFormat(language, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(parsed);
};

const resolveVisibilityLabel = ({
  commonStrings,
  language,
  visibility,
}: {
  commonStrings: CommonStringsType;
  language: string;
  visibility: ProfileFieldPrivacyLevelType | undefined;
}): string => {
  if (visibility === 'connections_only') {
    return commonStrings.privacyConnectionsOnly[language];
  }
  if (visibility === 'verified_only') {
    return commonStrings.privacyVerifiedOnly[language];
  }
  return commonStrings.privacyOpen[language];
};

/**
 * Resolve one stored connection-style option value into the localized label the
 * user originally selected in onboarding/profile forms.
 */
const resolveConnectionStyleOptionLabel = ({
  options,
  value,
  language,
}: {
  options: MultiOptionsType | undefined;
  value: string;
  language: string;
}): string =>
  returnStringOrValue(
    language,
    options?.find((option) => option.value === value)?.label ?? value
  );

/**
 * Build the localized dashboard summary row for saved language-comfort
 * selections.
 */
const buildLanguageComfortSummaryRow = ({
  languageComfort,
  modeStrings,
  language,
}: {
  languageComfort: ConnectionStyleType['languageComfort'];
  modeStrings: ConnectionStyleStringsType[ModeType['id']];
  language: string;
}): string => {
  if (!languageComfort) {
    return '';
  }

  const selections = [
    ...(languageComfort.preferredLanguages ?? [])
      .filter((value) => value.trim().length > 0)
      .map((value) => value.toUpperCase()),
    ...(languageComfort.multilingualWelcome
      ? [modeStrings.languageComfort.multilingualWelcome[language]]
      : []),
    ...(languageComfort.simpleEnglishOk
      ? [modeStrings.languageComfort.simpleEnglishOk[language]]
      : []),
  ];

  return selections.length > 0
    ? `${modeStrings.languageComfort.title[language]}: ${selections.join(', ')}`
    : '';
};

/**
 * Build the settings summary rows shown for the current mode's connection-style
 * selections.
 */
const buildConnectionStyleSummaryRows = ({
  connectionStyleStrings,
  modeId,
  language,
  user,
}: {
  connectionStyleStrings: ConnectionStyleStringsType;
  modeId: ModeType['id'];
  language: string;
  user: UserType;
}): string[] => {
  const profile = user[modeId];
  if (!profile) {
    return [];
  }
  const modeStrings = connectionStyleStrings[modeId];

  const rows = [
    profile.connectionStyle?.availabilityPattern
      ? `${
          modeStrings.availabilityPattern.title[language]
        }: ${resolveConnectionStyleOptionLabel({
          options: modeStrings.availabilityPattern.options,
          value: profile.connectionStyle.availabilityPattern,
          language,
        })}`
      : '',
    profile.connectionStyle?.communicationPace
      ? `${
          modeStrings.communicationPace.title[language]
        }: ${resolveConnectionStyleOptionLabel({
          options: modeStrings.communicationPace.options,
          value: profile.connectionStyle.communicationPace,
          language,
        })}`
      : '',
    profile.connectionStyle?.introductionPreference
      ? `${
          modeStrings.introductionPreference.title[language]
        }: ${resolveConnectionStyleOptionLabel({
          options: modeStrings.introductionPreference.options,
          value: profile.connectionStyle.introductionPreference,
          language,
        })}`
      : '',
    profile.connectionStyle?.planningStyle
      ? `${
          modeStrings.planningStyle.title[language]
        }: ${resolveConnectionStyleOptionLabel({
          options: modeStrings.planningStyle.options,
          value: profile.connectionStyle.planningStyle,
          language,
        })}`
      : '',
    buildLanguageComfortSummaryRow({
      languageComfort: profile.connectionStyle?.languageComfort,
      modeStrings,
      language,
    }),
  ];

  return rows.filter((value) => value.trim().length > 0);
};

/**
 * Dashboard settings page — language, display, messaging privacy, freshness prompts, and trust controls.
 */
function DashboardSettings({
  mode,
  strings,
  language,
}: DashboardSettingsProps) {
  const {
    dashboard: dashboardStrings,
    dashboardGuidance: dashboardGuidanceStrings,
    common: commonStrings,
    connectionStyle: connectionStyleStrings,
  } = resolveDashboardStringGroups(strings);
  const { user, setUserProfile, setUserSettings } = useContext(UserContext);
  const { state, getModeState, unblockProfile, unblockGroup } =
    useRelationship();
  const modeRelationshipState = getModeState(mode.id);

  const currentLanguage = user.userSettings?.language ?? 'en';
  const currentDarkMode = user.userSettings?.darkMode ?? 'light';
  const currentModeProfile = user[mode.id];
  const currentMessagingPrivacy: MessagingPrivacyLevelType =
    currentModeProfile?.messagingPrivacy ??
    user.userSettings?.messagingPrivacy ??
    'open_intro';
  const currentFreshness: FreshnessPromptLevelType =
    user.userSettings?.freshnessPrompts ?? 'off';
  const connectionStyleSummaryRows = buildConnectionStyleSummaryRows({
    connectionStyleStrings,
    modeId: mode.id,
    language,
    user,
  });
  const connectionStyleVisibilityLabel = resolveVisibilityLabel({
    commonStrings,
    language,
    visibility: currentModeProfile?.profileVisibility,
  });
  const neighborhoodPrivacyReminder =
    mode.id === 'neighborhood'
      ? dashboardGuidanceStrings.neighborhood.trustPromptMessages
          .review_visibility[language]
      : '';

  const s = dashboardStrings.settings;
  const managementRowStyle = {
    display: 'flex',
    gap: 12,
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap' as const,
    padding: '10px 0',
    borderBottom: '1px solid rgba(127, 127, 127, 0.2)',
  };
  const reportCardStyle = {
    display: 'grid',
    gap: 4,
    padding: 12,
    borderRadius: 12,
    border: '1px solid rgba(127, 127, 127, 0.3)',
  };

  /**
   * Persist messaging privacy on the active mode profile because intro-message
   * gates read from profile state rather than shared user settings.
   */
  const updateModeMessagingPrivacy = (
    nextPrivacy: MessagingPrivacyLevelType
  ) => {
    if (!currentModeProfile) {
      return;
    }

    setUserProfile(
      {
        ...currentModeProfile,
        messagingPrivacy: nextPrivacy,
      },
      mode
    );
  };

  const profileNameLookup = useMemo(
    () =>
      new Map(
        getProfilesForMode(mode.id).map((profile) => {
          const visibleName = resolveVisibleProfileFieldValue({
            profile,
            fieldName: 'name',
            value: profile.name,
            language,
            viewer: currentModeProfile,
            isConnection: modeRelationshipState.connectionIds.includes(
              profile.id
            ),
          });

          return [
            profile.id,
            visibleName ||
              buildFallbackEntityLabel(s.unknownProfile[language], profile.id),
          ];
        })
      ),
    [
      currentModeProfile,
      language,
      mode.id,
      modeRelationshipState.connectionIds,
      s.unknownProfile,
    ]
  );

  const groupNameLookup = useMemo(
    () =>
      new Map(
        modeRelationshipState.groups.map((group) => [
          group.id,
          group.groupName ||
            buildFallbackEntityLabel(s.unknownGroup[language], group.id),
        ])
      ),
    [language, modeRelationshipState.groups, s.unknownGroup]
  );

  const blockedProfiles = useMemo(
    () =>
      [...(modeRelationshipState.blockedProfileIds ?? [])]
        .map((profileId) => ({
          id: profileId,
          name:
            profileNameLookup.get(profileId) ??
            buildFallbackEntityLabel(s.unknownProfile[language], profileId),
        }))
        .sort((left, right) => left.name.localeCompare(right.name, language)),
    [
      language,
      modeRelationshipState.blockedProfileIds,
      profileNameLookup,
      s.unknownProfile,
    ]
  );

  const blockedGroups = useMemo(
    () =>
      [...(modeRelationshipState.blockedGroupIds ?? [])]
        .map((groupId) => ({
          id: groupId,
          name:
            groupNameLookup.get(groupId) ??
            buildFallbackEntityLabel(s.unknownGroup[language], groupId),
        }))
        .sort((left, right) => left.name.localeCompare(right.name, language)),
    [
      groupNameLookup,
      language,
      modeRelationshipState.blockedGroupIds,
      s.unknownGroup,
    ]
  );

  const safetyReports = useMemo(
    () =>
      [...(state.safetyReports ?? [])]
        .filter((report) => report.modeId === mode.id)
        .sort(
          (left, right) =>
            toTimestamp(right.createdAt) - toTimestamp(left.createdAt)
        )
        .slice(0, 5)
        .map((report) => {
          const targetName =
            report.targetType === 'group'
              ? groupNameLookup.get(report.targetId) ??
                buildFallbackEntityLabel(
                  s.unknownGroup[language],
                  report.targetId
                )
              : profileNameLookup.get(report.targetId) ??
                buildFallbackEntityLabel(
                  s.unknownProfile[language],
                  report.targetId
                );
          const titleTemplate =
            report.targetType === 'profile'
              ? s.reportProfileTemplate[language]
              : report.targetType === 'group'
              ? s.reportGroupTemplate[language]
              : s.reportConversationTemplate[language];
          const formattedDate = formatReportTimestamp(
            report.createdAt,
            language
          );

          return {
            ...report,
            title: formatTemplate(titleTemplate, { name: targetName }),
            savedAt: formattedDate
              ? formatTemplate(s.reportSavedAtTemplate[language], {
                  date: formattedDate,
                })
              : '',
          };
        }),
    [
      groupNameLookup,
      language,
      mode.id,
      profileNameLookup,
      s.reportConversationTemplate,
      s.reportGroupTemplate,
      s.reportProfileTemplate,
      s.reportSavedAtTemplate,
      s.unknownGroup,
      s.unknownProfile,
      state.safetyReports,
    ]
  );

  return (
    <DashboardShell
      mode={mode}
      language={language}
      strings={{ dashboard: dashboardStrings, common: commonStrings }}
      activeSection="settings"
      pageTitle={s.title[language]}
      pageSubtitle={s.subtitle[language]}
    >
      <Grid spacing={2}>
        <GridItem xs={12}>
          <DashboardSectionCard title={s.languageLabel[language]}>
            <Text variant="body2" color="text.secondary">
              {s.languageDescription[language]}
            </Text>
            <Grid spacing={1} style={{ marginTop: 8 }}>
              {languages.map((lang) => (
                <GridItem xs={6} key={lang}>
                  <Button
                    fullWidth
                    variant={
                      currentLanguage === lang ? 'contained' : 'outlined'
                    }
                    onClick={() => setUserSettings({ language: lang })}
                  >
                    {lang.toUpperCase()}
                  </Button>
                </GridItem>
              ))}
            </Grid>
          </DashboardSectionCard>
        </GridItem>

        <GridItem xs={12} md={6}>
          <DashboardSectionCard title={s.darkModeLabel[language]}>
            <Text variant="body2" color="text.secondary">
              {s.darkModeDescription[language]}
            </Text>
            <Grid spacing={1} style={{ marginTop: 8 }}>
              <GridItem xs={6}>
                <Button
                  fullWidth
                  variant={
                    currentDarkMode === 'light' ? 'contained' : 'outlined'
                  }
                  onClick={() => setUserSettings({ darkMode: 'light' })}
                >
                  {s.darkModeOff[language]}
                </Button>
              </GridItem>
              <GridItem xs={6}>
                <Button
                  fullWidth
                  variant={
                    currentDarkMode === 'dark' ? 'contained' : 'outlined'
                  }
                  onClick={() => setUserSettings({ darkMode: 'dark' })}
                >
                  {s.darkModeOn[language]}
                </Button>
              </GridItem>
            </Grid>
          </DashboardSectionCard>
        </GridItem>

        <GridItem xs={12} md={6}>
          <DashboardSectionCard title={s.messagingPrivacyLabel[language]}>
            <Text variant="body2" color="text.secondary">
              {s.messagingPrivacyDescription[language]}
            </Text>
            <Grid spacing={1} style={{ marginTop: 8 }}>
              <GridItem xs={12}>
                <Button
                  fullWidth
                  variant={
                    currentMessagingPrivacy === 'open_intro'
                      ? 'contained'
                      : 'outlined'
                  }
                  onClick={() => updateModeMessagingPrivacy('open_intro')}
                >
                  {s.messagingPrivacyOpen[language]}
                </Button>
              </GridItem>
              <GridItem xs={12}>
                <Button
                  fullWidth
                  variant={
                    currentMessagingPrivacy === 'connections_only'
                      ? 'contained'
                      : 'outlined'
                  }
                  onClick={() => updateModeMessagingPrivacy('connections_only')}
                >
                  {s.messagingPrivacyConnectionsOnly[language]}
                </Button>
              </GridItem>
            </Grid>
          </DashboardSectionCard>
        </GridItem>

        <GridItem xs={12} md={6}>
          <DashboardSectionCard
            title={connectionStyleStrings.common.sectionTitle[language]}
          >
            <Text variant="body2" color="text.secondary">
              {connectionStyleStrings.common.sectionDescription[language]}
            </Text>
            <Text variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {connectionStyleStrings.common.visibilityDescription[language]}
            </Text>
            <Text variant="body2" sx={{ mt: 1 }}>
              {`${commonStrings.privacyVisibility[language]}: ${connectionStyleVisibilityLabel}`}
            </Text>
            <div style={{ display: 'grid', gap: 8, marginTop: 12 }}>
              {connectionStyleSummaryRows.length > 0 ? (
                connectionStyleSummaryRows.map((row) => (
                  <Text key={row} variant="body2">
                    {row}
                  </Text>
                ))
              ) : (
                <Text variant="body2" color="text.secondary">
                  {
                    dashboardGuidanceStrings[mode.id]
                      .compatibilityPromptMessages.complete_connection_style[
                      language
                    ]
                  }
                </Text>
              )}
              {neighborhoodPrivacyReminder ? (
                <Text variant="body2" color="text.secondary">
                  {neighborhoodPrivacyReminder}
                </Text>
              ) : null}
            </div>
          </DashboardSectionCard>
        </GridItem>

        <GridItem xs={12}>
          <DashboardSectionCard title={s.freshnessPromptsLabel[language]}>
            <Text variant="body2" color="text.secondary">
              {s.freshnessPromptsDescription[language]}
            </Text>
            <Grid spacing={1} style={{ marginTop: 8 }}>
              {(
                [
                  { value: 'off', label: s.freshnessOff[language] },
                  { value: 'low', label: s.freshnessLow[language] },
                  { value: 'medium', label: s.freshnessMedium[language] },
                  { value: 'high', label: s.freshnessHigh[language] },
                ] as { value: FreshnessPromptLevelType; label: string }[]
              ).map(({ value, label }) => (
                <GridItem xs={6} md={3} key={value}>
                  <Button
                    fullWidth
                    variant={
                      currentFreshness === value ? 'contained' : 'outlined'
                    }
                    onClick={() => setUserSettings({ freshnessPrompts: value })}
                  >
                    {label}
                  </Button>
                </GridItem>
              ))}
            </Grid>
          </DashboardSectionCard>
        </GridItem>

        <GridItem xs={12}>
          <DashboardSectionCard
            title={s.trustSafetyLabel[language]}
            subtitle={s.trustSafetyDescription[language]}
          >
            <Grid spacing={2}>
              <GridItem xs={12} md={6}>
                <div style={{ display: 'grid', gap: 8 }}>
                  <Text variant="subtitle1">
                    {s.blockedProfilesLabel[language]}
                  </Text>
                  {blockedProfiles.length === 0 ? (
                    <Text variant="body2" color="text.secondary">
                      {s.noBlockedProfiles[language]}
                    </Text>
                  ) : (
                    blockedProfiles.map((profile) => (
                      <div key={profile.id} style={managementRowStyle}>
                        <Text>{profile.name}</Text>
                        <Button
                          variant="outlined"
                          onClick={() => unblockProfile(mode.id, profile.id)}
                        >
                          {s.unblockProfileAction[language]}
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </GridItem>

              <GridItem xs={12} md={6}>
                <div style={{ display: 'grid', gap: 8 }}>
                  <Text variant="subtitle1">
                    {s.blockedGroupsLabel[language]}
                  </Text>
                  {blockedGroups.length === 0 ? (
                    <Text variant="body2" color="text.secondary">
                      {s.noBlockedGroups[language]}
                    </Text>
                  ) : (
                    blockedGroups.map((group) => (
                      <div key={group.id} style={managementRowStyle}>
                        <Text>{group.name}</Text>
                        <Button
                          variant="outlined"
                          onClick={() => unblockGroup(mode.id, group.id)}
                        >
                          {s.unblockGroupAction[language]}
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </GridItem>

              <GridItem xs={12}>
                <div style={{ display: 'grid', gap: 12 }}>
                  <div style={{ display: 'grid', gap: 4 }}>
                    <Text variant="subtitle1">
                      {s.safetyReportsLabel[language]}
                    </Text>
                    <Text variant="body2" color="text.secondary">
                      {s.safetyReportsDescription[language]}
                    </Text>
                  </div>
                  {safetyReports.length === 0 ? (
                    <Text variant="body2" color="text.secondary">
                      {s.noSafetyReports[language]}
                    </Text>
                  ) : (
                    safetyReports.map((report) => (
                      <div key={report.id} style={reportCardStyle}>
                        <Text>{report.title}</Text>
                        {report.summary ? (
                          <Text variant="body2">{report.summary}</Text>
                        ) : null}
                        {report.savedAt ? (
                          <Text variant="body2" color="text.secondary">
                            {report.savedAt}
                          </Text>
                        ) : null}
                      </div>
                    ))
                  )}
                </div>
              </GridItem>
            </Grid>
          </DashboardSectionCard>
        </GridItem>
      </Grid>
    </DashboardShell>
  );
}

export default DashboardSettings;
