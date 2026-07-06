import { describe, expect, it } from '@jest/globals';
import {
  entryEditorDisplayLimits,
  featureDisplayScalePolicy,
  formatExpansionControlLabel,
  formatHiddenCountText,
  formatLimitedTextList,
  getFeatureDisplayScaleDecision,
  getLimitedResultModel,
  knowledgeDisplayLimits,
  mobileFeatureDisplayLimits,
  relationshipReviewDisplayLimits,
  relationshipTextReviewDisplayLimits,
  workbenchDisplayLimits,
} from './featureDisplayLimits';

describe('feature display limits', () => {
  it('returns visible items with hidden and total counts', () => {
    const model = getLimitedResultModel(['a', 'b', 'c', 'd'], 2);

    expect(model).toEqual({
      visibleItems: ['a', 'b'],
      hiddenCount: 2,
      totalCount: 4,
    });
  });

  it('does not report hidden items when the list fits the limit', () => {
    const model = getLimitedResultModel(['a', 'b'], 5);

    expect(model).toEqual({
      visibleItems: ['a', 'b'],
      hiddenCount: 0,
      totalCount: 2,
    });
  });

  it('treats negative limits as zero visible items', () => {
    const model = getLimitedResultModel(['a', 'b'], -1);

    expect(model).toEqual({
      visibleItems: [],
      hiddenCount: 2,
      totalCount: 2,
    });
  });

  it('keeps mobile limits centralized for capped feature surfaces', () => {
    expect(mobileFeatureDisplayLimits.entryResults).toBeGreaterThan(
      mobileFeatureDisplayLimits.relationshipTargetOptions
    );
    expect(mobileFeatureDisplayLimits.relationshipTextReviewItems).toBeLessThan(
      mobileFeatureDisplayLimits.entryResults
    );
    expect(entryEditorDisplayLimits.detailSuggestions).toBe(
      mobileFeatureDisplayLimits.detailSuggestions
    );
  });

  it('keeps relationship review limits centralized across browser and mobile', () => {
    expect(relationshipReviewDisplayLimits.orphanedEntries).toBeGreaterThan(0);
    expect(
      relationshipReviewDisplayLimits.duplicateRelationshipGroups
    ).toBeGreaterThan(0);
    expect(relationshipReviewDisplayLimits.legacyTextItems).toBeGreaterThan(0);
    expect(relationshipReviewDisplayLimits.orphanedEntries).toBeGreaterThan(
      relationshipReviewDisplayLimits.duplicateRelationshipGroups
    );
  });

  it('keeps section relationship text review limits aligned with mobile context review', () => {
    expect(relationshipTextReviewDisplayLimits.sectionItems).toBe(
      mobileFeatureDisplayLimits.relationshipTextReviewItems
    );
  });

  it('keeps workbench preview limits centralized across browser and mobile', () => {
    expect(workbenchDisplayLimits.recordViewRows).toBe(24);
    expect(workbenchDisplayLimits.selectedDraftingPrompts).toBe(4);
  });

  it('keeps knowledge vocabulary value limits centralized across browser and mobile', () => {
    expect(knowledgeDisplayLimits.vocabularyValues).toBe(8);
  });

  it('keeps mobile knowledge overview preview limits centralized', () => {
    expect(knowledgeDisplayLimits.schemaSections).toBe(4);
    expect(knowledgeDisplayLimits.relationshipFieldSummaries).toBe(4);
    expect(knowledgeDisplayLimits.fieldConfigurationSections).toBe(3);
    expect(knowledgeDisplayLimits.vocabularyRows).toBe(5);
    expect(knowledgeDisplayLimits.hiddenDetailRows).toBe(5);
  });

  it('formats capped text lists with hidden item counts', () => {
    expect(
      formatLimitedTextList({
        values: ['one', 'two', 'three'],
        limit: 2,
      })
    ).toBe('one, two, and 1 more');
    expect(
      formatLimitedTextList({
        values: ['10: First, Second', '20: Third, Fourth', '30: Fifth'],
        separator: '; ',
        limit: 2,
      })
    ).toBe('10: First, Second; 20: Third, Fourth; and 1 more');
    expect(
      formatLimitedTextList({
        values: ['hidden'],
        limit: 0,
      })
    ).toBe('and 1 more');
  });

  it('formats expansion control labels', () => {
    expect(
      formatExpansionControlLabel({
        isExpanded: false,
        hiddenCount: 3,
        pluralItemLabel: 'Orphaned Records',
      })
    ).toBe('Show 3 More Orphaned Records');
    expect(
      formatExpansionControlLabel({
        isExpanded: true,
        hiddenCount: 0,
        pluralItemLabel: 'Orphaned Records',
      })
    ).toBe('Show Fewer Orphaned Records');
    expect(
      formatExpansionControlLabel({
        isExpanded: false,
        hiddenCount: -2,
        pluralItemLabel: 'Orphaned Records',
      })
    ).toBe('Show 0 More Orphaned Records');
    expect(
      formatExpansionControlLabel({
        isExpanded: false,
        hiddenCount: 1,
        pluralItemLabel: 'Cleanup Rows',
        singularItemLabel: 'Cleanup Row',
      })
    ).toBe('Show 1 More Cleanup Row');
  });

  it('formats hidden count helper text', () => {
    expect(
      formatHiddenCountText({
        hiddenCount: 1,
        singularItemLabel: 'duplicate group',
        pluralItemLabel: 'duplicate groups',
      })
    ).toBe('1 more duplicate group.');
    expect(
      formatHiddenCountText({
        hiddenCount: 3,
        singularItemLabel: 'duplicate group',
        pluralItemLabel: 'duplicate groups',
      })
    ).toBe('3 more duplicate groups.');
    expect(
      formatHiddenCountText({
        hiddenCount: -2,
        singularItemLabel: 'duplicate group',
        pluralItemLabel: 'duplicate groups',
      })
    ).toBe('0 more duplicate groups.');
  });

  it('defines when capped displays should graduate to pagination or virtualization', () => {
    expect(
      getFeatureDisplayScaleDecision(
        featureDisplayScalePolicy.paginationOrVirtualizationThreshold
      )
    ).toMatchObject({
      requiresPaginationOrVirtualization: false,
      requiresRenderedPerformanceReview: false,
    });
    expect(
      getFeatureDisplayScaleDecision(
        featureDisplayScalePolicy.paginationOrVirtualizationThreshold + 1
      )
    ).toMatchObject({
      requiresPaginationOrVirtualization: true,
      requiresRenderedPerformanceReview: false,
    });
    expect(
      getFeatureDisplayScaleDecision(
        featureDisplayScalePolicy.renderedPerformanceReviewThreshold + 1
      )
    ).toEqual({
      requiresPaginationOrVirtualization: true,
      requiresRenderedPerformanceReview: true,
      reason:
        'Rendered performance must be reviewed before relying on display limits for this many records.',
    });
  });
});
