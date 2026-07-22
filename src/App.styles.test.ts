/// <reference types="node" />

import { describe, expect, it } from '@jest/globals';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('global app styles', () => {
  it('renders every disabled button as unavailable without a pointer cursor', () => {
    const css = readFileSync(join(process.cwd(), 'src', 'App.css'), 'utf8');

    expect(css).toMatch(
      /button:disabled\s*{[^}]*cursor:\s*not-allowed\s*!important;[^}]*opacity:\s*0\.52;/
    );
  });

  it('centers shared button labels and spaces panel form controls', () => {
    const css = readFileSync(join(process.cwd(), 'src', 'App.css'), 'utf8');
    const buttonCss = readFileSync(
      join(
        process.cwd(),
        'src',
        'Components',
        'Common',
        'Button',
        'Button.css'
      ),
      'utf8'
    );

    expect(css).toMatch(
      /\.vwb-primary-button,\s*\.vwb-secondary-button,\s*\.vwb-save-status\s*{[^}]*display:\s*inline-flex;[^}]*align-items:\s*center;[^}]*justify-content:\s*center;/
    );
    expect(css).toContain('.vwb-field-configuration-row');
    expect(css).toMatch(
      /label:not\(\.vwb-checkbox-field\)[^{]*{[^}]*gap:\s*8px;/
    );
    expect(buttonCss).toMatch(
      /\.button\s*{[^}]*display:\s*inline-flex;[^}]*align-items:\s*center;[^}]*justify-content:\s*center;/
    );
    expect(buttonCss).toMatch(
      /\.toggle-button-container \.toggle-button\s*{[^}]*display:\s*grid;[^}]*align-items:\s*center;/
    );
  });
});
