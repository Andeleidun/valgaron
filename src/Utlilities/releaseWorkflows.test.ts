import { describe, expect, it } from '@jest/globals';
import {
  applyEntry,
  createEmptyDraft,
  deleteEntry,
  entryFromDraft,
  getEntries,
  setEntryArchived,
} from './codexEntries';
import {
  deleteRelationshipsForEntry,
  findEntryById,
  relationshipFromDraft,
  upsertRelationship,
} from './codexRelationships';
import {
  parseWorldImport,
  serializeActiveWorldBackup,
} from './codexDataPortability';
import { createSeedWorldDocument } from './seedCodex';
import { getActiveWorld } from './worldDocument';
import {
  createCustomEntryType,
  createWorkspace,
  updateActiveWorkspace,
  upsertPlanetaryWorld,
} from './workspaceManagement';

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
        role: 'Cartographer',
        home: placeEntry.name,
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

    document = updateActiveWorkspace(document, (workspace) =>
      createCustomEntryType(
        upsertPlanetaryWorld(workspace, {
          name: 'Test Moon',
          summary: 'A neutral moon fixture.',
          classification: 'Moon',
          climate: 'Cold',
          dominantTerrain: 'Basalt plains',
          notes: 'Used by release workflow tests.',
          tags: 'fixture, moon',
        }),
        {
          title: 'Artifacts',
          singularTitle: 'Artifact',
          description: 'Objects with worldbuilding importance.',
          fields: 'Origin, Current Keeper',
        }
      )
    );

    const serializedBackup = serializeActiveWorldBackup(document);
    const importResult = parseWorldImport(serializedBackup);

    if (!importResult.ok) {
      throw new Error(importResult.error);
    }

    const importedWorld = getActiveWorld(importResult.document);

    expect(importResult.preview).toMatchObject({
      activeWorldName: 'Release Gate Workspace',
      worldCount: 1,
      planetaryWorldCount: 1,
    });
    expect(importedWorld.planetaryWorlds.map((world) => world.name)).toContain(
      'Test Moon'
    );
    expect(importedWorld.entryTypes.map((section) => section.title)).toContain(
      'Artifacts'
    );
  });
});
