import { describe, expect, it } from '@jest/globals';
import { createSeedWorldDocument } from './seedCodex';
import type { WorldDocument } from './types';
import {
  canRedoWorldDocumentRevision,
  canUndoWorldDocumentRevision,
  commitWorldDocumentRevision,
  createWorldDocumentHistory,
  formatWorldDocumentActionLabel,
  getRedoWorldDocumentActionLabel,
  getUndoWorldDocumentActionLabel,
  getWorldDocumentHistorySaveState,
  hasUnpersistedWorldDocumentRevision,
  markWorldDocumentRevisionPersisted,
  redoWorldDocumentRevision,
  replaceWorldDocumentHistoryAfterLoad,
  undoWorldDocumentRevision,
  worldDocumentHistoryLimit,
  worldDocumentHistorySubjectLimit,
} from './worldDocumentHistory';

function editDocument(
  document: WorldDocument,
  suffix: string,
  savedAt = `2099-01-01T00:00:${suffix.padStart(2, '0')}.000Z`
): WorldDocument {
  return {
    ...document,
    activeWorldId: `${document.activeWorldId}-${suffix}`,
    savedAt,
  };
}

describe('world document history', () => {
  it('initializes persisted, new, and protected fallback baselines', () => {
    const document = createSeedWorldDocument();
    const persisted = createWorldDocumentHistory({ document, persisted: true });
    const persistedWithContradictoryOption = createWorldDocumentHistory({
      document,
      persisted: true,
      initialUnpersistedState: 'paused',
    });
    const unsaved = createWorldDocumentHistory({
      document,
      persisted: false,
    });
    const paused = createWorldDocumentHistory({
      document,
      persisted: false,
      initialUnpersistedState: 'paused',
    });

    expect(persisted).toMatchObject({
      past: [],
      future: [],
      nextRevisionId: 1,
      persistedRevisionId: 0,
      lastPersistedAt: document.savedAt,
      documentSavedAt: document.savedAt,
      initialRevisionId: 0,
      initialUnpersistedState: null,
      limit: worldDocumentHistoryLimit,
    });
    expect(getWorldDocumentHistorySaveState(persisted)).toBe('saved');
    expect(persistedWithContradictoryOption.initialUnpersistedState).toBeNull();
    expect(getWorldDocumentHistorySaveState(unsaved)).toBe('unsaved');
    expect(getWorldDocumentHistorySaveState(paused)).toBe('paused');
    expect(hasUnpersistedWorldDocumentRevision(persisted)).toBe(false);
    expect(hasUnpersistedWorldDocumentRevision(unsaved)).toBe(true);
  });

  it('commits deterministic revisions and ignores reference no-ops', () => {
    const document = createSeedWorldDocument();
    const initial = createWorldDocumentHistory({
      document,
      persisted: true,
    });
    expect(
      commitWorldDocumentRevision(initial, {
        actionLabel: 'No change',
        document,
      })
    ).toBe(initial);

    const first = commitWorldDocumentRevision(initial, {
      actionLabel: 'Update Character “Mara”',
      document: editDocument(document, '1'),
    });
    const second = commitWorldDocumentRevision(first, {
      actionLabel: 'Create Relationship',
      document: editDocument(first.present.document, '2'),
    });

    expect(first.present.id).toBe(1);
    expect(second.present.id).toBe(2);
    expect(second.nextRevisionId).toBe(3);
    expect(second.past.map((revision) => revision.id)).toEqual([0, 1]);
    expect(second.present.document.savedAt).toBe(document.savedAt);
    expect(getWorldDocumentHistorySaveState(second)).toBe('dirty');
  });

  it('undoes, redoes, announces actions, and invalidates redo on a branch', () => {
    const document = createSeedWorldDocument();
    const initial = createWorldDocumentHistory({ document, persisted: true });
    const first = commitWorldDocumentRevision(initial, {
      actionLabel: 'First action',
      document: editDocument(document, '1'),
    });
    const second = commitWorldDocumentRevision(first, {
      actionLabel: 'Second action',
      document: editDocument(first.present.document, '2'),
    });

    expect(canUndoWorldDocumentRevision(second)).toBe(true);
    expect(canRedoWorldDocumentRevision(second)).toBe(false);
    expect(getUndoWorldDocumentActionLabel(second)).toBe('Second action');
    const undone = undoWorldDocumentRevision(second);
    expect(undone.present.id).toBe(1);
    expect(getRedoWorldDocumentActionLabel(undone)).toBe('Second action');
    expect(undoWorldDocumentRevision(initial)).toBe(initial);

    const redone = redoWorldDocumentRevision(undone);
    expect(redone.present.id).toBe(2);
    expect(redone.past.map((revision) => revision.id)).toEqual([0, 1]);
    expect(redoWorldDocumentRevision(redone)).toBe(redone);

    const branch = commitWorldDocumentRevision(undone, {
      actionLabel: 'Branch action',
      document: editDocument(undone.present.document, '3'),
      origin: 'import',
    });
    expect(branch.present.id).toBe(3);
    expect(branch.present.origin).toBe('import');
    expect(branch.future).toEqual([]);
  });

  it('bounds the total reachable reversible action count', () => {
    let history = createWorldDocumentHistory({
      document: createSeedWorldDocument(),
      persisted: true,
      limit: 2,
    });
    for (let index = 1; index <= 4; index += 1) {
      history = commitWorldDocumentRevision(history, {
        actionLabel: `Action ${index}`,
        document: editDocument(history.present.document, String(index)),
      });
    }
    expect(history.past.map((revision) => revision.id)).toEqual([2, 3]);
    expect(history.present.id).toBe(4);

    history = undoWorldDocumentRevision(history);
    history = undoWorldDocumentRevision(history);
    expect(history.present.id).toBe(2);
    expect(history.past).toEqual([]);
    expect(history.future.map((revision) => revision.id)).toEqual([3, 4]);
    expect(history.past.length + history.future.length).toBe(2);
  });

  it('marks a durable baseline without clearing history or redo', () => {
    const document = createSeedWorldDocument();
    let history = createWorldDocumentHistory({ document, persisted: true });
    history = commitWorldDocumentRevision(history, {
      actionLabel: 'First action',
      document: editDocument(document, '1'),
    });
    history = commitWorldDocumentRevision(history, {
      actionLabel: 'Second action',
      document: editDocument(history.present.document, '2'),
    });
    history = undoWorldDocumentRevision(history);
    const savedAt = '2100-02-03T04:05:06.000Z';
    history = markWorldDocumentRevisionPersisted(history, savedAt);

    expect(history.persistedRevisionId).toBe(1);
    expect(history.lastPersistedAt).toBe(savedAt);
    expect(history.present.document.savedAt).toBe(savedAt);
    expect(history.future.map((revision) => revision.id)).toEqual([2]);
    expect(getWorldDocumentHistorySaveState(history)).toBe('saved');

    history = redoWorldDocumentRevision(history);
    expect(history.present.id).toBe(2);
    expect(history.present.document.savedAt).toBe(savedAt);
    expect(getWorldDocumentHistorySaveState(history)).toBe('dirty');
    history = undoWorldDocumentRevision(history);
    expect(getWorldDocumentHistorySaveState(history)).toBe('saved');
  });

  it('restores initial paused state only until a successful persistence', () => {
    const document = createSeedWorldDocument();
    let history = createWorldDocumentHistory({
      document,
      persisted: false,
      initialUnpersistedState: 'paused',
    });
    history = commitWorldDocumentRevision(history, {
      actionLabel: 'Update Character',
      document: editDocument(document, '1'),
    });
    expect(getWorldDocumentHistorySaveState(history)).toBe('dirty');
    history = undoWorldDocumentRevision(history);
    expect(getWorldDocumentHistorySaveState(history)).toBe('paused');
    history = markWorldDocumentRevisionPersisted(
      history,
      '2100-01-01T00:00:00.000Z'
    );
    history = redoWorldDocumentRevision(history);
    history = undoWorldDocumentRevision(history);
    expect(getWorldDocumentHistorySaveState(history)).toBe('saved');
  });

  it('replaces load state with empty history and explicit persistence status', () => {
    const first = createWorldDocumentHistory({
      document: createSeedWorldDocument(),
      persisted: true,
    });
    const edited = commitWorldDocumentRevision(first, {
      actionLabel: 'Edit',
      document: editDocument(first.present.document, '1'),
    });
    const replacement = replaceWorldDocumentHistoryAfterLoad({
      document: edited.present.document,
      persisted: false,
      initialUnpersistedState: 'unsaved',
    });
    expect(replacement.past).toEqual([]);
    expect(replacement.future).toEqual([]);
    expect(replacement.present.id).toBe(0);
    expect(getWorldDocumentHistorySaveState(replacement)).toBe('unsaved');
  });

  it('formats concise action descriptions without truncating the document value', () => {
    expect(
      formatWorldDocumentActionLabel({
        action: ' Update ',
        recordType: ' Character ',
        subject: '  Mara\n\t“Northwind”  ',
      })
    ).toBe('Update Character “Mara "Northwind"”');
    expect(
      formatWorldDocumentActionLabel({
        action: 'Create',
        recordType: 'Relationship',
        subject: '   ',
      })
    ).toBe('Create Relationship');

    const longSubject = `${'🗺️'.repeat(50)}${'a'.repeat(100)}`;
    const label = formatWorldDocumentActionLabel({
      action: 'Update',
      recordType: 'Place',
      subject: longSubject,
    });
    const announcedSubject = label.slice('Update Place “'.length, -2);
    expect(Array.from(announcedSubject).length).toBe(
      worldDocumentHistorySubjectLimit
    );
    expect(label.endsWith('…”')).toBe(true);
    expect(longSubject.length).toBeGreaterThan(announcedSubject.length);
  });
});
