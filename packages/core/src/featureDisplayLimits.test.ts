import { describe, expect, it } from '@jest/globals';
import {
  featureDisplayScalePolicy,
  formatLimitedTextList,
  getFeatureDisplayScaleDecision,
  getLimitedResultModel,
  mobileFeatureDisplayLimits,
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
