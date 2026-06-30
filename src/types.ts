/** World codex entry categories used for routing, filtering, and display. */
export type WorldEntryKind =
  | 'character'
  | 'place'
  | 'faction'
  | 'lore'
  | 'timeline';

/** Collection keys used by the local codex store. */
export type WorldSectionId =
  | 'characters'
  | 'places'
  | 'factions'
  | 'lore'
  | 'timeline';

/** Shared fields every worldbuilding record needs for listing and editing. */
export type WorldEntryBase = {
  id: string;
  kind: WorldEntryKind;
  name: string;
  summary: string;
  tags: string[];
  updatedAt: string;
};

/** A person, creature, or major named figure in Valgaron. */
export type CharacterEntry = WorldEntryBase & {
  kind: 'character';
  role: string;
  home: string;
  affiliation: string;
  status: string;
};

/** A location, region, settlement, landmark, or realm. */
export type PlaceEntry = WorldEntryBase & {
  kind: 'place';
  region: string;
  climate: string;
  significance: string;
};

/** A political, religious, military, cultural, or secret organization. */
export type FactionEntry = WorldEntryBase & {
  kind: 'faction';
  purpose: string;
  influence: string;
  headquarters: string;
};

/** A note about magic, history, customs, artifacts, or cosmology. */
export type LoreEntry = WorldEntryBase & {
  kind: 'lore';
  category: string;
  source: string;
  implications: string;
};

/** A dated or ordered event in the world timeline. */
export type TimelineEntry = WorldEntryBase & {
  kind: 'timeline';
  dateLabel: string;
  era: string;
  consequences: string;
};

export type WorldEntry =
  | CharacterEntry
  | PlaceEntry
  | FactionEntry
  | LoreEntry
  | TimelineEntry;

/** The complete local world codex document persisted in the browser. */
export type WorldCodex = {
  characters: CharacterEntry[];
  places: PlaceEntry[];
  factions: FactionEntry[];
  lore: LoreEntry[];
  timeline: TimelineEntry[];
};

export type WorldDetailFieldKey =
  | 'role'
  | 'home'
  | 'affiliation'
  | 'status'
  | 'region'
  | 'climate'
  | 'significance'
  | 'purpose'
  | 'influence'
  | 'headquarters'
  | 'category'
  | 'source'
  | 'implications'
  | 'dateLabel'
  | 'era'
  | 'consequences';

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
};

/** Simple option shape used by retained MUI-based reusable controls. */
export type OptionType = {
  value: string;
  label?: string;
};

/** User-facing English text accepted by reusable controls. */
export type StringOrOptionType = string | OptionType | null | undefined;
