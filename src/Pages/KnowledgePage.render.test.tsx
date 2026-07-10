import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, jest } from '@jest/globals';
import {
  applyEntry,
  createCustomEntryType,
  createSeedWorldDocument,
  entryFromDraft,
  getActiveWorld,
  removeCustomEntryTypeField,
  updateActiveWorkspace,
} from '@valgaron/core';
import { KnowledgePage } from './KnowledgePage';

describe('KnowledgePage browser rendering', () => {
  it('shows direct row-level hidden detail cleanup actions', () => {
    const document = createSeedWorldDocument();
    const documentWithCustomType = updateActiveWorkspace(
      document,
      (workspace) =>
        createCustomEntryType(workspace, {
          title: 'Artifacts',
          singularTitle: 'Artifact',
          description: 'Objects with worldbuilding importance.',
          fields: 'Origin, Power',
        })
    );
    const artifactSection = getActiveWorld(
      documentWithCustomType
    ).entryTypes.find((section) => section.id === 'artifacts');
    if (!artifactSection) {
      throw new Error('Expected artifacts section.');
    }
    const artifactEntry = entryFromDraft(artifactSection, {
      name: 'Glass Key',
      summary: 'A key made of dawn glass.',
      notes: '',
      tags: 'artifact',
      status: 'draft',
      pinned: false,
      images: [],
      details: {
        origin: 'Glassroot Forest',
        power: 'Opens dawn doors',
      },
    });
    const documentWithEntry = updateActiveWorkspace(
      documentWithCustomType,
      (workspace) => ({
        ...workspace,
        codex: applyEntry(workspace.codex, artifactEntry, workspace.entryTypes),
      })
    );
    const documentWithHiddenDetail = updateActiveWorkspace(
      documentWithEntry,
      (workspace) => removeCustomEntryTypeField(workspace, 'artifacts', 'power')
    );

    const markup = renderToStaticMarkup(
      <MemoryRouter>
        <KnowledgePage
          activeWorld={getActiveWorld(documentWithHiddenDetail)}
          onAddEntryTypeFields={jest.fn()}
          onArchiveVocabularyValue={jest.fn()}
          onClearHiddenEntryDetail={jest.fn()}
          onClearHiddenEntryDetails={jest.fn()}
          onCreateEntryType={jest.fn()}
          onDeleteEntryType={jest.fn()}
          onMoveEntryTypeField={jest.fn()}
          onMoveVocabularyValue={jest.fn()}
          onRenameEntryTypeField={jest.fn()}
          onRemoveEntryTypeField={jest.fn()}
          onAddVocabularyValue={jest.fn()}
          onUpdateFieldOverride={jest.fn()}
          onUpdateVocabularyValue={jest.fn()}
        />
      </MemoryRouter>
    );

    expect(markup).toContain('Hidden Detail Cleanup');
    expect(markup).toContain('Glass Key');
    expect(markup).toContain('Power');
    expect(markup).toContain(
      'aria-label="Review 1 hidden detail cleanup target"'
    );
    expect(markup).toContain('aria-label="Open Type Setup section"');
    expect(markup).toContain('Review Entry');
    expect(markup).toContain(
      'aria-label="Review Glass Key for hidden detail Power"'
    );
    expect(markup).toContain('Clear Detail');
    expect(markup).toContain(
      'aria-label="Clear hidden detail Power from Glass Key"'
    );
    expect(markup).toContain(
      'aria-label="Archive Human from Character ancestry"'
    );
    expect(markup).toContain('aria-label="Edit Human label"');
    expect(markup).toContain('aria-label="Edit Human description"');
    expect(markup).toContain('aria-label="Edit Human aliases"');
    expect(markup).toContain('aria-label="Save Human in Character ancestry"');
    expect(markup).toContain(
      'aria-label="Move Human up in Character ancestry"'
    );
    expect(markup).toContain(
      'aria-label="Move Human down in Character ancestry"'
    );
    expect(markup).toContain('aria-label="Add value to Character ancestry"');
    expect(markup).toContain('aria-label="New Character ancestry value"');
    expect(markup).toContain('aria-label="New Character ancestry description"');
    expect(markup).toContain('aria-label="New Character ancestry aliases"');
    expect(markup).toContain('aria-label="Search Character ancestry values"');
    expect(markup).toContain('aria-label="Character ancestry field usage"');
    expect(markup).toContain(
      'aria-label="Open Characters fields using Character ancestry"'
    );
    expect(markup).toContain(
      'aria-label="Save Character category settings in Characters"'
    );
    expect(markup).toContain(
      'aria-label="Label for Character category in Characters"'
    );
    expect(markup).toContain(
      'aria-label="Help text for Character category in Characters"'
    );
    expect(markup).toContain(
      'aria-label="Display order for Character category in Characters"'
    );
    expect(markup).toContain(
      'aria-label="Hide Character category from editors in Characters"'
    );
    expect(markup).toContain(
      'aria-label="Vocabulary for Character category in Characters"'
    );
    expect(markup).toContain(
      'aria-label="Vocabulary mode for Character category in Characters"'
    );
    expect(markup).toContain(
      'aria-label="Reset Character category settings in Characters to defaults"'
    );
    expect(markup).toContain('aria-label="Rename Origin in Artifacts"');
    expect(markup).toContain('aria-label="Save Origin label in Artifacts"');
    expect(markup).toContain('aria-label="Move Origin up in Artifacts"');
    expect(markup).toContain('aria-label="Move Origin down in Artifacts"');
    expect(markup).toContain('aria-label="Remove Origin from Artifacts"');
    expect(markup).toContain('aria-label="Add fields to Artifacts"');
    expect(markup).toContain('aria-label="Delete custom entry type Artifacts"');
    expect(markup).toContain('aria-label="Open Artifacts records"');
    expect(markup).toContain('aria-label="Open Factions reusable knowledge"');
    expect(markup).toContain(
      'aria-label="Open Lore notes for Navigation practice"'
    );
    expect(markup).toContain('Clear All Hidden Details');
  });
});
