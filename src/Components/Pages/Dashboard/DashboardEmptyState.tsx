import { Button, Text } from '../../';

type DashboardEmptyStateProps = {
  title: string;
  description: string;
  ctaLabel?: string;
  onCta?: () => void;
};

/**
 * Shared empty state for dashboard sections without list content.
 */
const DashboardEmptyState = ({
  title,
  description,
  ctaLabel,
  onCta,
}: DashboardEmptyStateProps) => (
  <div
    style={{
      border: '1px dashed rgba(0, 0, 0, 0.18)',
      borderRadius: 12,
      padding: 20,
      display: 'grid',
      gap: 12,
    }}
  >
    <Text variant="h6">{title}</Text>
    <Text variant="body2" color="text.secondary">
      {description}
    </Text>
    {ctaLabel && onCta ? (
      <div>
        <Button onClick={onCta}>{ctaLabel}</Button>
      </div>
    ) : null}
  </div>
);

export default DashboardEmptyState;
