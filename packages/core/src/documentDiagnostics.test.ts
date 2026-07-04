import { describe, expect, it } from '@jest/globals';
import {
  createWorldDocumentDiagnosticsReport,
  getWorldDocumentDiagnostics,
  serializeWorldDocumentDiagnosticsReport,
} from './documentDiagnostics';
import { createSeedWorldDocument } from './seedCodex';
import { getActiveWorld } from './worldDocument';

describe('document diagnostics', () => {
  it('summarizes document counts without world content', () => {
    const seedDocument = createSeedWorldDocument();
    const seedWorld = getActiveWorld(seedDocument);
    const seedEntry = seedWorld.codex.characters[0];
    const document = {
      ...seedDocument,
      worlds: seedDocument.worlds.map((world) =>
        world.id === seedWorld.id
          ? {
              ...world,
              name: 'Secret Workspace Name',
              codex: {
                ...world.codex,
                characters: [
                  {
                    ...seedEntry,
                    id: 'secret-entry-id',
                    name: 'Secret Entry Name',
                    notes: 'Secret entry notes',
                    summary: 'Secret entry summary',
                    tags: ['secret-tag'],
                  },
                  ...world.codex.characters.slice(1),
                ],
              },
            }
          : world
      ),
    };
    const diagnostics = getWorldDocumentDiagnostics(document);

    expect(diagnostics).toMatchObject({
      schemaVersion: 2,
      workspaceCount: 1,
      activeWorkspaceEntryCount: 10,
      totalEntryCount: 10,
      relationshipCount: 5,
    });
    expect(JSON.stringify(diagnostics)).not.toContain('Secret');
    expect(JSON.stringify(diagnostics)).not.toContain('secret-entry-id');
  });

  it('serializes a portable local diagnostics report', () => {
    const report = createWorldDocumentDiagnosticsReport({
      document: createSeedWorldDocument(),
      generatedAt: '2026-06-01T00:00:00.000Z',
      storageTarget: 'this device',
    });
    const serialized = serializeWorldDocumentDiagnosticsReport(report);

    expect(report.app.name).toBe('Valgaron World Codex');
    expect(report.runtime.storageTarget).toBe('this device');
    expect(report.contentPolicy.includesWorldContent).toBe(false);
    expect(serialized).toContain('"workspaceCount": 1');
    expect(serialized).not.toContain('Sample Atlas');
  });

  it('can include safe runtime recovery state without world content', () => {
    const report = createWorldDocumentDiagnosticsReport({
      document: createSeedWorldDocument(),
      generatedAt: '2026-06-01T00:00:00.000Z',
      runtime: {
        loadState: 'recovered',
        loadCheckedAt: '2026-06-01T00:00:00.000Z',
        saveState: 'Saved to this device.',
        recoverySnapshotAvailable: true,
        recoverySnapshotReason: 'import',
        recoverySnapshotCreatedAt: '2026-06-01T00:00:00.000Z',
      },
      storageTarget: 'this device',
    });

    expect(report.runtime).toMatchObject({
      loadState: 'recovered',
      recoverySnapshotAvailable: true,
      recoverySnapshotReason: 'import',
    });
    expect(JSON.stringify(report)).not.toContain('Sample Atlas');
    expect(JSON.stringify(report)).not.toContain('Mira Rowan');
  });
});
