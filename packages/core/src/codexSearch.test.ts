import { describe, expect, it } from '@jest/globals';
import {
  filterSectionEntries,
  getSearchableEntries,
  getSearchResultContext,
  searchEntries,
  sortEntries,
} from './codexSearch';
import { createSeedCodex, worldSections } from './seedCodex';

describe('codex search helpers', () => {
  it('searches across entry names, tags, notes, and detail fields', () => {
    const codex = createSeedCodex();
    codex.characters[0] = {
      ...codex.characters[0],
      notes: '## Secret\nMaintains a hidden atlas.',
    };
    const searchableEntries = getSearchableEntries(codex, worldSections);

    expect(
      searchEntries(searchableEntries, worldSections, 'hidden atlas').map(
        (entry) => entry.id
      )
    ).toEqual(['character-mira-rowan']);
    expect(
      searchEntries(searchableEntries, worldSections, 'Interior highlands').map(
        (entry) => entry.id
      )
    ).toEqual(['place-glassroot-forest']);
  });

  it('builds shared search result context copy', () => {
    const [entry] = getSearchableEntries(createSeedCodex(), worldSections);

    expect(getSearchResultContext(entry)).toMatch(/^Characters - Updated /);
  });

  it('filters section entries by query, tag, status, and archived visibility', () => {
    const codex = createSeedCodex();
    const section = worldSections[0];
    const archivedEntry = {
      ...codex.characters[0],
      status: 'archived' as const,
    };
    const entries = [archivedEntry, codex.characters[1]];

    expect(
      filterSectionEntries(entries, section, {
        query: '',
        activeTag: '',
        status: '',
        showArchived: false,
        updatedWithinDays: null,
      }).map((entry) => entry.id)
    ).toEqual(['character-tomas-quill']);
    expect(
      filterSectionEntries(entries, section, {
        query: '',
        activeTag: '',
        status: 'archived',
        showArchived: false,
        updatedWithinDays: null,
      }).map((entry) => entry.id)
    ).toEqual(['character-mira-rowan']);
    expect(
      filterSectionEntries(entries, section, {
        query: 'supplies',
        activeTag: 'ledger',
        status: '',
        showArchived: false,
        updatedWithinDays: null,
      }).map((entry) => entry.id)
    ).toEqual(['character-tomas-quill']);
    expect(
      filterSectionEntries(entries, section, {
        query: '',
        activeTag: '',
        status: '',
        showArchived: false,
        updatedWithinDays: 3,
        now: new Date('2026-06-01T00:00:00.000Z'),
      }).map((entry) => entry.id)
    ).toEqual(['character-tomas-quill']);
  });

  it('sorts entries by name, created date, updated date, and status', () => {
    const codex = createSeedCodex();
    const entries = [
      {
        ...codex.characters[0],
        status: 'needs-review' as const,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-02T00:00:00.000Z',
      },
      {
        ...codex.characters[1],
        status: 'canon' as const,
        createdAt: '2026-01-03T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
    ];

    expect(sortEntries(entries, 'name').map((entry) => entry.name)).toEqual([
      'Mira Rowan',
      'Tomas Quill',
    ]);
    expect(sortEntries(entries, 'created-desc')[0].name).toBe('Tomas Quill');
    expect(sortEntries(entries, 'updated-desc')[0].name).toBe('Mira Rowan');
    expect(sortEntries(entries, 'status')[0].status).toBe('canon');
  });
});
