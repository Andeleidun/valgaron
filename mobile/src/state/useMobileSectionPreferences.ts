import { useEffect, useMemo, useRef, useState } from 'react';
import { asyncStorageAdapter } from '../storage/asyncStorageAdapter';
import {
  loadMobileDashboardPreferences,
  clearMobileDashboardPreferences,
  saveMobileDashboardPreferences,
  type MobileDashboardPreferenceDocument,
  type MobileDashboardScreenId,
} from '../storage/mobileDashboardStorage';

export function moveMobileSectionOrder(
  order: readonly string[],
  sectionId: string,
  offset: number
): readonly string[] {
  const currentIndex = order.indexOf(sectionId);
  const targetIndex = currentIndex + offset;
  if (currentIndex < 0 || targetIndex < 0 || targetIndex >= order.length) {
    return order;
  }
  const next = [...order];
  [next[currentIndex], next[targetIndex]] = [
    next[targetIndex]!,
    next[currentIndex]!,
  ];
  return next;
}

export function useMobileSectionPreferences({
  screenId,
  sectionIds,
}: {
  screenId: MobileDashboardScreenId;
  sectionIds: readonly string[];
}) {
  const [document, setDocument] = useState<MobileDashboardPreferenceDocument>({
    version: 1,
    screens: {},
  });
  const [isLoaded, setIsLoaded] = useState(false);
  const documentRef = useRef(document);
  documentRef.current = document;

  useEffect(() => {
    let active = true;
    void loadMobileDashboardPreferences(asyncStorageAdapter).then((loaded) => {
      if (active) {
        setDocument(loaded);
        setIsLoaded(true);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  const stored = document.screens[screenId];
  const order = useMemo(() => {
    const valid = new Set(sectionIds);
    const storedOrder = (stored?.order ?? []).filter((id) => valid.has(id));
    return [
      ...storedOrder,
      ...sectionIds.filter((id) => !storedOrder.includes(id)),
    ];
  }, [sectionIds, stored?.order]);
  const collapsed = useMemo(
    () =>
      new Set(
        (stored?.collapsed ?? []).filter((id) => sectionIds.includes(id))
      ),
    [sectionIds, stored?.collapsed]
  );

  const commit = (nextOrder: readonly string[], nextCollapsed: Set<string>) => {
    const nextDocument: MobileDashboardPreferenceDocument = {
      version: 1,
      screens: {
        ...documentRef.current.screens,
        [screenId]: {
          order: nextOrder,
          collapsed: [...nextCollapsed],
        },
      },
    };
    setDocument(nextDocument);
    void saveMobileDashboardPreferences(asyncStorageAdapter, nextDocument);
  };

  const move = (sectionId: string, offset: number) => {
    const next = moveMobileSectionOrder(order, sectionId, offset);
    if (next === order) return;
    commit(next, collapsed);
  };

  const setCollapsed = (sectionId: string, value: boolean) => {
    const next = new Set(collapsed);
    if (value) next.add(sectionId);
    else next.delete(sectionId);
    commit(order, next);
  };

  const reset = () => commit(sectionIds, new Set());
  const resetAll = () => {
    const nextDocument: MobileDashboardPreferenceDocument = {
      version: 1,
      screens: {},
    };
    setDocument(nextDocument);
    void clearMobileDashboardPreferences(asyncStorageAdapter);
  };

  return { collapsed, isLoaded, move, order, reset, resetAll, setCollapsed };
}
