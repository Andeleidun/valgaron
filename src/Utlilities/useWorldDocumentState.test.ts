import { describe, expect, it } from '@jest/globals';
import {
  applyEntryRelationshipDocumentTransaction,
  applyUnsavedDocumentUpdate,
  createManualSaveDocument,
  getInitialSaveStateAfterLoad,
  getLoadStatusForRevisionOrigin,
  shouldPauseInitialSaveAfterLoad,
} from './useWorldDocumentState';
import type { WorldDocumentLoadStatus } from './codexStorage';
import {
  commitWorldDocumentRevision,
  createSeedWorldDocument,
  createWorldDocumentHistory,
  getActiveWorld,
} from '@valgaron/core';

const checkedAt = '2026-06-01T00:00:00.000Z';

function loadStatus(
  status: Partial<WorldDocumentLoadStatus>
): WorldDocumentLoadStatus {
  return {
    state: 'loaded',
    source: 'current',
    message: 'Loaded.',
    issues: [],
    checkedAt,
    ...status,
  };
}

describe('world document state helpers', () => {
  it('pauses the first save only when fallback seed data replaced unreadable storage', () => {
    expect(
      shouldPauseInitialSaveAfterLoad(
        loadStatus({
          state: 'recovered',
          source: 'seed',
          issues: ['valgaron.worldDocument.v3 is not valid JSON.'],
        })
      )
    ).toBe(true);

    expect(
      shouldPauseInitialSaveAfterLoad(
        loadStatus({
          state: 'empty',
          source: 'seed',
          issues: [],
        })
      )
    ).toBe(false);
  });

  it('marks only current-storage loads as initially saved after auto-save removal', () => {
    expect(
      getInitialSaveStateAfterLoad(
        loadStatus({
          state: 'loaded',
          source: 'current',
        })
      )
    ).toBe('saved');

    expect(
      getInitialSaveStateAfterLoad(
        loadStatus({
          state: 'empty',
          source: 'seed',
        })
      )
    ).toBe('unsaved');

    expect(
      getInitialSaveStateAfterLoad(
        loadStatus({
          state: 'recovered',
          source: 'seed',
          issues: ['valgaron.worldDocument.v3 is not valid JSON.'],
        })
      )
    ).toBe('paused');
  });

  it('keeps the last persisted timestamp when applying unsaved document edits', () => {
    const document = createSeedWorldDocument();
    const nextDocument = applyUnsavedDocumentUpdate(document, (current) => ({
      ...current,
      activeWorldId: 'different-workspace',
      savedAt: '2026-06-02T00:00:00.000Z',
    }));

    expect(nextDocument.activeWorldId).toBe('different-workspace');
    expect(nextDocument.savedAt).toBe(document.savedAt);
    expect(applyUnsavedDocumentUpdate(document, () => document)).toBe(document);
  });

  it('stamps the document timestamp only for manual saves', () => {
    const document = createSeedWorldDocument();
    const savedDocument = createManualSaveDocument(
      document,
      '2026-06-02T00:00:00.000Z'
    );

    expect(savedDocument).toEqual({
      ...document,
      savedAt: '2026-06-02T00:00:00.000Z',
    });
  });

  it('restores revision provenance without dropping startup diagnostics', () => {
    const initialStatus = loadStatus({
      state: 'recovered',
      source: 'seed',
      issues: ['Current storage was corrupt.'],
    });
    expect(
      getLoadStatusForRevisionOrigin({
        checkedAt,
        initialStatus,
        origin: 'initial',
      })
    ).toBe(initialStatus);
    expect(
      getLoadStatusForRevisionOrigin({
        checkedAt,
        initialStatus,
        origin: 'import',
      })
    ).toMatchObject({
      source: 'current',
      issues: initialStatus.issues,
      checkedAt,
    });
  });

  it('applies entry and relationship work as one history revision', () => {
    const document = createSeedWorldDocument();
    const world = getActiveWorld(document);
    const entry = world.codex.characters[0]!;
    const relationship = world.relationships[0]!;
    const nextDocument = applyEntryRelationshipDocumentTransaction(document, {
      entries: [{ ...entry, name: `${entry.name} Updated` }],
      relationships: [
        { ...relationship, note: `${relationship.note} Updated` },
      ],
      relationshipIdsToDelete: ['missing-relationship'],
    });
    const history = commitWorldDocumentRevision(
      createWorldDocumentHistory({ document, persisted: true }),
      { actionLabel: 'Update Character', document: nextDocument }
    );

    expect(history.past).toHaveLength(1);
    expect(
      getActiveWorld(history.present.document).codex.characters[0]?.name
    ).toBe(`${entry.name} Updated`);
    expect(
      getActiveWorld(history.present.document).relationships[0]?.note
    ).toBe(`${relationship.note} Updated`);
    expect(
      applyEntryRelationshipDocumentTransaction(document, {
        relationshipIdsToDelete: ['missing-relationship'],
      })
    ).toBe(document);
  });
});
