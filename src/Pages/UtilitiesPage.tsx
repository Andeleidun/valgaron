import { useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  getCodexScreenIntro,
  getUtilitiesOverviewModel,
  getUtilitiesRouteFocusTargetId,
  utilityRouteFocusTargetIds,
  type WorldWorkspace,
} from '@valgaron/core';

function getUtilitiesRouteFocusTargetIdFromHash(hash: string): string {
  return getUtilitiesRouteFocusTargetId({
    focusId: decodeURIComponent(hash.replace(/^#/, '')),
  });
}

export function UtilitiesPage({
  activeWorld,
}: {
  activeWorld: WorldWorkspace;
}) {
  const location = useLocation();
  const intro = getCodexScreenIntro('utilities');
  const overview = getUtilitiesOverviewModel(activeWorld);

  useEffect(() => {
    const focusTargetId = getUtilitiesRouteFocusTargetIdFromHash(location.hash);
    if (!focusTargetId) {
      return;
    }
    const focusedSection = window.document.getElementById(focusTargetId);
    focusedSection?.scrollIntoView({ block: 'start' });
    focusedSection?.focus({ preventScroll: true });
  }, [location.hash]);

  return (
    <main className="vwb-main" id="main-content" tabIndex={-1}>
      <section className="vwb-panel vwb-section-intro">
        <p className="vwb-kicker">{intro.kicker}</p>
        <h1>{intro.title}</h1>
        <p>{intro.detail}</p>
      </section>

      <section
        className="vwb-panel"
        id={utilityRouteFocusTargetIds.projectTools}
        tabIndex={-1}
        aria-labelledby="utilities-overview-title"
      >
        <p className="vwb-kicker">Workflow Hub</p>
        <h2 id="utilities-overview-title">{overview.title}</h2>
        <p>{overview.detail}</p>
        <div className="vwb-utility-summary">
          <article className="vwb-utility-summary-card">
            <h3>{overview.knowledgeSummary.title}</h3>
            <p>{overview.knowledgeSummary.detail}</p>
            <ul className="vwb-utility-metrics">
              {overview.knowledgeSummary.metrics.map((metric) => (
                <li key={metric}>{metric}</li>
              ))}
            </ul>
            <div className="vwb-action-row">
              {overview.knowledgeSummary.actions.map((action) => (
                <NavLink
                  className="vwb-secondary-button"
                  key={action.id}
                  to={action.path}
                >
                  {action.actionLabel}
                </NavLink>
              ))}
            </div>
          </article>
        </div>
      </section>

      {overview.destinations.map((destination) => (
        <section
          className="vwb-panel"
          id={destination.id}
          key={destination.id}
          tabIndex={-1}
          aria-labelledby={`utilities-${destination.id}-title`}
        >
          <h2 id={`utilities-${destination.id}-title`}>{destination.title}</h2>
          <p>{destination.detail}</p>
          <NavLink className="vwb-secondary-button" to={destination.path}>
            {destination.actionLabel}
          </NavLink>
        </section>
      ))}
    </main>
  );
}
