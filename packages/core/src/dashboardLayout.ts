export type DashboardPageId =
  | 'overview'
  | 'workbench'
  | 'timeline'
  | 'links'
  | 'knowledge'
  | 'data'
  | 'workspaces'
  | 'help'
  | 'utilities';

export type DashboardCardSize = 'compact' | 'standard' | 'wide' | 'full';

export type DashboardVisibleRegion = 'primary' | 'supporting' | 'full';

export type DashboardCardRegion = DashboardVisibleRegion | 'shelf';

export type DashboardViewportClass = 'compact' | 'standard' | 'wide';

export type DashboardCardPreference = {
  region: DashboardCardRegion;
  size: DashboardCardSize;
  order: number;
  collapsed: boolean;
};

export type DashboardPagePreference = {
  pageId: DashboardPageId;
  presetId: string;
  cards: Record<string, DashboardCardPreference>;
};

export type DashboardPreferenceDocument = {
  version: 1;
  pages: Partial<Record<DashboardPageId, DashboardPagePreference>>;
  updatedAt: string;
};

export type DashboardCardDefinition = {
  id: string;
  pageId: DashboardPageId;
  title: string;
  defaultRegion: DashboardVisibleRegion;
  defaultSize: DashboardCardSize;
  allowedRegions: readonly DashboardVisibleRegion[];
  allowedSizes: readonly DashboardCardSize[];
  collapsible: boolean;
  focusable: boolean;
  movable: boolean;
  lockedOrder?: boolean;
  responsivePriority: number;
};

export type DashboardPreset = {
  id: string;
  label: string;
  cards: Partial<Record<string, Partial<DashboardCardPreference>>>;
};

export type NormalizedDashboardCard = DashboardCardPreference & {
  id: string;
  title: string;
  isForcedVisible: boolean;
};

export type NormalizedDashboardLayout = {
  pageId: DashboardPageId;
  presetId: string;
  cards: readonly NormalizedDashboardCard[];
};

export type DashboardLayoutHistory = {
  present: DashboardPagePreference;
  past: readonly DashboardPagePreference[];
  future: readonly DashboardPagePreference[];
};

export type DashboardLayoutAction =
  | { type: 'apply-preset'; preference: DashboardPagePreference }
  | {
      type: 'move-card';
      cardId: string;
      region: DashboardVisibleRegion;
      order: number;
    }
  | { type: 'resize-card'; cardId: string; size: DashboardCardSize }
  | { type: 'collapse-card'; cardId: string }
  | { type: 'restore-card'; cardId: string }
  | {
      type: 'reset-card';
      cardId: string;
      preference: DashboardCardPreference;
    }
  | { type: 'focus-card'; cardId: string }
  | { type: 'reset-page'; preference: DashboardPagePreference }
  | { type: 'undo' }
  | { type: 'redo' };

const pageIds: readonly DashboardPageId[] = [
  'overview',
  'workbench',
  'timeline',
  'links',
  'knowledge',
  'data',
  'workspaces',
  'help',
  'utilities',
];

const sizes: readonly DashboardCardSize[] = [
  'compact',
  'standard',
  'wide',
  'full',
];

const regions: readonly DashboardCardRegion[] = [
  'primary',
  'supporting',
  'full',
  'shelf',
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function isPageId(value: unknown): value is DashboardPageId {
  return (
    typeof value === 'string' && pageIds.includes(value as DashboardPageId)
  );
}

function isSize(value: unknown): value is DashboardCardSize {
  return (
    typeof value === 'string' && sizes.includes(value as DashboardCardSize)
  );
}

function isRegion(value: unknown): value is DashboardCardRegion {
  return (
    typeof value === 'string' && regions.includes(value as DashboardCardRegion)
  );
}

function finiteOrder(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0
    ? Math.floor(value)
    : fallback;
}

export function getDashboardViewportClass(
  containerWidth: number
): DashboardViewportClass {
  if (containerWidth < 960) {
    return 'compact';
  }
  if (containerWidth < 1280) {
    return 'standard';
  }
  return 'wide';
}

export function createDashboardPagePreference({
  pageId,
  preset,
  definitions,
}: {
  pageId: DashboardPageId;
  preset: DashboardPreset;
  definitions: readonly DashboardCardDefinition[];
}): DashboardPagePreference {
  const cards: Record<string, DashboardCardPreference> = {};
  definitions
    .filter((definition) => definition.pageId === pageId)
    .forEach((definition, index) => {
      const presetCard = preset.cards[definition.id];
      cards[definition.id] = {
        region: presetCard?.region ?? definition.defaultRegion,
        size: presetCard?.size ?? definition.defaultSize,
        order: presetCard?.order ?? index,
        collapsed: presetCard?.collapsed ?? false,
      };
    });
  return { pageId, presetId: preset.id, cards };
}

/** Merge a persisted preference with the current registry and recommendation. */
export function mergeDashboardPagePreference({
  preference,
  preset,
  definitions,
}: {
  preference: DashboardPagePreference;
  preset: DashboardPreset;
  definitions: readonly DashboardCardDefinition[];
}): DashboardPagePreference {
  const defaults = createDashboardPagePreference({
    pageId: preference.pageId,
    preset,
    definitions,
  });
  const validIds = new Set(
    definitions
      .filter((definition) => definition.pageId === preference.pageId)
      .map((definition) => definition.id)
  );
  return {
    ...defaults,
    presetId: preset.id,
    cards: Object.fromEntries(
      Object.entries(defaults.cards).map(([cardId, fallback]) => [
        cardId,
        validIds.has(cardId)
          ? { ...fallback, ...(preference.cards[cardId] ?? {}) }
          : fallback,
      ])
    ),
  };
}

function clampCardPreference({
  definition,
  preference,
  fallback,
}: {
  definition: DashboardCardDefinition;
  preference: DashboardCardPreference;
  fallback: DashboardCardPreference;
}): DashboardCardPreference {
  const requestedRegion =
    preference.region === 'shelf' ? fallback.region : preference.region;
  const region = definition.allowedRegions.includes(
    requestedRegion as DashboardVisibleRegion
  )
    ? requestedRegion
    : fallback.region;
  return {
    region,
    size: definition.allowedSizes.includes(preference.size)
      ? preference.size
      : fallback.size,
    order: finiteOrder(preference.order, fallback.order),
    collapsed: definition.collapsible ? preference.collapsed : false,
  };
}

function normalizeForViewport(
  card: DashboardCardPreference,
  viewport: DashboardViewportClass,
  pageId: DashboardPageId
): DashboardCardPreference {
  if (viewport === 'compact') {
    return {
      ...card,
      region: card.collapsed ? 'shelf' : 'full',
      size: 'full',
    };
  }
  if (viewport === 'standard') {
    return {
      ...card,
      size:
        pageId === 'timeline' ||
        pageId === 'knowledge' ||
        pageId === 'utilities' ||
        card.size === 'wide'
          ? 'full'
          : card.size,
    };
  }
  return card;
}

export function normalizeDashboardLayout({
  pageId,
  definitions,
  preset,
  preference,
  viewport,
  activeCardIds,
  forcedVisibleCardIds = [],
}: {
  pageId: DashboardPageId;
  definitions: readonly DashboardCardDefinition[];
  preset: DashboardPreset;
  preference?: DashboardPagePreference | null;
  viewport: DashboardViewportClass;
  activeCardIds?: readonly string[];
  forcedVisibleCardIds?: readonly string[];
}): NormalizedDashboardLayout {
  const defaults = createDashboardPagePreference({
    pageId,
    preset,
    definitions,
  });
  const activeSet = activeCardIds ? new Set(activeCardIds) : null;
  const forcedVisibleSet = new Set(forcedVisibleCardIds);
  const pageDefinitions = definitions.filter(
    (definition) =>
      definition.pageId === pageId &&
      (!activeSet || activeSet.has(definition.id))
  );
  const normalized = pageDefinitions.map((definition, index) => {
    const fallback = defaults.cards[definition.id] ?? {
      region: definition.defaultRegion,
      size: definition.defaultSize,
      order: index,
      collapsed: false,
    };
    const candidate = preference?.cards[definition.id] ?? fallback;
    const isForcedVisible = forcedVisibleSet.has(definition.id);
    const clamped = clampCardPreference({
      definition,
      preference: candidate,
      fallback,
    });
    const visible = isForcedVisible
      ? { ...clamped, collapsed: false }
      : clamped;
    const responsive = normalizeForViewport(visible, viewport, pageId);
    return {
      ...responsive,
      region: responsive.collapsed ? 'shelf' : responsive.region,
      id: definition.id,
      title: definition.title,
      isForcedVisible,
    } satisfies NormalizedDashboardCard;
  });

  const locked = normalized.filter(
    (card) =>
      pageDefinitions.find((definition) => definition.id === card.id)
        ?.lockedOrder
  );
  const unlocked = normalized.filter(
    (card) =>
      !pageDefinitions.find((definition) => definition.id === card.id)
        ?.lockedOrder
  );
  const compare = (
    left: NormalizedDashboardCard,
    right: NormalizedDashboardCard
  ) => left.order - right.order || left.id.localeCompare(right.id);
  unlocked.sort(compare);
  locked.sort(compare);
  const cards = [...unlocked, ...locked].map((card, order) => ({
    ...card,
    order,
  }));

  return {
    pageId,
    presetId: preference?.presetId ?? preset.id,
    cards,
  };
}

export function parseDashboardPreferenceDocument(
  value: string | null,
  definitions: readonly DashboardCardDefinition[]
): DashboardPreferenceDocument | null {
  if (!value) {
    return null;
  }
  try {
    const parsed: unknown = JSON.parse(value);
    if (!isRecord(parsed) || parsed.version !== 1 || !isRecord(parsed.pages)) {
      return null;
    }
    const pages: Partial<Record<DashboardPageId, DashboardPagePreference>> = {};
    for (const [pageKey, pageValue] of Object.entries(parsed.pages)) {
      if (
        !isPageId(pageKey) ||
        !isRecord(pageValue) ||
        !isRecord(pageValue.cards)
      ) {
        continue;
      }
      const validIds = new Set(
        definitions
          .filter((definition) => definition.pageId === pageKey)
          .map((definition) => definition.id)
      );
      const cards: Record<string, DashboardCardPreference> = {};
      for (const [cardId, cardValue] of Object.entries(pageValue.cards)) {
        if (!validIds.has(cardId) || !isRecord(cardValue)) {
          continue;
        }
        const region = cardValue.region;
        const size = cardValue.size;
        if (!isRegion(region) || !isSize(size)) {
          continue;
        }
        cards[cardId] = {
          region,
          size,
          order: finiteOrder(cardValue.order, Object.keys(cards).length),
          collapsed: cardValue.collapsed === true,
        };
      }
      pages[pageKey] = {
        pageId: pageKey,
        presetId:
          typeof pageValue.presetId === 'string'
            ? pageValue.presetId
            : 'default',
        cards,
      };
    }
    return {
      version: 1,
      pages,
      updatedAt:
        typeof parsed.updatedAt === 'string'
          ? parsed.updatedAt
          : new Date(0).toISOString(),
    };
  } catch {
    return null;
  }
}

export function createDashboardPreferenceDocument(
  pages: Partial<Record<DashboardPageId, DashboardPagePreference>>,
  updatedAt = new Date().toISOString()
): DashboardPreferenceDocument {
  return { version: 1, pages, updatedAt };
}

export function createDashboardLayoutHistory(
  preference: DashboardPagePreference
): DashboardLayoutHistory {
  return { present: preference, past: [], future: [] };
}

function updateCard(
  preference: DashboardPagePreference,
  cardId: string,
  update: (card: DashboardCardPreference) => DashboardCardPreference
): DashboardPagePreference {
  const card = preference.cards[cardId];
  if (!card) {
    return preference;
  }
  return {
    ...preference,
    cards: { ...preference.cards, [cardId]: update(card) },
  };
}

function applyMutation(
  history: DashboardLayoutHistory,
  next: DashboardPagePreference
): DashboardLayoutHistory {
  if (next === history.present) {
    return history;
  }
  return {
    present: next,
    past: [...history.past, history.present].slice(-20),
    future: [],
  };
}

export function dashboardLayoutReducer(
  history: DashboardLayoutHistory,
  action: DashboardLayoutAction
): DashboardLayoutHistory {
  if (action.type === 'undo') {
    const previous = history.past.at(-1);
    if (!previous) return history;
    return {
      present: previous,
      past: history.past.slice(0, -1),
      future: [history.present, ...history.future].slice(0, 20),
    };
  }
  if (action.type === 'redo') {
    const next = history.future[0];
    if (!next) return history;
    return {
      present: next,
      past: [...history.past, history.present].slice(-20),
      future: history.future.slice(1),
    };
  }
  if (action.type === 'reset-page') {
    return applyMutation(history, action.preference);
  }
  if (action.type === 'apply-preset') {
    return applyMutation(history, action.preference);
  }
  if (action.type === 'move-card') {
    const movingCard = history.present.cards[action.cardId];
    if (!movingCard) return history;
    const remaining = Object.entries(history.present.cards)
      .filter(([cardId]) => cardId !== action.cardId)
      .sort(
        (left, right) =>
          left[1].order - right[1].order || left[0].localeCompare(right[0])
      );
    const targetCards = remaining.filter(
      ([, cardPreference]) => cardPreference.region === action.region
    );
    const insertAt = Math.min(Math.max(0, action.order), targetCards.length);
    const targetCard = targetCards[insertAt];
    const globalInsertAt = targetCard
      ? remaining.indexOf(targetCard)
      : targetCards.length > 0
      ? remaining.indexOf(targetCards.at(-1)!) + 1
      : remaining.length;
    remaining.splice(globalInsertAt, 0, [
      action.cardId,
      { ...movingCard, region: action.region, collapsed: false },
    ]);
    const cards = Object.fromEntries(
      remaining.map(([cardId, cardPreference], order) => [
        cardId,
        { ...cardPreference, order },
      ])
    );
    return applyMutation(history, { ...history.present, cards });
  }
  if (action.type === 'resize-card') {
    return applyMutation(
      history,
      updateCard(history.present, action.cardId, (card) => ({
        ...card,
        size: action.size,
      }))
    );
  }
  if (action.type === 'collapse-card') {
    return applyMutation(
      history,
      updateCard(history.present, action.cardId, (card) => ({
        ...card,
        collapsed: true,
      }))
    );
  }
  if (action.type === 'restore-card') {
    return applyMutation(
      history,
      updateCard(history.present, action.cardId, (card) => ({
        ...card,
        collapsed: false,
      }))
    );
  }
  if (action.type === 'reset-card') {
    return applyMutation(
      history,
      updateCard(history.present, action.cardId, () => action.preference)
    );
  }
  const focused = history.present.cards[action.cardId];
  if (!focused) return history;
  const cards: Record<string, DashboardCardPreference> = Object.fromEntries(
    Object.entries(history.present.cards).map(([cardId, card]) => [
      cardId,
      cardId === action.cardId
        ? {
            ...card,
            region: 'full' as const,
            size: 'full' as const,
            collapsed: false,
          }
        : { ...card, collapsed: true },
    ])
  );
  return applyMutation(history, { ...history.present, cards });
}

function card(
  pageId: DashboardPageId,
  id: string,
  title: string,
  defaultRegion: DashboardVisibleRegion,
  defaultSize: DashboardCardSize,
  options: Partial<DashboardCardDefinition> = {}
): DashboardCardDefinition {
  return {
    id,
    pageId,
    title,
    defaultRegion,
    defaultSize,
    allowedRegions: ['primary', 'supporting', 'full'],
    allowedSizes: ['compact', 'standard', 'wide', 'full'],
    collapsible: true,
    focusable: true,
    movable: true,
    responsivePriority: 50,
    ...options,
  };
}

export const dashboardCardDefinitions = [
  card('overview', 'overview.metrics', 'World totals', 'full', 'full', {
    collapsible: false,
    movable: false,
  }),
  card(
    'overview',
    'overview.quick-create',
    'Quick create',
    'supporting',
    'compact'
  ),
  card('overview', 'overview.search', 'Global search', 'supporting', 'wide'),
  card('overview', 'overview.recent', 'Recent records', 'primary', 'wide'),
  card('overview', 'overview.pinned', 'Pinned records', 'primary', 'compact'),
  card(
    'overview',
    'overview.incomplete',
    'Incomplete drafting',
    'primary',
    'full'
  ),
  card('workbench', 'workbench.records', 'Records', 'supporting', 'standard', {
    allowedSizes: ['standard', 'wide'],
  }),
  card('workbench', 'workbench.editor', 'Editor', 'primary', 'wide', {
    collapsible: false,
    allowedRegions: ['primary', 'full'],
    allowedSizes: ['wide', 'full'],
  }),
  card(
    'workbench',
    'workbench.record-context',
    'Record context',
    'supporting',
    'standard'
  ),
  card('timeline', 'timeline.overview', 'Timeline overview', 'full', 'full', {
    collapsible: false,
  }),
  card(
    'timeline',
    'timeline.filters',
    'Timeline filters',
    'supporting',
    'compact'
  ),
  card('timeline', 'timeline.chronology', 'Chronology', 'primary', 'wide', {
    allowedSizes: ['wide', 'full'],
  }),
  card(
    'timeline',
    'timeline.review',
    'Timeline review',
    'supporting',
    'compact'
  ),
  card('timeline', 'timeline.event-editor', 'Event editor', 'primary', 'wide', {
    allowedSizes: ['wide', 'full'],
  }),
  card(
    'timeline',
    'timeline.era-manager',
    'Era manager',
    'supporting',
    'standard'
  ),
  card('links', 'links.health', 'Link health', 'supporting', 'compact'),
  card('links', 'links.editor', 'Link editor', 'primary', 'wide'),
  card('links', 'links.saved-list', 'Current links', 'primary', 'wide'),
  card('links', 'links.graph', 'Relationship graph', 'full', 'full', {
    allowedSizes: ['wide', 'full'],
  }),
  card('links', 'links.repair', 'Repair links', 'primary', 'wide'),
  card('links', 'links.mode-selector', 'Link workspace mode', 'full', 'full', {
    collapsible: false,
  }),
  card('links', 'links.bulk-review', 'Bulk review', 'full', 'full'),
  card(
    'knowledge',
    'knowledge.schema-health',
    'Schema health',
    'supporting',
    'compact'
  ),
  card(
    'knowledge',
    'knowledge.navigator',
    'Knowledge navigator',
    'supporting',
    'wide'
  ),
  card(
    'knowledge',
    'knowledge.field-order',
    'Field configuration',
    'full',
    'full'
  ),
  card('knowledge', 'knowledge.editor', 'Schema editor', 'full', 'full', {
    allowedSizes: ['wide', 'full'],
  }),
  card('knowledge', 'knowledge.vocabulary', 'Vocabulary', 'full', 'full'),
  card(
    'knowledge',
    'knowledge.hidden-detail-review',
    'Hidden detail review',
    'supporting',
    'standard'
  ),
  card(
    'knowledge',
    'knowledge.types',
    'Knowledge types',
    'supporting',
    'standard'
  ),
  card(
    'knowledge',
    'knowledge.reusable-definitions',
    'Reusable definitions',
    'full',
    'full'
  ),
  card('data', 'data.save-health', 'Save health', 'supporting', 'compact'),
  card('data', 'data.export', 'Export', 'primary', 'standard'),
  card('data', 'data.full-export', 'Full export', 'primary', 'standard'),
  card(
    'data',
    'data.markdown-export',
    'Markdown export',
    'primary',
    'standard'
  ),
  card('data', 'data.import', 'Import', 'primary', 'wide'),
  card('data', 'data.recovery', 'Recovery', 'full', 'full'),
  card('data', 'data.diagnostics', 'Diagnostics', 'supporting', 'standard'),
  card('data', 'data.help', 'Data help', 'supporting', 'compact'),
  card('data', 'data.danger-zone', 'Danger zone', 'full', 'full', {
    allowedRegions: ['full'],
    allowedSizes: ['full'],
    movable: false,
    focusable: false,
    collapsible: false,
    lockedOrder: true,
  }),
  card('workspaces', 'workspaces.list', 'Workspaces', 'supporting', 'standard'),
  card(
    'workspaces',
    'workspaces.editor',
    'Workspace editor',
    'primary',
    'wide'
  ),
  card(
    'workspaces',
    'workspaces.planetary-worlds',
    'Planetary worlds',
    'primary',
    'wide'
  ),
  card('help', 'help.topics', 'Help topics', 'supporting', 'standard'),
  card('help', 'help.focus', 'Focused help', 'primary', 'wide'),
  card('help', 'help.workflow', 'Workflow help', 'full', 'full'),
  card('help', 'help.start', 'Getting started', 'primary', 'standard'),
  card('help', 'help.actions', 'Quick actions', 'supporting', 'standard'),
  card('help', 'help.data', 'Data and backups', 'primary', 'standard'),
  card('help', 'help.offline', 'Offline use', 'supporting', 'standard'),
  card('help', 'help.support', 'Support', 'supporting', 'compact'),
  card('help', 'help.privacy', 'Privacy', 'supporting', 'compact'),
  card('help', 'help.limits', 'Release limits', 'full', 'full'),
  card('utilities', 'utilities.review', 'Review hotspots', 'full', 'full'),
  card('utilities', 'utilities.tools', 'Project tools', 'full', 'full'),
] as const satisfies readonly DashboardCardDefinition[];

function createSharedPresets(
  focusCardId: string,
  reviewCardId: string
): readonly DashboardPreset[] {
  return [
    { id: 'default', label: 'Default', cards: {} },
    {
      id: 'focus',
      label: 'Focus',
      cards: { [focusCardId]: { region: 'full', size: 'full', order: 0 } },
    },
    {
      id: 'review',
      label: 'Review',
      cards: { [reviewCardId]: { region: 'full', size: 'full', order: 0 } },
    },
  ];
}

export const dashboardPresets = {
  overview: [
    { id: 'continue', label: 'Continue', cards: {} },
    {
      id: 'overview',
      label: 'Overview',
      cards: {
        'overview.quick-create': { size: 'compact' },
        'overview.search': { size: 'wide' },
        'overview.recent': { size: 'wide' },
        'overview.pinned': { size: 'compact' },
        'overview.incomplete': { size: 'full' },
      },
    },
    {
      id: 'review',
      label: 'Review',
      cards: {
        'overview.incomplete': {
          region: 'full',
          size: 'full',
          order: 1,
          collapsed: false,
        },
        'overview.quick-create': { collapsed: true },
      },
    },
  ],
  workbench: [
    { id: 'browse', label: 'Browse', cards: {} },
    {
      id: 'draft',
      label: 'Draft',
      cards: {
        'workbench.records': { region: 'supporting', collapsed: false },
        'workbench.editor': { region: 'primary', size: 'wide' },
        'workbench.record-context': { collapsed: true },
      },
    },
    {
      id: 'review',
      label: 'Review',
      cards: {
        'workbench.records': { region: 'supporting', collapsed: false },
        'workbench.editor': { size: 'wide' },
        'workbench.record-context': {
          region: 'primary',
          size: 'wide',
          collapsed: false,
        },
      },
    },
  ],
  timeline: createSharedPresets('timeline.chronology', 'timeline.review'),
  links: createSharedPresets('links.editor', 'links.health'),
  knowledge: createSharedPresets('knowledge.editor', 'knowledge.schema-health'),
  data: createSharedPresets('data.export', 'data.diagnostics'),
  workspaces: createSharedPresets(
    'workspaces.editor',
    'workspaces.planetary-worlds'
  ),
  help: createSharedPresets('help.focus', 'help.topics'),
  utilities: createSharedPresets('utilities.tools', 'utilities.review'),
} satisfies Record<DashboardPageId, readonly DashboardPreset[]>;

export function validateDashboardRegistry({
  definitions,
  presets,
}: {
  definitions: readonly DashboardCardDefinition[];
  presets: Record<DashboardPageId, readonly DashboardPreset[]>;
}): readonly string[] {
  const issues: string[] = [];
  const definitionIds = new Set<string>();
  for (const definition of definitions) {
    if (definitionIds.has(definition.id)) {
      issues.push(`Duplicate dashboard card id: ${definition.id}`);
    }
    definitionIds.add(definition.id);
    if (!definition.id.startsWith(`${definition.pageId}.`)) {
      issues.push(
        `Dashboard card id does not match its page: ${definition.id}`
      );
    }
    if (!definition.allowedRegions.includes(definition.defaultRegion)) {
      issues.push(`Default region is not allowed for ${definition.id}`);
    }
    if (!definition.allowedSizes.includes(definition.defaultSize)) {
      issues.push(`Default size is not allowed for ${definition.id}`);
    }
  }
  for (const pageId of pageIds) {
    const presetIds = new Set<string>();
    for (const preset of presets[pageId]) {
      if (presetIds.has(preset.id)) {
        issues.push(`Duplicate dashboard preset id: ${pageId}.${preset.id}`);
      }
      presetIds.add(preset.id);
      for (const cardId of Object.keys(preset.cards)) {
        if (!definitionIds.has(cardId)) {
          issues.push(`Unknown dashboard card in preset: ${cardId}`);
        }
      }
    }
  }
  return issues;
}

export function getDashboardPreset(
  pageId: DashboardPageId,
  presetId: string
): DashboardPreset {
  return (
    dashboardPresets[pageId].find((preset) => preset.id === presetId) ??
    dashboardPresets[pageId][0]!
  );
}
