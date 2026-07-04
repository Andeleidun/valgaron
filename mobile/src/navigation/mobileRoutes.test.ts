import { describe, expect, it } from '@jest/globals';
import {
  getMobileRouteHref,
  getMobileTabHref,
  getMobileTabTitle,
  mobileTabRoutes,
} from './mobileRoutes';

describe('mobile route model', () => {
  it('uses compact codex tabs without copied social surfaces', () => {
    expect(mobileTabRoutes.map((route) => route.id)).toEqual([
      'overview',
      'entries',
      'relationships',
      'workspaces',
      'data',
    ]);
    expect(mobileTabRoutes.map((route) => route.screenName)).toEqual([
      'index',
      'entries',
      'relationships',
      'workspaces',
      'data',
    ]);
    expect(mobileTabRoutes.map((route) => route.iconName)).toEqual([
      'home',
      'book-open',
      'git-branch',
      'layers',
      'database',
    ]);
    expect(mobileTabRoutes.map((route) => route.title).join(' ')).not.toMatch(
      /messages|discover|profile|community/i
    );
    expect(getMobileTabHref('entries')).toBe('/entries');
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
    expect(getMobileRouteHref('/entries?query=Mira+Rowan').params).toEqual({
      query: 'Mira Rowan',
    });
    expect(getMobileRouteHref('/data#import-json-backup')).toEqual({
      pathname: '/data',
      params: {},
    });
    expect(getMobileRouteHref('/data?mode=full-json#export')).toEqual({
      pathname: '/data',
      params: {
        mode: 'full-json',
      },
    });
    expect(
      getMobileRouteHref(
        '/relationships?relationshipQuery=oath%3Dbroken%20%26%20owed'
      ).params
    ).toEqual({
      relationshipQuery: 'oath=broken & owed',
    });
  });
});
