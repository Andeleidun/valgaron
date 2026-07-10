import {
  Children,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from 'react';
import type { DashboardPageId } from '@valgaron/core';
import {
  DashboardCardControls,
  DashboardShelf,
  DashboardToolbar,
} from './DashboardControls';
import { DashboardGrid, DashboardGridItem } from './DashboardGrid';
import { useDashboardWorkspace } from './useDashboardWorkspace';

type ManagedPanelProps = {
  'data-dashboard-card-id'?: string;
  children?: ReactNode;
};

export function DashboardPage({
  ariaLabel,
  children,
  forcedVisibleCardIds = [],
  pageId,
  summary,
}: {
  ariaLabel: string;
  children: ReactNode;
  forcedVisibleCardIds?: readonly string[];
  pageId: DashboardPageId;
  summary: string;
}) {
  const panels: ReactElement<ManagedPanelProps>[] = [];
  Children.forEach(children, (child) => {
    if (
      isValidElement<ManagedPanelProps>(child) &&
      child.props['data-dashboard-card-id']
    ) {
      panels.push(child);
    }
  });
  const dashboard = useDashboardWorkspace({
    pageId,
    activeCardIds: panels.map(
      (panel) => panel.props['data-dashboard-card-id']!
    ),
    forcedVisibleCardIds,
  });
  const primaryCard = dashboard.layout.cards.find((card) => {
    const definition = dashboard.definitions.find(
      (candidate) => candidate.id === card.id
    );
    return card.region === 'primary' && definition?.focusable;
  });

  return (
    <div className="vwb-dashboard-page" ref={dashboard.containerRef}>
      <DashboardToolbar
        activePresetId={dashboard.history.present.presetId}
        canRedo={dashboard.canRedo}
        canUndo={dashboard.canUndo}
        isCustomizing={dashboard.isCustomizing}
        isPresetCustomized={dashboard.isPresetCustomized}
        onApplyPreset={dashboard.applyPreset}
        onCancel={dashboard.cancelCustomizing}
        onCustomize={
          dashboard.isCustomizing
            ? dashboard.finishCustomizing
            : dashboard.startCustomizing
        }
        onFocusPrimary={
          primaryCard ? () => dashboard.focus(primaryCard.id) : undefined
        }
        onRedo={() => dashboard.dispatch({ type: 'redo' })}
        onReset={dashboard.reset}
        onResetAll={dashboard.resetAll}
        onUndo={() => dashboard.dispatch({ type: 'undo' })}
        presets={dashboard.presets}
        summary={summary}
      />
      <DashboardShelf
        cards={dashboard.layout.cards.filter((card) => card.region === 'shelf')}
        onRestore={dashboard.restore}
      />
      <span className="vwb-screen-reader-only" aria-live="polite">
        {dashboard.announcement}
      </span>
      <DashboardGrid
        ariaLabel={ariaLabel}
        cards={dashboard.layout.cards}
        className="vwb-dashboard-page-grid"
        isCustomizing={dashboard.isCustomizing}
        onMoveCard={(cardId, targetCardId) => {
          dashboard.moveBefore(cardId, targetCardId);
        }}
      >
        {panels.map((panel) => {
          const cardId = panel.props['data-dashboard-card-id']!;
          const card = dashboard.cardsById.get(cardId);
          const definition = dashboard.definitions.find(
            (candidate) => candidate.id === cardId
          );
          return (
            <DashboardGridItem
              cardId={cardId}
              controls={
                card && definition ? (
                  <DashboardCardControls
                    card={card}
                    definition={definition}
                    isCustomizing={dashboard.isCustomizing}
                    onCollapse={() => dashboard.collapse(cardId)}
                    onFocus={() => dashboard.focus(cardId)}
                    onMove={(direction) =>
                      dashboard.moveRelative(cardId, direction)
                    }
                    onMoveToRegion={(region) =>
                      dashboard.moveToRegion(cardId, region)
                    }
                    onReset={() => dashboard.resetCard(cardId)}
                    onResize={(size) => dashboard.resize(cardId, size)}
                  />
                ) : null
              }
              key={cardId}
            >
              {panel}
            </DashboardGridItem>
          );
        })}
      </DashboardGrid>
    </div>
  );
}
