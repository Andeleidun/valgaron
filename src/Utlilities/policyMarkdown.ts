export type PolicyMarkdownBlock =
  | {
      kind: 'heading';
      id: string;
      level: 1 | 2 | 3;
      text: string;
    }
  | {
      kind: 'paragraph';
      text: string;
    }
  | {
      kind: 'unordered-list';
      items: string[];
    }
  | {
      kind: 'ordered-list';
      items: string[];
    }
  | {
      kind: 'rule';
    };

function formatHeadingId(text: string): string {
  return text
    .toLowerCase()
    .replace(/`/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function stripMarkdownSyntax(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .trim();
}

function flushParagraph(
  blocks: PolicyMarkdownBlock[],
  paragraphLines: string[]
) {
  if (paragraphLines.length === 0) {
    return;
  }
  blocks.push({
    kind: 'paragraph',
    text: stripMarkdownSyntax(paragraphLines.join(' ')),
  });
  paragraphLines.length = 0;
}

function flushList(
  blocks: PolicyMarkdownBlock[],
  listKind: 'ordered-list' | 'unordered-list' | null,
  listItems: string[]
) {
  if (!listKind || listItems.length === 0) {
    return;
  }
  blocks.push({
    kind: listKind,
    items: listItems.map(stripMarkdownSyntax),
  });
  listItems.length = 0;
}

export function parsePolicyMarkdown(markdown: string): PolicyMarkdownBlock[] {
  const blocks: PolicyMarkdownBlock[] = [];
  const paragraphLines: string[] = [];
  const listItems: string[] = [];
  let listKind: 'ordered-list' | 'unordered-list' | null = null;

  for (const line of markdown.split(/\r?\n/)) {
    const trimmedLine = line.trim();

    if (!trimmedLine) {
      flushParagraph(blocks, paragraphLines);
      flushList(blocks, listKind, listItems);
      listKind = null;
      continue;
    }

    const headingMatch = /^(#{1,3})\s+(.+)$/.exec(trimmedLine);
    if (headingMatch) {
      flushParagraph(blocks, paragraphLines);
      flushList(blocks, listKind, listItems);
      listKind = null;
      const text = stripMarkdownSyntax(headingMatch[2] ?? '');
      blocks.push({
        kind: 'heading',
        id: formatHeadingId(text),
        level: headingMatch[1]?.length as 1 | 2 | 3,
        text,
      });
      continue;
    }

    if (trimmedLine === '---') {
      flushParagraph(blocks, paragraphLines);
      flushList(blocks, listKind, listItems);
      listKind = null;
      blocks.push({ kind: 'rule' });
      continue;
    }

    if (/^\s+/.test(line) && listKind && listItems.length > 0) {
      listItems[listItems.length - 1] = `${
        listItems[listItems.length - 1]
      } ${trimmedLine}`;
      continue;
    }

    const unorderedMatch = /^-\s+(.+)$/.exec(trimmedLine);
    if (unorderedMatch) {
      flushParagraph(blocks, paragraphLines);
      if (listKind !== 'unordered-list') {
        flushList(blocks, listKind, listItems);
        listKind = 'unordered-list';
      }
      listItems.push(unorderedMatch[1] ?? '');
      continue;
    }

    const orderedMatch = /^\d+\.\s+(.+)$/.exec(trimmedLine);
    if (orderedMatch) {
      flushParagraph(blocks, paragraphLines);
      if (listKind !== 'ordered-list') {
        flushList(blocks, listKind, listItems);
        listKind = 'ordered-list';
      }
      listItems.push(orderedMatch[1] ?? '');
      continue;
    }

    paragraphLines.push(trimmedLine);
  }

  flushParagraph(blocks, paragraphLines);
  flushList(blocks, listKind, listItems);

  return blocks;
}
