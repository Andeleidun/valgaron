import { describe, expect, it } from '@jest/globals';
import {
  entryFromDraft,
  getSectionById,
  type EntryDraft,
} from './codexEntries';
import { relationshipFromDraft } from './codexRelationships';
import {
  archiveEntryInActiveWorkspace,
  archivePlanetaryWorldInActiveWorkspace,
  createEntryTypeInActiveWorkspace,
  deleteEntryFromActiveWorkspace,
  deleteEntryTypeFromActiveWorkspace,
  deletePlanetaryWorldFromActiveWorkspace,
  deleteRelationshipFromActiveWorkspace,
  moveTimelineEventInActiveWorkspace,
  saveEntryInActiveWorkspace,
  savePlanetaryWorldInActiveWorkspace,
  saveRelationshipInActiveWorkspace,
} from './documentMutations';
import { createSeedWorldDocument } from './seedCodex';
import { sortTimelineEvents } from './codexTimeline';
import { getActiveWorld } from './worldDocument';

const updatedAt = '2026-07-04T12:00:00.000Z';

describe('document mutation commands', () => {
  it('saves and archives entries in the active workspace', () => {
    const document = createSeedWorldDocument();
    const section = getSectionById(
      'characters',
      getActiveWorld(document).entryTypes
    );
    if (!section) {
      throw new Error('Expected character section.');
    }
    const draft: EntryDraft = {
      name: 'Talia Reed',
      summary: 'A cartographer tracking submerged roads.',
      notes: '',
      tags: 'maps, roads',
      status: 'canon',
      pinned: true,
      details: {
        role: 'Cartographer',
        home: 'Northwatch Harbor',
        affiliation: 'The Cartographers Guild',
        statusNote: 'Surveying flood markers',
      },
    };
    const entry = entryFromDraft(section, draft);

    const saved = saveEntryInActiveWorkspace({ document, entry, updatedAt });
    const savedWorld = getActiveWorld(saved);
    expect(savedWorld.updatedAt).toBe(updatedAt);
    expect(savedWorld.codex.characters[0]).toMatchObject({
      id: entry.id,
      name: 'Talia Reed',
    });

    const archived = archiveEntryInActiveWorkspace({
      archived: true,
      document: saved,
      entry,
      updatedAt,
    });
    expect(
      getActiveWorld(archived).codex.characters.find(
        (candidate) => candidate.id === entry.id
      )?.status
    ).toBe('archived');
  });

  it('deletes entries and connected relationships from the active workspace', () => {
    const document = createSeedWorldDocument();
    const activeWorld = getActiveWorld(document);
    const entry = activeWorld.codex.characters[0];

    const nextDocument = deleteEntryFromActiveWorkspace({
      document,
      entry,
      updatedAt,
    });
    const nextWorld = getActiveWorld(nextDocument);

    expect(
      nextWorld.codex.characters.some((candidate) => candidate.id === entry.id)
    ).toBe(false);
    expect(
      nextWorld.relationships.some(
        (relationship) =>
          relationship.sourceEntryId === entry.id ||
          relationship.targetEntryId === entry.id
      )
    ).toBe(false);
    expect(nextWorld.updatedAt).toBe(updatedAt);
  });

  it('saves and deletes relationships in the active workspace', () => {
    const document = createSeedWorldDocument();
    const activeWorld = getActiveWorld(document);
    const relationship = relationshipFromDraft({
      sourceEntryId: activeWorld.codex.characters[0].id,
      targetEntryId: activeWorld.codex.places[0].id,
      type: 'located in',
      directional: true,
      note: 'Shared controller parity link.',
      status: 'canon',
    });

    const saved = saveRelationshipInActiveWorkspace({
      document,
      relationship,
      updatedAt,
    });
    expect(getActiveWorld(saved).relationships[0]).toMatchObject({
      id: relationship.id,
      note: 'Shared controller parity link.',
    });

    const deleted = deleteRelationshipFromActiveWorkspace({
      document: saved,
      relationshipId: relationship.id,
      updatedAt,
    });
    expect(
      getActiveWorld(deleted).relationships.some(
        (candidate) => candidate.id === relationship.id
      )
    ).toBe(false);
  });

  it('moves timeline events with shared document semantics', () => {
    const document = createSeedWorldDocument();
    const timeline = sortTimelineEvents(
      getActiveWorld(document).codex.timeline
    );
    const movingEvent = timeline[1];

    const moved = moveTimelineEventInActiveWorkspace({
      direction: 'earlier',
      document,
      eventId: movingEvent.id,
      updatedAt,
    });
    const movedTimeline = sortTimelineEvents(
      getActiveWorld(moved).codex.timeline
    );

    expect(movedTimeline[0].id).toBe(movingEvent.id);
    expect(getActiveWorld(moved).updatedAt).toBe(updatedAt);
  });

  it('saves, archives, and deletes in-fiction worlds in the active workspace', () => {
    const document = createSeedWorldDocument();

    const saved = savePlanetaryWorldInActiveWorkspace({
      document,
      draft: {
        name: 'Asterwake',
        summary: 'A tide-locked moon.',
        classification: 'Moon',
        climate: 'Cold tidal air',
        dominantTerrain: 'Silver marshes',
        notes: 'Visible above the southern crossing.',
        tags: 'moon, tides',
      },
    });
    const planetaryWorld = getActiveWorld(saved).planetaryWorlds[0];

    expect(planetaryWorld).toMatchObject({
      name: 'Asterwake',
      tags: ['moon', 'tides'],
    });

    const archived = archivePlanetaryWorldInActiveWorkspace({
      archived: true,
      document: saved,
      planetaryWorldId: planetaryWorld.id,
    });
    expect(getActiveWorld(archived).planetaryWorlds[0].status).toBe('archived');

    const deleted = deletePlanetaryWorldFromActiveWorkspace({
      document: archived,
      planetaryWorldId: planetaryWorld.id,
    });
    expect(getActiveWorld(deleted).planetaryWorlds).toEqual([]);
  });

  it('creates and deletes custom entry types in the active workspace', () => {
    const document = createSeedWorldDocument();

    const created = createEntryTypeInActiveWorkspace({
      document,
      draft: {
        title: 'Artifacts',
        singularTitle: 'Artifact',
        description: 'Objects with worldbuilding importance.',
        fields: 'Origin, Power',
      },
    });
    const customSection = getActiveWorld(created).entryTypes.find(
      (section) => section.id === 'artifacts'
    );

    expect(customSection).toMatchObject({
      custom: true,
      title: 'Artifacts',
    });
    expect(getActiveWorld(created).codex.artifacts).toEqual([]);

    const deleted = deleteEntryTypeFromActiveWorkspace({
      document: created,
      sectionId: 'artifacts',
    });
    expect(
      getActiveWorld(deleted).entryTypes.some(
        (section) => section.id === 'artifacts'
      )
    ).toBe(false);
    expect(getActiveWorld(deleted).codex.artifacts).toBeUndefined();
  });
});
