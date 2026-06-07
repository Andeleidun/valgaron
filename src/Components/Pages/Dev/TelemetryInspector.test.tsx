import { fireEvent, render, screen } from '@testing-library/react';
import TelemetryInspector from './TelemetryInspector';

describe('TelemetryInspector', () => {
  const telemetryStorageKey = 'whoTelemetryEvents';

  beforeEach(() => {
    window.localStorage.setItem(
      telemetryStorageKey,
      JSON.stringify([
        {
          type: 'dashboard_viewed',
          modeId: 'friends',
          recordedAt: '2026-04-01T00:00:00.000Z',
        },
      ])
    );
  });

  test('renders telemetry count and clears history', () => {
    render(<TelemetryInspector />);

    expect(screen.getByText('Stored events: 1')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Clear' }));
    expect(screen.getByText('Stored events: 0')).toBeInTheDocument();
  });
});
