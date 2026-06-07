import type {
  DashboardStringsType,
  ProfileFreshnessStateType,
} from '../../../types';
import { formatDashboardTemplate } from './dashboardStrings';

/**
 * Resolve actionable freshness copy for dashboard guidance surfaces.
 */
export const buildProfileFreshnessDescription = ({
  freshness,
  language,
  strings,
}: {
  freshness: ProfileFreshnessStateType;
  language: string;
  strings: DashboardStringsType;
}): string => {
  if (freshness.status === 'stale') {
    return formatDashboardTemplate(
      strings.viewModels.freshness.staleDescriptionTemplate[language],
      {
        days: freshness.daysSinceUpdate ?? freshness.thresholdDays ?? 0,
      }
    );
  }

  if (freshness.status === 'due_soon') {
    if (typeof freshness.daysUntilDue === 'number') {
      return formatDashboardTemplate(
        strings.viewModels.freshness.dueSoonDescriptionTemplate[language],
        {
          days: Math.max(freshness.daysUntilDue, 1),
        }
      );
    }

    return strings.viewModels.freshness.missingTimestampDescription[language];
  }

  return '';
};

/**
 * Format the last saved freshness timestamp when one is available.
 */
export const buildProfileFreshnessTimestampLabel = ({
  freshness,
  language,
  strings,
}: {
  freshness: ProfileFreshnessStateType;
  language: string;
  strings: DashboardStringsType;
}): string => {
  if (!freshness.lastUpdatedAt) {
    return '';
  }

  const parsed = new Date(freshness.lastUpdatedAt);
  if (Number.isNaN(parsed.getTime())) {
    return '';
  }

  const formattedDate = new Intl.DateTimeFormat(language, {
    dateStyle: 'medium',
  }).format(parsed);

  return formatDashboardTemplate(
    strings.viewModels.freshness.lastUpdatedTemplate[language],
    {
      date: formattedDate,
    }
  );
};
