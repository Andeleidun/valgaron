import { fetchGroups, getProfilesForMode } from '../../../Utlilities/data';
import { GroupType, ModeType, ProfileType } from '../../../types';

/**
 * Return seeded discovery profiles for the active mode.
 */
export function fetchProfileData(mode: ModeType) {
  switch (mode.id) {
    case 'dating':
    case 'friends':
    case 'academic':
    case 'professional':
    case 'neighborhood':
      return getProfilesForMode(mode.id);
    default: {
      return null;
    }
  }
}

/**
 * Return seeded discovery profiles asynchronously without artificial delay.
 */
export async function fetchProfileDataAsync(
  mode: ModeType
): Promise<ProfileType[] | null> {
  return Promise.resolve(fetchProfileData(mode));
}

/**
 * Return seeded community data for the active mode.
 */
export function fetchCommunityData(mode: ModeType) {
  switch (mode.id) {
    case 'dating':
    case 'friends':
    case 'academic':
    case 'professional':
    case 'neighborhood':
      return null;
    default: {
      return null;
    }
  }
}

/**
 * Return seeded communities asynchronously without artificial delay.
 */
export async function fetchCommunityDataAsync(
  mode: ModeType
): Promise<GroupType[] | null> {
  return fetchGroups(mode.id);
}
