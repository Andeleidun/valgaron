import type { EntryDraft } from './codexEntries';
import type { RelationshipDraft } from './codexRelationships';
import type { WorldSectionConfig } from './types';
import type {
  EntryTypeDraft,
  PlanetaryWorldDraft,
  WorkspaceDraft,
} from './workspaceManagement';

export type DraftValidationResult =
  | {
      ok: true;
    }
  | {
      ok: false;
      errors: readonly string[];
    };

function validationResult(errors: readonly string[]): DraftValidationResult {
  return errors.length === 0 ? { ok: true } : { ok: false, errors };
}

export function validateEntryDraft(
  section: WorldSectionConfig,
  draft: EntryDraft
): DraftValidationResult {
  return validationResult(
    [
      draft.name.trim() ? '' : `${section.singularTitle} name is required.`,
    ].filter(Boolean)
  );
}

export function validateRelationshipDraft(
  draft: RelationshipDraft,
  validEntryIds: readonly string[] = []
): DraftValidationResult {
  const sourceEntryId = draft.sourceEntryId.trim();
  const targetEntryId = draft.targetEntryId.trim();
  const entryIds = new Set(validEntryIds);
  const shouldCheckEntryIds = entryIds.size > 0;
  return validationResult(
    [
      sourceEntryId ? '' : 'Source entry is required.',
      targetEntryId ? '' : 'Target entry is required.',
      sourceEntryId && shouldCheckEntryIds && !entryIds.has(sourceEntryId)
        ? 'Choose an existing source entry.'
        : '',
      targetEntryId && shouldCheckEntryIds && !entryIds.has(targetEntryId)
        ? 'Choose an existing target entry.'
        : '',
      !sourceEntryId || !targetEntryId || sourceEntryId !== targetEntryId
        ? ''
        : 'Choose two different entries.',
      draft.type.trim() ? '' : 'Relationship type is required.',
    ].filter(Boolean)
  );
}

export function validateWorkspaceDraft(
  draft: WorkspaceDraft
): DraftValidationResult {
  return validationResult(
    [draft.name.trim() ? '' : 'Workspace name is required.'].filter(Boolean)
  );
}

export function validatePlanetaryWorldDraft(
  draft: PlanetaryWorldDraft
): DraftValidationResult {
  return validationResult(
    [
      draft.name.trim() ? '' : 'In-fiction world or planet name is required.',
    ].filter(Boolean)
  );
}

export function validateEntryTypeDraft(
  draft: EntryTypeDraft
): DraftValidationResult {
  return validationResult(
    [
      draft.title.trim() ? '' : 'Title is required.',
      draft.singularTitle.trim() ? '' : 'Singular title is required.',
    ].filter(Boolean)
  );
}

export function formatDraftValidationErrors(
  validation: DraftValidationResult
): string {
  return validation.ok ? '' : validation.errors.join(' ');
}
