import { describe, expect, it } from '@jest/globals';
import { parsePolicyMarkdown } from './policyMarkdown';

describe('parsePolicyMarkdown', () => {
  it('renders the privacy markdown subset as semantic blocks', () => {
    const blocks = parsePolicyMarkdown(`# Title

**Effective date:** July 9, 2026

---

## Section

Intro with \`localStorage\`.

- one
- **two**
  continued

1. first
2. second
   continued`);

    expect(blocks).toEqual([
      { kind: 'heading', id: 'title', level: 1, text: 'Title' },
      { kind: 'paragraph', text: 'Effective date: July 9, 2026' },
      { kind: 'rule' },
      { kind: 'heading', id: 'section', level: 2, text: 'Section' },
      { kind: 'paragraph', text: 'Intro with localStorage.' },
      { kind: 'unordered-list', items: ['one', 'two continued'] },
      { kind: 'ordered-list', items: ['first', 'second continued'] },
    ]);
  });
});
