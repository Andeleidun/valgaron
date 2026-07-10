import {
  codexShellRoutes,
  formatCodexRouteSearch,
  localPersistenceCopy,
  valgaronProduct,
  type CodexShellRouteId,
} from './shell';
import { utilityRouteFocusTargetIds } from './workflowDestinations';

export type CodexHelpFocusId =
  | 'start'
  | 'entries'
  | 'relationships'
  | 'timeline'
  | 'knowledge'
  | 'utilities'
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

export type CodexHelpSectionHeader = {
  title: string;
  kicker?: string;
};

export type CodexHelpQuickAction = {
  id: Extract<
    CodexShellRouteId,
    'entries' | 'timeline' | 'relationships' | 'knowledge' | 'utilities'
  >;
  label: string;
  path: string;
};

export type CodexHelpFocus = {
  id: CodexHelpFocusId;
  title: string;
  detail: string;
  path: string;
};

export type CodexHelpScreenModel = {
  app: {
    title: string;
    version: string;
    versionText: string;
  };
  sections: {
    focused: CodexHelpSectionHeader;
    firstUse: CodexHelpSectionHeader;
    quickActions: CodexHelpSectionHeader;
    focusTopics: CodexHelpSectionHeader;
    workflow: CodexHelpSectionHeader & {
      ariaLabel: string;
    };
    data: CodexHelpSectionHeader;
    offline: CodexHelpSectionHeader;
    support: CodexHelpSectionHeader;
    privacy: CodexHelpSectionHeader;
    releaseLimits: CodexHelpSectionHeader;
  };
  focusedTopic: CodexHelpFocus | null;
  focusTopics: readonly CodexHelpFocus[];
  firstUse: string;
  quickActions: readonly CodexHelpQuickAction[];
  workflowTopics: readonly CodexHelpTopic[];
  data: {
    title: string;
    summary: string;
    details: readonly CodexHelpDetail[];
  };
  offline: {
    title: string;
    detail: string;
  };
  support: {
    title: string;
    detail: string;
  };
  privacy: {
    title: string;
    detail: string;
  };
  releaseLimits: {
    title: string;
    detail: string;
  };
};

export const codexHelpSectionTitles = {
  data: 'Backups and recovery',
  firstUse: 'Start with one workspace',
  focusTopics: 'Help topics',
  quickActions: 'Open a workspace area',
  offline: 'Installable app limits',
} as const;

export const codexHelpScreenSections: CodexHelpScreenModel['sections'] = {
  focused: {
    kicker: 'Focused help',
    title: 'Focused help',
  },
  firstUse: {
    kicker: 'First use',
    title: codexHelpSectionTitles.firstUse,
  },
  quickActions: {
    kicker: 'Quick actions',
    title: codexHelpSectionTitles.quickActions,
  },
  focusTopics: {
    title: codexHelpSectionTitles.focusTopics,
  },
  workflow: {
    ariaLabel: 'Workflow help',
    kicker: 'Workflow',
    title: 'Workflow',
  },
  data: {
    kicker: 'Local storage',
    title: codexHelpSectionTitles.data,
  },
  offline: {
    kicker: 'Offline',
    title: codexHelpSectionTitles.offline,
  },
  support: {
    kicker: 'Support',
    title: 'Report problems without world content',
  },
  privacy: {
    kicker: 'Privacy',
    title: 'No telemetry or remote account',
  },
  releaseLimits: {
    kicker: 'Release limits',
    title: 'Intentionally out of scope',
  },
};

export const codexHelpQuickActions: readonly CodexHelpQuickAction[] = [
  {
    id: 'entries',
    label: `Open ${codexShellRoutes.entries.title}`,
    path: codexShellRoutes.entries.path,
  },
  {
    id: 'relationships',
    label: `Open ${codexShellRoutes.relationships.title}`,
    path: codexShellRoutes.relationships.path,
  },
  {
    id: 'timeline',
    label: `Open ${codexShellRoutes.timeline.title}`,
    path: codexShellRoutes.timeline.path,
  },
  {
    id: 'knowledge',
    label: `Open ${codexShellRoutes.knowledge.title}`,
    path: codexShellRoutes.knowledge.path,
  },
  {
    id: 'utilities',
    label: `Open ${codexShellRoutes.utilities.title}`,
    path: `${codexShellRoutes.utilities.path}#${utilityRouteFocusTargetIds.projectTools}`,
  },
];

const codexHelpFocusTopicContent: readonly Omit<CodexHelpFocus, 'path'>[] = [
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
      'Use explicit order, grouped event editing, Era Manager reassignment, unassigned-era filters, involved-record filters, contextual new-event drafts, and saved relationship summaries to browse and extend chronology without forcing exact dates.',
  },
  {
    id: 'knowledge',
    title: 'Knowledge',
    detail:
      'Use Knowledge to review schema, create custom entry types, configure entry fields, search field settings, manage durable vocabulary values, and understand relationship-backed field rules.',
  },
  {
    id: 'utilities',
    title: 'Utilities',
    detail:
      'Use Utilities or mobile More for the Project Tools hub, Review Hotspots, top-level Data, Workspaces, and Help shortcuts, focused Knowledge setup, and secondary tools without crowding daily drafting surfaces.',
  },
  {
    id: 'workspaces',
    title: 'Workspaces',
    detail:
      'Keep project or universe workspaces separate from codex places, and manage in-fiction worlds or planets for the active workspace.',
  },
  {
    id: 'data',
    title: 'Backups and recovery',
    detail:
      'Use ZIP when uploaded images must be portable, use JSON for URI/metadata copies, import only validated backups, and treat recovery snapshots as local undo points.',
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

export const codexHelpFocusTopics: readonly CodexHelpFocus[] =
  codexHelpFocusTopicContent.map((topic) => ({
    ...topic,
    path: getCodexHelpRoute(topic.id),
  }));

export const codexWorkflowHelpTopics: readonly CodexHelpTopic[] = [
  {
    title: 'Build the codex',
    items: [
      'Use Workbench to scan recent, pinned, incomplete, and review-needed records, then check selected-record review summaries before editing or managing links.',
      'Use Workbench and section routes to create and edit characters, places, factions, lore, and timeline events.',
      'Use Knowledge or mobile More to create custom entry types, configure field labels/help/visibility/order/vocabularies, search field settings, inspect durable vocabulary rows, and review field usage before adding more structure.',
      'Use Project Tools shortcuts and Review Hotspots in Utilities or mobile More when you need backups, Workspaces, focused Help, or a jump to existing cleanup surfaces from the secondary tools hub.',
      'Use character category to shape which character fields appear; ancestry and profession use workspace-owned vocabulary suggestions that can be maintained, searched, restricted, and alias-matched from Knowledge or mobile More.',
      'Use Places for worlds, planets, moons, settlements, terrain, realms, and other map-scale places inside a project.',
    ],
  },
  {
    title: 'Connect records',
    items: [
      'Use Relationships to link entries and inspect graph-style connections.',
      'Use relationship-backed character fields for facts that should be visible from both sides, such as homes, affiliations, mentors, origins, related lore, and notable events.',
      'Use Timeline order controls, grouped event editing, Era Manager reassignment, saved relationship summaries, and filtered new-event drafts to arrange events while keeping flexible prose dates, eras, and involved-record links.',
      'Use tags, status, pinned records, and completeness prompts to keep unfinished work visible.',
    ],
  },
  {
    title: 'Protect local work',
    items: [
      'On web, use the header Save button before relying on browser-local changes later; on mobile, confirm the latest device-save status before closing the app.',
      'Export ZIP backups when uploads must be restored; active-workspace packages are focused and full-document packages include every local workspace.',
      'Recovery snapshots help undo destructive local actions in the same browser profile or mobile app storage area only.',
      'Export before clearing browser data, switching browsers, using private browsing, uninstalling the mobile app, or changing devices.',
    ],
  },
  {
    title: 'Arrange your drafting desk',
    items: [
      'On browser dashboards, choose Customize layout to move, resize, focus, collapse, restore, undo, or reset cards; keyboard controls provide the same results as pointer dragging.',
      'Use Earlier and Later for ordered keyboard movement, the Region and Size selectors for placement, and Left or Right Arrow on a resize handle to snap between supported sizes.',
      'On mobile, choose Customize Sections to move sections earlier or later and collapse secondary material without using desktop geometry.',
      'Layout choices stay only in this browser profile or installed app storage and are not included in world exports or synchronized between devices.',
    ],
  },
];

export const codexDataHelpTopics: readonly CodexHelpTopic[] = [
  {
    title: 'JSON and ZIP export',
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

export const codexDataHelpSummary = `On web, the header Save button writes current progress to ${localPersistenceCopy.browserSaveTarget}; on mobile, edits save to the installed app's local storage area through the Expo app. ${localPersistenceCopy.noAccountOrSync} ZIP includes uploaded images; JSON preserves their URI and metadata only.`;

export const codexDataHelpDetails: readonly CodexHelpDetail[] = [
  {
    term: 'JSON and ZIP export',
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

export const codexOfflineHelp =
  'The published GitHub Pages build can be installed as a PWA after a successful visit in a supported browser. Offline use means the app shell can load without a network; it does not protect data from browser-profile deletion, private browsing cleanup, mobile app uninstall, device loss, or storage quota failures.';

export const codexPrivacyHelp =
  'Valgaron does not send analytics, usage events, backups, diagnostics, or world content to a server. Maintainers cannot recover local data unless you choose to share a backup or diagnostic report.';

export const codexReleaseLimitsHelp =
  'This release does not include accounts, cloud sync, collaboration, publishing, AI generation, payments, or localization. Keep downloaded ZIP backups when uploaded images are part of work you cannot afford to lose.';

export function isCodexHelpFocusId(
  value: string | null | undefined
): value is CodexHelpFocusId {
  return codexHelpFocusTopics.some((topic) => topic.id === value);
}

export function getCodexHelpFocus(
  value: string | null | undefined
): CodexHelpFocus | null {
  return isCodexHelpFocusId(value)
    ? codexHelpFocusTopics.find((topic) => topic.id === value) ?? null
    : null;
}

export function getCodexHelpScreenModel(
  topic: string | null | undefined
): CodexHelpScreenModel {
  return {
    app: {
      title: valgaronProduct.fullTitle,
      version: valgaronProduct.version,
      versionText: `Version ${valgaronProduct.version}.`,
    },
    sections: codexHelpScreenSections,
    focusedTopic: getCodexHelpFocus(topic),
    focusTopics: codexHelpFocusTopics,
    firstUse: codexFirstUseHelp,
    quickActions: codexHelpQuickActions,
    workflowTopics: codexWorkflowHelpTopics,
    data: {
      title: codexHelpSectionTitles.data,
      summary: codexDataHelpSummary,
      details: codexDataHelpDetails,
    },
    offline: {
      title: codexHelpSectionTitles.offline,
      detail: codexOfflineHelp,
    },
    support: {
      title: codexHelpScreenSections.support.title,
      detail: codexSupportHelp,
    },
    privacy: {
      title: codexHelpScreenSections.privacy.title,
      detail: codexPrivacyHelp,
    },
    releaseLimits: {
      title: codexHelpScreenSections.releaseLimits.title,
      detail: codexReleaseLimitsHelp,
    },
  };
}

export function getCodexHelpRoute(topic?: CodexHelpFocusId): string {
  return `${codexShellRoutes.help.path}${formatCodexRouteSearch({ topic })}`;
}
