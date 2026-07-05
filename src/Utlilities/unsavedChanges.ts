import { useEffect } from 'react';
import {
  getDiscardUnsavedChangesConfirmation,
  hasUnsavedChanges,
} from '@valgaron/core';

export { hasUnsavedChanges };

export function confirmDiscardUnsavedChanges(isDirty: boolean): boolean {
  const confirmation = getDiscardUnsavedChangesConfirmation({ isDirty });
  if (confirmation.kind === 'clean') {
    return true;
  }
  if (typeof window === 'undefined' || typeof window.confirm !== 'function') {
    return false;
  }
  return window.confirm(confirmation.browserMessage);
}

export function useUnsavedChangesWarning(isDirty: boolean): void {
  useBeforeUnloadWarning(isDirty);
  useEffect(() => {
    if (!isDirty || typeof window === 'undefined') {
      return undefined;
    }
    const handleDocumentClick = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }
      const target = event.target;
      if (!(target instanceof Element)) {
        return;
      }
      const link = target.closest('a[href]');
      if (!(link instanceof HTMLAnchorElement) || link.target) {
        return;
      }
      const nextUrl = new URL(link.href, window.location.href);
      if (nextUrl.origin !== window.location.origin) {
        return;
      }
      if (!confirmDiscardUnsavedChanges(true)) {
        event.preventDefault();
        event.stopPropagation();
      }
    };
    document.addEventListener('click', handleDocumentClick, true);
    return () => {
      document.removeEventListener('click', handleDocumentClick, true);
    };
  }, [isDirty]);
}

export function useBeforeUnloadWarning(isDirty: boolean): void {
  useEffect(() => {
    if (!isDirty || typeof window === 'undefined') {
      return undefined;
    }
    const confirmation = getDiscardUnsavedChangesConfirmation({
      isDirty: true,
    });
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      if (confirmation.kind === 'confirm') {
        event.returnValue = confirmation.browserMessage;
        return confirmation.browserMessage;
      }
      return undefined;
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isDirty]);
}
