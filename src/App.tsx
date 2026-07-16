import { lazy, Suspense, useEffect, useRef, useState } from 'react';
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
import { ResetConfirmationDialog } from './Components/Codex/ResetConfirmationDialog';
import { ErrorBoundary } from './Components/Common/ErrorBoundary/ErrorBoundary';
import { RuntimeErrorFallback } from './Components/Common/RuntimeErrorFallback';
import {
  codexShellRoutes,
  dataShellExportActions,
  dataShellMenuCopy,
  exportWorldToMarkdown,
  formatDataShellDownloadResultMessage,
  getCodexExportFilename,
  getCodexMobileWebShellRouteLabel,
  getCodexShellChildRoutePath,
  getCodexShellRoutes,
  getLocalSaveButtonModel,
  getRelativeChildRoutePath,
  mobileWebPrimaryRouteOrder,
  serializeActiveWorldBackup,
  serializeWorldDocumentBackup,
  valgaronPrivacyPolicy,
  valgaronProduct,
  webPrimaryRouteOrder,
  type DataShellExportAction,
} from '@valgaron/core';
import { downloadTextFile, slugFilename } from './Utlilities/fileDownloads';
import { formatRouteRedirectDestination } from './Utlilities/navigationRoutes';
import { useBeforeUnloadWarning } from './Utlilities/unsavedChanges';
import { useWorldDocumentState } from './Utlilities/useWorldDocumentState';
const DataPage = lazy(() =>
  import('./Pages/DataPage').then((module) => ({ default: module.DataPage }))
);
const HelpPage = lazy(() =>
  import('./Pages/HelpPage').then((module) => ({ default: module.HelpPage }))
);
const KnowledgePage = lazy(() =>
  import('./Pages/KnowledgePage').then((module) => ({
    default: module.KnowledgePage,
  }))
);
const Overview = lazy(() =>
  import('./Pages/OverviewPage').then((module) => ({
    default: module.Overview,
  }))
);
const PrivacyPage = lazy(() =>
  import('./Pages/PrivacyPage').then((module) => ({
    default: module.PrivacyPage,
  }))
);
const RelationshipsPage = lazy(() =>
  import('./Pages/RelationshipsPage').then((module) => ({
    default: module.RelationshipsPage,
  }))
);
const TimelinePage = lazy(() =>
  import('./Pages/TimelinePage').then((module) => ({
    default: module.TimelinePage,
  }))
);
const UtilitiesPage = lazy(() =>
  import('./Pages/UtilitiesPage').then((module) => ({
    default: module.UtilitiesPage,
  }))
);
const WorkbenchPage = lazy(() =>
  import('./Pages/WorkbenchPage').then((module) => ({
    default: module.WorkbenchPage,
  }))
);
const WorkspacesPage = lazy(() =>
  import('./Pages/WorkspacesPage').then((module) => ({
    default: module.WorkspacesPage,
  }))
);

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

function LegacyRouteRedirect({ destination }: { destination: string }) {
  const location = useLocation();
  return (
    <Navigate
      replace
      to={formatRouteRedirectDestination({
        destination,
        hash: location.hash,
        search: location.search,
      })}
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
    clearHiddenEntryDetail,
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
    addVocabularyValue,
    updateVocabularyValue,
    archiveVocabularyValue,
    moveVocabularyValue,
    updateFieldOverride,
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
      formatDataShellDownloadResultMessage({ didDownload, successLabel })
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
  const saveButtonModel = getLocalSaveButtonModel({
    state: saveStatus.state,
  });
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
            aria-label="Primary workflows"
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
            disabled={saveButtonModel.disabled}
            aria-label={saveButtonModel.accessibilityLabel}
            aria-live="polite"
          >
            {saveButtonModel.label}
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
              {dataShellMenuCopy.triggerLabel}
            </button>
            {isDataMenuOpen ? (
              <div
                ref={dataMenuListRef}
                className="vwb-header-menu-list"
                id={headerDataMenuId}
                aria-label={dataShellMenuCopy.menuAccessibilityLabel}
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
                  to={`${codexShellRoutes.data.path}#import-json-backup`}
                  onClick={() => setIsDataMenuOpen(false)}
                >
                  {dataShellMenuCopy.importJsonBackupLabel}
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
          <Suspense
            fallback={
              <main className="vwb-main" id="main-content" tabIndex={-1}>
                <section className="vwb-panel" role="status">
                  Loading codex workspace…
                </section>
              </main>
            }
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
                    workspaceSchema={activeWorld.schema}
                  />
                }
              />
              <Route
                path="/knowledge"
                element={
                  <KnowledgePage
                    activeWorld={activeWorld}
                    onAddEntryTypeFields={addEntryTypeFields}
                    onClearHiddenEntryDetail={clearHiddenEntryDetail}
                    onClearHiddenEntryDetails={clearHiddenEntryDetails}
                    onCreateEntryType={createEntryType}
                    onDeleteEntryType={permanentlyDeleteEntryType}
                    onMoveEntryTypeField={moveEntryTypeField}
                    onRenameEntryTypeField={renameEntryTypeField}
                    onRemoveEntryTypeField={removeEntryTypeField}
                    onAddVocabularyValue={addVocabularyValue}
                    onUpdateVocabularyValue={updateVocabularyValue}
                    onArchiveVocabularyValue={archiveVocabularyValue}
                    onMoveVocabularyValue={moveVocabularyValue}
                    onUpdateFieldOverride={updateFieldOverride}
                  />
                }
              />
              <Route path={codexShellRoutes.utilities.path}>
                <Route
                  index
                  element={<UtilitiesPage activeWorld={activeWorld} />}
                />
                <Route
                  path={getCodexShellChildRoutePath('data')}
                  element={
                    <DataPage
                      activeWorld={activeWorld}
                      document={document}
                      loadStatus={loadStatus}
                      onDeleteSnapshot={deleteSnapshot}
                      onImportDocument={importDocument}
                      onRequestReset={(afterReset) => {
                        setAfterResetConfirm(
                          afterReset ? () => afterReset : null
                        );
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
                  path={getCodexShellChildRoutePath('workspaces')}
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
                <Route path={getCodexShellChildRoutePath('help')}>
                  <Route index element={<HelpPage />} />
                  <Route
                    path={getRelativeChildRoutePath(
                      codexShellRoutes.help.path,
                      valgaronPrivacyPolicy.webPath
                    )}
                    element={<PrivacyPage />}
                  />
                </Route>
              </Route>
              <Route
                path="/data"
                element={
                  <LegacyRouteRedirect
                    destination={codexShellRoutes.data.path}
                  />
                }
              />
              <Route
                path="/workspaces"
                element={
                  <LegacyRouteRedirect
                    destination={codexShellRoutes.workspaces.path}
                  />
                }
              />
              <Route
                path="/help"
                element={
                  <LegacyRouteRedirect
                    destination={codexShellRoutes.help.path}
                  />
                }
              />
              <Route
                path="/privacy"
                element={
                  <LegacyRouteRedirect
                    destination={valgaronPrivacyPolicy.webPath}
                  />
                }
              />
              <Route
                path="/entries"
                element={
                  <WorkbenchPage
                    activeWorld={activeWorld}
                    onArchiveEntry={archiveEntry}
                    onDeleteEntry={permanentlyDeleteEntry}
                    onDeleteRelationship={removeRelationship}
                    onSaveEntry={saveEntry}
                    onSaveRelationship={saveRelationship}
                  />
                }
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
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
