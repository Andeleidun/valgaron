import React, { useState, useContext, FormEvent } from 'react';
import {
  ProfileStringsType,
  ProfileFieldPrivacyLevelType,
  ConnectionStyleFormStringsType,
  ModeType,
  CommonStringsType,
  NeighborhoodProfileDataType,
} from '../../../types';
import type { SaveStatusState } from '../../Common/SaveStatus';
import { blankNeighborhoodProfile, UserContext } from '../../../Utlilities';
import {
  RenderFormElements,
  type FormElementConfigType,
  useFormStore,
} from '../../Common/FormElements';
import { getHobbiesOptions, getModeHobbyValues } from './ProfileFormHelper';
import {
  getNeighborhoodBaseFormState,
  getNeighborhoodConnectionStyleFormConfig,
  getNeighborhoodProfileAboutFormConfig,
  getNeighborhoodProfileHobbiesFormConfig,
  getNeighborhoodProfileHomeLifeFormConfig,
  getNeighborhoodProfileMainFormConfig,
  getNeighborhoodProfilePreferencesFormConfig,
  getNeighborhoodProfileSubmission,
} from './NeighborhoodProfileConfig';
import {
  loadModeFieldPrivacy,
  persistModeFieldPrivacy,
} from './ProfileFieldPrivacyStorage';
import {
  hasProfileValidationErrors,
  validateProfileFormData,
} from './ProfileValidation';
import {
  buildProfileSaveStatusCopy,
  ProfileFormScaffold,
  useBasicProfileFormHandlers,
} from './ProfileFormScaffold';

type NeighborhoodProfileFormProps = {
  strings: ProfileStringsType['neighborhood'] &
    ProfileStringsType['common'] &
    ConnectionStyleFormStringsType &
    CommonStringsType;
  language: string;
  mode: ModeType;
  onSaveSuccess?: () => void;
};

const NeighborhoodProfileForm = ({
  strings,
  language,
  mode,
  onSaveSuccess,
}: NeighborhoodProfileFormProps) => {
  const userContext = useContext(UserContext);
  const useProfile = userContext.user.neighborhood ?? blankNeighborhoodProfile;
  const fullHobbies = useProfile.hobbies.full ?? [];
  const hobbiesOptions = getHobbiesOptions({
    strings,
    fullHobbies,
    language,
    allowedValues: getModeHobbyValues(mode.id),
  });
  const profileFormStore = useFormStore(
    () => getNeighborhoodBaseFormState({ useProfile, hobbiesOptions }),
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
    const errors = validateProfileFormData(
      'neighborhood',
      currentProfileFormData
    );
    profileFormStore.setErrors(errors);
    const hasValidationIssues = hasProfileValidationErrors(errors);
    setLastSaveWasIncomplete(hasValidationIssues);
    setSaveStatus('saving');
    setSaveErrorMessage('');
    const submission: NeighborhoodProfileDataType =
      getNeighborhoodProfileSubmission({
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

  const neighborhoodProfileMainFormConfig =
    getNeighborhoodProfileMainFormConfig({
      strings,
      profileFormData,
      language,
    });
  const neighborhoodProfileHobbiesFormConfig =
    getNeighborhoodProfileHobbiesFormConfig({
      profileFormData,
      strings,
      language,
    });

  const neighborhoodProfileDemographicsFormConfig =
    getNeighborhoodProfileAboutFormConfig({
      profileFormData,
      strings,
      language,
    });

  const neighborhoodConnectionStyleFormConfig =
    getNeighborhoodConnectionStyleFormConfig({
      profileFormData,
      strings,
      language,
    });

  const neighborhoodProfilePreferencesFormConfig =
    getNeighborhoodProfilePreferencesFormConfig({
      profileFormData,
      strings,
      language,
    });

  const neighborhoodProfileHomeLifeFormConfig =
    getNeighborhoodProfileHomeLifeFormConfig({
      profileFormData,
      strings,
      language,
    });

  const formStructure = [
    {
      key: 'main',
      config: neighborhoodProfileMainFormConfig,
    },
    {
      key: 'connection-style',
      title: strings.connectionStyleCommon.sectionTitle[language],
      config: neighborhoodConnectionStyleFormConfig,
    },
    {
      key: 'hobbies',
      title: strings.questions.hobbies.title[language],
      config: neighborhoodProfileHobbiesFormConfig,
    },
    {
      key: 'demographics',
      title: strings.questions.demographics.title[language],
      config: neighborhoodProfileDemographicsFormConfig,
    },
    {
      key: 'preferences',
      title: strings.questions.preferences.title[language],
      config: neighborhoodProfilePreferencesFormConfig,
    },
    {
      key: 'home-life',
      title: strings.questions.homeLife.title[language],
      config: neighborhoodProfileHomeLifeFormConfig,
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
      formId="neighborhood-profile-form"
      language={language}
      modeId={mode.id}
      onDismissSaveStatus={() => setSaveStatus('idle')}
      onMutate={resetSaveStatus}
      onRetry={() => void persistProfile()}
      onSubmit={handleSubmit}
      picturesFieldId="neighborhood-profile-pictures-input"
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

export default NeighborhoodProfileForm;
