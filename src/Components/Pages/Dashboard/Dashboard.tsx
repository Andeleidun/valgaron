import { useEffect } from 'react';
import type {
  CommonStringsType,
  DashboardGuidanceStringsType,
  DashboardStringsType,
  ModeType,
} from '../../../types';
import { emitWhoTelemetryEvent } from '../../../Utlilities/telemetry';
import DashboardOverview from './DashboardOverview';

type DashboardProps = {
  mode: ModeType;
  strings: {
    dashboard: DashboardStringsType;
    dashboardGuidance: DashboardGuidanceStringsType;
    common: CommonStringsType;
  };
  language: string;
};

/**
 * Routed dashboard overview entry point.
 */
function Dashboard({ mode, strings, language }: DashboardProps) {
  useEffect(() => {
    emitWhoTelemetryEvent({
      type: 'dashboard_viewed',
      modeId: mode.id,
    });
  }, [mode.id]);

  return (
    <DashboardOverview mode={mode} strings={strings} language={language} />
  );
}

export default Dashboard;
