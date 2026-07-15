import { describe, expect, it, jest } from '@jest/globals';
import { createSeedWorldDocument, getActiveWorld } from '@valgaron/core';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { TimelinePage } from './TimelinePage';

describe('TimelinePage browser rendering', () => {
  it('renders filters and chronology as separate managed dashboard cards', () => {
    const activeWorld = getActiveWorld(createSeedWorldDocument());
    const markup = renderToStaticMarkup(
      <MemoryRouter initialEntries={['/timeline']}>
        <TimelinePage
          codex={activeWorld.codex}
          onArchiveEntry={jest.fn()}
          onDeleteEntry={jest.fn()}
          onDeleteRelationship={jest.fn()}
          onSaveEntry={jest.fn()}
          onSaveRelationship={jest.fn()}
          relationships={activeWorld.relationships}
          sections={activeWorld.entryTypes}
          workspaceSchema={activeWorld.schema}
        />
      </MemoryRouter>
    );

    expect(markup).toContain('data-dashboard-page-id="timeline"');
    expect(markup).toContain('data-dashboard-card-id="timeline.filters"');
    expect(markup).toContain('data-dashboard-size="compact"');
    expect(markup).toContain('data-dashboard-card-id="timeline.chronology"');
    expect(markup).toContain('data-dashboard-size="wide"');
    expect(markup).toContain('id="timeline-filters-title"');
    expect(markup).not.toContain('vwb-entry-filter-panel');
  });
});
