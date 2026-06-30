import type {
  WorldCodex,
  WorldDocument,
  WorldEntry,
  WorldEntryKind,
  WorldEntryStatus,
  WorldRelationship,
  WorldSectionConfig,
  WorldWorkspace,
} from '../types';

const SEED_CREATED_AT = '2026-05-01T08:00:00.000Z';
const SEED_SAVED_AT = '2026-06-01T09:00:00.000Z';
const SEED_WORLD_ID = 'world-valgaron';

export const worldSections: readonly WorldSectionConfig[] = [
  {
    id: 'characters',
    kind: 'character',
    title: 'Characters',
    singularTitle: 'Character',
    description:
      'Named figures, their roles, loyalties, homes, and current status.',
    detailFields: [
      { key: 'role', label: 'Role' },
      { key: 'home', label: 'Home' },
      { key: 'affiliation', label: 'Affiliation' },
      { key: 'statusNote', label: 'Status' },
    ],
  },
  {
    id: 'places',
    kind: 'place',
    title: 'Places',
    singularTitle: 'Place',
    description:
      'Regions, settlements, ruins, landmarks, and realms worth revisiting.',
    detailFields: [
      { key: 'region', label: 'Region' },
      { key: 'climate', label: 'Climate' },
      { key: 'significance', label: 'Significance', multiline: true },
    ],
  },
  {
    id: 'factions',
    kind: 'faction',
    title: 'Factions',
    singularTitle: 'Faction',
    description:
      'Power groups, guilds, armies, faiths, houses, and hidden orders.',
    detailFields: [
      { key: 'purpose', label: 'Purpose', multiline: true },
      { key: 'influence', label: 'Influence' },
      { key: 'headquarters', label: 'Headquarters' },
    ],
  },
  {
    id: 'lore',
    kind: 'lore',
    title: 'Lore',
    singularTitle: 'Lore Note',
    description:
      'Magic rules, customs, myths, artifacts, creatures, and open questions.',
    detailFields: [
      { key: 'category', label: 'Category' },
      { key: 'source', label: 'Source' },
      { key: 'implications', label: 'Implications', multiline: true },
    ],
  },
  {
    id: 'timeline',
    kind: 'timeline',
    title: 'Timeline',
    singularTitle: 'Timeline Event',
    description:
      'Ordered moments that explain how Valgaron reached its current state.',
    detailFields: [
      { key: 'order', label: 'Sort order' },
      { key: 'dateLabel', label: 'Date or order' },
      { key: 'era', label: 'Era' },
      { key: 'consequences', label: 'Consequences', multiline: true },
    ],
  },
];

type SeedEntryInput = {
  id: string;
  kind: WorldEntryKind;
  name: string;
  summary: string;
  tags: string[];
  updatedAt: string;
  fields: Record<string, string>;
};

function seedEntry(input: SeedEntryInput): WorldEntry {
  return {
    ...input,
    notes: '',
    status: 'draft' satisfies WorldEntryStatus,
    pinned: false,
    createdAt: SEED_CREATED_AT,
    fields: { ...input.fields },
    tags: [...input.tags],
  };
}

export const seedCodex: WorldCodex = {
  characters: [
    seedEntry({
      id: 'character-sera-vall',
      kind: 'character',
      name: 'Sera Vall',
      summary:
        'A border archivist who records forbidden maps and quietly protects displaced travelers.',
      tags: ['archivist', 'borderlands', 'maps'],
      updatedAt: '2026-06-01T09:00:00.000Z',
      fields: {
        role: 'Archive keeper and reluctant field guide',
        home: 'Greyharbor Annex',
        affiliation: 'The Lantern Registry',
        statusNote: 'Active in the western marches',
      },
    }),
    seedEntry({
      id: 'character-kael-orrin',
      kind: 'character',
      name: 'Kael Orrin',
      summary:
        'A former oathblade carrying a royal debt, a cracked sunstone, and several false names.',
      tags: ['oathblade', 'exile', 'sunstone'],
      updatedAt: '2026-05-29T13:30:00.000Z',
      fields: {
        role: 'Exiled duelist',
        home: 'The Ember Coast',
        affiliation: 'None declared',
        statusNote: 'Wanted in two crown provinces',
      },
    }),
  ],
  places: [
    seedEntry({
      id: 'place-mirrowfen',
      kind: 'place',
      name: 'Mirrowfen',
      summary:
        'A mirror-bright wetland where roads appear after moonrise and vanish before dawn.',
      tags: ['wetland', 'moonroads', 'haunted'],
      updatedAt: '2026-05-27T10:15:00.000Z',
      fields: {
        region: 'North of the Old Causeway',
        climate: 'Cold marsh with silver fog',
        significance:
          'Travelers can cross a week of distance in one night if they know the right reflection.',
      },
    }),
    seedEntry({
      id: 'place-ashmantle-gate',
      kind: 'place',
      name: 'Ashmantle Gate',
      summary:
        'A mountain pass sealed by basalt doors after the last dragon tithe was refused.',
      tags: ['mountains', 'sealed gate', 'dragons'],
      updatedAt: '2026-05-24T18:00:00.000Z',
      fields: {
        region: 'Cinderpeak Range',
        climate: 'Dry alpine ashfall',
        significance:
          'Controls the only reliable passage between the high valleys and the eastern kingdoms.',
      },
    }),
  ],
  factions: [
    seedEntry({
      id: 'faction-lantern-registry',
      kind: 'faction',
      name: 'The Lantern Registry',
      summary:
        'A civic order that maintains safe routes, witness ledgers, and signal houses.',
      tags: ['routes', 'archives', 'civic'],
      updatedAt: '2026-05-26T15:45:00.000Z',
      fields: {
        purpose: 'Keep travelers from disappearing between unstable borders.',
        influence: 'Trusted by merchants, distrusted by several crowns',
        headquarters: 'Greyharbor Annex',
      },
    }),
    seedEntry({
      id: 'faction-gilded-choir',
      kind: 'faction',
      name: 'The Gilded Choir',
      summary:
        'A devotional banking house that turns vows into legal currency.',
      tags: ['faith', 'banking', 'vows'],
      updatedAt: '2026-05-20T11:20:00.000Z',
      fields: {
        purpose:
          'Bind patrons to sacred debts and fund temple-backed expeditions.',
        influence: 'Deep in port cities and succession courts',
        headquarters: 'Aurelion Basilica',
      },
    }),
  ],
  lore: [
    seedEntry({
      id: 'lore-sunstones',
      kind: 'lore',
      name: 'Sunstones',
      summary:
        'Amber relics that store oathlight and fracture when their bearer breaks a sworn vow.',
      tags: ['magic', 'relics', 'oaths'],
      updatedAt: '2026-05-22T08:10:00.000Z',
      fields: {
        category: 'Magic artifact',
        source: 'Temple inventories and duelist accounts',
        implications:
          'A cracked sunstone can prove betrayal, but forged cracks are becoming common.',
      },
    }),
    seedEntry({
      id: 'lore-dragon-tithe',
      kind: 'lore',
      name: 'The Dragon Tithe',
      summary:
        'An abandoned treaty that once exchanged mountain passage for tribute paid in worked silver.',
      tags: ['treaty', 'dragons', 'silver'],
      updatedAt: '2026-05-18T16:05:00.000Z',
      fields: {
        category: 'Political custom',
        source: 'Ashmantle inscriptions',
        implications:
          'Reopening the gate may require a legal heir to the old tribute contract.',
      },
    }),
  ],
  timeline: [
    seedEntry({
      id: 'timeline-gate-sealed',
      kind: 'timeline',
      name: 'Ashmantle Gate Sealed',
      summary:
        'The basalt doors were closed after three provinces refused the final silver tithe.',
      tags: ['Ashmantle', 'dragons', 'trade'],
      updatedAt: '2026-05-19T12:00:00.000Z',
      fields: {
        order: '412',
        dateLabel: 'Year 412 of the Fifth Compact',
        era: 'Late Compact Era',
        consequences:
          'Eastern trade moved to sea routes, enriching Greyharbor and isolating the high valleys.',
      },
    }),
    seedEntry({
      id: 'timeline-registry-founded',
      kind: 'timeline',
      name: 'Lantern Registry Founded',
      summary:
        'Signal houses were standardized after the winter when twelve border villages vanished from maps.',
      tags: ['Lantern Registry', 'borderlands', 'maps'],
      updatedAt: '2026-05-16T09:25:00.000Z',
      fields: {
        order: '318',
        dateLabel: 'Winter of Blank Roads',
        era: 'Border Reckoning',
        consequences:
          'Archivists gained unusual political protection in exchange for route accountability.',
      },
    }),
  ],
};

export const seedRelationships: readonly WorldRelationship[] = [
  {
    id: 'relationship-sera-lantern-registry',
    sourceEntryId: 'character-sera-vall',
    targetEntryId: 'faction-lantern-registry',
    type: 'member of',
    directional: true,
    note: 'Sera maintains border ledgers and witness records for the Registry.',
    status: 'canon',
    createdAt: SEED_CREATED_AT,
    updatedAt: '2026-06-01T09:00:00.000Z',
  },
  {
    id: 'relationship-registry-founded-by-event',
    sourceEntryId: 'timeline-registry-founded',
    targetEntryId: 'faction-lantern-registry',
    type: 'founded',
    directional: true,
    note: 'The Winter of Blank Roads created the political mandate for the Registry.',
    status: 'canon',
    createdAt: SEED_CREATED_AT,
    updatedAt: '2026-05-26T15:45:00.000Z',
  },
  {
    id: 'relationship-gate-dragon-tithe',
    sourceEntryId: 'timeline-gate-sealed',
    targetEntryId: 'lore-dragon-tithe',
    type: 'caused by',
    directional: true,
    note: 'The refusal of the final silver tithe led directly to the gate sealing.',
    status: 'canon',
    createdAt: SEED_CREATED_AT,
    updatedAt: '2026-05-19T12:00:00.000Z',
  },
  {
    id: 'relationship-kael-sunstones',
    sourceEntryId: 'character-kael-orrin',
    targetEntryId: 'lore-sunstones',
    type: 'carries',
    directional: true,
    note: 'Kael carries a cracked sunstone that may prove a broken oath.',
    status: 'draft',
    createdAt: SEED_CREATED_AT,
    updatedAt: '2026-05-29T13:30:00.000Z',
  },
  {
    id: 'relationship-ashmantle-dragon-tithe',
    sourceEntryId: 'place-ashmantle-gate',
    targetEntryId: 'lore-dragon-tithe',
    type: 'references',
    directional: true,
    note: 'Ashmantle inscriptions preserve fragments of the tribute contract.',
    status: 'draft',
    createdAt: SEED_CREATED_AT,
    updatedAt: '2026-05-24T18:00:00.000Z',
  },
];

function cloneEntries(entries: WorldEntry[]): WorldEntry[] {
  return entries.map((entry) => ({
    ...entry,
    tags: [...entry.tags],
    fields: { ...entry.fields },
  }));
}

function cloneRelationships(
  relationships: readonly WorldRelationship[]
): WorldRelationship[] {
  return relationships.map((relationship) => ({ ...relationship }));
}

export function createSeedCodex(): WorldCodex {
  return {
    characters: cloneEntries(seedCodex.characters),
    places: cloneEntries(seedCodex.places),
    factions: cloneEntries(seedCodex.factions),
    lore: cloneEntries(seedCodex.lore),
    timeline: cloneEntries(seedCodex.timeline),
  };
}

export function createSeedWorld(): WorldWorkspace {
  return {
    id: SEED_WORLD_ID,
    name: 'Valgaron',
    summary: 'The default Valgaron drafting workspace.',
    defaultEra: 'Fifth Compact',
    entryTypes: worldSections.map((section) => ({ ...section })),
    codex: createSeedCodex(),
    relationships: cloneRelationships(seedRelationships),
    createdAt: SEED_CREATED_AT,
    updatedAt: SEED_SAVED_AT,
  };
}

export function createSeedWorldDocument(): WorldDocument {
  return {
    schemaVersion: 2,
    activeWorldId: SEED_WORLD_ID,
    worlds: [createSeedWorld()],
    savedAt: SEED_SAVED_AT,
  };
}
