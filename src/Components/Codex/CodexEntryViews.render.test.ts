import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, jest } from '@jest/globals';
import {
  createEmptyDraft,
  createTimelineInvolvedRecordStagedRelationship,
  createSeedWorldDocument,
  getActiveWorld,
  getEntries,
  type WorldEntry,
  type WorldSectionConfig,
} from '@valgaron/core';
import { EntryForm, TimelineEventEditor } from './CodexEntryViews';

describe('EntryForm browser rendering', () => {
  it('shows visible suggestion actions for configured detail fields', () => {
    const world = getActiveWorld(createSeedWorldDocument());
    const section = world.entryTypes.find(
      (entryType) => entryType.id === 'characters'
    );
    if (!section) {
      throw new Error('Expected seed character section.');
    }
    const draft = createEmptyDraft();
    draft.details.characterCategory = 'Humanoid person';

    const markup = renderToStaticMarkup(
      React.createElement(EntryForm, {
        codex: world.codex,
        initialDraft: draft,
        onArchive: jest.fn(),
        onCancel: jest.fn(),
        onDelete: jest.fn(),
        onDuplicate: jest.fn(),
        onRestore: jest.fn(),
        onSave: jest.fn(),
        onUseAsTemplate: jest.fn(),
        section,
        sectionEntries: getEntries(world.codex, section.id),
        sections: world.entryTypes,
        workspaceSchema: world.schema,
      })
    );

    expect(markup).toContain('Ancestry suggestions');
    expect(markup).toContain('aria-label="Use Human for Ancestry"');
    expect(markup).toContain('class="vwb-field-suggestion-button"');
  });

  it('shows when capped suggestion actions have more values available', () => {
    const world = getActiveWorld(createSeedWorldDocument());
    const section: WorldSectionConfig = {
      id: 'artifacts',
      kind: 'artifact',
      title: 'Artifacts',
      singularTitle: 'Artifact',
      description: 'Objects with history.',
      custom: true,
      detailFields: [
        {
          key: 'origin',
          label: 'Origin',
          suggestFromExistingValues: true,
        },
      ],
    };
    const sectionEntries: WorldEntry[] = Array.from(
      { length: 10 },
      (_, index) => ({
        createdAt: '2026-01-01T00:00:00.000Z',
        fields: { origin: `Origin ${index + 1}` },
        id: `artifact-${index + 1}`,
        kind: 'artifact',
        name: `Artifact ${index + 1}`,
        notes: '',
        pinned: false,
        status: 'draft',
        summary: '',
        tags: [],
        updatedAt: '2026-01-01T00:00:00.000Z',
      })
    );

    const markup = renderToStaticMarkup(
      React.createElement(EntryForm, {
        codex: { ...world.codex, artifacts: sectionEntries },
        initialDraft: createEmptyDraft(),
        onArchive: jest.fn(),
        onCancel: jest.fn(),
        onDelete: jest.fn(),
        onDuplicate: jest.fn(),
        onRestore: jest.fn(),
        onSave: jest.fn(),
        onUseAsTemplate: jest.fn(),
        section,
        sectionEntries,
        sections: [...world.entryTypes, section],
        workspaceSchema: world.schema,
      })
    );

    expect(markup).toContain('Origin suggestions');
    expect(markup).toContain(
      '2 more suggestions available. Type to use another value.'
    );
  });

  it('shows duplicate staged timeline involved-link pruning feedback', () => {
    const world = getActiveWorld(createSeedWorldDocument());
    const section = world.entryTypes.find(
      (entryType) => entryType.id === 'timeline'
    );
    if (!section) {
      throw new Error('Expected seed timeline section.');
    }
    const stagedRelationship = createTimelineInvolvedRecordStagedRelationship(
      'faction-cartographers-guild',
      'staged-timeline-link'
    );
    const duplicateStagedRelationship =
      createTimelineInvolvedRecordStagedRelationship(
        'faction-cartographers-guild',
        'staged-duplicate-timeline-link'
      );
    if (!stagedRelationship || !duplicateStagedRelationship) {
      throw new Error('Expected staged timeline links.');
    }

    const markup = renderToStaticMarkup(
      React.createElement(TimelineEventEditor, {
        codex: world.codex,
        initialDraft: createEmptyDraft(),
        initialStagedRelationships: [
          stagedRelationship,
          duplicateStagedRelationship,
        ],
        onArchive: jest.fn(),
        onCancel: jest.fn(),
        onDelete: jest.fn(),
        onDeleteRelationship: jest.fn(),
        onDuplicate: jest.fn(),
        onRestore: jest.fn(),
        onSaveDraft: () => null,
        onSaveRelationship: jest.fn(),
        onUseAsTemplate: jest.fn(),
        relationships: world.relationships,
        section,
        sections: world.entryTypes,
        workspaceSchema: world.schema,
      })
    );

    expect(markup).toContain('Create Timeline Event And 1 Link');
    expect(markup).toContain(
      'Duplicate involved links were removed from the save list.'
    );
  });
});
