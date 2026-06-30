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
  entryCount: number;
  relationshipCount: number;
  savedAt: string;
};

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
  return `${JSON.stringify(createActiveWorldBackup(document), null, 2)}\n`;
}

/** Build a count preview for a valid import document. */
export function summarizeWorldDocument(
  document: WorldDocument
): WorldImportPreview {
  const activeWorld = getActiveWorld(document);
  return {
    activeWorldName: activeWorld.name,
    worldCount: document.worlds.length,
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
        error: 'This JSON is not a valid Valgaron world backup.',
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
    ...sections,
    '',
    '## Relationships',
    '',
    markdownList(relationships),
    '',
  ].join('\n');
}
