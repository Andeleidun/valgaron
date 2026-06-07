import { useContext, useEffect, useMemo, useState } from 'react';
import { useTheme } from '@mui/material/styles';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import type {
  CommonStringsType,
  DashboardStringsType,
  ModeType,
} from '../../../types';
import {
  emitWhoTelemetryEvent,
  UserContext,
  useRelationship,
} from '../../../Utlilities';
import { resolveRedirectLocation } from '../../../Utlilities/redirectLocation';
import { getModeActivationStatus } from '../../../Utlilities/userActivation';
import { Box, Button, Text } from '../../';
import { ProfileWorkspaceContent } from '../Profile/Profile';
import { selectOverviewSummary } from './dashboardSelectors';
import { resolveDashboardStringGroups } from './dashboardFallbacks';
import {
  buildProfileFreshnessDescription,
  buildProfileFreshnessTimestampLabel,
} from './dashboardFreshness';
import { formatDashboardTemplate } from './dashboardStrings';
import DashboardShell from './DashboardShell';

type DashboardProfileProps = {
  mode: ModeType;
  strings: {
    dashboard: DashboardStringsType;
    profile: Parameters<
      typeof ProfileWorkspaceContent
    >[0]['strings']['profile'];
    connectionStyle: Parameters<
      typeof ProfileWorkspaceContent
    >[0]['strings']['connectionStyle'];
    common: CommonStringsType;
  };
  language: string;
};

/**
 * Dashboard-native profile workspace that reuses the shared profile forms and view.
 */
const DashboardProfile = ({
  mode,
  strings,
  language,
}: DashboardProfileProps) => {
  const {
    dashboard: dashboardStrings,
    profile: profileStrings,
    connectionStyle: connectionStyleStrings,
    common: commonStrings,
  } = resolveDashboardStringGroups(strings);
  const theme = useTheme();
  const { user } = useContext(UserContext);
  const { state: relationshipState } = useRelationship();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const activationStatus = getModeActivationStatus({
    user,
    modeId: mode.id,
  });
  const activationRequested = searchParams.get('activate') === '1';
  const [isEdit, setIsEdit] = useState(
    () => activationRequested || !activationStatus.isReady
  );
  const overviewSummary = selectOverviewSummary({
    modeId: mode.id,
    user,
    relationshipState,
  });
  const showActivationPrompt = activationRequested || !activationStatus.isReady;

  useEffect(() => {
    if (showActivationPrompt) {
      setIsEdit(true);
    }
  }, [mode.id, showActivationPrompt]);

  useEffect(() => {
    if (!activationRequested || !activationStatus.isReady) {
      return;
    }
    const activationReturnLocation = resolveRedirectLocation({
      fallbackPathname: '/dashboard',
      state: location.state,
    });
    navigate(
      {
        pathname: activationReturnLocation.pathname,
        search: activationReturnLocation.search,
        hash: activationReturnLocation.hash,
      },
      {
        replace: true,
        state: activationReturnLocation.state,
      }
    );
  }, [activationRequested, activationStatus.isReady, location.state, navigate]);

  useEffect(() => {
    emitWhoTelemetryEvent({
      type: 'dashboard_completion_changed',
      modeId: mode.id,
      completion: overviewSummary.completion.percentage,
    });
  }, [mode.id, overviewSummary.completion.percentage]);

  const profileSubtitle = useMemo(
    () =>
      formatDashboardTemplate(
        dashboardStrings.profileWorkspace.pageSubtitleTemplate[language],
        {
          percentage: overviewSummary.completion.percentage,
        }
      ),
    [dashboardStrings, language, overviewSummary.completion.percentage]
  );
  const topMissingTasks = overviewSummary.completion.missingTaskIds.slice(0, 3);
  const freshnessDescription = buildProfileFreshnessDescription({
    freshness: overviewSummary.freshness,
    language,
    strings: dashboardStrings,
  });
  const freshnessTimestampLabel = buildProfileFreshnessTimestampLabel({
    freshness: overviewSummary.freshness,
    language,
    strings: dashboardStrings,
  });
  const headerDetails = (
    <Box
      sx={{
        display: 'grid',
        gap: 1.5,
        p: { xs: 2, md: 2.5 },
        borderRadius: 3,
        border: '1px solid',
        borderColor: 'divider',
        backgroundColor: 'background.paper',
      }}
    >
      {showActivationPrompt ? (
        <Box
          sx={{
            p: 1.5,
            borderRadius: 2,
            backgroundColor: theme.palette.primary.background,
            display: 'grid',
            gap: 0.5,
          }}
        >
          <Text variant="subtitle2">
            {dashboardStrings.viewModels.nextAction.profileGapTitle[language]}
          </Text>
          <Text variant="body2" color="text.secondary">
            {
              dashboardStrings.viewModels.nextAction.profileGapDescription[
                language
              ]
            }
          </Text>
        </Box>
      ) : overviewSummary.freshness.isActionable ? (
        <Box
          sx={{
            p: 1.5,
            borderRadius: 2,
            backgroundColor: theme.palette.primary.background,
            display: 'grid',
            gap: 0.5,
          }}
        >
          <Text variant="subtitle2">
            {dashboardStrings.viewModels.freshness.title[language]}
          </Text>
          <Text variant="body2" color="text.secondary">
            {freshnessDescription}
          </Text>
          {freshnessTimestampLabel ? (
            <Text variant="caption" color="text.secondary">
              {freshnessTimestampLabel}
            </Text>
          ) : null}
        </Box>
      ) : null}
      <Box
        sx={{
          display: 'grid',
          gap: 0.5,
        }}
      >
        <Text
          variant="overline"
          sx={{ color: 'text.secondary', letterSpacing: '0.08em' }}
        >
          {dashboardStrings.profileWorkspace.previewTitle[language]}
        </Text>
        <Text variant="body2" color="text.secondary">
          {dashboardStrings.profileWorkspace.previewSubtitle[language]}
        </Text>
      </Box>
      <Box
        sx={{
          display: 'grid',
          gap: 1.5,
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'minmax(0, 2fr) minmax(0, 3fr)',
          },
          alignItems: 'stretch',
        }}
      >
        <Text
          variant="h4"
          sx={{
            lineHeight: 1,
            minWidth: 0,
          }}
        >
          {`${overviewSummary.completion.percentage}%`}
        </Text>
        {topMissingTasks.length === 0 ? (
          <Box
            sx={{
              px: 1.5,
              py: 1.25,
              borderRadius: 2,
              backgroundColor: theme.palette.action.hover,
            }}
          >
            <Text variant="body2" color="text.secondary">
              {dashboardStrings.profileWorkspace.complete[language]}
            </Text>
          </Box>
        ) : (
          <Box
            sx={{
              display: 'grid',
              gap: 1,
            }}
          >
            {topMissingTasks.map((taskId, index) => (
              <Box
                key={taskId}
                sx={{
                  display: 'grid',
                  gridTemplateColumns: 'auto 1fr',
                  gap: 1.25,
                  alignItems: 'start',
                  px: 1.5,
                  py: 1.25,
                  borderRadius: 2,
                  backgroundColor: theme.palette.action.hover,
                }}
              >
                <Text
                  variant="caption"
                  sx={{
                    color: 'text.secondary',
                    fontWeight: 700,
                    lineHeight: 1.5,
                    minWidth: 18,
                  }}
                >
                  {`${index + 1}.`}
                </Text>
                <Text variant="body2">
                  {dashboardStrings.tasks[taskId]?.[language] ?? taskId}
                </Text>
              </Box>
            ))}
          </Box>
        )}
      </Box>
    </Box>
  );

  return (
    <DashboardShell
      mode={mode}
      language={language}
      strings={{
        dashboard: dashboardStrings,
        common: commonStrings,
      }}
      activeSection="profile"
      pageTitle={dashboardStrings.profileWorkspace.pageTitle[language]}
      pageSubtitle={profileSubtitle}
      headerDetails={headerDetails}
      headerActions={
        <Button
          color="primary"
          onClick={() => {
            emitWhoTelemetryEvent({
              type: 'dashboard_action_clicked',
              modeId: mode.id,
              destination: isEdit ? 'profile_view_mode' : 'profile_edit_mode',
            });
            setIsEdit((currentValue) => !currentValue);
          }}
          sx={{
            width: {
              xs: '100%',
              sm: 'auto',
            },
            minWidth: {
              sm: 220,
            },
          }}
        >
          {isEdit
            ? dashboardStrings.profileWorkspace.exitEditMode[language]
            : commonStrings.edit[language]}
        </Button>
      }
    >
      <ProfileWorkspaceContent
        mode={mode}
        language={language}
        strings={{
          profile: profileStrings,
          connectionStyle: connectionStyleStrings,
          common: commonStrings,
        }}
        isEdit={isEdit}
        showToggleButton={false}
        onSaveSuccess={() => setIsEdit(false)}
      />
    </DashboardShell>
  );
};

export default DashboardProfile;
