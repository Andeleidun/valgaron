import type {
  WorldCodex,
  WorldEntry,
  WorldEntryStatus,
  WorldRelationship,
  WorldSectionConfig,
} from '../types';
import { getEntries } from './codexEntries';

export const relationshipTypeOptions: readonly string[] = [
  'member of',
  'located in',
  'controls',
  'allied with',
  'opposed to',
  'founded by',
  'founded',
  'affected by',
  'caused',
  'caused by',
  'carries',
  'references',
  'related to',
];

export type RelationshipDraft = {
  sourceEntryId: string;
  targetEntryId: string;
  type: string;
  directional: boolean;
  note: string;
  status: WorldEntryStatus;
};

export type RelationshipFilters = {
  type: string;
  entryId: string;
};

export type RelationshipWithEntries = WorldRelationship & {
  sourceEntry: WorldEntry | null;
  targetEntry: WorldEntry | null;
};

export type RelationshipGraphNode = {
  id: string;
  name: string;
  sectionTitle: string;
  status: WorldEntryStatus;
};

export type RelationshipGraphEdge = {
  id: string;
  sourceId: string;
  targetId: string;
  label: string;
  directional: boolean;
};

export type RelationshipGraph = {
  nodes: RelationshipGraphNode[];
  edges: RelationshipGraphEdge[];
};

/** Create a blank relationship draft for the relationship editor. */
export function createEmptyRelationshipDraft(): RelationshipDraft {
  return {
    sourceEntryId: '',
    targetEntryId: '',
    type: relationshipTypeOptions[0],
    directional: true,
    note: '',
    status: 'draft',
  };
}

/** Return all codex entries with their owning section title. */
export function getRelationshipEntries(
  codex: WorldCodex,
  sections: readonly WorldSectionConfig[]
): RelationshipGraphNode[] {
  return sections.flatMap((section) =>
    getEntries(codex, section.id).map((entry) => ({
      id: entry.id,
      name: entry.name,
      sectionTitle: section.title,
      status: entry.status,
    }))
  );
}

/** Resolve an entry by id across configured codex sections. */
export function findEntryById(
  codex: WorldCodex,
  sections: readonly WorldSectionConfig[],
  entryId: string
): WorldEntry | null {
  for (const section of sections) {
    const foundEntry = getEntries(codex, section.id).find(
      (entry) => entry.id === entryId
    );
    if (foundEntry) {
      return foundEntry;
    }
  }
  return null;
}

function makeRelationshipId(type: string): string {
  const slug = type
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  const suffix =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID().slice(0, 8)
      : String(Date.now());
  return `relationship-${slug || 'link'}-${suffix}`;
}

/** Convert a draft into a saved relationship record. */
export function relationshipFromDraft(
  draft: RelationshipDraft,
  existingRelationship?: WorldRelationship
): WorldRelationship {
  const timestamp = new Date().toISOString();
  return {
    id: existingRelationship?.id ?? makeRelationshipId(draft.type),
    sourceEntryId: draft.sourceEntryId,
    targetEntryId: draft.targetEntryId,
    type: draft.type.trim(),
    directional: draft.directional,
    note: draft.note.trim(),
    status: draft.status,
    createdAt: existingRelationship?.createdAt ?? timestamp,
    updatedAt: timestamp,
  };
}

/** Add or replace one relationship in a relationship collection. */
export function upsertRelationship(
  relationships: readonly WorldRelationship[],
  relationship: WorldRelationship
): WorldRelationship[] {
  const existingIndex = relationships.findIndex(
    (item) => item.id === relationship.id
  );
  if (existingIndex === -1) {
    return [relationship, ...relationships];
  }
  return relationships.map((item) =>
    item.id === relationship.id ? relationship : item
  );
}

/** Remove one relationship by id. */
export function deleteRelationship(
  relationships: readonly WorldRelationship[],
  relationshipId: string
): WorldRelationship[] {
  return relationships.filter(
    (relationship) => relationship.id !== relationshipId
  );
}

/** Remove every relationship connected to a deleted entry. */
export function deleteRelationshipsForEntry(
  relationships: readonly WorldRelationship[],
  entryId: string
): WorldRelationship[] {
  return relationships.filter(
    (relationship) =>
      relationship.sourceEntryId !== entryId &&
      relationship.targetEntryId !== entryId
  );
}

/** Filter relationships by type and attached entry id. */
export function filterRelationships(
  relationships: readonly WorldRelationship[],
  filters: RelationshipFilters
): WorldRelationship[] {
  return relationships.filter((relationship) => {
    const matchesType = !filters.type || relationship.type === filters.type;
    const matchesEntry =
      !filters.entryId ||
      relationship.sourceEntryId === filters.entryId ||
      relationship.targetEntryId === filters.entryId;
    return matchesType && matchesEntry;
  });
}

/** Return all relationships attached to an entry, preserving source/target data. */
export function getEntryRelationships(
  relationships: readonly WorldRelationship[],
  codex: WorldCodex,
  sections: readonly WorldSectionConfig[],
  entryId: string
): RelationshipWithEntries[] {
  return relationships
    .filter(
      (relationship) =>
        relationship.sourceEntryId === entryId ||
        relationship.targetEntryId === entryId
    )
    .map((relationship) => ({
      ...relationship,
      sourceEntry: findEntryById(codex, sections, relationship.sourceEntryId),
      targetEntry: findEntryById(codex, sections, relationship.targetEntryId),
    }));
}

/** Build graph nodes and edges for relationships that still point at saved entries. */
export function getRelationshipGraph(
  relationships: readonly WorldRelationship[],
  codex: WorldCodex,
  sections: readonly WorldSectionConfig[]
): RelationshipGraph {
  const entryNodes = getRelationshipEntries(codex, sections);
  const entryIds = new Set(entryNodes.map((node) => node.id));
  const edges = relationships
    .filter(
      (relationship) =>
        entryIds.has(relationship.sourceEntryId) &&
        entryIds.has(relationship.targetEntryId)
    )
    .map((relationship) => ({
      id: relationship.id,
      sourceId: relationship.sourceEntryId,
      targetId: relationship.targetEntryId,
      label: relationship.type,
      directional: relationship.directional,
    }));
  const connectedIds = new Set(
    edges.flatMap((edge) => [edge.sourceId, edge.targetId])
  );
  return {
    nodes: entryNodes.filter((node) => connectedIds.has(node.id)),
    edges,
  };
}
