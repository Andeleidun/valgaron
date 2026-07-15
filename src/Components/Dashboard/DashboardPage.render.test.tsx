import { describe, expect, it } from '@jest/globals';
import { renderToStaticMarkup } from 'react-dom/server';
import { DashboardPage } from './DashboardPage';

describe('DashboardPage rendering', () => {
  it('exposes the page identifier used by page-aware responsive layouts', () => {
    const markup = renderToStaticMarkup(
      <DashboardPage
        ariaLabel="Utilities dashboard cards"
        pageId="utilities"
        summary="Arrange project tools."
      >
        <section data-dashboard-card-id="utilities.review">
          Review hotspots
        </section>
        <section data-dashboard-card-id="utilities.tools">
          Project tools
        </section>
      </DashboardPage>
    );

    expect(markup).toContain('data-dashboard-page-id="utilities"');
    expect(markup).toContain('data-dashboard-layout-state="recommended"');
    expect(markup).toContain('data-dashboard-card-id="utilities.review"');
    expect(markup).toContain('data-dashboard-size="full"');
  });
});
