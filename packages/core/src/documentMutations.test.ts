import { describe, expect, it } from '@jest/globals';
import {
  applyEntry,
  entryFromDraft,
  getSectionById,
  type EntryDraft,
} from './codexEntries';
import { relationshipFromDraft } from './codexRelationships';
import {
  addEntryTypeFieldsInActiveWorkspace,
  archiveEntryInActiveWorkspace,
  archivePlanetaryWorldInActiveWorkspace,
  createEntryTypeInActiveWorkspace,
  clearHiddenEntryDetailsInActiveWorkspace,
  deleteEntryFromActiveWorkspace,
  deleteEntryTypeFromActiveWorkspace,
  deletePlanetaryWorldFromActiveWorkspace,
  deleteRelationshipFromActiveWorkspace,
  moveTimelineEventInActiveWorkspace,
  moveEntryTypeFieldInActiveWorkspace,
  renameEntryTypeFieldInActiveWorkspace,
  removeEntryTypeFieldInActiveWorkspace,
  reassignTimelineEraInActiveWorkspace,
  saveEntryInActiveWorkspace,
  savePlanetaryWorldInActiveWorkspace,
  saveRelationshipInActiveWorkspace,
} from './documentMutations';
import { createSeedWorldDocument } from './seedCodex';
import { sortTimelineEvents } from './codexTimeline';
import { getActiveWorld } from './worldDocument';
import { updateActiveWorkspace } from './workspaceManagement';

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
        characterCategory: 'Humanoid person',
        narrativeRole: 'Mapmaker',
        ancestry: 'Human',
        profession: 'Cartographer',
        homePlace: 'Northwatch Harbor',
        affiliations: 'The Cartographers Guild',
        currentStatus: 'Surveying flood markers',
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

  it('adds fields to custom entry types in the active workspace', () => {
    const created = createEntryTypeInActiveWorkspace({
      document: createSeedWorldDocument(),
      draft: {
        title: 'Artifacts',
        singularTitle: 'Artifact',
        description: 'Objects with worldbuilding importance.',
        fields: 'Origin',
      },
    });
    const updated = addEntryTypeFieldsInActiveWorkspace({
      document: created,
      sectionId: 'artifacts',
      fieldsText: 'Notes (long); Status [Dormant | Active]',
    });
    const customSection = getActiveWorld(updated).entryTypes.find(
      (section) => section.id === 'artifacts'
    );

    expect(customSection?.detailFields).toEqual([
      { key: 'origin', label: 'Origin' },
      { key: 'notes', label: 'Notes', multiline: true },
      {
        key: 'status',
        label: 'Status',
        autocompleteOptions: ['Dormant', 'Active'],
      },
    ]);
  });

  it('moves custom entry type fields in the active workspace', () => {
    const created = createEntryTypeInActiveWorkspace({
      document: createSeedWorldDocument(),
      draft: {
        title: 'Artifacts',
        singularTitle: 'Artifact',
        description: 'Objects with worldbuilding importance.',
        fields: 'Origin, Power',
      },
    });
    const updated = moveEntryTypeFieldInActiveWorkspace({
      direction: 'down',
      document: created,
      fieldKey: 'origin',
      sectionId: 'artifacts',
    });
    const customSection = getActiveWorld(updated).entryTypes.find(
      (section) => section.id === 'artifacts'
    );

    expect(customSection?.detailFields.map((field) => field.key)).toEqual([
      'power',
      'origin',
    ]);
  });

  it('renames custom entry type fields in the active workspace', () => {
    const created = createEntryTypeInActiveWorkspace({
      document: createSeedWorldDocument(),
      draft: {
        title: 'Artifacts',
        singularTitle: 'Artifact',
        description: 'Objects with worldbuilding importance.',
        fields: 'Origin',
      },
    });
    const updated = renameEntryTypeFieldInActiveWorkspace({
      document: created,
      fieldKey: 'origin',
      label: 'Creation origin',
      sectionId: 'artifacts',
    });
    const customSection = getActiveWorld(updated).entryTypes.find(
      (section) => section.id === 'artifacts'
    );

    expect(customSection?.detailFields).toEqual([
      { key: 'origin', label: 'Creation origin' },
    ]);
  });

  it('removes custom entry type fields in the active workspace', () => {
    const created = createEntryTypeInActiveWorkspace({
      document: createSeedWorldDocument(),
      draft: {
        title: 'Artifacts',
        singularTitle: 'Artifact',
        description: 'Objects with worldbuilding importance.',
        fields: 'Origin, Power',
      },
    });
    const updated = removeEntryTypeFieldInActiveWorkspace({
      document: created,
      fieldKey: 'power',
      sectionId: 'artifacts',
    });
    const customSection = getActiveWorld(updated).entryTypes.find(
      (section) => section.id === 'artifacts'
    );

    expect(customSection?.detailFields).toEqual([
      { key: 'origin', label: 'Origin' },
    ]);
  });

  it('clears hidden entry details without changing visible custom fields', () => {
    const created = createEntryTypeInActiveWorkspace({
      document: createSeedWorldDocument(),
      draft: {
        title: 'Artifacts',
        singularTitle: 'Artifact',
        description: 'Objects with worldbuilding importance.',
        fields: 'Origin, Power',
      },
    });
    const artifactSection = getActiveWorld(created).entryTypes.find(
      (section) => section.id === 'artifacts'
    );
    if (!artifactSection) {
      throw new Error('Expected artifacts section.');
    }
    const artifact = entryFromDraft(artifactSection, {
      name: 'Glass Key',
      summary: 'A key made of dawn glass.',
      notes: '',
      tags: 'artifact',
      status: 'draft',
      pinned: false,
      details: {
        origin: 'Glassroot Forest',
        power: 'Opens dawn doors',
      },
    });
    const withEntry = updateActiveWorkspace(created, (workspace) => ({
      ...workspace,
      codex: applyEntry(workspace.codex, artifact, workspace.entryTypes),
    }));
    const withRemovedField = removeEntryTypeFieldInActiveWorkspace({
      document: withEntry,
      fieldKey: 'power',
      sectionId: 'artifacts',
    });

    const cleaned = clearHiddenEntryDetailsInActiveWorkspace({
      document: withRemovedField,
      updatedAt,
    });
    const cleanedArtifact = getActiveWorld(cleaned).codex.artifacts[0];

    expect(cleanedArtifact.fields).toEqual({
      origin: 'Glassroot Forest',
    });
    expect(cleanedArtifact.updatedAt).toBe(updatedAt);
    expect(getActiveWorld(cleaned).updatedAt).toBe(updatedAt);
  });

  it('reassigns timeline eras in the active workspace', () => {
    const document = createSeedWorldDocument();
    const reassigned = reassignTimelineEraInActiveWorkspace({
      document,
      draft: {
        sourceEra: 'Survey Era',
        targetEra: 'Exploration Era',
        updatedAt,
      },
    });
    const world = getActiveWorld(reassigned);

    expect(
      world.codex.timeline.find((event) => event.id === 'timeline-first-survey')
        ?.fields.era
    ).toBe('Exploration Era');
    expect(world.updatedAt).toBe(updatedAt);
  });
});
