import { ProfileType } from '../../../../types';

/**
 * Check whether an open-value field contains at least one visible value.
 */
const hasOpenValue = (value: unknown): boolean => {
  if (Array.isArray(value)) {
    return Boolean(value[0]);
  }
  return Boolean(value);
};

/**
 * Determine whether the profile should render the demographics section.
 */
export function checkShowDemographics(profile: ProfileType) {
  let showDemographics = false;
  if (
    (profile.demographics?.ethnicity &&
      Boolean(profile.demographics.ethnicity[0])) ||
    Boolean(profile.demographics?.religion) ||
    Boolean(profile.demographics?.politicalLean) ||
    Boolean(profile.demographics?.occupation) ||
    Boolean(profile.demographics?.education) ||
    Boolean(profile.demographics?.currentEndeavor) ||
    (profile.demographics?.languages &&
      Boolean(profile.demographics?.languages[0]))
  )
    showDemographics = true;
  return showDemographics;
}

/**
 * Determine whether the profile should render the preferences section.
 */
export function checkShowPreferences(profile: ProfileType) {
  let showPreferences = false;
  if (
    Boolean(profile.preferences?.dietary) ||
    Boolean(profile.preferences?.tobacco) ||
    Boolean(profile.preferences?.alcohol) ||
    Boolean(profile.preferences?.cannabis)
  )
    showPreferences = true;
  return showPreferences;
}

/**
 * Determine whether the profile should render the home-life section.
 */
export function checkShowHomeLife(profile: ProfileType) {
  let showHomeLife = false;
  if (
    hasOpenValue(profile.homeLife?.kids) ||
    hasOpenValue(profile.homeLife?.cats) ||
    hasOpenValue(profile.homeLife?.dogs) ||
    hasOpenValue(profile.homeLife?.otherAnimals)
  )
    showHomeLife = true;
  return showHomeLife;
}
