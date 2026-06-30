import { useEffect, useRef } from 'react';

const focusableSelector = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

export type FocusTrapDirection = 'next' | 'previous';

/**
 * Returns the next focus target index for a dialog's cyclic Tab order.
 */
export function getTrappedFocusTargetIndex(
  focusableElementCount: number,
  currentIndex: number,
  direction: FocusTrapDirection
) {
  if (focusableElementCount <= 0) {
    return -1;
  }

  if (direction === 'previous') {
    return currentIndex <= 0 ? focusableElementCount - 1 : currentIndex - 1;
  }

  return currentIndex >= focusableElementCount - 1 ? 0 : currentIndex + 1;
}

function isVisibleFocusableElement(element: HTMLElement) {
  return (
    !element.hasAttribute('disabled') &&
    element.getAttribute('aria-hidden') !== 'true' &&
    element.tabIndex !== -1
  );
}

function getDialogFocusableElements(container: HTMLElement) {
  return Array.from(container.querySelectorAll<HTMLElement>(focusableSelector))
    .filter(isVisibleFocusableElement)
    .filter(
      (element) => element.offsetParent !== null || element === container
    );
}

/**
 * Keeps keyboard focus inside an open dialog, closes on Escape, and restores
 * focus to the opener when the dialog unmounts.
 */
export function useDialogFocus<TElement extends HTMLElement>(
  isOpen: boolean,
  onCancel: () => void
) {
  const dialogRef = useRef<TElement | null>(null);
  const onCancelRef = useRef(onCancel);
  const restoreFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    onCancelRef.current = onCancel;
  }, [onCancel]);

  useEffect(() => {
    if (!isOpen || typeof document === 'undefined') {
      return;
    }

    const dialog = dialogRef.current;
    restoreFocusRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;

    const initialFocusTarget = dialog
      ? getDialogFocusableElements(dialog)[0] ?? dialog
      : null;
    initialFocusTarget?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onCancelRef.current();
        return;
      }

      if (event.key !== 'Tab' || !dialog) {
        return;
      }

      const focusableElements = getDialogFocusableElements(dialog);
      if (focusableElements.length === 0) {
        event.preventDefault();
        dialog.focus();
        return;
      }

      const activeIndex = focusableElements.indexOf(
        document.activeElement as HTMLElement
      );
      if (activeIndex === -1) {
        event.preventDefault();
        focusableElements[0].focus();
        return;
      }

      const direction = event.shiftKey ? 'previous' : 'next';
      const nextIndex = getTrappedFocusTargetIndex(
        focusableElements.length,
        activeIndex,
        direction
      );
      const shouldWrap =
        (direction === 'previous' && activeIndex === 0) ||
        (direction === 'next' && activeIndex === focusableElements.length - 1);

      if (shouldWrap && nextIndex >= 0) {
        event.preventDefault();
        focusableElements[nextIndex].focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      const restoreTarget = restoreFocusRef.current;
      if (restoreTarget && document.contains(restoreTarget)) {
        restoreTarget.focus();
      }
    };
  }, [isOpen]);

  return dialogRef;
}
