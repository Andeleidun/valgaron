import type {
  InFictionWorld,
  WorldCodex,
  WorldDetailField,
  WorldDocument,
  WorldFieldOverride,
  WorldSectionConfig,
  WorldSectionId,
  WorldVocabularyMode,
  WorldVocabularyValue,
  WorldWorkspaceSchema,
  WorldWorkspace,
} from './types';
import { cloneWorkspaceSchema, worldSections } from './seedCodex';
import { getActiveWorld, updateActiveWorld } from './worldDocument';

export type WorkspaceDraft = {
  name: string;
  summary: string;
  defaultEra: string;
};

export type WorkspaceDraftFieldKey = keyof WorkspaceDraft;

export type WorkspaceDraftFieldDescriptor = {
  key: WorkspaceDraftFieldKey;
  label: string;
  placeholder?: string;
  multiline?: boolean;
};

export const workspaceDraftFields: readonly WorkspaceDraftFieldDescriptor[] = [
  { key: 'name', label: 'Workspace name' },
  { key: 'summary', label: 'Summary', multiline: true },
  { key: 'defaultEra', label: 'Default era' },
];

export function workspaceDraftFrom(workspace?: WorldWorkspace): WorkspaceDraft {
  return {
    name: workspace?.name ?? '',
    summary: workspace?.summary ?? '',
    defaultEra: workspace?.defaultEra ?? '',
  };
}

export type PlanetaryWorldDraft = {
  name: string;
  summary: string;
  classification: string;
  climate: string;
  dominantTerrain: string;
  notes: string;
  tags: string;
};

export type PlanetaryWorldDraftFieldKey = keyof PlanetaryWorldDraft;

export type PlanetaryWorldDraftFieldDescriptor = {
  key: PlanetaryWorldDraftFieldKey;
  label: string;
  placeholder?: string;
  multiline?: boolean;
};

export type PlanetaryWorldDraftFieldLayoutModel = {
  fields: readonly PlanetaryWorldDraftFieldDescriptor[];
  leadingFields: readonly PlanetaryWorldDraftFieldDescriptor[];
  trailingFields: readonly PlanetaryWorldDraftFieldDescriptor[];
};

export const planetaryWorldDraftFields: readonly PlanetaryWorldDraftFieldDescriptor[] =
  [
    { key: 'name', label: 'Name', placeholder: 'Aurelia' },
    {
      key: 'classification',
      label: 'Classification',
      placeholder: 'Planet, moon, realm',
    },
    { key: 'climate', label: 'Climate', placeholder: 'Temperate' },
    {
      key: 'dominantTerrain',
      label: 'Dominant terrain',
      placeholder: 'Sea cliffs, high forests',
    },
    { key: 'summary', label: 'Summary', multiline: true },
    { key: 'notes', label: 'Notes', multiline: true },
    { key: 'tags', label: 'Tags', placeholder: 'cosmology, frontier, ocean' },
  ];

export function getPlanetaryWorldDraftFieldLayout(): PlanetaryWorldDraftFieldLayoutModel {
  return {
    fields: planetaryWorldDraftFields,
    leadingFields: planetaryWorldDraftFields.slice(0, 4),
    trailingFields: planetaryWorldDraftFields.slice(4),
  };
}

export type EntryTypeDraft = {
  title: string;
  singularTitle: string;
  description: string;
  fields: string;
};

export type EntryTypeDraftFieldKey = keyof EntryTypeDraft;

export type EntryTypeDraftFieldDescriptor = {
  key: EntryTypeDraftFieldKey;
  label: string;
  placeholder?: string;
  multiline?: boolean;
  helperText?: string;
};

export type EntryTypeDraftFieldLayoutModel = {
  fields: readonly EntryTypeDraftFieldDescriptor[];
  leadingFields: readonly EntryTypeDraftFieldDescriptor[];
  trailingFields: readonly EntryTypeDraftFieldDescriptor[];
};

export type EntryTypeDraftFieldPreview = {
  key: string;
  label: string;
  modeLabel: string;
  detail: string;
};

export type CustomEntryTypeFieldMoveDirection = 'up' | 'down';

export type VocabularyValueMoveDirection = 'up' | 'down';

export type FieldOverrideDraft = {
  label: string;
  helpText: string;
  hidden: boolean;
  order: string;
  vocabularyId: string;
  vocabularyMode: WorldVocabularyMode;
};

export type VocabularyValueDraft = {
  label: string;
  description: string;
  aliases: string;
};

export const entryTypeDraftFields: readonly EntryTypeDraftFieldDescriptor[] = [
  { key: 'title', label: 'Section title', placeholder: 'Artifacts' },
  { key: 'singularTitle', label: 'Singular title', placeholder: 'Artifact' },
  { key: 'description', label: 'Description', multiline: true },
  {
    key: 'fields',
    label: 'Detail fields',
    placeholder:
      'Origin; Notes (long); Status [Dormant | Active]; Profession (suggest)',
    helperText:
      'Separate fields with semicolons or new lines. Add (long) for notes, (suggest) for values learned from entries, or [Value | Value] for fixed choices.',
  },
];

export function getEntryTypeDraftFieldLayout(): EntryTypeDraftFieldLayoutModel {
  return {
    fields: entryTypeDraftFields,
    leadingFields: entryTypeDraftFields.slice(0, 2),
    trailingFields: entryTypeDraftFields.slice(2),
  };
}

export function emptyEntryTypeDraft(): EntryTypeDraft {
  return {
    title: '',
    singularTitle: '',
    description: '',
    fields: '',
  };
}

export function emptyVocabularyValueDraft(): VocabularyValueDraft {
  return {
    label: '',
    description: '',
    aliases: '',
  };
}

export function fieldOverrideDraftFrom({
  field,
  override,
}: {
  field: Pick<WorldDetailField, 'label'>;
  override?: WorldFieldOverride;
}): FieldOverrideDraft {
  return {
    label: override?.label ?? field.label,
    helpText: override?.helpText ?? '',
    hidden: Boolean(override?.hidden),
    order: override?.order === undefined ? '' : String(override.order),
    vocabularyId: override?.vocabularyId ?? '',
    vocabularyMode: override?.vocabularyMode ?? 'suggestions',
  };
}

export function vocabularyValueDraftFrom(
  value?: WorldVocabularyValue
): VocabularyValueDraft {
  return {
    label: value?.label ?? '',
    description: value?.description ?? '',
    aliases: value?.aliases.join(', ') ?? '',
  };
}

export type WorkspaceActionState = {
  switchLabel: 'Current' | 'Switch' | 'Archived';
  canSwitch: boolean;
  canArchive: boolean;
  canDelete: boolean;
};

const BUILT_IN_SECTION_IDS = new Set(
  worldSections.map((section) => section.id)
);

export const lastActiveWorkspaceArchiveMessage =
  'Keep at least one active workspace available.';

function nowIso(): string {
  return new Date().toISOString();
}

function cloneCodex(codex: WorldCodex): WorldCodex {
  return Object.fromEntries(
    Object.entries(codex).map(([sectionId, entries]) => [
      sectionId,
      entries.map((entry) => ({
        ...entry,
        tags: [...entry.tags],
        fields: { ...entry.fields },
      })),
    ])
  ) as WorldCodex;
}

function cloneEntryTypes(
  sections: readonly WorldSectionConfig[]
): WorldSectionConfig[] {
  return sections.map((section) => ({
    ...section,
    detailFields: section.detailFields.map((field) => ({
      ...field,
      ...(field.autocompleteOptions
        ? { autocompleteOptions: [...field.autocompleteOptions] }
        : {}),
    })),
  }));
}

function cloneSchema(schema: WorldWorkspaceSchema): WorldWorkspaceSchema {
  return cloneWorkspaceSchema(schema);
}

function clonePlanetaryWorlds(
  planetaryWorlds: readonly InFictionWorld[]
): InFictionWorld[] {
  return planetaryWorlds.map((planetaryWorld) => ({
    ...planetaryWorld,
    tags: [...planetaryWorld.tags],
  }));
}

function uniqueId(baseId: string, existingIds: readonly string[]): string {
  const normalizedBaseId = slugIdentifier(baseId, 'item');
  const existing = new Set(existingIds);
  if (!existing.has(normalizedBaseId)) {
    return normalizedBaseId;
  }
  let suffix = 2;
  while (existing.has(`${normalizedBaseId}-${suffix}`)) {
    suffix += 1;
  }
  return `${normalizedBaseId}-${suffix}`;
}

export function slugIdentifier(value: string, fallback: string): string {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug || fallback;
}

export function parseTags(value: string): string[] {
  return value
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function parseVocabularyAliases(value: string): string[] {
  const aliases = parseTags(value);
  const seen = new Set<string>();
  return aliases.filter((alias) => {
    const key = alias.toLocaleLowerCase();
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function normalizeVocabularyValueDraft(draft: VocabularyValueDraft): {
  label: string;
  description: string;
  aliases: string[];
} {
  return {
    label: draft.label.trim(),
    description: draft.description.trim(),
    aliases: parseVocabularyAliases(draft.aliases),
  };
}

function normalizeFieldOverrideDraft({
  draft,
  field,
  workspace,
}: {
  draft: FieldOverrideDraft;
  field: WorldDetailField;
  workspace: WorldWorkspace;
}): WorldFieldOverride {
  const nextOverride: WorldFieldOverride = {};
  const label = draft.label.trim();
  const helpText = draft.helpText.trim();
  const orderText = draft.order.trim();
  const order = /^[1-9]\d*$/.test(orderText)
    ? Number.parseInt(orderText, 10)
    : null;
  const vocabularyId = draft.vocabularyId.trim();
  const vocabularyExists = workspace.schema.vocabularies.some(
    (vocabulary) => vocabulary.id === vocabularyId
  );

  if (label && label !== field.label) {
    nextOverride.label = label;
  }
  if (helpText) {
    nextOverride.helpText = helpText;
  }
  if (draft.hidden) {
    nextOverride.hidden = true;
  }
  if (order !== null) {
    nextOverride.order = order;
  }
  if (vocabularyExists) {
    nextOverride.vocabularyId = vocabularyId;
    nextOverride.vocabularyMode = draft.vocabularyMode;
  }
  return nextOverride;
}

function isEmptyFieldOverride(override: WorldFieldOverride): boolean {
  return Object.keys(override).length === 0;
}

function areFieldOverridesEqual(
  first: WorldFieldOverride | undefined,
  second: WorldFieldOverride | undefined
): boolean {
  return (
    (first?.label ?? '') === (second?.label ?? '') &&
    (first?.helpText ?? '') === (second?.helpText ?? '') &&
    Boolean(first?.hidden) === Boolean(second?.hidden) &&
    (first?.order ?? null) === (second?.order ?? null) &&
    (first?.vocabularyId ?? '') === (second?.vocabularyId ?? '') &&
    (first?.vocabularyMode ?? 'suggestions') ===
      (second?.vocabularyMode ?? 'suggestions')
  );
}

function areVocabularyValueDraftsEqual(
  value: WorldVocabularyValue,
  draft: ReturnType<typeof normalizeVocabularyValueDraft>
): boolean {
  return (
    value.label === draft.label &&
    value.description === draft.description &&
    value.aliases.length === draft.aliases.length &&
    value.aliases.every((alias, index) => alias === draft.aliases[index])
  );
}

function splitCustomFieldDefinitionText(value: string): string[] {
  const parts: string[] = [];
  let current = '';
  let bracketDepth = 0;
  for (const character of value) {
    if (character === '[') {
      bracketDepth += 1;
      current += character;
      continue;
    }
    if (character === ']') {
      bracketDepth = Math.max(0, bracketDepth - 1);
      current += character;
      continue;
    }
    if (
      bracketDepth === 0 &&
      (character === ';' || character === ',' || character === '\n')
    ) {
      const part = current.trim();
      if (part) {
        parts.push(part);
      }
      current = '';
      continue;
    }
    if (character !== '\r') {
      current += character;
    }
  }
  const finalPart = current.trim();
  return finalPart ? [...parts, finalPart] : parts;
}

function parseCustomFieldOptions(value: string): string[] {
  return value
    .split(/[|,]/)
    .map((option) => option.trim())
    .filter(Boolean);
}

function parseCustomFieldDefinition(
  token: string
): Omit<WorldDetailField, 'key'> | null {
  let labelText = token.trim();
  const optionMatch = labelText.match(/\[([^\]]+)\]\s*$/);
  const autocompleteOptions = optionMatch
    ? parseCustomFieldOptions(optionMatch[1])
    : [];
  if (optionMatch) {
    labelText = labelText.slice(0, optionMatch.index).trim();
  }

  let multiline = false;
  let suggestFromExistingValues = false;
  while (true) {
    const flagMatch = labelText.match(/\(([^)]*)\)\s*$/);
    if (!flagMatch) {
      break;
    }
    const flags = flagMatch[1]
      .toLowerCase()
      .split(/[,\s/|]+/)
      .filter(Boolean);
    const recognized = flags.some((flag) =>
      ['long', 'multiline', 'note', 'notes', 'suggest', 'suggestions'].includes(
        flag
      )
    );
    if (!recognized) {
      break;
    }
    multiline =
      multiline ||
      flags.some((flag) =>
        ['long', 'multiline', 'note', 'notes'].includes(flag)
      );
    suggestFromExistingValues =
      suggestFromExistingValues ||
      flags.some((flag) => ['suggest', 'suggestions'].includes(flag));
    labelText = labelText.slice(0, flagMatch.index).trim();
  }

  if (!labelText) {
    return null;
  }
  return {
    label: labelText,
    ...(multiline ? { multiline: true } : {}),
    ...(suggestFromExistingValues ? { suggestFromExistingValues: true } : {}),
    ...(autocompleteOptions.length > 0 ? { autocompleteOptions } : {}),
  };
}

export function parseCustomDetailFields(value: string): WorldDetailField[] {
  return splitCustomFieldDefinitionText(value).reduce<WorldDetailField[]>(
    (detailFields, token) => {
      const definition = parseCustomFieldDefinition(token);
      if (!definition) {
        return detailFields;
      }
      const key = uniqueId(
        slugIdentifier(definition.label, 'field'),
        detailFields.map((field) => field.key)
      );
      return [...detailFields, { key, ...definition }];
    },
    []
  );
}

function getCustomDetailFieldModeLabel(field: WorldDetailField): string {
  if (field.autocompleteOptions?.length) {
    return 'Suggested choices';
  }
  if (field.multiline) {
    return 'Long text';
  }
  if (field.suggestFromExistingValues) {
    return 'Suggested from entries';
  }
  return 'Text';
}

function getCustomDetailFieldDetail(field: WorldDetailField): string {
  if (field.autocompleteOptions?.length) {
    return field.autocompleteOptions.join(', ');
  }
  if (field.multiline) {
    return 'Multiline detail field.';
  }
  if (field.suggestFromExistingValues) {
    return 'Suggests values already used in this field.';
  }
  return 'Flexible text field.';
}

export function getEntryTypeDraftFieldPreview(
  fieldsText: string
): EntryTypeDraftFieldPreview[] {
  return parseCustomDetailFields(fieldsText).map((field) => ({
    key: field.key,
    label: field.label,
    modeLabel: getCustomDetailFieldModeLabel(field),
    detail: getCustomDetailFieldDetail(field),
  }));
}

export function normalizeWorkspaceDraft(draft: WorkspaceDraft): WorkspaceDraft {
  return {
    name: draft.name.trim(),
    summary: draft.summary.trim(),
    defaultEra: draft.defaultEra.trim(),
  };
}

export function normalizePlanetaryWorldDraft(
  draft: PlanetaryWorldDraft
): PlanetaryWorldDraft {
  return {
    name: draft.name.trim(),
    summary: draft.summary.trim(),
    classification: draft.classification.trim(),
    climate: draft.climate.trim(),
    dominantTerrain: draft.dominantTerrain.trim(),
    notes: draft.notes.trim(),
    tags: parseTags(draft.tags).join(', '),
  };
}

export function planetaryWorldDraftFrom(
  planetaryWorld?: InFictionWorld
): PlanetaryWorldDraft {
  return {
    name: planetaryWorld?.name ?? '',
    summary: planetaryWorld?.summary ?? '',
    classification: planetaryWorld?.classification ?? '',
    climate: planetaryWorld?.climate ?? '',
    dominantTerrain: planetaryWorld?.dominantTerrain ?? '',
    notes: planetaryWorld?.notes ?? '',
    tags: planetaryWorld?.tags.join(', ') ?? '',
  };
}

function createEmptyCodex(sections: readonly WorldSectionConfig[]): WorldCodex {
  const codex: WorldCodex = {
    characters: [],
    places: [],
    factions: [],
    lore: [],
    timeline: [],
  };
  for (const section of sections) {
    codex[section.id] = [];
  }
  return codex;
}

export function createWorkspace(
  document: WorldDocument,
  draft: WorkspaceDraft
): WorldDocument {
  const createdAt = nowIso();
  const normalizedDraft = normalizeWorkspaceDraft(draft);
  const entryTypes = cloneEntryTypes(worldSections);
  const workspace: WorldWorkspace = {
    id: uniqueId(
      `workspace-${normalizedDraft.name}`,
      document.worlds.map((world) => world.id)
    ),
    name: normalizedDraft.name,
    summary: normalizedDraft.summary,
    defaultEra: normalizedDraft.defaultEra,
    status: 'active',
    planetaryWorlds: [],
    entryTypes,
    schema: cloneWorkspaceSchema(),
    codex: createEmptyCodex(entryTypes),
    relationships: [],
    createdAt,
    updatedAt: createdAt,
  };
  return {
    ...document,
    activeWorldId: workspace.id,
    worlds: [...document.worlds, workspace],
    savedAt: createdAt,
  };
}

export function updateWorkspaceMetadata(
  document: WorldDocument,
  workspaceId: string,
  draft: WorkspaceDraft
): WorldDocument {
  const normalizedDraft = normalizeWorkspaceDraft(draft);
  const workspace = document.worlds.find((world) => world.id === workspaceId);
  if (
    !workspace ||
    (workspace.name === normalizedDraft.name &&
      workspace.summary === normalizedDraft.summary &&
      workspace.defaultEra === normalizedDraft.defaultEra)
  ) {
    return document;
  }
  const updatedAt = nowIso();
  return {
    ...document,
    worlds: document.worlds.map((world) =>
      world.id === workspaceId
        ? {
            ...world,
            name: normalizedDraft.name,
            summary: normalizedDraft.summary,
            defaultEra: normalizedDraft.defaultEra,
            updatedAt,
          }
        : world
    ),
    savedAt: updatedAt,
  };
}

export function setActiveWorkspace(
  document: WorldDocument,
  workspaceId: string
): WorldDocument {
  const workspace = document.worlds.find(
    (world) => world.id === workspaceId && world.status !== 'archived'
  );
  return workspace && document.activeWorldId !== workspace.id
    ? { ...document, activeWorldId: workspace.id, savedAt: nowIso() }
    : document;
}

export function setWorkspaceArchived(
  document: WorldDocument,
  workspaceId: string,
  archived: boolean
): WorldDocument {
  const workspace = document.worlds.find((world) => world.id === workspaceId);
  const nextStatus: WorldWorkspace['status'] = archived ? 'archived' : 'active';
  if (!workspace || workspace.status === nextStatus) {
    return document;
  }
  if (
    archived &&
    document.worlds.filter((world) => world.status !== 'archived').length <=
      1 &&
    document.worlds.some(
      (world) => world.id === workspaceId && world.status !== 'archived'
    )
  ) {
    return document;
  }
  const updatedAt = nowIso();
  const nextWorlds = document.worlds.map((world) =>
    world.id === workspaceId
      ? {
          ...world,
          status: nextStatus,
          updatedAt,
        }
      : world
  );
  const activeWorkspace =
    nextWorlds.find((world) => world.id === document.activeWorldId) ??
    nextWorlds[0];
  const shouldChooseNewActive =
    activeWorkspace.status === 'archived' || activeWorkspace.id === workspaceId;
  const fallbackActive =
    nextWorlds.find((world) => world.status !== 'archived') ?? activeWorkspace;
  return {
    ...document,
    activeWorldId: shouldChooseNewActive
      ? fallbackActive.id
      : document.activeWorldId,
    worlds: nextWorlds,
    savedAt: updatedAt,
  };
}

export function duplicateWorkspace(
  document: WorldDocument,
  workspaceId: string
): WorldDocument {
  const source = document.worlds.find((world) => world.id === workspaceId);
  if (!source) {
    return document;
  }
  const createdAt = nowIso();
  const duplicate: WorldWorkspace = {
    ...source,
    id: uniqueId(
      `${source.id}-copy`,
      document.worlds.map((world) => world.id)
    ),
    name: `${source.name} Copy`,
    status: 'active',
    planetaryWorlds: clonePlanetaryWorlds(source.planetaryWorlds),
    entryTypes: cloneEntryTypes(source.entryTypes),
    schema: cloneSchema(source.schema),
    codex: cloneCodex(source.codex),
    relationships: source.relationships.map((relationship) => ({
      ...relationship,
    })),
    createdAt,
    updatedAt: createdAt,
  };
  return {
    ...document,
    activeWorldId: duplicate.id,
    worlds: [...document.worlds, duplicate],
    savedAt: createdAt,
  };
}

export function deleteWorkspace(
  document: WorldDocument,
  workspaceId: string
): WorldDocument {
  if (document.worlds.length <= 1) {
    return document;
  }
  const nextWorlds = document.worlds.filter(
    (world) => world.id !== workspaceId
  );
  if (nextWorlds.length === document.worlds.length) {
    return document;
  }
  const activeWorldId =
    document.activeWorldId === workspaceId
      ? (
          nextWorlds.find((world) => world.status !== 'archived') ??
          nextWorlds[0]
        ).id
      : document.activeWorldId;
  return {
    ...document,
    activeWorldId,
    worlds: nextWorlds,
    savedAt: nowIso(),
  };
}

export function upsertPlanetaryWorld(
  workspace: WorldWorkspace,
  draft: PlanetaryWorldDraft,
  existingPlanetaryWorld?: InFictionWorld
): WorldWorkspace {
  const normalizedDraft = normalizePlanetaryWorldDraft(draft);
  const tags = parseTags(normalizedDraft.tags);
  if (
    existingPlanetaryWorld &&
    existingPlanetaryWorld.name === normalizedDraft.name &&
    existingPlanetaryWorld.summary === normalizedDraft.summary &&
    existingPlanetaryWorld.classification === normalizedDraft.classification &&
    existingPlanetaryWorld.climate === normalizedDraft.climate &&
    existingPlanetaryWorld.dominantTerrain ===
      normalizedDraft.dominantTerrain &&
    existingPlanetaryWorld.notes === normalizedDraft.notes &&
    existingPlanetaryWorld.tags.length === tags.length &&
    existingPlanetaryWorld.tags.every((tag, index) => tag === tags[index])
  ) {
    return workspace;
  }
  const updatedAt = nowIso();
  const planetaryWorld: InFictionWorld = {
    id:
      existingPlanetaryWorld?.id ??
      uniqueId(
        `planetary-world-${normalizedDraft.name}`,
        workspace.planetaryWorlds.map((world) => world.id)
      ),
    name: normalizedDraft.name,
    summary: normalizedDraft.summary,
    classification: normalizedDraft.classification,
    climate: normalizedDraft.climate,
    dominantTerrain: normalizedDraft.dominantTerrain,
    notes: normalizedDraft.notes,
    tags,
    status: existingPlanetaryWorld?.status ?? 'draft',
    createdAt: existingPlanetaryWorld?.createdAt ?? updatedAt,
    updatedAt,
  };
  return {
    ...workspace,
    planetaryWorlds: existingPlanetaryWorld
      ? workspace.planetaryWorlds.map((world) =>
          world.id === existingPlanetaryWorld.id ? planetaryWorld : world
        )
      : [...workspace.planetaryWorlds, planetaryWorld],
    updatedAt,
  };
}

export function setPlanetaryWorldArchived(
  workspace: WorldWorkspace,
  planetaryWorldId: string,
  archived: boolean
): WorldWorkspace {
  const planetaryWorld = workspace.planetaryWorlds.find(
    (candidate) => candidate.id === planetaryWorldId
  );
  const nextStatus = archived ? 'archived' : 'draft';
  if (!planetaryWorld || planetaryWorld.status === nextStatus) {
    return workspace;
  }
  const updatedAt = nowIso();
  return {
    ...workspace,
    planetaryWorlds: workspace.planetaryWorlds.map((planetaryWorld) =>
      planetaryWorld.id === planetaryWorldId
        ? {
            ...planetaryWorld,
            status: nextStatus,
            updatedAt,
          }
        : planetaryWorld
    ),
    updatedAt,
  };
}

export function deletePlanetaryWorld(
  workspace: WorldWorkspace,
  planetaryWorldId: string
): WorldWorkspace {
  if (
    !workspace.planetaryWorlds.some(
      (planetaryWorld) => planetaryWorld.id === planetaryWorldId
    )
  ) {
    return workspace;
  }
  const updatedAt = nowIso();
  return {
    ...workspace,
    planetaryWorlds: workspace.planetaryWorlds.filter(
      (planetaryWorld) => planetaryWorld.id !== planetaryWorldId
    ),
    updatedAt,
  };
}

export function createCustomEntryType(
  workspace: WorldWorkspace,
  draft: EntryTypeDraft
): WorldWorkspace {
  const updatedAt = nowIso();
  const sectionId = uniqueId(
    slugIdentifier(draft.title, 'custom-section'),
    workspace.entryTypes.map((section) => section.id)
  );
  const fields = parseCustomDetailFields(draft.fields);
  const section: WorldSectionConfig = {
    id: sectionId,
    kind: uniqueId(
      slugIdentifier(draft.singularTitle, sectionId),
      workspace.entryTypes.map((section) => section.kind)
    ),
    title: draft.title.trim(),
    singularTitle: draft.singularTitle.trim(),
    description: draft.description.trim(),
    detailFields:
      fields.length > 0 ? fields : [{ key: 'detail', label: 'Detail' }],
    custom: true,
  };
  return {
    ...workspace,
    entryTypes: [...workspace.entryTypes, section],
    codex: {
      ...workspace.codex,
      [section.id]: [],
    },
    updatedAt,
  };
}

export function addCustomEntryTypeFields(
  workspace: WorldWorkspace,
  sectionId: string,
  fieldsText: string
): WorldWorkspace {
  const fieldsToAdd = parseCustomDetailFields(fieldsText);
  if (fieldsToAdd.length === 0) {
    return workspace;
  }
  let didAddFields = false;
  const entryTypes = workspace.entryTypes.map((section) => {
    if (section.id !== sectionId || !section.custom) {
      return section;
    }
    const nextFields = fieldsToAdd.reduce<WorldDetailField[]>(
      (detailFields, field) => {
        const key = uniqueId(
          field.key,
          detailFields.map((detailField) => detailField.key)
        );
        return [
          ...detailFields,
          {
            ...field,
            key,
          },
        ];
      },
      [...section.detailFields]
    );
    didAddFields = nextFields.length > section.detailFields.length;
    return {
      ...section,
      detailFields: nextFields,
    };
  });
  if (!didAddFields) {
    return workspace;
  }
  return {
    ...workspace,
    entryTypes,
    updatedAt: nowIso(),
  };
}

export function moveCustomEntryTypeField(
  workspace: WorldWorkspace,
  sectionId: string,
  fieldKey: string,
  direction: CustomEntryTypeFieldMoveDirection
): WorldWorkspace {
  let didMoveField = false;
  const entryTypes = workspace.entryTypes.map((section) => {
    if (section.id !== sectionId || !section.custom) {
      return section;
    }
    const currentIndex = section.detailFields.findIndex(
      (field) => field.key === fieldKey
    );
    if (currentIndex < 0) {
      return section;
    }
    const nextIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (nextIndex < 0 || nextIndex >= section.detailFields.length) {
      return section;
    }
    const detailFields = [...section.detailFields];
    const [field] = detailFields.splice(currentIndex, 1);
    detailFields.splice(nextIndex, 0, field);
    didMoveField = true;
    return {
      ...section,
      detailFields,
    };
  });
  if (!didMoveField) {
    return workspace;
  }
  return {
    ...workspace,
    entryTypes,
    updatedAt: nowIso(),
  };
}

export function renameCustomEntryTypeField(
  workspace: WorldWorkspace,
  sectionId: string,
  fieldKey: string,
  label: string
): WorldWorkspace {
  const nextLabel = label.trim();
  if (!nextLabel) {
    return workspace;
  }
  let didRenameField = false;
  const entryTypes = workspace.entryTypes.map((section) => {
    if (section.id !== sectionId || !section.custom) {
      return section;
    }
    const detailFields = section.detailFields.map((field) => {
      if (field.key !== fieldKey || field.label === nextLabel) {
        return field;
      }
      didRenameField = true;
      return {
        ...field,
        label: nextLabel,
      };
    });
    return didRenameField
      ? {
          ...section,
          detailFields,
        }
      : section;
  });
  if (!didRenameField) {
    return workspace;
  }
  return {
    ...workspace,
    entryTypes,
    updatedAt: nowIso(),
  };
}

export function removeCustomEntryTypeField(
  workspace: WorldWorkspace,
  sectionId: string,
  fieldKey: string
): WorldWorkspace {
  let didRemoveField = false;
  const entryTypes = workspace.entryTypes.map((section) => {
    if (section.id !== sectionId || !section.custom) {
      return section;
    }
    const detailFields = section.detailFields.filter(
      (field) => field.key !== fieldKey
    );
    if (detailFields.length === section.detailFields.length) {
      return section;
    }
    didRemoveField = true;
    return {
      ...section,
      detailFields,
    };
  });
  if (!didRemoveField) {
    return workspace;
  }
  return {
    ...workspace,
    entryTypes,
    updatedAt: nowIso(),
  };
}

export function deleteCustomEntryType(
  workspace: WorldWorkspace,
  sectionId: string
): WorldWorkspace {
  const section = workspace.entryTypes.find(
    (entryType) => entryType.id === sectionId
  );
  if (!section?.custom || BUILT_IN_SECTION_IDS.has(sectionId)) {
    return workspace;
  }
  const updatedAt = nowIso();
  const remainingCodex: Record<string, (typeof workspace.codex)[string]> = {
    ...workspace.codex,
  };
  delete remainingCodex[sectionId];
  const remainingEntryIds = new Set(
    Object.values(remainingCodex).flatMap((entries) =>
      entries.map((entry) => entry.id)
    )
  );
  return {
    ...workspace,
    entryTypes: workspace.entryTypes.filter(
      (entryType) => entryType.id !== sectionId
    ),
    codex: remainingCodex as WorldCodex,
    relationships: workspace.relationships.filter((relationship) => {
      return (
        remainingEntryIds.has(relationship.sourceEntryId) &&
        remainingEntryIds.has(relationship.targetEntryId)
      );
    }),
    updatedAt,
  };
}

function hasDuplicateActiveVocabularyLabel(
  values: readonly WorldVocabularyValue[],
  label: string,
  ignoredValueId?: string
): boolean {
  const normalizedLabel = label.trim().toLocaleLowerCase();
  return values.some(
    (value) =>
      value.id !== ignoredValueId &&
      value.status === 'active' &&
      value.label.trim().toLocaleLowerCase() === normalizedLabel
  );
}

function nextVocabularyOrder(values: readonly WorldVocabularyValue[]): number {
  return (
    Math.max(0, ...values.map((value, index) => value.order ?? index + 1)) + 1
  );
}

function reorderActiveVocabularyValues(
  values: readonly WorldVocabularyValue[],
  valueId: string,
  direction: VocabularyValueMoveDirection
): WorldVocabularyValue[] | null {
  const activeValues = [...values]
    .filter((value) => value.status === 'active')
    .sort(
      (first, second) =>
        (first.order ?? Number.MAX_SAFE_INTEGER) -
          (second.order ?? Number.MAX_SAFE_INTEGER) ||
        first.label.localeCompare(second.label)
    );
  const currentIndex = activeValues.findIndex((value) => value.id === valueId);
  if (currentIndex < 0) {
    return null;
  }
  const nextIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
  if (nextIndex < 0 || nextIndex >= activeValues.length) {
    return null;
  }
  const reorderedValues = [...activeValues];
  const [movedValue] = reorderedValues.splice(currentIndex, 1);
  reorderedValues.splice(nextIndex, 0, movedValue);
  const orderById = new Map(
    reorderedValues.map((value, index) => [value.id, index + 1])
  );
  return values.map((value) =>
    value.status === 'active'
      ? {
          ...value,
          order: orderById.get(value.id) ?? value.order,
        }
      : value
  );
}

export function addVocabularyValue(
  workspace: WorldWorkspace,
  vocabularyId: string,
  draft: VocabularyValueDraft
): WorldWorkspace {
  const normalizedDraft = normalizeVocabularyValueDraft(draft);
  if (!normalizedDraft.label) {
    return workspace;
  }
  let didChange = false;
  const vocabularies = workspace.schema.vocabularies.map((vocabulary) => {
    if (vocabulary.id !== vocabularyId) {
      return vocabulary;
    }
    if (
      hasDuplicateActiveVocabularyLabel(
        vocabulary.values,
        normalizedDraft.label
      )
    ) {
      return vocabulary;
    }
    const archivedMatch = vocabulary.values.find(
      (value) =>
        value.status === 'archived' &&
        value.label.trim().toLocaleLowerCase() ===
          normalizedDraft.label.toLocaleLowerCase()
    );
    if (archivedMatch) {
      didChange = true;
      return {
        ...vocabulary,
        values: vocabulary.values.map((value) =>
          value.id === archivedMatch.id
            ? {
                ...value,
                label: normalizedDraft.label,
                description: normalizedDraft.description || value.description,
                aliases:
                  normalizedDraft.aliases.length > 0
                    ? normalizedDraft.aliases
                    : value.aliases,
                status: 'active' as const,
                order: nextVocabularyOrder(vocabulary.values),
              }
            : value
        ),
      };
    }
    didChange = true;
    return {
      ...vocabulary,
      values: [
        ...vocabulary.values,
        {
          id: uniqueId(
            normalizedDraft.label,
            vocabulary.values.map((value) => value.id)
          ),
          label: normalizedDraft.label,
          description: normalizedDraft.description,
          aliases: normalizedDraft.aliases,
          status: 'active' as const,
          order: nextVocabularyOrder(vocabulary.values),
        },
      ],
    };
  });
  return didChange
    ? {
        ...workspace,
        schema: { ...workspace.schema, vocabularies },
        updatedAt: nowIso(),
      }
    : workspace;
}

export function updateVocabularyValue(
  workspace: WorldWorkspace,
  vocabularyId: string,
  valueId: string,
  draft: VocabularyValueDraft
): WorldWorkspace {
  const normalizedDraft = normalizeVocabularyValueDraft(draft);
  if (!normalizedDraft.label) {
    return workspace;
  }
  let didChange = false;
  const vocabularies = workspace.schema.vocabularies.map((vocabulary) => {
    if (vocabulary.id !== vocabularyId) {
      return vocabulary;
    }
    if (
      hasDuplicateActiveVocabularyLabel(
        vocabulary.values,
        normalizedDraft.label,
        valueId
      )
    ) {
      return vocabulary;
    }
    const values = vocabulary.values.map((value) => {
      if (value.id !== valueId) {
        return value;
      }
      if (areVocabularyValueDraftsEqual(value, normalizedDraft)) {
        return value;
      }
      didChange = true;
      return {
        ...value,
        label: normalizedDraft.label,
        description: normalizedDraft.description,
        aliases: normalizedDraft.aliases,
      };
    });
    return { ...vocabulary, values };
  });
  return didChange
    ? {
        ...workspace,
        schema: { ...workspace.schema, vocabularies },
        updatedAt: nowIso(),
      }
    : workspace;
}

export function updateFieldOverride(
  workspace: WorldWorkspace,
  sectionId: WorldSectionId,
  fieldKey: string,
  draft: FieldOverrideDraft
): WorldWorkspace {
  const section = workspace.entryTypes.find(
    (entryType) => entryType.id === sectionId
  );
  const field = section?.detailFields.find(
    (candidate) => candidate.key === fieldKey
  );
  if (!section || !field || !draft.label.trim()) {
    return workspace;
  }

  const nextOverride = normalizeFieldOverrideDraft({
    draft,
    field,
    workspace,
  });
  const currentSectionOverrides =
    workspace.schema.fieldOverrides[sectionId] ?? {};
  const currentOverride = currentSectionOverrides[fieldKey];
  if (
    areFieldOverridesEqual(
      currentOverride,
      isEmptyFieldOverride(nextOverride) ? undefined : nextOverride
    )
  ) {
    return workspace;
  }
  const nextSectionOverrides = { ...currentSectionOverrides };

  if (isEmptyFieldOverride(nextOverride)) {
    delete nextSectionOverrides[fieldKey];
  } else {
    nextSectionOverrides[fieldKey] = nextOverride;
  }

  const nextFieldOverrides = { ...workspace.schema.fieldOverrides };
  if (Object.keys(nextSectionOverrides).length === 0) {
    delete nextFieldOverrides[sectionId];
  } else {
    nextFieldOverrides[sectionId] = nextSectionOverrides;
  }

  return {
    ...workspace,
    schema: {
      ...workspace.schema,
      fieldOverrides: nextFieldOverrides,
    },
    updatedAt: nowIso(),
  };
}

export function setVocabularyValueArchived(
  workspace: WorldWorkspace,
  vocabularyId: string,
  valueId: string,
  archived: boolean
): WorldWorkspace {
  let didChange = false;
  const vocabularies = workspace.schema.vocabularies.map((vocabulary) => {
    if (vocabulary.id !== vocabularyId) {
      return vocabulary;
    }
    const valueToUpdate = vocabulary.values.find(
      (value) => value.id === valueId
    );
    if (!valueToUpdate) {
      return vocabulary;
    }
    if (
      !archived &&
      hasDuplicateActiveVocabularyLabel(
        vocabulary.values,
        valueToUpdate.label,
        valueId
      )
    ) {
      return vocabulary;
    }
    const nextStatus = archived ? ('archived' as const) : ('active' as const);
    if (valueToUpdate.status === nextStatus) {
      return vocabulary;
    }
    didChange = true;
    return {
      ...vocabulary,
      values: vocabulary.values.map((value) =>
        value.id === valueId
          ? {
              ...value,
              status: nextStatus,
              ...(nextStatus === 'active'
                ? { order: nextVocabularyOrder(vocabulary.values) }
                : {}),
            }
          : value
      ),
    };
  });
  return didChange
    ? {
        ...workspace,
        schema: { ...workspace.schema, vocabularies },
        updatedAt: nowIso(),
      }
    : workspace;
}

export function moveVocabularyValue(
  workspace: WorldWorkspace,
  vocabularyId: string,
  valueId: string,
  direction: VocabularyValueMoveDirection
): WorldWorkspace {
  let didMove = false;
  const vocabularies = workspace.schema.vocabularies.map((vocabulary) => {
    if (vocabulary.id !== vocabularyId) {
      return vocabulary;
    }
    const values = reorderActiveVocabularyValues(
      vocabulary.values,
      valueId,
      direction
    );
    if (!values) {
      return vocabulary;
    }
    didMove = true;
    return { ...vocabulary, values };
  });
  return didMove
    ? {
        ...workspace,
        schema: { ...workspace.schema, vocabularies },
        updatedAt: nowIso(),
      }
    : workspace;
}

export function updateActiveWorkspace(
  document: WorldDocument,
  updateWorkspace: (workspace: WorldWorkspace) => WorldWorkspace
): WorldDocument {
  return updateActiveWorld(document, updateWorkspace);
}

export function getWorkspaceCounts(document: WorldDocument) {
  const activeWorkspaces = document.worlds.filter(
    (workspace) => workspace.status !== 'archived'
  );
  return {
    total: document.worlds.length,
    active: activeWorkspaces.length,
    archived: document.worlds.length - activeWorkspaces.length,
    activeWorkspaceName: getActiveWorld(document).name,
  };
}

export function getWorkspaceActionState({
  activeWorkspaceId,
  activeWorkspaceCount,
  workspace,
  workspaceCount,
}: {
  activeWorkspaceId: string;
  activeWorkspaceCount: number;
  workspace: WorldWorkspace;
  workspaceCount: number;
}): WorkspaceActionState {
  if (workspace.status === 'archived') {
    return {
      switchLabel: 'Archived',
      canSwitch: false,
      canArchive: true,
      canDelete: workspaceCount > 1,
    };
  }
  if (workspace.id === activeWorkspaceId) {
    return {
      switchLabel: 'Current',
      canSwitch: false,
      canArchive: activeWorkspaceCount > 1,
      canDelete: workspaceCount > 1,
    };
  }
  return {
    switchLabel: 'Switch',
    canSwitch: true,
    canArchive: activeWorkspaceCount > 1,
    canDelete: workspaceCount > 1,
  };
}
