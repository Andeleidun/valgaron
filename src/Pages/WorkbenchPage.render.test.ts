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
          onCommitEntryRelationshipTransaction: jest.fn(),
          onSaveEntry: jest.fn(),
          onSaveRelationship: jest.fn(),
        })
      )
    );

    expect(markup).toContain('Edit');
    expect(markup).toContain('class="vwb-secondary-button"');
    expect(markup).toContain('class="vwb-workbench-layout is-empty-editor"');
    expect(markup).toContain('aria-label="Dashboard layout controls"');
    expect(markup).toContain('role="group"');
    expect(markup).toContain('Customize layout');
    expect(markup).toContain('data-dashboard-region="supporting"');
    expect(markup).toContain('data-dashboard-size="standard"');
    expect(markup).toContain('Collapse');
    expect(markup).not.toContain('<nav class="vwb-dashboard-toolbar"');
    expect(markup).toContain('class="vwb-entry-card-meta"');
    expect(markup).not.toContain('No editor target selected.');
    expect(markup).not.toContain('aria-current="page"');
  });

  it('shows the inline editor without duplicating the read-only entry detail', () => {
    const activeWorld = getActiveWorld(createSeedWorldDocument());

    const markup = renderToStaticMarkup(
      React.createElement(
        MemoryRouter,
        {
          initialEntries: [
            '/entries?sectionId=characters&entryId=character-mira-rowan',
          ],
        },
        React.createElement(WorkbenchPage, {
          activeWorld,
          onArchiveEntry: jest.fn(),
          onDeleteEntry: jest.fn(),
          onDeleteRelationship: jest.fn(),
          onCommitEntryRelationshipTransaction: jest.fn(),
          onSaveEntry: jest.fn(),
          onSaveRelationship: jest.fn(),
        })
      )
    );

    expect(markup).toContain('aria-label="Character Workbench editor"');
    expect(markup).toContain('Character category');
    expect(markup).not.toContain('aria-labelledby="entry-detail-title"');
    expect(markup).not.toContain('<article class="vwb-detail-panel"');
  });
});
