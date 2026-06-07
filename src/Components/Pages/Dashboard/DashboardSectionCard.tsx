import type { ReactNode } from 'react';
import { Card, CardContent, Text } from '../../';

type DashboardSectionCardProps = {
  title?: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
};

/**
 * Shared section card for dashboard content blocks.
 */
const DashboardSectionCard = ({
  title,
  subtitle,
  action,
  children,
}: DashboardSectionCardProps) => (
  <Card sx={{ height: '100%' }}>
    <CardContent>
      {title || action ? (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: 12,
            marginBottom: subtitle ? 12 : 16,
          }}
        >
          <div style={{ display: 'grid', gap: 4, flex: '1 1 auto' }}>
            {title ? <Text variant="h6">{title}</Text> : null}
            {subtitle ? (
              <Text variant="body2" color="text.secondary">
                {subtitle}
              </Text>
            ) : null}
          </div>
          {action}
        </div>
      ) : null}
      {children}
    </CardContent>
  </Card>
);

export default DashboardSectionCard;
