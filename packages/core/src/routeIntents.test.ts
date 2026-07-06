import { describe, expect, it } from '@jest/globals';
import {
  codexWorkflowRouteSamples,
  formatCodexRouteIntent,
  getCodexWorkflowIntent,
  parseCodexRouteIntent,
} from './routeIntents';

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
    for (const route of codexWorkflowRouteSamples) {
      expect(
        parseCodexRouteIntent(
          formatCodexRouteIntent(parseCodexRouteIntent(route))
        )
      ).toEqual(parseCodexRouteIntent(route));
    }
  });

  it('classifies shared routes into typed workflow intents', () => {
    expect(getCodexWorkflowIntent('/')).toEqual({ kind: 'overview' });
    expect(getCodexWorkflowIntent('/workspaces')).toEqual({
      kind: 'workspaces',
    });
    expect(
      getCodexWorkflowIntent('/entries?sectionId=places&query=harbor')
    ).toEqual({
      kind: 'entries-browse',
      query: 'harbor',
      sectionId: 'places',
      viewId: '',
    });
    expect(getCodexWorkflowIntent('/entries?view=unlinked')).toEqual({
      kind: 'entries-browse',
      query: '',
      sectionId: '',
      viewId: 'unlinked',
    });
    expect(getCodexWorkflowIntent('/entries?view=missing')).toEqual({
      kind: 'entries-browse',
      query: '',
      sectionId: '',
      viewId: '',
    });
    expect(
      getCodexWorkflowIntent('/entries?sectionId=places&intent=new')
    ).toEqual({
      kind: 'entry-create',
      query: '',
      sectionId: 'places',
    });
    expect(
      getCodexWorkflowIntent(
        '/entries?sectionId=characters&entryId=character-mira-rowan&intent=edit&query=Mira%20Rowan'
      )
    ).toEqual({
      entryId: 'character-mira-rowan',
      kind: 'entry-edit',
      query: 'Mira Rowan',
      sectionId: 'characters',
    });
    expect(
      getCodexWorkflowIntent(
        '/entries?sectionId=characters&entryId=character-mira-rowan&intent=context&query=Mira%20Rowan'
      )
    ).toEqual({
      entryId: 'character-mira-rowan',
      kind: 'entry-context',
      query: 'Mira Rowan',
      sectionId: 'characters',
    });
    expect(
      getCodexWorkflowIntent(
        '/relationships?entryId=character-mira-rowan&entryQuery=Mira%20Rowan&relationshipQuery=oath%3Dbroken'
      )
    ).toEqual({
      entryId: 'character-mira-rowan',
      entryQuery: 'Mira Rowan',
      kind: 'relationships',
      relationshipQuery: 'oath=broken',
    });
    expect(getCodexWorkflowIntent('/timeline')).toEqual({
      kind: 'timeline',
    });
    expect(
      getCodexWorkflowIntent(
        '/timeline?intent=new&era=Charter%20Era&involvedEntryId=faction-cartographers-guild'
      )
    ).toEqual({
      kind: 'entry-create',
      query: '',
      sectionId: 'timeline',
      timelineContext: {
        era: 'Charter Era',
        involvedEntryId: 'faction-cartographers-guild',
      },
    });
    expect(
      getCodexWorkflowIntent(
        '/timeline?entryId=timeline-founding&intent=edit&query=Founding%20of%20Valgaron'
      )
    ).toEqual({
      entryId: 'timeline-founding',
      kind: 'entry-edit',
      query: 'Founding of Valgaron',
      sectionId: 'timeline',
    });
    expect(getCodexWorkflowIntent('/knowledge')).toEqual({
      kind: 'knowledge',
    });
    expect(getCodexWorkflowIntent('/utilities')).toEqual({
      focusId: '',
      kind: 'utilities',
    });
    expect(getCodexWorkflowIntent('/utilities#project-tools')).toEqual({
      focusId: 'project-tools',
      kind: 'utilities',
    });
    expect(getCodexWorkflowIntent('/utilities#knowledge-setup')).toEqual({
      focusId: 'knowledge-setup',
      kind: 'utilities',
    });
    expect(getCodexWorkflowIntent('/utilities#data-tools')).toEqual({
      focusId: 'data-tools',
      kind: 'utilities',
    });
    expect(getCodexWorkflowIntent('/utilities#workspaces')).toEqual({
      focusId: 'workspaces',
      kind: 'utilities',
    });
    expect(getCodexWorkflowIntent('/utilities#help')).toEqual({
      focusId: 'help',
      kind: 'utilities',
    });
    expect(getCodexWorkflowIntent('/utilities#missing')).toEqual({
      focusId: '',
      kind: 'utilities',
    });
    expect(getCodexWorkflowIntent('/data?mode=full-json#export')).toEqual({
      focusId: 'export',
      kind: 'data',
      mode: 'full-json',
    });
    expect(getCodexWorkflowIntent('/data?mode=not-real#export')).toEqual({
      focusId: 'export',
      kind: 'data',
      mode: '',
    });
    expect(getCodexWorkflowIntent('/help?topic=timeline')).toEqual({
      kind: 'help',
      topic: 'timeline',
    });
    expect(getCodexWorkflowIntent('/help?topic=utilities')).toEqual({
      kind: 'help',
      topic: 'utilities',
    });
    expect(getCodexWorkflowIntent('/help?topic=missing')).toEqual({
      kind: 'help',
      topic: '',
    });
  });

  it('classifies parsed route intents without reparsing', () => {
    expect(
      getCodexWorkflowIntent(parseCodexRouteIntent('/data#import-json-backup'))
    ).toEqual({
      focusId: 'import-json-backup',
      kind: 'data',
      mode: '',
    });
  });

  it('rejects unsupported paths so parity gaps are explicit', () => {
    expect(() => parseCodexRouteIntent('/unknown?mode=full-json')).toThrow(
      'Unsupported codex route path: /unknown'
    );
  });
});
