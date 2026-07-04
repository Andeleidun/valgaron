import { APP_NAME, APP_VERSION } from '../Utlilities/appMetadata';
import {
  codexDataHelpDetails,
  codexDataHelpSummary,
  codexFirstUseHelp,
  codexPrivacyHelp,
  codexReleaseLimitsHelp,
  codexSupportHelp,
  codexWorkflowHelpTopics,
  getCodexScreenIntro,
} from '@valgaron/core';

export function HelpPage() {
  const intro = getCodexScreenIntro('help');
  return (
    <main className="vwb-main vwb-help-layout" id="main-content" tabIndex={-1}>
      <section className="vwb-panel vwb-section-intro">
        <p className="vwb-kicker">{intro.kicker}</p>
        <h1>{APP_NAME}</h1>
        <p>
          {intro.detail} Version {APP_VERSION}.
        </p>
      </section>

      <section className="vwb-panel" aria-labelledby="help-start-title">
        <div className="vwb-section-heading">
          <div>
            <p className="vwb-kicker">First use</p>
            <h2 id="help-start-title">Start with one workspace</h2>
          </div>
        </div>
        <p>{codexFirstUseHelp}</p>
      </section>

      <section className="vwb-help-grid" aria-label="Workflow help">
        {codexWorkflowHelpTopics.map((section) => (
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
        <p>{codexDataHelpSummary}</p>
        <dl className="vwb-detail-list">
          {codexDataHelpDetails.map((item) => (
            <div key={item.term}>
              <dt>{item.term}</dt>
              <dd>{item.detail}</dd>
            </div>
          ))}
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
        <p>{codexSupportHelp}</p>
      </section>

      <section className="vwb-panel" aria-labelledby="help-privacy-title">
        <div className="vwb-section-heading">
          <div>
            <p className="vwb-kicker">Privacy</p>
            <h2 id="help-privacy-title">No telemetry or remote account</h2>
          </div>
        </div>
        <p>{codexPrivacyHelp}</p>
      </section>

      <section className="vwb-panel" aria-labelledby="help-limits-title">
        <div className="vwb-section-heading">
          <div>
            <p className="vwb-kicker">Release limits</p>
            <h2 id="help-limits-title">Intentionally out of scope</h2>
          </div>
        </div>
        <p>{codexReleaseLimitsHelp}</p>
      </section>
    </main>
  );
}
