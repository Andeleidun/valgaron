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
  getEntryCardDetailPreviewModel,
  getEntryDetailFieldSuggestions,
  getEntryDetailDisplayModel,
  getEntryEditorBaseFieldLayout,
  getEntryEditorBaseFields,
  getEntryEditorDetailFieldGroups,
  getEntryEditorCreateTitle,
  getEntryEditorDetailFieldModels,
  getEntryEditorHiddenSuggestionLabel,
  getEntryEditorNewTitle,
  getEntryEditorNotesPreviewModel,
  getEntryEditorSelectedActionModel,
  getEntryHiddenDetailCleanupModel,
  getEntryEditorSubmitLabel,
  getEntryEditorTitle,
  getEntryNameCopiedMessage,
  getEntryNameCopyText,
  getEntryStatusLabel,
  getEntries,
  getSectionById,
  normalizeTags,
  setEntryArchived,
  type EntryDraft,
} from './codexEntries';
import { createSeedCodex, createSeedWorldDocument } from './seedCodex';
import { addVocabularyValue } from './workspaceManagement';
import { getActiveWorld, updateActiveWorld } from './worldDocument';

describe('codex entry helpers', () => {
  it('returns the existing entry for an unchanged normalized draft', () => {
    const world = getActiveWorld(createSeedWorldDocument());
    const section = world.entryTypes.find(
      (candidate) => candidate.id === 'characters'
    )!;
    const entry = getEntries(world.codex, section.id)[0]!;

    expect(entryFromDraft(section, draftFromEntry(entry, section), entry)).toBe(
      entry
    );
  });
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
      summaryLabel: 'Summary',
      tagsLabel: 'Tags',
      hiddenDetailsTitle: 'Hidden details',
      unappliedDraftMessage: 'Unapplied entry draft changes.',
      unappliedLabel: 'Unapplied',
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
    expect(getEntryEditorTitle({ section, selectedEntry: null })).toBe(
      'New Character'
    );
    expect(
      getEntryEditorTitle({ section, selectedEntry: codex.characters[0] })
    ).toBe('Edit Mira Rowan');
    expect(
      getEntryEditorSubmitLabel({
        section,
        selectedEntry: null,
      })
    ).toBe('Create Character');
    expect(
      getEntryEditorSubmitLabel({
        section,
        selectedEntry: null,
        stagedRelationshipCount: 1,
      })
    ).toBe('Create Character And 1 Link');
    expect(
      getEntryEditorSubmitLabel({
        section,
        selectedEntry: null,
        stagedRelationshipCount: 2,
      })
    ).toBe('Create Character And 2 Links');
    expect(
      getEntryEditorSubmitLabel({
        section,
        selectedEntry: codex.characters[0],
        stagedRelationshipCount: 2,
      })
    ).toBe('Update Character And 2 Links');
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

  it('builds shared entry editor base field layout for normal and timeline entries', () => {
    const placeSection = getSectionById('places');
    const timelineSection = getSectionById('timeline');
    const draft: EntryDraft = {
      name: 'Greywater',
      summary: 'A marsh city.',
      notes: 'Draft notes.',
      tags: 'marsh, city',
      status: 'draft',
      pinned: false,
      details: {},
    };

    if (!placeSection || !timelineSection) {
      throw new Error('Expected seed section configs.');
    }

    expect(
      getEntryEditorBaseFieldLayout(placeSection, draft).leadingFields.map(
        (field) => field.key
      )
    ).toEqual(['name', 'summary', 'notes']);
    expect(
      getEntryEditorBaseFieldLayout(placeSection, draft).trailingFields.map(
        (field) => field.key
      )
    ).toEqual(['tags']);
    expect(
      getEntryEditorBaseFieldLayout(timelineSection, draft).leadingFields.map(
        (field) => field.key
      )
    ).toEqual(['name', 'summary']);
    expect(
      getEntryEditorBaseFieldLayout(timelineSection, draft).trailingFields.map(
        (field) => field.key
      )
    ).toEqual(['tags']);
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
      sectionId: section.id,
      sectionEntries: codex.places,
      suggestionLimit: 2,
      workspaceSchema: {
        vocabularies: [],
        fieldOverrides: {
          places: {
            region: { helpText: 'Use the map region name.' },
          },
        },
        ignoredVocabularyCandidates: [],
      },
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
          helpText: 'Use the map region name.',
          key: 'region',
        }),
        expect.objectContaining({
          key: 'significance',
          helpText: '',
          label: 'Significance',
          multiline: true,
          rows: 3,
        }),
      ])
    );
    expect(
      fieldModels.find((field) => field.key === 'category')?.suggestions.length
    ).toBeLessThanOrEqual(2);
    expect(
      fieldModels.find((field) => field.key === 'category')?.suggestionActions
    ).toEqual(
      fieldModels
        .find((field) => field.key === 'category')
        ?.suggestions.map((suggestion) => ({
          accessibilityLabel: `Use ${suggestion} for Place category`,
          label: suggestion,
          value: suggestion,
        }))
    );
    expect(
      fieldModels.find((field) => field.key === 'category')
        ?.hiddenSuggestionCount
    ).toBeGreaterThan(0);
    expect(
      fieldModels.find((field) => field.key === 'category')
        ?.hiddenSuggestionLabel
    ).toContain('Type to use another value.');
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

  it('formats hidden suggestion labels with an action cue', () => {
    expect(getEntryEditorHiddenSuggestionLabel(0)).toBe('');
    expect(getEntryEditorHiddenSuggestionLabel(1)).toBe(
      '1 more suggestion available. Type to use another value.'
    );
    expect(getEntryEditorHiddenSuggestionLabel(2)).toBe(
      '2 more suggestions available. Type to use another value.'
    );
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

  it('groups timeline detail fields around chronology and outcomes', () => {
    const section = getSectionById('timeline');
    const codex = createSeedCodex();
    if (!section) {
      throw new Error('Expected timeline section seed config.');
    }
    const draft = draftFromEntry(codex.timeline[0], section);

    expect(
      getEntryEditorDetailFieldGroups({
        draft,
        fields: section.detailFields,
        section,
        sectionEntries: codex.timeline,
      })
    ).toEqual([
      {
        id: 'timelineChronology',
        label: 'Chronology',
        fields: [
          expect.objectContaining({ key: 'order' }),
          expect.objectContaining({ key: 'dateLabel' }),
          expect.objectContaining({ key: 'era' }),
        ],
      },
      {
        id: 'timelineLinkedRecords',
        label: 'Linked records',
        fields: [expect.objectContaining({ key: 'involvedRecords' })],
      },
      {
        id: 'timelineOutcomes',
        label: 'Outcomes',
        fields: [expect.objectContaining({ key: 'consequences' })],
      },
    ]);
    expect(
      getEntryEditorDetailFieldModels({
        draft,
        fields: section.detailFields,
        sectionEntries: codex.timeline,
      }).find((field) => field.key === 'era')?.suggestions
    ).toEqual(['Charter Era']);
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

    const model = getEntryDetailDisplayModel(section, entry, {
      vocabularies: [],
      fieldOverrides: {
        places: {
          category: { label: 'Place type', order: 1 },
          population: { hidden: true, order: 2 },
        },
      },
      ignoredVocabularyCandidates: [],
    });

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
      expect.arrayContaining([{ label: 'Place type', value: 'City' }])
    );
    expect(model.hiddenDetails).toEqual([
      {
        key: 'hiddenPlanningNote',
        label: 'Hidden Planning Note',
        value: 'Keep this after category changes.',
      },
      {
        key: 'population',
        label: 'Population',
        value: '12,000',
      },
    ]);
  });

  it('builds compact entry card detail previews', () => {
    const section = getSectionById('characters');
    const entry = createSeedCodex().characters[0];

    if (!section) {
      throw new Error('Expected character section seed config.');
    }

    const preview = getEntryCardDetailPreviewModel(section, entry);

    expect(preview.visibleValueCount).toBeLessThanOrEqual(2);
    expect(preview.text).toContain('Humanoid person');
  });

  it('builds detail field suggestions from configured options and existing entries', () => {
    const codex = createSeedCodex();
    const section = getSectionById('places');
    if (!section) {
      throw new Error('Expected place section seed config.');
    }

    const categorySuggestions = getEntryDetailFieldSuggestions({
      entries: codex.places,
      fields: section.detailFields,
    }).category;

    expect(categorySuggestions).toEqual(
      expect.arrayContaining(['Forest', 'Town', 'Planet'])
    );
    expect(categorySuggestions.indexOf('Town')).toBeLessThan(
      categorySuggestions.indexOf('Forest')
    );
    expect(
      getEntryDetailFieldSuggestions({
        entries: codex.places,
        fields: [{ key: 'region' }],
      }).region
    ).toEqual([]);
  });

  it('builds detail field suggestions from workspace vocabularies', () => {
    const document = updateActiveWorld(createSeedWorldDocument(), (workspace) =>
      addVocabularyValue(workspace, 'character-profession', {
        label: 'Navigator',
        description: '',
        aliases: 'Pathfinder',
      })
    );
    const world = getActiveWorld(document);
    const section = getSectionById('characters', world.entryTypes);
    if (!section) {
      throw new Error('Expected character section seed config.');
    }

    const profession = getEntryEditorDetailFieldModels({
      draft: draftFromEntry(world.codex.characters[0], section),
      fields: section.detailFields,
      sectionEntries: world.codex.characters,
      sectionId: section.id,
      workspaceSchema: world.schema,
    }).find((field) => field.key === 'profession');
    if (!profession) {
      throw new Error('Expected profession field model.');
    }

    expect(profession.suggestions).toEqual(
      expect.arrayContaining(['Navigator', 'Quartermaster'])
    );
    expect(profession.suggestions).not.toContain('Surveyor');
    expect(profession.suggestions.indexOf('Quartermaster')).toBeLessThan(
      profession.suggestions.indexOf('Navigator')
    );

    const aliasProfession = getEntryEditorDetailFieldModels({
      draft: {
        ...draftFromEntry(world.codex.characters[0], section),
        details: {
          ...world.codex.characters[0].fields,
          profession: 'Pathfinder',
        },
      },
      fields: section.detailFields,
      sectionEntries: world.codex.characters,
      sectionId: section.id,
      workspaceSchema: world.schema,
    }).find((field) => field.key === 'profession');
    const casedProfession = getEntryEditorDetailFieldModels({
      draft: {
        ...draftFromEntry(world.codex.characters[0], section),
        details: {
          ...world.codex.characters[0].fields,
          profession: 'navigator',
        },
      },
      fields: section.detailFields,
      sectionEntries: world.codex.characters,
      sectionId: section.id,
      workspaceSchema: world.schema,
    }).find((field) => field.key === 'profession');

    expect(aliasProfession?.canonicalReplacement).toEqual({
      accessibilityLabel: 'Use Navigator for Profession',
      label: 'Use Navigator',
      value: 'Navigator',
    });
    expect(aliasProfession?.suggestions).not.toContain('Navigator');
    expect(casedProfession?.canonicalReplacement).toEqual({
      accessibilityLabel: 'Use Navigator for Profession',
      label: 'Use Navigator',
      value: 'Navigator',
    });
    expect(casedProfession?.suggestions).not.toContain('Navigator');
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
