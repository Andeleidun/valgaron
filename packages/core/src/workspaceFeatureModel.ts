import type {
  InFictionWorld,
  WorldDocument,
  WorldSectionConfig,
  WorldWorkspace,
} from './types';
import { formatUpdatedAt, getEntries } from './codexEntries';
import {
  getWorkspaceActionState,
  type WorkspaceActionState,
} from './workspaceManagement';

export const workspaceFeatureResultLimit = 40;

export const workspaceFeatureActions = {
  workspaceHelp: 'Workspace Help',
  newWorkspace: 'New Workspace',
  saveWorkspace: 'Save Workspace',
  createWorkspace: 'Create Workspace',
  edit: 'Edit',
  duplicate: 'Duplicate',
  archive: 'Archive',
  restore: 'Restore',
  deletePermanently: 'Delete Permanently',
  newWorld: 'New World',
  saveWorld: 'Save World',
  createWorld: 'Create World',
  newWorldDraft: 'New World Draft',
  createEntryType: 'Create Entry Type',
  deleteType: 'Delete Type',
} as const;

export const workspaceFeatureCopy = {
  sections: {
    workspaces: 'Project/universe workspaces',
    planetaryWorlds: 'In-fiction worlds and planets',
    customEntryTypes: 'Custom entry types',
  },
  forms: {
    editWorkspace: 'Edit workspace',
    newWorkspace: 'New workspace metadata',
    createWorkspace: 'Create project/universe',
    editWorld: 'Edit world',
    newWorld: 'New world',
    createWorld: 'Create in-fiction world',
    newCustomSection: 'New custom section',
    createEntryType: 'Create entry type',
  },
} as const;

export type WorkspaceFeatureQueries = {
  workspaces?: string;
  customEntryTypes?: string;
  planetaryWorlds?: string;
};

export type WorkspaceRowModel = {
  workspace: WorldWorkspace;
  id: string;
  name: string;
  kindLabel: string;
  statusLine: string;
  summaryText: string;
  updatedText: string;
  isActive: boolean;
  actionState: WorkspaceActionState;
};

export type CustomEntryTypeRowModel = {
  section: WorldSectionConfig;
  id: string;
  title: string;
  descriptionText: string;
  fieldsText: string;
  entryCount: number;
  entryCountLabel: string;
};

export type PlanetaryWorldRowModel = {
  planetaryWorld: InFictionWorld;
  id: string;
  name: string;
  kindLabel: string;
  statusLine: string;
  classificationLabel: string;
  climateText: string;
  terrainText: string;
  summaryText: string;
  tagsText: string;
};

export type WorkspaceFeatureListModel<TRow> = {
  query: string;
  label: string;
  placeholder: string;
  rows: TRow[];
  totalCount: number;
  hiddenCount: number;
  emptyText: string;
  hiddenText: string;
};

export type WorkspaceFeatureModel = {
  activeWorkspaceCount: number;
  selectedWorkspace: WorldWorkspace | null;
  selectedWorkspaceActionState: WorkspaceActionState | null;
  workspaces: WorkspaceFeatureListModel<WorkspaceRowModel>;
  customEntryTypes: WorkspaceFeatureListModel<CustomEntryTypeRowModel>;
  planetaryWorlds: WorkspaceFeatureListModel<PlanetaryWorldRowModel>;
};

export function getWorkspaceFormTitle(workspaceName?: string): string {
  return workspaceName ?? workspaceFeatureCopy.forms.createWorkspace;
}

export function getWorkspaceFormKicker(workspaceName?: string): string {
  return workspaceName
    ? workspaceFeatureCopy.forms.editWorkspace
    : workspaceFeatureCopy.forms.newWorkspace;
}

export function getPlanetaryWorldFormTitle(worldName?: string): string {
  return worldName ?? workspaceFeatureCopy.forms.createWorld;
}

export function getPlanetaryWorldFormKicker(worldName?: string): string {
  return worldName
    ? workspaceFeatureCopy.forms.editWorld
    : workspaceFeatureCopy.forms.newWorld;
}

function matchesQuery(values: readonly string[], query: string): boolean {
  const normalizedQuery = query.trim().toLowerCase();
  return (
    !normalizedQuery ||
    values.some((value) => value.toLowerCase().includes(normalizedQuery))
  );
}

function pluralize(count: number, singular: string, plural = `${singular}s`) {
  return count === 1 ? singular : plural;
}

function createListModel<TRow>({
  emptyText,
  hiddenUnit,
  hiddenTextLabel,
  label,
  placeholder,
  query,
  rows,
  limit,
}: {
  emptyText: string;
  hiddenUnit: string;
  hiddenTextLabel: string;
  label: string;
  placeholder: string;
  query: string;
  rows: TRow[];
  limit: number;
}): WorkspaceFeatureListModel<TRow> {
  const visibleRows = rows.slice(0, limit);
  const hiddenCount = Math.max(0, rows.length - visibleRows.length);
  return {
    query,
    label,
    placeholder,
    rows: visibleRows,
    totalCount: rows.length,
    hiddenCount,
    emptyText,
    hiddenText:
      hiddenCount > 0
        ? `Refine ${hiddenTextLabel} to show ${hiddenCount} more ${pluralize(
            hiddenCount,
            hiddenUnit
          )}.`
        : '',
  };
}

export function getWorkspaceFeatureModel({
  activeWorld,
  document,
  queries = {},
  resultLimit = workspaceFeatureResultLimit,
  selectedWorkspaceId,
}: {
  activeWorld: WorldWorkspace;
  document: WorldDocument;
  queries?: WorkspaceFeatureQueries;
  resultLimit?: number;
  selectedWorkspaceId?: string | null;
}): WorkspaceFeatureModel {
  const activeWorkspaceCount = document.worlds.filter(
    (workspace) => workspace.status !== 'archived'
  ).length;
  const selectedWorkspace =
    selectedWorkspaceId === null || selectedWorkspaceId === undefined
      ? null
      : document.worlds.find(
          (workspace) => workspace.id === selectedWorkspaceId
        ) ?? null;
  const workspaceQuery = queries.workspaces ?? '';
  const customEntryTypeQuery = queries.customEntryTypes ?? '';
  const planetaryWorldQuery = queries.planetaryWorlds ?? '';

  const workspaceRows = document.worlds
    .filter((workspace) =>
      matchesQuery(
        [
          workspace.id,
          workspace.name,
          workspace.summary,
          workspace.defaultEra,
          workspace.status,
        ],
        workspaceQuery
      )
    )
    .map((workspace) => ({
      workspace,
      id: workspace.id,
      name: workspace.name,
      kindLabel:
        workspace.status === 'archived'
          ? 'Archived workspace'
          : 'Project/universe workspace',
      statusLine: `${workspace.status} - ${
        workspace.defaultEra || 'No default era'
      }`,
      summaryText: workspace.summary || 'No summary yet.',
      updatedText: `Updated ${formatUpdatedAt(workspace.updatedAt)}`,
      isActive: workspace.id === activeWorld.id,
      actionState: getWorkspaceActionState({
        activeWorkspaceId: activeWorld.id,
        activeWorkspaceCount,
        workspace,
        workspaceCount: document.worlds.length,
      }),
    }));

  const customEntryTypeRows = activeWorld.entryTypes
    .filter((section) => section.custom)
    .filter((section) =>
      matchesQuery(
        [
          section.id,
          section.title,
          section.singularTitle,
          section.description,
          ...section.detailFields.flatMap((field) => [field.key, field.label]),
        ],
        customEntryTypeQuery
      )
    )
    .map((section) => {
      const entryCount = getEntries(activeWorld.codex, section.id).length;
      return {
        section,
        id: section.id,
        title: section.title,
        descriptionText: section.description || 'No description yet.',
        fieldsText:
          section.detailFields.length > 0
            ? section.detailFields.map((field) => field.label).join(', ')
            : 'No custom fields',
        entryCount,
        entryCountLabel: `${entryCount} ${pluralize(entryCount, 'entry')}`,
      };
    });

  const planetaryWorldRows = activeWorld.planetaryWorlds
    .filter((planetaryWorld) =>
      matchesQuery(
        [
          planetaryWorld.id,
          planetaryWorld.name,
          planetaryWorld.summary,
          planetaryWorld.classification,
          planetaryWorld.climate,
          planetaryWorld.dominantTerrain,
          planetaryWorld.notes,
          planetaryWorld.status,
          ...planetaryWorld.tags,
        ],
        planetaryWorldQuery
      )
    )
    .map((planetaryWorld) => ({
      planetaryWorld,
      id: planetaryWorld.id,
      name: planetaryWorld.name,
      kindLabel:
        planetaryWorld.status === 'archived'
          ? 'Archived in-fiction world'
          : 'In-fiction world',
      statusLine: `${planetaryWorld.status} - ${
        planetaryWorld.classification || 'Unclassified'
      }`,
      classificationLabel: planetaryWorld.classification || 'Unclassified',
      climateText: `Climate: ${planetaryWorld.climate || 'Not set'}`,
      terrainText: `Terrain: ${planetaryWorld.dominantTerrain || 'Not set'}`,
      summaryText: planetaryWorld.summary || 'No summary yet.',
      tagsText: `Tags: ${
        planetaryWorld.tags.length > 0
          ? planetaryWorld.tags.join(', ')
          : 'No tags'
      }`,
    }));

  return {
    activeWorkspaceCount,
    selectedWorkspace,
    selectedWorkspaceActionState: selectedWorkspace
      ? getWorkspaceActionState({
          activeWorkspaceId: activeWorld.id,
          activeWorkspaceCount,
          workspace: selectedWorkspace,
          workspaceCount: document.worlds.length,
        })
      : null,
    workspaces: createListModel({
      emptyText: workspaceQuery.trim()
        ? 'No workspaces match this search.'
        : 'No workspaces yet.',
      hiddenUnit: 'workspace',
      hiddenTextLabel: 'workspace search',
      label: 'Search workspaces',
      placeholder: 'Name, summary, era, status, or id',
      query: workspaceQuery,
      rows: workspaceRows,
      limit: resultLimit,
    }),
    customEntryTypes: createListModel({
      emptyText: customEntryTypeQuery.trim()
        ? 'No custom entry types match this search.'
        : 'No custom entry types yet. Create one when the built-in sections are not enough.',
      hiddenUnit: 'type',
      hiddenTextLabel: 'custom type search',
      label: 'Search custom entry types',
      placeholder: 'Title, field, description, or id',
      query: customEntryTypeQuery,
      rows: customEntryTypeRows,
      limit: resultLimit,
    }),
    planetaryWorlds: createListModel({
      emptyText: planetaryWorldQuery.trim()
        ? 'No in-fiction worlds match this search.'
        : 'No in-fiction worlds yet. Create planets, realms, moons, or other large-scale settings when they need their own workspace-level record.',
      hiddenUnit: 'world',
      hiddenTextLabel: 'in-fiction world search',
      label: 'Search in-fiction worlds',
      placeholder: 'Name, climate, terrain, tag, status, or id',
      query: planetaryWorldQuery,
      rows: planetaryWorldRows,
      limit: resultLimit,
    }),
  };
}
