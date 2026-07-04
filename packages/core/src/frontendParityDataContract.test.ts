import { describe, expect, it } from '@jest/globals';
import {
  createActiveWorldBackup,
  parseWorldImport,
  serializeActiveWorldBackup,
  serializeWorldDocumentBackup,
  summarizeWorldDocument,
} from './codexDataPortability';
import {
  createWorldDocumentDiagnosticsReport,
  serializeWorldDocumentDiagnosticsReport,
} from './documentDiagnostics';
import {
  createFrontendParityWorldDocument,
  frontendParityForbiddenDiagnosticContent,
} from './frontendParityFixture';
import type { WorldDocument } from './types';

function expectValidImport(text: string): WorldDocument {
  const result = parseWorldImport(text);
  if (!result.ok) {
    throw new Error(result.error);
  }
  return result.document;
}

describe('frontend parity data contract', () => {
  it('round-trips the full shared fixture through the shared JSON backup format', () => {
    const document = createFrontendParityWorldDocument();
    const exported = serializeWorldDocumentBackup(document);
    const imported = expectValidImport(exported);

    expect(imported).toEqual(document);
    expect(summarizeWorldDocument(imported)).toEqual({
      activeWorldName: 'Parity Atlas',
      worldCount: 2,
      planetaryWorldCount: 3,
      entryCount: 11,
      relationshipCount: 5,
      savedAt: '2026-06-20T18:30:00.000Z',
    });
  });

  it('round-trips the active workspace backup as a one-workspace document', () => {
    const document = createFrontendParityWorldDocument();
    const activeBackup = createActiveWorldBackup(document);
    const imported = expectValidImport(serializeActiveWorldBackup(document));

    expect(imported).toEqual(activeBackup);
    expect(imported.worlds).toHaveLength(1);
    expect(
      imported.worlds[0].entryTypes.map((section) => section.id)
    ).toContain('artifacts');
    expect(
      imported.worlds[0].planetaryWorlds.map((world) => world.status)
    ).toEqual(['draft', 'archived']);
  });

  it('rejects orphaned relationships in the shared fixture shape', () => {
    const document = createFrontendParityWorldDocument();
    const brokenDocument: WorldDocument = {
      ...document,
      worlds: document.worlds.map((world) =>
        world.id === document.activeWorldId
          ? {
              ...world,
              relationships: [
                {
                  ...world.relationships[0],
                  targetEntryId: 'missing-entry',
                },
                ...world.relationships.slice(1),
              ],
            }
          : world
      ),
    };

    expect(parseWorldImport(JSON.stringify(brokenDocument))).toEqual({
      ok: false,
      error:
        'Import contains orphaned relationship "relationship-elyra-moonspire".',
    });
  });

  it('reports fixture diagnostics without leaking world content', () => {
    const document = createFrontendParityWorldDocument();
    const report = createWorldDocumentDiagnosticsReport({
      document,
      generatedAt: '2026-06-20T19:00:00.000Z',
      runtime: {
        loadState: 'saved',
        saveState: 'saved',
      },
      storageTarget: 'parity-test-storage',
    });
    const serialized = serializeWorldDocumentDiagnosticsReport(report);

    expect(report.document).toMatchObject({
      workspaceCount: 2,
      customEntryTypeCount: 1,
      inFictionWorldCount: 3,
      archivedWorkspaceCount: 1,
      archivedEntryCount: 1,
      archivedInFictionWorldCount: 1,
      relationshipCount: 5,
      totalEntryCount: 11,
    });
    expect(report.contentPolicy.includesWorldContent).toBe(false);
    for (const forbidden of frontendParityForbiddenDiagnosticContent) {
      expect(serialized).not.toContain(forbidden);
    }
  });
});
