import { applyEntry, deleteEntry, setEntryArchived } from './codexEntries';
import {
  deleteRelationship,
  deleteRelationshipsForEntry,
  upsertRelationship,
} from './codexRelationships';
import {
  getTimelineEraReassignmentUpdates,
  getTimelineOrderUpdates,
  type TimelineEraReassignmentDraft,
  type TimelineOrderDirection,
} from './codexTimeline';
import { getEntries } from './codexEntries';
import { getHiddenEntryDetailValues } from './placeTaxonomy';
import type {
  InFictionWorld,
  WorldCodex,
  WorldDocument,
  WorldEntry,
  WorldRelationship,
} from './types';
import {
  addCustomEntryTypeFields,
  createCustomEntryType,
  deleteCustomEntryType,
  deletePlanetaryWorld,
  moveCustomEntryTypeField,
  renameCustomEntryTypeField,
  removeCustomEntryTypeField,
  setPlanetaryWorldArchived,
  updateActiveWorkspace,
  upsertPlanetaryWorld,
  type CustomEntryTypeFieldMoveDirection,
  type EntryTypeDraft,
  type PlanetaryWorldDraft,
} from './workspaceManagement';
import { getActiveWorld, updateActiveWorld } from './worldDocument';

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
  return updateActiveWorld(document, (world) => {
    const codex = applyEntry(world.codex, entry, world.entryTypes);
    return codex === world.codex
      ? world
      : { ...world, codex, updatedAt: mutationTimestamp(updatedAt) };
  });
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
  return updateActiveWorld(document, (world) => {
    const codex = setEntryArchived(
      world.codex,
      entry,
      archived,
      world.entryTypes
    );
    return codex === world.codex
      ? world
      : { ...world, codex, updatedAt: mutationTimestamp(updatedAt) };
  });
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
  return updateActiveWorld(document, (world) => {
    const codex = deleteEntry(world.codex, entry, world.entryTypes);
    if (codex === world.codex) {
      return world;
    }
    return {
      ...world,
      codex,
      relationships: deleteRelationshipsForEntry(world.relationships, entry.id),
      updatedAt: mutationTimestamp(updatedAt),
    };
  });
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
  return updateActiveWorld(document, (world) => {
    const relationships = upsertRelationship(world.relationships, relationship);
    return relationships === world.relationships
      ? world
      : {
          ...world,
          relationships,
          updatedAt: mutationTimestamp(updatedAt),
        };
  });
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
  return updateActiveWorld(document, (world) => {
    const relationships = deleteRelationship(
      world.relationships,
      relationshipId
    );
    return relationships === world.relationships
      ? world
      : {
          ...world,
          relationships,
          updatedAt: mutationTimestamp(updatedAt),
        };
  });
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

export function reassignTimelineEraInActiveWorkspace({
  document,
  draft,
}: {
  document: WorldDocument;
  draft: TimelineEraReassignmentDraft;
}): WorldDocument {
  return updateActiveWorld(document, (world) => {
    const updates = getTimelineEraReassignmentUpdates(
      getEntries(world.codex, 'timeline'),
      draft
    );
    if (updates.length === 0) {
      return world;
    }
    const timestamp = draft.updatedAt ?? new Date().toISOString();
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

export function addEntryTypeFieldsInActiveWorkspace({
  document,
  fieldsText,
  sectionId,
}: {
  document: WorldDocument;
  fieldsText: string;
  sectionId: string;
}): WorldDocument {
  return updateActiveWorkspace(document, (workspace) =>
    addCustomEntryTypeFields(workspace, sectionId, fieldsText)
  );
}

export function moveEntryTypeFieldInActiveWorkspace({
  direction,
  document,
  fieldKey,
  sectionId,
}: {
  direction: CustomEntryTypeFieldMoveDirection;
  document: WorldDocument;
  fieldKey: string;
  sectionId: string;
}): WorldDocument {
  return updateActiveWorkspace(document, (workspace) =>
    moveCustomEntryTypeField(workspace, sectionId, fieldKey, direction)
  );
}

export function renameEntryTypeFieldInActiveWorkspace({
  document,
  fieldKey,
  label,
  sectionId,
}: {
  document: WorldDocument;
  fieldKey: string;
  label: string;
  sectionId: string;
}): WorldDocument {
  return updateActiveWorkspace(document, (workspace) =>
    renameCustomEntryTypeField(workspace, sectionId, fieldKey, label)
  );
}

export function removeEntryTypeFieldInActiveWorkspace({
  document,
  fieldKey,
  sectionId,
}: {
  document: WorldDocument;
  fieldKey: string;
  sectionId: string;
}): WorldDocument {
  return updateActiveWorkspace(document, (workspace) =>
    removeCustomEntryTypeField(workspace, sectionId, fieldKey)
  );
}

export function clearHiddenEntryDetailsInActiveWorkspace({
  document,
  updatedAt,
}: {
  document: WorldDocument;
  updatedAt?: string;
}): WorldDocument {
  const timestamp = mutationTimestamp(updatedAt);
  return updateActiveWorld(document, (world) => {
    let nextCodex: WorldCodex = world.codex;
    let didClearHiddenDetails = false;

    for (const section of world.entryTypes) {
      const entries = getEntries(world.codex, section.id);
      let didClearSection = false;
      const nextEntries = entries.map((entry) => {
        const hiddenDetails = getHiddenEntryDetailValues(
          section,
          entry.fields,
          world.schema
        );
        if (hiddenDetails.length === 0) {
          return entry;
        }

        didClearHiddenDetails = true;
        didClearSection = true;
        const nextFields = { ...entry.fields };
        for (const detail of hiddenDetails) {
          delete nextFields[detail.key];
        }

        return {
          ...entry,
          fields: nextFields,
          updatedAt: timestamp,
        };
      });

      if (didClearSection) {
        nextCodex = {
          ...nextCodex,
          [section.id]: nextEntries,
        };
      }
    }

    if (!didClearHiddenDetails) {
      return world;
    }

    return {
      ...world,
      codex: nextCodex,
      updatedAt: timestamp,
    };
  });
}

export function clearHiddenEntryDetailInActiveWorkspace({
  document,
  entryId,
  fieldKey,
  sectionId,
  updatedAt,
}: {
  document: WorldDocument;
  entryId: string;
  fieldKey: string;
  sectionId: string;
  updatedAt?: string;
}): WorldDocument {
  const timestamp = mutationTimestamp(updatedAt);
  const initialWorld = getActiveWorld(document);
  const initialSection = initialWorld.entryTypes.find(
    (entryType) => entryType.id === sectionId
  );
  if (!initialSection) {
    return document;
  }
  const initialEntry = getEntries(initialWorld.codex, initialSection.id).find(
    (candidate) => candidate.id === entryId
  );
  if (!initialEntry) {
    return document;
  }
  const hiddenDetail = getHiddenEntryDetailValues(
    initialSection,
    initialEntry.fields,
    initialWorld.schema
  ).find((detail) => detail.key === fieldKey);
  if (!hiddenDetail) {
    return document;
  }

  return updateActiveWorld(document, (world) => {
    const section = world.entryTypes.find(
      (entryType) => entryType.id === sectionId
    );
    if (!section) {
      return world;
    }
    const entries = getEntries(world.codex, section.id);
    const entry = entries.find((candidate) => candidate.id === entryId);
    if (!entry) {
      return world;
    }
    const currentHiddenDetail = getHiddenEntryDetailValues(
      section,
      entry.fields,
      world.schema
    ).find((detail) => detail.key === fieldKey);
    if (!currentHiddenDetail) {
      return world;
    }
    const nextFields = { ...entry.fields };
    delete nextFields[fieldKey];
    return {
      ...world,
      codex: {
        ...world.codex,
        [section.id]: entries.map((candidate) =>
          candidate.id === entryId
            ? {
                ...candidate,
                fields: nextFields,
                updatedAt: timestamp,
              }
            : candidate
        ),
      },
      updatedAt: timestamp,
    };
  });
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
