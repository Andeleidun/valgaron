import type {
  InFictionWorld,
  WorldDocument,
  WorldSectionConfig,
  WorldWorkspace,
} from './types';
import { entryDisplayCopy, formatUpdatedAt, getEntries } from './codexEntries';
import { pluralizeCountLabel } from './featureDisplayLimits';
import {
  getWorkspaceActionState,
  type WorkspaceActionState,
} from './workspaceManagement';

export const workspaceFeatureResultLimit = 40;

export const workspaceFeatureActions = {
  workspaceHelp: 'Workspace Help',
  newWorkspace: 'New Workspace',
  updateWorkspace: 'Update Workspace',
  createWorkspace: 'Create Workspace',
  edit: 'Edit',
  duplicate: 'Duplicate',
  archive: 'Archive',
  restore: 'Restore',
  deletePermanently: 'Delete Permanently',
  newWorld: 'New World',
  updateWorld: 'Update World',
  createWorld: 'Create World',
  newWorldDraft: 'New World Draft',
  createEntryType: 'Create Entry Type',
  addFields: 'Add Fields',
  moveFieldUp: 'Move Up',
  moveFieldDown: 'Move Down',
  updateFieldLabel: 'Update Label',
  removeField: 'Remove Field',
  deleteType: 'Delete Type',
} as const;

export const workspaceFeatureCopy = {
  sections: {
    workspaces: 'Project/universe workspaces',
    planetaryWorlds: 'In-fiction worlds and planets',
    customEntryTypes: 'Custom entry types',
  },
  status: {
    active: 'Active',
    unapplied: 'Unapplied',
  },
  customEntryTypes: {
    kindLabel: 'Custom codex section',
    fieldsPrefix: 'Fields',
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
  draftStatus: {
    workspace: 'Unapplied workspace draft changes.',
    planetaryWorld: 'Unapplied in-fiction world draft changes.',
    customEntryType: 'Unapplied custom type draft changes.',
  },
} as const;

export type WorkspaceFeatureQueries = {
  workspaces?: string;
  customEntryTypes?: string;
  planetaryWorlds?: string;
};

export type WorkspaceFeatureResultLimits = {
  workspaces?: number;
  customEntryTypes?: number;
  planetaryWorlds?: number;
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
  deleteAccessibilityHint: string;
};

export type CustomEntryTypeRowModel = {
  section: WorldSectionConfig;
  id: string;
  title: string;
  kindLabel: string;
  descriptionText: string;
  fieldsText: string;
  fieldsLine: string;
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
  deleteAccessibilityHint: string;
};

export type WorkspaceFeatureListModel<TRow> = {
  query: string;
  label: string;
  countLabel: string;
  placeholder: string;
  rows: TRow[];
  totalCount: number;
  hiddenCount: number;
  emptyText: string;
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

export type WorkspaceFeatureAccessibilityAction =
  | 'edit-workspace'
  | 'restore-workspace'
  | 'archive-workspace'
  | 'duplicate-workspace'
  | 'delete-workspace'
  | 'edit-planetary-world'
  | 'restore-planetary-world'
  | 'archive-planetary-world'
  | 'delete-planetary-world'
  | 'delete-custom-entry-type';

const workspaceFeatureAccessibilityTemplates: Record<
  WorkspaceFeatureAccessibilityAction,
  string
> = {
  'edit-workspace': 'Edit workspace',
  'restore-workspace': 'Restore workspace',
  'archive-workspace': 'Archive workspace',
  'duplicate-workspace': 'Duplicate workspace',
  'delete-workspace': 'Delete workspace',
  'edit-planetary-world': 'Edit in-fiction world',
  'restore-planetary-world': 'Restore in-fiction world',
  'archive-planetary-world': 'Archive in-fiction world',
  'delete-planetary-world': 'Delete in-fiction world',
  'delete-custom-entry-type': 'Delete custom entry type',
};

export function formatWorkspaceFeatureAccessibilityLabel(
  action: WorkspaceFeatureAccessibilityAction,
  name: string
): string {
  return `${workspaceFeatureAccessibilityTemplates[action]} ${name}`;
}

export function formatCustomEntryTypeFieldsLine(fieldsText: string): string {
  return `${workspaceFeatureCopy.customEntryTypes.fieldsPrefix}: ${fieldsText}`;
}

function matchesQuery(values: readonly string[], query: string): boolean {
  const normalizedQuery = query.trim().toLowerCase();
  return (
    !normalizedQuery ||
    values.some((value) => value.toLowerCase().includes(normalizedQuery))
  );
}

function createListModel<TRow>({
  emptyText,
  label,
  countUnit,
  countUnitPlural,
  placeholder,
  query,
  rows,
  limit,
}: {
  emptyText: string;
  label: string;
  countUnit: string;
  countUnitPlural?: string;
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
    countLabel: `${rows.length} ${pluralizeCountLabel(
      rows.length,
      countUnit,
      countUnitPlural
    )}`,
    placeholder,
    rows: visibleRows,
    totalCount: rows.length,
    hiddenCount,
    emptyText,
  };
}

export function getWorkspaceFeatureModel({
  activeWorld,
  document,
  queries = {},
  resultLimit = workspaceFeatureResultLimit,
  resultLimits = {},
  selectedWorkspaceId,
}: {
  activeWorld: WorldWorkspace;
  document: WorldDocument;
  queries?: WorkspaceFeatureQueries;
  resultLimit?: number;
  resultLimits?: WorkspaceFeatureResultLimits;
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
      summaryText: workspace.summary || entryDisplayCopy.emptySummary,
      updatedText: `Updated ${formatUpdatedAt(workspace.updatedAt)}`,
      isActive: workspace.id === activeWorld.id,
      actionState: getWorkspaceActionState({
        activeWorkspaceId: activeWorld.id,
        activeWorkspaceCount,
        workspace,
        workspaceCount: document.worlds.length,
      }),
      deleteAccessibilityHint: 'Deletes this workspace after confirmation.',
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
      const fieldsText =
        section.detailFields.length > 0
          ? section.detailFields.map((field) => field.label).join(', ')
          : 'No custom fields';
      return {
        section,
        id: section.id,
        title: section.title,
        kindLabel: workspaceFeatureCopy.customEntryTypes.kindLabel,
        descriptionText: section.description || 'No description yet.',
        fieldsText,
        entryCount,
        entryCountLabel: `${entryCount} ${pluralizeCountLabel(
          entryCount,
          'entry'
        )}`,
        fieldsLine: formatCustomEntryTypeFieldsLine(fieldsText),
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
      summaryText: planetaryWorld.summary || entryDisplayCopy.emptySummary,
      tagsText: `Tags: ${
        planetaryWorld.tags.length > 0
          ? planetaryWorld.tags.join(', ')
          : 'No tags'
      }`,
      deleteAccessibilityHint:
        'Deletes this in-fiction world after confirmation.',
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
      label: 'Search workspaces',
      countUnit: 'project workspace',
      placeholder: 'Name, summary, era, status, or id',
      query: workspaceQuery,
      rows: workspaceRows,
      limit: resultLimits.workspaces ?? resultLimit,
    }),
    customEntryTypes: createListModel({
      emptyText: customEntryTypeQuery.trim()
        ? 'No custom entry types match this search.'
        : 'No custom entry types yet. Create one when the built-in sections are not enough.',
      label: 'Search custom entry types',
      countUnit: 'custom type',
      placeholder: 'Title, field, description, or id',
      query: customEntryTypeQuery,
      rows: customEntryTypeRows,
      limit: resultLimits.customEntryTypes ?? resultLimit,
    }),
    planetaryWorlds: createListModel({
      emptyText: planetaryWorldQuery.trim()
        ? 'No in-fiction worlds match this search.'
        : 'No in-fiction worlds yet. Create planets, realms, moons, or other large-scale settings when they need their own workspace-level record.',
      label: 'Search in-fiction worlds',
      countUnit: 'in-fiction world',
      placeholder: 'Name, climate, terrain, tag, status, or id',
      query: planetaryWorldQuery,
      rows: planetaryWorldRows,
      limit: resultLimits.planetaryWorlds ?? resultLimit,
    }),
  };
}
