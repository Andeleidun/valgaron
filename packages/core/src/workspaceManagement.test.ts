import { describe, expect, it } from '@jest/globals';
import { applyEntry, entryFromDraft } from './codexEntries';
import { relationshipFromDraft } from './codexRelationships';
import { createSeedWorldDocument } from './seedCodex';
import {
  createCustomEntryType,
  createWorkspace,
  deleteCustomEntryType,
  deletePlanetaryWorld,
  deleteWorkspace,
  duplicateWorkspace,
  getWorkspaceActionState,
  lastActiveWorkspaceArchiveMessage,
  planetaryWorldDraftFrom,
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

  it('does not archive the last active workspace', () => {
    const document = createSeedWorldDocument();

    expect(
      setWorkspaceArchived(document, document.activeWorldId, true)
    ).toEqual(document);
    expect(lastActiveWorkspaceArchiveMessage).toContain('one active workspace');

    const created = createWorkspace(document, {
      name: 'Archive Target',
      summary: '',
      defaultEra: '',
    });
    const archivedOriginal = setWorkspaceArchived(
      created,
      document.activeWorldId,
      true
    );
    const archivedCreated = setWorkspaceArchived(
      archivedOriginal,
      created.activeWorldId,
      true
    );

    expect(archivedCreated).toEqual(archivedOriginal);
    expect(getActiveWorld(archivedCreated).status).toBe('active');
  });

  it('summarizes workspace action availability for web and mobile screens', () => {
    const world = getActiveWorld(createSeedWorldDocument());

    expect(
      getWorkspaceActionState({
        activeWorkspaceId: world.id,
        activeWorkspaceCount: 1,
        workspace: world,
        workspaceCount: 1,
      })
    ).toEqual({
      switchLabel: 'Current',
      canSwitch: false,
      canArchive: false,
      canDelete: false,
    });
    expect(
      getWorkspaceActionState({
        activeWorkspaceId: 'other-workspace',
        activeWorkspaceCount: 2,
        workspace: world,
        workspaceCount: 2,
      })
    ).toEqual({
      switchLabel: 'Switch',
      canSwitch: true,
      canArchive: true,
      canDelete: true,
    });
    expect(
      getWorkspaceActionState({
        activeWorkspaceId: 'other-workspace',
        activeWorkspaceCount: 1,
        workspace: { ...world, status: 'archived' },
        workspaceCount: 2,
      })
    ).toEqual({
      switchLabel: 'Archived',
      canSwitch: false,
      canArchive: true,
      canDelete: true,
    });
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

  it('converts an in-fiction world into an editable draft', () => {
    const planetaryWorld = getActiveWorld(createSeedWorldDocument())
      .planetaryWorlds[0];

    expect(planetaryWorldDraftFrom(planetaryWorld)).toEqual({
      name: planetaryWorld.name,
      summary: planetaryWorld.summary,
      classification: planetaryWorld.classification,
      climate: planetaryWorld.climate,
      dominantTerrain: planetaryWorld.dominantTerrain,
      notes: planetaryWorld.notes,
      tags: planetaryWorld.tags.join(', '),
    });
    expect(planetaryWorldDraftFrom()).toEqual({
      name: '',
      summary: '',
      classification: '',
      climate: '',
      dominantTerrain: '',
      notes: '',
      tags: '',
    });
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
    expect(customSection?.detailFields).toEqual([
      { key: 'origin', label: 'Origin' },
      { key: 'power', label: 'Power' },
    ]);

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

  it('removes custom entries and their relationships when deleting a custom entry type', () => {
    const document = createSeedWorldDocument();
    const withCustomType = updateActiveWorkspace(document, (workspace) =>
      createCustomEntryType(workspace, {
        title: 'Artifacts',
        singularTitle: 'Artifact',
        description: 'Objects with story weight.',
        fields: 'Origin',
      })
    );
    const customSection = getActiveWorld(withCustomType).entryTypes.find(
      (section) => section.id === 'artifacts'
    );

    expect(customSection).toBeDefined();
    const customEntry = entryFromDraft(customSection!, {
      name: 'Glass Key',
      summary: 'A key made of dawn glass.',
      notes: '',
      tags: 'artifact',
      status: 'draft',
      pinned: false,
      details: { origin: 'Glassroot Forest' },
    });
    const withCustomEntry = updateActiveWorkspace(
      withCustomType,
      (workspace) => ({
        ...workspace,
        codex: applyEntry(workspace.codex, customEntry, workspace.entryTypes),
        relationships: [
          relationshipFromDraft({
            sourceEntryId: customEntry.id,
            targetEntryId: 'character-mira-rowan',
            type: 'carried by',
            directional: true,
            note: '',
            status: 'draft',
          }),
          ...workspace.relationships,
        ],
      })
    );
    const withoutCustomType = updateActiveWorkspace(
      withCustomEntry,
      (workspace) => deleteCustomEntryType(workspace, 'artifacts')
    );
    const activeWorld = getActiveWorld(withoutCustomType);

    expect(activeWorld.codex.artifacts).toBeUndefined();
    expect(
      activeWorld.relationships.some(
        (relationship) =>
          relationship.sourceEntryId === customEntry.id ||
          relationship.targetEntryId === customEntry.id
      )
    ).toBe(false);
  });

  it('keeps custom entry kinds distinct from built-in entry kinds', () => {
    const document = createSeedWorldDocument();
    const withCustomType = updateActiveWorkspace(document, (workspace) =>
      createCustomEntryType(workspace, {
        title: 'Character Variants',
        singularTitle: 'Character',
        description: 'Alternate character drafts.',
        fields: 'Variant note',
      })
    );
    const customSection = getActiveWorld(withCustomType).entryTypes.find(
      (section) => section.id === 'character-variants'
    );

    expect(customSection).toMatchObject({
      id: 'character-variants',
      kind: 'character-2',
    });
  });

  it('keeps duplicate custom detail field keys unique', () => {
    const document = createSeedWorldDocument();
    const withCustomType = updateActiveWorkspace(document, (workspace) =>
      createCustomEntryType(workspace, {
        title: 'Relics',
        singularTitle: 'Relic',
        description: 'Rare objects.',
        fields: 'Power, Power, Field!!!',
      })
    );
    const customSection = getActiveWorld(withCustomType).entryTypes.find(
      (section) => section.id === 'relics'
    );

    expect(customSection?.detailFields).toEqual([
      { key: 'power', label: 'Power' },
      { key: 'power-2', label: 'Power' },
      { key: 'field', label: 'Field!!!' },
    ]);
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
