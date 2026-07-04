import { describe, expect, it } from '@jest/globals';
import {
  codexShellRoutes,
  codexScreenIntros,
  getCodexScreenIntro,
  getCodexEntriesRoute,
  getCodexRelationshipsRoute,
  getCodexShellRouteTitle,
  getCodexShellRoutes,
  localPersistenceCopy,
  mobilePrimaryRouteOrder,
  valgaronProduct,
  webPrimaryRouteOrder,
} from './shell';

describe('shell contracts', () => {
  it('exposes stable Valgaron product labels', () => {
    expect(valgaronProduct.fullTitle).toBe('Valgaron World Codex');
  });

  it('keeps web and mobile route labels aligned for shared tasks', () => {
    expect(
      getCodexShellRoutes(webPrimaryRouteOrder).map((route) => route.title)
    ).toEqual(['Overview', 'Relationships', 'Data', 'Workspaces', 'Help']);
    expect(
      getCodexShellRoutes(mobilePrimaryRouteOrder).map((route) => route.title)
    ).toEqual(['Overview', 'Entries', 'Relationships', 'Workspaces', 'Data']);
    expect(getCodexShellRouteTitle('relationships')).toBe(
      codexShellRoutes.relationships.title
    );
    expect(getCodexScreenIntro('relationships')).toEqual(
      codexScreenIntros.relationships
    );
    expect(codexScreenIntros.data.detail).toContain('Export JSON backups');
  });

  it('keeps local-only wording explicit without remote workflow promises', () => {
    expect(localPersistenceCopy.deviceSaved).toBe('Saved on this device.');
    expect(localPersistenceCopy.noAccountOrSync).toContain('locally');
  });

  it('builds shared route targets with stable query parameters', () => {
    expect(
      getCodexEntriesRoute({
        entryId: 'character-mira-rowan',
        intent: 'edit',
        query: 'Mira Rowan',
        sectionId: 'characters',
      })
    ).toBe(
      '/entries?sectionId=characters&entryId=character-mira-rowan&intent=edit&query=Mira%20Rowan'
    );
    expect(getCodexEntriesRoute({ sectionId: 'places', intent: 'new' })).toBe(
      '/entries?sectionId=places&intent=new'
    );
    expect(
      getCodexRelationshipsRoute({
        entryId: 'character-mira-rowan',
        entryQuery: 'Mira Rowan',
        relationshipQuery: '',
      })
    ).toBe(
      '/relationships?entryId=character-mira-rowan&entryQuery=Mira%20Rowan'
    );
  });
});
