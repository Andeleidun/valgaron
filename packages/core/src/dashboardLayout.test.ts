import { describe, expect, it } from '@jest/globals';
import {
  createDashboardLayoutHistory,
  createDashboardPagePreference,
  createDashboardPreferenceDocument,
  dashboardCardDefinitions,
  dashboardLayoutReducer,
  getDashboardPreset,
  getDashboardViewportClass,
  mergeDashboardPagePreference,
  normalizeDashboardLayout,
  parseDashboardPreferenceDocument,
  validateDashboardRegistry,
  dashboardPresets,
} from './dashboardLayout';

describe('adaptive dashboard layout', () => {
  const preset = getDashboardPreset('workbench', 'default');
  const preference = createDashboardPagePreference({
    pageId: 'workbench',
    preset,
    definitions: dashboardCardDefinitions,
  });

  it('classifies dashboard container widths', () => {
    expect(getDashboardViewportClass(959)).toBe('compact');
    expect(getDashboardViewportClass(960)).toBe('standard');
    expect(getDashboardViewportClass(1280)).toBe('wide');
  });

  it('normalizes compact layouts to one full-width region', () => {
    const layout = normalizeDashboardLayout({
      pageId: 'workbench',
      definitions: dashboardCardDefinitions,
      preset,
      preference,
      viewport: 'compact',
    });
    expect(layout.cards.every((card) => card.size === 'full')).toBe(true);
    expect(
      layout.cards.every(
        (card) => card.region === 'full' || card.region === 'shelf'
      )
    ).toBe(true);
  });

  it('uses the revised wide defaults for Timeline, Knowledge, and Utilities', () => {
    const expectedDefaults = {
      timeline: {
        'timeline.overview': ['full', 'full'],
        'timeline.filters': ['supporting', 'compact'],
        'timeline.chronology': ['primary', 'wide'],
        'timeline.review': ['supporting', 'compact'],
        'timeline.event-editor': ['primary', 'wide'],
        'timeline.era-manager': ['supporting', 'standard'],
      },
      knowledge: {
        'knowledge.schema-health': ['supporting', 'compact'],
        'knowledge.navigator': ['supporting', 'wide'],
        'knowledge.field-order': ['full', 'full'],
        'knowledge.editor': ['full', 'full'],
        'knowledge.vocabulary': ['full', 'full'],
        'knowledge.hidden-detail-review': ['supporting', 'standard'],
        'knowledge.types': ['supporting', 'standard'],
        'knowledge.reusable-definitions': ['full', 'full'],
      },
      utilities: {
        'utilities.review': ['full', 'full'],
        'utilities.tools': ['full', 'full'],
      },
    } as const;

    for (const [pageId, expectedCards] of Object.entries(expectedDefaults)) {
      const page = pageId as keyof typeof expectedDefaults;
      const pagePreset = getDashboardPreset(page, 'default');
      const layout = normalizeDashboardLayout({
        pageId: page,
        definitions: dashboardCardDefinitions,
        preset: pagePreset,
        viewport: 'wide',
      });
      const cardsById = new Map(layout.cards.map((card) => [card.id, card]));
      for (const [cardId, [region, size]] of Object.entries(expectedCards)) {
        expect(cardsById.get(cardId)).toMatchObject({ region, size });
      }
      expect(layout.cards.map((card) => card.id)).toEqual(
        Object.keys(expectedCards)
      );
    }
  });

  it('normalizes the requested dashboards to full rows at laptop widths', () => {
    for (const pageId of ['timeline', 'knowledge', 'utilities'] as const) {
      const pagePreset = getDashboardPreset(pageId, 'default');
      const pagePreference = createDashboardPagePreference({
        pageId,
        preset: pagePreset,
        definitions: dashboardCardDefinitions,
      });
      const layout = normalizeDashboardLayout({
        pageId,
        definitions: dashboardCardDefinitions,
        preset: pagePreset,
        preference: pagePreference,
        viewport: 'standard',
      });
      expect(layout.cards.every((card) => card.size === 'full')).toBe(true);
    }
  });

  it('keeps standard-width behavior unchanged for other dashboards', () => {
    const layout = normalizeDashboardLayout({
      pageId: 'workbench',
      definitions: dashboardCardDefinitions,
      preset,
      preference,
      viewport: 'standard',
    });
    const cardsById = new Map(layout.cards.map((card) => [card.id, card]));
    expect(cardsById.get('workbench.records')?.size).toBe('standard');
    expect(cardsById.get('workbench.editor')?.size).toBe('full');
    expect(cardsById.get('workbench.record-context')?.size).toBe('standard');
  });

  it('preserves stored wide-layout customizations and uses new defaults only for missing cards', () => {
    const knowledgePreset = getDashboardPreset('knowledge', 'default');
    const stored = createDashboardPagePreference({
      pageId: 'knowledge',
      preset: knowledgePreset,
      definitions: dashboardCardDefinitions,
    });
    stored.cards['knowledge.navigator'] = {
      region: 'primary',
      size: 'standard',
      order: 99,
      collapsed: false,
    };
    stored.cards['knowledge.schema-health'] = {
      region: 'full',
      size: 'standard',
      order: 98,
      collapsed: true,
    };
    const stale = {
      ...stored,
      cards: {
        'knowledge.navigator': stored.cards['knowledge.navigator']!,
        'knowledge.schema-health': stored.cards['knowledge.schema-health']!,
      },
    };
    const merged = mergeDashboardPagePreference({
      preference: stale,
      preset: knowledgePreset,
      definitions: dashboardCardDefinitions,
    });
    const layout = normalizeDashboardLayout({
      pageId: 'knowledge',
      definitions: dashboardCardDefinitions,
      preset: knowledgePreset,
      preference: merged,
      viewport: 'wide',
    });
    const cardsById = new Map(layout.cards.map((card) => [card.id, card]));

    expect(cardsById.get('knowledge.navigator')).toMatchObject({
      region: 'primary',
      size: 'standard',
      collapsed: false,
    });
    expect(cardsById.get('knowledge.schema-health')).toMatchObject({
      region: 'shelf',
      size: 'standard',
      collapsed: true,
    });
    expect(merged.cards['knowledge.navigator']).toEqual(
      stored.cards['knowledge.navigator']
    );
    expect(merged.cards['knowledge.schema-health']).toEqual(
      stored.cards['knowledge.schema-health']
    );
    expect(layout.cards.slice(-2).map((card) => card.id)).toEqual([
      'knowledge.schema-health',
      'knowledge.navigator',
    ]);
    expect(merged.cards['knowledge.field-order']).toMatchObject({
      region: 'full',
      size: 'full',
    });
  });

  it('enforces card constraints and forced visibility', () => {
    const changed = {
      ...preference,
      cards: {
        ...preference.cards,
        'workbench.editor': {
          region: 'supporting' as const,
          size: 'compact' as const,
          order: 2,
          collapsed: true,
        },
      },
    };
    const editor = normalizeDashboardLayout({
      pageId: 'workbench',
      definitions: dashboardCardDefinitions,
      preset,
      preference: changed,
      viewport: 'wide',
      forcedVisibleCardIds: ['workbench.editor'],
    }).cards.find((card) => card.id === 'workbench.editor');
    expect(editor).toMatchObject({
      region: 'primary',
      size: 'wide',
      collapsed: false,
      isForcedVisible: true,
    });
  });

  it('parses valid preferences and ignores unknown cards', () => {
    const document = createDashboardPreferenceDocument({
      workbench: preference,
    });
    const raw = JSON.parse(JSON.stringify(document)) as {
      pages: { workbench: { cards: Record<string, unknown> } };
    };
    raw.pages.workbench.cards['workbench.unknown'] = {
      region: 'primary',
      size: 'full',
      order: 99,
      collapsed: false,
    };
    const parsed = parseDashboardPreferenceDocument(
      JSON.stringify(raw),
      dashboardCardDefinitions
    );
    expect(parsed?.pages.workbench?.cards['workbench.records']).toBeDefined();
    expect(parsed?.pages.workbench?.cards['workbench.unknown']).toBeUndefined();
    expect(
      parseDashboardPreferenceDocument('{bad', dashboardCardDefinitions)
    ).toBeNull();
  });

  it('supports move, resize, collapse, undo, and redo', () => {
    let history = createDashboardLayoutHistory(preference);
    history = dashboardLayoutReducer(history, {
      type: 'move-card',
      cardId: 'workbench.records',
      region: 'primary',
      order: 3,
    });
    history = dashboardLayoutReducer(history, {
      type: 'resize-card',
      cardId: 'workbench.records',
      size: 'wide',
    });
    history = dashboardLayoutReducer(history, {
      type: 'collapse-card',
      cardId: 'workbench.records',
    });
    expect(history.present.cards['workbench.records']).toMatchObject({
      region: 'primary',
      size: 'wide',
      collapsed: true,
    });
    history = dashboardLayoutReducer(history, { type: 'undo' });
    expect(history.present.cards['workbench.records']?.collapsed).toBe(false);
    history = dashboardLayoutReducer(history, { type: 'redo' });
    expect(history.present.cards['workbench.records']?.collapsed).toBe(true);
  });

  it('uses region-local insertion indexes when reordering cards', () => {
    const moved = dashboardLayoutReducer(
      createDashboardLayoutHistory(preference),
      {
        type: 'move-card',
        cardId: 'workbench.records',
        region: 'supporting',
        order: 1,
      }
    );
    expect(moved.present.cards['workbench.record-context']?.order).toBe(1);
    expect(moved.present.cards['workbench.records']?.order).toBe(2);
    expect(
      new Set(Object.values(moved.present.cards).map((card) => card.order)).size
    ).toBe(Object.keys(moved.present.cards).length);
  });

  it('validates the shipped registry and presets', () => {
    expect(
      validateDashboardRegistry({
        definitions: dashboardCardDefinitions,
        presets: dashboardPresets,
      })
    ).toEqual([]);
  });

  it('merges stale preferences with new cards and a valid preset id', () => {
    const stale = {
      ...preference,
      presetId: 'removed-preset',
      cards: {
        'workbench.records': preference.cards['workbench.records']!,
      },
    };
    const merged = mergeDashboardPagePreference({
      preference: stale,
      preset: getDashboardPreset('workbench', 'draft'),
      definitions: dashboardCardDefinitions,
    });
    expect(merged.presetId).toBe('draft');
    expect(merged.cards['workbench.editor']).toBeDefined();
    expect(merged.cards['workbench.record-context']).toBeDefined();
  });

  it('anchors locked safety cards after movable cards', () => {
    const dataPreset = getDashboardPreset('data', 'default');
    const dataPreference = createDashboardPagePreference({
      pageId: 'data',
      preset: dataPreset,
      definitions: dashboardCardDefinitions,
    });
    dataPreference.cards['data.danger-zone'] = {
      region: 'primary',
      size: 'compact',
      order: 0,
      collapsed: true,
    };
    const cards = normalizeDashboardLayout({
      pageId: 'data',
      definitions: dashboardCardDefinitions,
      preset: dataPreset,
      preference: dataPreference,
      viewport: 'wide',
    }).cards;
    expect(cards.at(-1)).toMatchObject({
      id: 'data.danger-zone',
      region: 'full',
      size: 'full',
      collapsed: false,
    });
  });

  it('applies a preset as a clean recommendation and limits undo history', () => {
    let history = createDashboardLayoutHistory(preference);
    for (let index = 0; index < 25; index += 1) {
      history = dashboardLayoutReducer(history, {
        type: 'resize-card',
        cardId: 'workbench.records',
        size: index % 2 === 0 ? 'wide' : 'standard',
      });
    }
    expect(history.past).toHaveLength(20);
    const draft = createDashboardPagePreference({
      pageId: 'workbench',
      preset: getDashboardPreset('workbench', 'draft'),
      definitions: dashboardCardDefinitions,
    });
    history = dashboardLayoutReducer(history, {
      type: 'apply-preset',
      preference: draft,
    });
    expect(history.present).toEqual(draft);
  });
});
