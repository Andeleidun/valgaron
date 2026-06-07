import React from 'react';
import { Grid, GridItem, Select } from '..';
import type {
  OptionType,
  ProfileFieldPrivacyLevelType,
  StringOrOptionType,
} from '../../../types';
import { renderValue } from '../../../Utlilities';
import type { FormElementsStringsType } from './FormElements';

type ProfileFieldWithPrivacyProps = {
  control: React.ReactNode;
  fieldName?: string;
  fieldLabel?: StringOrOptionType;
  language: string;
  strings: FormElementsStringsType;
  selectedLevel?: ProfileFieldPrivacyLevelType;
  privacyByField?: Record<string, ProfileFieldPrivacyLevelType>;
  handleFieldPrivacyChange?: (
    fieldName: string,
    level: ProfileFieldPrivacyLevelType
  ) => void;
};

/**
 * Build the shared profile-field visibility options for edit forms.
 */
export const getProfilePrivacyOptions = (
  strings: FormElementsStringsType
): OptionType[] => [
  {
    value: 'open',
    label: {
      en: strings.privacyOpen?.en ?? '',
      es: strings.privacyOpen?.es ?? '',
      de: strings.privacyOpen?.de ?? '',
    },
  },
  {
    value: 'connections_only',
    label: {
      en: strings.privacyConnectionsOnly?.en ?? '',
      es: strings.privacyConnectionsOnly?.es ?? '',
      de: strings.privacyConnectionsOnly?.de ?? '',
    },
  },
  {
    value: 'verified_only',
    label: {
      en: strings.privacyVerifiedOnly?.en ?? '',
      es: strings.privacyVerifiedOnly?.es ?? '',
      de: strings.privacyVerifiedOnly?.de ?? '',
    },
  },
];

/**
 * Build a specific visibility label for the linked profile field.
 */
const getPrivacyFieldLabel = ({
  fieldLabel,
  language,
  strings,
}: {
  fieldLabel?: StringOrOptionType;
  language: string;
  strings: FormElementsStringsType;
}): string => {
  const visibilityLabel = renderValue(
    language,
    strings.privacyVisibility
  ).trim();
  const resolvedFieldLabel = renderValue(language, fieldLabel).trim();
  if (!resolvedFieldLabel) {
    return visibilityLabel;
  }
  if (!visibilityLabel) {
    return resolvedFieldLabel;
  }
  return `${visibilityLabel}: ${resolvedFieldLabel}`;
};

/**
 * Render a standard profile field beside its field-visibility selector.
 */
export const ProfileFieldWithPrivacy = ({
  control,
  fieldName,
  fieldLabel,
  language,
  strings,
  selectedLevel,
  privacyByField = {},
  handleFieldPrivacyChange,
}: ProfileFieldWithPrivacyProps): JSX.Element => {
  if (!fieldName || !handleFieldPrivacyChange) {
    return <>{control}</>;
  }

  const resolvedSelectedLevel =
    selectedLevel ?? privacyByField[fieldName] ?? 'open';
  const privacyLabel = getPrivacyFieldLabel({
    fieldLabel,
    language,
    strings,
  });

  return (
    <div data-testid={`field-with-privacy-${fieldName}`}>
      <Grid spacing={1.5} alignItems="stretch">
        <GridItem xs={8} md={8} sx={{ display: 'flex' }}>
          <div style={{ width: '100%' }}>{control}</div>
        </GridItem>
        <GridItem xs={4} md={4} sx={{ display: 'flex' }}>
          <div style={{ width: '100%' }}>
            <Select
              id={`${fieldName}-privacy-select`}
              name={`${fieldName}Privacy`}
              language={language}
              label={privacyLabel}
              value={resolvedSelectedLevel}
              options={getProfilePrivacyOptions(strings)}
              onChange={(event) =>
                handleFieldPrivacyChange(
                  fieldName,
                  event.target.value as ProfileFieldPrivacyLevelType
                )
              }
            />
          </div>
        </GridItem>
      </Grid>
    </div>
  );
};
