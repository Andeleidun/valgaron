import { useMemo, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { formatUpdatedAt, getEntries } from '../Utlilities/codexEntries';
import { getIncompleteEntries } from '../Utlilities/codexTemplates';
import {
  getSearchableEntries,
  getSearchResultContext,
  searchEntries,
} from '../Utlilities/codexSearch';
import type { WorldCodex, WorldSectionConfig } from '../types';

export function Overview({
  codex,
  sections,
  worldName,
}: {
  codex: WorldCodex;
  sections: readonly WorldSectionConfig[];
  worldName: string;
}) {
  const [globalQuery, setGlobalQuery] = useState('');
  const visibleEntries = useMemo(
    () =>
      getSearchableEntries(codex, sections).filter(
        (entry) => entry.status !== 'archived'
      ),
    [codex, sections]
  );
  const globalResults = useMemo(
    () => searchEntries(visibleEntries, sections, globalQuery).slice(0, 8),
    [globalQuery, sections, visibleEntries]
  );
  const pinnedEntries = useMemo(
    () => visibleEntries.filter((entry) => entry.pinned).slice(0, 6),
    [visibleEntries]
  );
  const recentEntries = useMemo(
    () =>
      [...visibleEntries]
        .sort(
          (first, second) =>
            new Date(second.updatedAt).getTime() -
            new Date(first.updatedAt).getTime()
        )
        .slice(0, 6),
    [visibleEntries]
  );
  const incompleteEntries = useMemo(
    () => getIncompleteEntries(visibleEntries, sections).slice(0, 6),
    [sections, visibleEntries]
  );

  return (
    <main className="vwb-main" id="main-content" tabIndex={-1}>
      <section className="vwb-hero" aria-labelledby="overview-title">
        <div>
          <p className="vwb-kicker">{worldName} Workspace</p>
          <h1 id="overview-title">
            Draft the world where the story can breathe.
          </h1>
        </div>
        <p>
          Capture the people, places, powers, lore, and turning points that make
          a setting coherent enough to write in.
        </p>
      </section>

      <section className="vwb-local-data-notice" aria-label="Local data notice">
        <strong>Local browser data.</strong>
        <span>
          Your work is saved in this browser profile. Export JSON backups
          regularly, especially before clearing browser data or changing
          devices.
        </span>
      </section>

      <section className="vwb-stat-grid" aria-label="Codex totals">
        {sections.map((section) => (
          <NavLink
            className="vwb-stat-card"
            to={`/${section.id}`}
            key={section.id}
          >
            <span>{section.title}</span>
            <strong>{getEntries(codex, section.id).length}</strong>
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
              to={`/${section.id}`}
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
                    <NavLink to={entry.sectionPath}>Open</NavLink>
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
          {recentEntries.map((entry) => (
            <article className="vwb-entry-card" key={entry.id}>
              <div className="vwb-entry-card-header">
                <div>
                  <p className="vwb-entry-kind">{entry.sectionTitle}</p>
                  <h3>{entry.name}</h3>
                </div>
                <NavLink to={entry.sectionPath}>Edit</NavLink>
              </div>
              <p>{entry.summary || 'No summary yet.'}</p>
              <small>Updated {formatUpdatedAt(entry.updatedAt)}</small>
            </article>
          ))}
        </div>
      </section>

      {pinnedEntries.length > 0 ? (
        <section className="vwb-panel" aria-labelledby="pinned-title">
          <div className="vwb-section-heading">
            <div>
              <p className="vwb-kicker">Pinned</p>
              <h2 id="pinned-title">Important records</h2>
            </div>
          </div>
          <div className="vwb-entry-list">
            {pinnedEntries.map((entry) => (
              <article className="vwb-entry-card" key={entry.id}>
                <div className="vwb-entry-card-header">
                  <div>
                    <p className="vwb-entry-kind">{entry.sectionTitle}</p>
                    <h3>{entry.name}</h3>
                  </div>
                  <NavLink to={entry.sectionPath}>Edit</NavLink>
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
                  <NavLink to={`/${item.section.id}`}>Edit</NavLink>
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
