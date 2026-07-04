import type { WorldDocument, WorldEntry, WorldWorkspace } from './types';
import { formatUpdatedAt, getEntries } from './codexEntries';
import { valgaronProduct } from './shell';
import {
  CURRENT_WORLD_SCHEMA_VERSION,
  getActiveWorld,
  parseWorldDocument,
} from './worldDocument';

export type CodexExportMode =
  | 'full-json'
  | 'active-json'
  | 'markdown'
  | 'diagnostics';

export type CodexExportOption = {
  mode: CodexExportMode;
  label: string;
  kicker: string;
  heading: string;
  description: string;
  downloadLabel: string;
  filename: string | 'active-workspace-json' | 'active-workspace-markdown';
  shareTitle: string;
  textAreaLabel: string;
};

export type WorldImportPreview = {
  activeWorldName: string;
  worldCount: number;
  planetaryWorldCount: number;
  entryCount: number;
  relationshipCount: number;
  savedAt: string;
};

export type WorldBackupMetadata = {
  exportedAt: string;
  exportedBy: typeof valgaronProduct.fullTitle;
  backupSummary: WorldImportPreview;
};

export type WorldBackupFile = WorldDocument & WorldBackupMetadata;

export type WorldImportResult =
  | {
      ok: true;
      document: WorldDocument;
      preview: WorldImportPreview;
    }
  | {
      ok: false;
      error: string;
    };

export type WorldImportPreviewText = {
  title: string;
  detail: string;
};

export const codexExportOptions: readonly CodexExportOption[] = [
  {
    mode: 'full-json',
    label: 'Full JSON',
    kicker: 'All-workspaces backup',
    heading: 'Full document JSON',
    description:
      'This backup contains every project/universe workspace, custom entry type, entry, and relationship in this local document.',
    downloadLabel: 'Download All JSON',
    filename: 'valgaron-all-workspaces.json',
    shareTitle: `${valgaronProduct.name} full JSON backup`,
    textAreaLabel: 'All workspaces JSON backup',
  },
  {
    mode: 'active-json',
    label: 'Active JSON',
    kicker: 'Active workspace backup',
    heading: 'Active workspace JSON',
    description:
      'This backup contains the current project/universe workspace only. Use full document JSON when you need every workspace in this browser profile or device.',
    downloadLabel: 'Download Active JSON',
    filename: 'active-workspace-json',
    shareTitle: `${valgaronProduct.name} active workspace JSON backup`,
    textAreaLabel: 'Active workspace JSON backup',
  },
  {
    mode: 'markdown',
    label: 'Markdown',
    kicker: 'Drafting reference',
    heading: 'Markdown export',
    description:
      'Markdown is a readable drafting reference for the active workspace, not a restore file.',
    downloadLabel: 'Download Markdown',
    filename: 'active-workspace-markdown',
    shareTitle: `${valgaronProduct.name} Markdown reference`,
    textAreaLabel: 'Markdown world export',
  },
  {
    mode: 'diagnostics',
    label: 'Diagnostics',
    kicker: 'Local-only report',
    heading: 'Diagnostics',
    description:
      'Diagnostics include app version, schema version, storage target, recovery state, platform runtime context, and counts. They exclude world names, entry names, notes, summaries, tags, and ids by default.',
    downloadLabel: 'Download Diagnostics',
    filename: 'valgaron-diagnostics.json',
    shareTitle: `${valgaronProduct.name} diagnostics`,
    textAreaLabel: 'Local diagnostics JSON',
  },
] as const;

export function getCodexExportOption(mode: CodexExportMode): CodexExportOption {
  return codexExportOptions.find((option) => option.mode === mode)!;
}

export function getCodexExportFilename(
  mode: CodexExportMode,
  activeWorkspaceFilenameBase: string
): string {
  const filename = getCodexExportOption(mode).filename;
  if (filename === 'active-workspace-json') {
    return `${activeWorkspaceFilenameBase}.json`;
  }
  if (filename === 'active-workspace-markdown') {
    return `${activeWorkspaceFilenameBase}.md`;
  }
  return filename;
}

function findDuplicate(values: readonly string[]): string | null {
  const seenValues = new Set<string>();
  for (const value of values) {
    if (seenValues.has(value)) {
      return value;
    }
    seenValues.add(value);
  }
  return null;
}

function validateWorldDocumentForImport(
  document: WorldDocument
): string | null {
  const duplicateWorldId = findDuplicate(
    document.worlds.map((world) => world.id)
  );
  if (duplicateWorldId) {
    return `Import contains duplicate world id "${duplicateWorldId}".`;
  }
  for (const world of document.worlds) {
    const duplicateSectionId = findDuplicate(
      world.entryTypes.map((section) => section.id)
    );
    if (duplicateSectionId) {
      return `Import contains duplicate section id "${duplicateSectionId}".`;
    }
    const entryIds = world.entryTypes.flatMap((section) =>
      getEntries(world.codex, section.id).map((entry) => entry.id)
    );
    const duplicatePlanetaryWorldId = findDuplicate(
      world.planetaryWorlds.map((planetaryWorld) => planetaryWorld.id)
    );
    if (duplicatePlanetaryWorldId) {
      return `Import contains duplicate in-fiction world id "${duplicatePlanetaryWorldId}".`;
    }
    const duplicateEntryId = findDuplicate(entryIds);
    if (duplicateEntryId) {
      return `Import contains duplicate entry id "${duplicateEntryId}".`;
    }
    const relationshipIds = world.relationships.map(
      (relationship) => relationship.id
    );
    const duplicateRelationshipId = findDuplicate(relationshipIds);
    if (duplicateRelationshipId) {
      return `Import contains duplicate relationship id "${duplicateRelationshipId}".`;
    }
    const entryIdSet = new Set(entryIds);
    const orphanedRelationship = world.relationships.find(
      (relationship) =>
        !entryIdSet.has(relationship.sourceEntryId) ||
        !entryIdSet.has(relationship.targetEntryId)
    );
    if (orphanedRelationship) {
      return `Import contains orphaned relationship "${orphanedRelationship.id}".`;
    }
  }
  return null;
}

/** Create a single-world backup document from the active world. */
export function createActiveWorldBackup(
  document: WorldDocument
): WorldDocument {
  const activeWorld = getActiveWorld(document);
  return {
    schemaVersion: CURRENT_WORLD_SCHEMA_VERSION,
    activeWorldId: activeWorld.id,
    worlds: [activeWorld],
    savedAt: document.savedAt,
  };
}

/** Serialize the active world into one formatted JSON backup file. */
export function serializeActiveWorldBackup(document: WorldDocument): string {
  const backup = createActiveWorldBackup(document);
  return serializeWorldDocumentBackup(backup);
}

/** Serialize the full local document into one formatted JSON backup file. */
export function serializeWorldDocumentBackup(document: WorldDocument): string {
  const backupFile: WorldBackupFile = {
    ...document,
    exportedAt: new Date().toISOString(),
    exportedBy: valgaronProduct.fullTitle,
    backupSummary: summarizeWorldDocument(document),
  };
  return `${JSON.stringify(backupFile, null, 2)}\n`;
}

/** Build a count preview for a valid import document. */
export function summarizeWorldDocument(
  document: WorldDocument
): WorldImportPreview {
  const activeWorld = getActiveWorld(document);
  return {
    activeWorldName: activeWorld.name,
    worldCount: document.worlds.length,
    planetaryWorldCount: document.worlds.reduce(
      (total, world) => total + world.planetaryWorlds.length,
      0
    ),
    entryCount: document.worlds.reduce(
      (total, world) =>
        total +
        world.entryTypes.reduce(
          (entryTotal, section) =>
            entryTotal + getEntries(world.codex, section.id).length,
          0
        ),
      0
    ),
    relationshipCount: document.worlds.reduce(
      (total, world) => total + world.relationships.length,
      0
    ),
    savedAt: document.savedAt,
  };
}

/** Format an import preview consistently across local web and native surfaces. */
export function formatWorldImportPreviewText(
  preview: WorldImportPreview
): WorldImportPreviewText {
  return {
    title: preview.activeWorldName,
    detail: `${preview.worldCount} workspace(s), ${
      preview.entryCount
    } entries, ${
      preview.relationshipCount
    } relationships. Saved ${formatUpdatedAt(preview.savedAt)}.`,
  };
}

/** Parse pasted or loaded JSON into a validated world document preview. */
export function parseWorldImport(text: string): WorldImportResult {
  if (!text.trim()) {
    return { ok: false, error: 'Paste a world backup JSON file first.' };
  }
  try {
    const parsedValue: unknown = JSON.parse(text);
    const document = parseWorldDocument(parsedValue);
    if (!document) {
      return {
        ok: false,
        error: 'This JSON is not a valid Valgaron World Codex backup.',
      };
    }
    const validationError = validateWorldDocumentForImport(document);
    if (validationError) {
      return {
        ok: false,
        error: validationError,
      };
    }
    return {
      ok: true,
      document,
      preview: summarizeWorldDocument(document),
    };
  } catch {
    return { ok: false, error: 'This is not valid JSON.' };
  }
}

function markdownList(items: readonly string[]): string {
  return items.length > 0 ? items.map((item) => `- ${item}`).join('\n') : '-';
}

function entryToMarkdown(entry: WorldEntry): string {
  const details = Object.entries(entry.fields)
    .filter(([, value]) => value.trim())
    .map(([key, value]) => `- ${key}: ${value}`)
    .join('\n');
  return [
    `### ${entry.name}`,
    '',
    entry.summary || 'No summary.',
    '',
    `- Status: ${entry.status}`,
    `- Tags: ${entry.tags.join(', ') || 'None'}`,
    details,
    entry.notes ? `\n#### Notes\n\n${entry.notes}` : '',
  ]
    .filter(Boolean)
    .join('\n');
}

function getRelationshipEntryNameById(
  world: WorldWorkspace
): Map<string, string> {
  return new Map(
    world.entryTypes.flatMap((section) =>
      getEntries(world.codex, section.id).map((entry) => [entry.id, entry.name])
    )
  );
}

/** Export a single world as readable Markdown for drafting reference. */
export function exportWorldToMarkdown(world: WorldWorkspace): string {
  const entryNameById = getRelationshipEntryNameById(world);
  const sections = world.entryTypes.map((section) => {
    const entries = getEntries(world.codex, section.id);
    return [
      `## ${section.title}`,
      '',
      section.description,
      '',
      entries.length > 0
        ? entries.map((entry) => entryToMarkdown(entry)).join('\n\n')
        : 'No entries.',
    ].join('\n');
  });
  const relationships = world.relationships.map(
    (relationship) =>
      `${
        entryNameById.get(relationship.sourceEntryId) ??
        relationship.sourceEntryId
      } ${relationship.type} ${
        entryNameById.get(relationship.targetEntryId) ??
        relationship.targetEntryId
      }${relationship.note ? `: ${relationship.note}` : ''}`
  );
  return [
    `# ${world.name}`,
    '',
    world.summary,
    '',
    `- Default era: ${world.defaultEra || 'None'}`,
    `- Updated: ${world.updatedAt}`,
    '',
    ...sections,
    '',
    '## Relationships',
    '',
    markdownList(relationships),
    '',
  ].join('\n');
}
