import { Alert } from 'react-native';
import {
  mobileDestructiveActionCopy,
  type MobileDestructiveActionId,
} from '../state/mobileDestructiveActions';

export function confirmMobileDestructiveAction(
  actionId: MobileDestructiveActionId,
  onConfirm: () => void
) {
  const copy = mobileDestructiveActionCopy[actionId];
  Alert.alert(copy.title, copy.message, [
    { text: 'Cancel', style: 'cancel' },
    {
      text: copy.confirmLabel,
      style: 'destructive',
      onPress: onConfirm,
    },
  ]);
}
