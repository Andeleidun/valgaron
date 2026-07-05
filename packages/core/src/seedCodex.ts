import type {
  InFictionWorld,
  WorldCodex,
  WorldDocument,
  WorldEntry,
  WorldEntryKind,
  WorldEntryStatus,
  WorldRelationship,
  WorldSectionConfig,
  WorldWorkspace,
} from './types';
import { supportedPlaceCategoryOptions } from './placeTaxonomy';
import { supportedCharacterCategoryOptions } from './characterTaxonomy';

const SEED_CREATED_AT = '2026-05-01T08:00:00.000Z';
const SEED_SAVED_AT = '2026-06-01T09:00:00.000Z';
const SEED_WORLD_ID = 'world-starter-atlas';

export const placeCategoryOptions = supportedPlaceCategoryOptions;
export const characterCategoryOptions = supportedCharacterCategoryOptions;

export const worldSections: readonly WorldSectionConfig[] = [
  {
    id: 'characters',
    kind: 'character',
    title: 'Characters',
    singularTitle: 'Character',
    description:
      'Named figures, their roles, loyalties, homes, and current status.',
    detailFields: [
      {
        key: 'characterCategory',
        label: 'Character category',
        autocompleteOptions: characterCategoryOptions,
      },
      { key: 'narrativeRole', label: 'Narrative role' },
      { key: 'ancestry', label: 'Ancestry' },
      { key: 'profession', label: 'Profession' },
      { key: 'homePlace', label: 'Home' },
      { key: 'affiliations', label: 'Affiliations' },
      { key: 'currentStatus', label: 'Current status' },
    ],
  },
  {
    id: 'places',
    kind: 'place',
    title: 'Places',
    singularTitle: 'Place',
    description:
      'Worlds, planets, regions, settlements, landmarks, and realms worth revisiting.',
    detailFields: [
      {
        key: 'category',
        label: 'Place category',
        autocompleteOptions: placeCategoryOptions,
      },
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
      'Ordered moments that explain how this setting reached its current state.',
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

export const seedPlanetaryWorlds: readonly InFictionWorld[] = [];

function clonePlanetaryWorlds(
  planetaryWorlds: readonly InFictionWorld[]
): InFictionWorld[] {
  return planetaryWorlds.map((planetaryWorld) => ({
    ...planetaryWorld,
    tags: [...planetaryWorld.tags],
  }));
}

export const seedCodex: WorldCodex = {
  characters: [
    seedEntry({
      id: 'character-mira-rowan',
      kind: 'character',
      name: 'Mira Rowan',
      summary:
        'A careful surveyor keeping field notes, route sketches, and practical warnings for new expeditions.',
      tags: ['surveyor', 'routes', 'maps'],
      updatedAt: '2026-06-01T09:00:00.000Z',
      fields: {
        characterCategory: 'Humanoid person',
        narrativeRole: 'Expedition lead and practical guide',
        ancestry: 'Human',
        profession: 'Surveyor',
        homePlace: 'Harbor District',
        affiliations: 'The Cartographers Guild',
        currentStatus: 'Preparing the northern route survey',
      },
    }),
    seedEntry({
      id: 'character-tomas-quill',
      kind: 'character',
      name: 'Tomas Quill',
      summary:
        'A quartermaster tracking supplies, favors, and the quiet politics of every camp ledger.',
      tags: ['quartermaster', 'supplies', 'ledger'],
      updatedAt: '2026-05-29T13:30:00.000Z',
      fields: {
        characterCategory: 'Humanoid person',
        narrativeRole: 'Logistics foil and camp contact',
        ancestry: 'Human',
        profession: 'Quartermaster',
        homePlace: 'South Market',
        affiliations: 'Northwatch Survey',
        currentStatus: 'Balancing short supplies against an early departure',
      },
    }),
  ],
  places: [
    seedEntry({
      id: 'place-northwatch-harbor',
      kind: 'place',
      name: 'Northwatch Harbor',
      summary:
        'A practical harbor town built around survey ships, repair yards, and a busy winter market.',
      tags: ['harbor', 'trade', 'survey'],
      updatedAt: '2026-05-27T10:15:00.000Z',
      fields: {
        category: 'Town',
        region: 'Northern coast',
        climate: 'Cold maritime wind and steady rain',
        significance:
          'Most expeditions begin here because charts, shipwrights, and supply brokers are easy to find.',
      },
    }),
    seedEntry({
      id: 'place-glassroot-forest',
      kind: 'place',
      name: 'Glassroot Forest',
      summary:
        'A deep forest where pale roots break the surface like glass and make night travel dangerous.',
      tags: ['forest', 'waystones', 'dangerous'],
      updatedAt: '2026-05-24T18:00:00.000Z',
      fields: {
        category: 'Forest',
        region: 'Interior highlands',
        climate: 'Cool canopy with bright ground fog',
        significance:
          'The shortest route to the inland ruins crosses the forest, but only marked paths are safe.',
      },
    }),
  ],
  factions: [
    seedEntry({
      id: 'faction-cartographers-guild',
      kind: 'faction',
      name: 'The Cartographers Guild',
      summary:
        'A practical guild that licenses survey crews, maintains maps, and sells verified route updates.',
      tags: ['maps', 'routes', 'guild'],
      updatedAt: '2026-05-26T15:45:00.000Z',
      fields: {
        purpose: 'Keep maps accurate enough for safe travel and fair trade.',
        influence: 'Trusted by merchants, questioned by frontier captains',
        headquarters: 'Northwatch Harbor',
      },
    }),
    seedEntry({
      id: 'faction-ember-court',
      kind: 'faction',
      name: 'The Ember Court',
      summary:
        'A council of landholders and expedition patrons funding surveys in exchange for first claims.',
      tags: ['patrons', 'claims', 'council'],
      updatedAt: '2026-05-20T11:20:00.000Z',
      fields: {
        purpose:
          'Turn exploration reports into charters, claims, and leverage.',
        influence: 'Strong in coastal offices and sponsor houses',
        headquarters: 'Ember Hall',
      },
    }),
  ],
  lore: [
    seedEntry({
      id: 'lore-waystones',
      kind: 'lore',
      name: 'Waystones',
      summary:
        'Carved trail markers that record distance, direction, and warnings from earlier travelers.',
      tags: ['navigation', 'markers', 'travel'],
      updatedAt: '2026-05-22T08:10:00.000Z',
      fields: {
        category: 'Travel custom',
        source: 'Survey manuals and field reports',
        implications:
          'A missing or altered waystone can turn a safe route into a serious hazard.',
      },
    }),
    seedEntry({
      id: 'lore-tide-calendar',
      kind: 'lore',
      name: 'The Tide Calendar',
      summary:
        'A seasonal planning system used to schedule departures around storms, tides, and inland thaw.',
      tags: ['calendar', 'travel', 'weather'],
      updatedAt: '2026-05-18T16:05:00.000Z',
      fields: {
        category: 'Navigation practice',
        source: 'Harbor records and ship logs',
        implications:
          'Expeditions that ignore the calendar risk arriving after supplies or safe roads disappear.',
      },
    }),
  ],
  timeline: [
    seedEntry({
      id: 'timeline-first-survey',
      kind: 'timeline',
      name: 'First Northern Survey',
      summary:
        'A small crew charted the first reliable route between the harbor and the inland highlands.',
      tags: ['survey', 'routes', 'travel'],
      updatedAt: '2026-05-19T12:00:00.000Z',
      fields: {
        order: '10',
        dateLabel: 'Year 10 of the Harbor Charter',
        era: 'Survey Era',
        consequences:
          'The route made inland expeditions possible and gave map licenses real value.',
      },
    }),
    seedEntry({
      id: 'timeline-harbor-accord',
      kind: 'timeline',
      name: 'Harbor Accord Signed',
      summary:
        'Guild officers, shipwrights, and patrons agreed on shared map fees and expedition rules.',
      tags: ['harbor', 'guild', 'charter'],
      updatedAt: '2026-05-16T09:25:00.000Z',
      fields: {
        order: '4',
        dateLabel: 'Year 4 of the Harbor Charter',
        era: 'Charter Era',
        consequences:
          'The accord made Northwatch Harbor the official starting point for licensed surveys.',
      },
    }),
  ],
};

export const seedRelationships: readonly WorldRelationship[] = [
  {
    id: 'relationship-mira-cartographers-guild',
    sourceEntryId: 'character-mira-rowan',
    targetEntryId: 'faction-cartographers-guild',
    type: 'member of',
    directional: true,
    note: 'Mira files verified route notes through the guild archive.',
    status: 'canon',
    createdAt: SEED_CREATED_AT,
    updatedAt: '2026-06-01T09:00:00.000Z',
  },
  {
    id: 'relationship-accord-cartographers-guild',
    sourceEntryId: 'timeline-harbor-accord',
    targetEntryId: 'faction-cartographers-guild',
    type: 'founded',
    directional: true,
    note: 'The accord formalized guild oversight of licensed route maps.',
    status: 'canon',
    createdAt: SEED_CREATED_AT,
    updatedAt: '2026-05-26T15:45:00.000Z',
  },
  {
    id: 'relationship-first-survey-waystones',
    sourceEntryId: 'timeline-first-survey',
    targetEntryId: 'lore-waystones',
    type: 'caused by',
    directional: true,
    note: 'The first survey depended on marked waystones to keep the return route intact.',
    status: 'canon',
    createdAt: SEED_CREATED_AT,
    updatedAt: '2026-05-19T12:00:00.000Z',
  },
  {
    id: 'relationship-tomas-tide-calendar',
    sourceEntryId: 'character-tomas-quill',
    targetEntryId: 'lore-tide-calendar',
    type: 'references',
    directional: true,
    note: 'Tomas uses the calendar to decide when supplies can move inland.',
    status: 'draft',
    createdAt: SEED_CREATED_AT,
    updatedAt: '2026-05-29T13:30:00.000Z',
  },
  {
    id: 'relationship-glassroot-waystones',
    sourceEntryId: 'place-glassroot-forest',
    targetEntryId: 'lore-waystones',
    type: 'references',
    directional: true,
    note: 'Waystones are the only reliable markers through the forest routes.',
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
    name: 'Sample Atlas',
    summary: 'A neutral starter workspace for testing worldbuilding workflows.',
    defaultEra: 'Harbor Charter',
    status: 'active',
    planetaryWorlds: clonePlanetaryWorlds(seedPlanetaryWorlds),
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
