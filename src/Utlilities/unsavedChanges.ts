import { useEffect } from 'react';

const UNSAVED_CHANGES_MESSAGE =
  'You have unsaved changes. Leave without saving them?';

function normalizeValue(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(normalizeValue).join(',')}]`;
  }
  if (value && typeof value === 'object') {
    return `{${Object.entries(value)
      .sort(([firstKey], [secondKey]) => firstKey.localeCompare(secondKey))
      .map(
        ([key, nestedValue]) =>
          `${JSON.stringify(key)}:${normalizeValue(nestedValue)}`
      )
      .join(',')}}`;
  }
  return JSON.stringify(value);
}

export function hasUnsavedChanges<TValue>(
  initialValue: TValue,
  currentValue: TValue
): boolean {
  return normalizeValue(initialValue) !== normalizeValue(currentValue);
}

export function confirmDiscardUnsavedChanges(isDirty: boolean): boolean {
  if (!isDirty) {
    return true;
  }
  if (typeof window === 'undefined' || typeof window.confirm !== 'function') {
    return false;
  }
  return window.confirm(UNSAVED_CHANGES_MESSAGE);
}

export function useUnsavedChangesWarning(isDirty: boolean): void {
  useEffect(() => {
    if (!isDirty || typeof window === 'undefined') {
      return undefined;
    }
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = UNSAVED_CHANGES_MESSAGE;
      return UNSAVED_CHANGES_MESSAGE;
    };
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
    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('click', handleDocumentClick, true);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('click', handleDocumentClick, true);
    };
  }, [isDirty]);
}
