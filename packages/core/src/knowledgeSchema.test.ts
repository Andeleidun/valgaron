import { describe, expect, it } from '@jest/globals';
import {
  getKnowledgeRouteFocusTargetId,
  getKnowledgeSchemaModel,
  knowledgeRouteFocusTargetIds,
} from './knowledgeSchema';
import { createSeedWorldDocument } from './seedCodex';
import { getActiveWorld } from './worldDocument';
import { applyEntry, entryFromDraft } from './codexEntries';
import {
  createCustomEntryType,
  removeCustomEntryTypeField,
  updateActiveWorkspace,
} from './workspaceManagement';

describe('knowledgeSchema', () => {
  it('builds a shared schema overview for built-in sections and relationship fields', () => {
    const world = getActiveWorld(createSeedWorldDocument());
    const model = getKnowledgeSchemaModel(world);

    expect(model.totals).toMatchObject({
      entryTypeCount: 5,
      customTypeCount: 0,
      hiddenDetailCount: 0,
    });
    expect(model.totals.fieldCount).toBeGreaterThan(0);
    expect(model.totals.relationshipFieldCount).toBeGreaterThan(0);
    expect(model.typeSetup.detail).toContain('durable user-defined fields');
    expect(model.typeSetup.route).toBe('/knowledge#custom-entry-types');
    expect(model.reusableKnowledge.destinations.map((item) => item.id)).toEqual(
      ['factions', 'lore']
    );
  });

  it('resolves route focus targets for Knowledge section intents', () => {
    expect(
      getKnowledgeRouteFocusTargetId({
        focusId: knowledgeRouteFocusTargetIds.customEntryTypes,
      })
    ).toBe(knowledgeRouteFocusTargetIds.customEntryTypes);
    expect(
      getKnowledgeRouteFocusTargetId({
        focusId: knowledgeRouteFocusTargetIds.hiddenDetails,
      })
    ).toBe(knowledgeRouteFocusTargetIds.hiddenDetails);
    expect(getKnowledgeRouteFocusTargetId({ focusId: 'missing' })).toBe('');
    expect(getKnowledgeRouteFocusTargetId({ focusId: '' })).toBe('');
  });

  it('classifies flexible, controlled, and relationship-backed fields', () => {
    const world = getActiveWorld(createSeedWorldDocument());
    const model = getKnowledgeSchemaModel(world);
    const character = model.sections.find(
      (section) => section.id === 'characters'
    );
    const timeline = model.sections.find(
      (section) => section.id === 'timeline'
    );

    expect(character?.fields).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: 'characterCategory',
          mode: 'controlled-value',
        }),
        expect.objectContaining({
          key: 'ancestry',
          mode: 'free-text',
        }),
        expect.objectContaining({
          key: 'profession',
          mode: 'free-text',
        }),
        expect.objectContaining({
          key: 'homePlace',
          mode: 'multi-link',
          backingLabel: 'Relationship: resides in',
          targetSectionTitles: ['Places'],
        }),
        expect.objectContaining({
          key: 'affiliations',
          mode: 'multi-link',
          targetSectionTitles: ['Factions'],
        }),
      ])
    );
    expect(timeline?.fields).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: 'involvedRecords',
          mode: 'multi-link',
          backingLabel: 'Relationship: involves',
          targetSectionTitles: ['Characters', 'Places', 'Factions', 'Lore'],
        }),
      ])
    );
  });

  it('summarizes controlled vocabularies and observed flexible values', () => {
    const world = getActiveWorld(createSeedWorldDocument());
    const model = getKnowledgeSchemaModel(world);

    expect(model.vocabulary.rows).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'characters:characterCategory',
          sourceLabel: 'Suggested values',
          values: expect.arrayContaining(['Humanoid person']),
        }),
        expect.objectContaining({
          id: 'characters:ancestry',
          route: '/entries?sectionId=characters',
          sourceLabel: 'Observed values',
          summary:
            '1 observed workspace value can guide whether this field stays flexible or becomes reusable knowledge.',
          values: ['Human'],
        }),
        expect.objectContaining({
          id: 'characters:profession',
          sourceLabel: 'Observed values',
          summary:
            '2 observed workspace values can guide whether this field stays flexible or becomes reusable knowledge.',
          values: ['Quartermaster', 'Surveyor'],
        }),
        expect.objectContaining({
          id: 'places:category',
          sourceLabel: 'Suggested values',
          summary: expect.stringContaining(
            'suggested values define the current choice set'
          ),
          values: expect.arrayContaining(['Town']),
        }),
      ])
    );
    expect(
      model.vocabulary.rows.some((row) => row.fieldKey === 'affiliations')
    ).toBe(false);
  });

  it('classifies custom entry type field definition hints', () => {
    const document = updateActiveWorkspace(
      createSeedWorldDocument(),
      (workspace) =>
        createCustomEntryType(workspace, {
          title: 'Orders',
          singularTitle: 'Order',
          description: 'Organizations with field rules.',
          fields:
            'Founding notes (long); Standing [Hidden | Public]; Profession (suggest)',
        })
    );
    const model = getKnowledgeSchemaModel(getActiveWorld(document));
    const orders = model.sections.find((section) => section.id === 'orders');

    expect(orders?.fields).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: 'founding-notes',
          mode: 'multiline-text',
        }),
        expect.objectContaining({
          key: 'standing',
          mode: 'controlled-value',
        }),
        expect.objectContaining({
          key: 'profession',
          mode: 'free-text',
          detail: 'Free text with suggestions from existing records.',
        }),
      ])
    );
    expect(
      model.vocabulary.rows.find((row) => row.id === 'orders:standing')
    ).toMatchObject({
      fieldLabel: 'Standing',
      sourceLabel: 'Suggested values',
      values: ['Hidden', 'Public'],
    });
  });

  it('summarizes hidden detail cleanup targets after custom field removal', () => {
    const withCustomType = updateActiveWorkspace(
      createSeedWorldDocument(),
      (workspace) =>
        createCustomEntryType(workspace, {
          title: 'Artifacts',
          singularTitle: 'Artifact',
          description: 'Objects with story weight.',
          fields: 'Origin, Power',
        })
    );
    const customSection = getActiveWorld(withCustomType).entryTypes.find(
      (section) => section.id === 'artifacts'
    );
    const customEntry = entryFromDraft(customSection!, {
      name: 'Glass Key',
      summary: 'A key made of dawn glass.',
      notes: '',
      tags: 'artifact',
      status: 'draft',
      pinned: false,
      details: { origin: 'Glassroot Forest', power: 'Opens dawn doors' },
    });
    const withCustomEntry = updateActiveWorkspace(
      withCustomType,
      (workspace) => ({
        ...workspace,
        codex: applyEntry(workspace.codex, customEntry, workspace.entryTypes),
      })
    );
    const withRemovedField = updateActiveWorkspace(
      withCustomEntry,
      (workspace) => removeCustomEntryTypeField(workspace, 'artifacts', 'power')
    );
    const model = getKnowledgeSchemaModel(getActiveWorld(withRemovedField));

    expect(model.totals.hiddenDetailCount).toBe(1);
    expect(model.hiddenDetails.rows).toEqual([
      {
        id: `artifacts:${customEntry.id}:power`,
        sectionId: 'artifacts',
        sectionTitle: 'Artifacts',
        entryId: customEntry.id,
        entryName: 'Glass Key',
        fieldKey: 'power',
        fieldLabel: 'Power',
        value: 'Opens dawn doors',
        route: `/entries?sectionId=artifacts&entryId=${customEntry.id}&intent=edit&query=Glass%20Key`,
      },
    ]);
  });

  it('derives lore definition types from current lore categories', () => {
    const world = getActiveWorld(createSeedWorldDocument());
    const model = getKnowledgeSchemaModel(world);

    expect(model.reusableKnowledge.loreDefinitions).toEqual([
      {
        id: 'navigation-practice',
        label: 'Navigation practice',
        count: 1,
        countLabel: '1 lore note',
        route: '/entries?sectionId=lore&query=Navigation%20practice',
      },
      {
        id: 'travel-custom',
        label: 'Travel custom',
        count: 1,
        countLabel: '1 lore note',
        route: '/entries?sectionId=lore&query=Travel%20custom',
      },
    ]);
  });
});
