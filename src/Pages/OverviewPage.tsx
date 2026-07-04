import { useMemo, useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  formatUpdatedAt,
  getActiveWorld,
  getCodexEntriesRoute,
  getCodexOverviewSummary,
  getCodexScreenIntro,
  getIncompleteEntries,
  getSearchResultContext,
  getVisibleWorkspaceEntries,
  getWorkspaceOverviewEntryHighlights,
  searchEntries,
  type SearchableEntry,
  type WorldDocument,
} from '@valgaron/core';

function getEntryRoute(
  entry: Pick<SearchableEntry, 'sectionId' | 'id' | 'name'>
) {
  return getCodexEntriesRoute({
    sectionId: entry.sectionId,
    entryId: entry.id,
    intent: 'edit',
    query: entry.name,
  });
}

export function Overview({ document }: { document: WorldDocument }) {
  const [globalQuery, setGlobalQuery] = useState('');
  const activeWorld = useMemo(() => getActiveWorld(document), [document]);
  const intro = getCodexScreenIntro('overview');
  const sections = activeWorld.entryTypes;
  const summary = useMemo(() => getCodexOverviewSummary(document), [document]);
  const visibleEntries = useMemo(
    () => getVisibleWorkspaceEntries(activeWorld),
    [activeWorld]
  );
  const globalResults = useMemo(
    () => searchEntries(visibleEntries, sections, globalQuery).slice(0, 8),
    [globalQuery, sections, visibleEntries]
  );
  const entryHighlights = useMemo(
    () => getWorkspaceOverviewEntryHighlights(activeWorld, 6),
    [activeWorld]
  );
  const incompleteEntries = useMemo(
    () => getIncompleteEntries(visibleEntries, sections).slice(0, 6),
    [sections, visibleEntries]
  );

  return (
    <main className="vwb-main" id="main-content" tabIndex={-1}>
      <section className="vwb-hero" aria-labelledby="overview-title">
        <div>
          <p className="vwb-kicker">{summary.workspaceName} Workspace</p>
          <h2 id="overview-title">{intro.title}</h2>
        </div>
        <p>{intro.detail}</p>
      </section>

      <section className="vwb-local-data-notice" aria-label="Local data notice">
        <strong>Local browser data.</strong>
        <span>
          Use the header Save button to write current progress to this browser
          profile. Export JSON backups regularly, especially before clearing
          browser data or changing devices.
        </span>
      </section>

      <section className="vwb-stat-grid" aria-label="Codex totals">
        {sections.map((section) => (
          <NavLink
            className="vwb-stat-card"
            to={getCodexEntriesRoute({ sectionId: section.id })}
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
            <p className="vwb-kicker">Quick create</p>
            <h2 id="quick-create-title">Start a new record</h2>
          </div>
        </div>
        <div className="vwb-quick-create-list">
          {sections.map((section) => (
            <NavLink
              className="vwb-secondary-button"
              key={section.id}
              to={getCodexEntriesRoute({
                sectionId: section.id,
                intent: 'new',
              })}
            >
              New {section.singularTitle}
            </NavLink>
          ))}
        </div>
      </section>

      <section className="vwb-panel" aria-labelledby="global-search-title">
        <div className="vwb-section-heading">
          <div>
            <p className="vwb-kicker">Global search</p>
            <h2 id="global-search-title">Find anything in this world</h2>
          </div>
        </div>
        <label className="vwb-search-field">
          Search entries
          <input
            value={globalQuery}
            onChange={(event) => setGlobalQuery(event.target.value)}
            placeholder="Search codex records"
            type="search"
          />
        </label>
        {globalQuery.trim() ? (
          <button
            className="vwb-secondary-button vwb-clear-filters-button"
            type="button"
            onClick={() => setGlobalQuery('')}
          >
            Clear Search
          </button>
        ) : null}
        {globalQuery.trim() ? (
          <div className="vwb-entry-list vwb-search-results" role="list">
            {globalResults.length > 0 ? (
              globalResults.map((entry) => (
                <article
                  className="vwb-entry-card"
                  key={entry.id}
                  role="listitem"
                >
                  <div className="vwb-entry-card-header">
                    <div>
                      <p className="vwb-entry-kind">
                        {getSearchResultContext(entry)}
                      </p>
                      <h3>{entry.name}</h3>
                    </div>
                    <NavLink to={getEntryRoute(entry)}>Open</NavLink>
                  </div>
                  <p>{entry.summary || 'No summary yet.'}</p>
                </article>
              ))
            ) : (
              <div className="vwb-empty-results" role="status">
                <strong>No entries found.</strong>
                <p>Try another name, tag, note, or world detail.</p>
              </div>
            )}
          </div>
        ) : null}
      </section>

      <section className="vwb-panel" aria-labelledby="recent-title">
        <div className="vwb-section-heading">
          <div>
            <p className="vwb-kicker">Recently updated</p>
            <h2 id="recent-title">Latest codex work</h2>
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
                  <NavLink to={getEntryRoute(entry)}>Edit</NavLink>
                </div>
                <p>{entry.summary || 'No summary yet.'}</p>
                <small>Updated {formatUpdatedAt(entry.updatedAt)}</small>
              </article>
            ))
          ) : (
            <div className="vwb-empty-results" role="status">
              <strong>No recent records yet.</strong>
              <p>Create a codex record to start filling this workspace.</p>
            </div>
          )}
        </div>
      </section>

      {entryHighlights.pinned.length > 0 ? (
        <section className="vwb-panel" aria-labelledby="pinned-title">
          <div className="vwb-section-heading">
            <div>
              <p className="vwb-kicker">Pinned</p>
              <h2 id="pinned-title">Important records</h2>
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
                  <NavLink to={getEntryRoute(entry)}>Edit</NavLink>
                </div>
                <p>{entry.summary || 'No summary yet.'}</p>
                <small>Updated {formatUpdatedAt(entry.updatedAt)}</small>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {incompleteEntries.length > 0 ? (
        <section className="vwb-panel" aria-labelledby="incomplete-title">
          <div className="vwb-section-heading">
            <div>
              <p className="vwb-kicker">Needs attention</p>
              <h2 id="incomplete-title">Incomplete records</h2>
            </div>
          </div>
          <div className="vwb-entry-list">
            {incompleteEntries.map((item) => (
              <article className="vwb-entry-card" key={item.entry.id}>
                <div className="vwb-entry-card-header">
                  <div>
                    <p className="vwb-entry-kind">
                      {item.section.title} - {item.percent}% complete
                    </p>
                    <h3>{item.entry.name}</h3>
                  </div>
                  <NavLink
                    to={getCodexEntriesRoute({
                      sectionId: item.section.id,
                      entryId: item.entry.id,
                      intent: 'edit',
                      query: item.entry.name,
                    })}
                  >
                    Edit
                  </NavLink>
                </div>
                <p>{item.prompts[0]}</p>
              </article>
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}
