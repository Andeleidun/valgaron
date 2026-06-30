import { APP_NAME, APP_VERSION } from '../Utlilities/appMetadata';

const workflowSections = [
  {
    title: 'Build the codex',
    items: [
      'Use Overview to scan recent, pinned, incomplete, and quick-create records.',
      'Use section pages to create and edit characters, places, factions, lore, timeline events, and custom entry types.',
      'Use Workspaces for project/universe files, and use in-fiction worlds and planets for planets or realms inside a project.',
    ],
  },
  {
    title: 'Connect records',
    items: [
      'Use Relationships to link entries, inspect graph-style connections, and repair broken imported references.',
      'Use Timeline order controls to arrange events while keeping flexible prose dates and eras.',
      'Use tags, status, pinned records, and completeness prompts to keep unfinished work visible.',
    ],
  },
  {
    title: 'Protect local work',
    items: [
      'Download JSON backups regularly; active-workspace JSON is focused and full-document JSON includes every local workspace.',
      'Recovery snapshots help undo destructive local actions in the same browser profile only.',
      'Export before clearing browser data, switching browsers, using private browsing, or changing devices.',
    ],
  },
];

export function HelpPage() {
  return (
    <main className="vwb-main vwb-help-layout" id="main-content" tabIndex={-1}>
      <section className="vwb-panel vwb-section-intro">
        <p className="vwb-kicker">Help</p>
        <h1>{APP_NAME}</h1>
        <p>
          A local browser workspace for organizing fiction and tabletop
          worldbuilding records. Version {APP_VERSION}.
        </p>
      </section>

      <section className="vwb-panel" aria-labelledby="help-start-title">
        <div className="vwb-section-heading">
          <div>
            <p className="vwb-kicker">First use</p>
            <h2 id="help-start-title">Start with one workspace</h2>
          </div>
        </div>
        <p>
          The starter workspace is neutral sample content. Rename it, create a
          new project/universe workspace, or duplicate it from Workspaces. Use
          sections for codex records and reserve in-fiction worlds and planets
          for planets, realms, or major setting bodies inside a workspace.
        </p>
      </section>

      <section className="vwb-help-grid" aria-label="Workflow help">
        {workflowSections.map((section) => (
          <article className="vwb-panel" key={section.title}>
            <p className="vwb-kicker">Workflow</p>
            <h2>{section.title}</h2>
            <ul className="vwb-compact-list">
              {section.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
        ))}
      </section>

      <section className="vwb-panel" aria-labelledby="help-data-title">
        <div className="vwb-section-heading">
          <div>
            <p className="vwb-kicker">Local storage</p>
            <h2 id="help-data-title">Backups and recovery</h2>
          </div>
        </div>
        <p>
          The app saves to this browser profile with localStorage. It has no
          account, cloud sync, hosted database, telemetry, collaboration, or
          remote backup. JSON export is the backup you control.
        </p>
        <dl className="vwb-detail-list">
          <div>
            <dt>JSON export</dt>
            <dd>
              Active-workspace JSON backs up the current project. Full-document
              JSON backs up every local workspace in this browser profile.
            </dd>
          </div>
          <div>
            <dt>Markdown export</dt>
            <dd>A readable drafting reference, not a restore file.</dd>
          </div>
          <div>
            <dt>Import</dt>
            <dd>
              Validates JSON before replacing the current document and creates a
              recovery snapshot first when possible.
            </dd>
          </div>
          <div>
            <dt>Reset</dt>
            <dd>
              Replaces the local document with neutral starter data after
              confirmation. Export JSON first if the current work matters.
            </dd>
          </div>
          <div>
            <dt>Snapshots</dt>
            <dd>
              Local recovery points kept in the same browser profile before
              destructive actions. They are not portable backups.
            </dd>
          </div>
        </dl>
      </section>

      <section className="vwb-panel" aria-labelledby="help-offline-title">
        <div className="vwb-section-heading">
          <div>
            <p className="vwb-kicker">Offline</p>
            <h2 id="help-offline-title">Installable app limits</h2>
          </div>
        </div>
        <p>
          The published GitHub Pages build can be installed as a PWA after a
          successful visit in a supported browser. Offline use means the app
          shell can load without a network; it does not protect data from
          browser-profile deletion, private browsing cleanup, device loss, or
          storage quota failures.
        </p>
      </section>

      <section className="vwb-panel" aria-labelledby="help-support-title">
        <div className="vwb-section-heading">
          <div>
            <p className="vwb-kicker">Support</p>
            <h2 id="help-support-title">
              Report problems without world content
            </h2>
          </div>
        </div>
        <p>
          Use Data &gt; Diagnostics when reporting a storage or rendering
          problem. Diagnostics include app version, schema version, route,
          browser, storage status, recovery status, and counts. They omit world
          names, entry names, notes, summaries, tags, relationship notes, and
          ids by default.
        </p>
      </section>

      <section className="vwb-panel" aria-labelledby="help-privacy-title">
        <div className="vwb-section-heading">
          <div>
            <p className="vwb-kicker">Privacy</p>
            <h2 id="help-privacy-title">No telemetry or remote account</h2>
          </div>
        </div>
        <p>
          Valgaron does not send analytics, usage events, backups, diagnostics,
          or world content to a server. Maintainers cannot recover local data
          unless you choose to share a backup or diagnostic report.
        </p>
      </section>

      <section className="vwb-panel" aria-labelledby="help-limits-title">
        <div className="vwb-section-heading">
          <div>
            <p className="vwb-kicker">Release limits</p>
            <h2 id="help-limits-title">Intentionally out of scope</h2>
          </div>
        </div>
        <p>
          This release does not include accounts, cloud sync, collaboration,
          sharing, publishing, AI generation, payments, native mobile apps, or
          localization. Keep downloaded JSON backups as the portable copy of
          work you cannot afford to lose.
        </p>
      </section>
    </main>
  );
}
