import { describe, expect, it } from '@jest/globals';
import { createEmptyDraft } from './codexEntries';
import { createEmptyRelationshipDraft } from './codexRelationships';
import { createSeedWorld } from './seedCodex';
import {
  commitEntryDraftTransaction,
  createStagedRelationshipDraft,
  deleteStagedRelationshipDraft,
  draftTransactionEntryId,
  getStagedRelationshipDraftRowModel,
  hasDuplicateStagedRelationshipDraft,
  getStagedRelationshipDraftsForEntry,
  normalizeStagedRelationshipDrafts,
  stagedRelationshipDraftCopy,
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

  it('normalizes duplicate staged relationship drafts before commit', () => {
    const world = createSeedWorld();
    const section = world.entryTypes.find((item) => item.id === 'timeline')!;
    const first = createStagedRelationshipDraft(
      {
        ...createEmptyRelationshipDraft(),
        sourceEntryId: draftTransactionEntryId,
        targetEntryId: 'faction-cartographers-guild',
        type: 'involves',
      },
      'staged-1'
    );
    const duplicate = createStagedRelationshipDraft(
      {
        ...first,
      },
      'staged-2'
    );

    expect(normalizeStagedRelationshipDrafts([first, duplicate])).toEqual([
      first,
    ]);

    const result = commitEntryDraftTransaction({
      codex: world.codex,
      entryDraft: {
        ...createEmptyDraft(),
        name: 'Duplicate link event',
      },
      relationships: world.relationships,
      section,
      stagedRelationships: [first, duplicate],
    });

    expect(result.savedRelationships).toHaveLength(1);
    expect(result.savedRelationships[0]).toMatchObject({
      sourceEntryId: result.entry.id,
      targetEntryId: 'faction-cartographers-guild',
      type: 'involves',
    });
  });

  it('builds shared staged relationship panel copy and row summaries', () => {
    const relationship = createStagedRelationshipDraft(
      {
        ...createEmptyRelationshipDraft(),
        sourceEntryId: draftTransactionEntryId,
        targetEntryId: 'faction-cartographers-guild',
        type: 'member of',
        note: 'Guild sponsor.',
      },
      'staged-1'
    );

    expect(stagedRelationshipDraftCopy).toMatchObject({
      duplicateMessage: 'That staged link is already in the pending link list.',
      missingTargetOrTypeMessage:
        'Choose a target record and relationship type before staging.',
      stageLabel: 'Stage Link',
      title: 'Links to create with this entry',
    });
    expect(
      getStagedRelationshipDraftRowModel({
        relationship,
        targetLabel: 'Cartographers Guild',
      })
    ).toEqual({
      detail: 'This entry member of Cartographers Guild.',
      kicker: 'Staged link',
      note: 'Guild sponsor.',
      removeAccessibilityLabel: 'Remove staged link to Cartographers Guild',
      removeLabel: 'Remove',
    });
  });

  it('detects duplicate staged relationship targets with normalized types', () => {
    const stagedRelationship = createStagedRelationshipDraft(
      {
        ...createEmptyRelationshipDraft(),
        sourceEntryId: draftTransactionEntryId,
        targetEntryId: 'faction-cartographers-guild',
        type: 'Member Of',
      },
      'staged-1'
    );

    expect(
      hasDuplicateStagedRelationshipDraft({
        stagedRelationships: [stagedRelationship],
        targetEntryId: 'faction-cartographers-guild',
        type: ' member of ',
      })
    ).toBe(true);
    expect(
      hasDuplicateStagedRelationshipDraft({
        stagedRelationships: [stagedRelationship],
        targetEntryId: 'place-northwatch-harbor',
        type: 'member of',
      })
    ).toBe(false);
  });
});
