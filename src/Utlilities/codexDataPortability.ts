import type { WorldDocument, WorldEntry, WorldWorkspace } from '../types';
import { getEntries } from './codexEntries';
import {
  CURRENT_WORLD_SCHEMA_VERSION,
  getActiveWorld,
  parseWorldDocument,
} from './worldDocument';

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
  exportedBy: 'Valgaron World Codex';
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
    exportedBy: 'Valgaron World Codex',
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

function planetaryWorldToMarkdown(world: WorldWorkspace): string {
  if (world.planetaryWorlds.length === 0) {
    return 'No in-fiction worlds or planets.';
  }
  return world.planetaryWorlds
    .map((planetaryWorld) =>
      [
        `### ${planetaryWorld.name}`,
        '',
        planetaryWorld.summary || 'No summary.',
        '',
        `- Classification: ${planetaryWorld.classification || 'None'}`,
        `- Climate: ${planetaryWorld.climate || 'None'}`,
        `- Dominant terrain: ${planetaryWorld.dominantTerrain || 'None'}`,
        `- Status: ${planetaryWorld.status}`,
        `- Tags: ${planetaryWorld.tags.join(', ') || 'None'}`,
        planetaryWorld.notes ? `\n#### Notes\n\n${planetaryWorld.notes}` : '',
      ]
        .filter(Boolean)
        .join('\n')
    )
    .join('\n\n');
}

/** Export a single world as readable Markdown for drafting reference. */
export function exportWorldToMarkdown(world: WorldWorkspace): string {
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
      `${relationship.sourceEntryId} ${relationship.type} ${
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
    '## In-Fiction Worlds And Planets',
    '',
    planetaryWorldToMarkdown(world),
    '',
    ...sections,
    '',
    '## Relationships',
    '',
    markdownList(relationships),
    '',
  ].join('\n');
}
