import { describe, expect, it } from '@jest/globals';
import {
  codexExportOptions,
  createActiveWorldBackup,
  exportWorldToMarkdown,
  formatWorldImportPreviewText,
  getCodexExportFilename,
  getCodexExportOption,
  parseWorldImport,
  serializeActiveWorldBackup,
  serializeWorldDocumentBackup,
  summarizeWorldDocument,
} from './codexDataPortability';
import {
  addEntryTypeFieldsInActiveWorkspace,
  createEntryTypeInActiveWorkspace,
  moveEntryTypeFieldInActiveWorkspace,
  renameEntryTypeFieldInActiveWorkspace,
  removeEntryTypeFieldInActiveWorkspace,
} from './documentMutations';
import { createSeedWorldDocument } from './seedCodex';
import { getActiveWorld } from './worldDocument';

describe('codexDataPortability', () => {
  it('exposes shared export metadata for web downloads and mobile share actions', () => {
    expect(codexExportOptions.map((option) => option.label)).toEqual([
      'Full JSON',
      'Active JSON',
      'Markdown',
      'Diagnostics',
    ]);
    expect(getCodexExportOption('active-json')).toMatchObject({
      heading: 'Active workspace JSON',
      downloadLabel: 'Download Active JSON',
      filename: 'active-workspace-json',
    });
    expect(getCodexExportFilename('active-json', 'sample-atlas')).toBe(
      'sample-atlas.json'
    );
    expect(getCodexExportFilename('markdown', 'sample-atlas')).toBe(
      'sample-atlas.md'
    );
    expect(getCodexExportFilename('diagnostics', 'sample-atlas')).toBe(
      'valgaron-diagnostics.json'
    );
  });

  it('serializes the active world as a single-world JSON backup', () => {
    const document = createSeedWorldDocument();
    const backup = createActiveWorldBackup(document);
    const serializedBackup = JSON.parse(serializeActiveWorldBackup(document));

    expect(backup.worlds).toHaveLength(1);
    expect(backup.activeWorldId).toBe(getActiveWorld(document).id);
    expect(serializedBackup).toMatchObject(backup);
    expect(serializedBackup.exportedBy).toBe('Valgaron World Codex');
    expect(typeof serializedBackup.exportedAt).toBe('string');
    expect(serializedBackup.backupSummary).toEqual({
      activeWorldName: 'Sample Atlas',
      worldCount: 1,
      planetaryWorldCount: 0,
      entryCount: 10,
      relationshipCount: 5,
      savedAt: '2026-06-01T09:00:00.000Z',
    });
    expect(parseWorldImport(JSON.stringify(serializedBackup))).toMatchObject({
      ok: true,
      preview: {
        activeWorldName: 'Sample Atlas',
        entryCount: 10,
      },
    });
  });

  it('summarizes valid import counts', () => {
    const preview = summarizeWorldDocument(createSeedWorldDocument());

    expect(preview).toEqual({
      activeWorldName: 'Sample Atlas',
      worldCount: 1,
      planetaryWorldCount: 0,
      entryCount: 10,
      relationshipCount: 5,
      savedAt: '2026-06-01T09:00:00.000Z',
    });
    expect(formatWorldImportPreviewText(preview)).toMatchObject({
      title: 'Sample Atlas',
      detail: expect.stringContaining(
        '1 workspace, 10 entries, 5 relationships.'
      ),
    });
    expect(
      formatWorldImportPreviewText({
        ...preview,
        entryCount: 1,
        relationshipCount: 1,
        worldCount: 2,
      }).detail
    ).toContain('2 workspaces, 1 entry, 1 relationship.');
  });

  it('serializes the full document as a multi-workspace JSON backup', () => {
    const document = createSeedWorldDocument();
    const extraWorld = {
      ...getActiveWorld(document),
      id: 'workspace-second',
      name: 'Second Workspace',
    };
    const multiWorkspaceDocument = {
      ...document,
      worlds: [...document.worlds, extraWorld],
    };
    const serializedBackup = JSON.parse(
      serializeWorldDocumentBackup(multiWorkspaceDocument)
    );

    expect(serializedBackup.worlds).toHaveLength(2);
    expect(serializedBackup.backupSummary.worldCount).toBe(2);
    expect(parseWorldImport(JSON.stringify(serializedBackup))).toMatchObject({
      ok: true,
      preview: {
        worldCount: 2,
      },
    });
  });

  it('preserves custom entry type schema through full JSON export and import', () => {
    const documentWithType = createEntryTypeInActiveWorkspace({
      document: createSeedWorldDocument(),
      draft: {
        title: 'Artifacts',
        singularTitle: 'Artifact',
        description: 'Important crafted objects and relics.',
        fields: 'Origin',
      },
    });
    const documentWithFields = addEntryTypeFieldsInActiveWorkspace({
      document: documentWithType,
      sectionId: 'artifacts',
      fieldsText:
        'Notes (long); Status [Dormant | Active]; Current holder (suggest)',
    });
    const documentWithReorderedFields = moveEntryTypeFieldInActiveWorkspace({
      direction: 'up',
      document: documentWithFields,
      fieldKey: 'status',
      sectionId: 'artifacts',
    });
    const documentWithRenamedField = renameEntryTypeFieldInActiveWorkspace({
      document: documentWithReorderedFields,
      fieldKey: 'current-holder',
      label: 'Current keeper',
      sectionId: 'artifacts',
    });
    const document = removeEntryTypeFieldInActiveWorkspace({
      document: documentWithRenamedField,
      fieldKey: 'notes',
      sectionId: 'artifacts',
    });
    const imported = parseWorldImport(serializeWorldDocumentBackup(document));

    if (!imported.ok) {
      throw new Error(imported.error);
    }
    const activeWorld = getActiveWorld(imported.document);
    const customSection = activeWorld.entryTypes.find(
      (section) => section.id === 'artifacts'
    );

    expect(customSection).toMatchObject({
      id: 'artifacts',
      custom: true,
      title: 'Artifacts',
      singularTitle: 'Artifact',
    });
    expect(customSection?.detailFields).toEqual([
      { key: 'origin', label: 'Origin' },
      {
        key: 'status',
        label: 'Status',
        autocompleteOptions: ['Dormant', 'Active'],
      },
      {
        key: 'current-holder',
        label: 'Current keeper',
        suggestFromExistingValues: true,
      },
    ]);
    expect(activeWorld.codex.artifacts).toEqual([]);
  });

  it('parses valid imports and rejects invalid imports', () => {
    const document = createSeedWorldDocument();

    expect(parseWorldImport(JSON.stringify(document))).toMatchObject({
      ok: true,
      preview: {
        activeWorldName: 'Sample Atlas',
        entryCount: 10,
      },
    });
    expect(parseWorldImport('')).toEqual({
      ok: false,
      error: 'Paste a world backup JSON file first.',
    });
    expect(parseWorldImport('{not json')).toEqual({
      ok: false,
      error: 'This is not valid JSON.',
    });
    expect(parseWorldImport(JSON.stringify({ worlds: [] }))).toEqual({
      ok: false,
      error: 'This JSON is not a valid Valgaron World Codex backup.',
    });
  });

  it('rejects imports with duplicate entry ids or orphaned relationships', () => {
    const document = createSeedWorldDocument();
    const activeWorld = getActiveWorld(document);
    const duplicateEntryDocument = {
      ...document,
      worlds: [
        {
          ...activeWorld,
          codex: {
            ...activeWorld.codex,
            characters: [
              activeWorld.codex.characters[0],
              activeWorld.codex.characters[0],
            ],
          },
        },
      ],
    };
    const orphanedRelationshipDocument = {
      ...document,
      worlds: [
        {
          ...activeWorld,
          relationships: [
            {
              ...activeWorld.relationships[0],
              sourceEntryId: 'missing-entry',
            },
          ],
        },
      ],
    };
    const legacyPlanetaryWorld = {
      id: 'planetary-world-aster',
      name: 'Aster',
      summary: 'Legacy planet record.',
      classification: 'Planet',
      climate: 'Temperate',
      dominantTerrain: 'Harbors',
      notes: '',
      tags: ['planet'],
      status: 'draft' as const,
      createdAt: '2026-06-01T00:00:00.000Z',
      updatedAt: '2026-06-01T00:00:00.000Z',
    };
    const duplicatePlanetaryWorldDocument = {
      ...document,
      worlds: [
        {
          ...activeWorld,
          planetaryWorlds: [legacyPlanetaryWorld, legacyPlanetaryWorld],
        },
      ],
    };

    expect(
      parseWorldImport(JSON.stringify(duplicatePlanetaryWorldDocument))
    ).toEqual({
      ok: false,
      error:
        'Import contains duplicate in-fiction world id "planetary-world-aster".',
    });
    expect(parseWorldImport(JSON.stringify(duplicateEntryDocument))).toEqual({
      ok: false,
      error: 'Import contains duplicate entry id "character-mira-rowan".',
    });
    expect(
      parseWorldImport(JSON.stringify(orphanedRelationshipDocument))
    ).toEqual({
      ok: false,
      error:
        'Import contains orphaned relationship "relationship-mira-cartographers-guild".',
    });
  });

  it('exports readable Markdown with sections and relationships', () => {
    const world = getActiveWorld(createSeedWorldDocument());
    const markdown = exportWorldToMarkdown(world);

    expect(markdown).toContain('# Sample Atlas');
    expect(markdown).toContain('## Places');
    expect(markdown).toContain('### Northwatch Harbor');
    expect(markdown).toContain('## Characters');
    expect(markdown).toContain('### Mira Rowan');
    expect(markdown).toContain('## Relationships');
    expect(markdown).toContain('Mira Rowan member of The Cartographers Guild');
  });

  it('falls back to relationship endpoint ids in Markdown when records are missing', () => {
    const world = getActiveWorld(createSeedWorldDocument());
    const markdown = exportWorldToMarkdown({
      ...world,
      relationships: [
        {
          ...world.relationships[0],
          targetEntryId: 'missing-faction',
        },
      ],
    });

    expect(markdown).toContain('Mira Rowan member of missing-faction');
  });

  it('keeps Markdown export content as literal text', () => {
    const document = createSeedWorldDocument();
    const world = getActiveWorld(document);
    const markdown = exportWorldToMarkdown({
      ...world,
      codex: {
        ...world.codex,
        lore: [
          {
            ...world.codex.lore[0],
            name: '<img src=x onerror=alert(1)>',
            notes: '<script>alert("not executed")</script>',
            summary: '<b>literal summary</b>',
            tags: ['<svg onload=alert(1)>'],
          },
          ...world.codex.lore.slice(1),
        ],
      },
    });

    expect(markdown).toContain('<img src=x onerror=alert(1)>');
    expect(markdown).toContain('<script>alert("not executed")</script>');
    expect(markdown).toContain('<b>literal summary</b>');
    expect(markdown).toContain('<svg onload=alert(1)>');
  });
});
