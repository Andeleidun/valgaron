import { describe, expect, it } from '@jest/globals';
import { getCodexHelpRoute } from './helpTopics';
import { getCodexEntriesRoute, getCodexRelationshipsRoute } from './shell';
import { formatCodexRouteIntent, parseCodexRouteIntent } from './routeIntents';

describe('codex route intents', () => {
  it('parses shared routes into stable workflow intents', () => {
    expect(
      parseCodexRouteIntent(
        '/entries?sectionId=characters&entryId=character-mira-rowan&intent=edit&query=Mira%20Rowan'
      )
    ).toEqual({
      routeId: 'entries',
      pathname: '/entries',
      params: {
        entryId: 'character-mira-rowan',
        intent: 'edit',
        query: 'Mira Rowan',
        sectionId: 'characters',
      },
    });
    expect(parseCodexRouteIntent('/data#import-json-backup')).toEqual({
      routeId: 'data',
      pathname: '/data',
      params: {},
      focusId: 'import-json-backup',
    });
    expect(parseCodexRouteIntent('/data?mode=full-json#export-panel')).toEqual({
      routeId: 'data',
      pathname: '/data',
      params: {
        mode: 'full-json',
      },
      focusId: 'export-panel',
    });
  });

  it('formats route intents back to canonical shared routes', () => {
    expect(
      formatCodexRouteIntent({
        routeId: 'relationships',
        pathname: '/relationships',
        params: {
          entryId: 'character-mira-rowan',
          entryQuery: 'Mira Rowan',
          relationshipQuery: 'oath=broken & owed',
        },
      })
    ).toBe(
      '/relationships?entryId=character-mira-rowan&entryQuery=Mira%20Rowan&relationshipQuery=oath%3Dbroken%20%26%20owed'
    );
    expect(
      formatCodexRouteIntent({
        routeId: 'data',
        pathname: '/data',
        params: {
          mode: 'full-json',
        },
        focusId: 'import-json-backup',
      })
    ).toBe('/data?mode=full-json#import-json-backup');
  });

  it('round trips source-of-truth workflow routes without dropping focus', () => {
    const routes = [
      getCodexEntriesRoute({
        entryId: 'character-mira-rowan',
        intent: 'edit',
        query: 'Mira Rowan',
        sectionId: 'characters',
      }),
      getCodexEntriesRoute({ sectionId: 'places', intent: 'new' }),
      getCodexRelationshipsRoute({
        entryId: 'character-mira-rowan',
        entryQuery: 'Mira Rowan',
        relationshipQuery: 'oath=broken & owed',
      }),
      '/data#import-json-backup',
      '/data?mode=full-json#export',
      getCodexHelpRoute('timeline'),
    ];

    for (const route of routes) {
      expect(
        parseCodexRouteIntent(
          formatCodexRouteIntent(parseCodexRouteIntent(route))
        )
      ).toEqual(parseCodexRouteIntent(route));
    }
  });

  it('rejects unsupported paths so parity gaps are explicit', () => {
    expect(() => parseCodexRouteIntent('/unknown?mode=full-json')).toThrow(
      'Unsupported codex route path: /unknown'
    );
  });
});
