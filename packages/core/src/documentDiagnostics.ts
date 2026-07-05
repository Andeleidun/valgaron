import type { WorldDocument, WorldWorkspace } from './types';
import { getEntries } from './codexEntries';
import { valgaronProduct } from './shell';
import { CURRENT_WORLD_SCHEMA_VERSION, getActiveWorld } from './worldDocument';

export type WorldDocumentDiagnostics = {
  schemaVersion: WorldDocument['schemaVersion'];
  savedAt: string;
  workspaceCount: number;
  activeWorkspaceStatus: WorldWorkspace['status'];
  entryTypeCount: number;
  customEntryTypeCount: number;
  activeWorkspaceEntryCount: number;
  totalEntryCount: number;
  relationshipCount: number;
  inFictionWorldCount: number;
  archivedWorkspaceCount: number;
  archivedEntryCount: number;
  archivedInFictionWorldCount: number;
};

export type WorldDocumentDiagnosticsReport = {
  app: {
    name: string;
    schemaVersion: number;
  };
  runtime: {
    generatedAt: string;
    storageTarget: string;
    route?: string;
    userAgent?: string;
    loadState?: string;
    loadCheckedAt?: string;
    loadMessage?: string;
    loadIssueCount?: number;
    saveState?: string;
    recoverySnapshotAvailable?: boolean;
    recoverySnapshotCount?: number;
    recoverySnapshotState?: string;
    recoverySnapshotReason?: string;
    recoverySnapshotCreatedAt?: string;
    runtimeErrorName?: string;
  };
  document: WorldDocumentDiagnostics;
  contentPolicy: {
    includesWorldContent: false;
    omittedFields: readonly string[];
  };
};

export type WorldDocumentDiagnosticsRuntime = Partial<
  Omit<
    WorldDocumentDiagnosticsReport['runtime'],
    'generatedAt' | 'storageTarget'
  >
>;

export const contentSafeDiagnosticOmittedFields = [
  'workspace names',
  'entry names',
  'summaries',
  'notes',
  'tags',
  'relationship notes',
  'entry ids',
  'relationship ids',
] as const;

export function sanitizeDiagnosticsRoute(route: string): string {
  const [path, search = ''] = route.split('?');
  if (!search) {
    return path;
  }
  const keys = new URLSearchParams(search);
  const sanitizedSearch = Array.from(keys.keys())
    .map((key) => `${encodeURIComponent(key)}=redacted`)
    .join('&');
  return sanitizedSearch ? `${path}?${sanitizedSearch}` : path;
}

export function getWorldDocumentDiagnostics(
  document: WorldDocument,
  activeWorkspace: WorldWorkspace = getActiveWorld(document)
): WorldDocumentDiagnostics {
  return {
    schemaVersion: document.schemaVersion,
    savedAt: document.savedAt,
    workspaceCount: document.worlds.length,
    activeWorkspaceStatus: activeWorkspace.status,
    entryTypeCount: activeWorkspace.entryTypes.length,
    customEntryTypeCount: activeWorkspace.entryTypes.filter(
      (entryType) => entryType.custom
    ).length,
    activeWorkspaceEntryCount: countWorkspaceEntries(activeWorkspace),
    totalEntryCount: document.worlds.reduce(
      (total, world) => total + countWorkspaceEntries(world),
      0
    ),
    relationshipCount: document.worlds.reduce(
      (total, world) => total + world.relationships.length,
      0
    ),
    inFictionWorldCount: document.worlds.reduce(
      (total, world) => total + world.planetaryWorlds.length,
      0
    ),
    archivedWorkspaceCount: document.worlds.filter(
      (world) => world.status === 'archived'
    ).length,
    archivedEntryCount: document.worlds.reduce(
      (total, world) => total + countArchivedEntries(world),
      0
    ),
    archivedInFictionWorldCount: document.worlds.reduce(
      (total, world) =>
        total +
        world.planetaryWorlds.filter(
          (planetaryWorld) => planetaryWorld.status === 'archived'
        ).length,
      0
    ),
  };
}

export function createWorldDocumentDiagnosticsReport({
  document,
  generatedAt = new Date().toISOString(),
  runtime = {},
  storageTarget,
}: {
  document: WorldDocument;
  generatedAt?: string;
  runtime?: WorldDocumentDiagnosticsRuntime;
  storageTarget: string;
}): WorldDocumentDiagnosticsReport {
  return {
    app: {
      name: valgaronProduct.fullTitle,
      schemaVersion: CURRENT_WORLD_SCHEMA_VERSION,
    },
    runtime: {
      generatedAt,
      storageTarget,
      ...runtime,
    },
    document: getWorldDocumentDiagnostics(document),
    contentPolicy: {
      includesWorldContent: false,
      omittedFields: contentSafeDiagnosticOmittedFields,
    },
  };
}

export function serializeWorldDocumentDiagnosticsReport(
  report: WorldDocumentDiagnosticsReport
): string {
  return `${JSON.stringify(report, null, 2)}\n`;
}

function countWorkspaceEntries(world: WorldWorkspace): number {
  return world.entryTypes.reduce(
    (total, section) => total + getEntries(world.codex, section.id).length,
    0
  );
}

function countArchivedEntries(world: WorldWorkspace): number {
  return world.entryTypes.reduce(
    (total, section) =>
      total +
      getEntries(world.codex, section.id).filter(
        (entry) => entry.status === 'archived'
      ).length,
    0
  );
}
