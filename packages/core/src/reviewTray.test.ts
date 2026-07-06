import { describe, expect, it } from '@jest/globals';
import { getReviewTraySummaryModel } from './reviewTray';

describe('review tray model', () => {
  it('normalizes review summary items with totals and default severities', () => {
    expect(
      getReviewTraySummaryModel([
        {
          id: 'broken-links',
          title: 'Broken references',
          count: 2,
          countLabel: '2 broken links',
          detail: 'Relationships with missing endpoints.',
        },
        {
          id: 'notes',
          title: 'Notes',
          count: 0,
          detail: 'No notes to review.',
          severity: 'info',
        },
      ])
    ).toEqual({
      hasIssues: true,
      totalIssueCount: 2,
      items: [
        {
          id: 'broken-links',
          title: 'Broken references',
          count: 2,
          countLabel: '2 broken links',
          detail: 'Relationships with missing endpoints.',
          hasIssues: true,
          severity: 'warning',
        },
        {
          id: 'notes',
          title: 'Notes',
          count: 0,
          countLabel: '0',
          detail: 'No notes to review.',
          hasIssues: false,
          severity: 'info',
        },
      ],
    });
  });
});
