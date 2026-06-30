import { useState } from 'react';
import {
  BrowserRouter,
  Navigate,
  NavLink,
  Route,
  Routes,
} from 'react-router-dom';
import './App.css';
import { ResetConfirmationDialog } from './Components/Codex/CodexEntryViews';
import { ErrorBoundary } from './Components/Common/ErrorBoundary/ErrorBoundary';
import { RuntimeErrorFallback } from './Components/Common/RuntimeErrorFallback';
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

function AppShell() {
  const [isResetPending, setIsResetPending] = useState(false);
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
          <span
            className={`vwb-save-status ${
              saveStatus.state === 'failed' || saveStatus.state === 'paused'
                ? 'is-danger'
                : ''
            }`}
            role="status"
          >
            {saveStatus.state === 'saved'
              ? 'Saved'
              : saveStatus.state === 'paused'
              ? 'Save Paused'
              : 'Save Failed'}
          </span>
          <button
            className="vwb-secondary-button"
            type="button"
            onClick={() => setIsResetPending(true)}
          >
            Reset Starter Data
          </button>
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
