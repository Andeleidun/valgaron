import { useEffect, useRef, useState } from 'react';
import {
  BrowserRouter,
  Link,
  Navigate,
  NavLink,
  Route,
  Routes,
  useLocation,
} from 'react-router-dom';
import './App.css';
import { ResetConfirmationDialog } from './Components/Codex/CodexEntryViews';
import { ErrorBoundary } from './Components/Common/ErrorBoundary/ErrorBoundary';
import { RuntimeErrorFallback } from './Components/Common/RuntimeErrorFallback';
import {
  codexShellRoutes,
  dataShellExportActions,
  exportWorldToMarkdown,
  getCodexExportFilename,
  getCodexMobileWebShellRouteLabel,
  getCodexShellRoutes,
  localPersistenceCopy,
  mobileWebPrimaryRouteOrder,
  serializeActiveWorldBackup,
  serializeWorldDocumentBackup,
  valgaronProduct,
  webPrimaryRouteOrder,
  type DataShellExportAction,
  type WorldEntry,
  type WorldRelationship,
  type WorldSectionConfig,
  type WorldWorkspace,
} from '@valgaron/core';
import { downloadTextFile, slugFilename } from './Utlilities/fileDownloads';
import { useBeforeUnloadWarning } from './Utlilities/unsavedChanges';
import { useWorldDocumentState } from './Utlilities/useWorldDocumentState';
import { DataPage } from './Pages/DataPage';
import { HelpPage } from './Pages/HelpPage';
import { KnowledgePage } from './Pages/KnowledgePage';
import { Overview } from './Pages/OverviewPage';
import { RelationshipsPage } from './Pages/RelationshipsPage';
import { SectionPage } from './Pages/SectionPage';
import { TimelinePage } from './Pages/TimelinePage';
import { UtilitiesPage } from './Pages/UtilitiesPage';
import { WorkbenchPage } from './Pages/WorkbenchPage';
import { WorkspacesPage } from './Pages/WorkspacesPage';

const routerBaseName =
  import.meta.env.BASE_URL === '/' ? undefined : import.meta.env.BASE_URL;
const appBasePath = import.meta.env.BASE_URL;
const headerDataMenuId = 'vwb-header-data-menu';
const webPrimaryRoutes = getCodexShellRoutes(webPrimaryRouteOrder);
const mobileWebPrimaryRoutes = getCodexShellRoutes(mobileWebPrimaryRouteOrder);
const webOverviewRoute = codexShellRoutes.overview;
const webSecondaryRoutes = webPrimaryRoutes.filter(
  (route) => route.id !== 'overview'
);
const webPrimaryRoutePaths = new Set(
  webPrimaryRoutes.map((route) => route.path)
);

function saveButtonText(
  state: 'saved' | 'unsaved' | 'dirty' | 'failed' | 'paused'
) {
  switch (state) {
    case 'unsaved':
      return 'Save';
    case 'dirty':
      return 'Save';
    case 'failed':
      return 'Retry Save';
    case 'paused':
      return 'Save';
    case 'saved':
      return 'Saved';
  }
}

function EntriesRouteRedirect({
  sections,
}: {
  sections: readonly WorldSectionConfig[];
}) {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const requestedSectionId = searchParams.get('sectionId');
  const section =
    sections.find((item) => item.id === requestedSectionId) ?? sections[0];

  if (!section) {
    return <Navigate to="/" replace />;
  }

  searchParams.delete('sectionId');
  const search = searchParams.toString();
  return (
    <Navigate
      to={`/${section.id}${search ? `?${search}` : ''}${location.hash}`}
      replace
    />
  );
}

function WorkbenchRoute({
  activeWorld,
  onArchiveEntry,
  onDeleteEntry,
  onDeleteRelationship,
  onSaveEntry,
  onSaveRelationship,
  sections,
}: {
  activeWorld: WorldWorkspace;
  onArchiveEntry: (entry: WorldEntry, archived: boolean) => void;
  onDeleteEntry: (entry: WorldEntry) => void;
  onDeleteRelationship: (relationshipId: string) => void;
  onSaveEntry: (entry: WorldEntry) => void;
  onSaveRelationship: (relationship: WorldRelationship) => void;
  sections: readonly WorldSectionConfig[];
}) {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const requestedIntent = searchParams.get('intent');
  const shouldOpenLegacySectionRoute =
    requestedIntent === 'new' ||
    requestedIntent === 'edit' ||
    (requestedIntent !== 'context' && searchParams.has('entryId'));

  return shouldOpenLegacySectionRoute ? (
    <EntriesRouteRedirect sections={sections} />
  ) : (
    <WorkbenchPage
      activeWorld={activeWorld}
      onArchiveEntry={onArchiveEntry}
      onDeleteEntry={onDeleteEntry}
      onDeleteRelationship={onDeleteRelationship}
      onSaveEntry={onSaveEntry}
      onSaveRelationship={onSaveRelationship}
    />
  );
}

function AppShell() {
  const [isResetPending, setIsResetPending] = useState(false);
  const [afterResetConfirm, setAfterResetConfirm] = useState<
    (() => void) | null
  >(null);
  const [isDataMenuOpen, setIsDataMenuOpen] = useState(false);
  const [dataMenuMessage, setDataMenuMessage] = useState('');
  const dataMenuTriggerRef = useRef<HTMLButtonElement | null>(null);
  const dataMenuListRef = useRef<HTMLDivElement | null>(null);
  const {
    activeWorld,
    archiveWorkspace,
    archiveEntry,
    addEntryTypeFields,
    clearHiddenEntryDetails,
    codex,
    createEntryType,
    createWorkspace,
    deleteSnapshot,
    document,
    duplicateWorkspace,
    importDocument,
    loadStatus,
    permanentlyDeleteEntryType,
    permanentlyDeleteEntry,
    permanentlyDeletePlanetaryWorld,
    permanentlyDeleteWorkspace,
    recoverySnapshots,
    recoverySnapshotStatus,
    relationships,
    removeRelationship,
    restoreSnapshot,
    resetToSeed,
    moveEntryTypeField,
    renameEntryTypeField,
    removeEntryTypeField,
    hasUnsavedDocumentChanges,
    saveCurrentDocument,
    saveEntry,
    savePlanetaryWorld,
    saveRelationship,
    saveStatus,
    sections,
    switchWorkspace,
    unlinkRelationship,
    updateWorkspace,
    archivePlanetaryWorld,
  } = useWorldDocumentState();

  const confirmResetToSeed = () => {
    resetToSeed();
    afterResetConfirm?.();
    setAfterResetConfirm(null);
    setIsResetPending(false);
  };
  const cancelResetToSeed = () => {
    setAfterResetConfirm(null);
    setIsResetPending(false);
  };
  const downloadHeaderExport = (
    filename: string,
    text: string,
    successLabel: string
  ) => {
    const didDownload = downloadTextFile(filename, text);
    setDataMenuMessage(
      didDownload
        ? `${successLabel} downloaded.`
        : 'Download is unavailable in this runtime; open Data for copyable exports.'
    );
    setIsDataMenuOpen(false);
  };
  const moveDataMenuFocus = (
    currentTarget: HTMLElement,
    direction: 'first' | 'last' | 'next' | 'previous'
  ) => {
    const menuItems = Array.from(
      currentTarget.querySelectorAll<HTMLElement>('[role="menuitem"]')
    );
    if (menuItems.length === 0) {
      return;
    }
    const activeIndex = menuItems.indexOf(
      globalThis.document.activeElement as HTMLElement
    );
    const lastIndex = menuItems.length - 1;
    const nextIndex =
      direction === 'first'
        ? 0
        : direction === 'last'
        ? lastIndex
        : direction === 'next'
        ? activeIndex >= lastIndex
          ? 0
          : activeIndex + 1
        : activeIndex <= 0
        ? lastIndex
        : activeIndex - 1;
    menuItems[nextIndex]?.focus();
  };
  const filenameBase = slugFilename(activeWorld.name);
  const isSaveButtonDisabled = saveStatus.state === 'saved';
  useBeforeUnloadWarning(hasUnsavedDocumentChanges);

  useEffect(() => {
    if (!isDataMenuOpen) {
      return;
    }
    const firstMenuAction =
      dataMenuListRef.current?.querySelector<HTMLElement>('button, a[href]');
    firstMenuAction?.focus();
  }, [isDataMenuOpen]);

  useEffect(() => {
    if (!isDataMenuOpen) {
      return undefined;
    }
    const closeDataMenuFromOutsidePointer = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) {
        return;
      }
      if (
        dataMenuTriggerRef.current?.contains(target) ||
        dataMenuListRef.current?.contains(target)
      ) {
        return;
      }
      setIsDataMenuOpen(false);
    };
    globalThis.document.addEventListener(
      'pointerdown',
      closeDataMenuFromOutsidePointer
    );
    return () => {
      globalThis.document.removeEventListener(
        'pointerdown',
        closeDataMenuFromOutsidePointer
      );
    };
  }, [isDataMenuOpen]);

  const getHeaderExportText = (mode: DataShellExportAction['mode']) => {
    switch (mode) {
      case 'active-json':
        return serializeActiveWorldBackup(document);
      case 'full-json':
        return serializeWorldDocumentBackup(document);
      case 'markdown':
        return exportWorldToMarkdown(activeWorld);
    }
  };

  return (
    <BrowserRouter basename={routerBaseName}>
      <div className="vwb-app-shell">
        <a className="vwb-skip-link" href="#main-content">
          Skip to main content
        </a>
        <header className="vwb-app-header">
          <NavLink
            className="vwb-brand"
            to={webOverviewRoute.path}
            aria-label={`${
              valgaronProduct.fullTitle
            } ${webOverviewRoute.title.toLowerCase()}`}
          >
            <span>{valgaronProduct.name}</span>
            <strong>{valgaronProduct.codexTitle}</strong>
          </NavLink>
          <nav
            className="vwb-top-nav vwb-desktop-primary-nav"
            aria-label="Codex sections"
          >
            <NavLink
              className={({ isActive }) =>
                `vwb-nav-link ${isActive ? 'is-active' : ''}`
              }
              to={webOverviewRoute.path}
              end
            >
              {webOverviewRoute.title}
            </NavLink>
            {webSecondaryRoutes.map((route) => (
              <NavLink
                className={({ isActive }) =>
                  `vwb-nav-link ${isActive ? 'is-active' : ''}`
                }
                key={route.id}
                to={route.path}
              >
                {route.title}
              </NavLink>
            ))}
            {sections
              .filter((section) => !webPrimaryRoutePaths.has(`/${section.id}`))
              .map((section) => (
                <NavLink
                  className={({ isActive }) =>
                    `vwb-nav-link ${isActive ? 'is-active' : ''}`
                  }
                  key={section.id}
                  to={`/${section.id}`}
                >
                  {section.title}
                </NavLink>
              ))}
          </nav>
          <nav
            className="vwb-top-nav vwb-mobile-primary-nav"
            aria-label="Primary mobile web workflow"
          >
            {mobileWebPrimaryRoutes.map((route) => (
              <NavLink
                className={({ isActive }) =>
                  `vwb-nav-link ${isActive ? 'is-active' : ''}`
                }
                key={route.id}
                to={route.path}
              >
                {getCodexMobileWebShellRouteLabel(route.id)}
              </NavLink>
            ))}
          </nav>
          <button
            className={`vwb-save-status ${
              saveStatus.state === 'failed' || saveStatus.state === 'paused'
                ? 'is-danger'
                : saveStatus.state === 'dirty' || saveStatus.state === 'unsaved'
                ? 'is-dirty'
                : ''
            }`}
            type="button"
            onClick={saveCurrentDocument}
            disabled={isSaveButtonDisabled}
            aria-label={
              isSaveButtonDisabled
                ? `Current progress is saved to ${localPersistenceCopy.browserSaveTarget}`
                : `Save current progress to ${localPersistenceCopy.browserSaveTarget}`
            }
            aria-live="polite"
          >
            {saveButtonText(saveStatus.state)}
          </button>
          <div
            className="vwb-header-menu"
            onKeyDown={(event) => {
              if (event.key === 'Escape') {
                setIsDataMenuOpen(false);
                dataMenuTriggerRef.current?.focus();
              }
            }}
          >
            <button
              ref={dataMenuTriggerRef}
              className="vwb-secondary-button"
              type="button"
              aria-controls={isDataMenuOpen ? headerDataMenuId : undefined}
              aria-expanded={isDataMenuOpen}
              aria-haspopup="menu"
              onClick={() =>
                setIsDataMenuOpen((currentIsOpen) => !currentIsOpen)
              }
              onKeyDown={(event) => {
                if (event.key === 'ArrowDown') {
                  event.preventDefault();
                  setIsDataMenuOpen(true);
                }
              }}
            >
              Data Menu
            </button>
            {isDataMenuOpen ? (
              <div
                ref={dataMenuListRef}
                className="vwb-header-menu-list"
                id={headerDataMenuId}
                aria-label="Data actions"
                onKeyDown={(event) => {
                  switch (event.key) {
                    case 'ArrowDown':
                      event.preventDefault();
                      moveDataMenuFocus(event.currentTarget, 'next');
                      break;
                    case 'ArrowUp':
                      event.preventDefault();
                      moveDataMenuFocus(event.currentTarget, 'previous');
                      break;
                    case 'Home':
                      event.preventDefault();
                      moveDataMenuFocus(event.currentTarget, 'first');
                      break;
                    case 'End':
                      event.preventDefault();
                      moveDataMenuFocus(event.currentTarget, 'last');
                      break;
                  }
                }}
                role="menu"
              >
                {dataShellExportActions.map((action) => {
                  return (
                    <button
                      key={action.mode}
                      role="menuitem"
                      type="button"
                      onClick={() =>
                        downloadHeaderExport(
                          getCodexExportFilename(action.mode, filenameBase),
                          getHeaderExportText(action.mode),
                          action.heading
                        )
                      }
                    >
                      {action.downloadLabel}
                    </button>
                  );
                })}
                <Link
                  role="menuitem"
                  to="/data#import-json-backup"
                  onClick={() => setIsDataMenuOpen(false)}
                >
                  Import JSON Backup
                </Link>
              </div>
            ) : null}
            {dataMenuMessage ? (
              <span className="vwb-screen-reader-only" role="status">
                {dataMenuMessage}
              </span>
            ) : null}
          </div>
        </header>

        <ErrorBoundary
          fallback={({ error, resetErrorBoundary }) => (
            <RuntimeErrorFallback
              basePath={appBasePath}
              document={document}
              error={error}
              loadStatus={loadStatus}
              onRetry={resetErrorBoundary}
              recoverySnapshotCount={recoverySnapshots.length}
              recoverySnapshotStatus={recoverySnapshotStatus}
              route={
                typeof window === 'undefined'
                  ? '/'
                  : `${window.location.pathname}${window.location.search}`
              }
              saveStatus={saveStatus}
            />
          )}
        >
          <Routes>
            <Route path="/" element={<Overview document={document} />} />
            <Route
              path="/relationships"
              element={
                <RelationshipsPage
                  codex={codex}
                  onDeleteRelationship={unlinkRelationship}
                  onSaveEntry={saveEntry}
                  onSaveRelationship={saveRelationship}
                  relationships={relationships}
                  sections={sections}
                />
              }
            />
            <Route
              path="/data"
              element={
                <DataPage
                  activeWorld={activeWorld}
                  document={document}
                  loadStatus={loadStatus}
                  onDeleteSnapshot={deleteSnapshot}
                  onImportDocument={importDocument}
                  onRequestReset={(afterReset) => {
                    setAfterResetConfirm(afterReset ? () => afterReset : null);
                    setIsResetPending(true);
                  }}
                  onRestoreSnapshot={restoreSnapshot}
                  recoverySnapshots={recoverySnapshots}
                  recoverySnapshotStatus={recoverySnapshotStatus}
                  saveStatus={saveStatus}
                />
              }
            />
            <Route
              path="/workspaces"
              element={
                <WorkspacesPage
                  activeWorld={activeWorld}
                  document={document}
                  onArchivePlanetaryWorld={archivePlanetaryWorld}
                  onArchiveWorkspace={archiveWorkspace}
                  onCreateWorkspace={createWorkspace}
                  onDeletePlanetaryWorld={permanentlyDeletePlanetaryWorld}
                  onDeleteWorkspace={permanentlyDeleteWorkspace}
                  onDuplicateWorkspace={duplicateWorkspace}
                  onSavePlanetaryWorld={savePlanetaryWorld}
                  onSwitchWorkspace={switchWorkspace}
                  onUpdateWorkspace={updateWorkspace}
                />
              }
            />
            <Route
              path="/timeline"
              element={
                <TimelinePage
                  codex={codex}
                  onArchiveEntry={archiveEntry}
                  onDeleteEntry={permanentlyDeleteEntry}
                  onDeleteRelationship={removeRelationship}
                  onSaveEntry={saveEntry}
                  onSaveRelationship={saveRelationship}
                  relationships={relationships}
                  sections={sections}
                />
              }
            />
            <Route
              path="/knowledge"
              element={
                <KnowledgePage
                  activeWorld={activeWorld}
                  onAddEntryTypeFields={addEntryTypeFields}
                  onClearHiddenEntryDetails={clearHiddenEntryDetails}
                  onCreateEntryType={createEntryType}
                  onDeleteEntryType={permanentlyDeleteEntryType}
                  onMoveEntryTypeField={moveEntryTypeField}
                  onRenameEntryTypeField={renameEntryTypeField}
                  onRemoveEntryTypeField={removeEntryTypeField}
                />
              }
            />
            <Route
              path="/utilities"
              element={<UtilitiesPage activeWorld={activeWorld} />}
            />
            <Route path="/help" element={<HelpPage />} />
            <Route
              path="/entries"
              element={
                <WorkbenchRoute
                  activeWorld={activeWorld}
                  onArchiveEntry={archiveEntry}
                  onDeleteEntry={permanentlyDeleteEntry}
                  onDeleteRelationship={removeRelationship}
                  onSaveEntry={saveEntry}
                  onSaveRelationship={saveRelationship}
                  sections={sections}
                />
              }
            />
            <Route
              path="/:sectionId"
              element={
                <SectionPage
                  codex={codex}
                  onArchiveEntry={archiveEntry}
                  onDeleteEntry={permanentlyDeleteEntry}
                  onDeleteRelationship={removeRelationship}
                  onSaveEntry={saveEntry}
                  onSaveRelationship={saveRelationship}
                  relationships={relationships}
                  sections={sections}
                />
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ErrorBoundary>
        {isResetPending ? (
          <ResetConfirmationDialog
            onCancel={cancelResetToSeed}
            onConfirm={confirmResetToSeed}
          />
        ) : null}
      </div>
    </BrowserRouter>
  );
}

export default AppShell;
