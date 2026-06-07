import type { ReactNode } from 'react';
import { Card, CardContent, Text } from '../../';

type DashboardPreviewPanelProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
};

/**
 * Shared right-rail preview surface used by dashboard workspaces.
 */
const DashboardPreviewPanel = ({
  title,
  subtitle,
  children,
}: DashboardPreviewPanelProps) => (
  <Card sx={{ position: 'sticky', top: 16 }}>
    <CardContent>
      <Text variant="h6">{title}</Text>
      {subtitle ? (
        <Text variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {subtitle}
        </Text>
      ) : null}
      {children}
    </CardContent>
  </Card>
);

export default DashboardPreviewPanel;
