import type {
  InFictionWorld,
  WorldCodex,
  WorldDocument,
  WorldEntry,
  WorldEntryStatus,
  WorldRelationship,
  WorldSectionConfig,
  WorldWorkspace,
  WorldWorkspaceStatus,
} from '../types';
import { createSeedWorldDocument, worldSections } from './seedCodex';

export const CURRENT_WORLD_SCHEMA_VERSION = 2;

const DEFAULT_CREATED_AT = '2026-06-01T00:00:00.000Z';
const DEFAULT_WORLD_ID = 'world-valgaron';

const VALID_ENTRY_STATUSES: readonly WorldEntryStatus[] = [
  'draft',
  'canon',
  'needs-review',
  'deprecated',
  'archived',
];
const VALID_WORKSPACE_STATUSES: readonly WorldWorkspaceStatus[] = [
  'active',
  'archived',
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readString(
  record: Record<string, unknown>,
  key: string
): string | null {
  const value = record[key];
  return typeof value === 'string' ? value : null;
}

function readBoolean(
  record: Record<string, unknown>,
  key: string
): boolean | null {
  const value = record[key];
  return typeof value === 'boolean' ? value : null;
}

function isValidDateString(value: string): boolean {
  return Number.isFinite(Date.parse(value));
}

function readDateString(
  record: Record<string, unknown>,
  key: string
): string | null {
  const value = readString(record, key);
  return value && isValidDateString(value) ? value : null;
}

function readTags(record: Record<string, unknown>): string[] | null {
  const value = record.tags;
  if (!Array.isArray(value) || !value.every((tag) => typeof tag === 'string')) {
    return null;
  }
  return [...value];
}

function readStringMap(
  record: Record<string, unknown>,
  key: string
): Record<string, string> | null {
  const value = record[key];
  if (!isRecord(value)) {
    return null;
  }
  const entries = Object.entries(value);
  if (
    !entries.every(
      (entry): entry is [string, string] => typeof entry[1] === 'string'
    )
  ) {
    return null;
  }
  return Object.fromEntries(entries);
}

function readEntryStatus(
  record: Record<string, unknown>,
  key: string
): WorldEntryStatus | null {
  const value = readString(record, key);
  return VALID_ENTRY_STATUSES.includes(value as WorldEntryStatus)
    ? (value as WorldEntryStatus)
    : null;
}

function readWorkspaceStatus(
  record: Record<string, unknown>,
  key: string
): WorldWorkspaceStatus | null {
  const value = readString(record, key);
  return VALID_WORKSPACE_STATUSES.includes(value as WorldWorkspaceStatus)
    ? (value as WorldWorkspaceStatus)
    : null;
}

function readDetailFields(
  value: unknown
): WorldSectionConfig['detailFields'] | null {
  if (!Array.isArray(value)) {
    return null;
  }
  const fields = value.map((field) => {
    if (!isRecord(field)) {
      return null;
    }
    const key = readString(field, 'key');
    const label = readString(field, 'label');
    const multiline = field.multiline;
    if (
      !key ||
      !label ||
      (multiline !== undefined && typeof multiline !== 'boolean')
    ) {
      return null;
    }
    return {
      key,
      label,
      ...(typeof multiline === 'boolean' ? { multiline } : {}),
    };
  });
  if (fields.some((field) => field === null)) {
    return null;
  }
  return fields.filter(
    (field): field is NonNullable<typeof field> => field !== null
  );
}

function parseSectionConfig(value: unknown): WorldSectionConfig | null {
  if (!isRecord(value)) {
    return null;
  }
  const id = readString(value, 'id');
  const kind = readString(value, 'kind');
  const title = readString(value, 'title');
  const singularTitle = readString(value, 'singularTitle');
  const description = readString(value, 'description');
  const detailFields = readDetailFields(value.detailFields);
  const custom = value.custom;
  if (
    !id ||
    !kind ||
    !title ||
    !singularTitle ||
    description === null ||
    !detailFields ||
    (custom !== undefined && typeof custom !== 'boolean')
  ) {
    return null;
  }
  return {
    id,
    kind,
    title,
    singularTitle,
    description,
    detailFields,
    ...(typeof custom === 'boolean' ? { custom } : {}),
  };
}

function legacyFieldsFromEntry(
  record: Record<string, unknown>
): Record<string, string> {
  const fields: Record<string, string> = {};
  for (const section of worldSections) {
    if (section.kind !== record.kind) {
      continue;
    }
    for (const field of section.detailFields) {
      const legacyKey = field.key === 'statusNote' ? 'status' : field.key;
      const value = readString(record, legacyKey);
      fields[field.key] = value ?? '';
    }
  }
  return fields;
}

function parseEntry(value: unknown): WorldEntry | null {
  if (!isRecord(value)) {
    return null;
  }
  const id = readString(value, 'id');
  const kind = readString(value, 'kind');
  const name = readString(value, 'name');
  const summary = readString(value, 'summary');
  const notes = readString(value, 'notes') ?? '';
  const tags = readTags(value);
  const status = readEntryStatus(value, 'status') ?? 'draft';
  const pinned = readBoolean(value, 'pinned') ?? false;
  const updatedAt = readDateString(value, 'updatedAt');
  const createdAt = readDateString(value, 'createdAt') ?? updatedAt;
  const fields = readStringMap(value, 'fields') ?? legacyFieldsFromEntry(value);
  if (
    !id ||
    !kind ||
    !name ||
    summary === null ||
    !tags ||
    !updatedAt ||
    !createdAt
  ) {
    return null;
  }
  return {
    id,
    kind,
    name,
    summary,
    notes,
    tags,
    status,
    pinned,
    createdAt,
    updatedAt,
    fields,
  };
}

function parseEntryArray(value: unknown): WorldEntry[] | null {
  if (!Array.isArray(value)) {
    return null;
  }
  const entries = value.map(parseEntry);
  if (entries.some((entry) => entry === null)) {
    return null;
  }
  return entries.filter((entry): entry is WorldEntry => entry !== null);
}

function normalizeCodexSections(
  codex: Record<string, WorldEntry[]>,
  sections: readonly WorldSectionConfig[]
): WorldCodex {
  const normalizedCodex = { ...codex };
  for (const section of sections) {
    if (!Array.isArray(normalizedCodex[section.id])) {
      normalizedCodex[section.id] = [];
    }
  }
  return normalizedCodex as WorldCodex;
}

export function parseWorldCodex(
  value: unknown,
  sections: readonly WorldSectionConfig[] = worldSections
): WorldCodex | null {
  if (!isRecord(value)) {
    return null;
  }
  const codex: Record<string, WorldEntry[]> = {};
  for (const [sectionId, entries] of Object.entries(value)) {
    const parsedEntries = parseEntryArray(entries);
    if (!parsedEntries) {
      return null;
    }
    codex[sectionId] = parsedEntries;
  }
  return normalizeCodexSections(codex, sections);
}

function looksLikeLegacyCodex(value: unknown): boolean {
  return (
    isRecord(value) &&
    worldSections.every((section) => Array.isArray(value[section.id]))
  );
}

function parseRelationship(value: unknown): WorldRelationship | null {
  if (!isRecord(value)) {
    return null;
  }
  const id = readString(value, 'id');
  const sourceEntryId = readString(value, 'sourceEntryId');
  const targetEntryId = readString(value, 'targetEntryId');
  const type = readString(value, 'type');
  const directional = readBoolean(value, 'directional');
  const note = readString(value, 'note');
  const status = readEntryStatus(value, 'status');
  const createdAt = readDateString(value, 'createdAt');
  const updatedAt = readDateString(value, 'updatedAt');
  if (
    !id ||
    !sourceEntryId ||
    !targetEntryId ||
    !type ||
    directional === null ||
    note === null ||
    !status ||
    !createdAt ||
    !updatedAt
  ) {
    return null;
  }
  return {
    id,
    sourceEntryId,
    targetEntryId,
    type,
    directional,
    note,
    status,
    createdAt,
    updatedAt,
  };
}

function parseRelationships(value: unknown): WorldRelationship[] | null {
  if (!Array.isArray(value)) {
    return null;
  }
  const relationships = value.map(parseRelationship);
  if (relationships.some((relationship) => relationship === null)) {
    return null;
  }
  return relationships.filter(
    (relationship): relationship is WorldRelationship => relationship !== null
  );
}

function parsePlanetaryWorld(value: unknown): InFictionWorld | null {
  if (!isRecord(value)) {
    return null;
  }
  const id = readString(value, 'id');
  const name = readString(value, 'name');
  const summary = readString(value, 'summary');
  const classification = readString(value, 'classification');
  const climate = readString(value, 'climate');
  const dominantTerrain = readString(value, 'dominantTerrain');
  const notes = readString(value, 'notes') ?? '';
  const tags = readTags(value);
  const status = readEntryStatus(value, 'status') ?? 'draft';
  const createdAt = readDateString(value, 'createdAt');
  const updatedAt = readDateString(value, 'updatedAt');
  if (
    !id ||
    !name ||
    summary === null ||
    classification === null ||
    climate === null ||
    dominantTerrain === null ||
    !tags ||
    !createdAt ||
    !updatedAt
  ) {
    return null;
  }
  return {
    id,
    name,
    summary,
    classification,
    climate,
    dominantTerrain,
    notes,
    tags,
    status,
    createdAt,
    updatedAt,
  };
}

function parsePlanetaryWorlds(value: unknown): InFictionWorld[] | null {
  if (value === undefined) {
    return [];
  }
  if (!Array.isArray(value)) {
    return null;
  }
  const planetaryWorlds = value.map(parsePlanetaryWorld);
  if (planetaryWorlds.some((planetaryWorld) => planetaryWorld === null)) {
    return null;
  }
  return planetaryWorlds.filter(
    (planetaryWorld): planetaryWorld is InFictionWorld =>
      planetaryWorld !== null
  );
}

function parseWorld(value: unknown): WorldWorkspace | null {
  if (!isRecord(value)) {
    return null;
  }
  const id = readString(value, 'id');
  const name = readString(value, 'name');
  const summary = readString(value, 'summary');
  const defaultEra = readString(value, 'defaultEra');
  const status = readWorkspaceStatus(value, 'status') ?? 'active';
  const planetaryWorlds = parsePlanetaryWorlds(value.planetaryWorlds);
  const createdAt = readDateString(value, 'createdAt');
  const updatedAt = readDateString(value, 'updatedAt');
  const entryTypesValue = value.entryTypes;
  const entryTypes = Array.isArray(entryTypesValue)
    ? entryTypesValue.map(parseSectionConfig)
    : null;
  const parsedEntryTypes =
    entryTypes && !entryTypes.some((entryType) => entryType === null)
      ? entryTypes.filter(
          (entryType): entryType is WorldSectionConfig => entryType !== null
        )
      : null;
  const codex = parsedEntryTypes
    ? parseWorldCodex(value.codex, parsedEntryTypes)
    : null;
  const relationships = parseRelationships(value.relationships);
  if (
    !id ||
    !name ||
    summary === null ||
    defaultEra === null ||
    !planetaryWorlds ||
    !codex ||
    !createdAt ||
    !updatedAt ||
    !parsedEntryTypes ||
    relationships === null
  ) {
    return null;
  }
  return {
    id,
    name,
    summary,
    defaultEra,
    status,
    planetaryWorlds,
    entryTypes: parsedEntryTypes,
    codex,
    relationships,
    createdAt,
    updatedAt,
  };
}

function migrateLegacyCodex(codex: WorldCodex): WorldDocument {
  return {
    schemaVersion: CURRENT_WORLD_SCHEMA_VERSION,
    activeWorldId: DEFAULT_WORLD_ID,
    worlds: [
      {
        id: DEFAULT_WORLD_ID,
        name: 'Migrated Workspace',
        summary: 'Workspace migrated from the earlier local codex format.',
        defaultEra: 'Imported Era',
        status: 'active',
        planetaryWorlds: [],
        entryTypes: worldSections.map((section) => ({ ...section })),
        codex,
        relationships: [],
        createdAt: DEFAULT_CREATED_AT,
        updatedAt: new Date().toISOString(),
      },
    ],
    savedAt: new Date().toISOString(),
  };
}

export function parseWorldDocument(value: unknown): WorldDocument | null {
  const legacyCodex = looksLikeLegacyCodex(value)
    ? parseWorldCodex(value)
    : null;
  if (legacyCodex) {
    return migrateLegacyCodex(legacyCodex);
  }
  if (
    !isRecord(value) ||
    value.schemaVersion !== CURRENT_WORLD_SCHEMA_VERSION
  ) {
    return null;
  }
  const activeWorldId = readString(value, 'activeWorldId');
  const savedAt = readDateString(value, 'savedAt');
  const worldsValue = value.worlds;
  if (!activeWorldId || !savedAt || !Array.isArray(worldsValue)) {
    return null;
  }
  const worlds = worldsValue.map(parseWorld);
  if (
    worlds.length === 0 ||
    worlds.some((world) => world === null) ||
    !worlds.some((world) => world?.id === activeWorldId)
  ) {
    return null;
  }
  return {
    schemaVersion: CURRENT_WORLD_SCHEMA_VERSION,
    activeWorldId,
    worlds: worlds.filter((world): world is WorldWorkspace => world !== null),
    savedAt,
  };
}

export function createFallbackWorldDocument(): WorldDocument {
  return createSeedWorldDocument();
}

export function getActiveWorld(document: WorldDocument): WorldWorkspace {
  return (
    document.worlds.find((world) => world.id === document.activeWorldId) ??
    document.worlds[0]
  );
}

export function updateActiveWorld(
  document: WorldDocument,
  updateWorld: (world: WorldWorkspace) => WorldWorkspace
): WorldDocument {
  const activeWorld = getActiveWorld(document);
  const updatedWorld = updateWorld(activeWorld);
  return {
    ...document,
    activeWorldId: updatedWorld.id,
    worlds: document.worlds.map((world) =>
      world.id === activeWorld.id ? updatedWorld : world
    ),
    savedAt: new Date().toISOString(),
  };
}
