import type {
  DashboardConnectionsTabType,
  DashboardConnectionsViewModelType,
  DashboardPersonListItemType,
} from '../../../types';
import { getDashboardFallbackStrings } from './dashboardFallbacks';
import { selectRelationshipCounts } from './dashboardSelectors';
import { formatDashboardTemplate } from './dashboardStrings';
import {
  type DashboardViewModelBaseParamsType,
  getProfileMap,
  getVisibleProfileSummary,
} from './dashboardViewModelShared';

/**
 * Build the dashboard connections page model.
 */
export const buildDashboardConnectionsViewModel = ({
  modeId,
  activeTab,
  language,
  strings = getDashboardFallbackStrings().dashboard,
  user,
  relationshipState,
}: DashboardViewModelBaseParamsType & {
  activeTab: DashboardConnectionsTabType;
}): DashboardConnectionsViewModelType => {
  const counts = selectRelationshipCounts({
    modeId,
    relationshipState,
  });
  const modeState = relationshipState.byMode[modeId];
  const profiles = getProfileMap(modeId);
  const viewerProfile = user[modeId];
  const buildPersonItem = (
    profileId: string,
    labels: {
      status: string;
      primary?: string;
      secondary?: string;
      helperText?: string;
      primaryDisabled?: boolean;
    }
  ): DashboardPersonListItemType | null => {
    const profile = profiles.get(profileId);
    if (!profile) {
      return null;
    }
    const visibleSummary = getVisibleProfileSummary({
      profile,
      viewer: viewerProfile,
      isConnection: modeState.connectionIds.includes(profile.id),
      language,
      strings,
    });
    return {
      id: profile.id,
      name: visibleSummary.name,
      subtitle: visibleSummary.subtitle,
      imageUrl: profile.pictures?.[0],
      statusLabel: labels.status,
      helperText: labels.helperText,
      primaryAction: labels.primary
        ? {
            label: labels.primary,
            disabled: labels.primaryDisabled,
          }
        : undefined,
      secondaryAction: labels.secondary
        ? {
            label: labels.secondary,
          }
        : undefined,
    };
  };

  const itemsByTab: Record<
    DashboardConnectionsTabType,
    DashboardPersonListItemType[]
  > = {
    connections: modeState.connectionIds
      .map((profileId) =>
        buildPersonItem(profileId, {
          status: strings.viewModels.connections.connected[language],
          primary: strings.viewModels.connections.message[language],
        })
      )
      .filter((item): item is DashboardPersonListItemType => Boolean(item)),
    interested: modeState.incomingInterestIds
      .map((profileId) =>
        buildPersonItem(profileId, {
          status: strings.viewModels.connections.interestedInYou[language],
          primary: strings.viewModels.connections.connect[language],
          secondary: strings.viewModels.connections.decline[language],
        })
      )
      .filter((item): item is DashboardPersonListItemType => Boolean(item)),
    requests: [
      ...modeState.incomingConnectionRequestIds
        .map((profileId) =>
          buildPersonItem(profileId, {
            status: strings.viewModels.connections.incomingRequest[language],
            primary: strings.viewModels.connections.accept[language],
            helperText:
              strings.viewModels.connections.incomingRequestHelper[language],
          })
        )
        .filter((item): item is DashboardPersonListItemType => Boolean(item)),
      ...modeState.outgoingConnectionRequestIds
        .map((profileId) =>
          buildPersonItem(profileId, {
            status: strings.viewModels.connections.requestSent[language],
            primary: strings.viewModels.connections.sent[language],
            helperText:
              strings.viewModels.connections.requestSentHelper[language],
            primaryDisabled: true,
          })
        )
        .filter((item): item is DashboardPersonListItemType => Boolean(item)),
    ],
  };

  return {
    activeTab,
    counts,
    items: itemsByTab[activeTab],
  };
};

/**
 * Build summary copy for the connections header.
 */
export const buildConnectionsSubtitle = ({
  modeId,
  language,
  strings = getDashboardFallbackStrings().dashboard,
  relationshipState,
}: Omit<DashboardViewModelBaseParamsType, 'user'>): string => {
  const counts = selectRelationshipCounts({
    modeId,
    relationshipState,
  });
  return formatDashboardTemplate(
    strings.viewModels.summaries.connectionsTemplate[language],
    {
      connections: counts.connections,
      interested: counts.interested,
      requests: counts.requests,
    }
  );
};
