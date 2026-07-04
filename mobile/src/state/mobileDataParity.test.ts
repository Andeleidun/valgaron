import { describe, expect, it } from '@jest/globals';
import {
  createActiveWorldBackup,
  createFrontendParityWorldDocument,
  frontendParityForbiddenDiagnosticContent,
  type WorldDocument,
} from '@valgaron/core';
import { parseMobileWorldImport } from '../storage/mobileStorage';
import { getMobileExportText } from './mobileDataExport';

function expectValidMobileImport(text: string): WorldDocument {
  const result = parseMobileWorldImport(text);
  if (!result.ok) {
    throw new Error(result.error);
  }
  return result.document;
}

describe('mobile data parity contract', () => {
  it('exports full JSON that imports as the shared parity fixture', () => {
    const document = createFrontendParityWorldDocument();
    const exported = getMobileExportText(document, 'full-json');
    const imported = expectValidMobileImport(exported);

    expect(imported).toEqual(document);
  });

  it('exports active JSON as a one-workspace backup with custom and in-fiction world data', () => {
    const document = createFrontendParityWorldDocument();
    const imported = expectValidMobileImport(
      getMobileExportText(document, 'active-json')
    );

    expect(imported).toEqual(createActiveWorldBackup(document));
    expect(imported.worlds).toHaveLength(1);
    expect(
      imported.worlds[0].entryTypes.map((section) => section.id)
    ).toContain('artifacts');
    expect(imported.worlds[0].planetaryWorlds).toHaveLength(2);
  });

  it('keeps diagnostics content-safe for the shared parity fixture', () => {
    const document = createFrontendParityWorldDocument();
    const diagnostics = getMobileExportText(document, 'diagnostics', {
      lastRecoverySnapshot: {
        createdAt: '2026-06-20T19:00:00.000Z',
        document,
        id: 'snapshot-parity',
        reason: 'import',
      },
      loadStatus: {
        checkedAt: '2026-06-20T19:00:00.000Z',
        message: 'Loaded parity fixture.',
        source: 'saved',
      },
      saveMessage: 'Saved on this device.',
    });

    expect(diagnostics).toContain('"includesWorldContent": false');
    expect(diagnostics).toContain('"inFictionWorldCount": 3');
    expect(diagnostics).toContain('"archivedInFictionWorldCount": 1');
    for (const forbidden of frontendParityForbiddenDiagnosticContent) {
      expect(diagnostics).not.toContain(forbidden);
    }
  });

  it('rejects mobile imports with orphaned relationships the same way as web', () => {
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

    expect(parseMobileWorldImport(JSON.stringify(brokenDocument))).toEqual({
      ok: false,
      error:
        'Import contains orphaned relationship "relationship-elyra-moonspire".',
    });
  });
});
