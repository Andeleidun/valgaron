import { describe, expect, it } from '@jest/globals';
import type { CharacterEntry } from '../types';
import {
  applyEntry,
  deleteEntry,
  duplicateEntry,
  entryFromDraft,
  entryMatchesFilters,
  getEntryStatusLabel,
  getEntries,
  getSectionById,
  normalizeTags,
  setEntryArchived,
  type EntryDraft,
} from './codexEntries';
import { createSeedCodex } from './seedCodex';

describe('codex entry helpers', () => {
  it('normalizes comma-separated tags without empty values', () => {
    expect(normalizeTags(' maps,  borderlands,, archive ')).toEqual([
      'maps',
      'borderlands',
      'archive',
    ]);
  });

  it('returns display labels for entry statuses', () => {
    expect(getEntryStatusLabel('needs-review')).toBe('Needs Review');
    expect(getEntryStatusLabel('archived')).toBe('Archived');
  });

  it('creates a trimmed character entry from a draft', () => {
    const section = getSectionById('characters');
    const draft: EntryDraft = {
      name: '  Mira Vale  ',
      summary: '  Keeper of bridge songs.  ',
      notes: '  ## Draft Notes\nKeep the bridge oath unresolved.  ',
      tags: ' bard, bridges ',
      status: 'canon',
      pinned: true,
      details: {
        role: '  Songkeeper  ',
        home: '  Larkspan  ',
        affiliation: '  Free courts  ',
        statusNote: '  Traveling  ',
      },
    };

    if (!section) {
      throw new Error('Expected character section seed config.');
    }

    const entry = entryFromDraft(section, draft);

    expect(entry).toMatchObject({
      kind: 'character',
      name: 'Mira Vale',
      summary: 'Keeper of bridge songs.',
      notes: '## Draft Notes\nKeep the bridge oath unresolved.',
      tags: ['bard', 'bridges'],
      status: 'canon',
      pinned: true,
      fields: {
        role: 'Songkeeper',
        home: 'Larkspan',
        affiliation: 'Free courts',
        statusNote: 'Traveling',
      },
    });
    expect(entry.id).toContain('character-mira-vale-');
    expect(Date.parse(entry.updatedAt)).not.toBeNaN();
  });

  it('adds new entries to the correct collection and updates existing entries', () => {
    const codex = createSeedCodex();
    const entry: CharacterEntry = {
      ...codex.characters[0],
      id: 'character-test-entry',
      name: 'Test Entry',
    };

    const withNewEntry = applyEntry(codex, entry);
    expect(withNewEntry.characters[0]).toEqual(entry);
    expect(withNewEntry.characters).toHaveLength(codex.characters.length + 1);

    const updatedEntry = { ...entry, summary: 'Updated summary' };
    const withUpdatedEntry = applyEntry(withNewEntry, updatedEntry);
    const matchingEntries = withUpdatedEntry.characters.filter(
      (item) => item.id === entry.id
    );

    expect(matchingEntries).toEqual([updatedEntry]);
    expect(withUpdatedEntry.characters).toHaveLength(
      withNewEntry.characters.length
    );
  });

  it('archives, restores, duplicates, and deletes entries', () => {
    const codex = createSeedCodex();
    const section = getSectionById('characters');

    if (!section) {
      throw new Error('Expected character section seed config.');
    }

    const entry = codex.characters[0];
    const archivedCodex = setEntryArchived(codex, entry, true);
    const archivedEntry = archivedCodex.characters.find(
      (item) => item.id === entry.id
    );

    expect(archivedEntry?.status).toBe('archived');

    const restoredCodex = setEntryArchived(
      archivedCodex,
      archivedEntry!,
      false
    );
    const restoredEntry = restoredCodex.characters.find(
      (item) => item.id === entry.id
    );

    expect(restoredEntry?.status).toBe('draft');

    const duplicate = duplicateEntry(section, entry);
    const withDuplicate = applyEntry(codex, duplicate);

    expect(duplicate.id).not.toBe(entry.id);
    expect(duplicate.name).toBe(`${entry.name} Copy`);
    expect(duplicate.fields).toEqual(entry.fields);
    expect(withDuplicate.characters).toHaveLength(codex.characters.length + 1);

    const withoutOriginal = deleteEntry(withDuplicate, entry);

    expect(
      withoutOriginal.characters.some((item) => item.id === entry.id)
    ).toBe(false);
    expect(
      withoutOriginal.characters.some((item) => item.id === duplicate.id)
    ).toBe(true);
  });

  it('filters entries by query text and active tag', () => {
    const codex = createSeedCodex();
    const section = getSectionById('characters');

    if (!section) {
      throw new Error('Expected character section seed config.');
    }

    const entries = getEntries(codex, section.id);
    expect(entryMatchesFilters(entries[0], section, 'forbidden maps', '')).toBe(
      true
    );
    expect(entryMatchesFilters(entries[0], section, '', 'maps')).toBe(true);
    expect(entryMatchesFilters(entries[0], section, 'forbidden', 'exile')).toBe(
      false
    );
  });
});
