import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, jest } from '@jest/globals';
import { createSeedWorldDocument, getActiveWorld } from '@valgaron/core';
import { WorkbenchPage } from './WorkbenchPage';

describe('WorkbenchPage browser rendering', () => {
  it('renders record action links without active page state', () => {
    const activeWorld = getActiveWorld(createSeedWorldDocument());

    const markup = renderToStaticMarkup(
      React.createElement(
        MemoryRouter,
        { initialEntries: ['/entries'] },
        React.createElement(WorkbenchPage, {
          activeWorld,
          onArchiveEntry: jest.fn(),
          onDeleteEntry: jest.fn(),
          onDeleteRelationship: jest.fn(),
          onSaveEntry: jest.fn(),
          onSaveRelationship: jest.fn(),
        })
      )
    );

    expect(markup).toContain('Edit');
    expect(markup).toContain('class="vwb-secondary-button"');
    expect(markup).toContain('class="vwb-workbench-layout is-empty-editor"');
    expect(markup).toContain('aria-label="Workbench layout controls"');
    expect(markup).toContain('role="group"');
    expect(markup).toContain('Focus editor');
    expect(markup).toContain('Expand all');
    expect(markup).toContain('Collapse records');
    expect(markup).toContain('Collapse context');
    expect(markup).not.toContain('<nav class="vwb-dashboard-toolbar"');
    expect(markup).toContain('class="vwb-entry-card-meta"');
    expect(markup).not.toContain('No editor target selected.');
    expect(markup).not.toContain('aria-current="page"');
  });
});
