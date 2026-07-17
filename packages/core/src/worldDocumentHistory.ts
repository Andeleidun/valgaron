import type { WorldDocument } from './types';

export const worldDocumentHistoryLimit = 20;
export const worldDocumentHistorySubjectLimit = 80;

export type WorldDocumentRevisionOrigin =
  | 'initial'
  | 'import'
  | 'reset'
  | 'recovery-restore';

export type WorldDocumentInitialUnpersistedState = 'unsaved' | 'paused' | null;

export type WorldDocumentRevision = {
  id: number;
  actionLabel: string | null;
  document: WorldDocument;
  origin: WorldDocumentRevisionOrigin;
};

export type WorldDocumentHistory = {
  past: readonly WorldDocumentRevision[];
  present: WorldDocumentRevision;
  future: readonly WorldDocumentRevision[];
  nextRevisionId: number;
  persistedRevisionId: number | null;
  lastPersistedAt: string | null;
  documentSavedAt: string;
  initialRevisionId: number;
  initialUnpersistedState: WorldDocumentInitialUnpersistedState;
  limit: number;
};

export type WorldDocumentHistorySaveState =
  | 'saved'
  | 'unsaved'
  | 'dirty'
  | 'paused';

export type CreateWorldDocumentHistoryOptions = {
  document: WorldDocument;
  persisted: boolean;
  initialUnpersistedState?: WorldDocumentInitialUnpersistedState;
  limit?: number;
};

export type CommitWorldDocumentRevisionOptions = {
  actionLabel: string;
  document: WorldDocument;
  origin?: Exclude<WorldDocumentRevisionOrigin, 'initial'>;
};

function normalizeLimit(limit: number): number {
  return Number.isFinite(limit) ? Math.max(0, Math.floor(limit)) : 0;
}

function withSavedAt(document: WorldDocument, savedAt: string): WorldDocument {
  return document.savedAt === savedAt ? document : { ...document, savedAt };
}

function activateRevision(
  revision: WorldDocumentRevision,
  documentSavedAt: string
): WorldDocumentRevision {
  const document = withSavedAt(revision.document, documentSavedAt);
  return document === revision.document ? revision : { ...revision, document };
}

export function createWorldDocumentHistory({
  document,
  persisted,
  initialUnpersistedState = persisted ? null : 'unsaved',
  limit = worldDocumentHistoryLimit,
}: CreateWorldDocumentHistoryOptions): WorldDocumentHistory {
  const present: WorldDocumentRevision = {
    id: 0,
    actionLabel: null,
    document,
    origin: 'initial',
  };
  return {
    past: [],
    present,
    future: [],
    nextRevisionId: 1,
    persistedRevisionId: persisted ? present.id : null,
    lastPersistedAt: persisted ? document.savedAt : null,
    documentSavedAt: document.savedAt,
    initialRevisionId: present.id,
    initialUnpersistedState: persisted ? null : initialUnpersistedState,
    limit: normalizeLimit(limit),
  };
}

export function replaceWorldDocumentHistoryAfterLoad(
  options: CreateWorldDocumentHistoryOptions
): WorldDocumentHistory {
  return createWorldDocumentHistory(options);
}

export function commitWorldDocumentRevision(
  history: WorldDocumentHistory,
  { actionLabel, document, origin }: CommitWorldDocumentRevisionOptions
): WorldDocumentHistory {
  if (document === history.present.document) {
    return history;
  }
  const present: WorldDocumentRevision = {
    id: history.nextRevisionId,
    actionLabel,
    document: withSavedAt(document, history.documentSavedAt),
    origin: origin ?? history.present.origin,
  };
  const past =
    history.limit === 0
      ? []
      : [...history.past, history.present].slice(-history.limit);
  return {
    ...history,
    past,
    present,
    future: [],
    nextRevisionId: history.nextRevisionId + 1,
  };
}

export function undoWorldDocumentRevision(
  history: WorldDocumentHistory
): WorldDocumentHistory {
  const previous = history.past.at(-1);
  if (!previous) {
    return history;
  }
  return {
    ...history,
    past: history.past.slice(0, -1),
    present: activateRevision(previous, history.documentSavedAt),
    future: [history.present, ...history.future],
  };
}

export function redoWorldDocumentRevision(
  history: WorldDocumentHistory
): WorldDocumentHistory {
  const next = history.future[0];
  if (!next) {
    return history;
  }
  return {
    ...history,
    past: [...history.past, history.present],
    present: activateRevision(next, history.documentSavedAt),
    future: history.future.slice(1),
  };
}

export function markWorldDocumentRevisionPersisted(
  history: WorldDocumentHistory,
  persistedAt: string
): WorldDocumentHistory {
  return {
    ...history,
    present: {
      ...history.present,
      document: withSavedAt(history.present.document, persistedAt),
    },
    persistedRevisionId: history.present.id,
    lastPersistedAt: persistedAt,
    documentSavedAt: persistedAt,
  };
}

export function canUndoWorldDocumentRevision(
  history: WorldDocumentHistory
): boolean {
  return history.past.length > 0;
}

export function canRedoWorldDocumentRevision(
  history: WorldDocumentHistory
): boolean {
  return history.future.length > 0;
}

export function getUndoWorldDocumentActionLabel(
  history: WorldDocumentHistory
): string | null {
  return canUndoWorldDocumentRevision(history)
    ? history.present.actionLabel
    : null;
}

export function getRedoWorldDocumentActionLabel(
  history: WorldDocumentHistory
): string | null {
  return history.future[0]?.actionLabel ?? null;
}

export function getWorldDocumentHistorySaveState(
  history: WorldDocumentHistory
): WorldDocumentHistorySaveState {
  if (history.present.id === history.persistedRevisionId) {
    return 'saved';
  }
  if (
    history.persistedRevisionId === null &&
    history.present.id === history.initialRevisionId &&
    history.initialUnpersistedState
  ) {
    return history.initialUnpersistedState;
  }
  return 'dirty';
}

export function hasUnpersistedWorldDocumentRevision(
  history: WorldDocumentHistory
): boolean {
  return history.present.id !== history.persistedRevisionId;
}

export function getWorldDocumentHistoryDocuments(
  history: WorldDocumentHistory
): readonly WorldDocument[] {
  return [
    ...history.past.map((revision) => revision.document),
    history.present.document,
    ...history.future.map((revision) => revision.document),
  ];
}

function normalizeActionSubject(subject: string): string {
  const normalized = subject
    .trim()
    .replace(/\s+/gu, ' ')
    .replace(/[“”]/gu, '"');
  const codePoints = Array.from(normalized);
  return codePoints.length > worldDocumentHistorySubjectLimit
    ? `${codePoints.slice(0, worldDocumentHistorySubjectLimit).join('')}…`
    : normalized;
}

export function formatWorldDocumentActionLabel({
  action,
  recordType,
  subject,
}: {
  action: string;
  recordType: string;
  subject?: string | null;
}): string {
  const normalizedAction = action.trim().replace(/\s+/gu, ' ');
  const normalizedRecordType = recordType.trim().replace(/\s+/gu, ' ');
  const normalizedSubject = normalizeActionSubject(subject ?? '');
  const baseLabel = [normalizedAction, normalizedRecordType]
    .filter(Boolean)
    .join(' ');
  return normalizedSubject ? `${baseLabel} “${normalizedSubject}”` : baseLabel;
}
