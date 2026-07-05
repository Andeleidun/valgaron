import type {
  WorldEntry,
  WorldRelationship,
  WorldSectionConfig,
} from './types';
import {
  createEmptyDraft,
  draftFromEntry,
  type EntryDraft,
} from './codexEntries';
import { getEntryDetailFields, getDraftDetailFields } from './placeTaxonomy';
import {
  getRelationshipFieldConfigsForEntryKind,
  getRelationshipFieldLinks,
} from './relationshipFields';

export type EntryTemplateDraft = Pick<
  EntryDraft,
  'summary' | 'notes' | 'tags' | 'details'
>;

export type EntryCompleteness = {
  entry: WorldEntry;
  section: WorldSectionConfig;
  completed: number;
  total: number;
  percent: number;
  prompts: string[];
};

const templateNotesByKind: Record<string, string> = {
  character:
    '## Role in the story\n\n## Wants\n\n## Fears\n\n## Relationships\n\n## Secrets\n\n## Open questions',
  place:
    '## First impression\n\n## History\n\n## Current tension\n\n## Secrets\n\n## Open questions',
  faction:
    '## Public purpose\n\n## Hidden agenda\n\n## Resources\n\n## Enemies\n\n## Open questions',
  lore: '## Rule or belief\n\n## Source\n\n## Exceptions\n\n## Story implications\n\n## Open questions',
  timeline:
    '## Causes\n\n## Immediate outcome\n\n## Long-term consequences\n\n## Open questions',
};

const detailPromptsByKey: Record<string, string> = {
  role: 'Define this character role.',
  home: 'Give this character a home or origin.',
  affiliation: 'Connect this character to a group or allegiance.',
  statusNote: 'Describe this character current status.',
  characterCategory: 'Choose a character category.',
  narrativeRole: 'Define this character narrative role.',
  ancestry: 'Add this character ancestry when relevant.',
  profession: 'Add this character profession when relevant.',
  homePlace: 'Give this character a home, lair, or base.',
  affiliations: 'Connect this character to a group or allegiance.',
  currentStatus: 'Describe this character current status.',
  region: 'Assign this place to a region.',
  climate: 'Describe the climate or atmosphere.',
  significance: 'Explain why this place matters.',
  purpose: 'Define this faction purpose.',
  influence: 'Describe this faction influence.',
  headquarters: 'Name this faction headquarters.',
  category: 'Choose a category.',
  source: 'Name where this lore comes from.',
  implications: 'Explain why this lore matters.',
  dateLabel: 'Give this event a date or order label.',
  era: 'Assign this event to an era.',
  consequences: 'Describe what changed after this event.',
};

/** Build a deterministic starter template for an entry type. */
export function createTemplateDraft(
  section: WorldSectionConfig
): EntryTemplateDraft {
  return {
    summary: '',
    notes:
      templateNotesByKind[section.kind] ??
      '## Overview\n\n## Details\n\n## Connections\n\n## Open questions',
    tags: section.kind,
    details: Object.fromEntries(
      getDraftDetailFields(section).map((field) => [field.key, ''])
    ),
  };
}

export function createSectionEntryDraft(
  section: WorldSectionConfig
): EntryDraft {
  return {
    ...createEmptyDraft(),
    tags: section.kind,
    details: Object.fromEntries(
      getDraftDetailFields(section).map((field) => [field.key, ''])
    ),
  };
}

export function createEntryTemplateDraft(
  entry: WorldEntry,
  section: WorldSectionConfig
): EntryDraft {
  return {
    ...draftFromEntry(entry, section),
    name: `${entry.name} Template`,
    status: 'draft',
  };
}

export function applyEntrySectionTemplate(
  draft: EntryDraft,
  section: WorldSectionConfig
): EntryDraft {
  const template = createTemplateDraft(section);
  return {
    ...draft,
    summary: draft.summary || template.summary,
    notes: draft.notes || template.notes,
    tags: draft.tags || template.tags,
    details: { ...template.details, ...draft.details },
  };
}

/** Score an entry for lightweight drafting completeness. */
export function getEntryCompleteness(
  entry: WorldEntry,
  section: WorldSectionConfig,
  relationships: readonly WorldRelationship[] = []
): EntryCompleteness {
  const relationshipFieldConfigByKey = new Map(
    getRelationshipFieldConfigsForEntryKind(entry.kind).map((config) => [
      config.fieldKey,
      config,
    ])
  );
  const checks = [
    {
      complete: entry.summary.trim().length > 0,
      prompt: 'Add a short summary.',
    },
    {
      complete: entry.notes.trim().length > 0,
      prompt: 'Add Markdown notes.',
    },
    {
      complete: entry.tags.length > 0,
      prompt: 'Add at least one tag.',
    },
    ...getEntryDetailFields(section, entry).map((field) => ({
      complete:
        (entry.fields[field.key] ?? '').trim().length > 0 ||
        Boolean(
          relationshipFieldConfigByKey.has(field.key) &&
            getRelationshipFieldLinks(
              relationships,
              entry,
              relationshipFieldConfigByKey.get(field.key)!
            ).length > 0
        ),
      prompt: detailPromptsByKey[field.key] ?? `Fill in ${field.label}.`,
    })),
  ];
  const completed = checks.filter((check) => check.complete).length;
  const total = checks.length;
  return {
    entry,
    section,
    completed,
    total,
    percent: Math.round((completed / total) * 100),
    prompts: checks
      .filter((check) => !check.complete)
      .map((check) => check.prompt),
  };
}

/** Return incomplete visible entries ordered by least complete first. */
export function getIncompleteEntries(
  entries: readonly WorldEntry[],
  sections: readonly WorldSectionConfig[],
  relationships: readonly WorldRelationship[] = []
): EntryCompleteness[] {
  return entries
    .map((entry) => {
      const section = sections.find((item) => item.kind === entry.kind);
      return section
        ? getEntryCompleteness(entry, section, relationships)
        : null;
    })
    .filter(
      (result): result is EntryCompleteness =>
        result !== null &&
        result.percent < 100 &&
        result.entry.status !== 'archived'
    )
    .sort((first, second) => first.percent - second.percent);
}
