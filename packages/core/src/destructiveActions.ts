export type DestructiveActionId =
  | 'delete-entry'
  | 'delete-relationship'
  | 'delete-workspace'
  | 'delete-planetary-world'
  | 'delete-entry-type'
  | 'reset-document'
  | 'import-document'
  | 'restore-snapshot'
  | 'delete-snapshot';

export type DestructiveActionCopy = {
  title: string;
  message: string;
  confirmLabel: string;
};

export const destructiveActionCopy: Record<
  DestructiveActionId,
  DestructiveActionCopy
> = {
  'delete-entry': {
    title: 'Delete Entry',
    message:
      'Delete this entry from the current workspace and save a recovery snapshot first?',
    confirmLabel: 'Delete Entry',
  },
  'delete-relationship': {
    title: 'Delete Relationship',
    message:
      'Delete this relationship from the current workspace and save a recovery snapshot first?',
    confirmLabel: 'Delete Relationship',
  },
  'delete-workspace': {
    title: 'Delete Workspace',
    message:
      'Delete this workspace from the local document and save a recovery snapshot first?',
    confirmLabel: 'Delete Workspace',
  },
  'delete-planetary-world': {
    title: 'Delete World Or Planet',
    message:
      'Delete this in-fiction world or planet and save a recovery snapshot first?',
    confirmLabel: 'Delete',
  },
  'delete-entry-type': {
    title: 'Delete Entry Type',
    message:
      'Delete this custom entry type and its entries, then save a recovery snapshot first?',
    confirmLabel: 'Delete Type',
  },
  'reset-document': {
    title: 'Reset Codex',
    message:
      'Replace the current local document with starter data and save a recovery snapshot first?',
    confirmLabel: 'Reset',
  },
  'import-document': {
    title: 'Import Backup',
    message:
      'Replace the current local document with this backup and save a recovery snapshot first?',
    confirmLabel: 'Import',
  },
  'restore-snapshot': {
    title: 'Restore Recovery Snapshot',
    message:
      'Replace the current local document with the latest recovery snapshot and save the current document as a new recovery snapshot first?',
    confirmLabel: 'Restore',
  },
  'delete-snapshot': {
    title: 'Delete Recovery Snapshot',
    message:
      'Delete this recovery snapshot from local storage? Keep a JSON export if you need a portable backup.',
    confirmLabel: 'Delete Snapshot',
  },
};

export function getDestructiveActionCopy(
  actionId: DestructiveActionId
): DestructiveActionCopy {
  return destructiveActionCopy[actionId];
}

export function formatDestructiveActionTitle(
  actionId: DestructiveActionId,
  subjectName?: string
): string {
  if (!subjectName) {
    return getDestructiveActionCopy(actionId).title;
  }
  switch (actionId) {
    case 'delete-entry':
    case 'delete-relationship':
    case 'delete-workspace':
    case 'delete-planetary-world':
    case 'delete-entry-type':
    case 'delete-snapshot':
      return `Delete ${subjectName}?`;
    case 'reset-document':
      return 'Reset this local workspace?';
    case 'import-document':
      return 'Import this backup?';
    case 'restore-snapshot':
      return 'Restore this recovery snapshot?';
  }
}
