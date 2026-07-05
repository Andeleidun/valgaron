import { Alert } from 'react-native';
import {
  destructiveActionCopy,
  type DestructiveActionId,
} from '@valgaron/core';

export function confirmMobileDestructiveAction(
  actionId: DestructiveActionId,
  onConfirm: () => void
) {
  const copy = destructiveActionCopy[actionId];
  Alert.alert(copy.title, copy.message, [
    { text: 'Cancel', style: 'cancel' },
    {
      text: copy.confirmLabel,
      style: 'destructive',
      onPress: onConfirm,
    },
  ]);
}
