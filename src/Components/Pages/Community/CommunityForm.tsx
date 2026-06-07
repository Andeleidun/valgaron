import React, { useEffect, useMemo, useState } from 'react';
import {
  GroupType,
  GroupFormType,
  ProfileStringsType,
  ModeType,
  OptionType,
  StringOrOptionType,
  CommonStringsType,
  ArrayElementType,
  InteractionGateType,
} from '../../../types';
import {
  Grid,
  GridItem,
  Button,
  Card,
  CardContent,
  Text,
  useToast,
} from '../../Common';
import InteractionGateNotice from '../../Common/InteractionGateNotice';
import {
  RenderFormElements,
  type FormElementAutocompleteOptionType,
  baseHandleAutocompleteChange,
  baseHandleCheckboxChange,
  baseHandleInputChange,
} from '../../Common/FormElements';
import { useTheme } from '@mui/material/styles';
import { GetThemeOptionsType, renderValue } from '../../../Utlilities';
import { baseGroupData, baseGroupFormData } from '../../../Utlilities/models';
import { getModeHobbyValues } from '../Profile/ProfileFormHelper';

type CommunityFormProps = {
  commonStrings: CommonStringsType;
  profileStrings: ProfileStringsType;
  language: string;
  mode: ModeType;
  onSubmitGroup: (group: GroupType) => void;
  initialGroup?: GroupType;
  submitLabel?: string;
  interactionGate?: InteractionGateType;
};

/**
 * Community group creation/edit form.
 */
const CommunityForm = ({
  commonStrings,
  profileStrings,
  language,
  mode,
  onSubmitGroup,
  initialGroup,
  submitLabel,
  interactionGate,
}: CommunityFormProps) => {
  const { pushToast } = useToast();
  const modeHobbyValues = useMemo(() => getModeHobbyValues(mode.id), [mode.id]);
  const hobbiesOptions = useMemo(
    () =>
      profileStrings.common.hobbiesOptions.filter((option) =>
        modeHobbyValues.includes(option.value)
      ),
    [modeHobbyValues, profileStrings.common.hobbiesOptions]
  );
  const modeHobbyOptions = useMemo(
    () =>
      hobbiesOptions.map((option) => ({
        value: option.value,
        label: option.label,
      })),
    [hobbiesOptions]
  );
  const groupTypeOptions = useMemo(() => {
    const seekingOptions =
      profileStrings[mode.id]?.questions?.main?.seekingOptions ?? [];
    return seekingOptions.map((option) => ({
      value: option.value,
      label: option.label[language],
    }));
  }, [language, mode.id, profileStrings]);

  const [groupFormData, setGroupFormData] = useState<GroupFormType>({
    ...baseGroupFormData,
    tagsOptions: modeHobbyOptions,
  });
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string | undefined>
  >({});

  const theme: GetThemeOptionsType = useTheme();
  const strings = commonStrings;
  const isInteractionLocked = interactionGate?.isLocked ?? false;
  const getCommonLabel = (key: string): string =>
    strings[key]?.[language] ?? strings[key]?.en ?? '';

  /**
   * Read a string value from mixed option or translation inputs.
   */
  const readTextValue = (value: StringOrOptionType): string => {
    if (typeof value === 'string') {
      return value.trim();
    }
    return renderValue(language, value).trim();
  };

  /**
   * Validate required group form fields.
   */
  const validateGroupForm = (
    formData: GroupFormType
  ): Record<string, string> => {
    const errors: Record<string, string> = {};
    if (!formData.groupName.trim()) {
      errors.groupName = getCommonLabel('groupNameRequired');
    }
    if (!formData.description.trim()) {
      errors.description = getCommonLabel('descriptionRequired');
    }
    if (!readTextValue(formData.category)) {
      errors.category = getCommonLabel('categoryRequired');
    }
    if (!readTextValue(formData.location)) {
      errors.location = getCommonLabel('locationRequired');
    }
    if (!readTextValue(formData.groupType)) {
      errors.groupType = getCommonLabel('groupTypeRequired');
    }
    return errors;
  };

  /**
   * Handle text input changes for group form fields.
   */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const updatedValues = baseHandleInputChange(e, groupFormData);
    const { name } = e.target;
    if (validationErrors[name]) {
      setValidationErrors((prev) => ({ ...prev, [name]: undefined }));
    }
    setGroupFormData(updatedValues as GroupFormType);
  };

  /**
   * Handle checkbox value changes for multi-select fields.
   */
  const handleCheckboxChange = (
    name: string | string[],
    value: OptionType | string
  ) => {
    if (typeof name === 'string') {
      if (validationErrors[name]) {
        setValidationErrors((prev) => ({ ...prev, [name]: undefined }));
      }
      const updatedValues = baseHandleCheckboxChange(
        name,
        value,
        groupFormData,
        language
      );
      setGroupFormData(updatedValues as GroupFormType);
      return;
    }
    const updatedValues = name.reduce<GroupFormType>(
      (accumulator, currentValue) =>
        baseHandleCheckboxChange(
          currentValue,
          value,
          accumulator,
          language
        ) as GroupFormType,
      groupFormData
    );
    setGroupFormData(updatedValues);
  };

  /**
   * Handle autocomplete changes for single or multi-value fields.
   */
  const handleAutocompleteChange = (
    name: string,
    value:
      | FormElementAutocompleteOptionType
      | FormElementAutocompleteOptionType[],
    multi = false
  ) => {
    if (validationErrors[name]) {
      setValidationErrors((prev) => ({ ...prev, [name]: undefined }));
    }
    const updatedValues = baseHandleAutocompleteChange({
      name,
      value,
      language,
      formData: groupFormData,
      multi,
    });
    setGroupFormData(updatedValues as GroupFormType);
  };

  /**
   * Build a GroupType submission payload from the current form state.
   */
  const buildGroupSubmission = (formData: GroupFormType): GroupType => {
    const submissionBase: GroupType = initialGroup
      ? { ...initialGroup }
      : {
          ...baseGroupData,
          id: `${Date.now()}`,
          createdAt: new Date(),
          mode: mode.id,
        };

    return {
      ...submissionBase,
      groupName: formData.groupName,
      groupPicture: formData.groupPicture,
      description: formData.description,
      category: formData.category,
      location: formData.location,
      groupType: formData.groupType,
      interests: formData.interests,
      rules: formData.rules,
      tags: formData.tags,
      starredTags: formData.starredTags,
      admins: submissionBase.admins ?? [],
      chatRooms: submissionBase.chatRooms ?? [],
      members: submissionBase.members ?? [],
      createdAt: submissionBase.createdAt ?? new Date(),
      mode: initialGroup?.mode ?? mode.id,
    };
  };

  /**
   * Map a group into form state.
   */
  const mapGroupToForm = (group: GroupType): GroupFormType => ({
    ...baseGroupFormData,
    groupName: group.groupName,
    groupPicture: group.groupPicture,
    description: group.description,
    category: group.category,
    location: group.location,
    groupType: group.groupType,
    interests: group.interests,
    rules: group.rules,
    tags: group.tags,
    starredTags: group.starredTags ?? [],
    tagsOptions: modeHobbyOptions,
  });

  /**
   * Handle community form submission.
   */
  const handleSubmit = (event?: React.FormEvent<HTMLDivElement>) => {
    event?.preventDefault();
    if (isInteractionLocked) {
      return;
    }
    const errors = validateGroupForm(groupFormData);
    setValidationErrors(errors);
    if (Object.keys(errors).length > 0) {
      pushToast(getCommonLabel('completeRequiredFields'));
      return;
    }
    const submission = buildGroupSubmission(groupFormData);
    onSubmitGroup(submission);
    setGroupFormData({
      ...baseGroupFormData,
      tagsOptions: modeHobbyOptions,
    });
    setValidationErrors({});
    pushToast(getCommonLabel('groupSaved'));
  };

  /**
   * Handle submit clicks to ensure the form saves on button press.
   */
  const handleSubmitClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    handleSubmit();
  };

  /**
   * Sync form state when editing an existing group.
   */
  useEffect(() => {
    if (!initialGroup) return;
    setGroupFormData(mapGroupToForm(initialGroup));
  }, [initialGroup, modeHobbyOptions]);

  const groupMainFormConfig = [
    {
      type: 'text',
      name: 'groupName',
      label: getCommonLabel('groupNameLabel'),
      value: groupFormData.groupName,
      id: 'group-name-input',
    },
    {
      type: 'text',
      name: 'description',
      label: getCommonLabel('groupDescriptionLabel'),
      value: groupFormData.description,
      id: 'group-description-input',
      multiline: true,
      rows: 4,
      md: 12,
    },
    {
      type: 'text',
      name: 'category',
      label: getCommonLabel('categoryLabel'),
      value: groupFormData.category,
      id: 'group-category-input',
    },
    {
      type: 'text',
      name: 'location',
      label: getCommonLabel('locationLabel'),
      value: groupFormData.location,
      id: 'group-location-input',
    },
    {
      type: 'autocomplete',
      name: 'groupType',
      label: getCommonLabel('groupTypeLabel'),
      value: groupFormData.groupType,
      options: groupTypeOptions,
      id: 'group-groupType-autocomplete',
    },
    {
      type: 'autocomplete',
      name: 'interests',
      label: getCommonLabel('interestsLabel'),
      value: groupFormData.interests,
      options: modeHobbyOptions,
      id: 'group-interests-autocomplete',
      multiple: true,
      md: 12,
    },
    {
      type: 'checkboxGroup',
      name: 'tags',
      label: getCommonLabel('tagsLabel'),
      options: groupFormData.tagsOptions,
      starName: 'starredTags',
      checkedState: groupFormData.tags,
      starredState: groupFormData.starredTags,
      id: 'group-tags-checkbox',
      md: 12,
      trailingInput: true,
      addlabel: strings.add[language],
      optionsName: 'tagsOptions',
    },
    {
      type: 'text',
      name: 'rules',
      label: getCommonLabel('rulesLabel'),
      value: groupFormData.rules,
      id: 'group-rules-input',
      multiline: true,
      rows: 3,
      md: 12,
    },
    {
      type: 'text',
      name: 'groupPicture',
      label: getCommonLabel('groupPictureUrlLabel'),
      value: groupFormData.groupPicture,
      id: 'group-picture-input',
      md: 12,
    },
  ];

  /**
   * Attach validation error metadata to form config items.
   */
  const applyValidationErrors = <
    TItem extends {
      name?: string;
      type?: string;
      error?: boolean;
      helperText?: string;
    }
  >(
    config: TItem[],
    errors: Record<string, string | undefined>
  ): TItem[] =>
    config.map((item) => {
      if (!item.name) return item;
      if (
        item.type !== 'text' &&
        item.type !== 'select' &&
        item.type !== 'autocomplete'
      ) {
        return item;
      }
      const message = errors[item.name];
      return message
        ? { ...item, error: true, helperText: message }
        : { ...item, error: false, helperText: undefined };
    });

  const groupMainFormConfigWithValidation = applyValidationErrors(
    groupMainFormConfig,
    validationErrors
  ).map((item) => ({
    ...item,
    disabled:
      isInteractionLocked || Boolean((item as { disabled?: boolean }).disabled),
    trailingInput: isInteractionLocked
      ? false
      : (item as { trailingInput?: boolean }).trailingInput,
  }));

  const formStructure = [
    {
      config: groupMainFormConfigWithValidation,
    },
  ];

  const renderFormConfig = (
    config: ArrayElementType<typeof formStructure>['config']
  ) =>
    RenderFormElements({
      config,
      handleChange,
      handleCheckboxChange,
      handleAutocompleteChange,
      strings,
      language,
    });

  const showPreview =
    groupFormData.groupName ||
    groupFormData.description ||
    groupFormData.location ||
    groupFormData.category;

  return (
    <Grid component="form" onSubmit={handleSubmit} spacing={4} id="group-form">
      {formStructure.map((value, index) => (
        <GridItem container xs={12} key={`${index}-group-form-section`}>
          {renderFormConfig(value.config)}
        </GridItem>
      ))}
      {showPreview ? (
        <GridItem xs={12}>
          <Card className="community-preview">
            <CardContent>
              <Text>{getCommonLabel('preview')}</Text>
              <Text>
                {groupFormData.groupName || getCommonLabel('groupNameLabel')}
              </Text>
              <Text>
                {groupFormData.description ||
                  getCommonLabel('groupDescriptionLabel')}
              </Text>
              <Text>
                {renderValue(language, groupFormData.category) ||
                  getCommonLabel('categoryLabel')}
              </Text>
              <Text>
                {renderValue(language, groupFormData.location) ||
                  getCommonLabel('locationLabel')}
              </Text>
            </CardContent>
          </Card>
        </GridItem>
      ) : null}
      {interactionGate?.isLocked ? (
        <GridItem xs={12}>
          <InteractionGateNotice gate={interactionGate} variant="body2" />
        </GridItem>
      ) : null}
      <GridItem xs={12}>
        <Button
          type="submit"
          onClick={handleSubmitClick}
          disabled={isInteractionLocked}
          sx={{
            background: theme.palette.primary.main,
            padding: '5px 40px',
          }}
        >
          {submitLabel ?? strings.save[language]}
        </Button>
      </GridItem>
    </Grid>
  );
};

export default CommunityForm;
