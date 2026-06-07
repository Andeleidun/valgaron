import type { ModeType, ProfileFieldPrivacyLevelType } from '../../../types';
import { isProfileFieldPrivacyLevel } from '../../../Utlilities';

/**
 * Local persistence for field-level profile visibility overrides.
 *
 * The current app stores these preferences separately from the main user
 * profile payload so forms can preserve per-field choices across saves.
 */
const PROFILE_FIELD_PRIVACY_STORAGE_KEY = 'whoProfileFieldPrivacy';

type ModeFieldPrivacyType = Record<string, ProfileFieldPrivacyLevelType>;
type ProfileFieldPrivacyStoreType = Partial<
  Record<ModeType['id'], ModeFieldPrivacyType>
>;

/**
 * Load stored field-privacy settings for a specific mode.
 */
export const loadModeFieldPrivacy = (
  modeId: ModeType['id']
): ModeFieldPrivacyType => {
  if (typeof window === 'undefined' || !window.localStorage) return {};
  const rawStore = window.localStorage.getItem(
    PROFILE_FIELD_PRIVACY_STORAGE_KEY
  );
  if (!rawStore) return {};

  try {
    const parsedStore: unknown = JSON.parse(rawStore);
    if (!parsedStore || typeof parsedStore !== 'object') return {};
    const modeStore = (parsedStore as ProfileFieldPrivacyStoreType)[modeId];
    if (!modeStore || typeof modeStore !== 'object') return {};
    return Object.entries(modeStore).reduce<ModeFieldPrivacyType>(
      (accumulator, [fieldName, level]) => {
        if (isProfileFieldPrivacyLevel(level)) {
          accumulator[fieldName] = level;
        }
        return accumulator;
      },
      {}
    );
  } catch {
    return {};
  }
};

/**
 * Persist one field-privacy choice for a specific mode.
 */
export const persistModeFieldPrivacy = ({
  modeId,
  fieldName,
  level,
}: {
  modeId: ModeType['id'];
  fieldName: string;
  level: ProfileFieldPrivacyLevelType;
}): void => {
  if (typeof window === 'undefined' || !window.localStorage) return;

  const existingStore = readStore();
  const nextStore: ProfileFieldPrivacyStoreType = {
    ...existingStore,
    [modeId]: {
      ...(existingStore[modeId] ?? {}),
      [fieldName]: level,
    },
  };
  window.localStorage.setItem(
    PROFILE_FIELD_PRIVACY_STORAGE_KEY,
    JSON.stringify(nextStore)
  );
};

/**
 * Read privacy settings store from local storage.
 */
const readStore = (): ProfileFieldPrivacyStoreType => {
  if (typeof window === 'undefined' || !window.localStorage) return {};
  const rawStore = window.localStorage.getItem(
    PROFILE_FIELD_PRIVACY_STORAGE_KEY
  );
  if (!rawStore) return {};
  try {
    const parsedStore: unknown = JSON.parse(rawStore);
    if (!parsedStore || typeof parsedStore !== 'object') return {};
    return parsedStore as ProfileFieldPrivacyStoreType;
  } catch {
    return {};
  }
};
