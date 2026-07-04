import type {
  InFictionWorld,
  WorldCodex,
  WorldDetailField,
  WorldDocument,
  WorldSectionConfig,
  WorldWorkspace,
} from './types';
import { worldSections } from './seedCodex';
import { getActiveWorld, updateActiveWorld } from './worldDocument';

export type WorkspaceDraft = {
  name: string;
  summary: string;
  defaultEra: string;
};

export type PlanetaryWorldDraft = {
  name: string;
  summary: string;
  classification: string;
  climate: string;
  dominantTerrain: string;
  notes: string;
  tags: string;
};

export type EntryTypeDraft = {
  title: string;
  singularTitle: string;
  description: string;
  fields: string;
};

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
  const entryTypes = cloneEntryTypes(worldSections);
  const workspace: WorldWorkspace = {
    id: uniqueId(
      `workspace-${draft.name}`,
      document.worlds.map((world) => world.id)
    ),
    name: draft.name.trim(),
    summary: draft.summary.trim(),
    defaultEra: draft.defaultEra.trim(),
    status: 'active',
    planetaryWorlds: [],
    entryTypes,
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
  const updatedAt = nowIso();
  return {
    ...document,
    worlds: document.worlds.map((world) =>
      world.id === workspaceId
        ? {
            ...world,
            name: draft.name.trim(),
            summary: draft.summary.trim(),
            defaultEra: draft.defaultEra.trim(),
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
  return workspace
    ? { ...document, activeWorldId: workspace.id, savedAt: nowIso() }
    : document;
}

export function setWorkspaceArchived(
  document: WorldDocument,
  workspaceId: string,
  archived: boolean
): WorldDocument {
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
          status: archived ? ('archived' as const) : ('active' as const),
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
  const updatedAt = nowIso();
  const planetaryWorld: InFictionWorld = {
    id:
      existingPlanetaryWorld?.id ??
      uniqueId(
        `planetary-world-${draft.name}`,
        workspace.planetaryWorlds.map((world) => world.id)
      ),
    name: draft.name.trim(),
    summary: draft.summary.trim(),
    classification: draft.classification.trim(),
    climate: draft.climate.trim(),
    dominantTerrain: draft.dominantTerrain.trim(),
    notes: draft.notes.trim(),
    tags: parseTags(draft.tags),
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
  const updatedAt = nowIso();
  return {
    ...workspace,
    planetaryWorlds: workspace.planetaryWorlds.map((planetaryWorld) =>
      planetaryWorld.id === planetaryWorldId
        ? {
            ...planetaryWorld,
            status: archived ? 'archived' : 'draft',
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
  const fields = draft.fields
    .split(',')
    .map((label) => label.trim())
    .filter(Boolean)
    .reduce<WorldDetailField[]>((detailFields, label) => {
      const key = uniqueId(
        slugIdentifier(label, 'field'),
        detailFields.map((field) => field.key)
      );
      return [...detailFields, { key, label }];
    }, []);
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
