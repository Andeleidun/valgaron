import { describe, expect, it } from '@jest/globals';
import { valgaronColors, valgaronRadius, valgaronSpacing } from './index';

describe('Valgaron UI tokens', () => {
  it('keeps the current web codex colors as shared tokens', () => {
    expect(valgaronColors).toMatchObject({
      page: '#111312',
      surface: '#1b1d1b',
      surfaceStrong: '#262a25',
      field: '#141614',
      heading: '#f4efe6',
      text: '#d6d0c6',
      muted: '#a9b0a7',
      border: '#3a403a',
      accent: '#d08a4e',
      danger: '#ff8b8b',
      focus: '#79c6bd',
    });
  });

  it('exposes compact spacing and radius primitives', () => {
    expect(valgaronSpacing.md).toBe(12);
    expect(valgaronRadius.lg).toBe(8);
  });
});
