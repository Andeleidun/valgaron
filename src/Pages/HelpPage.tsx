import { Link, NavLink, useSearchParams } from 'react-router-dom';
import {
  getCodexHelpScreenModel,
  getCodexScreenIntro,
  valgaronPrivacyPolicy,
} from '@valgaron/core';

export function HelpPage() {
  const intro = getCodexScreenIntro('help');
  const [searchParams] = useSearchParams();
  const helpModel = getCodexHelpScreenModel(searchParams.get('topic'));
  const { focusedTopic } = helpModel;

  return (
    <main className="vwb-main vwb-help-layout" id="main-content" tabIndex={-1}>
      <section className="vwb-panel vwb-section-intro">
        <p className="vwb-kicker">{intro.kicker}</p>
        <h1>{helpModel.app.title}</h1>
        <p>
          {intro.detail} {helpModel.app.versionText}
        </p>
      </section>

      {focusedTopic ? (
        <section className="vwb-panel" aria-labelledby="help-focused-title">
          <div className="vwb-section-heading">
            <div>
              <p className="vwb-kicker">{helpModel.sections.focused.kicker}</p>
              <h2 id="help-focused-title">{focusedTopic.title}</h2>
            </div>
          </div>
          <p>{focusedTopic.detail}</p>
        </section>
      ) : null}

      <section className="vwb-panel" aria-labelledby="help-start-title">
        <div className="vwb-section-heading">
          <div>
            <p className="vwb-kicker">{helpModel.sections.firstUse.kicker}</p>
            <h2 id="help-start-title">{helpModel.sections.firstUse.title}</h2>
          </div>
        </div>
        <p>{helpModel.firstUse}</p>
      </section>

      <section className="vwb-panel" aria-labelledby="help-actions-title">
        <div className="vwb-section-heading">
          <div>
            <p className="vwb-kicker">
              {helpModel.sections.quickActions.kicker}
            </p>
            <h2 id="help-actions-title">
              {helpModel.sections.quickActions.title}
            </h2>
          </div>
        </div>
        <div className="vwb-action-row">
          {helpModel.quickActions.map((action) => (
            <NavLink
              className="vwb-secondary-button"
              key={action.id}
              to={action.path}
            >
              {action.label}
            </NavLink>
          ))}
        </div>
      </section>

      <section className="vwb-panel" aria-labelledby="help-topics-title">
        <div className="vwb-section-heading">
          <div>
            <h2 id="help-topics-title">
              {helpModel.sections.focusTopics.title}
            </h2>
          </div>
        </div>
        <div className="vwb-action-row">
          {helpModel.focusTopics.map((topic) => {
            const isFocused = focusedTopic?.id === topic.id;
            return (
              <Link
                aria-current={isFocused ? 'page' : undefined}
                className={`vwb-secondary-button ${
                  isFocused ? 'is-active' : ''
                }`}
                key={topic.id}
                to={topic.path}
              >
                {topic.title}
              </Link>
            );
          })}
        </div>
      </section>

      <section
        className="vwb-help-grid"
        aria-label={helpModel.sections.workflow.ariaLabel}
      >
        {helpModel.workflowTopics.map((section) => (
          <article className="vwb-panel" key={section.title}>
            <p className="vwb-kicker">{helpModel.sections.workflow.kicker}</p>
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
            <p className="vwb-kicker">{helpModel.sections.data.kicker}</p>
            <h2 id="help-data-title">{helpModel.data.title}</h2>
          </div>
        </div>
        <p>{helpModel.data.summary}</p>
        <dl className="vwb-detail-list">
          {helpModel.data.details.map((item) => (
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
            <p className="vwb-kicker">{helpModel.sections.offline.kicker}</p>
            <h2 id="help-offline-title">{helpModel.offline.title}</h2>
          </div>
        </div>
        <p>{helpModel.offline.detail}</p>
      </section>

      <section className="vwb-panel" aria-labelledby="help-support-title">
        <div className="vwb-section-heading">
          <div>
            <p className="vwb-kicker">{helpModel.sections.support.kicker}</p>
            <h2 id="help-support-title">{helpModel.support.title}</h2>
          </div>
        </div>
        <p>{helpModel.support.detail}</p>
      </section>

      <section className="vwb-panel" aria-labelledby="help-privacy-title">
        <div className="vwb-section-heading">
          <div>
            <p className="vwb-kicker">{helpModel.sections.privacy.kicker}</p>
            <h2 id="help-privacy-title">{helpModel.privacy.title}</h2>
          </div>
        </div>
        <p>{helpModel.privacy.detail}</p>
        <div className="vwb-action-row">
          <Link
            className="vwb-secondary-button"
            to={valgaronPrivacyPolicy.webPath}
          >
            {valgaronPrivacyPolicy.actionLabel}
          </Link>
        </div>
      </section>

      <section className="vwb-panel" aria-labelledby="help-limits-title">
        <div className="vwb-section-heading">
          <div>
            <p className="vwb-kicker">
              {helpModel.sections.releaseLimits.kicker}
            </p>
            <h2 id="help-limits-title">{helpModel.releaseLimits.title}</h2>
          </div>
        </div>
        <p>{helpModel.releaseLimits.detail}</p>
      </section>
    </main>
  );
}
