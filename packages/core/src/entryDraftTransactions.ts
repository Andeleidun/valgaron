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
  WorldWorkspaceSchema,
} from './types';

export const draftTransactionEntryId = '__draft-entry__';

export const stagedRelationshipDraftCopy = {
  accessibilityLabel: 'Staged relationship links',
  detail:
    'Stage relationship links while drafting this entry. They will be created or updated together when the entry is created or updated.',
  duplicateMessage: 'That staged link is already in the pending link list.',
  missingTargetOrTypeMessage:
    'Choose a target record and relationship type before staging.',
  noteLabel: 'Note',
  notePlaceholder: 'Why this link matters',
  removeLabel: 'Remove',
  rowKicker: 'Staged link',
  stageLabel: 'Stage Link',
  targetEmptyLabel: 'Choose record',
  targetLabel: 'Target record',
  targetSearchPlaceholder: 'Search records',
  title: 'Links to create with this entry',
  typeLabel: 'Relationship type',
  typePlaceholder: 'references, member of, located in',
} as const;

export type EntryDraftTransactionInput = {
  codex: WorldCodex;
  entryDraft: EntryDraft;
  existingEntry?: WorldEntry;
  relationships: readonly WorldRelationship[];
  section: WorldSectionConfig;
  stagedRelationships?: readonly RelationshipDraft[];
  temporaryEntryId?: string;
  workspaceSchema?: WorldWorkspaceSchema;
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

export type StagedRelationshipDraftRowModel = {
  detail: string;
  note: string;
  removeAccessibilityLabel: string;
  removeLabel: string;
  kicker: string;
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

function getStagedRelationshipDuplicateKey(
  relationship: Pick<
    RelationshipDraft,
    | 'directional'
    | 'note'
    | 'sourceEntryId'
    | 'status'
    | 'targetEntryId'
    | 'type'
  >
): string {
  return [
    relationship.sourceEntryId,
    relationship.targetEntryId,
    relationship.type.trim().toLowerCase(),
    relationship.directional ? 'directional' : 'undirected',
    relationship.status,
    relationship.note.trim(),
  ].join('\u001f');
}

export function hasDuplicateStagedRelationshipDraft({
  sourceEntryId = draftTransactionEntryId,
  stagedRelationships,
  targetEntryId,
  type,
}: {
  sourceEntryId?: string;
  stagedRelationships: readonly Pick<
    RelationshipDraft,
    'sourceEntryId' | 'targetEntryId' | 'type'
  >[];
  targetEntryId: string;
  type: string;
}): boolean {
  const normalizedType = type.trim().toLocaleLowerCase();
  if (!targetEntryId || !normalizedType) {
    return false;
  }
  return stagedRelationships.some(
    (relationship) =>
      relationship.sourceEntryId === sourceEntryId &&
      relationship.targetEntryId === targetEntryId &&
      relationship.type.trim().toLocaleLowerCase() === normalizedType
  );
}

export function getStagedRelationshipDraftRowModel({
  relationship,
  targetLabel,
}: {
  relationship: Pick<RelationshipDraft, 'note' | 'targetEntryId' | 'type'>;
  targetLabel?: string;
}): StagedRelationshipDraftRowModel {
  const type = relationship.type.trim() || 'links to';
  const target = targetLabel?.trim() || relationship.targetEntryId;
  return {
    detail: `This entry ${type} ${target}.`,
    note: relationship.note.trim(),
    removeAccessibilityLabel: `Remove staged link to ${target}`,
    removeLabel: stagedRelationshipDraftCopy.removeLabel,
    kicker: stagedRelationshipDraftCopy.rowKicker,
  };
}

export function normalizeStagedRelationshipDrafts<T extends RelationshipDraft>(
  stagedRelationships: readonly T[]
): T[] {
  const seenKeys = new Set<string>();
  return stagedRelationships.filter((relationship) => {
    const key = getStagedRelationshipDuplicateKey(relationship);
    if (seenKeys.has(key)) {
      return false;
    }
    seenKeys.add(key);
    return true;
  });
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
  workspaceSchema,
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
  const entryValidation = validateEntryDraft(section, entryDraft, {
    workspaceSchema,
  });
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
  const savedRelationshipDrafts = normalizeStagedRelationshipDrafts(
    stagedRelationships
  ).map((relationshipDraft) => ({
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
  }));
  const savedRelationships = normalizeStagedRelationshipDrafts(
    savedRelationshipDrafts
  ).map((relationshipDraft) => relationshipFromDraft(relationshipDraft));
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
