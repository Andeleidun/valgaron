import type { EntryDraft } from './codexEntries';
import type { RelationshipDraft } from './codexRelationships';
import type {
  WorldSectionConfig,
  WorldVocabulary,
  WorldWorkspaceSchema,
} from './types';
import type {
  EntryTypeDraft,
  PlanetaryWorldDraft,
  WorkspaceDraft,
} from './workspaceManagement';
import { MAX_IMAGES_PER_ENTRY, validateImageReference } from './imageAssets';

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
  draft: EntryDraft,
  options: { workspaceSchema?: WorldWorkspaceSchema } = {}
): DraftValidationResult {
  const schemaErrors = getRestrictedVocabularyErrors({
    draft,
    section,
    workspaceSchema: options.workspaceSchema,
  });
  const images = draft.images ?? [];
  const imageErrors = [
    images.length > MAX_IMAGES_PER_ENTRY
      ? `Entries can contain up to ${MAX_IMAGES_PER_ENTRY} images.`
      : '',
    ...images.map((image) => validateImageReference(image) ?? ''),
  ].filter(Boolean);
  return validationResult(
    [
      draft.name.trim() ? '' : `${section.singularTitle} name is required.`,
      ...schemaErrors,
      ...imageErrors,
    ].filter(Boolean)
  );
}

function getRestrictedVocabularyErrors({
  draft,
  section,
  workspaceSchema,
}: {
  draft: EntryDraft;
  section: WorldSectionConfig;
  workspaceSchema?: WorldWorkspaceSchema;
}): string[] {
  if (!workspaceSchema) {
    return [];
  }
  const fieldOverrides = workspaceSchema.fieldOverrides[section.id] ?? {};
  const vocabularyById = new Map(
    workspaceSchema.vocabularies.map((vocabulary) => [
      vocabulary.id,
      vocabulary,
    ])
  );
  return section.detailFields.flatMap((field) => {
    const override = fieldOverrides[field.key];
    if (override?.vocabularyMode !== 'restricted' || !override.vocabularyId) {
      return [];
    }
    const value = draft.details[field.key]?.trim() ?? '';
    if (!value) {
      return [];
    }
    const vocabulary = vocabularyById.get(override.vocabularyId);
    if (!vocabulary) {
      return [];
    }
    const activeTerms = getActiveVocabularyTerms(vocabulary);
    return activeTerms.has(value.toLocaleLowerCase())
      ? []
      : [
          `${override.label ?? field.label} must use an active ${
            vocabulary.name
          } value.${formatVocabularyExamples(vocabulary)}`,
        ];
  });
}

function getActiveVocabularyTerms(vocabulary: WorldVocabulary): Set<string> {
  const terms = new Set<string>();
  for (const value of vocabulary.values) {
    if (value.status !== 'active') {
      continue;
    }
    const label = value.label.trim();
    if (label) {
      terms.add(label.toLocaleLowerCase());
    }
    for (const alias of value.aliases) {
      const normalizedAlias = alias.trim();
      if (normalizedAlias) {
        terms.add(normalizedAlias.toLocaleLowerCase());
      }
    }
  }
  return terms;
}

function formatVocabularyExamples(vocabulary: WorldVocabulary): string {
  const examples = vocabulary.values
    .filter((value) => value.status === 'active')
    .map((value) => value.label.trim())
    .filter(Boolean)
    .slice(0, 5);
  return examples.length > 0 ? ` Try ${examples.join(', ')}.` : '';
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
