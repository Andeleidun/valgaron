import {
  Children,
  cloneElement,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from 'react';
import type { NormalizedDashboardCard } from '@valgaron/core';
import {
  DashboardDragProvider,
  useDashboardDrag,
} from './DashboardDragContext';

type DashboardGridItemProps = {
  cardId: string;
  card?: NormalizedDashboardCard;
  controls?: ReactNode;
  children: ReactElement<{
    className?: string;
    children?: ReactNode;
    'data-dashboard-card-id'?: string;
    'data-dashboard-region'?: string;
    'data-dashboard-size'?: string;
  }>;
};

export function DashboardGridItem({
  card,
  children,
  controls,
}: DashboardGridItemProps) {
  const drag = useDashboardDrag();
  if (!card || card.region === 'shelf') return null;
  return cloneElement(children, {
    ...children.props,
    className: [
      children.props.className ?? '',
      drag?.draggingCardId === card.id ? 'is-dashboard-dragging' : '',
      drag?.dropTargetCardId === card.id ? 'is-dashboard-drop-target' : '',
    ]
      .filter(Boolean)
      .join(' '),
    'data-dashboard-region': card.region,
    'data-dashboard-card-id': card.id,
    'data-dashboard-size': card.size,
    children: controls
      ? [
          <div className="vwb-dashboard-managed-controls" key="controls">
            {controls}
          </div>,
          children.props.children,
        ]
      : children.props.children,
  });
}

export function DashboardGrid({
  ariaLabel,
  className,
  cards,
  children,
  isCustomizing = false,
  onMoveCard,
}: {
  ariaLabel: string;
  className: string;
  cards: readonly NormalizedDashboardCard[];
  children: ReactNode;
  isCustomizing?: boolean;
  onMoveCard?: (cardId: string, targetCardId: string) => void;
}) {
  const items = new Map<string, ReactElement<DashboardGridItemProps>>();
  Children.forEach(children, (child) => {
    if (isValidElement<DashboardGridItemProps>(child)) {
      items.set(child.props.cardId, child);
    }
  });
  return (
    <DashboardDragProvider
      isCustomizing={isCustomizing}
      onMoveCard={onMoveCard}
    >
      <section className={className} aria-label={ariaLabel}>
        {cards
          .filter((card) => card.region !== 'shelf')
          .map((card) => {
            const item = items.get(card.id);
            return item ? cloneElement(item, { card, key: card.id }) : null;
          })}
      </section>
    </DashboardDragProvider>
  );
}
