import { describe, expect, it } from '@jest/globals';
import {
  codexShellRoutes,
  codexScreenIntros,
  getCodexMobileShellRouteLabel,
  getCodexScreenIntro,
  getCodexEntriesRoute,
  getCodexRelationshipsRoute,
  getCodexShellChildRoutePath,
  getCodexShellRouteTitle,
  getCodexShellRoutes,
  getCodexMobileWebShellRouteLabel,
  getRelativeChildRoutePath,
  localPersistenceCopy,
  mobilePrimaryRouteOrder,
  mobileWebPrimaryRouteOrder,
  valgaronPrivacyPolicy,
  valgaronProduct,
  webPrimaryRouteOrder,
} from './shell';

describe('shell contracts', () => {
  it('exposes stable Valgaron product labels', () => {
    expect(valgaronProduct.fullTitle).toBe('Valgaron World Codex');
    expect(valgaronPrivacyPolicy).toEqual({
      title: 'Valgaron World Codex Privacy Policy',
      webPath: '/utilities/help/privacy',
      webUrl: 'https://andeleidun.github.io/valgaron/utilities/help/privacy',
      actionLabel: 'Read Privacy Policy',
    });
  });

  it('keeps web and mobile route labels aligned for shared tasks', () => {
    expect(
      getCodexShellRoutes(webPrimaryRouteOrder).map((route) => route.title)
    ).toEqual([
      'Workbench',
      'Timeline',
      'Relationships',
      'Knowledge',
      'Utilities',
    ]);
    expect(
      getCodexShellRoutes(mobilePrimaryRouteOrder).map((route) => route.title)
    ).toEqual(['Workbench', 'Timeline', 'Relationships', 'Utilities']);
    expect(getCodexShellRouteTitle('relationships')).toBe(
      codexShellRoutes.relationships.title
    );
    expect(
      mobilePrimaryRouteOrder.map((id) => getCodexMobileShellRouteLabel(id))
    ).toEqual(['Workbench', 'Timeline', 'Links', 'More']);
    expect(
      mobileWebPrimaryRouteOrder.map((id) =>
        getCodexMobileWebShellRouteLabel(id)
      )
    ).toEqual(['Workbench', 'Timeline', 'Links', 'More']);
    expect(getCodexScreenIntro('relationships')).toEqual(
      codexScreenIntros.relationships
    );
    expect(getCodexScreenIntro('timeline').title).toBe('Timeline');
    expect(getCodexScreenIntro('utilities').title).toBe('Utilities');
    expect(codexScreenIntros.data.detail).toContain('Export JSON backups');
    expect(codexShellRoutes.data).toMatchObject({
      parentId: 'utilities',
      path: '/utilities/data',
    });
    expect(codexShellRoutes.workspaces).toMatchObject({
      parentId: 'utilities',
      path: '/utilities/workspaces',
    });
    expect(codexShellRoutes.help).toMatchObject({
      parentId: 'utilities',
      path: '/utilities/help',
    });
    expect(getCodexShellChildRoutePath('data')).toBe('data');
    expect(getCodexShellChildRoutePath('workspaces')).toBe('workspaces');
    expect(getCodexShellChildRoutePath('help')).toBe('help');
    expect(
      getRelativeChildRoutePath(
        codexShellRoutes.help.path,
        valgaronPrivacyPolicy.webPath
      )
    ).toBe('privacy');
    expect(() => getCodexShellChildRoutePath('utilities')).toThrow(
      'Codex shell route utilities does not have a parent route.'
    );
    expect(() => getRelativeChildRoutePath('/utilities', '/entries')).toThrow(
      'Route path /entries is not a child of parent path /utilities.'
    );
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
      getCodexEntriesRoute({
        entryId: 'faction-cartographers-guild',
        intent: 'context',
        query: 'The Cartographers Guild',
        sectionId: 'factions',
      })
    ).toBe(
      '/entries?sectionId=factions&entryId=faction-cartographers-guild&intent=context&query=The%20Cartographers%20Guild'
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
