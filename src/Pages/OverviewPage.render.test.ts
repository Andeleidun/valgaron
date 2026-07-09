import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from '@jest/globals';
import { createSeedWorldDocument } from '@valgaron/core';
import { Overview } from './OverviewPage';

describe('Overview browser rendering', () => {
  it('uses overview page flow and a visible primary heading', () => {
    const markup = renderToStaticMarkup(
      React.createElement(
        MemoryRouter,
        null,
        React.createElement(Overview, {
          document: createSeedWorldDocument(),
        })
      )
    );

    expect(markup).toContain('class="vwb-main vwb-overview-page"');
    expect(markup).toContain('<h1 id="overview-title">');
    expect(markup.match(/<h1\b/g) ?? []).toHaveLength(1);
    expect(markup).toContain('aria-labelledby="overview-title"');
  });
});
