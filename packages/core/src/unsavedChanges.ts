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

export type UnsavedChangesConfirmationActionId = 'keep-editing' | 'discard';

export type UnsavedChangesConfirmationActionIntent = 'cancel' | 'destructive';

export type UnsavedChangesConfirmationAction = {
  id: UnsavedChangesConfirmationActionId;
  intent: UnsavedChangesConfirmationActionIntent;
  label: string;
};

export type DiscardUnsavedChangesConfirmation =
  | {
      kind: 'clean';
    }
  | {
      actions: readonly [
        UnsavedChangesConfirmationAction,
        UnsavedChangesConfirmationAction
      ];
      browserMessage: string;
      kind: 'confirm';
      message: string;
      title: string;
    };

export const unsavedChangesConfirmationCopy = {
  title: 'Discard unapplied draft changes?',
  message:
    'This draft has local edits that have not been applied to the current document.',
  keepEditingLabel: 'Keep Editing',
  discardLabel: 'Discard',
} as const;

export function getDiscardUnsavedChangesConfirmation({
  isDirty,
  message = unsavedChangesConfirmationCopy.message,
  title = unsavedChangesConfirmationCopy.title,
}: {
  isDirty: boolean;
  message?: string;
  title?: string;
}): DiscardUnsavedChangesConfirmation {
  if (!isDirty) {
    return { kind: 'clean' };
  }

  return {
    actions: [
      {
        id: 'keep-editing',
        intent: 'cancel',
        label: unsavedChangesConfirmationCopy.keepEditingLabel,
      },
      {
        id: 'discard',
        intent: 'destructive',
        label: unsavedChangesConfirmationCopy.discardLabel,
      },
    ],
    browserMessage: `${title}\n\n${message}`,
    kind: 'confirm',
    message,
    title,
  };
}
