import { describe, expect, it } from '@jest/globals';
import { createSeedWorldDocument } from './seedCodex';
import {
  createCustomEntryType,
  createWorkspace,
  deleteCustomEntryType,
  deletePlanetaryWorld,
  deleteWorkspace,
  duplicateWorkspace,
  setActiveWorkspace,
  setPlanetaryWorldArchived,
  setWorkspaceArchived,
  updateActiveWorkspace,
  updateWorkspaceMetadata,
  upsertPlanetaryWorld,
} from './workspaceManagement';
import { getActiveWorld, parseWorldDocument } from './worldDocument';

describe('workspace management', () => {
  it('creates, switches, edits, archives, restores, duplicates, and deletes workspaces', () => {
    const document = createSeedWorldDocument();
    const created = createWorkspace(document, {
      name: 'Second Universe',
      summary: 'Parallel project notes.',
      defaultEra: 'Second Era',
    });
    const activeCreated = getActiveWorld(created);

    expect(created.worlds).toHaveLength(2);
    expect(activeCreated.name).toBe('Second Universe');
    expect(activeCreated.planetaryWorlds).toEqual([]);

    const edited = updateWorkspaceMetadata(created, activeCreated.id, {
      name: 'Edited Universe',
      summary: 'Edited project notes.',
      defaultEra: 'Edited Era',
    });

    expect(getActiveWorld(edited).name).toBe('Edited Universe');

    const switched = setActiveWorkspace(edited, document.activeWorldId);
    expect(getActiveWorld(switched).name).toBe('Sample Atlas');

    const archived = setWorkspaceArchived(
      switched,
      document.activeWorldId,
      true
    );
    expect(getActiveWorld(archived).name).toBe('Edited Universe');
    expect(
      archived.worlds.find(
        (workspace) => workspace.id === document.activeWorldId
      )?.status
    ).toBe('archived');

    const restored = setWorkspaceArchived(
      archived,
      document.activeWorldId,
      false
    );
    const duplicated = duplicateWorkspace(restored, document.activeWorldId);

    expect(duplicated.worlds).toHaveLength(3);
    expect(getActiveWorld(duplicated).name).toBe('Sample Atlas Copy');

    const deleted = deleteWorkspace(duplicated, getActiveWorld(duplicated).id);

    expect(deleted.worlds).toHaveLength(2);
    expect(deleted.activeWorldId).not.toBe(getActiveWorld(duplicated).id);
  });

  it('does not delete the last workspace', () => {
    const document = createSeedWorldDocument();

    expect(deleteWorkspace(document, document.activeWorldId)).toEqual(document);
  });

  it('manages in-fiction worlds inside the active workspace', () => {
    const document = createSeedWorldDocument();
    const created = updateActiveWorkspace(document, (workspace) =>
      upsertPlanetaryWorld(workspace, {
        name: 'Mire',
        summary: 'A cold ocean planet.',
        classification: 'Ocean planet',
        climate: 'Cold storms',
        dominantTerrain: 'Open water',
        notes: 'Markdown notes',
        tags: 'ocean, cold',
      })
    );
    const newPlanet = getActiveWorld(created).planetaryWorlds.find(
      (planetaryWorld) => planetaryWorld.name === 'Mire'
    );

    expect(newPlanet).toMatchObject({
      classification: 'Ocean planet',
      tags: ['ocean', 'cold'],
    });

    const archived = updateActiveWorkspace(created, (workspace) =>
      setPlanetaryWorldArchived(workspace, newPlanet?.id ?? '', true)
    );
    expect(
      getActiveWorld(archived).planetaryWorlds.find(
        (planetaryWorld) => planetaryWorld.id === newPlanet?.id
      )?.status
    ).toBe('archived');

    const deleted = updateActiveWorkspace(archived, (workspace) =>
      deletePlanetaryWorld(workspace, newPlanet?.id ?? '')
    );
    expect(
      getActiveWorld(deleted).planetaryWorlds.some(
        (planetaryWorld) => planetaryWorld.id === newPlanet?.id
      )
    ).toBe(false);
  });

  it('creates and deletes custom entry types', () => {
    const document = createSeedWorldDocument();
    const withCustomType = updateActiveWorkspace(document, (workspace) =>
      createCustomEntryType(workspace, {
        title: 'Artifacts',
        singularTitle: 'Artifact',
        description: 'Objects with story weight.',
        fields: 'Origin, Power',
      })
    );
    const activeWorld = getActiveWorld(withCustomType);
    const customSection = activeWorld.entryTypes.find(
      (section) => section.id === 'artifacts'
    );

    expect(customSection).toMatchObject({
      custom: true,
      singularTitle: 'Artifact',
    });
    expect(activeWorld.codex.artifacts).toEqual([]);

    const withoutCustomType = updateActiveWorkspace(
      withCustomType,
      (workspace) => deleteCustomEntryType(workspace, 'artifacts')
    );

    expect(
      getActiveWorld(withoutCustomType).entryTypes.some(
        (section) => section.id === 'artifacts'
      )
    ).toBe(false);
    expect(getActiveWorld(withoutCustomType).codex.artifacts).toBeUndefined();
  });
});

describe('workspace document parsing', () => {
  it('defaults legacy workspaces to active status and no planetary worlds', () => {
    const document = createSeedWorldDocument();
    const legacyWorkspace = getActiveWorld(document);
    const parsed = parseWorldDocument({
      ...document,
      worlds: [
        {
          id: legacyWorkspace.id,
          name: legacyWorkspace.name,
          summary: legacyWorkspace.summary,
          defaultEra: legacyWorkspace.defaultEra,
          entryTypes: legacyWorkspace.entryTypes,
          codex: legacyWorkspace.codex,
          relationships: legacyWorkspace.relationships,
          createdAt: legacyWorkspace.createdAt,
          updatedAt: legacyWorkspace.updatedAt,
        },
      ],
    });

    expect(parsed).not.toBeNull();
    expect(getActiveWorld(parsed ?? document)).toMatchObject({
      status: 'active',
      planetaryWorlds: [],
    });
  });
});
