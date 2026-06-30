import { useEffect, useMemo, useState } from 'react';
import {
  BrowserRouter,
  Navigate,
  NavLink,
  Route,
  Routes,
  useParams,
} from 'react-router-dom';
import './App.css';
import {
  loadCodex,
  resetCodexStorage,
  saveCodex,
} from './Utlilities/codexStorage';
import {
  applyEntry,
  createEmptyDraft,
  draftFromEntry,
  entryFromDraft,
  entryMatchesFilters,
  formatUpdatedAt,
  getDetailValue,
  getEntries,
  getSectionById,
  getSectionTags,
  type EntryDraft,
} from './Utlilities/codexEntries';
import { worldSections } from './Utlilities/seedCodex';
import type {
  WorldCodex,
  WorldDetailFieldKey,
  WorldEntry,
  WorldSectionConfig,
} from './types';

function Overview({ codex }: { codex: WorldCodex }) {
  const recentEntries = useMemo(
    () =>
      worldSections
        .flatMap((section) =>
          getEntries(codex, section.id).map((entry) => ({
            ...entry,
            sectionTitle: section.title,
            sectionPath: `/${section.id}`,
          }))
        )
        .sort(
          (first, second) =>
            new Date(second.updatedAt).getTime() -
            new Date(first.updatedAt).getTime()
        )
        .slice(0, 6),
    [codex]
  );

  return (
    <main className="vwb-main" id="main-content">
      <section className="vwb-hero" aria-labelledby="overview-title">
        <div>
          <p className="vwb-kicker">Valgaron World Codex</p>
          <h1 id="overview-title">
            Draft the world where the story can breathe.
          </h1>
        </div>
        <p>
          Capture the people, places, powers, lore, and turning points that make
          Valgaron coherent enough to write in.
        </p>
      </section>

      <section className="vwb-stat-grid" aria-label="Codex totals">
        {worldSections.map((section) => (
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
    </main>
  );
}

function EntryCard({
  entry,
  section,
  isSelected,
  onSelect,
}: {
  entry: WorldEntry;
  section: WorldSectionConfig;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const detailPreview = section.detailFields
    .map((field) => getDetailValue(entry, field.key))
    .filter(Boolean)
    .slice(0, 2)
    .join(' | ');

  return (
    <button
      className={`vwb-entry-card vwb-entry-button ${
        isSelected ? 'is-selected' : ''
      }`}
      type="button"
      onClick={onSelect}
      aria-pressed={isSelected}
    >
      <span className="vwb-entry-card-header">
        <span>
          <span className="vwb-entry-kind">{section.singularTitle}</span>
          <strong>{entry.name}</strong>
        </span>
        <small>{formatUpdatedAt(entry.updatedAt)}</small>
      </span>
      <span>{entry.summary || 'No summary yet.'}</span>
      {detailPreview ? <small>{detailPreview}</small> : null}
      {entry.tags.length > 0 ? (
        <span className="vwb-tag-row" aria-label="Tags">
          {entry.tags.map((tag) => (
            <span className="vwb-tag" key={tag}>
              {tag}
            </span>
          ))}
        </span>
      ) : null}
    </button>
  );
}

function EntryForm({
  section,
  selectedEntry,
  onSave,
  onCancel,
}: {
  section: WorldSectionConfig;
  selectedEntry?: WorldEntry;
  onSave: (entry: WorldEntry) => void;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState<EntryDraft>(() =>
    selectedEntry ? draftFromEntry(selectedEntry, section) : createEmptyDraft()
  );
  const [error, setError] = useState('');

  useEffect(() => {
    setDraft(
      selectedEntry
        ? draftFromEntry(selectedEntry, section)
        : createEmptyDraft()
    );
    setError('');
  }, [section, selectedEntry]);

  const updateDetail = (key: WorldDetailFieldKey, value: string) => {
    setDraft((currentDraft) => ({
      ...currentDraft,
      details: { ...currentDraft.details, [key]: value },
    }));
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!draft.name.trim()) {
      setError(`${section.singularTitle} name is required.`);
      return;
    }
    onSave(entryFromDraft(section, draft, selectedEntry));
    setDraft(createEmptyDraft());
    setError('');
  };

  return (
    <form className="vwb-form" onSubmit={handleSubmit}>
      <div className="vwb-section-heading">
        <div>
          <p className="vwb-kicker">
            {selectedEntry ? 'Edit entry' : 'New entry'}
          </p>
          <h2>
            {selectedEntry
              ? selectedEntry.name
              : `Create ${section.singularTitle}`}
          </h2>
        </div>
        {selectedEntry ? (
          <button
            className="vwb-secondary-button"
            type="button"
            onClick={onCancel}
          >
            New
          </button>
        ) : null}
      </div>

      <label>
        Name
        <input
          value={draft.name}
          onChange={(event) => setDraft({ ...draft, name: event.target.value })}
          placeholder={`${section.singularTitle} name`}
        />
      </label>

      <label>
        Summary
        <textarea
          value={draft.summary}
          onChange={(event) =>
            setDraft({ ...draft, summary: event.target.value })
          }
          placeholder="A short working summary"
          rows={4}
        />
      </label>

      <label>
        Tags
        <input
          value={draft.tags}
          onChange={(event) => setDraft({ ...draft, tags: event.target.value })}
          placeholder="comma, separated, tags"
        />
      </label>

      <div className="vwb-form-grid">
        {section.detailFields.map((field) => (
          <label
            className={field.multiline ? 'vwb-wide-field' : undefined}
            key={field.key}
          >
            {field.label}
            {field.multiline ? (
              <textarea
                value={draft.details[field.key] ?? ''}
                onChange={(event) =>
                  updateDetail(field.key, event.target.value)
                }
                rows={3}
              />
            ) : (
              <input
                value={draft.details[field.key] ?? ''}
                onChange={(event) =>
                  updateDetail(field.key, event.target.value)
                }
              />
            )}
          </label>
        ))}
      </div>

      {error ? <p className="vwb-form-error">{error}</p> : null}
      <button className="vwb-primary-button" type="submit">
        {selectedEntry ? 'Save Changes' : `Create ${section.singularTitle}`}
      </button>
    </form>
  );
}

function SectionPage({
  codex,
  onSaveEntry,
}: {
  codex: WorldCodex;
  onSaveEntry: (entry: WorldEntry) => void;
}) {
  const { sectionId } = useParams();
  const section = getSectionById(sectionId);
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [activeTag, setActiveTag] = useState('');

  useEffect(() => {
    setSelectedEntryId(null);
    setQuery('');
    setActiveTag('');
  }, [sectionId]);

  const entries = useMemo(
    () => (section ? getEntries(codex, section.id) : []),
    [codex, section]
  );
  const availableTags = useMemo(() => getSectionTags(entries), [entries]);
  const filteredEntries = useMemo(
    () =>
      section
        ? entries.filter((entry) =>
            entryMatchesFilters(entry, section, query, activeTag)
          )
        : [],
    [activeTag, entries, query, section]
  );
  const selectedEntry = filteredEntries.find(
    (entry) => entry.id === selectedEntryId
  );
  const hasActiveFilters = query.trim().length > 0 || activeTag.length > 0;

  useEffect(() => {
    if (
      selectedEntryId &&
      !filteredEntries.some((entry) => entry.id === selectedEntryId)
    ) {
      setSelectedEntryId(null);
    }
  }, [filteredEntries, selectedEntryId]);

  if (!section) {
    return <Navigate to="/" replace />;
  }

  const clearFilters = () => {
    setQuery('');
    setActiveTag('');
  };

  return (
    <main className="vwb-main vwb-section-layout" id="main-content">
      <section
        className="vwb-panel vwb-section-intro"
        aria-labelledby={`${section.id}-title`}
      >
        <p className="vwb-kicker">Codex section</p>
        <h1 id={`${section.id}-title`}>{section.title}</h1>
        <p>{section.description}</p>
      </section>

      <section
        className="vwb-entry-column"
        aria-label={`${section.title} entries`}
      >
        <div className="vwb-section-heading">
          <div>
            <p className="vwb-kicker">
              {filteredEntries.length} of {entries.length} shown
            </p>
            <h2>Entries</h2>
          </div>
        </div>
        <div
          className="vwb-filter-panel"
          aria-label={`${section.title} filters`}
        >
          <label className="vwb-search-field">
            Search {section.title}
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search names, summaries, tags, and details"
              type="search"
            />
          </label>
          {availableTags.length > 0 ? (
            <div className="vwb-tag-filter-group" aria-label="Filter by tag">
              {availableTags.map((tag) => (
                <button
                  className={`vwb-tag-filter ${
                    activeTag === tag ? 'is-active' : ''
                  }`}
                  key={tag}
                  type="button"
                  onClick={() =>
                    setActiveTag((currentTag) =>
                      currentTag === tag ? '' : tag
                    )
                  }
                  aria-pressed={activeTag === tag}
                >
                  {tag}
                </button>
              ))}
            </div>
          ) : null}
          {hasActiveFilters ? (
            <button
              className="vwb-secondary-button vwb-clear-filters-button"
              type="button"
              onClick={clearFilters}
            >
              Clear Filters
            </button>
          ) : null}
        </div>
        <div className="vwb-entry-list">
          {filteredEntries.length > 0 ? (
            filteredEntries.map((entry) => (
              <EntryCard
                entry={entry}
                isSelected={entry.id === selectedEntryId}
                key={entry.id}
                onSelect={() => setSelectedEntryId(entry.id)}
                section={section}
              />
            ))
          ) : (
            <div className="vwb-empty-results" role="status">
              <strong>No entries found.</strong>
              <p>Try a different search term or clear the active filters.</p>
              {hasActiveFilters ? (
                <button
                  className="vwb-secondary-button"
                  type="button"
                  onClick={clearFilters}
                >
                  Clear Filters
                </button>
              ) : null}
            </div>
          )}
        </div>
      </section>

      <section
        className="vwb-panel"
        aria-label={`${section.singularTitle} editor`}
      >
        <EntryForm
          key={`${section.id}-${selectedEntry?.id ?? 'new'}`}
          onCancel={() => setSelectedEntryId(null)}
          onSave={(entry) => {
            onSaveEntry(entry);
            setSelectedEntryId(entry.id);
          }}
          section={section}
          selectedEntry={selectedEntry}
        />
      </section>
    </main>
  );
}

function AppShell() {
  const [codex, setCodex] = useState<WorldCodex>(() => loadCodex());

  useEffect(() => {
    saveCodex(codex);
  }, [codex]);

  const saveEntry = (entry: WorldEntry) => {
    setCodex((currentCodex) => applyEntry(currentCodex, entry));
  };

  const resetToSeed = () => {
    setCodex(resetCodexStorage());
  };

  return (
    <BrowserRouter>
      <div className="vwb-app-shell">
        <header className="vwb-app-header">
          <NavLink className="vwb-brand" to="/" aria-label="Valgaron overview">
            <span>Valgaron</span>
            <strong>World Codex</strong>
          </NavLink>
          <nav className="vwb-top-nav" aria-label="Codex sections">
            {worldSections.map((section) => (
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
          <button
            className="vwb-secondary-button"
            type="button"
            onClick={resetToSeed}
          >
            Reset Seed
          </button>
        </header>

        <Routes>
          <Route path="/" element={<Overview codex={codex} />} />
          <Route
            path="/:sectionId"
            element={<SectionPage codex={codex} onSaveEntry={saveEntry} />}
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default AppShell;
