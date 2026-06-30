import { describe, expect, it } from '@jest/globals';
import {
  createTemplateDraft,
  getEntryCompleteness,
  getIncompleteEntries,
} from './codexTemplates';
import { createSeedCodex, worldSections } from './seedCodex';

describe('codex templates and completeness helpers', () => {
  it('creates deterministic section templates', () => {
    const section = worldSections[0];
    const template = createTemplateDraft(section);

    expect(template.tags).toBe('character');
    expect(template.notes).toContain('## Role in the story');
    expect(Object.keys(template.details)).toEqual([
      'role',
      'home',
      'affiliation',
      'statusNote',
    ]);
  });

  it('scores incomplete entries and returns prompts', () => {
    const section = worldSections[0];
    const entry = {
      ...createSeedCodex().characters[0],
      summary: '',
      notes: '',
      tags: [],
      fields: {
        role: '',
        home: 'Harbor District',
        affiliation: '',
        statusNote: '',
      },
    };
    const completeness = getEntryCompleteness(entry, section);

    expect(completeness.percent).toBeLessThan(100);
    expect(completeness.prompts).toContain('Add a short summary.');
    expect(completeness.prompts).toContain('Define this character role.');
  });

  it('returns incomplete visible entries by least complete first', () => {
    const codex = createSeedCodex();
    const incomplete = {
      ...codex.characters[0],
      summary: '',
      notes: '',
      tags: [],
      fields: {},
    };
    const archivedIncomplete = {
      ...codex.characters[1],
      summary: '',
      status: 'archived' as const,
    };

    expect(
      getIncompleteEntries([archivedIncomplete, incomplete], worldSections).map(
        (result) => result.entry.id
      )
    ).toEqual(['character-mira-rowan']);
  });
});
