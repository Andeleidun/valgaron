import { describe, expect, it } from '@jest/globals';
import {
  getValgaronLayoutModeForSurface,
  getValgaronWorkflow,
  getMobileWorkbenchModeModel,
  getMobileWorkbenchModeSummary,
  valgaronSurfaceContracts,
} from './layoutModes';

describe('layout mode contracts', () => {
  it('classifies desktop web, mobile web, and native mobile as distinct surfaces', () => {
    expect(getValgaronLayoutModeForSurface('desktop-web')).toBe('desktop');
    expect(getValgaronLayoutModeForSurface('mobile-web')).toBe('mobile-web');
    expect(getValgaronLayoutModeForSurface('native-mobile')).toBe(
      'native-mobile'
    );

    expect(valgaronSurfaceContracts.desktopWeb.renderer).toBe('web');
    expect(valgaronSurfaceContracts.mobileWeb.renderer).toBe('web');
    expect(valgaronSurfaceContracts.nativeMobile.renderer).toBe('native');
  });

  it('keeps mobile web in the same workflow order as native mobile', () => {
    const mobileWebWorkflow = getValgaronWorkflow('mobile-web');
    const nativeMobileWorkflow = getValgaronWorkflow('native-mobile');

    expect(mobileWebWorkflow.map((step) => step.id)).toEqual([
      'workbench',
      'timeline',
      'links',
      'more',
    ]);
    expect(mobileWebWorkflow.map((step) => step.label)).toEqual([
      'Workbench',
      'Timeline',
      'Links',
      'More',
    ]);
    expect(nativeMobileWorkflow).toEqual(mobileWebWorkflow);
    expect(valgaronSurfaceContracts.mobileWeb.usesStackedMobileFlow).toBe(true);
    expect(valgaronSurfaceContracts.nativeMobile.usesStackedMobileFlow).toBe(
      true
    );
  });

  it('allows desktop web to keep a productivity workbench route order', () => {
    expect(valgaronSurfaceContracts.desktopWeb.routeOrder).toEqual([
      'entries',
      'timeline',
      'relationships',
      'knowledge',
      'utilities',
    ]);
    expect(valgaronSurfaceContracts.desktopWeb.usesStackedMobileFlow).toBe(
      false
    );
  });

  it('builds mobile Workbench mode options with context disabled until useful', () => {
    const model = getMobileWorkbenchModeModel({
      activeMode: 'context',
      hasReviewItems: false,
      hasSelectedEntry: false,
    });

    expect(model.activeMode).toBe('index');
    expect(model.title).toBe('Workbench view');
    expect(model.options.map((option) => option.label)).toEqual([
      'Index',
      'Context',
      'Edit',
    ]);
    expect(
      model.options.find((option) => option.id === 'context')
    ).toMatchObject({
      disabled: true,
      isActive: false,
      detail: 'Review links, cleanup, and selected-record review summaries.',
    });
  });

  it('enables mobile Workbench context for selected records or review work', () => {
    expect(
      getMobileWorkbenchModeModel({
        activeMode: 'context',
        hasSelectedEntry: true,
      }).options.find((option) => option.id === 'context')
    ).toMatchObject({
      disabled: false,
      isActive: true,
    });

    expect(
      getMobileWorkbenchModeModel({
        activeMode: 'context',
        hasReviewItems: true,
      }).activeMode
    ).toBe('context');
  });

  it('uses timeline-specific copy for the mobile timeline surface', () => {
    const model = getMobileWorkbenchModeModel({
      activeMode: 'index',
      surface: 'timeline',
    });

    expect(model.title).toBe('Timeline view');
    expect(model.options.map((option) => option.label)).toEqual([
      'Events',
      'Context',
      'Edit',
    ]);
    expect(model.options.find((option) => option.id === 'index')?.detail).toBe(
      'Find, filter, and order timeline events.'
    );
  });

  it('builds compact mobile mode summaries for current workflow state', () => {
    expect(
      getMobileWorkbenchModeSummary({
        activeMode: 'index',
        sectionSingularTitle: 'Character',
        sectionTitle: 'Characters',
        visibleRecordCount: 2,
      })
    ).toBe('2 visible records in Characters.');
    expect(
      getMobileWorkbenchModeSummary({
        activeMode: 'index',
        sectionSingularTitle: 'Timeline Event',
        sectionTitle: 'Timeline',
        surface: 'timeline',
        visibleRecordCount: 1,
      })
    ).toBe('1 visible event in Timeline.');
    expect(
      getMobileWorkbenchModeSummary({
        activeMode: 'context',
        sectionSingularTitle: 'Character',
        sectionTitle: 'Characters',
        selectedEntryName: 'Mira Rowan',
        visibleRecordCount: 2,
      })
    ).toBe('Reviewing context for Mira Rowan.');
    expect(
      getMobileWorkbenchModeSummary({
        activeMode: 'edit',
        sectionSingularTitle: 'Place',
        sectionTitle: 'Places',
        stagedRelationshipCount: 2,
        visibleRecordCount: 0,
      })
    ).toBe('New Place draft with 2 staged links.');
  });
});
