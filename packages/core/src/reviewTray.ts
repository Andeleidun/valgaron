export type ReviewTraySeverity = 'info' | 'warning' | 'critical';

export type ReviewTraySummaryInput = {
  id: string;
  title: string;
  count: number;
  countLabel?: string;
  detail: string;
  severity?: ReviewTraySeverity;
  actionLabel?: string;
};

export type ReviewTraySummaryItem = Omit<
  ReviewTraySummaryInput,
  'countLabel'
> & {
  hasIssues: boolean;
  countLabel: string;
  severity: ReviewTraySeverity;
};

export type ReviewTraySummaryModel = {
  items: readonly ReviewTraySummaryItem[];
  totalIssueCount: number;
  hasIssues: boolean;
};

export function getReviewTraySummaryModel(
  items: readonly ReviewTraySummaryInput[]
): ReviewTraySummaryModel {
  const normalizedItems = items.map((item) => ({
    ...item,
    countLabel: item.countLabel ?? String(item.count),
    hasIssues: item.count > 0,
    severity: item.severity ?? (item.count > 0 ? 'warning' : 'info'),
  }));
  return {
    items: normalizedItems,
    totalIssueCount: normalizedItems.reduce(
      (total, item) => total + item.count,
      0
    ),
    hasIssues: normalizedItems.some((item) => item.hasIssues),
  };
}
