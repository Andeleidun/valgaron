import type { WorldDocument, WorldWorkspace } from '../types';
import { getEntries } from './codexEntries';
import { APP_NAME, APP_VERSION } from './appMetadata';
import { CURRENT_WORLD_SCHEMA_VERSION, getActiveWorld } from './worldDocument';
import type { WorldDocumentLoadStatus } from './codexStorage';
import type {
  RecoverySnapshotStatus,
  WorldDocumentSaveStatus,
} from './useWorldDocumentState';

export type LocalDiagnosticMessage = {
  level: 'info' | 'warning' | 'error';
  source: string;
  message: string;
  occurredAt: string;
};

export type LocalDiagnosticsInput = {
  document: WorldDocument;
  activeWorld?: WorldWorkspace;
  route: string;
  userAgent: string;
  loadStatus: WorldDocumentLoadStatus;
  saveStatus: WorldDocumentSaveStatus;
  recoverySnapshotStatus: RecoverySnapshotStatus;
  recoverySnapshotCount: number;
  recentMessages?: readonly LocalDiagnosticMessage[];
};

export type LocalDiagnosticsReport = {
  app: {
    name: string;
    version: string;
    schemaVersion: number;
  };
  runtime: {
    route: string;
    userAgent: string;
    generatedAt: string;
  };
  storage: {
    loadState: WorldDocumentLoadStatus['state'];
    loadSource: WorldDocumentLoadStatus['source'];
    loadMessage: string;
    loadIssueCount: number;
    loadIssues: readonly string[];
    saveState: WorldDocumentSaveStatus['state'];
    lastSaveAttemptAt: string;
    recoverySnapshotState: RecoverySnapshotStatus['state'];
    recoverySnapshotMessage: string;
    recoverySnapshotCount: number;
  };
  document: {
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
  recentMessages: readonly LocalDiagnosticMessage[];
  contentPolicy: {
    includesWorldContent: false;
    omittedFields: readonly string[];
  };
};

const contentFieldOmissions = [
  'workspace names',
  'entry names',
  'summaries',
  'notes',
  'tags',
  'relationship notes',
  'entry ids',
  'relationship ids',
] as const;

/** Build a local-only diagnostics report that excludes user-authored content. */
export function createLocalDiagnosticsReport(
  input: LocalDiagnosticsInput
): LocalDiagnosticsReport {
  const activeWorld = input.activeWorld ?? getActiveWorld(input.document);
  const activeWorkspaceEntryCount = countWorkspaceEntries(activeWorld);
  return {
    app: {
      name: APP_NAME,
      version: APP_VERSION,
      schemaVersion: CURRENT_WORLD_SCHEMA_VERSION,
    },
    runtime: {
      route: input.route,
      userAgent: input.userAgent,
      generatedAt: new Date().toISOString(),
    },
    storage: {
      loadState: input.loadStatus.state,
      loadSource: input.loadStatus.source,
      loadMessage: input.loadStatus.message,
      loadIssueCount: input.loadStatus.issues.length,
      loadIssues: input.loadStatus.issues,
      saveState: input.saveStatus.state,
      lastSaveAttemptAt: input.saveStatus.savedAt,
      recoverySnapshotState: input.recoverySnapshotStatus.state,
      recoverySnapshotMessage: input.recoverySnapshotStatus.message,
      recoverySnapshotCount: input.recoverySnapshotCount,
    },
    document: {
      workspaceCount: input.document.worlds.length,
      activeWorkspaceStatus: activeWorld.status,
      entryTypeCount: activeWorld.entryTypes.length,
      customEntryTypeCount: activeWorld.entryTypes.filter(
        (entryType) => entryType.custom
      ).length,
      activeWorkspaceEntryCount,
      totalEntryCount: input.document.worlds.reduce(
        (total, world) => total + countWorkspaceEntries(world),
        0
      ),
      relationshipCount: input.document.worlds.reduce(
        (total, world) => total + world.relationships.length,
        0
      ),
      inFictionWorldCount: input.document.worlds.reduce(
        (total, world) => total + world.planetaryWorlds.length,
        0
      ),
      archivedWorkspaceCount: input.document.worlds.filter(
        (world) => world.status === 'archived'
      ).length,
      archivedEntryCount: input.document.worlds.reduce(
        (total, world) => total + countArchivedEntries(world),
        0
      ),
      archivedInFictionWorldCount: input.document.worlds.reduce(
        (total, world) =>
          total +
          world.planetaryWorlds.filter(
            (planetaryWorld) => planetaryWorld.status === 'archived'
          ).length,
        0
      ),
    },
    recentMessages: input.recentMessages ?? [],
    contentPolicy: {
      includesWorldContent: false,
      omittedFields: contentFieldOmissions,
    },
  };
}

/** Serialize diagnostics as formatted JSON for download or copy/paste. */
export function serializeLocalDiagnosticsReport(
  report: LocalDiagnosticsReport
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
