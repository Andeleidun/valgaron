import type { WorldCodex, WorldSectionConfig } from '../types';

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
      { key: 'status', label: 'Status' },
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
      { key: 'dateLabel', label: 'Date or order' },
      { key: 'era', label: 'Era' },
      { key: 'consequences', label: 'Consequences', multiline: true },
    ],
  },
];

export const seedCodex: WorldCodex = {
  characters: [
    {
      id: 'character-sera-vall',
      kind: 'character',
      name: 'Sera Vall',
      summary:
        'A border archivist who records forbidden maps and quietly protects displaced travelers.',
      tags: ['archivist', 'borderlands', 'maps'],
      updatedAt: '2026-06-01T09:00:00.000Z',
      role: 'Archive keeper and reluctant field guide',
      home: 'Greyharbor Annex',
      affiliation: 'The Lantern Registry',
      status: 'Active in the western marches',
    },
    {
      id: 'character-kael-orrin',
      kind: 'character',
      name: 'Kael Orrin',
      summary:
        'A former oathblade carrying a royal debt, a cracked sunstone, and several false names.',
      tags: ['oathblade', 'exile', 'sunstone'],
      updatedAt: '2026-05-29T13:30:00.000Z',
      role: 'Exiled duelist',
      home: 'The Ember Coast',
      affiliation: 'None declared',
      status: 'Wanted in two crown provinces',
    },
  ],
  places: [
    {
      id: 'place-mirrowfen',
      kind: 'place',
      name: 'Mirrowfen',
      summary:
        'A mirror-bright wetland where roads appear after moonrise and vanish before dawn.',
      tags: ['wetland', 'moonroads', 'haunted'],
      updatedAt: '2026-05-27T10:15:00.000Z',
      region: 'North of the Old Causeway',
      climate: 'Cold marsh with silver fog',
      significance:
        'Travelers can cross a week of distance in one night if they know the right reflection.',
    },
    {
      id: 'place-ashmantle-gate',
      kind: 'place',
      name: 'Ashmantle Gate',
      summary:
        'A mountain pass sealed by basalt doors after the last dragon tithe was refused.',
      tags: ['mountains', 'sealed gate', 'dragons'],
      updatedAt: '2026-05-24T18:00:00.000Z',
      region: 'Cinderpeak Range',
      climate: 'Dry alpine ashfall',
      significance:
        'Controls the only reliable passage between the high valleys and the eastern kingdoms.',
    },
  ],
  factions: [
    {
      id: 'faction-lantern-registry',
      kind: 'faction',
      name: 'The Lantern Registry',
      summary:
        'A civic order that maintains safe routes, witness ledgers, and signal houses.',
      tags: ['routes', 'archives', 'civic'],
      updatedAt: '2026-05-26T15:45:00.000Z',
      purpose: 'Keep travelers from disappearing between unstable borders.',
      influence: 'Trusted by merchants, distrusted by several crowns',
      headquarters: 'Greyharbor Annex',
    },
    {
      id: 'faction-gilded-choir',
      kind: 'faction',
      name: 'The Gilded Choir',
      summary:
        'A devotional banking house that turns vows into legal currency.',
      tags: ['faith', 'banking', 'vows'],
      updatedAt: '2026-05-20T11:20:00.000Z',
      purpose:
        'Bind patrons to sacred debts and fund temple-backed expeditions.',
      influence: 'Deep in port cities and succession courts',
      headquarters: 'Aurelion Basilica',
    },
  ],
  lore: [
    {
      id: 'lore-sunstones',
      kind: 'lore',
      name: 'Sunstones',
      summary:
        'Amber relics that store oathlight and fracture when their bearer breaks a sworn vow.',
      tags: ['magic', 'relics', 'oaths'],
      updatedAt: '2026-05-22T08:10:00.000Z',
      category: 'Magic artifact',
      source: 'Temple inventories and duelist accounts',
      implications:
        'A cracked sunstone can prove betrayal, but forged cracks are becoming common.',
    },
    {
      id: 'lore-dragon-tithe',
      kind: 'lore',
      name: 'The Dragon Tithe',
      summary:
        'An abandoned treaty that once exchanged mountain passage for tribute paid in worked silver.',
      tags: ['treaty', 'dragons', 'silver'],
      updatedAt: '2026-05-18T16:05:00.000Z',
      category: 'Political custom',
      source: 'Ashmantle inscriptions',
      implications:
        'Reopening the gate may require a legal heir to the old tribute contract.',
    },
  ],
  timeline: [
    {
      id: 'timeline-gate-sealed',
      kind: 'timeline',
      name: 'Ashmantle Gate Sealed',
      summary:
        'The basalt doors were closed after three provinces refused the final silver tithe.',
      tags: ['Ashmantle', 'dragons', 'trade'],
      updatedAt: '2026-05-19T12:00:00.000Z',
      dateLabel: 'Year 412 of the Fifth Compact',
      era: 'Late Compact Era',
      consequences:
        'Eastern trade moved to sea routes, enriching Greyharbor and isolating the high valleys.',
    },
    {
      id: 'timeline-registry-founded',
      kind: 'timeline',
      name: 'Lantern Registry Founded',
      summary:
        'Signal houses were standardized after the winter when twelve border villages vanished from maps.',
      tags: ['Lantern Registry', 'borderlands', 'maps'],
      updatedAt: '2026-05-16T09:25:00.000Z',
      dateLabel: 'Winter of Blank Roads',
      era: 'Border Reckoning',
      consequences:
        'Archivists gained unusual political protection in exchange for route accountability.',
    },
  ],
};

export function createSeedCodex(): WorldCodex {
  return {
    characters: seedCodex.characters.map((entry) => ({
      ...entry,
      tags: [...entry.tags],
    })),
    places: seedCodex.places.map((entry) => ({
      ...entry,
      tags: [...entry.tags],
    })),
    factions: seedCodex.factions.map((entry) => ({
      ...entry,
      tags: [...entry.tags],
    })),
    lore: seedCodex.lore.map((entry) => ({ ...entry, tags: [...entry.tags] })),
    timeline: seedCodex.timeline.map((entry) => ({
      ...entry,
      tags: [...entry.tags],
    })),
  };
}
