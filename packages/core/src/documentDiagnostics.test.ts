import { describe, expect, it } from '@jest/globals';
import {
  createWorldDocumentDiagnosticsReport,
  getWorldDocumentDiagnostics,
  sanitizeDiagnosticsRoute,
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
        loadMessage: 'Loaded starter data after recovery.',
        loadIssueCount: 1,
        route: sanitizeDiagnosticsRoute(
          '/entries?sectionId=characters&query=Mira%20Rowan'
        ),
        userAgent: 'Test Browser',
        saveState: 'Saved to this device.',
        recoverySnapshotAvailable: true,
        recoverySnapshotCount: 2,
        recoverySnapshotState: 'saved',
        recoverySnapshotReason: 'import',
        recoverySnapshotCreatedAt: '2026-06-01T00:00:00.000Z',
        runtimeErrorName: 'RenderError',
      },
      storageTarget: 'this device',
    });

    expect(report.runtime).toMatchObject({
      loadState: 'recovered',
      loadIssueCount: 1,
      route: '/entries?sectionId=redacted&query=redacted',
      recoverySnapshotAvailable: true,
      recoverySnapshotCount: 2,
      recoverySnapshotState: 'saved',
      recoverySnapshotReason: 'import',
      runtimeErrorName: 'RenderError',
    });
    expect(JSON.stringify(report)).not.toContain('Sample Atlas');
    expect(JSON.stringify(report)).not.toContain('Mira Rowan');
  });

  it('redacts diagnostics route query values in the shared diagnostics model', () => {
    expect(sanitizeDiagnosticsRoute('/data')).toBe('/data');
    expect(
      sanitizeDiagnosticsRoute(
        '/relationships?entryQuery=Secret%20Name&entryId=secret-entry-id'
      )
    ).toBe('/relationships?entryQuery=redacted&entryId=redacted');
  });
});
