import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, jest } from '@jest/globals';
import { createSeedWorldDocument, getActiveWorld } from '@valgaron/core';
import { SectionPage } from './SectionPage';

describe('SectionPage browser rendering', () => {
  it('shows a selected character editor without a duplicate read-only detail panel', () => {
    const activeWorld = getActiveWorld(createSeedWorldDocument());

    const markup = renderToStaticMarkup(
      <MemoryRouter
        initialEntries={[
          '/characters?entryId=character-mira-rowan&intent=edit',
        ]}
      >
        <SectionPage
          codex={activeWorld.codex}
          fixedSectionId="characters"
          onArchiveEntry={jest.fn()}
          onCommitEntryRelationshipTransaction={jest.fn()}
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

    expect(markup).toContain('aria-label="Character editor"');
    expect(markup).toContain('Character category');
    expect(markup).not.toContain('aria-labelledby="entry-detail-title"');
    expect(markup).not.toContain('<article class="vwb-detail-panel"');
  });
});
