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
});
