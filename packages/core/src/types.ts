/** World codex entry category ids used for routing, filtering, and display. */
export type WorldEntryKind = string;

/** Collection keys used by each local world codex. */
export type WorldSectionId = string;

/** Draft state for an entry. */
export type WorldEntryStatus =
  | 'draft'
  | 'canon'
  | 'needs-review'
  | 'deprecated'
  | 'archived';

export type WorldWorkspaceStatus = 'active' | 'archived';

export type WorldImageMediaType =
  | 'image/jpeg'
  | 'image/png'
  | 'image/webp'
  | 'image/gif';

/** A display reference. Uploaded images use a generated images/... URI. */
export type WorldImageReference = {
  id: string;
  uri: string;
  altText: string;
  caption: string;
  decorative: boolean;
};

/** Metadata for immutable uploaded bytes stored outside the JSON document. */
export type WorldImageAsset = {
  id: string;
  uri: string;
  originalFilename: string;
  mediaType: WorldImageMediaType;
  byteSize: number;
  sha256: string;
  createdAt: string;
};

/** Shared fields every worldbuilding record needs for listing and editing. */
export type WorldEntryBase = {
  id: string;
  kind: WorldEntryKind;
  name: string;
  summary: string;
  notes: string;
  tags: string[];
  status: WorldEntryStatus;
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
  fields: Record<string, string>;
  images: WorldImageReference[];
};

/** A person, creature, or major named figure in a workspace. */
export type CharacterEntry = WorldEntryBase;

/** A place, region, settlement, landmark, or realm. */
export type PlaceEntry = WorldEntryBase;

/** A political, religious, military, cultural, or secret organization. */
export type FactionEntry = WorldEntryBase;

/** A note about magic, history, customs, artifacts, or cosmology. */
export type LoreEntry = WorldEntryBase;

/** A dated or ordered event in the world timeline. */
export type TimelineEntry = WorldEntryBase;

export type WorldEntry = WorldEntryBase;

/** The entry collections for a single local world. */
export type WorldCodex = Record<WorldSectionId, WorldEntry[]> & {
  characters: CharacterEntry[];
  places: PlaceEntry[];
  factions: FactionEntry[];
  lore: LoreEntry[];
  timeline: TimelineEntry[];
};

export type WorldDetailFieldKey = string;

export type WorldDetailField = {
  key: WorldDetailFieldKey;
  label: string;
  multiline?: boolean;
  autocompleteOptions?: readonly string[];
  suggestFromExistingValues?: boolean;
};

export type WorldVocabularyValueStatus = 'active' | 'archived';

export type WorldVocabularyValue = {
  id: string;
  label: string;
  description: string;
  aliases: string[];
  status: WorldVocabularyValueStatus;
  order?: number;
};

export type WorldVocabulary = {
  id: string;
  name: string;
  description: string;
  values: WorldVocabularyValue[];
};

export type WorldVocabularyMode = 'suggestions' | 'restricted';

export type WorldFieldOverride = {
  label?: string;
  helpText?: string;
  hidden?: boolean;
  order?: number;
  vocabularyId?: string;
  vocabularyMode?: WorldVocabularyMode;
};

export type WorldVocabularyIgnoredCandidate = {
  vocabularyId: string;
  value: string;
};

export type WorldWorkspaceSchema = {
  vocabularies: WorldVocabulary[];
  fieldOverrides: Record<
    WorldSectionId,
    Record<WorldDetailFieldKey, WorldFieldOverride>
  >;
  ignoredVocabularyCandidates: WorldVocabularyIgnoredCandidate[];
};

export type WorldSectionConfig = {
  id: WorldSectionId;
  kind: WorldEntryKind;
  title: string;
  singularTitle: string;
  description: string;
  detailFields: readonly WorldDetailField[];
  custom?: boolean;
};

export type WorldRelationship = {
  id: string;
  sourceEntryId: string;
  targetEntryId: string;
  type: string;
  directional: boolean;
  note: string;
  status: WorldEntryStatus;
  createdAt: string;
  updatedAt: string;
};

export type InFictionWorld = {
  id: string;
  name: string;
  summary: string;
  classification: string;
  climate: string;
  dominantTerrain: string;
  notes: string;
  tags: string[];
  status: WorldEntryStatus;
  createdAt: string;
  updatedAt: string;
};

export type WorldWorkspace = {
  id: string;
  name: string;
  summary: string;
  defaultEra: string;
  status: WorldWorkspaceStatus;
  planetaryWorlds: InFictionWorld[];
  entryTypes: WorldSectionConfig[];
  schema: WorldWorkspaceSchema;
  codex: WorldCodex;
  relationships: WorldRelationship[];
  createdAt: string;
  updatedAt: string;
};

export type WorldDocument = {
  schemaVersion: 4;
  activeWorldId: string;
  worlds: WorldWorkspace[];
  assets: WorldImageAsset[];
  savedAt: string;
};

export type RecoverySnapshotReason =
  | 'import'
  | 'reset'
  | 'permanent-delete'
  | 'relationship-delete'
  | 'restore'
  | 'workspace-delete'
  | 'planetary-world-delete'
  | 'entry-type-delete'
  | 'schema-cleanup';

export type RecoverySnapshot = {
  id: string;
  reason: RecoverySnapshotReason;
  createdAt: string;
  document: WorldDocument;
};

export type RecoverySnapshotSummary = {
  id: string;
  reason: RecoverySnapshotReason;
  createdAt: string;
  activeWorldName: string;
  worldCount: number;
  entryCount: number;
  relationshipCount: number;
};
