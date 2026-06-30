import { describe, expect, it } from '@jest/globals';
import { downloadTextFile, slugFilename } from './fileDownloads';

describe('fileDownloads', () => {
  it('creates conservative filenames from display names', () => {
    expect(slugFilename(' Valgaron: Fifth Compact! ')).toBe(
      'valgaron-fifth-compact'
    );
    expect(slugFilename('***')).toBe('world');
  });

  it('reports download unavailability outside a browser document', () => {
    expect(downloadTextFile('world.json', '{}')).toBe(false);
  });
});
