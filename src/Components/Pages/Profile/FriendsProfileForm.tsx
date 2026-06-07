import React, { useState, useContext, FormEvent } from 'react';
import {
  ProfileStringsType,
  ProfileFieldPrivacyLevelType,
  ConnectionStyleFormStringsType,
  FriendsProfileDataType,
  ModeType,
  CommonStringsType,
} from '../../../types';
import type { SaveStatusState } from '../../Common/SaveStatus';
import { blankFriendProfile, UserContext } from '../../../Utlilities';
import {
  RenderFormElements,
  type FormElementConfigType,
  useFormStore,
} from '../../Common/FormElements';
import {
  getFriendsBaseFormState,
  getFriendsConnectionStyleFormConfig,
  getFriendsProfileAboutFormConfig,
  getFriendsProfileHobbiesFormConfig,
  getFriendsProfileHomeLifeFormConfig,
  getFriendsProfileMainFormConfig,
  getFriendsProfilePreferencesFormConfig,
  getFriendsProfilePromptsFormConfig,
  getFriendsProfileSubmission,
} from './FriendsProfileConfig';
import {
  loadModeFieldPrivacy,
  persistModeFieldPrivacy,
} from './ProfileFieldPrivacyStorage';
import { getHobbiesOptions, getModeHobbyValues } from './ProfileFormHelper';
import {
  hasProfileValidationErrors,
  validateProfileFormData,
} from './ProfileValidation';
import {
  buildProfileSaveStatusCopy,
  ProfileFormScaffold,
  useBasicProfileFormHandlers,
} from './ProfileFormScaffold';

type FriendsProfileFormProps = {
  strings: ProfileStringsType['friends'] &
    ProfileStringsType['common'] &
    ConnectionStyleFormStringsType &
    CommonStringsType;
  language: string;
  mode: ModeType;
  onSaveSuccess?: () => void;
};

const FriendsProfileForm = ({
  strings,
  language,
  mode,
  onSaveSuccess,
}: FriendsProfileFormProps) => {
  const userContext = useContext(UserContext);
  const useProfile = userContext.user.friends ?? blankFriendProfile;
  const fullHobbies = useProfile.hobbies.full ?? [];

  const hobbiesOptions = getHobbiesOptions({
    strings,
    fullHobbies,
    language,
    allowedValues: getModeHobbyValues(mode.id),
  });
  const profileFormStore = useFormStore(
    () => getFriendsBaseFormState({ useProfile, hobbiesOptions }),
    {
      privacyByField: loadModeFieldPrivacy(mode.id),
    }
  );
  const profileFormData = profileFormStore.getValues();
  const [saveStatus, setSaveStatus] = useState<SaveStatusState>('idle');
  const [saveErrorMessage, setSaveErrorMessage] = useState('');
  const [lastSaveWasIncomplete, setLastSaveWasIncomplete] = useState(false);
  const {
    handleAutocompleteChange,
    handleChange,
    handleCheckboxChange,
    resetSaveStatus,
  } = useBasicProfileFormHandlers({
    language,
    saveStatus,
    setSaveStatus,
    store: profileFormStore,
  });

  /**
   * Validate and persist the profile, then update save-state feedback.
   */
  const persistProfile = async () => {
    const currentProfileFormData = profileFormStore.getValues();
    const errors = validateProfileFormData('friends', currentProfileFormData);
    profileFormStore.setErrors(errors);
    const hasValidationIssues = hasProfileValidationErrors(errors);
    setLastSaveWasIncomplete(hasValidationIssues);
    setSaveStatus('saving');
    setSaveErrorMessage('');
    const submission: FriendsProfileDataType = getFriendsProfileSubmission({
      useProfile,
      profileFormData: currentProfileFormData,
      language,
    });
    try {
      userContext.setUserProfile(submission, mode);
      setSaveStatus('success');
      if (!hasValidationIssues) {
        onSaveSuccess?.();
      }
    } catch (error) {
      setSaveErrorMessage(
        strings['saveError']?.[language] ?? strings['saveError']?.en ?? ''
      );
      setSaveStatus('error');
    }
  };

  const handleSubmit = (e: FormEvent<HTMLDivElement>) => {
    e.preventDefault();
    void persistProfile();
  };

  /**
   * Persist per-field privacy selection for the active mode.
   */
  const handleFieldPrivacyChange = (
    fieldName: string,
    level: ProfileFieldPrivacyLevelType
  ) => {
    profileFormStore.setPrivacy(fieldName, level);
    persistModeFieldPrivacy({
      modeId: mode.id,
      fieldName,
      level,
    });
  };

  const friendsProfileMainFormConfig = getFriendsProfileMainFormConfig({
    strings,
    profileFormData,
    language,
  });

  const friendsProfileHobbiesFormConfig = getFriendsProfileHobbiesFormConfig({
    profileFormData,
    strings,
    language,
  });

  const friendsProfileDemographicsFormConfig = getFriendsProfileAboutFormConfig(
    { profileFormData, strings, language }
  );

  const friendsConnectionStyleFormConfig = getFriendsConnectionStyleFormConfig({
    profileFormData,
    strings,
    language,
  });

  const friendsProfilePreferencesFormConfig =
    getFriendsProfilePreferencesFormConfig({
      profileFormData,
      strings,
      language,
    });

  const friendsProfileHomeLifeFormConfig = getFriendsProfileHomeLifeFormConfig({
    profileFormData,
    strings,
    language,
  });

  const friendsProfilePromptsFormConfig = getFriendsProfilePromptsFormConfig({
    profileFormData,
    strings,
    language,
  });

  const formStructure = [
    {
      key: 'main',
      config: friendsProfileMainFormConfig,
    },
    {
      key: 'connection-style',
      title: strings.connectionStyleCommon.sectionTitle[language],
      config: friendsConnectionStyleFormConfig,
    },
    {
      key: 'hobbies',
      title: strings.questions.hobbies.title[language],
      config: friendsProfileHobbiesFormConfig,
    },
    {
      key: 'demographics',
      title: strings.questions.demographics.title[language],
      config: friendsProfileDemographicsFormConfig,
    },
    {
      key: 'preferences',
      title: strings.questions.preferences.title[language],
      config: friendsProfilePreferencesFormConfig,
    },
    {
      key: 'home-life',
      title: strings.questions.homeLife.title[language],
      config: friendsProfileHomeLifeFormConfig,
    },
    {
      key: 'prompts',
      title: strings.questions.prompts.title[language],
      config: friendsProfilePromptsFormConfig,
    },
  ];

  const renderFormConfig = (config: FormElementConfigType[]) =>
    RenderFormElements({
      config,
      handleChange,
      handleCheckboxChange,
      handleAutocompleteChange,
      strings,
      language,
      store: profileFormStore,
      handleFieldPrivacyChange,
    });

  const resolveSaveLabel = (
    key:
      | 'saveSuccess'
      | 'saveDraftSuccess'
      | 'saveError'
      | 'saveInProgress'
      | 'retry'
      | 'dismiss'
  ): string => strings[key]?.[language] ?? strings[key]?.en ?? '';

  return (
    <ProfileFormScaffold
      formId="friends-profile-form"
      language={language}
      modeId={mode.id}
      onDismissSaveStatus={() => setSaveStatus('idle')}
      onMutate={resetSaveStatus}
      onRetry={() => void persistProfile()}
      onSubmit={handleSubmit}
      picturesFieldId="friends-profile-pictures-input"
      picturesFieldLabel={strings.questions.pictures[language]}
      saveStatus={saveStatus}
      saveStatusCopy={buildProfileSaveStatusCopy({
        getLabel: resolveSaveLabel,
        lastSaveWasIncomplete,
        saveErrorMessage,
      })}
      sections={formStructure.map((section) => ({
        key: section.key,
        title: section.title,
        content: renderFormConfig(section.config),
      }))}
      store={profileFormStore}
      strings={strings}
      submitLabel={strings.save[language]}
    />
  );
};

export default FriendsProfileForm;
