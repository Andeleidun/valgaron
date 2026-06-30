import { describe, expect, it } from '@jest/globals';
import { createSeedWorldDocument } from './seedCodex';
import {
  createLocalDiagnosticsReport,
  serializeLocalDiagnosticsReport,
} from './localDiagnostics';
import { getActiveWorld } from './worldDocument';
import type { WorldDocumentLoadStatus } from './codexStorage';
import type {
  RecoverySnapshotStatus,
  WorldDocumentSaveStatus,
} from './useWorldDocumentState';

const savedAt = '2026-06-01T00:00:00.000Z';

const loadStatus: WorldDocumentLoadStatus = {
  state: 'loaded',
  source: 'current',
  message: 'Loaded the saved local world document.',
  issues: [],
  checkedAt: savedAt,
};

const saveStatus: WorldDocumentSaveStatus = {
  state: 'saved',
  savedAt,
};

const recoverySnapshotStatus: RecoverySnapshotStatus = {
  state: 'idle',
  message: 'Recovery snapshots are ready.',
  updatedAt: savedAt,
};

describe('local diagnostics', () => {
  it('summarizes runtime and document counts without user-authored content', () => {
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
                  },
                  ...world.codex.characters.slice(1),
                ],
              },
            }
          : world
      ),
    };
    const activeWorld = getActiveWorld(document);
    const firstEntry = activeWorld.codex.characters[0];

    const report = createLocalDiagnosticsReport({
      activeWorld,
      document,
      loadStatus,
      recoverySnapshotCount: 2,
      recoverySnapshotStatus,
      route: '/data',
      saveStatus,
      userAgent: 'Test Browser',
    });
    const serializedReport = serializeLocalDiagnosticsReport(report);

    expect(report.app.name).toBe('Valgaron World Codex');
    expect(report.app.schemaVersion).toBe(2);
    expect(report.runtime.route).toBe('/data');
    expect(report.document.workspaceCount).toBe(document.worlds.length);
    expect(report.document.activeWorkspaceEntryCount).toBeGreaterThan(0);
    expect(report.storage.recoverySnapshotCount).toBe(2);
    expect(report.contentPolicy.includesWorldContent).toBe(false);
    expect(serializedReport).not.toContain(activeWorld.name);
    expect(serializedReport).not.toContain(firstEntry.name);
    expect(serializedReport).not.toContain(firstEntry.summary);
    expect(serializedReport).not.toContain(firstEntry.notes);
    expect(serializedReport).not.toContain(firstEntry.id);
  });

  it('includes non-sensitive local failure messages', () => {
    const document = createSeedWorldDocument();
    const report = createLocalDiagnosticsReport({
      document,
      loadStatus: {
        state: 'recovered',
        source: 'seed',
        message: 'Saved local data could not be used.',
        issues: ['valgaron.worldDocument.v2 is not valid JSON.'],
        checkedAt: savedAt,
      },
      recentMessages: [
        {
          level: 'error',
          source: 'runtime',
          message: 'Error: Render failed.',
          occurredAt: savedAt,
        },
      ],
      recoverySnapshotCount: 0,
      recoverySnapshotStatus,
      route: '/characters',
      saveStatus,
      userAgent: 'Test Browser',
    });

    expect(report.storage.loadState).toBe('recovered');
    expect(report.storage.loadIssueCount).toBe(1);
    expect(report.recentMessages).toHaveLength(1);
    expect(serializeLocalDiagnosticsReport(report)).toContain('Render failed');
  });

  it('reports paused saves after recovery without world content', () => {
    const document = createSeedWorldDocument();
    const report = createLocalDiagnosticsReport({
      document,
      loadStatus: {
        state: 'recovered',
        source: 'seed',
        message: 'Saved local data could not be used.',
        issues: ['valgaron.worldDocument.v2 is not valid JSON.'],
        checkedAt: savedAt,
      },
      recoverySnapshotCount: 0,
      recoverySnapshotStatus,
      route: '/data',
      saveStatus: {
        state: 'paused',
        savedAt,
      },
      userAgent: 'Test Browser',
    });

    expect(report.storage.saveState).toBe('paused');
    expect(serializeLocalDiagnosticsReport(report)).not.toContain(
      getActiveWorld(document).name
    );
  });
});
