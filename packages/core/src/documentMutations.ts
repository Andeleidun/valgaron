import { applyEntry, deleteEntry, setEntryArchived } from './codexEntries';
import {
  deleteRelationship,
  deleteRelationshipsForEntry,
  upsertRelationship,
} from './codexRelationships';
import {
  getTimelineOrderUpdates,
  type TimelineOrderDirection,
} from './codexTimeline';
import { getEntries } from './codexEntries';
import type {
  InFictionWorld,
  WorldDocument,
  WorldEntry,
  WorldRelationship,
} from './types';
import {
  createCustomEntryType,
  deleteCustomEntryType,
  deletePlanetaryWorld,
  setPlanetaryWorldArchived,
  updateActiveWorkspace,
  upsertPlanetaryWorld,
  type EntryTypeDraft,
  type PlanetaryWorldDraft,
} from './workspaceManagement';
import { updateActiveWorld } from './worldDocument';

function mutationTimestamp(updatedAt = new Date().toISOString()): string {
  return updatedAt;
}

export function saveEntryInActiveWorkspace({
  document,
  entry,
  updatedAt,
}: {
  document: WorldDocument;
  entry: WorldEntry;
  updatedAt?: string;
}): WorldDocument {
  const timestamp = mutationTimestamp(updatedAt);
  return updateActiveWorld(document, (world) => ({
    ...world,
    codex: applyEntry(world.codex, entry, world.entryTypes),
    updatedAt: timestamp,
  }));
}

export function archiveEntryInActiveWorkspace({
  archived,
  document,
  entry,
  updatedAt,
}: {
  archived: boolean;
  document: WorldDocument;
  entry: WorldEntry;
  updatedAt?: string;
}): WorldDocument {
  const timestamp = mutationTimestamp(updatedAt);
  return updateActiveWorld(document, (world) => ({
    ...world,
    codex: setEntryArchived(world.codex, entry, archived, world.entryTypes),
    updatedAt: timestamp,
  }));
}

export function deleteEntryFromActiveWorkspace({
  document,
  entry,
  updatedAt,
}: {
  document: WorldDocument;
  entry: WorldEntry;
  updatedAt?: string;
}): WorldDocument {
  const timestamp = mutationTimestamp(updatedAt);
  return updateActiveWorld(document, (world) => ({
    ...world,
    codex: deleteEntry(world.codex, entry, world.entryTypes),
    relationships: deleteRelationshipsForEntry(world.relationships, entry.id),
    updatedAt: timestamp,
  }));
}

export function saveRelationshipInActiveWorkspace({
  document,
  relationship,
  updatedAt,
}: {
  document: WorldDocument;
  relationship: WorldRelationship;
  updatedAt?: string;
}): WorldDocument {
  const timestamp = mutationTimestamp(updatedAt);
  return updateActiveWorld(document, (world) => ({
    ...world,
    relationships: upsertRelationship(world.relationships, relationship),
    updatedAt: timestamp,
  }));
}

export function deleteRelationshipFromActiveWorkspace({
  document,
  relationshipId,
  updatedAt,
}: {
  document: WorldDocument;
  relationshipId: string;
  updatedAt?: string;
}): WorldDocument {
  const timestamp = mutationTimestamp(updatedAt);
  return updateActiveWorld(document, (world) => ({
    ...world,
    relationships: deleteRelationship(world.relationships, relationshipId),
    updatedAt: timestamp,
  }));
}

export function moveTimelineEventInActiveWorkspace({
  direction,
  document,
  eventId,
  updatedAt,
}: {
  direction: TimelineOrderDirection;
  document: WorldDocument;
  eventId: string;
  updatedAt?: string;
}): WorldDocument {
  const timestamp = mutationTimestamp(updatedAt);
  return updateActiveWorld(document, (world) => {
    const updates = getTimelineOrderUpdates(
      getEntries(world.codex, 'timeline'),
      eventId,
      direction
    );
    if (updates.length === 0) {
      return world;
    }
    return {
      ...world,
      codex: updates.reduce(
        (codex, event) => applyEntry(codex, event, world.entryTypes),
        world.codex
      ),
      updatedAt: timestamp,
    };
  });
}

export function savePlanetaryWorldInActiveWorkspace({
  document,
  draft,
  existingPlanetaryWorld,
}: {
  document: WorldDocument;
  draft: PlanetaryWorldDraft;
  existingPlanetaryWorld?: InFictionWorld;
}): WorldDocument {
  return updateActiveWorkspace(document, (workspace) =>
    upsertPlanetaryWorld(workspace, draft, existingPlanetaryWorld)
  );
}

export function archivePlanetaryWorldInActiveWorkspace({
  archived,
  document,
  planetaryWorldId,
}: {
  archived: boolean;
  document: WorldDocument;
  planetaryWorldId: string;
}): WorldDocument {
  return updateActiveWorkspace(document, (workspace) =>
    setPlanetaryWorldArchived(workspace, planetaryWorldId, archived)
  );
}

export function deletePlanetaryWorldFromActiveWorkspace({
  document,
  planetaryWorldId,
}: {
  document: WorldDocument;
  planetaryWorldId: string;
}): WorldDocument {
  return updateActiveWorkspace(document, (workspace) =>
    deletePlanetaryWorld(workspace, planetaryWorldId)
  );
}

export function createEntryTypeInActiveWorkspace({
  document,
  draft,
}: {
  document: WorldDocument;
  draft: EntryTypeDraft;
}): WorldDocument {
  return updateActiveWorkspace(document, (workspace) =>
    createCustomEntryType(workspace, draft)
  );
}

export function deleteEntryTypeFromActiveWorkspace({
  document,
  sectionId,
}: {
  document: WorldDocument;
  sectionId: string;
}): WorldDocument {
  return updateActiveWorkspace(document, (workspace) =>
    deleteCustomEntryType(workspace, sectionId)
  );
}
