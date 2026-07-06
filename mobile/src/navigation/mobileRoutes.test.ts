import { describe, expect, it } from '@jest/globals';
import { codexWorkflowRouteSamples, getCodexHelpRoute } from '@valgaron/core';
import {
  getMobileRouteHref,
  getMobileTabHref,
  getMobileTabTitle,
  mobileRouteFocusParam,
  mobileTabRoutes,
} from './mobileRoutes';

describe('mobile route model', () => {
  it('uses compact codex tabs without copied social surfaces', () => {
    expect(mobileTabRoutes.map((route) => route.id)).toEqual([
      'entries',
      'timeline',
      'relationships',
      'utilities',
    ]);
    expect(mobileTabRoutes.map((route) => route.screenName)).toEqual([
      'entries',
      'timeline',
      'relationships',
      'more',
    ]);
    expect(mobileTabRoutes.map((route) => route.iconName)).toEqual([
      'book-open',
      'clock',
      'git-branch',
      'more-horizontal',
    ]);
    expect(mobileTabRoutes.map((route) => route.tabLabel)).toEqual([
      'Workbench',
      'Timeline',
      'Links',
      'More',
    ]);
    expect(mobileTabRoutes.map((route) => route.tabAccessibilityLabel)).toEqual(
      ['Workbench tab', 'Timeline tab', 'Links tab', 'More tab']
    );
    expect(mobileTabRoutes.map((route) => route.title).join(' ')).not.toMatch(
      /messages|discover|profile|community/i
    );
    expect(getMobileTabHref('entries')).toBe('/entries');
    expect(getMobileTabHref('utilities')).toBe('/more');
    expect(getMobileTabTitle('relationships')).toBe('Relationships');
  });

  it('adapts shared route strings for Expo Router', () => {
    expect(
      getMobileRouteHref(
        '/entries?sectionId=characters&entryId=character-mira-rowan&query=Mira%20Rowan'
      )
    ).toEqual({
      pathname: '/entries',
      params: {
        entryId: 'character-mira-rowan',
        query: 'Mira Rowan',
        sectionId: 'characters',
      },
    });
    expect(
      getMobileRouteHref(
        '/entries?sectionId=characters&entryId=character-mira-rowan&intent=edit&query=Mira%20Rowan'
      )
    ).toEqual({
      pathname: '/entries',
      params: {
        entryId: 'character-mira-rowan',
        intent: 'edit',
        query: 'Mira Rowan',
        sectionId: 'characters',
      },
    });
    expect(
      getMobileRouteHref(
        '/entries?sectionId=characters&entryId=character-mira-rowan&intent=context&query=Mira%20Rowan'
      )
    ).toEqual({
      pathname: '/entries',
      params: {
        entryId: 'character-mira-rowan',
        intent: 'context',
        query: 'Mira Rowan',
        sectionId: 'characters',
      },
    });
    expect(getMobileRouteHref('/entries?query=Mira+Rowan').params).toEqual({
      query: 'Mira Rowan',
    });
    expect(getMobileRouteHref('/data#import-json-backup')).toEqual({
      pathname: '/data',
      params: {
        [mobileRouteFocusParam]: 'import-json-backup',
      },
    });
    expect(getMobileRouteHref('/data?mode=full-json#export')).toEqual({
      pathname: '/data',
      params: {
        mode: 'full-json',
        [mobileRouteFocusParam]: 'export',
      },
    });
    expect(getMobileRouteHref('/timeline')).toEqual({
      pathname: '/timeline',
      params: {},
    });
    expect(
      getMobileRouteHref(
        '/timeline?query=Guild&era=Charter%20Era&involvedEntryId=faction-cartographers-guild&tag=charter&status=needs-review&sort=name&updatedWithinDays=30&showArchived=true'
      )
    ).toEqual({
      pathname: '/timeline',
      params: {
        era: 'Charter Era',
        involvedEntryId: 'faction-cartographers-guild',
        query: 'Guild',
        showArchived: 'true',
        sort: 'name',
        status: 'needs-review',
        tag: 'charter',
        updatedWithinDays: '30',
      },
    });
    expect(
      getMobileRouteHref(
        '/timeline?intent=new&era=Charter%20Era&involvedEntryId=faction-cartographers-guild'
      )
    ).toEqual({
      pathname: '/timeline',
      params: {
        era: 'Charter Era',
        intent: 'new',
        involvedEntryId: 'faction-cartographers-guild',
      },
    });
    expect(getMobileRouteHref('/utilities')).toEqual({
      pathname: '/more',
      params: {},
    });
    expect(getMobileRouteHref('/utilities#data-tools')).toEqual({
      pathname: '/more',
      params: {
        [mobileRouteFocusParam]: 'data-tools',
      },
    });
    expect(getMobileRouteHref('/knowledge')).toEqual({
      pathname: '/more',
      params: {},
    });
    expect(getMobileRouteHref('/knowledge#custom-entry-types')).toEqual({
      pathname: '/more',
      params: {
        [mobileRouteFocusParam]: 'custom-entry-types',
      },
    });
    expect(getMobileRouteHref('/knowledge#hidden-detail-cleanup')).toEqual({
      pathname: '/more',
      params: {
        [mobileRouteFocusParam]: 'hidden-detail-cleanup',
      },
    });
    expect(
      getMobileRouteHref(
        '/relationships?relationshipQuery=oath%3Dbroken%20%26%20owed'
      ).params
    ).toEqual({
      relationshipQuery: 'oath=broken & owed',
    });
    expect(getMobileRouteHref(getCodexHelpRoute('timeline'))).toEqual({
      pathname: '/help',
      params: {
        topic: 'timeline',
      },
    });
  });

  it('adapts every shared workflow route sample without dropping intent params', () => {
    for (const route of codexWorkflowRouteSamples) {
      const href = getMobileRouteHref(route);

      expect(href.pathname).toMatch(
        /^\/(?:entries|timeline|relationships|workspaces|data|help|more)?$/
      );
      expect(Object.values(href.params)).not.toContain('');
      if (route.includes('#')) {
        expect(href.params[mobileRouteFocusParam]).toBeDefined();
      }
    }
  });
});
