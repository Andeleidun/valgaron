import type { WorldDetailField, WorldSectionConfig } from './types';

export const supportedPlaceCategoryOptions: readonly string[] = [
  'World',
  'Planet',
  'Moon',
  'Continent',
  'Country',
  'Province',
  'Region',
  'Kingdom',
  'City',
  'Town',
  'Village',
  'Hamlet',
  'Capital',
  'Harbor',
  'Port',
  'Fortress',
  'Castle',
  'Temple',
  'Ruin',
  'Road',
  'Pass',
  'Forest',
  'Jungle',
  'Desert',
  'Swamp',
  'Wetland',
  'Plains',
  'Steppe',
  'Tundra',
  'Mountain',
  'Mountain range',
  'Valley',
  'Canyon',
  'Plateau',
  'Volcano',
  'Glacier',
  'River',
  'Lake',
  'Ocean',
  'Sea',
  'Coast',
  'Bay',
  'Gulf',
  'Island',
  'Peninsula',
  'Archipelago',
  'Cave',
  'Mine',
  'Realm',
  'Plane',
  'Dimension',
  'Star',
  'Solar system',
  'Galaxy',
  'Nebula',
  'Asteroid belt',
  'Space station',
];

type DraftLike = {
  details: Record<string, string>;
};

type EntryLike = {
  fields: Record<string, string>;
};

export type HiddenPlaceDetailValue = {
  key: string;
  label: string;
  value: string;
};

export type PlaceRelationshipFieldConfig = {
  fieldKey: string;
  label: string;
  relationshipType: string;
  directional: boolean;
  cardinality: 'one' | 'many';
  currentEntryRole: 'source' | 'target';
  targetEntryKinds: readonly string[];
  targetPlaceCategories?: readonly string[];
};

type PlaceFieldProfileId =
  | 'political'
  | 'settlement'
  | 'maritimeSettlement'
  | 'built'
  | 'route'
  | 'natural'
  | 'mountain'
  | 'water'
  | 'island'
  | 'cosmic'
  | 'otherworldly';

export type PlaceRelationshipGroupId =
  | 'location'
  | 'contents'
  | 'power'
  | 'routes'
  | 'people'
  | 'eventsLore'
  | 'origins'
  | 'other';

export const placeRelationshipTypeOptions: readonly string[] = [
  'located in',
  'contains',
  'capital of',
  'has capital',
  'administers',
  'administered by',
  'controls',
  'controlled by',
  'claimed by',
  'claims',
  'bordered by',
  'connected to',
  'route between',
  'flows through',
  'flows into',
  'receives flow from',
  'part of',
  'has part',
  'site of',
  'occurred at',
  'home of',
  'home',
  'founded by',
  'founded',
  'built by',
  'created by',
  'references',
  'referenced by',
];

export const placeRelationshipFieldConfigs: readonly PlaceRelationshipFieldConfig[] =
  [
    {
      fieldKey: 'parentPlace',
      label: 'Located in',
      relationshipType: 'located in',
      directional: true,
      cardinality: 'one',
      currentEntryRole: 'source',
      targetEntryKinds: ['place'],
    },
    {
      fieldKey: 'capital',
      label: 'Capital',
      relationshipType: 'has capital',
      directional: true,
      cardinality: 'one',
      currentEntryRole: 'source',
      targetEntryKinds: ['place'],
      targetPlaceCategories: ['Capital', 'City', 'Town', 'Fortress', 'Castle'],
    },
    {
      fieldKey: 'settlements',
      label: 'Settlements',
      relationshipType: 'contains',
      directional: true,
      cardinality: 'many',
      currentEntryRole: 'source',
      targetEntryKinds: ['place'],
      targetPlaceCategories: [
        'Capital',
        'City',
        'Town',
        'Village',
        'Hamlet',
        'Harbor',
        'Port',
      ],
    },
    {
      fieldKey: 'childPlaces',
      label: 'Contains',
      relationshipType: 'contains',
      directional: true,
      cardinality: 'many',
      currentEntryRole: 'source',
      targetEntryKinds: ['place'],
    },
    {
      fieldKey: 'regions',
      label: 'Subregions',
      relationshipType: 'contains',
      directional: true,
      cardinality: 'many',
      currentEntryRole: 'source',
      targetEntryKinds: ['place'],
      targetPlaceCategories: [
        'Continent',
        'Country',
        'Province',
        'Region',
        'Kingdom',
        'Forest',
        'Desert',
        'Swamp',
        'Wetland',
        'Plains',
        'Steppe',
        'Tundra',
        'Mountain range',
        'Valley',
        'Plateau',
        'Coast',
      ],
    },
    {
      fieldKey: 'districts',
      label: 'Districts or local areas',
      relationshipType: 'contains',
      directional: true,
      cardinality: 'many',
      currentEntryRole: 'source',
      targetEntryKinds: ['place'],
      targetPlaceCategories: [
        'Region',
        'Harbor',
        'Port',
        'Temple',
        'Castle',
        'Fortress',
        'Road',
        'Ruin',
        'Mine',
      ],
    },
    {
      fieldKey: 'landmarks',
      label: 'Landmarks',
      relationshipType: 'contains',
      directional: true,
      cardinality: 'many',
      currentEntryRole: 'source',
      targetEntryKinds: ['place'],
      targetPlaceCategories: [
        'Temple',
        'Ruin',
        'Fortress',
        'Castle',
        'Mountain',
        'Volcano',
        'Glacier',
        'Lake',
        'River',
        'Cave',
        'Mine',
        'Space station',
      ],
    },
    {
      fieldKey: 'waters',
      label: 'Waters',
      relationshipType: 'contains',
      directional: true,
      cardinality: 'many',
      currentEntryRole: 'source',
      targetEntryKinds: ['place'],
      targetPlaceCategories: [
        'River',
        'Lake',
        'Ocean',
        'Sea',
        'Bay',
        'Gulf',
        'Coast',
        'Swamp',
        'Wetland',
        'Glacier',
      ],
    },
    {
      fieldKey: 'neighbors',
      label: 'Neighbors or borders',
      relationshipType: 'bordered by',
      directional: false,
      cardinality: 'many',
      currentEntryRole: 'source',
      targetEntryKinds: ['place'],
    },
    {
      fieldKey: 'routeConnections',
      label: 'Connected routes',
      relationshipType: 'connected to',
      directional: false,
      cardinality: 'many',
      currentEntryRole: 'source',
      targetEntryKinds: ['place'],
      targetPlaceCategories: [
        'Road',
        'Pass',
        'River',
        'Sea',
        'Ocean',
        'Bay',
        'Gulf',
        'Coast',
        'Harbor',
        'Port',
        'Space station',
        'Asteroid belt',
      ],
    },
    {
      fieldKey: 'tradePartners',
      label: 'Trade partners',
      relationshipType: 'connected to',
      directional: false,
      cardinality: 'many',
      currentEntryRole: 'source',
      targetEntryKinds: ['place', 'faction'],
    },
    {
      fieldKey: 'controllingPowers',
      label: 'Controlled by',
      relationshipType: 'controlled by',
      directional: true,
      cardinality: 'many',
      currentEntryRole: 'source',
      targetEntryKinds: ['faction', 'character', 'place'],
    },
    {
      fieldKey: 'claimants',
      label: 'Claimed by',
      relationshipType: 'claimed by',
      directional: true,
      cardinality: 'many',
      currentEntryRole: 'source',
      targetEntryKinds: ['faction', 'character', 'place'],
    },
    {
      fieldKey: 'inhabitants',
      label: 'Inhabitants',
      relationshipType: 'home of',
      directional: true,
      cardinality: 'many',
      currentEntryRole: 'source',
      targetEntryKinds: ['character', 'faction'],
    },
    {
      fieldKey: 'founders',
      label: 'Founded by',
      relationshipType: 'founded by',
      directional: true,
      cardinality: 'many',
      currentEntryRole: 'source',
      targetEntryKinds: ['character', 'faction', 'place', 'timeline'],
    },
    {
      fieldKey: 'builders',
      label: 'Built by',
      relationshipType: 'built by',
      directional: true,
      cardinality: 'many',
      currentEntryRole: 'source',
      targetEntryKinds: ['character', 'faction', 'place', 'timeline'],
    },
    {
      fieldKey: 'notableEvents',
      label: 'Notable events',
      relationshipType: 'site of',
      directional: true,
      cardinality: 'many',
      currentEntryRole: 'source',
      targetEntryKinds: ['timeline'],
    },
    {
      fieldKey: 'relatedLore',
      label: 'Related lore',
      relationshipType: 'references',
      directional: true,
      cardinality: 'many',
      currentEntryRole: 'source',
      targetEntryKinds: ['lore'],
    },
    {
      fieldKey: 'source',
      label: 'Source or origin',
      relationshipType: 'flows into',
      directional: true,
      cardinality: 'one',
      currentEntryRole: 'target',
      targetEntryKinds: ['place'],
      targetPlaceCategories: [
        'River',
        'Lake',
        'Mountain',
        'Mountain range',
        'Valley',
        'Cave',
        'Glacier',
        'Swamp',
        'Wetland',
        'Forest',
        'Jungle',
        'Plateau',
        'Volcano',
      ],
    },
    {
      fieldKey: 'mouth',
      label: 'Mouth or terminus',
      relationshipType: 'flows into',
      directional: true,
      cardinality: 'one',
      currentEntryRole: 'source',
      targetEntryKinds: ['place'],
      targetPlaceCategories: [
        'River',
        'Lake',
        'Sea',
        'Ocean',
        'Bay',
        'Gulf',
        'Swamp',
        'Wetland',
        'Valley',
      ],
    },
    {
      fieldKey: 'tributaries',
      label: 'Tributaries or feeders',
      relationshipType: 'flows into',
      directional: true,
      cardinality: 'many',
      currentEntryRole: 'target',
      targetEntryKinds: ['place'],
      targetPlaceCategories: ['River', 'Lake', 'Glacier', 'Swamp', 'Wetland'],
    },
  ];

const placeSharedFieldKeys = [
  'category',
  'region',
  'climate',
  'significance',
] as const;

const placeFieldDefinitions: Record<string, WorldDetailField> = {
  category: {
    key: 'category',
    label: 'Place category',
    autocompleteOptions: supportedPlaceCategoryOptions,
  },
  region: { key: 'region', label: 'Region' },
  climate: { key: 'climate', label: 'Climate' },
  significance: {
    key: 'significance',
    label: 'Significance',
    multiline: true,
  },
  alternateNames: { key: 'alternateNames', label: 'Alternate names' },
  parentPlace: { key: 'parentPlace', label: 'Located in' },
  childPlaces: { key: 'childPlaces', label: 'Contains', multiline: true },
  capital: { key: 'capital', label: 'Capital' },
  settlements: { key: 'settlements', label: 'Settlements', multiline: true },
  districts: {
    key: 'districts',
    label: 'Districts or local areas',
    multiline: true,
  },
  regions: { key: 'regions', label: 'Subregions', multiline: true },
  neighbors: {
    key: 'neighbors',
    label: 'Neighbors or borders',
    multiline: true,
  },
  routeConnections: {
    key: 'routeConnections',
    label: 'Connected routes',
    multiline: true,
  },
  tradePartners: {
    key: 'tradePartners',
    label: 'Trade partners',
    multiline: true,
  },
  controllingPowers: {
    key: 'controllingPowers',
    label: 'Controlled by',
    multiline: true,
  },
  claimants: { key: 'claimants', label: 'Claimed by', multiline: true },
  inhabitants: { key: 'inhabitants', label: 'Inhabitants', multiline: true },
  founders: { key: 'founders', label: 'Founded by', multiline: true },
  builders: { key: 'builders', label: 'Built by', multiline: true },
  notableEvents: {
    key: 'notableEvents',
    label: 'Notable events',
    multiline: true,
  },
  relatedLore: { key: 'relatedLore', label: 'Related lore', multiline: true },
  scale: { key: 'scale', label: 'Scale' },
  area: { key: 'area', label: 'Area' },
  population: { key: 'population', label: 'Population' },
  demographics: { key: 'demographics', label: 'Demographics', multiline: true },
  government: { key: 'government', label: 'Government', multiline: true },
  economy: { key: 'economy', label: 'Economy', multiline: true },
  defenses: { key: 'defenses', label: 'Defenses', multiline: true },
  infrastructure: {
    key: 'infrastructure',
    label: 'Infrastructure',
    multiline: true,
  },
  terrain: { key: 'terrain', label: 'Terrain', multiline: true },
  resources: { key: 'resources', label: 'Resources', multiline: true },
  hazards: { key: 'hazards', label: 'Hazards', multiline: true },
  access: { key: 'access', label: 'Access', multiline: true },
  travelTime: { key: 'travelTime', label: 'Travel time' },
  strategicValue: {
    key: 'strategicValue',
    label: 'Strategic value',
    multiline: true,
  },
  history: { key: 'history', label: 'History', multiline: true },
  currentTension: {
    key: 'currentTension',
    label: 'Current tension',
    multiline: true,
  },
  secrets: { key: 'secrets', label: 'Secrets', multiline: true },
  sensoryDetails: {
    key: 'sensoryDetails',
    label: 'Sensory details',
    multiline: true,
  },
  landmarks: { key: 'landmarks', label: 'Landmarks', multiline: true },
  waters: { key: 'waters', label: 'Waters', multiline: true },
  source: { key: 'source', label: 'Source or origin' },
  mouth: { key: 'mouth', label: 'Mouth or terminus' },
  tributaries: {
    key: 'tributaries',
    label: 'Tributaries or feeders',
    multiline: true,
  },
  floraFauna: {
    key: 'floraFauna',
    label: 'Flora and fauna',
    multiline: true,
  },
  magicOrTechnology: {
    key: 'magicOrTechnology',
    label: 'Magic or technology',
    multiline: true,
  },
  condition: { key: 'condition', label: 'Condition' },
  function: { key: 'function', label: 'Function', multiline: true },
};

const profileFieldKeys: Record<PlaceFieldProfileId, readonly string[]> = {
  political: [
    'alternateNames',
    'parentPlace',
    'capital',
    'settlements',
    'regions',
    'neighbors',
    'tradePartners',
    'controllingPowers',
    'claimants',
    'inhabitants',
    'founders',
    'population',
    'demographics',
    'government',
    'economy',
    'defenses',
    'infrastructure',
    'notableEvents',
    'relatedLore',
  ],
  settlement: [
    'alternateNames',
    'parentPlace',
    'districts',
    'routeConnections',
    'tradePartners',
    'controllingPowers',
    'claimants',
    'inhabitants',
    'founders',
    'population',
    'demographics',
    'government',
    'economy',
    'defenses',
    'infrastructure',
    'landmarks',
    'waters',
    'notableEvents',
    'relatedLore',
  ],
  maritimeSettlement: [
    'alternateNames',
    'parentPlace',
    'waters',
    'routeConnections',
    'tradePartners',
    'controllingPowers',
    'claimants',
    'inhabitants',
    'population',
    'economy',
    'defenses',
    'infrastructure',
    'access',
    'hazards',
    'notableEvents',
    'relatedLore',
  ],
  built: [
    'alternateNames',
    'parentPlace',
    'routeConnections',
    'controllingPowers',
    'claimants',
    'inhabitants',
    'builders',
    'function',
    'condition',
    'defenses',
    'infrastructure',
    'access',
    'landmarks',
    'notableEvents',
    'relatedLore',
  ],
  route: [
    'alternateNames',
    'parentPlace',
    'routeConnections',
    'controllingPowers',
    'hazards',
    'access',
    'travelTime',
    'strategicValue',
    'source',
    'mouth',
    'settlements',
    'landmarks',
    'notableEvents',
    'relatedLore',
  ],
  natural: [
    'alternateNames',
    'parentPlace',
    'regions',
    'neighbors',
    'routeConnections',
    'terrain',
    'resources',
    'hazards',
    'access',
    'travelTime',
    'floraFauna',
    'waters',
    'landmarks',
    'settlements',
    'notableEvents',
    'relatedLore',
  ],
  mountain: [
    'alternateNames',
    'parentPlace',
    'childPlaces',
    'neighbors',
    'routeConnections',
    'terrain',
    'resources',
    'hazards',
    'access',
    'travelTime',
    'waters',
    'landmarks',
    'settlements',
    'notableEvents',
    'relatedLore',
  ],
  water: [
    'alternateNames',
    'parentPlace',
    'neighbors',
    'routeConnections',
    'terrain',
    'resources',
    'hazards',
    'access',
    'source',
    'mouth',
    'tributaries',
    'waters',
    'settlements',
    'landmarks',
    'notableEvents',
    'relatedLore',
  ],
  island: [
    'alternateNames',
    'parentPlace',
    'waters',
    'routeConnections',
    'settlements',
    'landmarks',
    'controllingPowers',
    'claimants',
    'population',
    'demographics',
    'economy',
    'resources',
    'hazards',
    'access',
    'notableEvents',
    'relatedLore',
  ],
  cosmic: [
    'alternateNames',
    'parentPlace',
    'childPlaces',
    'neighbors',
    'routeConnections',
    'controllingPowers',
    'claimants',
    'inhabitants',
    'scale',
    'terrain',
    'resources',
    'hazards',
    'access',
    'magicOrTechnology',
    'notableEvents',
    'relatedLore',
  ],
  otherworldly: [
    'alternateNames',
    'parentPlace',
    'childPlaces',
    'neighbors',
    'routeConnections',
    'controllingPowers',
    'claimants',
    'inhabitants',
    'scale',
    'terrain',
    'hazards',
    'access',
    'magicOrTechnology',
    'notableEvents',
    'relatedLore',
  ],
};

const categoryProfiles: Record<string, readonly PlaceFieldProfileId[]> = {
  World: ['cosmic', 'political'],
  Planet: ['cosmic', 'political'],
  Moon: ['cosmic', 'natural'],
  Continent: ['natural', 'political'],
  Country: ['political', 'natural'],
  Province: ['political', 'natural'],
  Region: ['political', 'natural'],
  Kingdom: ['political', 'natural'],
  City: ['settlement'],
  Town: ['settlement'],
  Village: ['settlement'],
  Hamlet: ['settlement'],
  Capital: ['settlement', 'political'],
  Harbor: ['maritimeSettlement'],
  Port: ['maritimeSettlement', 'route'],
  Fortress: ['built', 'route'],
  Castle: ['built', 'settlement'],
  Temple: ['built'],
  Ruin: ['built', 'natural'],
  Road: ['route', 'built'],
  Pass: ['route', 'natural'],
  Forest: ['natural'],
  Jungle: ['natural'],
  Desert: ['natural', 'route'],
  Swamp: ['natural', 'water'],
  Wetland: ['natural', 'water'],
  Plains: ['natural', 'political'],
  Steppe: ['natural', 'political'],
  Tundra: ['natural'],
  Mountain: ['mountain'],
  'Mountain range': ['mountain'],
  Valley: ['natural', 'route'],
  Canyon: ['natural', 'route'],
  Plateau: ['natural', 'political'],
  Volcano: ['mountain', 'built'],
  Glacier: ['water', 'natural'],
  River: ['water', 'route'],
  Lake: ['water', 'natural'],
  Ocean: ['water', 'natural'],
  Sea: ['water', 'natural'],
  Coast: ['water', 'natural', 'political'],
  Bay: ['water', 'natural'],
  Gulf: ['water', 'natural', 'political'],
  Island: ['island'],
  Peninsula: ['island', 'route'],
  Archipelago: ['island', 'water'],
  Cave: ['natural', 'built', 'route'],
  Mine: ['built', 'natural'],
  Realm: ['otherworldly', 'political'],
  Plane: ['otherworldly', 'political'],
  Dimension: ['otherworldly'],
  Star: ['cosmic'],
  'Solar system': ['cosmic'],
  Galaxy: ['cosmic'],
  Nebula: ['cosmic', 'natural'],
  'Asteroid belt': ['cosmic', 'natural'],
  'Space station': ['cosmic', 'built', 'settlement'],
};

const settlementCategories = new Set([
  'Capital',
  'City',
  'Town',
  'Village',
  'Hamlet',
  'Harbor',
  'Port',
]);

const politicalCategories = new Set([
  'Country',
  'Kingdom',
  'Province',
  'Region',
  'Realm',
  'World',
  'Planet',
  'Continent',
]);

const waterCategories = new Set([
  'River',
  'Lake',
  'Ocean',
  'Sea',
  'Coast',
  'Bay',
  'Gulf',
  'Swamp',
  'Wetland',
  'Glacier',
  'Archipelago',
]);

const routeCategories = new Set(['Road', 'Pass', 'Port', 'Harbor']);

const builtCategories = new Set([
  'Fortress',
  'Castle',
  'Temple',
  'Ruin',
  'Mine',
  'Space station',
]);

const cosmicCategories = new Set([
  'World',
  'Planet',
  'Moon',
  'Star',
  'Solar system',
  'Galaxy',
  'Nebula',
  'Asteroid belt',
  'Space station',
]);

const otherworldlyCategories = new Set(['Realm', 'Plane', 'Dimension']);

function uniqueFieldKeys(keys: readonly string[]): string[] {
  return Array.from(new Set(keys));
}

function fieldsFromKeys(keys: readonly string[]): WorldDetailField[] {
  return uniqueFieldKeys(keys).map((key) => placeFieldDefinitions[key]);
}

function formatUnknownFieldLabel(key: string): string {
  return key
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^./, (firstLetter) => firstLetter.toUpperCase());
}

export function getPlaceCategoryFromFields(
  fields: Readonly<Record<string, string>>
): string {
  return fields.category?.trim() ?? '';
}

export function getPlaceDetailFields(category: string): WorldDetailField[] {
  const profiles = categoryProfiles[category.trim()] ?? [];
  return fieldsFromKeys([
    ...placeSharedFieldKeys,
    ...profiles.flatMap((profile) => profileFieldKeys[profile]),
  ]);
}

export function getEntryDetailFields(
  section: WorldSectionConfig,
  entry?: EntryLike
): WorldDetailField[] {
  if (section.kind !== 'place') {
    return [...section.detailFields];
  }
  return getPlaceDetailFields(
    entry ? getPlaceCategoryFromFields(entry.fields) : ''
  );
}

export function getDraftDetailFields(
  section: WorldSectionConfig,
  draft?: DraftLike
): WorldDetailField[] {
  if (section.kind !== 'place') {
    return [...section.detailFields];
  }
  return getPlaceDetailFields(
    draft ? getPlaceCategoryFromFields(draft.details) : ''
  );
}

export function getHiddenPlaceDetailValues(
  section: WorldSectionConfig,
  fields: Readonly<Record<string, string>>
): HiddenPlaceDetailValue[] {
  if (section.kind !== 'place') {
    return [];
  }
  const visibleFieldKeys = new Set(
    getPlaceDetailFields(getPlaceCategoryFromFields(fields)).map(
      (field) => field.key
    )
  );
  return Object.entries(fields)
    .filter(([key, value]) => !visibleFieldKeys.has(key) && value.trim())
    .map(([key, value]) => ({
      key,
      label: placeFieldDefinitions[key]?.label ?? formatUnknownFieldLabel(key),
      value,
    }))
    .sort((first, second) => first.label.localeCompare(second.label));
}

export function getPlaceCategoryProfileIds(
  category: string
): readonly PlaceFieldProfileId[] {
  return categoryProfiles[category.trim()] ?? [];
}

export function getPlaceRelationshipGroupLabel(
  category: string,
  groupId: PlaceRelationshipGroupId
): string {
  const normalizedCategory = category.trim();
  if (groupId === 'contents') {
    if (politicalCategories.has(normalizedCategory)) {
      return 'Settlements and regions';
    }
    if (settlementCategories.has(normalizedCategory)) {
      return 'Districts and local places';
    }
    if (cosmicCategories.has(normalizedCategory)) {
      return 'Contained celestial places';
    }
    if (otherworldlyCategories.has(normalizedCategory)) {
      return 'Contained realms and domains';
    }
    return 'Contained places';
  }
  if (groupId === 'routes') {
    if (waterCategories.has(normalizedCategory)) {
      return 'Water and route links';
    }
    if (routeCategories.has(normalizedCategory)) {
      return 'Endpoints and route links';
    }
    return 'Borders, routes, and flows';
  }
  if (groupId === 'power') {
    return 'Control and claims';
  }
  if (groupId === 'people') {
    if (settlementCategories.has(normalizedCategory)) {
      return 'Residents and local groups';
    }
    return 'People and groups';
  }
  if (groupId === 'eventsLore') {
    return 'Events and lore';
  }
  if (groupId === 'origins') {
    return builtCategories.has(normalizedCategory)
      ? 'Builders and origins'
      : 'Founding and origins';
  }
  if (groupId === 'location') {
    return 'Location and parent places';
  }
  return 'Other links';
}
