export type LimitedResultModel<TItem> = {
  visibleItems: readonly TItem[];
  hiddenCount: number;
  totalCount: number;
};

export const mobileFeatureDisplayLimits = {
  entryResults: 50,
  relationshipResults: 40,
  pickerResults: 24,
  relationshipTargetOptions: 24,
  timelineGroupEvents: 12,
  timelineDiagnostics: 12,
  overviewSearchResults: 6,
  overviewIncompleteEntries: 5,
  orphanSummary: 12,
  detailSuggestions: 8,
  relationshipTypeSuggestions: 7,
  relationshipTextReviewItems: 6,
} as const;

export const featureDisplayScalePolicy = {
  paginationOrVirtualizationThreshold: 200,
  renderedPerformanceReviewThreshold: 500,
} as const;

export type FeatureDisplayScaleDecision = {
  requiresPaginationOrVirtualization: boolean;
  requiresRenderedPerformanceReview: boolean;
  reason: string;
};

export function getLimitedResultModel<TItem>(
  items: readonly TItem[],
  limit: number
): LimitedResultModel<TItem> {
  const safeLimit = Math.max(0, limit);
  const visibleItems = items.slice(0, safeLimit);
  return {
    visibleItems,
    hiddenCount: Math.max(0, items.length - visibleItems.length),
    totalCount: items.length,
  };
}

export function formatLimitedTextList({
  values,
  separator = ', ',
  limit,
}: {
  values: readonly string[];
  separator?: string;
  limit: number;
}): string {
  const visibleValues = values.slice(0, Math.max(0, limit));
  const hiddenCount = Math.max(0, values.length - visibleValues.length);
  if (visibleValues.length === 0) {
    return hiddenCount > 0 ? `and ${hiddenCount} more` : '';
  }
  return `${visibleValues.join(separator)}${
    hiddenCount > 0 ? `${separator}and ${hiddenCount} more` : ''
  }`;
}

export function pluralizeCountLabel(
  count: number,
  singularLabel: string,
  pluralLabel = `${singularLabel}s`
): string {
  return count === 1 ? singularLabel : pluralLabel;
}

export function getFeatureDisplayScaleDecision(
  totalCount: number
): FeatureDisplayScaleDecision {
  const safeTotalCount = Math.max(0, totalCount);
  const requiresPaginationOrVirtualization =
    safeTotalCount >
    featureDisplayScalePolicy.paginationOrVirtualizationThreshold;
  const requiresRenderedPerformanceReview =
    safeTotalCount >
    featureDisplayScalePolicy.renderedPerformanceReviewThreshold;
  if (requiresRenderedPerformanceReview) {
    return {
      requiresPaginationOrVirtualization,
      requiresRenderedPerformanceReview,
      reason:
        'Rendered performance must be reviewed before relying on display limits for this many records.',
    };
  }
  if (requiresPaginationOrVirtualization) {
    return {
      requiresPaginationOrVirtualization,
      requiresRenderedPerformanceReview,
      reason:
        'Use explicit pagination or virtualization instead of a display-only cap for this many records.',
    };
  }
  return {
    requiresPaginationOrVirtualization,
    requiresRenderedPerformanceReview,
    reason:
      'Display limits are acceptable when search or filtering keeps every record reachable.',
  };
}
