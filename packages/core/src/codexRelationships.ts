import type {
  WorldCodex,
  WorldEntry,
  WorldEntryStatus,
  WorldRelationship,
  WorldSectionConfig,
} from './types';
import { getEntries } from './codexEntries';
import { makeLocalIdSuffix } from './ids';
import {
  getPlaceCategoryFromFields,
  getPlaceRelationshipGroupLabel,
  placeRelationshipTypeOptions,
  type PlaceRelationshipGroupId,
} from './placeTaxonomy';

const baseRelationshipTypeOptions: readonly string[] = [
  'member of',
  'allied with',
  'opposed to',
  'affected by',
  'caused',
  'caused by',
  'carries',
  'related to',
];

export const relationshipTypeOptions: readonly string[] = Array.from(
  new Set([...baseRelationshipTypeOptions, ...placeRelationshipTypeOptions])
);

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
  query?: string;
  entryById?: ReadonlyMap<
    string,
    Pick<RelationshipGraphNode, 'name' | 'sectionId' | 'sectionTitle'>
  >;
};

export type RelationshipGraphFilters = {
  sectionId: string;
  status: WorldEntryStatus | '';
  tag: string;
  type: string;
};

export type RelationshipWithEntries = WorldRelationship & {
  sourceEntry: WorldEntry | null;
  targetEntry: WorldEntry | null;
};

export type PlaceRelationshipGroup = {
  id: PlaceRelationshipGroupId;
  label: string;
  relationships: RelationshipWithEntries[];
};

export type RelationshipGraphNode = {
  id: string;
  name: string;
  sectionId: string;
  sectionTitle: string;
  status: WorldEntryStatus;
  tags: string[];
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

export type BrokenRelationship = RelationshipWithEntries & {
  missingSource: boolean;
  missingTarget: boolean;
};

export type OrphanedEntry = RelationshipGraphNode;

export type RelationshipHealthSummary = {
  brokenRelationshipCount: number;
  orphanedEntryCount: number;
};

const placeRelationshipGroupOrder: readonly PlaceRelationshipGroupId[] = [
  'location',
  'contents',
  'power',
  'routes',
  'people',
  'eventsLore',
  'origins',
  'other',
];

const placeRelationshipGroupRules: Record<
  Exclude<PlaceRelationshipGroupId, 'other'>,
  readonly {
    type: string;
    perspective: 'source' | 'target' | 'either';
  }[]
> = {
  location: [
    { type: 'located in', perspective: 'source' },
    { type: 'part of', perspective: 'source' },
    { type: 'capital of', perspective: 'source' },
    { type: 'contains', perspective: 'target' },
    { type: 'has part', perspective: 'target' },
    { type: 'has capital', perspective: 'target' },
  ],
  contents: [
    { type: 'contains', perspective: 'source' },
    { type: 'has part', perspective: 'source' },
    { type: 'has capital', perspective: 'source' },
    { type: 'located in', perspective: 'target' },
    { type: 'part of', perspective: 'target' },
    { type: 'capital of', perspective: 'target' },
  ],
  power: [
    { type: 'controls', perspective: 'either' },
    { type: 'controlled by', perspective: 'source' },
    { type: 'controlled by', perspective: 'target' },
    { type: 'administers', perspective: 'either' },
    { type: 'administered by', perspective: 'source' },
    { type: 'administered by', perspective: 'target' },
    { type: 'claimed by', perspective: 'either' },
    { type: 'claims', perspective: 'either' },
  ],
  routes: [
    { type: 'bordered by', perspective: 'either' },
    { type: 'connected to', perspective: 'either' },
    { type: 'route between', perspective: 'either' },
    { type: 'flows through', perspective: 'either' },
    { type: 'flows into', perspective: 'either' },
    { type: 'receives flow from', perspective: 'either' },
  ],
  people: [
    { type: 'home of', perspective: 'either' },
    { type: 'home', perspective: 'either' },
    { type: 'member of', perspective: 'target' },
    { type: 'headquarters of', perspective: 'either' },
    { type: 'headquarters', perspective: 'either' },
  ],
  eventsLore: [
    { type: 'site of', perspective: 'either' },
    { type: 'occurred at', perspective: 'either' },
    { type: 'references', perspective: 'either' },
    { type: 'referenced by', perspective: 'either' },
    { type: 'affected by', perspective: 'either' },
    { type: 'caused', perspective: 'either' },
    { type: 'caused by', perspective: 'either' },
  ],
  origins: [
    { type: 'founded by', perspective: 'either' },
    { type: 'founded', perspective: 'either' },
    { type: 'built by', perspective: 'either' },
    { type: 'created by', perspective: 'either' },
  ],
};

function getEntryIndex(
  codex: WorldCodex,
  sections: readonly WorldSectionConfig[]
): Map<string, WorldEntry> {
  return new Map(
    sections.flatMap((section) =>
      getEntries(codex, section.id).map((entry) => [entry.id, entry] as const)
    )
  );
}

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

/** Convert a saved relationship into an editable form draft. */
export function draftFromRelationship(
  relationship: WorldRelationship
): RelationshipDraft {
  return {
    sourceEntryId: relationship.sourceEntryId,
    targetEntryId: relationship.targetEntryId,
    type: relationship.type,
    directional: relationship.directional,
    note: relationship.note,
    status: relationship.status,
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
      sectionId: section.id,
      sectionTitle: section.title,
      status: entry.status,
      tags: [...entry.tags],
    }))
  );
}

/** Resolve an entry by id across configured codex sections. */
export function findEntryById(
  codex: WorldCodex,
  sections: readonly WorldSectionConfig[],
  entryId: string
): WorldEntry | null {
  return getEntryIndex(codex, sections).get(entryId) ?? null;
}

function makeRelationshipId(type: string): string {
  const slug = type
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  const suffix = makeLocalIdSuffix();
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

/** Filter relationships by type, attached entry id, and optional search text. */
export function filterRelationships(
  relationships: readonly WorldRelationship[],
  filters: RelationshipFilters
): WorldRelationship[] {
  const normalizedQuery = filters.query?.trim().toLowerCase() ?? '';
  return relationships.filter((relationship) => {
    const matchesType = !filters.type || relationship.type === filters.type;
    const matchesEntry =
      !filters.entryId ||
      relationship.sourceEntryId === filters.entryId ||
      relationship.targetEntryId === filters.entryId;
    const sourceEntry = filters.entryById?.get(relationship.sourceEntryId);
    const targetEntry = filters.entryById?.get(relationship.targetEntryId);
    const matchesQuery =
      !normalizedQuery ||
      [
        relationship.id,
        relationship.type,
        relationship.note,
        relationship.sourceEntryId,
        relationship.targetEntryId,
        relationship.directional ? 'directional' : 'mutual',
        relationship.directional ? '->' : '<->',
        sourceEntry?.name,
        sourceEntry?.sectionId,
        sourceEntry?.sectionTitle,
        targetEntry?.name,
        targetEntry?.sectionId,
        targetEntry?.sectionTitle,
      ].some((value) => value?.toLowerCase().includes(normalizedQuery));
    return matchesType && matchesEntry && matchesQuery;
  });
}

export function getBrokenRelationships(
  relationships: readonly WorldRelationship[],
  codex: WorldCodex,
  sections: readonly WorldSectionConfig[]
): BrokenRelationship[] {
  const entryIndex = getEntryIndex(codex, sections);
  return relationships
    .map((relationship) => {
      const sourceEntry = entryIndex.get(relationship.sourceEntryId) ?? null;
      const targetEntry = entryIndex.get(relationship.targetEntryId) ?? null;
      return {
        ...relationship,
        sourceEntry,
        targetEntry,
        missingSource: !sourceEntry,
        missingTarget: !targetEntry,
      };
    })
    .filter(
      (relationship) => relationship.missingSource || relationship.missingTarget
    );
}

export function getOrphanedEntries(
  relationships: readonly WorldRelationship[],
  codex: WorldCodex,
  sections: readonly WorldSectionConfig[]
): OrphanedEntry[] {
  const entries = getRelationshipEntries(codex, sections);
  const connectedEntryIds = new Set(
    relationships.flatMap((relationship) => [
      relationship.sourceEntryId,
      relationship.targetEntryId,
    ])
  );
  return entries.filter((entry) => !connectedEntryIds.has(entry.id));
}

/** Summarize relationship graph health without exposing world content. */
export function getRelationshipHealthSummary(
  relationships: readonly WorldRelationship[],
  codex: WorldCodex,
  sections: readonly WorldSectionConfig[]
): RelationshipHealthSummary {
  return {
    brokenRelationshipCount: getBrokenRelationships(
      relationships,
      codex,
      sections
    ).length,
    orphanedEntryCount: getOrphanedEntries(relationships, codex, sections)
      .length,
  };
}

/** Return all relationships attached to an entry, preserving source/target data. */
export function getEntryRelationships(
  relationships: readonly WorldRelationship[],
  codex: WorldCodex,
  sections: readonly WorldSectionConfig[],
  entryId: string
): RelationshipWithEntries[] {
  const entryIndex = getEntryIndex(codex, sections);
  return relationships
    .filter(
      (relationship) =>
        relationship.sourceEntryId === entryId ||
        relationship.targetEntryId === entryId
    )
    .map((relationship) => ({
      ...relationship,
      sourceEntry: entryIndex.get(relationship.sourceEntryId) ?? null,
      targetEntry: entryIndex.get(relationship.targetEntryId) ?? null,
    }));
}

function normalizeRelationshipType(type: string): string {
  return type.trim().toLowerCase();
}

function relationshipPerspective(
  relationship: RelationshipWithEntries,
  entryId: string
): 'source' | 'target' {
  return relationship.sourceEntryId === entryId ? 'source' : 'target';
}

function relationshipMatchesGroupRule(
  relationship: RelationshipWithEntries,
  entryId: string,
  groupId: Exclude<PlaceRelationshipGroupId, 'other'>
): boolean {
  const normalizedType = normalizeRelationshipType(relationship.type);
  const perspective = relationshipPerspective(relationship, entryId);
  return placeRelationshipGroupRules[groupId].some(
    (rule) =>
      rule.type === normalizedType &&
      (rule.perspective === 'either' || rule.perspective === perspective)
  );
}

function getPlaceRelationshipGroupId(
  relationship: RelationshipWithEntries,
  entryId: string
): PlaceRelationshipGroupId {
  return (
    placeRelationshipGroupOrder.find(
      (groupId) =>
        groupId !== 'other' &&
        relationshipMatchesGroupRule(relationship, entryId, groupId)
    ) ?? 'other'
  );
}

/** Group an attached place relationship list into place-tree oriented sections. */
export function getPlaceRelationshipGroups(
  entry: WorldEntry,
  relationships: readonly WorldRelationship[],
  codex: WorldCodex,
  sections: readonly WorldSectionConfig[]
): PlaceRelationshipGroup[] {
  if (entry.kind !== 'place') {
    return [];
  }
  const category = getPlaceCategoryFromFields(entry.fields);
  const attachedRelationships = getEntryRelationships(
    relationships,
    codex,
    sections,
    entry.id
  );
  const groupsById = new Map<
    PlaceRelationshipGroupId,
    RelationshipWithEntries[]
  >(placeRelationshipGroupOrder.map((groupId) => [groupId, []]));
  for (const relationship of attachedRelationships) {
    const groupId = getPlaceRelationshipGroupId(relationship, entry.id);
    groupsById.get(groupId)?.push(relationship);
  }
  return placeRelationshipGroupOrder
    .map((groupId) => ({
      id: groupId,
      label: getPlaceRelationshipGroupLabel(category, groupId),
      relationships: groupsById.get(groupId) ?? [],
    }))
    .filter((group) => group.relationships.length > 0);
}

/** Build graph nodes and edges for relationships that still point at saved entries. */
export function getRelationshipGraph(
  relationships: readonly WorldRelationship[],
  codex: WorldCodex,
  sections: readonly WorldSectionConfig[],
  filters: RelationshipGraphFilters = {
    sectionId: '',
    status: '',
    tag: '',
    type: '',
  }
): RelationshipGraph {
  const entryNodes = getRelationshipEntries(codex, sections);
  const filteredEntryNodes = entryNodes.filter((node) => {
    const matchesSection =
      !filters.sectionId || node.sectionId === filters.sectionId;
    const matchesStatus = !filters.status || node.status === filters.status;
    const matchesTag = !filters.tag || node.tags.includes(filters.tag);
    return matchesSection && matchesStatus && matchesTag;
  });
  const entryIds = new Set(filteredEntryNodes.map((node) => node.id));
  const edges = relationships
    .filter(
      (relationship) =>
        (!filters.type || relationship.type === filters.type) &&
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
    nodes: filteredEntryNodes.filter((node) => connectedIds.has(node.id)),
    edges,
  };
}
