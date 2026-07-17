import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, jest } from '@jest/globals';
import { createSeedWorldDocument, getActiveWorld } from '@valgaron/core';
import { RelationshipsPage } from './RelationshipsPage';

describe('RelationshipsPage browser rendering', () => {
  it('separates relationship review labels from record names', () => {
    const activeWorld = getActiveWorld(createSeedWorldDocument());

    const markup = renderToStaticMarkup(
      React.createElement(
        MemoryRouter,
        { initialEntries: ['/relationships'] },
        React.createElement(RelationshipsPage, {
          codex: activeWorld.codex,
          relationships: activeWorld.relationships,
          sections: activeWorld.entryTypes,
          onDeleteRelationship: jest.fn(),
          onCommitEntryRelationshipTransaction: jest.fn(),
          onSaveRelationship: jest.fn(),
        })
      )
    );

    expect(markup).toContain('Legacy Link Text');
    expect(markup).toContain('class="vwb-relationship-row-heading"');
    expect(markup).toContain('class="vwb-entry-kind">Home</span>');
  });
});
