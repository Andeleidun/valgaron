import { describe, expect, it } from '@jest/globals';
import { renderToString } from 'react-dom/server';
import { MemoryRouter, NavLink } from 'react-router-dom';
import { codexShellRoutes, valgaronPrivacyPolicy } from '@valgaron/core';
import { formatRouteRedirectDestination } from './navigationRoutes';

function renderUtilitiesNavigationLink(pathname: string): string {
  return renderToString(
    <MemoryRouter initialEntries={[pathname]}>
      <NavLink
        className={({ isActive }) =>
          `vwb-nav-link ${isActive ? 'is-active' : ''}`
        }
        to={codexShellRoutes.utilities.path}
      >
        Utilities
      </NavLink>
    </MemoryRouter>
  );
}

describe('primary navigation child routes', () => {
  it.each([
    codexShellRoutes.data.path,
    codexShellRoutes.workspaces.path,
    codexShellRoutes.help.path,
    `${codexShellRoutes.help.path}?topic=timeline`,
    valgaronPrivacyPolicy.webPath,
  ])('keeps Utilities selected at %s', (pathname) => {
    const markup = renderUtilitiesNavigationLink(pathname);

    expect(markup).toContain('class="vwb-nav-link is-active"');
    expect(markup).toContain('aria-current="page"');
  });

  it('preserves query parameters and focus hashes in legacy redirects', () => {
    expect(
      formatRouteRedirectDestination({
        destination: codexShellRoutes.data.path,
        hash: '#import-json-backup',
        search: '?mode=full-json',
      })
    ).toBe('/utilities/data?mode=full-json#import-json-backup');
    expect(
      formatRouteRedirectDestination({
        destination: codexShellRoutes.workspaces.path,
        hash: '',
        search: '',
      })
    ).toBe('/utilities/workspaces');
  });
});
