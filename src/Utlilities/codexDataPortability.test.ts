import { describe, expect, it } from '@jest/globals';
import {
  createActiveWorldBackup,
  exportWorldToMarkdown,
  parseWorldImport,
  serializeActiveWorldBackup,
  summarizeWorldDocument,
} from './codexDataPortability';
import { createSeedWorldDocument } from './seedCodex';
import { getActiveWorld } from './worldDocument';

describe('codexDataPortability', () => {
  it('serializes the active world as a single-world JSON backup', () => {
    const document = createSeedWorldDocument();
    const backup = createActiveWorldBackup(document);

    expect(backup.worlds).toHaveLength(1);
    expect(backup.activeWorldId).toBe(getActiveWorld(document).id);
    expect(JSON.parse(serializeActiveWorldBackup(document))).toEqual(backup);
  });

  it('summarizes valid import counts', () => {
    expect(summarizeWorldDocument(createSeedWorldDocument())).toEqual({
      activeWorldName: 'Valgaron',
      worldCount: 1,
      entryCount: 10,
      relationshipCount: 5,
      savedAt: '2026-06-01T09:00:00.000Z',
    });
  });

  it('parses valid imports and rejects invalid imports', () => {
    const document = createSeedWorldDocument();

    expect(parseWorldImport(JSON.stringify(document))).toMatchObject({
      ok: true,
      preview: {
        activeWorldName: 'Valgaron',
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
      error: 'This JSON is not a valid Valgaron world backup.',
    });
  });

  it('exports readable Markdown with sections and relationships', () => {
    const world = getActiveWorld(createSeedWorldDocument());
    const markdown = exportWorldToMarkdown(world);

    expect(markdown).toContain('# Valgaron');
    expect(markdown).toContain('## Characters');
    expect(markdown).toContain('### Sera Vall');
    expect(markdown).toContain('## Relationships');
    expect(markdown).toContain(
      'character-sera-vall member of faction-lantern-registry'
    );
  });
});
