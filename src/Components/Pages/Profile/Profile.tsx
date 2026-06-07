import { ModeType, ProfilePageProps } from '../../../types';
import type { ComponentProps } from 'react';
import {
  Container,
  ErrorBoundary,
  Grid,
  GridItem,
  ToggleButton,
  EmptyState,
  ErrorState,
} from '../../';
import AcademicProfileForm from './AcademicProfileForm';
import DatingProfileForm from './DatingProfileForm';
import FriendsProfileForm from './FriendsProfileForm';
import NeighborhoodProfileForm from './NeighborhoodProfileForm';
import ProfessionalProfileForm from './ProfessionalProfileForm';
import { ProfileView } from './ProfileView';
import { useState } from 'react';

/**
 * Supported profile mode identifiers.
 */
type ProfileModeId = ModeType['id'];

const PROFILE_MODE_BY_ID: Record<ProfileModeId, ModeType> = {
  friends: { id: 'friends' },
  dating: { id: 'dating' },
  academic: { id: 'academic' },
  professional: { id: 'professional' },
  neighborhood: { id: 'neighborhood' },
};

const buildProfileModeFormStrings = (
  modeId: ProfileModeId,
  strings: ProfilePageProps['strings']
) => ({
  ...strings.profile[modeId],
  ...strings.profile.common,
  ...strings.common,
  connectionStyle: strings.connectionStyle[modeId],
  connectionStyleCommon: strings.connectionStyle.common,
});

type ProfileWorkspaceContentProps = ProfilePageProps & {
  isEdit: boolean;
  onToggleEdit?: () => void;
  showToggleButton?: boolean;
  onSaveSuccess?: () => void;
};

/**
 * Shared profile workspace used by both standalone and dashboard profile
 * routes.
 *
 * Keeping the mode-to-form mapping here ensures the two entry points render the
 * same forms, strings, and fallback behavior.
 */
export const ProfileWorkspaceContent = ({
  mode,
  strings,
  language,
  isEdit,
  onToggleEdit,
  showToggleButton = true,
  onSaveSuccess,
}: ProfileWorkspaceContentProps) => {
  const retryLabel = strings.common.retry?.[language] ?? '';
  const profileUnavailableTitle =
    strings.common.profileUnavailableTitle?.[language] ?? '';
  const profileModeUnsupportedMessage =
    strings.common.profileModeUnsupportedMessage?.[language] ?? '';
  const profileRefreshMessage =
    strings.common.profileRefreshMessage?.[language] ?? '';

  const renderModeForm = (modeId: ProfileModeId) => {
    const formProps = {
      mode: PROFILE_MODE_BY_ID[modeId],
      language,
      onSaveSuccess,
    };

    switch (modeId) {
      case 'dating':
        return (
          <DatingProfileForm
            {...formProps}
            strings={
              buildProfileModeFormStrings(modeId, strings) as ComponentProps<
                typeof DatingProfileForm
              >['strings']
            }
          />
        );
      case 'friends':
        return (
          <FriendsProfileForm
            {...formProps}
            strings={
              buildProfileModeFormStrings(modeId, strings) as ComponentProps<
                typeof FriendsProfileForm
              >['strings']
            }
          />
        );
      case 'academic':
        return (
          <AcademicProfileForm
            {...formProps}
            strings={
              buildProfileModeFormStrings(modeId, strings) as ComponentProps<
                typeof AcademicProfileForm
              >['strings']
            }
          />
        );
      case 'professional':
        return (
          <ProfessionalProfileForm
            {...formProps}
            strings={
              buildProfileModeFormStrings(modeId, strings) as ComponentProps<
                typeof ProfessionalProfileForm
              >['strings']
            }
          />
        );
      case 'neighborhood':
        return (
          <NeighborhoodProfileForm
            {...formProps}
            strings={
              buildProfileModeFormStrings(modeId, strings) as ComponentProps<
                typeof NeighborhoodProfileForm
              >['strings']
            }
          />
        );
      default:
        return null;
    }
  };

  /**
   * Render the active profile form or view with a safe fallback.
   */
  const RenderProfile = () => {
    const selected = isEdit ? (
      renderModeForm(mode.id)
    ) : (
      <ProfileView
        mode={mode}
        language={language}
        strings={{
          profile: strings.profile,
          connectionStyle: strings.connectionStyle,
          common: strings.common,
        }}
      />
    );
    if (!selected) {
      return (
        <EmptyState
          title={profileUnavailableTitle}
          message={profileModeUnsupportedMessage}
        />
      );
    }
    return selected;
  };
  return (
    <ErrorBoundary
      resetKeys={[mode.id, isEdit]}
      fallback={({ resetErrorBoundary }) => (
        <ErrorState
          title={profileUnavailableTitle}
          message={profileRefreshMessage}
          actionLabel={retryLabel}
          onAction={resetErrorBoundary}
        />
      )}
    >
      <Grid spacing={2}>
        {showToggleButton ? (
          <GridItem xs={12}>
            <ToggleButton
              value={isEdit}
              label={strings.common.edit[language]}
              onClick={onToggleEdit}
              className=""
              sx={{
                bgcolor: 'primary.surfaceStrong',
                color: 'primary.contrastText',
              }}
            />
          </GridItem>
        ) : null}
        <GridItem xs={12}>
          <RenderProfile />
        </GridItem>
      </Grid>
    </ErrorBoundary>
  );
};

/**
 * Standalone profile page with local edit/view toggle state.
 */
function Profile({ mode, strings, language }: ProfilePageProps) {
  const [isEdit, setIsEdit] = useState(false);
  const toggleEdit = () => setIsEdit((currentValue) => !currentValue);

  return (
    <Container component="main" className={`who-main profile ${mode.id}`}>
      <ProfileWorkspaceContent
        mode={mode}
        strings={strings}
        language={language}
        isEdit={isEdit}
        onToggleEdit={toggleEdit}
        onSaveSuccess={() => setIsEdit(false)}
      />
    </Container>
  );
}

export default Profile;
