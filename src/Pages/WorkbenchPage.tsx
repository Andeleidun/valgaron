import { useEffect, useMemo, useRef, useState } from 'react';
import { NavLink, useSearchParams } from 'react-router-dom';
import {
  commitEntryDraftTransaction,
  draftFromEntry,
  duplicateEntry,
  getCodexScreenIntro,
  getEntries,
  getWorkbenchRecordIndexModel,
  isWorkbenchRecordViewId,
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
          >
            Select
          </button>
          <NavLink className="vwb-secondary-button" to={record.editorRoute}>
            Edit
          </NavLink>
        </div>
      </div>
      <p>{record.summaryText}</p>
      <small>
        {record.sectionTitle} - {record.tagsText} - {record.updatedText}
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
        viewLimit: 24,
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
  const visibleDraftingPrompts = showAllDraftingPrompts
    ? selected.incompletePrompts
    : selected.incompletePrompts.slice(0, 4);
  const hiddenDraftingPromptCount =
    selected.incompletePrompts.length - visibleDraftingPrompts.length;
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
  const editorSectionEntries = editorSection
    ? getEntries(activeWorld.codex, editorSection.id)
    : [];

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

  return (
    <main className="vwb-main" id="main-content" tabIndex={-1}>
      <section className="vwb-panel vwb-section-intro">
        <p className="vwb-kicker">{intro.kicker}</p>
        <h1>{intro.title}</h1>
        <p>{intro.detail}</p>
      </section>

      <section className="vwb-workbench-layout" aria-label="Workbench records">
        <div className="vwb-panel">
          <div className="vwb-section-heading">
            <div>
              <p className="vwb-kicker">Record index</p>
              <h2>Find and choose a record</h2>
            </div>
          </div>

          <label className="vwb-search-field">
            Search records
            <input
              value={query}
              onChange={(event) => {
                const nextQuery = event.target.value;
                setQuery(nextQuery);
                updateWorkbenchRoute({ query: nextQuery });
              }}
              placeholder="Search names, tags, notes, and fields"
              type="search"
            />
          </label>

          <div
            className="vwb-tag-filter-group vwb-workbench-section-list"
            aria-label="Filter Workbench by section"
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

          <div className="vwb-workbench-create-row" aria-label="Create records">
            {(activeSection ? [activeSection] : model.sectionActions).map(
              (action) => (
                <button
                  className="vwb-secondary-button"
                  key={action.sectionId}
                  type="button"
                  onClick={() => startInlineCreate(action.sectionId)}
                >
                  New {action.singularLabel}
                </button>
              )
            )}
          </div>

          <div
            className="vwb-tag-filter-group vwb-workbench-view-list"
            aria-label="Workbench views"
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
                <strong>No records in this view.</strong>
                <p>Try another view or clear the current search.</p>
              </div>
            )}
          </div>
        </div>

        <section
          className="vwb-panel"
          aria-label={
            editorSection
              ? `${editorSection.singularTitle} Workbench editor`
              : 'Workbench editor'
          }
        >
          {editorSection ? (
            <>
              <div className="vwb-section-heading">
                <div>
                  <p className="vwb-kicker">Inline editor</p>
                  <h2>
                    {editorEntry
                      ? `Edit ${editorEntry.name}`
                      : `New ${editorSection.singularTitle}`}
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
              />
            </>
          ) : (
            <div className="vwb-empty-results" role="status">
              <strong>No editor target selected.</strong>
              <p>Select a record or choose a section before editing inline.</p>
            </div>
          )}
        </section>

        <aside className="vwb-panel" aria-labelledby="workbench-context-title">
          <div className="vwb-section-heading">
            <div>
              <p className="vwb-kicker">Selected context</p>
              <h2 id="workbench-context-title">
                {selected.record?.name ?? 'No record selected'}
              </h2>
            </div>
          </div>

          {selected.record ? (
            <div className="vwb-workbench-context">
              <p>{selected.record.summaryText}</p>
              <dl>
                <div>
                  <dt>Section</dt>
                  <dd>
                    {selected.section?.title ?? selected.record.sectionTitle}
                  </dd>
                </div>
                <div>
                  <dt>Status</dt>
                  <dd>{selected.record.status}</dd>
                </div>
                <div>
                  <dt>Relationships</dt>
                  <dd>{selected.relationshipCount}</dd>
                </div>
                <div>
                  <dt>Completeness</dt>
                  <dd>
                    {selected.completionPercent === null
                      ? 'Complete'
                      : `${selected.completionPercent}%`}
                  </dd>
                </div>
              </dl>
              {selected.reviewSummary.hasIssues ? (
                <div>
                  <h3>Review summary</h3>
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
                  <h3>Drafting prompts</h3>
                  <ul className="vwb-compact-list">
                    {visibleDraftingPrompts.map((prompt) => (
                      <li key={prompt}>{prompt}</li>
                    ))}
                  </ul>
                  {hiddenDraftingPromptCount > 0 ? (
                    <span className="vwb-tag">
                      {hiddenDraftingPromptCount} more drafting prompt
                      {hiddenDraftingPromptCount === 1 ? '' : 's'}.
                    </span>
                  ) : null}
                  {selected.incompletePrompts.length > 4 ? (
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
                        {showAllDraftingPrompts
                          ? 'Show Fewer Drafting Prompts'
                          : `Show ${hiddenDraftingPromptCount} More Drafting Prompts`}
                      </button>
                    </div>
                  ) : null}
                </div>
              ) : null}
              {selected.relatedRecordChips.length > 0 ? (
                <div>
                  <h3>Linked records</h3>
                  <div className="vwb-entity-chip-list">
                    {selected.relatedRecordChips.map((chip) => (
                      <NavLink
                        className="vwb-entity-chip"
                        key={`${chip.relationshipId ?? 'record'}-${chip.id}`}
                        to={chip.route}
                      >
                        <span>{chip.label}</span>
                        <small>
                          {chip.relationshipType
                            ? `${chip.relationshipType} - ${chip.sectionTitle}`
                            : chip.sectionTitle}
                        </small>
                      </NavLink>
                    ))}
                  </div>
                </div>
              ) : null}
              <NavLink
                className="vwb-secondary-button"
                to={selected.record.editorRoute}
              >
                Open Editor
              </NavLink>
              {selected.relationshipStudioRoute ? (
                <NavLink
                  className="vwb-secondary-button"
                  to={selected.relationshipStudioRoute}
                >
                  Manage Links
                </NavLink>
              ) : null}
            </div>
          ) : (
            <p>
              Select a record to review its section, relationship count, and
              drafting prompts before opening the editor.
            </p>
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
