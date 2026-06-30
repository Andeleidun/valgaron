/** World codex entry category ids used for routing, filtering, and display. */
export type WorldEntryKind = string;

/** Collection keys used by each local world codex. */
export type WorldSectionId = string;

/** Authoring state for an entry. */
export type WorldEntryStatus =
  | 'draft'
  | 'canon'
  | 'needs-review'
  | 'deprecated'
  | 'archived';

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
};

/** A person, creature, or major named figure in Valgaron. */
export type CharacterEntry = WorldEntryBase;

/** A location, region, settlement, landmark, or realm. */
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

export type WorldWorkspace = {
  id: string;
  name: string;
  summary: string;
  defaultEra: string;
  entryTypes: WorldSectionConfig[];
  codex: WorldCodex;
  relationships: WorldRelationship[];
  createdAt: string;
  updatedAt: string;
};

export type WorldDocument = {
  schemaVersion: 2;
  activeWorldId: string;
  worlds: WorldWorkspace[];
  savedAt: string;
};

/** Simple option shape used by retained MUI-based reusable controls. */
export type OptionType = {
  value: string;
  label?: string;
};

/** User-facing English text accepted by reusable controls. */
export type StringOrOptionType = string | OptionType | null | undefined;
