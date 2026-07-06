import { describe, expect, it } from '@jest/globals';
import { createEmptyDraft } from './codexEntries';
import { createEmptyRelationshipDraft } from './codexRelationships';
import { createSeedWorld } from './seedCodex';
import {
  commitEntryDraftTransaction,
  createStagedRelationshipDraft,
  deleteStagedRelationshipDraft,
  draftTransactionEntryId,
  getStagedRelationshipDraftsForEntry,
  upsertStagedRelationshipDraft,
  validateEntryDraftTransaction,
} from './entryDraftTransactions';

describe('entry draft transactions', () => {
  it('commits a new entry and remaps staged relationships from the temporary entry id', () => {
    const world = createSeedWorld();
    const section = world.entryTypes.find((item) => item.id === 'characters')!;
    const draft = {
      ...createEmptyDraft(),
      name: 'Lena Vale',
      summary: 'A field medic attached to the survey route.',
      tags: 'medic, survey',
    };
    const stagedRelationship = {
      ...createEmptyRelationshipDraft(),
      sourceEntryId: draftTransactionEntryId,
      targetEntryId: 'faction-cartographers-guild',
      type: 'member of',
    };

    const result = commitEntryDraftTransaction({
      codex: world.codex,
      entryDraft: draft,
      relationships: world.relationships,
      section,
      stagedRelationships: [stagedRelationship],
    });

    expect(result.entry.name).toBe('Lena Vale');
    expect(result.codex.characters[0]).toEqual(result.entry);
    expect(result.savedRelationships).toEqual([
      expect.objectContaining({
        sourceEntryId: result.entry.id,
        targetEntryId: 'faction-cartographers-guild',
        type: 'member of',
      }),
    ]);
    expect(result.relationships[0]).toEqual(result.savedRelationships[0]);
  });

  it('commits staged relationships against an existing entry without changing its id', () => {
    const world = createSeedWorld();
    const section = world.entryTypes.find((item) => item.id === 'characters')!;
    const existingEntry = world.codex.characters[0];
    const stagedRelationship = {
      ...createEmptyRelationshipDraft(),
      sourceEntryId: 'place-northwatch-harbor',
      targetEntryId: draftTransactionEntryId,
      type: 'home of',
    };

    const result = commitEntryDraftTransaction({
      codex: world.codex,
      entryDraft: {
        ...createEmptyDraft(),
        name: existingEntry.name,
        summary: 'Updated summary.',
      },
      existingEntry,
      relationships: world.relationships,
      section,
      stagedRelationships: [stagedRelationship],
    });

    expect(result.entry.id).toBe(existingEntry.id);
    expect(result.savedRelationships[0]).toMatchObject({
      sourceEntryId: 'place-northwatch-harbor',
      targetEntryId: existingEntry.id,
      type: 'home of',
    });
  });

  it('validates the entry draft and staged relationships before commit', () => {
    const world = createSeedWorld();
    const section = world.entryTypes.find((item) => item.id === 'characters')!;
    const validation = validateEntryDraftTransaction({
      codex: world.codex,
      entryDraft: createEmptyDraft(),
      section,
      stagedRelationships: [
        {
          ...createEmptyRelationshipDraft(),
          sourceEntryId: draftTransactionEntryId,
          targetEntryId: draftTransactionEntryId,
          type: '',
        },
      ],
    });

    expect(validation).toEqual({
      ok: false,
      errors: [
        'Character name is required.',
        'Staged relationship 1: Choose two different entries.',
        'Staged relationship 1: Relationship type is required.',
      ],
    });
  });

  it('manages staged relationship drafts by stable staged ids', () => {
    const first = createStagedRelationshipDraft(
      {
        ...createEmptyRelationshipDraft(),
        sourceEntryId: draftTransactionEntryId,
        targetEntryId: 'faction-cartographers-guild',
        type: 'member of',
      },
      'staged-1'
    );
    const second = createStagedRelationshipDraft(
      {
        ...createEmptyRelationshipDraft(),
        sourceEntryId: 'place-northwatch-harbor',
        targetEntryId: 'lore-waystones',
        type: 'references',
      },
      'staged-2'
    );
    const updatedFirst = { ...first, type: 'leads' };

    const staged = upsertStagedRelationshipDraft(
      upsertStagedRelationshipDraft([second], first),
      updatedFirst
    );

    expect(staged).toEqual([updatedFirst, second]);
    expect(getStagedRelationshipDraftsForEntry(staged)).toEqual([updatedFirst]);
    expect(deleteStagedRelationshipDraft(staged, 'staged-1')).toEqual([second]);
  });
});
