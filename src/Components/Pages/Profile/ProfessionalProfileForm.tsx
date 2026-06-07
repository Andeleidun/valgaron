import React, { FormEvent, useCallback, useContext, useState } from 'react';
import {
  CommonStringsType,
  ConnectionStyleFormStringsType,
  EducationItemType,
  JobHistoryItemType,
  ModeType,
  OptionType,
  ProfileFieldPrivacyLevelType,
  ProfileStringsType,
  ProfessionalProfileDataType,
} from '../../../types';
import type { SaveStatusState } from '../../Common/SaveStatus';
import {
  blankEducationData,
  blankJobHistoryData,
  blankProfessionalProfile,
  UserContext,
} from '../../../Utlilities';
import {
  baseHandleAutocompleteChange,
  baseHandleCheckboxChange,
  baseHandleInputChange,
  baseHandleRepeatingListChange,
  RenderFormElements,
  type FormElementConfigType,
  type FormElementAutocompleteOptionType,
  useFormFieldSnapshot,
  useFormStore,
} from '../../Common/FormElements';
import { useTheme } from '@mui/material/styles';
import {
  getProfessionalBaseFormState,
  getProfessionalConnectionStyleFormConfig,
  getProfessionalProfileAboutFormConfig,
  getProfessionalProfileEducationFormConfig,
  getProfessionalProfileHighlightsFormConfig,
  getProfessionalProfileJobHistoryFormConfig,
  getProfessionalProfileMainFormConfig,
  getProfessionalProfileSubmission,
} from './ProfessionalProfileConfig';
import {
  baseAddEducationData,
  baseAddJobHistoryData,
  baseDeleteEducationData,
  baseDeleteJobHistoryData,
  baseSaveEducationData,
  baseSaveJobHistoryData,
  DataSetType,
} from './ProfileFormHelper';
import {
  hasProfileValidationErrors,
  validateProfileFormData,
} from './ProfileValidation';
import {
  loadModeFieldPrivacy,
  persistModeFieldPrivacy,
} from './ProfileFieldPrivacyStorage';
import {
  buildProfileSaveStatusCopy,
  ProfileFormScaffold,
} from './ProfileFormScaffold';

type ProfessionalProfileFormProps = {
  strings: ProfileStringsType['professional'] &
    ProfileStringsType['common'] &
    ConnectionStyleFormStringsType &
    CommonStringsType;
  language: string;
  mode: ModeType;
  onSaveSuccess?: () => void;
};

/**
 * Local discriminator used to route field updates to the right state slice.
 */
type DataSetName =
  | 'profileFormData'
  | 'educationFormData'
  | 'jobHistoryFormData';

const ProfessionalProfileForm = ({
  strings,
  language,
  mode,
  onSaveSuccess,
}: ProfessionalProfileFormProps) => {
  const userContext = useContext(UserContext);
  const useProfile = userContext.user.professional ?? blankProfessionalProfile;
  const profileFormStore = useFormStore(
    () => getProfessionalBaseFormState({ useProfile }),
    {
      privacyByField: loadModeFieldPrivacy(mode.id),
    }
  );
  const profileFormData = profileFormStore.getValues();
  const educationFormStore = useFormStore(() => ({ ...blankEducationData }));
  const jobHistoryFormStore = useFormStore(
    () => profileFormData.jobHistory[0] ?? { ...blankJobHistoryData }
  );
  const [saveStatus, setSaveStatus] = useState<SaveStatusState>('idle');
  const [saveErrorMessage, setSaveErrorMessage] = useState('');
  const [lastSaveWasIncomplete, setLastSaveWasIncomplete] = useState(false);

  const educationKeys = Object.keys(blankEducationData);
  const jobHistoryKeys = Object.keys(blankJobHistoryData);
  const theme = useTheme();

  /**
   * Derive the owning dataset name for a given field key.
   */
  const getDataSetName = (name: string): DataSetName =>
    educationKeys.includes(name)
      ? 'educationFormData'
      : jobHistoryKeys.includes(name)
      ? 'jobHistoryFormData'
      : 'profileFormData';

  /**
   * Return the strongly-typed dataset value for a given dataset name.
   */
  const getTypedDataSet = (dataSetName: DataSetName) =>
    dataSetName === 'educationFormData'
      ? educationFormStore.getValues()
      : dataSetName === 'jobHistoryFormData'
      ? jobHistoryFormStore.getValues()
      : profileFormStore.getValues();

  /**
   * Update only the corresponding dataset slice in the external stores.
   */
  const handleUpdatedValues = (
    updatedValues: DataSetType,
    dataSetName: DataSetName
  ) => {
    if (dataSetName === 'profileFormData') {
      profileFormStore.setValues(updatedValues as typeof profileFormData);
      return;
    }
    if (dataSetName === 'educationFormData') {
      educationFormStore.setValues(updatedValues as typeof blankEducationData);
      return;
    }
    jobHistoryFormStore.setValues(updatedValues as typeof blankJobHistoryData);
  };

  const selectEducationItem = useCallback(
    (item: EducationItemType) => {
      if (educationFormStore.getValues().id === item.id) {
        return;
      }
      educationFormStore.setValues({ ...item });
    },
    [educationFormStore]
  );

  const selectJobHistoryItem = useCallback(
    (item: JobHistoryItemType) => {
      if (jobHistoryFormStore.getValues().id === item.id) {
        return;
      }
      jobHistoryFormStore.setValues({ ...item });
    },
    [jobHistoryFormStore]
  );

  const addEducationData = () => {
    const newEducationData = baseAddEducationData({
      profileFormData: profileFormStore.getValues(),
      educationFormData: educationFormStore.getValues(),
      language,
    });
    profileFormStore.setValues((currentValues) => ({
      ...currentValues,
      education: newEducationData,
    }));
    educationFormStore.setValues({ ...blankEducationData });
  };

  const clearEducationData = () => {
    educationFormStore.setValues({ ...blankEducationData });
  };

  const deleteEducationData = (id: number) => {
    const newEducationData = baseDeleteEducationData({
      profileFormData: profileFormStore.getValues(),
      id,
    });
    profileFormStore.setValues((currentValues) => ({
      ...currentValues,
      education: newEducationData,
    }));
  };

  const saveEducationData = (id: number) => {
    const newEducationData = baseSaveEducationData({
      profileFormData: profileFormStore.getValues(),
      educationFormData: educationFormStore.getValues(),
      id,
    });
    profileFormStore.setValues((currentValues) => ({
      ...currentValues,
      education: newEducationData,
    }));
  };

  const addJobHistoryData = () => {
    const newJobHistoryData = baseAddJobHistoryData({
      profileFormData: profileFormStore.getValues(),
      jobHistoryFormData: jobHistoryFormStore.getValues(),
      language,
    });
    profileFormStore.setValues((currentValues) => ({
      ...currentValues,
      jobHistory: newJobHistoryData,
    }));
    jobHistoryFormStore.setValues({ ...blankJobHistoryData });
  };

  const clearJobHistoryData = () => {
    jobHistoryFormStore.setValues({ ...blankJobHistoryData });
  };

  const deleteJobHistoryData = (id: number) => {
    const newJobHistoryData = baseDeleteJobHistoryData({
      profileFormData: profileFormStore.getValues(),
      id,
    });
    profileFormStore.setValues((currentValues) => ({
      ...currentValues,
      jobHistory: newJobHistoryData,
    }));
  };

  const saveJobHistoryData = (id: number) => {
    const newJobHistoryData = baseSaveJobHistoryData({
      profileFormData: profileFormStore.getValues(),
      jobHistoryFormData: jobHistoryFormStore.getValues(),
      id,
    });
    profileFormStore.setValues((currentValues) => ({
      ...currentValues,
      jobHistory: newJobHistoryData,
    }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (saveStatus !== 'idle') setSaveStatus('idle');
    const {
      target: { name },
    } = e;
    const dataSetName = getDataSetName(name);
    if (dataSetName === 'profileFormData' && profileFormStore.getError(name)) {
      profileFormStore.clearError(name);
    }
    const useDataSet = getTypedDataSet(dataSetName);
    const updatedValues = baseHandleInputChange(
      e,
      useDataSet
    ) as typeof useDataSet;
    handleUpdatedValues(updatedValues, dataSetName);
  };

  const handleCheckboxChange = (
    name: string | string[],
    value: OptionType | string,
    dataSet:
      | ReturnType<typeof profileFormStore.getValues>
      | ReturnType<typeof educationFormStore.getValues>
      | ReturnType<
          typeof jobHistoryFormStore.getValues
        > = profileFormStore.getValues()
  ) => {
    if (saveStatus !== 'idle') setSaveStatus('idle');
    if (typeof name === 'string') {
      const dataSetName = getDataSetName(name);
      if (
        dataSetName === 'profileFormData' &&
        profileFormStore.getError(name)
      ) {
        profileFormStore.clearError(name);
      }
      const useDataSet = getTypedDataSet(dataSetName);
      const updatedValues = baseHandleCheckboxChange(
        name,
        value,
        useDataSet,
        language
      ) as typeof useDataSet;
      handleUpdatedValues(updatedValues, dataSetName);
      return;
    }
    const updatedValues = name.reduce(
      (accumulator, currentValue) =>
        baseHandleCheckboxChange(currentValue, value, accumulator, language),
      dataSet
    );
    handleUpdatedValues(updatedValues, 'profileFormData');
  };

  const handleAutocompleteChange = (
    name: string,
    value:
      | FormElementAutocompleteOptionType
      | FormElementAutocompleteOptionType[],
    multi = false
  ) => {
    if (saveStatus !== 'idle') setSaveStatus('idle');
    const dataSetName = getDataSetName(name);
    if (dataSetName === 'profileFormData' && profileFormStore.getError(name)) {
      profileFormStore.clearError(name);
    }
    const useDataSet = getTypedDataSet(dataSetName);
    const updatedValues = baseHandleAutocompleteChange({
      name,
      value,
      language,
      formData: useDataSet,
      multi,
    }) as typeof useDataSet;
    handleUpdatedValues(updatedValues, dataSetName);
  };

  const handleRepeatingListChange = (name: string, values: string[]) => {
    if (saveStatus !== 'idle') setSaveStatus('idle');
    const updatedValues = baseHandleRepeatingListChange(
      name,
      values,
      profileFormStore.getValues()
    );
    profileFormStore.setValues(updatedValues);
  };

  /**
   * Validate and persist the profile, then update save-state feedback.
   */
  const persistProfile = async () => {
    const currentProfileFormData = profileFormStore.getValues();
    const errors = validateProfileFormData(
      'professional',
      currentProfileFormData
    );
    profileFormStore.setErrors(errors);
    const hasValidationIssues = hasProfileValidationErrors(errors);
    setLastSaveWasIncomplete(hasValidationIssues);
    setSaveStatus('saving');
    setSaveErrorMessage('');
    const submission: ProfessionalProfileDataType =
      getProfessionalProfileSubmission({
        useProfile,
        profileFormData: currentProfileFormData,
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

  const professionalProfileMainFormConfig =
    getProfessionalProfileMainFormConfig({
      strings,
      profileFormData,
      language,
    });

  const professionalProfileAboutFormConfig =
    getProfessionalProfileAboutFormConfig({
      strings,
      profileFormData,
      language,
    });

  const professionalConnectionStyleFormConfig =
    getProfessionalConnectionStyleFormConfig({
      strings,
      profileFormData,
      language,
    });

  const professionalProfileHighlightsFormConfig =
    getProfessionalProfileHighlightsFormConfig({
      strings,
      profileFormData,
      language,
    });

  const renderProfileFormConfig = (config: FormElementConfigType[]) =>
    RenderFormElements({
      config,
      handleChange,
      handleCheckboxChange,
      handleAutocompleteChange,
      handleRepeatingListChange,
      strings,
      language,
      store: profileFormStore,
      handleFieldPrivacyChange,
    });

  const EducationSection = () => {
    const educationField = useFormFieldSnapshot(profileFormStore, 'education');
    const educationIdField = useFormFieldSnapshot(educationFormStore, 'id');
    const currentProfileValues = profileFormStore.getValues();
    const currentEducationValues = educationFormStore.getValues();
    const educationConfig = getProfessionalProfileEducationFormConfig({
      profileFormData: {
        ...currentProfileValues,
        education: Array.isArray(educationField.value)
          ? (educationField.value as typeof currentProfileValues.education)
          : currentProfileValues.education,
      },
      educationFormData: {
        ...currentEducationValues,
        id:
          typeof educationIdField.value === 'number'
            ? educationIdField.value
            : currentEducationValues.id,
      },
      strings,
      language,
      theme,
      addEducationData,
      clearEducationData,
      deleteEducationData,
      saveEducationData,
      setEducationFormData: selectEducationItem,
    });

    return (
      <RenderFormElements
        config={educationConfig}
        handleChange={handleChange}
        handleCheckboxChange={handleCheckboxChange}
        handleAutocompleteChange={handleAutocompleteChange}
        strings={strings}
        language={language}
        store={educationFormStore}
        privacyStore={profileFormStore}
        handleFieldPrivacyChange={handleFieldPrivacyChange}
      />
    );
  };

  const JobHistorySection = () => {
    const jobHistoryField = useFormFieldSnapshot(
      profileFormStore,
      'jobHistory'
    );
    const jobHistoryIdField = useFormFieldSnapshot(jobHistoryFormStore, 'id');
    const currentProfileValues = profileFormStore.getValues();
    const currentJobHistoryValues = jobHistoryFormStore.getValues();
    const jobHistoryConfig = getProfessionalProfileJobHistoryFormConfig({
      profileFormData: {
        ...currentProfileValues,
        jobHistory: Array.isArray(jobHistoryField.value)
          ? (jobHistoryField.value as typeof currentProfileValues.jobHistory)
          : currentProfileValues.jobHistory,
      },
      jobHistoryFormData: {
        ...currentJobHistoryValues,
        id:
          typeof jobHistoryIdField.value === 'number'
            ? jobHistoryIdField.value
            : currentJobHistoryValues.id,
      },
      strings,
      language,
      theme,
      addJobHistoryData,
      clearJobHistoryData,
      deleteJobHistoryData,
      saveJobHistoryData,
      setJobHistoryFormData: selectJobHistoryItem,
    });

    return (
      <RenderFormElements
        config={jobHistoryConfig}
        handleChange={handleChange}
        handleCheckboxChange={handleCheckboxChange}
        handleAutocompleteChange={handleAutocompleteChange}
        strings={strings}
        language={language}
        store={jobHistoryFormStore}
        privacyStore={profileFormStore}
        handleFieldPrivacyChange={handleFieldPrivacyChange}
      />
    );
  };

  const resolveSaveLabel = (
    key:
      | 'saveSuccess'
      | 'saveDraftSuccess'
      | 'saveError'
      | 'saveInProgress'
      | 'retry'
      | 'dismiss'
  ): string => strings[key]?.[language] ?? strings[key]?.en ?? '';

  const formStructure = [
    {
      key: 'main',
      content: renderProfileFormConfig(professionalProfileMainFormConfig),
    },
    {
      key: 'connection-style',
      title: strings.connectionStyleCommon.sectionTitle[language],
      content: renderProfileFormConfig(professionalConnectionStyleFormConfig),
    },
    {
      key: 'about',
      title: strings.questions.about.title[language],
      content: renderProfileFormConfig(professionalProfileAboutFormConfig),
    },
    {
      key: 'highlights',
      title: strings.questions.highlights.title[language],
      content: renderProfileFormConfig(professionalProfileHighlightsFormConfig),
    },
    {
      key: 'job-history',
      title: strings.questions.jobHistory.title[language],
      content: <JobHistorySection />,
    },
    {
      key: 'education',
      title: strings.questions.education.title[language],
      content: <EducationSection />,
    },
  ];

  return (
    <ProfileFormScaffold
      formId="professional-profile-form"
      language={language}
      modeId={mode.id}
      onDismissSaveStatus={() => setSaveStatus('idle')}
      onMutate={() => setSaveStatus('idle')}
      onRetry={() => void persistProfile()}
      onSubmit={handleSubmit}
      picturesFieldId="professional-profile-pictures-input"
      picturesFieldLabel={strings.questions.pictures[language]}
      saveStatus={saveStatus}
      saveStatusCopy={buildProfileSaveStatusCopy({
        getLabel: resolveSaveLabel,
        lastSaveWasIncomplete,
        saveErrorMessage,
      })}
      sections={formStructure}
      store={profileFormStore}
      strings={strings}
      submitLabel={strings.save[language]}
    />
  );
};

export default ProfessionalProfileForm;
