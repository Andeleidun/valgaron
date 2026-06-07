import type { ReactNode } from 'react';
import { Grid, GridItem, Text } from '../../';

type DashboardPageHeaderProps = {
  title: string;
  subtitle?: string;
  details?: ReactNode;
  actions?: ReactNode;
  controls?: ReactNode;
};

/**
 * Shared dashboard header with an optional actions row and auxiliary controls.
 */
const DashboardPageHeader = ({
  title,
  subtitle,
  details,
  actions,
  controls,
}: DashboardPageHeaderProps) => (
  <Grid spacing={1.5}>
    <GridItem xs={12} md={controls ? 7 : 12}>
      <Text variant="h4">{title}</Text>
      {subtitle ? (
        <Text variant="body1" color="text.secondary" sx={{ mt: 0.75 }}>
          {subtitle}
        </Text>
      ) : null}
      {details ? <div style={{ marginTop: 16 }}>{details}</div> : null}
    </GridItem>
    {controls ? (
      <GridItem xs={12} md={5}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            height: '100%',
          }}
        >
          {controls}
        </div>
      </GridItem>
    ) : null}
    {actions ? (
      <GridItem xs={12}>
        <div
          style={{
            display: 'flex',
            gap: 12,
            flexWrap: 'wrap',
          }}
        >
          {actions}
        </div>
      </GridItem>
    ) : null}
  </Grid>
);

export default DashboardPageHeader;
