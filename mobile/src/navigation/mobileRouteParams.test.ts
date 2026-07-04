import { describe, expect, it } from '@jest/globals';
import {
  getMobileRouteParam,
  getNextMobileEntryQuery,
} from './mobileRouteParams';

describe('mobile route params', () => {
  it('normalizes Expo Router scalar and array params', () => {
    expect(getMobileRouteParam('entries')).toBe('entries');
    expect(getMobileRouteParam(['first', 'second'])).toBe('first');
    expect(getMobileRouteParam(undefined)).toBeUndefined();
  });

  it('clears stale mobile entry search on section changes unless the route supplies a query', () => {
    expect(
      getNextMobileEntryQuery({
        currentQuery: 'mira',
        requestedQuery: undefined,
        sectionChanged: true,
      })
    ).toBe('');
    expect(
      getNextMobileEntryQuery({
        currentQuery: 'mira',
        requestedQuery: 'guild',
        sectionChanged: true,
      })
    ).toBe('guild');
    expect(
      getNextMobileEntryQuery({
        currentQuery: 'mira',
        requestedQuery: undefined,
        sectionChanged: false,
      })
    ).toBe('mira');
  });
});
