import { describe, expect, it, jest } from '@jest/globals';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  dashboardCardDefinitions,
  getDashboardPreset,
  normalizeDashboardLayout,
} from '@valgaron/core';
import { DashboardCardControls, DashboardToolbar } from './DashboardControls';

describe('dashboard controls', () => {
  it('renders complete non-pointer customization alternatives', () => {
    const preset = getDashboardPreset('workbench', 'browse');
    const card = normalizeDashboardLayout({
      pageId: 'workbench',
      definitions: dashboardCardDefinitions,
      preset,
      viewport: 'wide',
    }).cards.find((candidate) => candidate.id === 'workbench.records')!;
    const definition = dashboardCardDefinitions.find(
      (candidate) => candidate.id === card.id
    )!;
    const markup = renderToStaticMarkup(
      <DashboardCardControls
        card={card}
        definition={definition}
        isCustomizing
        onCollapse={jest.fn()}
        onFocus={jest.fn()}
        onMove={jest.fn()}
        onMoveToRegion={jest.fn()}
        onReset={jest.fn()}
        onResize={jest.fn()}
      />
    );
    expect(markup).toContain('Move Records earlier');
    expect(markup).toContain('Size for Records');
    expect(markup).toContain('Region for Records');
    expect(markup).toContain('Resize Records');
    expect(markup).toContain('Reset card');
  });

  it('identifies customized presets and recovery actions', () => {
    const markup = renderToStaticMarkup(
      <DashboardToolbar
        activePresetId="browse"
        canRedo={false}
        canUndo
        isCustomizing
        isPresetCustomized
        onApplyPreset={jest.fn()}
        onCancel={jest.fn()}
        onCustomize={jest.fn()}
        onRedo={jest.fn()}
        onReset={jest.fn()}
        onResetAll={jest.fn()}
        onUndo={jest.fn()}
        presets={[getDashboardPreset('workbench', 'browse')]}
        summary="Arrange the current workspace."
      />
    );
    expect(markup).toContain('Customize layout');
    expect(markup).toContain('Reset all dashboards');
    expect(markup).toContain('Cancel');
    expect(markup).toContain('disabled');
  });
});
