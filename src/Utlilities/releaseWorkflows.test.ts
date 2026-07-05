import { describe, expect, it } from '@jest/globals';
import {
  applyEntry,
  createEmptyDraft,
  createCustomEntryType,
  createSeedWorldDocument,
  createWorkspace,
  deleteEntry,
  deleteRelationshipsForEntry,
  entryFromDraft,
  findEntryById,
  getActiveWorld,
  getEntries,
  relationshipFromDraft,
  parseWorldImport,
  serializeActiveWorldBackup,
  setEntryArchived,
  updateActiveWorkspace,
  upsertRelationship,
} from '@valgaron/core';

describe('release-critical workflows', () => {
  it('supports entry create, archive, restore, relationship link, and safe delete cleanup', () => {
    const document = createSeedWorldDocument();
    const activeWorld = getActiveWorld(document);
    const characterSection = activeWorld.entryTypes.find(
      (section) => section.id === 'characters'
    );
    const placeEntry = getEntries(activeWorld.codex, 'places')[0];

    if (!characterSection || !placeEntry) {
      throw new Error('Seed data is missing required workflow fixtures.');
    }

    const draft = {
      ...createEmptyDraft(),
      name: 'Test Cartographer',
      summary: 'Maps unstable trade routes.',
      notes: 'Keeps a private route ledger.',
      tags: 'maps, routes',
      status: 'canon' as const,
      details: {
        characterCategory: 'Humanoid person',
        narrativeRole: 'Route mapper',
        ancestry: 'Human',
        profession: 'Cartographer',
        homePlace: placeEntry.name,
        affiliations: 'Survey guild',
        loyalty: 'Survey guild',
      },
    };
    const createdEntry = entryFromDraft(characterSection, draft);
    const codexWithEntry = applyEntry(
      activeWorld.codex,
      createdEntry,
      activeWorld.entryTypes
    );

    expect(
      findEntryById(codexWithEntry, activeWorld.entryTypes, createdEntry.id)
        ?.name
    ).toBe('Test Cartographer');

    const archivedCodex = setEntryArchived(
      codexWithEntry,
      createdEntry,
      true,
      activeWorld.entryTypes
    );
    const archivedEntry = findEntryById(
      archivedCodex,
      activeWorld.entryTypes,
      createdEntry.id
    );

    expect(archivedEntry?.status).toBe('archived');

    if (!archivedEntry) {
      throw new Error('Archived entry was not found.');
    }

    const restoredCodex = setEntryArchived(
      archivedCodex,
      archivedEntry,
      false,
      activeWorld.entryTypes
    );
    const restoredEntry = findEntryById(
      restoredCodex,
      activeWorld.entryTypes,
      createdEntry.id
    );

    expect(restoredEntry?.status).toBe('draft');

    const relationship = relationshipFromDraft({
      sourceEntryId: createdEntry.id,
      targetEntryId: placeEntry.id,
      type: 'located in',
      directional: true,
      note: 'The cartographer works from this place.',
      status: 'canon',
    });
    const relationshipsWithLink = upsertRelationship(
      activeWorld.relationships,
      relationship
    );

    expect(relationshipsWithLink).toContainEqual(relationship);

    const codexAfterDelete = deleteEntry(
      restoredCodex,
      createdEntry,
      activeWorld.entryTypes
    );
    const relationshipsAfterDelete = deleteRelationshipsForEntry(
      relationshipsWithLink,
      createdEntry.id
    );

    expect(
      findEntryById(codexAfterDelete, activeWorld.entryTypes, createdEntry.id)
    ).toBeNull();
    expect(
      relationshipsAfterDelete.some(
        (item) =>
          item.sourceEntryId === createdEntry.id ||
          item.targetEntryId === createdEntry.id
      )
    ).toBe(false);
  });

  it('exports and imports a complete active workspace backup with custom structure', () => {
    let document = createWorkspace(createSeedWorldDocument(), {
      name: 'Release Gate Workspace',
      summary: 'Workspace used to verify backup round trips.',
      defaultEra: 'Founding',
    });

    document = updateActiveWorkspace(document, (workspace) => {
      const placeSection = workspace.entryTypes.find(
        (section) => section.id === 'places'
      );
      if (!placeSection) {
        throw new Error('Places section is missing.');
      }
      const moonPlace = entryFromDraft(placeSection, {
        ...createEmptyDraft(),
        name: 'Test Moon',
        summary: 'A neutral moon fixture.',
        notes: 'Used by release workflow tests.',
        tags: 'fixture, moon',
        details: {
          category: 'Moon',
          region: 'Release fixture orbit',
          climate: 'Cold',
          significance: 'Basalt plains used by release workflow tests.',
        },
      });
      return createCustomEntryType(
        {
          ...workspace,
          codex: applyEntry(workspace.codex, moonPlace, workspace.entryTypes),
        },
        {
          title: 'Artifacts',
          singularTitle: 'Artifact',
          description: 'Objects with worldbuilding importance.',
          fields: 'Origin, Current Keeper',
        }
      );
    });

    const serializedBackup = serializeActiveWorldBackup(document);
    const importResult = parseWorldImport(serializedBackup);

    if (!importResult.ok) {
      throw new Error(importResult.error);
    }

    const importedWorld = getActiveWorld(importResult.document);

    expect(importResult.preview).toMatchObject({
      activeWorldName: 'Release Gate Workspace',
      worldCount: 1,
      planetaryWorldCount: 0,
    });
    expect(importedWorld.codex.places.map((entry) => entry.name)).toContain(
      'Test Moon'
    );
    expect(importedWorld.entryTypes.map((section) => section.title)).toContain(
      'Artifacts'
    );
  });
});
