import { describe, expect, it } from '@jest/globals';
import {
  createActiveWorldBackup,
  parseWorldImport,
  serializeActiveWorldBackup,
  serializeWorldDocumentBackup,
  summarizeWorldDocument,
} from './codexDataPortability';
import { entryFromDraft, getSectionById } from './codexEntries';
import { relationshipFromDraft } from './codexRelationships';
import {
  createWorldDocumentDiagnosticsReport,
  serializeWorldDocumentDiagnosticsReport,
} from './documentDiagnostics';
import {
  saveEntryInActiveWorkspace,
  savePlanetaryWorldInActiveWorkspace,
  saveRelationshipInActiveWorkspace,
} from './documentMutations';
import {
  createFrontendParityWorldDocument,
  frontendParityForbiddenDiagnosticContent,
} from './frontendParityFixture';
import { createSeedWorldDocument } from './seedCodex';
import type { WorldDocument } from './types';
import { getActiveWorld } from './worldDocument';

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
      webImageCount: 0,
      uploadedImageCount: 0,
      uploadedImageByteTotal: 0,
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

  it('preserves the standard creative workflow through export and import', () => {
    let document = createSeedWorldDocument();
    const activeWorkspace = getActiveWorld(document);
    const placeSection = getSectionById('places', activeWorkspace.entryTypes);
    const characterSection = getSectionById(
      'characters',
      activeWorkspace.entryTypes
    );

    if (!placeSection || !characterSection) {
      throw new Error('Expected seed place and character sections.');
    }

    const place = entryFromDraft(placeSection, {
      name: 'Glassfen Crossing',
      summary: 'A flooded trade post where mirrored reeds mark safe paths.',
      notes: 'The old ferry bell rings before fog rolls in.',
      tags: 'wetland, trade',
      status: 'canon',
      pinned: true,
      details: {
        category: 'Town',
        region: 'Lowwater March',
        climate: 'Mist and spring floods',
        significance: 'Controls the safest road through the southern marsh.',
      },
    });
    document = saveEntryInActiveWorkspace({ document, entry: place });

    const character = entryFromDraft(characterSection, {
      name: 'Sera Venn',
      summary: 'A guide who knows which reed mirrors are false.',
      notes: 'Keeps a tide calendar in a waterproof leather tube.',
      tags: 'guide, marsh',
      status: 'canon',
      pinned: false,
      details: {
        characterCategory: 'Humanoid person',
        narrativeRole: 'Marsh guide',
        ancestry: 'Human',
        profession: 'Guide',
        homePlace: 'Glassfen Crossing',
        affiliations: 'Ferrywardens',
        currentStatus: 'Available during low-water season',
      },
    });
    document = saveEntryInActiveWorkspace({ document, entry: character });

    document = savePlanetaryWorldInActiveWorkspace({
      document,
      draft: {
        name: 'Asterwake',
        summary: 'A tide-locked moon that shapes Glassfen flood seasons.',
        classification: 'Moon',
        climate: 'Cold tidal air',
        dominantTerrain: 'Silver marshes',
        notes: 'Visible as a broken crescent above the crossing.',
        tags: 'moon, tides',
      },
    });

    const relationship = relationshipFromDraft({
      sourceEntryId: character.id,
      targetEntryId: place.id,
      type: 'located in',
      directional: true,
      note: 'Sera guides travelers from the Glassfen ferry house.',
      status: 'canon',
    });
    document = saveRelationshipInActiveWorkspace({
      document,
      relationship,
    });

    const fullImport = expectValidImport(
      serializeWorldDocumentBackup(document)
    );
    const activeImport = expectValidImport(
      serializeActiveWorldBackup(document)
    );

    expect(fullImport).toEqual(document);
    expect(activeImport).toEqual(createActiveWorldBackup(document));
    expect(summarizeWorldDocument(fullImport)).toMatchObject({
      activeWorldName: 'Sample Atlas',
      worldCount: 1,
      planetaryWorldCount: 1,
      entryCount: 12,
      relationshipCount: 6,
    });
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
