import { describe, expect, it } from '@jest/globals';
import {
  applyEntrySectionTemplate,
  createEntryTemplateDraft,
  createSectionEntryDraft,
  createTemplateDraft,
  getEntryCompleteness,
  getIncompleteEntries,
} from './codexTemplates';
import { createSeedCodex, seedRelationships, worldSections } from './seedCodex';

describe('codex templates and completeness helpers', () => {
  it('creates deterministic section templates', () => {
    const section = worldSections[0];
    const template = createTemplateDraft(section);

    expect(template.tags).toBe('character');
    expect(template.notes).toContain('## Role in the story');
    expect(Object.keys(template.details)).toEqual([
      'characterCategory',
      'narrativeRole',
      'ancestry',
      'profession',
      'homePlace',
      'affiliations',
      'currentStatus',
    ]);
  });

  it('creates compact section entry drafts', () => {
    const section = worldSections[0];
    const draft = createSectionEntryDraft(section);

    expect(draft.tags).toBe('character');
    expect(draft.details).toEqual({
      characterCategory: '',
      narrativeRole: '',
      ancestry: '',
      profession: '',
      homePlace: '',
      affiliations: '',
      currentStatus: '',
    });
  });

  it('seeds timeline draft era from creation context', () => {
    const timelineSection = worldSections.find(
      (section) => section.id === 'timeline'
    );
    const characterSection = worldSections.find(
      (section) => section.id === 'characters'
    );
    if (!timelineSection || !characterSection) {
      throw new Error('Expected seed section config.');
    }

    expect(
      createSectionEntryDraft(timelineSection, {
        timelineEra: '  Charter Era  ',
      }).details.era
    ).toBe('Charter Era');
    expect(
      createSectionEntryDraft(characterSection, {
        timelineEra: 'Charter Era',
      }).details
    ).not.toHaveProperty('era');
  });

  it('creates reusable template drafts from existing entries', () => {
    const codex = createSeedCodex();
    const section = worldSections[0];
    const draft = createEntryTemplateDraft(codex.characters[0], section);

    expect(draft.name).toBe('Mira Rowan Template');
    expect(draft.status).toBe('draft');
    expect(draft.details.profession).toBe('Surveyor');
  });

  it('applies section templates without overwriting existing draft content', () => {
    const section = worldSections[0];
    const draft = applyEntrySectionTemplate(
      { ...createSectionEntryDraft(section), tags: '', notes: '' },
      section
    );

    expect(draft.tags).toBe('character');
    expect(draft.notes).toContain('## Role in the story');
    expect(draft.details).toHaveProperty('characterCategory');
  });

  it('scores incomplete entries and returns prompts', () => {
    const section = worldSections[0];
    const entry = {
      ...createSeedCodex().characters[0],
      summary: '',
      notes: '',
      tags: [],
      fields: {
        characterCategory: '',
        narrativeRole: '',
        ancestry: 'Human',
        profession: '',
        homePlace: 'Harbor District',
        affiliations: '',
        currentStatus: '',
      },
    };
    const completeness = getEntryCompleteness(entry, section);

    expect(completeness.percent).toBeLessThan(100);
    expect(completeness.prompts).toContain('Add a short summary.');
    expect(completeness.prompts).toContain('Choose a character category.');
  });

  it('counts relationship-backed fields as complete when a matching link exists', () => {
    const section = worldSections[0];
    const entry = {
      ...createSeedCodex().characters[0],
      fields: {
        ...createSeedCodex().characters[0].fields,
        affiliations: '',
      },
    };

    expect(getEntryCompleteness(entry, section).prompts).toContain(
      'Connect this character to a group or allegiance.'
    );
    expect(
      getEntryCompleteness(entry, section, seedRelationships).prompts
    ).not.toContain('Connect this character to a group or allegiance.');
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
