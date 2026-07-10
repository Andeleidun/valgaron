import { useMemo, useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  getActiveWorld,
  getCodexScreenIntro,
  getWorkspaceOverviewWorkspaceKicker,
  getWorkspaceOverviewEntryRoute,
  getWorkspaceOverviewModel,
  getWorkspaceOverviewSectionRoute,
  overviewFeatureCopy,
  type WorldDocument,
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

export function Overview({ document }: { document: WorldDocument }) {
  const [globalQuery, setGlobalQuery] = useState('');
  const activeWorld = useMemo(() => getActiveWorld(document), [document]);
  const intro = getCodexScreenIntro('overview');
  const overview = useMemo(
    () =>
      getWorkspaceOverviewModel({
        document,
        workspace: activeWorld,
        query: globalQuery,
        searchLimit: 8,
        highlightLimit: 6,
        incompleteLimit: 6,
      }),
    [activeWorld, document, globalQuery]
  );
  const {
    entryHighlights,
    incompleteEntries,
    quickCreateActions,
    searchResults,
    sections,
    summary,
  } = overview;
  const dashboard = useDashboardWorkspace({
    pageId: 'overview',
    activeCardIds: [
      'overview.metrics',
      'overview.quick-create',
      'overview.search',
      'overview.recent',
      ...(entryHighlights.pinned.length > 0 ? ['overview.pinned'] : []),
      ...(incompleteEntries.length > 0 ? ['overview.incomplete'] : []),
    ],
  });

  const renderCardControls = (cardId: string) => {
    const card = dashboard.cardsById.get(cardId);
    const definition = dashboard.definitions.find(
      (candidate) => candidate.id === cardId
    );
    if (!card || !definition) return null;
    return (
      <DashboardCardControls
        card={card}
        definition={definition}
        isCustomizing={dashboard.isCustomizing}
        onCollapse={() => dashboard.collapse(cardId)}
        onFocus={() => dashboard.focus(cardId)}
        onMove={(direction) => {
          dashboard.moveRelative(cardId, direction);
        }}
        onMoveToRegion={(region) => dashboard.moveToRegion(cardId, region)}
        onReset={() => dashboard.resetCard(cardId)}
        onResize={(size) => dashboard.resize(cardId, size)}
      />
    );
  };

  return (
    <main
      className="vwb-main vwb-overview-page"
      id="main-content"
      ref={dashboard.containerRef}
      tabIndex={-1}
    >
      <section className="vwb-hero" aria-labelledby="overview-title">
        <div>
          <p className="vwb-kicker">
            {getWorkspaceOverviewWorkspaceKicker(summary)}
          </p>
          <h1 id="overview-title">{intro.title}</h1>
        </div>
        <p>{intro.detail}</p>
      </section>

      <section
        className="vwb-local-data-notice"
        aria-label={overviewFeatureCopy.localDataNoticeLabel}
      >
        <strong>{overviewFeatureCopy.localDataNoticeTitle}</strong>
        <span>{overviewFeatureCopy.localDataNoticeDetail}</span>
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
        onFocusPrimary={() => dashboard.focus('overview.recent')}
        onRedo={() => dashboard.dispatch({ type: 'redo' })}
        onReset={dashboard.reset}
        onResetAll={dashboard.resetAll}
        onUndo={() => dashboard.dispatch({ type: 'undo' })}
        presets={dashboard.presets}
        summary="Arrange the cards that help you continue drafting."
      />
      <DashboardShelf
        cards={dashboard.layout.cards.filter((card) => card.region === 'shelf')}
        getSummary={(card) => {
          if (card.id === 'overview.recent') {
            return ` · ${entryHighlights.recent.length}`;
          }
          if (card.id === 'overview.pinned') {
            return ` · ${entryHighlights.pinned.length}`;
          }
          if (card.id === 'overview.incomplete') {
            return ` · ${incompleteEntries.length}`;
          }
          return '';
        }}
        onRestore={dashboard.restore}
      />
      <span className="vwb-screen-reader-only" aria-live="polite">
        {dashboard.announcement}
      </span>

      <DashboardGrid
        ariaLabel="Overview dashboard cards"
        cards={dashboard.layout.cards}
        className="vwb-overview-dashboard-grid"
        isCustomizing={dashboard.isCustomizing}
        onMoveCard={(cardId, targetCardId) => {
          dashboard.moveBefore(cardId, targetCardId);
        }}
      >
        <DashboardGridItem cardId="overview.metrics">
          <section
            className="vwb-stat-grid"
            aria-label={overviewFeatureCopy.codexTotalsLabel}
          >
            {sections.map((section) => (
              <NavLink
                className="vwb-stat-card"
                to={getWorkspaceOverviewSectionRoute(section)}
                key={section.id}
              >
                <span>{section.title}</span>
                <strong>{summary.sectionCounts[section.id] ?? 0}</strong>
              </NavLink>
            ))}
          </section>
        </DashboardGridItem>

        <DashboardGridItem cardId="overview.quick-create">
          <section
            className="vwb-panel vwb-overview-quick-create"
            aria-labelledby="quick-create-title"
          >
            <div className="vwb-section-heading">
              <div>
                <p className="vwb-kicker">
                  {overviewFeatureCopy.quickCreateKicker}
                </p>
                <h2 id="quick-create-title">
                  {overviewFeatureCopy.quickCreateTitle}
                </h2>
              </div>
              {renderCardControls('overview.quick-create')}
            </div>
            <div className="vwb-quick-create-list">
              {quickCreateActions.map((action) => (
                <NavLink
                  className="vwb-secondary-button"
                  key={action.id}
                  to={action.route}
                >
                  {action.label}
                </NavLink>
              ))}
            </div>
          </section>
        </DashboardGridItem>

        <DashboardGridItem cardId="overview.search">
          <section
            className="vwb-panel vwb-overview-search"
            aria-labelledby="global-search-title"
          >
            <div className="vwb-section-heading">
              <div>
                <p className="vwb-kicker">
                  {overviewFeatureCopy.globalSearchKicker}
                </p>
                <h2 id="global-search-title">
                  {overviewFeatureCopy.globalSearchTitle}
                </h2>
              </div>
              {renderCardControls('overview.search')}
            </div>
            <label className="vwb-search-field">
              {overviewFeatureCopy.searchEntriesLabel}
              <input
                value={globalQuery}
                onChange={(event) => setGlobalQuery(event.target.value)}
                placeholder={overviewFeatureCopy.searchPlaceholder}
                type="search"
              />
            </label>
            {globalQuery.trim() ? (
              <button
                className="vwb-secondary-button vwb-clear-filters-button"
                type="button"
                onClick={() => setGlobalQuery('')}
              >
                {overviewFeatureCopy.clearSearchLabel}
              </button>
            ) : null}
            {globalQuery.trim() ? (
              <div className="vwb-entry-list vwb-search-results" role="list">
                {searchResults.length > 0 ? (
                  searchResults.map((entry) => (
                    <article
                      className="vwb-entry-card"
                      key={entry.id}
                      role="listitem"
                    >
                      <div className="vwb-entry-card-header">
                        <div>
                          <p className="vwb-entry-kind">{entry.contextText}</p>
                          <h3>{entry.name}</h3>
                        </div>
                        <NavLink to={getWorkspaceOverviewEntryRoute(entry)}>
                          {overviewFeatureCopy.openLabel}
                        </NavLink>
                      </div>
                      <p>{entry.summaryText}</p>
                    </article>
                  ))
                ) : (
                  <div className="vwb-empty-results" role="status">
                    <strong>{overviewFeatureCopy.noSearchResultsTitle}</strong>
                    <p>{overviewFeatureCopy.noSearchResultsDetail}</p>
                  </div>
                )}
              </div>
            ) : null}
          </section>
        </DashboardGridItem>

        <DashboardGridItem cardId="overview.recent">
          <section
            className="vwb-panel vwb-overview-recent"
            aria-labelledby="recent-title"
          >
            <div className="vwb-section-heading">
              <div>
                <p className="vwb-kicker">{overviewFeatureCopy.recentKicker}</p>
                <h2 id="recent-title">{overviewFeatureCopy.recentTitle}</h2>
              </div>
              {renderCardControls('overview.recent')}
            </div>
            <div className="vwb-entry-list">
              {entryHighlights.recent.length > 0 ? (
                entryHighlights.recent.map((entry) => (
                  <article className="vwb-entry-card" key={entry.id}>
                    <div className="vwb-entry-card-header">
                      <div>
                        <p className="vwb-entry-kind">{entry.sectionTitle}</p>
                        <h3>{entry.name}</h3>
                      </div>
                      <NavLink to={getWorkspaceOverviewEntryRoute(entry)}>
                        {overviewFeatureCopy.editLabel}
                      </NavLink>
                    </div>
                    <p>{entry.summaryText}</p>
                    <small>{entry.updatedText}</small>
                  </article>
                ))
              ) : (
                <div className="vwb-empty-results" role="status">
                  <strong>{overviewFeatureCopy.noRecentRecordsTitle}</strong>
                  <p>{overviewFeatureCopy.noRecentRecordsDetail}</p>
                </div>
              )}
            </div>
          </section>
        </DashboardGridItem>

        {entryHighlights.pinned.length > 0 ? (
          <DashboardGridItem cardId="overview.pinned">
            <section
              className="vwb-panel vwb-overview-pinned"
              aria-labelledby="pinned-title"
            >
              <div className="vwb-section-heading">
                <div>
                  <p className="vwb-kicker">
                    {overviewFeatureCopy.pinnedKicker}
                  </p>
                  <h2 id="pinned-title">{overviewFeatureCopy.pinnedTitle}</h2>
                </div>
                {renderCardControls('overview.pinned')}
              </div>
              <div className="vwb-entry-list">
                {entryHighlights.pinned.map((entry) => (
                  <article className="vwb-entry-card" key={entry.id}>
                    <div className="vwb-entry-card-header">
                      <div>
                        <p className="vwb-entry-kind">{entry.sectionTitle}</p>
                        <h3>{entry.name}</h3>
                      </div>
                      <NavLink to={getWorkspaceOverviewEntryRoute(entry)}>
                        {overviewFeatureCopy.editLabel}
                      </NavLink>
                    </div>
                    <p>{entry.summaryText}</p>
                    <small>{entry.updatedText}</small>
                  </article>
                ))}
              </div>
            </section>
          </DashboardGridItem>
        ) : null}

        {incompleteEntries.length > 0 ? (
          <DashboardGridItem cardId="overview.incomplete">
            <section
              className="vwb-panel vwb-overview-incomplete"
              aria-labelledby="incomplete-title"
            >
              <div className="vwb-section-heading">
                <div>
                  <p className="vwb-kicker">
                    {overviewFeatureCopy.incompleteKicker}
                  </p>
                  <h2 id="incomplete-title">
                    {overviewFeatureCopy.incompleteTitle}
                  </h2>
                </div>
                {renderCardControls('overview.incomplete')}
              </div>
              <div className="vwb-entry-list">
                {incompleteEntries.map((item) => (
                  <article className="vwb-entry-card" key={item.entry.id}>
                    <div className="vwb-entry-card-header">
                      <div>
                        <p className="vwb-entry-kind">{item.contextText}</p>
                        <h3>{item.entry.name}</h3>
                      </div>
                      <NavLink
                        to={getWorkspaceOverviewEntryRoute({
                          id: item.entry.id,
                          name: item.entry.name,
                          sectionId: item.section.id,
                        })}
                      >
                        {overviewFeatureCopy.editLabel}
                      </NavLink>
                    </div>
                    <p>{item.promptText}</p>
                  </article>
                ))}
              </div>
            </section>
          </DashboardGridItem>
        ) : null}
      </DashboardGrid>
    </main>
  );
}
