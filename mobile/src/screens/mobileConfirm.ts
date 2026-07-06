import { Alert } from 'react-native';
import {
  destructiveActionCopy,
  destructiveActionDialogCopy,
  formatDestructiveActionTitle,
  type DestructiveActionId,
} from '@valgaron/core';

export function confirmMobileDestructiveAction(
  actionId: DestructiveActionId,
  onConfirm: () => void,
  subjectName?: string
) {
  const copy = destructiveActionCopy[actionId];
  Alert.alert(
    formatDestructiveActionTitle(actionId, subjectName),
    copy.message,
    [
      { text: destructiveActionDialogCopy.cancelLabel, style: 'cancel' },
      {
        text: copy.confirmLabel,
        style: 'destructive',
        onPress: onConfirm,
      },
    ]
  );
}
