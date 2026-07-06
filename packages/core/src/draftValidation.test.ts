import { describe, expect, it } from '@jest/globals';
import { createEmptyDraft } from './codexEntries';
import { createEmptyRelationshipDraft } from './codexRelationships';
import {
  formatDraftValidationErrors,
  validateEntryDraft,
  validateEntryTypeDraft,
  validatePlanetaryWorldDraft,
  validateRelationshipDraft,
  validateWorkspaceDraft,
} from './draftValidation';
import { createSeedWorldDocument, worldSections } from './seedCodex';
import { getActiveWorld } from './worldDocument';

describe('draft validation', () => {
  it('requires entry names while allowing fast summary-free capture', () => {
    const section = worldSections[0];
    const draft = createEmptyDraft();

    expect(validateEntryDraft(section, draft)).toEqual({
      ok: false,
      errors: ['Character name is required.'],
    });
    expect(validateEntryDraft(section, { ...draft, name: 'Mira' })).toEqual({
      ok: true,
    });
  });

  it('validates restricted workspace vocabulary fields', () => {
    const world = getActiveWorld(createSeedWorldDocument());
    const section = world.entryTypes.find((item) => item.id === 'characters');
    if (!section) {
      throw new Error('Expected character section.');
    }
    const workspaceSchema = {
      ...world.schema,
      vocabularies: world.schema.vocabularies.map((vocabulary) =>
        vocabulary.id === 'character-profession'
          ? {
              ...vocabulary,
              values: vocabulary.values.map((value) =>
                value.label === 'Surveyor'
                  ? { ...value, aliases: ['Pathfinder'] }
                  : value
              ),
            }
          : vocabulary
      ),
      fieldOverrides: {
        ...world.schema.fieldOverrides,
        characters: {
          ...world.schema.fieldOverrides.characters,
          profession: {
            ...world.schema.fieldOverrides.characters?.profession,
            vocabularyId: 'character-profession',
            vocabularyMode: 'restricted' as const,
          },
        },
      },
    };
    const draft = {
      ...createEmptyDraft(),
      name: 'Mira',
      details: { profession: 'Navigator' },
    };

    expect(validateEntryDraft(section, draft, { workspaceSchema })).toEqual({
      ok: false,
      errors: [
        'Profession must use an active Character profession value. Try Artisan, Guide, Healer, Mage, Merchant.',
      ],
    });
    expect(
      validateEntryDraft(
        section,
        { ...draft, details: { profession: 'Surveyor' } },
        { workspaceSchema }
      )
    ).toEqual({ ok: true });
    expect(
      validateEntryDraft(
        section,
        { ...draft, details: { profession: 'Pathfinder' } },
        { workspaceSchema }
      )
    ).toEqual({ ok: true });
    expect(
      validateEntryDraft(
        section,
        { ...draft, details: { profession: '' } },
        { workspaceSchema }
      )
    ).toEqual({ ok: true });
  });

  it('validates relationship endpoints and type', () => {
    expect(validateRelationshipDraft(createEmptyRelationshipDraft())).toEqual({
      ok: false,
      errors: ['Source entry is required.', 'Target entry is required.'],
    });
    expect(
      validateRelationshipDraft({
        sourceEntryId: 'character-one',
        targetEntryId: 'character-one',
        type: 'member of',
        directional: true,
        note: '',
        status: 'draft',
      })
    ).toEqual({
      ok: false,
      errors: ['Choose two different entries.'],
    });
    expect(
      validateRelationshipDraft({
        sourceEntryId: 'character-one',
        targetEntryId: 'faction-one',
        type: 'member of',
        directional: true,
        note: '',
        status: 'draft',
      })
    ).toEqual({ ok: true });
    expect(
      validateRelationshipDraft(
        {
          sourceEntryId: 'missing-character',
          targetEntryId: 'faction-one',
          type: 'member of',
          directional: true,
          note: '',
          status: 'draft',
        },
        ['character-one', 'faction-one']
      )
    ).toEqual({
      ok: false,
      errors: ['Choose an existing source entry.'],
    });
  });

  it('validates workspace, world, and custom entry type drafts', () => {
    expect(
      validateWorkspaceDraft({ name: '', summary: '', defaultEra: '' })
    ).toEqual({
      ok: false,
      errors: ['Workspace name is required.'],
    });
    expect(
      validatePlanetaryWorldDraft({
        name: '',
        summary: '',
        classification: '',
        climate: '',
        dominantTerrain: '',
        notes: '',
        tags: '',
      })
    ).toEqual({
      ok: false,
      errors: ['In-fiction world or planet name is required.'],
    });
    expect(
      validateEntryTypeDraft({
        title: '',
        singularTitle: '',
        description: '',
        fields: '',
      })
    ).toEqual({
      ok: false,
      errors: ['Title is required.', 'Singular title is required.'],
    });
  });

  it('formats validation errors for single-message form surfaces', () => {
    expect(
      formatDraftValidationErrors({
        ok: false,
        errors: ['First.', 'Second.'],
      })
    ).toBe('First. Second.');
  });
});
