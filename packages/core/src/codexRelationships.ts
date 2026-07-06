import type {
  WorldCodex,
  WorldEntry,
  WorldEntryStatus,
  WorldRelationship,
  WorldSectionConfig,
} from './types';
import {
  entryDisplayCopy,
  getEntries,
  getEntryStatusLabel,
} from './codexEntries';
import { makeLocalIdSuffix } from './ids';
import {
  getPlaceCategoryFromFields,
  getPlaceRelationshipGroupLabel,
  placeRelationshipTypeOptions,
  type PlaceRelationshipGroupId,
} from './placeTaxonomy';
import { characterRelationshipTypeOptions } from './characterTaxonomy';
import { getCodexEntriesRoute, getCodexRelationshipsRoute } from './shell';

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
  new Set([
    ...baseRelationshipTypeOptions,
    ...placeRelationshipTypeOptions,
    ...characterRelationshipTypeOptions,
  ])
);

export const relationshipFeatureCopy = {
  studioTitle: 'Relationship Studio',
  studioDetail:
    'Audit graph health, browse connected records, compose ad hoc links, and prepare bulk cleanup.',
  studioReviewLabel: 'Review',
  studioReviewDetail: 'Repair broken references and find unlinked records.',
  studioGraphLabel: 'Graph',
  studioGraphDetail:
    'Browse connected records and inspect visible graph links.',
  studioLinksLabel: 'Links',
  studioLinksDetail: 'Search, edit, delete, or compose saved relationships.',
  studioBulkEditLabel: 'Bulk Edit',
  studioBulkEditDetail: 'Prepare larger relationship cleanup passes.',
  clearFiltersLabel: 'Clear Filters',
  clearGraphFiltersLabel: 'Clear Graph Filters',
  savedSectionTitle: 'Saved Relationships',
  selectedEntrySectionTitle: 'Linked Records',
  selectedEntryEmptyTitle: 'No relationships yet.',
  selectedEntryEmptyDetail:
    'Use the Relationships page to connect this record to the world.',
  manageLinksLabel: 'Manage Links',
  helpLabel: 'Relationship Help',
  healthSectionTitle: 'Relationship Health',
  diagnosticsTitle: 'Diagnostics',
  brokenReferencesLabel: 'Broken references',
  brokenReferencesDetail:
    'Relationships with a missing source or target after imports or deletes.',
  orphanedRecordsLabel: 'Orphaned records',
  orphanedRecordsDetail: 'Entries with no saved relationship links yet.',
  duplicateRelationshipsLabel: 'Duplicate Relationships',
  duplicateRelationshipsReviewLabel: 'Duplicate relationship review',
  duplicateRelationshipsDetail:
    'Saved relationships with the same source, target, type, status, direction, and note.',
  duplicateRelationshipsCleanupLabel: 'Remove Duplicate Relationships',
  duplicateRelationshipsCleanupBlockedMessage:
    'Save or discard the current relationship draft before running bulk cleanup.',
  noBrokenRelationshipsTitle: 'No broken relationships.',
  noBrokenRelationshipsDetail:
    'Every saved relationship currently resolves to existing records.',
  noOrphanedRecordsMessage: 'Every relationship-capable record is connected.',
  graphViewTitle: 'Graph view',
  graphBrowserTitle: 'Graph Browser',
  noGraphTitle: 'No graph yet.',
  noGraphDetail:
    'Graph rows appear once saved relationships have valid endpoints.',
  repairBrokenLinksTitle: 'Repair Broken Links',
  noGraphSearchMatchesMessage: 'No graph records match this search.',
  noConnectedGraphMatchesMessage:
    'No connected graph records match these filters.',
  filterListLabel: 'Filter List',
  minimumEntriesTitle: 'Create at least two entries first.',
  minimumEntriesDetail: 'Relationships need a source and a target record.',
  openEntryLabel: 'Review Context',
  openSourceLabel: 'Open Source',
  openTargetLabel: 'Open Target',
  relationshipFormTitle: 'Relationship Form',
  saveRelationshipLabel: 'Save Relationship',
  clearTypeFilterLabel: 'Clear Type Filter',
  clearEntryFilterLabel: 'Clear Entry Filter',
  clearSearchLabel: 'Clear Search',
  clearDraftLabel: 'Clear',
  anySectionLabel: 'Any Section',
  allTagsLabel: 'All Tags',
  deleteLabel: 'Delete',
  editLabel: 'Edit',
  entryPickersTitle: 'Entry Pickers',
  noEntryPickerMatchesMessage: 'No entries match this picker search.',
  repairLabel: 'Repair',
  searchEntriesLabel: 'Search entries',
  searchGraphRecordsLabel: 'Search graph records',
  searchRelationshipsLabel: 'Search relationships',
  sourcePickerLabel: 'Source',
  targetPickerLabel: 'Target',
  unsavedDraftMessage: 'Unsaved relationship draft.',
  noMatchesTitle: 'No relationships match the filters.',
  noMatchesDetail: 'Clear filters or choose a different type or entry.',
  emptyTitle: 'No relationships yet.',
  emptyDetail: 'Add a link to start building the world graph.',
} as const;

export type RelationshipStudioModeId =
  | 'review'
  | 'graph'
  | 'links'
  | 'bulk-edit';

export type RelationshipStudioModeOption = {
  id: RelationshipStudioModeId;
  label: string;
  detail: string;
  isActive: boolean;
};

export type RelationshipStudioModeModel = {
  title: string;
  detail: string;
  activeMode: RelationshipStudioModeOption;
  modes: readonly RelationshipStudioModeOption[];
};

const relationshipStudioModeDefinitions: readonly Omit<
  RelationshipStudioModeOption,
  'isActive'
>[] = [
  {
    id: 'review',
    label: relationshipFeatureCopy.studioReviewLabel,
    detail: relationshipFeatureCopy.studioReviewDetail,
  },
  {
    id: 'graph',
    label: relationshipFeatureCopy.studioGraphLabel,
    detail: relationshipFeatureCopy.studioGraphDetail,
  },
  {
    id: 'links',
    label: relationshipFeatureCopy.studioLinksLabel,
    detail: relationshipFeatureCopy.studioLinksDetail,
  },
  {
    id: 'bulk-edit',
    label: relationshipFeatureCopy.studioBulkEditLabel,
    detail: relationshipFeatureCopy.studioBulkEditDetail,
  },
];

function isRelationshipStudioModeId(
  value: string
): value is RelationshipStudioModeId {
  return relationshipStudioModeDefinitions.some((mode) => mode.id === value);
}

export function getRelationshipStudioModeModel(
  activeMode: string = 'review'
): RelationshipStudioModeModel {
  const normalizedMode: RelationshipStudioModeId = isRelationshipStudioModeId(
    activeMode
  )
    ? activeMode
    : 'review';
  const modes = relationshipStudioModeDefinitions.map((mode) => ({
    ...mode,
    isActive: mode.id === normalizedMode,
  }));

  return {
    title: relationshipFeatureCopy.studioTitle,
    detail: relationshipFeatureCopy.studioDetail,
    activeMode: modes.find((mode) => mode.id === normalizedMode) ?? modes[0],
    modes,
  };
}

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

export type CharacterRelationshipGroupId =
  | 'identity'
  | 'origin'
  | 'places'
  | 'affiliations'
  | 'authority'
  | 'family'
  | 'social'
  | 'conflict'
  | 'eventsLore'
  | 'supernatural'
  | 'other';

export type CharacterRelationshipGroup = {
  id: CharacterRelationshipGroupId;
  label: string;
  relationships: RelationshipWithEntries[];
};

export type RelationshipGraphNode = {
  id: string;
  name: string;
  sectionId: string;
  sectionTitle: string;
  status: WorldEntryStatus;
  statusLabel: string;
  summaryText: string;
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

export type RelationshipGraphViewEdge = {
  id: string;
  label: string;
  sourceId: string;
  sourceName: string;
  targetId: string;
  targetName: string;
  directionLabel: '->' | '<->';
};

export type RelationshipGraphViewModel = {
  nodes: RelationshipGraphNode[];
  edges: RelationshipGraphViewEdge[];
};

export type RelationshipListItem = {
  id: string;
  type: string;
  status: WorldEntryStatus;
  statusLabel: string;
  sourceEntryId: string;
  sourceSectionId: string;
  sourceSectionTitle: string;
  sourceName: string;
  targetEntryId: string;
  targetSectionId: string;
  targetSectionTitle: string;
  targetName: string;
  directionLabel: '->' | '<->';
  note: string;
};

export type RelationshipEntryRouteTarget = {
  entryId: string;
  name: string;
  sectionId: string;
};

export type RelationshipManagementRouteTarget = {
  entryId: string;
  name: string;
};

export type RelationshipListModelFilters = {
  entryId?: string;
  type?: string;
  query?: string;
};

type RelationshipWorkspaceModelSource = {
  codex: WorldCodex;
  entryTypes: readonly WorldSectionConfig[];
  relationships: readonly WorldRelationship[];
};

export type RelationshipSelectOption = {
  value: string;
  label: string;
};

export type RelationshipEditorOptionsModel = {
  entries: RelationshipGraphNode[];
  entryOptions: RelationshipSelectOption[];
  selectedEntryFilter: RelationshipGraphNode | null;
  selectedSourceEntry: RelationshipGraphNode | null;
  selectedTargetEntry: RelationshipGraphNode | null;
  savedRelationshipTypes: string[];
  relationshipTypeSuggestions: string[];
  relationshipTypeFilterOptions: RelationshipSelectOption[];
  graphTagOptions: string[];
};

export type BrokenRelationship = RelationshipWithEntries & {
  missingSource: boolean;
  missingTarget: boolean;
};

export type OrphanedEntry = RelationshipGraphNode;

export type RelationshipDiagnosticsBrokenItem = {
  id: string;
  type: string;
  sourceEntryId: string;
  sourceName: string;
  targetEntryId: string;
  targetName: string;
  missingSource: boolean;
  missingTarget: boolean;
};

export type RelationshipDiagnosticsModel = {
  healthSummary: RelationshipHealthSummary;
  brokenRelationships: RelationshipDiagnosticsBrokenItem[];
  orphanedEntries: OrphanedEntry[];
};

export type EntryRelationshipItemModel = {
  id: string;
  type: string;
  directionLabel: 'To' | 'From' | 'Linked with';
  relatedEntryId: string;
  relatedEntryName: string;
  relatedSectionId: string;
  note: string;
};

export type EntryRelationshipGroupModel = {
  id: string;
  label: string;
  relationships: EntryRelationshipItemModel[];
};

type EntryRelationshipModelWorkspace = {
  codex: WorldCodex;
  entryTypes: readonly WorldSectionConfig[];
  relationships: readonly WorldRelationship[];
};

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
    { type: 'has watercourse', perspective: 'either' },
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
    { type: 'built', perspective: 'either' },
    { type: 'created by', perspective: 'either' },
    { type: 'created', perspective: 'either' },
  ],
};

const characterRelationshipGroupOrder: readonly CharacterRelationshipGroupId[] =
  [
    'identity',
    'origin',
    'places',
    'affiliations',
    'authority',
    'family',
    'social',
    'conflict',
    'eventsLore',
    'supernatural',
    'other',
  ];

const characterRelationshipGroupLabels: Record<
  CharacterRelationshipGroupId,
  string
> = {
  identity: 'Identity and forms',
  origin: 'Origin and creation',
  places: 'Places and movement',
  affiliations: 'Affiliations and service',
  authority: 'Authority and command',
  family: 'Family and lineage',
  social: 'Allies, partners, and mentors',
  conflict: 'Rivals, enemies, and obligations',
  eventsLore: 'Events and lore',
  supernatural: 'Bindings and domains',
  other: 'Other links',
};

const characterRelationshipGroupRules: Record<
  Exclude<CharacterRelationshipGroupId, 'other'>,
  readonly {
    type: string;
    perspective: 'source' | 'target' | 'either';
  }[]
> = {
  identity: [
    { type: 'same as', perspective: 'either' },
    { type: 'identity of', perspective: 'either' },
    { type: 'has identity', perspective: 'either' },
  ],
  origin: [
    { type: 'originated from', perspective: 'source' },
    { type: 'origin of', perspective: 'target' },
    { type: 'created by', perspective: 'source' },
    { type: 'created', perspective: 'target' },
    { type: 'ancestry described by', perspective: 'source' },
    { type: 'describes ancestry of', perspective: 'target' },
    { type: 'profession described by', perspective: 'source' },
    { type: 'describes profession of', perspective: 'target' },
  ],
  places: [
    { type: 'resides in', perspective: 'source' },
    { type: 'has resident', perspective: 'target' },
    { type: 'located at', perspective: 'source' },
    { type: 'has present character', perspective: 'target' },
    { type: 'travels between', perspective: 'source' },
    { type: 'visited by', perspective: 'target' },
  ],
  affiliations: [
    { type: 'member of', perspective: 'source' },
    { type: 'has member', perspective: 'target' },
    { type: 'employed by', perspective: 'source' },
    { type: 'employs', perspective: 'target' },
    { type: 'serves', perspective: 'source' },
    { type: 'served by', perspective: 'target' },
  ],
  authority: [
    { type: 'leads', perspective: 'source' },
    { type: 'led by', perspective: 'target' },
    { type: 'rules', perspective: 'source' },
    { type: 'ruled by', perspective: 'target' },
    { type: 'commands', perspective: 'source' },
    { type: 'commanded by', perspective: 'target' },
  ],
  family: [
    { type: 'descended from', perspective: 'source' },
    { type: 'ancestor of', perspective: 'target' },
    { type: 'parent of', perspective: 'either' },
    { type: 'child of', perspective: 'either' },
    { type: 'sibling of', perspective: 'either' },
  ],
  social: [
    { type: 'partner of', perspective: 'either' },
    { type: 'mentor of', perspective: 'either' },
    { type: 'mentored by', perspective: 'either' },
    { type: 'ally of', perspective: 'either' },
  ],
  conflict: [
    { type: 'rival of', perspective: 'either' },
    { type: 'enemy of', perspective: 'either' },
    { type: 'owes obligation to', perspective: 'source' },
    { type: 'is owed by', perspective: 'target' },
  ],
  eventsLore: [
    { type: 'participated in', perspective: 'source' },
    { type: 'included participant', perspective: 'target' },
    { type: 'caused event', perspective: 'source' },
    { type: 'caused by', perspective: 'target' },
    { type: 'changed by event', perspective: 'source' },
    { type: 'changed', perspective: 'target' },
    { type: 'appears in lore', perspective: 'source' },
    { type: 'mentions character', perspective: 'target' },
    { type: 'uses lore', perspective: 'source' },
    { type: 'used by', perspective: 'target' },
    { type: 'references', perspective: 'either' },
    { type: 'referenced by', perspective: 'either' },
  ],
  supernatural: [
    { type: 'bound to', perspective: 'source' },
    { type: 'binds', perspective: 'target' },
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
      statusLabel: getEntryStatusLabel(entry.status),
      summaryText: entry.summary || entryDisplayCopy.emptySummary,
      tags: [...entry.tags],
    }))
  );
}

export function filterRelationshipEntryPickerItems(
  entries: readonly RelationshipGraphNode[],
  query: string
): RelationshipGraphNode[] {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) {
    return [...entries];
  }
  return entries.filter((entry) =>
    [
      entry.name,
      entry.id,
      entry.sectionTitle,
      entry.sectionId,
      entry.status,
      ...entry.tags,
    ].some((value) => value.toLowerCase().includes(normalizedQuery))
  );
}

export function getRelationshipEntryPickerItems(
  codex: WorldCodex,
  sections: readonly WorldSectionConfig[],
  query: string
): RelationshipGraphNode[] {
  return filterRelationshipEntryPickerItems(
    getRelationshipEntries(codex, sections),
    query
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

export function getRelationshipEntryRoute(
  target: RelationshipEntryRouteTarget
): string {
  return getCodexEntriesRoute({
    entryId: target.entryId,
    intent: 'edit',
    query: target.name,
    sectionId: target.sectionId,
  });
}

export function getRelationshipEntryContextRoute(
  target: RelationshipEntryRouteTarget
): string {
  return getCodexEntriesRoute({
    entryId: target.entryId,
    intent: 'context',
    query: target.name,
    sectionId: target.sectionId,
  });
}

export function getRelationshipManagementRoute(
  target: RelationshipManagementRouteTarget
): string {
  return getCodexRelationshipsRoute({
    entryId: target.entryId,
    entryQuery: target.name,
    relationshipQuery: target.name,
  });
}

export function getRelationshipEntryRouteById(
  codex: WorldCodex,
  sections: readonly WorldSectionConfig[],
  entryId: string
): string {
  const section = sections.find((candidate) =>
    getEntries(codex, candidate.id).some((entry) => entry.id === entryId)
  );
  return section
    ? getCodexEntriesRoute({
        entryId,
        intent: 'edit',
        sectionId: section.id,
      })
    : getCodexRelationshipsRoute();
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

export function getRelationshipListModel(
  workspace: RelationshipWorkspaceModelSource,
  filters: RelationshipListModelFilters = {}
): RelationshipListItem[] {
  const relationshipEntries = getRelationshipEntries(
    workspace.codex,
    workspace.entryTypes
  );
  const relationshipEntryById = new Map(
    relationshipEntries.map((entry) => [entry.id, entry])
  );
  const filteredRelationships = filterRelationships(workspace.relationships, {
    type: filters.type ?? '',
    entryId: filters.entryId ?? '',
    query: filters.query ?? '',
    entryById: relationshipEntryById,
  });

  return filteredRelationships.map((relationship) => {
    const sourceEntry = relationshipEntryById.get(relationship.sourceEntryId);
    const targetEntry = relationshipEntryById.get(relationship.targetEntryId);
    return {
      id: relationship.id,
      type: relationship.type,
      status: relationship.status,
      statusLabel: getEntryStatusLabel(relationship.status),
      sourceEntryId: relationship.sourceEntryId,
      sourceSectionId: sourceEntry?.sectionId ?? '',
      sourceSectionTitle: sourceEntry?.sectionTitle ?? '',
      sourceName: sourceEntry?.name ?? relationship.sourceEntryId,
      targetEntryId: relationship.targetEntryId,
      targetSectionId: targetEntry?.sectionId ?? '',
      targetSectionTitle: targetEntry?.sectionTitle ?? '',
      targetName: targetEntry?.name ?? relationship.targetEntryId,
      directionLabel: relationship.directional ? '->' : '<->',
      note: relationship.note,
    };
  });
}

export function getSavedRelationshipTypes(
  relationships: readonly WorldRelationship[]
): string[] {
  return Array.from(
    new Set(
      relationships
        .map((relationship) => relationship.type.trim())
        .filter(Boolean)
    )
  ).sort((first, second) => first.localeCompare(second));
}

export function getRelationshipTypeSuggestions(
  relationships: readonly WorldRelationship[]
): string[] {
  return Array.from(
    new Set([
      ...relationshipTypeOptions,
      ...getSavedRelationshipTypes(relationships),
    ])
  ).sort((first, second) => first.localeCompare(second));
}

export function getRelationshipTypeFilterOptions(
  relationships: readonly WorldRelationship[],
  emptyLabel = 'Any type'
): RelationshipSelectOption[] {
  return [
    { value: '', label: emptyLabel },
    ...getSavedRelationshipTypes(relationships).map((type) => ({
      value: type,
      label: type,
    })),
  ];
}

export function getRelationshipGraphTagOptions(workspace: {
  codex: WorldCodex;
  entryTypes: readonly WorldSectionConfig[];
}): string[] {
  return Array.from(
    new Set(
      getRelationshipEntries(workspace.codex, workspace.entryTypes).flatMap(
        (entry) => entry.tags
      )
    )
  )
    .filter(Boolean)
    .sort((first, second) => first.localeCompare(second));
}

export function getRelationshipEntrySelectOptions(
  workspace: {
    codex: WorldCodex;
    entryTypes: readonly WorldSectionConfig[];
  },
  emptyLabel = 'Choose entry'
): RelationshipSelectOption[] {
  return [
    { value: '', label: emptyLabel },
    ...getRelationshipEntries(workspace.codex, workspace.entryTypes).map(
      (entry) => ({
        value: entry.id,
        label: `${entry.name} (${entry.sectionTitle})`,
      })
    ),
  ];
}

export function getRelationshipEditorOptionsModel(
  workspace: {
    codex: WorldCodex;
    entryTypes: readonly WorldSectionConfig[];
    relationships: readonly WorldRelationship[];
  },
  draft: RelationshipDraft,
  entryFilter = ''
): RelationshipEditorOptionsModel {
  const entries = getRelationshipEntries(workspace.codex, workspace.entryTypes);
  const entryById = new Map(entries.map((entry) => [entry.id, entry]));
  return {
    entries,
    entryOptions: getRelationshipEntrySelectOptions(workspace),
    selectedEntryFilter: entryFilter
      ? entryById.get(entryFilter) ?? null
      : null,
    selectedSourceEntry: draft.sourceEntryId
      ? entryById.get(draft.sourceEntryId) ?? null
      : null,
    selectedTargetEntry: draft.targetEntryId
      ? entryById.get(draft.targetEntryId) ?? null
      : null,
    savedRelationshipTypes: getSavedRelationshipTypes(workspace.relationships),
    relationshipTypeSuggestions: getRelationshipTypeSuggestions(
      workspace.relationships
    ),
    relationshipTypeFilterOptions: getRelationshipTypeFilterOptions(
      workspace.relationships
    ),
    graphTagOptions: getRelationshipGraphTagOptions(workspace),
  };
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

export function getRelationshipDiagnosticsModel(
  workspace: RelationshipWorkspaceModelSource
): RelationshipDiagnosticsModel {
  const brokenRelationships = getBrokenRelationships(
    workspace.relationships,
    workspace.codex,
    workspace.entryTypes
  ).map((relationship) => ({
    id: relationship.id,
    type: relationship.type,
    sourceEntryId: relationship.sourceEntryId,
    sourceName: relationship.sourceEntry?.name ?? relationship.sourceEntryId,
    targetEntryId: relationship.targetEntryId,
    targetName: relationship.targetEntry?.name ?? relationship.targetEntryId,
    missingSource: relationship.missingSource,
    missingTarget: relationship.missingTarget,
  }));
  const orphanedEntries = getOrphanedEntries(
    workspace.relationships,
    workspace.codex,
    workspace.entryTypes
  );
  return {
    healthSummary: {
      brokenRelationshipCount: brokenRelationships.length,
      orphanedEntryCount: orphanedEntries.length,
    },
    brokenRelationships,
    orphanedEntries,
  };
}

function toEntryRelationshipItemModel(
  relationship: RelationshipWithEntries,
  entryId: string,
  entryById: ReadonlyMap<string, RelationshipGraphNode>
): EntryRelationshipItemModel {
  const isSource = relationship.sourceEntryId === entryId;
  const relatedEntry = isSource
    ? relationship.targetEntry
    : relationship.sourceEntry;
  const relatedEntryNode = relatedEntry
    ? entryById.get(relatedEntry.id) ?? null
    : null;
  return {
    id: relationship.id,
    type: relationship.type,
    directionLabel: relationship.directional
      ? isSource
        ? 'To'
        : 'From'
      : 'Linked with',
    relatedEntryId: relatedEntry?.id ?? '',
    relatedEntryName: relatedEntry?.name ?? 'Missing entry',
    relatedSectionId: relatedEntryNode?.sectionId ?? '',
    note: relationship.note,
  };
}

export function getEntryRelationshipSummaryModel(
  workspace: EntryRelationshipModelWorkspace,
  entryId: string
): EntryRelationshipItemModel[] {
  const relationshipEntryById = new Map(
    getRelationshipEntries(workspace.codex, workspace.entryTypes).map(
      (entry) => [entry.id, entry]
    )
  );
  return getEntryRelationships(
    workspace.relationships,
    workspace.codex,
    workspace.entryTypes,
    entryId
  ).map((relationship) =>
    toEntryRelationshipItemModel(relationship, entryId, relationshipEntryById)
  );
}

export function getEntryRelationshipGroupsModel(
  workspace: EntryRelationshipModelWorkspace,
  entry: WorldEntry
): EntryRelationshipGroupModel[] {
  const relationshipEntryById = new Map(
    getRelationshipEntries(workspace.codex, workspace.entryTypes).map(
      (item) => [item.id, item]
    )
  );
  const groups =
    entry.kind === 'place'
      ? getPlaceRelationshipGroups(
          entry,
          workspace.relationships,
          workspace.codex,
          workspace.entryTypes
        )
      : entry.kind === 'character'
      ? getCharacterRelationshipGroups(
          entry,
          workspace.relationships,
          workspace.codex,
          workspace.entryTypes
        )
      : [];
  if (groups.length === 0) {
    const relationships = getEntryRelationshipSummaryModel(workspace, entry.id);
    return relationships.length > 0
      ? [{ id: 'linked-records', label: 'Linked records', relationships }]
      : [];
  }
  return groups.map((group) => ({
    id: group.id,
    label: group.label,
    relationships: group.relationships.map((relationship) =>
      toEntryRelationshipItemModel(
        relationship,
        entry.id,
        relationshipEntryById
      )
    ),
  }));
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

function relationshipMatchesCharacterGroupRule(
  relationship: RelationshipWithEntries,
  entryId: string,
  groupId: Exclude<CharacterRelationshipGroupId, 'other'>
): boolean {
  const normalizedType = normalizeRelationshipType(relationship.type);
  const perspective = relationshipPerspective(relationship, entryId);
  return characterRelationshipGroupRules[groupId].some(
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

function getCharacterRelationshipGroupId(
  relationship: RelationshipWithEntries,
  entryId: string
): CharacterRelationshipGroupId {
  return (
    characterRelationshipGroupOrder.find(
      (groupId) =>
        groupId !== 'other' &&
        relationshipMatchesCharacterGroupRule(relationship, entryId, groupId)
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

/** Group an attached character relationship list into character-tree oriented sections. */
export function getCharacterRelationshipGroups(
  entry: WorldEntry,
  relationships: readonly WorldRelationship[],
  codex: WorldCodex,
  sections: readonly WorldSectionConfig[]
): CharacterRelationshipGroup[] {
  if (entry.kind !== 'character') {
    return [];
  }
  const attachedRelationships = getEntryRelationships(
    relationships,
    codex,
    sections,
    entry.id
  );
  const groupsById = new Map<
    CharacterRelationshipGroupId,
    RelationshipWithEntries[]
  >(characterRelationshipGroupOrder.map((groupId) => [groupId, []]));
  for (const relationship of attachedRelationships) {
    const groupId = getCharacterRelationshipGroupId(relationship, entry.id);
    groupsById.get(groupId)?.push(relationship);
  }
  return characterRelationshipGroupOrder
    .map((groupId) => ({
      id: groupId,
      label: characterRelationshipGroupLabels[groupId],
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

export function getRelationshipGraphViewModel(
  workspace: RelationshipWorkspaceModelSource,
  filters: RelationshipGraphFilters
): RelationshipGraphViewModel {
  const graph = getRelationshipGraph(
    workspace.relationships,
    workspace.codex,
    workspace.entryTypes,
    filters
  );
  const nodeById = new Map(graph.nodes.map((node) => [node.id, node]));
  return {
    nodes: graph.nodes,
    edges: graph.edges.map((edge) => ({
      id: edge.id,
      label: edge.label,
      sourceId: edge.sourceId,
      sourceName: nodeById.get(edge.sourceId)?.name ?? edge.sourceId,
      targetId: edge.targetId,
      targetName: nodeById.get(edge.targetId)?.name ?? edge.targetId,
      directionLabel: edge.directional ? '->' : '<->',
    })),
  };
}
