import { useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  formatUtilityOverviewActionAccessibilityLabel,
  formatWorkflowDestinationAccessibilityLabel,
  getCodexScreenIntro,
  getUtilitiesOverviewModel,
  getUtilitiesRouteFocusTargetId,
  utilityRouteFocusTargetIds,
  type WorldWorkspace,
} from '@valgaron/core';
import { DashboardPage } from '../Components/Dashboard/DashboardPage';

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

      <DashboardPage
        ariaLabel="Utilities dashboard cards"
        pageId="utilities"
        summary="Arrange review hotspots and project tool destinations."
      >
        <section
          className="vwb-panel"
          data-dashboard-card-id="utilities.review"
          id={utilityRouteFocusTargetIds.projectTools}
          tabIndex={-1}
          aria-labelledby="utilities-overview-title"
        >
          <p className="vwb-kicker">{overview.kickerLabel}</p>
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
                    aria-label={formatUtilityOverviewActionAccessibilityLabel(
                      action
                    )}
                    className="vwb-secondary-button"
                    key={action.id}
                    to={action.path}
                  >
                    {action.actionLabel}
                  </NavLink>
                ))}
              </div>
            </article>
            <article className="vwb-utility-summary-card">
              <h3>{overview.shortcutSummary.title}</h3>
              <p>{overview.shortcutSummary.detail}</p>
              <div className="vwb-action-row">
                {overview.shortcutSummary.actions.map((action) => (
                  <NavLink
                    aria-label={formatUtilityOverviewActionAccessibilityLabel(
                      action
                    )}
                    className="vwb-secondary-button"
                    key={action.id}
                    to={action.path}
                  >
                    {action.actionLabel}
                  </NavLink>
                ))}
              </div>
            </article>
            <article className="vwb-utility-summary-card">
              <h3>{overview.reviewSummary.title}</h3>
              <p>{overview.reviewSummary.detail}</p>
              <ul className="vwb-utility-metrics">
                {overview.reviewSummary.metrics.map((metric) => (
                  <li key={metric}>{metric}</li>
                ))}
              </ul>
              {overview.reviewSummary.actions.length > 0 ? (
                <div className="vwb-action-row">
                  {overview.reviewSummary.actions.map((action) => (
                    <NavLink
                      aria-label={formatUtilityOverviewActionAccessibilityLabel(
                        action
                      )}
                      className="vwb-secondary-button"
                      key={action.id}
                      to={action.path}
                    >
                      {action.actionLabel}
                    </NavLink>
                  ))}
                </div>
              ) : (
                <p className="vwb-muted-note">
                  {overview.reviewSummary.emptyActionText}
                </p>
              )}
            </article>
          </div>
        </section>

        <section
          className="vwb-panel"
          data-dashboard-card-id="utilities.tools"
          aria-labelledby="utilities-tools-title"
        >
          <h2 id="utilities-tools-title">Project tools</h2>
          <div className="vwb-utility-summary">
            {overview.destinations.map((destination) => (
              <article
                className="vwb-utility-summary-card"
                id={destination.id}
                key={destination.id}
                tabIndex={-1}
                aria-labelledby={`utilities-${destination.id}-title`}
              >
                <h3 id={`utilities-${destination.id}-title`}>
                  {destination.title}
                </h3>
                <p>{destination.detail}</p>
                <NavLink
                  aria-label={formatWorkflowDestinationAccessibilityLabel(
                    destination
                  )}
                  className="vwb-secondary-button"
                  to={destination.path}
                >
                  {destination.actionLabel}
                </NavLink>
              </article>
            ))}
          </div>
        </section>
      </DashboardPage>
    </main>
  );
}
