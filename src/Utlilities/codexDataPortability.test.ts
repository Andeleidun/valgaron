import { describe, expect, it } from '@jest/globals';
import {
  createActiveWorldBackup,
  exportWorldToMarkdown,
  parseWorldImport,
  serializeActiveWorldBackup,
  serializeWorldDocumentBackup,
  summarizeWorldDocument,
} from './codexDataPortability';
import { createSeedWorldDocument } from './seedCodex';
import { getActiveWorld } from './worldDocument';

describe('codexDataPortability', () => {
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
      planetaryWorldCount: 2,
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
    expect(summarizeWorldDocument(createSeedWorldDocument())).toEqual({
      activeWorldName: 'Sample Atlas',
      worldCount: 1,
      planetaryWorldCount: 2,
      entryCount: 10,
      relationshipCount: 5,
      savedAt: '2026-06-01T09:00:00.000Z',
    });
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
    const duplicatePlanetaryWorldDocument = {
      ...document,
      worlds: [
        {
          ...activeWorld,
          planetaryWorlds: [
            activeWorld.planetaryWorlds[0],
            activeWorld.planetaryWorlds[0],
          ],
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
    expect(markdown).toContain('## In-Fiction Worlds And Planets');
    expect(markdown).toContain('### Aster');
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
