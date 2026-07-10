import type {
  DashboardCardDefinition,
  DashboardPreset,
  DashboardVisibleRegion,
  NormalizedDashboardCard,
} from '@valgaron/core';
import {
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import { useDashboardDrag } from './DashboardDragContext';

export function DashboardToolbar({
  activePresetId,
  canRedo,
  canUndo,
  isCustomizing,
  isPresetCustomized,
  onApplyPreset,
  onCancel,
  onCustomize,
  onFocusPrimary,
  onRedo,
  onReset,
  onResetAll,
  onUndo,
  presets,
  summary,
}: {
  activePresetId: string;
  canRedo: boolean;
  canUndo: boolean;
  isCustomizing: boolean;
  isPresetCustomized: boolean;
  onApplyPreset: (preset: DashboardPreset) => void;
  onCancel: () => void;
  onCustomize: () => void;
  onFocusPrimary?: () => void;
  onRedo: () => void;
  onReset: () => void;
  onResetAll: () => void;
  onUndo: () => void;
  presets: readonly DashboardPreset[];
  summary: string;
}) {
  return (
    <div
      className={`vwb-dashboard-toolbar ${
        isCustomizing ? 'is-customizing' : ''
      }`}
      aria-label="Dashboard layout controls"
      role="group"
    >
      <div className="vwb-dashboard-toolbar-summary">
        <strong>
          {isCustomizing
            ? 'Customize layout'
            : isPresetCustomized
            ? 'Customized view'
            : 'Recommended view'}
        </strong>
        <span>{summary}</span>
      </div>
      <div className="vwb-dashboard-toolbar-actions">
        <label className="vwb-dashboard-preset-control">
          <span>View</span>
          <select
            aria-label="Dashboard view preset"
            value={activePresetId}
            onChange={(event) => {
              const preset = presets.find(
                (candidate) => candidate.id === event.target.value
              );
              if (preset) onApplyPreset(preset);
            }}
          >
            {presets.map((preset) => (
              <option key={preset.id} value={preset.id}>
                {preset.label}
              </option>
            ))}
          </select>
        </label>
        {!isCustomizing && onFocusPrimary ? (
          <button
            className="vwb-secondary-button"
            type="button"
            onClick={onFocusPrimary}
          >
            Focus primary task
          </button>
        ) : null}
        {isCustomizing ? (
          <>
            <button
              className="vwb-secondary-button"
              type="button"
              disabled={!canUndo}
              onClick={onUndo}
            >
              Undo
            </button>
            <button
              className="vwb-secondary-button"
              type="button"
              disabled={!canRedo}
              onClick={onRedo}
            >
              Redo
            </button>
            <button
              className="vwb-secondary-button"
              type="button"
              onClick={onReset}
            >
              Reset layout
            </button>
            <button
              className="vwb-secondary-button"
              type="button"
              onClick={onResetAll}
            >
              Reset all dashboards
            </button>
            <button
              className="vwb-secondary-button"
              type="button"
              onClick={onCancel}
            >
              Cancel
            </button>
          </>
        ) : null}
        <button
          className="vwb-primary-button"
          type="button"
          onClick={onCustomize}
        >
          {isCustomizing ? 'Done' : 'Customize layout'}
        </button>
      </div>
    </div>
  );
}

export function DashboardShelf({
  cards,
  getSummary,
  onRestore,
}: {
  cards: readonly NormalizedDashboardCard[];
  getSummary?: (card: NormalizedDashboardCard) => string;
  onRestore: (cardId: string) => void;
}) {
  if (cards.length === 0) return null;
  return (
    <div className="vwb-dashboard-shelf" aria-label="Collapsed cards">
      <span className="vwb-dashboard-shelf-label">Collapsed</span>
      {cards.map((card) => (
        <button
          className="vwb-dashboard-shelf-item"
          key={card.id}
          type="button"
          onClick={() => onRestore(card.id)}
        >
          {card.title}
          {getSummary ? getSummary(card) : ''}
        </button>
      ))}
    </div>
  );
}

export function DashboardCardControls({
  card,
  definition,
  isCustomizing,
  onCollapse,
  onFocus,
  onMove,
  onMoveToRegion,
  onReset,
  onResize,
}: {
  card: NormalizedDashboardCard;
  definition: DashboardCardDefinition;
  isCustomizing: boolean;
  onCollapse: () => void;
  onFocus: () => void;
  onMove: (direction: -1 | 1) => void;
  onMoveToRegion: (region: DashboardVisibleRegion) => void;
  onReset: () => void;
  onResize: (size: NormalizedDashboardCard['size']) => void;
}) {
  const drag = useDashboardDrag();
  const resizeRef = useRef<{
    pointerId: number;
    startX: number;
    startIndex: number;
    candidateIndex: number;
  } | null>(null);
  const [resizeCandidate, setResizeCandidate] = useState<string | null>(null);
  const finishResize = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const active = resizeRef.current;
    if (!active) return;
    if (event.currentTarget.hasPointerCapture(active.pointerId)) {
      event.currentTarget.releasePointerCapture(active.pointerId);
    }
    const size = definition.allowedSizes[active.candidateIndex];
    if (size && active.candidateIndex !== active.startIndex) onResize(size);
    resizeRef.current = null;
    setResizeCandidate(null);
  };
  return (
    <div className="vwb-dashboard-card-controls">
      {isCustomizing && definition.movable ? (
        <>
          <button
            className="vwb-dashboard-drag-handle"
            type="button"
            aria-label={`Drag ${card.title} to a new position`}
            onPointerDown={(event) => drag?.start(card.id, event)}
            onPointerMove={(event) => drag?.update(event)}
            onPointerUp={(event) => drag?.finish(event)}
            onPointerCancel={drag?.cancel}
          >
            Drag
          </button>
          <button
            type="button"
            onClick={() => onMove(-1)}
            aria-label={`Move ${card.title} earlier`}
          >
            Earlier
          </button>
          <button
            type="button"
            onClick={() => onMove(1)}
            aria-label={`Move ${card.title} later`}
          >
            Later
          </button>
        </>
      ) : null}
      {isCustomizing && definition.allowedSizes.length > 1 ? (
        <>
          <select
            aria-label={`Size for ${card.title}`}
            value={card.size}
            onChange={(event) =>
              onResize(event.target.value as NormalizedDashboardCard['size'])
            }
          >
            {definition.allowedSizes.map((size) => (
              <option key={size} value={size}>
                {size[0]!.toUpperCase() + size.slice(1)}
              </option>
            ))}
          </select>
          <button
            className="vwb-dashboard-resize-handle"
            type="button"
            aria-label={`Resize ${card.title}; drag horizontally or use left and right arrow keys`}
            onKeyDown={(event) => {
              const index = definition.allowedSizes.indexOf(card.size);
              if (event.key === 'ArrowLeft' && index > 0) {
                event.preventDefault();
                onResize(definition.allowedSizes[index - 1]!);
              } else if (
                event.key === 'ArrowRight' &&
                index < definition.allowedSizes.length - 1
              ) {
                event.preventDefault();
                onResize(definition.allowedSizes[index + 1]!);
              }
            }}
            onPointerDown={(event) => {
              const startIndex = definition.allowedSizes.indexOf(card.size);
              event.currentTarget.setPointerCapture(event.pointerId);
              resizeRef.current = {
                pointerId: event.pointerId,
                startX: event.clientX,
                startIndex,
                candidateIndex: startIndex,
              };
              setResizeCandidate(card.size);
            }}
            onPointerMove={(event) => {
              const active = resizeRef.current;
              if (!active) return;
              const steps = Math.round((event.clientX - active.startX) / 72);
              active.candidateIndex = Math.max(
                0,
                Math.min(
                  definition.allowedSizes.length - 1,
                  active.startIndex + steps
                )
              );
              setResizeCandidate(
                definition.allowedSizes[active.candidateIndex] ?? card.size
              );
            }}
            onPointerUp={finishResize}
            onPointerCancel={() => {
              resizeRef.current = null;
              setResizeCandidate(null);
            }}
          >
            Resize{resizeCandidate ? `: ${resizeCandidate}` : ''}
          </button>
        </>
      ) : null}
      {isCustomizing && definition.movable ? (
        <select
          aria-label={`Region for ${card.title}`}
          value={
            card.region === 'shelf' ? definition.defaultRegion : card.region
          }
          onChange={(event) =>
            onMoveToRegion(event.target.value as DashboardVisibleRegion)
          }
        >
          {definition.allowedRegions.map((region) => (
            <option key={region} value={region}>
              {region === 'full'
                ? 'Full width'
                : region[0]!.toUpperCase() + region.slice(1)}
            </option>
          ))}
        </select>
      ) : null}
      {isCustomizing && definition.focusable ? (
        <button type="button" onClick={onFocus}>
          Focus
        </button>
      ) : null}
      {isCustomizing ? (
        <button type="button" onClick={onReset}>
          Reset card
        </button>
      ) : null}
      {definition.collapsible ? (
        <button type="button" onClick={onCollapse}>
          Collapse
        </button>
      ) : null}
    </div>
  );
}
