import React, { useState, useContext, FormEvent } from 'react';
import {
  ProfileStringsType,
  ProfileFieldPrivacyLevelType,
  ConnectionStyleFormStringsType,
  DatingProfileDataType,
  ModeType,
  CommonStringsType,
} from '../../../types';
import type { SaveStatusState } from '../../Common/SaveStatus';
import { blankDatingProfile, UserContext } from '../../../Utlilities';
import {
  RenderFormElements,
  type FormElementConfigType,
  useFormStore,
} from '../../Common/FormElements';
import {
  getDatingProfileAboutFormConfig,
  getDatingConnectionStyleFormConfig,
  getDatingProfileHobbiesFormConfig,
  getDatingProfileHomeLifeFormConfig,
  getDatingProfileMainFormConfig,
  getDatingProfilePreferencesFormConfig,
  getDatingProfilePromptsFormConfig,
  getDatingBaseFormState,
  getDatingProfileSubmission,
} from './DatingProfileConfig';
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

type DatingProfileFormProps = {
  strings: ProfileStringsType['dating'] &
    ProfileStringsType['common'] &
    ConnectionStyleFormStringsType &
    CommonStringsType;
  language: string;
  mode: ModeType;
  onSaveSuccess?: () => void;
};

const DatingProfileForm = ({
  strings,
  language,
  mode,
  onSaveSuccess,
}: DatingProfileFormProps) => {
  const userContext = useContext(UserContext);
  const useProfile = userContext.user.dating ?? blankDatingProfile;
  const fullHobbies = useProfile.hobbies.full ?? [];
  const hobbiesOptions = getHobbiesOptions({
    strings,
    fullHobbies,
    language,
    allowedValues: getModeHobbyValues(mode.id),
  });
  const profileFormStore = useFormStore(
    () => getDatingBaseFormState({ useProfile, hobbiesOptions }),
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
    const errors = validateProfileFormData('dating', currentProfileFormData);
    profileFormStore.setErrors(errors);
    const hasValidationIssues = hasProfileValidationErrors(errors);
    setLastSaveWasIncomplete(hasValidationIssues);
    setSaveStatus('saving');
    setSaveErrorMessage('');
    const submission: DatingProfileDataType = getDatingProfileSubmission({
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

  const datingProfileMainFormConfig = getDatingProfileMainFormConfig({
    strings,
    profileFormData,
    language,
  });

  const datingProfileHobbiesFormConfig = getDatingProfileHobbiesFormConfig({
    profileFormData,
    strings,
    language,
  });

  const datingProfileDemographicsFormConfig = getDatingProfileAboutFormConfig({
    profileFormData,
    strings,
    language,
  });

  const datingConnectionStyleFormConfig = getDatingConnectionStyleFormConfig({
    profileFormData,
    strings,
    language,
  });

  const datingProfilePreferencesFormConfig =
    getDatingProfilePreferencesFormConfig({
      profileFormData,
      strings,
      language,
    });

  const datingProfileHomeLifeFormConfig = getDatingProfileHomeLifeFormConfig({
    profileFormData,
    strings,
    language,
  });

  const datingProfilePromptsFormConfig = getDatingProfilePromptsFormConfig({
    profileFormData,
    strings,
    language,
  });

  const formStructure = [
    {
      key: 'main',
      config: datingProfileMainFormConfig,
    },
    {
      key: 'connection-style',
      title: strings.connectionStyleCommon.sectionTitle[language],
      config: datingConnectionStyleFormConfig,
    },
    {
      key: 'demographics',
      title: strings.questions.demographics.title[language],
      config: datingProfileDemographicsFormConfig,
    },
    {
      key: 'hobbies',
      title: strings.questions.hobbies.title[language],
      config: datingProfileHobbiesFormConfig,
    },
    {
      key: 'preferences',
      title: strings.questions.preferences.title[language],
      config: datingProfilePreferencesFormConfig,
    },
    {
      key: 'home-life',
      title: strings.questions.homeLife.title[language],
      config: datingProfileHomeLifeFormConfig,
    },
    {
      key: 'prompts',
      title: strings.questions.prompts.title[language],
      config: datingProfilePromptsFormConfig,
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
      formId="dating-profile-form"
      language={language}
      modeId={mode.id}
      onDismissSaveStatus={() => setSaveStatus('idle')}
      onMutate={resetSaveStatus}
      onRetry={() => void persistProfile()}
      onSubmit={handleSubmit}
      picturesFieldId="dating-profile-pictures-input"
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

export default DatingProfileForm;
