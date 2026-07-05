import { describe, expect, it } from '@jest/globals';
import type { CharacterEntry } from './types';
import {
  applyEntry,
  draftFromEntry,
  deleteEntry,
  duplicateEntry,
  entryDisplayCopy,
  entryEditorCopy,
  entryNameCopyFeedback,
  entryFromDraft,
  entryMatchesFilters,
  getEntryDetailFieldSuggestions,
  getEntryDetailDisplayModel,
  getEntryEditorBaseFields,
  getEntryEditorDetailFieldGroups,
  getEntryEditorCreateTitle,
  getEntryEditorDetailFieldModels,
  getEntryEditorNewTitle,
  getEntryEditorNotesPreviewModel,
  getEntryEditorSelectedActionModel,
  getEntryHiddenDetailCleanupModel,
  getEntryEditorSubmitLabel,
  getEntryNameCopiedMessage,
  getEntryNameCopyText,
  getEntryStatusLabel,
  getEntries,
  getSectionById,
  normalizeTags,
  setEntryArchived,
  type EntryDraft,
} from './codexEntries';
import { createSeedCodex } from './seedCodex';

describe('codex entry helpers', () => {
  it('normalizes comma-separated tags without empty values', () => {
    expect(normalizeTags(' maps,  borderlands,, archive ')).toEqual([
      'maps',
      'borderlands',
      'archive',
    ]);
  });

  it('returns display labels for entry statuses', () => {
    expect(getEntryStatusLabel('needs-review')).toBe('Needs Review');
    expect(getEntryStatusLabel('archived')).toBe('Archived');
  });

  it('normalizes entry names and feedback for clipboard copy actions', () => {
    expect(getEntryNameCopyText('  Mira Rowan  ')).toBe('Mira Rowan');
    expect(getEntryNameCopyText('   ')).toBeNull();
    expect(getEntryNameCopiedMessage('Mira Rowan')).toBe('Copied Mira Rowan.');
    expect(entryNameCopyFeedback).toMatchObject({
      actionLabel: 'Copy Name',
      missingName: 'Add a name before copying it.',
      unavailable: 'Clipboard copy is unavailable in this runtime.',
      failed: 'Clipboard copy failed.',
    });
    expect(entryEditorCopy).toMatchObject({
      applyTemplateLabel: 'Apply Template',
      archiveLabel: 'Archive',
      clearLabel: 'Clear',
      createKicker: 'New entry',
      deleteLabel: 'Delete',
      deletePermanentlyLabel: 'Delete Permanently',
      duplicateLabel: 'Duplicate',
      emptyNotesPreview: 'No notes to preview yet.',
      editKicker: 'Edit entry',
      nameLabel: 'Name',
      newDraftLabel: 'New Draft',
      newLabel: 'New',
      notesLabel: 'Notes',
      notesPreviewKicker: 'Markdown preview',
      notesPreviewTitle: 'Notes preview',
      restoreLabel: 'Restore',
      saveChangesLabel: 'Save Changes',
      summaryLabel: 'Summary',
      tagsLabel: 'Tags',
      hiddenDetailsTitle: 'Hidden details',
      unsavedDraftMessage: 'Unsaved entry draft.',
      unsavedLabel: 'Unsaved',
      useAsTemplateLabel: 'Use As Template',
    });
    expect(entryDisplayCopy.emptySummary).toBe('No summary yet.');
  });

  it('builds shared entry editor form titles and submit labels', () => {
    const section = getSectionById('characters');
    const codex = createSeedCodex();

    if (!section) {
      throw new Error('Expected character section seed config.');
    }

    expect(getEntryEditorCreateTitle(section)).toBe('Create Character');
    expect(getEntryEditorNewTitle(section)).toBe('New Character');
    expect(
      getEntryEditorSubmitLabel({
        section,
        selectedEntry: null,
      })
    ).toBe('Create Character');
    expect(
      getEntryEditorSubmitLabel({
        section,
        selectedEntry: codex.characters[0],
      })
    ).toBe('Save Changes');
  });

  it('builds shared entry editor base fields and notes preview', () => {
    const section = getSectionById('places');
    const draft: EntryDraft = {
      name: 'Greywater',
      summary: 'A marsh city.',
      notes: '## Hooks\nSmugglers under the east dock.',
      tags: 'marsh, city',
      status: 'draft',
      pinned: false,
      details: {},
    };

    if (!section) {
      throw new Error('Expected place section seed config.');
    }

    expect(getEntryEditorBaseFields(section, draft)).toEqual([
      {
        id: 'entries.editor.name',
        key: 'name',
        label: 'Name',
        multiline: false,
        placeholder: 'Place name',
        rows: 1,
        value: 'Greywater',
      },
      {
        id: 'entries.editor.summary',
        key: 'summary',
        label: 'Summary',
        multiline: true,
        placeholder: 'A short working summary',
        rows: 4,
        value: 'A marsh city.',
      },
      {
        id: 'entries.editor.notes',
        key: 'notes',
        label: 'Notes',
        multiline: true,
        placeholder: 'Markdown-style drafting notes',
        rows: 5,
        value: '## Hooks\nSmugglers under the east dock.',
      },
      {
        id: 'entries.editor.tags',
        key: 'tags',
        label: 'Tags',
        multiline: false,
        placeholder: 'comma, separated, tags',
        rows: 1,
        value: 'marsh, city',
      },
    ]);
    expect(getEntryEditorNotesPreviewModel(draft.notes)).toEqual({
      body: '## Hooks\nSmugglers under the east dock.',
      emptyText: 'No notes to preview yet.',
      hasContent: true,
      kicker: 'Markdown preview',
      title: 'Notes preview',
    });
    expect(getEntryEditorNotesPreviewModel('   ')).toMatchObject({
      body: '',
      hasContent: false,
    });
  });

  it('builds shared entry editor detail fields and cleanup actions', () => {
    const section = getSectionById('places');
    const codex = createSeedCodex();

    if (!section) {
      throw new Error('Expected place section seed config.');
    }

    const draft = draftFromEntry(
      {
        ...codex.places[0],
        fields: {
          ...codex.places[0].fields,
          category: 'City',
          hiddenPlanningNote: 'Keep this after category changes.',
        },
      },
      section
    );
    draft.details.region = 'Old Marches';

    const fieldModels = getEntryEditorDetailFieldModels({
      draft,
      fields: section.detailFields,
      sectionEntries: codex.places,
      suggestionLimit: 2,
    });

    expect(fieldModels).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: 'category',
          label: 'Place category',
          multiline: false,
          rows: 1,
          value: 'City',
        }),
        expect.objectContaining({
          key: 'significance',
          label: 'Significance',
          multiline: true,
          rows: 3,
        }),
      ])
    );
    expect(
      fieldModels.find((field) => field.key === 'category')?.suggestions.length
    ).toBeLessThanOrEqual(2);
    expect(getEntryHiddenDetailCleanupModel(section, draft)).toEqual({
      title: 'Hidden details',
      fields: [
        {
          key: 'hiddenPlanningNote',
          label: 'Hidden Planning Note',
          value: 'Keep this after category changes.',
          clearLabel: 'Clear',
        },
      ],
    });
  });

  it('groups character detail fields by logical profile for editor rendering', () => {
    const section = getSectionById('characters');
    const codex = createSeedCodex();
    if (!section) {
      throw new Error('Expected character section seed config.');
    }
    const draft = draftFromEntry(
      {
        ...codex.characters[0],
        fields: {
          ...codex.characters[0].fields,
          characterCategory: 'Construct or automaton',
        },
      },
      section
    );
    const groups = getEntryEditorDetailFieldGroups({
      draft,
      fields: [
        { key: 'characterCategory', label: 'Character category' },
        { key: 'maker', label: 'Maker' },
        { key: 'directive', label: 'Directive' },
        { key: 'maintenance', label: 'Maintenance' },
        { key: 'currentGoal', label: 'Current goal' },
      ],
      section,
      sectionEntries: codex.characters,
    });

    expect(groups).toEqual([
      {
        id: 'categoryAndRole',
        label: 'Category and role',
        fields: [expect.objectContaining({ key: 'characterCategory' })],
      },
      {
        id: 'constructProfile',
        label: 'Construct profile',
        fields: [
          expect.objectContaining({ key: 'maker' }),
          expect.objectContaining({ key: 'directive' }),
          expect.objectContaining({ key: 'maintenance' }),
        ],
      },
      {
        id: 'storyEngine',
        label: 'Story engine',
        fields: [expect.objectContaining({ key: 'currentGoal' })],
      },
    ]);
  });

  it('builds shared selected-entry action labels and accessibility text', () => {
    const codex = createSeedCodex();

    expect(getEntryEditorSelectedActionModel(codex.characters[0])).toEqual({
      archiveAccessibilityLabel: `Archive ${codex.characters[0].name}`,
      archiveLabel: 'Archive',
      deleteAccessibilityHint:
        'Deletes the entry and its relationships after confirmation.',
      deleteAccessibilityLabel: `Delete Permanently ${codex.characters[0].name}`,
      deleteLabel: 'Delete Permanently',
      duplicateAccessibilityLabel: `Duplicate ${codex.characters[0].name}`,
      duplicateLabel: 'Duplicate',
      useAsTemplateAccessibilityLabel: `Use ${codex.characters[0].name} as a template`,
      useAsTemplateLabel: 'Use As Template',
    });
    expect(
      getEntryEditorSelectedActionModel({
        ...codex.characters[0],
        status: 'archived',
      })
    ).toMatchObject({
      archiveAccessibilityLabel: `Restore ${codex.characters[0].name}`,
      archiveLabel: 'Restore',
    });
  });

  it('builds a shared entry detail display model', () => {
    const codex = createSeedCodex();
    const section = getSectionById('places');
    if (!section) {
      throw new Error('Expected place section seed config.');
    }
    const entry = {
      ...codex.places[0],
      fields: {
        ...codex.places[0].fields,
        category: 'City',
        population: '12,000',
        hiddenPlanningNote: 'Keep this after category changes.',
      },
    };

    const model = getEntryDetailDisplayModel(section, entry);

    expect(model).toMatchObject({
      kicker: 'Place detail',
      name: entry.name,
      statusLabel: 'Draft',
      summary: entry.summary,
      tags: entry.tags,
      tagsLabel: 'Tags',
      pinned: { label: 'Pinned', value: 'No' },
      updated: { label: 'Updated' },
      created: { label: 'Created' },
    });
    expect(model.visibleDetails).toEqual(
      expect.arrayContaining([
        { label: 'Place category', value: 'City' },
        { label: 'Population', value: '12,000' },
      ])
    );
    expect(model.hiddenDetails).toEqual([
      {
        key: 'hiddenPlanningNote',
        label: 'Hidden Planning Note',
        value: 'Keep this after category changes.',
      },
    ]);
  });

  it('builds detail field suggestions from configured options and existing entries', () => {
    const codex = createSeedCodex();
    const section = getSectionById('places');
    if (!section) {
      throw new Error('Expected place section seed config.');
    }

    const categorySuggestions = getEntryDetailFieldSuggestions(
      section.detailFields,
      codex.places
    ).category;

    expect(categorySuggestions).toContain('Forest');
    expect(categorySuggestions).toContain('Town');
    expect(categorySuggestions).toContain('Planet');
    expect(categorySuggestions).toEqual([...categorySuggestions].sort());
    expect(
      getEntryDetailFieldSuggestions([{ key: 'region' }], codex.places).region
    ).toEqual([]);
  });

  it('creates a trimmed character entry from a draft', () => {
    const section = getSectionById('characters');
    const draft: EntryDraft = {
      name: '  Mira Vale  ',
      summary: '  Keeper of bridge songs.  ',
      notes: '  ## Draft Notes\nKeep the bridge oath unresolved.  ',
      tags: ' bard, bridges ',
      status: 'canon',
      pinned: true,
      details: {
        characterCategory: '  Humanoid person  ',
        narrativeRole: '  Keeper of bridge songs  ',
        ancestry: '  Human  ',
        profession: '  Songkeeper  ',
        homePlace: '  Larkspan  ',
        affiliations: '  Free courts  ',
        currentStatus: '  Traveling  ',
      },
    };

    if (!section) {
      throw new Error('Expected character section seed config.');
    }

    const entry = entryFromDraft(section, draft);

    expect(entry).toMatchObject({
      kind: 'character',
      name: 'Mira Vale',
      summary: 'Keeper of bridge songs.',
      notes: '## Draft Notes\nKeep the bridge oath unresolved.',
      tags: ['bard', 'bridges'],
      status: 'canon',
      pinned: true,
      fields: {
        characterCategory: 'Humanoid person',
        narrativeRole: 'Keeper of bridge songs',
        ancestry: 'Human',
        profession: 'Songkeeper',
        homePlace: 'Larkspan',
        affiliations: 'Free courts',
        currentStatus: 'Traveling',
      },
    });
    expect(entry.id).toContain('character-mira-vale-');
    expect(Date.parse(entry.updatedAt)).not.toBeNaN();
  });

  it('persists category-specific place fields without dropping hidden details', () => {
    const section = getSectionById('places');
    const codex = createSeedCodex();
    const existingFields: Record<string, string> = {
      ...codex.places[0].fields,
      category: 'City',
      districts: 'Old Market',
      population: '12,000',
      hiddenPlanningNote: 'Keep this value even if the UI hides it.',
    };
    const existingEntry = {
      ...codex.places[0],
      fields: existingFields,
    };

    if (!section) {
      throw new Error('Expected place section seed config.');
    }

    const draft = draftFromEntry(existingEntry, section);
    draft.details.category = 'River';
    draft.details.source = 'North glacier';
    draft.details.mouth = 'Grey Sea';

    const savedEntry = entryFromDraft(section, draft, existingEntry);

    expect(savedEntry.fields).toMatchObject({
      category: 'River',
      region: existingEntry.fields.region,
      climate: existingEntry.fields.climate,
      significance: existingEntry.fields.significance,
      source: 'North glacier',
      mouth: 'Grey Sea',
      districts: 'Old Market',
      population: '12,000',
      hiddenPlanningNote: 'Keep this value even if the UI hides it.',
    });
  });

  it('drops cleared detail fields while preserving non-empty hidden details', () => {
    const section = getSectionById('places');
    const codex = createSeedCodex();
    const existingEntry = {
      ...codex.places[0],
      fields: {
        ...codex.places[0].fields,
        category: 'City',
        districts: 'Old Market',
        hiddenPlanningNote: 'Keep this value.',
      },
    };

    if (!section) {
      throw new Error('Expected place section seed config.');
    }

    const draft = draftFromEntry(existingEntry, section);
    draft.details.category = 'River';
    draft.details.districts = '';
    draft.details.hiddenPlanningNote = '  ';

    const savedEntry = entryFromDraft(section, draft, existingEntry);

    expect(savedEntry.fields.category).toBe('River');
    expect(savedEntry.fields.districts).toBeUndefined();
    expect(savedEntry.fields.hiddenPlanningNote).toBeUndefined();
  });

  it('adds new entries to the correct collection and updates existing entries', () => {
    const codex = createSeedCodex();
    const entry: CharacterEntry = {
      ...codex.characters[0],
      id: 'character-test-entry',
      name: 'Test Entry',
    };

    const withNewEntry = applyEntry(codex, entry);
    expect(withNewEntry.characters[0]).toEqual(entry);
    expect(withNewEntry.characters).toHaveLength(codex.characters.length + 1);

    const updatedEntry = { ...entry, summary: 'Updated summary' };
    const withUpdatedEntry = applyEntry(withNewEntry, updatedEntry);
    const matchingEntries = withUpdatedEntry.characters.filter(
      (item) => item.id === entry.id
    );

    expect(matchingEntries).toEqual([updatedEntry]);
    expect(withUpdatedEntry.characters).toHaveLength(
      withNewEntry.characters.length
    );
  });

  it('archives, restores, duplicates, and deletes entries', () => {
    const codex = createSeedCodex();
    const section = getSectionById('characters');

    if (!section) {
      throw new Error('Expected character section seed config.');
    }

    const entry = codex.characters[0];
    const archivedCodex = setEntryArchived(codex, entry, true);
    const archivedEntry = archivedCodex.characters.find(
      (item) => item.id === entry.id
    );

    expect(archivedEntry?.status).toBe('archived');

    const restoredCodex = setEntryArchived(
      archivedCodex,
      archivedEntry!,
      false
    );
    const restoredEntry = restoredCodex.characters.find(
      (item) => item.id === entry.id
    );

    expect(restoredEntry?.status).toBe('draft');

    const duplicate = duplicateEntry(section, entry);
    const withDuplicate = applyEntry(codex, duplicate);

    expect(duplicate.id).not.toBe(entry.id);
    expect(duplicate.name).toBe(`${entry.name} Copy`);
    expect(duplicate.fields).toEqual(entry.fields);
    expect(withDuplicate.characters).toHaveLength(codex.characters.length + 1);

    const withoutOriginal = deleteEntry(withDuplicate, entry);

    expect(
      withoutOriginal.characters.some((item) => item.id === entry.id)
    ).toBe(false);
    expect(
      withoutOriginal.characters.some((item) => item.id === duplicate.id)
    ).toBe(true);
  });

  it('filters entries by query text and active tag', () => {
    const codex = createSeedCodex();
    const section = getSectionById('characters');

    if (!section) {
      throw new Error('Expected character section seed config.');
    }

    const entries = getEntries(codex, section.id);
    expect(entryMatchesFilters(entries[0], section, 'route sketches', '')).toBe(
      true
    );
    expect(entryMatchesFilters(entries[0], section, '', 'maps')).toBe(true);
    expect(entryMatchesFilters(entries[0], section, 'routes', 'ledger')).toBe(
      false
    );
  });
});
