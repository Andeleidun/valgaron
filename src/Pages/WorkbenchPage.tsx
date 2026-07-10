import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  commitEntryDraftTransaction,
  draftFromEntry,
  formatExpansionControlLabel,
  formatHiddenCountText,
  formatWorkbenchEditorAccessibilityLabel,
  duplicateEntry,
  getCodexScreenIntro,
  getEntries,
  getEntryEditorTitle,
  getLimitedResultModel,
  getWorkbenchRecordIndexModel,
  isWorkbenchRecordViewId,
  workbenchDisplayLimits,
  type EntryDraft,
  type WorkbenchRecordIndexItem,
  type WorkbenchRecordViewId,
  type WorldEntry,
  type WorldRelationship,
  type WorldWorkspace,
} from '@valgaron/core';
import {
  ConfirmationDialog,
  EntryDetail,
  EntryForm,
} from '../Components/Codex/CodexEntryViews';
import {
  confirmDiscardUnsavedChanges,
  useUnsavedChangesWarning,
} from '../Utlilities/unsavedChanges';

const workbenchLayoutStorageKey = 'valgaron:workbench-layout:v1';

type WorkbenchLayoutPreferences = {
  isContextCollapsed: boolean;
  isIndexCollapsed: boolean;
};

function readWorkbenchLayoutPreferences(): WorkbenchLayoutPreferences {
  if (typeof window === 'undefined') {
    return { isContextCollapsed: false, isIndexCollapsed: false };
  }

  try {
    const storedValue = window.localStorage.getItem(workbenchLayoutStorageKey);
    if (!storedValue) {
      return { isContextCollapsed: false, isIndexCollapsed: false };
    }
    const parsedValue: unknown = JSON.parse(storedValue);
    if (!parsedValue || typeof parsedValue !== 'object') {
      return { isContextCollapsed: false, isIndexCollapsed: false };
    }
    const preferences = parsedValue as Partial<WorkbenchLayoutPreferences>;
    return {
      isContextCollapsed: preferences.isContextCollapsed === true,
      isIndexCollapsed: preferences.isIndexCollapsed === true,
    };
  } catch {
    return { isContextCollapsed: false, isIndexCollapsed: false };
  }
}

function RecordCard({
  isSelected,
  record,
  onSelect,
}: {
  isSelected: boolean;
  record: WorkbenchRecordIndexItem;
  onSelect: () => void;
}) {
  return (
    <article className={`vwb-entry-card ${isSelected ? 'is-selected' : ''}`}>
      <div className="vwb-entry-card-header">
        <div>
          <p className="vwb-entry-kind">{record.contextText}</p>
          <h3>{record.name}</h3>
        </div>
        <div className="vwb-action-row">
          <button
            className="vwb-secondary-button"
            type="button"
            onClick={onSelect}
            aria-label={record.selectAccessibilityLabel}
          >
            {record.selectLabel}
          </button>
          <Link
            aria-label={record.editAccessibilityLabel}
            className="vwb-secondary-button"
            to={record.editorRoute}
          >
            {record.editLabel}
          </Link>
        </div>
      </div>
      <p>{record.summaryText}</p>
      <small className="vwb-entry-card-meta">
        <span>{record.sectionTitle}</span>
        <span>{record.tagsText}</span>
        <span>{record.updatedText}</span>
      </small>
    </article>
  );
}

export function WorkbenchPage({
  activeWorld,
  onArchiveEntry,
  onDeleteEntry,
  onDeleteRelationship,
  onSaveEntry,
  onSaveRelationship,
}: {
  activeWorld: WorldWorkspace;
  onArchiveEntry: (entry: WorldEntry, archived: boolean) => void;
  onDeleteEntry: (entry: WorldEntry) => void;
  onDeleteRelationship: (relationshipId: string) => void;
  onSaveEntry: (entry: WorldEntry) => void;
  onSaveRelationship: (relationship: WorldRelationship) => void;
}) {
  const intro = getCodexScreenIntro('entries');
  const [searchParams, setSearchParams] = useSearchParams();
  const routeQuery = searchParams.get('query') ?? '';
  const routeSelectedEntryId = searchParams.get('entryId') ?? '';
  const routeSectionId = searchParams.get('sectionId') ?? '';
  const routeViewId = searchParams.get('view') ?? '';
  const routeIntent = searchParams.get('intent') ?? '';
  const routeStateKey = [
    routeQuery,
    routeSelectedEntryId,
    routeSectionId,
    routeIntent,
    routeViewId,
  ].join('|');
  const appliedRouteStateKeyRef = useRef(routeStateKey);
  const contextHeadingRef = useRef<HTMLHeadingElement>(null);
  const indexHeadingRef = useRef<HTMLHeadingElement>(null);
  const [query, setQuery] = useState(() => searchParams.get('query') ?? '');
  const [selectedEntryId, setSelectedEntryId] = useState(
    () => searchParams.get('entryId') ?? ''
  );
  const [activeSectionId, setActiveSectionId] = useState(
    () => searchParams.get('sectionId') ?? ''
  );
  const [activeViewId, setActiveViewId] = useState<WorkbenchRecordViewId>(() =>
    isWorkbenchRecordViewId(routeViewId) ? routeViewId : 'recent'
  );
  const [showAllDraftingPrompts, setShowAllDraftingPrompts] = useState(false);
  const [isEntryFormDirty, setIsEntryFormDirty] = useState(false);
  const [templateDraft, setTemplateDraft] = useState<EntryDraft | null>(null);
  const [templateSectionId, setTemplateSectionId] = useState(() =>
    routeIntent === 'new' ? routeSectionId : ''
  );
  const [entryPendingDelete, setEntryPendingDelete] =
    useState<WorldEntry | null>(null);
  const [layoutPreferences, setLayoutPreferences] =
    useState<WorkbenchLayoutPreferences>(readWorkbenchLayoutPreferences);
  const model = useMemo(
    () =>
      getWorkbenchRecordIndexModel(activeWorld, {
        query,
        sectionId: activeSectionId,
        selectedEntryId,
        viewId: activeViewId,
        viewLimit: workbenchDisplayLimits.recordViewRows,
      }),
    [activeSectionId, activeViewId, activeWorld, query, selectedEntryId]
  );
  const selected = model.selectedContext;
  const activeSection = model.sectionActions.find(
    (action) => action.sectionId === model.activeSectionId
  );
  const totalRecordCount = model.sectionActions.reduce(
    (count, action) => count + action.recordCount,
    0
  );
  const draftingPromptModel = getLimitedResultModel(
    selected.incompletePrompts,
    showAllDraftingPrompts
      ? selected.incompletePrompts.length
      : workbenchDisplayLimits.selectedDraftingPrompts
  );
  const visibleDraftingPrompts = draftingPromptModel.visibleItems;
  const hiddenDraftingPromptCount = draftingPromptModel.hiddenCount;
  const selectedEntry =
    selected.section && selected.record
      ? getEntries(activeWorld.codex, selected.section.id).find(
          (entry) => entry.id === selected.record?.id
        ) ?? null
      : null;
  const templateSection =
    templateSectionId.length > 0
      ? activeWorld.entryTypes.find(
          (section) => section.id === templateSectionId
        )
      : null;
  const editorSection = templateSection ?? selected.section;
  const editorEntry = templateDraft ? null : selectedEntry;
  const isWorkbenchEmptyEditor = !editorSection && !selected.record;
  const editorSectionEntries = editorSection
    ? getEntries(activeWorld.codex, editorSection.id)
    : [];
  const hasCollapsedDashboardCards =
    layoutPreferences.isIndexCollapsed || layoutPreferences.isContextCollapsed;

  useUnsavedChangesWarning(isEntryFormDirty);

  useEffect(() => {
    setShowAllDraftingPrompts(false);
  }, [selected.record?.id]);

  useEffect(() => {
    try {
      window.localStorage.setItem(
        workbenchLayoutStorageKey,
        JSON.stringify(layoutPreferences)
      );
    } catch {
      // Layout preferences are optional when browser storage is unavailable.
    }
  }, [layoutPreferences]);

  const resetInlineEditor = () => {
    setTemplateDraft(null);
    setTemplateSectionId('');
    setIsEntryFormDirty(false);
  };

  useEffect(() => {
    if (appliedRouteStateKeyRef.current === routeStateKey) {
      return;
    }

    const routeWillReplaceEditor =
      routeSelectedEntryId !== selectedEntryId ||
      routeSectionId !== activeSectionId ||
      routeIntent === 'new';
    const applyRouteState = () => {
      setQuery(routeQuery);
      setSelectedEntryId(routeIntent === 'new' ? '' : routeSelectedEntryId);
      setActiveSectionId(routeSectionId);
      setActiveViewId(
        isWorkbenchRecordViewId(routeViewId) ? routeViewId : 'recent'
      );
      if (routeIntent === 'new') {
        setTemplateDraft(null);
        setTemplateSectionId(routeSectionId);
        setIsEntryFormDirty(false);
      } else if (routeWillReplaceEditor) {
        resetInlineEditor();
      }
      appliedRouteStateKeyRef.current = routeStateKey;
    };

    if (
      routeWillReplaceEditor &&
      isEntryFormDirty &&
      !confirmDiscardUnsavedChanges(true)
    ) {
      appliedRouteStateKeyRef.current = routeStateKey;
      return;
    }

    applyRouteState();
  }, [
    activeSectionId,
    isEntryFormDirty,
    routeQuery,
    routeIntent,
    routeSectionId,
    routeSelectedEntryId,
    routeStateKey,
    routeViewId,
    selectedEntryId,
  ]);

  const runAfterEditorDiscard = (action: () => void) => {
    if (!confirmDiscardUnsavedChanges(isEntryFormDirty)) {
      return;
    }
    resetInlineEditor();
    action();
  };

  const updateWorkbenchRoute = ({
    entryId = selectedEntryId,
    intent,
    query: nextQuery = query,
    sectionId = activeSectionId,
    viewId = activeViewId,
  }: {
    entryId?: string;
    intent?: 'context' | 'edit' | 'new';
    query?: string;
    sectionId?: string;
    viewId?: WorkbenchRecordViewId;
  }) => {
    const nextParams = new URLSearchParams();
    if (sectionId) {
      nextParams.set('sectionId', sectionId);
    }
    if (viewId !== 'recent') {
      nextParams.set('view', viewId);
    }
    if (entryId) {
      nextParams.set('entryId', entryId);
      nextParams.set('intent', intent ?? 'context');
    } else if (intent === 'new') {
      nextParams.set('intent', intent);
    }
    if (nextQuery.trim()) {
      nextParams.set('query', nextQuery);
    }
    setSearchParams(nextParams);
  };

  const chooseSection = (sectionId: string) => {
    runAfterEditorDiscard(() => {
      setActiveSectionId(sectionId);
      setSelectedEntryId('');
      setActiveViewId('recent');
      updateWorkbenchRoute({ entryId: '', sectionId, viewId: 'recent' });
    });
  };
  const chooseRecord = (record: WorkbenchRecordIndexItem) => {
    runAfterEditorDiscard(() => {
      setActiveSectionId(record.sectionId);
      setSelectedEntryId(record.id);
      updateWorkbenchRoute({
        entryId: record.id,
        sectionId: record.sectionId,
      });
    });
  };

  const startInlineCreate = (sectionId: string) => {
    runAfterEditorDiscard(() => {
      setActiveSectionId(sectionId);
      setSelectedEntryId('');
      setTemplateDraft(null);
      setTemplateSectionId(sectionId);
      setActiveViewId('recent');
      updateWorkbenchRoute({
        entryId: '',
        intent: 'new',
        sectionId,
        viewId: 'recent',
      });
    });
  };

  const restoreDashboardCard = (card: 'context' | 'index') => {
    setLayoutPreferences((current) => ({
      ...current,
      [card === 'context' ? 'isContextCollapsed' : 'isIndexCollapsed']: false,
    }));
    window.requestAnimationFrame(() => {
      (card === 'context'
        ? contextHeadingRef.current
        : indexHeadingRef.current
      )?.focus();
    });
  };

  return (
    <main className="vwb-main" id="main-content" tabIndex={-1}>
      <section className="vwb-panel vwb-section-intro">
        <p className="vwb-kicker">{intro.kicker}</p>
        <h1>{intro.title}</h1>
        <p>{intro.detail}</p>
      </section>

      <div
        className="vwb-dashboard-toolbar"
        aria-label="Workbench layout controls"
        role="group"
      >
        <div className="vwb-dashboard-toolbar-summary">
          <strong>Workspace view</strong>
          <span>
            {editorSection
              ? `Editing ${editorSection.title}`
              : 'Browse and select a record to begin drafting.'}
          </span>
        </div>
        <div className="vwb-dashboard-toolbar-actions">
          <button
            className="vwb-secondary-button"
            type="button"
            onClick={() =>
              setLayoutPreferences({
                isContextCollapsed: true,
                isIndexCollapsed: true,
              })
            }
            disabled={!editorSection}
          >
            Focus editor
          </button>
          <button
            className="vwb-secondary-button"
            type="button"
            onClick={() =>
              setLayoutPreferences({
                isContextCollapsed: false,
                isIndexCollapsed: false,
              })
            }
            disabled={!hasCollapsedDashboardCards}
          >
            Expand all
          </button>
        </div>
      </div>

      {hasCollapsedDashboardCards ? (
        <div className="vwb-dashboard-shelf" aria-label="Collapsed cards">
          <span className="vwb-dashboard-shelf-label">Collapsed</span>
          {layoutPreferences.isIndexCollapsed ? (
            <button
              className="vwb-dashboard-shelf-item"
              type="button"
              onClick={() => restoreDashboardCard('index')}
            >
              Records · {model.activeView.count}
            </button>
          ) : null}
          {layoutPreferences.isContextCollapsed ? (
            <button
              className="vwb-dashboard-shelf-item"
              type="button"
              onClick={() => restoreDashboardCard('context')}
            >
              Record context
              {selected.reviewSummary.hasIssues
                ? ` · ${selected.reviewSummary.totalIssueCount} issues`
                : ''}
            </button>
          ) : null}
        </div>
      ) : null}

      <section
        className={[
          'vwb-workbench-layout',
          isWorkbenchEmptyEditor ? 'is-empty-editor' : '',
          layoutPreferences.isIndexCollapsed ? 'is-index-collapsed' : '',
        ]
          .filter(Boolean)
          .join(' ')}
        aria-label={model.copy.layoutAriaLabel}
      >
        <div
          className="vwb-panel vwb-workbench-index-panel"
          hidden={layoutPreferences.isIndexCollapsed}
        >
          <div className="vwb-section-heading">
            <div>
              <p className="vwb-kicker">{model.copy.recordIndexKicker}</p>
              <h2 ref={indexHeadingRef} tabIndex={-1}>
                {model.copy.recordIndexTitle}
              </h2>
            </div>
            <button
              className="vwb-secondary-button"
              type="button"
              onClick={() =>
                setLayoutPreferences((current) => ({
                  ...current,
                  isIndexCollapsed: true,
                }))
              }
            >
              Collapse records
            </button>
          </div>

          <label className="vwb-search-field">
            {model.copy.searchRecordsLabel}
            <input
              value={query}
              onChange={(event) => {
                const nextQuery = event.target.value;
                setQuery(nextQuery);
                updateWorkbenchRoute({ query: nextQuery });
              }}
              placeholder={model.copy.searchRecordsPlaceholder}
              type="search"
            />
          </label>

          <div
            className="vwb-tag-filter-group vwb-workbench-section-list"
            aria-label={model.copy.sectionFilterAccessibilityLabel}
          >
            <button
              className={`vwb-tag-filter ${
                model.activeSectionId ? '' : 'is-active'
              }`}
              type="button"
              aria-pressed={!model.activeSectionId}
              onClick={() => chooseSection('')}
            >
              All records ({totalRecordCount})
            </button>
            {model.sectionActions.map((action) => (
              <button
                className={`vwb-tag-filter ${
                  action.isActive ? 'is-active' : ''
                }`}
                key={action.sectionId}
                type="button"
                aria-pressed={action.isActive}
                onClick={() => chooseSection(action.sectionId)}
              >
                {action.label} ({action.recordCount})
              </button>
            ))}
          </div>

          <div
            className="vwb-workbench-create-row"
            aria-label={model.copy.createRecordsAccessibilityLabel}
          >
            {(activeSection ? [activeSection] : model.sectionActions).map(
              (action) => (
                <button
                  className="vwb-secondary-button"
                  key={action.sectionId}
                  type="button"
                  onClick={() => startInlineCreate(action.sectionId)}
                >
                  {action.createLabel}
                </button>
              )
            )}
          </div>

          <div
            className="vwb-tag-filter-group vwb-workbench-view-list"
            aria-label={model.copy.viewsAccessibilityLabel}
          >
            {model.views.map((view) => (
              <button
                className={`vwb-tag-filter ${
                  view.id === model.activeView.id ? 'is-active' : ''
                }`}
                key={view.id}
                type="button"
                aria-pressed={view.id === model.activeView.id}
                onClick={() => {
                  setActiveViewId(view.id);
                  updateWorkbenchRoute({ viewId: view.id });
                }}
              >
                {view.label} ({view.count})
              </button>
            ))}
          </div>

          <div className="vwb-entry-list">
            {model.activeView.records.length > 0 ? (
              model.activeView.records.map((record) => (
                <RecordCard
                  isSelected={record.id === selected.record?.id}
                  key={record.id}
                  record={record}
                  onSelect={() => chooseRecord(record)}
                />
              ))
            ) : (
              <div className="vwb-empty-results" role="status">
                <strong>{model.activeView.emptyTitle}</strong>
                <p>{model.activeView.emptyDetail}</p>
              </div>
            )}
          </div>
        </div>

        {editorSection ? (
          <section
            className="vwb-panel vwb-workbench-editor-panel"
            aria-label={formatWorkbenchEditorAccessibilityLabel(editorSection)}
          >
            <>
              <div className="vwb-section-heading">
                <div>
                  <p className="vwb-kicker">{model.copy.inlineEditorKicker}</p>
                  <h2>
                    {getEntryEditorTitle({
                      section: editorSection,
                      selectedEntry: editorEntry,
                    })}
                  </h2>
                </div>
              </div>
              {editorEntry ? (
                <EntryDetail
                  codex={activeWorld.codex}
                  entry={editorEntry}
                  relationships={activeWorld.relationships}
                  section={editorSection}
                  sections={activeWorld.entryTypes}
                  workspaceSchema={activeWorld.schema}
                />
              ) : null}
              <EntryForm
                key={`${editorSection.id}-${
                  editorEntry?.id ?? templateDraft?.name ?? 'new'
                }`}
                codex={activeWorld.codex}
                initialDraft={templateDraft ?? undefined}
                onArchive={(entry) => {
                  onArchiveEntry(entry, true);
                  setSelectedEntryId('');
                  resetInlineEditor();
                  updateWorkbenchRoute({ entryId: '' });
                }}
                onCancel={() => {
                  setSelectedEntryId('');
                  resetInlineEditor();
                  updateWorkbenchRoute({ entryId: '' });
                }}
                onDelete={(entry) => setEntryPendingDelete(entry)}
                onDeleteRelationship={onDeleteRelationship}
                onDirtyChange={setIsEntryFormDirty}
                onDuplicate={(entry) => {
                  const duplicatedEntry = duplicateEntry(editorSection, entry);
                  onSaveEntry(duplicatedEntry);
                  setActiveSectionId(editorSection.id);
                  setSelectedEntryId(duplicatedEntry.id);
                  resetInlineEditor();
                  updateWorkbenchRoute({
                    entryId: duplicatedEntry.id,
                    sectionId: editorSection.id,
                  });
                }}
                onRestore={(entry) => {
                  onArchiveEntry(entry, false);
                  setActiveSectionId(editorSection.id);
                  setSelectedEntryId(entry.id);
                  resetInlineEditor();
                  updateWorkbenchRoute({
                    entryId: entry.id,
                    sectionId: editorSection.id,
                  });
                }}
                onSave={(entry) => {
                  onSaveEntry(entry);
                  setActiveSectionId(editorSection.id);
                  setSelectedEntryId(entry.id);
                  resetInlineEditor();
                  updateWorkbenchRoute({
                    entryId: entry.id,
                    sectionId: editorSection.id,
                  });
                }}
                onSaveDraft={(
                  draft,
                  existingEntry,
                  stagedRelationships = []
                ) => {
                  const result = commitEntryDraftTransaction({
                    codex: activeWorld.codex,
                    entryDraft: draft,
                    existingEntry,
                    relationships: activeWorld.relationships,
                    section: editorSection,
                    stagedRelationships,
                  });
                  onSaveEntry(result.entry);
                  result.savedRelationships.forEach(onSaveRelationship);
                  setActiveSectionId(editorSection.id);
                  setSelectedEntryId(result.entry.id);
                  resetInlineEditor();
                  updateWorkbenchRoute({
                    entryId: result.entry.id,
                    sectionId: editorSection.id,
                  });
                  return result.entry;
                }}
                onSaveRelationship={onSaveRelationship}
                onUseAsTemplate={(entry) => {
                  const nextTemplateDraft = draftFromEntry(
                    entry,
                    editorSection
                  );
                  setTemplateDraft({
                    ...nextTemplateDraft,
                    name: `${entry.name} Template`,
                    status: 'draft',
                  });
                  setTemplateSectionId(editorSection.id);
                  setSelectedEntryId('');
                  updateWorkbenchRoute({
                    entryId: '',
                    sectionId: editorSection.id,
                  });
                }}
                relationships={activeWorld.relationships}
                section={editorSection}
                sectionEntries={editorSectionEntries}
                sections={activeWorld.entryTypes}
                selectedEntry={editorEntry ?? undefined}
                workspaceSchema={activeWorld.schema}
              />
            </>
          </section>
        ) : null}

        <aside
          className="vwb-panel vwb-workbench-context-panel"
          aria-labelledby="workbench-context-title"
          hidden={layoutPreferences.isContextCollapsed}
        >
          <div className="vwb-section-heading">
            <div>
              <p className="vwb-kicker">{selected.kicker}</p>
              <h2
                id="workbench-context-title"
                ref={contextHeadingRef}
                tabIndex={-1}
              >
                {selected.record?.name ?? selected.emptyTitle}
              </h2>
            </div>
            <button
              className="vwb-secondary-button"
              type="button"
              onClick={() =>
                setLayoutPreferences((current) => ({
                  ...current,
                  isContextCollapsed: true,
                }))
              }
            >
              Collapse context
            </button>
          </div>

          {selected.record ? (
            <div className="vwb-workbench-context">
              <p>{selected.record.summaryText || selected.noSummaryText}</p>
              <dl>
                <div>
                  <dt>{selected.sectionLabel}</dt>
                  <dd>
                    {selected.section?.title ?? selected.record.sectionTitle}
                  </dd>
                </div>
                <div>
                  <dt>{selected.statusLabel}</dt>
                  <dd>{selected.record.status}</dd>
                </div>
                <div>
                  <dt>{selected.relationshipsLabel}</dt>
                  <dd>{selected.relationshipCount}</dd>
                </div>
                <div>
                  <dt>{selected.completenessLabel}</dt>
                  <dd>
                    {selected.completionPercent === null
                      ? selected.completeLabel
                      : `${selected.completionPercent}%`}
                  </dd>
                </div>
              </dl>
              {selected.reviewSummary.hasIssues ? (
                <div>
                  <h3>{selected.reviewSummaryTitle}</h3>
                  <div className="vwb-diagnostics-grid">
                    {selected.reviewSummary.items
                      .filter((item) => item.hasIssues)
                      .map((item) => (
                        <article
                          className={`vwb-diagnostic-card vwb-review-${item.severity}`}
                          key={item.id}
                        >
                          <span className="vwb-entry-kind">{item.title}</span>
                          <strong>{item.countLabel}</strong>
                          <p>{item.detail}</p>
                        </article>
                      ))}
                  </div>
                </div>
              ) : null}
              {selected.incompletePrompts.length > 0 ? (
                <div>
                  <h3>{selected.draftingPromptsTitle}</h3>
                  <ul className="vwb-compact-list">
                    {visibleDraftingPrompts.map((prompt) => (
                      <li key={prompt}>{prompt}</li>
                    ))}
                  </ul>
                  {hiddenDraftingPromptCount > 0 ? (
                    <span className="vwb-tag">
                      {formatHiddenCountText({
                        hiddenCount: hiddenDraftingPromptCount,
                        singularItemLabel: 'drafting prompt',
                        pluralItemLabel: 'drafting prompts',
                      })}
                    </span>
                  ) : null}
                  {selected.incompletePrompts.length >
                  workbenchDisplayLimits.selectedDraftingPrompts ? (
                    <div className="vwb-action-row">
                      <button
                        className="vwb-secondary-button"
                        type="button"
                        aria-expanded={showAllDraftingPrompts}
                        onClick={() =>
                          setShowAllDraftingPrompts(
                            (currentValue) => !currentValue
                          )
                        }
                      >
                        {formatExpansionControlLabel({
                          isExpanded: showAllDraftingPrompts,
                          hiddenCount: hiddenDraftingPromptCount,
                          pluralItemLabel: 'Drafting Prompts',
                          singularItemLabel: 'Drafting Prompt',
                        })}
                      </button>
                    </div>
                  ) : null}
                </div>
              ) : null}
              {selected.relatedRecordChips.length > 0 ? (
                <div>
                  <h3>{selected.linkedRecordsTitle}</h3>
                  <div className="vwb-entity-chip-list">
                    {selected.relatedRecordChips.map((chip) => (
                      <Link
                        className="vwb-entity-chip"
                        key={`${chip.relationshipId ?? 'record'}-${chip.id}`}
                        to={chip.route}
                      >
                        <span>{chip.label}</span>
                        <small>{chip.detailText}</small>
                      </Link>
                    ))}
                  </div>
                </div>
              ) : null}
              <Link
                aria-label={selected.editRecordAccessibilityLabel}
                className="vwb-secondary-button"
                to={selected.record.editorRoute}
              >
                {selected.editRecordLabel}
              </Link>
              {selected.relationshipStudioRoute ? (
                <Link
                  aria-label={
                    selected.relationshipStudioAccessibilityLabel ?? undefined
                  }
                  className="vwb-secondary-button"
                  to={selected.relationshipStudioRoute}
                >
                  {selected.relationshipStudioLabel}
                </Link>
              ) : null}
            </div>
          ) : (
            <p>{selected.emptyDetail}</p>
          )}
        </aside>
      </section>
      {entryPendingDelete ? (
        <ConfirmationDialog
          entry={entryPendingDelete}
          onCancel={() => setEntryPendingDelete(null)}
          onConfirm={() => {
            onDeleteEntry(entryPendingDelete);
            setSelectedEntryId('');
            setEntryPendingDelete(null);
            resetInlineEditor();
            updateWorkbenchRoute({ entryId: '' });
          }}
        />
      ) : null}
    </main>
  );
}
