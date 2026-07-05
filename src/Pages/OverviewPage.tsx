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

  return (
    <main className="vwb-main" id="main-content" tabIndex={-1}>
      <section className="vwb-hero" aria-labelledby="overview-title">
        <div>
          <p className="vwb-kicker">
            {getWorkspaceOverviewWorkspaceKicker(summary)}
          </p>
          <h2 id="overview-title">{intro.title}</h2>
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

      <section className="vwb-panel" aria-labelledby="quick-create-title">
        <div className="vwb-section-heading">
          <div>
            <p className="vwb-kicker">
              {overviewFeatureCopy.quickCreateKicker}
            </p>
            <h2 id="quick-create-title">
              {overviewFeatureCopy.quickCreateTitle}
            </h2>
          </div>
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

      <section className="vwb-panel" aria-labelledby="global-search-title">
        <div className="vwb-section-heading">
          <div>
            <p className="vwb-kicker">
              {overviewFeatureCopy.globalSearchKicker}
            </p>
            <h2 id="global-search-title">
              {overviewFeatureCopy.globalSearchTitle}
            </h2>
          </div>
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

      <section className="vwb-panel" aria-labelledby="recent-title">
        <div className="vwb-section-heading">
          <div>
            <p className="vwb-kicker">{overviewFeatureCopy.recentKicker}</p>
            <h2 id="recent-title">{overviewFeatureCopy.recentTitle}</h2>
          </div>
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

      {entryHighlights.pinned.length > 0 ? (
        <section className="vwb-panel" aria-labelledby="pinned-title">
          <div className="vwb-section-heading">
            <div>
              <p className="vwb-kicker">{overviewFeatureCopy.pinnedKicker}</p>
              <h2 id="pinned-title">{overviewFeatureCopy.pinnedTitle}</h2>
            </div>
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
      ) : null}

      {incompleteEntries.length > 0 ? (
        <section className="vwb-panel" aria-labelledby="incomplete-title">
          <div className="vwb-section-heading">
            <div>
              <p className="vwb-kicker">
                {overviewFeatureCopy.incompleteKicker}
              </p>
              <h2 id="incomplete-title">
                {overviewFeatureCopy.incompleteTitle}
              </h2>
            </div>
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
      ) : null}
    </main>
  );
}
