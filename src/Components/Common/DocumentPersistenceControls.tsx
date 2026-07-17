import type {
  LocalSaveButtonModel,
  LocalSaveStatusState,
} from '@valgaron/core';

const persistenceAnnouncementByState: Record<LocalSaveStatusState, string> = {
  dirty: 'Unsaved document changes.',
  failed: 'Save failed.',
  paused: 'Save paused.',
  saved: 'Document saved.',
  unsaved: 'Document needs Save.',
};

export function getDocumentPersistenceAnnouncement({
  hasDirtyDraft,
  historyAnnouncement,
  saveState,
}: {
  hasDirtyDraft: boolean;
  historyAnnouncement: string;
  saveState: LocalSaveStatusState;
}): string {
  return [
    historyAnnouncement.trim(),
    persistenceAnnouncementByState[saveState],
    hasDirtyDraft ? 'Unapplied draft changes are not included.' : '',
  ]
    .filter(Boolean)
    .join(' ');
}

export function DocumentPersistenceControls({
  canRedo,
  canUndo,
  hasDirtyDraft,
  historyAnnouncement,
  onRedo,
  onSave,
  onUndo,
  redoActionLabel,
  saveButtonModel,
  saveState,
  undoActionLabel,
}: {
  canRedo: boolean;
  canUndo: boolean;
  hasDirtyDraft: boolean;
  historyAnnouncement: string;
  onRedo: () => void;
  onSave: () => void;
  onUndo: () => void;
  redoActionLabel: string | null;
  saveButtonModel: LocalSaveButtonModel;
  saveState: LocalSaveStatusState;
  undoActionLabel: string | null;
}) {
  const draftSaveNote = hasDirtyDraft
    ? ' Unapplied draft changes are not included.'
    : '';
  const liveMessage = getDocumentPersistenceAnnouncement({
    hasDirtyDraft,
    historyAnnouncement,
    saveState,
  });
  return (
    <div
      aria-label="Document history and persistence"
      className="vwb-document-controls"
      role="group"
    >
      <button
        aria-label={
          undoActionLabel ? `Undo ${undoActionLabel}` : 'Nothing to undo'
        }
        className="vwb-secondary-button"
        disabled={!canUndo}
        onClick={onUndo}
        type="button"
      >
        Undo
      </button>
      <button
        aria-label={
          redoActionLabel ? `Redo ${redoActionLabel}` : 'Nothing to redo'
        }
        className="vwb-secondary-button"
        disabled={!canRedo}
        onClick={onRedo}
        type="button"
      >
        Redo
      </button>
      <button
        aria-label={`${saveButtonModel.accessibilityLabel}${draftSaveNote}`}
        className={`vwb-save-status ${
          saveState === 'failed' || saveState === 'paused'
            ? 'is-danger'
            : saveState === 'dirty' || saveState === 'unsaved'
            ? 'is-dirty'
            : ''
        }`}
        disabled={saveButtonModel.disabled}
        onClick={onSave}
        type="button"
      >
        {saveButtonModel.label}
      </button>
      <span aria-live="polite" className="vwb-visually-hidden" role="status">
        {liveMessage}
      </span>
    </div>
  );
}
