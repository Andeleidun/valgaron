import {
  codexShellRoutes,
  formatCodexRouteSearch,
  localPersistenceCopy,
} from './shell';

export type CodexHelpFocusId =
  | 'start'
  | 'entries'
  | 'relationships'
  | 'timeline'
  | 'workspaces'
  | 'data'
  | 'support'
  | 'limits';

export type CodexHelpTopic = {
  title: string;
  items: readonly string[];
};

export type CodexHelpDetail = {
  term: string;
  detail: string;
};

export type CodexHelpFocus = {
  id: CodexHelpFocusId;
  title: string;
  detail: string;
};

export const codexHelpFocusTopics: readonly CodexHelpFocus[] = [
  {
    id: 'start',
    title: 'Start with one workspace',
    detail:
      'Use the starter workspace as a reference, then rename, duplicate, or create a project workspace before drafting real setting records.',
  },
  {
    id: 'entries',
    title: 'Entries',
    detail:
      'Create, search, edit, archive, duplicate, and delete codex records from the Entries workflow.',
  },
  {
    id: 'relationships',
    title: 'Relationships',
    detail:
      'Use links to connect records, repair broken references, inspect graph context, and keep world logic navigable.',
  },
  {
    id: 'timeline',
    title: 'Timeline',
    detail:
      'Use explicit order, eras, involved-record filters, and relationship links to browse chronology without forcing exact dates.',
  },
  {
    id: 'workspaces',
    title: 'Workspaces',
    detail:
      'Keep project or universe workspaces separate from codex places, and manage custom entry types when the built-in sections are not enough.',
  },
  {
    id: 'data',
    title: 'Backups and recovery',
    detail:
      'Use JSON export as the portable backup, import only validated backups, and treat recovery snapshots as local undo points.',
  },
  {
    id: 'support',
    title: 'Support',
    detail:
      'Use diagnostics for storage or rendering reports without including world names, notes, summaries, tags, relationship notes, or ids.',
  },
  {
    id: 'limits',
    title: 'Release limits',
    detail:
      'This local prototype intentionally excludes accounts, remote sync, collaboration, publishing, AI generation, payments, and localization.',
  },
];

export const codexWorkflowHelpTopics: readonly CodexHelpTopic[] = [
  {
    title: 'Build the codex',
    items: [
      'Use Overview to scan recent, pinned, incomplete, and quick-create records.',
      'Use entry sections to create and edit characters, places, factions, lore, timeline events, and custom entry types.',
      'Use Places for worlds, planets, moons, settlements, terrain, realms, and other map-scale places inside a project.',
    ],
  },
  {
    title: 'Connect records',
    items: [
      'Use Relationships to link entries and inspect graph-style connections.',
      'Use Timeline order controls to arrange events while keeping flexible prose dates and eras.',
      'Use tags, status, pinned records, and completeness prompts to keep unfinished work visible.',
    ],
  },
  {
    title: 'Protect local work',
    items: [
      'On web, use the header Save button before relying on browser-local changes later; on mobile, confirm the latest device-save status before closing the app.',
      'Export JSON backups regularly; active-workspace JSON is focused and full-document JSON includes every local workspace.',
      'Recovery snapshots help undo destructive local actions in the same browser profile or device storage area only.',
      'Export before clearing browser data, switching browsers, using private browsing, or changing devices.',
    ],
  },
];

export const codexDataHelpTopics: readonly CodexHelpTopic[] = [
  {
    title: 'JSON export',
    items: [
      'Active-workspace JSON backs up the current project.',
      'Full-document JSON backs up every local workspace.',
    ],
  },
  {
    title: 'Markdown export',
    items: ['Markdown is a readable drafting reference, not a restore file.'],
  },
  {
    title: 'Import and reset',
    items: [
      'Import validates JSON before replacing the current document.',
      'Reset replaces the local document with neutral starter data after confirmation.',
      'Both actions save a recovery snapshot first when possible.',
    ],
  },
];

export const codexFirstUseHelp =
  'The starter workspace is neutral sample content. Rename it, create a new project/universe workspace, or duplicate it from Workspaces. Use Places for worlds, planets, realms, settlements, terrain, and other map-scale places inside a workspace.';

export const codexDataHelpSummary = `On web, the header Save button writes current progress to ${localPersistenceCopy.browserSaveTarget}; on mobile, edits save to device storage through the Expo app. ${localPersistenceCopy.noAccountOrSync} JSON export is the backup you control.`;

export const codexDataHelpDetails: readonly CodexHelpDetail[] = [
  {
    term: 'JSON export',
    detail:
      'Active-workspace JSON backs up the current project. Full-document JSON backs up every local workspace.',
  },
  {
    term: 'Markdown export',
    detail: 'Markdown is a readable drafting reference, not a restore file.',
  },
  {
    term: 'Import',
    detail:
      'Import validates JSON before replacing the current document and creates a recovery snapshot first when possible.',
  },
  {
    term: 'Reset',
    detail:
      'Reset replaces the local document with neutral starter data after confirmation. Export JSON first if the current work matters.',
  },
  {
    term: 'Snapshots',
    detail:
      'Recovery snapshots are local recovery points kept before destructive actions. They are not portable backups.',
  },
];

export const codexSupportHelp =
  'Use Data > Diagnostics when reporting a storage or rendering problem. Diagnostics include app version, schema version, storage target, recovery status, counts, and web route/browser or mobile device-save state where available. They omit world names, entry names, notes, summaries, tags, relationship notes, and ids by default.';

export const codexPrivacyHelp =
  'Valgaron does not send analytics, usage events, backups, diagnostics, or world content to a server. Maintainers cannot recover local data unless you choose to share a backup or diagnostic report.';

export const codexReleaseLimitsHelp =
  'This release does not include accounts, cloud sync, collaboration, sharing, publishing, AI generation, payments, or localization. Keep downloaded JSON backups as the portable copy of work you cannot afford to lose.';

export function getCodexHelpFocus(
  value: string | null | undefined
): CodexHelpFocus | null {
  return codexHelpFocusTopics.find((topic) => topic.id === value) ?? null;
}

export function getCodexHelpRoute(topic?: CodexHelpFocusId): string {
  return `${codexShellRoutes.help.path}${formatCodexRouteSearch({ topic })}`;
}
