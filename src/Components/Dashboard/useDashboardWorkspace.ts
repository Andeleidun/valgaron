import { useEffect, useMemo, useReducer, useRef, useState } from 'react';
import {
  createDashboardLayoutHistory,
  createDashboardPagePreference,
  dashboardCardDefinitions,
  dashboardPresets,
  dashboardLayoutReducer,
  getDashboardPreset,
  getDashboardViewportClass,
  mergeDashboardPagePreference,
  normalizeDashboardLayout,
  parseDashboardPreferenceDocument,
  type DashboardCardSize,
  type DashboardPageId,
  type DashboardPreferenceDocument,
  type DashboardVisibleRegion,
} from '@valgaron/core';
import {
  DASHBOARD_LAYOUT_STORAGE_KEY,
  clearDashboardPreferenceDocument,
  loadDashboardPreferenceDocument,
  saveDashboardPreferenceDocument,
  updateDashboardPagePreference,
} from '../../Utlilities/dashboardLayoutStorage';

export function useDashboardWorkspace({
  pageId,
  activeCardIds,
  forcedVisibleCardIds = [],
}: {
  pageId: DashboardPageId;
  activeCardIds: readonly string[];
  forcedVisibleCardIds?: readonly string[];
}) {
  const initialDocumentRef = useRef<DashboardPreferenceDocument | null>(null);
  if (!initialDocumentRef.current) {
    initialDocumentRef.current = loadDashboardPreferenceDocument();
  }
  const defaultPreset = useMemo(
    () => getDashboardPreset(pageId, 'default'),
    [pageId]
  );
  const defaultPreference = useMemo(
    () =>
      createDashboardPagePreference({
        pageId,
        preset: defaultPreset,
        definitions: dashboardCardDefinitions,
      }),
    [defaultPreset, pageId]
  );
  const storedPreference = initialDocumentRef.current.pages[pageId];
  const initialPreference = storedPreference
    ? mergeDashboardPagePreference({
        preference: storedPreference,
        preset: getDashboardPreset(pageId, storedPreference.presetId),
        definitions: dashboardCardDefinitions,
      })
    : defaultPreference;
  const [history, dispatch] = useReducer(
    dashboardLayoutReducer,
    initialPreference,
    createDashboardLayoutHistory
  );
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [announcement, setAnnouncement] = useState('');
  const [containerWidth, setContainerWidth] = useState(() =>
    typeof window === 'undefined' ? 1440 : window.innerWidth
  );
  const containerRef = useRef<HTMLDivElement>(null);
  const preferenceDocumentRef = useRef(initialDocumentRef.current);
  const customizationStartRef = useRef(history.present);
  const skipNextPersistenceRef = useRef(false);
  const presentPreferenceRef = useRef(history.present);
  presentPreferenceRef.current = history.present;

  useEffect(() => {
    const element = containerRef.current;
    if (!element || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width;
      if (width) setContainerWidth(width);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (skipNextPersistenceRef.current) {
      skipNextPersistenceRef.current = false;
      return;
    }
    const timeout = window.setTimeout(
      () => {
        const nextDocument = updateDashboardPagePreference(
          preferenceDocumentRef.current,
          pageId,
          history.present
        );
        if (saveDashboardPreferenceDocument(nextDocument)) {
          preferenceDocumentRef.current = nextDocument;
        } else {
          setAnnouncement(
            'Dashboard layout could not be saved in this browser.'
          );
        }
      },
      isCustomizing ? 250 : 0
    );
    return () => window.clearTimeout(timeout);
  }, [history.present, isCustomizing, pageId]);

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (isCustomizing || event.key !== DASHBOARD_LAYOUT_STORAGE_KEY) {
        return;
      }
      if (!event.newValue) {
        preferenceDocumentRef.current = {
          version: 1,
          pages: {},
          updatedAt: new Date().toISOString(),
        };
        if (presentPreferenceRef.current !== defaultPreference) {
          skipNextPersistenceRef.current = true;
          dispatch({ type: 'reset-page', preference: defaultPreference });
        }
        setAnnouncement('Dashboard layout reset from another browser tab.');
        return;
      }
      const document = parseDashboardPreferenceDocument(
        event.newValue,
        dashboardCardDefinitions
      );
      const page = document?.pages[pageId];
      if (document) {
        preferenceDocumentRef.current = document;
        const nextPreference = page
          ? mergeDashboardPagePreference({
              preference: page,
              preset: getDashboardPreset(pageId, page.presetId),
              definitions: dashboardCardDefinitions,
            })
          : defaultPreference;
        if (presentPreferenceRef.current === nextPreference) {
          return;
        }
        skipNextPersistenceRef.current = true;
        dispatch({
          type: 'reset-page',
          preference: nextPreference,
        });
        setAnnouncement('Dashboard layout updated from another browser tab.');
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [defaultPreference, isCustomizing, pageId]);

  const preset = getDashboardPreset(pageId, history.present.presetId);
  const layout = useMemo(
    () =>
      normalizeDashboardLayout({
        pageId,
        definitions: dashboardCardDefinitions,
        preset,
        preference: history.present,
        viewport: getDashboardViewportClass(containerWidth),
        activeCardIds,
        forcedVisibleCardIds,
      }),
    [
      activeCardIds,
      containerWidth,
      forcedVisibleCardIds,
      history.present,
      pageId,
      preset,
    ]
  );
  const definitions = dashboardCardDefinitions.filter(
    (definition) => definition.pageId === pageId
  );
  const cardsById = new Map(layout.cards.map((card) => [card.id, card]));

  const collapse = (cardId: string) => {
    dispatch({ type: 'collapse-card', cardId });
    setAnnouncement(`${cardsById.get(cardId)?.title ?? 'Card'} collapsed.`);
  };
  const restore = (cardId: string) => {
    dispatch({ type: 'restore-card', cardId });
    setAnnouncement(`${cardsById.get(cardId)?.title ?? 'Card'} restored.`);
  };
  const move = (
    cardId: string,
    region: DashboardVisibleRegion,
    order: number
  ) => {
    dispatch({ type: 'move-card', cardId, region, order });
    setAnnouncement(
      `${cardsById.get(cardId)?.title ?? 'Card'} moved to ${region}.`
    );
  };
  const visibleCardsInRegion = (region: DashboardVisibleRegion) =>
    layout.cards.filter((card) => card.region === region);
  const moveRelative = (cardId: string, direction: -1 | 1) => {
    const card = cardsById.get(cardId);
    if (!card || card.region === 'shelf') return;
    const regionCards = visibleCardsInRegion(card.region);
    const currentIndex = regionCards.findIndex((item) => item.id === cardId);
    move(
      cardId,
      card.region,
      Math.max(0, Math.min(regionCards.length - 1, currentIndex + direction))
    );
  };
  const moveBefore = (cardId: string, targetCardId: string) => {
    const target = cardsById.get(targetCardId);
    if (!target || target.region === 'shelf') return;
    const targetIndex = visibleCardsInRegion(target.region)
      .filter((card) => card.id !== cardId)
      .findIndex((card) => card.id === targetCardId);
    if (targetIndex >= 0) move(cardId, target.region, targetIndex);
  };
  const moveToRegion = (cardId: string, region: DashboardVisibleRegion) => {
    move(
      cardId,
      region,
      visibleCardsInRegion(region).filter((card) => card.id !== cardId).length
    );
  };
  const resize = (cardId: string, size: DashboardCardSize) => {
    dispatch({ type: 'resize-card', cardId, size });
    setAnnouncement(
      `${cardsById.get(cardId)?.title ?? 'Card'} changed to ${size}.`
    );
  };
  const reset = () => {
    dispatch({
      type: 'reset-page',
      preference: createDashboardPagePreference({
        pageId,
        preset,
        definitions: dashboardCardDefinitions,
      }),
    });
    setAnnouncement('Dashboard restored to the recommended layout.');
  };
  const resetAll = () => {
    clearDashboardPreferenceDocument();
    preferenceDocumentRef.current = {
      version: 1,
      pages: {},
      updatedAt: new Date().toISOString(),
    };
    dispatch({ type: 'reset-page', preference: defaultPreference });
    setAnnouncement('All dashboard layouts restored to their defaults.');
  };
  const applyPreset = (
    nextPreset: (typeof dashboardPresets)[DashboardPageId][number]
  ) => {
    dispatch({
      type: 'apply-preset',
      preference: createDashboardPagePreference({
        pageId,
        preset: nextPreset,
        definitions: dashboardCardDefinitions,
      }),
    });
    setAnnouncement(`${nextPreset.label} recommended layout applied.`);
  };
  const resetCard = (cardId: string) => {
    const recommended = createDashboardPagePreference({
      pageId,
      preset,
      definitions: dashboardCardDefinitions,
    }).cards[cardId];
    if (!recommended) return;
    dispatch({ type: 'reset-card', cardId, preference: recommended });
    setAnnouncement(`${cardsById.get(cardId)?.title ?? 'Card'} reset.`);
  };
  const startCustomizing = () => {
    customizationStartRef.current = history.present;
    setIsCustomizing(true);
    setAnnouncement('Layout customization started.');
  };
  const finishCustomizing = () => {
    setIsCustomizing(false);
    setAnnouncement('Layout customization saved locally.');
  };
  const cancelCustomizing = () => {
    dispatch({
      type: 'reset-page',
      preference: customizationStartRef.current,
    });
    setIsCustomizing(false);
    setAnnouncement('Layout customization canceled.');
  };
  const focus = (cardId: string) => {
    dispatch({ type: 'focus-card', cardId });
    setAnnouncement(`${cardsById.get(cardId)?.title ?? 'Card'} focused.`);
  };
  const recommendedPreference = createDashboardPagePreference({
    pageId,
    preset,
    definitions: dashboardCardDefinitions,
  });
  const isPresetCustomized =
    JSON.stringify(history.present.cards) !==
    JSON.stringify(recommendedPreference.cards);

  return {
    announcement,
    applyPreset,
    cancelCustomizing,
    canRedo: history.future.length > 0,
    canUndo: history.past.length > 0,
    cardsById,
    collapse,
    containerRef,
    definitions,
    dispatch,
    finishCustomizing,
    focus,
    history,
    isCustomizing,
    isPresetCustomized,
    layout,
    move,
    moveBefore,
    moveRelative,
    moveToRegion,
    reset,
    resetAll,
    resetCard,
    resize,
    restore,
    presets: dashboardPresets[pageId],
    setIsCustomizing,
    startCustomizing,
  };
}
