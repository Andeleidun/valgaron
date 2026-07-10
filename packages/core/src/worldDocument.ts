import type {
  InFictionWorld,
  WorldCodex,
  WorldDocument,
  WorldEntry,
  WorldEntryStatus,
  WorldFieldOverride,
  WorldImageAsset,
  WorldImageReference,
  WorldRelationship,
  WorldSectionConfig,
  WorldVocabulary,
  WorldVocabularyIgnoredCandidate,
  WorldVocabularyValue,
  WorldVocabularyValueStatus,
  WorldWorkspaceSchema,
  WorldWorkspace,
  WorldWorkspaceStatus,
} from './types';
import {
  isSupportedImageMediaType,
  validateDocumentImageAssets,
} from './imageAssets';
import { createSeedWorldDocument, worldSections } from './seedCodex';

export const CURRENT_WORLD_SCHEMA_VERSION = 4;

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
const VALID_VOCABULARY_VALUE_STATUSES: readonly WorldVocabularyValueStatus[] = [
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

function readStringArray(
  record: Record<string, unknown>,
  key: string
): string[] | null {
  const value = record[key];
  if (
    !Array.isArray(value) ||
    !value.every((item) => typeof item === 'string')
  ) {
    return null;
  }
  return [...value];
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

function readVocabularyValueStatus(
  record: Record<string, unknown>,
  key: string
): WorldVocabularyValueStatus | null {
  const value = readString(record, key);
  return VALID_VOCABULARY_VALUE_STATUSES.includes(
    value as WorldVocabularyValueStatus
  )
    ? (value as WorldVocabularyValueStatus)
    : null;
}

function isValidOrder(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value > 0;
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
    const autocompleteOptions = field.autocompleteOptions;
    const suggestFromExistingValues = field.suggestFromExistingValues;
    if (
      !key ||
      !label ||
      (multiline !== undefined && typeof multiline !== 'boolean') ||
      (suggestFromExistingValues !== undefined &&
        typeof suggestFromExistingValues !== 'boolean') ||
      (autocompleteOptions !== undefined &&
        (!Array.isArray(autocompleteOptions) ||
          !autocompleteOptions.every((option) => typeof option === 'string')))
    ) {
      return null;
    }
    return {
      key,
      label,
      ...(typeof multiline === 'boolean' ? { multiline } : {}),
      ...(Array.isArray(autocompleteOptions)
        ? { autocompleteOptions: [...autocompleteOptions] }
        : {}),
      ...(typeof suggestFromExistingValues === 'boolean'
        ? { suggestFromExistingValues }
        : {}),
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
  if (record.kind === 'character') {
    const role = readString(record, 'role');
    const home = readString(record, 'home');
    const affiliation = readString(record, 'affiliation');
    const statusNote = readEntryStatus(record, 'status')
      ? null
      : readString(record, 'status');
    return {
      ...(role ? { role, narrativeRole: role } : {}),
      ...(home ? { home, homePlace: home } : {}),
      ...(affiliation ? { affiliation, affiliations: affiliation } : {}),
      ...(statusNote ? { statusNote, currentStatus: statusNote } : {}),
    };
  }
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

function parseImageReference(value: unknown): WorldImageReference | null {
  if (!isRecord(value)) {
    return null;
  }
  const id = readString(value, 'id');
  const uri = readString(value, 'uri');
  const altText = readString(value, 'altText');
  const caption = readString(value, 'caption');
  const decorative = readBoolean(value, 'decorative');
  if (
    !id ||
    !uri ||
    altText === null ||
    caption === null ||
    decorative === null
  ) {
    return null;
  }
  return { id, uri, altText, caption, decorative };
}

function parseImageReferences(value: unknown): WorldImageReference[] | null {
  if (!Array.isArray(value)) {
    return null;
  }
  const images = value.map(parseImageReference);
  return images.some((image) => image === null)
    ? null
    : images.filter((image): image is WorldImageReference => image !== null);
}

function parseImageAsset(value: unknown): WorldImageAsset | null {
  if (!isRecord(value)) {
    return null;
  }
  const id = readString(value, 'id');
  const uri = readString(value, 'uri');
  const originalFilename = readString(value, 'originalFilename');
  const mediaType = value.mediaType;
  const byteSize = value.byteSize;
  const sha256 = readString(value, 'sha256');
  const createdAt = readDateString(value, 'createdAt');
  if (
    !id ||
    !uri ||
    originalFilename === null ||
    !isSupportedImageMediaType(mediaType) ||
    typeof byteSize !== 'number' ||
    !sha256 ||
    !createdAt
  ) {
    return null;
  }
  return {
    id,
    uri,
    originalFilename,
    mediaType,
    byteSize,
    sha256,
    createdAt,
  };
}

function parseImageAssets(value: unknown): WorldImageAsset[] | null {
  if (!Array.isArray(value)) {
    return null;
  }
  const assets = value.map(parseImageAsset);
  return assets.some((asset) => asset === null)
    ? null
    : assets.filter((asset): asset is WorldImageAsset => asset !== null);
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
  const images = parseImageReferences(value.images);
  if (
    !id ||
    !kind ||
    !name ||
    summary === null ||
    !tags ||
    !updatedAt ||
    !createdAt ||
    !images
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
    images,
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

function parseVocabularyValue(value: unknown): WorldVocabularyValue | null {
  if (!isRecord(value)) {
    return null;
  }
  const id = readString(value, 'id');
  const label = readString(value, 'label');
  const description = readString(value, 'description');
  const aliases = readStringArray(value, 'aliases');
  const status = readVocabularyValueStatus(value, 'status');
  const order = value.order;
  if (
    !id ||
    !label ||
    description === null ||
    !aliases ||
    !status ||
    (order !== undefined && !isValidOrder(order))
  ) {
    return null;
  }
  return {
    id,
    label,
    description,
    aliases,
    status,
    ...(isValidOrder(order) ? { order } : {}),
  };
}

function parseVocabulary(value: unknown): WorldVocabulary | null {
  if (!isRecord(value)) {
    return null;
  }
  const id = readString(value, 'id');
  const name = readString(value, 'name');
  const description = readString(value, 'description');
  const values = Array.isArray(value.values)
    ? value.values.map(parseVocabularyValue)
    : null;
  if (
    !id ||
    !name ||
    description === null ||
    !values ||
    values.some((item) => item === null)
  ) {
    return null;
  }
  return {
    id,
    name,
    description,
    values: values.filter(
      (item): item is WorldVocabularyValue => item !== null
    ),
  };
}

function parseFieldOverride(value: unknown): WorldFieldOverride | null {
  if (!isRecord(value)) {
    return null;
  }
  const label = value.label;
  const helpText = value.helpText;
  const hidden = value.hidden;
  const order = value.order;
  const vocabularyId = value.vocabularyId;
  const vocabularyMode = value.vocabularyMode;
  if (
    (label !== undefined && typeof label !== 'string') ||
    (helpText !== undefined && typeof helpText !== 'string') ||
    (hidden !== undefined && typeof hidden !== 'boolean') ||
    (order !== undefined && !isValidOrder(order)) ||
    (vocabularyId !== undefined && typeof vocabularyId !== 'string') ||
    (vocabularyMode !== undefined &&
      vocabularyMode !== 'suggestions' &&
      vocabularyMode !== 'restricted')
  ) {
    return null;
  }
  return {
    ...(typeof label === 'string' ? { label } : {}),
    ...(typeof helpText === 'string' ? { helpText } : {}),
    ...(typeof hidden === 'boolean' ? { hidden } : {}),
    ...(isValidOrder(order) ? { order } : {}),
    ...(typeof vocabularyId === 'string' ? { vocabularyId } : {}),
    ...(vocabularyMode === 'suggestions' || vocabularyMode === 'restricted'
      ? { vocabularyMode }
      : {}),
  };
}

function parseFieldOverrides(
  value: unknown
): WorldWorkspaceSchema['fieldOverrides'] | null {
  if (!isRecord(value)) {
    return null;
  }
  const sectionEntries = Object.entries(value).map(([sectionId, fields]) => {
    if (!isRecord(fields)) {
      return null;
    }
    const fieldEntries = Object.entries(fields).map(([fieldKey, override]) => {
      const parsedOverride = parseFieldOverride(override);
      return parsedOverride ? [fieldKey, parsedOverride] : null;
    });
    if (fieldEntries.some((entry) => entry === null)) {
      return null;
    }
    return [
      sectionId,
      Object.fromEntries(
        fieldEntries.filter(
          (entry): entry is [string, WorldFieldOverride] => entry !== null
        )
      ),
    ] as const;
  });
  if (sectionEntries.some((entry) => entry === null)) {
    return null;
  }
  return Object.fromEntries(
    sectionEntries.filter(
      (entry): entry is NonNullable<typeof entry> => entry !== null
    )
  );
}

function parseIgnoredVocabularyCandidate(
  value: unknown
): WorldVocabularyIgnoredCandidate | null {
  if (!isRecord(value)) {
    return null;
  }
  const vocabularyId = readString(value, 'vocabularyId');
  const candidateValue = readString(value, 'value');
  if (!vocabularyId || candidateValue === null) {
    return null;
  }
  return { vocabularyId, value: candidateValue };
}

function parseIgnoredVocabularyCandidates(
  value: unknown
): WorldVocabularyIgnoredCandidate[] | null {
  if (!Array.isArray(value)) {
    return null;
  }
  const candidates = value.map(parseIgnoredVocabularyCandidate);
  if (candidates.some((candidate) => candidate === null)) {
    return null;
  }
  return candidates.filter(
    (candidate): candidate is WorldVocabularyIgnoredCandidate =>
      candidate !== null
  );
}

function parseWorkspaceSchema(value: unknown): WorldWorkspaceSchema | null {
  if (!isRecord(value)) {
    return null;
  }
  const vocabularies = Array.isArray(value.vocabularies)
    ? value.vocabularies.map(parseVocabulary)
    : null;
  const fieldOverrides = parseFieldOverrides(value.fieldOverrides);
  const ignoredVocabularyCandidates = parseIgnoredVocabularyCandidates(
    value.ignoredVocabularyCandidates
  );
  if (
    !vocabularies ||
    vocabularies.some((vocabulary) => vocabulary === null) ||
    !fieldOverrides ||
    !ignoredVocabularyCandidates
  ) {
    return null;
  }
  return {
    vocabularies: vocabularies.filter(
      (vocabulary): vocabulary is WorldVocabulary => vocabulary !== null
    ),
    fieldOverrides,
    ignoredVocabularyCandidates,
  };
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
  const schema = parseWorkspaceSchema(value.schema);
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
    parsedEntryTypes.length === 0 ||
    !schema ||
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
    schema,
    codex,
    relationships,
    createdAt,
    updatedAt,
  };
}

function migrateSchema3DocumentValue(value: unknown): unknown {
  if (!isRecord(value) || value.schemaVersion !== 3) {
    return value;
  }
  const worlds = Array.isArray(value.worlds)
    ? value.worlds.map((world) => {
        if (!isRecord(world) || !isRecord(world.codex)) {
          return world;
        }
        const codex = Object.fromEntries(
          Object.entries(world.codex).map(([sectionId, entries]) => [
            sectionId,
            Array.isArray(entries)
              ? entries.map((entry) =>
                  isRecord(entry) ? { ...entry, images: [] } : entry
                )
              : entries,
          ])
        );
        return { ...world, codex };
      })
    : value.worlds;
  return {
    ...value,
    schemaVersion: CURRENT_WORLD_SCHEMA_VERSION,
    worlds,
    assets: [],
  };
}

export function parseWorldDocument(value: unknown): WorldDocument | null {
  const migratedValue = migrateSchema3DocumentValue(value);
  if (
    !isRecord(migratedValue) ||
    migratedValue.schemaVersion !== CURRENT_WORLD_SCHEMA_VERSION
  ) {
    return null;
  }
  const activeWorldId = readString(migratedValue, 'activeWorldId');
  const savedAt = readDateString(migratedValue, 'savedAt');
  const worldsValue = migratedValue.worlds;
  const assets = parseImageAssets(migratedValue.assets);
  if (!activeWorldId || !savedAt || !Array.isArray(worldsValue) || !assets) {
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
  const document: WorldDocument = {
    schemaVersion: CURRENT_WORLD_SCHEMA_VERSION,
    activeWorldId,
    worlds: worlds.filter((world): world is WorldWorkspace => world !== null),
    assets,
    savedAt,
  };
  return validateDocumentImageAssets(document) ? null : document;
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
