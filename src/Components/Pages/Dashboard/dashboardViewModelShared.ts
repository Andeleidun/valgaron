import type {
  DashboardGuidanceModeStringsType,
  DashboardStringsType,
  GroupType,
  ModeType,
  ProfileType,
  RelationshipStateType,
  TranslationStringType,
  UserType,
} from '../../../types';
import {
  renderValue,
  resolveGateActor,
  resolveVisibleProfileFieldValue,
} from '../../../Utlilities';
import { getProfilesForMode } from '../../../Utlilities/data';
import { getDashboardFallbackStrings } from './dashboardFallbacks';
import { formatDashboardTemplate } from './dashboardStrings';

/**
 * Shared inputs for dashboard view-model builders.
 */
export type DashboardViewModelBaseParamsType = {
  modeId: ModeType['id'];
  language: string;
  strings: DashboardStringsType;
  guidance?: DashboardGuidanceModeStringsType;
  user: UserType;
  relationshipState: RelationshipStateType;
};

const getTranslationValue = (
  translation: TranslationStringType,
  language: string
): string => translation[language] ?? translation.en ?? '';

/**
 * Build a mode-aware community action label using the active section noun.
 */
export const buildDashboardCommunityActionLabel = ({
  modeId,
  language,
  template,
}: {
  modeId: ModeType['id'];
  language: string;
  template: TranslationStringType;
}): string =>
  formatDashboardTemplate(getTranslationValue(template, language), {
    section: getTranslationValue(
      getDashboardFallbackStrings().pages[modeId].community,
      language
    ),
  });

/**
 * Build privacy-safe profile copy for dashboard list rows and notifications.
 */
export const getVisibleProfileSummary = ({
  profile,
  viewer,
  isConnection,
  language,
  strings,
}: {
  profile: ProfileType;
  viewer?: ProfileType;
  isConnection: boolean;
  language: string;
  strings: DashboardStringsType;
}): { name: string; subtitle: string } => {
  const viewerActor = resolveGateActor(viewer);
  const name =
    resolveVisibleProfileFieldValue({
      profile,
      fieldName: 'name',
      value: profile.name,
      language,
      viewer: viewerActor,
      isConnection,
    }) || strings.viewModels.defaults.unnamedProfile[language];
  const location = resolveVisibleProfileFieldValue({
    profile,
    fieldName: 'location',
    value: profile.main?.location,
    language,
    viewer: viewerActor,
    isConnection,
  });
  const seeking = resolveVisibleProfileFieldValue({
    profile,
    fieldName: 'seeking',
    value: profile.main?.seeking,
    language,
    viewer: viewerActor,
    isConnection,
  });
  const selfSummary =
    'prompts' in profile
      ? resolveVisibleProfileFieldValue({
          profile,
          fieldName: 'selfSummary',
          value: profile.prompts?.selfSummary,
          language,
          viewer: viewerActor,
          isConnection,
        })
      : '';

  return {
    name,
    subtitle:
      location ||
      seeking ||
      selfSummary ||
      strings.viewModels.defaults.profileReadyToReview[language],
  };
};

/**
 * Build a short subtitle for a group row or preview.
 */
export const getGroupSubtitle = ({
  group,
  language,
  strings,
}: {
  group: GroupType;
  language: string;
  strings: DashboardStringsType;
}): string =>
  renderValue(language, group.category) ||
  renderValue(language, group.location) ||
  formatDashboardTemplate(
    strings.viewModels.defaults.groupMembersTemplate[language],
    {
      count: group.members.length,
    }
  );

/**
 * Resolve a mode's profiles into an id-indexed map.
 */
export const getProfileMap = (
  modeId: ModeType['id']
): Map<string, ProfileType> =>
  new Map(
    getProfilesForMode(modeId).map((profile) => [profile.id, profile] as const)
  );
