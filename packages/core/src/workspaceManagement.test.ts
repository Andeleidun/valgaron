import { describe, expect, it } from '@jest/globals';
import { applyEntry, entryFromDraft } from './codexEntries';
import { relationshipFromDraft } from './codexRelationships';
import { createSeedWorldDocument } from './seedCodex';
import {
  addCustomEntryTypeFields,
  createCustomEntryType,
  createWorkspace,
  deleteCustomEntryType,
  deletePlanetaryWorld,
  deleteWorkspace,
  duplicateWorkspace,
  emptyEntryTypeDraft,
  entryTypeDraftFields,
  getEntryTypeDraftFieldLayout,
  getEntryTypeDraftFieldPreview,
  getPlanetaryWorldDraftFieldLayout,
  getWorkspaceActionState,
  lastActiveWorkspaceArchiveMessage,
  moveCustomEntryTypeField,
  normalizePlanetaryWorldDraft,
  normalizeWorkspaceDraft,
  parseCustomDetailFields,
  planetaryWorldDraftFrom,
  planetaryWorldDraftFields,
  renameCustomEntryTypeField,
  removeCustomEntryTypeField,
  addVocabularyValue,
  moveVocabularyValue,
  setVocabularyValueArchived,
  updateVocabularyValue,
  updateFieldOverride,
  setActiveWorkspace,
  setPlanetaryWorldArchived,
  setWorkspaceArchived,
  updateActiveWorkspace,
  updateWorkspaceMetadata,
  upsertPlanetaryWorld,
  vocabularyValueDraftFrom,
  workspaceDraftFrom,
  workspaceDraftFields,
} from './workspaceManagement';
import { getActiveWorld, parseWorldDocument } from './worldDocument';
import { getEntryHiddenDetailCleanupModel } from './codexEntries';

describe('workspace management', () => {
  it('preserves references for unchanged workspace and world commands', () => {
    const document = createSeedWorldDocument();
    const workspace = getActiveWorld(document);
    const workspaceWithPlanetaryWorld = upsertPlanetaryWorld(workspace, {
      name: 'Aster',
      summary: '',
      classification: 'Realm',
      climate: '',
      dominantTerrain: '',
      notes: '',
      tags: '',
    });
    const planetaryWorld = workspaceWithPlanetaryWorld.planetaryWorlds[0]!;

    expect(setActiveWorkspace(document, document.activeWorldId)).toBe(document);
    expect(
      updateWorkspaceMetadata(
        document,
        workspace.id,
        workspaceDraftFrom(workspace)
      )
    ).toBe(document);
    expect(setWorkspaceArchived(document, workspace.id, false)).toBe(document);
    expect(
      upsertPlanetaryWorld(
        workspaceWithPlanetaryWorld,
        planetaryWorldDraftFrom(planetaryWorld),
        planetaryWorld
      )
    ).toBe(workspaceWithPlanetaryWorld);
    expect(
      setPlanetaryWorldArchived(
        workspaceWithPlanetaryWorld,
        planetaryWorld.id,
        planetaryWorld.status === 'archived'
      )
    ).toBe(workspaceWithPlanetaryWorld);
    expect(
      deletePlanetaryWorld(workspaceWithPlanetaryWorld, 'missing-world')
    ).toBe(workspaceWithPlanetaryWorld);
  });
  it('creates shared workspace and entry type drafts', () => {
    const workspace = getActiveWorld(createSeedWorldDocument());

    expect(workspaceDraftFrom()).toEqual({
      name: '',
      summary: '',
      defaultEra: '',
    });
    expect(workspaceDraftFrom(workspace)).toEqual({
      name: workspace.name,
      summary: workspace.summary,
      defaultEra: workspace.defaultEra,
    });
    expect(emptyEntryTypeDraft()).toEqual({
      title: '',
      singularTitle: '',
      description: '',
      fields: '',
    });
  });

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

  it('describes every workspace and custom entry type draft field for shared forms', () => {
    expect(workspaceDraftFields.map((field) => field.key)).toEqual([
      'name',
      'summary',
      'defaultEra',
    ]);
    expect(
      workspaceDraftFields.find((field) => field.key === 'summary')
    ).toMatchObject({
      label: 'Summary',
      multiline: true,
    });
    expect(entryTypeDraftFields.map((field) => field.key)).toEqual([
      'title',
      'singularTitle',
      'description',
      'fields',
    ]);
    expect(entryTypeDraftFields.map((field) => field.label)).toEqual([
      'Section title',
      'Singular title',
      'Description',
      'Detail fields',
    ]);
    expect(
      entryTypeDraftFields.find((field) => field.key === 'fields')
    ).toMatchObject({
      helperText:
        'Separate fields with semicolons or new lines. Add (long) for notes, (suggest) for values learned from entries, or [Value | Value] for fixed choices.',
    });
    expect(getEntryTypeDraftFieldLayout()).toMatchObject({
      fields: entryTypeDraftFields,
      leadingFields: entryTypeDraftFields.slice(0, 2),
      trailingFields: entryTypeDraftFields.slice(2),
    });
  });

  it('normalizes workspace drafts with the same trimming used by persistence', () => {
    expect(
      normalizeWorkspaceDraft({
        name: '  Sea Atlas  ',
        summary: '  Coastal campaign  ',
        defaultEra: '  Tide Age  ',
      })
    ).toEqual({
      name: 'Sea Atlas',
      summary: 'Coastal campaign',
      defaultEra: 'Tide Age',
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
    const planetaryWorld = {
      id: 'planetary-world-aster',
      name: 'Aster',
      summary: 'Legacy planet record.',
      classification: 'Planet',
      climate: 'Temperate',
      dominantTerrain: 'Harbors',
      notes: 'Legacy notes',
      tags: ['planet', 'legacy'],
      status: 'draft' as const,
      createdAt: '2026-06-01T00:00:00.000Z',
      updatedAt: '2026-06-01T00:00:00.000Z',
    };

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

  it('describes every in-fiction world draft field for shared web and mobile forms', () => {
    expect(planetaryWorldDraftFields.map((field) => field.key)).toEqual([
      'name',
      'classification',
      'climate',
      'dominantTerrain',
      'summary',
      'notes',
      'tags',
    ]);
    expect(
      planetaryWorldDraftFields
        .filter((field) => field.multiline)
        .map((field) => field.key)
    ).toEqual(['summary', 'notes']);
    expect(
      getPlanetaryWorldDraftFieldLayout().leadingFields.map(
        (field) => field.key
      )
    ).toEqual(['name', 'classification', 'climate', 'dominantTerrain']);
    expect(
      getPlanetaryWorldDraftFieldLayout().trailingFields.map(
        (field) => field.key
      )
    ).toEqual(['summary', 'notes', 'tags']);
  });

  it('normalizes in-fiction world drafts with persisted tag formatting', () => {
    expect(
      normalizePlanetaryWorldDraft({
        name: '  Aurelia  ',
        summary: '  Ocean world  ',
        classification: '  Planet  ',
        climate: '  Temperate  ',
        dominantTerrain: '  Sea cliffs  ',
        notes: '  Tide notes  ',
        tags: ' ocean, , frontier , ',
      })
    ).toEqual({
      name: 'Aurelia',
      summary: 'Ocean world',
      classification: 'Planet',
      climate: 'Temperate',
      dominantTerrain: 'Sea cliffs',
      notes: 'Tide notes',
      tags: 'ocean, frontier',
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

  it('parses custom field definition hints into supported detail field metadata', () => {
    expect(
      parseCustomDetailFields(
        'Origin, Power; Notes (long); Status [Dormant | Active]; Profession (suggest)'
      )
    ).toEqual([
      { key: 'origin', label: 'Origin' },
      { key: 'power', label: 'Power' },
      { key: 'notes', label: 'Notes', multiline: true },
      {
        key: 'status',
        label: 'Status',
        autocompleteOptions: ['Dormant', 'Active'],
      },
      {
        key: 'profession',
        label: 'Profession',
        suggestFromExistingValues: true,
      },
    ]);
  });

  it('previews custom field definition hints before type creation', () => {
    expect(
      getEntryTypeDraftFieldPreview(
        'Notes (long); Status [Dormant | Active]; Profession (suggest); Origin'
      )
    ).toEqual([
      {
        key: 'notes',
        label: 'Notes',
        modeLabel: 'Long text',
        detail: 'Multiline detail field.',
      },
      {
        key: 'status',
        label: 'Status',
        modeLabel: 'Suggested choices',
        detail: 'Dormant, Active',
      },
      {
        key: 'profession',
        label: 'Profession',
        modeLabel: 'Suggested from entries',
        detail: 'Suggests values already used in this field.',
      },
      {
        key: 'origin',
        label: 'Origin',
        modeLabel: 'Text',
        detail: 'Flexible text field.',
      },
    ]);
  });

  it('creates custom entry types with multiline and suggested custom fields', () => {
    const document = createSeedWorldDocument();
    const withCustomType = updateActiveWorkspace(document, (workspace) =>
      createCustomEntryType(workspace, {
        title: 'Orders',
        singularTitle: 'Order',
        description: 'Organizations with field rules.',
        fields:
          'Founding notes (long)\nStanding [Hidden, Public]\nProfession (suggest)',
      })
    );
    const customSection = getActiveWorld(withCustomType).entryTypes.find(
      (section) => section.id === 'orders'
    );

    expect(customSection?.detailFields).toEqual([
      { key: 'founding-notes', label: 'Founding notes', multiline: true },
      {
        key: 'standing',
        label: 'Standing',
        autocompleteOptions: ['Hidden', 'Public'],
      },
      {
        key: 'profession',
        label: 'Profession',
        suggestFromExistingValues: true,
      },
    ]);
  });

  it('adds fields to existing custom entry types without changing entries', () => {
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
      })
    );
    const withAddedFields = updateActiveWorkspace(
      withCustomEntry,
      (workspace) =>
        addCustomEntryTypeFields(
          workspace,
          'artifacts',
          'Origin; Notes (long); Status [Dormant | Active]'
        )
    );
    const activeWorld = getActiveWorld(withAddedFields);
    const updatedSection = activeWorld.entryTypes.find(
      (section) => section.id === 'artifacts'
    );

    expect(updatedSection?.detailFields).toEqual([
      { key: 'origin', label: 'Origin' },
      { key: 'origin-2', label: 'Origin' },
      { key: 'notes', label: 'Notes', multiline: true },
      {
        key: 'status',
        label: 'Status',
        autocompleteOptions: ['Dormant', 'Active'],
      },
    ]);
    expect(activeWorld.codex.artifacts[0].fields).toEqual({
      origin: 'Glassroot Forest',
    });
  });

  it('does not add fields to built-in entry types', () => {
    const document = createSeedWorldDocument();
    const activeWorld = getActiveWorld(document);
    const updated = addCustomEntryTypeFields(
      activeWorld,
      'characters',
      'Extra field'
    );

    expect(updated).toBe(activeWorld);
  });

  it('reorders custom entry type fields without changing entry data', () => {
    const document = createSeedWorldDocument();
    const withCustomType = updateActiveWorkspace(document, (workspace) =>
      createCustomEntryType(workspace, {
        title: 'Artifacts',
        singularTitle: 'Artifact',
        description: 'Objects with story weight.',
        fields: 'Origin, Power, Current holder',
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
    const movedDown = updateActiveWorkspace(withCustomEntry, (workspace) =>
      moveCustomEntryTypeField(workspace, 'artifacts', 'origin', 'down')
    );
    const movedUp = updateActiveWorkspace(movedDown, (workspace) =>
      moveCustomEntryTypeField(workspace, 'artifacts', 'current-holder', 'up')
    );
    const activeWorld = getActiveWorld(movedUp);
    const updatedSection = activeWorld.entryTypes.find(
      (section) => section.id === 'artifacts'
    );

    expect(updatedSection?.detailFields.map((field) => field.key)).toEqual([
      'power',
      'current-holder',
      'origin',
    ]);
    expect(activeWorld.codex.artifacts[0].fields).toEqual({
      origin: 'Glassroot Forest',
      power: 'Opens dawn doors',
    });
  });

  it('does not reorder built-in, missing, or boundary custom fields', () => {
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

    expect(
      moveCustomEntryTypeField(activeWorld, 'characters', 'name', 'down')
    ).toBe(activeWorld);
    expect(
      moveCustomEntryTypeField(activeWorld, 'artifacts', 'missing', 'down')
    ).toBe(activeWorld);
    expect(
      moveCustomEntryTypeField(activeWorld, 'artifacts', 'origin', 'up')
    ).toBe(activeWorld);
    expect(
      moveCustomEntryTypeField(activeWorld, 'artifacts', 'power', 'down')
    ).toBe(activeWorld);
  });

  it('renames custom entry type field labels without changing entry values', () => {
    const document = createSeedWorldDocument();
    const withCustomType = updateActiveWorkspace(document, (workspace) =>
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
    const renamed = updateActiveWorkspace(withCustomEntry, (workspace) =>
      renameCustomEntryTypeField(workspace, 'artifacts', 'power', 'Story power')
    );
    const activeWorld = getActiveWorld(renamed);
    const updatedSection = activeWorld.entryTypes.find(
      (section) => section.id === 'artifacts'
    );

    expect(updatedSection?.detailFields).toEqual([
      { key: 'origin', label: 'Origin' },
      { key: 'power', label: 'Story power' },
    ]);
    expect(activeWorld.codex.artifacts[0].fields).toEqual({
      origin: 'Glassroot Forest',
      power: 'Opens dawn doors',
    });
  });

  it('does not rename built-in, missing, empty, or unchanged custom field labels', () => {
    const document = createSeedWorldDocument();
    const withCustomType = updateActiveWorkspace(document, (workspace) =>
      createCustomEntryType(workspace, {
        title: 'Artifacts',
        singularTitle: 'Artifact',
        description: 'Objects with story weight.',
        fields: 'Origin',
      })
    );
    const activeWorld = getActiveWorld(withCustomType);

    expect(
      renameCustomEntryTypeField(activeWorld, 'characters', 'name', 'Name')
    ).toBe(activeWorld);
    expect(
      renameCustomEntryTypeField(activeWorld, 'artifacts', 'missing', 'Label')
    ).toBe(activeWorld);
    expect(
      renameCustomEntryTypeField(activeWorld, 'artifacts', 'origin', '   ')
    ).toBe(activeWorld);
    expect(
      renameCustomEntryTypeField(activeWorld, 'artifacts', 'origin', 'Origin')
    ).toBe(activeWorld);
  });

  it('removes custom entry type fields without deleting saved entry values', () => {
    const document = createSeedWorldDocument();
    const withCustomType = updateActiveWorkspace(document, (workspace) =>
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
    const removed = updateActiveWorkspace(withCustomEntry, (workspace) =>
      removeCustomEntryTypeField(workspace, 'artifacts', 'power')
    );
    const activeWorld = getActiveWorld(removed);
    const updatedSection = activeWorld.entryTypes.find(
      (section) => section.id === 'artifacts'
    );
    const updatedEntry = activeWorld.codex.artifacts[0];

    expect(updatedSection?.detailFields).toEqual([
      { key: 'origin', label: 'Origin' },
    ]);
    expect(updatedEntry.fields).toEqual({
      origin: 'Glassroot Forest',
      power: 'Opens dawn doors',
    });
    expect(
      getEntryHiddenDetailCleanupModel(updatedSection!, {
        name: updatedEntry.name,
        summary: updatedEntry.summary,
        notes: updatedEntry.notes,
        tags: updatedEntry.tags.join(', '),
        status: updatedEntry.status,
        pinned: updatedEntry.pinned,
        details: updatedEntry.fields,
      })
    ).toEqual({
      title: 'Hidden details',
      fields: [
        {
          key: 'power',
          label: 'Power',
          value: 'Opens dawn doors',
          clearLabel: 'Clear',
        },
      ],
    });
  });

  it('does not remove built-in or missing custom fields', () => {
    const document = createSeedWorldDocument();
    const withCustomType = updateActiveWorkspace(document, (workspace) =>
      createCustomEntryType(workspace, {
        title: 'Artifacts',
        singularTitle: 'Artifact',
        description: 'Objects with story weight.',
        fields: 'Origin',
      })
    );
    const activeWorld = getActiveWorld(withCustomType);

    expect(removeCustomEntryTypeField(activeWorld, 'characters', 'name')).toBe(
      activeWorld
    );
    expect(
      removeCustomEntryTypeField(activeWorld, 'artifacts', 'missing')
    ).toBe(activeWorld);
  });
});

describe('workspace document parsing', () => {
  it('defaults current-schema workspaces with omitted optional status fields', () => {
    const document = createSeedWorldDocument();
    const workspace = getActiveWorld(document);
    const parsed = parseWorldDocument({
      ...document,
      worlds: [
        {
          id: workspace.id,
          name: workspace.name,
          summary: workspace.summary,
          defaultEra: workspace.defaultEra,
          entryTypes: workspace.entryTypes,
          schema: workspace.schema,
          codex: workspace.codex,
          relationships: workspace.relationships,
          createdAt: workspace.createdAt,
          updatedAt: workspace.updatedAt,
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

describe('workspace vocabulary management', () => {
  it('updates and clears durable field overrides', () => {
    const world = getActiveWorld(createSeedWorldDocument());
    const unchangedDefault = updateFieldOverride(world, 'characters', 'name', {
      label: 'Name',
      helpText: '',
      hidden: false,
      order: '',
      vocabularyId: '',
      vocabularyMode: 'suggestions',
    });

    expect(unchangedDefault).toBe(world);

    const updated = updateFieldOverride(world, 'characters', 'ancestry', {
      label: 'Lineage',
      helpText: 'Use the vocabulary unless a new ancestry is needed.',
      hidden: true,
      order: '1',
      vocabularyId: 'character-ancestry',
      vocabularyMode: 'restricted',
    });

    expect(
      updateFieldOverride(updated, 'characters', 'ancestry', {
        label: 'Lineage',
        helpText: 'Use the vocabulary unless a new ancestry is needed.',
        hidden: true,
        order: '1',
        vocabularyId: 'character-ancestry',
        vocabularyMode: 'restricted',
      })
    ).toBe(updated);

    expect(updated.schema.fieldOverrides.characters.ancestry).toEqual({
      label: 'Lineage',
      helpText: 'Use the vocabulary unless a new ancestry is needed.',
      hidden: true,
      order: 1,
      vocabularyId: 'character-ancestry',
      vocabularyMode: 'restricted',
    });

    const cleared = updateFieldOverride(updated, 'characters', 'ancestry', {
      label: 'Ancestry',
      helpText: '',
      hidden: false,
      order: '',
      vocabularyId: '',
      vocabularyMode: 'suggestions',
    });

    expect(cleared.schema.fieldOverrides.characters.ancestry).toBeUndefined();
  });

  it('ignores invalid field override order text instead of coercing it', () => {
    const world = getActiveWorld(createSeedWorldDocument());
    const updated = updateFieldOverride(world, 'characters', 'ancestry', {
      label: 'Lineage',
      helpText: '',
      hidden: false,
      order: '2abc',
      vocabularyId: '',
      vocabularyMode: 'suggestions',
    });

    expect(updated.schema.fieldOverrides.characters.ancestry).toEqual({
      label: 'Lineage',
    });
  });

  it('adds, updates, archives, restores, and reorders vocabulary values', () => {
    const document = createSeedWorldDocument();
    const world = getActiveWorld(document);
    const withAdded = addVocabularyValue(world, 'character-profession', {
      label: 'Navigator',
      description: 'Finds paths through difficult routes.',
      aliases: 'Pathfinder, Route reader, pathfinder',
    });
    const addedVocabulary = withAdded.schema.vocabularies.find(
      (vocabulary) => vocabulary.id === 'character-profession'
    );
    const addedValue = addedVocabulary?.values.find(
      (value) => value.label === 'Navigator'
    );

    expect(addedValue).toMatchObject({
      id: 'navigator',
      description: 'Finds paths through difficult routes.',
      aliases: ['Pathfinder', 'Route reader'],
      status: 'active',
    });

    const duplicateBlocked = addVocabularyValue(
      withAdded,
      'character-profession',
      {
        label: 'navigator',
        description: '',
        aliases: '',
      }
    );
    expect(
      duplicateBlocked.schema.vocabularies.find(
        (vocabulary) => vocabulary.id === 'character-profession'
      )?.values.length
    ).toBe(addedVocabulary?.values.length);

    const withUpdated = updateVocabularyValue(
      withAdded,
      'character-profession',
      addedValue!.id,
      {
        label: 'Navigator',
        description: 'Charts routes for caravans and expeditions.',
        aliases: 'Guide',
      }
    );
    expect(
      withUpdated.schema.vocabularies
        .find((vocabulary) => vocabulary.id === 'character-profession')
        ?.values.find((value) => value.id === addedValue!.id)
    ).toMatchObject({
      description: 'Charts routes for caravans and expeditions.',
      aliases: ['Guide'],
    });

    const withArchived = setVocabularyValueArchived(
      withUpdated,
      'character-profession',
      addedValue!.id,
      true
    );
    expect(
      withArchived.schema.vocabularies
        .find((vocabulary) => vocabulary.id === 'character-profession')
        ?.values.find((value) => value.id === addedValue!.id)?.status
    ).toBe('archived');

    const withRestored = addVocabularyValue(
      withArchived,
      'character-profession',
      {
        label: 'Navigator',
        description: '',
        aliases: '',
      }
    );
    expect(
      withRestored.schema.vocabularies
        .find((vocabulary) => vocabulary.id === 'character-profession')
        ?.values.find((value) => value.id === addedValue!.id)?.status
    ).toBe('active');

    const professionValuesBeforeMove =
      withRestored.schema.vocabularies.find(
        (vocabulary) => vocabulary.id === 'character-profession'
      )?.values ?? [];
    const firstProfession = [...professionValuesBeforeMove]
      .filter((value) => value.status === 'active')
      .sort(
        (first, second) =>
          (first.order ?? Number.MAX_SAFE_INTEGER) -
            (second.order ?? Number.MAX_SAFE_INTEGER) ||
          first.label.localeCompare(second.label)
      )[0];
    const movedDown = moveVocabularyValue(
      withRestored,
      'character-profession',
      firstProfession!.id,
      'down'
    );
    const professionValuesAfterMove =
      movedDown.schema.vocabularies.find(
        (vocabulary) => vocabulary.id === 'character-profession'
      )?.values ?? [];
    const activeLabelsAfterMove = [...professionValuesAfterMove]
      .filter((value) => value.status === 'active')
      .sort(
        (first, second) =>
          (first.order ?? Number.MAX_SAFE_INTEGER) -
            (second.order ?? Number.MAX_SAFE_INTEGER) ||
          first.label.localeCompare(second.label)
      )
      .map((value) => value.label);

    expect(activeLabelsAfterMove[1]).toBe(firstProfession?.label);
  });

  it('does not update unchanged vocabulary values', () => {
    const world = getActiveWorld(createSeedWorldDocument());

    expect(
      updateVocabularyValue(world, 'character-profession', 'mage', {
        label: 'Mage',
        description: '',
        aliases: '',
      })
    ).toBe(world);
  });

  it('blocks active vocabulary labels that only differ by whitespace', () => {
    const world = getActiveWorld(createSeedWorldDocument());
    const paddedProfessionWorld = updateVocabularyValue(
      world,
      'character-profession',
      'mage',
      {
        label: 'Mage ',
        description: '',
        aliases: '',
      }
    );
    const duplicateBlocked = addVocabularyValue(
      paddedProfessionWorld,
      'character-profession',
      {
        label: ' Mage ',
        description: '',
        aliases: '',
      }
    );

    expect(
      duplicateBlocked.schema.vocabularies
        .find((vocabulary) => vocabulary.id === 'character-profession')
        ?.values.filter((value) => value.label.trim() === 'Mage')
    ).toHaveLength(1);

    const archivedPaddedProfessionWorld = setVocabularyValueArchived(
      paddedProfessionWorld,
      'character-profession',
      'mage',
      true
    );
    const restoredProfessionWorld = addVocabularyValue(
      archivedPaddedProfessionWorld,
      'character-profession',
      {
        label: ' Mage ',
        description: '',
        aliases: '',
      }
    );

    expect(
      restoredProfessionWorld.schema.vocabularies
        .find((vocabulary) => vocabulary.id === 'character-profession')
        ?.values.find((value) => value.id === 'mage')
    ).toMatchObject({ label: 'Mage', status: 'active' });
  });

  it('builds vocabulary value drafts from saved values', () => {
    expect(
      vocabularyValueDraftFrom({
        id: 'guide',
        label: 'Guide',
        description: 'Leads travelers.',
        aliases: ['Pathfinder'],
        status: 'active',
        order: 1,
      })
    ).toEqual({
      label: 'Guide',
      description: 'Leads travelers.',
      aliases: 'Pathfinder',
    });
  });
});
