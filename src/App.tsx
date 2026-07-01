import { useState } from 'react';
import {
  BrowserRouter,
  Link,
  Navigate,
  NavLink,
  Route,
  Routes,
} from 'react-router-dom';
import './App.css';
import { ResetConfirmationDialog } from './Components/Codex/CodexEntryViews';
import { ErrorBoundary } from './Components/Common/ErrorBoundary/ErrorBoundary';
import { RuntimeErrorFallback } from './Components/Common/RuntimeErrorFallback';
import {
  exportWorldToMarkdown,
  serializeActiveWorldBackup,
  serializeWorldDocumentBackup,
} from './Utlilities/codexDataPortability';
import { downloadTextFile, slugFilename } from './Utlilities/fileDownloads';
import { useBeforeUnloadWarning } from './Utlilities/unsavedChanges';
import { useWorldDocumentState } from './Utlilities/useWorldDocumentState';
import { DataPage } from './Pages/DataPage';
import { HelpPage } from './Pages/HelpPage';
import { Overview } from './Pages/OverviewPage';
import { RelationshipsPage } from './Pages/RelationshipsPage';
import { SectionPage } from './Pages/SectionPage';
import { WorkspacesPage } from './Pages/WorkspacesPage';

const routerBaseName =
  import.meta.env.BASE_URL === '/' ? undefined : import.meta.env.BASE_URL;
const appBasePath = import.meta.env.BASE_URL;
const headerDataMenuId = 'vwb-header-data-menu';

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

function AppShell() {
  const [isResetPending, setIsResetPending] = useState(false);
  const [isDataMenuOpen, setIsDataMenuOpen] = useState(false);
  const [dataMenuMessage, setDataMenuMessage] = useState('');
  const {
    activeWorld,
    archivePlanetaryWorld,
    archiveWorkspace,
    archiveEntry,
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
    hasUnsavedDocumentChanges,
    saveCurrentDocument,
    savePlanetaryWorld,
    saveEntry,
    saveRelationship,
    saveStatus,
    sections,
    switchWorkspace,
    updateWorkspace,
  } = useWorldDocumentState();

  const confirmResetToSeed = () => {
    resetToSeed();
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
  const filenameBase = slugFilename(activeWorld.name);
  useBeforeUnloadWarning(hasUnsavedDocumentChanges);

  return (
    <BrowserRouter basename={routerBaseName}>
      <div className="vwb-app-shell">
        <a className="vwb-skip-link" href="#main-content">
          Skip to main content
        </a>
        <header className="vwb-app-header">
          <NavLink
            className="vwb-brand"
            to="/"
            aria-label="Valgaron World Codex overview"
          >
            <span>Valgaron</span>
            <strong>World Codex</strong>
          </NavLink>
          <nav className="vwb-top-nav" aria-label="Codex sections">
            <NavLink
              className={({ isActive }) =>
                `vwb-nav-link ${isActive ? 'is-active' : ''}`
              }
              to="/"
              end
            >
              Overview
            </NavLink>
            {sections.map((section) => (
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
            <NavLink
              className={({ isActive }) =>
                `vwb-nav-link ${isActive ? 'is-active' : ''}`
              }
              to="/relationships"
            >
              Relationships
            </NavLink>
            <NavLink
              className={({ isActive }) =>
                `vwb-nav-link ${isActive ? 'is-active' : ''}`
              }
              to="/data"
            >
              Data
            </NavLink>
            <NavLink
              className={({ isActive }) =>
                `vwb-nav-link ${isActive ? 'is-active' : ''}`
              }
              to="/workspaces"
            >
              Workspaces
            </NavLink>
            <NavLink
              className={({ isActive }) =>
                `vwb-nav-link ${isActive ? 'is-active' : ''}`
              }
              to="/help"
            >
              Help
            </NavLink>
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
            aria-label="Save current progress to localStorage"
            aria-live="polite"
          >
            {saveButtonText(saveStatus.state)}
          </button>
          <div
            className="vwb-header-menu"
            onKeyDown={(event) => {
              if (event.key === 'Escape') {
                setIsDataMenuOpen(false);
              }
            }}
          >
            <button
              className="vwb-secondary-button"
              type="button"
              aria-controls={isDataMenuOpen ? headerDataMenuId : undefined}
              aria-expanded={isDataMenuOpen}
              onClick={() =>
                setIsDataMenuOpen((currentIsOpen) => !currentIsOpen)
              }
            >
              Data Menu
            </button>
            {isDataMenuOpen ? (
              <div
                className="vwb-header-menu-list"
                id={headerDataMenuId}
                aria-label="Data actions"
              >
                <button
                  type="button"
                  onClick={() =>
                    downloadHeaderExport(
                      `${filenameBase}.json`,
                      serializeActiveWorldBackup(document),
                      'Active workspace JSON'
                    )
                  }
                >
                  Download Active JSON
                </button>
                <button
                  type="button"
                  onClick={() =>
                    downloadHeaderExport(
                      'valgaron-all-workspaces.json',
                      serializeWorldDocumentBackup(document),
                      'All workspaces JSON'
                    )
                  }
                >
                  Download All JSON
                </button>
                <button
                  type="button"
                  onClick={() =>
                    downloadHeaderExport(
                      `${filenameBase}.md`,
                      exportWorldToMarkdown(activeWorld),
                      'Markdown export'
                    )
                  }
                >
                  Download Markdown
                </button>
                <Link
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
              activeWorld={activeWorld}
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
            <Route
              path="/"
              element={
                <Overview
                  codex={codex}
                  sections={sections}
                  worldName={activeWorld.name}
                />
              }
            />
            <Route
              path="/relationships"
              element={
                <RelationshipsPage
                  codex={codex}
                  onDeleteRelationship={removeRelationship}
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
                  onRequestReset={() => setIsResetPending(true)}
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
                  onCreateEntryType={createEntryType}
                  onCreateWorkspace={createWorkspace}
                  onDeleteEntryType={permanentlyDeleteEntryType}
                  onDeletePlanetaryWorld={permanentlyDeletePlanetaryWorld}
                  onDeleteWorkspace={permanentlyDeleteWorkspace}
                  onDuplicateWorkspace={duplicateWorkspace}
                  onSavePlanetaryWorld={savePlanetaryWorld}
                  onSwitchWorkspace={switchWorkspace}
                  onUpdateWorkspace={updateWorkspace}
                />
              }
            />
            <Route path="/help" element={<HelpPage />} />
            <Route
              path="/:sectionId"
              element={
                <SectionPage
                  codex={codex}
                  onArchiveEntry={archiveEntry}
                  onDeleteEntry={permanentlyDeleteEntry}
                  onSaveEntry={saveEntry}
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
            onCancel={() => setIsResetPending(false)}
            onConfirm={confirmResetToSeed}
          />
        ) : null}
      </div>
    </BrowserRouter>
  );
}

export default AppShell;
