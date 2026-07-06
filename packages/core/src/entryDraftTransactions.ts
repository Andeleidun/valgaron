import { applyEntry, entryFromDraft, type EntryDraft } from './codexEntries';
import {
  relationshipFromDraft,
  upsertRelationship,
  type RelationshipDraft,
} from './codexRelationships';
import {
  validateEntryDraft,
  validateRelationshipDraft,
  type DraftValidationResult,
} from './draftValidation';
import { makeLocalIdSuffix } from './ids';
import type {
  WorldCodex,
  WorldEntry,
  WorldRelationship,
  WorldSectionConfig,
} from './types';

export const draftTransactionEntryId = '__draft-entry__';

export type EntryDraftTransactionInput = {
  codex: WorldCodex;
  entryDraft: EntryDraft;
  existingEntry?: WorldEntry;
  relationships: readonly WorldRelationship[];
  section: WorldSectionConfig;
  stagedRelationships?: readonly RelationshipDraft[];
  temporaryEntryId?: string;
};

export type EntryDraftTransactionResult = {
  codex: WorldCodex;
  entry: WorldEntry;
  relationships: readonly WorldRelationship[];
  savedRelationships: readonly WorldRelationship[];
};

export type EntryDraftTransactionValidationResult = DraftValidationResult;

export type StagedRelationshipDraft = RelationshipDraft & {
  stagedId: string;
};

export function createStagedRelationshipDraft(
  draft: RelationshipDraft,
  stagedId = `staged-relationship-${makeLocalIdSuffix()}`
): StagedRelationshipDraft {
  return {
    ...draft,
    stagedId,
  };
}

export function upsertStagedRelationshipDraft(
  stagedRelationships: readonly StagedRelationshipDraft[],
  relationship: StagedRelationshipDraft
): StagedRelationshipDraft[] {
  const existingIndex = stagedRelationships.findIndex(
    (item) => item.stagedId === relationship.stagedId
  );
  if (existingIndex === -1) {
    return [relationship, ...stagedRelationships];
  }
  return stagedRelationships.map((item) =>
    item.stagedId === relationship.stagedId ? relationship : item
  );
}

export function deleteStagedRelationshipDraft(
  stagedRelationships: readonly StagedRelationshipDraft[],
  stagedId: string
): StagedRelationshipDraft[] {
  return stagedRelationships.filter((item) => item.stagedId !== stagedId);
}

export function getStagedRelationshipDraftsForEntry(
  stagedRelationships: readonly StagedRelationshipDraft[],
  entryId = draftTransactionEntryId
): StagedRelationshipDraft[] {
  return stagedRelationships.filter(
    (relationship) =>
      relationship.sourceEntryId === entryId ||
      relationship.targetEntryId === entryId
  );
}

function resolveTransactionEntryId({
  entryId,
  savedEntryId,
  temporaryEntryId,
}: {
  entryId: string;
  savedEntryId: string;
  temporaryEntryId: string;
}): string {
  return entryId === temporaryEntryId ? savedEntryId : entryId;
}

export function validateEntryDraftTransaction({
  codex,
  entryDraft,
  existingEntry,
  section,
  stagedRelationships = [],
  temporaryEntryId = draftTransactionEntryId,
}: Omit<
  EntryDraftTransactionInput,
  'relationships'
>): EntryDraftTransactionValidationResult {
  const entryId = existingEntry?.id ?? temporaryEntryId;
  const validEntryIds = new Set([
    entryId,
    ...Object.values(codex).flatMap((entries) =>
      Array.isArray(entries) ? entries.map((entry) => entry.id) : []
    ),
  ]);
  const entryValidation = validateEntryDraft(section, entryDraft);
  const errors = entryValidation.ok ? [] : [...entryValidation.errors];

  stagedRelationships.forEach((relationshipDraft, index) => {
    const relationshipValidation = validateRelationshipDraft(
      {
        ...relationshipDraft,
        sourceEntryId: resolveTransactionEntryId({
          entryId: relationshipDraft.sourceEntryId,
          savedEntryId: entryId,
          temporaryEntryId,
        }),
        targetEntryId: resolveTransactionEntryId({
          entryId: relationshipDraft.targetEntryId,
          savedEntryId: entryId,
          temporaryEntryId,
        }),
      },
      Array.from(validEntryIds)
    );
    if (!relationshipValidation.ok) {
      errors.push(
        ...relationshipValidation.errors.map(
          (error) => `Staged relationship ${index + 1}: ${error}`
        )
      );
    }
  });

  return errors.length === 0 ? { ok: true } : { ok: false, errors };
}

export function commitEntryDraftTransaction({
  codex,
  entryDraft,
  existingEntry,
  relationships,
  section,
  stagedRelationships = [],
  temporaryEntryId = draftTransactionEntryId,
}: EntryDraftTransactionInput): EntryDraftTransactionResult {
  const entry = entryFromDraft(section, entryDraft, existingEntry);
  const savedRelationships = stagedRelationships.map((relationshipDraft) =>
    relationshipFromDraft({
      ...relationshipDraft,
      sourceEntryId: resolveTransactionEntryId({
        entryId: relationshipDraft.sourceEntryId,
        savedEntryId: entry.id,
        temporaryEntryId,
      }),
      targetEntryId: resolveTransactionEntryId({
        entryId: relationshipDraft.targetEntryId,
        savedEntryId: entry.id,
        temporaryEntryId,
      }),
    })
  );
  return {
    codex: applyEntry(codex, entry, [section]),
    entry,
    relationships: savedRelationships.reduce(
      (currentRelationships, relationship) =>
        upsertRelationship(currentRelationships, relationship),
      relationships
    ),
    savedRelationships,
  };
}
