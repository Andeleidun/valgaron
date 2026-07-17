import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  commitEntryDraftTransaction,
  draftFromEntry,
  formatExpansionControlLabel,
  formatHiddenCountText,
  formatWorldDocumentActionLabel,
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
  type WorldImageAsset,
  type WorldRelationship,
  type WorldWorkspace,
} from '@valgaron/core';
import {
  DashboardCardControls,
  DashboardShelf,
  DashboardToolbar,
} from '../Components/Dashboard/DashboardControls';
import {
  DashboardGrid,
  DashboardGridItem,
} from '../Components/Dashboard/DashboardGrid';
import { useDashboardWorkspace } from '../Components/Dashboard/useDashboardWorkspace';
import {
  ConfirmationDialog,
  EntryDetail,
  EntryForm,
} from '../Components/Codex/CodexEntryViews';
import {
  confirmDiscardUnsavedChanges,
  useUnsavedChangesWarning,
} from '../Utlilities/unsavedChanges';
import type { EntryRelationshipDocumentTransaction } from '../Utlilities/useWorldDocumentState';

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
  onCommitEntryRelationshipTransaction,
  onSaveEntry,
  onSaveRelationship,
}: {
  activeWorld: WorldWorkspace;
  onArchiveEntry: (entry: WorldEntry, archived: boolean) => void;
  onDeleteEntry: (entry: WorldEntry) => void;
  onDeleteRelationship: (relationshipId: string) => void;
  onCommitEntryRelationshipTransaction: (
    transaction: EntryRelationshipDocumentTransaction
  ) => void;
  onSaveEntry: (entry: WorldEntry, assets?: readonly WorldImageAsset[]) => void;
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
  const activeDashboardCardIds = [
    'workbench.records',
    ...(editorSection ? ['workbench.editor'] : []),
    'workbench.record-context',
  ];
  const dashboard = useDashboardWorkspace({
    pageId: 'workbench',
    activeCardIds: activeDashboardCardIds,
    forcedVisibleCardIds: [
      ...(isEntryFormDirty ? ['workbench.editor'] : []),
      ...(selected.reviewSummary.hasIssues ? ['workbench.record-context'] : []),
    ],
  });
  const recordsCard = dashboard.cardsById.get('workbench.records');
  const editorCard = dashboard.cardsById.get('workbench.editor');
  const contextCard = dashboard.cardsById.get('workbench.record-context');
  const recordsDefinition = dashboard.definitions.find(
    (definition) => definition.id === 'workbench.records'
  )!;
  const editorDefinition = dashboard.definitions.find(
    (definition) => definition.id === 'workbench.editor'
  )!;
  const contextDefinition = dashboard.definitions.find(
    (definition) => definition.id === 'workbench.record-context'
  )!;

  useUnsavedChangesWarning(isEntryFormDirty);

  useEffect(() => {
    setShowAllDraftingPrompts(false);
  }, [selected.record?.id]);

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
    dashboard.restore(
      card === 'context' ? 'workbench.record-context' : 'workbench.records'
    );
    window.requestAnimationFrame(() => {
      (card === 'context'
        ? contextHeadingRef.current
        : indexHeadingRef.current
      )?.focus();
    });
  };

  const moveDashboardCard = (cardId: string, direction: -1 | 1) => {
    dashboard.moveRelative(cardId, direction);
  };

  return (
    <main
      className="vwb-main"
      id="main-content"
      ref={dashboard.containerRef}
      tabIndex={-1}
    >
      <section className="vwb-panel vwb-section-intro">
        <p className="vwb-kicker">{intro.kicker}</p>
        <h1>{intro.title}</h1>
        <p>{intro.detail}</p>
      </section>

      <DashboardToolbar
        activePresetId={dashboard.history.present.presetId}
        canRedo={dashboard.canRedo}
        canUndo={dashboard.canUndo}
        isCustomizing={dashboard.isCustomizing}
        isPresetCustomized={dashboard.isPresetCustomized}
        onApplyPreset={dashboard.applyPreset}
        onCancel={dashboard.cancelCustomizing}
        onCustomize={
          dashboard.isCustomizing
            ? dashboard.finishCustomizing
            : dashboard.startCustomizing
        }
        onFocusPrimary={
          editorSection ? () => dashboard.focus('workbench.editor') : undefined
        }
        onRedo={() => dashboard.dispatch({ type: 'redo' })}
        onReset={dashboard.reset}
        onResetAll={dashboard.resetAll}
        onUndo={() => dashboard.dispatch({ type: 'undo' })}
        presets={dashboard.presets}
        summary={
          editorSection
            ? `Editing ${editorSection.title}`
            : 'Browse and select a record to begin drafting.'
        }
      />
      <DashboardShelf
        cards={dashboard.layout.cards.filter((card) => card.region === 'shelf')}
        getSummary={(card) =>
          card.id === 'workbench.records'
            ? ` · ${model.activeView.count}`
            : selected.reviewSummary.hasIssues
            ? ` · ${selected.reviewSummary.totalIssueCount} issues`
            : ''
        }
        onRestore={(cardId) =>
          restoreDashboardCard(
            cardId === 'workbench.records' ? 'index' : 'context'
          )
        }
      />
      <span className="vwb-screen-reader-only" aria-live="polite">
        {dashboard.announcement}
      </span>

      <DashboardGrid
        className={[
          'vwb-workbench-layout',
          isWorkbenchEmptyEditor ? 'is-empty-editor' : '',
          recordsCard?.region === 'shelf' ? 'is-index-collapsed' : '',
        ]
          .filter(Boolean)
          .join(' ')}
        ariaLabel={model.copy.layoutAriaLabel}
        cards={dashboard.layout.cards}
        isCustomizing={dashboard.isCustomizing}
        onMoveCard={(cardId, targetCardId) => {
          dashboard.moveBefore(cardId, targetCardId);
        }}
      >
        <DashboardGridItem cardId="workbench.records">
          <div className="vwb-panel vwb-workbench-index-panel">
            <div className="vwb-section-heading">
              <div>
                <p className="vwb-kicker">{model.copy.recordIndexKicker}</p>
                <h2 ref={indexHeadingRef} tabIndex={-1}>
                  {model.copy.recordIndexTitle}
                </h2>
              </div>
              {recordsCard ? (
                <DashboardCardControls
                  card={recordsCard}
                  definition={recordsDefinition}
                  isCustomizing={dashboard.isCustomizing}
                  onCollapse={() => dashboard.collapse(recordsCard.id)}
                  onFocus={() => dashboard.focus(recordsCard.id)}
                  onMove={(direction) =>
                    moveDashboardCard(recordsCard.id, direction)
                  }
                  onMoveToRegion={(region) =>
                    dashboard.moveToRegion(recordsCard.id, region)
                  }
                  onReset={() => dashboard.resetCard(recordsCard.id)}
                  onResize={(size) => dashboard.resize(recordsCard.id, size)}
                />
              ) : null}
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
        </DashboardGridItem>

        {editorSection ? (
          <DashboardGridItem cardId="workbench.editor">
            <section
              className="vwb-panel vwb-workbench-editor-panel"
              aria-label={formatWorkbenchEditorAccessibilityLabel(
                editorSection
              )}
            >
              <>
                <div className="vwb-section-heading">
                  <div>
                    <p className="vwb-kicker">
                      {model.copy.inlineEditorKicker}
                    </p>
                    <h2>
                      {getEntryEditorTitle({
                        section: editorSection,
                        selectedEntry: editorEntry,
                      })}
                    </h2>
                  </div>
                  {editorCard ? (
                    <DashboardCardControls
                      card={editorCard}
                      definition={editorDefinition}
                      isCustomizing={dashboard.isCustomizing}
                      onCollapse={() => undefined}
                      onFocus={() => dashboard.focus(editorCard.id)}
                      onMove={(direction) =>
                        moveDashboardCard(editorCard.id, direction)
                      }
                      onMoveToRegion={(region) =>
                        dashboard.moveToRegion(editorCard.id, region)
                      }
                      onReset={() => dashboard.resetCard(editorCard.id)}
                      onResize={(size) => dashboard.resize(editorCard.id, size)}
                    />
                  ) : null}
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
                    const duplicatedEntry = duplicateEntry(
                      editorSection,
                      entry
                    );
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
                    stagedRelationships = [],
                    relationshipChanges
                  ) => {
                    const result = commitEntryDraftTransaction({
                      codex: activeWorld.codex,
                      entryDraft: draft,
                      existingEntry,
                      relationships: activeWorld.relationships,
                      section: editorSection,
                      stagedRelationships,
                    });
                    onCommitEntryRelationshipTransaction({
                      actionLabel: formatWorldDocumentActionLabel({
                        action: existingEntry ? 'Update' : 'Create',
                        recordType: editorSection.singularTitle,
                        subject: result.entry.name,
                      }),
                      assets: draft.stagedAssets,
                      entries: [result.entry],
                      relationships: [
                        ...result.savedRelationships,
                        ...(relationshipChanges?.relationships ?? []),
                      ],
                      relationshipIdsToDelete:
                        relationshipChanges?.relationshipIdsToDelete,
                    });
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
          </DashboardGridItem>
        ) : null}

        <DashboardGridItem cardId="workbench.record-context">
          <aside
            className="vwb-panel vwb-workbench-context-panel"
            aria-labelledby="workbench-context-title"
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
              {contextCard ? (
                <DashboardCardControls
                  card={contextCard}
                  definition={contextDefinition}
                  isCustomizing={dashboard.isCustomizing}
                  onCollapse={() => dashboard.collapse(contextCard.id)}
                  onFocus={() => dashboard.focus(contextCard.id)}
                  onMove={(direction) =>
                    moveDashboardCard(contextCard.id, direction)
                  }
                  onMoveToRegion={(region) =>
                    dashboard.moveToRegion(contextCard.id, region)
                  }
                  onReset={() => dashboard.resetCard(contextCard.id)}
                  onResize={(size) => dashboard.resize(contextCard.id, size)}
                />
              ) : null}
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
        </DashboardGridItem>
      </DashboardGrid>
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
