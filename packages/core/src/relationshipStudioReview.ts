import {
  findEntryById,
  getRelationshipDiagnosticsModel,
  relationshipFeatureCopy,
} from './codexRelationships';
import {
  getRelationshipTextReviewItems,
  relationshipTextReviewCopy,
  type RelationshipTextReviewItem,
} from './relationshipFields';
import {
  getReviewTraySummaryModel,
  type ReviewTraySummaryModel,
} from './reviewTray';
import type {
  WorldCodex,
  WorldRelationship,
  WorldSectionConfig,
} from './types';

type RelationshipStudioReviewWorkspace = {
  codex: WorldCodex;
  entryTypes: readonly WorldSectionConfig[];
  relationships: readonly WorldRelationship[];
};

export type RelationshipStudioReviewModel = ReturnType<
  typeof getRelationshipDiagnosticsModel
> & {
  duplicateRelationshipGroups: RelationshipDuplicateGroup[];
  hasIssues: boolean;
  legacyTextExactItemCount: number;
  legacyTextItems: RelationshipTextReviewItem[];
  reviewSummary: ReviewTraySummaryModel;
};

export type RelationshipDuplicateGroup = {
  id: string;
  retainedRelationshipId: string;
  duplicateRelationshipIds: string[];
  duplicateCount: number;
  sourceName: string;
  targetName: string;
  type: string;
  status: string;
  note: string;
  directional: boolean;
};

function getDuplicateRelationshipKey(relationship: WorldRelationship): string {
  const sourceId = relationship.sourceEntryId;
  const targetId = relationship.targetEntryId;
  const endpointKey = relationship.directional
    ? `${sourceId}->${targetId}`
    : [sourceId, targetId].sort().join('<->');
  return [
    endpointKey,
    relationship.directional ? 'directional' : 'undirected',
    relationship.type.trim().toLowerCase(),
    relationship.status,
    relationship.note.trim(),
  ].join('|');
}

export function getDuplicateRelationshipGroups({
  codex,
  entryTypes,
  relationships,
}: RelationshipStudioReviewWorkspace): RelationshipDuplicateGroup[] {
  const groups = new Map<string, WorldRelationship[]>();
  for (const relationship of relationships) {
    const key = getDuplicateRelationshipKey(relationship);
    groups.set(key, [...(groups.get(key) ?? []), relationship]);
  }

  return Array.from(groups.entries()).flatMap(([key, grouped]) => {
    if (grouped.length < 2) {
      return [];
    }
    const sorted = [...grouped].sort(
      (first, second) =>
        first.createdAt.localeCompare(second.createdAt) ||
        first.id.localeCompare(second.id)
    );
    const retained = sorted[0];
    const sourceName =
      findEntryById(codex, entryTypes, retained.sourceEntryId)?.name ??
      retained.sourceEntryId;
    const targetName =
      findEntryById(codex, entryTypes, retained.targetEntryId)?.name ??
      retained.targetEntryId;

    return [
      {
        id: key,
        retainedRelationshipId: retained.id,
        duplicateRelationshipIds: sorted.slice(1).map((item) => item.id),
        duplicateCount: sorted.length - 1,
        sourceName,
        targetName,
        type: retained.type,
        status: retained.status,
        note: retained.note,
        directional: retained.directional,
      },
    ];
  });
}

export function getRelationshipStudioReviewModel(
  workspace: RelationshipStudioReviewWorkspace
): RelationshipStudioReviewModel {
  const diagnostics = getRelationshipDiagnosticsModel(workspace);
  const legacyTextItems = getRelationshipTextReviewItems({
    codex: workspace.codex,
    sections: workspace.entryTypes,
  });
  const duplicateRelationshipGroups = getDuplicateRelationshipGroups(workspace);
  const legacyTextExactItemCount = legacyTextItems.filter(
    (item) => item.exactMatchCount > 0
  ).length;
  const reviewSummary = getReviewTraySummaryModel([
    {
      id: 'broken-relationships',
      title: relationshipFeatureCopy.brokenReferencesLabel,
      count: diagnostics.brokenRelationships.length,
      detail: relationshipFeatureCopy.brokenReferencesDetail,
      severity: 'critical',
    },
    {
      id: 'orphaned-records',
      title: relationshipFeatureCopy.orphanedRecordsLabel,
      count: diagnostics.orphanedEntries.length,
      detail: relationshipFeatureCopy.orphanedRecordsDetail,
    },
    {
      id: 'duplicate-relationships',
      title: relationshipFeatureCopy.duplicateRelationshipsLabel,
      count: duplicateRelationshipGroups.length,
      countLabel: `${duplicateRelationshipGroups.length} ${
        duplicateRelationshipGroups.length === 1 ? 'group' : 'groups'
      }`,
      detail: relationshipFeatureCopy.duplicateRelationshipsDetail,
    },
    {
      id: 'legacy-text-links',
      title: relationshipTextReviewCopy.title,
      count: legacyTextItems.length,
      detail: `${legacyTextExactItemCount} exact-match cleanup ${
        legacyTextExactItemCount === 1 ? 'item' : 'items'
      } ready for batch migration.`,
    },
  ]);

  return {
    ...diagnostics,
    duplicateRelationshipGroups,
    hasIssues: reviewSummary.hasIssues,
    legacyTextExactItemCount,
    legacyTextItems,
    reviewSummary,
  };
}
