import {
  entryDisplayCopy,
  formatUpdatedAt,
  getEntryEditorNewTitle,
} from './codexEntries';
import {
  getOrphanedEntries,
  getEntryRelationships,
  getRelationshipEntries,
  relationshipFeatureCopy,
  type RelationshipWithEntries,
} from './codexRelationships';
import {
  getSearchableEntries,
  getSearchResultContext,
  searchEntries,
  type SearchableEntry,
} from './codexSearch';
import { getIncompleteEntries } from './codexTemplates';
import { getRelationshipTextReviewItems } from './relationshipFields';
import {
  getReviewTraySummaryModel,
  type ReviewTraySummaryModel,
} from './reviewTray';
import { getCodexEntriesRoute, getCodexRelationshipsRoute } from './shell';
import type {
  WorldEntryStatus,
  WorldRelationship,
  WorldSectionConfig,
  WorldWorkspace,
} from './types';

export type WorkbenchRecordViewId =
  | 'all'
  | 'recent'
  | 'pinned'
  | 'incomplete'
  | 'unlinked'
  | 'needs-review'
  | 'archived';

export const workbenchRecordViewIds = [
  'all',
  'recent',
  'pinned',
  'incomplete',
  'unlinked',
  'needs-review',
  'archived',
] as const satisfies readonly WorkbenchRecordViewId[];

export const workbenchRecordIndexCopy = {
  layoutAriaLabel: 'Workbench records',
  recordIndexKicker: 'Record index',
  recordIndexTitle: 'Find and choose a record',
  searchRecordsLabel: 'Search records',
  searchRecordsPlaceholder: 'Search names, tags, notes, and fields',
  sectionFilterAccessibilityLabel: 'Filter Workbench by section',
  createRecordsAccessibilityLabel: 'Create records',
  viewsAccessibilityLabel: 'Workbench views',
  emptyViewTitle: 'No records in this view.',
  emptyViewDetail: 'Try another view or clear the current search.',
  inlineEditorKicker: 'Inline editor',
  noEditorTargetTitle: 'No editor target selected.',
  noEditorTargetDetail:
    'Select a record or choose a section before editing inline.',
  workbenchEditorAccessibilityLabel: 'Workbench editor',
} as const;

export function formatWorkbenchEditorAccessibilityLabel(
  section: Pick<WorldSectionConfig, 'singularTitle'> | null
): string {
  return section
    ? `${section.singularTitle} ${workbenchRecordIndexCopy.workbenchEditorAccessibilityLabel}`
    : workbenchRecordIndexCopy.workbenchEditorAccessibilityLabel;
}

export type WorkbenchRecordIndexItem = {
  editAccessibilityLabel: string;
  editLabel: string;
  id: string;
  name: string;
  reviewContextAccessibilityLabel: string;
  reviewContextLabel: string;
  sectionId: string;
  sectionTitle: string;
  selectAccessibilityLabel: string;
  selectLabel: string;
  route: string;
  editorRoute: string;
  contextText: string;
  summaryText: string;
  status: WorldEntryStatus;
  tags: readonly string[];
  tagsText: string;
  updatedAt: string;
  updatedText: string;
  pinned: boolean;
  relationshipCount: number;
  completionPercent: number | null;
  incompletePromptCount: number;
};

export type WorkbenchRecordView = {
  id: WorkbenchRecordViewId;
  title: string;
  label: string;
  count: number;
  countLabel: string;
  emptyTitle: string;
  emptyDetail: string;
  records: readonly WorkbenchRecordIndexItem[];
};

export type WorkbenchSelectedRecordContext = {
  record: WorkbenchRecordIndexItem | null;
  section: WorldSectionConfig | null;
  backToIndexLabel: string;
  completeLabel: string;
  completenessLabel: string;
  draftingPromptsTitle: string;
  editRecordAccessibilityLabel: string;
  editRecordLabel: string;
  emptyDetail: string;
  emptyTitle: string;
  kicker: string;
  linkedRecordsTitle: string;
  noSummaryText: string;
  relationshipsLabel: string;
  relationshipCount: number;
  relationshipStudioAccessibilityLabel: string | null;
  relationshipStudioLabel: string;
  relationshipStudioRoute: string | null;
  relationships: readonly RelationshipWithEntries[];
  relatedRecordChips: readonly WorkbenchEntityChip[];
  completionPercent: number | null;
  incompletePrompts: readonly string[];
  reviewSummaryTitle: string;
  reviewSummary: ReviewTraySummaryModel;
  sectionLabel: string;
  statusLabel: string;
};

export type WorkbenchRecordIndexModel = {
  records: readonly WorkbenchRecordIndexItem[];
  activeSectionId: string;
  copy: typeof workbenchRecordIndexCopy;
  sectionActions: readonly WorkbenchSectionAction[];
  views: readonly WorkbenchRecordView[];
  activeView: WorkbenchRecordView;
  selectedContext: WorkbenchSelectedRecordContext;
};

export type WorkbenchSectionAction = {
  sectionId: string;
  label: string;
  singularLabel: string;
  createLabel: string;
  recordCount: number;
  isActive: boolean;
  openRoute: string;
  createRoute: string;
};

export type WorkbenchRecordPickerItem = {
  id: string;
  label: string;
  detailText: string;
  sectionId: string;
  sectionTitle: string;
  selected: boolean;
};

export type WorkbenchRecordPickerModel = {
  query: string;
  items: readonly WorkbenchRecordPickerItem[];
  visibleItems: readonly WorkbenchRecordPickerItem[];
  selectedItems: readonly WorkbenchRecordPickerItem[];
  hiddenCount: number;
  emptyText: string;
};

export type WorkbenchEntityChip = {
  id: string;
  label: string;
  detailText: string;
  route: string;
  sectionId: string;
  sectionTitle: string;
  relationshipId?: string;
  relationshipType?: string;
};

export type WorkbenchRecordIndexOptions = {
  query?: string;
  sectionId?: string;
  selectedEntryId?: string;
  viewId?: WorkbenchRecordViewId;
  viewLimit?: number;
};

export type WorkbenchRecordPickerOptions = {
  excludedEntryIds?: readonly string[];
  includeArchived?: boolean;
  limit?: number;
  query?: string;
  selectedEntryIds?: readonly string[];
};

export const workbenchRecordViewLabels = {
  all: 'All',
  recent: 'Recent',
  pinned: 'Pinned',
  incomplete: 'Incomplete',
  unlinked: 'Unlinked',
  'needs-review': 'Needs Review',
  archived: 'Archived',
} as const satisfies Record<WorkbenchRecordViewId, string>;

export function isWorkbenchRecordViewId(
  value: string
): value is WorkbenchRecordViewId {
  return workbenchRecordViewIds.some((viewId) => viewId === value);
}

function getRelationshipCountsByEntryId(
  relationships: readonly WorldRelationship[]
): Map<string, number> {
  const counts = new Map<string, number>();
  for (const relationship of relationships) {
    counts.set(
      relationship.sourceEntryId,
      (counts.get(relationship.sourceEntryId) ?? 0) + 1
    );
    counts.set(
      relationship.targetEntryId,
      (counts.get(relationship.targetEntryId) ?? 0) + 1
    );
  }
  return counts;
}

function byUpdatedDesc(
  first: Pick<WorkbenchRecordIndexItem, 'updatedAt'>,
  second: Pick<WorkbenchRecordIndexItem, 'updatedAt'>
): number {
  return (
    new Date(second.updatedAt).getTime() - new Date(first.updatedAt).getTime()
  );
}

function buildWorkbenchRecordIndexItem({
  completionPercent,
  entry,
  incompletePromptCount,
  relationshipCount,
}: {
  completionPercent: number | null;
  entry: SearchableEntry;
  incompletePromptCount: number;
  relationshipCount: number;
}): WorkbenchRecordIndexItem {
  return {
    editAccessibilityLabel: `Edit ${entry.name}`,
    editLabel: 'Edit',
    id: entry.id,
    name: entry.name,
    reviewContextAccessibilityLabel: `Review context for ${entry.name}`,
    reviewContextLabel: 'Context',
    sectionId: entry.sectionId,
    sectionTitle: entry.sectionTitle,
    selectAccessibilityLabel: `Select ${entry.name}`,
    selectLabel: 'Select',
    route: getCodexEntriesRoute({
      entryId: entry.id,
      intent: 'context',
      query: entry.name,
      sectionId: entry.sectionId,
    }),
    editorRoute: getCodexEntriesRoute({
      sectionId: entry.sectionId,
      entryId: entry.id,
      intent: 'edit',
      query: entry.name,
    }),
    contextText: getSearchResultContext(entry),
    summaryText: entry.summary || entryDisplayCopy.emptySummary,
    status: entry.status,
    tags: entry.tags,
    tagsText: entry.tags.join(', ') || entryDisplayCopy.noTagsLabel,
    updatedAt: entry.updatedAt,
    updatedText: `${entryDisplayCopy.updatedPrefix} ${formatUpdatedAt(
      entry.updatedAt
    )}`,
    pinned: entry.pinned,
    relationshipCount,
    completionPercent,
    incompletePromptCount,
  };
}

export function getWorkbenchEntityChip(
  record: Pick<
    WorkbenchRecordIndexItem,
    'id' | 'name' | 'route' | 'sectionId' | 'sectionTitle'
  >,
  relationship?: Pick<WorldRelationship, 'id' | 'type'>
): WorkbenchEntityChip {
  return {
    id: record.id,
    label: record.name,
    detailText: relationship?.type
      ? `${relationship.type} - ${record.sectionTitle}`
      : record.sectionTitle,
    route: record.route,
    sectionId: record.sectionId,
    sectionTitle: record.sectionTitle,
    ...(relationship
      ? {
          relationshipId: relationship.id,
          relationshipType: relationship.type,
        }
      : {}),
  };
}

export function getWorkbenchRecordIndexItems(
  workspace: Pick<WorldWorkspace, 'codex' | 'entryTypes' | 'relationships'>
): WorkbenchRecordIndexItem[] {
  const completionByEntryId = new Map(
    getIncompleteEntries(
      getSearchableEntries(workspace.codex, workspace.entryTypes),
      workspace.entryTypes,
      workspace.relationships
    ).map((item) => [
      item.entry.id,
      {
        incompletePromptCount: item.prompts.length,
        percent: item.percent,
      },
    ])
  );
  const relationshipCountsByEntryId = getRelationshipCountsByEntryId(
    workspace.relationships
  );

  return getSearchableEntries(workspace.codex, workspace.entryTypes).map(
    (entry) => {
      const completion = completionByEntryId.get(entry.id);
      return buildWorkbenchRecordIndexItem({
        completionPercent: completion?.percent ?? null,
        entry,
        incompletePromptCount: completion?.incompletePromptCount ?? 0,
        relationshipCount: relationshipCountsByEntryId.get(entry.id) ?? 0,
      });
    }
  );
}

export function getWorkbenchSectionActions(
  workspace: Pick<WorldWorkspace, 'entryTypes'>,
  records: readonly Pick<WorkbenchRecordIndexItem, 'sectionId'>[],
  activeSectionId = ''
): WorkbenchSectionAction[] {
  return workspace.entryTypes.map((section) => ({
    sectionId: section.id,
    label: section.title,
    singularLabel: section.singularTitle,
    createLabel: getEntryEditorNewTitle(section),
    recordCount: records.filter((record) => record.sectionId === section.id)
      .length,
    isActive: section.id === activeSectionId,
    openRoute: getCodexEntriesRoute({ sectionId: section.id }),
    createRoute: getCodexEntriesRoute({
      sectionId: section.id,
      intent: 'new',
    }),
  }));
}

function limitRecords(
  records: readonly WorkbenchRecordIndexItem[],
  limit: number | undefined
): WorkbenchRecordIndexItem[] {
  return limit === undefined ? [...records] : records.slice(0, limit);
}

export function getWorkbenchRecordViews({
  records,
  unlinkedEntryIds,
  viewLimit,
}: {
  records: readonly WorkbenchRecordIndexItem[];
  unlinkedEntryIds: ReadonlySet<string>;
  viewLimit?: number;
}): WorkbenchRecordView[] {
  const visibleRecords = records.filter(
    (record) => record.status !== 'archived'
  );
  const recordsByView = {
    all: [...visibleRecords].sort(
      (first, second) =>
        first.sectionTitle.localeCompare(second.sectionTitle) ||
        first.name.localeCompare(second.name)
    ),
    recent: [...visibleRecords].sort(byUpdatedDesc),
    pinned: visibleRecords.filter((record) => record.pinned),
    incomplete: visibleRecords
      .filter((record) => record.completionPercent !== null)
      .sort(
        (first, second) =>
          (first.completionPercent ?? 100) - (second.completionPercent ?? 100)
      ),
    unlinked: visibleRecords.filter((record) =>
      unlinkedEntryIds.has(record.id)
    ),
    'needs-review': visibleRecords.filter(
      (record) => record.status === 'needs-review'
    ),
    archived: records.filter((record) => record.status === 'archived'),
  } as const satisfies Record<
    WorkbenchRecordViewId,
    readonly WorkbenchRecordIndexItem[]
  >;

  return (
    Object.keys(workbenchRecordViewLabels) as WorkbenchRecordViewId[]
  ).map((id) => {
    const count = recordsByView[id].length;
    return {
      id,
      title: `Workbench ${workbenchRecordViewLabels[id]}`,
      label: workbenchRecordViewLabels[id],
      count,
      countLabel: `${count} ${
        count === 1 ? 'record' : 'records'
      } in this review queue.`,
      emptyTitle: workbenchRecordIndexCopy.emptyViewTitle,
      emptyDetail: workbenchRecordIndexCopy.emptyViewDetail,
      records: limitRecords(recordsByView[id], viewLimit),
    };
  });
}

export function getWorkbenchSelectedRecordContext({
  records,
  selectedEntryId,
  workspace,
}: {
  records: readonly WorkbenchRecordIndexItem[];
  selectedEntryId?: string;
  workspace: Pick<WorldWorkspace, 'codex' | 'entryTypes' | 'relationships'>;
}): WorkbenchSelectedRecordContext {
  const record =
    (selectedEntryId
      ? records.find((candidate) => candidate.id === selectedEntryId)
      : null) ?? null;
  const section = record
    ? workspace.entryTypes.find(
        (candidate) => candidate.id === record.sectionId
      ) ?? null
    : null;
  const entryRelationships = record
    ? getEntryRelationships(
        workspace.relationships,
        workspace.codex,
        workspace.entryTypes,
        record.id
      )
    : [];
  const relationshipEntryById = new Map(
    getRelationshipEntries(workspace.codex, workspace.entryTypes).map(
      (entry) => [entry.id, entry]
    )
  );
  const relatedRecordChips = record
    ? entryRelationships.flatMap((relationship) => {
        const relatedEntryId =
          relationship.sourceEntryId === record.id
            ? relationship.targetEntryId
            : relationship.sourceEntryId;
        const relatedEntry = relationshipEntryById.get(relatedEntryId);
        if (!relatedEntry) {
          return [];
        }
        return [
          getWorkbenchEntityChip(
            {
              id: relatedEntry.id,
              name: relatedEntry.name,
              route: getCodexEntriesRoute({
                entryId: relatedEntry.id,
                intent: 'context',
                query: relatedEntry.name,
                sectionId: relatedEntry.sectionId,
              }),
              sectionId: relatedEntry.sectionId,
              sectionTitle: relatedEntry.sectionTitle,
            },
            relationship
          ),
        ];
      })
    : [];
  const incompleteEntry = record
    ? getIncompleteEntries(
        getSearchableEntries(workspace.codex, workspace.entryTypes).filter(
          (entry) => entry.id === record.id
        ),
        workspace.entryTypes,
        workspace.relationships
      )[0] ?? null
    : null;
  const legacyTextItemCount = record
    ? getRelationshipTextReviewItems({
        codex: workspace.codex,
        entryIds: [record.id],
        sections: workspace.entryTypes,
      }).length
    : 0;
  const incompletePromptCount = incompleteEntry?.prompts.length ?? 0;
  const reviewSummary = getReviewTraySummaryModel([
    {
      id: 'drafting-prompts',
      title: 'Drafting prompts',
      count: incompletePromptCount,
      countLabel: `${incompletePromptCount} ${
        incompletePromptCount === 1 ? 'prompt' : 'prompts'
      }`,
      detail:
        incompletePromptCount > 0
          ? 'Open prompts point to fields that would strengthen this record.'
          : 'No drafting prompts remain for this record.',
    },
    {
      id: 'legacy-link-text',
      title: 'Legacy link text',
      count: legacyTextItemCount,
      countLabel: `${legacyTextItemCount} ${
        legacyTextItemCount === 1 ? 'field' : 'fields'
      }`,
      detail:
        legacyTextItemCount > 0
          ? 'Relationship-backed text can be reviewed or migrated into links.'
          : 'No legacy relationship-backed text is waiting for review.',
    },
  ]);

  return {
    record,
    section,
    backToIndexLabel: 'Back to Index',
    completeLabel: 'Complete',
    completenessLabel: 'Completeness',
    draftingPromptsTitle: 'Drafting prompts',
    editRecordAccessibilityLabel: record
      ? `Edit ${record.name}`
      : 'Edit selected record',
    editRecordLabel: 'Edit Record',
    emptyDetail:
      'Select a record to review its section, relationship count, and drafting prompts before opening the editor.',
    emptyTitle: 'No record selected',
    kicker: 'Selected context',
    linkedRecordsTitle: 'Linked records',
    noSummaryText: 'No summary has been drafted yet.',
    relationshipsLabel: 'Relationships',
    relationshipCount: entryRelationships.length,
    relationshipStudioAccessibilityLabel: record
      ? `${relationshipFeatureCopy.manageLinksLabel} for ${record.name}`
      : null,
    relationshipStudioLabel: relationshipFeatureCopy.manageLinksLabel,
    relationshipStudioRoute: record
      ? getCodexRelationshipsRoute({
          entryId: record.id,
          entryQuery: record.name,
        })
      : null,
    relationships: entryRelationships,
    relatedRecordChips,
    completionPercent:
      incompleteEntry?.percent ?? record?.completionPercent ?? null,
    incompletePrompts: incompleteEntry?.prompts ?? [],
    reviewSummaryTitle: 'Review summary',
    reviewSummary,
    sectionLabel: 'Section',
    statusLabel: 'Status',
  };
}

export function getWorkbenchRecordIndexModel(
  workspace: Pick<WorldWorkspace, 'codex' | 'entryTypes' | 'relationships'>,
  options: WorkbenchRecordIndexOptions = {}
): WorkbenchRecordIndexModel {
  const sourceRecords = getWorkbenchRecordIndexItems(workspace);
  const activeSectionId = workspace.entryTypes.some(
    (section) => section.id === options.sectionId
  )
    ? options.sectionId ?? ''
    : '';
  const sectionRecords = activeSectionId
    ? sourceRecords.filter((record) => record.sectionId === activeSectionId)
    : sourceRecords;
  const records = options.query
    ? getSearchableWorkbenchRecords(workspace, sectionRecords, options.query)
    : sectionRecords;
  const unlinkedEntryIds = new Set(
    getOrphanedEntries(
      workspace.relationships,
      workspace.codex,
      workspace.entryTypes
    ).map((entry) => entry.id)
  );
  const views = getWorkbenchRecordViews({
    records,
    unlinkedEntryIds,
    viewLimit: options.viewLimit,
  });
  const activeView =
    views.find((view) => view.id === options.viewId) ?? views[0]!;

  return {
    records,
    activeSectionId,
    copy: workbenchRecordIndexCopy,
    sectionActions: getWorkbenchSectionActions(
      workspace,
      sourceRecords,
      activeSectionId
    ),
    views,
    activeView,
    selectedContext: getWorkbenchSelectedRecordContext({
      records: sourceRecords,
      selectedEntryId: options.selectedEntryId,
      workspace,
    }),
  };
}

function getSearchableWorkbenchRecords(
  workspace: Pick<WorldWorkspace, 'codex' | 'entryTypes'>,
  records: readonly WorkbenchRecordIndexItem[],
  query: string
): WorkbenchRecordIndexItem[] {
  const resultIds = new Set(
    searchEntries(
      getSearchableEntries(workspace.codex, workspace.entryTypes),
      workspace.entryTypes,
      query
    ).map((entry) => entry.id)
  );
  return records.filter((record) => resultIds.has(record.id));
}

export function getWorkbenchRecordPickerModel(
  workspace: Pick<WorldWorkspace, 'codex' | 'entryTypes' | 'relationships'>,
  options: WorkbenchRecordPickerOptions = {}
): WorkbenchRecordPickerModel {
  const {
    excludedEntryIds = [],
    includeArchived = false,
    limit,
    query = '',
    selectedEntryIds = [],
  } = options;
  const excludedIds = new Set(excludedEntryIds);
  const selectedIds = new Set(selectedEntryIds);
  const records = getWorkbenchRecordIndexItems(workspace)
    .filter((record) => includeArchived || record.status !== 'archived')
    .filter((record) => !excludedIds.has(record.id));
  const filteredRecords = query
    ? getSearchableWorkbenchRecords(workspace, records, query)
    : records;
  const items = filteredRecords.map((record) => ({
    id: record.id,
    label: record.name,
    detailText: `${record.sectionTitle} - ${record.summaryText}`,
    sectionId: record.sectionId,
    sectionTitle: record.sectionTitle,
    selected: selectedIds.has(record.id),
  }));
  const visibleItems = limit === undefined ? items : items.slice(0, limit);
  const selectedItems = items.filter((item) => item.selected);

  return {
    query,
    items,
    visibleItems,
    selectedItems,
    hiddenCount: Math.max(items.length - visibleItems.length, 0),
    emptyText: query.trim()
      ? 'No records match this picker search.'
      : 'No records are available for this picker.',
  };
}
