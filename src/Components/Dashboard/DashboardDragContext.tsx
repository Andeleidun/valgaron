import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react';

type DashboardDragContextValue = {
  draggingCardId: string | null;
  dropTargetCardId: string | null;
  isCustomizing: boolean;
  start: (cardId: string, event: ReactPointerEvent<HTMLElement>) => void;
  update: (event: ReactPointerEvent<HTMLElement>) => void;
  finish: (event: ReactPointerEvent<HTMLElement>) => void;
  cancel: () => void;
};

const DashboardDragContext = createContext<DashboardDragContextValue | null>(
  null
);

export function DashboardDragProvider({
  children,
  isCustomizing,
  onMoveCard,
}: {
  children: ReactNode;
  isCustomizing: boolean;
  onMoveCard?: (cardId: string, targetCardId: string) => void;
}) {
  const [draggingCardId, setDraggingCardId] = useState<string | null>(null);
  const [dropTargetCardId, setDropTargetCardId] = useState<string | null>(null);
  const cancel = () => {
    setDraggingCardId(null);
    setDropTargetCardId(null);
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') cancel();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const value = useMemo<DashboardDragContextValue>(
    () => ({
      draggingCardId,
      dropTargetCardId,
      isCustomizing,
      start(cardId, event) {
        if (!isCustomizing) return;
        event.currentTarget.setPointerCapture(event.pointerId);
        setDraggingCardId(cardId);
        setDropTargetCardId(null);
      },
      update(event) {
        if (!draggingCardId) return;
        const element = document.elementFromPoint(event.clientX, event.clientY);
        const panel = element?.closest<HTMLElement>('[data-dashboard-card-id]');
        const targetId = panel?.dataset.dashboardCardId ?? null;
        setDropTargetCardId(targetId === draggingCardId ? null : targetId);
        if (event.clientY < 80) window.scrollBy({ top: -24 });
        if (event.clientY > window.innerHeight - 80) {
          window.scrollBy({ top: 24 });
        }
      },
      finish(event) {
        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
          event.currentTarget.releasePointerCapture(event.pointerId);
        }
        if (
          draggingCardId &&
          dropTargetCardId &&
          draggingCardId !== dropTargetCardId
        ) {
          onMoveCard?.(draggingCardId, dropTargetCardId);
        }
        cancel();
      },
      cancel,
    }),
    [draggingCardId, dropTargetCardId, isCustomizing, onMoveCard]
  );

  return (
    <DashboardDragContext.Provider value={value}>
      {children}
    </DashboardDragContext.Provider>
  );
}

export function useDashboardDrag() {
  return useContext(DashboardDragContext);
}
