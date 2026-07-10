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
import { CURRENT_WORLD_SCHEMA_VERSION, getActiveWorld } from './worldDocument';
import { cloneWorkspaceSchema, worldSections } from './seedCodex';

const createdAt = '2026-06-15T10:00:00.000Z';
const savedAt = '2026-06-20T18:30:00.000Z';

const artifactSection = {
  id: 'artifacts',
  kind: 'artifact',
  title: 'Artifacts',
  singularTitle: 'Artifact',
  description: 'Objects with worldbuilding importance.',
  detailFields: [
    { key: 'origin', label: 'Origin' },
    { key: 'power', label: 'Power', multiline: true },
    { key: 'keeper', label: 'Current keeper' },
  ],
  custom: true,
} as const satisfies WorldSectionConfig;

const paritySections: readonly WorldSectionConfig[] = [
  ...worldSections.map((section) => ({
    ...section,
    detailFields: section.detailFields.map((field) => ({ ...field })),
  })),
  artifactSection,
];

type EntryInput = {
  id: string;
  kind: WorldEntryKind;
  name: string;
  summary: string;
  notes?: string;
  tags: readonly string[];
  status?: WorldEntryStatus;
  pinned?: boolean;
  updatedAt?: string;
  fields: Record<string, string>;
};

function entry(input: EntryInput): WorldEntry {
  return {
    id: input.id,
    kind: input.kind,
    name: input.name,
    summary: input.summary,
    notes: input.notes ?? '',
    tags: [...input.tags],
    status: input.status ?? 'draft',
    pinned: input.pinned ?? false,
    createdAt,
    updatedAt: input.updatedAt ?? createdAt,
    fields: { ...input.fields },
    images: [],
  };
}

function planetaryWorld({
  id,
  name,
  status = 'draft',
}: {
  id: string;
  name: string;
  status?: WorldEntryStatus;
}): InFictionWorld {
  return {
    id,
    name,
    summary: `${name} is part of the shared parity fixture.`,
    classification: status === 'archived' ? 'Lost moon' : 'Living world',
    climate: status === 'archived' ? 'Frozen storm belts' : 'Mild oceans',
    dominantTerrain: status === 'archived' ? 'Ice shelves' : 'Harbor chains',
    notes: `${name} should round-trip through web and mobile JSON exports.`,
    tags: [status === 'archived' ? 'archived-world' : 'active-world'],
    status,
    createdAt,
    updatedAt: status === 'archived' ? '2026-06-16T12:00:00.000Z' : createdAt,
  };
}

function relationship(
  input: Omit<WorldRelationship, 'createdAt' | 'updatedAt'>
): WorldRelationship {
  return {
    ...input,
    createdAt,
    updatedAt: createdAt,
  };
}

function createActiveCodex(): WorldCodex {
  return {
    characters: [
      entry({
        id: 'character-elyra-vale',
        kind: 'character',
        name: 'Elyra Vale',
        summary: 'A treaty scribe who maps old promises onto new borders.',
        notes: 'Keeps a private ledger of disputed oaths.',
        tags: ['scribe', 'treaties', 'featured'],
        status: 'canon',
        pinned: true,
        updatedAt: '2026-06-20T16:00:00.000Z',
        fields: {
          characterCategory: 'Humanoid person',
          narrativeRole: 'Treaty scribe',
          ancestry: 'Human',
          profession: 'Scribe',
          homePlace: 'Moonspire Port',
          affiliations: 'The Inkbound Cartel',
          currentStatus: 'Preparing the Moonspire accord',
        },
      }),
      entry({
        id: 'character-corin-ash',
        kind: 'character',
        name: 'Corin Ash',
        summary: 'A retired scout archiving unsafe passes.',
        tags: ['scout', 'passes'],
        status: 'needs-review',
        fields: {
          characterCategory: 'Humanoid person',
          narrativeRole: 'Retired scout',
          ancestry: 'Human',
          profession: 'Scout',
          homePlace: 'Ashroad Watch',
          affiliations: 'Unaffiliated',
          currentStatus: 'Hiding old route maps',
        },
      }),
    ],
    places: [
      entry({
        id: 'place-moonspire-port',
        kind: 'place',
        name: 'Moonspire Port',
        summary: 'A tidal city built below a pale observatory tower.',
        notes: 'The harbor stones glow before storms.',
        tags: ['harbor', 'moonspire', 'trade'],
        status: 'canon',
        pinned: true,
        updatedAt: '2026-06-20T17:00:00.000Z',
        fields: {
          category: 'City',
          region: 'Silver Coast',
          climate: 'Salt fog and warm rain',
          significance: 'Controls the legal route to the inner islands.',
        },
      }),
      entry({
        id: 'place-ashroad-watch',
        kind: 'place',
        name: 'Ashroad Watch',
        summary: 'A ruined watchpost above the old volcanic road.',
        tags: ['watchpost', 'ruin'],
        status: 'archived',
        fields: {
          category: 'Outpost',
          region: 'Cinder March',
          climate: 'Dry ash wind',
          significance: 'Formerly guarded the pass to Moonspire Port.',
        },
      }),
    ],
    factions: [
      entry({
        id: 'faction-inkbound-cartel',
        kind: 'faction',
        name: 'The Inkbound Cartel',
        summary:
          'A guild of notaries who enforce contracts by controlling maps.',
        tags: ['guild', 'contracts'],
        status: 'canon',
        fields: {
          purpose: 'Maintain binding records and route charters.',
          influence: 'Strong in coastal courts',
          headquarters: 'Moonspire Port',
        },
      }),
    ],
    lore: [
      entry({
        id: 'lore-starlit-ink',
        kind: 'lore',
        name: 'Starlit Ink',
        summary:
          'A luminous ink that reveals erased treaty clauses by moonlight.',
        notes: 'Often counterfeited during succession disputes.',
        tags: ['magic', 'contracts'],
        status: 'deprecated',
        fields: {
          category: 'Material magic',
          source: 'Inkbound manuals',
          implications: 'Old contracts can become politically dangerous again.',
        },
      }),
    ],
    timeline: [
      entry({
        id: 'timeline-moonspire-accord',
        kind: 'timeline',
        name: 'Moonspire Accord',
        summary: 'The coastal houses accept a shared navigation code.',
        tags: ['accord', 'navigation'],
        status: 'canon',
        fields: {
          order: '20',
          dateLabel: 'Third tide of Brightfall',
          era: 'Treaty Era',
          consequences: 'The Inkbound Cartel gains legal control over maps.',
        },
      }),
      entry({
        id: 'timeline-ashroad-collapse',
        kind: 'timeline',
        name: 'Ashroad Collapse',
        summary: 'The old volcanic road becomes impassable.',
        tags: ['disaster', 'roads'],
        status: 'needs-review',
        fields: {
          order: '10',
          dateLabel: 'Late Emberwane',
          era: 'Treaty Era',
          consequences: 'Moonspire Port becomes the safest coastal route.',
        },
      }),
    ],
    artifacts: [
      entry({
        id: 'artifact-mirror-compass',
        kind: 'artifact',
        name: 'Mirror Compass',
        summary: 'A silver compass that points toward broken oaths.',
        tags: ['artifact', 'navigation'],
        status: 'canon',
        fields: {
          origin: 'Moonspire observatory',
          power: 'Finds treaty sites where promises were broken.',
          keeper: 'Elyra Vale',
        },
      }),
    ],
  } as WorldCodex;
}

function createSecondaryCodex(): WorldCodex {
  return {
    characters: [
      entry({
        id: 'character-lio-renn',
        kind: 'character',
        name: 'Lio Renn',
        summary: 'A river pilot documenting flood myths.',
        tags: ['pilot'],
        fields: {
          characterCategory: 'Humanoid person',
          narrativeRole: 'River pilot',
          ancestry: 'Human',
          profession: 'Pilot',
          homePlace: 'Reedwake',
          affiliations: 'Tidecallers',
          currentStatus: 'Collecting oral histories',
        },
      }),
    ],
    places: [
      entry({
        id: 'place-reedwake',
        kind: 'place',
        name: 'Reedwake',
        summary: 'A reed-built town that moves with flood season.',
        tags: ['river', 'town'],
        fields: {
          category: 'Town',
          region: 'Lowriver',
          climate: 'Humid floodplain',
          significance: 'Keeps the oldest flood calendars.',
        },
      }),
    ],
    factions: [],
    lore: [],
    timeline: [],
  } as WorldCodex;
}

function createActiveWorkspace(): WorldWorkspace {
  return {
    id: 'workspace-parity-atlas',
    name: 'Parity Atlas',
    summary: 'A fixture workspace covering shared web and mobile parity.',
    defaultEra: 'Treaty Era',
    status: 'active',
    planetaryWorlds: [
      planetaryWorld({
        id: 'planetary-world-aurelia',
        name: 'Aurelia',
      }),
      planetaryWorld({
        id: 'planetary-world-veil-moon',
        name: 'Veil Moon',
        status: 'archived',
      }),
    ],
    entryTypes: paritySections.map((section) => ({ ...section })),
    schema: cloneWorkspaceSchema(),
    codex: createActiveCodex(),
    relationships: [
      relationship({
        id: 'relationship-elyra-moonspire',
        sourceEntryId: 'character-elyra-vale',
        targetEntryId: 'place-moonspire-port',
        type: 'located in',
        directional: true,
        note: 'Elyra keeps her treaty office inside the harbor archive.',
        status: 'canon',
      }),
      relationship({
        id: 'relationship-elyra-inkbound',
        sourceEntryId: 'character-elyra-vale',
        targetEntryId: 'faction-inkbound-cartel',
        type: 'member of',
        directional: true,
        note: 'Her seal is recognized by senior notaries.',
        status: 'needs-review',
      }),
      relationship({
        id: 'relationship-accord-moonspire',
        sourceEntryId: 'timeline-moonspire-accord',
        targetEntryId: 'place-moonspire-port',
        type: 'affected by',
        directional: true,
        note: 'The accord made the port unavoidable for chartered travel.',
        status: 'canon',
      }),
      relationship({
        id: 'relationship-compass-elyra',
        sourceEntryId: 'artifact-mirror-compass',
        targetEntryId: 'character-elyra-vale',
        type: 'carried by',
        directional: true,
        note: '',
        status: 'deprecated',
      }),
    ],
    createdAt,
    updatedAt: '2026-06-20T18:00:00.000Z',
  };
}

function createSecondaryWorkspace(): WorldWorkspace {
  return {
    id: 'workspace-river-appendix',
    name: 'River Appendix',
    summary: 'A second workspace to verify full-document exports.',
    defaultEra: 'Flood Era',
    status: 'archived',
    planetaryWorlds: [
      planetaryWorld({
        id: 'planetary-world-maruun',
        name: 'Maruun',
      }),
    ],
    entryTypes: worldSections.map((section) => ({ ...section })),
    schema: cloneWorkspaceSchema(),
    codex: createSecondaryCodex(),
    relationships: [
      relationship({
        id: 'relationship-lio-reedwake',
        sourceEntryId: 'character-lio-renn',
        targetEntryId: 'place-reedwake',
        type: 'located in',
        directional: true,
        note: 'Lio pilots from Reedwake during flood season.',
        status: 'draft',
      }),
    ],
    createdAt,
    updatedAt: '2026-06-18T09:00:00.000Z',
  };
}

export function createFrontendParityWorldDocument(): WorldDocument {
  const activeWorkspace = createActiveWorkspace();
  const secondaryWorkspace = createSecondaryWorkspace();
  return {
    schemaVersion: CURRENT_WORLD_SCHEMA_VERSION,
    activeWorldId: activeWorkspace.id,
    worlds: [activeWorkspace, secondaryWorkspace],
    assets: [],
    savedAt,
  };
}

export function getFrontendParityFixtureDocument(): WorldDocument {
  return createFrontendParityWorldDocument();
}

export const frontendParityForbiddenDiagnosticContent = [
  'Parity Atlas',
  'River Appendix',
  'Elyra Vale',
  'Moonspire Port',
  'Mirror Compass',
  'Veil Moon',
  'Aurelia',
  'treaty office',
  'broken oaths',
  'harbor',
  'relationship-elyra-moonspire',
  'character-elyra-vale',
] as const;

export function getFrontendParityActiveWorld(): WorldWorkspace {
  return getActiveWorld(createFrontendParityWorldDocument());
}
