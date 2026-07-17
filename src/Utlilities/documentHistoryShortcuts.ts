export type DocumentHistoryKeyboardAction = 'undo' | 'redo';

type DocumentHistoryKeyboardEvent = Pick<
  KeyboardEvent,
  | 'altKey'
  | 'ctrlKey'
  | 'defaultPrevented'
  | 'key'
  | 'metaKey'
  | 'preventDefault'
  | 'shiftKey'
  | 'target'
>;

export function getDocumentHistoryKeyboardAction({
  altKey,
  ctrlKey,
  isTargetIgnored,
  key,
  metaKey,
  shiftKey,
}: {
  altKey: boolean;
  ctrlKey: boolean;
  isTargetIgnored: boolean;
  key: string;
  metaKey: boolean;
  shiftKey: boolean;
}): DocumentHistoryKeyboardAction | null {
  if (isTargetIgnored || !ctrlKey || altKey || metaKey || shiftKey) {
    return null;
  }
  switch (key.toLowerCase()) {
    case 'z':
      return 'undo';
    case 'y':
      return 'redo';
    default:
      return null;
  }
}

function isDocumentHistoryShortcutTargetIgnored(
  target: EventTarget | null
): boolean {
  if (typeof Element === 'undefined' || !(target instanceof Element)) {
    return false;
  }
  return (
    (typeof HTMLElement !== 'undefined' &&
      target instanceof HTMLElement &&
      target.isContentEditable) ||
    Boolean(
      target.closest(
        'input, textarea, select, [contenteditable="true"], [role="dialog"], [role="alertdialog"], [aria-modal="true"], [data-document-history-shortcuts="ignore"]'
      )
    )
  );
}

export function runDocumentHistoryKeyboardShortcut({
  canRedo,
  canUndo,
  event,
  onRedo,
  onUndo,
}: {
  canRedo: boolean;
  canUndo: boolean;
  event: DocumentHistoryKeyboardEvent;
  onRedo: () => void;
  onUndo: () => void;
}): DocumentHistoryKeyboardAction | null {
  if (event.defaultPrevented) {
    return null;
  }
  const action = getDocumentHistoryKeyboardAction({
    altKey: event.altKey,
    ctrlKey: event.ctrlKey,
    isTargetIgnored: isDocumentHistoryShortcutTargetIgnored(event.target),
    key: event.key,
    metaKey: event.metaKey,
    shiftKey: event.shiftKey,
  });
  if (
    action === null ||
    (action === 'undo' && !canUndo) ||
    (action === 'redo' && !canRedo)
  ) {
    return null;
  }
  event.preventDefault();
  if (action === 'undo') {
    onUndo();
  } else {
    onRedo();
  }
  return action;
}
